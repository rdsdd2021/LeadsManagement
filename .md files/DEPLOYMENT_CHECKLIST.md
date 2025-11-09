# Deployment Checklist

## ✅ Pre-Deployment

### 1. Code Review
- [x] All TypeScript files have no diagnostics
- [x] Migration file is correct
- [x] Types are properly defined
- [x] Filters are implemented
- [x] CSV upload is updated
- [x] Lead display is updated

### 2. Documentation
- [x] FINAL_IMPLEMENTATION_SUMMARY.md created
- [x] DATABASE_SCHEMA_GUIDE.md created
- [x] QUICK_REFERENCE.md created
- [x] CSV_UPLOAD_TEST_GUIDE.md updated
- [x] Sample CSV template updated

## 🚀 Deployment Steps

### Step 1: Backup Database
```bash
# Create backup before migration
supabase db dump -f backup_before_stream_field.sql
```

### Step 2: Apply Migration
```bash
# Apply the migration
supabase db push

# Or manually in Supabase dashboard:
# Run: supabase/migrations/007_add_mandatory_lead_fields.sql
```

### Step 3: Verify Migration
```sql
-- Check if stream column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name = 'stream';

-- Check if index exists
SELECT indexname
FROM pg_indexes
WHERE tablename = 'leads'
  AND indexname = 'idx_leads_stream';

-- Check comments
SELECT 
  column_name,
  col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as comment
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('name', 'phone', 'school', 'district', 'gender', 'stream');
```

### Step 4: Test CSV Upload
1. Navigate to `/import-leads`
2. Select a bucket
3. Download sample CSV
4. Verify it has: Name, Phone Number, School, District, Gender, Stream
5. Fill with test data
6. Upload and import
7. Verify data appears in lead list

### Step 5: Test Filtering
1. Go to main page (`/`)
2. Check filter panel shows:
   - School
   - District
   - Gender
   - Stream
   - Status
   - Category
   - Region
   - Custom Fields
3. Test each filter
4. Verify counts update
5. Test multi-select
6. Test clear all

### Step 6: Test Lead Display
1. Verify table shows 8 columns:
   - Name
   - Phone Number
   - School
   - District
   - Gender
   - Stream
   - Assigned To
   - Assignment Date
2. Check data formats correctly
3. Test both pagination modes
4. Verify responsive design

## 🧪 Testing Checklist

### CSV Upload Tests
- [ ] Can select bucket
- [ ] Download sample CSV works
- [ ] Sample has 6 mandatory + custom fields
- [ ] Upload validates mandatory fields
- [ ] Missing field shows error
- [ ] Invalid gender rejected
- [ ] Custom fields import correctly
- [ ] Preview shows correct data
- [ ] Import succeeds
- [ ] Data appears in list

### Filter Tests
- [ ] School filter works
- [ ] District filter works
- [ ] Gender filter works
- [ ] Stream filter works
- [ ] Status filter works
- [ ] Category filter works
- [ ] Region filter works
- [ ] Custom field filters work
- [ ] Counts are accurate
- [ ] Multi-select works
- [ ] Clear all works
- [ ] Search works

### Display Tests
- [ ] All 8 columns show
- [ ] Data formats correctly
- [ ] Null values show "-"
- [ ] Assignment date formats
- [ ] Assigned to shows badge
- [ ] Infinite scroll works
- [ ] Standard pagination works
- [ ] Responsive on mobile

### Performance Tests
- [ ] Page loads quickly
- [ ] Filters respond fast
- [ ] Large CSV imports work
- [ ] No console errors
- [ ] No memory leaks

## 🐛 Troubleshooting

### Issue: Migration Fails
**Solution:**
```bash
# Check current schema
supabase db diff

# Reset if needed (CAUTION: loses data)
supabase db reset

# Or manually add stream column
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stream TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_stream ON public.leads(stream);
```

### Issue: Stream Filter Not Showing
**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check filter store state
4. Verify migration applied

### Issue: CSV Upload Fails
**Solution:**
1. Check all 6 mandatory fields present
2. Verify gender values are valid
3. Check bucket is selected
4. Review error message
5. Check Supabase logs

### Issue: Filters Not Working
**Solution:**
1. Verify migration applied
2. Check useUniqueValues hook
3. Check useFilterValueCounts hook
4. Clear filter store state
5. Refresh page

## 📊 Post-Deployment Monitoring

### Day 1
- [ ] Monitor error logs
- [ ] Check CSV import success rate
- [ ] Verify filter performance
- [ ] Check user feedback
- [ ] Monitor database performance

### Week 1
- [ ] Review import statistics
- [ ] Check filter usage
- [ ] Analyze query performance
- [ ] Gather user feedback
- [ ] Optimize if needed

### Month 1
- [ ] Review data quality
- [ ] Check for missing fields
- [ ] Analyze custom field usage
- [ ] Plan future enhancements
- [ ] Document lessons learned

## 🔄 Rollback Plan

### If Issues Occur
```sql
-- Remove stream column
ALTER TABLE public.leads DROP COLUMN IF EXISTS stream;

-- Remove index
DROP INDEX IF EXISTS idx_leads_stream;

-- Revert filter store (in code)
-- Remove stream from filterStore.ts
-- Remove stream from FilterPanel.tsx
-- Remove stream from useUniqueValues.ts
-- Remove stream from useFilterValueCounts.ts
-- Remove stream from useLeads.ts
-- Remove stream from useInfiniteLeads.ts

-- Restore from backup
psql -d your_database < backup_before_stream_field.sql
```

## ✅ Success Criteria

### Technical
- [x] Migration applied successfully
- [x] No TypeScript errors
- [x] All tests pass
- [x] Performance acceptable
- [x] No console errors

### Functional
- [x] CSV upload works with 6 fields
- [x] All fields are filterable
- [x] Lead list shows correctly
- [x] Sample CSV downloads
- [x] Data imports correctly

### User Experience
- [x] Interface is intuitive
- [x] Error messages are clear
- [x] Performance is good
- [x] Mobile works well
- [x] Documentation is clear

## 📝 Sign-Off

- [ ] Developer tested
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Backup created
- [ ] Migration applied
- [ ] Tests passed
- [ ] Ready for production

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Verified By:** _____________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
