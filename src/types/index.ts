import type { Session, User } from '@supabase/supabase-js';

export type { Database } from '../database';
import type { Database } from '../database';

// ---------------------------------------------------------------------------
// Table Row aliases
// ---------------------------------------------------------------------------

export type ClusterRow = Database['public']['Tables']['clusters']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ReelerRow = Database['public']['Tables']['reelers']['Row'];
export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type RouteRow = Database['public']['Tables']['routes']['Row'];
export type RouteStopRow = Database['public']['Tables']['route_stops']['Row'];
export type CollectionTicketRow = Database['public']['Tables']['collection_tickets']['Row'];
export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type ReelerLedgerRow = Database['public']['Tables']['reeler_ledger']['Row'];
export type GateEntryRow = Database['public']['Tables']['gate_entries']['Row'];
export type PriceListRow = Database['public']['Tables']['price_lists']['Row'];
export type ConsentLogRow = Database['public']['Tables']['consent_logs']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type SyncLogRow = Database['public']['Tables']['sync_logs']['Row'];

// ---------------------------------------------------------------------------
// Enum types
// ---------------------------------------------------------------------------

export type UserRole = Database['public']['Enums']['user_role'];
export type PupaeQualityGrade = Database['public']['Enums']['pupae_quality_grade'];
export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type PaymentMode = Database['public']['Enums']['payment_mode'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type GateQcStatus = Database['public']['Enums']['gate_qc_status'];
export type OverrideStatus = Database['public']['Enums']['override_status'];
export type ConsentScope = Database['public']['Enums']['consent_scope'];
export type LedgerEntryType = Database['public']['Enums']['ledger_entry_type'];
export type LedgerRefType = Database['public']['Enums']['ledger_ref_type'];
export type NetworkStatusType = Database['public']['Enums']['network_status'];
export type SyncStatusType = Database['public']['Enums']['sync_status'];

// ---------------------------------------------------------------------------
// App-level types
// ---------------------------------------------------------------------------

export interface AppUser {
  id: string;
  email: string | null;
  profile: ProfileRow | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// OfflineTicket — locally-created ticket not yet confirmed by the server
// ---------------------------------------------------------------------------

export interface OfflineTicket extends CollectionTicketRow {
  localId: string;
}

// ---------------------------------------------------------------------------
// PricingSnapshot — point-in-time price data captured when a ticket is created
// ---------------------------------------------------------------------------

export interface PricingSnapshot {
  grade: PupaeQualityGrade;
  pricePerKg: number;
  moistureDeduction: number;
  effectiveFrom: string;
}
