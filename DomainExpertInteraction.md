# **Summary of the interaction**

## **Basic information**

**Domain:** Digital Marketplace for services (non-retail) 

**Problem statement:** Service Quality, Rating & Dispute Management Platform

**Date of interaction:** 31/01/2026

**Mode of interaction:** Google Meet

**Duration (in-minutes):** 17 minutes

**Publicly accessible Video link:**   
https://drive.google.com/file/d/1Te1hKBfO00Z3u7OtbRXiaDo2yT7G1pho/view?usp=sharing

## **Domain Expert Details**

**Role/ designation:** Senior Vice President at a major international banking organization

**Experience in the domain (Brief description of responsibilities and years of experience in domain):**

25+ years of experience in Information Technology and Services, with extensive exposure to the banking and financial services domain. The expert has held both technical and managerial roles across large-scale application development, maintenance, and production support projects for global clients. Experience includes long-term engagements with multinational financial institutions, insurance organizations, and IT services companies, with strong involvement in program and project management, dispute-sensitive systems, and service quality driven platforms.

**Nature of work:** Managerial

## **Domain Context and Terminology**

- **How would you describe the overall purpose of this problem statement in your daily work?**  
  The problem statement aligns with ensuring consistent service quality, handling customer feedback, resolving disputes efficiently, and maintaining customer trust in a service-based digital ecosystem where money and service delivery are involved.

	

- **What are the primary goals or outcomes of this problem statement?**  
* Meet customer expectations defined by service-level agreements  
* Provide timely resolution of complaints and disputes  
* Maintain trust, security, and regulatory compliance  
* Prevent customer churn due to service failures  
* Ensure consistent and fair decision-making in disputes  
    
- **List key terms used by the domain expert and their meanings (Copy these to definition.yml)**

| Term | Meaning as explained by the expert |
| :---- | :---- |
| Ticketing System | Central system where all customer complaints, feedback, and disputes are logged and tracked |
| Interactive Voice Response (IVR) | Automated phone-based system that guides customers and routes them to support |
| Service-Level Expectation | Agreed response or resolution time promised to the customer |
| Escalation Matrix | Defined hierarchy for escalating complex or high-severity issues |
| Maker-Checker | A control mechanism where one role processes a request and another validates it |
| Process Owner | Subject matter expert responsible for decisions in a specific process |
| Transaction Logs | Backend records used to verify claims and validate evidence |

## 

## **Actors and Responsibilities**

- Identify the different roles involved and what they do in practice.

| Actor / Role | Responsibilities |
| :---- | :---- |
| Customer | Initiates service bookings, makes payments, provides ratings and feedback, and raises disputes when service expectations are not met |
| Service Provider | Delivers the requested service, updates service status, responds to customer feedback, and participates in dispute resolution when required |
| Banking Server | Handles payment processing, transaction validation, refunds, and maintains transaction records for verification |
| Arbitrator | Reviews disputes, evaluates submitted evidence, ensures fair decision-making, and issues final rulings including refunds or penalties |

## 

## **Core workflows**

Description of at least 2-3 real workflows as explained by the domain expert

### **WORKFLOW 1: SERVICE FEEDBACK AND COMPLAINT HANDLING**

* **Trigger / Start Condition:** Customer experiences dissatisfaction or service delay

* **Steps Involved:**  
  1. Customer contacts the system via online, offline, IVR, or in-person channel  
  2. Complaint or feedback is logged into the ticketing system  
  3. Level 1 support attempts resolution  
  4. If unresolved, issue is escalated to Level 2 or Level 3 support

* **Outcome / End Condition:** Complaint is resolved or escalated for dispute handling  
  


  ### **WORKFLOW 2: DISPUTE SUBMISSION AND EVIDENCE VERIFICATION**

* **Trigger / Start Condition:** Customer raises a formal dispute

* **Steps Involved:**  
  1. Customer submits dispute through an official channel (email/written request)  
  2. Supporting evidence is provided (screenshots, transaction details, documents)  
  3. Customer identity is verified  
  4. Backend transaction logs are cross-checked

* **Outcome / End Condition:** Dispute is validated and moved to decision-making  
  


  ### **WORKFLOW 3: DISPUTE RESOLUTION AND OUTCOME EXECUTION**

* **Trigger / Start Condition:** Evidence review is complete

* **Steps Involved:**  
  1. Process owner evaluates the case using SOPs  
  2. Maker–checker validation is applied  
  3. Severity and transaction value determine escalation level  
  4. Decision is finalized (refund, penalty, rejection)

* **Outcome / End Condition:** Customer is informed and resolution is executed

  ---

## **Rules, Constraints, and Exceptions**

Document rules that govern how the domain operates.

**Mandatory rules or policies:**

* All disputes must follow standard operating procedures  
* Identity verification is mandatory before processing  
* Maker-checker validation is required  
* Regulatory reporting for serious disputes

    
  **Constraints or limitations:**  
* Resolution time depends on complexity and transaction value  
  High-value disputes require multiple approvals  
* Security and compliance checks can slow resolution

  **Common exceptions or edge cases:**  
* High-value or high-impact disputes  
* Errors involving multiple parties  
* Cases that attract public or regulatory attention

  **Situations where things usually go wrong:**  
* Service delays beyond promised timelines  
* Data inaccuracies  
* Process complexity  
* Technical failures

## **Current challenges and pain points**

What parts of this process are most difficult or inefficient?  
Where do delays, errors, or misunderstandings usually occur?  
What information is hardest to track or manage today?

* Meeting rising customer expectations as technology evolves  
* Handling disputes quickly in high-stakes, money-related services  
* Preventing reputational damage from a single failure  
* Ensuring end-to-end security while maintaining speed  
* Scaling processes without losing consistency or trust

## **Assumptions & Clarifications**

- What assumptions made by the team that were confirmed  
- What assumptions that were corrected  
- Open questions that need follow-up

**Assumptions confirmed:**

* Disputes mostly arise due to unmet service expectations  
  Evidence and backend logs are central to fair decision-making  
  Escalation and SOPs are critical for consistency

**Assumptions corrected:**

* Dispute resolution is not always automated; human judgment plays a key role  
* Refunds are not always immediate or straightforward

**Open questions that need follow-up:**

* How ratings directly influence service providers  
* Time limits for dispute resolution in a non-banking services marketplace  
  Degree of automation feasible outside regulated financial systems