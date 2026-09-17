# API Contract

## Base URL

/api/batches

---

## 1. Create Medicine Batch

### POST /api/batches

Creates a new medicine batch.

### Request Body

{
  "medicineName": "Paracetamol",
  "batchNumber": "PAR001",
  "expiryDate": "2026-09-25",
  "quantity": 50
}

### Success Response

Status: 201 Created

{
  "success": true,
  "message": "Batch added successfully",
  "data": {}
}

### Validation

- All fields are required.
- Quantity must be greater than 0.
- Batch number must be unique.

---

## 2. Get All Batches

### GET /api/batches

Returns all medicine batches sorted by expiry date.

### Search

GET /api/batches?search=paracetamol

Medicine-name search is case-insensitive.

---

## 3. Get Medicine Batches

### GET /api/batches/medicine/:name

Returns all batches for a specific medicine and its sellable stock.

### Example

GET /api/batches/medicine/Paracetamol

### Response

{
  "success": true,
  "medicineName": "Paracetamol",
  "sellableStock": 30,
  "data": []
}

Sellable stock contains only non-expired medicine.

---

## 4. Get Expiring Batches

### GET /api/batches/expiring?days=30

Returns batches that:

- Have not expired.
- Have quantity greater than 0.
- Expire within the specified number of days.

Results are sorted by expiry date.

---

## 5. Get Stock Summary

### GET /api/batches/stock/summary

Returns medicine-level sellable stock.

### Response

{
  "success": true,
  "count": 1,
  "data": [
    {
      "medicineName": "Paracetamol",
      "sellableStock": 30,
      "batches": 2
    }
  ]
}

---

## 6. Dispense Medicine

### POST /api/batches/dispense

Dispenses medicine using FEFO (First Expiry, First Out).

### Request Body

{
  "medicineName": "Paracetamol",
  "quantity": 25
}

### FEFO Rules

1. Find matching medicine batches.
2. Exclude expired batches.
3. Exclude batches with zero quantity.
4. Sort batches by expiry date ascending.
5. Check total sellable stock.
6. Reject the request if stock is insufficient.
7. Dispense from the earliest-expiring batch first.

### Example

Available stock:

- PAR002 → 20 units → expires 20 Sep 2026
- PAR001 → 10 units → expires 25 Sep 2026

Request:

25 units

Dispensing:

- PAR002 → 20 units
- PAR001 → 5 units

### Success Response

{
  "success": true,
  "message": "Medicine dispensed successfully using FEFO",
  "medicineName": "Paracetamol",
  "requested": 25,
  "dispensed": 25,
  "dispensedFrom": [
    {
      "batchNumber": "PAR002",
      "quantity": 20
    },
    {
      "batchNumber": "PAR001",
      "quantity": 5
    }
  ]
}

### Insufficient Stock Response

Status: 400 Bad Request

{
  "success": false,
  "message": "Insufficient in-date stock",
  "requested": 25,
  "available": 10
}

If stock is insufficient, no batch quantity is modified.

---

## Core Business Rules

### Sellable Stock

A batch is sellable when:

expiryDate >= today
AND
quantity > 0

### FEFO

First Expiry, First Out.

The earliest-expiring valid batch is dispensed first.

### Expired Medicine

Expired medicine is never included in sellable stock or dispensing.