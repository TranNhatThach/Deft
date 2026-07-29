# Deft MVP Security Audit Report

**Project:** Deft — Personal Finance Management App  
**Scope:** Phase 0 -> Phase 5 Full Security Assessment  
**Audit Date:** 2026-07-29  
**Status:** PASSED (With verified controls & active mitigations)  

---

## 1. Rate Limiting Compliance Matrix

All API endpoints are protected against Abuse / Brute-force attacks via `@nestjs/throttler` global guard and custom endpoint decorators.

| Endpoint Path | Method | Rate Limit Configuration | Guard / Decorator | Verified Response on Limit Exceeded |
|---|---|---|---|---|
| `/auth/login` | POST | 5 attempts / 15 minutes (900s) | `@Throttle({ default: { limit: 5, ttl: 900000 } })` | `HTTP 429 Too Many Requests` + `Retry-After` header |
| `/auth/register` | POST | 5 attempts / 15 minutes (900s) | `@Throttle({ default: { limit: 5, ttl: 900000 } })` | `HTTP 429 Too Many Requests` + `Retry-After` header |
| `/auth/refresh` | POST | 5 attempts / 15 minutes (900s) | `@Throttle({ default: { limit: 5, ttl: 900000 } })` | `HTTP 429 Too Many Requests` + `Retry-After` header |
| `/auth/logout` | POST | 100 req / 1 minute (60s) | Global ThrottlerGuard | `HTTP 429 Too Many Requests` |
| `/users/me` | GET / PATCH | 100 req / 1 minute (60s) | Global ThrottlerGuard | `HTTP 429 Too Many Requests` |
| `/categories/*` | GET / POST / PATCH / DELETE | 100 req / 1 minute (60s) | Global ThrottlerGuard | `HTTP 429 Too Many Requests` |
| `/budget-periods/*` | GET / POST / PATCH | 100 req / 1 minute (60s) | Global ThrottlerGuard | `HTTP 429 Too Many Requests` |
| `/budgets/*` | PATCH | 100 req / 1 minute (60s) | Global ThrottlerGuard | `HTTP 429 Too Many Requests` |
| `/transactions/*` | GET / POST / PATCH / DELETE | 100 req / 1 minute (60s) | Global ThrottlerGuard | `HTTP 429 Too Many Requests` |
| `/notifications/*` | GET / PATCH | 100 req / 1 minute (60s) | Global ThrottlerGuard | `HTTP 429 Too Many Requests` |

---

## 2. Hardcoded Secrets Audit

- [x] **Git Repository Scan:** Executed regex scan (`grep -iE "password|secret|api_key|connectionString"`) across codebase. No production secrets found.
- [x] **Environment Variable Isolation:** 
  - Backend secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`) loaded exclusively through `@nestjs/config` `ConfigService`.
  - Docker Compose uses string interpolations (`${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`) reading from root/backend `.env`.
- [x] **Mobile Bundle Protection:**
  - Client application (`mobile-deft`) only imports `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_USE_MOCK`.
  - Zero database credentials, private keys, or JWT secret keys exist within Expo bundle.
- [x] **Gitignore Audit:** Verified root `.gitignore` contains `.env`, `.env.*` (excluding `.env.example`).

---

## 3. Input Validation & Payload Sanitization Audit

- [x] **Global Validation Pipe:** Configured in NestJS `main.ts`:
  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  ```
- [x] **Payload Size Enforcement:** `express.json({ limit: '1mb' })` enforced globally to block denial-of-service via massive JSON payloads.
- [x] **DTO Rule Audit:**
  - `CreateTransactionDto` / `UpdateTransactionDto`: `@IsUUID('4')`, `@Min(0.01)`, `@Max(1000000000000)`, `@IsISO8601()`.
  - `CreateBudgetPeriodDto`: `@IsISO8601()`, `@Min(0)`, `@Max(1000000000000)`.
  - `UpsertBudgetDto` / `UpdateBudgetDto`: `@Min(0)`, `@Max(1000000000000)`.
  - `RegisterDto` / `LoginDto`: `@IsEmail()`, `@MinLength(6)`, `@MaxLength(100)`.
- [x] **Information Leakage Prevention:** Global `HttpExceptionFilter` intercepts database driver exceptions (`P2002`, `P2003`, `P2025`) and sanitizes responses into standard HTTP 400/404/409/500 JSON without exposing internal table schemas or stack traces.

---

## 4. Multi-Tenant Authorization & Data Isolation Test Matrix

Tested cross-tenant resource access by simulating requests using User B's JWT token targeted at User A's resource IDs.

| Resource Endpoint | Action | Access Condition | Result | Security Status |
|---|---|---|---|---|
| `/transactions/:id` | PATCH / DELETE | User B attempts to edit/delete User A's transaction | `403 Forbidden` / `404 Not Found` | PASSED |
| `/categories/:id` | PATCH / DELETE | User B attempts to edit/delete User A's category | `403 Forbidden` / `404 Not Found` | PASSED |
| `/budget-periods/:id/summary` | GET | User B attempts to read User A's period summary | `403 Forbidden` / `404 Not Found` | PASSED |
| `/budgets/:id` | PATCH | User B attempts to edit User A's category budget | `403 Forbidden` / `404 Not Found` | PASSED |
| `/notifications/:id/read` | PATCH | User B attempts to mark User A's notification as read | `403 Forbidden` / `404 Not Found` | PASSED |

---

## 5. JWT Lifecycle & Refresh Token Security Audit

- [x] **Token Expirations:** Access tokens expire in 15 minutes (`15m`). Refresh tokens expire in 7 days (`7d`).
- [x] **Hash Storage:** Refresh tokens are hashed using SHA-256 before storage in database table `refresh_tokens`. Plaintext tokens are never stored.
- [x] **Refresh Token Rotation:** On calling `/auth/refresh`, the old refresh token is immediately revoked (`revoked_at = now()`), and a fresh pair of Access + Refresh tokens is generated.
- [x] **Logout Revocation:** On `/auth/logout`, the refresh token hash is marked as revoked in database, blocking any future refresh calls with that token.

---

## 6. Residual Vulnerabilities & Recommendations

| Vulnerability / Concern | Severity | Current Status | Recommendation / Fix Plan |
|---|---|---|---|
| Lack of HTTPS in local dev environment | Low | Dev mode only | Enforce TLS/HTTPS termination via Reverse Proxy (Nginx / Caddy) on production VPS. |
| Single-origin CORS setting | Low | Dev mode only | Restrict CORS `origin` to specific mobile app scheme / web domain in production. |
| In-app notification delivery without push | Low | By Design (MVP Scope) | Upgrade to FCM / APNS in post-MVP phase for background push notifications. |
