# Reasoning & Approach

## 1. Problem Understanding

The pharmacy needs to manage medicine stock stored in multiple batches.

The system must:

- Store medicine batches with expiry dates and quantities.
- Never dispense expired medicine.
- Dispense medicines using FEFO (First Expiry, First Out).
- Calculate sellable stock using only non-expired batches.
- Search medicine availability.
- Alert the pharmacist about medicines that are close to expiry.

The solution is designed to work for a general neighbourhood pharmacy.

---

## 2. Data Model

Each medicine batch contains:

- medicineName
- batchNumber
- expiryDate
- quantity
- createdAt
- updatedAt

MongoDB with Mongoose is used for persistent storage.

An index is created on:

`medicineName + expiryDate`

This supports medicine-based and expiry-based queries.

---

## 3. Sellable Stock Rule

A batch is considered sellable when:

1. Its expiry date is today or later.
2. Its quantity is greater than zero.

Expired batches are excluded from sellable stock calculations.

This rule is applied consistently when calculating medicine-level stock and when dispensing medicines.

---

## 4. FEFO Dispensing

FEFO means:

First Expiry, First Out.

When a pharmacist requests a quantity:

1. Find matching medicine batches.
2. Ignore expired batches.
3. Ignore batches with zero quantity.
4. Sort batches by expiry date in ascending order.
5. Calculate total available sellable stock.
6. If stock is insufficient, reject the request without modifying stock.
7. Otherwise, consume stock from the earliest-expiring batch first.
8. Continue to the next batch until the requested quantity is fulfilled.
9. Return the batches from which the medicine was dispensed.

Example:

| Batch | Expiry | Quantity |
|---|---|---:|
| PAR002 | 20 Sep 2026 | 20 |
| PAR001 | 25 Sep 2026 | 10 |

Request: 25 units.

Result:

- PAR002 → 20 units
- PAR001 → 5 units

---

## 5. Expired Medicine Protection

Expired batches are never included in the dispensing query.

The backend compares expiry dates against the current date and only considers batches that are still valid.

This prevents the frontend from bypassing the business rule.

---

## 6. Insufficient Stock Protection

Before changing any batch quantity, the backend calculates the total available sellable stock.

If:

`availableStock < requestedQuantity`

the request is rejected.

No batch is modified.

This prevents partial dispensing when the pharmacy does not have enough in-date stock.

---

## 7. Expiry Alerts

The expiry alert API accepts a configurable number of days.

For example:

`GET /api/batches/expiring?days=30`

It returns batches that:

- Have not expired.
- Have quantity greater than zero.
- Expire within the selected alert window.

Results are sorted by earliest expiry date.

---

## 8. Search

The inventory API supports medicine-name search.

Example:

`GET /api/batches?search=paracetamol`

Search is case-insensitive so that:

- Paracetamol
- paracetamol
- PARACETAMOL

can be matched.

---

## 9. API Design

The backend uses REST-style API endpoints.

Main operations:

- Create batch
- Get batches
- Search batches
- Get medicine batches
- Get sellable stock summary
- Get expiring batches
- Dispense medicine

The API returns JSON responses with a consistent `success` field and meaningful error messages.

---

## 10. Frontend Design

The frontend provides a pharmacy dashboard containing:

- Total sellable stock
- Medicine-level stock summary
- Inventory table
- Medicine search
- Expiry alerts
- Add Batch form
- Dispense Medicine form
- FEFO dispensing result

The frontend communicates with the backend through Axios.

---

## 11. Validation

The backend validates important inputs including:

- Required medicine name
- Required batch number
- Required expiry date
- Positive quantity
- Unique batch number
- Positive dispensing quantity

Backend validation is important because frontend validation alone cannot guarantee data integrity.

---

## 12. Testing Strategy

The following scenarios were tested:

### FEFO Test

Multiple batches of the same medicine were created with different expiry dates.

The earliest-expiring batch was consumed first.

### Expired Stock Test

An expired batch was added.

It was excluded from sellable stock and could not be dispensed.

### Insufficient Stock Test

A dispensing request greater than available sellable stock was submitted.

The request was rejected and stock remained unchanged.

### Sellable Stock Test

Expired quantities were excluded from the medicine stock summary.

### Expiry Alert Test

Batches approaching their expiry date appeared in the expiry alert section.

### Search Test

Medicine-name searches worked case-insensitively.

### Duplicate Batch Test

Creating a batch with an existing batch number was rejected.

---

## 13. Technology Choices

### Frontend

- React
- Vite
- Axios
- CSS

### Backend

- Node.js
- Express.js
- Mongoose

### Database

- MongoDB

### Development Environment

- GitHub Codespaces
- GitHub

---

## 14. Trade-offs

The implementation focuses on the core pharmacy requirements within the available development time.

For simplicity, dispensing currently performs sequential database updates after checking stock availability.

A production system could improve this further using:

- MongoDB transactions
- Authentication and authorization
- Audit logs
- Barcode scanning
- Supplier management
- Purchase records
- Low-stock alerts
- Sales reports
- Role-based access control

These features were intentionally kept outside the core assessment scope.

---

## 15. Key Design Principle

The most important business rule is:

> Only in-date stock can be sold, and the earliest-expiring in-date stock should be sold first.

The backend enforces this rule so that the pharmacy's inventory remains correct even if the frontend is bypassed.