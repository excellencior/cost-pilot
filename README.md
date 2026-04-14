# CostPilot

CostPilot is a modern, premium financial companion designed to give you complete control over your expenses. Built with a **local-first philosophy**, it ensures your data remains private and accessible, with optional high-speed cloud sync for cross-device harmony.

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## Download

**[Download the latest Android APK from GitHub Releases](https://github.com/excellencior/cost-pilot/releases)**

> **Installation Note:** This app is built and signed locally and is not yet registered on Google Play. During installation, your device may display a security warning (e.g., "Install unknown apps" or Google Play Protect alerts). This is standard behavior for any app distributed outside the Play Store and does not indicate a security issue. Google Play registration is planned for a future release.

---

## Features

### Dashboard and Overview
- High-performance dashboard with instant insights into net balance, income, and expenses
- Fluid, interactive charts for at-a-glance financial summaries

### Transaction Management
- Add, edit, and categorize income and expense entries
- Segmented status and category controls for quick data entry

### History and Calendar View
- Detailed chronological transaction list with filtering and search
- Calendar View to visualize daily spending rhythms and patterns

### Cloud Sync
- Optional cross-device synchronization powered by Supabase
- Secure, user-controlled data replication over PostgreSQL with Realtime Sync

### Local-First Architecture
- All financial data stored locally for zero-latency performance
- Full functionality without internet connectivity

### Export and Reporting
- Generate professional PDF financial reports directly from the app
- CSV data exports for spreadsheet analysis

### Theming and Design
- Full Dark Mode support with adaptive color system
- Smooth micro-animations and polished transitions throughout the interface
- Material Symbols iconography for a clean, consistent look

### AI-Powered Insights (Internal Preview)
- Experimental integration with Google Gemini for automated categorization
- AI-generated financial insights and spending summaries

---

## Tech Stack

| Layer          | Technologies                                  |
|----------------|-----------------------------------------------|
| Frontend       | React 19, TypeScript, Vite                    |
| Mobile         | Capacitor (Native Android)                    |
| Data Layer     | Supabase (PostgreSQL + Realtime Sync)         |
| Authentication | Firebase Google OAuth                         |
| Styling        | Tailwind CSS, Material Symbols                |
| Visualizations | Recharts, jsPDF + autoTable                   |
| Intelligence   | Google Generative AI (Gemini)                 |

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Android Studio** (for mobile builds)

### Installation

1.  **Clone and Install**:
    ```bash
    git clone https://github.com/excellencior/cost-pilot.git
    cd cost-pilot
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env` file with your credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GEMINI_API_KEY=your_gemini_api_key
    ```

3.  **Run Dev**:
    ```bash
    npm run dev
    ```

## Mobile Workflow

CostPilot is fully optimized for Android.

```bash
# Sync web build to Android
npm run build:android

# Launch in Android Studio
npx cap open android
```

---

<p align="center">
  Built for personal financial excellence.
</p>
