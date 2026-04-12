# Silk Value — Gate App: Screen Flow & Component Specification

**Role**: Gate Operator / QC — receives vehicles, cross-weighs, does QC, finalises entries  
**Total Screens**: 12 (4 tabs + 8 stack)  
**Design System**: `#FFFFFF` bg, `#111111`/`#666666` text, `#E5E5E5` borders, black buttons. Accents: `#22C55E` pass, `#EF4444` fail, `#F59E0B` hold/pending only.

---

## Bottom Navigation — 4 Tabs (consistent on all tab screens, hidden on all stack screens)

| Tab | Icon | File | Purpose |
|-----|------|------|---------|
| HOME | `home-outline` | `dashboard.tsx` | Today's expected vehicles, shift stats, pending QC alerts |
| CHECK-IN | `log-in-outline` | `weighment/index.tsx` | Weighment entry form — the main daily task |
| HISTORY | `time-outline` | `history.tsx` | All gate entries, filterable |
| PROFILE | `person-outline` | `profile.tsx` | Operator identity, settings, sign out |

---

## Navigation Flow

```
LOGIN → OTP → Role check → gate_operator → HOME tab

HOME tab
  └─ Tap entry card ─────────────────────────────→ Entry Detail (stack)
  └─ Tap variance alert badge ───────────────────→ QC Decision (stack)

CHECK-IN tab
  └─ Submit weighment form ──────────────────────→ QC Decision (stack)
       └─ PASS / PARTIAL decision ───────────────→ Acceptance Breakdown (stack) → HOME
       └─ REJECT decision ──────────────────────→ HOME
       └─ "Request Override" ────────────────────→ Override Request (stack) → QC Decision

HISTORY tab
  └─ Tap entry row ──────────────────────────────→ Entry Detail (stack)

PROFILE tab
  └─ "Settings" ─────────────────────────────────→ Settings (stack)
  └─ "Sign Out" ──────────────────────────────────→ Logout Confirm (stack) → Login
```

---

## Screen Directory

| # | Screen | File | Tab/Stack | Navbar |
|---|--------|------|-----------|--------|
| 1 | Dashboard | `dashboard.tsx` | TAB — HOME | Yes |
| 2 | Weighment Entry | `weighment/index.tsx` | TAB — CHECK-IN | Yes |
| 3 | History List | `history.tsx` | TAB — HISTORY | Yes |
| 4 | Profile | `profile.tsx` | TAB — PROFILE | Yes |
| 5 | QC Decision | `qc/[entryId].tsx` | Stack | No |
| 6 | Acceptance Breakdown | `qc/breakdown.tsx` | Stack | No |
| 7 | Override Request | `qc/override.tsx` | Stack | No |
| 8 | Entry Detail | `history/[entryId].tsx` | Stack | No |
| 9 | Shift Report | `reports.tsx` | Stack | No |
| 10 | Settings | `settings.tsx` | Stack | No |
| 11 | Logout Confirm | `logout-modal.tsx` | Stack | No |
| 12 | Variance Alert Detail | `alerts/[entryId].tsx` | Stack | No |

---

## Screen-by-Screen Specification

---

### Screen 1 — Dashboard
**File**: `app/(gate)/dashboard.tsx` | **Tab**: HOME

**Top Bar**: "Silk Value" wordmark left · Operator first name + sync dot right

**Shift Stats Row** (4 stat cards in 2×2 grid)
- Vehicles Expected today (from routes assigned to this cluster)
- Vehicles Checked In (gate entries created today)
- QC Pending (entries with `qc_status = pending`)
- Total Weight Accepted today in kg

**Weight Progress Bar**
- Black fill bar: today's accepted kg vs daily cluster target
- Label: "X mt of Y mt target"

**Variance Alerts Section** (shown only when `within_tolerance = false` entries exist)
- Section label: "VARIANCE ALERTS"
- Each alert: `VarianceAlertCard` — vehicle plate, variance %, amber/red badge, tap → Variance Alert Detail

**Today's Entries List** (pull-to-refresh)
- Section label: "TODAY'S ENTRIES"
- Each row: `GateEntryItem` — vehicle plate, expected weight, gate weight, QC status badge, arrival time
- Status badges: EXPECTED (outline) · PENDING QC (amber) · PASSED (green) · REJECTED (red)
- Tap → QC Decision if pending, Entry Detail if completed

**Empty State**: "No vehicles expected today" when no entries

**Fixed Footer Button**: "New Check-In" (black pill) → navigates to CHECK-IN tab

---

### Screen 2 — Weighment Entry (Check-In)
**File**: `app/(gate)/weighment/index.tsx` | **Tab**: CHECK-IN

**Header**: "New Check-In"

**Vehicle Identification Section**
- Vehicle plate number — text input, auto-capitalised
- "Look Up Vehicle" button — queries `vehicles` table by registration number, auto-fills route and expected weight if found
- If found: shows route name, collector name, expected stops count, expected gross weight (from sum of route's collection tickets)
- If not found: manual entry mode, show amber warning "Vehicle not in system"

**Weighment Inputs Section**
- Gate Gross Weight (kg) — numeric input
- Vehicle Tare Weight (kg) — numeric input  
- Gate Net Weight — auto-computed display: `gross − tare`, large bold, updates live
- Scale connect button (right of gross field): "Connect Scale" — Bluetooth pairing, auto-populates gross when scale reading is stable

**Variance Display** (auto-computes when both expected and actual weights are entered)
- Field Weight: value from route's tickets
- Gate Weight: value just entered
- Variance: `±X.X%` and `±X.X kg`
- If within tolerance (`variance_pct ≤ cluster.variance_tolerance_percent`): green pill "WITHIN TOLERANCE"
- If outside tolerance: amber/red pill "OUTSIDE TOLERANCE — X.X%" with note "Will require QC review"

**Scale + Scale Info Row**
- Scale ID input — which physical scale is being used (saved to `gate_entries.scale_id`)
- Scale Calibration Date — date picker, validates not expired

**Notes Input** — optional, multiline

**Submit Button** (black pill, full width)
- Label: "Record & Proceed to QC"
- Saves to `gate_entries` with `qc_status = pending`
- Navigates to QC Decision with the new entry ID
- Works offline — saves to WatermelonDB first, syncs in background

---

### Screen 3 — History List
**File**: `app/(gate)/history.tsx` | **Tab**: HISTORY

**Header**: "Gate History"

**Filter Row** (horizontal chips)
- All · Today · This Week · Passed · Rejected · Overrides

**Entry List** (pull-to-refresh)
- Each row: `GateEntryItem` — vehicle plate, date/time, net weight, QC status badge, variance %
- Tap → Entry Detail

**Empty State**: "No entries match your filter"

---

### Screen 4 — Profile
**File**: `app/(gate)/profile.tsx` | **Tab**: PROFILE

**Header**: "Profile"

**Avatar Block**: Initials circle (black, white text) · Operator full name · phone · "GATE OPERATOR" badge

**Identity Card** (bordered rows)
- Employee ID
- Cluster name
- Account status badge

**Today's Stats Block** (compact, grey surface)
- Entries processed today
- Average variance % today
- Overrides raised today

**Menu Rows** (right-arrow chevron)
- Settings → Settings screen
- Shift Report → Shift Report screen
- Help & Support → `Linking.openURL` (WhatsApp or email)
- App Version (non-tappable)

**Sign Out Button** (outline, red text, full width) → Logout Confirm

---

### Screen 5 — QC Decision
**File**: `app/(gate)/qc/[entryId].tsx` | **Stack**

**Header**: Back arrow · "QC Decision" · entry ID short code

**Weighment Summary Card** (`WeighmentSummary` component)
- Field Weight vs Gate Weight side by side
- Variance row: value + within/outside tolerance badge
- Vehicle plate + route name

**QC Parameters Section**
- Moisture % — numeric input (0–100)
- Spoilage % — numeric input (0–100)
- Foreign Material % — numeric input (0–100)
- All optional but recommended

**Deduction Preview** (auto-computed when any QC % is entered)
- Shows: "Deduction: X.X kg" based on `price_lists.moisture_deduction_rules`
- Shows: "Final Accepted Weight: XX.X kg"

**QC Decision Panel** (`QCDecisionPanel` component — existing)
- 3 buttons: PASS · HOLD · FAIL
- Selected button gets black fill (PASS), amber fill (HOLD), red fill (FAIL)
- Notes input below (required for HOLD and FAIL)

**Action on decision**:
- PASS → saves `qc_status = accepted`, navigates to Acceptance Breakdown
- HOLD → saves `qc_status = partial_rejection`, navigates to Acceptance Breakdown with deduction applied
- FAIL → saves `qc_status = rejected`, returns to Dashboard with entry shown as REJECTED
- "Request Override" ghost link (shown when variance is outside tolerance) → Override Request screen

---

### Screen 6 — Acceptance Breakdown
**File**: `app/(gate)/qc/breakdown.tsx` | **Stack**

**Header**: Back arrow · "Acceptance Breakdown"

**Summary Row**: Total gate net weight · total deduction · total accepted weight

**Per-Reeler Table**
- Columns: Reeler Name | Field Qty (kg) | Accepted Qty (kg) | Deduction | Amount (₹)
- Each row sourced from the route's `collection_tickets` apportioned by weight ratio
- Deductions distributed proportionally across reelers
- Skipped reelers shown in grey with "SKIPPED" label

**Payment Trigger Row**
- "Payment will be triggered for X reelers"
- Payment mode shown per reeler (UPI / Bank / Weekly)
- Note: "Instant UPI payments trigger on finalisation. Weekly batch on schedule."

**Finalise Button** (black pill, full width)
- Label: "Finalise & Trigger Payments"
- Sets `gate_entries.ledger_updated = true`
- Creates `payments` records for each reeler (mocked until gateway)
- Writes `reeler_ledger` debit/credit entries
- Returns to Dashboard with success alert

---

### Screen 7 — Override Request
**File**: `app/(gate)/qc/override.tsx` | **Stack**

**Header**: Back arrow · "Request Override"

**Context Card** (read-only)
- Vehicle plate, variance %, tolerance threshold shown clearly

**Reason Selection** (required, pick one)
- Scale error — weighing equipment gave incorrect reading
- Manual adjustment — physical quantity differs from recorded
- Supervisor directive — verbal instruction from supervisor
- Other — explain below

**Notes Input** (required for "Other")

**Request Button** (black, full width): "Submit Override Request"
- Saves override fields: `override_status = pending_review`, `override_by`, `override_notes`, `override_at`
- Shows success alert: "Override request submitted. Supervisor has been notified."
- Returns to QC Decision screen (entry still shows `qc_status = pending`)

---

### Screen 8 — Entry Detail
**File**: `app/(gate)/history/[entryId].tsx` | **Stack**

**Header**: Back arrow · "Entry Detail" · date

**Entry Summary Card**
- Vehicle plate · Route name · Collector name
- Check-in timestamp · Scale ID · Scale calibration date

**Weight Block** (`WeighmentSummary` component)
- Field weight vs gate weight vs final accepted weight
- Variance % + tolerance badge

**QC Block**
- Moisture % · Spoilage % · Foreign material %
- Deduction kg · Final accepted weight
- QC status badge + QC operator name + QC timestamp

**Override Block** (shown only if `override_status ≠ none`)
- Override reason · Requested by · Approved/rejected by · Timestamp

**Per-Reeler Breakdown** (collapsed by default, expandable)
- Same table as Acceptance Breakdown screen

**Actions**
- "Export Receipt" (outline) → `Share.share()` with formatted text summary
- "Export PDF" (outline) → Phase 2 placeholder, shows "Coming soon" toast

---

### Screen 9 — Shift Report
**File**: `app/(gate)/reports.tsx` | **Stack** (accessed from Profile menu)

**Header**: Back arrow · "Shift Report" · today's date

**Summary Stats** (stat cards)
- Total vehicles processed
- Total weight accepted (kg and MT)
- Total weight rejected (kg)
- Average variance %
- Overrides raised / approved

**Entry Table**: condensed list of all today's entries — vehicle, time, weight, status

**Actions**
- "Export Report" (outline) → CSV via `expo-sharing`
- "End Shift" (black, full width) — confirmation dialog → marks all today's pending entries as finalised, logs shift end time

---

### Screen 10 — Settings
**File**: `app/(gate)/settings.tsx` | **Stack**

**Header**: Back arrow · "Settings"

**Section: VARIANCE**
- "Variance Tolerance %" input — pre-filled from `clusters.variance_tolerance_percent`, editable locally as override per session

**Section: BLUETOOTH / SCALE**
- Currently paired scale name (or "No scale paired")
- "Pair / Change Scale" button → Bluetooth device list sheet
- "Forget Scale" ghost link

**Section: DATA**
- "Sync Now" button — shows "Last synced: X mins ago"
- "Clear Local Cache" (red label) — confirmation dialog, clears WatermelonDB, re-syncs

**App Version** (non-tappable, grey)

**Sign Out** (red text, bottom) → Logout Confirm

---

### Screen 11 — Logout Confirm
**File**: `app/(gate)/logout-modal.tsx` | **Stack**

**Content** (centred)
- "Sign out?" title
- Body: "You will be signed out. All synced entries are safely stored."
- Warning if unsynced entries exist: amber card "X unsynced entries — sync before signing out" + "Sync Now" button

**Buttons**
- "Cancel" (outline) → `router.back()`
- "Sign Out" (black, red label text) → `supabase.auth.signOut()` + `SecureStore.deleteItemAsync()` + Zustand `reset()` + `router.replace('/(auth)/login')`

---

### Screen 12 — Variance Alert Detail
**File**: `app/(gate)/alerts/[entryId].tsx` | **Stack** (accessed from Dashboard alert cards)

**Header**: Back arrow · "Variance Alert"

**Alert Card**
- Vehicle plate · Route name · Check-in time
- Field weight vs gate weight
- Variance highlighted in large red/amber text: "−8.3% OUTSIDE TOLERANCE"
- Tolerance threshold shown: "Cluster tolerance: 2.5%"

**Actions**
- "Review QC" (black) → QC Decision screen for this entry
- "Force Accept" (outline) → confirmation dialog → sets `override_status = approved` with "Force accepted" note, logs audit entry
- "Reject Entry" (outline, red text) → sets `qc_status = rejected`, returns to Dashboard

---

## Components Summary

### Existing (already built)
| Component | Used On |
|-----------|---------|
| `WeighmentSummary` | Weighment Entry, QC Decision, Entry Detail |
| `QCDecisionPanel` | QC Decision |
| `GateEntryItem` | Dashboard, History List |
| `Badge`, `Button`, `Input`, `EmptyState`, `StatCard`, `SyncStatusBar` | Throughout |

### New (build these)
| Component | File | Used On |
|-----------|------|---------|
| `VarianceAlertCard` | `components/gate/VarianceAlertCard.tsx` | Dashboard, Variance Alert Detail |
| `PerReelerRow` | `components/gate/PerReelerRow.tsx` | Acceptance Breakdown, Entry Detail |
| `ShiftStatRow` | `components/gate/ShiftStatRow.tsx` | Shift Report |
| `ScalePairingSheet` | `components/gate/ScalePairingSheet.tsx` | Weighment Entry, Settings |

#### `VarianceAlertCard` elements
- Vehicle plate (bold) + route name (grey)
- Variance value large: `−8.3%` in red or amber depending on severity
- Tolerance badge: "Tolerance: 2.5%"
- Tap navigates to Variance Alert Detail

#### `PerReelerRow` elements
- Reeler name (flex) | field qty | accepted qty | deduction kg | amount ₹
- Skipped rows: all grey, dashes for numeric values, SKIPPED badge

#### `ScalePairingSheet` elements
- Bottom sheet (not full screen)
- List of nearby Bluetooth devices: name + address + signal strength bar
- Each row has "Pair" button
- Paired device shown with green dot + "Forget" ghost link

---

## PRD Coverage

| Requirement | Screen |
|---|---|
| Vehicle check-in | Screen 2 |
| Gate weighment | Screen 2 |
| Compare field vs gate weight | Screen 2 + WeighmentSummary |
| QC accept / partial / reject | Screen 5 |
| Deduction calculation | Screen 5, 6 |
| Final accepted qty per reeler | Screen 6 |
| Ledger updated on finalisation | Screen 6 |
| Variance rules + auto alerts | Screen 1 alerts, Screen 12 |
| Override by supervisor | Screen 7 |
| History + audit | Screen 3, 8 |
| Offline-first | All — WatermelonDB first, sync in background |
| Profile + settings + sign out | Screens 4, 10, 11 |

---

*End of Gate App Specification.*
