import { getUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GeneralSettings } from "@/components/general-settings"

export default async function GeneralSettingsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return <GeneralSettings user={user} />
}
