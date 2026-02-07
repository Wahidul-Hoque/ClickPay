# ClickPay - DBMS Sessional Project

Mobile Financial Services (MFS) system built with Node.js and Supabase (PostgreSQL).

## Team Members
- Wahidul Hoque
- Abu Bakar Siddique

## Features
- User Management
- Wallet System
- Transactions
- Bill Payments
- Loans & Savings
- QR Codes
- And more...

## Database Schema
18 tables covering all MFS operations:
- users, wallets, transactions, payment_methods
- compliance_checks, agent_fees, bill_payments
- loans, savings, subscriptions, etc.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Wahidul-Hoque/ClickPay.git
cd ClickPay
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Supabase

1. Go to [Supabase](https://supabase.com)
2. Create a new project or use existing one
3. Run the SQL schema from `schema_postgresql` in SQL Editor
4. Copy your credentials from Project Settings → API

### 4. Setup Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

### 5. Run Demo
```bash
node demo.js
```

## Project Structure
```
clickpay_demo/
├── db.js              # Database connection
├── demo.js            # Demo script with sample data
├── schema.sql         # PostgreSQL schema
├── .env               # Environment variables (not in git)
├── .env.example       # Template for .env
├── .gitignore         # Git ignore file
├── package.json       # Dependencies
└── README.md          # This file
```

## SQL Queries

### Basic Queries
- SELECT, INSERT, UPDATE, DELETE operations
- JOINs across multiple tables
- Aggregations and GROUP BY

### Advanced Queries
- Complex JOINs with multiple tables
- Subqueries 
- Window functions
- Date/time operations

### PL/pgSQL (Stored Procedures & Functions)
- Transaction processing functions
- Triggers for balance updates
- Automated calculations

## Technologies Used
- **Node.js** - Runtime
- **Supabase** - PostgreSQL database (cloud)
- **pg** - PostgreSQL client
- **@supabase/supabase-js** - Supabase client library

## License
Educational project for DBMS Sessional Course