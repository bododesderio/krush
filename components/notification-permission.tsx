"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { requestNotificationPermission } from "@/lib/notification-service"
import { useToast } from "@/components/ui/use-toast"

interface NotificationPermissionProps {
  userId: string
}

export function NotificationPermission({ userId }: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    if (!userId) return

    setIsRequesting(true)

    try {
      const token = await requestNotificationPermission(userId)

      if (token) {
        setPermission("granted")
        toast({
          title: "Notifications enabled",
          description: "You'll now receive notifications for new messages.",
        })
      } else {
        setPermission("denied")
        toast({
          title: "Notifications disabled",
          description: "You won't receive notifications for new messages.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRequesting(false)
    }
  }

  // Don't render anything if notifications are not supported
  if (typeof Notification === "undefined") {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {permission === "granted" ? (
        <Button variant="ghost" size="sm" className="text-green-500" disabled>
          <Bell className="h-4 w-4 mr-2" />
          Notifications enabled
        </Button>
      ) : permission === "denied" ? (
        <Button variant="ghost" size="sm" className="text-red-500" disabled>
          <BellOff className="h-4 w-4 mr-2" />
          Notifications blocked
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={handleRequestPermission} disabled={isRequesting}>
          <Bell className="h-4 w-4 mr-2" />
          {isRequesting ? "Enabling..." : "Enable notifications"}
        </Button>
      )}
    </div>
  )
}
