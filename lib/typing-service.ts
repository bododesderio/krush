import { database } from "./firebase"
import { ref, set, onValue, remove } from "firebase/database"

// Set typing status
export async function setTypingStatus(chatId: string, userId: string, isTyping: boolean) {
  try {
    const typingRef = ref(database, `typing/${chatId}/${userId}`)

    if (isTyping) {
      await set(typingRef, {
        isTyping: true,
        timestamp: Date.now(),
      })
    } else {
      await remove(typingRef)
    }
  } catch (error) {
    console.error("Error updating typing status:", error)
  }
}

// Listen to typing status for a chat
export function listenToTypingStatus(chatId: string, currentUserId: string, callback: (typingUsers: string[]) => void) {
  const typingRef = ref(database, `typing/${chatId}`)

  return onValue(typingRef, (snapshot) => {
    const typingUsers: string[] = []

    if (snapshot.exists()) {
      const data = snapshot.val()

      Object.keys(data).forEach((userId) => {
        if (userId !== currentUserId && data[userId].isTyping) {
          // Check if typing status is recent (within last 5 seconds)
          const isRecent = Date.now() - data[userId].timestamp < 5000
          if (isRecent) {
            typingUsers.push(userId)
          }
        }
      })
    }

    callback(typingUsers)
  })
}
