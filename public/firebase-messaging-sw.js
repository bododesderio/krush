// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

// Hardcoded Firebase configuration
// This is safe to include in the service worker as these values are public
const firebaseConfig = {
  apiKey: "AIzaSyBXZMhL3aul1_5mKVM5055AvW1hlfOfEt4",
  authDomain: "krush-aa94a.firebaseapp.com",
  projectId: "krush-aa94a",
  storageBucket: "krush-aa94a.firebasestorage.app",
  messagingSenderId: "763372281253",
  appId: "1:763372281253:web:77bf827b1bac9b92ae9c4c",
  measurementId: "G-DS1K87PBFE",
  databaseURL: "https://krush-aa94a-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
// Initialize Firebase messaging
let messaging;
try {
  messaging = firebase.messaging();
  console.log('Firebase messaging initialized in service worker');
} catch (error) {
  console.error('Error initializing Firebase messaging in service worker:', error);
}

// Handle background messages
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo.png",
    badge: "/badge.png",
    data: payload.data,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
  })
}

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click: ", event)

  event.notification.close()

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow("/")
      }),
  )
})
