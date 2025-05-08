"use server"

import { cookies } from "next/headers"
import * as bcrypt from "bcryptjs"
import {
  getUserById,
  getUserByEmail,
  getUserByPhone,
  createUser,
  updateUserStatus,
  getAllUsers as getAllFirebaseUsers
} from "./firebase-data-service"
import { db } from "./firebase"
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore"

// Helper function to handle cookies safely
export async function getCookieStore() {
  return await cookies()
}

export type User = {
  id: string
  email: string
  name: string
  avatar: string
  bio?: string
  phoneNumber?: string
  online: boolean
  lastSeen?: number | Promise<number>
  authProvider: "email" | "google" | "phone"
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await getCookieStore()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      return null
    }

    const user = await getUserById(userId)
    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      online: user.online,
      lastSeen: typeof user.lastSeen === 'number' ? user.lastSeen : user.lastSeen ? await user.lastSeen : undefined,
      authProvider: user.authProvider as "email" | "google" | "phone",
    }
  } catch (error) {
    console.error("Error in getUser:", error)
    return null
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

  // Check if email already exists
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    throw new Error("Email already in use")
  }

  // Check if phone number already exists (if provided)
  if (phoneNumber) {
    const existingPhoneUser = await getUserByPhone(phoneNumber)
    if (existingPhoneUser) {
      throw new Error("Phone number already in use")
    }
  }

  // Hash the password
  // const hashedPassword = await bcrypt.hash(password, 10)

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

  // Create user in Firebase
  const user = await createUser({
    email,
    password,
    name,
    avatar,
    bio,
    phoneNumber,
    authProvider: "email"
  })

  // Set cookie
  const cookieStore = await getCookieStore()
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return {
    ...user,
    authProvider: "email" as const,
  }
}

export async function loginUser(formData: FormData): Promise<User> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  // Find user by email
  const user = await getUserByEmail(email)

  if (!user) {
    throw new Error("Invalid email or password")
  }

  // Get the full user document to access the password
  const userRef = doc(db, "users", user.id)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error("Invalid email or password")
  }

  const userData = userDoc.data()

  // Verify password
  if (!userData.password) {
    throw new Error("Invalid email or password")
  }

  const isPasswordValid = await bcrypt.compare(password, userData.password)
  if (!isPasswordValid) {
    throw new Error("Invalid email or password")
  }

  // Update user status
  await updateUserStatus(user.id, true)

  // Set cookie
  const cookieStore = await getCookieStore()
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return {
    ...user,
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

  // Find user by phone number
  let user = await getUserByPhone(phoneNumber)

  // If user doesn't exist, create a new one
  if (!user) {
    // Generate a name from the phone number
    const name = `User ${phoneNumber.substring(phoneNumber.length - 4)}`

    // Generate an avatar
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(phoneNumber)}`

    // Create user in Firebase
    const newUser = await createUser({
      phoneNumber,
      name,
      avatar,
      email: "",
      bio: "",
      authProvider: "phone"
    })

    if (!newUser) {
      throw new Error("Failed to create user")
    }

    user = {
      id: newUser.id,
      email: newUser.email || "",
      name: newUser.name,
      avatar: newUser.avatar,
      bio: newUser.bio,
      phoneNumber: newUser.phoneNumber,
      online: true,
      lastSeen: typeof newUser.lastSeen === 'number' ? Promise.resolve(newUser.lastSeen) : Promise.resolve(Date.now()),
      authProvider: "phone" as const
    }
  } else {
    // Update user status
    await updateUserStatus(user.id, true)

    user = {
      id: user.id,
      email: user.email || "",
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      online: true,
      lastSeen: typeof user.lastSeen === 'number' ? Promise.resolve(user.lastSeen) : Promise.resolve(Date.now()),
      authProvider: "phone" as const
    }
  }

  if (!user) {
    throw new Error("Failed to create or retrieve user")
  }

  // Set cookie
  const cookieStore = await getCookieStore()
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return user as User
}

export async function loginWithGoogle(googleUser: { email: string; name: string; picture: string }): Promise<User> {
  const { email, name, picture } = googleUser

  if (!email) {
    throw new Error("Email is required")
  }

  // Check if user already exists
  let user = await getUserByEmail(email)

  // If user doesn't exist, create a new one
  if (!user) {
    // Create user in Firebase
    const newUser = await createUser({
      email,
      name,
      avatar: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      bio: "",
      authProvider: "google"
    })

    if (!newUser) {
      throw new Error("Failed to create user")
    }

    user = {
      id: newUser.id,
      email: newUser.email || "",
      name: newUser.name,
      avatar: newUser.avatar,
      bio: newUser.bio,
      phoneNumber: newUser.phoneNumber,
      online: true,
      lastSeen: typeof newUser.lastSeen === 'number' ? Promise.resolve(newUser.lastSeen) : Promise.resolve(Date.now()),
      authProvider: "google" as const
    }
  } else {
    // Update user status
    await updateUserStatus(user.id, true)

    user = {
      id: user.id,
      email: user.email || "",
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      phoneNumber: user.phoneNumber,
      online: true,
      lastSeen: typeof user.lastSeen === 'number' ? Promise.resolve(user.lastSeen) : Promise.resolve(Date.now()),
      authProvider: "google" as const
    }
  }

  if (!user) {
    throw new Error("Failed to create or retrieve user")
  }

  // Set cookie
  const cookieStore = await getCookieStore()
  cookieStore.set("userId", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return user as User
}

export async function logoutUser() {
  const cookieStore = await getCookieStore()
  const userId = cookieStore.get("userId")?.value

  if (userId) {
    // Update user status
    await updateUserStatus(userId, false)

    // Delete cookie
    cookieStore.delete("userId")
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

  // Get current user data
  const user = await getUserById(userId)

  if (!user) {
    throw new Error("User not found")
  }

  // Use existing avatar by default
  let avatar = user.avatar

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

  // Update phone number if provided and different
  if (phoneNumber && phoneNumber !== user.phoneNumber) {
    // Check if phone number is already in use
    const existingPhoneUser = await getUserByPhone(phoneNumber)
    if (existingPhoneUser && existingPhoneUser.id !== userId) {
      throw new Error("Phone number already in use")
    }
  }

  // Update user in Firebase
  const userRef = doc(db, "users", userId)
  await updateDoc(userRef, {
    displayName: name,
    name: name,
    bio: bio || "",
    avatar: avatar,
    photoURL: avatar,
    phoneNumber: phoneNumber || user.phoneNumber || "",
    updatedAt: serverTimestamp()
  })

  // Get updated user data
  const updatedUserDoc = await getDoc(userRef)
  if (!updatedUserDoc.exists()) {
    throw new Error("Failed to update user")
  }

  const userData = updatedUserDoc.data()

  return {
    id: userId,
    email: userData.email || "",
    name: userData.displayName || userData.name || "",
    avatar: userData.photoURL || userData.avatar || "",
    bio: userData.bio || undefined,
    phoneNumber: userData.phoneNumber || undefined,
    online: userData.online || false,
    lastSeen: userData.lastSeen ?
      (typeof userData.lastSeen === 'number' ?
        userData.lastSeen :
        userData.lastSeen.toMillis ?
          userData.lastSeen.toMillis() :
          Date.now()) :
      Date.now(),
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

  // Get user document to verify password
  const userRef = doc(db, "users", userId)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error("User not found")
  }

  const userData = userDoc.data()

  // Verify current password
  if (!userData.password) {
    throw new Error("Current password is incorrect")
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, userData.password)
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect")
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password
  await updateDoc(userRef, {
    password: hashedPassword,
    updatedAt: serverTimestamp()
  })
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await getAllFirebaseUsers()
    return users
  } catch (error) {
    console.error("Error in getAllUsers:", error)
    return []
  }
}

export async function setUserCookie(userId: string) {
  const cookieStore = await getCookieStore()
  cookieStore.set("userId", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })
}
