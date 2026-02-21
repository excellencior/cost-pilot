# Gemini Reference: Commands & Pipelines

This document outlines the standard commands and development pipelines for CostPilot.

## Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server for web development. |
| `npm run build` | Builds the production-ready web application in the `dist` folder. |
| `npm run preview` | Previews the production build locally. |

## Mobile Development (Capacitor)

| Command | Description |
| :--- | :--- |
| `npm run cap:sync` | Syncs the web build with the mobile platforms (Android/iOS). |
| `npm run build:android` | Builds the web app and syncs it specifically for Android. |
| `npx cap open android` | Opens the Android project in Android Studio. |
| `npx cap run android` | Runs the app directly on a connected Android device or emulator. |

## UI & Styling (Tailwind CSS)

The project uses **Tailwind CSS v3**.

- **Config**: `tailwind.config.js`
- **Styles**: `src/index.css` (contains Tailwind directives and core design system tokens).

### Standard Build Pipeline
1.  **Modify UI**: Edit components in `src/components/`.
2.  **Verify Web**: Run `npm run dev` and check in browser.
3.  **Build**: Run `npm run build`.
4.  **Sync Mobile**: Run `npm run cap:sync` to push changes to native platforms.

## Data Persistence
- Core logic is handled by `LocalRepository.ts` for offline-first reliability.
- Sync logic (if enabled) is managed via `SyncManager.ts` connecting to Supabase.

### Build and Development
- For Android builds, always use the global `gradle` installation instead of the `./gradlew` wrapper.
