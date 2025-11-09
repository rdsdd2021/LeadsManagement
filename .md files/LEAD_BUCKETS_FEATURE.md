# Lead Buckets & Custom Fields System

## 🎯 Feature Overview

A comprehensive system for creating lead templates (buckets) with custom field schemas. This allows admins to define different types of leads with their own custom fields.

## 📊 System Architecture

### Database Tables:

1. **lead_buckets** - Lead templates/categories
   - id, name, description, icon, color
   - is_active, created_by, timestamps

2. **custom_fields** - Field definitions per bucket
   - id, bucket_id, name, label, field_type
   - options (for select fields)
   - is_required, default_value, placeholder
   - validation_rules, display_order

3. **leads** - Updated with bucket_id
   - bucket_id (foreign key to lead_buckets)
   - custom_fields (JSONB - stores actual values)

### Field Types Supported:
- text
- number
- date
- boolean
- select (dropdown)
- textarea
- email
- phone
- url

## 🚀 User Flow

### For Admins:

1. **Create Bucket**
   - Navigate to `/manage-buckets`
   - Click "New Bucket"
   - Enter name, description, icon, color
   - Save bucket

2. **Add Custom Fields**
   - Select a bucket
   - Click "Add Field"
   - Define field properties:
     - Label (display name)
     - Name (internal identifier)
     - Type (text, number, select, etc.)
     - Required/Optional
     - Options (for select type)
     - Validation rules
   - Set display order
   - Save field

3. **Manage Fields**
   - Edit existing fields
   - Delete fields
   - Reorder fields
   - Toggle required status

### For Users (CSV Import):

1. **Select Bucket**
   - Upload CSV file
   - Choose which bucket to import leads into
   - System loads bucket's custom fields

2. **Map Fields**
   - Standard fields (name, email, status, etc.)
   - Custom fields from selected bucket
   - Auto-mapping attempts to match column names
   - Manual adjustment available

3. **Import**
   - Preview data with bucket fields
   - Import leads into selected bucket
   - Custom field values stored in custom_fields JSON

## 📁 Files Created

### Database:
- `supabase/migrations/006_lead_buckets_and_templates.sql`
  - Creates lead_buckets table
  - Creates custom_fields table
  - Adds bucket_id to leads table
  - Sets up RLS policies
  - Creates default buckets with sample fields
  - Helper function: get_bucket_with_fields()

### Frontend:
- `app/manage-buckets/page.tsx`
  - Bucket management interface
  - Custom field management
  - Admin-only access

### Types:
- `types/lead.ts` (updated)
  - LeadBucket interface
  - CustomField interface
  - BucketWithFields interface
  - Updated CSVMapping interface

### Documentation:
- `LEAD_BUCKETS_FEATURE.md` (this file)

## 🎨 Default Buckets

The migration creates 4 default buckets:

### 1. General Leads
- Default bucket for all general leads
- Icon: Users
- Color: Blue (#3B82F6)
- No custom fields (uses standard fields only)

### 2. Real Estate
- For property and real estate leads
- Icon: Home
- Color: Green (#10B981)
- Custom Fields:
  - Property Type (select) - Required
  - Budget Range (text)
  - Location Preference (text)
  - Number of Bedrooms (number)
  - Expected Move-in Date (date)

### 3. SaaS/Software
- For software and SaaS product leads
- Icon: Code
- Color: Purple (#8B5CF6)
- Custom Fields:
  - Company Size (select) - Required
  - Industry (text)
  - Current Solution (text)
  - Monthly Budget (number)
  - Decision Timeline (select)

### 4. Events
- For event registration and attendee leads
- Icon: Calendar
- Color: Orange (#F59E0B)
- No custom fields yet (can be added)

## 🔧 Implementation Status

### ✅ Completed:
- Database schema and migrations
- TypeScript type definitions
- Bucket management page (basic UI)
- Default buckets with sample fields
- RLS policies for security

### 🚧 To Complete:
1. **Bucket CRUD Operations**
   - Create new bucket dialog
   - Edit bucket dialog
   - Delete bucket confirmation
   - Toggle active status

2. **Custom Field CRUD**
   - Add field dialog with all options
   - Edit field dialog
   - Delete field confirmation
   - Drag & drop reordering

3. **CSV Import Integration**
   - Bucket selection step
   - Load bucket fields for mapping
   - Map CSV columns to custom fields
   - Store bucket_id with imported leads

4. **Lead Display**
   - Show bucket name in lead list
   - Filter leads by bucket
   - Display custom field values
   - Edit custom field values

## 📝 Next Steps

### Step 1: Run the Migration
```bash
# In Supabase SQL Editor
# Copy and run: supabase/migrations/006_lead_buckets_and_templates.sql
```

### Step 2: Test Bucket Management
```bash
# Navigate to /manage-buckets
# View default buckets
# See custom fields for Real Estate and SaaS buckets
```

### Step 3: Complete CRUD Operations
- Add dialogs for creating/editing buckets
- Add dialogs for creating/editing custom fields
- Implement delete confirmations
- Add field reordering

### Step 4: Update CSV Import
- Add bucket selection dropdown
- Load selected bucket's fields
- Update mapping interface
- Save bucket_id with leads

### Step 5: Update Lead Display
- Show bucket badge in lead list
- Add bucket filter
- Display custom field values
- Allow editing custom fields

## 🎯 Use Cases

### Real Estate Agency:
```
Bucket: Real Estate Leads
Custom Fields:
- Property Type: Villa/Apartment/Plot
- Budget: 50L-1Cr
- Location: Whitefield, Bangalore
- Bedrooms: 3
- Move-in Date: June 2025
```

### SaaS Company:
```
Bucket: Enterprise Leads
Custom Fields:
- Company Size: 500+
- Industry: Healthcare
- Current Solution: Salesforce
- Monthly Budget: $5000
- Decision Timeline: 3-6 months
```

### Event Organizer:
```
Bucket: Conference Attendees
Custom Fields:
- Ticket Type: VIP/Regular
- Dietary Preferences: Vegetarian
- T-Shirt Size: L
- Workshop Interest: AI/ML
- Accommodation Needed: Yes
```

## 🔒 Security

### Role-Based Access:
- **Admin**: Full access to buckets and custom fields
- **Manager**: Can view buckets, import to buckets
- **Sales Rep**: Can view buckets, add leads to buckets
- **Viewer**: Can view buckets (read-only)

### RLS Policies:
- Everyone can view active buckets
- Only admins can create/edit/delete buckets
- Everyone can view custom fields of active buckets
- Only admins can manage custom fields

## 💡 Advanced Features (Future)

### Bucket Templates:
- Pre-built templates for common industries
- Import/export bucket configurations
- Clone existing buckets

### Field Validation:
- Regex patterns
- Min/max values
- Custom validation rules
- Conditional fields

### Field Dependencies:
- Show field B only if field A = X
- Required if another field has value
- Calculated fields

### Bucket Analytics:
- Leads per bucket
- Conversion rates by bucket
- Custom field value distribution
- Bucket performance metrics

## 🎉 Summary

The Lead Buckets system provides:
- ✅ Flexible lead schemas
- ✅ Custom fields per lead type
- ✅ Easy CSV import with field mapping
- ✅ Admin-friendly management interface
- ✅ Scalable architecture
- ✅ Secure with RLS policies

**Status**: Database and basic UI ready. CRUD operations and CSV integration pending.

**Next**: Run migration, test bucket management, complete CRUD dialogs.
