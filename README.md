# Community Hero – AI-Powered Hyperlocal Problem Solver 🦸‍♂️🏙️ (Supabase Edition)

Community Hero is a production-grade, full-stack civic reporting platform designed to empower citizens, streamline municipal workflows, and cultivate community-driven solutions for local infrastructure failures.

This version has been fully refactored to utilize **Supabase (PostgreSQL, Storage, Auth, and Realtime)** for durable, secure, and instant real-time community engagement.

---

## 🚀 Key Features

### 1. Citizen Portal 👥
* **Tactile Interactive Map**: Zoom, pan, and drop pins on a vector map representing the municipal district. **Double-click anywhere to capture coordinates** and auto-file reports.
* **AI-Generated Complaint Engine**: Citizens upload a photo of the incident. Gemini AI identifies the issue, generates a professional description, classifies the category, and recommends instant precautions.
* **Hyperlocal Geolocation**: Automatic reverse-geocoding of accurate latitude/longitude coordinates via browser sensors.
* **Verification Loop & Community Upvoting**: Citizens can upvote active complaints or on-site verify reports filed by others to earn bonus points.
* **Gamified Leaderboard**: Citizen ranking tiers based on civic engagement (Platinum Guardian, Gold Advocate, Silver Defender).
* **Accrued Rewards Store**: Trade earned points for real rewards, including transit passes, community tree plantings, and local coffee vouchers.

### 2. Authority Admin Portal 🛡️
* **Professional Analytics Dashboard**: Aggregate reporting data into scannable KPI widgets.
* **Interactive Data Charts**: Built-in area charts (monthly trends), bar charts (department workloads), and pie charts (category ratios) powered by `recharts`.
* **Dynamic Dispatch Queue**: Administrators review active reports, assign issues to designated departments/crews, write official resolution logs, and mark cases closed.

---

## 🛠️ Tech Stack & Architecture

### Frontend
* **React 19** (Vite-powered Single Page Application)
* **TailwindCSS v4** (Glassmorphic cards, modern off-whites, and deep slate backdrops)
* **Recharts** (Custom vector metrics visualization)
* **Lucide React** (Consistent, modern startup icons)

### Backend & AI
* **Node.js & Express**
* **Gemini 3.5 Flash API** (Integrated via `@google/genai` TypeScript SDK on the server side)
* **Supabase Client SDK** (Used for secure server-side communications with PostgreSQL and Storage)

### Database, Auth, Storage & Realtime
* **Supabase PostgreSQL**: Managed relational tables with primary/foreign key constraints, default values, and indexes.
* **Supabase Storage**: Persistent storage bucket (`community-hero-images`) for user-uploaded issue photos, returning high-speed public URLs.
* **Supabase Realtime**: PostgREST publication subscription updates issue status, comments, and notifications live on the client side without manual refreshing.
* **JWT Session Management**: Robust authentication with protected admin and citizen routes.

---

## 🏢 Database SQL Migration Schema

The complete schema is available under `src/database/schema.sql`.

```sql
-- Profiles (Users)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
    points INTEGER NOT NULL DEFAULT 100 CHECK (points >= 0),
    avatar TEXT,
    reported_count INTEGER NOT NULL DEFAULT 0,
    resolved_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues
CREATE TABLE issues (
    id TEXT PRIMARY KEY,
    reporter_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    reporter_avatar TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'duplicate')),
    image TEXT,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    address TEXT NOT NULL,
    department TEXT NOT NULL,
    urgency TEXT,
    precautions TEXT,
    estimated_resolution TEXT,
    duplicate_of TEXT REFERENCES issues(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}'::text[],
    assigned_to TEXT,
    resolution_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards
CREATE TABLE rewards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    points_cost INTEGER NOT NULL CHECK (points_cost >= 0),
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions
CREATE TABLE redemptions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES rewards(id) ON DELETE CASCADE,
    item_title TEXT NOT NULL,
    points_spent INTEGER NOT NULL CHECK (points_spent >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('reward', 'status_change', 'comment')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 Step-by-Step Installation & Setup

Follow these instructions to download, configure, and host the refactored project yourself.

### 📦 1. Download and Extract ZIP
1. Download the full codebase as a ZIP file from your local AI Studio dashboard settings menu.
2. Extract the archive into a preferred directory.

### 📂 2. Push to GitHub
1. Create a brand new, empty repository on GitHub.
2. Open your terminal in the extracted folder and run:
   ```bash
   git init
   git add .
   git commit -m "feat: complete supabase database migration refactoring"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repository-name.git
   git push -u origin main
   ```

### ⚡ 3. Configure Supabase Cloud DB
1. Create a free account at [Supabase](https://supabase.com/).
2. Initialize a new project (e.g., `Community Hero`).
3. Under **SQL Editor** on your Supabase dashboard, click "New Query", paste the entire SQL contents from `/src/database/schema.sql`, and click **Run**. This will provision all tables, enable RLS, set default constraints, configure seed data, and prepare Realtime channels!

### 🖼️ 4. Storage Bucket Setup
1. Go to **Storage** on your Supabase sidebar.
2. Click **New Bucket**, name it exactly `community-hero-images`, and toggle **Public** on. Click save.

### 🔑 5. Environment Variable Configurations
Create a `.env` file at the root of your project:
```env
# Server configs
PORT=3000
JWT_SECRET="community-hero-secret-key-1337"

# Gemini AI API Key
GEMINI_API_KEY="your-gemini-api-key"

# Supabase Configurations
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_KEY="your-supabase-service-role-or-anon-key"
```

---

## 🚀 Deployed Environments Hosting (Render & Vercel)

This project has been engineered with native separation of concerns, allowing standalone server execution.

### 🖥️ A. Backend Deployment (Render)
1. Log in to [Render](https://render.com/).
2. Click **New +** > **Web Service** > Connect your GitHub repository.
3. Configure the following parameters:
   * **Language**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   * `PORT`: `3000`
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: `your-custom-jwt-secret`
   * `GEMINI_API_KEY`: `your-google-gemini-key`
   * `SUPABASE_URL`: `your-supabase-api-url`
   * `SUPABASE_KEY`: `your-supabase-service-key`
5. Click **Deploy Web Service** and copy your backend URL (e.g. `https://your-backend.onrender.com`).

### 🎨 B. Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** > **Project** > Import your GitHub repository.
3. In `vercel.json` (already created in root), Vercel automatically proxies `/api/*` traffic directly to your backend on Render. Edit `vercel.json` to paste your Render backend URL into the rewrite destination field:
   ```json
   {
     "version": 2,
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://your-backend.onrender.com/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
4. Click **Deploy**. Your community-hero platform is live and fully operational!

---

## 🛠️ Troubleshooting Guide

* **Issue**: The linter fails with Type errors on `process.env`.
  * **Fix**: Ensure `@types/node` is installed, and the app has been compiled. Running `npm run lint` uses our fully compatible ESNext types setup.
* **Issue**: Image upload fails or returns raw base64.
  * **Fix**: Double check that your Supabase Storage bucket is named exactly `community-hero-images` and is set to **Public**.
* **Issue**: Realtime is not receiving updates.
  * **Fix**: Ensure you have executed the publication script in Supabase:
    `alter publication supabase_realtime add table issues;`

---

## 🛡️ Security Implementations
* **Row Level Security (RLS)**: Tables are secured in Supabase, restricting access policies.
* **Server-Proxy AI Handling**: The Gemini API is accessed exclusively on the server side. API keys are never exposed to client-side bundles.
* **Role-Based Authorization (RBAC)**: Routing utilizes JWT-verified authentication middlewares to protect administrative statuses and citizen logs.
