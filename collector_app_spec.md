# Silk Value — Collector App: Screen Flow & Component Specification

> **PRD Source**: Silk Value Architecture & PRD Handover  
> **Role**: Collector (field agent) — collects pupae door-to-door, records weight + grade, generates tickets, syncs to cloud  
> **Total Screens**: 13 (4 tab screens + 9 stack screens)  
> **Design System**: White background `#FFFFFF`, black text `#111111`, grey secondary `#666666`, borders `#E5E5E5`, black buttons. Status accents only: Green `#22C55E` (done), Red `#EF4444` (skip/error), Amber `#F59E0B` (pending/syncing)

---

## Bottom Navigation — 4 Tabs (Consistent on all tab screens)

| Tab | Icon | File | Purpose |
|-----|------|------|---------|
| HOME | `home-outline` | `dashboard.tsx` | Today's route, progress, stops list |
| MAP | `map-outline` | `map.tsx` | Route map view (Phase 2 placeholder) |
| COLLECTIONS | `albums-outline` | `routes/index.tsx` | All assigned routes with progress |
| PROFILE | `person-outline` | `profile.tsx` | Collector identity, settings, sign out |

**Tab bar style**: White background, 1px top border `#E5E5E5`, no shadow, black active icon + label, grey inactive. Height 56px. The tab bar appears on all 4 tab screens. It is hidden on all stack screens (ticket form, route detail, settings, arrived-at-stop, navigate-to-stop, skip-stop, trip-sheet, logout modal).

---

## Navigation Flow

```
LOGIN → OTP → Role check → collector → HOME tab (dashboard)

HOME tab
  └─ Tap a stop card ──────────────────────────────→ Arrived at Stop (stack)
       └─ Tap "Record Collection" ─────────────────→ New Ticket Form (stack)
            └─ Submit ticket ────────────────────────→ Ticket Confirmation (stack)
                 └─ "Back to Route" ─────────────────→ Route Detail (stack)
  └─ Tap "View Full Route" ─────────────────────────→ Route Detail (stack)
  └─ Tap "Start Route" ─────────────────────────────→ Navigate to Stop (stack, first pending stop)
  └─ Tap "Trip Sheet" ──────────────────────────────→ Trip Sheet (stack)

MAP tab
  └─ Standalone (placeholder, no navigation out)

COLLECTIONS tab
  └─ Tap a route card ──────────────────────────────→ Route Detail (stack)
       └─ Tap a stop card ─────────────────────────→ Arrived at Stop (stack)
            └─ same path as HOME tab above

PROFILE tab
  └─ Tap "Settings" ────────────────────────────────→ Settings (stack)
  └─ Tap "Sign Out" ────────────────────────────────→ Logout Confirm (stack)
       └─ Confirm ──────────────────────────────────→ Login screen (session cleared)
```

---

## Screen Directory

| # | Screen Name | File | Tab or Stack | Navbar Shown |
|---|-------------|------|-------------|--------------|
| 1 | Home Dashboard | `dashboard.tsx` | TAB — HOME | Yes |
| 2 | Map View | `map.tsx` | TAB — MAP | Yes |
| 3 | Route List | `routes/index.tsx` | TAB — COLLECTIONS | Yes |
| 4 | Profile | `profile.tsx` | TAB — PROFILE | Yes |
| 5 | Route Detail | `routes/[routeId].tsx` | Stack | No |
| 6 | Navigate to Stop | `navigate-to-stop.tsx` | Stack | No |
| 7 | Arrived at Stop | `arrived-at-stop.tsx` | Stack | No |
| 8 | New Ticket Form | `ticket/new.tsx` | Stack | No |
| 9 | Ticket Confirmation | `ticket/confirm.tsx` | Stack | No |
| 10 | Skip Stop | `skip-stop.tsx` | Stack | No |
| 11 | Trip Sheet | `trip-sheet.tsx` | Stack | No |
| 12 | Settings | `settings.tsx` | Stack | No |
| 13 | Logout Confirm | `logout-modal.tsx` | Stack | No |

---

## Screen-by-Screen Specification

---

### Screen 1 — Home Dashboard
**File**: `app/(collector)/dashboard.tsx`  
**Tab**: HOME  
**Purpose**: The collector's primary daily view. Shows today's active route, overall progress, a quick-start action, and a scrollable list of today's stops.

**Top Bar (always visible, no safe-area overlap)**
- Left: "Silk Value" wordmark, bold
- Right: Collector name (truncated), sync status dot (amber = syncing, green = synced), sync label text "SYNCED" / "SYNCING"

**GPS Alert Banner** (shown only when device location is off)
- Black background, white text: "Location is off. Turn on GPS for accurate stops."
- Right side: "TURN ON" ghost button — opens device location settings via `Linking.openSettings()`
- Banner dismisses automatically once GPS is on

**Date + Route Block**
- Today's date, large and bold (e.g. "Wednesday, 9 Apr")
- Below: Route name + district (e.g. "Route A12 · Ramanagara District")

**Start Route Button** (black pill, full width)
- Label: "Start Route" with play icon
- State changes:
  - If route status is `planned` → shows "Start Route" (triggers status update to `in_progress` and navigates to Navigate to Stop for first pending stop)
  - If route status is `in_progress` → shows "Continue Route" (navigates to Navigate to Stop for next pending stop)
  - If all stops done → shows "End Route" (triggers status update to `completed`)

**Stats Row** (two columns, bordered card)
- Left column: "STOPS COMPLETED" label + "X of Y" value in large bold
- Right column: "TOTAL WEIGHT" label + "XX.X kg" value in large bold
- Divider between columns

**Progress Bar**
- Full width, black fill on `#E5E5E5` track, 6px height
- Fills proportionally to `completedStops / totalStops`
- Shows percentage text above or below: "67% complete"

**"VIEW FULL ROUTE" text link** (ghost, centred below progress)
- Navigates to Route Detail for the active route

**Section Label**: "TODAY'S STOPS" in small uppercase grey

**Stop List** (scrollable, pull-to-refresh triggers sync)
- Each stop shown as a `StopItem` card (existing component)
- Tap a stop → Arrived at Stop screen
- Shows: stop number circle, reeler name, expected kg, status badge (PENDING / DONE / SKIPPED), navigate button

**Empty State** (when no route assigned for today)
- Text: "No route for today"
- Sub-text: "Your supervisor will assign a route. Pull down to refresh."

**Sync Status Bar** (thin strip below top bar, uses existing `SyncStatusBar` component)
- Shows pending count and retry button when unsynced tickets exist

---

### Screen 2 — Map View
**File**: `app/(collector)/map.tsx`  
**Tab**: MAP  
**Purpose**: Placeholder for Phase 2 route map. Shows a clear message so the collector is not confused.

**Header**: "Route Map" text, same style as other tab headers

**Placeholder Content** (centred vertically)
- Map pin icon (large)
- Title: "Map coming soon"
- Subtitle: "Your route stops will be displayed on an interactive map in the next update."
- Below: "In the meantime, use the HOME tab to see your stops in order."

**No navigation out from this screen.** Pull-to-refresh is disabled here.

---

### Screen 3 — Route List
**File**: `app/(collector)/routes/index.tsx`  
**Tab**: COLLECTIONS  
**Purpose**: Shows all routes assigned to this collector (today and historical). Entry point to see any route's stops.

**Header**
- Title: "My Routes"
- No back button (tab screen)

**Route Cards** (scrollable list, pull-to-refresh)
- Each card uses existing `RouteCard` component
- Shows: route name, cluster name, date, stops progress "X/Y stops", progress bar, status badge (ACTIVE / PLANNED / COMPLETED / CANCELLED)
- Active route has black badge; others have grey
- Tap → Route Detail for that route

**Filter Chips Row** (optional, below header)
- Chips: "All" | "Today" | "Completed"
- Default: "Today" selected
- Filters list to show relevant routes

**Empty State**
- Icon + "No routes assigned"
- Sub-text: "Routes assigned by your supervisor will appear here."

---

### Screen 4 — Profile
**File**: `app/(collector)/profile.tsx`  
**Tab**: PROFILE  
**Purpose**: Collector's identity card + navigation to settings and sign out. Fully functional — all actions must work.

**Header**: "Profile" title, no back button

**Avatar Block** (centred)
- Black circle with white initials (first 2 letters of full name)
- Collector's full name below (bold, large)
- Phone number below name (grey)
- Role badge: "COLLECTOR" (outline variant)

**Identity Card** (bordered block)
- Rows with label + value:
  - Full Name
  - Phone
  - Employee ID (from `profiles.employee_id`, show "—" if null)
  - Cluster (from `profiles.cluster_id`, show cluster name)
  - Account Status: shows "VERIFIED" badge (green) or "PENDING" badge (amber)

**Vehicle Info Row** (if vehicle is assigned to today's route)
- "Assigned Vehicle" label
- Vehicle registration number value
- If no vehicle assigned: "No vehicle assigned today"

**Today's Route Summary** (compact card)
- Route name
- Stops: X completed of Y total
- Tap → navigates to Route Detail for today's route

**Menu List** (rows with right-arrow chevron)
- "Settings" → Settings screen
- "Help & Support" → opens WhatsApp or email link (Linking.openURL)
- "App Version" → non-tappable, shows version number from `Constants.expoConfig.version`

**Sign Out Button** (outline button, red label text, full width at bottom)
- Tap → Logout Confirm screen
- Does NOT sign out immediately — always shows confirmation first

---

### Screen 5 — Route Detail
**File**: `app/(collector)/routes/[routeId].tsx`  
**Access**: From HOME tab → "View Full Route", or from COLLECTIONS tab → tap route card  
**Purpose**: Full list of all stops for a specific route. Collector works through this list stop by stop.

**Header**
- Back arrow (left) → goes back to previous screen
- Route name (bold, centre or left)
- Date (grey, small, below route name)

**Route Summary Bar** (horizontal stats, below header)
- Stops: "X / Y completed"
- Weight: "XX.X kg collected"
- Progress bar (full width, black fill)
- Route status badge: PLANNED / IN PROGRESS / COMPLETED

**Vehicle + Collector Info Row**
- Vehicle registration (or "No vehicle")
- Collector name
- Presented as two inline labels

**Section Label**: "STOPS"

**Stop List** (scrollable, NOT pull-to-refresh — data is local)
- Each stop uses `StopItem` component (existing)
- Stop number circle (black filled = pending, outlined grey = done)
- Reeler name + village
- Expected weight in kg
- Status badge: PENDING / DONE / SKIPPED
- Navigate button (only on pending stops) → Navigate to Stop
- Tap anywhere on card → Arrived at Stop

**Footer Action Button** (black pill, full width, fixed above safe area)
- If any stops pending: "Continue to Next Stop" → Navigate to Stop for next pending stop
- If all stops done: "View Trip Sheet" → Trip Sheet screen

---

### Screen 6 — Navigate to Stop
**File**: `app/(collector)/navigate-to-stop.tsx`  
**Access**: From dashboard "Start Route" / "Continue Route", or from Route Detail footer button  
**Purpose**: Pre-arrival screen. Shows the next stop's details and gives directions before the collector physically arrives.

**Header**
- Back arrow
- "Next Stop" label
- Stop number badge (e.g. "Stop 3 of 12")

**Stop Info Card**
- Reeler name (large, bold)
- Village + district
- Expected collection: "~12.5 kg expected"
- Last collection date: "Last collected: 2 Apr 2026" (grey, small)

**Map Placeholder** (Phase 2)
- Greyed-out rectangle with: "Map navigation available in next update"
- Shows static GPS coordinates of the farm if available: "12.9716° N, 77.5946° E"

**Action Buttons** (stacked vertically)
- "Open in Maps" (outline button) → `Linking.openURL('geo:lat,lng')` which opens the device's default maps app
- "I've Arrived" (primary black button) → Arrived at Stop screen

**Skip this Stop link** (ghost, red text, below buttons)
- Tap → Skip Stop screen

---

### Screen 7 — Arrived at Stop
**File**: `app/(collector)/arrived-at-stop.tsx`  
**Access**: From Navigate to Stop → "I've Arrived", or from Route Detail → tap stop card  
**Purpose**: Confirmation screen shown when collector reaches the reeler's location. Marks arrival time. Entry to collection recording.

**Header**
- Back arrow
- "Arrived" label
- Stop number and reeler name as subtitle

**Arrival Confirmation Card**
- Large checkmark or location pin icon
- "You've arrived at:" label
- Reeler name (bold, large)
- Village + district (grey)
- Auto-captured arrival time: "Arrived at 10:34 AM" (set automatically when screen loads — writes `actual_arrival_time` to `route_stops`)
- GPS coordinates captured silently in background

**Reeler Info Row**
- Expected collection quantity: "Expected: ~12.5 kg"
- Last grade: "Previous grade: A" (from last ticket for this reeler, if available)
- Payment preference: "Prefers: UPI" (from reelers table)

**QR Scan Section**
- Label: "Scan Reeler QR to confirm identity"
- Large "Scan QR Code" button (outline with QR icon) → opens device camera in QR scan mode
- On successful scan: shows green confirmation "Reeler confirmed: [Name]" and enables Record Collection button
- On skip/bypass: shows amber warning "QR not scanned — collection will be flagged" and still allows proceeding
- Note: QR scan uses `expo-camera` in barcode mode. Matches scanned hash against `reelers.qr_code_hash`.

**Action Buttons**
- "Record Collection" (primary black button, full width) — enabled after QR scan OR after bypass warning accepted → New Ticket Form
- "Skip this Stop" (ghost, red text) → Skip Stop screen

---

### Screen 8 — New Ticket Form
**File**: `app/(collector)/ticket/new.tsx`  
**Access**: From Arrived at Stop → "Record Collection"  
**Purpose**: Core collection recording form. Captures weight, grade, moisture, crate count. Generates collection ticket. Works fully offline.

**Header**
- Back arrow
- "New Collection" title
- Reeler name as subtitle (pre-filled, non-editable)

**Reeler Confirmation Row** (at top, read-only display)
- Reeler name + village
- QR verified badge (green) or "Not verified" badge (amber)

**Weight Entry Section**
- Label: "WEIGHT"
- Two input fields side by side:
  - "Gross Weight (kg)" — numeric keyboard, validates > 0
  - "Tare Weight (kg)" — numeric keyboard, validates ≥ 0
- Calculated display below: "Net Weight: XX.XX kg" (auto-computed, shown in larger bold text, updates live as user types)
- Bluetooth Scale button (outline, right side): "Connect Scale"
  - Tap → Bluetooth Setup sub-flow (shows paired scale name if already paired, or list of discoverable scales)
  - When scale is connected and reading is stable: weight auto-populates the gross weight field
  - Scale connection status indicator: dot (green = connected, grey = not connected)

**Quality Grade Section**
- Label: "QUALITY GRADE"
- Uses existing `GradeSelector` component — 4 pill buttons: A · B · C · D · Reject
- Selected grade shown in black fill, others in white with border
- D grade shown (was missing from original implementation)

**Additional Fields Section**
- "Moisture %" — numeric input, optional, range 0–100
- "Crate Count" — numeric input, default 1, validates > 0
- "Visual Notes" — multiline text input, optional, placeholder "Any quality observations…"

**Photo Section** (optional)
- Label: "PHOTO EVIDENCE (OPTIONAL)"
- Camera capture button (outline with camera icon): "Take Photo"
- Gallery thumbnail shown after capture (tappable to retake)
- Up to 3 photos supported
- Photos compressed before storing locally

**Price Display Row** (read-only, auto-fetched)
- "Price per kg: ₹XXX.XX (Grade A)" — fetched from `price_lists` for current cluster + grade
- "Total Amount: ₹X,XXX.XX" (price × net weight, updates live)
- Pricing snapshot captured in background (stored as JSON on ticket — immutable record)
- If no price list found: shows amber warning "Price not configured. Contact supervisor."

**GPS Capture** (silent, automatic)
- GPS latitude + longitude captured automatically when screen loads
- No user action required
- Shows small text below form: "Location: 12.9716° N, 77.5946° E" or "Location: not captured" if permission denied

**Submit Button** (black pill, full width, fixed at bottom above keyboard)
- Label: "Generate Ticket"
- Disabled if: gross weight empty, grade not selected, crate count empty
- On tap:
  - Validates all fields
  - Computes net weight = gross − tare
  - Computes total amount = net weight × price per kg
  - Generates ticket number locally: `TKT-YYYY-NNNNN`
  - Creates `idempotency_key` (UUID)
  - Saves ticket to WatermelonDB with `sync_status = pending`, `status = draft`
  - Updates `route_stops.status = completed`, `route_stops.departed_at = now()`
  - Updates `route_stops.collection_ticket_id` with the new ticket local ID
  - Navigates to Ticket Confirmation screen
  - Sync engine picks up the pending ticket and pushes to Supabase in background

---

### Screen 9 — Ticket Confirmation
**File**: `app/(collector)/ticket/confirm.tsx`  
**Access**: From New Ticket Form → successful ticket creation  
**Purpose**: Show the generated digital ticket to the reeler. Share or print option. Confirm before moving to next stop.

**Header**
- No back arrow (prevent accidental navigation away from confirmation)
- "Collection Ticket" title

**Ticket Card** (styled like a physical receipt)
- "SILK VALUE" brand header in uppercase
- "TICKET ID: #TKT-2026-00042" in monospace style
- Horizontal divider (dashed)
- Row: "DATE / TIME" → formatted date + time
- Row: "REELER" → reeler full name
- Row: "VILLAGE" → village name
- Horizontal divider
- Weight grid (3 columns):
  - GROSS | TARE | NET — each with kg value below
- Horizontal divider
- Grade pill: "GRADE A" in bold, black background
- Row: "PRICE / KG" → ₹XXX.XX
- Row: "TOTAL AMOUNT" → ₹X,XXX.XX (large, bold)
- Row: "PAYMENT" → "Instant UPI" or "Weekly Batch" based on reeler preference
- Horizontal divider (dashed)
- Sync status: small dot + "Saved locally — will sync when online" or "Synced to cloud"
- QR barcode placeholder at bottom (ticket number as text for now)

**Action Buttons**
- "Share Ticket" (outline button) → `Share.share()` with formatted text summary of the ticket
- "Back to Route" (primary black button) → navigates back to Route Detail, with the just-completed stop now showing as DONE

**Next Stop Prompt** (below buttons, if more stops remain)
- "Next: [Next Reeler Name] — Stop X of Y"
- Tap → Navigate to Stop for next pending stop

---

### Screen 10 — Skip Stop
**File**: `app/(collector)/skip-stop.tsx`  
**Access**: From Navigate to Stop or Arrived at Stop → "Skip this Stop"  
**Purpose**: Record why a stop is being skipped. Required before skipping — prevents accidental skips.

**Header**
- Back arrow
- "Skip Stop" title
- Stop number + reeler name as subtitle

**Warning Banner**
- Amber background (subtle: `#FEF3C7`)
- Text: "Skipping a stop means no collection will be recorded for this reeler today."

**Reason Selection** (required, pick one)
- Radio-button style rows (tap to select, selected shows black dot):
  - Reeler absent — not home when arrived
  - Access denied — reeler refused collection
  - Bad weather — conditions prevent access
  - Vehicle issue — vehicle breakdown or problem
  - Other — explain below
- If "Other" selected: text input appears below for free-text reason

**Confirm Button** (black, full width)
- Label: "Skip this Stop"
- On tap: updates `route_stops.status = skipped`, writes `skip_reason`, navigates back to Route Detail

**Cancel** (ghost, grey, below confirm button)
- Returns to previous screen without skipping

---

### Screen 11 — Trip Sheet
**File**: `app/(collector)/trip-sheet.tsx`  
**Access**: From HOME dashboard "Trip Sheet" or Route Detail footer "View Trip Sheet"  
**Purpose**: End-of-day summary of all collections on the route. This is the document that goes to the factory gate for cross-weighment.

**Header**
- Back arrow
- "Trip Sheet" title
- Date + Route name as subtitle

**Summary Stats Block** (4 stat cards in 2×2 grid)
- Total Stops Completed: X of Y
- Total Weight Collected: XX.X kg
- Total Tickets Generated: N
- Total Amount (pre-payment): ₹X,XXX.XX

**Vehicle Info Row**
- "Vehicle: KA 07 AB 1234" (from route's vehicle)
- "Collector: [Full Name]"
- "Route: [Route Name]"

**Section Label**: "COLLECTIONS"

**Ticket Summary List** (one row per completed stop)
- Columns: Reeler Name | Weight (kg) | Grade | Amount (₹)
- Skipped stops shown in grey with "SKIPPED" label, no weight or amount
- Sorted by stop order

**Expected Gate Weight Row**
- "Expected Gate Weight: XX.X kg"
- Small note: "This is the total the gate operator will cross-check against."

**Actions**
- "Share Trip Sheet" (outline button) → `Share.share()` with formatted text
- "Mark Route Complete" (primary black button, full width) — only shown if all stops are resolved (done or skipped)
  - On tap: updates `routes.status = completed`, sets `routes.completed_at = now()`
  - Shows success alert: "Route marked as complete. Your supervisor has been notified."

**Sync Status** (small strip at top of list)
- "X of Y tickets synced to cloud" with sync dot indicator

---

### Screen 12 — Settings
**File**: `app/(collector)/settings.tsx`  
**Access**: From PROFILE tab → "Settings"  
**Purpose**: App-level settings for the collector. Sync control, Bluetooth, cache management, offline mode.

**Header**
- Back arrow
- "Settings" title

**Section: SYNC**
- Toggle row: "Auto Sync" — when on, syncs whenever network is available; when off, only manual sync
- "Sync Now" button (outline) — triggers immediate sync, shows spinner during sync, shows "Last synced: X mins ago" below
- "Pending Records: X" — non-tappable status row showing how many local records are waiting to sync

**Section: BLUETOOTH**
- "Weighing Scale" row — shows paired scale name or "No scale paired"
- "Pair / Change Scale" button (outline) → opens Bluetooth device list
  - Lists nearby Bluetooth devices
  - Tap to pair — once paired, scale name is saved to `profiles.paired_scale_mac` and `profiles.paired_scale_name`
  - "Forget Scale" option for currently paired scale

**Section: OFFLINE MODE**
- Toggle row: "Offline Mode" — when on, disables all network calls; app reads only from local WatermelonDB
- Warning text below toggle (amber): "Tickets created in offline mode will sync when you turn this off."

**Section: DATA**
- "Clear Local Cache" (red label, outline button) — confirmation dialog before clearing; clears WatermelonDB and re-syncs from server
- "App Version: 1.0.0" (non-tappable, grey text)

**Sign Out** (red label text, no border, at very bottom of scroll)
- Same as profile sign out → Logout Confirm screen

---

### Screen 13 — Logout Confirm
**File**: `app/(collector)/logout-modal.tsx`  
**Access**: From PROFILE tab or Settings → "Sign Out"  
**Purpose**: Confirm the sign-out action. Prevents accidental logouts.

**Layout**: Centred card on white background (full screen, not a modal overlay)

**Content**
- Title: "Sign out?" (bold, 22px)
- Body text: "You will be signed out on this device. All synced data is safely stored in the cloud. Unsynced tickets will be lost."
- Amber warning card (if unsynced tickets exist): "You have X unsynced tickets. Sync before signing out to avoid data loss." — with "Sync Now" button inside the warning

**Buttons** (stacked, full width)
- "Cancel" (outline button) → goes back, no action
- "Sign Out" (primary black button, red label text) → executes logout
  - Calls `supabase.auth.signOut()`
  - Deletes session from `expo-secure-store`
  - Resets Zustand auth store (`reset()`)
  - Clears WatermelonDB session data
  - Navigates to `/(auth)/login` using `router.replace()` (clears navigation stack)

---

## Components Summary

### Existing Components (already built — do not recreate)

| Component | File | Used On |
|-----------|------|---------|
| `StopItem` | `components/collector/StopItem.tsx` | Dashboard, Route Detail |
| `RouteCard` | `components/collector/RouteCard.tsx` | Route List |
| `GradeSelector` | `components/collector/GradeSelector.tsx` | New Ticket Form |
| `SyncStatusBar` | `components/shared/SyncStatusBar.tsx` | Dashboard |
| `Badge` | `components/shared/Badge.tsx` | Throughout |
| `Button` | `components/shared/Button.tsx` | Throughout |
| `Input` | `components/shared/Input.tsx` | New Ticket Form, Skip Stop |
| `EmptyState` | `components/shared/EmptyState.tsx` | Route List, Dashboard |
| `StatCard` | `components/shared/StatCard.tsx` | Trip Sheet |
| `LoadingSpinner` | `components/shared/LoadingSpinner.tsx` | Loading states |

### New Components (build these)

| Component | File | Used On |
|-----------|------|---------|
| `WeightEntryPanel` | `components/collector/WeightEntryPanel.tsx` | New Ticket Form |
| `BluetoothScaleRow` | `components/collector/BluetoothScaleRow.tsx` | New Ticket Form, Settings |
| `TicketReceiptCard` | `components/collector/TicketReceiptCard.tsx` | Ticket Confirmation |
| `TripSheetRow` | `components/collector/TripSheetRow.tsx` | Trip Sheet |
| `SkipReasonSelector` | `components/collector/SkipReasonSelector.tsx` | Skip Stop |
| `QRScannerSheet` | `components/collector/QRScannerSheet.tsx` | Arrived at Stop |

---

### `WeightEntryPanel` — element detail
- Two text inputs side by side: Gross and Tare, numeric keyboard, decimal allowed
- Below inputs: calculated net weight display, large bold, updates live
- Bluetooth connect button on right side of the gross weight input field
- Scale connection indicator: small dot (green = reading live, grey = manual entry)
- When scale is connected and sending readings: gross weight field auto-populates every 500ms and input is disabled (read-only while scale is live)
- When scale disconnects: field becomes editable again with last known value retained

### `BluetoothScaleRow` — element detail
- Row with scale icon on left
- Scale name or "No scale paired" in centre
- Right side: "Connect" button (outline, small) or "Connected" label in green + "Forget" ghost link
- Tap "Connect" → shows bottom sheet with list of nearby Bluetooth devices (name + signal strength)
- Each device in list: name, address, "Pair" button
- Uses `react-native-ble-plx` or equivalent — note: requires custom dev build, does NOT work in Expo Go

### `TicketReceiptCard` — element detail
- White card, thin border, receipt-style layout
- Header: "SILK VALUE" in bold uppercase
- Ticket number in monospace font
- Dashed horizontal dividers between sections
- Weight grid: 3 equal columns with label above and value below
- Grade displayed as an inverted pill (black background, white text)
- Total amount displayed extra large (the most important number)
- Footer: sync status dot + status text

### `TripSheetRow` — element detail
- Single horizontal row: reeler name (flex 1) | weight in kg | grade badge | amount ₹
- Skipped rows: all text in grey, weight and amount show "—", badge shows "SKIPPED"
- Bottom border separator between rows

### `SkipReasonSelector` — element detail
- Vertical list of tappable reason rows
- Each row: radio dot on left (filled black = selected, empty circle = not selected) + reason text
- "Other" row: when selected, a `Input` multiline field appears below with placeholder "Describe the reason…"
- Selected row has a subtle `#F5F5F5` background to indicate selection

### `QRScannerSheet` — element detail
- Full-screen camera view using `expo-camera` in barcode scanning mode
- Scanning frame overlay: rounded square outline in white with corner marks
- Instruction text below frame: "Point at the reeler's QR code"
- Cancel button (X) at top right → closes camera without scanning
- On successful scan: vibrates, closes camera, shows confirmation in parent screen
- On unsupported device or permission denied: shows fallback "Enter Reeler ID manually" text input

---

## PRD Requirements Coverage

| PRD Requirement | Screen | Status |
|---|---|---|
| Collector starts route | Screen 1 — Start Route button | ✅ |
| GPS + time auto logged | Screen 7 — Arrived at Stop captures `arrived_at` + GPS | ✅ |
| Select reeler / scan QR | Screen 7 — QR scan section | ✅ |
| Weigh pupae (Bluetooth / manual) | Screen 8 — WeightEntryPanel with scale | ✅ |
| Enter crate count | Screen 8 — crate count input | ✅ |
| Quality grade selection | Screen 8 — GradeSelector (A/B/C/D/Reject) | ✅ |
| Photo optional | Screen 8 — photo capture section | ✅ |
| Collection ticket generated | Screen 9 — Ticket Confirmation | ✅ |
| Payment triggered | Screen 8 — ticket creation triggers payment record | ✅ (mocked) |
| Trip sheet auto generated | Screen 11 — Trip Sheet | ✅ |
| Expected gate weight calculated | Screen 11 — shown as "Expected Gate Weight" | ✅ |
| Vehicle + collector ID linked | Screen 5/11 — route detail shows both | ✅ |
| Offline-first | All ticket screens write to WatermelonDB first | ✅ |
| Sync status visible | SyncStatusBar on Dashboard | ✅ |
| Skip reason recorded | Screen 10 — Skip Stop with required reason | ✅ |
| Profile + settings + sign out | Screens 4, 12, 13 | ✅ |
| Bluetooth scale integration | Screen 8 + BluetoothScaleRow component | ✅ |
| QR scan for reeler identity | Screen 7 — QRScannerSheet | ✅ |
| Grade D in grade selector | Screen 8 — GradeSelector updated to include D | ✅ (was missing) |

---

## Gap Fixes Applied vs Original Spec

| Gap | Fix |
|-----|-----|
| No profile tab in original navbar | Added PROFILE as 4th tab. `profile.tsx` is now a full tab screen with identity, menu, and sign out. |
| Settings was a bare screen with only sign out | Settings now has sync control, Bluetooth pairing, offline mode, cache clear, and version info. |
| Routes/[routeId] had no content built | Route Detail screen fully specified with stop list, vehicle info, and footer action button. |
| No screen between route and ticket form | Added Navigate to Stop (pre-arrival directions) and Arrived at Stop (QR scan + arrival confirmation) as proper distinct steps. |
| QR scan missing entirely | Added QRScannerSheet component used in Arrived at Stop. |
| No skip stop screen | Added Skip Stop with required reason selection. |
| No trip sheet screen | Added Trip Sheet with complete summary, expected gate weight, and mark-complete action. |
| Ticket confirmation had no next-stop prompt | Ticket Confirmation now shows next stop name and tap-to-navigate. |
| Grade D missing from GradeSelector | GradeSelector specification updated to include D between C and Reject. |
| Logout was immediate, no confirmation | Logout Confirm screen added as mandatory step, with unsynced data warning. |

---

*End of Collector App Specification.*
