# DIGIT — Setup გზამკვლევი

## სტრუქტურა

```
homework/
├── backend/          # Firestore rules
├── frontend/         # React + Vite აპლიკაცია
├── scripts/          # emulator და admin სკრიპტები
├── firebase.json
├── firestore.indexes.json
├── package.json      # root orchestration
├── README.md
└── SETUP.md
```

## საჭიროებები

- Node.js 18+
- Java 17+ (Firestore emulator-ისთვის)

## დაყენება

```bash
# root დირექტორიიდან
npm run install:all
cp frontend/.env.emulator.example frontend/.env
```

`npm run dev:all` emulator env-ს ავტომატურად რთავს; `.env` საჭიროა მხოლოდ `npm run dev`-ისთვის emulator-ით.

## გაშვება

| ბრძანება | აღწერა |
|---|---|
| `npm run dev:all` | Emulator + admin seed + frontend (რეკომენდებული) |
| `npm run dev:frontend` | მხოლოდ Vite |
| `npm run emulators` | მხოლოდ Firebase emulators |
| `npm run build` | Production build |

**ლოკალური emulator:**
- App: http://localhost:5173
- Emulator UI: http://127.0.0.1:4000
- Admin: `admin@gmail.com` / `admin123`

## Production Firebase (Netlify)

1. [Firebase Console](https://console.firebase.google.com) → **digit-96a35**
2. **Authentication** → Sign-in method → **Email/Password** ჩართული
3. **Authentication** → **Settings** → **Authorized domains** → Netlify დომენი (მაგ. `*.netlify.app`)
4. Firestore rules deploy (ერთხელ):

```bash
firebase login
npm run deploy:firestore
```

5. **პირველი manager (production):**
   - **ვარიანტი A:** `/register`-ზე დარეგისტრირდი `giorgidiasamidze848@gmail.com`-ით → ავტომატურად manager
   - **ვარიანტი B:** სკრიპტით:
     ```bash
     npm run seed-production-manager -- giorgidiasamidze848@gmail.com YourPassword123
     ```

6. შემდეგ შედი `/admin` ან `/dashboard` იმავე ემაილი/პაროლით.

Netlify env (`netlify.toml`): `VITE_BOOTSTRAP_MANAGER_EMAILS=giorgidiasamidze848@gmail.com`

## Production Firebase (manual)

```bash
firebase login
firebase use your-project-id
npm run firebase-deploy-firestore
```

## როლები

| როლი | მаршрут |
|---|---|
| მომხმარებელი | `/`, `/contact`, `/my-orders` |
| მენეჯერი | `/dashboard` |
| დეველოპერი | `/developer-dashboard` |
