"""
GATEHOUSE Tactical Business Transaction Scenarios & Generator.
Provides realistic, distinct B2B procurement and purchase-order transaction datasets.
Ensures every order has its own unique ID, SKU list, current stock, minimum threshold,
quantity to order, unit price, supplier, hub/region, dynamically computed amounts,
threshold breach reasoning, and triggering policy.
"""

import time
import random
from uuid import uuid4
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# Single source of truth exchange rate: 1 USD = 83.5 INR
USD_INR_RATE = 83.5

# ==============================================================================
# 10 REALISTIC BUSINESS TRANSACTION DATASETS
# Each dataset has distinct suppliers, real SKUs, current stock levels,
# minimum safety thresholds, quantities, prices, calculated subtotals,
# 18% GST, shipping fees, totals, approval limits, and distinct security policies.
# ==============================================================================

TRANSACTION_SCENARIOS: List[Dict[str, Any]] = [
    # SCENARIO 01 (SCENARIO A)
    {
        "id": "SCEN-01",
        "supplier": "National Logistics Hub",
        "supplier_code": "VEND-NLH-7701",
        "supplier_address": "Hub 04, East Logistics Corridor, Sector 18, Gurugram, HR",
        "hub_region": "Northern Logistics Corridor (WH-04 East), Gurugram",
        "category": "Procurement & Hardware Replenishment",
        "policy_rule": "RULE_POL_093",
        "autonomous_limit": 14000,
        "shipping_fee": 800.0,
        "line_items": [
            {
                "sku": "SKU-8892-NEO",
                "description": "High-Bandwidth Transceiver Module 100G",
                "current_stock": 2,
                "min_threshold": 10,
                "quantity": 50,
                "unit_price": 180.0,
                "extended_amount": 9000.0,
            },
            {
                "sku": "SKU-1044-CORE",
                "description": "Optic Switch Processor (Rev 4)",
                "current_stock": 0,
                "min_threshold": 5,
                "quantity": 20,
                "unit_price": 300.0,
                "extended_amount": 6000.0,
            },
        ],
    },
    # SCENARIO 02 (SCENARIO B)
    {
        "id": "SCEN-02",
        "supplier": "Apex Industrial Supplies",
        "supplier_code": "VEND-APX-4412",
        "supplier_address": "Apex Industrial Estate, Block C, Peenya Industrial Area, Bengaluru, KA",
        "hub_region": "Southern Tech Hub (BLR-02), Peenya, Bengaluru",
        "category": "Network Infrastructure & Optics",
        "policy_rule": "RULE_POL_104",
        "autonomous_limit": 20000,
        "shipping_fee": 950.0,
        "line_items": [
            {
                "sku": "SKU-4410-NET",
                "description": "Industrial Gigabit Network Controller",
                "current_stock": 3,
                "min_threshold": 15,
                "quantity": 25,
                "unit_price": 560.0,
                "extended_amount": 14000.0,
            },
            {
                "sku": "SKU-2291-FBR",
                "description": "Single-Mode Fiber SFP+ Module",
                "current_stock": 5,
                "min_threshold": 25,
                "quantity": 40,
                "unit_price": 210.0,
                "extended_amount": 8400.0,
            },
        ],
    },
    # SCENARIO 03 (SCENARIO C)
    {
        "id": "SCEN-03",
        "supplier": "Metro Components India",
        "supplier_code": "VEND-MCI-3309",
        "supplier_address": "MIDC Electronic Zone, Mahape, Navi Mumbai, MH",
        "hub_region": "Western Gateway (BOM-01), Mahape, Navi Mumbai",
        "category": "Sensor Arrays & Edge Gateways",
        "policy_rule": "RULE_POL_078",
        "autonomous_limit": 25000,
        "shipping_fee": 1200.0,
        "line_items": [
            {
                "sku": "SKU-5582-SNS",
                "description": "Precision Thermal & Humidity Sensor Module",
                "current_stock": 8,
                "min_threshold": 40,
                "quantity": 80,
                "unit_price": 240.0,
                "extended_amount": 19200.0,
            },
            {
                "sku": "SKU-3301-GTW",
                "description": "Tactical Edge IoT Gateway Unit",
                "current_stock": 1,
                "min_threshold": 8,
                "quantity": 15,
                "unit_price": 720.0,
                "extended_amount": 10800.0,
            },
        ],
    },
    # SCENARIO 04
    {
        "id": "SCEN-04",
        "supplier": "Bharat Telematics Ltd",
        "supplier_code": "VEND-BTL-9921",
        "supplier_address": "Export Promotion Industrial Park, Whitefield, Bengaluru, KA",
        "hub_region": "Whitefield Technology Corridor (BLR-03), Bengaluru",
        "category": "Wireless Telemetry & Antennae",
        "policy_rule": "RULE_POL_112",
        "autonomous_limit": 22000,
        "shipping_fee": 850.0,
        "line_items": [
            {
                "sku": "SKU-7712-MOD",
                "description": "Industrial LTE-M Cellular Modem",
                "current_stock": 4,
                "min_threshold": 20,
                "quantity": 30,
                "unit_price": 650.0,
                "extended_amount": 19500.0,
            },
            {
                "sku": "SKU-1109-ANT",
                "description": "High-Gain Omnidirectional Helical Antenna",
                "current_stock": 12,
                "min_threshold": 50,
                "quantity": 60,
                "unit_price": 150.0,
                "extended_amount": 9000.0,
            },
        ],
    },
    # SCENARIO 05
    {
        "id": "SCEN-05",
        "supplier": "Delta Power Electronics",
        "supplier_code": "VEND-DPE-1029",
        "supplier_address": "Okhla Industrial Cluster, Phase III, New Delhi, DL",
        "hub_region": "Capital Distribution Hub (DEL-01), New Delhi",
        "category": "Power Distribution & Backup",
        "policy_rule": "RULE_POL_088",
        "autonomous_limit": 26000,
        "shipping_fee": 900.0,
        "line_items": [
            {
                "sku": "SKU-9904-PWR",
                "description": "Redundant DIN-Rail Power Supply Unit 48V",
                "current_stock": 2,
                "min_threshold": 12,
                "quantity": 20,
                "unit_price": 820.0,
                "extended_amount": 16400.0,
            },
            {
                "sku": "SKU-6623-ISO",
                "description": "Galvanic DC-DC Optical Isolator Pack",
                "current_stock": 6,
                "min_threshold": 30,
                "quantity": 45,
                "unit_price": 310.0,
                "extended_amount": 13950.0,
            },
        ],
    },
    # SCENARIO 06
    {
        "id": "SCEN-06",
        "supplier": "Horizon Optoelectronics",
        "supplier_code": "VEND-HOE-5510",
        "supplier_address": "Plot 88, Electronic City Phase 1, Hosur Road, Bengaluru, KA",
        "hub_region": "Electronic City Optics Yard (BLR-01), Bengaluru",
        "category": "Dense Multiplexers & Passive Optics",
        "policy_rule": "RULE_POL_135",
        "autonomous_limit": 21000,
        "shipping_fee": 780.0,
        "line_items": [
            {
                "sku": "SKU-6620-WDM",
                "description": "Dense Wavelength Division Multiplexer (DWDM)",
                "current_stock": 7,
                "min_threshold": 35,
                "quantity": 35,
                "unit_price": 420.0,
                "extended_amount": 14700.0,
            },
            {
                "sku": "SKU-8819-SPL",
                "description": "Planar Lightwave Circuit Optical Splitter 1x16",
                "current_stock": 14,
                "min_threshold": 70,
                "quantity": 70,
                "unit_price": 160.0,
                "extended_amount": 11200.0,
            },
        ],
    },
    # SCENARIO 07
    {
        "id": "SCEN-07",
        "supplier": "Zenith Micro Devices",
        "supplier_code": "VEND-ZMD-8834",
        "supplier_address": "Cyber Towers, HITEC City Phase 2, Hyderabad, TS",
        "hub_region": "HITEC City Semiconductor Hub (HYD-02), Hyderabad",
        "category": "Embedded Compute & Relays",
        "policy_rule": "RULE_POL_142",
        "autonomous_limit": 24000,
        "shipping_fee": 920.0,
        "line_items": [
            {
                "sku": "SKU-8821-MCU",
                "description": "Ultra-Low Power ARM Cortex MCU Board",
                "current_stock": 15,
                "min_threshold": 60,
                "quantity": 100,
                "unit_price": 140.0,
                "extended_amount": 14000.0,
            },
            {
                "sku": "SKU-3112-CLK",
                "description": "Temperature-Compensated Crystal Oscillator",
                "current_stock": 10,
                "min_threshold": 40,
                "quantity": 50,
                "unit_price": 190.0,
                "extended_amount": 9500.0,
            },
        ],
    },
    # SCENARIO 08
    {
        "id": "SCEN-08",
        "supplier": "Alpha Quantum Logistics",
        "supplier_code": "VEND-AQL-7123",
        "supplier_address": "Sector 62, Noida Electronic City, Uttar Pradesh",
        "hub_region": "NCR Thermal & Enclosure Depot (NDLS-04), Noida",
        "category": "Thermal & Enclosure Packaging",
        "policy_rule": "RULE_POL_156",
        "autonomous_limit": 24000,
        "shipping_fee": 1050.0,
        "line_items": [
            {
                "sku": "SKU-2201-ENC",
                "description": "IP67 Ruggedized Industrial DIN Enclosure",
                "current_stock": 3,
                "min_threshold": 18,
                "quantity": 18,
                "unit_price": 1150.0,
                "extended_amount": 20700.0,
            },
            {
                "sku": "SKU-9932-FAN",
                "description": "High-CFM Dual Ball-Bearing Cooling Array",
                "current_stock": 8,
                "min_threshold": 36,
                "quantity": 36,
                "unit_price": 220.0,
                "extended_amount": 7920.0,
            },
        ],
    },
    # SCENARIO 09
    {
        "id": "SCEN-09",
        "supplier": "Delta Fiber Networks",
        "supplier_code": "VEND-DFN-6641",
        "supplier_address": "Salt Lake Sector V, Electronic Complex, Kolkata, WB",
        "hub_region": "Eastern Interconnect Depot (CCU-01), Salt Lake, Kolkata",
        "category": "Interconnect Cabling & Attenuators",
        "policy_rule": "RULE_POL_167",
        "autonomous_limit": 19000,
        "shipping_fee": 690.0,
        "line_items": [
            {
                "sku": "SKU-7740-CAB",
                "description": "Armored Tactical Fiber Patch Cable 10m Duplex",
                "current_stock": 18,
                "min_threshold": 120,
                "quantity": 120,
                "unit_price": 140.0,
                "extended_amount": 16800.0,
            },
            {
                "sku": "SKU-3321-ATT",
                "description": "Variable Optical Inline Attenuator LC/UPC",
                "current_stock": 11,
                "min_threshold": 50,
                "quantity": 50,
                "unit_price": 190.0,
                "extended_amount": 9500.0,
            },
        ],
    },
    # SCENARIO 10
    {
        "id": "SCEN-10",
        "supplier": "Titan Switchgear Industries",
        "supplier_code": "VEND-TSI-9018",
        "supplier_address": "GIDC Industrial Estate, Makarpura, Vadodara, Gujarat",
        "hub_region": "Gujarat Industrial Switchgear Yard (BDQ-02), Vadodara",
        "category": "High-Voltage Protection & Switchgear",
        "policy_rule": "RULE_POL_179",
        "autonomous_limit": 30000,
        "shipping_fee": 1350.0,
        "line_items": [
            {
                "sku": "SKU-1188-BRK",
                "description": "Industrial Motor Circuit Breaker 63A",
                "current_stock": 2,
                "min_threshold": 16,
                "quantity": 16,
                "unit_price": 1250.0,
                "extended_amount": 20000.0,
            },
            {
                "sku": "SKU-4429-SPD",
                "description": "Type-2 Modular Surge Protection Device",
                "current_stock": 5,
                "min_threshold": 30,
                "quantity": 30,
                "unit_price": 480.0,
                "extended_amount": 14400.0,
            },
        ],
    },
]

# Sequential scenario counter for round-robin rotation across missions
_scenario_index = 0
_po_counter = 8840
_req_counter = 8841
_txn_counter = 9100
_inv_counter = 7700


def get_next_scenario() -> Dict[str, Any]:
    """Retrieves the next scenario in round-robin order."""
    global _scenario_index
    scenario = TRANSACTION_SCENARIOS[_scenario_index % len(TRANSACTION_SCENARIOS)]
    _scenario_index += 1
    return scenario


def format_inr(amount: float) -> str:
    """Formats an amount into Indian numbering representation, e.g. ₹18,500."""
    int_part = int(round(amount))
    s = str(int_part)
    if len(s) <= 3:
        formatted = s
    else:
        last3 = s[-3:]
        remaining = s[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        formatted = ",".join(groups) + "," + last3
    return f"₹{formatted}"


def format_dual_currency(inr_amount: float) -> str:
    """
    Computes USD from base INR using the central exchange-rate USD_INR_RATE.
    Guarantees both figures always match.
    """
    usd_val = round(inr_amount / USD_INR_RATE, 2)
    return f"{format_inr(inr_amount)} (${usd_val:,.2f} USD)"


def generate_transaction_approval(
    mission_id: str = "MS-8902-RESTOCK",
    prompt: str = "Check inventory, find low-stock products and prepare a restock order.",
    agent_code: str = "AGT-02",
    agent_name: str = "INVENTORY AGENT",
    preferred_scenario_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates a realistic, fully computed B2B purchase order approval request.
    Assigns:
      - Unique Transaction ID (e.g. TXN-2026-9104)
      - Unique PO Number (e.g. PO-8845-B)
      - Unique Invoice Number (e.g. INV-2026-7721)
      - Unique Request ID (e.g. #REQ-8845-B)
      - Exact calculated subtotal, 18% GST, shipping, total, and variance
      - Real dynamic breach reasons for each SKU ("SKU-X stock at {curr} units (Min: {min})")
      - Dynamic security policy that actually triggered for that order
      - Mathematically synchronized INR and USD values via USD_INR_RATE
    Once generated, all values are fixed and immutable.
    """
    global _po_counter, _req_counter, _txn_counter, _inv_counter

    # Select scenario
    if preferred_scenario_id:
        scenario = next(
            (s for s in TRANSACTION_SCENARIOS if s["id"] == preferred_scenario_id),
            None,
        )
        if not scenario:
            scenario = get_next_scenario()
    else:
        scenario = get_next_scenario()

    # Increment unique counters
    _po_counter += 1
    _req_counter += 1
    _txn_counter += 1
    _inv_counter += 1

    suffix_letter = chr(65 + (_po_counter % 26))
    po_number = f"PO-{_po_counter}-{suffix_letter}"
    req_id = f"#REQ-{_req_counter}-{suffix_letter}"
    txn_id = f"TXN-2026-{_txn_counter}"
    inv_number = f"INV-2026-{_inv_counter}"
    appr_id = f"appr-{int(time.time() * 1000)}-{_po_counter}"

    # Calculate itemized amounts from quantities and unit prices
    line_items_data = []
    subtotal = 0.0
    for item in scenario["line_items"]:
        ext = round(item["quantity"] * item["unit_price"], 2)
        subtotal += ext
        line_items_data.append({
            "sku": item["sku"],
            "description": item["description"],
            "currentStock": item.get("current_stock", 0),
            "minThreshold": item.get("min_threshold", 10),
            "quantity": item["quantity"],
            "unitPrice": item["unit_price"],
            "extendedAmount": ext,
        })

    gst_tax = round(subtotal * 0.18, 2)
    shipping_fee = round(scenario["shipping_fee"], 2)
    total_amount = round(subtotal + gst_tax + shipping_fee, 2)
    autonomous_limit = scenario["autonomous_limit"]
    variance_amount = round(total_amount - autonomous_limit, 2)

    amount_formatted = format_dual_currency(total_amount)
    subtotal_formatted = format_inr(subtotal)
    gst_formatted = format_inr(gst_tax)
    shipping_formatted = format_inr(shipping_fee)
    limit_formatted = format_inr(autonomous_limit)
    variance_formatted = format_inr(variance_amount)

    supplier = scenario["supplier"]
    supplier_code = scenario["supplier_code"]
    supplier_address = scenario["supplier_address"]
    hub_region = scenario.get("hub_region", supplier_address)
    policy_rule = scenario["policy_rule"]

    # Generate dynamic breach text from actual SKU thresholds
    breaches_list = [
        f"{it['sku']} stock at {it['currentStock']} units (Min: {it['minThreshold']})"
        for it in line_items_data
    ]
    breaches_text = " and ".join(breaches_list)
    description = (
        f"Critical inventory threshold breach: {breaches_text}. Automated vendor requisition "
        f"drafted with approved supplier {supplier} ({hub_region}) to prevent fulfillment outage."
    )

    reasoning_steps = [
        f"Audited {hub_region} telemetry matrix. Flagged threshold breaches: {'; '.join(breaches_list)}.",
        f"Structured purchase requisition for {supplier} ({supplier_code}) totaling Subtotal: {subtotal_formatted} + GST (18%): {gst_formatted} + Shipping: {shipping_formatted}.",
        f"Calculated gross transaction value: {amount_formatted} (PO: {po_number}, Invoice Ref: {inv_number}).",
        f"TRIPWIRE ENGAGED: Policy {policy_rule} triggered. Total PO value {format_inr(total_amount)} exceeds autonomous limit {limit_formatted} by {variance_formatted}. Sovereign human authorization mandatory.",
    ]

    tool_payload = {
        "status": "STAGED",
        "po_number": po_number,
        "invoice_number": inv_number,
        "transaction_id": txn_id,
        "vendor_id": supplier_code,
        "supplier": supplier,
        "hub_region": hub_region,
        "subtotal": subtotal,
        "gst": gst_tax,
        "shipping": shipping_fee,
        "total_amount": total_amount,
        "currency": "INR",
        "autonomous_limit": autonomous_limit,
        "variance": variance_amount,
        "line_items": line_items_data,
        "biometric_gating_tripwire": True,
        "gating_reason": f"Total order value ({format_inr(total_amount)}) exceeds autonomous limit ({limit_formatted}) under policy {policy_rule}",
    }

    enclave_hash = f"0x{uuid4().hex[:15]}"

    approval_request: Dict[str, Any] = {
        "id": appr_id,
        "requestId": req_id,
        "missionId": mission_id,
        "agentId": agent_code,
        "agentName": agent_name,
        "senderEmail": f"{agent_code.lower()}.operations@enclave.internal",
        "recipientEmail": "business.owner@company.internal",
        "subject": f"ACTION REQUIRED: Authorize Supplier Purchase Order #{po_number} ({format_inr(total_amount)})",
        "category": scenario["category"],
        "isStarred": True,
        "isRead": False,
        "title": f"CREATE SUPPLIER PURCHASE ORDER // {supplier.upper()}",
        "description": description,
        "prompt": prompt,
        "amount": total_amount,
        "amountFormatted": amount_formatted,
        "autonomousLimit": autonomous_limit,
        "varianceAmount": variance_amount,
        "currency": "INR",
        "riskLevel": "CRITICAL",
        "policyRule": policy_rule,
        "enclaveHash": enclave_hash,
        "status": "PENDING",
        "timestamp": "Just now",
        "reasoningSteps": reasoning_steps,
        "boundTool": f"netsuite_erp.draft_po (Vendor: {supplier_code})",
        "toolPayload": tool_payload,
        "lineItems": line_items_data,
        "supplier": supplier,
        "supplierCode": supplier_code,
        "supplierAddress": supplier_address,
        "hubRegion": hub_region,
        "poNumber": po_number,
        "invoiceNumber": inv_number,
        "transactionId": txn_id,
        "subtotal": subtotal,
        "gst": gst_tax,
        "shipping": shipping_fee,
        "total": total_amount,
        "subtotalFormatted": subtotal_formatted,
        "gstFormatted": gst_formatted,
        "shippingFormatted": shipping_formatted,
        "limitFormatted": limit_formatted,
        "varianceFormatted": variance_formatted,
    }

    return approval_request


def build_seed_approvals(count: int = 6) -> List[Dict[str, Any]]:
    """
    Creates an initial batch of distinct, realistically varied approval orders
    using different scenarios, SKUs, regions, policies, and prices.
    """
    seed_list: List[Dict[str, Any]] = []
    for idx in range(min(count, len(TRANSACTION_SCENARIOS))):
        scen = TRANSACTION_SCENARIOS[idx]
        po_num = f"PO-{8841 + idx}-{chr(65 + idx)}"
        req_id = f"#REQ-{8841 + idx}-{chr(65 + idx)}"
        txn_id = f"TXN-2026-{9101 + idx}"
        inv_num = f"INV-2026-{7701 + idx}"
        appr_id = f"appr-0{idx + 1}"

        # Line items
        line_items_data = []
        subtotal = 0.0
        for item in scen["line_items"]:
            ext = round(item["quantity"] * item["unit_price"], 2)
            subtotal += ext
            line_items_data.append({
                "sku": item["sku"],
                "description": item["description"],
                "currentStock": item.get("current_stock", 0),
                "minThreshold": item.get("min_threshold", 10),
                "quantity": item["quantity"],
                "unitPrice": item["unit_price"],
                "extendedAmount": ext,
            })

        gst_tax = round(subtotal * 0.18, 2)
        shipping_fee = round(scen["shipping_fee"], 2)
        total_amount = round(subtotal + gst_tax + shipping_fee, 2)
        autonomous_limit = scen["autonomous_limit"]
        variance_amount = round(total_amount - autonomous_limit, 2)

        amount_formatted = format_dual_currency(total_amount)
        subtotal_formatted = format_inr(subtotal)
        gst_formatted = format_inr(gst_tax)
        shipping_formatted = format_inr(shipping_fee)
        limit_formatted = format_inr(autonomous_limit)
        variance_formatted = format_inr(variance_amount)

        supplier = scen["supplier"]
        supplier_code = scen["supplier_code"]
        supplier_address = scen["supplier_address"]
        hub_region = scen.get("hub_region", supplier_address)
        policy_rule = scen["policy_rule"]

        breaches_list = [
            f"{it['sku']} stock at {it['currentStock']} units (Min: {it['minThreshold']})"
            for it in line_items_data
        ]
        breaches_text = " and ".join(breaches_list)
        description = (
            f"Critical inventory threshold breach: {breaches_text}. Automated vendor requisition "
            f"drafted with approved supplier {supplier} ({hub_region}) to prevent fulfillment outage."
        )

        reasoning_steps = [
            f"Queried {hub_region} telemetry matrix. Flagged threshold breaches: {'; '.join(breaches_list)}.",
            f"Structured purchase requisition for {supplier} ({supplier_code}) totaling Subtotal: {subtotal_formatted} + GST (18%): {gst_formatted} + Shipping: {shipping_formatted}.",
            f"Calculated gross transaction value: {amount_formatted} (PO: {po_num}, Invoice Ref: {inv_num}).",
            f"TRIPWIRE ENGAGED: Policy {policy_rule} triggered. Total PO value {format_inr(total_amount)} exceeds autonomous limit {limit_formatted} by {variance_formatted}. Sovereign human authorization mandatory.",
        ]

        tool_payload = {
            "status": "STAGED",
            "po_number": po_num,
            "invoice_number": inv_num,
            "transaction_id": txn_id,
            "vendor_id": supplier_code,
            "supplier": supplier,
            "hub_region": hub_region,
            "subtotal": subtotal,
            "gst": gst_tax,
            "shipping": shipping_fee,
            "total_amount": total_amount,
            "currency": "INR",
            "autonomous_limit": autonomous_limit,
            "variance": variance_amount,
            "line_items": line_items_data,
            "biometric_gating_tripwire": True,
        }

        seed_list.append({
            "id": appr_id,
            "requestId": req_id,
            "missionId": f"MS-{8902 + idx}-RESTOCK",
            "agentId": "AGT-02",
            "agentName": "INVENTORY AGENT",
            "senderEmail": "inventory.operations@enclave.internal",
            "recipientEmail": "business.owner@company.internal",
            "subject": f"ACTION REQUIRED: Authorize Supplier Purchase Order #{po_num} ({format_inr(total_amount)})",
            "category": scen["category"],
            "isStarred": idx < 2,
            "isRead": False,
            "title": f"CREATE SUPPLIER PURCHASE ORDER // {supplier.upper()}",
            "description": description,
            "prompt": "Check low-stock products and prepare a restock order.",
            "amount": total_amount,
            "amountFormatted": amount_formatted,
            "autonomousLimit": autonomous_limit,
            "varianceAmount": variance_amount,
            "currency": "INR",
            "riskLevel": "CRITICAL",
            "policyRule": policy_rule,
            "enclaveHash": f"0x{uuid4().hex[:15]}",
            "status": "PENDING",
            "timestamp": f"{14 - idx}:22:{15 + idx * 3} UTC ({idx * 3 + 2}m ago)",
            "reasoningSteps": reasoning_steps,
            "boundTool": f"netsuite_erp.draft_po (Vendor: {supplier_code})",
            "toolPayload": tool_payload,
            "lineItems": line_items_data,
            "supplier": supplier,
            "supplierCode": supplier_code,
            "supplierAddress": supplier_address,
            "hubRegion": hub_region,
            "poNumber": po_num,
            "invoiceNumber": inv_num,
            "transactionId": txn_id,
            "subtotal": subtotal,
            "gst": gst_tax,
            "shipping": shipping_fee,
            "total": total_amount,
            "subtotalFormatted": subtotal_formatted,
            "gstFormatted": gst_formatted,
            "shippingFormatted": shipping_formatted,
            "limitFormatted": limit_formatted,
            "varianceFormatted": variance_formatted,
        })

    return seed_list
