import { getUserStats, getUserActivityData } from "@/lib/admin"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const stats = await getUserStats()
  const activityData = await getUserActivityData()

  return <AdminDashboard stats={stats} activityData={activityData} />
}
