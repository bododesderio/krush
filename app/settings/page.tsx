import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProfileSettings } from "@/components/profile-settings"

export default async function SettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <ProfileSettings user={user} />
}
