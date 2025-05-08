"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { type User, logoutUser } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Search, Users, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CreateGroupDialog } from "./create-group-dialog"
import type { Group } from "@/lib/groups"
import Link from "next/link"
import { KrushLogo } from "./krush-logo"

interface UserListProps {
  currentUser: User
  users: User[]
  groups: Group[]
}

export function UserList({ currentUser, users, groups }: UserListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedUserId = searchParams.get("user")
  const selectedGroupId = searchParams.get("group")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

  async function handleLogout() {
    await logoutUser()
    router.refresh()
  }

  function selectUser(userId: string) {
    router.push(`/?user=${userId}`)
  }

  function selectGroup(groupId: string) {
    router.push(`/?group=${groupId}`)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <KrushLogo />
          <div className="flex items-center gap-1">
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
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Avatar>
            <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <CreateGroupDialog currentUser={currentUser} users={users} />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {/* Groups Section */}
        <div className="p-2">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Groups ({filteredGroups.length})
          </h2>
          <div className="space-y-1 mt-1">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-lg text-left",
                  selectedGroupId === group.id ? "bg-accent dark:bg-accent" : "hover:bg-muted dark:hover:bg-muted",
                )}
                onClick={() => selectGroup(group.id)}
              >
                <Avatar>
                  <AvatarImage src={group.avatar || "/placeholder.svg"} alt={group.name} />
                  <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{group.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{group.members.length} members</p>
                </div>
              </button>
            ))}
            {filteredGroups.length === 0 && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">No groups found</p>
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="p-2">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1">
            Direct Messages ({filteredUsers.length})
          </h2>
          <div className="space-y-1 mt-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-lg text-left",
                  selectedUserId === user.id ? "bg-accent dark:bg-accent" : "hover:bg-muted dark:hover:bg-muted",
                )}
                onClick={() => selectUser(user.id)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950",
                      user.online ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.online 
                      ? "Online" 
                      : user.lastSeen 
                        ? typeof user.lastSeen === 'number'
                          ? `Last seen ${formatLastSeen(user.lastSeen)}`
                          : "Offline"
                        : "Offline"}
                  </p>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No users found</p>
            )}
          </div>
        </div>
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
