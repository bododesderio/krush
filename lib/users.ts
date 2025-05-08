"use server"

import { getAllUsers, User } from "./auth"

export async function getUsers(): Promise<User[]> {
  try {
    return await getAllUsers()
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const users = await getAllUsers()
    return users.find(user => user.id === userId) || null
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error)
    return null
  }
}
