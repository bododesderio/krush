import type React from "react"
import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  // In a real app, you would check if the user is an admin
  // For this demo, we'll allow any logged-in user to access the admin dashboard

  return (
    <div className="flex min-h-screen bg-muted dark:bg-background">
      <AdminSidebar />
      <div className="flex-1 p-6 overflow-auto">{children}</div>
    </div>
  )
}
