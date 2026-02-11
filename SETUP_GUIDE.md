# ClickPay Setup Guide

## Step-by-Step Setup Instructions

### 1. Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js version 18 or higher installed
- ✅ npm or yarn package manager
- ✅ A Supabase account
- ✅ Your database schema already applied in Supabase

Check Node.js version:
```bash
node --version
# Should show v18.0.0 or higher
```

### 2. Database Setup in Supabase

1. **Go to Supabase Dashboard:**
   - Visit https://supabase.com
   - Log in to your account
   - Select your project (pnzkaglrsovrbkmmhbnn)

2. **Verify Tables:**
   - Click on "Table Editor" in the left sidebar
   - You should see all 17 tables from your schema:
     - users
     - wallets
     - transactions
     - transaction_events
     - compliance_checks
     - agent_fees
     - external_topups
     - billers
     - bill_payments
     - qr_codes
     - money_requests
     - fixed_savings_accounts
     - loan_applications
     - loans
     - subscriptions
     - merchant_profiles
     - notifications

3. **Add Sample Data:**
   - Go to SQL Editor
   - Run this query to add sample billers:

```sql
-- Add sample billers for bill payments
INSERT INTO billers (name, category, status) VALUES
('DESCO', 'electricity', 'active'),
('DPDC', 'electricity', 'active'),
('Dhaka WASA', 'water', 'active'),
('Chittagong WASA', 'water', 'active'),
('Grameenphone', 'mobile', 'active'),
('Robi', 'mobile', 'active'),
('Banglalink', 'mobile', 'active'),
('Link3', 'internet', 'active'),
('Carnival Internet', 'internet', 'active');

-- Create a test user (optional)
INSERT INTO users (name, phone, nid, epin_hash, role, status) VALUES
('Test User', '01700000000', '1234567890', '1234', 'user', 'active');

-- Create wallet for test user
INSERT INTO wallets (user_id, wallet_type, balance, status)
SELECT user_id, 'user', 5000.00, 'active'
FROM users WHERE phone = '01700000000';
```

### 3. Project Installation

1. **Navigate to project directory:**
```bash
cd clickpay-frontend
```

2. **Install all dependencies:**
```bash
npm install
```

This will install:
- Next.js 14
- React 18
- Tailwind CSS
- Supabase Client
- Recharts (for analytics)
- QRCode libraries
- Date utilities
- Lucide icons

3. **Wait for installation to complete:**
   - This may take 2-5 minutes
   - You should see a success message when done

### 4. Environment Configuration

The `.env.local` file is already configured with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pnzkaglrsovrbkmmhbnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Verify the file exists:**
```bash
ls -la .env.local
```

If it doesn't exist, create it with the above content.

### 5. Run the Application

1. **Start development server:**
```bash
npm run dev
```

2. **You should see:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Ready in 2.3s
```

3. **Open your browser:**
   - Navigate to `http://localhost:3000`
   - You should see the login page

### 6. Test the Application

#### Register a New Account:

1. Click "Register" on the login page
2. Fill in the form:
   - **Name:** Your Name
   - **Phone:** 01712345678 (any valid format)
   - **NID:** 1234567890123 (any number)
   - **ePin:** 1234 (at least 4 digits)
   - **Confirm ePin:** 1234

3. Click "Create Account"
4. You should be redirected to the dashboard

#### Test Login:

1. Use the test user credentials:
   - **Phone:** 01700000000
   - **ePin:** 1234

2. Click "Sign In"
3. You should see the dashboard with balance: ৳5,000.00

#### Test Send Money:

1. First, create two test users (User A and User B)
2. Log in as User A
3. Click "Send Money"
4. Enter:
   - **Recipient Phone:** User B's phone
   - **Amount:** 100
   - **Reference:** Test transfer

5. Click "Send Money"
6. You should see success message
7. Balance should update automatically

#### Test Bill Payment:

1. Click "Pay Bills"
2. Select a biller (e.g., DESCO)
3. Enter:
   - **Account Number:** 123456
   - **Amount:** 500

4. Click "Pay Bill"
5. Payment should complete successfully

#### Test QR Code:

1. Click "QR Pay"
2. Click "Create QR"
3. Select:
   - **Type:** Static
   - **Amount:** 50 (optional)
   - **Note:** Test QR

4. Click "Create QR Code"
5. QR code image should be generated

### 7. Troubleshooting

#### Issue: "Module not found" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Issue: "Cannot connect to database"
**Solution:**
1. Check your internet connection
2. Verify Supabase project is active
3. Check `.env.local` has correct credentials
4. Go to Supabase Dashboard > Settings > API to verify URL and key

#### Issue: "User not found" on login
**Solution:**
1. Make sure you've created a user account via registration
2. Or insert test user using the SQL query above
3. Verify user exists in Supabase Table Editor

#### Issue: Port 3000 already in use
**Solution:**
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or run on a different port
npm run dev -- -p 3001
```

#### Issue: "Balance not updating"
**Solution:**
1. Check browser console for errors (F12)
2. Verify wallet was created for the user
3. Check Supabase Table Editor > wallets table

### 8. Next Steps

After basic setup works:

1. **Explore all features:**
   - Dashboard overview
   - Send money
   - QR payments
   - Bill payments
   - Transaction history
   - Profile settings

2. **Customize the app:**
   - Change colors in `tailwind.config.js`
   - Add your logo
   - Modify page layouts

3. **Add more features:**
   - Complete the placeholder pages
   - Add analytics charts
   - Implement notifications
   - Add merchant features

4. **Prepare for production:**
   - Implement proper password hashing
   - Add JWT authentication
   - Set up Row Level Security in Supabase
   - Add error tracking (e.g., Sentry)
   - Implement logging

### 9. Development Workflow

**Making changes:**
1. Edit files in your code editor
2. Save the file
3. Next.js will auto-reload the browser
4. Check for errors in terminal or browser console

**Adding new pages:**
1. Create a new folder in `app/dashboard/`
2. Add a `page.tsx` file
3. Follow the pattern from existing pages

**Testing:**
```bash
# Build for production (checks for errors)
npm run build

# Run production build
npm start
```

### 10. Common Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for linting errors
npm run lint

# Update dependencies
npm update
```

### 11. File Structure Overview

```
clickpay-frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # Reusable React components
├── lib/                   # Utility functions & helpers
│   ├── supabase.ts       # Database client
│   ├── auth.ts           # Authentication
│   └── database.ts       # Database queries
├── public/               # Static files
├── .env.local            # Environment variables
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

### 12. Getting Help

If you encounter issues:

1. **Check the console:**
   - Browser console (F12 > Console tab)
   - Terminal where npm run dev is running

2. **Check Supabase logs:**
   - Supabase Dashboard > Logs

3. **Common fixes:**
   - Restart the development server
   - Clear browser cache
   - Delete node_modules and reinstall
   - Check database schema is correct

4. **Resources:**
   - Next.js Docs: https://nextjs.org/docs
   - Supabase Docs: https://supabase.com/docs
   - Tailwind Docs: https://tailwindcss.com/docs

### 13. Production Deployment

When ready to deploy:

1. **Vercel (Recommended):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

2. **Other platforms:**
   - Netlify
   - Railway
   - Render
   - AWS
   - DigitalOcean

**Important:** Set environment variables in your deployment platform!

---

## Quick Start Summary

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Open browser
# http://localhost:3000

# 4. Register or login
# Use phone + ePin authentication

# 5. Start building!
```

---

**Need help? Check the README.md for more detailed information!**
