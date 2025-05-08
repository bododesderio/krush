"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase";

// This function registers the service worker and initializes Firebase Cloud Messaging
export function useFirebaseMessaging(userId: string) {
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // First, register the service worker
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        console.log("Service workers are not supported in this browser");
        return;
      }

      try {
        // Check if service worker is already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");

        if (existingRegistration) {
          console.log("Service Worker already registered with scope:", existingRegistration.scope);
          setServiceWorkerRegistration(existingRegistration);
          return;
        }

        // Register the service worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/"
        });
        console.log("Service Worker registered with scope:", registration.scope);
        setServiceWorkerRegistration(registration);
      } catch (error) {
        console.error("Error registering service worker:", error);
      }
    };

    registerServiceWorker();
  }, []);

  // Then, initialize messaging once service worker is registered
  useEffect(() => {
    const initializeMessaging = async () => {
      if (!serviceWorkerRegistration) {
        return; // Wait until service worker is registered
      }

      try {
        // Initialize Firebase Cloud Messaging
        const messaging = getMessaging(app);

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied");
          return;
        }

        console.log("Notification permission granted");

        // Get FCM token using environment variable for VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BAh_iI9Q9CIzriSVglAg-7UVyYPv2zd8_VDIuXDVWPlEecz03PIqpBmKOgQvBE3p8JJKzFR7F0nPyVF94gKg82I";
        const currentToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration
        });

        if (!currentToken) {
          console.log("No registration token available");
          return;
        }

        console.log("FCM Token:", currentToken);

        // Save token to user document
        await fetch("/api/save-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            token: currentToken,
          }),
        });

      } catch (error) {
        console.error("Error initializing Firebase messaging:", error);
      }
    };

    if (userId && serviceWorkerRegistration) {
      initializeMessaging();
    }
  }, [userId, serviceWorkerRegistration]);
}
