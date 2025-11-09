# CSV Upload Test Guide

## Overview
This guide helps you test the CSV upload functionality with the new mandatory fields.

## Prerequisites
1. Database migration `007_add_mandatory_lead_fields.sql` must be applied
2. User must be logged in as admin or manager
3. At least one active bucket must exist

## Test Steps

### 1. Apply Database Migration
```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase dashboard
# File: supabase/migrations/007_add_mandatory_lead_fields.sql
```

### 2. Access Import Page
- Navigate to `/import-leads`
- You should see the CSV upload interface

### 3. Select a Bucket
- Click on one of the available buckets
- The system will load custom fields for that bucket
- You should now see the upload interface

### 4. Download Sample CSV
- Click the "Download Sample CSV" button
- A CSV file will be downloaded with:
  - Mandatory columns: Name, Phone Number, School, Gender, District
  - Optional columns: Email, Status, Category, Assigned to, Assignment Date
  - Custom fields specific to the selected bucket
  - Sample data rows for reference

### 5. Prepare Your CSV File
You can use either:
- The downloaded sample CSV (modify the data as needed)
- The provided `sample-leads-template.csv` file
- Create your own CSV with the required columns

**Required Columns:**
- Name
- Phone Number
- School
- Gender (values: Male, Female, Other, Prefer not to say)
- District

**Optional Columns:**
- Email
- Status
- Category
- Assigned to
- Assignment Date (format: YYYY-MM-DD)
- Any custom fields from the bucket

### 6. Upload CSV File
- Click "Choose File" button
- Select your CSV file
- The system will parse the file and show the mapping interface

### 7. Map Columns
- Review the automatic column mapping
- The system tries to auto-map columns based on names
- Adjust mappings if needed:
  - Map CSV columns to standard lead fields
  - Map additional columns to custom fields
  - Skip columns you don't want to import
- Ensure all required fields are mapped (marked with *)

### 8. Preview Import
- Click "Preview Import"
- Review the first 5 rows of data
- Verify the mappings are correct
- Check data formatting

### 9. Import Data
- Click "Import X Leads" button
- Wait for the import to complete
- Review the results:
  - Number of successfully imported leads
  - Number of failed imports
  - Error messages for failed rows

### 10. Verify Data
- Navigate to the main leads page (`/`)
- Check that the imported leads appear in the list
- Verify the columns display correctly:
  - Name
  - Phone Number
  - School
  - Gender
  - District
  - Assigned To
  - Assignment Date
  - Bucket

## Common Issues and Solutions

### Issue 1: "Missing required fields" error
**Solution:** Ensure your CSV has all mandatory columns: Name, Phone Number, School, Gender, District

### Issue 2: Gender validation error
**Solution:** Gender values must be one of: Male, Female, Other, Prefer not to say

### Issue 3: Date format error
**Solution:** Use YYYY-MM-DD format for Assignment Date (e.g., 2024-01-15)

### Issue 4: Import fails with database error
**Solution:** 
1. Verify the migration has been applied
2. Check Supabase logs for specific errors
3. Ensure user has proper permissions

### Issue 5: Custom fields not showing
**Solution:**
1. Verify the bucket has custom fields defined
2. Check that custom fields are active
3. Reload the page and select the bucket again

## Sample CSV Files

### Basic Template (sample-leads-template.csv)
Located in the project root, contains:
- All mandatory fields
- Common optional fields
- 10 sample rows

### Download from UI
The "Download Sample CSV" button generates a CSV with:
- All mandatory fields
- Optional standard fields
- Custom fields specific to the selected bucket
- 2 sample rows with appropriate data types

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Can access import page as admin/manager
- [ ] Can select a bucket
- [ ] Download sample CSV button works
- [ ] Can upload a CSV file
- [ ] Column mapping interface appears
- [ ] Auto-mapping works for matching column names
- [ ] Can manually adjust mappings
- [ ] Required field validation works
- [ ] Preview shows correct data
- [ ] Import completes successfully
- [ ] Success/failure counts are accurate
- [ ] Error messages are helpful
- [ ] Imported leads appear in main list
- [ ] All columns display correctly
- [ ] Custom fields are stored properly
- [ ] Can import another file after completion

## Expected Behavior

### Successful Import
- All rows with valid data are imported
- Success count matches valid rows
- Leads appear in the main list immediately
- Custom fields are populated correctly
- Dates are formatted properly

### Partial Success
- Valid rows are imported
- Invalid rows are reported with specific errors
- Error messages indicate which row and what went wrong
- User can fix the CSV and re-import

### Complete Failure
- Clear error message explaining the issue
- No partial data is imported
- User can correct the issue and try again

## Notes
- The system supports CSV files up to 10MB
- Large imports may take several seconds
- The import process is sequential (one row at a time)
- Duplicate detection is not currently implemented
- All imported leads are assigned to the selected bucket
