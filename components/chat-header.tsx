"use client"

import { useSearchParams } from "next/navigation"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Moon, Sun, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { GroupMembersDialog } from "./group-members-dialog"
import { NotificationPermission } from "./notification-permission"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { KrushLogo } from "./krush-logo"

interface ChatHeaderProps {
  currentUser: User
  users: User[]
  groups: Group[]
}

export function ChatHeader({ currentUser, users, groups }: ChatHeaderProps) {
  const { theme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const selectedUserId = searchParams.get("user")
  const selectedGroupId = searchParams.get("group")

  const selectedUser = selectedUserId ? users.find((user) => user.id === selectedUserId) : null
  const selectedGroup = selectedGroupId ? groups.find((group) => group.id === selectedGroupId) : null

  return (
    <div className="h-16 border-b border-border bg-background dark:bg-card flex items-center justify-between px-4">
      {selectedUser && (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.name} />
              <AvatarFallback>{selectedUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950",
                selectedUser.online ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600",
              )}
            />
          </div>
          <div>
            <p className="font-medium">{selectedUser.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedUser.online
                ? "Online"
                : selectedUser.lastSeen
                  ? `Last seen ${formatLastSeen(selectedUser.lastSeen)}`
                  : "Offline"}
            </p>
          </div>
        </div>
      )}

      {selectedGroup && (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={selectedGroup.avatar || "/placeholder.svg"} alt={selectedGroup.name} />
            <AvatarFallback>{selectedGroup.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{selectedGroup.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedGroup.members.length} members</p>
          </div>
        </div>
      )}

      {!selectedUser && !selectedGroup && (
        <div className="flex items-center">
          <KrushLogo />
        </div>
      )}

      <div className="flex items-center gap-2">
        <NotificationPermission userId={currentUser.id} />

        {selectedGroup && <GroupMembersDialog group={selectedGroup} currentUser={currentUser} allUsers={users} />}

        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Admin</span>
          </Button>
        </Link>

        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </Link>

        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  )
}

function formatLastSeen(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  // Less than a minute
  if (diff < 60 * 1000) {
    return "just now"
  }

  // Less than an hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
  }

  // Less than a day
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
  }

  // More than a day
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  return `${days} ${days === 1 ? "day" : "days"} ago`
}
