"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"
import { type Message, getMessages, getGroupMessages, sendMessage } from "@/lib/messages"
import { MessageList } from "@/components/message-list"
import { MessageInput } from "@/components/message-input"
import { listenToMessages, type RealtimeMessage } from "@/lib/firebase-realtime"
import { setTypingStatus, listenToTypingStatus } from "@/lib/typing-service"
import { setupMessageListener } from "@/lib/notification-service"
import { useFirebaseMessaging } from "@/lib/firebase-messaging-init"
import { useToast } from "@/components/ui/use-toast"

interface ChatContainerProps {
  currentUser: User
  users: User[]
  groups: Group[]
}

export function ChatContainer({ currentUser, users, groups }: ChatContainerProps) {
  const searchParams = useSearchParams()
  const selectedUserId = searchParams.get("user")
  const selectedGroupId = searchParams.get("group")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const { toast } = useToast()

  // Initialize Firebase messaging for notifications
  useFirebaseMessaging(currentUser.id)

  // Initial message fetch
  useEffect(() => {
    if (!selectedUserId && !selectedGroupId) {
      setMessages([])
      return
    }

    async function fetchInitialMessages() {
      setIsLoading(true)
      try {
        if (selectedGroupId) {
          const fetchedMessages = await getGroupMessages(selectedGroupId)
          setMessages(fetchedMessages)
        } else if (selectedUserId) {
          const fetchedMessages = await getMessages(currentUser.id, selectedUserId)
          setMessages(fetchedMessages)
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error)
        // Show error toast
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        })
        // Set empty messages array to prevent UI from breaking
        setMessages([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialMessages()
  }, [currentUser.id, selectedUserId, selectedGroupId])

  // Set up real-time message listener
  useEffect(() => {
    if (!selectedUserId && !selectedGroupId) return () => {}

    // Create chatId for direct messages
    const chatId = selectedUserId ?
      [currentUser.id, selectedUserId].sort().join("_") :
      selectedGroupId

    if (!chatId) return () => {}

    console.log("Setting up real-time message listener for chatId:", chatId)

    return listenToMessages(chatId, (newMessages) => {
      console.log("Received new messages:", newMessages)

      // Convert RealtimeMessage to Message with text property
      const convertedMessages = newMessages.map((message) => ({
        id: message.id,
        content: message.content || message.text || "",
        text: message.text || message.content || "",
        senderId: message.senderId,
        receiverId: message.receiverId,
        groupId: message.groupId,
        chatId: message.chatId,
        timestamp: message.timestamp,
        read: message.read,
        readBy: message.readBy || [],
        reactions: message.reactions || {},
        attachments: message.attachments || [],
        forwarded: message.forwarded
          ? {
              originalMessageId: message.forwarded.originalMessageId || "",
              originalSenderId: message.forwarded.originalSenderId || "",
              originalSenderName: message.forwarded.originalSenderName || "Unknown",
            }
          : undefined,
      }))

      setMessages(convertedMessages)
    })
  }, [currentUser.id, selectedUserId, selectedGroupId])

  // Set up typing status listener
  useEffect(() => {
    if (!selectedUserId && !selectedGroupId) return () => {}

    const chatId = selectedGroupId || (selectedUserId && `${[currentUser.id, selectedUserId].sort().join("_")}`)

    if (!chatId) return () => {}

    return listenToTypingStatus(chatId, currentUser.id, (typingUserIds) => {
      // Convert user IDs to names
      const typingUserNames = typingUserIds.map((userId) => {
        const user = users.find((u) => u.id === userId)
        return user ? user.name : "Someone"
      })

      setTypingUsers(typingUserNames)
    })
  }, [currentUser.id, selectedUserId, selectedGroupId, users])

  // Set up notification listener
  useEffect(() => {
    const unsubscribe = setupMessageListener((payload) => {
      // Show toast notification for foreground messages
      if (payload.notification) {
        toast({
          title: payload.notification.title,
          description: payload.notification.body,
        })
      }
    })

    return unsubscribe
  }, [toast])

  // Handle typing status
  const handleTyping = useCallback(
    async (isTyping: boolean) => {
      if (!selectedUserId && !selectedGroupId) return

      const chatId = selectedGroupId || (selectedUserId && `${[currentUser.id, selectedUserId].sort().join("_")}`)

      if (!chatId) return

      try {
        await setTypingStatus(chatId, currentUser.id, isTyping)
      } catch (error) {
        console.error("Failed to update typing status:", error)
      }
    },
    [currentUser.id, selectedUserId, selectedGroupId],
  )

  // Handle send message
  async function handleSendMessage(formData: FormData) {
    if (!selectedUserId && !selectedGroupId) return

    formData.append("senderId", currentUser.id)

    if (selectedUserId) {
      formData.append("receiverId", selectedUserId)
    } else if (selectedGroupId) {
      formData.append("groupId", selectedGroupId)
    }

    try {
      await sendMessage(formData)
      // Clear typing status after sending message
      handleTyping(false)
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Check if a chat is selected
  if (!selectedUserId && !selectedGroupId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted dark:bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to Modern Chat</h2>
          <p className="text-slate-500 dark:text-slate-400">Select a conversation from the sidebar to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-muted dark:bg-background">
      <MessageList
        messages={messages}
        currentUserId={currentUser.id}
        isLoading={isLoading}
        isTyping={false}
        typingUsers={typingUsers}
        users={users}
        groups={groups}
        isGroupChat={!!selectedGroupId}
      />
      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  )
}
