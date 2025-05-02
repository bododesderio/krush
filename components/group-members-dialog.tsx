"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserPlus, UserMinus } from "lucide-react"
import { getGroupMembers, addMemberToGroup, removeMemberFromGroup } from "@/lib/groups"
import type { User } from "@/lib/auth"
import type { Group } from "@/lib/groups"

interface GroupMembersDialogProps {
  group: Group
  currentUser: User
  allUsers: User[]
}

export function GroupMembersDialog({ group, currentUser, allUsers }: GroupMembersDialogProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (open) {
      loadMembers()
    }
  }, [open])

  useEffect(() => {
    setIsAdmin(group.createdBy === currentUser.id)
  }, [group, currentUser])

  async function loadMembers() {
    setIsLoading(true)
    try {
      const groupMembers = await getGroupMembers(group.id)
      setMembers(groupMembers)
    } catch (error) {
      console.error("Failed to load group members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddMember(userId: string) {
    try {
      await addMemberToGroup(group.id, userId)
      await loadMembers()
    } catch (error) {
      console.error("Failed to add member:", error)
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeMemberFromGroup(group.id, userId)
      await loadMembers()
    } catch (error) {
      console.error("Failed to remove member:", error)
    }
  }

  const nonMembers = allUsers.filter((user) => !group.members.includes(user.id) && user.id !== currentUser.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
          <span className="sr-only">Group Members</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-4 text-center">Loading members...</div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-60 border rounded-md p-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium mb-2">Current Members ({members.length})</h3>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                      {member.id === group.createdBy && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    {isAdmin && member.id !== currentUser.id && member.id !== group.createdBy && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-8 w-8 p-0"
                      >
                        <UserMinus className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {isAdmin && nonMembers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Add Members</h3>
                <ScrollArea className="h-40 border rounded-md p-2">
                  <div className="space-y-2">
                    {nonMembers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddMember(user.id)}
                          className="h-8 w-8 p-0"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span className="sr-only">Add</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
