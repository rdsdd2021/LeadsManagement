## 🔍 Import Debugging Guide

### Issue: Filter counts don't add up to 2500

**Expected:** All field counts should total 2500
**Actual:** Gender (692), District (351), etc.

---

## Step 1: Check Your CSV File

### Open your CSV in a text editor (NOT Excel)
Look at the raw format:

**Good CSV:**
```csv
Name,Phone Number,School,District,Gender,Stream
John Doe,1234567890,Springfield High,Springfield,Male,Science
Jane Smith,0987654321,Riverside Academy,Riverside,Female,Commerce
```

**Bad CSV (will cause issues):**
```csv
Name,Phone Number,School,District,Gender,Stream
John Doe,1234567890,Springfield High,Springfield,Male,Science,Extra,Column
Jane Smith,0987654321  // Missing columns!
```

### Check for:
1. ❓ Do all rows have the same number of columns?
2. ❓ Are there any completely empty rows?
3. ❓ Do any values contain commas? (should be quoted: "New York, NY")
4. ❓ Are all required fields present in every row?

---

## Step 2: Check Database

### Run this SQL in Supabase Dashboard:

```sql
-- Check actual data
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as name_filled,
  COUNT(CASE WHEN district IS NOT NULL AND district != '' THEN 1 END) as district_filled,
  COUNT(CASE WHEN gender IS NOT NULL AND gender != '' THEN 1 END) as gender_filled
FROM leads;
```

**Expected Result:**
```
total: 2500
name_filled: 2500
district_filled: 2500
gender_filled: 2500
```

**If you see less than 2500:** Data wasn't imported correctly

---

## Step 3: Check Import Job

```sql
SELECT 
  file_name,
  status,
  total_rows,
  success_count,
  failed_count,
  errors
FROM import_jobs
ORDER BY created_at DESC
LIMIT 1;
```

**Check:**
- ❓ success_count = 2500?
- ❓ failed_count = 0?
- ❓ Any errors in the errors column?

---

## Step 4: Check Edge Function Logs

```bash
supabase functions logs import-csv-leads --tail
```

Look for:
- ❌ Parsing errors
- ❌ Mapping errors
- ❌ Insert errors

---

## Step 5: Sample Data Check

```sql
-- Look at 10 random records
SELECT 
  name,
  phone,
  school,
  district,
  gender,
  stream
FROM leads
ORDER BY RANDOM()
LIMIT 10;
```

**Check:**
- ❓ Are all fields filled?
- ❓ Do values look correct?
- ❓ Any values in wrong columns?

---

## Common Issues & Solutions

### Issue 1: Column Misalignment

**Symptom:** Values in wrong columns (Gender in District, etc.)

**Cause:** CSV has inconsistent column counts

**Solution:**
1. Open CSV in text editor
2. Count commas in each row
3. Ensure all rows have same number of commas
4. Fix any rows with extra/missing columns

### Issue 2: Empty Values

**Symptom:** Many NULL values in database

**Causes:**
- CSV has empty cells
- Column mapping was wrong
- CSV parsing failed

**Solution:**
1. Check CSV for empty cells
2. Re-import with correct mapping
3. Verify edge function logs

### Issue 3: Quoted Values Not Handled

**Symptom:** Values with commas split into multiple columns

**Example:**
```csv
Name,District
John,"New York, NY"
```

Becomes:
```
Name: John
District: "New York
(extra column):  NY"
```

**Solution:** ✅ Already fixed in latest deployment!

### Issue 4: Wrong Column Mapping

**Symptom:** Data imported but in wrong fields

**Cause:** User selected wrong mapping in UI

**Solution:**
1. Delete imported data
2. Re-import
3. Carefully verify column mappings before confirming

---

## Step 6: Clean Import Test

### 1. Delete all leads:
```sql
DELETE FROM leads;
```

### 2. Create a test CSV with 10 rows:
```csv
Name,Phone Number,School,District,Gender,Stream
Test User 1,1111111111,Test School 1,Test District 1,Male,Science
Test User 2,2222222222,Test School 2,Test District 2,Female,Commerce
Test User 3,3333333333,Test School 3,Test District 3,Male,Arts
Test User 4,4444444444,Test School 4,Test District 4,Female,Science
Test User 5,5555555555,Test School 5,Test District 5,Male,Commerce
Test User 6,6666666666,Test School 6,Test District 6,Female,Arts
Test User 7,7777777777,Test School 7,Test District 7,Male,Science
Test User 8,8888888888,Test School 8,Test District 8,Female,Commerce
Test User 9,9999999999,Test School 9,Test District 9,Male,Arts
Test User 10,1010101010,Test School 10,Test District 10,Female,Science
```

### 3. Import this test file

### 4. Check counts:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT gender) as unique_genders,
  COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_count,
  COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_count
FROM leads;
```

**Expected:**
```
total: 10
unique_genders: 2
male_count: 5
female_count: 5
```

**If this works:** Your CSV file format is the issue
**If this fails:** There's a bug in the import process

---

## Step 7: Check Your Actual CSV

### Export first 10 rows to test:

1. Open your 2500-row CSV
2. Copy first 11 lines (header + 10 rows)
3. Save as `test_10_rows.csv`
4. Import this small file
5. Check if all 10 rows import correctly

**If 10 rows work but 2500 don't:**
- There might be bad data in later rows
- Try importing in chunks (rows 1-500, 501-1000, etc.)
- Find which chunk fails

---

## Step 8: Verify Column Mapping

When you upload CSV, the mapping screen should show:

**CSV Column → Lead Field**
```
Name          → Name *
Phone Number  → Phone Number *
School        → School *
District      → District *
Gender        → Gender *
Stream        → Stream *
```

**Check:**
- ❓ Are all required fields mapped?
- ❓ Is each CSV column mapped to correct field?
- ❓ Any columns mapped to wrong fields?

---

## Quick Fix Checklist

- [ ] CSV file has consistent columns (same number in each row)
- [ ] No empty rows in CSV
- [ ] All required fields present in every row
- [ ] Column mapping is correct
- [ ] Edge function deployed (latest version)
- [ ] Frontend updated (latest version)
- [ ] Test import with 10 rows works
- [ ] Database shows correct data after import

---

## If Still Not Working

### Share this information:

1. **First 5 lines of your CSV** (open in text editor, copy raw text)
2. **SQL query results** from Step 2
3. **Import job results** from Step 3
4. **Edge function logs** from Step 4
5. **Sample data** from Step 5

This will help identify the exact issue!

---

## Latest Fixes Applied

✅ **Frontend CSV Parser** - Fixed (just now)
✅ **Backend CSV Parser** - Fixed (5 mins ago)
✅ **Column Mapping** - Fixed (explicit switch statement)
✅ **Custom Fields** - Fixed (auto-mapping)

**Both parsers now handle:**
- Commas in quoted values
- Quotes in values
- Mixed quoted/unquoted fields
- Proper column alignment

---

## Next Steps

1. Run the SQL queries above
2. Share the results
3. Try the 10-row test import
4. Check your CSV file format

We'll figure this out! 🔍
