import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"

export type Contact = {
  id: string
  name: string
  phoneNumber: string
  email?: string
  userId: string
  createdAt: any
}

// Get all contacts for a user
export async function getUserContacts(userId: string): Promise<Contact[]> {
  try {
    const q = query(collection(db, "contacts"), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    const contacts: Contact[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      contacts.push({
        id: doc.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email,
        userId: data.userId,
        createdAt: data.createdAt,
      })
    })

    return contacts
  } catch (error) {
    console.error("Error getting contacts:", error)
    throw error
  }
}

// Add a contact
export async function addContact(
  userId: string,
  contact: Omit<Contact, "id" | "userId" | "createdAt">,
): Promise<Contact> {
  try {
    const contactData = {
      ...contact,
      userId,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "contacts"), contactData)

    return {
      id: docRef.id,
      ...contact,
      userId,
      createdAt: new Date(),
    }
  } catch (error) {
    console.error("Error adding contact:", error)
    throw error
  }
}

// Update a contact
export async function updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
  try {
    const contactRef = doc(db, "contacts", contactId)
    await updateDoc(contactRef, updates)
  } catch (error) {
    console.error("Error updating contact:", error)
    throw error
  }
}

// Delete a contact
export async function deleteContact(contactId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "contacts", contactId))
  } catch (error) {
    console.error("Error deleting contact:", error)
    throw error
  }
}

// Import contacts from device
export async function importContacts(
  userId: string,
  contacts: Array<{ name: string; phoneNumber: string; email?: string }>,
): Promise<Contact[]> {
  try {
    const importedContacts: Contact[] = []

    for (const contact of contacts) {
      try {
        const contactData = {
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          email: contact.email || "",
          userId,
          createdAt: serverTimestamp(),
        }

        const docRef = await addDoc(collection(db, "contacts"), contactData)

        importedContacts.push({
          id: docRef.id,
          ...contactData,
          createdAt: new Date(),
        })
      } catch (error) {
        console.error(`Error importing contact ${contact.name}:`, error)
        // Continue with other contacts even if one fails
      }
    }

    return importedContacts
  } catch (error) {
    console.error("Error importing contacts:", error)
    throw error
  }
}

// Send invitation to a contact
export async function inviteContact(
  userId: string,
  contact: { name: string; phoneNumber: string; email?: string },
): Promise<void> {
  try {
    // In a real app, this would send an SMS or email invitation
    // For now, we'll just record the invitation in Firestore

    await addDoc(collection(db, "invitations"), {
      fromUserId: userId,
      toContactName: contact.name,
      toContactPhone: contact.phoneNumber,
      toContactEmail: contact.email || "",
      timestamp: serverTimestamp(),
      status: "sent",
    })

    // In a real app, we would integrate with a service like Twilio for SMS
    console.log(`Invitation sent to ${contact.name} at ${contact.phoneNumber}`)
  } catch (error) {
    console.error("Error sending invitation:", error)
    throw error
  }
}

// Find Krush users from contacts
export async function findKrushUsers(contacts: Array<{ phoneNumber: string; email?: string }>): Promise<string[]> {
  try {
    const krushUserIds: string[] = []

    // Check phone numbers
    const phoneNumbers = contacts.map((c) => c.phoneNumber).filter(Boolean)
    if (phoneNumbers.length > 0) {
      const phoneQuery = query(collection(db, "users"), where("phoneNumber", "in", phoneNumbers))
      const phoneSnapshot = await getDocs(phoneQuery)
      phoneSnapshot.forEach((doc) => {
        krushUserIds.push(doc.id)
      })
    }

    // Check emails
    const emails = contacts.map((c) => c.email).filter(Boolean)
    if (emails.length > 0) {
      const emailQuery = query(collection(db, "users"), where("email", "in", emails))
      const emailSnapshot = await getDocs(emailQuery)
      emailSnapshot.forEach((doc) => {
        if (!krushUserIds.includes(doc.id)) {
          krushUserIds.push(doc.id)
        }
      })
    }

    return krushUserIds
  } catch (error) {
    console.error("Error finding Krush users:", error)
    throw error
  }
}
