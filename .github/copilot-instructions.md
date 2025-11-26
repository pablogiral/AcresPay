# Copilot / AI Agent Instructions for AcresPay

This file gives focused, actionable guidance for an AI coding agent working on AcresPay. Keep entries concise and reference real files.

- **Big picture**: Full-stack TypeScript app (Express backend + Vite-mounted React frontend). Backend lives in `server/`, frontend in `client/`, DB schema in `shared/schema.ts`, and small cloud services in `cloud-run-service*/` for container deploy examples.

- **How the app runs (dev)**: Use project root. Key commands:
  - `npm install` then `npm run db:push` to apply Drizzle schema.
  - `npm run dev` starts the Express server which mounts Vite in development (see `server/index.ts` and `server/vite.ts`).
  - Env: copy `.env.example` → `.env` and set `DATABASE_URL` and `SESSION_SECRET` (Replit Auth requires `ISSUER_URL` / `REPL_ID` when testing OIDC flows).

- **Primary files to inspect**:
  - `server/index.ts` — app bootstrap, request logging, Vite setup in dev, port/host behavior.
  - `server/routes.ts` — all REST endpoints, Zod request validation, and `isAuthenticated` middleware usage.
  - `server/replitAuth.ts` — authentication setup (Replit Auth, passport, sessions).
  - `server/storage.ts` — database access and business logic (Storage abstraction used by routes).
  - `shared/schema.ts` — canonical Drizzle schema and exported types used by both backend and frontend.
  - `client/src/*` — frontend pages and components. Important ones: `ReceiptLineItem.tsx` (inline claim UI), `SettlementPage.tsx` (settlement algorithm), `App.tsx` (routing + `useAuth`), and `lib/queryClient.ts` (React Query setup).

- **Architecture & data flow notes**:
  - Routes use Zod schemas inside `server/routes.ts`; follow that pattern for validation.
  - Backend uses a `storage` abstraction (see `server/storage.ts`) — prefer adding DB logic here rather than in route handlers.
  - `shared/schema.ts` contains Drizzle tables + Zod insert schemas; frontend types (e.g., `BillWithDetails`) are exported here — change carefully and push schema with `npm run db:push`.
  - Sessions are stored in Postgres (`connect-pg-simple`) and Replit Auth integrates via Passport — local dev may bypass full OIDC checks.

- **Frontend conventions**:
  - UI language: Spanish. Keep new copy consistent with the existing Spanish strings.
  - Routing uses `wouter`; top-level routes are declared in `client/src/App.tsx`.
  - State & server sync: TanStack Query (`@tanstack/react-query`) with optimistic updates and rollback patterns (see `ReceiptLineItem.tsx` for examples). Follow same mutation + invalidation style.
  - Performance pattern: use local component state for text inputs and sync to the server on `onBlur` (see Bill name input optimization in README). Avoid syncing on every `onChange`.
  - Color palette: friends use a fixed 10-color palette; color-uniqueness is enforced in friend edit flows (see friends components and `storage` logic).

- **Backend conventions**:
  - Always validate incoming payloads with Zod before calling storage methods — match patterns in `server/routes.ts`.
  - Use `and()` combinator for multi-condition Drizzle queries (the codebase uses this consistently).
  - API responses: JSON only; loggers in `server/index.ts` truncate long responses for readability — keep responses concise in dev logs.

- **Important endpoints & examples**:
  - Get current user: `GET /api/auth/user` (protected by `isAuthenticated`) — used by `useAuth` hook.
  - Create bill: `POST /api/bills` body `{ name, total }` (Zod validated) — storage returns the `id`.
  - Upsert payment: `PUT /api/bills/:billId/payments` body `{ fromParticipantId, toParticipantId, amount, isPaid }` — used by Settlement UI.

- **Debugging tips**:
  - If the dev server dies, check logs printed by `server/index.ts` (these show method/path/status and a short JSON preview).
  - For DB issues, use `npm run db:push` and confirm `DATABASE_URL`. For a quick local DB, the README suggests Docker: `docker run --name acrespay-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15`.
  - Recreate sessions by clearing the `sessions` table if auth problems persist during dev.

- **Testing and safety**:
  - No automated test harness is present. When making changes to DB schema or storage, run `npm run db:push` and exercise endpoints via the UI or `curl`.
  - Avoid multi-file sweeping changes; prefer small targeted edits. When changing types in `shared/schema.ts` ensure `db:push` is run.

- **Style & PR guidance for AI agents**:
  - Keep code changes minimal and local to the requested feature. Match the project's TypeScript + formatting style.
  - When adding endpoints, add Zod validation in `server/routes.ts` and the implementation in `server/storage.ts` or the existing storage abstraction.
  - For frontend mutations, follow existing React Query patterns (optimistic update + rollback + invalidate queries).

If anything is unclear or you want this file to include more examples (e.g., common SQL queries, specific component snippets), tell me which area to expand. 
