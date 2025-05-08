"use server"

import { revalidatePath } from "next/cache"
import type { User } from "./auth"
import {
  createGroup as createFirebaseGroup,
  getGroup as getFirebaseGroup,
  getUserGroups as getFirebaseUserGroups,
  addMemberToGroup as addFirebaseMemberToGroup,
  getGroupMembers as getFirebaseGroupMembers
} from "./firebase-data-service"
import { db } from "./firebase"
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayRemove,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore"

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

  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`

  // Create group in Firebase
  const group = await createFirebaseGroup({
    name,
    avatar,
    createdBy,
    members
  })

  revalidatePath("/")
  return group
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const group = await getFirebaseGroup(groupId)
  if (!group) return null

  return {
    ...group,
    createdAt: typeof group.createdAt === 'number' ?
      group.createdAt :
      await Promise.resolve(group.createdAt)
  } as Group
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const groups = await getFirebaseUserGroups(userId)

  return Promise.all(groups.map(async (group) => ({
    ...group,
    createdAt: typeof group.createdAt === 'number' ?
      group.createdAt :
      await Promise.resolve(group.createdAt)
  }))) as Promise<Group[]>
}

// Alias for getUserGroups to match the import in app/page.tsx
export const getGroups = getUserGroups;

export async function addMemberToGroup(groupId: string, userId: string): Promise<void> {
  await addFirebaseMemberToGroup(groupId, userId)
  revalidatePath("/")
}

export async function removeMemberFromGroup(groupId: string, userId: string): Promise<void> {
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Group not found")
  }

  if (!group.members.includes(userId)) {
    return // User is not a member
  }

  // Remove user from group members
  const groupRef = doc(db, "groups", groupId)
  await updateDoc(groupRef, {
    members: arrayRemove(userId)
  })

  // Remove group from user's groups
  const userRef = doc(db, "users", userId)
  const userDoc = await getDoc(userRef)

  if (userDoc.exists()) {
    await updateDoc(userRef, {
      groups: arrayRemove(groupId)
    })
  }

  revalidatePath("/")
}

export async function deleteGroup(groupId: string): Promise<void> {
  const group = await getGroup(groupId)

  if (!group) {
    throw new Error("Group not found")
  }

  // Remove group from each member's groups
  for (const memberId of group.members) {
    const userRef = doc(db, "users", memberId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        groups: arrayRemove(groupId)
      })
    }
  }

  // Delete group messages
  const messagesRef = collection(db, "messages")
  const q = query(messagesRef, where("groupId", "==", groupId))
  const messagesSnapshot = await getDocs(q)

  for (const messageDoc of messagesSnapshot.docs) {
    await deleteDoc(doc(db, "messages", messageDoc.id))
  }

  // Delete group data
  await deleteDoc(doc(db, "groups", groupId))

  revalidatePath("/")
}

export async function getGroupMembers(groupId: string): Promise<User[]> {
  return await getFirebaseGroupMembers(groupId)
}
