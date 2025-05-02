"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Search, Users, Settings, MessageSquare, PlusCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CreateGroupDialog } from "./create-group-dialog"
import { KrushLogo } from "./krush-logo"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { logoutUser } from "@/lib/auth"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ModernSidebarProps {
  currentUser: User
  users: User[]
  groups: Group[]
}

export function ModernSidebar({ currentUser, users, groups }: ModernSidebarProps) {
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
    <SidebarProvider>
      <Sidebar className="border-r border-border">
        <SidebarHeader>
          <div className="flex items-center justify-between p-4">
            <KrushLogo />
            <SidebarTrigger />
          </div>
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* User Profile */}
          <SidebarGroup>
            <div className="flex items-center gap-3 px-4 py-2">
              <Avatar>
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Quick Actions */}
          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="New Chat">
                    <button className="flex items-center gap-3 w-full">
                      <MessageSquare className="h-4 w-4" />
                      <span>New Chat</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <CreateGroupDialog currentUser={currentUser} users={users}>
                    <SidebarMenuButton tooltip="Create Group">
                      <PlusCircle className="h-4 w-4" />
                      <span>New Group</span>
                    </SidebarMenuButton>
                  </CreateGroupDialog>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Contacts">
                    <Link href="/contacts" className="flex items-center gap-3 w-full">
                      <Users className="h-4 w-4" />
                      <span>Contacts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Groups */}
          <SidebarGroup>
            <SidebarGroupLabel>Groups ({filteredGroups.length})</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredGroups.map((group) => (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton asChild isActive={selectedGroupId === group.id} tooltip={group.name}>
                      <button onClick={() => selectGroup(group.id)} className="flex items-center gap-3 w-full">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={group.avatar || "/placeholder.svg"} alt={group.name} />
                          <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{group.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {group.members.length} members
                          </p>
                        </div>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">No groups found</div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Direct Messages */}
          <SidebarGroup>
            <SidebarGroupLabel>Direct Messages ({filteredUsers.length})</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredUsers.map((user) => (
                  <SidebarMenuItem key={user.id}>
                    <SidebarMenuButton asChild isActive={selectedUserId === user.id} tooltip={user.name}>
                      <button onClick={() => selectUser(user.id)} className="flex items-center gap-3 w-full">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white dark:border-slate-950",
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
                                ? `Last seen ${formatLastSeen(user.lastSeen)}`
                                : "Offline"}
                          </p>
                        </div>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">No users found</div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="p-4">
            <div className="flex justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/admin">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Admin</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Admin Dashboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href="/settings">
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogout}>
                      <LogOut className="h-5 w-5" />
                      <span className="sr-only">Logout</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
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
