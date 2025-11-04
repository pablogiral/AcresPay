# Bill Splitting Web App (Spanish)

## Overview
A full-stack bill-splitting web application where users can upload restaurant receipts, designate a payer, and have participants claim items individually or share costs. The app calculates and displays settlement transfers to balance everyone with the payer.

## Current State
Fully functional MVP with PostgreSQL database, REST API, and React frontend. All features implemented and tested.

## Recent Changes (Nov 4, 2025)
- Fixed settlement calculation algorithm to prevent double-counting when multiple debtors exist
- Corrected database queries using `and()` combinator for multi-condition filtering
- Added complete Zod validation to all API routes
- Fixed shared items gray-out behavior (only individual items should gray out when quantity exhausted)

## Architecture

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL via Neon (@neondatabase/serverless)
- **ORM**: Drizzle ORM with Drizzle-Zod for validation
- **Storage**: DatabaseStorage class implementing IStorage interface
- **Routes**: RESTful API with Zod schema validation

### Database Schema
Located in `shared/schema.ts`:
- `bills`: Main bill/receipt (id, name, date, payerId, total)
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

All endpoints return JSON and use Zod validation:

### Bills
- `POST /api/bills` - Create bill (body: { name, total })
- `GET /api/bills/:id` - Get bill with all details
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
- **Home** (`/`): Main bill editor where users add participants and items
- **Settlement** (`/settlement`): Displays who owes whom and settlement instructions

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
