import { type User } from "@/lib/auth"
import { type Group } from "@/lib/groups"
import { UserList } from "@/components/user-list"
import { ChatHeader } from "@/components/chat-header"
import { ChatContainer } from "@/components/chat-container"

export interface ChatLayoutProps {
  currentUser: User
  users: User[]
  groups: Group[]
}

export async function ChatLayout({ currentUser, users, groups }: ChatLayoutProps) {
  // Filter out current user from users list if needed
  const otherUsers = users.filter((u) => u.id !== currentUser.id)

  return (
    <div className="flex h-screen bg-muted dark:bg-background">
      <div className="w-80 border-r border-border bg-background dark:bg-card">
        <UserList currentUser={currentUser} users={otherUsers} groups={groups} />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatHeader currentUser={currentUser} users={otherUsers} groups={groups} />
        <ChatContainer currentUser={currentUser} users={users} groups={groups} />
      </div>
    </div>
  )
}
