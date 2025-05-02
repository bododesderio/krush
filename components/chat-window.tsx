"use client"

import type React from "react"

import { useState } from "react"
import type { Chat } from "@/lib/chat-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"

interface ChatWindowProps {
  chat: Chat
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const [message, setMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const { user } = useAuth()
  
  const otherMember = chat.type === "direct" 
    ? chat.membersData && Object.entries(chat.membersData).find(([id]) => id !== user?.uid)?.[1]
    : null
    
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    
    // Implement send message functionality
    console.log("Sending message:", message)
    
    // Clear input
    setMessage("")
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage 
              src={chat.type === "direct" ? otherMember?.photoURL || "/placeholder.svg" : chat.avatar} 
              alt={chat.type === "direct" ? otherMember?.displayName || "Chat" : chat.name} 
            />
            <AvatarFallback>
              {chat.type === "direct" 
                ? (otherMember?.displayName?.charAt(0) || "?") 
                : (chat.name?.charAt(0) || "G")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">
              {chat.type === "direct" ? otherMember?.displayName || "Chat" : chat.name}\
