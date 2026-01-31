# Team 15_RisingEmber
## Problem: Service Quality, Rating & Dispute Management System

**Domain:** Service Quality & Dispute Management

---

## 📌 Problem Statement
Service marketplaces currently lack a transparent, evidence-based mechanism to handle conflicts, resulting in financial loss and mistrust between Customers and Service Providers when service standards are not met.

## 📖 Description
The **Service Quality & Dispute Management System** is a secure intermediary platform designed to bridge the trust gap between Customers and Service Providers. By integrating an arbitration layer directly into the booking workflow, we ensure that payments are protected and disputes are resolved fairly using non-repudiable evidence.

Unlike standard booking applications, our system acts as a neutral guardian of the transaction through three key mechanisms:
1.  **Escrow Payments:** Funds are secured in a holding vault upon booking and are only released when the service is successfully delivered.
2.  **Identity Verification:** All service providers undergo mandatory ID verification to ensure accountability.
3.  **Arbitration Layer:** In the event of a disagreement, a neutral third-party Arbitrator reviews non-repudiable evidence (chat logs, photos, and contracts) to issue a binding ruling, ensuring a fair outcome for both parties.

---

## 🎭 Identified Actors
Based on our system architecture, the following actors interact with the platform:

1.  **Customer:** The primary user who searches for services, makes bookings, and pays for them.
2.  **Service Provider:** The professional who lists their services, performs the work, and receives payment upon successful completion.
3.  **Arbitrator:** A neutral third-party responsible for reviewing evidence and resolving disputes between the Customer and Provider.
4.  **Banking Server (External):** An external financial system that handles the actual processing of refunds and secure transactions.

---

## 🛠️ Planned Features (Per Actor)

### 👤 Customer
* **Search & Filter Services:** Browse available services based on category, price, and rating.
* **Book Service:** Initiate a booking request and secure the time slot.
* **Make Payment:** Deposit funds into the secure escrow system.
* **Access Chat Window:** Communicate with the provider for job details (logged for evidence).
* **Provide Feedback:** Rate and review the provider after job completion.
* **Report & Escalate Issue:** Raise a formal dispute and submit evidence (photos/chats) if the service is unsatisfactory.

### 👷 Service Provider
* **Manage Service Listings:** Create, update, or delete service offerings and prices.
* **ID Verification:** Upload credentials to prove identity and build trust (KYC).
* **Access Chat Window:** Communicate with the customer regarding booking details.

### ⚖️ Arbitrator
* **Evidence Verification:** Review the chat logs, photos, and documents submitted by both parties.
* **Give Ruling (Verdict):** Issue a binding decision on the dispute.
    * *Triggers:* **Notification of Ruling** sent to all parties.
    * *Triggers:* **Sanctions & Warnings** for the party at fault.
    * *Triggers:* **Process Refunds** or release of funds based on the verdict.

### 🏦 Banking Server (External System)
* **Process Refunds:** Execute the financial transaction to return money to the Customer or transfer it to the Provider based on the Arbitrator's ruling.

---

## 👥 Collaborators

<table>
  <tr>
    <td align="center" width="200px">
      👤 <br/>
      <b>Ashwin</b>
    </td>
    <td align="center" width="200px">
      👤 <br/>
      <b>Ayush</b>
    </td>
    <td align="center" width="200px">
      👤 <br/>
      <b>Durga</b>
    </td>
    <td align="center" width="200px">
      👤 <br/>
      <b>Jayanth</b>
    </td>
    <td align="center" width="200px">
      👤 <br/>
      <b>Kenneth</b>
    </td>
  </tr>
</table>