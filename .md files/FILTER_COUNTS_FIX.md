# ✅ Filter Counts Fix

## Issue
The counts in parentheses next to filter values were not adding up to the total number of leads.

## Root Cause
The filter counts were showing **filtered counts** (faceted search behavior) instead of **total counts**.

### Example of the Problem:
```
Total Leads: 100
- 50 from School A
- 50 from School B

When filtering by "District X" (which has 30 leads):
- School A showed (20) ← only 20 from School A are in District X
- School B showed (10) ← only 10 from School B are in District X
- Total: 20 + 10 = 30 ≠ 100
```

This is actually **correct behavior for faceted search** (like Amazon or eBay filters), where counts show "how many results you'll get if you select this option."

However, if you want to see **total counts across all data**, that's what I've implemented.

---

## Solution

Changed `useFilterValueCounts` hook to show **total counts** instead of filtered counts.

### Before (Faceted Search):
```typescript
// Counts were calculated based on current filters
const buildBaseQuery = (excludeField) => {
  let query = supabase.from('leads').select('*')
  
  // Apply all other filters
  if (excludeField !== 'school' && school.length > 0) {
    query = query.in('school', school)
  }
  // ... more filters
  
  return query
}
```

### After (Total Counts):
```typescript
// Counts show total across entire dataset
const { data: schoolData } = await supabase
  .from('leads')
  .select('school')

// Count all occurrences
schoolData.forEach((row) => {
  if (row.school) {
    counts.school[row.school] = (counts.school[row.school] || 0) + 1
  }
})
```

---

## New Behavior

### Example:
```
Total Leads: 100
- School A: 50 leads
- School B: 50 leads

Filter counts will ALWAYS show:
- School A (50)
- School B (50)

Even when filtering by District X:
- Showing: 30 of 100 leads
- School A (50) ← total count, not filtered
- School B (50) ← total count, not filtered
```

### Benefits:
✅ Counts add up to total
✅ Consistent across all filters
✅ Shows data distribution
✅ Easier to understand

### Trade-offs:
⚠️ Doesn't show "how many results if I select this"
⚠️ May show options with 0 results in current filter

---

## Performance

### Before:
- 4 queries (one per field)
- Each query applied all filters
- More complex queries

### After:
- 4 simple queries (one per field)
- No filters applied
- Faster execution
- Better caching (60 seconds)

---

## Alternative: Faceted Search

If you prefer the **faceted search behavior** (counts based on filters), I kept the old code commented in the file. You can switch back by:

1. Uncommenting the old `buildBaseQuery` function
2. Using it to build queries for each field
3. Changing the queryKey to include filters

### Faceted Search Benefits:
- Shows "how many results if I select this"
- Hides options with 0 results
- Better for e-commerce style filtering

### Faceted Search Trade-offs:
- Counts don't add up to total
- More complex queries
- Slower performance

---

## Files Changed

1. **hooks/useFilterValueCounts.ts** - Rewritten to show total counts
   - Removed filter logic
   - Simplified queries
   - Increased cache time (60 seconds)

---

## Testing

### To Verify:
1. Go to dashboard
2. Check filter counts in parentheses
3. Add up all counts for a field (e.g., all schools)
4. Should equal total number of leads

### Example Test:
```
If you have:
- 100 total leads
- School A: 60 leads
- School B: 40 leads

Counts should show:
- School A (60)
- School B (40)
- Total: 60 + 40 = 100 ✅
```

---

## Which Behavior Do You Prefer?

### Option 1: Total Counts (Current)
- ✅ Counts add up to total
- ✅ Shows data distribution
- ✅ Faster queries
- ⚠️ May show options with 0 results when filtered

### Option 2: Faceted Search (Old)
- ✅ Shows "how many if I select this"
- ✅ Hides options with 0 results
- ⚠️ Counts don't add up to total
- ⚠️ Slower queries

Let me know if you want to switch back to faceted search!

---

**Status:** ✅ FIXED
**Behavior:** Total Counts (adds up to total)
**Performance:** Improved (simpler queries)
**Cache:** 60 seconds
