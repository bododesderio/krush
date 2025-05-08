import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { app } from "./firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "./firebase"

// Initialize Firebase Cloud Messaging
let messaging: any
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null

// Function to initialize messaging with service worker
async function initializeMessaging() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");

    if (existingRegistration) {
      console.log("Service Worker already registered with scope:", existingRegistration.scope);
      serviceWorkerRegistration = existingRegistration;
    } else {
      // Register the service worker
      serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/"
      });
      console.log("Service Worker registered with scope:", serviceWorkerRegistration.scope);
    }

    // Initialize messaging
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error("Failed to initialize Firebase messaging:", error);
    return null;
  }
}

// Initialize on client side
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  initializeMessaging();
}

// Request permission and get token
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    // Initialize messaging if not already done
    if (!messaging) {
      messaging = await initializeMessaging();
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      return getNotificationToken(userId);
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // Make sure service worker is registered and ready
      if (serviceWorkerRegistration) {
        await navigator.serviceWorker.ready;
      } else {
        // Try to register service worker again
        await initializeMessaging();
      }

      return getNotificationToken(userId);
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return null;
  }
}

// Get notification token
async function getNotificationToken(userId: string): Promise<string | null> {
  // Make sure messaging is initialized
  if (!messaging) {
    messaging = await initializeMessaging();
    if (!messaging) return null;
  }

  try {
    // Make sure we have a service worker registration
    if (!serviceWorkerRegistration) {
      const existingRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
      if (existingRegistration) {
        serviceWorkerRegistration = existingRegistration;
      } else {
        return null; // Can't proceed without service worker
      }
    }

    // Get token
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BAh_iI9Q9CIzriSVglAg-7UVyYPv2zd8_VDIuXDVWPlEecz03PIqpBmKOgQvBE3p8JJKzFR7F0nPyVF94gKg82I";
    const currentToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration
    });

    if (currentToken) {
      // Save token to user document
      await saveTokenToDatabase(userId, currentToken);
      return currentToken;
    } else {
      console.log("No registration token available");
      return null;
    }
  } catch (error) {
    console.error("Error getting notification token:", error);
    return null;
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
