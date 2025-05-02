"use client"

import type { User } from "@/lib/auth"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserIcon, Settings, Shield, ArrowLeft } from "lucide-react"

interface SettingsSidebarProps {
  user: User
}

export function SettingsSidebar({ user }: SettingsSidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Profile",
      href: "/settings",
      icon: UserIcon,
      active: pathname === "/settings",
    },
    {
      name: "General",
      href: "/settings/general",
      icon: Settings,
      active: pathname === "/settings/general",
    },
    {
      name: "Security",
      href: "/settings/security",
      icon: Shield,
      active: pathname === "/settings/security",
    },
  ]

  return (
    <div className="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to chat</span>
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>

        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-20 w-20 mb-2">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-medium">{user.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn("w-full justify-start", item.active && "bg-accent dark:bg-accent font-medium")}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
