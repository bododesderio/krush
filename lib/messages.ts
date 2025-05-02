"use server"

import { v4 as uuidv4 } from "uuid"
import { getRedisClient } from "./redis"
import { revalidatePath } from "next/cache"
import { uploadFile } from "./upload"

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

  const messageId = uuidv4()
  const timestamp = Date.now()

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

  const message: Message = {
    id: messageId,
    content: content || "",
    senderId,
    timestamp,
    read: false,
    readBy: [senderId], // Sender has read their own message
    reactions: {},
  }

  if (receiverId) message.receiverId = receiverId
  if (groupId) message.groupId = groupId
  if (attachments.length > 0) message.attachments = attachments

  // Add forwarding information if this is a forwarded message
  if (forwardedMessageId && forwardedSenderId && forwardedSenderName) {
    message.forwarded = {
      originalMessageId: forwardedMessageId,
      originalSenderId: forwardedSenderId,
      originalSenderName: forwardedSenderName,
    }
  }

  const redis = getRedisClient()

  // Store message
  const messageData: Record<string, string> = {
    content: message.content,
    senderId: message.senderId,
    timestamp: message.timestamp.toString(),
    read: "false",
    readBy: JSON.stringify(message.readBy),
    reactions: JSON.stringify(message.reactions || {}),
  }

  // Only add these fields if they exist
  if (message.receiverId) messageData.receiverId = message.receiverId
  if (message.groupId) messageData.groupId = message.groupId
  if (message.attachments) messageData.attachments = JSON.stringify(message.attachments)
  if (message.forwarded) messageData.forwarded = JSON.stringify(message.forwarded)

  try {
    await redis.hset(`message:${messageId}`, messageData)

    if (groupId) {
      // Add to group messages
      await redis.zadd(`group:${groupId}:messages`, timestamp, messageId)
    } else if (receiverId) {
      // Add to conversation lists for both users
      const conversationKey1 = `conversation:${senderId}:${receiverId}`
      const conversationKey2 = `conversation:${receiverId}:${senderId}`

      await redis.zadd(conversationKey1, timestamp, messageId)
      await redis.zadd(conversationKey2, timestamp, messageId)

      // Update last message timestamp for conversation
      await redis.set(`lastMessage:${senderId}:${receiverId}`, timestamp.toString())
      await redis.set(`lastMessage:${receiverId}:${senderId}`, timestamp.toString())
    }

    // Revalidate the chat page
    revalidatePath("/")

    return message
  } catch (error) {
    console.error("Error sending message:", error)
    throw new Error("Failed to send message")
  }
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
  const redis = getRedisClient()

  // Get the original message
  const messageData = await redis.hgetall(`message:${messageId}`)

  if (!messageData || Object.keys(messageData).length === 0) {
    throw new Error("Message not found")
  }

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
  const senderData = await redis.hgetall(`user:${messageData.senderId}`)
  const senderName = senderData && senderData.name ? senderData.name : "Unknown User"
  formData.append("forwardedSenderName", senderName)

  // Send the forwarded message
  return sendMessage(formData)
}

export async function getMessages(userId1: string, userId2: string, limit = 50): Promise<Message[]> {
  const redis = getRedisClient()
  const conversationKey = `conversation:${userId1}:${userId2}`

  try {
    // Get message IDs sorted by timestamp (newest first)
    const messageIds = await redis.zrange(conversationKey, 0, limit - 1, {
      rev: true,
    })

    const messages: Message[] = []

    for (const messageId of messageIds) {
      const messageData = await redis.hgetall(`message:${messageId}`)

      if (messageData && Object.keys(messageData).length > 0) {
        try {
          const readBy = messageData.readBy ? JSON.parse(messageData.readBy) : []
          const reactions = messageData.reactions ? JSON.parse(messageData.reactions) : {}
          const attachments = messageData.attachments ? JSON.parse(messageData.attachments) : undefined
          const forwarded = messageData.forwarded ? JSON.parse(messageData.forwarded) : undefined

          messages.push({
            id: messageId,
            content: messageData.content,
            senderId: messageData.senderId,
            receiverId: messageData.receiverId,
            groupId: messageData.groupId,
            timestamp: Number.parseInt(messageData.timestamp),
            read: messageData.read === "true",
            readBy,
            reactions,
            attachments,
            forwarded,
          })
        } catch (error) {
          console.error("Error parsing message data:", error)
        }
      }
    }

    // Mark messages as read
    for (const message of messages) {
      if (message.receiverId === userId1 && !message.readBy.includes(userId1)) {
        const updatedReadBy = [...message.readBy, userId1]
        await redis.hset(`message:${message.id}`, {
          read: updatedReadBy.includes(message.receiverId || "") ? "true" : "false",
          readBy: JSON.stringify(updatedReadBy),
        })
      }
    }

    return messages
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
}

export async function getGroupMessages(groupId: string, limit = 50): Promise<Message[]> {
  const redis = getRedisClient()
  const messagesKey = `group:${groupId}:messages`

  try {
    // Get message IDs sorted by timestamp (newest first)
    const messageIds = await redis.zrange(messagesKey, 0, limit - 1, {
      rev: true,
    })

    const messages: Message[] = []

    for (const messageId of messageIds) {
      const messageData = await redis.hgetall(`message:${messageId}`)

      if (messageData && Object.keys(messageData).length > 0) {
        try {
          const readBy = messageData.readBy ? JSON.parse(messageData.readBy) : []
          const reactions = messageData.reactions ? JSON.parse(messageData.reactions) : {}
          const attachments = messageData.attachments ? JSON.parse(messageData.attachments) : undefined
          const forwarded = messageData.forwarded ? JSON.parse(messageData.forwarded) : undefined

          messages.push({
            id: messageId,
            content: messageData.content,
            senderId: messageData.senderId,
            receiverId: messageData.receiverId,
            groupId: messageData.groupId,
            timestamp: Number.parseInt(messageData.timestamp),
            read: messageData.read === "true",
            readBy,
            reactions,
            attachments,
            forwarded,
          })
        } catch (error) {
          console.error("Error parsing message data:", error)
        }
      }
    }

    return messages
  } catch (error) {
    console.error("Error getting group messages:", error)
    return []
  }
}

export async function markMessageAsRead(messageId: string, userId: string): Promise<void> {
  const redis = getRedisClient()
  const messageData = await redis.hgetall(`message:${messageId}`)

  if (!messageData || Object.keys(messageData).length === 0) {
    throw new Error("Message not found")
  }

  try {
    const readBy = JSON.parse(messageData.readBy || "[]")

    if (!readBy.includes(userId)) {
      const updatedReadBy = [...readBy, userId]
      await redis.hset(`message:${messageId}`, {
        read: messageData.receiverId === userId ? "true" : messageData.read,
        readBy: JSON.stringify(updatedReadBy),
      })
    }
  } catch (error) {
    console.error("Error marking message as read:", error)
  }
}

export async function addReaction(messageId: string, userId: string, reaction: string) {
  const redis = getRedisClient()

  const messageData = await redis.hgetall(`message:${messageId}`)

  if (!messageData || Object.keys(messageData).length === 0) {
    throw new Error("Message not found")
  }

  try {
    const reactions = JSON.parse(messageData.reactions || "{}")
    reactions[userId] = reaction

    await redis.hset(`message:${messageId}`, {
      reactions: JSON.stringify(reactions),
    })

    revalidatePath("/")
  } catch (error) {
    console.error("Error adding reaction:", error)
    throw new Error("Failed to add reaction")
  }
}

export async function setTypingStatus(userId: string, receiverId: string, isTyping: boolean) {
  try {
    const redis = getRedisClient()

    if (isTyping) {
      // Set typing status with expiration (5 seconds)
      await redis.set(`typing:${userId}:${receiverId}`, "true", {
        ex: 5,
      })
    } else {
      // Clear typing status
      await redis.del(`typing:${userId}:${receiverId}`)
    }
  } catch (error) {
    console.error("Error setting typing status:", error)
    throw new Error("Failed to update typing status")
  }
}

export async function getTypingStatus(userId: string, receiverId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const isTyping = await redis.get(`typing:${receiverId}:${userId}`)

    return isTyping === "true"
  } catch (error) {
    console.error("Error getting typing status:", error)
    return false
  }
}

export async function setGroupTypingStatus(userId: string, groupId: string, isTyping: boolean) {
  try {
    const redis = getRedisClient()

    if (isTyping) {
      // Set typing status with expiration (5 seconds)
      await redis.set(`typing:group:${userId}:${groupId}`, "true", {
        ex: 5,
      })
    } else {
      // Clear typing status
      await redis.del(`typing:group:${userId}:${groupId}`)
    }
  } catch (error) {
    console.error("Error setting group typing status:", error)
    throw new Error("Failed to update group typing status")
  }
}

export async function getGroupTypingUsers(groupId: string, currentUserId: string): Promise<string[]> {
  try {
    const redis = getRedisClient()
    const keys = await redis.keys(`typing:group:*:${groupId}`)

    const typingUsers: string[] = []

    for (const key of keys) {
      const userId = key.split(":")[2]
      if (userId !== currentUserId) {
        const isTyping = await redis.get(key)
        if (isTyping === "true") {
          typingUsers.push(userId)
        }
      }
    }

    return typingUsers
  } catch (error) {
    console.error("Error getting group typing users:", error)
    return []
  }
}
