# Architectural Tradeoffs

This document details the three significant capabilities we deliberately chose not to build during this development phase, along with the detailed technical rationale, pros, cons, and future triggers for each.

---

## 1. Schema-per-Tenant Multi-Tenancy (Isolated Databases/Schemas)

We chose a **Shared-Database, Shared-Schema logical row-level isolation** model (using `company` foreign keys) rather than a physical isolation model (such as a database-per-tenant or schema-per-tenant architecture).

### Why we did not build it
A physical schema-per-tenant model (e.g. using PostgreSQL schemas or individual database instances) provides absolute isolation at the database layer. However, for a SaaS platform scaling from 0 to dozens of clients, it introduces significant operational complexity:
* **Migration Overhead:** Running database migrations across dozens of isolated schemas is slow and error-prone. A single migration failure can leave the platform in a split-brain state.
* **Resource Cost:** Maintaining a database instance per client results in highly underutilized resources, leading to higher cloud infrastructure costs during early-stage scaling.
* **Global Aggregations:** Running analytics or benchmarking across all companies (e.g., to compute average industry intensity factors) is highly complex, requiring slow federated queries or complex ETL systems.

### Tradeoff Assessment
* **Pros of our current logical model:**
  * Extremely fast database migrations.
  * Simple, unified reporting and analytics.
  * Cost-effective resource utilization.
* **Cons / Risks:**
  * Buggy code at the controller layer could theoretically lead to data leakage if a developer omits the `company` filter in a custom query.
* **Future Trigger to Migrate:** We will migrate to a schema-per-tenant architecture if we sign enterprise-tier clients (such as financial institutions or government agencies) whose security guidelines legally mandate physical data isolation at rest, or if database scaling bottlenecks emerge due to a high volume of transaction rows.

---

## 2. Dynamic External API Integrations (Grid Emissions & Airport Lookups)

We chose to implement **pre-loaded static lookups** for both IATA airport coordinates and greenhouse gas emission factors, rather than integrating with live third-party REST APIs (such as Climatiq, OpenFlights, or the EPA/DEFRA public APIs).

### Why we did not build it
Calling external HTTP endpoints during the ingestion pipeline introduces serious reliability risks and performance issues:
* **Network Failures and Latency:** An ingestion job processing a 50,000-row travel expense CSV would require 50,000 HTTP requests to compute airport distances or factors, bottlenecking Celery worker execution and risking failures due to API rate-limiting or network timeouts.
* **Reproducibility & Audit Trails:** External API factors can change dynamically. If an auditor re-runs a calculation months later, they must get the exact same result. Relying on live APIs makes version-controlling factors extremely difficult.
* **Cost:** Enterprise carbon calculation APIs charge per request, which scales poorly for high-volume uploads.

### Tradeoff Assessment
* **Pros of our static lookup model:**
  * Sub-millisecond calculation speeds.
  * 100% offline predictability and deterministic reproducibility for financial audits.
  * Zero external runtime API costs.
* **Cons / Risks:**
  * Flight distance calculation is restricted to the top 100 global airports (any outside this set must be manually entered or flagged).
  * Emission factors do not update dynamically as new annual regulatory lists are published.
* **Future Trigger to Migrate:** We will build a cached sync service that pulls factors once a year from standard registries and caches them inside a local, version-controlled database table, preserving deterministic reproducibility while expanding the lookup coverage.

---

## 3. Active Automated Data Correction / Cleansing Engine

We chose to implement a **passive validation and manual analyst review workflow** (using the `FLAGGED` status and reason tags) instead of a system that automatically reconciles, corrects, or cleanses faulty data on ingestion.

### Why we did not build it
It is highly tempting to write code that automatically fixes common errors, such as automatically shifting a future date to the current date or modifying units that seem slightly off. However, in the context of carbon accounting and auditing:
* **Audit Trail Contamination:** Auditors must see the raw data exactly as it was exported from the source system. If the ingestion system silently modifies quantities or guesses units, it invalidates the audit trail.
* **Liability for Misreporting:** Automatic changes can introduce hidden errors. If the system "corrects" a unit of measure and under-reports emissions, the client faces regulatory penalties.
* **Preserving Context:** A suspicious quantity is often a symptom of an upstream system error (e.g. an incorrect multiplier in an SAP transaction). It is critical that an analyst traces the error to its source, rather than having the platform patch it.

### Tradeoff Assessment
* **Pros of our passive review model:**
  * 100% audit integrity; raw user data is never modified by system code.
  * Empowers analysts to review flags and enter clear explanations in the `review_notes` field.
  * Simple, predictable validation code.
* **Cons / Risks:**
  * Requires human manual labor to approve or reject records when the system flags a row.
* **Future Trigger to Migrate:** We will introduce an AI-assisted "Suggestions" panel in the Record Details view, presenting the analyst with proposed corrections (e.g., "This quantity looks like a duplicate. Click here to merge"), keeping the analyst in the loop rather than automating the action.
