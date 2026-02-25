<div align="center">
  <img width="1200" height="475" alt="CostPilot Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CostPilot

CostPilot is a modern, premium financial companion designed to give you complete control over your expenses. Built with a "local-first" philosophy, it ensures your data remains private and accessible, with optional high-speed cloud sync for cross-device harmony.

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.0-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Key Features

- **📊 Dynamic Dashboard**: Get instant insights into your net balance, total income, and monthly expenses with sleek, interactive charts.
- **📅 Visual History**: Toggle between a detailed transaction list and a beautiful calendar view to track your spending patterns over time.
- **☁️ Cloud Sync (Supabase)**: Experience seamless data backup and cross-device synchronization. Toggle cloud backup whenever you need it.
- **🔒 Private & Secure**: Local-first storage ensures your data stays on your device. Secure Google authentication handles your profile.
- **📄 Pro Exports**: Generate professional PDF financial reports or CSV data exports directly from your device (Web & Mobile supported).
- **🌓 Adaptive UI**: A premium design system with full Dark Mode support, featuring smooth micro-animations and responsive layouts.
- **🤖 AI Insights**: (Coming Soon) Leveraging Google Gemini for intelligent financial advice and automated transaction categorization.

## 🚀 Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Mobile**: Capacitor (Android native support)
- **Database/Backend**: Supabase (PostgreSQL + Realtime Sync)
- **Authentication**: Firebase Authentication (Google OAuth)
- **Styling**: Tailwind CSS, Material Symbols
- **Visuals**: Recharts (Graphs), jsPDF + autoTable (Reports)
- **AI Integration**: Google Generative AI (Gemini)

## 🛠️ Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Android Studio** (for mobile builds)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/cost-pilot.git
    cd cost-pilot
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory and add your credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_GEMINI_API_KEY=your_gemini_api_key
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 📱 Mobile Workflow (Capacitor)

CostPilot is optimized for Android. To build and run on mobile:

```bash
# Build the web app and sync with Android
npm run build:android

# Open in Android Studio
npx cap open android
```

> [!TIP]
> Always run `npm run build` before `npx cap sync` to ensure your mobile app has the latest changes.

## 📂 Project Structure

- `/components`: UI components and view controllers.
- `/services`: Core logic for Supabase, Auth, and Local DB.
- `/android`: Native Android project files.
- `/docs`: Architectural diagrams and documentation.

## 📄 License

This project is private and intended for personal use by the developer.

---

<p align="center">
  Build with ❤️ by the CostPilot Team
</p>
