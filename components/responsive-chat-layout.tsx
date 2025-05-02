"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ModernSidebar } from "./modern-sidebar"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResponsiveChatLayoutProps {
  currentUser: User
  users: User[]
  groups: Group[]
  children: React.ReactNode
}

export function ResponsiveChatLayout({ currentUser, users, groups, children }: ResponsiveChatLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const searchParams = useSearchParams()
  const selectedUserId = searchParams.get("user")
  const selectedGroupId = searchParams.get("group")
  const hasActiveChat = !!selectedUserId || !!selectedGroupId

  // Automatically close sidebar when a chat is selected on mobile
  useEffect(() => {
    if (window.innerWidth < 768 && (selectedUserId || selectedGroupId)) {
      setMobileSidebarOpen(false)
    }
  }, [selectedUserId, selectedGroupId])

  return (
    <div className="flex h-screen bg-muted dark:bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-80 lg:w-96">
        <ModernSidebar currentUser={currentUser} users={users} groups={groups} />
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transform transition-transform duration-200 ease-in-out",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-full w-80">
          <ModernSidebar currentUser={currentUser} users={users} groups={groups} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden flex items-center border-b border-border h-16 px-4">
          {hasActiveChat ? (
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          )}
          <div className="ml-4">
            <KrushLogo size="sm" />
          </div>
        </div>

        {/* Mobile overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

function KrushLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn("font-bold text-krush", {
        "text-lg": size === "sm",
        "text-xl": size === "md",
        "text-2xl": size === "lg",
      })}
    >
      KRUSH
    </div>
  )
}
