# Design Guidelines: Bill-Splitting App

## Design Approach

**Selected Approach:** Design System (Material Design + Splitwise/Venmo influences)

**Rationale:** This is a utility-focused financial application requiring clarity, efficiency, and precise data handling. The interface needs to support complex interactions (item selection, quantity tracking) while remaining intuitive for quick restaurant bill splits.

**Key Principles:**
- Mobile-first design (primary use case is at restaurants)
- Clear information hierarchy for financial data
- Immediate visual feedback for user actions
- Touch-friendly interaction targets
- Trustworthy, professional aesthetic for money handling

---

## Typography

**Font Family:** Inter (via Google Fonts CDN) for excellent legibility at small sizes

**Hierarchy:**
- App Title/Headers: 24px, semibold (600)
- Section Headers: 18px, semibold (600)
- Receipt Item Names: 16px, medium (500)
- Prices/Amounts: 16px, semibold (600), tabular numbers
- Body Text: 14px, regular (400)
- Helper Text/Labels: 12px, regular (400)
- Small Print: 11px, regular (400)

**Special Treatment:**
- Monetary amounts always use tabular-nums for alignment
- Total amounts: 20px, bold (700)

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Micro spacing (gaps, icon margins): 2
- Component internal padding: 4
- Section spacing: 6
- Major section breaks: 8

**Container Structure:**
- Max width: max-w-2xl (receipts are naturally narrow)
- Mobile padding: px-4
- Desktop padding: px-6

**Grid System:**
- Receipt items: Single column list
- User avatars/chips: Flex wrap with gap-2
- Settlement summary: Two-column layout (debtor → creditor)

---

## Core Components

### Receipt Upload/Input Card
- Prominent centered card with dashed border
- Icon above text (upload icon from Heroicons)
- Primary action button below
- Alternative: Manual entry link as secondary action
- Padding: p-6

### Receipt Line Item
**Layout:**
- Full-width card with subtle border
- Left section: Quantity badge (rounded pill) + Item name
- Right section: Unit price + Total price aligned right
- Bottom section (when claimed): User chips showing who claimed portions
- Padding: p-4, gap-3 between sections

**States:**
- Unclaimed: Full opacity, interactive
- Partially claimed: Normal state with progress indicator
- Fully claimed: Reduced opacity, non-interactive
- User's claimed items: Subtle background treatment

### Participant Chips
- Small rounded pills (rounded-full)
- User initials or avatar + name
- Size: py-1 px-3, text-sm
- Appear inline/wrapped below claimed items

### Item Selection Modal/Sheet
- Slide-up bottom sheet (mobile) or centered modal (desktop)
- Item details at top: Name, price, available quantity
- Stepper control for quantity selection (-, number, +)
- Large "Claim" button at bottom
- Toggle for "Shared item" mode
- Padding: p-6

### Settlement Summary Cards
- Card per transaction needed
- Format: "[Name] owes [Amount] to [Payer Name]"
- Prominent amount display
- Optional: Direct payment button (future feature)
- Padding: p-4, gap-4 between cards

### Navigation Header
- Fixed top bar
- App logo/name left
- Action buttons right (Share, Settings)
- Border bottom
- Height: h-14

### Progress Indicator
- Thin horizontal bar showing overall progress
- Shows: X of Y items claimed
- Fixed below header or within receipt card

---

## Interaction Patterns

**Item Claiming Flow:**
1. Tap receipt item → Opens selection sheet
2. Adjust quantity with stepper
3. Confirm claim → Updates item card immediately
4. Item shows user chip below

**Shared Items:**
1. Toggle "Shared item" in selection sheet
2. Simplified UI: Just claim/unclaim toggle
3. Shows all participants who've claimed it
4. Auto-splits cost equally

**Visual Feedback:**
- Tapping items: Brief scale animation (scale-95)
- Claiming: Smooth expansion to show user chips
- Quantity changes: Number transitions
- Fully claimed: Fade to reduced opacity
- Success states: Brief green accent (implementation detail)

---

## Page Structures

### 1. Receipt Upload Screen
- Centered card in viewport
- Large upload icon (Heroicons cloud-arrow-up)
- Heading: "Subir Ticket"
- Subtext: "Fotografía o introduce el ticket manualmente"
- Primary button: "Subir Foto"
- Secondary link: "Introducir Manualmente"

### 2. Receipt Details Screen
- Header with receipt info (Restaurant name, date, total)
- Section: "Pagado por" with user selector
- Section: "Participantes" with user chips (add button)
- Scrollable list of line items
- Sticky footer: Progress indicator + "Calcular División" button

### 3. Item Selection Sheet
- Item header (name, original price)
- Available quantity display
- Quantity stepper (large touch targets, h-12)
- Shared item toggle with explanation
- Sticky bottom: Confirm button (full width, h-12)

### 4. Settlement Screen
- Celebration header: "¡División Completa!"
- Summary card: Total amount, number of participants
- List of settlement transactions
- Each card shows: debtor → creditor, amount
- Footer: "Compartir Resumen" button
- Secondary: "Nueva División" link

---

## Accessibility & Usability

- Minimum touch target: 44px (h-11 or larger buttons)
- Clear focus states for keyboard navigation
- Labels for all form inputs
- Sufficient contrast for all text
- Error messages in context (below inputs)
- Loading states for async operations
- Empty states with helpful guidance

---

## Icons

**Library:** Heroicons (outline style via CDN)

**Key Icons:**
- Upload: cloud-arrow-up
- Manual entry: pencil-square
- Add participant: user-plus
- Remove: x-mark
- Settings: cog-6-tooth
- Share: share
- Checkmark: check-circle
- Money: banknotes

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column layout
- Bottom sheets for modals
- Sticky header and footer
- Full-width buttons

**Desktop (>= 768px):**
- Centered container (max-w-2xl)
- Centered modals instead of bottom sheets
- Hover states on interactive elements
- Side-by-side layout for settlement cards (if space permits)

---

## Images

**No hero image needed** - This is a utility app that should go directly to functionality.

**Optional images:**
- Empty state illustration for "No receipts yet"
- Success celebration graphic on settlement screen
- Small decorative icon in upload area

All images should be simple, friendly illustrations that don't distract from the core functionality.