import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { firebaseApp } from "./firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"

// Initialize Firebase Cloud Messaging
let messaging: any

// Only initialize on client side and if browser supports service workers
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(firebaseApp)
  } catch (error) {
    console.error("Failed to initialize Firebase messaging:", error)
  }
}

// Request permission and get token
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (!messaging) return null

  try {
    // Check if permission is already granted
    if (Notification.permission === "granted") {
      return getNotificationToken(userId)
    }

    // Request permission
    const permission = await Notification.requestPermission()

    if (permission === "granted") {
      return getNotificationToken(userId)
    } else {
      console.log("Notification permission denied")
      return null
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return null
  }
}

// Get notification token
async function getNotificationToken(userId: string): Promise<string | null> {
  if (!messaging) return null

  try {
    // Get token
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })

    if (currentToken) {
      // Save token to user document
      await saveTokenToDatabase(userId, currentToken)
      return currentToken
    } else {
      console.log("No registration token available")
      return null
    }
  } catch (error) {
    console.error("Error getting notification token:", error)
    return null
  }
}

// Save token to database
async function saveTokenToDatabase(userId: string, token: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      // Check if token already exists
      const tokens = userDoc.data().fcmTokens || []

      if (!tokens.includes(token)) {
        // Add new token
        await updateDoc(userRef, {
          fcmTokens: [...tokens, token],
        })
      }
    }
  } catch (error) {
    console.error("Error saving token to database:", error)
  }
}

// Handle foreground messages
export function setupMessageListener(callback: (payload: any) => void) {
  if (!messaging) return () => {}

  return onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload)
    callback(payload)
  })
}

// Send notification to user
export async function sendNotification(userId: string, title: string, body: string, data: any = {}) {
  try {
    // This would typically be done on the server side
    // Here we're just showing the client-side implementation
    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        notification: {
          title,
          body,
        },
        data,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send notification")
    }

    return true
  } catch (error) {
    console.error("Error sending notification:", error)
    return false
  }
}
