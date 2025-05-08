"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
} from "firebase/auth"
import { auth, googleProvider, db } from "@/lib/firebase"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { setUserCookie } from "@/lib/auth"

type User = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  phoneNumber: string | null
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithPhone: (phoneNumber: string) => Promise<{ verificationId: string }>
  confirmPhoneCode: (verificationId: string, code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userId = userCredential.user.uid
      await setUserCookie(userId)
      router.push("/")
    } catch (error: any) {
      console.error("Firebase auth error:", error.code, error.message)
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error("Invalid email or password")
      } else if (error.code === 'auth/user-disabled') {
        throw new Error("This account has been disabled")
      } else {
        throw new Error(error.message || "Failed to sign in")
      }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile
      await updateProfile(user, {
        displayName: name,
      })

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName: name,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        online: true,
      })

      router.push("/onboarding")
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      const user = userCredential.user
      const userId = userCredential.user.uid
      const userRef = doc(db, "users", user.uid)

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid))

      if (!userDoc.exists()) {
        // Create user document in Firestore
        await setDoc(userRef, {
          uid: userId,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          online: true,
        })
      } else {
        // Update last seen
        await setDoc(
          doc(db, "users", user.uid),
          {
            lastSeen: serverTimestamp(),
            online: true,
          },
          { merge: true },
        )
      }

      // Call the server action to set the cookie
      await setUserCookie(userId)

      router.push("/")
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const signInWithPhone = async (phoneNumber: string) => {
    try {
      // Create a RecaptchaVerifier instance
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      })

      // Request verification code
      const provider = new PhoneAuthProvider(auth)
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier)

      return { verificationId }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const confirmPhoneCode = async (verificationId: string, code: string) => {
    try {
      // Create credential
      const credential = PhoneAuthProvider.credential(verificationId, code)

      // Sign in with credential
      const userCredential = await signInWithCredential(auth, credential)
      const user = userCredential.user

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid))

      if (!userDoc.exists()) {
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || `User ${user.phoneNumber?.slice(-4)}`,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          online: true, 
        })
      } else {
        // Update last seen
        await setDoc(
          doc(db, "users", user.uid),
          {
            lastSeen: serverTimestamp(),
            online: true,
          },
          { merge: true },
        )
      }

      router.push("/")
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const logout = async () => {
    try {
      if (user) {
        // Update user status
        await setDoc(
          doc(db, "users", user.uid),
          {
            lastSeen: serverTimestamp(),
            online: false,
          },
          { merge: true },
        )
      }

      await signOut(auth)
      router.push("/login")
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithPhone,
        confirmPhoneCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
