"use server"

import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { getRedisClient } from "./redis"
import * as bcrypt from "bcryptjs"

export type User = {
  id: string
  email: string
  name: string
  avatar: string
  bio?: string
  phoneNumber?: string
  online: boolean
  lastSeen?: number
  authProvider: "email" | "google" | "phone"
}

export async function getUser(): Promise<User | null> {
  const cookieStore = cookies()
  const userId = cookieStore.get("userId")?.value

  if (!userId) {
    return null
  }

  const redis = getRedisClient()
  const user = await redis.hgetall(`user:${userId}`)

  if (!user || Object.keys(user).length === 0) {
    return null
  }

  return {
    id: userId,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    phoneNumber: user.phoneNumber,
    online: user.online === "true",
    lastSeen: user.lastSeen ? Number.parseInt(user.lastSeen) : undefined,
    authProvider: (user.authProvider as "email" | "google" | "phone") || "email",
  }
}

export async function registerUser(formData: FormData): Promise<User> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const name = formData.get("name") as string
  const bio = (formData.get("bio") as string) || ""
  const phoneNumber = (formData.get("phoneNumber") as string) || ""
  const avatarFile = formData.get("avatar") as File | null

  // Validate inputs
  if (!email || !password || !name) {
    throw new Error("Email, password, and name are required")
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match")
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }

  if (name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters")
  }

  const redis = getRedisClient()

  // Check if email already exists
  const existingUserIds = await redis.smembers("users:emails")
  for (const userId of existingUserIds) {
    const userData = await redis.hgetall(`user:${userId}`)
    if (userData && userData.email === email) {
      throw new Error("Email already in use")
    }
  }

  // Check if phone number already exists (if provided)
  if (phoneNumber) {
    const existingPhoneUserIds = await redis.smembers("users:phones")
    for (const userId of existingPhoneUserIds) {
      const userData = await redis.hgetall(`user:${userId}`)
      if (userData && userData.phoneNumber === phoneNumber) {
        throw new Error("Phone number already in use")
      }
    }
  }

  const userId = uuidv4()

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Generate default avatar if none provided
  let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

  // In a real app, we would upload the avatar file to a storage service
  // For this demo, we'll use a data URL if provided
  if (avatarFile && avatarFile.size > 0) {
    try {
      const buffer = await avatarFile.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      const mimeType = avatarFile.type
      avatar = `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error("Error processing avatar:", error)
    }
  }

  // Store user data
  const userData: Record<string, string> = {
    email,
    password: hashedPassword,
    name,
    avatar,
    bio,
    online: "true",
    lastSeen: Date.now().toString(),
    authProvider: "email",
  }

  // Add phone number if provided
  if (phoneNumber) {
    userData.phoneNumber = phoneNumber
  }

  await redis.hset(`user:${userId}`, userData)

  // Add to users list
  await redis.sadd("users", userId)

  // Add to emails list for lookup
  await redis.sadd("users:emails", userId)

  // Add to phones list for lookup if phone number provided
  if (phoneNumber) {
    await redis.sadd("users:phones", userId)
  }

  // Set cookie
  cookies().set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return {
    id: userId,
    email,
    name,
    avatar,
    bio,
    phoneNumber,
    online: true,
    lastSeen: Date.now(),
    authProvider: "email",
  }
}

export async function loginUser(formData: FormData): Promise<User> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  const redis = getRedisClient()

  // Find user by email
  const userIds = await redis.smembers("users:emails")
  let userId: string | null = null
  let userData: Record<string, string> | null = null

  for (const id of userIds) {
    const user = await redis.hgetall(`user:${id}`)
    if (user && user.email === email) {
      userId = id
      userData = user
      break
    }
  }

  if (!userId || !userData) {
    throw new Error("Invalid email or password")
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, userData.password)
  if (!isPasswordValid) {
    throw new Error("Invalid email or password")
  }

  // Update user status
  await redis.hset(`user:${userId}`, {
    online: "true",
    lastSeen: Date.now(),
  })

  // Set cookie
  cookies().set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return {
    id: userId,
    email: userData.email,
    name: userData.name,
    avatar: userData.avatar,
    bio: userData.bio,
    phoneNumber: userData.phoneNumber,
    online: true,
    lastSeen: Date.now(),
    authProvider: (userData.authProvider as "email" | "google" | "phone") || "email",
  }
}

export async function loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User> {
  if (!phoneNumber) {
    throw new Error("Phone number is required")
  }

  // In a real app, we would verify the code with a service like Twilio
  // For this demo, we'll accept any code
  if (!verificationCode || verificationCode.length !== 6) {
    throw new Error("Invalid verification code")
  }

  const redis = getRedisClient()

  // Find user by phone number
  const userIds = await redis.smembers("users:phones")
  let userId: string | null = null
  let userData: Record<string, string> | null = null

  for (const id of userIds) {
    const user = await redis.hgetall(`user:${id}`)
    if (user && user.phoneNumber === phoneNumber) {
      userId = id
      userData = user
      break
    }
  }

  // If user doesn't exist, create a new one
  if (!userId) {
    userId = uuidv4()

    // Generate a name from the phone number
    const name = `User ${phoneNumber.substring(phoneNumber.length - 4)}`

    // Generate an avatar
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(phoneNumber)}`

    await redis.hset(`user:${userId}`, {
      phoneNumber,
      name,
      avatar,
      email: "",
      bio: "",
      online: "true",
      lastSeen: Date.now().toString(),
      authProvider: "phone",
    })

    // Add to users list
    await redis.sadd("users", userId)

    // Add to phones list for lookup
    await redis.sadd("users:phones", userId)

    userData = {
      phoneNumber,
      name,
      avatar,
      email: "",
      bio: "",
      online: "true",
      lastSeen: Date.now().toString(),
      authProvider: "phone",
    }
  } else {
    // Update user status
    await redis.hset(`user:${userId}`, {
      online: "true",
      lastSeen: Date.now().toString(),
    })
  }

  // Set cookie
  cookies().set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return {
    id: userId,
    email: userData.email || "",
    name: userData.name,
    avatar: userData.avatar,
    bio: userData.bio,
    phoneNumber: userData.phoneNumber,
    online: true,
    lastSeen: Date.now(),
    authProvider: "phone",
  }
}

export async function loginWithGoogle(googleUser: { email: string; name: string; picture: string }): Promise<User> {
  const { email, name, picture } = googleUser

  if (!email) {
    throw new Error("Email is required")
  }

  const redis = getRedisClient()

  // Check if user already exists
  const userIds = await redis.smembers("users:emails")
  let userId: string | null = null

  for (const id of userIds) {
    const userData = await redis.hgetall(`user:${id}`)
    if (userData && userData.email === email) {
      userId = id
      break
    }
  }

  // If user doesn't exist, create a new one
  if (!userId) {
    userId = uuidv4()

    await redis.hset(`user:${userId}`, {
      email,
      name,
      avatar: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      online: "true",
      lastSeen: Date.now().toString(),
      authProvider: "google",
    })

    // Add to users list
    await redis.sadd("users", userId)

    // Add to emails list for lookup
    await redis.sadd("users:emails", userId)
  } else {
    // Update user status
    await redis.hset(`user:${userId}`, {
      online: "true",
      lastSeen: Date.now().toString(),
    })
  }

  // Set cookie
  cookies().set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  const userData = await redis.hgetall(`user:${userId}`)

  return {
    id: userId,
    email: userData.email,
    name: userData.name,
    avatar: userData.avatar,
    bio: userData.bio,
    phoneNumber: userData.phoneNumber,
    online: true,
    lastSeen: Date.now(),
    authProvider: (userData.authProvider as "email" | "google" | "phone") || "google",
  }
}

export async function logoutUser() {
  const cookieStore = cookies()
  const userId = cookieStore.get("userId")?.value

  if (userId) {
    const redis = getRedisClient()

    // Update user status
    await redis.hset(`user:${userId}`, {
      online: "false",
      lastSeen: Date.now(),
    })

    // Delete cookie
    cookies().delete("userId")
  }
}

export async function updateUserProfile(userId: string, formData: FormData): Promise<User> {
  const name = formData.get("name") as string
  const bio = formData.get("bio") as string
  const phoneNumber = formData.get("phoneNumber") as string
  const avatarFile = formData.get("avatar") as File | null

  if (!name || name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters")
  }

  const redis = getRedisClient()
  const userData = await redis.hgetall(`user:${userId}`)

  if (!userData || Object.keys(userData).length === 0) {
    throw new Error("User not found")
  }

  // Use existing avatar by default
  let avatar = userData.avatar

  // Process new avatar if provided
  if (avatarFile && avatarFile.size > 0) {
    try {
      const buffer = await avatarFile.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      const mimeType = avatarFile.type
      avatar = `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error("Error processing avatar:", error)
    }
  }

  const updatedData: Record<string, string> = {
    name,
    bio: bio || "",
    avatar,
  }

  // Update phone number if provided and different
  if (phoneNumber && phoneNumber !== userData.phoneNumber) {
    // Check if phone number is already in use
    const existingPhoneUserIds = await redis.smembers("users:phones")
    for (const id of existingPhoneUserIds) {
      if (id !== userId) {
        const user = await redis.hgetall(`user:${id}`)
        if (user && user.phoneNumber === phoneNumber) {
          throw new Error("Phone number already in use")
        }
      }
    }

    updatedData.phoneNumber = phoneNumber

    // Add to phones list for lookup
    await redis.sadd("users:phones", userId)
  }

  await redis.hset(`user:${userId}`, updatedData)

  return {
    id: userId,
    email: userData.email,
    name,
    avatar,
    bio,
    phoneNumber: updatedData.phoneNumber || userData.phoneNumber,
    online: userData.online === "true",
    lastSeen: userData.lastSeen ? Number.parseInt(userData.lastSeen) : undefined,
    authProvider: (userData.authProvider as "email" | "google" | "phone") || "email",
  }
}

export async function updatePassword(userId: string, formData: FormData): Promise<void> {
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("All password fields are required")
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match")
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters")
  }

  const redis = getRedisClient()
  const userData = await redis.hgetall(`user:${userId}`)

  if (!userData || Object.keys(userData).length === 0) {
    throw new Error("User not found")
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, userData.password)
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect")
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password
  await redis.hset(`user:${userId}`, {
    password: hashedPassword,
  })
}

export async function getAllUsers(): Promise<User[]> {
  const redis = getRedisClient()
  const userIds = await redis.smembers("users")

  const users: User[] = []

  for (const userId of userIds) {
    const userData = await redis.hgetall(`user:${userId}`)

    if (userData && Object.keys(userData).length > 0) {
      users.push({
        id: userId,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        bio: userData.bio,
        phoneNumber: userData.phoneNumber,
        online: userData.online === "true",
        lastSeen: userData.lastSeen ? Number.parseInt(userData.lastSeen) : undefined,
        authProvider: (userData.authProvider as "email" | "google" | "phone") || "email",
      })
    }
  }

  return users
}
