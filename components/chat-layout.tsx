import { type User, getAllUsers } from "@/lib/auth"
import { getUserGroups } from "@/lib/groups"
import { UserList } from "@/components/user-list"
import { ChatHeader } from "@/components/chat-header"
import { ChatContainer } from "@/components/chat-container"

interface ChatLayoutProps {
  user: User
}

export async function ChatLayout({ user }: ChatLayoutProps) {
  const allUsers = await getAllUsers()
  const otherUsers = allUsers.filter((u) => u.id !== user.id)
  const groups = await getUserGroups(user.id)

  return (
    <div className="flex h-screen bg-muted dark:bg-background">
      <div className="w-80 border-r border-border bg-background dark:bg-card">
        <UserList currentUser={user} users={otherUsers} groups={groups} />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatHeader currentUser={user} users={otherUsers} groups={groups} />
        <ChatContainer currentUser={user} users={allUsers} groups={groups} />
      </div>
    </div>
  )
}
