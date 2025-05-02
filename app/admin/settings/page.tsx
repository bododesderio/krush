import { clearDatabase } from "@/lib/admin"
import { AdminSettings } from "@/components/admin-settings"

export default function AdminSettingsPage() {
  return <AdminSettings clearDatabase={clearDatabase} />
}
