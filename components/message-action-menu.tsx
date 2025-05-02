"use client"

import { useState } from "react"
import { MoreVertical, Forward, Copy, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ForwardMessageDialog } from "./forward-message-dialog"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"

interface MessageActionMenuProps {
  messageId: string
  messageContent: string
  currentUserId: string
  senderId: string
  users: User[]
  groups: Group[]
}

export function MessageActionMenu({
  messageId,
  messageContent,
  currentUserId,
  senderId,
  users,
  groups,
}: MessageActionMenuProps) {
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false)
  const isOwnMessage = currentUserId === senderId

  function handleCopyText() {
    navigator.clipboard.writeText(messageContent)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsForwardDialogOpen(true)}>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyText}>
            <Copy className="h-4 w-4 mr-2" />
            Copy text
          </DropdownMenuItem>
          {isOwnMessage && (
            <DropdownMenuItem className="text-red-500 focus:text-red-500">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ForwardMessageDialog
        isOpen={isForwardDialogOpen}
        onClose={() => setIsForwardDialogOpen(false)}
        messageId={messageId}
        currentUserId={currentUserId}
        users={users.filter((user) => user.id !== currentUserId)}
        groups={groups}
      />
    </>
  )
}
