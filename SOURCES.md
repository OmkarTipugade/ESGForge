# Raw Data Sources & Ingestion Analysis

This document details the real-world formats, specifications, processing techniques, and production vulnerabilities analyzed for each of the three core ingestion sources.

---

## 1. SAP Fuel & Procurement Data

### Real-World Format Researched
SAP Fuel data is typically extracted from tables like **MSEG** (Document Segment: Material), **MKPF** (Header: Material Document), or via transaction codes **ME2M** (Purchasing Documents by Material) or **MB52** (Warehouse Stock).

### What We Learned
1. **Technical Headers:** Real SAP exports use cryptic, 5-letter uppercase German abbreviations (e.g., `MATNR` for Material Number, `MENGE` for Quantity, `MEINS` for Unit of Measure, `WERKS` for Plant/Facility, `BUDAT` for Posting Date).
2. **Text and Code Separations:** SAP stores material short descriptions (`MAKTX`) separate from material numbers (`MATNR`). The description field is highly variable, containing entries like `"Dieselkraftstoff 10ppm"` or `"Heating Oil - Industrial Grade"`.
3. **Internal Units of Measure:** SAP uses its own unit codes (e.g., `TO` for metric ton, `L` or `LTR` for liter).
4. **Plant Scope:** Facility names do not exist in SAP transaction tables; instead, they are mapped using a 4-digit alphanumeric code (`WERKS`).

### Sample Row Format
```csv
BUKRS,WERKS,MATNR,MAKTX,MENGE,MEINS,BUDAT,LIFNR,WAERS,NETWR
1000,1001,M-01,"Diesel Fuel",12450.50,L,20260315,V-999,EUR,9875.00
```
* **Rationale:** This sample mimics a classic standard SAP SE16N table output with header abbreviations, utilizing internal uppercase date strings (`20260315`) and clear code mapping.

### What Would Break in a Real Deployment
* **Unrecognized Material Numbers:** If a company creates a new internal SAP material number (e.g., `M-9876` for biodiesel) without updating the platform's mapping lookup, the row will fail to match a known activity type.
* **Complex Locales:** If the SAP report is exported by a user with a customized user profile, the number format might output thousands separators with spaces (e.g., `12 450.50`), breaking conventional decimal parsers.

---

## 2. Utility Electricity Billing Data

### Real-World Format Researched
Utility data comes from electronic invoicing records or structured energy management systems (such as EnergyCAP, Schneider EcoStruxure, or direct utility billing portals like PG&E, Comcast, or National Grid).

### What We Learned
1. **Billing Spans:** Unlike single-day point-in-time transactions, electricity usage spans a billing period. This requires capturing both a `start_date` and an `end_date` to calculate accurate daily averages.
2. **Estimation Flags:** Invoices often mark whether a reading was actual or estimated (`read_type` = `ESTIMATED`). Estimated reads are common when meters are inaccessible but must be flagged for carbon audits because they represent calculated guesses.
3. **Diverse Units:** Larger sites report usage in Megawatt-hours (`MWh`) or Gigawatt-hours (`GWh`), whereas smaller commercial properties use Kilowatt-hours (`kWh`).
4. **Sub-metering:** Single invoices can have multiple meters/meter IDs listed as distinct rows, which must be aggregated or mapped to individual facilities.

### Sample Row Format
```csv
utility_provider,invoice_number,meter_id,facility_code,billing_start,billing_end,consumption,unit,read_type
"Exelon Power","INV-90210","MTR-887766","1001",2026-03-01,2026-03-31,45200.0,kWh,ACTUAL
```
* **Rationale:** Represents standard invoice tracking from a billing management export, using full ISO dates and an explicit estimation flag (`ACTUAL`/`ESTIMATED`).

### What Would Break in a Real Deployment
* **Overlapping Billing Periods:** Invoices uploaded multiple times or spanning overlapping dates (e.g. Jan 1 to Feb 5, and Jan 15 to Feb 15) can double-count emissions. Preventing this requires implementing temporal validation checks.
* **Combined Utility Bills:** Many municipal utility invoices combine electricity, water, and gas on a single sheet, using different unit columns. This can cause consumption parsing errors if the columns are not isolated.

---

## 3. Corporate Travel Data (Concur / Navan)

### Real-World Format Researched
Travel data is typically exported as a **Concur Standard Accounting Extract (SAE)** or standard corporate expense logs from Navan.

### What We Learned
1. **Multi-Category Rows:** A single expense report contains mixed categories: flights, hotels, taxi rides, and meals. Only carbon-relevant rows must be parsed, while others (like client entertainment or meals) should be safely filtered out.
2. **Missing Distance Metrics:** Flight segments list origin/destination airports (`SFO` -> `LHR`) instead of miles or kilometers.
3. **Cabin Class Variations:** Flights have a cabin class (first class, business class, premium economy, economy). The physical space an passenger occupies directly affects their share of the aircraft's fuel consumption, meaning a first-class ticket has an emission factor up to 4 times higher than economy.
4. **Duration vs Point Actions:** Hotels use nights/room-nights for volume, whereas flights represent single point-in-time journeys.

### Sample Row Format
```csv
report_id,employee_name,expense_type,transaction_date,origin,destination,cabin_class,distance_km,nights,amount
"EXP-88","John Doe","Flight","2026-03-10","JFK","LHR","Business",,,"1250.00"
"EXP-88","John Doe","Hotel","2026-03-12",,,"Standard",,3,"650.00"
```
* **Rationale:** Mimics a Concur SAE flat file export containing mixed row types, missing distances (to test IATA/Haversine calculations), and explicit cabin classes.

### What Would Break in a Real Deployment
* **Multi-Segment Flight Routing:** If an employee books a multi-city flight (e.g., `JFK` -> `ORD` -> `LAX`), the Concur export may represent this as one row with `JFK` and `LAX` as the origin and destination, leading to an under-estimation of actual distance due to the layover.
* **Corporate Flight Chartering:** Executive teams chartering private aircraft cannot be mapped to standard commercial cabin class emission factors. This requires manual audit flagging.
