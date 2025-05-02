import { getAllUsersWithStats } from "@/lib/admin"
import { AdminUsersList } from "@/components/admin-users-list"

export default async function AdminUsersPage() {
  const users = await getAllUsersWithStats()

  return <AdminUsersList users={users} />
}
