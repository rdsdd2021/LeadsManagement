# Comprehensive Test Scenarios

## Test Environment Setup

### Prerequisites
- [ ] Database migration applied (RLS policies)
- [ ] At least 500+ leads in database
- [ ] At least 3 regular users created
- [ ] 1 admin user available
- [ ] Dev server running

### Test Data Requirements
- Leads with various statuses (new, qualified, closed)
- Leads with various categories
- Leads with custom fields
- Mix of assigned and unassigned leads

---

## Test Scenario 1: Basic Pagination Navigation

### Objective
Test standard pagination controls and page navigation

### Steps
1. **Login as admin**
2. **Navigate to leads page**
3. **Verify initial state:**
   - [ ] Pagination controls visible at top
   - [ ] Pagination controls visible at bottom
   - [ ] Shows "Showing 1 to 100 of X results"
   - [ ] Page 1 is highlighted
   - [ ] Previous/First buttons disabled
   - [ ] Next/Last buttons enabled

4. **Test Next Page:**
   - [ ] Click Next button (▶)
   - [ ] URL updates or state changes
   - [ ] Table shows leads 101-200
   - [ ] Counter shows "Showing 101 to 200 of X"
   - [ ] Page 2 is highlighted
   - [ ] Previous/First buttons now enabled

5. **Test Page Number Click:**
   - [ ] Click page 5
   - [ ] Table shows leads 401-500
   - [ ] Counter updates correctly
   - [ ] Page 5 is highlighted

6. **Test Last Page:**
   - [ ] Click Last button (⏭)
   - [ ] Shows last page of results
   - [ ] Next/Last buttons disabled
   - [ ] Previous/First buttons enabled

7. **Test First Page:**
   - [ ] Click First button (⏮)
   - [ ] Returns to page 1
   - [ ] Shows leads 1-100

### Expected Results
✅ All navigation buttons work correctly
✅ Page numbers update properly
✅ Counter shows correct ranges
✅ Button states (enabled/disabled) correct
✅ Both top and bottom controls work identically

### Test Data
```
Total Leads: 500+
Page Size: 100 (default)
Expected Pages: 5+
```

---

## Test Scenario 2: Page Size Adjustment

### Objective
Test changing items per page

### Steps
1. **Start on page 1 with 100 items**
2. **Change to 50 items per page:**
   - [ ] Click "Per page" dropdown
   - [ ] Select "50"
   - [ ] Table shows only 50 leads
   - [ ] Counter shows "Showing 1 to 50 of X"
   - [ ] Total pages increases (e.g., 5 → 10)
   - [ ] Page resets to 1

3. **Navigate to page 3 (leads 101-150)**
4. **Change to 200 items per page:**
   - [ ] Select "200" from dropdown
   - [ ] Page resets to 1
   - [ ] Shows leads 1-200
   - [ ] Total pages decreases

5. **Test with 10 items per page:**
   - [ ] Select "10"
   - [ ] Shows only 10 leads
   - [ ] Many page numbers appear
   - [ ] Navigation still works

6. **Test with 500 items per page:**
   - [ ] Select "500"
   - [ ] Shows up to 500 leads
   - [ ] Fewer pages (maybe 1-2)

### Expected Results
✅ Page size changes immediately
✅ Table updates with correct number of rows
✅ Counter reflects new page size
✅ Total pages recalculated
✅ Current page resets to 1
✅ Preference saved (check after reload)

### Test Data
```
Test Sizes: 10, 25, 50, 100, 200, 500
Total Leads: 500+
```

---

## Test Scenario 3: Infinite Scroll Mode

### Objective
Test infinite scroll functionality

### Steps
1. **Start in standard mode**
2. **Switch to infinite scroll:**
   - [ ] Click "Infinite Scroll" button
   - [ ] Pagination controls disappear
   - [ ] Table shows first 100 leads
   - [ ] Button changes to "Standard Pages"

3. **Test auto-loading:**
   - [ ] Scroll down to bottom of table
   - [ ] "Loading more..." appears
   - [ ] Next 100 leads load automatically
   - [ ] Now showing 200 leads total
   - [ ] Can scroll through all 200

4. **Continue scrolling:**
   - [ ] Scroll to bottom again
   - [ ] Another 100 loads (300 total)
   - [ ] Repeat until all data loaded

5. **Test end state:**
   - [ ] Scroll to very bottom
   - [ ] "No more results" message appears
   - [ ] No more loading attempts

6. **Test with filters:**
   - [ ] Apply a filter (e.g., Status = New)
   - [ ] Results reset
   - [ ] Infinite scroll works with filtered data
   - [ ] Loads all filtered results

7. **Switch back to standard:**
   - [ ] Click "Standard Pages" button
   - [ ] Pagination controls reappear
   - [ ] Shows page 1 of filtered results
   - [ ] Can navigate normally

### Expected Results
✅ Mode toggle works smoothly
✅ Auto-loading triggers at correct scroll position
✅ Loading indicator shows during fetch
✅ New data appends to existing data
✅ End message shows when complete
✅ Works with filters
✅ Can switch back to standard mode
✅ Mode preference saved

### Test Data
```
Total Leads: 500+
Page Size: 100
Expected Loads: 5+ automatic loads
```

---

## Test Scenario 4: Bulk Assignment - Equal Distribution

### Objective
Test bulk assignment with equal distribution

### Steps
1. **Setup:**
   - [ ] Login as admin
   - [ ] Ensure 500+ unassigned leads exist
   - [ ] Have 3 regular users available

2. **Apply filters:**
   - [ ] Filter: Status = "new"
   - [ ] Filter: Category = "Real Estate"
   - [ ] Result: ~300 leads (example)
   - [ ] Pagination resets to page 1

3. **Initiate bulk assign:**
   - [ ] Click "Bulk Assign" button
   - [ ] Dialog opens - Step 1

4. **Step 1 - Specify count:**
   - [ ] Default shows total filtered count (300)
   - [ ] Change to 150 leads
   - [ ] Click "Next: Select Users"

5. **Step 2 - Distribution:**
   - [ ] Select "Equal distribution" mode
   - [ ] Select 3 users (Alice, Bob, Carol)
   - [ ] Preview shows:
     - Alice: 50 leads
     - Bob: 50 leads
     - Carol: 50 leads
     - Total: 150 / 150
   - [ ] Click "Assign Leads"

6. **Verify assignment:**
   - [ ] Success message appears
   - [ ] Table refreshes
   - [ ] Check assigned leads:
     - [ ] 50 leads assigned to Alice
     - [ ] 50 leads assigned to Bob
     - [ ] 50 leads assigned to Carol
   - [ ] Remaining 150 still unassigned

7. **Verify user view:**
   - [ ] Logout admin
   - [ ] Login as Alice
   - [ ] See exactly 50 leads
   - [ ] All match the filters applied
   - [ ] Cannot see Bob's or Carol's leads

### Expected Results
✅ Filter count accurate
✅ Dialog shows correct total
✅ Equal distribution calculates correctly
✅ Preview shows accurate distribution
✅ Assignment completes successfully
✅ Correct number assigned to each user
✅ Users see only their leads (RLS works)
✅ Remaining leads stay unassigned

### Test Data
```
Filtered Leads: 300
Assign Count: 150
Users: 3 (Alice, Bob, Carol)
Expected Distribution: 50, 50, 50
```

---

## Test Scenario 5: Bulk Assignment - Custom Distribution

### Objective
Test bulk assignment with custom counts per user

### Steps
1. **Setup:**
   - [ ] Login as admin
   - [ ] Apply filters: Category = "SaaS"
   - [ ] Result: ~200 leads

2. **Initiate bulk assign:**
   - [ ] Click "Bulk Assign"
   - [ ] Enter count: 200 (all filtered)
   - [ ] Click "Next"

3. **Custom distribution:**
   - [ ] Select "Custom count per user"
   - [ ] Select 4 users
   - [ ] Enter custom counts:
     - User A: 80 leads
     - User B: 60 leads
     - User C: 40 leads
     - User D: 20 leads
   - [ ] Preview shows:
     - Total: 200 / 200 ✓

4. **Test validation:**
   - [ ] Change User A to 100
   - [ ] Total becomes 220 / 200
   - [ ] Error message appears
   - [ ] "Assign" button disabled
   - [ ] Fix counts back to valid total

5. **Complete assignment:**
   - [ ] Click "Assign Leads"
   - [ ] Success message
   - [ ] Table refreshes

6. **Verify distribution:**
   - [ ] Check User A: 80 leads
   - [ ] Check User B: 60 leads
   - [ ] Check User C: 40 leads
   - [ ] Check User D: 20 leads
   - [ ] Total: 200 leads assigned

### Expected Results
✅ Custom mode allows individual counts
✅ Preview calculates total correctly
✅ Validation prevents over-assignment
✅ Error message clear and helpful
✅ Assignment button disabled when invalid
✅ Correct counts assigned to each user
✅ All filtered leads assigned

### Test Data
```
Filtered Leads: 200
Distribution: 80, 60, 40, 20
Users: 4
Total: 200 (exact match)
```

---

## Test Scenario 6: Bulk Assignment - Page Selection

### Objective
Test assigning only selected leads from current page

### Steps
1. **Setup:**
   - [ ] Login as admin
   - [ ] Navigate to page 3 (leads 201-300)
   - [ ] Page shows 100 leads

2. **Select specific leads:**
   - [ ] Click checkboxes for 25 leads
   - [ ] Selection counter shows "25 selected"
   - [ ] Selected leads highlighted

3. **Bulk assign selected:**
   - [ ] Click "Bulk Assign (25)"
   - [ ] Dialog opens
   - [ ] Count pre-filled with 25
   - [ ] Note: "(25 selected on current page)"

4. **Assign to single user:**
   - [ ] Click "Next"
   - [ ] Select 1 user (User E)
   - [ ] Equal distribution shows: 25 leads
   - [ ] Click "Assign Leads"

5. **Verify:**
   - [ ] Only those 25 leads assigned
   - [ ] Other leads on page unassigned
   - [ ] Selection cleared
   - [ ] User E has exactly 25 leads

6. **Test select all on page:**
   - [ ] Go to page 1
   - [ ] Click "Select All" checkbox
   - [ ] All 100 on page selected
   - [ ] Click "Bulk Assign (100)"
   - [ ] Assign to 2 users (50 each)
   - [ ] Verify 50 + 50 = 100 assigned

### Expected Results
✅ Individual selection works
✅ Select all selects current page only
✅ Selection counter accurate
✅ Dialog pre-fills with selection count
✅ Only selected leads assigned
✅ Other leads unaffected
✅ Selection clears after assignment

### Test Data
```
Page: 3 (leads 201-300)
Selected: 25 individual leads
Then: 100 leads (select all)
```

---

## Test Scenario 7: Filters + Pagination + Assignment

### Objective
Test complex workflow with multiple features

### Steps
1. **Apply multiple filters:**
   - [ ] Status: "new", "qualified"
   - [ ] Category: "Real Estate"
   - [ ] Region: "North"
   - [ ] Custom field: Property Type = "Commercial"
   - [ ] Result: ~150 leads

2. **Test pagination with filters:**
   - [ ] Pagination shows correct total (150)
   - [ ] Page 1 shows leads 1-100
   - [ ] Page 2 shows leads 101-150
   - [ ] All leads match filters

3. **Change page size:**
   - [ ] Set to 50 per page
   - [ ] Now 3 pages (50, 50, 50)
   - [ ] Navigate to page 2
   - [ ] Shows leads 51-100

4. **Bulk assign filtered results:**
   - [ ] Click "Bulk Assign"
   - [ ] Shows 150 total filtered
   - [ ] Assign 100 leads
   - [ ] Distribute to 2 users (50 each)
   - [ ] Complete assignment

5. **Verify filtered assignment:**
   - [ ] All 100 assigned leads match original filters
   - [ ] Users see only their filtered leads
   - [ ] 50 leads remain unassigned
   - [ ] Unassigned leads still match filters

6. **Test filter changes:**
   - [ ] Remove one filter
   - [ ] Results increase
   - [ ] Pagination updates
   - [ ] Page resets to 1
   - [ ] Can still assign remaining

### Expected Results
✅ Multiple filters work together
✅ Pagination respects filters
✅ Page size changes work with filters
✅ Bulk assign uses filtered results
✅ Assigned leads match filters
✅ RLS works with filtered data
✅ Filter changes reset pagination

### Test Data
```
Filters: 4 active filters
Filtered Results: 150 leads
Assign: 100 leads to 2 users
Remaining: 50 unassigned
```

---

## Test Scenario 8: Infinite Scroll + Filters + Assignment

### Objective
Test infinite scroll with filters and bulk assignment

### Steps
1. **Setup infinite scroll:**
   - [ ] Switch to infinite scroll mode
   - [ ] Apply filter: Status = "new"
   - [ ] Result: 400 leads

2. **Test infinite loading with filters:**
   - [ ] Initial load: 100 leads
   - [ ] Scroll down
   - [ ] Loads next 100 (200 total)
   - [ ] Scroll down
   - [ ] Loads next 100 (300 total)
   - [ ] All loaded leads match filter

3. **Select leads while scrolling:**
   - [ ] Select 10 leads from first 100
   - [ ] Scroll and load more
   - [ ] Select 10 more from second 100
   - [ ] Total: 20 selected
   - [ ] Selection persists across loads

4. **Bulk assign in infinite mode:**
   - [ ] Click "Bulk Assign (20)"
   - [ ] Dialog shows 20 selected
   - [ ] Or click without selection
   - [ ] Dialog shows 400 total filtered
   - [ ] Assign 200 to 4 users (50 each)

5. **Verify after assignment:**
   - [ ] Table refreshes
   - [ ] Infinite scroll resets
   - [ ] Shows first 100 again
   - [ ] Can scroll to see all
   - [ ] Assigned leads show "Assigned" badge

6. **Switch to standard mode:**
   - [ ] Click "Standard Pages"
   - [ ] Pagination shows correct counts
   - [ ] Can navigate pages normally
   - [ ] Filters still active

### Expected Results
✅ Infinite scroll works with filters
✅ All loaded data matches filters
✅ Selection works across loads
✅ Bulk assign works in infinite mode
✅ Assignment uses filtered data
✅ Can switch modes after assignment
✅ Data consistency maintained

### Test Data
```
Filter: Status = "new"
Filtered Results: 400 leads
Infinite Loads: 4 loads (100 each)
Assignment: 200 leads to 4 users
```

---

## Performance Tests

### Test 9: Large Dataset Performance

**Objective:** Test with 5000+ leads

**Steps:**
1. [ ] Load page with 5000+ leads
2. [ ] Measure initial load time (< 2 seconds)
3. [ ] Test pagination navigation (< 500ms per page)
4. [ ] Test infinite scroll (< 1 second per load)
5. [ ] Test bulk assign 1000 leads (< 5 seconds)
6. [ ] Monitor memory usage
7. [ ] Check for memory leaks

**Expected:**
- Initial load: < 2 seconds
- Page navigation: < 500ms
- Infinite load: < 1 second
- Bulk assign: < 5 seconds
- No memory leaks

### Test 10: Concurrent Operations

**Objective:** Test multiple operations simultaneously

**Steps:**
1. [ ] Apply filters while page is loading
2. [ ] Change page size during navigation
3. [ ] Switch modes during data fetch
4. [ ] Start bulk assign while scrolling
5. [ ] Apply new filter during assignment

**Expected:**
- No race conditions
- No duplicate requests
- Proper loading states
- Data consistency
- Error handling

---

## Edge Cases

### Test 11: Edge Case Scenarios

1. **Empty Results:**
   - [ ] Apply filter with no matches
   - [ ] Shows "No leads found" message
   - [ ] Pagination hidden
   - [ ] Bulk assign button hidden

2. **Single Page:**
   - [ ] Filter to < 100 results
   - [ ] Pagination shows 1 page
   - [ ] Next/Last buttons disabled
   - [ ] Still functional

3. **Exact Page Size:**
   - [ ] Filter to exactly 100 results
   - [ ] Shows 1 page
   - [ ] No "Load more" in infinite mode

4. **Assignment Validation:**
   - [ ] Try to assign 0 leads (prevented)
   - [ ] Try to assign more than available (prevented)
   - [ ] Try to assign without selecting users (prevented)
   - [ ] Try custom counts > total (prevented)

5. **Network Errors:**
   - [ ] Simulate network failure during page load
   - [ ] Error message shows
   - [ ] Can retry
   - [ ] Simulate failure during assignment
   - [ ] Error message clear
   - [ ] Data not corrupted

---

## Regression Tests

### Test 12: Existing Features Still Work

1. **CSV Upload:**
   - [ ] Upload CSV with custom fields
   - [ ] Leads appear in table
   - [ ] Pagination updates
   - [ ] Can assign uploaded leads

2. **Search:**
   - [ ] Search by name
   - [ ] Results filter correctly
   - [ ] Pagination updates
   - [ ] Works with other filters

3. **Custom Field Filters:**
   - [ ] All custom field filters work
   - [ ] Combine with standard filters
   - [ ] Pagination respects filters
   - [ ] Assignment uses filtered data

4. **User Management:**
   - [ ] Admin can see all leads
   - [ ] Users see only assigned leads
   - [ ] RLS enforced
   - [ ] No unauthorized access

---

## Test Results Template

```markdown
## Test Execution Results

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Prod]

### Scenario 1: Basic Pagination
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Scenario 2: Page Size Adjustment
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Scenario 3: Infinite Scroll
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Scenario 4: Bulk Assignment - Equal
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Scenario 5: Bulk Assignment - Custom
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Scenario 6: Page Selection
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Scenario 7: Filters + Pagination
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Scenario 8: Infinite + Filters
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any issues or observations]

### Performance Tests
- Large Dataset: ✅ PASS / ❌ FAIL
- Concurrent Ops: ✅ PASS / ❌ FAIL

### Edge Cases
- Status: ✅ PASS / ❌ FAIL
- Issues Found: [List]

### Regression Tests
- Status: ✅ PASS / ❌ FAIL
- Issues Found: [List]

### Overall Assessment
- Total Tests: 12
- Passed: X
- Failed: Y
- Blocked: Z

### Critical Issues
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## Automated Test Script (Optional)

For automated testing, you can use this Playwright script:

```typescript
// tests/pagination-bulk-assign.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Pagination and Bulk Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    // Login as admin
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/') // Wait for redirect
  })

  test('Scenario 1: Basic pagination navigation', async ({ page }) => {
    // Verify initial state
    await expect(page.locator('text=Showing 1 to')).toBeVisible()
    
    // Click next page
    await page.click('button[aria-label="Next page"]')
    await expect(page.locator('text=Showing 101 to')).toBeVisible()
    
    // Click page 5
    await page.click('button:has-text("5")')
    await expect(page.locator('text=Showing 401 to')).toBeVisible()
  })

  test('Scenario 2: Page size adjustment', async ({ page }) => {
    // Change page size
    await page.click('text=Per page:')
    await page.click('text=50')
    
    // Verify
    await expect(page.locator('text=Showing 1 to 50')).toBeVisible()
  })

  test('Scenario 3: Infinite scroll', async ({ page }) => {
    // Switch to infinite mode
    await page.click('text=Infinite Scroll')
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Wait for loading
    await expect(page.locator('text=Loading more')).toBeVisible()
    
    // Wait for new data
    await page.waitForTimeout(2000)
    
    // Verify more data loaded
    const rows = await page.locator('tbody tr').count()
    expect(rows).toBeGreaterThan(100)
  })

  // Add more test scenarios...
})
```

---

## Quick Test Checklist

For rapid testing, use this checklist:

- [ ] Pagination controls visible
- [ ] Page navigation works
- [ ] Page size changes work
- [ ] Infinite scroll loads data
- [ ] Mode toggle works
- [ ] Bulk assign dialog opens
- [ ] Equal distribution calculates
- [ ] Custom distribution validates
- [ ] Assignment completes
- [ ] Users see only their leads
- [ ] Filters work with pagination
- [ ] Filters work with assignment
- [ ] Performance acceptable
- [ ] No console errors
- [ ] No memory leaks
