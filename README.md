# REPX - Smart Fitness & Workout Tracker

REPX is a modern, full-stack fitness and workout tracking application designed to help users log workouts, create workout splits, track nutrition and progress, connect with a fitness community, and leverage AI-powered workout insights.

---

## 🚀 Features

- **Workout Logging & Tracking**: Real-time logging of sets, reps, weight, and rest timers.
- **Custom Splits & Templates**: Create and customize Push/Pull/Legs, Upper/Lower, or bespoke training schedules.
- **Nutrition & Macro Tracking**: Monitor daily caloric intake, protein, carbs, fats, and hydration.
- **Analytics & Visualizations**: Interactive progress charts powered by Recharts.
- **Social & Community**: Connect with friends, follow athletes, share milestones and workout logs.
- **AI-Powered Insights**: Smart workout recommendations and feedback using Google Gemini AI.
- **Authentication**: Secure JWT authentication and Google OAuth 2.0 integration.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Framer Motion
- **State & Data Fetching**: TanStack React Query + Axios + React Hook Form + Zod
- **UI Components**: Radix UI primitives

### Backend
- **Runtime**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Passport.js (Google OAuth 2.0), bcryptjs
- **AI**: Google Generative AI (Gemini)
- **Security & Utilities**: Helmet, Express Rate Limit, Morgan, Nodemailer

---

## 📂 Project Structure

```text
├── client/          # Vite + React TypeScript Frontend
│   ├── public/      # Static assets
│   └── src/         # Application components, hooks, pages, and services
└── server/          # Node.js + Express TypeScript Backend
    └── src/         # Controllers, models, routes, middlewares, services
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (Local or MongoDB Atlas)

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env # Configure your environment variables
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and the backend on `http://localhost:5000`.

---

## 📄 License
ISC
