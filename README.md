# MR!JK! - MART 🚀

> **Your personal app universe** — A premium app distribution platform built with React + Vite

![License](https://img.shields.io/badge/license-MIT-7c3aed)
![React](https://img.shields.io/badge/React-18-06b6d4)
![Vite](https://img.shields.io/badge/Vite-6-646cff)

## 🌐 Live URL

**[https://MR1JK1.github.io/MR-JK-MART/](https://MR1JK1.github.io/MR-JK-MART/)**

## ✨ Features

- 🎨 **Liquid Glassmorphism** — Premium glass UI with dark/light mode
- 🔐 **Admin System** — PBKDF2 encrypted admin authentication
- 📦 **App Publishing** — Upload & distribute applications
- 💬 **Comments** — User comment system per app
- 🔍 **Search** — Real-time app search with filters
- 📱 **Responsive** — Mobile-first design with touch support
- ✨ **Animations** — Framer Motion page transitions & parallax
- 🎯 **Custom Cursor** — Glowing cursor effect (desktop)
- 🗄️ **Firebase** — Realtime cloud database & storage syncs across all devices

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS v3 | Styling |
| Framer Motion | Animations |
| Zustand | State Management |
| Firebase | Cloud Database & File Storage |
| IndexedDB | Per-Device Local Admin Auth |
| Web Crypto API | Admin Auth (PBKDF2) |
| Lucide React | Icons |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📂 Project Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Router + Layout
├── index.css             # Global styles + Glass design system
├── store/                # Zustand stores
├── db/                   # IndexedDB CRUD layer
├── crypto/               # PBKDF2 admin auth
├── components/
│   ├── layout/           # Navbar, Toast
│   ├── effects/          # Cursor, Orbs, Loader
│   ├── ui/               # GlassCard, GlassModal, GlassButton
│   ├── apps/             # AppCard, AppGrid, Lightbox, Manual
│   └── admin/            # AdminGate, AddEditApp, ThreeDots
└── pages/                # All route pages
```

## 🔐 Admin Access

1. Go to the Contact page
2. Click the subtle "MR!JK!" watermark (bottom-right)
3. Select "🔑 MR!JK!" 
4. First time: Set your admin key
5. Subsequent visits: Enter your key

Admin session is in-memory only (cleared on page refresh).

## 📦 Deploy to GitHub Pages

```bash
chmod +x setup-github.sh
./setup-github.sh
```

Then go to **Settings → Pages → Source: gh-pages branch → root folder**

## 🔥 Firebase Setup Guide

1. Go to console.firebase.google.com
2. Click "Add project" → name it "mrjk-mart" → Continue
3. Disable Google Analytics → Create project

4. Firestore Database:
   Build → Firestore Database → Create database
   Choose "Start in production mode" → select region → Enable
   
   Go to Rules tab, set:
   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /apps/{id} {
         allow read: if true;
         allow write: if request.auth == null; 
       }
       match /comments/{id} {
         allow read: if true;
         allow create: if true;
         allow update, delete: if false; 
       }
       match /contacts/{id} {
         allow create: if true;
         allow read, update, delete: if false;
       }
       match /settings/{id} {
         allow read: if true;
         allow write: if false;
       }
     }
   }
   ```

5. Firebase Storage:
   Build → Storage → Get started → Production mode → Enable
   
   Storage Rules:
   ```text
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if true; 
       }
     }
   }
   ```

6. Get config:
   Project Settings (gear icon) → General → Your apps → Add app → Web (\</\>)
   Copy the firebaseConfig object values into a `.env` file in the root directory.

7. GitHub Actions:
   Add `.env` values to GitHub Secrets:
   GitHub Repo → Settings → Secrets → Actions → New secret
   Add each `VITE_FB_*` value

## 📄 License

MIT © MR!JK!
