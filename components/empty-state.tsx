"use client"

import { MessageSquare } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-muted">
        <MessageSquare className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Welcome to Krush Chat</h2>
      <p className="text-muted-foreground max-w-md mb-4">
        Select a conversation from the sidebar or start a new chat to begin messaging.
      </p>
      <p className="text-xs text-muted-foreground">
        Your conversations are end-to-end encrypted for privacy and security.
      </p>
    </div>
  )
}
