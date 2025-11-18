# AcresPay - Bill Splitting Web App (Spanish)

## Overview
AcresPay is a full-stack bill-splitting web application designed to simplify the process of dividing restaurant bills among friends. It features user authentication, tools for creating and managing bill tickets, a friends list with unique color assignments, and tracking of payment completions. A key innovation is the ability to combine multiple tickets to minimize settlement transfers, calculating optimal payment flows between participants. The application aims to provide an easy and fair way to manage shared expenses.

## User Preferences
- Language: Spanish (all UI text)
- Design: Modern, mobile-first, Material Design influence
- Interactions: Inline (no modals for claim management)

## System Architecture
The application is built with a clear separation between frontend and backend.

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth, Passport.js, and express-session, with PostgreSQL-backed sessions (`connect-pg-simple`).
- **Database**: PostgreSQL via Neon (`@neondatabase/serverless`).
- **ORM**: Drizzle ORM with Drizzle-Zod for schema validation.
- **API**: RESTful API with Zod schema validation and authentication middleware for protected routes.
- **Database Schema**: Includes tables for `sessions`, `users`, `friends`, `bills`, `participants`, `lineItems`, `claims`, and `payments`. This schema supports user accounts, friend management, bill details, itemized claims, and payment tracking.

### Frontend
- **Framework**: React with TypeScript.
- **Routing**: Wouter.
- **State Management**: @tanstack/react-query (TanStack Query v5) for data fetching and caching.
- **UI Components**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS.
- **Key Features**:
    - **Bill Management**: Create, view, edit, and delete bills; designate a payer; auto-calculate totals from line items.
    - **Friends Management**: Save and manage friends with customizable colors; add friends to bills; deletion validation prevents removing friends with pending payments.
    - **Participant Management**: Add participants (from friends list or new) with color-coded avatars.
    - **Line Item Management**: Add items with descriptions, quantities, and prices; toggle between individual and shared modes; assign claims using +/- buttons or checkboxes.
    - **Settlement Calculation**: Calculates who owes whom, generating a minimal set of transfers.
    - **Payment Tracking**: Mark payments as completed; real-time UI updates; "¡Todo Pagado!" banner; payment status persists across sessions.
    - **Combined Tickets**: Select multiple tickets for combined settlement; smart participant matching; optimized transfer calculation to minimize transactions across all selected bills.
    - **Payment Status Visualization**: Bills are marked as "Pagado" with visual indicators when all associated payments are completed.

### UI/UX Decisions
- Uses a 10-color palette for friends and participants.
- Random color option for friends is preselected by default.
- Navigation includes a Landing page, Main Menu, Bill editor, Friends list, My Bills history, Settlement view, Combine Tickets selector, and Combined Settlement view.
- Inline editing for claim management to avoid modal interruptions.

## External Dependencies
- **Replit Auth**: For user authentication (supports Google, GitHub, email/password).
- **Neon Database**: Provides serverless PostgreSQL database hosting.
- **Web Share API**: Integrated for sharing settlement instructions.

## Recent Implementation Notes

### Combined Settlements Payment Marking (Nov 18, 2025)
- Implemented pragmatic payment marking in CombinedSettlementPage using existing backend payment records
- paymentsWithKeys maps all existing payments to { payment, fromKey, toKey } using participant names/colors
- togglePaymentMutation finds relevant payments bidirectionally and updates using exact backend amounts
- getPaymentStatus verifies all related payments (bidirectional) are marked as paid
- Works by referencing existing payment records created from individual bill settlements
- Limitation: Can only mark settlements that have corresponding payment records; optimized combined settlements without underlying payments cannot be toggled (users mark these in individual bill views)
- Design decision: Uses canonical backend payment data to avoid calculation divergence; chose pragmatic solution over adding combined_payments table