# Key Engineering & Product Decisions

This document captures the ambiguities resolved, parsing heuristics implemented, specific scope boundaries chosen, and product questions remaining for the ESG emission ingestion platform.

---

## 1. Ambiguities Resolved & Parsing Heuristics

### A. Number Formats and Locale Identification
* **Ambiguity:** SAP exports from international corporations contain numeric representations formatted using different locales. For example, a German locale uses periods as thousand separators and a comma as a decimal separator (`1.234,56`), whereas US locales use the opposite (`1,234.56`).
* **Resolution:** Implemented an active, heuristic-based locale parser (`parse_german_decimal`).
  * If a numeric string contains both a period and a comma, the last separator is treated as the decimal separator.
  * If a string contains only a comma, it checks the number of digits after the comma. If it is exactly 2 or fewer, it is treated as a decimal separator (e.g., `3,5` -> `3.5`); otherwise, it is stripped as a thousands separator (e.g., `1,000` -> `1000.0`).
* **Alternative Considered:** Requiring all files to be uploaded in standard English locale. Rejected because corporate managers cannot easily change standard exports from system transaction codes like ME2M or MB52.

### B. Missing Dates or Units
* **Ambiguity:** What happens when an uploaded row lacks an explicit unit (e.g., SAP fuel log misses `MEINS`) or billing period?
* **Resolution:**
  * **SAP Fuel:** Defaulted unit to liters (`L`) for liquid material descriptions if missing, as SAP procurement often omits unit fields for standard stock transfers of liquids.
  * **Utility Electricity:** If no explicit unit column is found, the parser inspects the usage column header name itself (e.g., `total_kwh` -> `kWh`, `mwh_usage` -> `MWh`). If no indicator is present, it defaults to grid electricity's standard unit (`kWh`).
  * **Billing Period:** If the utility data provides only a billing end date, that date is copied to the start date field. If no valid date can be extracted at all, the row is rejected and logged as a row-level parse error.

### C. Missing Flight Distances in Travel Data
* **Ambiguity:** Concur or Navan travel accounting reports list origin and destination airport codes (e.g., `SFO` to `JFK`) but frequently leave flight distance fields empty.
* **Resolution:** Integrated a spatial lookup database containing IATA coordinates for the top 100 global airports. When distance is missing in travel records, the platform extracts IATA codes and calculates the distance using the **Haversine formula**:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
  Calculated distances are stored as raw values alongside the computed flag `distance_computed` for visibility. If airport codes are unrecognized or missing, the row is flagged and held for manual entry.

### D. Material and Expense-Type Mapping Heuristics
* **Ambiguity:** Material descriptions from SAP (`MAKTX`) and Travel Expense Categories in Concur are natural language strings entered by vendors or employees.
* **Resolution:** Implemented localized prefix and substring matching lookups:
  * **SAP Materials:** Maps terms like `"dieselkraftstoff"`, `"hsd"`, `"heizöl"` and `"petrol"` to standard activity categories (`diesel_combustion`, `gasoline_combustion`, etc.).
  * **Travel Categories:** Maps inputs like `"uber"`, `"taxi"`, `"lyft"`, `"rail"`, and `"accommodation"` to distinct activity types with individual emission factors (e.g. `hotel_stay`, `taxi`, `rail`).

---

## 2. Scope Boundaries (Included vs. Ignored)

To build a high-performance ingestion engine, we drew clear boundaries on what details are processed and what is discarded.

### A. SAP Fuel & Procurement
* **Handled:** Quantity (`MENGE`), unit of measure (`MEINS`), posting date (`BUDAT`), material text (`MAKTX`), and plant ID (`WERKS`).
* **Ignored:** Net financial value (`NETWR`), transaction currency (`WAERS`), supplier accounts (`LIFNR`), and purchase order document numbers (`EBELN`). Carbon auditing only cares about physical volumes consumed, not purchasing negotiations or price fluctuations.

### B. Utility Electricity
* **Handled:** Electric consumption/usage, unit, billing start date, billing end date, utility name, and facility plant identifier.
* **Ignored:** Aggregate financial costs (utility rates, line fees, service charges), meter peak vs off-peak cost breakdowns, and taxes. Financial costs are highly volatile and do not map to physical carbon intensity.

### C. Corporate Travel
* **Handled:** Transaction dates, expense descriptions, flight distances (or airport codes), cabin classes (economy, premium economy, business, first), and hotel room nights.
* **Ignored:** Employee IDs, specific hotel names, personal vehicle mileage reimbursement rates, transaction currency, and ticket booking reference numbers.

---

## 3. Product & Design Questions for the PM

If we could align with the Product Manager, these are the critical architectural questions we would ask:

1. **How should we handle non-combustion SAP materials?**
   * *Context:* SAP exports of fuel often contain secondary items (lubricants, engine parts). Currently, our parser throws a validation error for unrelated material lines. Should we build an interactive UI mapping page that lets users explicitly ignore or tag custom SAP material IDs?
2. **What is the source-of-truth for emission factors?**
   * *Context:* Currently, emission factors are hardcoded globally. In reality, electricity emissions (Scope 2) depend heavily on the regional grid mix (e.g., US eGRID subregions, UK fuel mix). Do you want grid factors to automatically update based on the physical address associated with a `Facility`?
3. **What is the target SLA for ingestion processing?**
   * *Context:* Currently, files are processed asynchronously using Celery. For large multi-national companies uploading 500,000-row annual SAP dumps, this can block resources. Do we need to chunk massive CSV uploads into parallel worker processes?
4. **How should timezone boundaries be handled across entities?**
   * *Context:* An SAP transaction logged in German local time (CET) might occur on a different date than when it is ingested in the US. Currently, dates are parsed as naive local dates. Should we enforce UTC timestamps across all source dates?
