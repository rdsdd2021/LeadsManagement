# Complete Testing Guide - Quick Reference

## 🚀 Start Here

### Prerequisites Checklist
- [ ] Dev server running (`npm run dev`)
- [ ] Database has 500+ leads
- [ ] At least 3 regular users exist
- [ ] 1 admin user available
- [ ] Browser DevTools open (F12)

### Quick 5-Minute Smoke Test

```
✓ Load page → Pagination visible
✓ Click Next → Page 2 loads
✓ Change to 50 per page → Works
✓ Click "Infinite Scroll" → Mode switches
✓ Scroll down → Auto-loads more
✓ Click "Bulk Assign" → Dialog opens
✓ Assign 10 leads → Success
✓ Login as user → See assigned leads
✓ No console errors → PASS
```

---

## 📋 5 Core Test Scenarios

### Scenario 1: Pagination Navigation (5 min)
**What to test:** Basic page navigation

**Steps:**
1. Open leads page
2. Click Next button (▶)
3. Click page number (e.g., 5)
4. Click Last button (⏭)
5. Click First button (⏮)

**Expected:**
- ✅ All buttons work
- ✅ Counter updates ("Showing X to Y of Z")
- ✅ Page numbers highlight correctly
- ✅ Both top and bottom controls work

**Pass Criteria:** Can navigate all pages without errors

---

### Scenario 2: Infinite Scroll (5 min)
**What to test:** Auto-loading functionality

**Steps:**
1. Click "Infinite Scroll" button
2. Scroll to bottom of page
3. Wait for "Loading more..."
4. Verify new data loads
5. Repeat 3-4 times
6. Scroll to end

**Expected:**
- ✅ Pagination disappears
- ✅ Loading indicator shows
- ✅ Data appends automatically
- ✅ "No more results" at end
- ✅ Can switch back to standard

**Pass Criteria:** Loads all data smoothly without errors

---

### Scenario 3: Bulk Assignment - Equal (10 min)
**What to test:** Equal distribution of leads

**Steps:**
1. Apply filter: Status = "new" (e.g., 300 results)
2. Click "Bulk Assign"
3. Enter count: 150
4. Click "Next"
5. Select "Equal distribution"
6. Select 3 users (Alice, Bob, Carol)
7. Verify preview: 50, 50, 50
8. Click "Assign Leads"
9. Logout and login as Alice
10. Verify she has exactly 50 leads

**Expected:**
- ✅ Dialog shows correct filtered count
- ✅ Preview calculates correctly
- ✅ Assignment completes
- ✅ Each user gets correct count
- ✅ Users see only their leads (RLS)

**Pass Criteria:** 150 leads distributed equally (50 each)

---

### Scenario 4: Bulk Assignment - Custom (10 min)
**What to test:** Custom distribution with validation

**Steps:**
1. Apply filter: Category = "Real Estate" (e.g., 200 results)
2. Click "Bulk Assign"
3. Enter count: 200
4. Click "Next"
5. Select "Custom count per user"
6. Select 4 users
7. Enter: 80, 60, 40, 20
8. Verify total: 200/200 ✓
9. Try invalid: 100, 60, 40, 20 (220 total)
10. Verify error shows and button disabled
11. Fix to valid counts
12. Click "Assign Leads"

**Expected:**
- ✅ Can enter custom counts
- ✅ Preview shows total
- ✅ Validation prevents over-assignment
- ✅ Error message clear
- ✅ Assignment succeeds with valid counts
- ✅ Each user gets exact count specified

**Pass Criteria:** 200 leads distributed as 80, 60, 40, 20

---

### Scenario 5: Filters + Pagination + Assignment (15 min)
**What to test:** Integration of all features

**Steps:**
1. Apply multiple filters:
   - Status: "new", "qualified"
   - Category: "Real Estate"
   - Region: "North"
2. Note filtered count (e.g., 150)
3. Change page size to 50
4. Navigate to page 2
5. Verify all leads match filters
6. Click "Bulk Assign"
7. Assign 100 leads to 2 users (50 each)
8. Verify assignment
9. Remove one filter
10. Verify pagination updates

**Expected:**
- ✅ Multiple filters work together
- ✅ Pagination respects filters
- ✅ Page size changes work
- ✅ Bulk assign uses filtered data
- ✅ Assigned leads match filters
- ✅ Filter changes reset pagination

**Pass Criteria:** All features work together seamlessly

---

## 🎯 Testing Matrix

| Feature | Standard Mode | Infinite Mode | With Filters | With Assignment |
|---------|--------------|---------------|--------------|-----------------|
| Page Navigation | ✓ Test | N/A | ✓ Test | ✓ Test |
| Page Size | ✓ Test | ✓ Test | ✓ Test | ✓ Test |
| Auto-Loading | N/A | ✓ Test | ✓ Test | ✓ Test |
| Selection | ✓ Test | ✓ Test | ✓ Test | ✓ Test |
| Equal Assign | ✓ Test | ✓ Test | ✓ Test | N/A |
| Custom Assign | ✓ Test | ✓ Test | ✓ Test | N/A |
| RLS | ✓ Test | ✓ Test | ✓ Test | ✓ Test |

---

## 📊 Performance Benchmarks

### Measure These (Open DevTools → Performance)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Initial Load | < 2s | Reload page, check Network tab |
| Page Navigation | < 500ms | Click next, check Performance tab |
| Infinite Load | < 1s | Scroll trigger, check Performance tab |
| Bulk Assign (500) | < 5s | Assign 500 leads, check time |
| Memory Usage | < 50MB | Load 1000 leads, check Memory tab |

### Quick Performance Test
```
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Perform action (e.g., click next page)
5. Stop recording
6. Check timing
```

---

## ✅ Pass/Fail Criteria

### Must Pass (Critical)
- [ ] Pagination navigation works
- [ ] Page size changes work
- [ ] Infinite scroll loads data
- [ ] Bulk assign completes
- [ ] Users see only their leads (RLS)
- [ ] No console errors
- [ ] No data loss

### Should Pass (Important)
- [ ] Mode toggle works
- [ ] Filters integrate correctly
- [ ] Selection works
- [ ] Validation prevents errors
- [ ] Performance acceptable
- [ ] UI responsive

### Nice to Have (Optional)
- [ ] Smooth animations
- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Keyboard navigation
- [ ] Mobile responsive

---

## 🐛 Common Issues & Solutions

### Issue: Pagination not showing
**Solution:** Check that total count > 0 and data loaded

### Issue: Infinite scroll not loading
**Solution:** 
- Check browser console for errors
- Verify IntersectionObserver supported
- Check network tab for failed requests

### Issue: Bulk assign fails
**Solution:**
- Verify RLS policies applied
- Check user has admin role
- Verify users exist in database

### Issue: Users see all leads
**Solution:**
- Verify RLS enabled: `ALTER TABLE leads ENABLE ROW LEVEL SECURITY;`
- Check policies created correctly
- Verify assigned_to column populated

### Issue: Performance slow
**Solution:**
- Check database indexes
- Reduce page size
- Check network latency
- Clear browser cache

---

## 📝 Test Report Template

```markdown
# Test Execution Report

**Date:** [Date]
**Tester:** [Name]
**Duration:** [X] minutes
**Browser:** Chrome/Firefox/Safari
**Environment:** Dev/Staging/Prod

## Summary
- ✅ Passed: X/5 scenarios
- ❌ Failed: Y/5 scenarios
- ⏸️ Blocked: Z/5 scenarios

## Scenario Results

### ✅ Scenario 1: Pagination Navigation
- Status: PASS
- Time: 5 min
- Notes: All buttons work correctly

### ✅ Scenario 2: Infinite Scroll
- Status: PASS
- Time: 5 min
- Notes: Smooth loading, no issues

### ✅ Scenario 3: Bulk Assignment - Equal
- Status: PASS
- Time: 10 min
- Notes: Distribution correct, RLS works

### ✅ Scenario 4: Bulk Assignment - Custom
- Status: PASS
- Time: 10 min
- Notes: Validation works, assignment accurate

### ✅ Scenario 5: Filters + Integration
- Status: PASS
- Time: 15 min
- Notes: All features work together

## Performance
- Initial Load: 1.2s ✅
- Page Nav: 320ms ✅
- Infinite: 680ms ✅
- Bulk Assign: 3.8s ✅
- Memory: +32MB ✅

## Issues Found
[None / List any issues]

## Recommendations
[Any suggestions for improvement]

## Conclusion
✅ All tests passed. System ready for production.
```

---

## 🔄 Regression Testing

After any code changes, run these quick checks:

### Quick Regression (5 min)
```
1. ✓ Page loads without errors
2. ✓ Pagination visible and works
3. ✓ Can change page size
4. ✓ Infinite scroll works
5. ✓ Bulk assign opens
6. ✓ Can assign leads
7. ✓ No console errors
```

### Full Regression (30 min)
- Run all 5 core scenarios
- Check performance benchmarks
- Verify no new issues
- Test edge cases

---

## 🎓 Testing Best Practices

### Before Testing
1. Clear browser cache
2. Open DevTools
3. Check database has test data
4. Have test users ready
5. Note starting state

### During Testing
1. Take screenshots of issues
2. Note exact steps to reproduce
3. Check console for errors
4. Monitor network requests
5. Watch for memory leaks

### After Testing
1. Document all issues
2. Create bug reports
3. Clean up test data
4. Share results with team
5. Update test documentation

---

## 📞 Getting Help

### If Tests Fail

1. **Check Console**
   - Open DevTools (F12)
   - Look for red errors
   - Note error messages

2. **Check Network**
   - Go to Network tab
   - Look for failed requests (red)
   - Check response codes

3. **Check Database**
   - Verify migration applied
   - Check RLS policies
   - Verify test data exists

4. **Check Documentation**
   - `TEST_SCENARIOS.md` - Detailed scenarios
   - `PAGINATION_GUIDE.md` - Pagination help
   - `BULK_ASSIGNMENT_SETUP.md` - Assignment help

5. **Ask for Help**
   - Provide error messages
   - Share screenshots
   - Describe steps taken
   - Include browser/environment info

---

## 🎉 Success Criteria

### System is Ready When:
- ✅ All 5 core scenarios pass
- ✅ Performance meets benchmarks
- ✅ No critical bugs
- ✅ RLS working correctly
- ✅ No console errors
- ✅ User acceptance positive

### Production Checklist:
- [ ] All tests passed
- [ ] Performance acceptable
- [ ] Security verified (RLS)
- [ ] Documentation complete
- [ ] Team trained
- [ ] Backup plan ready
- [ ] Monitoring in place

---

## 📚 Additional Resources

- **Detailed Scenarios:** `TEST_SCENARIOS.md`
- **Execution Guide:** `run-tests.md`
- **Pagination Docs:** `PAGINATION_GUIDE.md`
- **Assignment Docs:** `BULK_ASSIGNMENT_SETUP.md`
- **Visual Guide:** `PAGINATION_VISUAL_GUIDE.md`
- **Implementation:** `IMPLEMENTATION_CHECKLIST.md`

---

## 🚀 Ready to Test?

1. **Quick Test (5 min):** Run smoke test above
2. **Core Test (45 min):** Run 5 core scenarios
3. **Full Test (2 hours):** Run all scenarios in TEST_SCENARIOS.md
4. **Performance Test (30 min):** Run benchmarks
5. **Regression Test (30 min):** After any changes

**Start with the Quick Test, then move to Core Tests!**

Good luck! 🎯
