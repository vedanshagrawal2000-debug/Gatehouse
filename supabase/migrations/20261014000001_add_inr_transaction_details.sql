-- ==============================================================================
-- GATEHOUSE Database Additive Migration: INR Purchase Order & Multi-Scenario Details
-- Target: Supabase PostgreSQL
-- Version: 4.3.0
-- Non-breaking additive changes to support realistic Indian Rupee (INR) procurement,
-- itemized tax/shipping breakdowns, supplier identities, and explicit RLS security.
-- ==============================================================================

-- 1. Extend approval_requests with INR procurement and transaction breakdown fields
ALTER TABLE approval_requests
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2) CHECK (amount IS NULL OR amount >= 0),
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14, 2) CHECK (subtotal IS NULL OR subtotal >= 0),
    ADD COLUMN IF NOT EXISTS gst NUMERIC(14, 2) CHECK (gst IS NULL OR gst >= 0),
    ADD COLUMN IF NOT EXISTS shipping NUMERIC(14, 2) CHECK (shipping IS NULL OR shipping >= 0),
    ADD COLUMN IF NOT EXISTS autonomous_limit NUMERIC(14, 2) CHECK (autonomous_limit IS NULL OR autonomous_limit >= 0),
    ADD COLUMN IF NOT EXISTS variance_amount NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS supplier VARCHAR(200),
    ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS supplier_address TEXT,
    ADD COLUMN IF NOT EXISTS po_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS reasoning_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS enclave_hash VARCHAR(100),
    ADD COLUMN IF NOT EXISTS request_id VARCHAR(100);

-- Backfill amount from amount_usd if null
UPDATE approval_requests 
SET amount = amount_usd 
WHERE amount IS NULL AND amount_usd IS NOT NULL;

-- 2. Indexes for performance on transaction queries
CREATE INDEX IF NOT EXISTS idx_approval_requests_po_number ON approval_requests(po_number);
CREATE INDEX IF NOT EXISTS idx_approval_requests_transaction_id ON approval_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_supplier_code ON approval_requests(supplier_code);
CREATE INDEX IF NOT EXISTS idx_approval_requests_request_id ON approval_requests(request_id);

-- 3. Extend audit_logs with human-readable event summary details matching UI contracts
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS details TEXT;

-- 4. Row-Level Security (RLS) Configuration
-- Protects Supabase tables against unauthorized direct public mutation
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies (allow public reads for telemetry & dashboard views)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read agents') THEN
        CREATE POLICY "Allow public read agents" ON agents FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read inventory') THEN
        CREATE POLICY "Allow public read inventory" ON inventory FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read enquiries') THEN
        CREATE POLICY "Allow public read enquiries" ON customer_enquiries FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read missions') THEN
        CREATE POLICY "Allow public read missions" ON missions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read tool_executions') THEN
        CREATE POLICY "Allow public read tool_executions" ON tool_executions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read approval_requests') THEN
        CREATE POLICY "Allow public read approval_requests" ON approval_requests FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read audit_logs') THEN
        CREATE POLICY "Allow public read audit_logs" ON audit_logs FOR SELECT USING (true);
    END IF;
END $$;
