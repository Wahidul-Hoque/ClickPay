# ClickPay Frontend

Next.js 14 App Router frontend for the ClickPay digital wallet system.

## Features Implemented
✅ Landing Page with features showcase
✅ User Registration (with role selection)
✅ User Login (JWT authentication)
✅ Protected Dashboard with sidebar navigation
✅ Responsive design (mobile-first)
✅ Global state management (Zustand)
✅ Toast notifications
✅ API client with interceptors

## Features Pending (Structure Ready)
- 📋 Transaction Management
- 💰 Wallet Management
- 📱 QR Code Generation & Scanning
- 💵 Bill Payments
- 💳 Loan Management
- 🏦 Fixed Savings
- 🔄 Subscriptions
- ⚙️ Settings & Profile Management

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand with persistence
- **HTTP Client**: Axios
- **UI Components**: Custom components with Tailwind
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   └── register/
│   │   │       └── page.tsx          # Registration page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── page.tsx              # Dashboard overview
│   │   │   └── send/                 # Send money (placeholder)
│   │   ├── transactions/             # Transaction history (placeholder)
│   │   ├── wallet/                   # Wallet management (placeholder)
│   │   ├── qr/                       # QR code features (placeholder)
│   │   ├── bills/                    # Bill payments (placeholder)
│   │   ├── loans/                    # Loan management (placeholder)
│   │   ├── savings/                  # Savings accounts (placeholder)
│   │   ├── subscriptions/            # Subscriptions (placeholder)
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   ├── layout/                   # Layout components
│   │   └── forms/                    # Form components
│   ├── lib/
│   │   ├── api.ts                    # API client & methods
│   │   └── store.ts                  # Zustand store for auth
│   ├── hooks/                        # Custom React hooks
│   ├── types/                        # TypeScript type definitions
│   └── utils/                        # Utility functions
├── public/
│   ├── images/
│   └── icons/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.example
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=ClickPay
```

## Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Available Routes

### Public Routes
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/register` - Registration page

### Protected Routes (Require Authentication)
- `/dashboard` - Dashboard overview
- `/dashboard/send` - Send money (placeholder)
- `/transactions` - Transaction history (placeholder)
- `/wallet` - Wallet management (placeholder)
- `/qr` - QR code features (placeholder)
- `/bills` - Bill payments (placeholder)
- `/loans` - Loan management (placeholder)
- `/savings` - Savings accounts (placeholder)
- `/subscriptions` - Subscriptions (placeholder)
- `/settings` - User settings (placeholder)

## Features in Detail

### Authentication
- **Registration**: Users can register with name, phone, NID, 5-digit ePin, and role (user/agent/admin)
- **Login**: Users login with phone number and 5-digit ePin
- **JWT Token**: Token stored in localStorage and added to all API requests
- **Auto-redirect**: Unauthenticated users redirected to login
- **Persistent Sessions**: Auth state persisted using Zustand

### Dashboard
- **Sidebar Navigation**: Responsive sidebar with route navigation
- **User Info**: Display user name, phone, and role
- **Balance Display**: Show current wallet balance
- **Quick Actions**: Fast access to common features
- **Recent Transactions**: List of latest transactions (placeholder)
- **Statistics**: Monthly income, expenses, transaction count

### API Integration
- **Axios Client**: Configured with base URL and interceptors
- **Token Management**: Automatic token injection in headers
- **Error Handling**: Global error handling with toast notifications
- **401 Handling**: Auto-logout on token expiration

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Reusable button, input, card classes
- **Responsive Design**: Mobile-first approach with breakpoints
- **Color Scheme**: Primary (blue), Secondary (purple), Success, Warning, Error
- **Dark Mode**: Ready for implementation

## Component Examples

### Button Classes
```tsx
<button className="btn btn-primary">Primary Button</button>
<button className="btn btn-secondary">Secondary Button</button>
<button className="btn btn-outline">Outline Button</button>
```

### Input Field
```tsx
<input className="input" placeholder="Enter value" />
```

### Card
```tsx
<div className="card">
  <h2>Card Title</h2>
  <p>Card content</p>
</div>
```

### Badge
```tsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Failed</span>
```

## State Management

### Auth Store (Zustand)
```typescript
const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();

// Set authentication
setAuth(user, token);

// Logout
logout();

// Update user
updateUser({ name: 'New Name' });
```

## API Usage

### Making API Calls
```typescript
import { authAPI, transactionAPI } from '@/lib/api';

// Register
const response = await authAPI.register(data);

// Login
const response = await authAPI.login(data);

// Send money (placeholder)
const response = await transactionAPI.send(data);
```

## Next Steps

### Priority Features to Implement:
1. **Send Money Page**: Complete transaction form with phone lookup
2. **Transaction History**: List and filter transactions
3. **QR Code Generator**: Create static/dynamic QR codes
4. **Bill Payment**: Integration with billers
5. **Profile Page**: View and edit user profile
6. **Wallet Management**: Add payment methods, view balance
7. **Settings**: Change ePin, notification preferences

### Code Structure for New Pages:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.getData();
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Page Title</h1>
      <div className="card">
        {loading ? 'Loading...' : 'Content'}
      </div>
    </div>
  );
}
```

## Design System

### Colors
- **Primary**: Blue tones (#0ea5e9 - #0c4a6e)
- **Secondary**: Purple tones (#d946ef - #701a75)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Font Family**: Inter (system fallback)
- **Headings**: Bold, sizes from text-xl to text-3xl
- **Body**: Regular, text-base

### Spacing
- **Cards**: p-6
- **Sections**: space-y-6
- **Grid Gaps**: gap-4 to gap-8

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Environment Variables for Production
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

## Troubleshooting

### Common Issues:

1. **API Connection Error**:
   - Check if backend is running on port 5000
   - Verify NEXT_PUBLIC_API_URL in .env.local

2. **Authentication Issues**:
   - Clear localStorage: `localStorage.clear()`
   - Check token in browser DevTools > Application > Local Storage

3. **Styling Not Applied**:
   - Run `npm run dev` to rebuild Tailwind
   - Check if globals.css is imported in layout.tsx

4. **Type Errors**:
   - Run `npm run lint` to check for issues
   - Ensure TypeScript dependencies are installed

## Contributing

When adding new features:
1. Create component files in appropriate directories
2. Use TypeScript for type safety
3. Follow existing naming conventions
4. Add API methods to lib/api.ts
5. Use toast notifications for user feedback
6. Handle loading and error states
7. Make responsive (mobile-first)

## Team
- Wahidul Haque (2305054)
- Abu Bakar Siddique (2305059)
