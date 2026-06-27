import './FirebaseSetupNotice.css'

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

function FirebaseSetupNotice({ variant = 'default' }) {
  const isProduction = import.meta.env.PROD
  const compact = variant === 'compact'

  return (
    <div className={`firebase-setup ${compact ? 'firebase-setup--compact' : ''}`}>
      <h2 className="firebase-setup__title">Firebase არ არის კონფიგურირებული</h2>
      <p className="firebase-setup__text">
        {isProduction
          ? 'Production-ზე საჭიროა ნამდვილი Firebase პროექტი. არ გამოიყენო demo-homework / emulator მნიშვნელობები.'
          : 'ლოკალურად შექმენი frontend/.env (იხ. frontend/.env.emulator.example) და გაუშვი npm run dev:all.'}
      </p>
      {!compact && (
        <ol className="firebase-setup__steps">
          <li>
            შექმენი პროექტი{' '}
            <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
              Firebase Console
            </a>
          </li>
          <li>Authentication → Email/Password + Firestore Database</li>
          {isProduction ? (
            <>
              <li>
                Netlify → <strong>Site configuration → Environment variables</strong>:
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
                <strong>Deploys → Trigger deploy → Clear cache and deploy site</strong>
              </li>
              <li>
                Firebase Console → Authentication → Authorized domains → დაამატე Netlify დომენი
              </li>
            </>
          ) : (
            <li>
              ჩაწერე მნიშვნელობები <code>frontend/.env</code>-ში (შაბლონი:{' '}
              <code>frontend/.env.emulator.example</code>) და გაუშვი <code>npm run dev:all</code>
            </li>
          )}
        </ol>
      )}
    </div>
  )
}

export default FirebaseSetupNotice
