"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginWithPhone } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export function PhoneLoginForm() {
  const [step, setStep] = useState<"phone" | "verification">("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 10) {
        throw new Error("Please enter a valid phone number")
      }

      // In a real app, this would send a verification code via SMS
      // For this demo, we'll just move to the next step

      toast({
        title: "Verification Code Sent",
        description: `A verification code has been sent to ${phoneNumber}`,
      })

      setStep("verification")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // In a real app, this would verify the code with a service like Twilio
      await loginWithPhone(phoneNumber, verificationCode)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Login with Phone</CardTitle>
        <CardDescription className="text-center">
          {step === "phone"
            ? "Enter your phone number to receive a verification code"
            : "Enter the verification code sent to your phone"}
        </CardDescription>
      </CardHeader>

      {step === "phone" ? (
        <form onSubmit={handleSendCode}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-krush hover:bg-krush-dark" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Code...
                </>
              ) : (
                <>
                  Send Code <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-sm text-center">
              Don't have an account?{" "}
              <Link href="/register" className="text-krush hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-krush hover:bg-krush-dark" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify & Login"
              )}
            </Button>

            <Button
              variant="ghost"
              type="button"
              className="w-full"
              onClick={() => setStep("phone")}
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
