# Quick Reference - Lead Management System

## 📋 Mandatory CSV Fields (6)
1. Name
2. Phone Number
3. School
4. District
5. Gender (Male/Female/Other/Prefer not to say)
6. Stream (Science/Commerce/Arts/etc.)

## 🔧 System-Managed Fields (NOT in CSV)
- Email, Status, Category, Region
- Value, Priority, Team
- Assigned To, Assignment Date

## 🎯 CSV Upload Steps
1. `/import-leads` → Select Bucket
2. Download Sample CSV
3. Fill Data
4. Upload File
5. Map Columns
6. Preview
7. Import

## 🔍 Available Filters (All Filterable)
- School
- District
- Gender
- Stream
- Status
- Category
- Region
- Custom Fields (per bucket)

## 📊 Lead List Columns (8)
1. Name
2. Phone Number
3. School
4. District
5. Gender
6. Stream
7. Assigned To
8. Assignment Date

## 🚀 Quick Deploy
```bash
# Apply migration
supabase db push

# Test at
/import-leads
```

## ✅ Validation Rules
- Gender: Male, Female, Other, Prefer not to say
- All 6 fields required in CSV
- Custom fields optional
- Phone: Any format accepted
- Stream: Any text accepted

## 📁 Key Files
- Migration: `supabase/migrations/007_add_mandatory_lead_fields.sql`
- Template: `sample-leads-template.csv`
- Upload: `components/csv-upload/CSVUpload.tsx`
- Filters: `components/filters/FilterPanel.tsx`
- Display: `app/page.tsx`

## 🎨 Sample CSV
```csv
Name,Phone Number,School,District,Gender,Stream
John Doe,1234567890,Springfield HS,Springfield,Male,Science
Jane Smith,0987654321,Riverside Academy,Riverside,Female,Commerce
```

## 🐛 Common Issues
**"Missing required fields"**
→ Add all 6 mandatory columns

**Gender validation error**
→ Use: Male, Female, Other, Prefer not to say

**Filters not working**
→ Apply migration, refresh page

**Custom fields not showing**
→ Check bucket has custom fields defined

## 📞 Support
1. Check `FINAL_IMPLEMENTATION_SUMMARY.md`
2. Review `CSV_UPLOAD_TEST_GUIDE.md`
3. Verify migration applied
4. Check Supabase logs
