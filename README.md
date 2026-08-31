# Service Quality, Rating & Dispute Management System
### Team 15_RisingEmber

![Project Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 📋 Project Overview

**Domain:** Digital Marketplace Services (non-retail)

The **Service Quality, Rating & Dispute Management System** is a secure, intermediate platform designed to eliminate financial risk and operational friction in the gig economy. By integrating an **automated escrow vault** with a human-in-the-loop **arbitration layer**, the system bridges the trust gap between Customers and Service Providers.

Unlike traditional booking platforms that leave users vulnerable to fraud or substandard work, our system acts as a neutral guardian of the transaction. It ensures that funds are protected, identities are verified, and conflicts are resolved objectively using immutable evidence.

---

## 📌 Problem Statement

In current service marketplaces, trust is a significant barrier to adoption. Customers hesitate to pay upfront due to fear of low-quality work, while Service Providers face risks of non-payment or unjustified chargebacks. Existing platforms lack a transparent, evidence-based mechanism to handle these conflicts, often resulting in:
* Financial loss for one or both parties.
* Arbitrary dispute resolutions without proper evidence.
* A deterioration of platform trust and user retention.

---

## 🛡️ Core Solution Architecture

Our solution enforces fairness through three non-negotiable mechanisms:

1.  **Escrow-First Payments:** Funds are secured in a holding vault immediately upon booking. They are not released to the Provider until the Customer confirms satisfactory delivery, nor can they be withdrawn by the Customer without cause.
2.  **Mandatory Identity Verification (KYC):** All Service Providers undergo strict identity verification to prevent anonymous fraud and ensure accountability.
3.  **Evidence-Based Arbitration:** In the event of a dispute, a neutral Arbitrator reviews a complete audit trail—including chat logs, shared media, and contract terms—to issue a binding verdict.

---

## 🎭 Identified Actors & Roles

| Actor | Role Description |
| :--- | :--- |
| **👤 Customer** | The primary end-user who searches for services, initiates bookings, and deposits funds into escrow. |
| **👷 Service Provider** | The skilled professional who lists services, undergoes KYC verification, and executes the work. |
| **⚖️ Arbitrator** | A neutral third-party official with access to sensitive dispute dashboards to review evidence and issue rulings. |
| **🏦 Banking Server** | An external financial system responsible for processing secure transactions, holding escrow funds, and executing refund/release triggers. |

---

## 🛠️ Functional Capabilities

### 👤 For Customers
* **Service Discovery:** Advanced filtering by category, price, and verified ratings.
* **Secure Booking:** Initiate requests with real-time slot locking.
* **Escrow Deposit:** Securely transfer funds to the holding vault.
* **Evidence Logging:** In-app chat and media sharing are automatically archived for dispute protection.
* **Dispute Escalation:** One-click escalation to the Arbitration Council if service standards are not met.

### 👷 For Service Providers
* **Listing Management:** Dynamic control over service offerings and pricing.
* **Credential Verification:** Secure upload portal for government ID and certifications.
* **Payment Assurance:** Guarantee of funds availability before work begins (via Escrow status).

### ⚖️ For Arbitrators
* **Case Dashboard:** Centralized view of all active disputes and their urgency levels.
* **Evidence Audit:** Read-only access to the specific transaction's chat logs, photos, and contracts.
* **Binding Verdicts:** Ability to trigger immediate fund release or refunds based on the investigation.

### 🏦 For Banking Server (External System)
* **Transaction Processing:** Securely handles real-time debit and credit operations via API.
* **Escrow Management:** Maintains funds in a "Locked/Holding" state until an explicit release signal is received.
* **Refund Execution:** Processes partial or full refunds instantly upon receiving a verdict trigger from the Arbitrator.

## 🧪 Evaluation readiness

This build provides a repeatable local walkthrough, deterministic seed data, an automated preflight check, and a dedicated guide detailing how requests move through the system. Start with [the evaluation demo runbook](docs/evaluation-demo-runbook.md), and use [the middleware/request-pipeline guide](docs/middleware-request-pipeline.md) when presenting the backend safeguards and request handling.

From the repository root, run `node scripts/demo-preflight.mjs` to validate the runtime environment, dependencies, pinned offline assets, backend availability, Swagger access, frontend serving, seeded authentication, and an authorized read operation. The full end-to-end regression suites can be run via `cd back-end && npm run test:e2e` for the backend and `cd front-end && npm run test:e2e` for the frontend. 

The evaluation build is intentionally scoped: it relies on an in-memory data store, simulated escrow/refund transitions, and evaluation-only `x-role`/`x-actor-id` identity headers. It should not be treated as a production implementation for JWT/session-based authentication, persistent storage, KYC verification, or real-world banking and payment integrations.

---

## 👥 Team: 15_RisingEmber

<table align="center">
  <tr>
    <td align="center" width="150px">
      👤<br/><b>Ashwin</b><br/>
    </td>
    <td align="center" width="150px">
      👤<br/><b>Ayush</b><br/>
    </td>
    <td align="center" width="150px">
      👤<br/><b>Durga</b><br/>
    </td>
    <td align="center" width="150px">
      👤<br/><b>Jayanth</b><br/>
    </td>
    <td align="center" width="150px">
      👤<br/><b>Kenneth</b><br/>
    </td>
  </tr>
</table>

---

*This project is being developed as part of the Software Engineering curriculum at IIIT Sri City.*
