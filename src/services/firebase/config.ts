import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  Auth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
} from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== 'your_api_key_here' &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId !== 'your_project_id'
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

    // Initialize Auth with local persistence
    auth = getAuth(app)
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Firebase auth persistence setup notice:', err)
    })

    // Initialize standard stable Firestore instance
    db = getFirestore(app)

    // Initialize Analytics if supported in environment
    if (typeof window !== 'undefined') {
      isAnalyticsSupported()
        .then((supported) => {
          if (supported && app) {
            analytics = getAnalytics(app)
          }
        })
        .catch(() => {})
    }
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

export const googleAuthProvider = new GoogleAuthProvider()
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
})

export { app, auth, db, analytics }
