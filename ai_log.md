# AI Development Log

## Purpose

This file documents the AI-assisted development process used while building the PharmaStock pharmacy inventory system.

The AI was used for:
- Understanding the requirements
- Designing the backend architecture
- Implementing FEFO dispensing logic
- Designing API endpoints
- Building the React dashboard
- Debugging errors
- Testing edge cases
- Preparing project documentation

---

# Development Summary

## 1. Requirement Analysis

The pharmacy problem was analyzed around four core requirements:

1. Store medicine batches with expiry dates and quantities.
2. Calculate only in-date/sellable stock.
3. Dispense medicines using FEFO (First Expiry, First Out).
4. Provide medicine search and expiry alerts.

The solution was designed as a full-stack web application.

---

## 2. Technology Selection

The following stack was selected:

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

### Development
- GitHub Codespaces
- GitHub

---

## 3. Backend Development

A MongoDB/Mongoose Batch model was created with:

- medicineName
- batchNumber
- expiryDate
- quantity
- timestamps

An index was added for:

`medicineName + expiryDate`

The backend was organized into:

```text
server/
├── controllers/
│   └── batchController.js
├── models/
│   └── Batch.js
├── routes/
│   └── batchRoutes.js
└── server.js