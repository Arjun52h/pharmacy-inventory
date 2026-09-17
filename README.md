# PharmaStock

PharmaStock is a full-stack pharmacy inventory management system designed to manage medicine batches, track expiry dates, calculate sellable stock, and dispense medicines using FEFO (First Expiry, First Out).

## Problem

A pharmacy may have the same medicine stored in multiple batches with different expiry dates.

The system must ensure that:

- Expired medicines are never dispensed.
- The earliest-expiring valid batch is used first.
- Sellable stock counts exclude expired or empty batches.
- Pharmacists can quickly search for medicines.
- Medicines approaching expiry can be identified through alerts.

## Solution

PharmaStock provides a dashboard and REST API for managing pharmacy inventory.

The core dispensing flow is:

```text
Medicine Request
      ↓
Find matching batches
      ↓
Remove expired / empty batches
      ↓
Sort by expiry date
      ↓
Check total sellable stock
      ↓
Dispense earliest-expiring batch first
      ↓
Continue until requested quantity is fulfilled