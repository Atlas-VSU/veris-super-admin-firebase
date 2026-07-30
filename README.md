# VERIS — Super Admin Console
> Platform-level administration portal for managing subscribing student organizations, accounts, and subscription tiers on VERIS services.

---

## Overview

The **VERIS Super Admin Console** is a specialized, standalone Next.js repository decoupled from the main client application. Its sole responsibility is to provide platform administrators with system-level control over client organizations. 

Unlike the client-facing portals, this system uses a clean, neutral **Slate & Indigo design system** distinct from any individual student organization's brand color configurations.

---

## Key Features

* **Platform Overview Dashboard**: Real-time aggregation of metrics including total registered organizations, active subscriptions, subscription tier breakdowns (Basic, Plus, Premium), active/deleted administrator accounts, and archived workspaces.
* **Organization Directories**: Centralized directory to review and manage student organizations, classify access levels (Department, Faculty, Council), and configure their subscription limits.
* **Administrator Account Management**: Track and manage the administrative user accounts assigned to each organization, toggle status flags (active/inactive), and monitor login logs.
* **Terms & Subscription Management**: Administrative tools to create academic terms (AY & semester), track and filter active or expired subscriptions, update subscription tiers, record activation details (amount, payment method/ref), and view full organization history.
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
│   └── super-admin/              # Route enforcing Super-Admin Auth Shell
│       ├── layout.tsx            # Auth context guard, renders sidebar/mobile nav
│       ├── dashboard/page.tsx    # Dashboard page
│       ├── org-accounts/page.tsx # Org accounts page
│       ├── organizations/page.tsx# Organizations directory page
│       └── terms/page.tsx        # Terms & subscription management page
├── features/
│   └── super-admin/              # Domain-specific components, structured by feature:
│       ├── dashboard/            # Overview metrics and statistics cards
│       ├── org-accounts/         # Org admin accounts tables and detail sheets
│       ├── organizations/        # Org directory components and creation/edit forms
│       ├── terms/                # Subscription renewal, tier, history and log elements
│       └── shared/               # Shared sidebars, layouts, badges and skeletons
├── firebase/
│   ├── firebase.config.ts        # Client SDK config (browser safe)
│   ├── firebase-admin.config.ts  # Admin SDK config (server only)
│   ├── organizations.ts          # Client-side organization mutation handlers
│   ├── subscriptions.ts          # Client-side subscription fetch/save queries
│   ├── super-admin.ts            # Server-side Firestore queries using Admin SDK
│   └── term.ts                   # Client-side academic terms queries
├── utils/
│   └── dateUtils.ts              # Central date parsing & formatting utility
├── context/
│   └── AuthContext.tsx           # Global Firebase Authentication context
├── hooks/
│   └── useAuth.ts                # Custom hook merging Auth status with Firestore role profile
└── middleware.ts                 # Next.js Edge Middleware verifying role cookie
```

### Server vs. Client Component Boundary
* **Server Components (Pages)**: Pages inside the `app` router act as server components, fetching critical administrative data directly using the Firestore Admin SDK (via `fetchSuperAdminData()`).
* **Client Components (Views)**: Server and database data is serialized (converting Firebase Timestamps into ISO strings using our centralized `toISOString` utility) and passed down to interactive client elements (charts, tables, sheets) underneath.

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