"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { registerUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import Link from "next/link"

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      await registerUser(formData)
      router.push("/onboarding")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register")
    } finally {
      setIsLoading(false)
    }
  }

  function handleAvatarClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Join Krush</CardTitle>
        <CardDescription className="text-center">Create your account to start messaging</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                name="avatar"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">Click to upload profile picture</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="your.email@example.com" required />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input id="phoneNumber" name="phoneNumber" type="tel" placeholder="+1 (555) 123-4567" />
              <p className="text-xs text-muted-foreground">Adding a phone number helps your contacts find you</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="Enter your name" required />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea id="bio" name="bio" placeholder="Tell us a bit about yourself" rows={3} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full bg-krush hover:bg-krush-dark" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
          <p className="text-sm text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-krush hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
