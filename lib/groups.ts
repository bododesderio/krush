"use server"

import { v4 as uuidv4 } from "uuid"
import { getRedisClient } from "./redis"
import { revalidatePath } from "next/cache"
import type { User } from "./auth"

export type Group = {
  id: string
  name: string
  avatar: string
  createdBy: string
  createdAt: number
  members: string[]
}

export async function createGroup(formData: FormData): Promise<Group> {
  const name = formData.get("name") as string
  const createdBy = formData.get("createdBy") as string
  const members = JSON.parse(formData.get("members") as string) as string[]

  if (!name || !createdBy || !members || members.length === 0) {
    throw new Error("Missing required fields")
  }

  // Ensure creator is in the members list
  if (!members.includes(createdBy)) {
    members.push(createdBy)
  }

  const groupId = uuidv4()
  const timestamp = Date.now()
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`

  const group: Group = {
    id: groupId,
    name,
    avatar,
    createdBy,
    createdAt: timestamp,
    members,
  }

  const redis = getRedisClient()

  // Store group data
  await redis.hset(`group:${groupId}`, {
    name,
    avatar,
    createdBy,
    createdAt: timestamp,
    members: JSON.stringify(members),
  })

  // Add to groups list
  await redis.sadd("groups", groupId)

  // Add group to each member's groups
  for (const memberId of members) {
    await redis.sadd(`user:${memberId}:groups`, groupId)
  }

  revalidatePath("/")
  return group
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const redis = getRedisClient()
  const groupData = await redis.hgetall(`group:${groupId}`)

  if (!groupData || Object.keys(groupData).length === 0) {
    return null
  }

  return {
    id: groupId,
    name: groupData.name,
    avatar: groupData.avatar,
    createdBy: groupData.createdBy,
    createdAt: Number.parseInt(groupData.createdAt),
    members: JSON.parse(groupData.members),
  }
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const redis = getRedisClient()
  const groupIds = await redis.smembers(`user:${userId}:groups`)

  const groups: Group[] = []

  for (const groupId of groupIds) {
    const group = await getGroup(groupId)
    if (group) {
      groups.push(group)
    }
  }

  return groups
}

export async function addMemberToGroup(groupId: string, userId: string): Promise<void> {
  const redis = getRedisClient()
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Group not found")
  }

  if (group.members.includes(userId)) {
    return // User is already a member
  }

  // Add user to group members
  const updatedMembers = [...group.members, userId]
  await redis.hset(`group:${groupId}`, {
    members: JSON.stringify(updatedMembers),
  })

  // Add group to user's groups
  await redis.sadd(`user:${userId}:groups`, groupId)

  revalidatePath("/")
}

export async function removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
  const redis = getRedisClient()
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Group not found")
  }

  if (!group.members.includes(userId)) {
    return // User is not a member
  }

  // Remove user from group members
  const updatedMembers = group.members.filter((id) => id !== userId)
  await redis.hset(`group:${groupId}`, {
    members: JSON.stringify(updatedMembers),
  })

  // Remove group from user's groups
  await redis.srem(`user:${userId}:groups`, groupId)

  revalidatePath("/")
}

export async function deleteGroup(groupId: string): Promise<void> {
  const redis = getRedisClient()
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Group not found")
  }

  // Remove group from each member's groups
  for (const memberId of group.members) {
    await redis.srem(`user:${memberId}:groups`, groupId)
  }

  // Delete group messages
  const messageIds = await redis.zrange(`group:${groupId}:messages`, 0, -1)
  for (const messageId of messageIds) {
    await redis.del(`message:${messageId}`)
  }
  await redis.del(`group:${groupId}:messages`)

  // Delete group data
  await redis.del(`group:${groupId}`)

  // Remove from groups list
  await redis.srem("groups", groupId)

  revalidatePath("/")
}

export async function getGroupMembers(groupId: string): Promise<User[]> {
  const redis = getRedisClient()
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Group not found")
  }

  const members: User[] = []

  for (const memberId of group.members) {
    const userData = await redis.hgetall(`user:${memberId}`)

    if (userData && Object.keys(userData).length > 0) {
      members.push({
        id: memberId,
        name: userData.name,
        avatar: userData.avatar,
        online: userData.online === "true",
        lastSeen: userData.lastSeen ? Number.parseInt(userData.lastSeen) : undefined,
      })
    }
  }

  return members
}
