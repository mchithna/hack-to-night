# 🏦 Hack-to-Night 2026: Online Banking Solution — Comprehensive Audit & Implementation Plan

## Executive Summary

This is a **Next.js 16** online banking app ("Smart Spend / Nova Bank") built for the HTN26 hackathon. After reviewing all **78 files** across the codebase, the project is in a **fragile, partially-built state** with **critical security vulnerabilities intentionally seeded** and numerous functional gaps. Below is a full diagnosis and a phased fix-and-enhance plan.

---

## 🔴 CRITICAL: Security Vulnerabilities (Must Fix First)

> [!CAUTION]
> These are **intentionally planted vulnerabilities** designed to test hackathon participants. Every single one MUST be fixed.

### 1. SQL Injection — All API Routes
Every database query uses **raw string interpolation** instead of parameterized queries:

```diff
# Login (app/api/auth/login/route.ts:27-28)
- WHERE username = '${username}' AND password = '${password}'
+ WHERE username = $1 AND password = $2  -- parameterized

# Transfer (app/api/transfer/route.ts:14-15)
- SET balance = balance - ${amount}
- WHERE account_number = '${fromAccount}'
+ SET balance = balance - $1 WHERE account_number = $2

# Accounts (app/api/accounts/route.ts:17)
- WHERE a.user_id = ${userId}
+ WHERE a.user_id = $1

# Search (app/api/search/route.ts:10-16)
- WHERE username ILIKE '%${q}%'
+ WHERE username ILIKE '%' || $1 || '%'

# Transactions (app/api/transactions/route.ts:11)
- WHERE from_account = '${account}'
+ WHERE from_account = $1
```

**Files affected**: Every file in `app/api/` — [login/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/auth/login/route.ts), [accounts/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/accounts/route.ts), [transfer/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/transfer/route.ts), [search/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/search/route.ts), [transactions/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/transactions/route.ts)

### 2. Plaintext Passwords in Database
[platform-db.ts:56-58](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/lib/platform-db.ts#L56-L58) — Passwords stored as plain text (`'password123'`, `'kasun'`, `'admin'`). Must hash with bcrypt.

### 3. Fake Authentication — No Real Session Management
[login/route.ts:46-53](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/auth/login/route.ts#L46-L53):
- Token is just `base64(userId:role:session-token)` — trivially forged
- Cookies have **no `HttpOnly`**, **no `Secure`** flag
- No session validation on any subsequent request

### 4. Sensitive Data Leaked in API Responses

| Issue | File | Line |
|-------|------|------|
| SQL queries returned to client (`sql` field) | [login/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/auth/login/route.ts) | L38, L57 |
| `GET /api/auth/login` dumps ALL users with passwords | [login/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/auth/login/route.ts) | L5-L13 |
| `process.env` fully exposed | [admin/system/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/admin/system/route.ts) | L16 |
| Database URL in error responses | [platform-db.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/lib/platform-db.ts) | L108 |
| Stack traces in error responses | [platform-db.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/lib/platform-db.ts) | L107 |
| Account PINs retrievable via `?includePins=true` | [accounts/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/accounts/route.ts) | L7-L11 |

### 5. No Authorization on Any API
- [admin/system/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/admin/system/route.ts) — Admin endpoint accessible by anyone; reads cookies but doesn't validate them
- [transfer/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/transfer/route.ts) — Any user can transfer from any account
- [setup/route.ts](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/setup/route.ts) — Database setup publicly accessible

### 6. Transfer API Has No Balance Validation
[transfer/route.ts:12-22](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/api/transfer/route.ts#L12-L22):
- No check if sender has sufficient balance → balances can go negative
- No validation if accounts exist
- No database transaction wrapping → partial failures leave inconsistent state
- Amount not validated (could be negative — effectively stealing money)

---

## 🟠 Structural & Code Quality Issues

### 7. Duplicate/Orphan Files
| File | Issue |
|------|-------|
| [/layout.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/layout.tsx) | Duplicate of [app/layout.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/layout.tsx), imports non-existent `./css/globals.css` |
| [/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/page.tsx) | Duplicate of [app/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/page.tsx) |
| [bank-transfer/globals.css](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/bank-transfer/globals.css) | Exact copy of [app/globals.css](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/globals.css), redundant |

### 8. Smart Spend Page is Empty
[smart-spend/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/smart-spend/page.tsx) — **0 bytes**, completely empty file. Listed in sidebar navigation.

### 9. Inconsistent Styling Architecture
- Mixed approach: Tailwind CSS, CSS Modules, `<style jsx>`, inline styles, and raw CSS classes all used across different pages
- Dark mode defined in CSS but UI is light-only → dark mode will break text visibility
- `!important` overrides fighting CSS specificity in [globals.css:101](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/globals.css#L101)

### 10. `runStatement()` — Dangerous SQL Logger
[platform-db.ts:77](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/lib/platform-db.ts#L77) — Logs every SQL statement including user data to console.

---

## 🟡 Functional Gaps & Bugs

### 11. Login Page is Not Wired
[login/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/(accounts)/login/page.tsx):
- No form submission handler, no `onSubmit`, no `fetch()` to login API
- AuthButton is a generic `<button>` with no click handler
- No state management for username/password inputs

### 12. Sign-Up Page is Not Wired
[sign-up/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/(accounts)/sign-up/page.tsx):
- No API endpoint for registration
- No form handler — AuthButton does nothing
- No input state management

### 13. Reset Password is Not Wired
[reset-password/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/(accounts)/reset-password/page.tsx):
- No OTP generation/verification logic
- No API endpoint for password reset
- Button says "SIGN IN" instead of "RESET PASSWORD"

### 14. Dashboard Uses Hardcoded Data
[dashboard/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/dashboard/page.tsx):
- Balance hardcoded as "Rs. 100, 000" (L46)
- Welcome message hardcoded to "Dilara!" (L43)
- Transactions array is static mock data (L6-L22)
- Saved payees are static dummy entries

### 15. E-Statement Page is a Static Shell
[e-statement/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/e-statement/page.tsx):
- Form doesn't submit or fetch data
- All `<dd>` values are empty
- Account Summary table body is commented out (L87-L91)
- Transaction Details table is empty

### 16. Bank Transfer — BACK Button Bug
[bank-transfer/page.tsx:197](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/bank-transfer/page.tsx#L197):
- The "BACK" button on confirm screen goes to **failure** screen instead of back to form: `onClick={() => setStep('failure')}`

### 17. Bank Transfer — No Actual API Call
[bank-transfer/page.tsx:52-58](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/bank-transfer/page.tsx#L52-L58):
- `handleTransfer()` generates a fake confirmation number
- Never calls `/api/transfer` endpoint
- Never checks balance

### 18. Pay Bills — No Actual API Call
[pay-bills/page.tsx:90-108](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/pay-bills/page.tsx#L90-L108):
- Uses `MOCK_BALANCE = 5000` hardcoded constant
- No API integration

### 19. Accounts Page — Client-Only Mock
[bank-accounts/page.tsx](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/bank-accounts/page.tsx):
- Shows hardcoded "Anura" account card
- Add/Edit/Delete are purely client-side with `console.log` + `alert()`
- No API calls to `/api/accounts`

### 20. Home Page Links to `/accounts` — Route Doesn't Exist
[app/page.tsx:14](file:///d:/User%20Data/Desktop/hack-to-night/hack-to-night-2026-challenge/app/page.tsx#L14): Links to `/accounts` but the actual page is at `/bank-accounts`.

---

## 🟢 What's Working Well
- ✅ Database schema is reasonable (users, accounts, transactions, audit_logs)
- ✅ Docker Compose setup is solid with health checks
- ✅ Sidebar navigation component is well-structured with active state
- ✅ Icon components are cleanly implemented (no external icon library dependency)
- ✅ UI design aesthetic (purple theme, rounded cards) is visually appealing
- ✅ Responsive breakpoints defined in sidebar and dashboard
- ✅ Good form validation logic exists in bank-accounts page (just not connected)

---

## 👥 Team Work Division Plan

To optimize the remaining 7 hours of the buildathon, the implementation has been divided into 4 parallel tracks for your 4-developer team:

- **Developer 1 (Backend & Security)**: Re-architect database interface to use parameterized queries, implement JWT session management, and secure all API routes.
- **Developer 2 (Authentication & Sessions)**: Build registration backend, wire signup/login/reset forms, and write frontend session guard hooks.
- **Developer 3 (Core Banking Integrations)**: Wire dashboard, transfer page, bill payments, and statements to active backend APIs; fix UI bugs.
- **Developer 4 (Smart Spend & UI Polish)**: Build the spending analytics dashboard, standardize CSS/Tailwind, and add skeletons, toast notifications, and transitions.

> [!NOTE]
> The detailed file-by-file checklist and code patterns for each developer are documented in the [dev_work_division_plan.md](file:///C:/Users/minal/.gemini/antigravity-ide/brain/1c3649d1-cc7c-4427-8a4c-26f8c40bf79f/dev_work_division_plan.md) artifact. You can copy-paste each developer's section directly to hand to them.

---

## 🔍 Pre-Submission Verification Plan (All Developers Together)

### Automated Checks
```bash
# Verify build completes without typescript or rendering errors
bun run build

# Run linter and formatter checks
bun run lint
```

### Manual Penetration Testing
- **SQL Injection**: Attempt `' OR '1'='1` in login and search boxes. Verify that they are rejected and no stack trace is leaked.
- **Session Protection**: Copy a request to `/api/accounts` or `/api/transfer` and attempt to execute it from a clean browser or terminal without credentials. Verify that it returns `401 Unauthorized`.
- **Negative Transfers**: Try transferring `-100` or any negative value. Verify that backend rejects it.
- **Overdraft Protection**: Try transferring more money than the account's balance. Verify that backend rejects it and transaction is rolled back.
- **Privilege Escalation**: Attempt to access `/api/admin/system` from a non-admin account. Verify that it returns `403 Forbidden`.

