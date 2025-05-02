"use server"

import { getRedisClient } from "./redis"
import { getUser } from "./auth"

export type Contact = {
  id: string
  name: string
  phoneNumber: string
  email?: string
}

// Get all contacts for the current user
export async function getContacts(): Promise<Contact[]> {
  const user = await getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const redis = getRedisClient()

  try {
    // Get contact IDs for the user
    const contactIds = await redis.smembers(`user:${user.id}:contacts`)

    const contacts: Contact[] = []

    for (const contactId of contactIds) {
      const contactData = await redis.hgetall(`contact:${contactId}`)

      if (contactData && Object.keys(contactData).length > 0) {
        contacts.push({
          id: contactId,
          name: contactData.name,
          phoneNumber: contactData.phoneNumber,
          email: contactData.email,
        })
      }
    }

    return contacts
  } catch (error) {
    console.error("Error fetching contacts:", error)
    throw new Error("Failed to fetch contacts")
  }
}

// Add a contact for the current user
export async function addContact(contact: Omit<Contact, "id">): Promise<Contact> {
  const user = await getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const redis = getRedisClient()

  try {
    // Generate a unique ID for the contact
    const contactId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Store contact data
    await redis.hset(`contact:${contactId}`, {
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
      userId: user.id,
    })

    // Add to user's contacts
    await redis.sadd(`user:${user.id}:contacts`, contactId)

    return {
      id: contactId,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
    }
  } catch (error) {
    console.error("Error adding contact:", error)
    throw new Error("Failed to add contact")
  }
}

// Send an invitation to a contact
export async function inviteContact(contact: Contact): Promise<void> {
  const user = await getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const redis = getRedisClient()

  try {
    // In a real app, this would send an SMS or email invitation
    // For now, we'll just record the invitation in Redis

    await redis.hset(`invitation:${contact.id}`, {
      fromUserId: user.id,
      fromUserName: user.name,
      toContactName: contact.name,
      toContactPhone: contact.phoneNumber,
      toContactEmail: contact.email || "",
      timestamp: Date.now().toString(),
      status: "sent",
    })

    // Add to user's sent invitations
    await redis.sadd(`user:${user.id}:invitations`, contact.id)

    // In a real app, we would send an SMS or email here
    console.log(`Invitation sent to ${contact.name} at ${contact.phoneNumber}`)
  } catch (error) {
    console.error("Error sending invitation:", error)
    throw new Error("Failed to send invitation")
  }
}

// Import contacts from device (simulated)
export async function importContacts(deviceContacts: Omit<Contact, "id">[]): Promise<Contact[]> {
  const user = await getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const addedContacts: Contact[] = []

  for (const contact of deviceContacts) {
    try {
      const addedContact = await addContact(contact)
      addedContacts.push(addedContact)
    } catch (error) {
      console.error(`Error adding contact ${contact.name}:`, error)
      // Continue with other contacts even if one fails
    }
  }

  return addedContacts
}

// Get all invitations sent by the current user
export async function getSentInvitations(): Promise<any[]> {
  const user = await getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const redis = getRedisClient()

  try {
    // Get invitation IDs for the user
    const invitationIds = await redis.smembers(`user:${user.id}:invitations`)

    const invitations = []

    for (const invitationId of invitationIds) {
      const invitationData = await redis.hgetall(`invitation:${invitationId}`)

      if (invitationData && Object.keys(invitationData).length > 0) {
        invitations.push({
          id: invitationId,
          toContactName: invitationData.toContactName,
          toContactPhone: invitationData.toContactPhone,
          toContactEmail: invitationData.toContactEmail,
          timestamp: Number.parseInt(invitationData.timestamp),
          status: invitationData.status,
        })
      }
    }

    return invitations
  } catch (error) {
    console.error("Error fetching invitations:", error)
    throw new Error("Failed to fetch invitations")
  }
}
