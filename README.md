# 🍵 Spylt Business OS

A comprehensive, production-ready **Tea Business Operating System** tailored for Spylt.com. Evolving from a traditional e-commerce prototype, this platform digitizes and automates the entire order lifecycle, business communication, invoicing, inventory management, customer relationships, analytics, and daily operations.

## 🚀 Architecture Overview

This project is built around **Business Operations**, utilizing a state-machine driven order engine instead of relying on legacy payment gateways.

- **Frontend:** React, TypeScript, Tailwind CSS, GSAP (Unchanged UI experience).
- **Backend:** Node.js, Express, TypeScript.
- **Primary Database:** PostgreSQL via Prisma ORM (The sole source of truth).
- **Reporting Mirror:** Google Sheets (Synchronized asynchronously via API).
- **Communication Engine:** Automated Nodemailer (Invoices) and simulated WhatsApp triggers.
- **Invoicing:** Dynamic PDF generation (Customer and Internal variants).
- **Payment Method:** UPI Deep Linking & QR Generation (Zero Gateway Dependency).

## ✨ Core Features

1.  **State Machine Order Flow:** Orders traverse through controlled states (e.g., `SUBMITTED`, `PREPARING`, `DELIVERED`, `COMPLETED`).
2.  **Dual Invoice System:** Customers receive a clean, UPI-enabled tax invoice. Staff receive an internal invoice detailing calculated cost margins and business types (B2B/B2C).
3.  **Communication Engine:** Asynchronous messaging to notify clients via Email (w/ PDF) and WhatsApp. Includes a 5-minute background retry job for failed dispatches.
4.  **Admin Command Center:** JWT-protected dashboard featuring Revenue Analytics, Inventory Management (+10 stock adjustments), Order State modifications, and Low Stock Alerts.
5.  **Observability & Security:** Helmet headers, express-rate-limiting, structured JSON logging with UUID Request IDs, and a robust `/api/health` diagnostics endpoint.

## ⚙️ Environment Variables

Create a `.env` file in the `/server` directory:

# PostgreSQL Database URL
DATABASE_URL="postgresql://user:password@localhost:5432/spylt"

# Authentication
JWT_SECRET="super_secret_jwt_key_here"

# Business Details
BUSINESS_NAME="SPYLT Beverages"
BUSINESS_GSTIN="27XXXXX1234X1XZ"
BUSINESS_ADDRESS="123 Main Street, Mumbai"
BUSINESS_UPI_ID="spylt@upi"

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT=587
SMTP_USER="your-email@spylt.com"
SMTP_PASS="your-password"
SMTP_FROM="orders@spylt.com"

# Google Sheets Reporting (Optional)
GOOGLE_SHEETS_SPREADSHEET_ID="your-sheet-id"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"

## 🛠️ Setup & Run Locally

### 1. Database Initialization
Ensure PostgreSQL is running.
npm i && npx prisma generate && npx prisma db push

### 2. Start the Backend
Execute the index.ts directly.

### 3. Start the Frontend
Execute the vite script.

## 📦 Deployment Guide

1.  **Database:** Deploy PostgreSQL on a managed service (e.g., AWS RDS, Supabase, Vercel Postgres).
2.  **Backend:** Deploy the Node.js Express app to Render, Heroku, or an EC2 instance. Ensure the `DATABASE_URL` and all `.env` secrets are securely stored.
3.  **Frontend:** Deploy the Vite React app to Vercel or Netlify. Set `VITE_API_URL` to point to the production backend URL.
4.  **Backups:** The application includes a daily cron job script (`server/src/utils/backup.ts`) ready to be hooked into `pg_dump` to AWS S3.

## 📈 Future Expansions
- Multi-branch inventory tracking.
- Customer loyalty programs (CRM).
- Direct delivery partner API integrations.

---
*Developed as a high-grade production migration.*
