"use server"

import { revalidatePath } from "next/cache"
import { clearDatabase as clearFirebaseDatabase } from "./firebase-data-service"
import { db, database } from "./firebase"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore"
import * as bcrypt from "bcryptjs"

export async function clearDatabase() {
  try {
    const result = await clearFirebaseDatabase()
    revalidatePath("/")
    return result
  } catch (error) {
    console.error("Error clearing database:", error)
    return { success: false, error: "Failed to clear database" }
  }
}

export async function getUserStats() {
  try {
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    let activeUsers = 0
    let inactiveUsers = 0
    const totalUsers = usersSnapshot.size

    const now = Date.now()
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data()
      if (userData.lastSeen) {
        const lastSeen = userData.lastSeen instanceof Timestamp ?
          userData.lastSeen.toMillis() :
          Number(userData.lastSeen)

        if (lastSeen > oneWeekAgo) {
          activeUsers++
        } else {
          inactiveUsers++
        }
      } else {
        inactiveUsers++
      }
    })

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
    }
  } catch (error) {
    console.error("Error getting user stats:", error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
    }
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user's password
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      password: hashedPassword,
      updatedAt: serverTimestamp()
    })

    return { success: true }
  } catch (error) {
    console.error("Error resetting password:", error)
    return { success: false, error: "Failed to reset password" }
  }
}

export async function getAllUsersWithStats() {
  try {
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)
    const users = []

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id

      // Get message count
      const messagesRef = collection(db, "messages")
      const q = query(messagesRef, where("senderId", "==", userId))
      const messagesSnapshot = await getDocs(q)
      const messageCount = messagesSnapshot.size

      // Get last active time
      let lastActive = new Date().toISOString()
      if (userData.lastSeen) {
        const lastSeen = userData.lastSeen instanceof Timestamp ?
          userData.lastSeen.toMillis() :
          Number(userData.lastSeen)
        lastActive = new Date(lastSeen).toISOString()
      }

      users.push({
        id: userId,
        email: userData.email || "",
        name: userData.displayName || userData.name || "",
        avatar: userData.photoURL || userData.avatar || "",
        online: userData.online || false,
        lastActive,
        messageCount,
        authProvider: userData.authProvider || "email",
      })
    }

    return users
  } catch (error) {
    console.error("Error getting users with stats:", error)
    return []
  }
}

export async function getUserActivityData() {
  try {
    const now = Date.now()
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    // Activity by day of week (0 = Sunday, 6 = Saturday)
    const activityByDay = [0, 0, 0, 0, 0, 0, 0]

    // Activity by hour (0-23)
    const activityByHour = Array(24).fill(0)

    // Get all messages from the last week
    const messagesRef = collection(db, "messages")
    const messagesSnapshot = await getDocs(messagesRef)

    messagesSnapshot.forEach((messageDoc) => {
      const messageData = messageDoc.data()
      if (messageData.timestamp) {
        const timestamp = messageData.timestamp instanceof Timestamp ?
          messageData.timestamp.toMillis() :
          Number(messageData.timestamp)

        if (timestamp > oneWeekAgo) {
          const date = new Date(timestamp)
          const day = date.getDay()
          const hour = date.getHours()

          activityByDay[day]++
          activityByHour[hour]++
        }
      }
    })

    return {
      activityByDay,
      activityByHour,
    }
  } catch (error) {
    console.error("Error getting user activity data:", error)
    return {
      activityByDay: [0, 0, 0, 0, 0, 0, 0],
      activityByHour: Array(24).fill(0),
    }
  }
}
