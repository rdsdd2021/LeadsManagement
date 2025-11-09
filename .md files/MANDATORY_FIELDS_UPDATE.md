# Mandatory Fields Update

## Summary
Updated the lead management system to enforce mandatory fields for CSV imports and display new columns in the lead list.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/007_add_mandatory_lead_fields.sql`
- Added new columns to `leads` table:
  - `school` (TEXT)
  - `gender` (TEXT with CHECK constraint)
  - `district` (TEXT)
  - `assignment_date` (DATE)
- Created indexes for better query performance
- Added column comments for documentation

### 2. Type Definitions
**Files Updated:**
- `types/lead.ts`
- `hooks/useLeads.ts`
- `hooks/useInfiniteLeads.ts`

Added new fields to Lead interface:
- `school: string | null`
- `gender: string | null`
- `district: string | null`
- `assignment_date: string | null`

### 3. CSV Upload Component
**File:** `components/csv-upload/CSVUpload.tsx`

**Mandatory Fields for CSV Import:**
- Name *
- Phone Number *
- School *
- Gender *
- District *

**Optional Fields:**
- Assigned to
- Assignment Date
- Email
- Status
- Category
- Region
- Value
- Priority
- Team

**Features:**
- Updated field validation to require the 5 mandatory fields
- Added date parsing for `assignment_date` field
- Updated help text to clarify required columns
- Additional CSV columns can be mapped to custom fields based on selected bucket

### 4. Lead List Page
**File:** `app/page.tsx`

**Columns Displayed:**
1. Name
2. Phone Number
3. School
4. Gender
5. District
6. Assigned To
7. Assignment Date (formatted as locale date)
8. Bucket (shows badge if bucket is assigned)

## How to Apply

1. **Run the migration:**
   ```bash
   # Apply the migration to your Supabase database
   supabase db push
   ```
   Or manually run the SQL in `supabase/migrations/007_add_mandatory_lead_fields.sql`

2. **Test CSV Upload:**
   - Prepare a CSV file with the mandatory columns: Name, Phone Number, School, Gender, District
   - Upload through the CSV upload interface
   - Map any additional columns to custom fields

3. **Verify Lead List:**
   - Check that all new columns are displayed correctly
   - Verify that assignment_date shows formatted dates
   - Confirm bucket badges appear for leads with buckets

## Notes
- Gender field has a CHECK constraint allowing: 'Male', 'Female', 'Other', 'Prefer not to say'
- Assignment Date is stored as DATE type and displayed in locale format
- Bucket column shows a badge if the lead is assigned to a bucket
- All new fields are nullable to maintain backward compatibility with existing data
