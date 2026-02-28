# CostPilot — Architectural Decomposition Prompt

## Role

You are a senior full-stack systems architect.

Your task is to analyze and properly decompose the CostPilot web application into clean architectural layers, enforce strict separation of concerns, and propose a production-ready structure.

Design for:

- Scalability (1–5k users initially)
- Maintainability
- Web + Android parity
- Secure authentication flows
- Clear service boundaries
- Future backend extensibility

Do not give generic explanations.  
Provide structured outputs, diagrams (ASCII if needed), and folder architecture trees.

---

# Project Context

CostPilot stack:

## Frontend
- React 19
- Vite 6
- TypeScript
- Tailwind CSS 3
- Material Symbols
- Outfit + JetBrains Mono fonts

## Mobile
- Capacitor 8 (Android)

## Backend & Infrastructure
- Supabase (PostgreSQL + Auth + Realtime)
- Firebase Authentication (Android native Google One Tap only)
- Google Gemini AI (financial insights)
- Vercel (web hosting)

Current structure:

```

/components
/services
/android
/docs
App.tsx

```

The app works but is not properly layered.

---

# Objectives

Break the application into clearly defined architectural domains:

1. Presentation Layer  
2. Application Layer  
3. Domain Layer  
4. Infrastructure Layer  
5. Mobile Integration Layer  

For each layer:

- Define its responsibility
- Define what it must NOT do
- Define dependency direction
- Show folder structure
- Provide example TypeScript interfaces

---

# 1️⃣ Proper Frontend Decomposition

Propose a structure such as:

```

/src
/app
/features
/entities
/shared
/infrastructure
/mobile

```

Improve it if necessary.

Explain:

- How Supabase client should be abstracted
- Where Gemini AI calls should live
- Where Auth state should be handled
- How Firebase native auth integrates without polluting domain logic
- How to prevent UI components from calling Supabase directly

---

# 2️⃣ API & Service Boundaries

Clarify:

- Should Gemini be called directly from frontend?
- Should a serverless API layer exist?
- Should Supabase RPC be used?
- How to avoid exposing business logic client-side?

Provide recommendations with justification.

---

# 3️⃣ Mobile vs Web Separation

Explain:

- What belongs inside `/mobile`
- What must stay platform-agnostic
- How to use Capacitor plugins without leaking into core logic
- How to isolate platform adapters

Provide a dependency diagram such as:

```

UI → Application → Domain → Infrastructure
↑
Mobile Adapter

```

Improve if necessary.

---

# 4️⃣ Authentication Architecture

Design:

- Unified Auth Context
- Google OAuth (Web)
- Firebase Native Google Sign-In (Android)
- Branded `/auth` redirect
- Secure token handoff between Firebase and Supabase

Explain:

- Token exchange flow
- Proper ownership layer
- How to prevent duplication

Provide an authentication flow diagram.

---

# 5️⃣ State & Sync Strategy

Define:

- Local-first data model
- Sync queue architecture
- Offline mutation handling
- Realtime listeners
- Conflict resolution strategy

Provide conceptual data flow diagrams.

---

# 6️⃣ Build & Bundling Optimization

Given:

- Vite manual chunking
- Android WebView constraints

Explain:

- What should be lazily loaded
- How to split feature modules
- How to reduce initial JS payload
- How to optimize for WebView startup

---

# 7️⃣ Security Review

Audit the pipeline for:

- Exposed API keys
- Supabase anon key risks
- Gemini API exposure risk
- Firebase client risks
- Where secrets must live

Provide corrective recommendations.

---

# Final Deliverables Format

Your response must include:

1. Clean layered architecture diagram
2. Folder tree structure
3. Example TypeScript interface boundaries
4. Authentication flow diagram
5. Sync lifecycle flow
6. Security checklist
7. Build optimization plan

No filler content.  
Be concrete.  
Assume the developer is technically strong and wants industry-grade architecture without unnecessary overengineering.