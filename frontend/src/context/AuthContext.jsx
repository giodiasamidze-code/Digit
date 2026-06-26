import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase'
import { buildRegistrationProfile } from '../utils/roles'
import {
  ensureUserRegistrationFromProfile,
  saveUserRegistration,
} from '../services/registrationService'

const AuthContext = createContext(null)

async function createUserDocument(uid, userData) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    ...userData,
    createdAt: serverTimestamp(),
  })
}

async function ensureGoogleUserDocument(user) {
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    const profile = buildRegistrationProfile(user.email, 'customer')
    await createUserDocument(user.uid, {
      name: user.displayName || 'მომხმარებელი',
      email: user.email,
      role: profile.role,
      developerRequestStatus: profile.developerRequestStatus,
    })
    await saveUserRegistration(user.uid, {
      name: user.displayName || 'მომხმარებელი',
      email: user.email,
      accountType: 'customer',
      role: profile.role,
      developerRequestStatus: profile.developerRequestStatus,
    })
  }
}

function assertFirebase() {
  if (!isFirebaseConfigured || !auth || !db) {
    const hint = import.meta.env.PROD
      ? 'Netlify-ზე დაამატე Firebase environment variables და გადააგენერირე deploy.'
      : 'შეავსე frontend/.env ფაილი და გაუშვი npm run dev:all.'
    throw new Error(`Firebase არ არის კონფიგურირებული. ${hint}`)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured && !!auth)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser && db) {
        try {
          const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid))
          const profile = snapshot.exists() ? snapshot.data() : null
          setUserProfile(profile)
          if (profile) {
            await ensureUserRegistrationFromProfile(firebaseUser.uid, profile)
          }
        } catch (err) {
          console.error('Profile load failed:', err)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email, password, name, accountType = 'customer') => {
    assertFirebase()
    const profile = buildRegistrationProfile(email, accountType)
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name.trim() })

    const userData = {
      name: name.trim(),
      email: credential.user.email,
      role: profile.role,
      developerRequestStatus: profile.developerRequestStatus,
    }

    if (profile.pendingDeveloper) {
      userData.developerRequestedAt = serverTimestamp()
    }

    await createUserDocument(credential.user.uid, userData)

    await saveUserRegistration(credential.user.uid, {
      name: name.trim(),
      email: credential.user.email,
      accountType,
      role: profile.role,
      developerRequestStatus: profile.developerRequestStatus,
    })

    setUserProfile({
      uid: credential.user.uid,
      ...userData,
    })

    return {
      user: credential.user,
      pendingDeveloper: profile.pendingDeveloper,
    }
  }

  const login = async (email, password) => {
    assertFirebase()
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }

  const resetPassword = async (email) => {
    assertFirebase()
    await sendPasswordResetEmail(auth, email.trim())
  }

  const loginWithGoogle = async () => {
    assertFirebase()
    const provider = new GoogleAuthProvider()
    const credential = await signInWithPopup(auth, provider)
    await ensureGoogleUserDocument(credential.user)

    const snapshot = await getDoc(doc(db, 'users', credential.user.uid))
    setUserProfile(snapshot.exists() ? snapshot.data() : null)

    return credential.user
  }

  const logout = async () => {
    setUser(null)
    setUserProfile(null)

    if (!isFirebaseConfigured || !auth) {
      return
    }

    await signOut(auth)
  }

  const refreshUserProfile = async () => {
    if (!auth?.currentUser || !db) return null
    const snapshot = await getDoc(doc(db, 'users', auth.currentUser.uid))
    const profile = snapshot.exists() ? snapshot.data() : null
    setUserProfile(profile)
    return profile
  }

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      isFirebaseConfigured,
      signup,
      login,
      resetPassword,
      loginWithGoogle,
      logout,
      refreshUserProfile,
    }),
    [user, userProfile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
