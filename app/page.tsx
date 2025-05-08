import { redirect } from "next/navigation"
import { ChatLayout } from "@/components/chat-layout"
import { getGroups } from "@/lib/groups"
import { getUser } from "@/lib/auth"
import { getAllUsers } from "@/lib/auth"

export default async function Home() {
  // Get the user from our database using Firebase authentication
  const currentUser = await getUser()
  
  if (!currentUser) {
    redirect("/login")
  }

  // Get users and groups
  const users = await getAllUsers()
  const groups = await getGroups(currentUser.id)

  // Filter out current user from users list
  const filteredUsers = users.filter((user: { id: string }) => user.id !== currentUser.id)

  return <ChatLayout currentUser={currentUser} users={filteredUsers} groups={groups} />
}
