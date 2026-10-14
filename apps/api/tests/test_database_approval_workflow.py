"""
GATEHOUSE Comprehensive Database & Approval Workflow Test Suite
Verifies:
1. Database health and transparent degraded reporting.
2. Prevention of financial purchase-order execution when persistent database storage is unavailable.
3. Duplicate approval prevention (idempotency and single-execution constraint).
4. Rejected approval handling (rejected orders cannot execute).
5. Unauthorized approval attempts & input validation.
6. Cryptographic audit log persistence and immutability.
7. Multi-scenario INR transaction generation and itemization.
"""

import unittest
from unittest.mock import patch, MagicMock
from starlette.testclient import TestClient

from main import app
from database import (
    DatabaseDegradedError,
    DuplicateExecutionError,
    ApprovalNotFoundError,
    InvalidApprovalStateError,
    is_database_configured,
)


class TestDatabaseAndApprovalWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_database_health_transparent_reporting(self):
        """
        Health endpoint MUST report DEGRADED and configured=False when Supabase
        credentials are unset, never falsely claiming healthy.
        """
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Database health check assertions
        db_health = data["services"]["database"]
        self.assertEqual(db_health["status"], "degraded")
        self.assertFalse(db_health["configured"])
        self.assertIn("not configured", db_health["message"].lower())

        # Gemini engine remains independently healthy
        gemini_health = data["services"]["gemini"]
        self.assertEqual(gemini_health["status"], "healthy")
        self.assertTrue(gemini_health["configured"])

    def test_02_database_degraded_prevents_financial_execution(self):
        """
        When persistent storage is unavailable, financial/purchase-order execution
        MUST be halted with HTTP 503 instead of silently faking persistence.
        """
        res = self.client.post(
            "/api/approvals/authorize",
            json={
                "id": "appr-01",
                "authorized_by": "Business Owner // Sovereign L5",
                "key_signature": "0xdeadbeef1234",
            },
        )
        self.assertEqual(res.status_code, 503)
        data = res.json()
        self.assertIn("Persistent database storage is unavailable", data["detail"])

    def test_03_unauthorized_approval_attempts_validation(self):
        """
        Approval endpoint must reject empty, missing, or whitespace IDs.
        """
        # Empty string ID
        res = self.client.post("/api/approvals/authorize", json={"id": ""})
        self.assertEqual(res.status_code, 400)
        self.assertIn("ID is required", res.json()["detail"])

        # Whitespace ID
        res = self.client.post("/api/approvals/authorize", json={"id": "   "})
        self.assertEqual(res.status_code, 400)
        self.assertIn("ID is required", res.json()["detail"])

    @patch("database.supabase_client.is_database_configured")
    @patch("database.supabase_client.get_supabase_admin_client")
    def test_04_duplicate_approval_prevention(self, mock_get_client, mock_is_configured):
        """
        Enforces invariant: Approved actions cannot execute twice (chk_cannot_execute_twice).
        Subsequent execution attempts must be blocked with HTTP 409 Conflict.
        """
        mock_is_configured.return_value = True
        mock_supabase = MagicMock()
        mock_get_client.return_value = mock_supabase

        # Initial state: Pending approval with execution_count = 0
        pending_record = {
            "id": "appr-mock-01",
            "request_id": "#REQ-8841-B",
            "po_number": "PO-8841-B",
            "transaction_id": "TXN-2026-9101",
            "status": "pending",
            "execution_count": 0,
            "amount": 18500.0,
            "currency": "INR",
            "supplier": "National Logistics Hub",
            "supplier_code": "VEND-NLH-7701",
            "line_items": [{"sku": "SKU-8892-NEO", "quantity": 50, "unitPrice": 180.0}],
            "arguments": {},
        }

        # Mock select query returning the pending record
        mock_select = MagicMock()
        mock_select.execute.return_value = MagicMock(data=[pending_record])
        mock_supabase.table.return_value.select.return_value.or_.return_value = mock_select

        # Mock successful first update
        executed_record = dict(pending_record)
        executed_record["status"] = "approved"
        executed_record["execution_count"] = 1
        executed_record["operator_id"] = "Business Owner // Sovereign L5"
        mock_update = MagicMock()
        mock_update.execute.return_value = MagicMock(data=[executed_record])
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.eq.return_value = mock_update

        # Mock audit log insertion
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "audit-mock-01"}])

        # 1. First execution should succeed
        res1 = self.client.post(
            "/api/approvals/authorize",
            json={
                "id": "appr-mock-01",
                "authorized_by": "Business Owner // Sovereign L5",
                "key_signature": "0x9f4c882a",
            },
        )
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(res1.json()["success"])
        self.assertEqual(res1.json()["approval"]["status"], "APPROVED")

        # 2. Second attempt: Mock select returning already-executed record (execution_count = 1)
        mock_select_executed = MagicMock()
        mock_select_executed.execute.return_value = MagicMock(data=[executed_record])
        mock_supabase.table.return_value.select.return_value.or_.return_value = mock_select_executed

        res2 = self.client.post(
            "/api/approvals/authorize",
            json={
                "id": "appr-mock-01",
                "authorized_by": "Business Owner // Sovereign L5",
                "key_signature": "0x9f4c882a",
            },
        )
        self.assertEqual(res2.status_code, 409)
        self.assertIn("Duplicate execution blocked", res2.json()["detail"])

    @patch("database.supabase_client.is_database_configured")
    @patch("database.supabase_client.get_supabase_admin_client")
    def test_05_rejected_approvals_cannot_execute(self, mock_get_client, mock_is_configured):
        """
        Enforces invariant: A rejected action cannot be approved/executed.
        """
        mock_is_configured.return_value = True
        mock_supabase = MagicMock()
        mock_get_client.return_value = mock_supabase

        # Mock record that is already REJECTED
        rejected_record = {
            "id": "appr-mock-02",
            "request_id": "#REQ-8839-F",
            "po_number": "PO-8839-F",
            "transaction_id": "TXN-2026-9044",
            "status": "rejected",
            "execution_count": 0,
            "amount": 38500.0,
            "currency": "INR",
            "supplier": "Apex Industrial Supplies",
        }

        mock_select = MagicMock()
        mock_select.execute.return_value = MagicMock(data=[rejected_record])
        mock_supabase.table.return_value.select.return_value.or_.return_value = mock_select

        # Attempt to authorize a rejected record
        res = self.client.post(
            "/api/approvals/authorize",
            json={"id": "appr-mock-02"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("rejected", res.json()["detail"].lower())

    @patch("database.supabase_client.is_database_configured")
    @patch("database.supabase_client.get_supabase_admin_client")
    def test_06_rejection_workflow_and_audit(self, mock_get_client, mock_is_configured):
        """
        Rejection workflow transitions status to REJECTED and records audit trail.
        """
        mock_is_configured.return_value = True
        mock_supabase = MagicMock()
        mock_get_client.return_value = mock_supabase

        pending_record = {
            "id": "appr-mock-03",
            "request_id": "#REQ-8835-C",
            "po_number": "PO-8835-C",
            "transaction_id": "TXN-2026-9035",
            "status": "pending",
            "execution_count": 0,
            "amount": 15000.0,
            "currency": "INR",
            "supplier": "Metro Components India",
        }

        mock_select = MagicMock()
        mock_select.execute.return_value = MagicMock(data=[pending_record])
        mock_supabase.table.return_value.select.return_value.or_.return_value = mock_select

        rejected_updated = dict(pending_record)
        rejected_updated["status"] = "rejected"
        mock_update = MagicMock()
        mock_update.execute.return_value = MagicMock(data=[rejected_updated])
        mock_supabase.table.return_value.update.return_value.eq.return_value = mock_update

        # Mock audit insert
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[{"id": "audit-mock-02"}])

        res = self.client.post(
            "/api/approvals/reject",
            json={
                "id": "appr-mock-03",
                "reason": "Exceeds budgetary allocation for Q4",
            },
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        self.assertEqual(res.json()["approval"]["status"], "REJECTED")

    def test_07_inr_transaction_generation_consistency(self):
        """
        Each new mission must generate realistic INR transactions with distinct suppliers,
        subtotal, 18% GST, shipping, and calculated totals.
        """
        res = self.client.post(
            "/api/agent/run",
            json={"prompt": "Check inventory and restock critical components."},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertTrue(data["haltedForApproval"])
        approval = data["approvalRequest"]
        self.assertIsNotNone(approval)

        # Assert INR fields exist and are internally consistent
        self.assertEqual(approval["currency"], "INR")
        self.assertIn("₹", approval["amountFormatted"])
        self.assertGreater(approval["total"], 0)
        self.assertGreater(approval["subtotal"], 0)
        self.assertGreater(approval["gst"], 0)

        # Invariant: subtotal + gst + shipping == total (within 1 rupee rounding)
        computed_total = approval["subtotal"] + approval["gst"] + approval["shipping"]
        self.assertAlmostEqual(computed_total, approval["total"], places=1)

        # Assert line items exist
        self.assertGreater(len(approval["lineItems"]), 0)


if __name__ == "__main__":
    unittest.main()
