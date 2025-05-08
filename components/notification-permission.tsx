"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getMessaging, getToken } from "firebase/messaging"
import { app } from "@/lib/firebase"

interface NotificationPermissionProps {
  userId: string
}

export function NotificationPermission({ userId }: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsMounted(true)
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission)
    }
  }, [])

  const handleRequestPermission = async () => {
    if (!userId) return

    setIsRequesting(true)

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult === "granted") {
        // Make sure service worker is registered
        if ("serviceWorker" in navigator) {
          try {
            // Check if service worker is already registered
            let registration;
            const existingRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");

            if (existingRegistration) {
              console.log("Service Worker already registered with scope:", existingRegistration.scope);
              registration = existingRegistration;
            } else {
              // Register the service worker
              registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
                scope: "/"
              });
              console.log("Service Worker registered with scope:", registration.scope);
            }

            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;

            // Get messaging instance
            const messaging = getMessaging(app);

            // Get token
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BAh_iI9Q9CIzriSVglAg-7UVyYPv2zd8_VDIuXDVWPlEecz03PIqpBmKOgQvBE3p8JJKzFR7F0nPyVF94gKg82I";
            const token = await getToken(messaging, {
              vapidKey,
              serviceWorkerRegistration: registration
            });

            if (token) {
              console.log("FCM Token:", token);

              // Save token to user document
              const response = await fetch("/api/save-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId,
                  token,
                }),
              });

              if (response.ok) {
                toast({
                  title: "Notifications enabled",
                  description: "You'll now receive notifications for new messages.",
                });
              } else {
                throw new Error("Failed to save notification token");
              }
            } else {
              throw new Error("Failed to get notification token");
            }
          } catch (error) {
            console.error("Error setting up notifications:", error);
            throw error;
          }
        } else {
          throw new Error("Service workers not supported");
        }
      } else {
        toast({
          title: "Notifications disabled",
          description: "You won't receive notifications for new messages.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't render anything during SSR or if notifications are not supported
  if (!isMounted) {
    return null; // Return null during SSR
  }

  // Don't render anything if notifications are not supported
  if (typeof Notification === "undefined") {
    return null;
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
