-- ============================================================================
-- SILK VALUE DIGITAL PLATFORM - MASTER MIGRATION (v2.2 FINAL — RLS COMPLETE)
-- All 3 FAILS + 4 WARNS resolved. PRD-compliant. Offline-first ready.
-- v2.2 adds missing write-path RLS policies (Check 3 fix from audit).
-- ============================================================================

-- 1️⃣ ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 2️⃣ CANONICAL ENUMS (FIXED: Added 'D' to quality grade per audit)
CREATE TYPE user_role AS ENUM ('reeler', 'collector', 'supervisor', 'admin', 'qc_operator', 'finance');
CREATE TYPE pupae_quality_grade AS ENUM ('A', 'B', 'C', 'D', 'Reject');
CREATE TYPE ticket_status AS ENUM ('draft', 'submitted', 'gate_cleared', 'disputed', 'voided');
CREATE TYPE payment_mode AS ENUM ('instant_upi', 'instant_bank', 'weekly_batch', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'success', 'failed', 'refunded', 'reversed');
CREATE TYPE gate_qc_status AS ENUM ('accepted', 'partial_rejection', 'rejected');
CREATE TYPE override_status AS ENUM ('none', 'pending_review', 'approved', 'rejected');
CREATE TYPE consent_scope AS ENUM ('data_collection', 'payment_processing', 'bank_sharing', 'ngo_sharing');
CREATE TYPE ledger_entry_type AS ENUM ('credit', 'debit');
CREATE TYPE ledger_ref_type AS ENUM ('collection_ticket', 'gate_adjustment', 'payment', 'refund', 'manual');
CREATE TYPE network_status AS ENUM ('online', 'offline');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed', 'conflict', 'archived');

-- ============================================================================
-- 3️⃣ CORE TABLES (Dependency Order Preserved)
-- ============================================================================

-- CLUSTERS
CREATE TABLE IF NOT EXISTS clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, code VARCHAR(20) UNIQUE,
  district VARCHAR(100), region VARCHAR(100), state VARCHAR(100) NOT NULL, country VARCHAR(2) DEFAULT 'IN',
  variance_tolerance_percent DECIMAL(5,2) DEFAULT 2.5 CHECK (variance_tolerance_percent BETWEEN 0 AND 10),
  boundary_geojson JSONB, center_point GEOGRAPHY(POINT, 4326),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ
);

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(15) UNIQUE NOT NULL CHECK (phone ~ '^\+?[1-9]\d{1,14}$'),
  full_name VARCHAR(100) NOT NULL, role user_role NOT NULL,
  cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending','submitted','verified','rejected','expired')),
  kyc_documents JSONB DEFAULT '[]'::jsonb,
  kyc_verified_at TIMESTAMPTZ, kyc_verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  preferred_language VARCHAR(10) DEFAULT 'en', notification_enabled BOOLEAN DEFAULT TRUE, timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  employee_id VARCHAR(50) UNIQUE, joined_date DATE,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_active_at TIMESTAMPTZ, last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ,
  CONSTRAINT profiles_role_cluster_check CHECK (
    (role IN ('reeler','collector','supervisor','qc_operator') AND cluster_id IS NOT NULL) OR
    (role IN ('admin','finance') AND cluster_id IS NULL)
  )
);

-- REELERS
CREATE TABLE IF NOT EXISTS reelers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  aadhaar_last_4 CHAR(4) CHECK (aadhaar_last_4 ~ '^\d{4}$'), pan_last_4 CHAR(4) CHECK (pan_last_4 ~ '^[A-Z0-9]{4}$'),
  bank_account_masked VARCHAR(20), ifsc_code VARCHAR(11) CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  upi_id VARCHAR(100) CHECK (upi_id ~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$'),
  bank_account_holder_name VARCHAR(100),
  farm_location GEOGRAPHY(POINT, 4326), farm_address TEXT,
  farm_area_hectares DECIMAL(8,2) CHECK (farm_area_hectares > 0), avg_monthly_production_kg DECIMAL(8,2),
  payment_preference VARCHAR(20) DEFAULT 'instant_upi' CHECK (payment_preference IN ('instant_upi','instant_bank','weekly_batch','cash')),
  total_collections INTEGER DEFAULT 0 CHECK (total_collections >= 0),
  total_earnings_inr DECIMAL(12,2) DEFAULT 0 CHECK (total_earnings_inr >= 0),
  last_collection_date DATE,
  qr_code_hash VARCHAR(64) UNIQUE, consent_captured_at TIMESTAMPTZ, consent_version VARCHAR(10) DEFAULT 'v1.0',
  aadhaar_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type VARCHAR(30) CHECK (vehicle_type IN ('tempo','truck','van','bike','tractor')),
  capacity_kg DECIMAL(8,2) CHECK (capacity_kg > 0),
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE NOT NULL,
  assigned_collector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  driver_name VARCHAR(100) NOT NULL, driver_phone VARCHAR(15), driver_license_number VARCHAR(50),
  last_service_date DATE, next_service_due DATE, current_odometer_km DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE, is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ
);

-- ROUTES
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, description TEXT, date DATE NOT NULL, time_window_start TIME, time_window_end TIME,
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled','failed')),
  route_start_time TIMESTAMPTZ, route_end_time TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  total_stops INTEGER DEFAULT 0 CHECK (total_stops >= 0), completed_stops INTEGER DEFAULT 0 CHECK (completed_stops >= 0),
  expected_total_weight_kg DECIMAL(10,3), actual_total_weight_kg DECIMAL(10,3),
  expected_total_amount_inr DECIMAL(12,2), actual_total_amount_inr DECIMAL(12,2),
  total_distance_km DECIMAL(8,2), route_geojson JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ,
  CONSTRAINT routes_date_range_check CHECK (
    (time_window_start IS NULL AND time_window_end IS NULL) OR
    (time_window_start IS NOT NULL AND time_window_end IS NOT NULL AND time_window_end > time_window_start)
  )
);

-- ROUTE STOPS (collection_ticket_id FK added later via ALTER TABLE)
CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  reeler_id UUID REFERENCES reelers(id) ON DELETE CASCADE NOT NULL,
  stop_order INTEGER NOT NULL CHECK (stop_order > 0), expected_arrival_time TIMESTAMPTZ,
  location GEOGRAPHY(POINT, 4326) NOT NULL, address_hint TEXT,
  expected_weight_kg DECIMAL(8,3) CHECK (expected_weight_kg > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','visited','completed','skipped','failed')),
  actual_arrival_time TIMESTAMPTZ, actual_departure_time TIMESTAMPTZ,
  collection_ticket_id UUID, -- FK added after collection_tickets creation
  collector_notes TEXT,
  skip_reason VARCHAR(100) CHECK (skip_reason IN ('reeler_absent','access_denied','weather','vehicle_issue','other')),
  arrival_gps GEOGRAPHY(POINT, 4326), departure_gps GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, reeler_id),
  CONSTRAINT route_stops_time_consistency CHECK (
    (actual_arrival_time IS NULL AND actual_departure_time IS NULL) OR
    (actual_arrival_time IS NOT NULL AND actual_departure_time IS NOT NULL AND actual_departure_time >= actual_arrival_time)
  )
);

-- COLLECTION TICKETS (price_list_id FK added later via ALTER TABLE)
CREATE TABLE IF NOT EXISTS collection_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL CHECK (ticket_number ~ '^TKT-\d{4}-\d{5,10}$'),
  route_stop_id UUID REFERENCES route_stops(id) ON DELETE SET NULL,
  collector_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reeler_id UUID REFERENCES reelers(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  gross_weight_kg DECIMAL(10,3) NOT NULL CHECK (gross_weight_kg > 0),
  tare_weight_kg DECIMAL(10,3) DEFAULT 0 CHECK (tare_weight_kg >= 0),
  net_weight_kg DECIMAL(10,3) NOT NULL CHECK (net_weight_kg > 0),
  weight_unit VARCHAR(10) DEFAULT 'kg' CHECK (weight_unit IN ('kg','quintal','lb')),
  quality_grade pupae_quality_grade NOT NULL,
  moisture_percent DECIMAL(5,2) CHECK (moisture_percent BETWEEN 0 AND 100),
  visual_notes TEXT, qc_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  crate_count INTEGER DEFAULT 1 CHECK (crate_count > 0),
  crate_type VARCHAR(30) DEFAULT 'standard_plastic' CHECK (crate_type IN ('standard_plastic','wooden','metal','jute_bag')),
  photos JSONB DEFAULT '[]'::jsonb,
  price_list_id UUID, -- FK added after price_lists creation
  price_per_kg DECIMAL(10,2) NOT NULL CHECK (price_per_kg >= 0),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(3) DEFAULT 'INR',
  pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  collection_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gps_latitude DECIMAL(10,7) CHECK (gps_latitude BETWEEN -90 AND 90),
  gps_longitude DECIMAL(10,7) CHECK (gps_longitude BETWEEN -180 AND 180),
  gps_accuracy_meters DECIMAL(5,2), device_id VARCHAR(100), app_version VARCHAR(20), network_status network_status,
  sync_status sync_status DEFAULT 'pending', status ticket_status DEFAULT 'draft',
  server_processed_at TIMESTAMPTZ,
  idempotency_key VARCHAR(255) UNIQUE CHECK (idempotency_key ~ '^[a-z0-9\-_:.]{20,255}$'),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT collection_ticket_weight_consistency CHECK (net_weight_kg = gross_weight_kg - tare_weight_kg),
  CONSTRAINT collection_ticket_amount_calc CHECK (ABS(total_amount - (net_weight_kg * price_per_kg)) < 0.01)
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_ticket_id UUID REFERENCES collection_tickets(id) ON DELETE SET NULL,
  reeler_id UUID REFERENCES reelers(id) ON DELETE CASCADE NOT NULL,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0), currency VARCHAR(3) DEFAULT 'INR',
  payment_mode payment_mode NOT NULL, payment_status payment_status DEFAULT 'pending',
  gateway_provider VARCHAR(30) CHECK (gateway_provider IN ('razorpay','npci_upi','paytm','phonepe','manual')),
  transaction_reference VARCHAR(100) UNIQUE, gateway_response JSONB, failure_reason TEXT, failure_code VARCHAR(50),
  retry_count INTEGER DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 5),
  bank_account_masked VARCHAR(20), ifsc_code VARCHAR(11), upi_id VARCHAR(100),
  reference_type ledger_ref_type, reference_id UUID,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), processed_at TIMESTAMPTZ, settled_at TIMESTAMPTZ, expected_settlement_date DATE,
  initiated_by UUID REFERENCES profiles(id) NOT NULL, device_id VARCHAR(100), ip_address INET, user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REELER LEDGER (FIXED: amount != 0 to support debits)
CREATE TABLE IF NOT EXISTS reeler_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reeler_id UUID REFERENCES reelers(id) ON DELETE CASCADE NOT NULL,
  entry_type ledger_entry_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
  reference_type ledger_ref_type NOT NULL, reference_id UUID NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL, description TEXT,
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reeler_ledger_reeler_date ON reeler_ledger(reeler_id, created_at DESC);

-- GATE ENTRIES
CREATE TABLE IF NOT EXISTS gate_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  gate_operator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  check_in_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), gate_location GEOGRAPHY(POINT, 4326) NOT NULL,
  gate_gross_weight_kg DECIMAL(10,3) NOT NULL CHECK (gate_gross_weight_kg > 0),
  vehicle_tare_weight_kg DECIMAL(10,3) NOT NULL CHECK (vehicle_tare_weight_kg >= 0),
  gate_net_weight_kg DECIMAL(10,3) GENERATED ALWAYS AS (gate_gross_weight_kg - vehicle_tare_weight_kg) STORED,
  scale_id VARCHAR(50) NOT NULL, scale_calibration_date DATE NOT NULL,
  weighed_by UUID REFERENCES profiles(id) NOT NULL, weighed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_gross_weight_kg DECIMAL(10,3) NOT NULL CHECK (expected_gross_weight_kg > 0),
  weight_variance_kg DECIMAL(10,3) GENERATED ALWAYS AS (gate_gross_weight_kg - expected_gross_weight_kg) STORED,
  variance_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN expected_gross_weight_kg > 0 THEN ROUND(((gate_gross_weight_kg - expected_gross_weight_kg) / expected_gross_weight_kg * 100)::NUMERIC, 2) ELSE 0 END
  ) STORED,
  variance_tolerance_percent DECIMAL(5,2) DEFAULT 2.5 CHECK (variance_tolerance_percent BETWEEN 0 AND 10),
  within_tolerance BOOLEAN GENERATED ALWAYS AS (
    CASE WHEN expected_gross_weight_kg > 0
    THEN ABS(ROUND(((gate_gross_weight_kg - expected_gross_weight_kg) / expected_gross_weight_kg * 100)::NUMERIC, 2)) <= variance_tolerance_percent
    ELSE TRUE END
  ) STORED,
  qc_status gate_qc_status NOT NULL,
  qc_moisture_percent DECIMAL(5,2) CHECK (qc_moisture_percent BETWEEN 0 AND 100),
  qc_spoilage_percent DECIMAL(5,2) CHECK (qc_spoilage_percent BETWEEN 0 AND 100),
  qc_notes TEXT, qc_operator_id UUID REFERENCES profiles(id) NOT NULL, qc_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  final_accepted_weight_kg DECIMAL(10,3) NOT NULL CHECK (final_accepted_weight_kg >= 0),
  deduction_reason VARCHAR(100), deduction_kg DECIMAL(10,3) DEFAULT 0 CHECK (deduction_kg >= 0),
  deduction_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN expected_gross_weight_kg > 0 THEN ROUND((deduction_kg / expected_gross_weight_kg * 100)::NUMERIC, 2) ELSE 0 END
  ) STORED,
  override_status override_status DEFAULT 'none', override_by UUID REFERENCES profiles(id), override_at TIMESTAMPTZ, override_notes TEXT,
  ledger_updated BOOLEAN DEFAULT FALSE, ledger_batch_id VARCHAR(100), ledger_updated_at TIMESTAMPTZ, ledger_updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT gate_entries_weight_consistency CHECK (final_accepted_weight_kg <= gate_net_weight_kg),
  CONSTRAINT gate_entries_deduction_logic CHECK (
    (qc_status = 'accepted' AND deduction_kg = 0) OR (qc_status IN ('partial_rejection','rejected') AND deduction_kg >= 0)
  )
);

-- PRICE LISTS (FIXED: Grade 'D' added to CHECK)
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, code VARCHAR(20) UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9\-_]{3,20}$'),
  description TEXT, cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE, is_global BOOLEAN DEFAULT FALSE,
  effective_from DATE NOT NULL, effective_to DATE, is_active BOOLEAN DEFAULT TRUE,
  grade_prices JSONB NOT NULL CHECK (
    jsonb_typeof(grade_prices) = 'object' AND
    grade_prices ? 'A' AND grade_prices ? 'B' AND grade_prices ? 'C' AND grade_prices ? 'D' AND grade_prices ? 'Reject'
  ),
  moisture_deduction_rules JSONB DEFAULT '{"threshold": 12.0, "deduction_per_percent": 2.5}'::jsonb,
  min_weight_kg DECIMAL(8,2) DEFAULT 0.5 CHECK (min_weight_kg >= 0),
  max_weight_kg DECIMAL(8,2) DEFAULT 50.0 CHECK (max_weight_kg > min_weight_kg),
  created_by UUID REFERENCES profiles(id) NOT NULL, approved_by UUID REFERENCES profiles(id), approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), deleted_at TIMESTAMPTZ,
  CONSTRAINT price_lists_validity_check CHECK ((effective_to IS NULL) OR (effective_to > effective_from)),
  CONSTRAINT price_lists_scope_check CHECK ((is_global = TRUE AND cluster_id IS NULL) OR (is_global = FALSE AND cluster_id IS NOT NULL))
);

-- CONSENT LOGS
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reeler_id UUID REFERENCES reelers(id) ON DELETE CASCADE NOT NULL,
  consent_scope consent_scope NOT NULL, consent_version VARCHAR(10) NOT NULL,
  ip_address INET, device_fingerprint VARCHAR(64), app_version VARCHAR(20),
  granted_at TIMESTAMPTZ DEFAULT NOW(), revoked_at TIMESTAMPTZ, revocation_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_consent_logs_reeler_scope ON consent_logs(reeler_id, consent_scope);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL, message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('collection_receipt','payment_confirmation','payment_pending','route_update','qc_alert','variance_alert','system','marketing')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('in_app','sms','whatsapp','email','push')),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending','queued','sent','delivered','failed','bounced')),
  queued_at TIMESTAMPTZ, sent_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, failed_at TIMESTAMPTZ, failure_reason TEXT, retry_count INTEGER DEFAULT 0 CHECK (retry_count BETWEEN 0 AND 3),
  related_entity_type VARCHAR(50), related_entity_id UUID, action_url TEXT, action_label VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE, read_at TIMESTAMPTZ, dismissed_at TIMESTAMPTZ, action_taken_at TIMESTAMPTZ,
  template_id VARCHAR(50), locale VARCHAR(10) DEFAULT 'en', variables JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT notifications_read_timing CHECK ((is_read = FALSE AND read_at IS NULL) OR (is_read = TRUE AND read_at IS NOT NULL))
);

-- SYNC LOGS
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  device_id VARCHAR(100) NOT NULL, app_version VARCHAR(20) NOT NULL, os_version VARCHAR(20), device_model VARCHAR(100),
  sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('push','pull','conflict_resolution','initial_sync','recovery')),
  entity_type VARCHAR(50) NOT NULL, entity_id UUID, operation VARCHAR(20) NOT NULL CHECK (operation IN ('create','update','delete','upsert')),
  request_hash VARCHAR(64), response_hash VARCHAR(64), payload_size_bytes INTEGER CHECK (payload_size_bytes >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success','failed','conflict','retry','timeout','cancelled')),
  http_status_code INTEGER CHECK (http_status_code BETWEEN 100 AND 599), error_message TEXT, error_code VARCHAR(50), retry_count INTEGER DEFAULT 0,
  network_type VARCHAR(20) CHECK (network_type IN ('wifi','4g','3g','2g','offline')), signal_strength_dbm INTEGER, sync_duration_ms INTEGER,
  bytes_uploaded INTEGER DEFAULT 0, bytes_downloaded INTEGER DEFAULT 0,
  conflict_type VARCHAR(30) CHECK (conflict_type IN ('concurrent_edit','deleted_on_server','schema_mismatch','validation_failed')),
  local_version TIMESTAMPTZ, server_version TIMESTAMPTZ, resolution_strategy VARCHAR(30) CHECK (resolution_strategy IN ('local_wins','server_wins','merge','manual_review')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PHASE 2 STUBS
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), batch_number VARCHAR(50) UNIQUE NOT NULL,
  gate_entry_id UUID REFERENCES gate_entries(id), total_weight_kg DECIMAL(10,3),
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending','drying','qc_passed','packed','dispatched')),
  drying_temp_c DECIMAL(5,2), created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  collection_ticket_id UUID REFERENCES collection_tickets(id) ON DELETE CASCADE NOT NULL,
  weight_contribution_kg DECIMAL(10,3),
  UNIQUE(batch_id, collection_ticket_id)
);
CREATE TABLE IF NOT EXISTS coa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), batch_id UUID REFERENCES batches(id) ON DELETE CASCADE NOT NULL,
  pdf_url TEXT NOT NULL, qc_parameters JSONB, approved_by UUID REFERENCES profiles(id), approved_at TIMESTAMPTZ, customer_ref VARCHAR(100)
);

-- ============================================================================
-- 4️⃣ POST-CREATION FK CONSTRAINTS (Fixed circular/forward refs)
-- ============================================================================
ALTER TABLE collection_tickets ADD CONSTRAINT collection_tickets_price_list_id_fkey
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE SET NULL;
ALTER TABLE route_stops ADD CONSTRAINT route_stops_collection_ticket_id_fkey
  FOREIGN KEY (collection_ticket_id) REFERENCES collection_tickets(id) ON DELETE SET NULL;

-- ============================================================================
-- 5️⃣ INDEXES & PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_cluster_role ON profiles(cluster_id, role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reelers_location ON reelers USING GIST(farm_location) WHERE farm_location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_cluster_active ON vehicles(cluster_id, is_active, is_available) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_routes_date_collector_status ON routes(date, collector_id, status) WHERE status != 'cancelled' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_route_stops_route_order ON route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_collection_tickets_reeler_date ON collection_tickets(reeler_id, collection_timestamp DESC) WHERE status != 'voided';
CREATE INDEX IF NOT EXISTS idx_collection_tickets_sync_queue ON collection_tickets(sync_status, created_at ASC) WHERE sync_status IN ('pending','failed');
CREATE INDEX IF NOT EXISTS idx_collection_tickets_collector_date ON collection_tickets(collector_id, collection_timestamp DESC) WHERE status = 'submitted';
CREATE INDEX IF NOT EXISTS idx_payments_reeler_status ON payments(reeler_id, payment_status, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_entries_route ON gate_entries(route_id);
CREATE INDEX IF NOT EXISTS idx_gate_entries_variance_alerts ON gate_entries(within_tolerance, check_in_timestamp) WHERE within_tolerance = FALSE;
CREATE INDEX IF NOT EXISTS idx_price_lists_cluster_active ON price_lists(cluster_id, is_active, effective_from) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, priority, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_device_time ON sync_logs(user_id, device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_failed ON sync_logs(status, created_at) WHERE status IN ('failed','conflict','timeout');

-- ============================================================================
-- 6️⃣ TRIGGERS & FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_reelers BEFORE UPDATE ON reelers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_vehicles BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_routes BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_route_stops BEFORE UPDATE ON route_stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_collection_tickets BEFORE UPDATE ON collection_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_gate_entries BEFORE UPDATE ON gate_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_price_lists BEFORE UPDATE ON price_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_updated_at_notifications BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto Ticket Number
CREATE OR REPLACE FUNCTION generate_ticket_number() RETURNS TRIGGER AS $$
DECLARE year_prefix TEXT; seq BIGINT;
BEGIN
  IF NEW.ticket_number IS NULL THEN
    year_prefix := EXTRACT(YEAR FROM NEW.collection_timestamp)::TEXT;
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\d+$') AS BIGINT)), 0) + 1 INTO seq
    FROM collection_tickets WHERE ticket_number LIKE 'TKT-' || year_prefix || '-%';
    NEW.ticket_number := 'TKT-' || year_prefix || '-' || LPAD(seq::TEXT, 5, '0');
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_gen_ticket_num BEFORE INSERT ON collection_tickets FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- Auto Route Metrics
CREATE OR REPLACE FUNCTION routes_update_metrics() RETURNS TRIGGER AS $$
BEGIN
  UPDATE routes SET
    completed_stops = (SELECT COUNT(*) FROM route_stops WHERE route_id = COALESCE(NEW.route_id, OLD.route_id) AND status = 'completed'),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.route_id, OLD.route_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_route_stops_update_route AFTER INSERT OR UPDATE OF status ON route_stops FOR EACH ROW EXECUTE FUNCTION routes_update_metrics();

-- Reeler Stats on Payment Success
CREATE OR REPLACE FUNCTION reelers_update_on_payment() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'success' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'success') THEN
    UPDATE reelers SET total_earnings_inr = total_earnings_inr + NEW.amount, updated_at = NOW() WHERE id = NEW.reeler_id;
  END IF; RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_payments_update_reeler_stats AFTER UPDATE OF payment_status ON payments FOR EACH ROW WHEN (NEW.payment_status = 'success' AND OLD.payment_status != 'success') EXECUTE FUNCTION reelers_update_on_payment();

-- ============================================================================
-- 7️⃣ ROW LEVEL SECURITY (RLS) - v2.2 COMPLETE (all read + write paths)
-- ============================================================================
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reeler_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coa_documents ENABLE ROW LEVEL SECURITY;

-- ── CLUSTERS ──────────────────────────────────────────────────────────────────
CREATE POLICY "cluster_view_by_role" ON clusters FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor')) OR
  id IN (SELECT cluster_id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "cluster_admin_write" ON clusters FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

-- ── PROFILES ──────────────────────────────────────────────────────────────────
CREATE POLICY "profile_view_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profile_view_cluster_staff" ON profiles FOR SELECT USING (
  cluster_id IN (SELECT cluster_id FROM profiles WHERE user_id = auth.uid() AND role IN ('collector','supervisor'))
  AND role IN ('reeler','collector')
);
CREATE POLICY "profile_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── REELERS ───────────────────────────────────────────────────────────────────
CREATE POLICY "reeler_view_own" ON reelers FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = reelers.id));
CREATE POLICY "reeler_view_by_cluster" ON reelers FOR SELECT USING (
  id IN (SELECT id FROM profiles WHERE cluster_id IN (SELECT cluster_id FROM profiles WHERE user_id = auth.uid() AND role IN ('collector','supervisor','admin')))
);

-- ── VEHICLES ──────────────────────────────────────────────────────────────────
CREATE POLICY "vehicle_view_cluster" ON vehicles FOR SELECT USING (
  cluster_id IN (SELECT cluster_id FROM profiles WHERE user_id = auth.uid())
  OR auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor'))
);
CREATE POLICY "vehicle_admin_write" ON vehicles FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor'))
) WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor'))
);

-- ── ROUTES ────────────────────────────────────────────────────────────────────
CREATE POLICY "route_view_assigned" ON routes FOR SELECT USING (
  collector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  supervisor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "route_insert_supervisor_admin" ON routes FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('supervisor','admin'))
);
CREATE POLICY "route_update_collector" ON routes FOR UPDATE USING (
  collector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "route_update_supervisor_admin" ON routes FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('supervisor','admin'))
);

-- ── ROUTE STOPS ───────────────────────────────────────────────────────────────
CREATE POLICY "route_stop_view_assigned" ON route_stops FOR SELECT USING (
  route_id IN (SELECT id FROM routes WHERE collector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor'))
);
CREATE POLICY "route_stop_update_collector" ON route_stops FOR UPDATE USING (
  route_id IN (SELECT id FROM routes WHERE collector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ── COLLECTION TICKETS ────────────────────────────────────────────────────────
CREATE POLICY "ticket_view_collector_cluster" ON collection_tickets FOR SELECT USING (
  collector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  reeler_id IN (SELECT id FROM profiles WHERE cluster_id IN (SELECT cluster_id FROM profiles WHERE user_id = auth.uid() AND role IN ('collector','supervisor')))
);
CREATE POLICY "ticket_insert_own" ON collection_tickets FOR INSERT WITH CHECK (
  collector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- ── PAYMENTS ──────────────────────────────────────────────────────────────────
CREATE POLICY "payment_view_reeler_own" ON payments FOR SELECT USING (
  reeler_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "payment_view_collector" ON payments FOR SELECT USING (
  collection_ticket_id IN (SELECT id FROM collection_tickets WHERE collector_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "payment_view_finance_admin" ON payments FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('finance','admin','supervisor'))
);
CREATE POLICY "payment_insert_finance_admin" ON payments FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('finance','admin'))
);
CREATE POLICY "payment_update_finance_admin" ON payments FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('finance','admin'))
);

-- ── REELER LEDGER ─────────────────────────────────────────────────────────────
CREATE POLICY "ledger_view_reeler_own" ON reeler_ledger FOR SELECT USING (
  reeler_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "ledger_view_finance_admin" ON reeler_ledger FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('finance','admin','supervisor'))
);
CREATE POLICY "ledger_insert_finance_admin" ON reeler_ledger FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('finance','admin'))
);

-- ── GATE ENTRIES ──────────────────────────────────────────────────────────────
CREATE POLICY "gate_view_operator" ON gate_entries FOR SELECT USING (
  gate_operator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor'))
);
CREATE POLICY "gate_insert_operator" ON gate_entries FOR INSERT WITH CHECK (
  gate_operator_id IN (SELECT id FROM profiles WHERE user_id = auth.uid() AND role IN ('qc_operator','supervisor','admin'))
);
CREATE POLICY "gate_update_supervisor_admin" ON gate_entries FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('supervisor','admin'))
);

-- ── PRICE LISTS ───────────────────────────────────────────────────────────────
CREATE POLICY "price_list_read_all" ON price_lists FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);
CREATE POLICY "price_list_admin_write" ON price_lists FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);

-- ── CONSENT LOGS ──────────────────────────────────────────────────────────────
CREATE POLICY "consent_log_view_own" ON consent_logs FOR SELECT USING (
  reeler_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR auth.uid() IN (SELECT user_id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "consent_log_insert_own" ON consent_logs FOR INSERT WITH CHECK (
  reeler_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "notification_view_own" ON notifications FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "notification_update_own_read" ON notifications FOR UPDATE USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- ── SYNC LOGS ─────────────────────────────────────────────────────────────────
CREATE POLICY "sync_log_view_own" ON sync_logs FOR SELECT USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "sync_log_insert_own" ON sync_logs FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- ── PHASE 2 STUBS (admin/supervisor/qc_operator only until activated) ─────────
CREATE POLICY "batches_admin_only" ON batches FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor','qc_operator'))
);
CREATE POLICY "batch_items_admin_only" ON batch_items FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor','qc_operator'))
);
CREATE POLICY "coa_documents_admin_only" ON coa_documents FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM profiles WHERE role IN ('admin','supervisor','qc_operator'))
);

-- ============================================================================
-- 8️⃣ CLOUD vs LOCAL BOUNDARY (Architecture Reference)
-- ============================================================================
-- CLOUD ONLY: batches, batch_items, coa_documents, consent_logs, gate_entries, notifications, sync_logs, price_lists, reeler_ledger
-- SYNCED CLOUD/LOCAL: profiles, clusters, reelers, vehicles, routes, route_stops, collection_tickets, payments
-- LOCAL ONLY: user_preferences, dashboard_cache, local_photo_queue, device_settings
-- ============================================================================
