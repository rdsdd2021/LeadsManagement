# Install CSV Upload Dependencies

To enable CSV upload functionality, you need to install two packages:

## Required Packages:

1. **papaparse** - CSV parsing library
2. **react-dropzone** - Drag & drop file upload

## Installation:

```bash
npm install papaparse react-dropzone
npm install --save-dev @types/papaparse
```

Or with yarn:

```bash
yarn add papaparse react-dropzone
yarn add -D @types/papaparse
```

## After Installation:

1. Restart your dev server: `npm run dev`
2. Navigate to `/import-leads` to test the CSV upload
3. Try uploading a sample CSV file

## Sample CSV Format:

Create a file called `sample-leads.csv`:

```csv
name,email,phone,status,category,region,value,priority
John Doe,john@example.com,+1234567890,new,IT Services,Mumbai,50000,3
Jane Smith,jane@example.com,+1234567891,contacted,Healthcare,Delhi,75000,4
Bob Johnson,bob@example.com,+1234567892,qualified,E-commerce,Bengaluru,100000,5
```

## Features:

- ✅ Drag & drop CSV upload
- ✅ Auto-mapping of columns
- ✅ Manual field mapping
- ✅ Preview before import
- ✅ Custom field support
- ✅ Batch import with error handling
- ✅ Role-based access (Admin & Manager only)

## Usage:

1. Go to `/import-leads`
2. Upload your CSV file
3. Map CSV columns to lead fields
4. Preview the data
5. Click "Import" to add leads to database

## Custom Fields:

Any CSV column can be mapped to a custom field. The data will be stored in the `custom_fields` JSONB column.

Example:
- CSV column: "Company Size"
- Map to: Custom Field
- Result: Stored as `custom_fields.company_size`
