export const EMULATOR_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDemoKeyForLocalEmulatorOnly123456',
  authDomain: 'demo-homework.firebaseapp.com',
  projectId: 'demo-homework',
  storageBucket: 'demo-homework.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abc123def456',
}

export function applyEmulatorFirebaseEnv(baseEnv = process.env) {
  return {
    ...baseEnv,
    VITE_USE_FIREBASE_EMULATOR: 'true',
    VITE_FIREBASE_API_KEY:
      baseEnv.VITE_FIREBASE_API_KEY || EMULATOR_FIREBASE_CONFIG.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN:
      baseEnv.VITE_FIREBASE_AUTH_DOMAIN || EMULATOR_FIREBASE_CONFIG.authDomain,
    VITE_FIREBASE_PROJECT_ID:
      baseEnv.VITE_FIREBASE_PROJECT_ID || EMULATOR_FIREBASE_CONFIG.projectId,
    VITE_FIREBASE_STORAGE_BUCKET:
      baseEnv.VITE_FIREBASE_STORAGE_BUCKET || EMULATOR_FIREBASE_CONFIG.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID:
      baseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ||
      EMULATOR_FIREBASE_CONFIG.messagingSenderId,
    VITE_FIREBASE_APP_ID:
      baseEnv.VITE_FIREBASE_APP_ID || EMULATOR_FIREBASE_CONFIG.appId,
  }
}
