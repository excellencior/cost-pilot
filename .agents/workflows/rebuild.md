---
description: Prompt for Architectural Decomposition Agent
---

# CostPilot — Full System Architectural Decomposition Prompt

## Role

You are a senior full-stack systems architect.

Your task is to decompose the CostPilot system (Web + Android + Backend) into clean architectural layers with strict separation of concerns.

Design for:

- 1–5k users (lean but production-safe)
- Clean separation of frontend and backend
- Web + Android parity
- Secure authentication flows
- AI isolation (Gemini)
- Maintainable folder structure
- No unnecessary enterprise overengineering

Do NOT give generic explanations.
Provide diagrams, folder trees, and concrete interface examples.

---

# Project Context

## Frontend
- React 19
- Vite 6
- TypeScript
- Tailwind CSS 3
- Material Symbols
- Outfit + JetBrains Mono
- Hosted on Vercel

## Mobile
- Capacitor 8 (Android WebView wrapper)

## Backend & Infra
- Supabase (PostgreSQL + Auth + Realtime)
- Firebase Authentication (Android native Google One Tap only)

Current structure:

```

/components
/services
/android
/docs
App.tsx

```

The app works but lacks proper layering.

---

# Your Objectives

Decompose into 5 architectural domains:

1. Presentation Layer
2. Application Layer
3. Domain Layer
4. Infrastructure Layer
5. Mobile Integration Layer

For each layer define:

- Responsibility
- What it must NOT do
- Dependency direction
- Folder structure
- Example TypeScript interfaces

Use clean architecture principles but keep it practical.

---

# 1️⃣ Frontend Architecture Decomposition

Propose a production-ready structure such as:

```

/src
/app            # App bootstrap, routing, providers
/features       # Feature modules (transactions, budgets, auth)
/entities       # Domain models and types
/application    # Use cases and orchestration logic
/infrastructure # Supabase, API clients, adapters
/shared         # UI primitives, utilities
/mobile         # Capacitor adapters

```

Improve it if needed.

Explain clearly:

- How Supabase client is abstracted
- Why UI must never call Supabase directly
- Where business logic lives
- Where Gemini calls should live
- How Firebase native auth integrates without polluting domain logic

Provide dependency rule:

```

Presentation → Application → Domain → Infrastructure
↑
Mobile Adapter

````

---

# 2️⃣ Backend & API Boundary Clarification

Clarify architecture:

- Should Gemini be called directly from frontend? (Yes/No and why)
- Should Supabase RPC be used?
- Should a serverless API layer exist for AI?
- Where must business logic live?

Provide a recommendation for:

- Supabase-only architecture
- OR Supabase + minimal serverless AI endpoint

Explain risks of exposing Gemini key.

---

# 3️⃣ Mobile vs Web Separation

Define:

What belongs in `/mobile`:
- Firebase native auth adapter
- Capacitor plugin wrappers
- Platform detection

What must remain platform-agnostic:
- Domain models
- Use cases
- Validation logic
- Financial calculations

Provide adapter pattern example:

```ts
interface AuthProvider {
  signIn(): Promise<AuthSession>;
}
````

Show WebAuthProvider vs AndroidAuthProvider.

---

# 4️⃣ Authentication Architecture

Design unified authentication:

Web:
Google OAuth → Through my app -> Supabase

Android:
Firebase Google Sign-In → ID Token → Supabase session

Explain:

* Where token exchange happens
* Where AuthContext lives
* How session is stored
* How duplication is avoided

Provide authentication flow diagram.

---

# 5️⃣ State & Sync Strategy

Design local-first model:

* Local state store (Zustand or equivalent)
* Optimistic UI updates
* Sync queue
* Supabase realtime listeners
* Conflict resolution using `updated_at`

Provide flow diagram:

```
User Action
  ↓
Local Update
  ↓
Sync Queue
  ↓
Supabase
  ↓
Realtime Listener
  ↓
State Reconciliation
```

Keep simple but robust.

---

# 6️⃣ Build & Bundling Optimization

Given:

* Vite manual chunking
* Android WebView startup constraints

Explain:

* What should be lazy-loaded
* Feature-based code splitting
* Avoiding large initial vendor bundle
* Route-level dynamic imports
* Minimizing WebView cold start

---

# 7️⃣ Security Review

Audit:

* Supabase anon key exposure
* Gemini API key exposure
* Firebase config exposure
* Replay attack risk
* RLS enforcement
* CORS configuration
* XSS surface in WebView

Provide concrete corrections.

---

# Final Deliverables

Your response must include:

1. Layered architecture diagram
2. Final folder structure tree
3. Example TypeScript interface boundaries
4. Authentication flow diagram
5. Sync lifecycle flow
6. Security checklist
7. Build optimization strategy

No filler.
Be concrete.
Assume strong technical literacy.
Do not overengineer.
Focus on clarity and separation of concerns.