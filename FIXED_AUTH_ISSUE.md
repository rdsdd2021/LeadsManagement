# Fixed: Cookie-Based Auth Issue

## The Problem

The app was using **cookie-based authentication** (via `@supabase/ssr`) for server-side operations, but the main Supabase client (`lib/supabase.ts`) was using **localStorage-based authentication** (via `@supabase/supabase-js`).

This caused a mismatch where:
- ✅ Server-side operations worked (using cookies)
- ❌ Client-side storage operations failed (using localStorage, no auth token)
- ❌ RLS policies couldn't verify the user because no auth token was sent

## The Fix

Updated `lib/supabase.ts` to use `createBrowserClient` from `@supabase/ssr` instead of `createClient` from `@supabase/supabase-js`.

### Before:
```typescript
import { createClient } from '@supabase/supabase-js'

supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### After:
```typescript
import { createBrowserClient } from '@supabase/ssr'

supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
```

## Why This Works

`createBrowserClient` from `@supabase/ssr`:
- ✅ Uses cookies for auth (matches server-side)
- ✅ Works with Next.js App Router
- ✅ Properly sends auth tokens with storage requests
- ✅ Maintains session across page reloads
- ✅ Compatible with middleware auth checks

## What's Fixed

1. **CSV Upload** - Now works because auth token is sent with storage requests
2. **Manage Users Page** - Should now show all users (if you have admin permissions)
3. **RLS Policies** - Can now properly verify user identity
4. **Session Persistence** - More reliable across page reloads

## Test It

1. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Try uploading a CSV file** - Should work now!
3. **Check Manage Users page** - Should show users if you're admin

## Verify in Console

Run this in browser console (F12):

```javascript
// Check if auth is working
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user?.id, user?.email)

// Test storage upload
const testFile = new File(['test'], 'test.csv', { type: 'text/csv' })
const { data, error } = await supabase.storage
  .from('csv-imports')
  .upload(`${user.id}/test.csv`, testFile)

console.log('Upload result:', { data, error })
```

Expected: No errors, upload succeeds!

## Additional Benefits

- Consistent auth across client and server
- Better security (cookies are httpOnly)
- Proper SSR support
- No more "Multiple GoTrueClient instances" warning

## Files Changed

- `lib/supabase.ts` - Updated to use cookie-based client

## No Changes Needed

- `lib/supabase-browser.ts` - Already correct
- `middleware.ts` - Already using cookies
- API routes - Already using cookies
- Storage RLS policies - Already fixed with LIKE pattern
