<div align="center">

# ⚡ FITFORGE OS
### *The Autonomous Hypertrophy, Precision Nutrition & Biometric Performance Operating System*

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=800&size=24&duration=3000&pause=1000&color=10B981&center=true&vCenter=true&width=650&lines=24%2F7+Cloud+Sync+%E2%80%A2+TiDB+Cloud+Serverless;Precision+Hypertrophy+%26+Strength+Protocol;Automated+Sleep+%26+Biometric+Telemetry;Cross-Platform+Android+APK+%2B+Web+App)](https://git.io/typing-svg)

<p align="center">
  <img src="https://img.shields.io/badge/FitForge%20OS-v2.5%20Apex-10B981?style=for-the-badge&logo=android&logoColor=black" alt="Version" />
  <img src="https://img.shields.io/badge/TiDB%20Cloud-Serverless%20MySQL-06B6D4?style=for-the-badge&logo=mysql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/Backend-Render%2024%2F7%20Live-14B8A6?style=for-the-badge&logo=render&logoColor=white" alt="Cloud API" />
  <img src="https://img.shields.io/badge/Framework-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Mobile-Capacitor%208%20Native-3880FF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor" />
</p>

---

[📱 Download Latest Android APK](https://github.com/Nersu-Abhinav/FitForge/releases) • [🌐 Live Cloud API](https://fitforge-ji4u.onrender.com/api/health) • [✨ Feature Tour](#-core-features) • [🚀 Quickstart](#-quickstart--installation)

---

</div>

<br/>

## 🌌 Overview

**FitForge** is a next-generation, cybernetic fitness and health management ecosystem engineered for lifters, bodybuilders, and high-performance athletes. It bridges the gap between raw training logs, clinical nutrition tracking, and systemic biometric recovery by pairing local-first optimistic state with 24/7 cloud synchronisation powered by **TiDB Cloud** and **Node.js/Express**.

```
  ╔══════════════════════════════════════════════════════════════════════════════════╗
  ║                              FITFORGE ARCHITECTURE                               ║
  ║                                                                                  ║
  ║   [ Android Mobile APK ] ─── (Capacitor 8 Bridge) ───► [ React 18 + Vite UI ]   ║
  ║                                                                 │                ║
  ║                                                       (Zustand State Store)      ║
  ║                                                                 │                ║
  ║       [ Offline IndexedDB Cache ] ◄── (Optimistic Sync) ────────┴────┐           ║
  ║                                                                      ▼           ║
  ║       [ Render Cloud API ] ───────── (TLS / SSL) ────────► [ TiDB Cloud DB ]     ║
  ║     (Node.js 20 • Express)                                  (18 Active Tables)   ║
  ╚══════════════════════════════════════════════════════════════════════════════════╝
```

<br/>

---

## ⚡ Core Features

<details open>
<summary><h3>🏋️ 1. Hypertrophy & Workout Protocol Engine</h3></summary>

- **Dynamic Split Customizer**: Program 7-day training splits (Push/Pull/Legs, Upper/Lower, Arnold Split, Custom) with automated muscle balancing algorithms.
- **Intelligent Working Set Indexing**: Distinct labels for Warmup (`W`), Drop Sets (`D`), and Failure (`F`) ensuring working sets are accurately numbered (`Set 1`, `Set 2`...).
- **Pausable Live Workout Timer**: Freezes duration automatically when collapsed/minimized and resumes immediately upon returning to the active session.
- **Plate & Dumbbell Calculator**: Instant visual barbell breakdown for 20kg/15kg bars with 25kg, 20kg, 15kg, 10kg, 5kg, 2.5kg, and 1.25kg plates.
- **Live Rest Timer HUD**: Interactive floating timer (30s, 60s, 90s, 120s, 180s) with audio chimes and native haptic vibration.
- **Personal Record (PR) Celebration**: Automatic detection of 1RM, max weight, and volume PRs with celebratory particle animations.

</details>

<details open>
<summary><h3>🥗 2. Precision Nutrition & Macro Tracking</h3></summary>

- **Micro & Macro Breakdown**: Track Calories, Protein, Carbs, Fats, Fiber, Sodium, and Sugar with dynamic progress rings.
- **Smart Food Catalog**: Instant search across 100+ verified food items with customizable portions (grams, ounces, pieces, scoops).
- **One-Tap Hydration Tracker**: Log water consumption (+250ml, +500ml, custom) with animated fluid gauge and quick-sip header buttons.
- **Historical Nutrition Analytics**: 7-day caloric balance vs expenditure comparison charts.

</details>

<details open>
<summary><h3>🧬 3. Biometric Telemetry & Sleep Intelligence</h3></summary>

- **Auto-Calculated Sleep Duration**: Select bedtime and wake-time with automatic overnight crossing calculations (e.g. `11:00 PM` to `07:30 AM` $\rightarrow$ `8h 30m`).
- **Systemic Readiness Score**: Multi-variate readiness algorithm combining sleep quality, muscle soreness, energy level, and resting heart rate.
- **Body Weight & Composition Tracking**: Trendline charts with moving averages and body measurement logs (Chest, Waist, Arms, Thighs).

</details>

<details open>
<summary><h3>☁️ 4. 24/7 Cloud Sync & Offline-First Persistence</h3></summary>

- **TiDB Cloud Serverless Database**: 18 relational MySQL tables storing workouts, custom exercises, food items, logs, PRs, and daily metrics.
- **Render Cloud Backend**: Always-on Node.js production service (`https://fitforge-ji4u.onrender.com/api`).
- **Seamless 4G/5G/Wi-Fi Telemetry**: Syncs transparently across any network without requiring a local laptop server.
- **Zero Data Loss Guarantee**: Local IndexedDB buffer handles offline mutations with queued replay upon reconnection.

</details>

<br/>

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Mobile Core** | ![Capacitor](https://img.shields.io/badge/Capacitor%208-111?style=flat-square&logo=capacitor) | Native Android bridge with Status Bar & Haptic plugins |
| **Frontend Framework** | ![React](https://img.shields.io/badge/React%2018-111?style=flat-square&logo=react) | Modern component architecture with TypeScript |
| **Build Tool** | ![Vite](https://img.shields.io/badge/Vite%205-111?style=flat-square&logo=vite) | Lightning-fast HMR and optimized production bundling |
| **State Management** | ![Zustand](https://img.shields.io/badge/Zustand-111?style=flat-square) | Lightweight, reactive centralized stores |
| **Styling & UI** | ![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-111?style=flat-square&logo=tailwindcss) | Cyberpunk dark glassmorphism design system |
| **Cloud Database** | ![TiDB](https://img.shields.io/badge/TiDB%20Cloud-111?style=flat-square&logo=mysql) | Distributed MySQL serverless database |
| **Backend API** | ![NodeJS](https://img.shields.io/badge/Node.js%2020-111?style=flat-square&logo=node.js) ![Express](https://img.shields.io/badge/Express-111?style=flat-square) | RESTful API deployed on Render |

<br/>

---

## 🚀 Quickstart & Installation

### Option 1: Install Android APK (Recommended)
1. Download **`FitForge.apk`** from the root repository or latest release.
2. Transfer to your Android phone (Android 9.0+ supported).
3. Tap the file to install and launch **FitForge**.

### Option 2: Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Nersu-Abhinav/FitForge.git
cd FitForge

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. (Optional) Run local backend
npm run server
```

### Option 3: Building Android APK from Source

```bash
# 1. Build Vite web assets
npm run build

# 2. Sync with Capacitor Android
npx cap sync android

# 3. Compile Android debug APK
./build_apk.bat
# Output is generated at: android/app/build/outputs/apk/debug/app-debug.apk
```

<br/>

---

## 📂 Project Structure

```
FitForge/
├── android/                   # Native Android Studio project (Capacitor)
├── server/                    # Node.js Express backend & TiDB Cloud connectors
│   ├── server.js              # Production API routes & health check
│   ├── db.js                  # MySQL2 connection pool (TiDB Cloud SSL)
│   └── initDb.js              # Database migrations & schema setup
├── src/
│   ├── components/
│   │   ├── body/              # DailyMetricsModal & Biometrics
│   │   ├── charts/            # Volume & Calorie charts
│   │   ├── common/            # AppBootSplash, SyncBadges, DatePicker
│   │   ├── navigation/        # BottomTabBar & Top Header
│   │   └── workout/           # ActiveWorkoutModal, PlateCalc, Customizer
│   ├── database/              # Seed exercises & food catalogs
│   ├── features/              # AI Insights & Streak calculations
│   ├── screens/               # Home, Workout, Nutrition, Health, Progress
│   ├── store/                 # Zustand store slices (Auth, Workout, Nutrition...)
│   └── utils/                 # Haptics, Dates, Sound effects
├── FitForge.apk               # Production compiled Android APK
└── package.json               # Project manifest
```

<br/>

---

## 🛡️ License & Acknowledgements

- **Author**: [Nersu Abhinav](https://github.com/Nersu-Abhinav)
- **License**: MIT License
- **Database**: Hosted on **TiDB Cloud Serverless**
- **Cloud Hosting**: Deployed on **Render**

<div align="center">
  <sub>Built with precision for peak human performance. 🔥</sub>
</div>
