"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, MoreHorizontal, Mail, Key, UserX, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { resetUserPassword } from "@/lib/admin"

interface User {
  id: string
  email: string
  name: string
  avatar: string
  online: boolean
  lastActive: string
  messageCount: number
  authProvider: string
}

interface AdminUsersListProps {
  users: User[]
}

export function AdminUsersList({ users: initialUsers }: AdminUsersListProps) {
  const [users, setUsers] = useState(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return

    setIsResetting(true)
    try {
      await resetUserPassword(selectedUser.id, newPassword)
      setResetSuccess(true)
      setTimeout(() => {
        setIsResetPasswordOpen(false)
        setSelectedUser(null)
        setNewPassword("")
        setResetSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to reset password:", error)
    } finally {
      setIsResetting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user accounts and reset passwords</CardDescription>
            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Auth Provider</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.online ? (
                            <Badge className="bg-green-500">Online</Badge>
                          ) : (
                            <Badge variant="outline">Offline</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.authProvider}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.lastActive)}</TableCell>
                        <TableCell>{user.messageCount}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsResetPasswordOpen(true)
                                }}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-500 focus:text-red-500">
                                <UserX className="h-4 w-4 mr-2" />
                                Disable Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {resetSuccess ? (
                <div className="flex items-center text-green-500 mt-2">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Password reset successful!
                </div>
              ) : (
                <>
                  Set a new password for {selectedUser?.name}
                  <div className="text-xs mt-1">{selectedUser?.email}</div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!resetSuccess && (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters long.</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 8 || isResetting}>
                  {isResetting ? <>Resetting...</> : <>Reset Password</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
