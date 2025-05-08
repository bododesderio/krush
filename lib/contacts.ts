"use server"

import { getUser } from "./auth"
import {
  getContacts as getFirebaseContacts,
  addContact as addFirebaseContact,
  sendInvitation as sendFirebaseInvitation
} from "./firebase-data-service"
import { db } from "./firebase"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore"

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

  try {
    return await getFirebaseContacts(user.id)
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

  try {
    return await addFirebaseContact(user.id, contact)
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

  try {
    // In a real app, this would send an SMS or email invitation
    await sendFirebaseInvitation(user.id, user.name, contact)

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

  try {
    const invitationsRef = collection(db, "invitations")
    const q = query(invitationsRef, where("fromUserId", "==", user.id))
    const querySnapshot = await getDocs(q)

    const invitations = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      invitations.push({
        id: doc.id,
        toContactName: data.toContactName,
        toContactPhone: data.toContactPhone,
        toContactEmail: data.toContactEmail || "",
        timestamp: data.timestamp ? (data.timestamp.toMillis ? data.timestamp.toMillis() : data.timestamp) : Date.now(),
        status: data.status || "sent",
      })
    })

    return invitations
  } catch (error) {
    console.error("Error fetching invitations:", error)
    throw new Error("Failed to fetch invitations")
  }
}
