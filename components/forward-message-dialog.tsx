"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { forwardMessage } from "@/lib/messages"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"
import { useRouter } from "next/navigation"

interface ForwardMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  messageId: string
  currentUserId: string
  users: User[]
  groups: Group[]
}

export function ForwardMessageDialog({
  isOpen,
  onClose,
  messageId,
  currentUserId,
  users,
  groups,
}: ForwardMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("users")
  const router = useRouter()

  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

  async function handleForward(targetId: string, isGroup: boolean) {
    setIsSubmitting(true)

    try {
      await forwardMessage(messageId, currentUserId, targetId, isGroup)
      onClose()

      // Navigate to the chat with the forwarded message
      if (isGroup) {
        router.push(`/?group=${targetId}`)
      } else {
        router.push(`/?user=${targetId}`)
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to forward message:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <ScrollArea className="h-60">
              <div className="space-y-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      className="flex items-center gap-3 w-full p-2 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-900"
                      onClick={() => handleForward(user.id, false)}
                      disabled={isSubmitting}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${
                            user.online ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No users found</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="groups" className="mt-4">
            <ScrollArea className="h-60">
              <div className="space-y-1">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      className="flex items-center gap-3 w-full p-2 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-900"
                      onClick={() => handleForward(group.id, true)}
                      disabled={isSubmitting}
                    >
                      <Avatar>
                        <AvatarImage src={group.avatar || "/placeholder.svg"} alt={group.name} />
                        <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {group.members.length} members
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No groups found</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
