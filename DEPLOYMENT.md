# Krush Deployment Guide

This guide will help you deploy the Krush chat application to production using Vercel and Firebase.

## Prerequisites

1. A Firebase account and project
2. A Vercel account
3. Node.js and npm installed on your local machine

## Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable the following services:
   - Authentication (Email/Password, Google, and Phone)
   - Firestore Database
   - Realtime Database
   - Storage
   - Analytics (optional)

### Authentication Setup

1. In the Firebase console, go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Enable Google authentication
4. Enable Phone authentication
   - You'll need to set up a phone number verification provider like Twilio

### Firestore Setup

1. Go to Firestore Database and create a database
2. Start in production mode
3. Choose a location close to your target audience
4. Set up the following security rules:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /chats/{chatId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.members;
      allow update: if request.auth != null && request.auth.uid in resource.data.members;
      allow delete: if request.auth != null && request.auth.uid in resource.data.members;
      
      match /messages/{messageId} {
        allow read: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
        allow create: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
        allow update: if request.auth != null && request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.members;
        allow delete: if request.auth != null && request.auth.uid == resource.data.senderId;
      }
    }
    
    match /contacts/{contactId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /invitations/{invitationId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.fromUserId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.fromUserId;
      allow update: if request.auth != null && request.auth.uid == resource.data.fromUserId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.fromUserId;
    }
  }
}
\`\`\`

### Realtime Database Setup

1. Go to Realtime Database and create a database
2. Start in production mode
3. Choose a location close to your target audience
4. Set up the following security rules:

\`\`\`
{
  "rules": {
    "typing": {
      "$chatId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid === $userId"
        }
      }
    }
  }
}
\`\`\`

### Storage Setup

1. Go to Storage and set up storage
2. Start in production mode
3. Choose a location close to your target audience
4. Set up the following security rules:

\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /chats/{chatId}/attachments/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /avatars/{userId} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

## Step 2: Get Firebase Configuration

1. Go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click on the web app (create one if you haven't already)
4. Copy the Firebase configuration object

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following environment variables with your Firebase configuration:

\`\`\`
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
\`\`\`

## Step 4: Deploy to Vercel

1. Push your code to a GitHub repository
2. Log in to [Vercel](https://vercel.com/)
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: next build
   - Output Directory: .next
6. Add the environment variables from Step 3
7. Click "Deploy"

## Step 5: Configure Custom Domain (Optional)

1. In Vercel, go to your project settings
2. Click on "Domains"
3. Add your custom domain
4. Follow the instructions to configure DNS settings

## Step 6: Set Up Firebase Authentication Redirect URLs

1. Go to Firebase Console > Authentication > Settings > Authorized domains
2. Add your Vercel domain (e.g., `your-app.vercel.app`) and any custom domains

## Step 7: Test Your Deployment

1. Visit your deployed application
2. Test user registration and login
3. Test chat functionality
4. Test file uploads and attachments

## Troubleshooting

- **CORS Issues**: Make sure your Firebase Storage CORS configuration allows requests from your domain
- **Authentication Issues**: Check that your authorized domains are correctly set up
- **Performance Issues**: Consider using Firebase Performance Monitoring to identify bottlenecks

## Next Steps

- Set up Firebase Analytics to track user engagement
- Configure Firebase Cloud Messaging for push notifications
- Implement a backup strategy for your Firestore data
- Set up monitoring and alerts for your application
