import { db, database, auth } from "./firebase"
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { ref, onValue, set, onDisconnect } from "firebase/database"
// Define our own Message type to avoid conflicts
export interface RealtimeMessage {
  id: string
  text: string
  content?: string
  senderId: string
  receiverId?: string
  groupId?: string
  chatId?: string
  timestamp: any
  read: boolean
  readBy: string[]
  reactions: Record<string, string>
  attachments?: any[]
  forwarded?: any
}

import type { Chat } from "./chat-service"

// Real-time chat messages listener
export function listenToMessages(chatId: string, callback: (messages: RealtimeMessage[]) => void) {
  // Query messages collection directly
  const messagesRef = collection(db, "messages")

  // Determine if this is a group chat or direct chat
  const isGroupChat = !chatId.includes("_")

  // Create appropriate query based on chat type
  let q;
  if (isGroupChat) {
    // For group messages, use groupId field
    console.log("Creating group chat query for groupId:", chatId)
    q = query(
      messagesRef,
      where("groupId", "==", chatId),
      orderBy("timestamp", "desc"),
      limit(50)
    )
  } else {
    // For direct messages, use chatId field
    console.log("Creating direct chat query for chatId:", chatId)
    q = query(
      messagesRef,
      where("chatId", "==", chatId),
      orderBy("timestamp", "desc"),
      limit(50)
    )
  }

  return onSnapshot(q, (snapshot) => {
    const messages: RealtimeMessage[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        id: doc.id,
        text: data.content || "", // Map content to text for compatibility
        content: data.content || "",
        senderId: data.senderId,
        timestamp: data.timestamp ?
          (typeof data.timestamp === 'number' ?
            data.timestamp :
            data.timestamp.toMillis ?
              data.timestamp.toMillis() :
              Date.now()) :
          Date.now(),
        read: data.read || false,
        readBy: data.readBy || [],
        reactions: data.reactions || {},
        attachments: data.attachments || [],
        forwarded: data.forwarded,
      })
    })

    // Sort messages by timestamp (newest first)
    messages.sort((a, b) => {
      const timestampA = typeof a.timestamp === 'number' ? a.timestamp : 0
      const timestampB = typeof b.timestamp === 'number' ? b.timestamp : 0
      return timestampB - timestampA
    })

    console.log("Realtime messages update:", messages)
    callback(messages)
  })
}

// Real-time chats listener
export function listenToChats(userId: string, callback: (chats: Chat[]) => void) {
  const chatsRef = collection(db, "chats")
  const q = query(chatsRef, where("members", "array-contains", userId), orderBy("lastMessageAt", "desc"))

  return onSnapshot(q, (snapshot) => {
    const chats: Chat[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      chats.push({
        id: doc.id,
        type: data.type,
        name: data.name,
        avatar: data.avatar,
        members: data.members,
        createdAt: data.createdAt,
        lastMessage: data.lastMessage
          ? {
              text: data.lastMessage.text,
              senderId: data.lastMessage.senderId,
              timestamp: data.lastMessage.timestamp,
              read: data.lastMessage.read,
            }
          : undefined,
      })
    })
    callback(chats)
  })
}

// User online status management
export function setupUserPresence(userId: string) {
  if (!userId || !auth.currentUser) return () => {}

  // Create references
  const userStatusRef = ref(database, `status/${userId}`)
  const userStatusFirestoreRef = doc(db, "users", userId)

  // Create a reference to the special '.info/connected' path in Realtime Database
  const connectedRef = ref(database, ".info/connected")

  // When the client's connection state changes
  const unsubscribe = onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) {
      // Client is offline
      return
    }

    // Client is online
    const onDisconnectRef = onDisconnect(userStatusRef)

    // Set up what happens when the client disconnects
    onDisconnectRef
      .set({
        state: "offline",
        lastChanged: serverTimestamp(),
      })
      .then(() => {
        // Update status to online
        set(userStatusRef, {
          state: "online",
          lastChanged: serverTimestamp(),
        })

        // Update Firestore user document
        updateDoc(userStatusFirestoreRef, {
          online: true,
          lastSeen: serverTimestamp(),
        })
      })
  })

  // Cleanup function
  return () => {
    unsubscribe()
    set(userStatusRef, {
      state: "offline",
      lastChanged: serverTimestamp(),
    })
    updateDoc(userStatusFirestoreRef, {
      online: false,
      lastSeen: serverTimestamp(),
    })
  }
}

// Listen to user online status
export function listenToUserStatus(userId: string, callback: (isOnline: boolean) => void) {
  const userStatusRef = ref(database, `status/${userId}`)

  return onValue(userStatusRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      callback(data.state === "online")
    } else {
      callback(false)
    }
  })
}
