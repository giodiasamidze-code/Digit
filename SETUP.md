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
cp frontend/.env.example frontend/.env
```

`frontend/.env`-ში emulator რეჟიმისთვის დატოვე `VITE_USE_FIREBASE_EMULATOR=true` და demo მნიშვნელობები.

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

## Production Firebase

1. შექმენი პროექტი [Firebase Console](https://console.firebase.google.com)-ში
2. ჩართე Authentication (Email/Password) და Firestore
3. შეავსე `frontend/.env` production მნიშვნელობებით
4. Firestore rules და indexes გაუშვი:

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
