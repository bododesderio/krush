import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SecuritySettings } from "@/components/security-settings"

export default async function SecuritySettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <SecuritySettings user={user} />
}
