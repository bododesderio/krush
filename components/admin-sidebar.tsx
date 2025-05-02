"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { KrushLogo } from "@/components/krush-logo"
import { LayoutDashboard, Users, Settings, ArrowLeft, BarChart } from "lucide-react"

export function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      active: pathname === "/admin/users",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart,
      active: pathname === "/admin/analytics",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
  ]

  return (
    <div className="w-64 border-r border-border bg-background dark:bg-card p-4">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <KrushLogo size="sm" />
            <span className="font-semibold text-lg">Admin</span>
          </div>
        </div>

        <nav className="space-y-1 mb-8">
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

        <div className="mt-auto">
          <Link href="/">
            <Button variant="outline" className="w-full justify-start">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
