# 📊 Column Mapping Feature - User Guide

## Overview

The column mapping feature allows you to map your CSV columns to the lead fields in the system. This is especially useful when your CSV headers don't exactly match the required field names.

---

## 🎯 How It Works

### Step 1: Upload Your CSV
- Drag and drop or click to browse
- System reads the CSV file

### Step 2: Preview Your Data
You'll see a preview table showing:
- All column headers from your CSV
- First 5 rows of data
- This helps you verify the data before importing

### Step 3: Map Columns
For each CSV column, you can:
- **Auto-mapped:** System tries to map automatically
- **Adjust:** Change the mapping using dropdown
- **Skip:** Select "-- Skip this column --" to ignore

### Step 4: Validate
- Required fields are marked with `*`
- System checks all required fields are mapped
- Shows error if any required field is missing

### Step 5: Import
- Click "Confirm and Import"
- System processes with your mappings
- Shows progress in real-time

---

## 📋 Required Fields

These fields MUST be mapped (marked with *):

1. **Name** - Lead's full name
2. **Phone Number** - Contact number
3. **School** - School name
4. **District** - District/Location
5. **Gender** - Male, Female, Other, Prefer not to say
6. **Stream** - Course/Stream (Science, Commerce, Arts, etc.)

---

## 🔄 Auto-Mapping Intelligence

The system automatically maps columns based on header names:

| CSV Header | Auto-Maps To |
|------------|--------------|
| name, full_name, student_name | Name |
| phone, mobile, contact, phone_number | Phone Number |
| school, school_name, institution | School |
| district, location, area | District |
| gender, sex | Gender |
| stream, course, branch, subject | Stream |

**Note:** Auto-mapping is case-insensitive and handles variations

---

## 🎨 Example Mapping

### Your CSV Headers:
```
Student Name, Mobile, Institution, Area, Sex, Course, Parent Name, Email
```

### Auto-Mapped To:
```
Student Name     → Name *
Mobile           → Phone Number *
Institution      → School *
Area             → District *
Sex              → Gender *
Course           → Stream *
Parent Name      → (Skip or custom field)
Email            → (Skip or custom field)
```

---

## 🛠️ Custom Fields

If your bucket has custom fields defined:
- They appear in the dropdown
- You can map CSV columns to them
- They're stored in the `custom_fields` JSON column

**Example:**
```
Bucket: Seminar
Custom Fields: Parent Name, Email, Class

Your CSV:
Parent Name → Parent Name (custom field)
Email       → Email (custom field)
Class       → Class (custom field)
```

---

## ✅ Validation Rules

### Before Import:
1. ✅ All required fields must be mapped
2. ✅ Each lead field can only be mapped once
3. ✅ CSV columns can be skipped
4. ✅ Custom fields are optional

### Error Messages:
- "Missing required fields: Name, Phone Number" - Map these fields
- "Please select a CSV file" - Upload a file first
- "File size must be less than 10MB" - File too large

---

## 💡 Tips & Best Practices

### 1. Use Sample CSV
- Download sample CSV from the upload page
- Use it as a template
- Headers will match exactly

### 2. Prepare Your CSV
- Use clear, descriptive headers
- Avoid special characters in headers
- Keep headers in first row

### 3. Check Preview
- Always review the preview table
- Verify data looks correct
- Check for any formatting issues

### 4. Adjust Mappings
- Auto-mapping is smart but not perfect
- Always review and adjust if needed
- Use "Skip" for unnecessary columns

### 5. Required Fields First
- Ensure all required fields (*) are mapped
- System won't proceed without them
- Error message will tell you what's missing

---

## 🔍 Common Scenarios

### Scenario 1: Exact Match
```
CSV Headers: Name, Phone Number, School, District, Gender, Stream
Result: ✅ All auto-mapped correctly
Action: Just click "Confirm and Import"
```

### Scenario 2: Different Names
```
CSV Headers: Student, Mobile, Institution, Location, Sex, Course
Result: ⚠️ May need adjustment
Action: Review and adjust mappings
```

### Scenario 3: Extra Columns
```
CSV Headers: Name, Phone, School, District, Gender, Stream, Email, Parent
Result: ✅ Required fields mapped, extras can be skipped or mapped to custom fields
Action: Map Email and Parent to custom fields or skip
```

### Scenario 4: Missing Columns
```
CSV Headers: Name, Phone, School
Result: ❌ Missing required fields
Action: Add missing columns to CSV or cancel import
```

---

## 📊 Preview Table

The preview table shows:

```
┌─────────────┬──────────────┬─────────────┬──────────┐
│ Name        │ Phone Number │ School      │ District │
├─────────────┼──────────────┼─────────────┼──────────┤
│ John Doe    │ 1234567890   │ Springfield │ Central  │
│ Jane Smith  │ 0987654321   │ Riverside   │ North    │
│ ...         │ ...          │ ...         │ ...      │
└─────────────┴──────────────┴─────────────┴──────────┘
```

**Shows:**
- First 5 rows only (for quick verification)
- All columns from your CSV
- Actual data values

---

## 🎯 Mapping Interface

```
CSV Column          →    Lead Field
─────────────────────────────────────────
[Student Name]      →    [Name *]
[Mobile]            →    [Phone Number *]
[Institution]       →    [School *]
[Area]              →    [District *]
[Sex]               →    [Gender *]
[Course]            →    [Stream *]
[Email]             →    [-- Skip this column --]
```

**Dropdown Options:**
- -- Skip this column --
- Name *
- Phone Number *
- School *
- District *
- Gender *
- Stream *
- (Custom fields if any)

---

## ⚡ Quick Start

1. **Upload CSV** - Drag and drop
2. **Check Preview** - Verify data
3. **Review Mappings** - Auto-mapped for you
4. **Adjust if Needed** - Use dropdowns
5. **Import** - Click confirm

**Time:** ~30 seconds for 2500 rows!

---

## 🐛 Troubleshooting

### Issue: "Missing required fields"
**Solution:** Map all fields marked with *

### Issue: "CSV file is empty"
**Solution:** Ensure CSV has data rows, not just headers

### Issue: "Failed to parse CSV"
**Solution:** Check CSV format, ensure proper encoding (UTF-8)

### Issue: Auto-mapping incorrect
**Solution:** Manually adjust using dropdowns

### Issue: Can't find custom field
**Solution:** Add custom field to bucket first in Manage Buckets

---

## 📞 Need Help?

If you're stuck:
1. Check this guide
2. Download sample CSV for reference
3. Verify CSV format
4. Check browser console for errors

---

**Feature Status:** ✅ ACTIVE
**Version:** 2.0
**Last Updated:** November 9, 2025
