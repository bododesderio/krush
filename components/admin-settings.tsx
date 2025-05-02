"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Database, Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react"

interface AdminSettingsProps {
  clearDatabase: () => Promise<{ success: boolean }>
}

export function AdminSettings({ clearDatabase }: AdminSettingsProps) {
  const [isClearing, setIsClearing] = useState(false)
  const [clearSuccess, setClearSuccess] = useState(false)
  const [clearError, setClearError] = useState(false)

  const handleClearDatabase = async () => {
    setIsClearing(true)
    setClearSuccess(false)
    setClearError(false)

    try {
      const result = await clearDatabase()
      if (result.success) {
        setClearSuccess(true)
      } else {
        setClearError(true)
      }
    } catch (error) {
      console.error("Failed to clear database:", error)
      setClearError(true)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
      </div>

      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Manage your database settings and operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Danger Zone</AlertTitle>
                <AlertDescription>
                  The following actions are destructive and cannot be undone. Make sure you have a backup before
                  proceeding.
                </AlertDescription>
              </Alert>

              <div className="rounded-md border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">Clear Database</h3>
                    <p className="text-sm text-muted-foreground">
                      Delete all users, messages, and conversations from the database.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Database
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all users, messages, and
                          conversations from the database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearDatabase}
                          disabled={isClearing}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {isClearing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Clearing...
                            </>
                          ) : (
                            <>Clear Database</>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {clearSuccess && (
                  <div className="mt-4 flex items-center text-green-500">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Database cleared successfully!
                  </div>
                )}

                {clearError && (
                  <div className="mt-4 flex items-center text-red-500">
                    <XCircle className="h-5 w-5 mr-2" />
                    Failed to clear database. Please try again.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Migration</CardTitle>
              <CardDescription>Migrate your data to MySQL or other database systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Migrating to MySQL</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Follow these steps to migrate your Redis data to MySQL:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Set up a MySQL server and create a new database for Krush</li>
                  <li>
                    Install the required dependencies: <code>mysql2</code> and <code>sequelize</code>
                  </li>
                  <li>Create MySQL models that match your Redis data structure</li>
                  <li>Export your Redis data using the export tool below</li>
                  <li>Import the exported data into MySQL using the migration script</li>
                  <li>Update your application to use MySQL instead of Redis</li>
                </ol>

                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">MySQL Connection String</h4>
                  <Textarea
                    placeholder="mysql://username:password@localhost:3306/krush_db"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your MySQL connection string to test the connection.
                  </p>
                </div>

                <div className="flex justify-end mt-4">
                  <Button variant="outline" className="mr-2">
                    Test Connection
                  </Button>
                  <Button>
                    <Database className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Migration Notes</h3>
                <div className="text-sm space-y-2">
                  <p>
                    <strong>Redis to MySQL Schema Mapping:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>
                      <code>user:{id}</code> → <code>users</code> table
                    </li>
                    <li>
                      <code>message:{id}</code> → <code>messages</code> table
                    </li>
                    <li>
                      <code>group:{id}</code> → <code>groups</code> table
                    </li>
                    <li>
                      <code>
                        conversation:{userId1}:{userId2}
                      </code>{" "}
                      → <code>conversations</code> table
                    </li>
                  </ul>

                  <p className="mt-2">
                    <strong>Important Considerations:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Ensure proper indexing on frequently queried fields</li>
                    <li>Set up foreign key constraints for data integrity</li>
                    <li>Update your application code to use SQL queries instead of Redis commands</li>
                    <li>Consider using an ORM like Sequelize or Prisma for easier database interactions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Create and manage backups of your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">Create Backup</h3>
                    <p className="text-sm text-muted-foreground">Create a backup of your current database state.</p>
                  </div>
                  <Button>Create Backup</Button>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-2">Restore from Backup</h3>
                <p className="text-sm text-muted-foreground mb-4">Select a backup file to restore your database.</p>

                <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag and drop a backup file here, or click to select a file
                    </p>
                    <Button variant="outline" className="mt-2">
                      Select Backup File
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
