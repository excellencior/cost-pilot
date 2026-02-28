# CostPilot: Project Technology Stack & Working Pipeline

## 1. Executive Summary
CostPilot is a modern, cross-platform personal finance management application. It is designed to provide a seamless experience across Web and Android platforms, leveraging a unified codebase. The application prioritizes speed, security (via Google OAuth), and intelligent insights (via Gemini AI), while maintaining a premium, "Cinema Archive" aesthetic with sharp borders and matte finishes.

---

## 2. Technology Stack Breakdown

### Frontend (Core Application)
- **Framework:** [React 19](https://react.dev/) — Provides a reactive, component-based UI layer.
- **Build System:** [Vite 6](https://vitejs.dev/) — Enables extremely fast development starts and optimized production builds.
- **Language:** [TypeScript](https://www.typescriptlang.org/) — Ensures type safety across the entire application logic.
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) — Used for modern, responsive, and utility-first styling.
- **Icons & Typography:** 
  - [Material Symbols](https://fonts.google.com/icons) for consistent iconography.
  - [Outfit](https://fonts.google.com/specimen/Outfit) (Headings) and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (UI/Monospace) source fonts.

### Mobile Integration (Android)
- **Wrapper:** [Capacitor 8](https://capacitorjs.com/) — Transforms the web application into a native Android shell.
- **Native Bridge:** Capacitor Plugins bridge the gap between React JS and Android Java/Kotlin (e.g., for Filesystem, Share, and Authentication).

### Backend & Infrastructure
- **BaaS:** [Supabase](https://supabase.com/) — Handles Database (PostgreSQL), Authentication, and Real-time sync.
- **Native Auth SDK:** [Firebase Authentication](https://firebase.google.com/docs/auth) — Specifically used for Native Google One Tap sign-in on Android.
- **AI Engine:** [Google Gemini AI](https://ai.google.dev/) — Powers intelligent financial insights and data processing.
- **Hosting:** [Vercel](https://vercel.com/) — High-performance hosting for the web version.

---

## 3. The Working Pipeline

### Development Flow
1. **Feature Design:** UI/UX is planned with a focus on "Visual Excellence."
2. **Local Dev:** Run via `npm run dev`. Vite provides a Hot Module Replacement (HMR) environment.
3. **Mobile Iteration:** Developers use local Wi-Fi hosting (`host: '0.0.0.0'`) to test the React app live on Android devices via the Capacitor WebView.

### Build & Synchronization Pipeline
1. **Web Build:** `npm run build` runs Vite to generate optimized, code-split chunks in `dist/`.
2. **Capacitor Sync:** `npx cap sync android` copies the `dist/` folder into the native Android project structure (`android/app/src/main/assets/public/`).
3. **Native Compilation:** `gradle build` (run from the `android/` directory) compiles the final APK.

### Deployment Pipeline
- **Web:** Automatic deployment to Vercel upon pushing to the main branch.
- **Android:** Manual or CI/CD generation of APK/AAB files using Gradle for distribution on the Play Store or via direct sideloading.

---

## 4. Key Architectural Features
- **Code Splitting:** Vite is configured with manual chunking to ensure the Android WebView avoids large JS payloads, improving startup time.
- **Branded Auth Redirect:** A custom `/auth` callback route ensures that Google OAuth displays "costpilot.com" to the user, enhancing brand trust.
- **Local-First Sync:** The application manages state locally and synchronizes with Supabase, allowing for a responsive experience even with intermittent connectivity.

---

## 5. Codebase Map
- `/components`: UI building blocks (Modals, Charts, Auth).
- `/services`: Core logic for Supabase Client, Cloud Backup, and Profile management.
- `/android`: Native Android project files and build configurations.
- `/docs`: Technical documentation and setup guides.
- `App.tsx`: The main application entry point and routing logic.
