# DIGIT — სერვისების პლატფორმა

React + Vite + Firebase (Auth, Firestore) პროექტი მენეჯერის, მომხმარებლის და დეველოპერის როლებით.

## სტრუქტურა

```
homework/
├── backend/              # Firestore security rules
│   └── firestore.rules
├── frontend/             # React აპლიკაცია
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   ├── public/
│   └── package.json
├── scripts/              # emulator და admin სკრიპტები
├── firebase.json
├── firestore.indexes.json
├── package.json
├── README.md
└── SETUP.md
```

## სწრაფი დაწყება

```bash
npm run install:all
cp frontend/.env.example frontend/.env
npm run dev:all
```

დეტალური ინსტრუქცია: [SETUP.md](./SETUP.md)

## ბრძანებები

| ბრძანება | აღწერა |
|---|---|
| `npm run dev:all` | Emulator + seed admin + frontend |
| `npm run dev:frontend` | მხოლოდ frontend |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

**ლოკალური admin:** `admin@gmail.com` / `admin123`
