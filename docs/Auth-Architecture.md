# Authentication Architecture & Configuration Guide

This document covers the complete authentication architecture for CostPilot, including the branded redirect flow, and all required console configurations.

---

## How Authentication Works

CostPilot uses **two distinct OAuth flows** depending on platform:

### Web Flow (Branded Redirect)

```
User clicks "Sign In"
       │
       ▼
App calls supabase.auth.signInWithOAuth({
  provider: 'google',
  redirectTo: 'https://costpilot.com/auth'
})
       │
       ▼
Browser → Supabase Auth Server
       │
       ▼
Supabase → Google Consent Screen
(user grants permission)
       │
       ▼
Google → Supabase (authorization code)
       │
       ▼
Supabase exchanges code for tokens, then redirects:
  → https://costpilot.com/auth#access_token=...&refresh_token=...
       │
       ▼
React Router matches /auth → <AuthCallback />
       │
       ▼
Supabase JS auto-reads hash fragment via onAuthStateChange
Session is established → navigate to /
```

**Key files:**
- `components/AuthContext.tsx` — calls `signInWithOAuth` with `redirectTo`
- `components/AuthCallback.tsx` — spinner at `/auth`, redirects to `/` once session is ready
- `index.tsx` — React Router setup with `/auth` and `*` routes
- `.env` — contains `VITE_SITE_URL` used to build the redirect URL

### Android Native Flow

The native flow bypasses browser redirects entirely. See `docs/Android-Native-Auth-Setup.md` for full details.

```
User taps "Sign In"
       │
       ▼
FirebaseAuthentication.signInWithGoogle()
(native Google One Tap / bottom-sheet picker)
       │
       ▼
Returns idToken
       │
       ▼
supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
       │
       ▼
Session established (no redirect needed)
```

---

## Required Console Configurations

### 1. Google Cloud Console

**Location:** [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials

#### OAuth Consent Screen
- **App name:** CostPilot
- **Authorized domains:** `costpilot.com`, `supabase.co`
- **Scopes:** `email`, `profile`, `openid`

#### OAuth 2.0 Client IDs

You need **two** client IDs:

| Client ID | Type | Purpose |
|-----------|------|---------|
| Web Client ID | Web application | Used by Supabase for the web OAuth flow |
| Android Client ID | Android | Used by native Google Sign-In SDK |

##### Web Client ID Configuration
- **Authorized JavaScript origins:**
  - `https://costpilot.com`
  - `http://localhost:5173` (dev)
  - `https://orqiymigxotdadysaegv.supabase.co`
- **Authorized redirect URIs:**
  - `https://orqiymigxotdadysaegv.supabase.co/auth/v1/callback`

> **Note:** The redirect URI here points to Supabase, NOT to `costpilot.com/auth`. Google sends the auth code to Supabase's server. Supabase then processes it and redirects the *browser* to `costpilot.com/auth` (as specified by `redirectTo`).

##### Android Client ID Configuration
- **Package name:** `com.costpilot.app`
- **SHA-1 fingerprint:** From your debug/release keystore (see `docs/Android-Native-Auth-Setup.md`)

---

### 2. Firebase Console

**Location:** [console.firebase.google.com](https://console.firebase.google.com)

Firebase is used **only** for the native Android flow via `@capacitor-firebase/authentication`. No Firebase Auth backend is used — it's purely for the native Google Sign-In SDK.

#### Required Configuration
- **Project:** Must be linked to the same Google Cloud project as above
- **Android app registered** with package name `com.costpilot.app` and SHA-1 fingerprint
- **`google-services.json`** downloaded and placed in:
  - Project root: `/google-services.json`
  - Android app: `/android/app/google-services.json`
- **Authentication → Sign-in method:** Google provider **enabled**

#### What Firebase Does NOT Do
- Firebase does **not** manage sessions or tokens
- Firebase does **not** store user data
- The ID token from Firebase is immediately handed to Supabase via `signInWithIdToken()`

---

### 3. Supabase Dashboard

**Location:** [supabase.com/dashboard](https://supabase.com/dashboard) → Your Project → Authentication

#### Authentication → Providers → Google
- **Enabled:** ✅
- **Client ID:** Your **Web Client ID** from Google Cloud Console
- **Client Secret:** The corresponding secret from Google Cloud Console

#### Authentication → URL Configuration

| Setting | Value |
|---------|-------|
| Site URL | `https://costpilot.com` |
| Redirect URLs | `https://costpilot.com/auth` |
|  | `http://localhost:5173/auth` *(for local dev)* |

> **⚠️ CRITICAL:** If `https://costpilot.com/auth` is not listed in Redirect URLs, Supabase will reject the `redirectTo` parameter and fall back to the Site URL, breaking the flow.

---

### 4. Vercel Environment Variables

**Location:** [vercel.com](https://vercel.com) → Project Settings → Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_SITE_URL` | `https://costpilot.com` |
| `VITE_SUPABASE_URL` | `https://orqiymigxotdadysaegv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(your anon key)* |

For **local development**, `.env` should contain:
```
VITE_SITE_URL=https://costpilot.com
```
Change to `http://localhost:5173` if testing the redirect flow locally.

---

## Checklist for New Deployments

- [ ] Google Cloud Console: Web Client ID has `costpilot.com` in authorized JS origins
- [ ] Google Cloud Console: Web Client ID has Supabase callback in redirect URIs
- [ ] Google Cloud Console: Android Client ID has correct package name + SHA-1
- [ ] Firebase Console: Google sign-in enabled, `google-services.json` up to date
- [ ] Supabase Dashboard: Google provider configured with Web Client ID + Secret
- [ ] Supabase Dashboard: `https://costpilot.com/auth` added to Redirect URLs
- [ ] Supabase Dashboard: `http://localhost:5173/auth` added to Redirect URLs (dev)
- [ ] Vercel: `VITE_SITE_URL` set to `https://costpilot.com`
- [ ] Vercel: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set
