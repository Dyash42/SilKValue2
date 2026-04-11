# 📱 Silk Value – Reeler App: Complete Screen Flow & Component Spec (v1.1 — Reviewed)

> **Review Notes Legend**
> - 🔴 **BUG** — Functional error or broken flow
> - 🟡 **MISSING** — Required by PRD but absent from spec
> - 🟠 **INCONSISTENCY** — Contradicts another part of the spec or PRD
> - ✅ **CORRECT** — Verified against PRD, no change needed
> - ✏️ **MODIFIED** — Existing item adjusted for correctness or completeness

---

## 🎯 OVERVIEW

- **App**: Reeler (Farmer) ONLY ✅
- **Total Screens**: 31 ✏️ *(was 29 — 2 screens added: 1.5 Consent & Data Sharing, 4.17 Notifications)*
- **Bottom Navbar**: Fixed 4 tabs on EVERY authenticated screen → `HOME` | `COLLECTIONS` | `PAYMENTS` | `PROFILE` ✅
- **Design System**: Pure Black/White (`#FFFFFF` BG, `#111111`/`#666666` text, `#E5E5E5` borders). Accents (`#22C55E`/`#EF4444`/`#F59E0B`) ONLY for tiny status indicators. ✅
- **Functional Scope**: ✅ Auth, Profile, Settings, Bank Management, Consent, Help, Logout = 100% functional. 🟡 Payments/KYC = UI-complete, backend mocked.
- **Navigation**: Expo Router Tabs (`app/(reeler)/_layout.tsx`) + Stack for nested flows. ✅

> 🟠 **INCONSISTENCY — Navbar scope**: The spec states the bottom navbar appears on "EVERY screen." This must be narrowed: the navbar must NOT appear on any AUTH screen (1.1–1.4) or ONBOARDING screens (2.1–2.4) or SETUP screens (3.1–3.2). It must appear only on authenticated core app screens (4.x). The layout file `app/(reeler)/_layout.tsx` must guard these correctly.

> 🟡 **MISSING — Notifications**: PRD section 6.5 and the system architecture explicitly require in-app notifications for collection receipt confirmation and payment confirmation. A Notifications screen (4.17) is added to this spec. A notification bell icon must appear in the top-right header of the Dashboard (4.1) as the primary entry point.

> 🟡 **MISSING — Offline sync indicator**: PRD Non-Functional Requirement 7 mandates offline-first operation. A `SyncStatusBar` is referenced in the implementation rules but never assigned to specific screens. It must be present on all data-read screens: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8.

> 🟡 **MISSING — Consent step in onboarding**: PRD section 6.1 lists "Consent capture" as a mandatory onboarding requirement. Screen 4.13 (Consent & Privacy) exists in the Profile tab but is only accessible post-setup. Consent must also be captured during onboarding, before KYC submission. Screen 1.5 (Consent & Data Sharing) is added between 1.3 OTP Verify and 2.1 Basic Details for first-time users.

---

## 🗺️ NUMBERED NAVIGATION FLOW (Reeler Only)

### AUTH

```
1.1 Welcome/Language → 1.2
1.2 Phone Entry → 1.3
1.3 OTP Verify → 1.5 (new user, first time) OR 4.1 (returning user)
1.4 Returning Login → 4.1
1.5 Consent & Data Sharing [NEW] → 2.1 (on accept) OR 1.2 (on decline, session cleared)
```

> 🔴 **BUG — Flow 1.3**: The original spec routes 1.3 → "1.4 (new)" OR "4.1 (returning)." Screen 1.4 is labeled "Returning Login" and handles biometric/PIN re-entry, so it is not the correct destination for a new user after OTP verification. New users must go to onboarding. Corrected flow: 1.3 → 1.5 (new user, consent) → 2.1 OR 1.3 → 4.1 (returning user session valid). Screen 1.4 is reached only when a returning user opens the app with an expired session and is prompted to re-authenticate via biometric/PIN before being routed to 4.1.

> 🟡 **MISSING — Screen 1.5**: Consent & Data Sharing screen added here. Required by PRD 6.1 and PRD 9. See full screen definition below.

### ONBOARDING *(First-time only)*

```
2.1 Basic Details → 2.2
2.2 KYC Upload → 2.3
2.3 KYC Pending → 2.4 (if rejected) OR 3.1 (if approved)
2.4 KYC Rejected → 2.2 (retry) OR support contact
```

> 🟠 **INCONSISTENCY — Screen 2.3 routing**: The original spec routes 2.3 → 2.4 on rejection OR 3.1 on approval. But the table entry for 2.4 shows the rejected flow re-entering at 2.2 or routing to "3.1 (approved)" — which is unreachable from 2.4 (rejected cannot become approved without re-upload). Corrected: 2.4 routes back to 2.2 (re-upload) only. The admin-approval-to-3.1 path originates from 2.3, not 2.4.

> 🟡 **MISSING — Geo-tagging in 2.1**: PRD 6.1 requires geo-tagging during onboarding. Screen 2.1 references `expo-location` for "Use Location" which covers this. Confirm the location is saved to `reelers.farm_location` and not just to the profile display — the schema requires a `GEOGRAPHY(POINT)` field. Document this explicitly in screen 2.1 components.

### SETUP

```
3.1 Bank/Payment Setup → 3.2
3.2 QR Code Generation → 4.1
```

✅ Correct.

### CORE APP — Bottom Tabs: HOME | COLLECTIONS | PAYMENTS | PROFILE

#### TAB 1: HOME

```
4.1 Dashboard → 4.2 / 4.4 / 4.7 / 4.10 / 4.17
```

> ✏️ **MODIFIED — 4.1 routing**: Added 4.17 (Notifications) as a destination from the dashboard notification bell. Corrected 4.3 reference — the dashboard should navigate to the Collections List (4.2), not directly to a ticket detail.

#### TAB 2: COLLECTIONS

```
4.2 Collections List → 4.3
4.3 Ticket Detail → back to 4.2
```

✅ Correct.

#### TAB 3: PAYMENTS *(UI Complete / Backend Mocked)*

```
4.4 Payment History → 4.5 / 4.6
4.5 Payment Detail → back to 4.4
4.6 Withdrawal Request → 4.4 (on submit)
4.7 Earnings Report → 4.8
4.8 Report Table → back to 4.7
4.9 ESG Report → back to 4.1
```

> 🟠 **INCONSISTENCY — 4.9 ESG Report entry point**: The nav flow lists 4.9 under the PAYMENTS tab, but the original spec says it navigates "back to 4.1." If it is a tab-level screen, back navigation should go to the PAYMENTS tab root (4.4), not HOME (4.1). If it is a standalone screen accessible from the Dashboard earnings card, it should be listed under HOME tab flow instead. Corrected: 4.9 is accessible from the Dashboard (4.1 → 4.9) and the Earnings Report (4.7 → 4.9), and back navigation returns to the calling screen.

> 🟡 **MISSING — Downloadable statement**: PRD 6.5 requires "downloadable statements." Screen 4.7 has `[Export PDF]` (mocked) and 4.8 has `[Export CSV]`. These satisfy the requirement in principle but must be clearly marked as "pending backend" and the final implementation must generate a bank-ready PDF statement from real payment data. Confirm in 4.7 component spec.

#### TAB 4: PROFILE *(100% Functional)*

```
4.10 Profile Overview → 4.11 / 4.12 / 4.13 / 4.14 / 4.15
4.11 Edit Details → 4.10 (on save)
4.12 Payment Methods → 4.10 / 3.1 (add new)
4.13 Consent & Privacy → 4.10
4.14 Help & Support → 4.10
4.15 Settings → 4.16 / 4.10
4.16 Logout Confirm → 1.2 (session cleared)
```

> 🟡 **MISSING — Screen 4.17 Notifications**: Added as a destination from 4.1 (notification bell) and optionally from 4.10 Profile. See full screen definition below.

---

## 📄 SCREEN-BY-SCREEN BREAKDOWN (31 SCREENS)

---

### 🔹 AUTH (5 Screens)

---

#### Screen 1.1 — Welcome & Language

- **Route**: `app/(auth)/welcome.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| App logo / wordmark | Static image | Centered, top third | ✅ |
| Tagline text | Static text | Below logo | ✅ |
| Language selector | Button group | Sets locale via i18n; options: English, Hindi, Kannada, Telugu, Tamil, Marathi | ✅ |
| Continue button | Primary button | Disabled until language selected; navigates → 1.2 | ✅ |

> 🟡 **MISSING — Language persistence**: Selected language must be persisted to `user_preferences` (local SQLite) so it survives app restarts. Document the `usePreferences()` hook call here.

---

#### Screen 1.2 — Phone Entry

- **Route**: `app/(auth)/login.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Screen title | Text | "Enter your mobile number" | ✅ |
| Country code prefix | Static label | `+91` fixed, non-editable | ✅ |
| Phone number input | Text input | Numeric keyboard; validates 10-digit Indian mobile number | ✅ |
| Send OTP button | Primary button | Disabled until valid number entered; triggers Supabase `signInWithOtp`; navigates → 1.3 | ✅ |
| Error toast | Toast | Shown on OTP send failure | ✅ |

> 🔴 **BUG — Email Login button**: The original spec includes `[Email Login] → 1.4`. Screen 1.4 is "Returning Login" (biometric/PIN), not email login. Email is not a supported auth method in this PRD (phone OTP only). The `[Email Login]` button must be removed entirely. It introduces a non-existent auth path.

---

#### Screen 1.3 — OTP Verify

- **Route**: `app/(auth)/otp.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Screen title | Text | "Enter the OTP sent to +91XXXXXXXXXX" | ✅ |
| Masked phone display | Static text | Shows last 4 digits of entered number | ✅ |
| OTP input field | 6-cell input | Auto-focuses; numeric only; auto-submits on 6th digit | ✅ |
| Verify button | Primary button | Calls `supabase.auth.verifyOtp`; on success → 1.5 (new user) or 4.1 (returning) | ✏️ |
| Resend OTP | Text button | Disabled with countdown timer (60 s); re-triggers `signInWithOtp` on tap | ✅ |
| Error toast | Toast | Shown on invalid OTP or expired OTP | ✅ |

> 🔴 **BUG — Routing after verify**: Original routes to "1.4 (new)" which is incorrect. New users go to 1.5 (Consent). Returning users go to 4.1. The app must check `profiles` table for existing record after auth to determine which path to take.

---

#### Screen 1.4 — Returning Login

- **Route**: `app/(auth)/login-returning.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Greeting text | Text | "Welcome back, [Full Name]" | ✅ |
| Avatar / initials | Display | Shows profile photo or initials | ✅ |
| Biometric prompt button | Primary button | Triggers `expo-local-auth`; on success → 4.1 | ✅ |
| PIN login fallback | Text button | Secondary option if biometric unavailable | 🟡 MISSING |
| Use different account | Text button | Clears stored session; navigates → 1.2 | ✅ |

> 🟡 **MISSING — PIN fallback**: If biometric is unavailable or fails, the user must have a fallback path. A PIN entry option (or redirect to OTP) is required. Without it, a user whose biometric fails is locked out.

---

#### Screen 1.5 — Consent & Data Sharing *(NEW — Required by PRD 6.1 and PRD 9)*

- **Route**: `app/(auth)/consent.tsx` 🟡 NEW
- **Bottom Navbar**: NOT shown

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Screen title | Text | "Your Data & Consent" | 🟡 NEW |
| Consent explanation | Scrollable text block | Plain-language summary of what data is collected (name, Aadhaar last 4, bank details, GPS location, collection records) and how it is used | 🟡 NEW |
| Terms version label | Static text | Displays current terms version (e.g., "v2.1") sourced from app config | 🟡 NEW |
| Data sharing toggle | Toggle switch | "Share anonymised data with banks/NGOs for income proof" — optional; defaults OFF | 🟡 NEW |
| Accept & Continue button | Primary button | Writes consent record to `consent_logs` with `terms_version`, `timestamp`, `user_id`, `data_sharing_consent`; navigates → 2.1 | 🟡 NEW |
| Decline button | Destructive text button | Shows confirmation modal "You cannot use Silk Value without accepting the terms"; on confirm → clears session → 1.2 | 🟡 NEW |

> 🟡 **MISSING — Consent log write**: On acceptance, this screen must write to the `consent_logs` table (not just `reelers.data_sharing_consent`). The log must record `terms_version`, `consent_timestamp`, `user_id`, and `data_sharing_consent` boolean. This supports DPDP Act audit trail requirements (PRD 9).

---

### 🔹 ONBOARDING (4 Screens)

---

#### Screen 2.1 — Basic Details

- **Route**: `app/(reeler)/onboarding/basic-details.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Step indicator | Progress bar | Step 1 of 3 (Basic → KYC → Bank) | 🟡 MISSING |
| Full name input | Text input | Required; updates `profiles.full_name` | ✅ |
| Village/Taluk input | Text input | Required; updates `reelers.farm_address` | ✅ |
| District input | Text input | Required; updates `profiles.cluster_id` via lookup | ✅ |
| Use Location button | Secondary button | Triggers `expo-location`; auto-fills address fields; saves GPS point to `reelers.farm_location` as `GEOGRAPHY(POINT)` | ✏️ |
| Farm area input | Numeric input | Optional; hectares; updates `reelers.farm_area_hectares` | 🟡 MISSING |
| Save & Continue button | Primary button | Validates all required fields; upserts `profiles` + `reelers`; navigates → 2.2 | ✅ |
| Error toast | Toast | Shown on save failure | ✅ |

> 🟡 **MISSING — Step indicator**: No progress indicator was specified. Users need orientation through the 3-step onboarding funnel.

> 🟡 **MISSING — Farm area field**: The `reelers.farm_area_hectares` column exists in the database schema. It must be captured during onboarding to support ESG reports (PRD 6.7).

> ✏️ **MODIFIED — Location save target**: Clarified that `expo-location` result must be saved to `reelers.farm_location` as a PostGIS `GEOGRAPHY(POINT)` field, not only to address text fields.

---

#### Screen 2.2 — KYC Upload

- **Route**: `app/(reeler)/onboarding/kyc-upload.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Step indicator | Progress bar | Step 2 of 3 | 🟡 MISSING |
| Instructions text | Static text | "Upload clear photos of your Aadhaar card (front & back) and bank passbook/cancelled cheque" | ✅ |
| Aadhaar front upload | Upload tile | Triggers `expo-image-picker`; uploads to `supabase.storage` bucket `kyc-documents`; shows thumbnail preview | ✅ |
| Aadhaar back upload | Upload tile | Same as above | ✅ |
| Bank document upload | Upload tile | Passbook first page or cancelled cheque | ✅ |
| Aadhaar last 4 input | Numeric input | 4-digit; updates `reelers.aadhaar_last_4`; never stores full Aadhaar | 🟡 MISSING |
| Submit KYC button | Primary button | Disabled until all 3 documents uploaded; sets `profiles.kyc_status = 'submitted'`; appends document URLs to `profiles.kyc_documents` JSONB array; navigates → 2.3 | ✅ |
| Upload progress indicator | Progress overlay | Shown per-document during upload | 🟡 MISSING |
| Error toast | Toast | Shown on upload failure with retry option | ✅ |

> 🟡 **MISSING — Aadhaar last 4 input**: The schema stores `reelers.aadhaar_last_4` (CHAR 4) for identity reference. This must be captured at KYC upload time for collector QR scan verification.

> 🟡 **MISSING — Per-document upload progress**: Large image uploads on slow connections need per-document progress indicators, not just a spinner on Submit.

---

#### Screen 2.3 — KYC Pending

- **Route**: `app/(reeler)/onboarding/kyc-pending.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Status illustration | Static image | Pending/clock icon, black/white | ✅ |
| Status title | Text | "KYC Under Review" | ✅ |
| Explanation text | Static text | "Your documents are being reviewed by our team. This usually takes 24–48 hours." | ✅ |
| Submitted documents summary | Read-only list | Shows thumbnails of uploaded docs with upload timestamps | 🟡 MISSING |
| Contact Support button | Secondary button | Opens WhatsApp deep link or `mailto:support@silkvalue.in` | ✅ |
| Auto-poll status | Background logic | Polls `profiles.kyc_status` every 60 s; navigates → 3.1 if `'verified'`; navigates → 2.4 if `'rejected'` | ✅ |
| Offline notice | Inline banner | Shown when network unavailable; pauses polling | 🟡 MISSING |

> 🟡 **MISSING — Submitted documents summary**: Reeler needs to see what they submitted. Without this, they cannot identify if they uploaded the wrong document.

> 🟡 **MISSING — Offline notice**: If the device goes offline during polling, the user must see a message explaining the app will check again when connectivity returns.

---

#### Screen 2.4 — KYC Rejected

- **Route**: `app/(reeler)/onboarding/kyc-rejected.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Status illustration | Static image | Rejection/error icon, black/white | ✅ |
| Status title | Text | "KYC Verification Failed" | ✅ |
| Rejection reason | Text block | Displays `profiles.kyc_documents` rejection note set by admin | 🟡 MISSING |
| Re-upload button | Primary button | Resets `kyc_status` to `'pending'`; navigates → 2.2 | ✅ |
| Contact Support button | Secondary button | WhatsApp/email link | ✅ |

> 🟡 **MISSING — Rejection reason display**: The admin sets a rejection reason in the `kyc_documents` JSONB field. Without showing this, the reeler cannot know which document to fix, leading to repeat rejections.

> 🔴 **BUG — Routing to 3.1**: The original spec shows 2.4 routing to "3.1 (approved)" which is logically impossible from a rejected state. Removed. The only exit from 2.4 is → 2.2 (re-upload) or contact support.

---

### 🔹 SETUP (2 Screens)

---

#### Screen 3.1 — Bank/Payment Setup

- **Route**: `app/(reeler)/setup/bank-setup.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Step indicator | Progress bar | Step 3 of 3 | 🟡 MISSING |
| Screen title | Text | "Set Up Your Payment Method" | ✅ |
| Payment preference selector | Segmented control | Options: Instant UPI / Instant Bank Transfer / Weekly Batch | 🟡 MISSING |
| UPI ID input | Text input | Shown when UPI selected; validates format `name@provider`; updates `reelers.upi_id` | ✅ |
| Bank account number input | Text input | Shown when Bank Transfer selected; masked on blur; updates `reelers.bank_account_masked` | 🟡 MISSING |
| IFSC code input | Text input | Shown when Bank Transfer selected; validates format; updates `reelers.ifsc_code` | 🟡 MISSING |
| Account holder name input | Text input | Shown when Bank Transfer selected | 🟡 MISSING |
| Verify UPI button | Secondary button | Mock verification in Phase 1; shows success/failure toast | ✅ |
| Save button | Primary button | Validates fields based on selected preference; upserts `reelers` record; navigates → 3.2 | ✅ |
| Skip for now option | Text button | Allows skipping; navigates → 3.2 but marks payment setup incomplete | 🟡 MISSING |
| Error toast | Toast | Shown on validation or save failure | ✅ |

> 🟡 **MISSING — Payment preference selector**: PRD 6.5 requires support for Instant UPI, Instant Bank, and Weekly Batch payment modes. The original spec only references UPI. All three options must be selectable here, with conditional fields shown accordingly.

> 🟡 **MISSING — Bank account fields**: When a reeler chooses Instant Bank or Weekly Batch, account number, IFSC, and account holder name must be captured. These map to `reelers.bank_account_masked` and `reelers.ifsc_code`.

> 🟡 **MISSING — Skip option**: Some reelers may not have bank details at onboarding. A skip path prevents blocking the app entirely, though it restricts payment eligibility until details are added later via 4.12.

---

#### Screen 3.2 — QR Code Generation

- **Route**: `app/(reeler)/setup/qr-card.tsx` ✅
- **Bottom Navbar**: NOT shown ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Screen title | Text | "Your Reeler QR Code" | ✅ |
| QR code display | QR image | Generated from `reelers.reeler_code` + `reelers.qr_code_hash`; renders at minimum 200×200 px | ✏️ |
| Reeler code label | Text | Displays human-readable code e.g. "RLR-KA-0045" below QR | 🟡 MISSING |
| Reeler name & cluster | Text | Displayed below reeler code for visual confirmation | 🟡 MISSING |
| Download QR button | Primary button | Saves QR image to device via `expo-file-system` + `view-shot` | ✅ |
| Share QR button | Secondary button | Opens system share sheet | 🟡 MISSING |
| Continue to Dashboard button | Text button | Navigates → 4.1 | ✅ |

> ✏️ **MODIFIED — QR source data**: Clarified that the QR is generated from `reelers.reeler_code` + `reelers.qr_code_hash`, not an arbitrary ID. Both fields must be populated by the backend upon KYC approval before reaching this screen.

> 🟡 **MISSING — Reeler code display**: The human-readable code (e.g., `RLR-KA-0045`) must be shown below the QR so the reeler can quote it verbally to collectors. Without it the QR is the only identifier visible.

> 🟡 **MISSING — Share button**: Reelers will want to share their QR via WhatsApp to a collector. A system share button is needed alongside the download option.

---

### 🔹 CORE APP — TAB 1: HOME (1 Screen)

---

#### Screen 4.1 — Dashboard

- **Route**: `app/(reeler)/dashboard.tsx` ✅
- **Bottom Navbar**: Shown — active tab: HOME ✅
- **SyncStatusBar**: Shown at top ✏️

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| SyncStatusBar | Status banner | Shows sync state (synced / syncing / offline / failed); always at top | 🟡 MISSING |
| Top header | Header bar | Left: "Silk Value" wordmark; Right: notification bell icon with unread badge count | 🟡 MISSING |
| Greeting text | Text | "Good morning, [First Name]" — dynamic based on time of day | 🟡 MISSING |
| KYC status banner | Inline banner | Shown ONLY if `profiles.kyc_status !== 'verified'`; links to 2.2 or 2.3 | 🟡 MISSING |
| Total earnings card | Summary card | Shows `reelers.total_earnings_inr`; tap → 4.7 (Earnings Report) | ✅ |
| Pending payment badge | Inline badge | Count of pending payments; tap → 4.4 (Payment History) | ✅ |
| Last collection summary | Summary card | Date, weight, grade, amount of most recent collection ticket; tap → 4.3 | 🟡 MISSING |
| Recent collections list | Horizontal scroll | Last 3 collection cards (date, weight, amount); tap item → 4.3 with ticketId | 🟡 MISSING |
| Pull-to-refresh | Gesture | Triggers `triggerSync()` | ✅ |
| Notification bell | Icon button | Top-right header; tap → 4.17; shows unread count badge | 🟡 MISSING |

> 🟡 **MISSING — SyncStatusBar**: Referenced in implementation rules but not specified in the dashboard component list.

> 🟡 **MISSING — Top header bar**: No header was defined. The app needs a consistent top bar with the wordmark and notification bell.

> 🟡 **MISSING — Greeting text**: Personalised greeting improves adoption (PRD 13 — training & incentives risk).

> 🟡 **MISSING — KYC status banner**: If a reeler somehow reaches the dashboard before KYC is verified (e.g., via deep link or session restore), a warning banner must be shown. This also handles the case where KYC was approved later and re-verified.

> 🟡 **MISSING — Last collection summary / recent collections**: The dashboard shows earnings and pending payments but nothing about recent collections. PRD section 6.3 and the system architecture diagram show "Daily kg + ₹" as a key metric for the reeler. These cards are required.

---

### 🔹 CORE APP — TAB 2: COLLECTIONS (2 Screens)

---

#### Screen 4.2 — Collections List

- **Route**: `app/(reeler)/collections.tsx` ✅
- **Bottom Navbar**: Shown — active tab: COLLECTIONS ✅
- **SyncStatusBar**: Shown at top ✏️

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| SyncStatusBar | Status banner | Top of screen | 🟡 MISSING |
| Screen title | Text | "My Collections" | ✅ |
| Search bar | Text input | Filters WatermelonDB `collection_tickets` by date, grade, or ticket number | ✅ |
| Date range filter | Filter chips | Presets: Today / This Week / This Month / Custom | 🟡 MISSING |
| Grade filter | Filter chip group | A+ / A / B / C / Reject — multi-select | 🟡 MISSING |
| Collections list | Scrollable list | Each item = `CollectionHistoryCard`; ordered by `collection_timestamp` descending | ✅ |
| Empty state | Placeholder view | "No collections yet" with illustration; shown when list is empty | 🟡 MISSING |
| Pull-to-refresh | Gesture | Triggers `triggerSync()` | ✅ |

> 🟡 **MISSING — Filter chips**: Search alone is insufficient; PRD 6.7 implies filtering by date and grade for income reports. Date and grade filter chips are required for usability.

> 🟡 **MISSING — Empty state**: No empty state was defined. Required for first-time users or when filters return nothing.

**CollectionHistoryCard sub-component:**

| Field | Source | Display |
|---|---|---|
| Ticket number | `collection_tickets.ticket_number` | "TKT-2024-00145" |
| Collection date | `collection_tickets.collection_timestamp` | Formatted: "15 Jan 2024, 10:23 AM" |
| Net weight | `collection_tickets.net_weight_kg` | "15.0 kg" |
| Quality grade | `collection_tickets.quality_grade` | Grade badge (A+/A/B/C/Reject) with colour accent |
| Total amount | `collection_tickets.total_amount` | "₹1,275.00" |
| Payment status | `payments.payment_status` | Badge: Paid / Pending / Processing |

---

#### Screen 4.3 — Ticket Detail

- **Route**: `app/(reeler)/collection-detail.tsx` ✅
- **Bottom Navbar**: Shown — active tab: COLLECTIONS ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.2 | ✅ |
| Screen title | Text | "Collection Receipt" | 🟡 MISSING |
| Ticket number | Heading text | "TKT-2024-00145" | ✅ |
| Collection timestamp | Text | Full date and time | ✅ |
| Collector name | Text | Name of the collector who collected this ticket | 🟡 MISSING |
| Weight breakdown | Data rows | Gross / Tare / Net in kg | 🟡 MISSING |
| Quality grade | Badge | A+ / A / B / C / Reject with colour | ✅ |
| Moisture % | Text | If recorded | 🟡 MISSING |
| Crate count | Text | Number of crates | 🟡 MISSING |
| Pricing details | Data rows | Price per kg / Total amount / Currency | ✅ |
| Payment status | Status badge | Paid / Pending / Processing / Failed | ✅ |
| Payment transaction reference | Text | Shown only if payment status = Paid | 🟡 MISSING |
| Gate acceptance status | Status row | Accepted / Pending gate / Partial rejection — from `gate_entries` | 🟡 MISSING |
| Collection photo(s) | Image gallery | Thumbnail(s) from `collection_tickets.photos` JSONB; tap to full-screen | 🟡 MISSING |
| Download Receipt button | Primary button | Generates and shares PDF receipt via `expo-sharing` | ✅ |

> 🟡 **MISSING — Collector name**: The reeler needs to know which collector visited them. This is a traceability requirement per PRD 6.3.

> 🟡 **MISSING — Weight breakdown**: Gross, Tare, and Net weights are separate fields in the schema. Showing only "net weight" is insufficient for verification; the reeler may dispute a tare deduction.

> 🟡 **MISSING — Collection photos**: PRD 6.3 requires "photo proof." The reeler should be able to view the photos the collector took at their location. Thumbnails must be displayed.

> 🟡 **MISSING — Gate acceptance status**: PRD 6.4 requires reelers to see the outcome of weighment reconciliation. A gate status row (Accepted / Pending / Partial rejection / Rejected) sourced from `gate_entries` is required.

---

### 🔹 CORE APP — TAB 3: PAYMENTS (6 Screens — UI Complete / Backend Mocked)

---

#### Screen 4.4 — Payment History

- **Route**: `app/(reeler)/payments.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PAYMENTS ✅
- **SyncStatusBar**: Shown at top ✏️

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| SyncStatusBar | Status banner | Top of screen | 🟡 MISSING |
| Screen title | Text | "Payments" | ✅ |
| Total pending amount | Summary card | Sum of all payments with status = pending; highlighted | 🟡 MISSING |
| Total paid (month) | Summary card | Sum of successful payments this calendar month | 🟡 MISSING |
| Date range filter | Filter chips | This Week / This Month / Last 3 Months / Custom | 🟡 MISSING |
| Status filter | Filter chip group | All / Paid / Pending / Processing / Failed | 🟡 MISSING |
| Payments list | Scrollable list | Each item = payment row; tap → 4.5 | ✅ |
| Withdraw button | Primary button | Fixed at bottom; tap → 4.6 | ✅ |
| Empty state | Placeholder | "No payments yet" — shown when list is empty | 🟡 MISSING |
| Pull-to-refresh | Gesture | Triggers `triggerSync()` | 🟡 MISSING |

**Payment list item sub-component:**

| Field | Source | Display |
|---|---|---|
| Transaction date | `payments.initiated_at` | "15 Jan 2024" |
| Amount | `payments.amount` | "₹1,275.00" |
| Payment mode | `payments.payment_mode` | "Instant UPI" / "Bank Transfer" / "Weekly Batch" |
| Status badge | `payments.payment_status` | Paid (green) / Pending (amber) / Processing (amber) / Failed (red) |
| Transaction reference | `payments.transaction_reference` | Short ref, shown for Paid only |

---

#### Screen 4.5 — Payment Detail

- **Route**: `app/(reeler)/payment-detail.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PAYMENTS ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.4 | ✅ |
| Screen title | Text | "Payment Details" | ✅ |
| Payment amount | Large text | "₹1,275.00" | ✅ |
| Payment status | Status badge | Paid / Pending / Processing / Failed | ✅ |
| Payment mode | Text row | "Instant UPI" / "Bank Transfer" / "Weekly Batch" | ✅ |
| UPI ID / bank details | Text row | Masked UPI ID or "XXXX-XXXX-1234" | 🟡 MISSING |
| Transaction reference | Text row | Shown for Paid status; "TXN-2024-00145-UP" | ✅ |
| Initiated at | Text row | Full datetime | ✅ |
| Processed at | Text row | Full datetime; shown if status = Paid | 🟡 MISSING |
| Linked ticket number | Tappable text | "TKT-2024-00145" → navigates → 4.3 | 🟡 MISSING |
| Failure reason | Text row | Shown if status = Failed | 🟡 MISSING |
| Retry payment button | Secondary button | Shown if status = Failed; mocked in Phase 1 | 🟡 MISSING |
| Download Receipt button | Primary button | PDF share via `expo-sharing` | ✅ |

> 🟡 **MISSING — UPI ID / bank details display**: The reeler must see which account received (or will receive) the payment for verification and dispute purposes.

> 🟡 **MISSING — Linked ticket**: Payments are 1:1 with collection tickets (per schema constraint). The reeler must be able to tap through to the originating ticket.

> 🟡 **MISSING — Failure reason and retry**: PRD 6.5 implies payment error handling. If a payment fails, the reason must be shown and a retry option offered (even if mocked).

---

#### Screen 4.6 — Withdrawal Request

- **Route**: `app/(reeler)/withdrawal.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PAYMENTS ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Screen title | Text | "Request Withdrawal" | ✅ |
| Available balance | Summary card | Computed: total earnings minus total paid; read-only | 🟡 MISSING |
| Amount input | Numeric input | Pre-filled with full available balance via `[Withdraw Full]`; manual override allowed | ✅ |
| Withdraw Full button | Auto-fill button | Sets amount to available balance | ✅ |
| Payment method display | Read-only row | Shows default payment method from `reelers.payment_preference` | 🟡 MISSING |
| Change payment method link | Text link | Navigates → 4.12 | 🟡 MISSING |
| Submit button | Primary button | Mock success in Phase 1; shows confirmation toast; navigates → 4.4 | ✅ |
| Warning banner | Inline banner | "Withdrawals may take up to 2 business days for bank transfers" — conditional on payment mode | 🟡 MISSING |
| Cancel button | Text button | Returns → 4.4 | 🟡 MISSING |

> 🟡 **MISSING — Available balance**: Without showing the computable available balance, the reeler cannot know the maximum withdrawal amount.

> 🟡 **MISSING — Payment method display**: The reeler must see which account will receive funds before submitting.

---

#### Screen 4.7 — Earnings Report

- **Route**: `app/(reeler)/earnings.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PAYMENTS ✅
- **SyncStatusBar**: Shown at top ✏️

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| SyncStatusBar | Status banner | Top of screen | 🟡 MISSING |
| Screen title | Text | "Earnings Report" | ✅ |
| Month selector | Horizontal scroll / picker | Defaults to current month; navigates months | ✅ |
| Total earnings (month) | Summary card | Sum of `payments.amount` where `payment_status = 'success'` for selected month | ✅ |
| Total collections (month) | Summary card | Count of collection tickets for selected month | 🟡 MISSING |
| Total weight (month) | Summary card | Sum of `net_weight_kg` for selected month | 🟡 MISSING |
| Grade breakdown | Bar or list | Breakdown by quality grade (A+/A/B/C/Reject) showing weight and earnings per grade | 🟡 MISSING |
| ESG summary link | Text link | "View ESG Report →" → 4.9 | 🟡 MISSING |
| Export PDF button | Primary button | Generates bank-ready PDF statement; mocked in Phase 1 | ✅ |
| View Detailed Table button | Secondary button | Navigates → 4.8 | ✅ |

> 🟡 **MISSING — Total collections and weight**: PRD 6.7 requires reeler income reports with volume data. Collections count and total weight are essential metrics alongside the earnings amount.

> 🟡 **MISSING — Grade breakdown**: PRD 6.7 and the system architecture both specify quality trends as a reeler-visible metric. A grade breakdown enables the reeler to understand which quality is most valuable.

> 🟡 **MISSING — ESG summary link**: ESG Report (4.9) is referenced but has no defined entry point from within the Payments tab. The Earnings Report is the logical gateway.

---

#### Screen 4.8 — Report Table

- **Route**: `app/(reeler)/report-table.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PAYMENTS ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.7 | ✅ |
| Screen title | Text | "Collection Details" | ✅ |
| Filter toggles | Toggle row | Filter by: Grade / Payment Status / Date range | ✅ |
| Sortable table | Data table | Columns: Date, Ticket No., Grade, Weight (kg), Amount (₹), Payment Status | 🟡 MISSING |
| Pagination / infinite scroll | List control | Loads 20 rows at a time | 🟡 MISSING |
| Export CSV button | Primary button | Exports visible/filtered data as CSV via `expo-sharing` | ✅ |
| Empty state | Placeholder | Shown when no rows match active filters | 🟡 MISSING |

> 🟡 **MISSING — Sortable table column definition**: The spec mentions a table but does not define columns. Columns listed above are derived from `collection_tickets` schema fields visible to a reeler.

---

#### Screen 4.9 — ESG Report

- **Route**: `app/(reeler)/esg-report.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PAYMENTS ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns to calling screen (4.1 or 4.7) | ✏️ |
| Screen title | Text | "ESG Impact Report" | ✅ |
| Reporting period display | Text | "Calendar Year 2024" or selected period | 🟡 MISSING |
| Total silk pupae collected | Metric card | Total kg supplied to factory | 🟡 MISSING |
| Estimated waste diverted | Metric card | Pupae diverted from waste stream; derived metric | 🟡 MISSING |
| Income growth % | Metric card | Year-over-year income change | 🟡 MISSING |
| Farm area enrolled | Metric card | `reelers.farm_area_hectares` | 🟡 MISSING |
| Download Certificate button | Primary button | Shares static or generated PDF certificate | ✅ |

> ✏️ **MODIFIED — Back navigation**: Changed from hardcoded "back to 4.1" to dynamic back navigation returning to whichever screen opened 4.9 (either 4.1 or 4.7).

> 🟡 **MISSING — ESG metric cards**: The original spec only listed the download button. PRD 6.7 requires ESG impact dashboards. The actual metric data to display is defined above.

---

### 🔹 CORE APP — TAB 4: PROFILE (7 Screens — 100% Functional)

---

#### Screen 4.10 — Profile Overview

- **Route**: `app/(reeler)/profile.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PROFILE ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Profile photo / initials | Avatar | Shows photo if uploaded; else initials from `profiles.full_name` | 🟡 MISSING |
| Full name | Heading text | From `profiles.full_name` | ✅ |
| Reeler code | Subheading text | e.g. "RLR-KA-0045" from `reelers.reeler_code` | 🟡 MISSING |
| KYC status badge | Inline badge | Verified / Pending / Rejected — from `profiles.kyc_status` | 🟡 MISSING |
| Cluster / village | Text | `profiles.cluster_id` name + village | 🟡 MISSING |
| Edit Details row | Menu item | → 4.11 | ✅ |
| Payment Methods row | Menu item | → 4.12 | ✅ |
| My QR Code row | Menu item | → 3.2 (view QR) | 🟡 MISSING |
| Notifications row | Menu item | → 4.17 | 🟡 MISSING |
| Consent & Privacy row | Menu item | → 4.13 | ✅ |
| Help & Support row | Menu item | → 4.14 | ✅ |
| Settings row | Menu item | → 4.15 | ✅ |
| Sign Out button | Destructive text button | → 4.16 confirmation modal | ✅ |

> 🟡 **MISSING — Profile photo**: No avatar or photo display was defined. Users should see their own photo if they have uploaded one.

> 🟡 **MISSING — Reeler code**: Must be visible from Profile so the reeler can share it verbally.

> 🟡 **MISSING — KYC status badge**: A reeler must be able to see their current KYC status from the Profile screen without navigating elsewhere.

> 🟡 **MISSING — Cluster/village display**: Provides location context confirmation.

> 🟡 **MISSING — My QR Code row**: The reeler may need to re-view or re-share their QR code at any time. A direct link from Profile to the QR screen is essential.

> 🟡 **MISSING — Notifications row**: Shortcut to 4.17.

---

#### Screen 4.11 — Edit Details

- **Route**: `app/(reeler)/profile/edit-details.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PROFILE ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Discards unsaved changes with confirmation; returns → 4.10 | 🟡 MISSING |
| Screen title | Text | "Edit Profile" | ✅ |
| Full name input | Text input | Pre-filled; updates `profiles.full_name` | ✅ |
| Preferred language selector | Dropdown / picker | Options: English, Hindi, Kannada, Telugu, Tamil, Marathi; updates `profiles.preferred_language` | 🟡 MISSING |
| Village/address input | Text input | Updates `reelers.farm_address` | ✅ |
| Notification toggle | Toggle switch | Updates `profiles.notification_enabled` | 🟡 MISSING |
| Profile photo upload | Upload tile | Uploads to `supabase.storage`; updates `profiles` photo reference | 🟡 MISSING |
| Save button | Primary button | Validates; upserts `profiles` + `reelers`; shows success toast; returns → 4.10 | ✅ |
| Error toast | Toast | Shown on save failure | ✅ |

> 🟡 **MISSING — Discard confirmation**: If the user taps Back with unsaved changes, a discard confirmation modal should appear.

> 🟡 **MISSING — Preferred language**: Language preference is stored in `profiles.preferred_language`. Editing it must be available here.

> 🟡 **MISSING — Notification toggle**: `profiles.notification_enabled` must be editable.

> 🟡 **MISSING — Profile photo upload**: If the avatar is shown on 4.10, it must be editable somewhere. This screen is the correct location.

---

#### Screen 4.12 — Payment Methods

- **Route**: `app/(reeler)/profile/payment-methods.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PROFILE ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.10 | ✅ |
| Screen title | Text | "Payment Methods" | ✅ |
| Current methods list | List | Shows all saved payment methods with default badge | 🟡 MISSING |
| UPI ID row | List item | Shows `reelers.upi_id`; default badge if `payment_preference = 'instant_upi'` | 🟡 MISSING |
| Bank account row | List item | Shows `reelers.bank_account_masked`; default badge if bank transfer selected | 🟡 MISSING |
| Set Default button | Secondary button | Per-method; updates `reelers.payment_preference`; refreshes UI | ✅ |
| Add UPI/Bank button | Primary button | Navigates → 3.1 | ✅ |
| Delete method option | Destructive action | Swipe-to-delete or long-press; removes method; requires at least one method to remain | 🟡 MISSING |

> 🟡 **MISSING — Current methods list display**: The spec only describes the Add and Set Default actions. The existing saved methods must be displayed as readable list items first.

---

#### Screen 4.13 — Consent & Privacy

- **Route**: `app/(reeler)/profile/consent.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PROFILE ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.10 | ✅ |
| Screen title | Text | "Consent & Privacy" | ✅ |
| Consent version display | Text | "You accepted terms v2.1 on [date]" — from `consent_logs` | 🟡 MISSING |
| Data sharing toggle | Toggle switch | "Share anonymised data with banks/NGOs"; reads/writes `reelers.data_sharing_consent`; writes change to `consent_logs` | ✅ |
| Data sharing explanation | Body text | Explains what is shared and with whom | 🟡 MISSING |
| View consent history | Text link | Shows log of all past consent changes from `consent_logs` | 🟡 MISSING |
| Download My Data button | Secondary button | Exports user data as JSON via `expo-sharing` | ✅ |
| Delete Account / Request Erasure | Destructive text button | Sends email to `privacy@silkvalue.in`; does not auto-delete | ✅ |

> 🟡 **MISSING — Consent version display**: PRD 9 (audit trail retention) requires the reeler to see which version of the terms they agreed to and when.

> 🟡 **MISSING — Consent history link**: DPDP Act compliance requires an audit trail of all consent changes. A view of past consent events must be accessible.

> 🟡 **MISSING — Data sharing explanation**: The toggle alone is insufficient. The user must understand what "sharing with banks/NGOs" means before toggling.

---

#### Screen 4.14 — Help & Support

- **Route**: `app/(reeler)/profile/help.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PROFILE ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.10 | ✅ |
| Screen title | Text | "Help & Support" | ✅ |
| FAQ accordion | Expandable list | Tapping a question expands the answer; collapsing removes it | ✅ |
| Contact via WhatsApp | Button row | Opens `wa.me/91XXXXXXXXXX` deep link | ✅ |
| Contact via email | Button row | Opens `mailto:support@silkvalue.in` | ✅ |
| Report a Bug | Button row | Opens email with pre-filled subject, body includes app version and device info | ✅ |
| App version display | Footer text | Static: "Version 1.2.0 (Build 20240110.1)" | 🟡 MISSING |

> 🟡 **MISSING — App version display**: Support teams need the version number to reproduce issues. It must be displayed at the bottom of this screen.

---

#### Screen 4.15 — Settings

- **Route**: `app/(reeler)/profile/settings.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PROFILE ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.10 | ✅ |
| Screen title | Text | "Settings" | ✅ |
| Offline mode toggle | Toggle switch | Enables aggressive local caching; syncs `user_preferences.offline_mode_enabled` | ✅ |
| Auto sync toggle | Toggle switch | Enables background sync; syncs `user_preferences.auto_sync_enabled` | ✅ |
| Notifications toggle | Toggle switch | Enables/disables all in-app notifications; syncs `profiles.notification_enabled` | 🟡 MISSING |
| Theme selector | Segmented control | Light / System Default; saves to `user_preferences.theme` | 🟡 MISSING |
| Clear Cache button | Destructive button | Calls `database.clear()` + restart sync; shows confirmation modal first | ✅ |
| Last sync time display | Text row | "Last synced: 5 minutes ago" — from `sync_metadata.last_successful_sync` | 🟡 MISSING |
| Logout option | Destructive text button | Navigates → 4.16 | ✏️ |

> 🟡 **MISSING — Notifications toggle**: `profiles.notification_enabled` should be editable from Settings in addition to Edit Details (4.11). These must stay in sync.

> 🟡 **MISSING — Theme selector**: `user_preferences.theme` is in the schema. If stored, it must be configurable here.

> 🟡 **MISSING — Last sync time**: Users need transparency about data freshness, especially in rural low-connectivity contexts (PRD NFR 7).

> ✏️ **MODIFIED — Logout placement**: Original spec routes 4.15 → 4.16. The logout confirmation modal (4.16) must be triggered from Settings via a clearly labelled destructive row at the bottom, not a primary action. The primary action of Settings is configuration, not logout.

---

#### Screen 4.16 — Logout Confirm

- **Route**: `app/(reeler)/profile/logout-modal.tsx` ✅
- **Bottom Navbar**: Shown — active tab: PROFILE ✅

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Modal overlay | Bottom sheet or centred modal | Dims background; not dismissable by tapping outside | 🟡 MISSING |
| Confirmation title | Heading | "Sign Out?" | ✅ |
| Confirmation body | Body text | "You will need to log in again. Unsynced data will be uploaded before signing out." | 🟡 MISSING |
| Sync before logout | Background logic | If `sync_metadata.pending_uploads_count > 0`, triggers sync before clearing session | 🟡 MISSING |
| Cancel button | Secondary button | `router.back()` — closes modal | ✅ |
| Confirm Sign Out button | Destructive primary button | Calls `supabase.auth.signOut()`, `SecureStore.deleteItemAsync('auth_session')`, resets Zustand stores (`authStore.clear()`, `syncStore.reset()`), then `router.replace('/(auth)/login')` | ✅ |

> 🟡 **MISSING — Non-dismissable modal**: The original spec does not define modal behaviour. Tapping the dim overlay must NOT dismiss the modal; the user must explicitly choose Cancel or Confirm.

> 🟡 **MISSING — Body text explaining sync**: If there are pending unsynced records, the reeler must be warned. PRD NFR 7 (offline sync) means logout must not silently discard unsynced data.

> 🟡 **MISSING — Sync before logout logic**: Before clearing the session, the app should attempt a final sync if there are pending uploads.

---

### 🔹 NOTIFICATIONS (1 Screen — NEW)

---

#### Screen 4.17 — Notifications *(NEW — Required by PRD architecture and PRD 6.5)*

- **Route**: `app/(reeler)/notifications.tsx` 🟡 NEW
- **Bottom Navbar**: Shown — active tab: HOME (notification bell is in header, not tab)

**Components:**

| Component | Type | Behaviour | Status |
|---|---|---|---|
| Back button | Navigation | Returns → 4.1 (or calling screen) | 🟡 NEW |
| Screen title | Text | "Notifications" | 🟡 NEW |
| Mark all as read | Text button | Sets all `notifications.is_read = true` for this user | 🟡 NEW |
| Notifications list | Scrollable list | Each item = notification row; ordered by `created_at` descending | 🟡 NEW |
| Empty state | Placeholder | "No notifications yet" with illustration | 🟡 NEW |
| Pull-to-refresh | Gesture | Triggers `triggerSync()` for `notifications` table | 🟡 NEW |

**Notification list item sub-component:**

| Field | Source | Display |
|---|---|---|
| Notification type icon | `notifications.type` | Collection / Payment / Alert / System icon |
| Title | `notifications.title` | Bold text |
| Message | `notifications.message` | Body text (max 2 lines, truncated) |
| Timestamp | `notifications.created_at` | Relative: "2 hours ago" |
| Read indicator | `notifications.is_read` | Unread = filled dot accent; Read = no dot |
| Tap action | `notifications.related_entity_type` + `related_entity_id` | If `collection_ticket` → 4.3; if `payment` → 4.5 |

**Notification types to handle (per schema `notifications.type`):**

| Type | Example message | Tap destination |
|---|---|---|
| `collection_receipt` | "Your collection of 15.0 kg on 15 Jan was confirmed." | 4.3 |
| `payment_confirmation` | "₹1,275.00 has been credited to your UPI." | 4.5 |
| `payment_pending` | "Your payment of ₹1,275.00 is being processed." | 4.5 |
| `qc_alert` | "Your collection of 15 Jan was partially adjusted at the gate." | 4.3 |
| `system` | "App updated to v1.3.0." | None |

---

## 🔌 FUNCTIONAL IMPLEMENTATION RULES (FOR AGENT)

1. **Bottom Navbar**: Must be identical on ALL authenticated core app screens (4.x only). Defined once in `app/(reeler)/_layout.tsx` using Expo Router `<Tabs>`. Tabs: `HOME` (dashboard), `COLLECTIONS` (collections), `PAYMENTS` (payments), `PROFILE` (profile). Hidden routes (`earnings`, `report-table`, `esg-report`, `notifications`, `collection-detail`, `payment-detail`, `withdrawal`, `profile/*`, `onboarding/*`, `setup/*`) use `href: null`. ✏️ **The navbar must NOT render on auth or onboarding screens.**

2. **Profile → Settings → Logout Flow**: 100% functional. Use `useAuth()` hook. Logout must: attempt pending sync first if `sync_metadata.pending_uploads_count > 0`, then `await supabase.auth.signOut()`, `SecureStore.deleteItemAsync('auth_session')`, reset Zustand stores (`authStore.clear()`, `syncStore.reset()`), then `router.replace('/(auth)/login')`. ✏️

3. **Bank Management**: Forms validate input, update `reelers` table (`upi_id`, `bank_account_masked`, `ifsc_code`, `payment_preference`) via Supabase, show loading/toast states, reflect changes instantly in UI. ✅

4. **Navigation**: Use `expo-router` exclusively. All routes declared in `app/(reeler)/_layout.tsx`. Programmatic nav: `router.push('/(reeler)/profile/edit-details')`, `router.back()`. ✅

5. **Design Enforcement**: Strict black/white palette. Import `DT` from `src/constants/designTokens.ts` for all colors. No gradients, no extra header icons, no retail styling. ✅

6. **Sync State**: All data screens (4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.17) must render `SyncStatusBar` at the top. Pull-to-refresh on all list screens triggers `triggerSync()`. ✏️

7. **Error Handling**: Wrap all async in `try/catch`. Show user-friendly toasts via `react-native-toast-message`. Log errors with context (screen name, action, user ID). ✅

8. **Consent enforcement**: The `useAuth()` hook must check `consent_logs` for a valid accepted record before granting access to any authenticated screen. If no consent record exists, redirect to 1.5. 🟡 **NEW**

9. **Offline mode**: On all data screens, if `SyncStatusBar` shows offline state, disable any action that requires a live network call (e.g., withdrawal submission, KYC upload) and show a tooltip explaining why. 🟡 **NEW**

---

## 📁 FILE STRUCTURE (Reeler App Only)

```
app/(auth)/
├── welcome.tsx             # 1.1
├── login.tsx               # 1.2
├── otp.tsx                 # 1.3
├── login-returning.tsx     # 1.4
└── consent.tsx             # 1.5 [NEW]

app/(reeler)/
├── _layout.tsx             # Tabs: HOME, COLLECTIONS, PAYMENTS, PROFILE
├── dashboard.tsx           # 4.1
├── notifications.tsx       # 4.17 [NEW]
├── collections.tsx         # 4.2
├── collection-detail.tsx   # 4.3
├── payments.tsx            # 4.4
├── payment-detail.tsx      # 4.5
├── withdrawal.tsx          # 4.6
├── earnings.tsx            # 4.7 (hidden tab)
├── report-table.tsx        # 4.8
├── esg-report.tsx          # 4.9
├── profile.tsx             # 4.10
├── profile/
│   ├── edit-details.tsx    # 4.11
│   ├── payment-methods.tsx # 4.12
│   ├── consent.tsx         # 4.13
│   ├── help.tsx            # 4.14
│   ├── settings.tsx        # 4.15
│   └── logout-modal.tsx    # 4.16
├── onboarding/
│   ├── basic-details.tsx   # 2.1
│   ├── kyc-upload.tsx      # 2.2
│   ├── kyc-pending.tsx     # 2.3
│   └── kyc-rejected.tsx    # 2.4
└── setup/
    ├── bank-setup.tsx      # 3.1
    └── qr-card.tsx         # 3.2
```

---

## ✅ VERIFICATION CHECKLIST (Updated)

- [ ] Bottom navbar appears ONLY on authenticated core app screens (4.x), NOT on auth (1.x), onboarding (2.x), or setup (3.x) screens
- [ ] Consent screen (1.5) present in auth flow for new users; consent log written on acceptance
- [ ] Screen 1.4 (Returning Login) has a PIN fallback if biometric is unavailable
- [ ] Email Login button removed from Screen 1.2
- [ ] Routing from 1.3 OTP Verify correctly branches: new user → 1.5 / returning user → 4.1
- [ ] Screen 2.1 saves GPS point to `reelers.farm_location` as GEOGRAPHY(POINT), not only text fields
- [ ] Screen 2.1 captures `reelers.farm_area_hectares`
- [ ] Screen 2.2 captures `reelers.aadhaar_last_4` and shows per-document upload progress
- [ ] Screen 2.3 shows submitted document thumbnails and offline polling notice
- [ ] Screen 2.4 displays admin rejection reason; does NOT route to 3.1
- [ ] Screen 3.1 supports all three payment modes (Instant UPI / Instant Bank / Weekly Batch) with conditional fields
- [ ] Screen 3.2 displays human-readable reeler code and includes a Share QR button
- [ ] Dashboard (4.1) has SyncStatusBar, notification bell with unread badge, greeting text, KYC status banner, and recent collections summary
- [ ] Collections List (4.2) has date range and grade filter chips and an empty state
- [ ] Ticket Detail (4.3) shows collector name, full weight breakdown, collection photos, and gate acceptance status
- [ ] Payment History (4.4) has total pending/paid summary cards, filter chips, empty state, and pull-to-refresh
- [ ] Payment Detail (4.5) shows UPI/bank details, linked ticket, failure reason, and retry option
- [ ] Withdrawal (4.6) shows available balance and current payment method before submit
- [ ] Earnings Report (4.7) includes collections count, weight, grade breakdown, and ESG report link
- [ ] Report Table (4.8) has defined columns and an empty state
- [ ] ESG Report (4.9) displays metric cards; back navigation returns to calling screen
- [ ] Profile (4.10) shows avatar, reeler code, KYC badge, cluster, and includes QR Code and Notifications menu rows
- [ ] Edit Details (4.11) includes language selector, notification toggle, profile photo upload, and discard confirmation
- [ ] Payment Methods (4.12) displays existing saved methods and supports delete
- [ ] Consent & Privacy (4.13) shows accepted version/date, consent history link, and data sharing explanation
- [ ] Help & Support (4.14) displays app version at bottom
- [ ] Settings (4.15) includes notifications toggle, theme selector, and last sync time display
- [ ] Logout Confirm (4.16) is non-dismissable; warns of unsynced data; triggers sync before clearing session
- [ ] Notifications screen (4.17) exists and is reachable from Dashboard bell icon and Profile menu
- [ ] `SyncStatusBar` present on all data screens: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 4.17
- [ ] All async operations wrapped in try/catch with user-facing toasts
- [ ] Design tokens (`DT`) used everywhere, no hardcoded hex values
- [ ] `useAuth()` enforces consent check before granting access to any 4.x screen

---

> **End of Reviewed Spec v1.1** — 31 screens total. 2 screens added (1.5, 4.17). 3 bugs fixed (routing from 1.3, routing from 2.4, email login button). 1 inconsistency corrected (ESG back navigation). Multiple missing components added across all screens per PRD requirements.
