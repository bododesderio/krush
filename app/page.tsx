import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { ChatLayout } from "@/components/chat-layout"
import { getUsers } from "@/lib/users"
import { getGroups } from "@/lib/groups"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login")
  }

  // Get users and groups
  const users = await getUsers()
  const groups = await getGroups(session.user.id)

  // Filter out current user from users list
  const filteredUsers = users.filter((user) => user.id !== session.user.id)

  return <ChatLayout currentUser={session.user} users={filteredUsers} groups={groups} />
}
