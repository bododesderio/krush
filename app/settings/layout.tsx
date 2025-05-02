import type React from "react"
import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsSidebar } from "@/components/settings-sidebar"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      <SettingsSidebar user={user} />
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
