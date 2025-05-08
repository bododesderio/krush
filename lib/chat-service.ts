import { db, database, storage } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  getDocs,
  writeBatch
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { ref as databaseRef, set, onValue, remove } from "firebase/database"

export type Chat = {
  id: string
  type: "direct" | "group"
  name?: string
  avatar?: string
  members: string[]
  createdAt: any
  lastMessage?: {
    text: string
    senderId: string
    timestamp: any
    read: boolean
  }
}

export type Message = {
  id: string
  text: string
  senderId: string
  timestamp: any
  read: boolean
  readBy: string[]
  reactions: Record<string, string>
  attachments?: Attachment[]
  forwarded?: {
    originalMessageId: string
    originalSenderId: string
  }
}

export type Attachment = {
  type: "image" | "document" | "video" | "audio" | "other"
  url: string
  name: string
  size: number
  fileType: string
}

// Get all chats for a user
export function getUserChats(userId: string, callback: (chats: Chat[]) => void) {
  const q = query(collection(db, "chats"), where("members", "array-contains", userId), orderBy("lastMessageAt", "desc"))

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

// Get messages for a chat
export function getChatMessages(chatId: string, callback: (messages: Message[]) => void) {
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "desc"))

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        id: doc.id,
        text: data.text,
        senderId: data.senderId,
        timestamp: data.timestamp,
        read: data.read,
        readBy: data.readBy || [],
        reactions: data.reactions || {},
        attachments: data.attachments,
        forwarded: data.forwarded,
      })
    })
    callback(messages)
  })
}

// Send a message
export async function sendMessage(chatId: string, text: string, senderId: string, attachments?: File[]) {
  try {
    const chatRef = doc(db, "chats", chatId)
    const chatDoc = await getDoc(chatRef)

    if (!chatDoc.exists()) {
      throw new Error("Chat not found")
    }

    const messageData: any = {
      text,
      senderId,
      timestamp: serverTimestamp(),
      read: false,
      readBy: [senderId],
      reactions: {},
    }

    // Upload attachments if any
    if (attachments && attachments.length > 0) {
      const uploadedAttachments = await Promise.all(
        attachments.map(async (file) => {
          const fileRef = ref(storage, `chats/${chatId}/attachments/${Date.now()}-${file.name}`)
          await uploadBytes(fileRef, file)
          const downloadURL = await getDownloadURL(fileRef)

          return {
            type: getFileType(file.type),
            url: downloadURL,
            name: file.name,
            size: file.size,
            fileType: file.type,
          }
        }),
      )

      messageData.attachments = uploadedAttachments
    }

    // Add message to chat
    const messageRef = await addDoc(collection(db, "chats", chatId, "messages"), messageData)

    // Update chat with last message
    await updateDoc(chatRef, {
      lastMessage: {
        text: text || (messageData.attachments ? "Attachment" : ""),
        senderId,
        timestamp: serverTimestamp(),
        read: false,
      },
      lastMessageAt: serverTimestamp(),
    })

    // Update typing status
    await updateTypingStatus(chatId, senderId, false)

    return messageRef.id
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

// Create a direct chat
export async function createDirectChat(userId1: string, userId2: string) {
  try {
    // Check if chat already exists
    const q = query(collection(db, "chats"), where("type", "==", "direct"), where("members", "array-contains", userId1))

    const querySnapshot = await getDocs(q)
    let existingChat: string | null = null

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.members.includes(userId2)) {
        existingChat = doc.id
      }
    })

    if (existingChat) {
      return existingChat
    }

    // Get user data
    const user1Doc = await getDoc(doc(db, "users", userId1))
    const user2Doc = await getDoc(doc(db, "users", userId2))

    if (!user1Doc.exists() || !user2Doc.exists()) {
      throw new Error("One or both users not found")
    }

    const user1Data = user1Doc.data()
    const user2Data = user2Doc.data()

    // Create new chat
    const chatRef = await addDoc(collection(db, "chats"), {
      type: "direct",
      members: [userId1, userId2],
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      membersData: {
        [userId1]: {
          displayName: user1Data.displayName,
          photoURL: user1Data.photoURL,
        },
        [userId2]: {
          displayName: user2Data.displayName,
          photoURL: user2Data.photoURL,
        },
      },
    })

    return chatRef.id
  } catch (error) {
    console.error("Error creating direct chat:", error)
    throw error
  }
}

// Create a group chat
export async function createGroupChat(name: string, creatorId: string, memberIds: string[]) {
  try {
    // Ensure creator is in members
    if (!memberIds.includes(creatorId)) {
      memberIds.push(creatorId)
    }

    // Get members data
    const membersData: Record<string, any> = {}
    for (const memberId of memberIds) {
      const memberDoc = await getDoc(doc(db, "users", memberId))
      if (memberDoc.exists()) {
        const data = memberDoc.data()
        membersData[memberId] = {
          displayName: data.displayName,
          photoURL: data.photoURL,
        }
      }
    }

    // Create group avatar (placeholder)
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`

    // Create new chat
    const chatRef = await addDoc(collection(db, "chats"), {
      type: "group",
      name,
      avatar,
      members: memberIds,
      createdBy: creatorId,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      membersData,
    })

    return chatRef.id
  } catch (error) {
    console.error("Error creating group chat:", error)
    throw error
  }
}

// Add member to group
export async function addMemberToGroup(chatId: string, userId: string) {
  try {
    const chatRef = doc(db, "chats", chatId)
    const chatDoc = await getDoc(chatRef)

    if (!chatDoc.exists() || chatDoc.data().type !== "group") {
      throw new Error("Group not found")
    }

    // Get user data
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()

    // Update members array
    await updateDoc(chatRef, {
      members: arrayUnion(userId),
      [`membersData.${userId}`]: {
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      },
    })
  } catch (error) {
    console.error("Error adding member to group:", error)
    throw error
  }
}

// Remove member from group
export async function removeMemberFromGroup(chatId: string, userId: string) {
  try {
    const chatRef = doc(db, "chats", chatId)
    const chatDoc = await getDoc(chatRef)

    if (!chatDoc.exists() || chatDoc.data().type !== "group") {
      throw new Error("Group not found")
    }

    // Update members array
    await updateDoc(chatRef, {
      members: arrayRemove(userId),
      [`membersData.${userId}`]: null,
    })
  } catch (error) {
    console.error("Error removing member from group:", error)
    throw error
  }
}

// Delete chat
export async function deleteChat(chatId: string) {
  try {
    // Delete all messages
    const messagesSnapshot = await getDocs(collection(db, "chats", chatId, "messages"))
    const batch = writeBatch(db)

    messagesSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    // Delete chat document
    await deleteDoc(doc(db, "chats", chatId))
  } catch (error) {
    console.error("Error deleting chat:", error)
    throw error
  }
}

// Mark message as read
export async function markMessageAsRead(chatId: string, messageId: string, userId: string) {
  try {
    const messageRef = doc(db, "chats", chatId, "messages", messageId)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists()) {
      throw new Error("Message not found")
    }

    const data = messageDoc.data()
    const readBy = data.readBy || []

    if (!readBy.includes(userId)) {
      await updateDoc(messageRef, {
        read: true,
        readBy: arrayUnion(userId),
      })
    }
  } catch (error) {
    console.error("Error marking message as read:", error)
    throw error
  }
}

// Add reaction to message
export async function addReactionToMessage(chatId: string, messageId: string, userId: string, reaction: string) {
  try {
    const messageRef = doc(db, "chats", chatId, "messages", messageId)
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: reaction,
    })
  } catch (error) {
    console.error("Error adding reaction:", error)
    throw error
  }
}

// Remove reaction from message
export async function removeReactionFromMessage(chatId: string, messageId: string, userId: string) {
  try {
    const messageRef = doc(db, "chats", chatId, "messages", messageId)
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: null,
    })
  } catch (error) {
    console.error("Error removing reaction:", error)
    throw error
  }
}

// Forward message
export async function forwardMessage(
  originalChatId: string,
  originalMessageId: string,
  targetChatId: string,
  senderId: string,
) {
  try {
    // Get original message
    const messageDoc = await getDoc(doc(db, "chats", originalChatId, "messages", originalMessageId))

    if (!messageDoc.exists()) {
      throw new Error("Original message not found")
    }

    const originalData = messageDoc.data()

    // Create new message data
    const messageData: any = {
      text: originalData.text,
      senderId,
      timestamp: serverTimestamp(),
      read: false,
      readBy: [senderId],
      reactions: {},
      forwarded: {
        originalMessageId,
        originalSenderId: originalData.senderId,
      },
    }

    // Copy attachments if any
    if (originalData.attachments) {
      messageData.attachments = originalData.attachments
    }

    // Add message to  {
    //   messageData.attachments = originalData.attachments
    // }

    // Add message to target chat
    const messageRef = await addDoc(collection(db, "chats", targetChatId, "messages"), messageData)

    // Update chat with last message
    await updateDoc(doc(db, "chats", targetChatId), {
      lastMessage: {
        text: messageData.text || "Forwarded message",
        senderId,
        timestamp: serverTimestamp(),
        read: false,
      },
      lastMessageAt: serverTimestamp(),
    })

    return messageRef.id
  } catch (error) {
    console.error("Error forwarding message:", error)
    throw error
  }
}

// Update typing status
export async function updateTypingStatus(chatId: string, userId: string, isTyping: boolean) {
  try {
    const typingRef = databaseRef(database, `typing/${chatId}/${userId}`)

    if (isTyping) {
      await set(typingRef, {
        isTyping: true,
        timestamp: Date.now(),
      })
    } else {
      await remove(typingRef)
    }
  } catch (error) {
    console.error("Error updating typing status:", error)
    throw error
  }
}

// Get typing status
export function getTypingStatus(chatId: string, currentUserId: string, callback: (typingUsers: string[]) => void) {
  const typingRef = databaseRef(database, `typing/${chatId}`)

  return onValue(typingRef, (snapshot) => {
    const typingUsers: string[] = []

    if (snapshot.exists()) {
      const data = snapshot.val()

      Object.keys(data).forEach((userId) => {
        if (userId !== currentUserId && data[userId].isTyping) {
          // Check if typing status is recent (within last 10 seconds)
          const isRecent = Date.now() - data[userId].timestamp < 10000
          if (isRecent) {
            typingUsers.push(userId)
          }
        }
      })
    }

    callback(typingUsers)
  })
}

// Helper function to determine file type
function getFileType(mimeType: string): "image" | "document" | "video" | "audio" | "other" {
  if (mimeType.startsWith("image/")) {
    return "image"
  } else if (mimeType.startsWith("video/")) {
    return "video"
  } else if (mimeType.startsWith("audio/")) {
    return "audio"
  } else if (
    mimeType === "application/pdf" ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  ) {
    return "document"
  }
  return "other"
}
