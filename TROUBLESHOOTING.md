# Troubleshooting Guide

## Project Entries Issues Fixed

### Issues Resolved:

1. **Server-Side Rendering (SSR) Issues:**
   - Fixed `getUserCurrency()` being called during SSR
   - Added client-side checks with `typeof window !== 'undefined'`
   - Updated CurrencyProvider to handle SSR properly

2. **React Hook Dependencies:**
   - Fixed useEffect dependency arrays to prevent infinite loops
   - Moved function definitions to proper locations
   - Removed duplicate function definitions

3. **Type Safety:**
   - Updated Project interface to include currency field
   - Fixed form submission types to match expected parameters
   - Added proper CurrencyCode type imports

4. **Demo Data:**
   - Enhanced demo project entries for all projects
   - Added proper currency fields to demo data

### Key Fixes Applied:

#### 1. Currency Context (lib/currency-context.tsx)
```typescript
useEffect(() => {
  // Load user's preferred currency on mount (client-side only)
  if (typeof window !== 'undefined') {
    const userCurrency = getUserCurrency()
    setCurrencyState(userCurrency)
  }
  setIsLoading(false)
}, [])
```

#### 2. Project Entry Form (components/projects/project-entry-form.tsx)
```typescript
const [formData, setFormData] = useState({
  date: '',
  description: '',
  amount: '',
  currency: 'USD' as CurrencyCode // Default to USD instead of calling getUserCurrency()
})
```

#### 3. Currency Selector (components/ui/currency-selector.tsx)
```typescript
useEffect(() => {
  if (value) {
    setSelectedCurrency(value)
  } else {
    // Only get user currency on client side
    if (typeof window !== 'undefined') {
      const userCurrency = getUserCurrency()
      setSelectedCurrency(userCurrency)
    }
  }
}, [value])
```

### How to Test:

1. Start the development server: `npm run dev`
2. Open browser at `http://localhost:3005` (or whatever port is shown)
3. Click "Try Demo Account" to test with demo data
4. Navigate to Projects page
5. Click on any project card to open project details
6. Click "Add Entry" to test adding project entries
7. Test currency selection and form submission

### Expected Behavior:

- ✅ No more SSR/hydration errors
- ✅ Currency selector works properly
- ✅ Project entries can be added successfully
- ✅ Demo data loads correctly
- ✅ Global currency conversion works
- ✅ Form validation and submission works

### If Issues Persist:

1. Clear browser cache and reload
2. Delete `.next` folder and restart: `rm -rf .next && npm run dev`
3. Check browser console for any remaining JavaScript errors
4. Verify database tables exist if using real Supabase (not demo mode)

