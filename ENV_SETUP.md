# Environment Variables Setup Guide

This document explains how to set up the environment variables required for the Krush messaging application.

## Required Environment Variables

The application requires the following environment variables to be set:

### Firebase Configuration

These variables are used for Firebase authentication, Firestore database, and Realtime Database:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
```

### Firebase Authentication

Firebase Authentication is used for all authentication in the application. No additional environment variables are needed beyond the Firebase configuration above.

### Vercel Blob Storage

This variable is used for file uploads:

```
BLOB_READ_WRITE_TOKEN=
```

## How to Set Up

1. Create a `.env.local` file in the root directory of the project
2. Copy the variables from `.env.example` into `.env.local`
3. Fill in the values for each variable

## Getting the Values

### Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings > General
4. Scroll down to "Your apps" and create a web app if you haven't already
5. The configuration values will be displayed in the Firebase SDK snippet

### Firebase Authentication

1. In the Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable the authentication methods you want to use (Email/Password, Google, Phone, etc.)
3. For Google authentication, you'll need to configure the OAuth consent screen in the Google Cloud Console

### Vercel Blob Storage

1. Go to the [Vercel Dashboard](https://vercel.com/)
2. Select your project
3. Go to "Storage" > "Blob"
4. Create a new Blob store if you haven't already
5. Generate a new token with read/write permissions
