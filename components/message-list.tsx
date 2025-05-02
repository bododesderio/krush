"use client"

import { useRef, useEffect } from "react"
import { type Message, addReaction } from "@/lib/messages"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { EmojiPicker } from "@/components/emoji-picker"
import { useSearchParams } from "next/navigation"
import { MessageActionMenu } from "./message-action-menu"
import { MessageAttachmentView } from "./message-attachment"
import { VoiceMessagePlayer } from "./voice-message-player"
import { CornerUpRight } from "lucide-react"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isLoading: boolean
  isTyping: boolean
  typingUsers?: string[]
  users: User[]
  groups: Group[]
  isGroupChat: boolean
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  isTyping,
  typingUsers = [],
  users,
  groups,
  isGroupChat,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleAddReaction(messageId: string, reaction: string) {
    try {
      await addReaction(messageId, currentUserId, reaction)
    } catch (error) {
      console.error("Failed to add reaction:", error)
    }
  }

  // Get user by ID helper function
  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  // Check if a message is a voice message
  const isVoiceMessage = (message: Message) => {
    return message.attachments?.some(att => \
      att.type === "audio\" && att.name.includes  => {
    return message.attachments?.some((att) => att.type === "audio" && att.name.includes("voice-message"))
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {isLoading ? (
        // Loading skeletons
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn("flex gap-3 max-w-[80%]", i % 2 === 0 ? "ml-auto" : "")}>
            {i % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full" />}
            <div
              className={cn("rounded-lg p-3", i % 2 === 0 ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-800")}
            >
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))
      ) : (
        <>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === currentUserId
              const sender = getUserById(message.senderId)
              const hasVoiceMessage = isVoiceMessage(message)

              return (
                <div key={message.id} className={cn("flex gap-3 max-w-[80%]", isOwnMessage ? "ml-auto" : "")}>
                  {!isOwnMessage && (
                    <Avatar>
                      <AvatarImage
                        src={sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`}
                      />
                      <AvatarFallback>{sender?.name.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="space-y-1">
                    {isGroupChat && !isOwnMessage && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {sender?.name || "Unknown User"}
                      </p>
                    )}
                    <div
                      className={cn(
                        "rounded-lg p-3 relative group",
                        isOwnMessage ? "bg-primary text-primary-foreground" : "bg-background dark:bg-card shadow-sm",
                      )}
                    >
                      {/* Forwarded message indicator */}
                      {message.forwarded && (
                        <div
                          className={cn(
                            "flex items-center gap-1 text-xs mb-1",
                            isOwnMessage ? "text-blue-100" : "text-slate-500 dark:text-slate-400",
                          )}
                        >
                          <CornerUpRight className="h-3 w-3" />
                          <span>Forwarded from {message.forwarded.originalSenderName}</span>
                        </div>
                      )}

                      {/* Voice message */}
                      {hasVoiceMessage && (
                        <div className="mb-2">
                          {message.attachments?.map((attachment, index) =>
                            attachment.type === "audio" && attachment.name.includes("voice-message") ? (
                              <VoiceMessagePlayer
                                key={index}
                                audioUrl={attachment.url}
                                className={cn(isOwnMessage ? "bg-primary-foreground/20" : "bg-accent/50")}
                              />
                            ) : null,
                          )}
                        </div>
                      )}

                      {/* Other message attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {message.attachments.map((attachment, index) =>
                            !attachment.name.includes("voice-message") ? (
                              <MessageAttachmentView key={index} attachment={attachment} isOwnMessage={isOwnMessage} />
                            ) : null,
                          )}
                        </div>
                      )}

                      {/* Message content */}
                      {message.content && <p>{message.content}</p>}

                      <div className="absolute top-2 right-2">
                        <MessageActionMenu
                          messageId={message.id}
                          messageContent={message.content}
                          currentUserId={currentUserId}
                          senderId={message.senderId}
                          users={users}
                          groups={groups}
                        />
                      </div>

                      <div className="absolute bottom-0 right-0 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <EmojiPicker onEmojiSelect={(emoji) => handleAddReaction(message.id, emoji)} />
                      </div>
                    </div>

                    {/* Message reactions */}
                    {Object.keys(message.reactions).length > 0 && (
                      <div className="flex gap-1 text-xs">
                        {Object.entries(message.reactions).map(([userId, reaction]) => {
                          const reactingUser = getUserById(userId)
                          return (
                            <span
                              key={userId}
                              className="bg-accent dark:bg-accent rounded-full px-2 py-0.5 flex items-center gap-1"
                              title={reactingUser?.name || "Unknown User"}
                            >
                              {reaction}
                              {isGroupChat && (
                                <span className="text-[10px] text-slate-500">
                                  {reactingUser?.name.split(" ")[0] || "?"}
                                </span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTime(message.timestamp)}
                      </span>
                      {isOwnMessage && !isGroupChat && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {message.read ? "Read" : "Delivered"}
                        </span>
                      )}
                      {isOwnMessage && isGroupChat && message.readBy.length > 1 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Read by {message.readBy.length - 1}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Typing indicator for direct messages */}
          {isTyping && !isGroupChat && (
            <div className="flex gap-3 max-w-[80%]">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${searchParams.get("user")}`} />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce delay-75">•</span>
                  <span className="animate-bounce delay-150">•</span>
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator for group chats */}
          {typingUsers.length > 0 && isGroupChat && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce delay-75">•</span>
                    <span className="animate-bounce delay-150">•</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {typingUsers.length === 1
                      ? `${typingUsers[0]} is typing...`
                      : typingUsers.length === 2
                        ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                        : `${typingUsers.length} people are typing...`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </>
      )}
    </div>
  )
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}
