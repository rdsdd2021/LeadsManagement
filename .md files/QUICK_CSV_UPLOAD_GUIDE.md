# Quick CSV Upload Guide

## 🚀 Quick Start

### 1. Apply Database Migration
```bash
supabase db push
```

### 2. Access Import Page
Navigate to: `/import-leads`

### 3. Upload Process
1. **Select Bucket** → Choose your lead bucket
2. **Download Sample** → Click "Download Sample CSV" button
3. **Prepare Data** → Fill in your lead data
4. **Upload File** → Click "Choose File" and select your CSV
5. **Map Columns** → Review and adjust field mappings
6. **Preview** → Check first 5 rows
7. **Import** → Click "Import X Leads"

## 📋 Required CSV Columns

Must have these 5 columns:
- **Name** - Lead's full name
- **Phone Number** - Contact number
- **School** - School name
- **Gender** - Male, Female, Other, or Prefer not to say
- **District** - District/location

## 📝 Optional Columns

- Email
- Status
- Category
- Assigned to
- Assignment Date (format: YYYY-MM-DD)
- Any custom fields from your bucket

## 💡 Tips

✅ Use the "Download Sample CSV" button for the correct format
✅ Gender must be: Male, Female, Other, or Prefer not to say
✅ Dates should be in YYYY-MM-DD format (e.g., 2024-01-15)
✅ Additional columns will map to custom fields
✅ Preview your data before importing

## 🔍 Viewing Imported Leads

Navigate to the main page (`/`) to see your leads with these columns:
- Name
- Phone Number
- School
- Gender
- District
- Assigned To
- Assignment Date
- Bucket

## ❌ Common Errors

**"Missing required fields"**
→ Add all 5 mandatory columns to your CSV

**Gender validation error**
→ Use only: Male, Female, Other, Prefer not to say

**Date format error**
→ Use YYYY-MM-DD format

## 📁 Sample Files

- `sample-leads-template.csv` - Basic template in project root
- Download bucket-specific template from the upload page

## 🆘 Need Help?

See detailed guides:
- `CSV_UPLOAD_TEST_GUIDE.md` - Complete testing guide
- `CSV_UPLOAD_IMPLEMENTATION_SUMMARY.md` - Technical details
- `MANDATORY_FIELDS_UPDATE.md` - Field requirements
