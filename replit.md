# Bill Splitting Web App (Spanish)

## Overview
A full-stack bill-splitting web application with user authentication where authenticated users can create restaurant bill tickets, manage a friends list, and view their ticket history. Users can designate a payer and have participants claim items individually or share costs. The app calculates and displays settlement transfers to balance everyone with the payer.

## Current State
Fully functional app with Replit Auth authentication, PostgreSQL database, REST API, and React frontend. All features implemented including user accounts, friends management, and ticket history.

## Recent Changes (Nov 4, 2025)
### Authentication & User System
- Implemented Replit Auth for user authentication (supports Google, GitHub, email/password)
- Added users and sessions tables to database schema
- Created protected API routes requiring authentication
- Added useAuth hook and authentication utilities

### Friends & Navigation
- Added friends table for saving frequently used participants
- Created LandingPage for logged-out users
- Created MainMenuPage as authenticated home with three options: Nuevo Ticket, Amigos, Mis Tickets
- Created FriendsPage for managing saved friends list
- Created MyTicketsPage showing all user's previous tickets
- Modified HomePage to use route parameters (/bill/:billId or /bill/new)
- Updated AddParticipantDialog with tabs to add friends or create new participants

## Architecture

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with Passport.js and express-session
- **Session Storage**: connect-pg-simple (PostgreSQL-backed sessions)
- **Database**: PostgreSQL via Neon (@neondatabase/serverless)
- **ORM**: Drizzle ORM with Drizzle-Zod for validation
- **Storage**: DatabaseStorage class implementing IStorage interface
- **Routes**: RESTful API with Zod schema validation and authentication middleware

### Database Schema
Located in `shared/schema.ts`:
- `sessions`: Session storage for authentication (sid, sess, expire)
- `users`: User accounts (id, email, firstName, lastName, profileImageUrl, timestamps)
- `friends`: User's saved friends (id, userId, name, color, createdAt)
- `bills`: Main bill/receipt (id, userId, name, date, payerId, total)
- `participants`: People splitting the bill (id, billId, name, color)
- `lineItems`: Individual items on the receipt (id, billId, description, quantity, unitPrice, totalPrice, isShared)
- `claims`: Who claimed what (id, lineItemId, participantId, quantity, isShared)

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: @tanstack/react-query (TanStack Query v5)
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Language**: Spanish throughout

## Key Features

### 1. Bill Management
- Create new bills with name and total amount
- Designate a payer who covers the initial bill
- View bill details with all items and participants

### 2. Participant Management
- Add participants with names and color-coded avatars
- Remove participants
- Visual color coding throughout the UI

### 3. Line Item Management
- Add consumption items with description, quantity, and unit price
- Toggle between individual and shared modes inline (no modals)
- **Individual items**: Use +/- buttons per participant to claim quantities
- **Shared items**: Use checkboxes to select which participants share the cost

### 4. Settlement Calculation
- Calculate who owes money to whom based on claims
- Display transfers needed to settle the bill
- Share settlement instructions via Web Share API
- Copy settlement details to clipboard

## API Endpoints

All endpoints return JSON and use Zod validation. All routes except /api/login and /api/logout require authentication.

### Authentication
- `GET /api/login` - Initiate Replit Auth login flow
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/logout` - Log out current user
- `GET /api/user` - Get current authenticated user

### Friends
- `GET /api/friends` - Get all friends for current user
- `POST /api/friends` - Create friend (body: { name, color })
- `DELETE /api/friends/:id` - Delete friend

### Bills
- `POST /api/bills` - Create bill (body: { name, total }) - automatically assigns userId
- `GET /api/bills/:id` - Get bill with all details
- `GET /api/my-bills` - Get all bills for current user
- `PATCH /api/bills/:id` - Update bill (body: { name?, payerId?, total? })

### Participants
- `POST /api/bills/:billId/participants` - Add participant (body: { name, color })
- `DELETE /api/participants/:id` - Remove participant

### Line Items
- `POST /api/bills/:billId/items` - Add item (body: { description, quantity, unitPrice, isShared })
- `PATCH /api/items/:id/shared` - Toggle shared status (body: { isShared })

### Claims
- `PUT /api/items/:itemId/claims/:participantId` - Update/create claim (body: { quantity, isShared })
- `DELETE /api/items/:itemId/claims/:participantId` - Remove claim

## Navigation
- **Landing** (`/` - unauthenticated): Landing page with login button
- **Main Menu** (`/` - authenticated): Main menu with three options: Nuevo Ticket, Amigos, Mis Tickets
- **New/Edit Bill** (`/bill/:billId`): Bill editor where users add participants and items
- **Friends** (`/friends`): Manage saved friends list
- **My Bills** (`/my-bills`): View all previous tickets
- **Settlement** (`/settlement/:id`): Displays who owes whom and settlement instructions

## Important Implementation Details

### Settlement Algorithm
Located in `client/src/pages/SettlementPage.tsx`:
1. Calculate balance for each participant based on their claims
2. Subtract payer's total bill from their balance
3. Match debtors with creditors using greedy algorithm
4. Track mutable creditor balances to prevent double-counting
5. Generate minimal set of transfers

### Inline Claim Management
Located in `client/src/components/ReceiptLineItem.tsx`:
- Individual mode: Shows +/- buttons for each participant
- Shared mode: Shows checkboxes for each participant
- Real-time updates via React Query mutations
- Optimistic UI updates with automatic rollback on error

### Database Queries
All multi-condition queries use `and()` combinator:
```typescript
where(and(eq(claims.lineItemId, lineItemId), eq(claims.participantId, participantId)))
```

## User Preferences
- Language: Spanish (all UI text)
- Design: Modern, mobile-first, Material Design influence
- Interactions: Inline (no modals for claim management)

## Running the Project
- Command: `npm run dev`
- Starts Express server on port 5000
- Serves both API and Vite frontend
- Auto-restarts on file changes

## Database Migrations
- Use: `npm run db:push` to sync schema changes
- Use: `npm run db:push --force` if data-loss warning appears
- Never manually write SQL migrations
