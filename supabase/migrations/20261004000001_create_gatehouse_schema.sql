-- ==============================================================================
-- GATEHOUSE Database Schema Migration
-- Target: Supabase PostgreSQL
-- Version: 4.2.0
-- ==============================================================================

-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Agents Table
-- Stores autonomous agent nodes, clearance models, and operational telemetry.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(150) NOT NULL,
    model VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash',
    system_prompt TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ready'
        CHECK (status IN ('ready', 'sync_active', 'gate_pending', 'busy', 'offline', 'degraded')),
    execution_rate VARCHAR(50) NOT NULL DEFAULT '100% EXEC',
    queue_pending INTEGER NOT NULL DEFAULT 0 CHECK (queue_pending >= 0),
    external_system VARCHAR(100),
    system_status VARCHAR(50) NOT NULL DEFAULT 'READY',
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. Inventory Table
-- Stores tactical hardware, cryptographic keys, and supply chain telemetry.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    facility_id VARCHAR(50) NOT NULL DEFAULT 'WH-04',
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_threshold INTEGER NOT NULL DEFAULT 10 CHECK (reorder_threshold >= 0),
    unit_cost_usd NUMERIC(12, 2) NOT NULL CHECK (unit_cost_usd >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'in_stock'
        CHECK (status IN ('in_stock', 'low_stock', 'depleted', 'in_transit', 'quarantined')),
    vendor_id VARCHAR(100),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. Customer Enquiries Table
-- Stores incoming high-priority business requests, ticket disputes, and CRM tasks.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customer_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_tier VARCHAR(50) NOT NULL DEFAULT 'tier_1'
        CHECK (customer_tier IN ('tier_1', 'tier_2', 'enterprise', 'vip', 'sovereign')),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'triaged', 'investigating', 'escalated', 'resolved', 'closed')),
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. Missions Table
-- Requirement: Every mission has an execution status.
-- Represents high-entropy business workflows orchestrated across multi-agent loops.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    objective TEXT NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    customer_enquiry_id UUID REFERENCES customer_enquiries(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'gated', 'completed', 'failed', 'cancelled')),
    priority VARCHAR(50) NOT NULL DEFAULT 'standard'
        CHECK (priority IN ('routine', 'standard', 'high_stakes', 'critical')),
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1),
    total_steps INTEGER NOT NULL DEFAULT 5 CHECK (total_steps >= current_step),
    initiated_by VARCHAR(100) NOT NULL DEFAULT 'system_operator',
    error_message TEXT,
    error_details JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. Tool Executions Table
-- Requirement: Every tool execution belongs to a mission.
-- Requirement: Failed actions have useful error messages.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    tool_id VARCHAR(100) NOT NULL,
    arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'requires_approval', 'approved', 'executed', 'failed', 'rejected')),
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    risk_tier VARCHAR(50) NOT NULL DEFAULT 'standard'
        CHECK (risk_tier IN ('read_only', 'standard', 'sensitive', 'high_risk')),
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    result_payload JSONB,
    error_message TEXT,
    error_details JSONB,
    execution_duration_ms INTEGER CHECK (execution_duration_ms >= 0),
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. Approval Requests Table
-- Requirement: Every approval references the exact proposed action and its validated arguments.
-- Requirement: Approved actions cannot execute twice.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    tool_execution_id UUID NOT NULL UNIQUE REFERENCES tool_executions(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_name VARCHAR(150) NOT NULL,
    arguments JSONB NOT NULL,
    amount_usd NUMERIC(14, 2) CHECK (amount_usd >= 0),
    risk_factor VARCHAR(50) NOT NULL DEFAULT 'elevated'
        CHECK (risk_factor IN ('standard', 'elevated', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'expired')),
    decision VARCHAR(50)
        CHECK (decision IS NULL OR decision IN ('approved', 'rejected')),
    operator_id VARCHAR(100),
    operator_notes TEXT,
    decided_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    execution_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Invariants:
    -- 1. An action cannot execute more than once.
    CONSTRAINT chk_cannot_execute_twice CHECK (execution_count <= 1),
    -- 2. Execution requires an approved decision.
    CONSTRAINT chk_executed_requires_approved CHECK (
        (executed_at IS NULL AND execution_count = 0) OR
        (executed_at IS NOT NULL AND execution_count = 1 AND decision = 'approved')
    )
);

-- ==============================================================================
-- 8. Audit Logs Table
-- Requirement: Every sensitive action is auditable.
-- Cryptographic immutable ledger of mission actions, approvals, and security events.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(100) NOT NULL,
    actor_type VARCHAR(50) NOT NULL
        CHECK (actor_type IN ('agent', 'operator', 'system')),
    actor_id VARCHAR(100) NOT NULL,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    tool_execution_id UUID REFERENCES tool_executions(id) ON DELETE SET NULL,
    approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
    action VARCHAR(150) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    payload_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL
        CHECK (status IN ('success', 'warning', 'critical', 'gated', 'failed')),
    client_ip VARCHAR(45),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent UPDATE and DELETE on audit_logs to guarantee immutability
CREATE OR REPLACE RULE no_update_audit_logs AS
    ON UPDATE TO audit_logs DO INSTEAD NOTHING;

CREATE OR REPLACE RULE no_delete_audit_logs AS
    ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ==============================================================================
-- 9. Comprehensive Performance & Relationship Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_facility ON inventory(facility_id);

CREATE INDEX IF NOT EXISTS idx_customer_enquiries_ticket ON customer_enquiries(ticket_number);
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_status ON customer_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_priority ON customer_enquiries(priority);
CREATE INDEX IF NOT EXISTS idx_customer_enquiries_agent ON customer_enquiries(assigned_agent_id);

CREATE INDEX IF NOT EXISTS idx_missions_code ON missions(mission_code);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_agent ON missions(agent_id);
CREATE INDEX IF NOT EXISTS idx_missions_customer_enquiry ON missions(customer_enquiry_id);

CREATE INDEX IF NOT EXISTS idx_tool_executions_mission ON tool_executions(mission_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_agent ON tool_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_status ON tool_executions(status);
CREATE INDEX IF NOT EXISTS idx_tool_executions_sensitive ON tool_executions(is_sensitive);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_id ON tool_executions(tool_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_mission ON approval_requests(mission_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tool ON approval_requests(tool_execution_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_idempotency ON approval_requests(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_approval_requests_decision ON approval_requests(decision);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_mission ON audit_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tool_execution ON audit_logs(tool_execution_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_approval_request ON audit_logs(approval_request_id);

-- ==============================================================================
-- 10. Audit Logging Triggers
-- Automatically record sensitive tool executions & approval decisions into audit_logs.
-- ==============================================================================
CREATE OR REPLACE FUNCTION fn_audit_sensitive_tool()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_sensitive = TRUE OR NEW.status IN ('failed', 'executed') THEN
        INSERT INTO audit_logs (
            event_type,
            actor_type,
            actor_id,
            mission_id,
            tool_execution_id,
            action,
            payload,
            payload_hash,
            status
        ) VALUES (
            CASE
                WHEN NEW.status = 'failed' THEN 'TOOL_EXECUTION_FAILED'
                WHEN NEW.is_sensitive THEN 'SENSITIVE_TOOL_EXECUTION'
                ELSE 'TOOL_EXECUTION_COMPLETED'
            END,
            'agent',
            NEW.agent_id::text,
            NEW.mission_id,
            NEW.id,
            NEW.tool_id,
            NEW.arguments,
            encode(digest(NEW.arguments::text, 'sha256'), 'hex'),
            CASE
                WHEN NEW.status = 'failed' THEN 'failed'
                WHEN NEW.is_sensitive THEN 'warning'
                ELSE 'success'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_tool_execution ON tool_executions;
CREATE TRIGGER trg_audit_tool_execution
    AFTER INSERT OR UPDATE ON tool_executions
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_sensitive_tool();
