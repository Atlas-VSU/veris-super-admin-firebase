# VERIS — Super Admin Console
> Platform-level administration portal for managing subscribing student organizations, accounts, and subscription tiers on USSC Connect.

---

## Overview

The **VERIS Super Admin Console** is a specialized, standalone Next.js repository decoupled from the main client application. Its sole responsibility is to provide platform administrators with system-level control over client organizations. 

Unlike the client-facing portals, this system uses a clean, neutral **Slate & Indigo design system** distinct from any individual student organization's brand color configurations.

---

## Key Features

* **Platform Overview Dashboard**: Real-time aggregation of metrics including total registered organizations, active subscriptions, subscription tier breakdowns (Basic, Plus, Premium), active/deleted administrator accounts, and archived workspaces.
* **Organization Directories**: Centralized directory to review and manage student organizations, classify access levels (Department, Faculty, Council), and configure their subscription limits.
* **Administrator Account Management**: Track and manage the administrative user accounts assigned to each organization, toggle status flags (active/inactive), and monitor login logs.
* **Role-Locked Security**: Dual-layer authorization checks utilizing Next.js Edge Middleware and custom React Auth guards to strictly lock out unauthorized client users.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router, Turbopack)
* **Library**: [React 19](https://react.dev/)
* **Database & Auth**: [Firebase Client SDK](https://firebase.google.com/) & [Firebase Admin SDK](https://firebase.google.com/docs/admin) (Server-side operations)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [tw-animate-css](https://github.com/)
* **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
* **Tables**: [@tanstack/react-table](https://tanstack.com/table)
* **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) & React Context

---

## 📂 Architecture & Patterns

The repository maintains a clean separation of concerns:

```
src/
├── app/
│   ├── layout.tsx                # Root layout (providers, Montserrat font, theme)
│   ├── globals.css               # Tailwind setup + Neutral/Indigo color tokens
│   └── (super-admin)/            # Route Group enforcing Super-Admin Auth Shell
│       ├── layout.tsx            # Auth context guard, renders sidebar/mobile nav
│       └── super-admin/          # Pages (dashboard, organizations, org-accounts)
├── features/
│   └── super-admin/              # Domain-specific components, types, and hooks
├── firebase/
│   ├── firebase.config.ts        # Client SDK config (browser safe)
│   ├── firebase-admin.config.ts  # Admin SDK config (server only)
│   └── super-admin.ts            # Server-side Firestore queries using Admin SDK
├── context/
│   └── AuthContext.tsx           # Global Firebase Authentication context
├── hooks/
│   └── useAuth.ts                # Custom hook merging Auth status with Firestore role profile
└── middleware.ts                 # Next.js Edge Middleware verifying role cookie
```

### Server vs. Client Component Boundary
* **Server Components (Pages)**: Pages inside the `app` router act as server components, fetching critical administrative data directly using the Firestore Admin SDK (via `fetchSuperAdminData()`).
* **Client Components (Views)**: Server data is serialized (converting Firebase Timestamps into ISO strings) and passed down to interactive client elements (charts, tables, sheets) underneath.

---

## Environment Variables

To run the application, configure a `.env.local` file at the root. Use the exact credentials corresponding to your Firebase project:

```env
# Client-Side Firebase Configuration (NEXT_PUBLIC_ prefix makes these available in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Server-Side Firebase Configuration (Keep confidential, never commit)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App Check & ReCAPTCHA
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

---

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The site will load at `http://localhost:3000` (or `http://localhost:3001` if proxying).

3. **Build Production Application**:
   ```bash
   npm run build
   ```