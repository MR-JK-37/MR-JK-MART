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
- 🗄️ **IndexedDB** — Persistent local storage

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI Framework |
| Vite | Build Tool |
| Tailwind CSS v3 | Styling |
| Framer Motion | Animations |
| Zustand | State Management |
| IndexedDB (idb) | Persistent Storage |
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

## 📄 License

MIT © MR!JK!
