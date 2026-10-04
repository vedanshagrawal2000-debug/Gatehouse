-- ==============================================================================
-- GATEHOUSE Demonstration Data Seed
-- Target: Supabase PostgreSQL
-- Version: 4.2.0
-- ==============================================================================

-- ==============================================================================
-- 1. Seed Agents (3 Agents Matching Stitch UI Specs)
-- ==============================================================================
INSERT INTO agents (id, slug, name, role, model, system_prompt, status, execution_rate, queue_pending, external_system, system_status, requires_approval)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'customer',
        'Customer Agent',
        'Autonomous Dispute & Ticket Routing',
        'gemini-2.5-flash',
        'You are the GATEHOUSE Customer Operations Agent. You triage incoming dispute enquiries, evaluate client tiers, verify cryptographic transaction histories, and auto-route escalations.',
        'ready',
        '99.4% EXEC',
        0,
        'CRM // ZENDESK',
        'READY',
        FALSE
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'inventory',
        'Inventory Agent',
        'Predictive Supply Chain & PO Dispatch',
        'gemini-2.5-flash',
        'You are the GATEHOUSE Inventory Operations Agent. You sync warehouse telemetry with ERP systems (SAP/Oracle), compute predictive depletion curves, and dispatch purchase orders.',
        'sync_active',
        'SYNC ACTIVE',
        0,
        'ERP: SAP / ORACLE',
        'OK // 8MS',
        FALSE
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'finance',
        'Finance Agent',
        'Ledger Reconciliation & Gated Payouts',
        'gemini-2.5-pro',
        'You are the GATEHOUSE Treasury & Finance Agent. You audit sub-ledger entries and generate wire transfers. Any transaction exceeding $25,000 must halt at the perimeter for human biometric authorization.',
        'gate_pending',
        'GATE PENDING',
        1,
        'LEDGER: ACC_0941',
        'SIG REQ',
        TRUE
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    execution_rate = EXCLUDED.execution_rate,
    system_status = EXCLUDED.system_status,
    updated_at = NOW();

-- ==============================================================================
-- 2. Seed Inventory (10 Tactical Hardware & Cryptographic Products)
-- ==============================================================================
INSERT INTO inventory (id, sku, name, description, category, facility_id, quantity, reorder_threshold, unit_cost_usd, status, vendor_id, metadata)
VALUES
    (
        '01000000-0000-0000-0000-000000000001',
        'TAC-RELAY-01',
        'Tactical Encrypted Communication Relay',
        'Ruggedized microwave data relay with quantum-resistant key encapsulation.',
        'telemetry',
        'WH-04',
        42,
        15,
        1450.00,
        'in_stock',
        'VND-SATCOM-09',
        '{"firmware": "v3.2.1", "spectrum": "Ku-band", "mtbf_hours": 85000}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000002',
        'ENC-KEY-L5',
        'Sovereign-L5 Hardware Cryptographic Token',
        'FIPS 140-3 Level 4 certified physical security module for perimeter authentication.',
        'cryptography',
        'WH-04',
        18,
        10,
        850.00,
        'in_stock',
        'VND-SEC-CIPHER',
        '{"curve": "Ed25519", "tamper_responsive": true}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000003',
        'DRN-BAT-8K',
        'Tactical Drone High-Density Power Cell',
        'Solid-state lithium silicon battery pack for continuous perimeter patrol UAS.',
        'power',
        'WH-04',
        65,
        20,
        320.00,
        'in_stock',
        'VND-AERO-POWER',
        '{"capacity_mah": 8200, "cycle_count": 1200}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000004',
        'THM-CAM-X4',
        'Long-Wave Infrared Thermal Surveillance Node',
        'Cooled LWIR sensor with autonomous target classification and optical cross-triggering.',
        'surveillance',
        'WH-04',
        8,
        5,
        4200.00,
        'low_stock',
        'VND-OPTIC-SPEC',
        '{"resolution": "1280x1024", "fov_deg": 45, "thermal_sensitivity_mk": 25}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000005',
        'SRV-BLD-9U',
        'Air-Gapped High-Throughput Server Blade Unit',
        'Custom multi-die operational server blade running hardened Linux microkernel.',
        'hardware',
        'WH-04',
        12,
        8,
        9800.00,
        'in_stock',
        'VND-COMPUTE-CORP',
        '{"cores": 128, "ram_gb": 512, "ecc": true}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000006',
        'BIO-SCN-02',
        'Multi-Modal Biometric Handprint Scanner',
        'Subdermal vascular pattern and fingerprint reader for operator gate clearance.',
        'security',
        'WH-04',
        24,
        10,
        1950.00,
        'in_stock',
        'VND-SEC-CIPHER',
        '{"far_pct": 0.00001, "liveness_detection": true}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000007',
        'RF-JAM-500',
        'Wideband RF Frequency Shield & Attenuator',
        'Directional frequency countermeasure node for secure room shielding.',
        'hardware',
        'WH-04',
        4,
        5,
        6400.00,
        'low_stock',
        'VND-DEF-TACTICAL',
        '{"freq_range_ghz": "0.1-6.0", "power_output_w": 250}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000008',
        'VLT-SL-77',
        'Hermetic Vault Seal Gasket Kit',
        'Chemical and thermal resistant fluoropolymer containment seal for facility hatches.',
        'security',
        'WH-04',
        150,
        30,
        180.00,
        'in_stock',
        'VND-SEAL-TECH',
        '{"pressure_rating_psi": 500, "spec": "MIL-STD-810G"}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000009',
        'FBR-SPL-96',
        '96-Core Armored Optical Splice Cassette',
        'Zero-latency armored single-mode optical fiber cassette for underground telemetry.',
        'telemetry',
        'WH-04',
        85,
        25,
        240.00,
        'in_stock',
        'VND-OPTIC-SPEC',
        '{"insertion_loss_db": 0.15, "jacket": "LSZH"}'::jsonb
    ),
    (
        '01000000-0000-0000-0000-000000000010',
        'QNT-RNG-01',
        'Quantum Random Number Generator PCI Module',
        'Photon phase noise entropy source generating verified nondeterministic bitstreams.',
        'cryptography',
        'WH-04',
        2,
        3,
        14500.00,
        'low_stock',
        'VND-QUANTUM-LABS',
        '{"bitrate_gbps": 1.2, "certifications": ["NIST-SP-800-90B"]}'::jsonb
    )
ON CONFLICT (sku) DO NOTHING;

-- ==============================================================================
-- 3. Seed Customer Enquiries (3 Realistic Enterprise Inquiries)
-- ==============================================================================
INSERT INTO customer_enquiries (id, ticket_number, customer_name, customer_email, customer_tier, subject, description, priority, status, assigned_agent_id, metadata)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'TCK-2026-0891',
        'Sovereign Reserve Bank of Zurich',
        'security-ops@srbz.ch',
        'sovereign',
        'High-Frequency Ledger Discrepancy on Node 0941',
        'Automated reconciliation flagged a $38,450 debit anomaly across transit accounts. Requesting immediate forensic verification and settlement dispatch.',
        'critical',
        'triaged',
        '10000000-0000-0000-0000-000000000003', -- Assigned to Finance Agent
        '{"ledger_id": "ACC_0941", "disputed_amount": 38450.00, "channel": "SWIFT-API"}'::jsonb
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'TCK-2026-0892',
        'Apex Defense Systems Global',
        'logistics@apexdefense.com',
        'enterprise',
        'Urgent Restock Dispatch for Facility WH-04 Relays',
        'Telemetry indicates stock of TAC-RELAY-01 is depleting ahead of schedule due to scheduled field deployment. Requesting automatic vendor purchase order generation.',
        'high',
        'investigating',
        '10000000-0000-0000-0000-000000000002', -- Assigned to Inventory Agent
        '{"target_sku": "TAC-RELAY-01", "requested_quantity": 25, "facility": "WH-04"}'::jsonb
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'TCK-2026-0893',
        'Helios Cyber Command',
        'triage@helios-command.gov',
        'tier_1',
        'Authentication Gateway Lockout Dispute',
        'Tier-1 operator credentials rejected at perimeter gate SEC-04 during routine rotation. Require instant credential re-issuance and audit verification.',
        'medium',
        'resolved',
        '10000000-0000-0000-0000-000000000001', -- Assigned to Customer Agent
        '{"resolved_by": "Customer Agent", "resolution_code": "RES-KEY-ROTATED"}'::jsonb
    )
ON CONFLICT (ticket_number) DO NOTHING;

-- ==============================================================================
-- 4. Seed Missions (Demonstrating Execution Statuses & Relationships)
-- ==============================================================================
INSERT INTO missions (id, mission_code, title, objective, agent_id, customer_enquiry_id, status, priority, current_step, total_steps, initiated_by, context)
VALUES
    -- Mission 1: Gated High-Value Wire Payout (Finance Agent)
    (
        '30000000-0000-0000-0000-000000000001',
        'MSN-2026-9841',
        'Sovereign Wire Transfer Settlement ($38,450)',
        'Execute automated high-value vendor settlement. Halt at Perimeter Gate for operator biometric sign-off.',
        '10000000-0000-0000-0000-000000000003',
        '20000000-0000-0000-0000-000000000001',
        'gated',
        'high_stakes',
        4,
        5,
        'finance_agent_autonomous_kernel',
        '{"amount_usd": 38450.00, "source": "ACC_0941", "recipient": "Apex Logistics Global LLC"}'::jsonb
    ),
    -- Mission 2: Completed Routine CRM Resolution (Customer Agent)
    (
        '30000000-0000-0000-0000-000000000002',
        'MSN-2026-9842',
        'Perimeter Key Rotation & Lockout Cleared',
        'Verify identity of Helios Cyber Command operator and issue refreshed authentication token.',
        '10000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000003',
        'completed',
        'standard',
        5,
        5,
        'customer_agent_kernel',
        '{"auth_success": true, "token_id": "tok_9912a"}'::jsonb
    ),
    -- Mission 3: Failed Mission with Useful Error Messages
    (
        '30000000-0000-0000-0000-000000000003',
        'MSN-2026-9843',
        'Automated Replenishment PO Generation',
        'Generate vendor PO for TAC-RELAY-01 restock via SAP ERP API.',
        '10000000-0000-0000-0000-000000000002',
        '20000000-0000-0000-0000-000000000002',
        'failed',
        'standard',
        3,
        5,
        'inventory_agent_kernel',
        '{"error_code": "ERR_ERP_TIMEOUT", "retry_count": 3}'::jsonb
    )
ON CONFLICT (mission_code) DO NOTHING;

-- Update error information on the failed mission
UPDATE missions
SET
    error_message = 'Upstream ERP Gateway Timeout: SAP RFC endpoint at erp-gateway.internal failed to respond within 5000ms after 3 retries.',
    error_details = '{"endpoint": "https://erp-gateway.internal/rfc/bapi_po_create1", "http_status": 504, "circuit_breaker": "OPEN", "retry_exhausted": true}'::jsonb
WHERE mission_code = 'MSN-2026-9843';

-- ==============================================================================
-- 5. Seed Tool Executions (Belonging to Missions, Sensitive Flags, Errors)
-- ==============================================================================
INSERT INTO tool_executions (id, mission_id, agent_id, tool_id, arguments, status, is_sensitive, risk_tier, approval_required, result_payload, error_message, error_details, execution_duration_ms, executed_at)
VALUES
    -- Tool 1: Gated High-Value Wire Payout (Requires Approval)
    (
        '40000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000003',
        'finance_dispatch_payout',
        '{
            "source_account": "ACC_0941_MAIN_TREASURY",
            "destination_iban": "US89370400440532013000",
            "amount_usd": 38450.00,
            "vendor": "Apex Logistics Global LLC",
            "invoice_ref": "INV-2026-9024",
            "reason": "Perimeter telemetry deployment tranche 01"
        }'::jsonb,
        'requires_approval',
        TRUE,
        'high_risk',
        TRUE,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ),
    -- Tool 2: Completed CRM ticket resolution
    (
        '40000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'crm_resolve_dispute',
        '{
            "ticket_id": "TCK-2026-0893",
            "resolution_code": "KEY_ROTATED_SUCCESS",
            "notes": "Client identity verified via hardware key serial. Token regenerated."
        }'::jsonb,
        'executed',
        FALSE,
        'standard',
        FALSE,
        '{"status": "ok", "delivered_via": "encrypted_relay"}'::jsonb,
        NULL,
        NULL,
        45,
        NOW() - INTERVAL '15 minutes'
    ),
    -- Tool 3: Failed Tool Execution with Useful Error Message
    (
        '40000000-0000-0000-0000-000000000003',
        '30000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000002',
        'inventory_dispatch_po',
        '{
            "vendor_id": "VND-SATCOM-09",
            "item_sku": "TAC-RELAY-01",
            "quantity": 25,
            "facility_id": "WH-04"
        }'::jsonb,
        'failed',
        TRUE,
        'sensitive',
        FALSE,
        NULL,
        'Failed to connect to SAP ERP BAPI endpoint. Remote host unreachable (ETIMEDOUT 10.14.92.5:3300).',
        '{"stack": "ConnectionTimeoutError: ETIMEDOUT\n  at TCPConnectWrap.afterConnect\n  at SAPConnector.dispatchPO (/opt/gatehouse/tools/sap.py:84)", "trace_id": "trc_9941a80c"}'::jsonb,
        5002,
        NOW() - INTERVAL '30 minutes'
    )
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. Seed Approval Requests (Referencing Exact Proposed Action & Arguments)
-- ==============================================================================
INSERT INTO approval_requests (
    id,
    mission_id,
    tool_execution_id,
    action_type,
    action_name,
    arguments,
    amount_usd,
    risk_factor,
    status,
    idempotency_key,
    execution_count
)
VALUES (
    '50000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'HIGH_VALUE_WIRE_PAYOUT',
    'Authorize $38,450 Wire Payout to Apex Logistics Global LLC',
    '{
        "source_account": "ACC_0941_MAIN_TREASURY",
        "destination_iban": "US89370400440532013000",
        "amount_usd": 38450.00,
        "vendor": "Apex Logistics Global LLC",
        "invoice_ref": "INV-2026-9024",
        "reason": "Perimeter telemetry deployment tranche 01"
    }'::jsonb,
    38450.00,
    'critical',
    'pending',
    'idemp_wire_payout_3000000000000000000000000001',
    0
)
ON CONFLICT (idempotency_key) DO NOTHING;

-- ==============================================================================
-- 7. Seed Initial Audit Logs (Cryptographic Ledger Verification)
-- ==============================================================================
INSERT INTO audit_logs (
    id,
    timestamp,
    event_type,
    actor_type,
    actor_id,
    mission_id,
    tool_execution_id,
    approval_request_id,
    action,
    payload,
    payload_hash,
    status,
    metadata
)
VALUES
    (
        '60000000-0000-0000-0000-000000000001',
        NOW() - INTERVAL '15 minutes',
        'TOOL_EXECUTION_COMPLETED',
        'agent',
        '10000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000002',
        '40000000-0000-0000-0000-000000000002',
        NULL,
        'crm_resolve_dispute',
        '{"ticket_id": "TCK-2026-0893", "resolution_code": "KEY_ROTATED_SUCCESS"}'::jsonb,
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'success',
        '{"operator_session": "sess_auth_01"}'::jsonb
    ),
    (
        '60000000-0000-0000-0000-000000000002',
        NOW() - INTERVAL '10 minutes',
        'APPROVAL_GATE_HALTED',
        'system',
        'gatehouse_perimeter_shield',
        '30000000-0000-0000-0000-000000000001',
        '40000000-0000-0000-0000-000000000001',
        '50000000-0000-0000-0000-000000000001',
        'HIGH_VALUE_WIRE_PAYOUT_HALTED',
        '{"amount_usd": 38450.00, "threshold": 25000.00, "rule": "FAIL_SAFE_GATING_RULE_04"}'::jsonb,
        '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
        'gated',
        '{"risk_tier": "critical"}'::jsonb
    ),
    (
        '60000000-0000-0000-0000-000000000003',
        NOW() - INTERVAL '30 minutes',
        'TOOL_EXECUTION_FAILED',
        'agent',
        '10000000-0000-0000-0000-000000000002',
        '30000000-0000-0000-0000-000000000003',
        '40000000-0000-0000-0000-000000000003',
        NULL,
        'inventory_dispatch_po',
        '{"vendor_id": "VND-SATCOM-09", "quantity": 25}'::jsonb,
        'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        'failed',
        '{}'::jsonb
    )
ON CONFLICT (id) DO NOTHING;
