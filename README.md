# 🏛️ MPLADS AI — Decision Support & Risk Intelligence Backend API

> **“We don’t replace eSAKSHI — we make eSAKSHI intelligent.”**

Backend REST API for **MPLADS AI** (Decision Support & Multi-Signal Risk Intelligence System for MPLADS).

---

## 🛠️ Tech Stack
- **Runtime**: Node.js, Express, TypeScript
- **ORM & Database**: Prisma ORM, PostgreSQL / SQLite
- **Security & Auth**: JWT authentication, bcryptjs password hashing, Zod validation
- **Deployment**: Railway ready (with `railway.json`, `Procfile`, and automated PostgreSQL adapter)

---

## 🚀 Quick Setup & Local Run

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client and push schema
npx prisma generate
npx prisma db push

# 3. Seed 1,000 realistic demonstration works
npm run seed

# 4. Start development server
npm run dev
```
API runs on `http://localhost:5000/api`.

---

## 🚂 Deploying on Railway

1. Create a **New Project** on [railway.app](https://railway.app).
2. Deploy from GitHub repo: `GunaReddy-22/mplads-backend`.
3. Add a managed **PostgreSQL** database service.
4. Set Environment Variables:
   - `JWT_SECRET`: `mplads-ai-super-secret-key-2026-hackathon`
   - `CORS_ORIGIN`: `*`
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
5. Generate a public domain under Networking.
6. The `npm run deploy:railway` command automatically adapts the schema to PostgreSQL, applies migrations, seeds 1,000 records, and starts the API!

---

## 📡 API Endpoints

- `GET /api/health` — Health check & version metadata
- `POST /api/auth/login` — Authentication (`admin@mplads.ai` / `admin123`)
- `GET /api/auth/me` — Current authenticated officer
- `GET /api/dashboard` — National KPIs, category risks, trends & priority queue
- `GET /api/works` — Filtered, searched, paginated works table
- `GET /api/works/:id` — Single work risk breakdown & similar works
- `GET /api/map/works` — Geospatial coordinates and similarity links
- `GET /api/alerts` — System anomaly alerts
- `PATCH /api/alerts/:id` — Update alert status (NEW / UNDER_REVIEW / RESOLVED)
- `GET /api/inspections` — Audit-logged human inspection records
- `POST /api/inspections` — Commit new human verification with SHA-256 evidence hash
- `GET /api/data-quality` — Pre-ingestion validation health score
