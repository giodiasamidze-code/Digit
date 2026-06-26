import './FirebaseSetupNotice.css'

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

function FirebaseSetupNotice() {
  const isProduction = import.meta.env.PROD

  return (
    <div className="firebase-setup">
      <h2 className="firebase-setup__title">Firebase არ არის კონფიგურირებული</h2>
      <p className="firebase-setup__text">
        საიტი მუშაობს, მაგრამ ავტორიზაცია და მოქმედებები საჭიროებს Firebase-ის ჩართვას.
      </p>
      <ol className="firebase-setup__steps">
        <li>
          გახსენი{' '}
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
            Firebase Console
          </a>{' '}
          და შექმენი პროექტი (ან აირჩიე არსებული)
        </li>
        <li>Authentication → Email/Password ჩართვა</li>
        <li>Firestore Database → Create database</li>
        <li>Project settings → Your apps → Web app → Config მნიშვნელობების აღება</li>
        {isProduction ? (
          <>
            <li>
              Netlify: <strong>Site configuration → Environment variables</strong> — დაამატე:
              <ul className="firebase-setup__env-list">
                {ENV_KEYS.map((key) => (
                  <li key={key}>
                    <code>{key}</code>
                  </li>
                ))}
                <li>
                  <code>VITE_USE_FIREBASE_EMULATOR=false</code>
                </li>
              </ul>
            </li>
            <li>
              Deploys → <strong>Trigger deploy → Clear cache and deploy site</strong>
            </li>
            <li>
              Firestore rules განახლე:{' '}
              <code>npm run firebase-deploy-firestore</code> (ლოკალურად Firebase CLI-ით)
            </li>
          </>
        ) : (
          <>
            <li>
              ჩასვი მნიშვნელობები <code>frontend/.env</code> ფაილში (იხილე{' '}
              <code>frontend/.env.example</code>)
            </li>
            <li>
              გადატვირთე: <code>npm run dev:all</code>
            </li>
          </>
        )}
      </ol>
    </div>
  )
}

export default FirebaseSetupNotice
