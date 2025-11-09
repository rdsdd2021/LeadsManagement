# Test Execution Guide

## Quick Start Testing

### Manual Testing (Recommended First)

Run through these 5 key scenarios in order:

#### Test 1: Basic Pagination (5 minutes)
```
1. Open http://localhost:3000
2. Login as admin
3. Check pagination at top ✓
4. Click Next button ✓
5. Click page number ✓
6. Click Last page ✓
7. Click First page ✓
8. Check bottom pagination works ✓
```

#### Test 2: Page Size (3 minutes)
```
1. Click "Per page" dropdown
2. Select 50
3. Verify shows 50 items ✓
4. Select 200
5. Verify shows 200 items ✓
6. Reload page
7. Verify preference saved ✓
```

#### Test 3: Infinite Scroll (5 minutes)
```
1. Click "Infinite Scroll" button
2. Pagination disappears ✓
3. Scroll to bottom
4. "Loading more..." appears ✓
5. New data loads ✓
6. Scroll again
7. More data loads ✓
8. Scroll to end
9. "No more results" shows ✓
```

#### Test 4: Bulk Assignment - Equal (10 minutes)
```
1. Switch back to "Standard Pages"
2. Apply filter: Status = "new"
3. Note total count (e.g., 300)
4. Click "Bulk Assign"
5. Enter count: 150
6. Click "Next"
7. Select "Equal distribution"
8. Select 3 users
9. Verify preview: 50, 50, 50 ✓
10. Click "Assign Leads"
11. Success message ✓
12. Table refreshes ✓
13. Logout
14. Login as one of the users
15. See exactly 50 leads ✓
```

#### Test 5: Bulk Assignment - Custom (10 minutes)
```
1. Login as admin
2. Apply filter: Category = "Real Estate"
3. Note total (e.g., 200)
4. Click "Bulk Assign"
5. Enter count: 200
6. Click "Next"
7. Select "Custom count per user"
8. Select 4 users
9. Enter: 80, 60, 40, 20
10. Verify total: 200/200 ✓
11. Try invalid: 100, 60, 40, 20 (220 total)
12. Error shows ✓
13. Button disabled ✓
14. Fix to valid counts
15. Click "Assign Leads"
16. Success ✓
17. Verify each user has correct count ✓
```

---

## Detailed Test Execution

### Setup Phase (One Time)

1. **Ensure Database Has Test Data**
```sql
-- Check lead count
SELECT COUNT(*) FROM leads;
-- Should be 500+

-- Check user count
SELECT COUNT(*) FROM users WHERE role = 'user';
-- Should be 3+

-- Check unassigned leads
SELECT COUNT(*) FROM leads WHERE assigned_to IS NULL;
-- Should be 200+
```

2. **Create Test Users (if needed)**
```sql
-- Create test users
INSERT INTO users (email, full_name, role, password_hash)
VALUES 
  ('alice@test.com', 'Alice Johnson', 'user', 'hash'),
  ('bob@test.com', 'Bob Smith', 'user', 'hash'),
  ('carol@test.com', 'Carol White', 'user', 'hash'),
  ('david@test.com', 'David Brown', 'user', 'hash');
```

3. **Start Dev Server**
```bash
npm run dev
```

4. **Open Browser**
```
Navigate to: http://localhost:3000
```

---

## Test Execution Workflow

### Phase 1: Pagination Tests (15 minutes)

**Test 1.1: Initial State**
- [ ] Open leads page
- [ ] Pagination visible at top
- [ ] Pagination visible at bottom
- [ ] Shows "Showing 1 to 100 of X"
- [ ] Page 1 highlighted
- [ ] Previous/First disabled
- [ ] Next/Last enabled

**Test 1.2: Navigation**
- [ ] Click Next → Page 2
- [ ] Click page 5 → Page 5
- [ ] Click Last → Last page
- [ ] Click Previous → Previous page
- [ ] Click First → Page 1

**Test 1.3: Page Numbers**
- [ ] On page 1: Shows 1,2,3,4,5,6,...,Last
- [ ] On page 15: Shows 1,...,14,15,16,...,Last
- [ ] On last page: Shows 1,...,Last-5,Last-4,...,Last

**Test 1.4: Both Controls**
- [ ] Top pagination works
- [ ] Bottom pagination works
- [ ] Both stay in sync

**Screenshot:** Take screenshot of pagination controls

---

### Phase 2: Page Size Tests (10 minutes)

**Test 2.1: Change Page Size**
- [ ] Start with 100 per page
- [ ] Change to 10 → Shows 10 items
- [ ] Change to 25 → Shows 25 items
- [ ] Change to 50 → Shows 50 items
- [ ] Change to 200 → Shows 200 items
- [ ] Change to 500 → Shows 500 items

**Test 2.2: Page Reset**
- [ ] Navigate to page 5
- [ ] Change page size
- [ ] Verify resets to page 1

**Test 2.3: Persistence**
- [ ] Set page size to 50
- [ ] Reload page
- [ ] Verify still 50 per page

**Screenshot:** Take screenshot of page size dropdown

---

### Phase 3: Infinite Scroll Tests (15 minutes)

**Test 3.1: Mode Switch**
- [ ] Click "Infinite Scroll" button
- [ ] Button changes to "Standard Pages"
- [ ] Pagination controls disappear
- [ ] Table shows first 100 leads

**Test 3.2: Auto Loading**
- [ ] Scroll to 90% of page
- [ ] "Loading more..." appears
- [ ] Spinner shows
- [ ] Next 100 leads load
- [ ] Now 200 leads visible
- [ ] Can scroll through all 200

**Test 3.3: Multiple Loads**
- [ ] Continue scrolling
- [ ] Load 3rd batch (300 total)
- [ ] Load 4th batch (400 total)
- [ ] Load 5th batch (500 total)
- [ ] All loads successful

**Test 3.4: End State**
- [ ] Scroll to very bottom
- [ ] "No more results" shows
- [ ] No more loading attempts
- [ ] Can scroll back up

**Test 3.5: Switch Back**
- [ ] Click "Standard Pages"
- [ ] Pagination reappears
- [ ] Shows page 1
- [ ] Can navigate normally

**Screenshot:** Take screenshot of infinite scroll loading

---

### Phase 4: Filter Integration Tests (20 minutes)

**Test 4.1: Filters + Standard Pagination**
- [ ] Apply filter: Status = "new"
- [ ] Pagination updates with new count
- [ ] Page resets to 1
- [ ] Navigate through filtered pages
- [ ] All results match filter

**Test 4.2: Filters + Page Size**
- [ ] Keep filter active
- [ ] Change page size to 50
- [ ] Pagination recalculates
- [ ] All results still match filter

**Test 4.3: Filters + Infinite Scroll**
- [ ] Switch to infinite scroll
- [ ] Keep filter active
- [ ] Scroll and load more
- [ ] All loaded results match filter
- [ ] End message shows correctly

**Test 4.4: Multiple Filters**
- [ ] Add Status filter
- [ ] Add Category filter
- [ ] Add Region filter
- [ ] Add Custom field filter
- [ ] Pagination shows correct count
- [ ] All results match all filters

**Test 4.5: Filter Changes**
- [ ] On page 5
- [ ] Add new filter
- [ ] Page resets to 1
- [ ] Count updates
- [ ] Results correct

**Screenshot:** Take screenshot of filtered results with pagination

---

### Phase 5: Bulk Assignment Tests (40 minutes)

**Test 5.1: Equal Distribution - No Filters**
```
Setup:
- Total leads: 500
- Unassigned: 300
- Users: 3 (Alice, Bob, Carol)

Steps:
1. Click "Bulk Assign"
2. Enter count: 150
3. Click "Next"
4. Select "Equal distribution"
5. Select Alice, Bob, Carol
6. Preview shows: 50, 50, 50
7. Click "Assign Leads"
8. Success message
9. Table refreshes

Verify:
- Alice has 50 leads
- Bob has 50 leads
- Carol has 50 leads
- 150 leads remain unassigned
```

**Test 5.2: Equal Distribution - With Filters**
```
Setup:
- Apply filter: Status = "new"
- Filtered results: 200
- Users: 2 (David, Alice)

Steps:
1. Click "Bulk Assign"
2. Count shows 200 (filtered total)
3. Enter count: 100
4. Click "Next"
5. Select David, Alice
6. Preview: 50, 50
7. Assign

Verify:
- David has 50 "new" leads
- Alice has 50 "new" leads
- All assigned leads match filter
- 100 "new" leads remain
```

**Test 5.3: Custom Distribution**
```
Setup:
- Filter: Category = "Real Estate"
- Filtered: 200
- Users: 4

Steps:
1. Click "Bulk Assign"
2. Enter count: 200
3. Click "Next"
4. Select "Custom count per user"
5. Select 4 users
6. Enter counts:
   - User A: 80
   - User B: 60
   - User C: 40
   - User D: 20
7. Preview: 200/200 ✓
8. Assign

Verify:
- User A: 80 leads
- User B: 60 leads
- User C: 40 leads
- User D: 20 leads
- Total: 200
```

**Test 5.4: Custom Distribution - Validation**
```
Steps:
1. Start custom distribution
2. Enter counts that exceed total:
   - User A: 100
   - User B: 100
   - Total: 200/150 ❌
3. Error message shows
4. Button disabled
5. Fix counts to valid
6. Button enabled
7. Assign successfully
```

**Test 5.5: Page Selection**
```
Setup:
- Navigate to page 3
- Page shows 100 leads

Steps:
1. Select 25 leads manually
2. Counter shows "25 selected"
3. Click "Bulk Assign (25)"
4. Count pre-filled with 25
5. Assign to 1 user
6. Only those 25 assigned
7. Other 75 on page unassigned

Then:
1. Go to page 1
2. Click "Select All"
3. All 100 selected
4. Assign to 2 users (50 each)
5. All 100 assigned correctly
```

**Test 5.6: RLS Verification**
```
Steps:
1. Assign 50 leads to Alice
2. Logout admin
3. Login as Alice
4. See exactly 50 leads
5. Try to access other leads (should fail)
6. Cannot see Bob's leads
7. Cannot see unassigned leads (if RLS strict)
8. Can update her leads
9. Cannot update others' leads
```

**Screenshot:** Take screenshots of:
- Bulk assign dialog (both steps)
- Distribution preview
- Success message
- User view (RLS)

---

### Phase 6: Complex Scenarios (30 minutes)

**Test 6.1: Infinite Scroll + Filters + Assignment**
```
1. Switch to infinite scroll
2. Apply filter: Status = "new"
3. Scroll and load 300 leads
4. Select 20 leads across multiple loads
5. Click "Bulk Assign (20)"
6. Assign to 2 users
7. Verify assignment
8. Switch to standard mode
9. Verify pagination correct
```

**Test 6.2: Multiple Filter Changes**
```
1. Apply 3 filters
2. Navigate to page 5
3. Change one filter
4. Page resets to 1
5. Count updates
6. Navigate to page 3
7. Remove all filters
8. Page resets
9. Shows all leads
```

**Test 6.3: Rapid Operations**
```
1. Quickly change page size 3 times
2. Quickly navigate pages
3. Quickly switch modes
4. Apply filters rapidly
5. Start bulk assign
6. Cancel
7. Start again
8. Complete
9. No errors or race conditions
```

---

## Performance Benchmarks

### Measure These Metrics

**Initial Load:**
```
Open DevTools → Network tab
Reload page
Measure: Time to interactive
Target: < 2 seconds
```

**Page Navigation:**
```
Open DevTools → Performance tab
Start recording
Click next page
Stop recording
Measure: Time to render
Target: < 500ms
```

**Infinite Scroll:**
```
Start recording
Scroll to trigger load
Stop recording
Measure: Time to append data
Target: < 1 second
```

**Bulk Assignment:**
```
Start recording
Assign 500 leads
Stop recording
Measure: Total time
Target: < 5 seconds
```

**Memory Usage:**
```
Open DevTools → Memory tab
Take heap snapshot
Load 1000 leads (infinite scroll)
Take another snapshot
Compare: Memory increase
Target: < 50MB
```

---

## Test Results Recording

### Create Test Report

```markdown
# Test Execution Report

**Date:** [Current Date]
**Tester:** [Your Name]
**Environment:** Development
**Browser:** Chrome 120
**Total Duration:** [X] minutes

## Summary
- Total Tests: 30
- Passed: X
- Failed: Y
- Blocked: Z
- Pass Rate: X%

## Detailed Results

### Pagination Tests
✅ Test 1.1: Initial State - PASS
✅ Test 1.2: Navigation - PASS
✅ Test 1.3: Page Numbers - PASS
✅ Test 1.4: Both Controls - PASS

### Page Size Tests
✅ Test 2.1: Change Page Size - PASS
✅ Test 2.2: Page Reset - PASS
✅ Test 2.3: Persistence - PASS

### Infinite Scroll Tests
✅ Test 3.1: Mode Switch - PASS
✅ Test 3.2: Auto Loading - PASS
✅ Test 3.3: Multiple Loads - PASS
✅ Test 3.4: End State - PASS
✅ Test 3.5: Switch Back - PASS

### Filter Integration Tests
✅ Test 4.1: Filters + Pagination - PASS
✅ Test 4.2: Filters + Page Size - PASS
✅ Test 4.3: Filters + Infinite - PASS
✅ Test 4.4: Multiple Filters - PASS
✅ Test 4.5: Filter Changes - PASS

### Bulk Assignment Tests
✅ Test 5.1: Equal - No Filters - PASS
✅ Test 5.2: Equal - With Filters - PASS
✅ Test 5.3: Custom Distribution - PASS
✅ Test 5.4: Validation - PASS
✅ Test 5.5: Page Selection - PASS
✅ Test 5.6: RLS Verification - PASS

### Complex Scenarios
✅ Test 6.1: Infinite + Filters + Assign - PASS
✅ Test 6.2: Multiple Filter Changes - PASS
✅ Test 6.3: Rapid Operations - PASS

## Performance Metrics
- Initial Load: 1.2s ✅ (< 2s)
- Page Navigation: 320ms ✅ (< 500ms)
- Infinite Scroll: 680ms ✅ (< 1s)
- Bulk Assignment (500): 3.8s ✅ (< 5s)
- Memory Usage: +32MB ✅ (< 50MB)

## Issues Found
1. [None / List issues]

## Recommendations
1. [Any suggestions]

## Screenshots
- [Attach screenshots]

## Conclusion
All tests passed successfully. System is ready for production.
```

---

## Quick Smoke Test (5 minutes)

For rapid verification:

```
1. ✓ Page loads
2. ✓ Pagination visible
3. ✓ Click next page works
4. ✓ Change page size works
5. ✓ Switch to infinite scroll
6. ✓ Scroll loads more
7. ✓ Switch back to standard
8. ✓ Apply filter
9. ✓ Click bulk assign
10. ✓ Assign to user
11. ✓ Success message
12. ✓ Login as user
13. ✓ See assigned leads
14. ✓ No console errors
15. ✓ DONE
```

---

## Automated Testing (Optional)

If you want to automate these tests:

```bash
# Install Playwright
npm install -D @playwright/test

# Create test file
# tests/features.spec.ts

# Run tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test tests/features.spec.ts
```

---

## Continuous Testing

For ongoing development:

1. **Before Each Commit:**
   - Run smoke test (5 min)
   - Check console for errors
   - Verify no regressions

2. **Before Each PR:**
   - Run full test suite (60 min)
   - Document any issues
   - Update test results

3. **Before Deployment:**
   - Run all tests
   - Performance benchmarks
   - Security checks
   - User acceptance testing

---

## Test Data Cleanup

After testing:

```sql
-- Reset test assignments
UPDATE leads 
SET assigned_to = NULL 
WHERE assigned_to IN (
  SELECT id FROM users WHERE email LIKE '%@test.com'
);

-- Or delete test users
DELETE FROM users WHERE email LIKE '%@test.com';
```

---

## Support

If tests fail:
1. Check browser console for errors
2. Check network tab for failed requests
3. Check Supabase logs
4. Verify database migration applied
5. Verify RLS policies active
6. Check user roles correct
7. Verify test data exists

For help, refer to:
- `TEST_SCENARIOS.md` - Detailed scenarios
- `PAGINATION_GUIDE.md` - Pagination docs
- `BULK_ASSIGNMENT_SETUP.md` - Assignment docs
- `TROUBLESHOOTING.md` - Common issues
