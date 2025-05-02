"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KrushLogo } from "@/components/krush-logo"
import { useRouter } from "next/navigation"
import { Users, UserPlus, Phone, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleContactPermission = async () => {
    setIsLoading(true)

    try {
      // Request contact permission
      if ("contacts" in navigator && "ContactsManager" in window) {
        // This is the actual Contacts API, but it's not widely supported yet
        // @ts-ignore - TypeScript doesn't recognize the Contacts API yet
        const props = ["name", "email", "tel"]
        // @ts-ignore
        const contacts = await navigator.contacts.select(props, { multiple: true })

        if (contacts.length > 0) {
          toast({
            title: "Contacts Access Granted",
            description: `${contacts.length} contacts have been synced with Krush.`,
          })
        }
      } else {
        // Fallback for browsers that don't support the Contacts API
        toast({
          title: "Contact Access Unavailable",
          description: "Your browser doesn't support contact access. You can add contacts manually.",
        })
      }

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error requesting contact permission:", error)
      toast({
        title: "Permission Error",
        description: "Could not access contacts. Please try again or add contacts manually.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push("/login")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="mb-8">
          <KrushLogo size="lg" />
        </div>

        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="h-24 w-24 rounded-full bg-krush/10 flex items-center justify-center">
              <Users className="h-12 w-12 text-krush" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Connect with Friends</h1>
          <p className="text-center text-muted-foreground mb-8">
            Krush needs access to your contacts to help you connect with friends who are already using the app.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-krush/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-krush" />
              </div>
              <div>
                <h3 className="font-medium">Find Friends</h3>
                <p className="text-sm text-muted-foreground">See which of your contacts are on Krush</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-krush/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-krush" />
              </div>
              <div>
                <h3 className="font-medium">Invite Friends</h3>
                <p className="text-sm text-muted-foreground">Easily invite your contacts to join Krush</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-krush/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-krush" />
              </div>
              <div>
                <h3 className="font-medium">Privacy Protected</h3>
                <p className="text-sm text-muted-foreground">Your contact information is securely stored</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-3">
        <Button onClick={handleContactPermission} className="bg-krush hover:bg-krush-dark w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : "Allow Contact Access"}
        </Button>
        <Button variant="outline" onClick={handleSkip} className="w-full">
          Not Now
        </Button>
      </div>
    </div>
  )
}
