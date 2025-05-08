"use server"

import { revalidatePath } from "next/cache"
import { uploadFile } from "./upload"
import {
  sendMessage as sendFirebaseMessage,
  addReaction as addFirebaseReaction
} from "./firebase-data-service"
import { db } from "./firebase"
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  arrayUnion
} from "firebase/firestore"
import { database } from "./firebase"
import { ref, set, get, remove } from "firebase/database"

export type MessageAttachment = {
  type: "image" | "document" | "video" | "audio" | "other"
  url: string
  name: string
  size: number
  fileType: string
}

export type Message = {
  id: string
  content: string
  senderId: string
  receiverId?: string
  groupId?: string
  chatId?: string
  timestamp: number
  read: boolean
  readBy: string[]
  reactions: Record<string, string>
  attachments?: MessageAttachment[]
  forwarded?: {
    originalMessageId: string
    originalSenderId: string
    originalSenderName: string
  }
}

export async function sendMessage(formData: FormData): Promise<Message> {
  const content = formData.get("content") as string
  const senderId = formData.get("senderId") as string
  const receiverId = formData.get("receiverId") as string | undefined
  const groupId = formData.get("groupId") as string | undefined
  const attachmentCount = Number(formData.get("attachmentCount") || "0")

  // Optional forwarding data
  const forwardedMessageId = formData.get("forwardedMessageId") as string | undefined
  const forwardedSenderId = formData.get("forwardedSenderId") as string | undefined
  const forwardedSenderName = formData.get("forwardedSenderName") as string | undefined

  if (!senderId || (!receiverId && !groupId)) {
    throw new Error("Missing required fields")
  }

  // Don't require content if there are attachments
  if (!content && attachmentCount === 0) {
    throw new Error("Message must have content or attachments")
  }

  // Process file uploads
  const attachments: MessageAttachment[] = []

  if (attachmentCount > 0) {
    for (let i = 0; i < attachmentCount; i++) {
      const file = formData.get(`file-${i}`) as File
      if (file) {
        // Create new FormData for this specific file
        const fileFormData = new FormData()
        fileFormData.append("file", file)

        try {
          const uploadResult = await uploadFile(fileFormData)
          const fileType = await getFileType(uploadResult.type)

          attachments.push({
            type: fileType,
            url: uploadResult.url,
            name: uploadResult.name,
            size: uploadResult.size,
            fileType: uploadResult.type,
          })
        } catch (error) {
          console.error("Failed to upload file:", error)
          // Continue with other files even if one fails
        }
      }
    }
  }

  // Prepare message data
  const messageData: any = {
    content: content || "",
    senderId,
    receiverId,
    groupId,
    attachments: attachments.length > 0 ? attachments : undefined
  }

  // Add forwarded information if this is a forwarded message
  if (forwardedMessageId && forwardedSenderId && forwardedSenderName) {
    messageData.forwarded = {
      originalMessageId: forwardedMessageId,
      originalSenderId: forwardedSenderId,
      originalSenderName: forwardedSenderName,
    }
  }

  // Send message using Firebase
  const message = await sendFirebaseMessage(messageData)

  // Revalidate the chat page
  revalidatePath("/")

  return {
    ...message,
    receiverId: message.receiverId || undefined,
    groupId: message.groupId || undefined
  } as Message
}

export async function getFileType(mimeType: string): Promise<"image" | "document" | "video" | "audio" | "other"> {
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

export async function forwardMessage(
  messageId: string,
  senderId: string,
  targetId: string,
  isGroup: boolean,
): Promise<Message> {
  // Get the original message
  const messageRef = doc(db, "messages", messageId)
  const messageDoc = await getDoc(messageRef)

  if (!messageDoc.exists()) {
    throw new Error("Message not found")
  }

  const messageData = messageDoc.data()

  // Create form data for the new message
  const formData = new FormData()
  formData.append("content", messageData.content)
  formData.append("senderId", senderId)

  if (isGroup) {
    formData.append("groupId", targetId)
  } else {
    formData.append("receiverId", targetId)
  }

  // Add forwarding information
  formData.append("forwardedMessageId", messageId)
  formData.append("forwardedSenderId", messageData.senderId)

  // Get the original sender's name
  const senderRef = doc(db, "users", messageData.senderId)
  const senderDoc = await getDoc(senderRef)
  const senderName = senderDoc.exists() ?
    (senderDoc.data().displayName || senderDoc.data().name || "Unknown User") :
    "Unknown User"

  formData.append("forwardedSenderName", senderName)

  // Send the forwarded message
  return sendMessage(formData)
}

export async function getMessages(userId1: string, userId2: string, messageLimit = 50): Promise<Message[]> {
  try {
    // Create a chat ID by sorting and joining user IDs
    const chatId = [userId1, userId2].sort().join("_");

    // Check if we have messages in Firestore
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("chatId", "==", chatId),
      orderBy("timestamp", "desc"),
      limit(messageLimit)
    );

    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        content: data.content || "",
        senderId: data.senderId,
        receiverId: data.receiverId || undefined,
        groupId: data.groupId || undefined,
        chatId: data.chatId,
        timestamp: data.timestamp ?
          (typeof data.timestamp === 'number' ?
            data.timestamp :
            data.timestamp.toMillis ?
              data.timestamp.toMillis() :
              Date.now()) :
          Date.now(),
        read: data.read || false,
        readBy: data.readBy || [data.senderId],
        reactions: data.reactions || {},
        attachments: data.attachments || [],
        forwarded: data.forwarded
      });
    });

    // Mark messages as read
    for (const message of messages) {
      if (message.receiverId === userId1 && !message.readBy.includes(userId1)) {
        try {
          await markMessageAsRead(message.id, userId1);
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      }
    }

    return messages;
  } catch (error) {
    console.error("Error getting messages:", error);
    // Return empty array instead of throwing
    return [];
  }
}

export async function getGroupMessages(groupId: string, messageLimit = 50): Promise<Message[]> {
  try {
    // Query messages for this group
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("groupId", "==", groupId),
      orderBy("timestamp", "desc"),
      limit(messageLimit)
    );

    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        content: data.content || "",
        senderId: data.senderId,
        receiverId: data.receiverId || undefined,
        groupId: data.groupId || undefined,
        chatId: data.chatId,
        timestamp: data.timestamp ?
          (typeof data.timestamp === 'number' ?
            data.timestamp :
            data.timestamp.toMillis ?
              data.timestamp.toMillis() :
              Date.now()) :
          Date.now(),
        read: data.read || false,
        readBy: data.readBy || [data.senderId],
        reactions: data.reactions || {},
        attachments: data.attachments || [],
        forwarded: data.forwarded
      });
    });

    return messages;
  } catch (error) {
    console.error("Error getting group messages:", error);
    return [];
  }
}

export async function markMessageAsRead(messageId: string, userId: string): Promise<void> {
  try {
    const messageRef = doc(db, "messages", messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      console.warn(`Message ${messageId} not found`);
      return;
    }

    const data = messageDoc.data();
    const readBy = data.readBy || [];

    if (!readBy.includes(userId)) {
      await updateDoc(messageRef, {
        read: true,
        readBy: arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
    // Don't throw, just log
  }
}

export async function addReaction(messageId: string, userId: string, reaction: string) {
  try {
    await addFirebaseReaction(messageId, userId, reaction)
    revalidatePath("/")
  } catch (error) {
    console.error("Error adding reaction:", error)
    throw new Error("Failed to add reaction")
  }
}

export async function setTypingStatus(userId: string, receiverId: string, isTyping: boolean) {
  try {
    const typingRef = ref(database, `typing/${userId}_${receiverId}`)

    if (isTyping) {
      // Set typing status with expiration (will be handled by client-side code)
      await set(typingRef, {
        isTyping: true,
        timestamp: Date.now()
      })
    } else {
      // Clear typing status
      await remove(typingRef)
    }
  } catch (error) {
    console.error("Error setting typing status:", error)
    throw new Error("Failed to update typing status")
  }
}

export async function getTypingStatus(userId: string, receiverId: string): Promise<boolean> {
  try {
    const typingRef = ref(database, `typing/${receiverId}_${userId}`)
    const snapshot = await get(typingRef)

    if (snapshot.exists()) {
      const data = snapshot.val()
      // Check if typing status is recent (within last 5 seconds)
      const isRecent = Date.now() - data.timestamp < 5000
      return data.isTyping && isRecent
    }

    return false
  } catch (error) {
    console.error("Error getting typing status:", error)
    return false
  }
}

export async function setGroupTypingStatus(userId: string, groupId: string, isTyping: boolean) {
  try {
    const typingRef = ref(database, `typing/group/${groupId}/${userId}`)

    if (isTyping) {
      // Set typing status with expiration (will be handled by client-side code)
      await set(typingRef, {
        isTyping: true,
        timestamp: Date.now()
      })
    } else {
      // Clear typing status
      await remove(typingRef)
    }
  } catch (error) {
    console.error("Error setting group typing status:", error)
    throw new Error("Failed to update group typing status")
  }
}

export async function getGroupTypingUsers(groupId: string, currentUserId: string): Promise<string[]> {
  try {
    const typingRef = ref(database, `typing/group/${groupId}`)
    const snapshot = await get(typingRef)

    const typingUsers: string[] = []

    if (snapshot.exists()) {
      const data = snapshot.val()

      Object.keys(data).forEach(userId => {
        if (userId !== currentUserId) {
          const userTyping = data[userId]
          // Check if typing status is recent (within last 5 seconds)
          const isRecent = Date.now() - userTyping.timestamp < 5000
          if (userTyping.isTyping && isRecent) {
            typingUsers.push(userId)
          }
        }
      })
    }

    return typingUsers
  } catch (error) {
    console.error("Error getting group typing users:", error)
    return []
  }
}
