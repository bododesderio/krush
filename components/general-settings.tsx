"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"

interface GeneralSettingsProps {
  user: User
}

export function GeneralSettings({ user }: GeneralSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  const [settings, setSettings] = useState({
    notifications: true,
    sounds: true,
    readReceipts: true,
    typingIndicators: true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(null)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, you would save these settings to the database
    setSuccess("Settings updated successfully")
    setIsLoading(false)
  }

  function handleToggle(setting: keyof typeof settings) {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Manage your app preferences</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Appearance</h3>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={() => handleToggle("notifications")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sounds">Notification Sounds</Label>
                <p className="text-sm text-muted-foreground">Play sounds for new messages</p>
              </div>
              <Switch id="sounds" checked={settings.sounds} onCheckedChange={() => handleToggle("sounds")} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Privacy</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="readReceipts">Read Receipts</Label>
                <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
              </div>
              <Switch
                id="readReceipts"
                checked={settings.readReceipts}
                onCheckedChange={() => handleToggle("readReceipts")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="typingIndicators">Typing Indicators</Label>
                <p className="text-sm text-muted-foreground">Show when you're typing a message</p>
              </div>
              <Switch
                id="typingIndicators"
                checked={settings.typingIndicators}
                onCheckedChange={() => handleToggle("typingIndicators")}
              />
            </div>
          </div>

          {success && <p className="text-sm text-green-500">{success}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
