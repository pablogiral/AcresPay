# AcresPay - Bill Splitting Web App (Spanish)

## Overview
A full-stack bill-splitting web application with user authentication where authenticated users can create restaurant bill tickets, manage a friends list with unique colors, track payment completions, and combine multiple tickets to minimize settlement transfers. Users designate a payer and have participants claim items individually or share costs. The app calculates optimal settlement transfers and allows marking payments as completed.

## Current State
Fully functional app with Replit Auth authentication, PostgreSQL database, REST API, and React frontend. All core features implemented including user accounts, friends management with editing, ticket history, payment tracking, and multi-ticket combination with optimized settlements.

## Recent Changes (Nov 4, 2025)
### Authentication & User System
- Implemented Replit Auth for user authentication (supports Google, GitHub, email/password)
- Added users and sessions tables to database schema
- Created protected API routes requiring authentication
- Added useAuth hook and authentication utilities

### Friends & Navigation
- Added friends table for saving frequently used participants
- Created LandingPage for logged-out users
- Created MainMenuPage as authenticated home with four options: Nuevo Ticket, Amigos, Mis Tickets, Combinar Tickets
- Created FriendsPage for managing saved friends list
- Created MyTicketsPage showing all user's previous tickets
- Modified HomePage to use route parameters (/bill/:billId or /bill/new)
- Updated AddParticipantDialog with tabs to add friends or create new participants

### Friend Editing (Nov 4, 2025)
- Implemented friend editing functionality with PATCH /api/friends/:id endpoint
- User can change both name and color of saved friends
- Color palette of 10 predefined colors
- Colors can be repeated across multiple friends (no uniqueness restriction)
- EditFriendDialog component for inline editing

### Payment Tracking System (Nov 4, 2025)
- Added payments table to database schema with full relations
- Implemented payment tracking checkboxes in SettlementCard component
- Added "¡Todo Pagado!" banner that appears when all payments are marked as completed
- Anyone can mark payments as completed (not just bill owner)
- Real-time UI updates when toggling payment status
- Payment state persists across sessions via database
- PUT /api/bills/:billId/payments endpoint for upserting payment status

### Combined Tickets Feature (Nov 4, 2025)
- Implemented multi-ticket combination to minimize total settlement transfers
- Created CombineTicketsPage for selecting which tickets to combine
- Created CombinedSettlementPage showing optimized transfers across all selected tickets
- Smart participant matching by name (case-insensitive) and color across tickets
- Displays individual ticket totals and combined grand total
- Shows per-person balance across all tickets
- Web Share API integration for sharing combined settlement instructions
- New "Combinar Tickets" option in main menu with Combine icon

### Performance Optimizations
- Fixed input performance issue: Bill name input now uses local state and only syncs to server onBlur instead of onChange
- This prevents excessive API calls on every keystroke, dramatically improving UI responsiveness
- Pattern: Use local state for form inputs, sync to server only when user finishes editing

### UX Improvements (Nov 4, 2025)
- Updated landing page subtitle to "Divide cuentas de forma fácil" (simplified from "fácil y justa")
- Added random color option for friends: multicolor button shown first and preselected by default
- When random color selected, system auto-assigns an available color from the palette
- Implemented friend deletion validation: checks all bills for pending payments before allowing deletion
- Added confirmation dialog showing appropriate warning if friend has pending payments
- Shows spinner on delete button while validating pending payments
- Fail-safe approach: if validation fails (network error, etc.), deletion is blocked with error toast

### Bug Fixes
- Fixed critical apiRequest signature bug in payment mutations (was using fetch-style syntax instead of (method, url, data))
- Clarified that bill totals are auto-calculated from line items, not manually entered
- Enhanced friend deletion validation with robust error handling and parallel checks (Promise.all)

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
- `payments`: Payment tracking (id, billId, fromParticipantId, toParticipantId, amount, isPaid, paidAt)

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: @tanstack/react-query (TanStack Query v5)
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Language**: Spanish throughout

## Key Features

### 1. Bill Management
- Create new bills with name (total auto-calculated from line items)
- Designate a payer who covers the initial bill
- View bill details with all items and participants
- Bill name input syncs on blur for optimal performance

### 2. Friends Management
- Save frequently used participants as friends
- Assign colors to each friend from 10 color palette
- Colors can be repeated across multiple friends (no uniqueness restriction)
- Random color option (multicolor button) preselected by default when creating friends
- Auto-assigns a random color when multicolor option selected
- Edit friend name and color anytime
- Add friends to bills from saved list
- Deletion validation: warns if friend has pending payments across any bills
- Fail-safe deletion protection with spinner feedback during validation

### 3. Participant Management
- Add participants with names and color-coded avatars
- Add participants from saved friends or create new ones
- Remove participants
- Visual color coding throughout the UI

### 4. Line Item Management
- Add consumption items with description, quantity, and unit price
- Total automatically calculated from all line items
- Toggle between individual and shared modes inline (no modals)
- **Individual items**: Use +/- buttons per participant to claim quantities
- **Shared items**: Use checkboxes to select which participants share the cost
- Visual "Todo Asignado" badge when all quantities are claimed

### 5. Settlement Calculation
- Calculate who owes money to whom based on claims
- Display transfers needed to settle the bill
- Share settlement instructions via Web Share API
- Copy settlement details to clipboard

### 6. Payment Tracking
- Mark individual payments as completed with checkboxes
- Real-time UI updates showing completed payments with strikethrough
- "¡Todo Pagado!" banner appears when all payments are marked complete
- Payment status persists across sessions
- Anyone can mark payments as completed (not just bill owner)

### 7. Combined Tickets
- Select multiple tickets to combine into one settlement
- Smart participant matching across tickets by name (case-insensitive) and color
- Optimized settlement calculation to minimize total number of transfers
- Display individual ticket totals and combined grand total
- Show per-person balance across all selected tickets
- Share combined settlement instructions

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
- `PATCH /api/friends/:id` - Update friend (body: { name?, color? })
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

### Payments
- `GET /api/bills/:billId/payments` - Get all payments for a bill
- `PUT /api/bills/:billId/payments` - Upsert payment (body: { fromParticipantId, toParticipantId, amount, isPaid })

## Navigation
- **Landing** (`/` - unauthenticated): Landing page with login button
- **Main Menu** (`/` - authenticated): Main menu with four options: Nuevo Ticket, Amigos, Mis Tickets, Combinar Tickets
- **New/Edit Bill** (`/bill/:billId`): Bill editor where users add participants and items
- **Friends** (`/friends`): Manage saved friends list
- **My Bills** (`/my-bills`): View all previous tickets
- **Settlement** (`/settlement/:id`): Displays who owes whom and settlement instructions
- **Combine Tickets** (`/combine-tickets`): Select multiple tickets to combine
- **Combined Settlement** (`/combined-settlement?bills=id1,id2`): Shows optimized transfers across selected tickets

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
