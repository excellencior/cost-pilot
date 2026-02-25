# CostPilot

CostPilot is a modern, premium financial companion designed to give you complete control over your expenses. Built with a **local-first philosophy**, it ensures your data remains private and accessible, with optional high-speed cloud sync for cross-device harmony.

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 💎 Premium Features

CostPilot isn't just another expense tracker—it's a high-performance tool built for speed and visual clarity.

- **🚀 High-Performance Dashboard**: Instant insights into net balance, income, and expenses with fluid, interactive charts.
- **📅 Dual-Mode History**: Seamlessly toggle between a detailed transaction list and a beautiful **Calendar View** to visualize spending rhythms.
- **☁️ Intelligent Cloud Sync**: Powered by Supabase. Secure your data with optional cross-device synchronization that you control.
- **🔒 Local-First, Always**: Your financial data belongs to you. Fast local storage ensures zero-latency performance even without internet.
- **📄 Professional Exports**: Generate crisp, clean PDF financial reports or CSV data exports directly from your phone or web browser.
- **🌓 Adaptive Aesthetics**: A meticulously crafted design system with full **Dark Mode** support, smooth micro-animations, and a slick, professional feel.
- **🤖 Gemini AI (Internal Preview)**: Experimental integration with Google Gemini for automated categorization and financial insights.

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Mobile**: Capacitor (Native Android support)
- **Data Layer**: Supabase (PostgreSQL + Realtime Sync)
- **Security**: Firebase Google OAuth
- **Styling**: Tailwind CSS & Material Symbols
- **Visuals**: Recharts, jsPDF + autoTable
- **Intelligence**: Google Generative AI (Gemini)

## 🛠️ Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Android Studio** (for mobile builds)

### Installation

1.  **Clone & Install**:
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

## 📱 Mobile Workflow

CostPilot is fully optimized for Android.

```bash
# Sync web build to Android
npm run build:android

# Launch in Android Studio
npx cap open android
```

---

<p align="center">
  Built with ❤️ for personal financial excellence
</p>
