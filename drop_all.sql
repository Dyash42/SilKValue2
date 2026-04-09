-- ============================================================
-- FULL WIPE: drop all public schema objects (safe for Supabase)
-- Runs in reverse dependency order, CASCADE handles FKs
-- ============================================================

-- Drop all tables (CASCADE removes dependent views, FKs, policies, triggers)
DROP TABLE IF EXISTS public.coa_documents       CASCADE;
DROP TABLE IF EXISTS public.batch_items         CASCADE;
DROP TABLE IF EXISTS public.batches             CASCADE;
DROP TABLE IF EXISTS public.sync_logs           CASCADE;
DROP TABLE IF EXISTS public.notifications       CASCADE;
DROP TABLE IF EXISTS public.consent_logs        CASCADE;
DROP TABLE IF EXISTS public.price_lists         CASCADE;
DROP TABLE IF EXISTS public.gate_entries        CASCADE;
DROP TABLE IF EXISTS public.reeler_ledger       CASCADE;
DROP TABLE IF EXISTS public.payments            CASCADE;
DROP TABLE IF EXISTS public.collection_tickets  CASCADE;
DROP TABLE IF EXISTS public.route_stops         CASCADE;
DROP TABLE IF EXISTS public.routes              CASCADE;
DROP TABLE IF EXISTS public.vehicles            CASCADE;
DROP TABLE IF EXISTS public.reelers             CASCADE;
DROP TABLE IF EXISTS public.profiles            CASCADE;
DROP TABLE IF EXISTS public.clusters            CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS public.update_updated_at_column()    CASCADE;
DROP FUNCTION IF EXISTS public.generate_ticket_number()      CASCADE;
DROP FUNCTION IF EXISTS public.routes_update_metrics()       CASCADE;
DROP FUNCTION IF EXISTS public.reelers_update_on_payment()   CASCADE;

-- Drop custom enums
DROP TYPE IF EXISTS public.user_role           CASCADE;
DROP TYPE IF EXISTS public.pupae_quality_grade CASCADE;
DROP TYPE IF EXISTS public.ticket_status       CASCADE;
DROP TYPE IF EXISTS public.payment_mode        CASCADE;
DROP TYPE IF EXISTS public.payment_status      CASCADE;
DROP TYPE IF EXISTS public.gate_qc_status      CASCADE;
DROP TYPE IF EXISTS public.override_status     CASCADE;
DROP TYPE IF EXISTS public.consent_scope       CASCADE;
DROP TYPE IF EXISTS public.ledger_entry_type   CASCADE;
DROP TYPE IF EXISTS public.ledger_ref_type     CASCADE;
DROP TYPE IF EXISTS public.network_status      CASCADE;
DROP TYPE IF EXISTS public.sync_status         CASCADE;

SELECT 'wipe complete' AS status;
