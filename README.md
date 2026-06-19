# 🏦 Nova Bank — Smart Spend
### HTN26 Hackathon · Online Banking Solution

> A full-stack online banking web application built with **Next.js 16**, **PostgreSQL**, and **Docker**.  
> Features real-time account management, secure fund transfers, bill payments, and an AI-powered spending analytics dashboard.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture: Before vs After](#architecture-before-vs-after)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Security Hardening](#security-hardening)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Team & Work Division](#team--work-division)
- [Pre-Submission Checklist](#pre-submission-checklist)

---

## Project Overview

Nova Bank is a hackathon-grade full-stack banking application. It started as a **fragile, vulnerability-seeded codebase** (intentional for the HTN26 challenge) and was rebuilt in 7 hours by a 4-developer team into a secure, fully wired, production-like banking platform.

---

## Architecture: Before vs After

### ❌ BEFORE — Broken State

```
Browser
  │
  └──► Next.js Pages (hardcoded mock data)
          │
          ├── dashboard/page.tsx        ← balance hardcoded "Rs. 100,000", name "Dilara!"
          ├── bank-transfer/page.tsx    ← fake confirmation number, no API call
          ├── pay-bills/page.tsx        ← MOCK_BALANCE = 5000
          ├── bank-accounts/page.tsx    ← console.log + alert() only
          ├── e-statement/page.tsx      ← empty <dd> fields, commented table
          ├── smart-spend/page.tsx      ← 0 bytes, completely empty
          ├── login/page.tsx            ← no form handler, no fetch()
          ├── sign-up/page.tsx          ← no API, no state
          └── reset-password/page.tsx  ← button says "SIGN IN"
                    │
                    ▼
        API Routes (ALL VULNERABLE)
          ├── /api/auth/login           ← SQL injection, base64 fake token
          │                               GET endpoint dumps ALL users + passwords
          ├── /api/accounts             ← ?includePins=true leaks PINs
          ├── /api/transfer             ← no balance check, no DB transaction
          ├── /api/search               ← raw string interpolation
          ├── /api/transactions         ← raw string interpolation
          └── /api/admin/system         ← exposes full process.env, no auth check
                    │
                    ▼
        lib/platform-db.ts
          ├── Passwords in plaintext ("password123", "kasun", "admin")
          ├── runStatement() logs all SQL + user data to console
          ├── Error responses include raw DB connection string + stack traces
          └── Raw string interpolation in ALL queries → SQL injection
```

**Critical Issues Summary:**

| Category | Count | Examples |
|----------|-------|---------|
| SQL Injection vectors | 5 | login, transfer, accounts, search, transactions |
| Sensitive data leaks | 6 | env vars, passwords, PINs, SQL queries, stack traces |
| Unwired frontend pages | 8 | login, signup, reset, dashboard, transfer, bills, accounts, statement |
| Broken navigation | 2 | `/accounts` route missing, BACK button → failure screen |
| Empty/duplicate files | 4 | smart-spend (0 bytes), duplicate layout.tsx, page.tsx, globals.css |

---

### ✅ AFTER — Rebuilt & Secured

```
Browser (Next.js 16 App Router)
  │
  ├── Public Routes                     Auth Routes
  │   ├── /                             ├── /login        ← wired, JWT cookie set
  │   └── /login, /sign-up              ├── /sign-up      ← bcrypt hash, auto-account created
  │       /reset-password               └── /reset-password ← OTP mock / hash update
  │
  └── Protected Routes (session guard hook)
      ├── /dashboard         ← real balance, real name, real transactions
      ├── /bank-transfer     ← calls POST /api/transfer, BACK bug fixed
      ├── /pay-bills         ← real balance from /api/accounts
      ├── /bank-accounts     ← CRUD wired to /api/accounts
      ├── /e-statement       ← dynamic statement generation
      └── /smart-spend       ← NEW: spending analytics dashboard
                │
                ▼
      Secure API Layer (JWT-authenticated)
        ├── POST /api/auth/login        ← bcrypt.compare, JWT cookie (HttpOnly, Secure)
        ├── POST /api/auth/register     ← validate, hash, insert + auto savings account
        ├── POST /api/auth/logout       ← clears auth cookie
        ├── GET  /api/accounts          ← session-scoped, no PIN leaks
        ├── POST /api/accounts          ← create account for authenticated user
        ├── POST /api/transfer          ← balance check, DB transaction, negative amount blocked
        ├── GET  /api/transactions      ← session-scoped account check
        ├── GET  /api/search            ← parameterized ILIKE
        ├── GET  /api/analytics         ← NEW: spend by category
        └── GET  /api/admin/system      ← admin role check (403 if non-admin)
                │
                ▼
      lib/auth.ts (NEW)
        ├── signToken(payload) → JWT
        ├── verifyToken(token) → session
        └── getAuthenticatedSession(req) → middleware helper
                │
                ▼
      lib/platform-db.ts (REBUILT)
        ├── runQuery(text, params[]) ← parameterized queries only
        ├── Error handler → "Internal Server Error" (no leaks)
        └── bcrypt-hashed seed passwords
                │
                ▼
      PostgreSQL (Docker)
        ├── users              (id, username, email, password_hash, role)
        ├── accounts           (id, user_id, account_number, balance, type)
        ├── transactions       (id, from_account, to_account, amount, category, timestamp)
        └── audit_logs         (id, user_id, action, timestamp)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Modules |
| Database | PostgreSQL 15 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| ORM/DB Client | node-postgres (`pg`) |
| Charts | Recharts / CSS-based SVG |
| Containerization | Docker + Docker Compose |
| Package Manager | Bun |
| Notifications | react-hot-toast |

---

## Project Structure

```
/
├── app/
│   ├── (accounts)/
│   │   ├── login/page.tsx          ← ✅ Wired
│   │   ├── sign-up/page.tsx        ← ✅ Wired
│   │   └── reset-password/page.tsx ← ✅ Wired
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      ← ✅ Secured
│   │   │   ├── register/route.ts   ← ✅ New
│   │   │   └── logout/route.ts     ← ✅ New
│   │   ├── accounts/route.ts       ← ✅ Secured
│   │   ├── transfer/route.ts       ← ✅ Secured + DB txn
│   │   ├── transactions/route.ts   ← ✅ Secured
│   │   ├── search/route.ts         ← ✅ Parameterized
│   │   ├── analytics/route.ts      ← ✅ New (Smart Spend)
│   │   ├── admin/system/route.ts   ← ✅ Role-gated
│   │   └── setup/route.ts          ← ✅ Restricted
│   ├── dashboard/page.tsx          ← ✅ Real data
│   ├── bank-transfer/page.tsx      ← ✅ Wired + bug fixed
│   ├── pay-bills/page.tsx          ← ✅ Wired
│   ├── bank-accounts/page.tsx      ← ✅ CRUD wired
│   ├── e-statement/page.tsx        ← ✅ Dynamic
│   ├── smart-spend/page.tsx        ← ✅ Built from scratch
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── sidebar.tsx                 ← logout wired
│   └── icons/
├── lib/
│   ├── auth.ts                     ← ✅ New: JWT helpers
│   └── platform-db.ts              ← ✅ Rebuilt: parameterized queries
├── hooks/
│   └── useSession.ts               ← ✅ New: auth guard hook
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## Security Hardening

### What Was Fixed

**SQL Injection — All 5 routes patched**
```typescript
// BEFORE (vulnerable)
`WHERE username = '${username}' AND password = '${password}'`

// AFTER (parameterized)
runQuery('WHERE username = $1 AND password = $2', [username, password])
```

**Password Storage — bcrypt hashed**
```typescript
// BEFORE: stored as "password123", "kasun", "admin"
// AFTER:
const hash = await bcrypt.hash(password, 10);
await runQuery('INSERT INTO users (..., password_hash) VALUES ($1)', [hash]);
```

**Authentication — Real JWT sessions**
```typescript
// BEFORE: base64(userId:role:session-token) — trivially forged, no HttpOnly
// AFTER:
const token = jwt.sign({ userId, username, role }, process.env.JWT_SECRET!, { expiresIn: '1d' });
cookies().set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
```

**Transfer Safety — DB transaction + validation**
```typescript
// AFTER: balance check + atomic transaction
BEGIN;
  SELECT balance FROM accounts WHERE account_number = $1 FOR UPDATE;
  -- reject if balance < amount OR amount <= 0
  UPDATE accounts SET balance = balance - $1 WHERE account_number = $2;
  UPDATE accounts SET balance = balance + $1 WHERE account_number = $3;
  INSERT INTO transactions ...;
COMMIT;
-- ROLLBACK on any error
```

**Removed Data Leaks**
- `GET /api/auth/login` (dumped all users + passwords) → **deleted**
- `process.env` exposure in `/api/admin/system` → **removed**
- `?includePins=true` query param → **blocked**
- DB URL and stack traces in error responses → **replaced with generic messages**
- SQL query echo in responses → **removed**

---

## Features

### Core Banking
- **Dashboard** — real-time account balance, recent transactions, saved payees
- **Bank Transfer** — account-to-account transfers with balance validation and confirmation flow
- **Pay Bills** — bill payments drawn from live account balance
- **Bank Accounts** — view, add, edit, delete accounts (CRUD)
- **E-Statement** — dynamic statement generation with computed totals

### Authentication
- Secure registration with bcrypt password hashing
- JWT session management with HttpOnly cookies
- Route-level session guard (unauthenticated users → `/login`)
- Logout clears server-side cookie

### Smart Spend Analytics *(built from scratch)*
- Spending breakdown by category (Shopping, Bills, Transfers, Savings)
- Monthly progress tracker
- Savings goal meter
- Spend alert thresholds with warning banners
- Visual charts (donut / bar using Recharts)

### UX Polish
- Toast notifications (replaces `alert()` popups)
- Skeleton loaders on Dashboard, Accounts, Smart Spend
- Smooth transitions (`transition-all duration-300 ease-in-out`)
- Unified Tailwind styling across all pages

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Bun (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 20+

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-team/hack-to-night-2026.git
cd hack-to-night-2026

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

# 3. Start the database
docker compose up -d

# 4. Install dependencies
bun install

# 5. Seed the database (run once)
curl http://localhost:3000/api/setup

# 6. Start the dev server
bun run dev
```

App runs at `http://localhost:3000`

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/novabank
JWT_SECRET=your-super-secret-key-change-in-production
NODE_ENV=development
```

### Default Seed Accounts

| Username | Password | Role |
|----------|----------|------|
| kasun | kasun | user |
| admin | admin | admin |

> ⚠️ Change all passwords after first login in any non-demo environment.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, sets JWT cookie |
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/logout` | Public | Clear auth cookie |
| GET | `/api/accounts` | Required | Get user's accounts |
| POST | `/api/accounts` | Required | Create new account |
| GET | `/api/transactions` | Required | Get transaction history |
| POST | `/api/transfer` | Required | Execute fund transfer |
| GET | `/api/search` | Required | Search users |
| GET | `/api/analytics` | Required | Spending analytics |
| GET | `/api/admin/system` | Admin only | System info |
| GET | `/api/setup` | Restricted | Seed database |

---

## Team & Work Division

| Developer | Track | Responsibilities |
|-----------|-------|-----------------|
| Dev 1 | Backend & Security | Parameterized DB interface, JWT auth helpers, secure all API routes, transfer DB transactions |
| Dev 2 | Auth & Sessions | Register/login/reset APIs, wire auth forms, logout endpoint, session guard hook |
| Dev 3 | Core Banking | Wire dashboard, transfers, bill pay, accounts, e-statement to live APIs; fix UI bugs |
| Dev 4 | Smart Spend & UX | Build Smart Spend from scratch, unify CSS, add toasts, skeletons, transitions |

### Git Branches

```
main              ← demo-ready, merge here only at submission
dev-1-backend     ← DB, auth lib, secured API routes
dev-2-auth-ui     ← signup, login, reset pages & APIs
dev-3-banking-ui  ← dashboard, transfer, bills, accounts, statement
dev-4-smart-spend ← smart spend UI & API, CSS cleanup
```

---

## Pre-Submission Checklist

### Build Verification
```bash
bun run build    # Must complete with 0 errors
bun run lint     # Must pass
```

### Security Penetration Tests

- [ ] **SQL Injection**: Enter `' OR '1'='1` in login and search — must be rejected, no stack trace
- [ ] **Session Protection**: Call `/api/accounts` via curl without cookies — must return `401`
- [ ] **Negative Transfer**: Submit transfer with amount `-100` — must be blocked by API
- [ ] **Overdraft**: Transfer more than account balance — must be rejected and rolled back
- [ ] **Privilege Escalation**: Access `/api/admin/system` as non-admin — must return `403`

### Functional End-to-End Path

- [ ] Register new user → auto savings account created
- [ ] Login → redirected to dashboard with real balance
- [ ] Transfer funds → balance updates on both accounts
- [ ] View e-statement → correct computed totals
- [ ] Smart Spend → category breakdown matches transaction history
- [ ] Logout → redirected to login, protected routes blocked

---

*Built at HTN26 Hackathon 2026 — 7-hour rebuild sprint 🚀*
