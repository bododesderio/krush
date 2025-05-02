"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import { createGroup } from "@/lib/groups"
import type { User } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface CreateGroupDialogProps {
  currentUser: User
  users: User[]
}

export function CreateGroupDialog({ currentUser, users }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!groupName.trim() || selectedUsers.length === 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("name", groupName)
      formData.append("createdBy", currentUser.id)
      formData.append("members", JSON.stringify([...selectedUsers, currentUser.id]))

      const group = await createGroup(formData)

      setOpen(false)
      setGroupName("")
      setSelectedUsers([])

      // Navigate to the new group
      router.push(`/?group=${group.id}`)
      router.refresh()
    } catch (error) {
      console.error("Failed to create group:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleUserToggle(userId: string) {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2">
          <Users className="h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Select Members</Label>
            <ScrollArea className="h-60 border rounded-md p-2">
              <div className="space-y-2">
                {users
                  .filter((user) => user.id !== currentUser.id)
                  .map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                      />
                      <Label htmlFor={`user-${user.id}`} className="flex items-center gap-2 cursor-pointer">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </Label>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            {users.length === 1 && (
              <p className="text-sm text-slate-500">No other users available to add to the group.</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !groupName.trim() || selectedUsers.length === 0}>
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
