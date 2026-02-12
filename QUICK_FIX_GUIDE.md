# ClickPay - Quick Fix Guide

## Issue: Build Error with globals.css

If you encounter the error about `border-border` class, it has been fixed in the latest version.

## Fresh Installation Steps

### 1. Backend Setup
```bash
cd backend
npm install
copy .env.example .env  # Windows
# OR
cp .env.example .env     # Mac/Linux

# Edit .env file and add your database credentials:
# DATABASE_URL=postgresql://postgres.pnzkaglrsovrbkmmhbnn:123FW_m6AK91@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
# JWT_SECRET=your-secret-jwt-key-change-this-in-production

npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env.local  # Windows
# OR
cp .env.example .env.local     # Mac/Linux

# Edit .env.local and add:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

npm run dev
```

## Common Issues & Solutions

### Issue 1: "border-border class does not exist"
**Solution:** Already fixed in `globals.css`. If you still see it, replace the `@layer base` section with:
```css
@layer base {
  body {
    @apply bg-gray-50 text-gray-900 font-sans;
  }
}
```

### Issue 2: Cannot connect to database
**Solution:** 
- Check your `.env` file in backend folder
- Ensure DATABASE_URL is correct
- Test connection: Try logging into your Supabase dashboard

### Issue 3: CORS errors
**Solution:** 
- Make sure backend is running on port 5000
- Check CORS_ORIGIN in backend `.env` matches your frontend URL
- Default should be: `CORS_ORIGIN=http://localhost:3000`

### Issue 4: "localStorage is not defined"
**Solution:** This happens with server-side rendering. The code already handles this, but if you see it:
- Make sure you're using `'use client'` directive in components that use localStorage
- All auth-related components already have this

### Issue 5: TypeScript errors
**Solution:**
```bash
cd frontend
npm install --save-dev typescript @types/react @types/node
```

### Issue 6: Module not found errors
**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

## Testing Your Installation

### 1. Test Backend is Running
Open browser and go to: `http://localhost:5000/health`

You should see:
```json
{
  "success": true,
  "message": "ClickPay API is running",
  "timestamp": "..."
}
```

### 2. Test Frontend is Running
Open browser and go to: `http://localhost:3000`

You should see the ClickPay landing page.

### 3. Test Registration
1. Click "Register" button
2. Fill in the form:
   - Name: Test User
   - Phone: 01712345678
   - NID: 1234567890123
   - ePin: 12345
   - Role: User
3. Click "Create Account"
4. You should be redirected to dashboard

### 4. Test Login
1. Go to login page
2. Enter:
   - Phone: 01712345678
   - ePin: 12345
3. Click "Login"
4. You should see the dashboard

## Port Conflicts

If port 5000 is already in use:
1. Edit `backend/.env`
2. Change `PORT=5000` to `PORT=5001` (or any available port)
3. Update `frontend/.env.local` to match: `NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1`

If port 3000 is already in use:
```bash
# Frontend will automatically ask to use another port (3001)
# Just press 'y' when prompted
```

## Windows-Specific Issues

### Issue: npm install fails
**Solution:**
```bash
# Run as Administrator
# OR clear npm cache
npm cache clean --force
npm install
```

### Issue: Scripts don't run
**Solution:**
```bash
# Use npm run instead of direct script execution
npm run dev
# Instead of: ./node_modules/.bin/nodemon
```

## Need More Help?

1. Check that Node.js version is 22+: `node --version`
2. Check npm version: `npm --version`
3. Look at browser console (F12) for frontend errors
4. Look at terminal output for backend errors
5. Check the detailed SETUP_GUIDE.md for more information

## Quick Commands Reference

```bash
# Start Backend (from backend folder)
npm run dev

# Start Frontend (from frontend folder)  
npm run dev

# Install dependencies
npm install

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for errors
npm run lint
```

## Success Indicators

✅ Backend running: Terminal shows "ClickPay API Server Started"
✅ Frontend running: Terminal shows "Ready" and Local URL
✅ Database connected: Terminal shows "Connected to PostgreSQL database"
✅ Registration works: User can create account and see dashboard
✅ Login works: User can login with phone and ePin

If all these work, your setup is complete! 🎉
