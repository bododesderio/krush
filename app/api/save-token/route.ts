import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json()

    if (!userId || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user document
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Add token to user document if it doesn't already exist
    const tokens = userDoc.data().fcmTokens || []
    
    if (!tokens.includes(token)) {
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving token:", error)
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 })
  }
}
