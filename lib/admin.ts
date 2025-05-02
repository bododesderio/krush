"use server"

import { getRedisClient } from "./redis"
import { revalidatePath } from "next/cache"

export async function clearDatabase() {
  const redis = getRedisClient()

  // Get all user IDs
  const userIds = await redis.smembers("users")

  // Delete all user data
  for (const userId of userIds) {
    await redis.del(`user:${userId}`)
  }

  // Delete user sets
  await redis.del("users")
  await redis.del("users:emails")

  // Get all group IDs
  const groupIds = await redis.smembers("groups")

  // Delete all group data
  for (const groupId of groupIds) {
    // Delete group messages
    const messageIds = await redis.zrange(`group:${groupId}:messages`, 0, -1)
    for (const messageId of messageIds) {
      await redis.del(`message:${messageId}`)
    }
    await redis.del(`group:${groupId}:messages`)
    await redis.del(`group:${groupId}`)
  }

  // Delete groups set
  await redis.del("groups")

  // Delete all messages
  const messageKeys = await redis.keys("message:*")
  for (const key of messageKeys) {
    await redis.del(key)
  }

  // Delete all conversations
  const conversationKeys = await redis.keys("conversation:*")
  for (const key of conversationKeys) {
    await redis.del(key)
  }

  // Delete all typing indicators
  const typingKeys = await redis.keys("typing:*")
  for (const key of typingKeys) {
    await redis.del(key)
  }

  revalidatePath("/")
  return { success: true }
}

export async function getUserStats() {
  const redis = getRedisClient()

  const userIds = await redis.smembers("users")
  let activeUsers = 0
  let inactiveUsers = 0

  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

  for (const userId of userIds) {
    const userData = await redis.hgetall(`user:${userId}`)
    if (userData && userData.lastSeen) {
      const lastSeen = Number.parseInt(userData.lastSeen)
      if (lastSeen > oneWeekAgo) {
        activeUsers++
      } else {
        inactiveUsers++
      }
    } else {
      inactiveUsers++
    }
  }

  return {
    totalUsers: userIds.length,
    activeUsers,
    inactiveUsers,
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const redis = getRedisClient()
  const bcrypt = require("bcryptjs")

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update the user's password
  await redis.hset(`user:${userId}`, {
    password: hashedPassword,
  })

  return { success: true }
}

export async function getAllUsersWithStats() {
  const redis = getRedisClient()

  const userIds = await redis.smembers("users")
  const users = []

  for (const userId of userIds) {
    const userData = await redis.hgetall(`user:${userId}`)
    if (userData && Object.keys(userData).length > 0) {
      // Get message count
      const sentMessageKeys = await redis.keys(`conversation:${userId}:*`)
      let messageCount = 0

      for (const key of sentMessageKeys) {
        const count = await redis.zcard(key)
        messageCount += count
      }

      // Get last active time
      const lastSeen = userData.lastSeen ? Number.parseInt(userData.lastSeen) : 0
      const lastActive = new Date(lastSeen).toISOString()

      users.push({
        id: userId,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar,
        online: userData.online === "true",
        lastActive,
        messageCount,
        authProvider: userData.authProvider || "email",
      })
    }
  }

  return users
}

export async function getUserActivityData() {
  const redis = getRedisClient()

  const userIds = await redis.smembers("users")
  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

  // Activity by day of week (0 = Sunday, 6 = Saturday)
  const activityByDay = [0, 0, 0, 0, 0, 0, 0]

  // Activity by hour (0-23)
  const activityByHour = Array(24).fill(0)

  for (const userId of userIds) {
    const messageKeys = await redis.keys(`conversation:${userId}:*`)

    for (const key of messageKeys) {
      const messages = await redis.zrangebyscore(key, oneWeekAgo, now)

      for (const messageId of messages) {
        const messageData = await redis.hgetall(`message:${messageId}`)
        if (messageData && messageData.timestamp) {
          const timestamp = Number.parseInt(messageData.timestamp)
          const date = new Date(timestamp)
          const day = date.getDay()
          const hour = date.getHours()

          activityByDay[day]++
          activityByHour[hour]++
        }
      }
    }
  }

  return {
    activityByDay,
    activityByHour,
  }
}
