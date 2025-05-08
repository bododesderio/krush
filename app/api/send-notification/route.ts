import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import admin from "firebase-admin"

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
}

export async function POST(request: Request) {
  try {
    const { userId, notification, data } = await request.json()

    if (!userId || !notification) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user's FCM tokens
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const tokens = userDoc.data().fcmTokens || []

    if (tokens.length === 0) {
      return NextResponse.json({ error: "No FCM tokens found for user" }, { status: 404 })
    }

    // Send notification to all user's devices
    const messaging = admin.messaging()

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data || {},
      tokens: tokens,
    }

    const response = await messaging.sendEachForMulticast(message)

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
