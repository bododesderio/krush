"use server"

import { db, auth } from "./firebase"
import { adminDb } from './firebase-admin';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  deleteDoc,
  serverTimestamp,
  addDoc
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { v4 as uuidv4 } from "uuid"

// Helper function to convert Firestore timestamp to number
export async function timestampToNumber(timestamp: any): Promise<number> {
  if (!timestamp) return Date.now()
  if (typeof timestamp === 'object' && 'toMillis' in timestamp && typeof timestamp.toMillis === 'function') {
    return timestamp.toMillis()
  }
  if (typeof timestamp === 'number') {
    return timestamp
  }
  return Date.now()
}

// Helper function to check if a document exists
export async function documentExists(path: string, id: string): Promise<boolean> {
  const docRef = doc(db, path, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists()
}

// User-related functions
export async function getUserById(userId: string) {
  try {
    // Use admin SDK for server-side operations
    if (typeof window === 'undefined') {
      const userDoc = await adminDb.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return {
        id: userId,
        email: userData?.email || "",
        name: userData?.displayName || userData?.name || "",
        avatar: userData?.photoURL || userData?.avatar || "",
        bio: userData?.bio || undefined,
        phoneNumber: userData?.phoneNumber || undefined,
        online: userData?.online || false,
        lastSeen: userData?.lastSeen ?
          (typeof userData.lastSeen === 'number' ?
            userData.lastSeen :
            userData.lastSeen.toMillis ?
              userData.lastSeen.toMillis() :
              Date.now()) :
          Date.now(),
        authProvider: userData?.authProvider || "email",
      };
    } else {
      // Use client SDK for client-side operations
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      return {
        id: userId,
        email: userData.email || "",
        name: userData.displayName || userData.name || "",
        avatar: userData.photoURL || userData.avatar || "",
        bio: userData.bio || undefined,
        phoneNumber: userData.phoneNumber || undefined,
        online: userData.online || false,
        lastSeen: userData.lastSeen ? await timestampToNumber(userData.lastSeen) : undefined,
        authProvider: userData.authProvider || "email",
      };
    }
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    return {
      id: userDoc.id,
      email: userData.email || "",
      name: userData.displayName || userData.name || "",
      avatar: userData.photoURL || userData.avatar || "",
      bio: userData.bio || undefined,
      phoneNumber: userData.phoneNumber || undefined,
      online: userData.online || false,
      lastSeen: userData.lastSeen ? timestampToNumber(userData.lastSeen) : undefined,
      authProvider: userData.authProvider || "email",
    }
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function getUserByPhone(phoneNumber: string) {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    return {
      id: userDoc.id,
      email: userData.email || "",
      name: userData.displayName || userData.name || "",
      avatar: userData.photoURL || userData.avatar || "",
      bio: userData.bio || undefined,
      phoneNumber: userData.phoneNumber || undefined,
      online: userData.online || false,
      lastSeen: userData.lastSeen ? timestampToNumber(userData.lastSeen) : undefined,
      authProvider: userData.authProvider || "email",
    }
  } catch (error) {
    console.error("Error getting user by phone:", error)
    return null
  }
}

export async function createUser(userData: {
  email: string,
  password?: string,
  name: string,
  avatar: string,
  bio?: string,
  phoneNumber?: string,
  authProvider: string
}) {
  try {
    if (!userData.password) {
      throw new Error("Password is required to create a user");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const userId = userCredential.user.uid
    const userRef = doc(db, "users", userId)

    await setDoc(userRef, {
      email: userData.email,
      password: userData.password, // Note: In a real app, passwords should be stored securely
      displayName: userData.name,
      name: userData.name,
      photoURL: userData.avatar,
      avatar: userData.avatar,
      bio: userData.bio || "",
      phoneNumber: userData.phoneNumber || "",
      online: true,
      lastSeen: serverTimestamp(),
      authProvider: userData.authProvider,
      createdAt: serverTimestamp(),
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
      authProvider: userData.authProvider,
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}

export async function updateUserStatus(userId: string, online: boolean) {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      online: online,
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user status:", error)
  }
}

export async function getAllUsers() {
  try {
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)

    const users = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email || "",
        name: data.displayName || data.name || "",
        avatar: data.photoURL || data.avatar || "",
        bio: data.bio || undefined,
        phoneNumber: data.phoneNumber || undefined,
        online: data.online || false,
        lastSeen: data.lastSeen ? timestampToNumber(data.lastSeen) : undefined,
        authProvider: data.authProvider || "email",
      }
    })

    return users
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Group-related functions
export async function createGroup(groupData: {
  name: string,
  avatar: string,
  createdBy: string,
  members: string[]
}) {
  try {
    const groupId = uuidv4()
    const groupRef = doc(db, "groups", groupId)

    await setDoc(groupRef, {
      name: groupData.name,
      avatar: groupData.avatar,
      createdBy: groupData.createdBy,
      createdAt: serverTimestamp(),
      members: groupData.members,
    })

    // Add group to each member's groups
    for (const memberId of groupData.members) {
      const userGroupsRef = doc(db, "users", memberId)
      await updateDoc(userGroupsRef, {
        groups: arrayUnion(groupId)
      })
    }

    return {
      id: groupId,
      name: groupData.name,
      avatar: groupData.avatar,
      createdBy: groupData.createdBy,
      createdAt: Date.now(),
      members: groupData.members,
    }
  } catch (error) {
    console.error("Error creating group:", error)
    throw new Error("Failed to create group")
  }
}

export async function getGroup(groupId: string) {
  try {
    const groupRef = doc(db, "groups", groupId)
    const groupDoc = await getDoc(groupRef)

    if (!groupDoc.exists()) {
      return null
    }

    const groupData = groupDoc.data()
    return {
      id: groupId,
      name: groupData.name,
      avatar: groupData.avatar,
      createdBy: groupData.createdBy,
      createdAt: timestampToNumber(groupData.createdAt),
      members: groupData.members || [],
    }
  } catch (error) {
    console.error("Error getting group:", error)
    return null
  }
}

export async function getUserGroups(userId: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return []
    }

    const userData = userDoc.data()
    const groupIds = userData.groups || []

    const groups = []
    for (const groupId of groupIds) {
      const group = await getGroup(groupId)
      if (group) {
        groups.push(group)
      }
    }

    return groups
  } catch (error) {
    console.error("Error getting user groups:", error)
    return []
  }
}

export async function addMemberToGroup(groupId: string, userId: string) {
  try {
    const groupRef = doc(db, "groups", groupId)
    const groupDoc = await getDoc(groupRef)

    if (!groupDoc.exists()) {
      throw new Error("Group not found")
    }

    const groupData = groupDoc.data()
    if (groupData.members.includes(userId)) {
      return // User is already a member
    }

    // Add user to group members
    await updateDoc(groupRef, {
      members: arrayUnion(userId)
    })

    // Add group to user's groups
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      groups: arrayUnion(groupId)
    })
  } catch (error) {
    console.error("Error adding member to group:", error)
    throw new Error("Failed to add member to group")
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    const group = await getGroup(groupId)

    if (!group) {
      throw new Error("Group not found")
    }

    const members = []

    for (const memberId of group.members) {
      const user = await getUserById(memberId)
      if (user) {
        members.push(user)
      }
    }

    return members
  } catch (error) {
    console.error("Error getting group members:", error)
    return []
  }
}

// Message-related functions
export async function sendMessage(messageData: {
  content: string,
  senderId: string,
  receiverId?: string,
  groupId?: string,
  attachments?: any[],
  forwarded?: {
    originalMessageId: string,
    originalSenderId: string,
    originalSenderName: string
  }
}) {
  try {
    const messageId = uuidv4()
    const timestamp = Date.now()

    // Create chatId for direct messages
    let chatId = null
    if (messageData.receiverId && !messageData.groupId) {
      chatId = [messageData.senderId, messageData.receiverId].sort().join("_")
    }

    // Use type assertion to allow dynamic properties
    const message: any = {
      id: messageId,
      content: messageData.content,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId || null,
      groupId: messageData.groupId || null,
      chatId: chatId, // Add chatId for direct messages
      timestamp: timestamp,
      read: false,
      readBy: [messageData.senderId],
      reactions: {},
      attachments: messageData.attachments || []
    }

    // Only add forwarded if it exists and is not undefined
    if (messageData.forwarded) {
      message.forwarded = messageData.forwarded
    }

    // Store the message
    const messageRef = doc(db, "messages", messageId)

    // Create document data without undefined values
    const docData: any = {
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      groupId: message.groupId,
      chatId: chatId, // Add chatId for direct messages
      timestamp: serverTimestamp(),
      read: false,
      readBy: [message.senderId],
      reactions: {},
      attachments: message.attachments || []
    }

    // Only add forwarded if it exists
    if (messageData.forwarded) {
      docData.forwarded = messageData.forwarded
    }

    await setDoc(messageRef, docData)

    // Add to appropriate conversation or group
    if (messageData.groupId) {
      // Add to group messages
      const groupRef = doc(db, "groups", messageData.groupId)
      const groupDoc = await getDoc(groupRef)

      if (groupDoc.exists()) {
        const groupData = groupDoc.data()

        await updateDoc(groupRef, {
          lastMessage: {
            id: messageId,
            content: messageData.content,
            senderId: messageData.senderId,
            timestamp: serverTimestamp()
          },
          messages: arrayUnion(messageId)
        })

        // Send notifications to all group members except sender
        if (groupData.members && Array.isArray(groupData.members)) {
          const members = groupData.members.filter(memberId => memberId !== messageData.senderId)

          // Get sender name
          const senderRef = doc(db, "users", messageData.senderId)
          const senderDoc = await getDoc(senderRef)
          const senderName = senderDoc.exists() ?
            (senderDoc.data().displayName || senderDoc.data().name || "Someone") :
            "Someone"

          // Send notification to each member
          for (const memberId of members) {
            try {
              await fetch("/api/send-notification", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: memberId,
                  notification: {
                    title: `New message in ${groupData.name}`,
                    body: `${senderName}: ${messageData.content.substring(0, 100)}${messageData.content.length > 100 ? '...' : ''}`,
                  },
                  data: {
                    type: "group_message",
                    groupId: messageData.groupId,
                    messageId: messageId,
                  },
                }),
              })
            } catch (error) {
              console.error("Error sending notification to group member:", error)
              // Continue with other members even if one fails
            }
          }
        }
      }
    } else if (messageData.receiverId) {
      // Create or update conversation
      const conversationId = [messageData.senderId, messageData.receiverId].sort().join("_")
      const conversationRef = doc(db, "conversations", conversationId)
      const conversationDoc = await getDoc(conversationRef)

      if (conversationDoc.exists()) {
        await updateDoc(conversationRef, {
          lastMessage: {
            id: messageId,
            content: messageData.content,
            senderId: messageData.senderId,
            timestamp: serverTimestamp()
          },
          messages: arrayUnion(messageId),
          updatedAt: serverTimestamp()
        })
      } else {
        await setDoc(conversationRef, {
          participants: [messageData.senderId, messageData.receiverId],
          lastMessage: {
            id: messageId,
            content: messageData.content,
            senderId: messageData.senderId,
            timestamp: serverTimestamp()
          },
          messages: [messageId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      // Send notification to receiver
      try {
        // Get sender name
        const senderRef = doc(db, "users", messageData.senderId)
        const senderDoc = await getDoc(senderRef)
        const senderName = senderDoc.exists() ?
          (senderDoc.data().displayName || senderDoc.data().name || "Someone") :
          "Someone"

        await fetch("/api/send-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: messageData.receiverId,
            notification: {
              title: `New message from ${senderName}`,
              body: messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : ''),
            },
            data: {
              type: "direct_message",
              senderId: messageData.senderId,
              messageId: messageId,
            },
          }),
        })
      } catch (error) {
        console.error("Error sending notification to receiver:", error)
        // Continue even if notification fails
      }
    }

    return message
  } catch (error) {
    console.error("Error sending message:", error)
    // Provide more detailed error information
    if (error instanceof Error) {
      throw new Error(`Failed to send message: ${error.message}`)
    } else {
      throw new Error("Failed to send message")
    }
  }
}

export async function getMessages(userId1: string, userId2: string, limit = 50) {
  try {
    const conversationId = [userId1, userId2].sort().join("_")
    const conversationRef = doc(db, "conversations", conversationId)
    const conversationDoc = await getDoc(conversationRef)

    if (!conversationDoc.exists()) {
      return []
    }

    const conversationData = conversationDoc.data()
    const messageIds = conversationData.messages || []

    // Get the most recent messages (up to the limit)
    const recentMessageIds = messageIds.slice(-limit)

    const messages = []
    for (const messageId of recentMessageIds) {
      const messageRef = doc(db, "messages", messageId)
      const messageDoc = await getDoc(messageRef)

      if (messageDoc.exists()) {
        const messageData = messageDoc.data()
        messages.push({
          id: messageId,
          content: messageData.content,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          groupId: messageData.groupId,
          timestamp: timestampToNumber(messageData.timestamp),
          read: messageData.read,
          readBy: messageData.readBy || [messageData.senderId],
          reactions: messageData.reactions || {},
          attachments: messageData.attachments || [],
        })
      }
    }

    // Mark messages as read
    for (const message of messages) {
      if (message.receiverId === userId1 && !message.readBy.includes(userId1)) {
        const messageRef = doc(db, "messages", message.id)
        await updateDoc(messageRef, {
          read: message.readBy.includes(message.receiverId || "") ? true : false,
          readBy: arrayUnion(userId1)
        })
      }
    }

    return messages.sort((a, b) => {
      const timestampA = typeof a.timestamp === 'number' ? a.timestamp : 0
      const timestampB = typeof b.timestamp === 'number' ? b.timestamp : 0
      return timestampB - timestampA
    })
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
}

export async function getGroupMessages(groupId: string, limit = 50) {
  try {
    const groupRef = doc(db, "groups", groupId)
    const groupDoc = await getDoc(groupRef)

    if (!groupDoc.exists()) {
      return []
    }

    const groupData = groupDoc.data()
    const messageIds = groupData.messages || []

    // Get the most recent messages (up to the limit)
    const recentMessageIds = messageIds.slice(-limit)

    const messages = []
    for (const messageId of recentMessageIds) {
      const messageRef = doc(db, "messages", messageId)
      const messageDoc = await getDoc(messageRef)

      if (messageDoc.exists()) {
        const messageData = messageDoc.data()
        messages.push({
          id: messageId,
          content: messageData.content,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          groupId: messageData.groupId,
          timestamp: timestampToNumber(messageData.timestamp),
          read: messageData.read,
          readBy: messageData.readBy || [messageData.senderId],
          reactions: messageData.reactions || {},
          attachments: messageData.attachments || [],
        })
      }
    }

    return messages.sort((a, b) => {
      const timestampA = typeof a.timestamp === 'number' ? a.timestamp : 0
      const timestampB = typeof b.timestamp === 'number' ? b.timestamp : 0
      return timestampB - timestampA
    })
  } catch (error) {
    console.error("Error getting group messages:", error)
    return []
  }
}

export async function addReaction(messageId: string, userId: string, reaction: string) {
  try {
    const messageRef = doc(db, "messages", messageId)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists()) {
      throw new Error("Message not found")
    }

    // Update reactions
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: reaction
    })
  } catch (error) {
    console.error("Error adding reaction:", error)
    throw new Error("Failed to add reaction")
  }
}

export async function markMessageAsRead(messageId: string, userId: string) {
  try {
    const messageRef = doc(db, "messages", messageId)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists()) {
      throw new Error("Message not found")
    }

    const messageData = messageDoc.data()
    const readBy = messageData.readBy || []

    if (!readBy.includes(userId)) {
      await updateDoc(messageRef, {
        read: messageData.receiverId === userId ? true : messageData.read,
        readBy: arrayUnion(userId)
      })
    }
  } catch (error) {
    console.error("Error marking message as read:", error)
    throw new Error("Failed to mark message as read")
  }
}

// Contact-related functions
export async function getContacts(userId: string) {
  try {
    const contactsRef = collection(db, "contacts")
    const q = query(contactsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    const contacts = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        phoneNumber: data.phoneNumber,
        email: data.email || "",
      }
    })

    return contacts
  } catch (error) {
    console.error("Error getting contacts:", error)
    return []
  }
}

export async function addContact(userId: string, contact: {
  name: string,
  phoneNumber: string,
  email?: string
}) {
  try {
    const contactsRef = collection(db, "contacts")
    const contactDoc = await addDoc(contactsRef, {
      userId: userId,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
      createdAt: serverTimestamp()
    })

    return {
      id: contactDoc.id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
    }
  } catch (error) {
    console.error("Error adding contact:", error)
    throw new Error("Failed to add contact")
  }
}

export async function sendInvitation(userId: string, userName: string, contact: {
  id: string,
  name: string,
  phoneNumber: string,
  email?: string
}) {
  try {
    const invitationsRef = collection(db, "invitations")
    await addDoc(invitationsRef, {
      fromUserId: userId,
      fromUserName: userName,
      toContactName: contact.name,
      toContactPhone: contact.phoneNumber,
      toContactEmail: contact.email || "",
      timestamp: serverTimestamp(),
      status: "sent",
    })

    // In a real app, we would send an SMS or email here
    console.log(`Invitation sent to ${contact.name} at ${contact.phoneNumber}`)
  } catch (error) {
    console.error("Error sending invitation:", error)
    throw new Error("Failed to send invitation")
  }
}

// Admin functions
export async function clearDatabase() {
  try {
    // This is a dangerous operation and should be protected
    // In a real app, this would require admin authentication

    // Delete all users
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)
    for (const userDoc of usersSnapshot.docs) {
      await deleteDoc(doc(db, "users", userDoc.id))
    }

    // Delete all groups
    const groupsRef = collection(db, "groups")
    const groupsSnapshot = await getDocs(groupsRef)
    for (const groupDoc of groupsSnapshot.docs) {
      await deleteDoc(doc(db, "groups", groupDoc.id))
    }

    // Delete all messages
    const messagesRef = collection(db, "messages")
    const messagesSnapshot = await getDocs(messagesRef)
    for (const messageDoc of messagesSnapshot.docs) {
      await deleteDoc(doc(db, "messages", messageDoc.id))
    }

    // Delete all conversations
    const conversationsRef = collection(db, "conversations")
    const conversationsSnapshot = await getDocs(conversationsRef)
    for (const conversationDoc of conversationsSnapshot.docs) {
      await deleteDoc(doc(db, "conversations", conversationDoc.id))
    }

    // Delete all contacts
    const contactsRef = collection(db, "contacts")
    const contactsSnapshot = await getDocs(contactsRef)
    for (const contactDoc of contactsSnapshot.docs) {
      await deleteDoc(doc(db, "contacts", contactDoc.id))
    }

    // Delete all invitations
    const invitationsRef = collection(db, "invitations")
    const invitationsSnapshot = await getDocs(invitationsRef)
    for (const invitationDoc of invitationsSnapshot.docs) {
      await deleteDoc(doc(db, "invitations", invitationDoc.id))
    }

    return { success: true }
  } catch (error) {
    console.error("Error clearing database:", error)
    return { success: false, error: "Failed to clear database" }
  }
}



