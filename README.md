# DonorHub - Centralized Blood Availability System

DonorHub is a modern React web application built with TypeScript, Vite, TailwindCSS, and Supabase. It connects blood donors, hospitals, and system administrators to manage and coordinate blood donations and request fulfillment in real-time.

## Features

- **Auth System**: Custom user sign-up and log-in with role assignment (`donor`, `hospital`, `admin`).
- **Donor Dashboard**: Allows donors to toggle their availability status, view compatible blood requests, and accept or decline requests.
- **Hospital Dashboard**: Allows hospitals to create blood requests, view real-time request status, and track donor responses.
- **Admin Dashboard**: Offers analytical KPIs, recent registrations, and blood group distribution metrics.
- **Real-time Notifications**: Custom notifications using Supabase real-time database channels to alert users of compatibility updates and status changes.
- **Search & Filters**: Comprehensive search page for finding donors by blood group, city, district, and availability.

---

## Directory Structure

```text
donorhub/
├── public/
│   └── assets/
│       └── hero-illustration.svg    # Hero page illustration
├── src/
│   ├── assets/                      # Application icons & static assets
│   ├── components/                  # Reusable UI Components
│   │   ├── Button.tsx
│   │   ├── NotificationToast.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── DonorSearchFilter.tsx
│   ├── contexts/                    # React State Contexts
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── pages/                       # Application Route Pages
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DonorDashboard.tsx
│   │   ├── HospitalDashboard.tsx
│   │   ├── CreateBloodRequest.tsx
│   │   ├── RequestDetails.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── EditProfilePage.tsx
│   │   └── NotificationsPage.tsx
│   │   └── DonorListPage.tsx
│   ├── services/                    # Wrappers for external services
│   │   └── supabaseClient.ts
│   ├── styles/                      # Stylesheets and configs
│   │   └── index.css
│   ├── App.tsx                      # App entry point wrapping providers
│   ├── main.tsx                     # ReactDOM bootstrap file
│   └── routes.tsx                   # React Router configuration
├── supabase/                        # Database schemas and configurations
│   ├── setup_complete.sql           # Database complete migration script
│   └── *.sql                        # Individual script pieces
├── scripts/                         # Shell utilities for fast setup
│   ├── setup_project.sh
│   └── run_dev.sh
├── .env.example                     # Reference config file
├── package.json                     # Node dependencies and build script
├── tailwind.config.ts               # Custom Tailwind CSS configuration
├── tsconfig.json                    # Compiler settings
└── vite.config.ts                   # Bundler configuration
```

---

## Getting Started

### Prerequisites

- Node.js (version 18+ recommended)
- A Supabase account and database project

### 1. Database Setup

1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** of your project.
3. Open and copy the contents of `supabase/setup_complete.sql`.
4. Run/Execute the query. This sets up the database schema, enables Row Level Security (RLS) policies, and registers the blood compatibility function.

### 2. Environment Configurations

1. Copy `.env.example` to `.env` in the root:
   ```bash
   cp .env.example .env
   ```
2. Retrieve your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the **Settings > API** page in the Supabase Dashboard and paste them into the `.env` file.

### 3. Installation and Development Runs

Install dependencies:
```bash
npm install
```

Start the Vite local development server on `http://localhost:3000`:
```bash
npm run dev
```

Build production version:
```bash
npm run build
```
