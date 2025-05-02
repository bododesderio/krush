"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KrushLogo } from "./krush-logo"
import { Search, UserPlus, ArrowLeft, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAllUsers } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { getContacts, inviteContact } from "@/lib/contacts"
import type { Contact } from "@/lib/contacts"

interface ContactsListProps {
  currentUser: User
}

export function ContactsList({ currentUser }: ContactsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [krushContacts, setKrushContacts] = useState<User[]>([])
  const [otherContacts, setOtherContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchContacts() {
      setIsLoading(true)
      try {
        // Get all Krush users
        const allUsers = await getAllUsers()

        // Get user's contacts
        const contacts = await getContacts()

        // Filter out the current user
        const otherUsers = allUsers.filter((user) => user.id !== currentUser.id)

        // Find which contacts are on Krush
        const contactsOnKrush = otherUsers.filter((user) =>
          contacts.some((contact) => contact.phoneNumber === user.phoneNumber || contact.email === user.email),
        )

        // Find contacts not on Krush
        const contactsNotOnKrush = contacts.filter(
          (contact) =>
            !allUsers.some((user) => user.phoneNumber === contact.phoneNumber || user.email === contact.email),
        )

        setKrushContacts(contactsOnKrush)
        setOtherContacts(contactsNotOnKrush)
      } catch (error) {
        console.error("Error fetching contacts:", error)
        toast({
          title: "Error",
          description: "Failed to load contacts. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [currentUser.id, toast])

  const filteredKrushContacts = krushContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredOtherContacts = otherContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      contact.phoneNumber.includes(searchQuery),
  )

  const handleStartChat = (userId: string) => {
    router.push(`/?user=${userId}`)
  }

  const handleInvite = async (contact: Contact) => {
    try {
      await inviteContact(contact)
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${contact.name}`,
      })
    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <KrushLogo />
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="krush" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="krush">Krush Contacts</TabsTrigger>
          <TabsTrigger value="other">Other Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="krush" className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading contacts...</p>
            </div>
          ) : filteredKrushContacts.length > 0 ? (
            <div className="space-y-1">
              {filteredKrushContacts.map((contact) => (
                <button
                  key={contact.id}
                  className="flex items-center gap-3 w-full p-2 rounded-lg text-left hover:bg-muted"
                  onClick={() => handleStartChat(contact.id)}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                      <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950",
                        contact.online ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {contact.online
                        ? "Online"
                        : contact.lastSeen
                          ? `Last seen ${formatLastSeen(contact.lastSeen)}`
                          : "Offline"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No Krush contacts found</h3>
              <p className="text-center text-muted-foreground mb-4">
                None of your contacts are using Krush yet. Invite them to join!
              </p>
              <Button onClick={() => document.getElementById("other-tab")?.click()}>Invite Contacts</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="other" id="other-tab" className="flex-1 overflow-auto p-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading contacts...</p>
            </div>
          ) : filteredOtherContacts.length > 0 ? (
            <div className="space-y-1">
              {filteredOtherContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between gap-3 w-full p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.phoneNumber}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="flex gap-1" onClick={() => handleInvite(contact)}>
                    <Share2 className="h-4 w-4" />
                    Invite
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No other contacts found</h3>
              <p className="text-center text-muted-foreground">
                We couldn't find any contacts that aren't already on Krush.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function formatLastSeen(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  // Less than a minute
  if (diff < 60 * 1000) {
    return "just now"
  }

  // Less than an hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
  }

  // Less than a day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
  }

  // More than a day
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days} ${days === 1 ? "day" : "days"} ago`
}
