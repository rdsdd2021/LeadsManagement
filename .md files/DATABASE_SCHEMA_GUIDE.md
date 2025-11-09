# Database Schema Guide - Leads Table

## Overview
The `leads` table has been optimized to separate user-uploaded fields from system-managed fields.

## Field Categories

### 1. Primary Fields (System)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `created_at` | TIMESTAMPTZ | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Auto-updated |
| `created_by` | UUID | User who created the lead |
| `bucket_id` | UUID | Lead bucket/template reference |

### 2. User-Uploaded Fields (CSV Import - Mandatory)
These are the **6 mandatory fields** users must provide in CSV:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | TEXT | ✅ Yes | Lead's full name |
| `phone` | VARCHAR(20) | ✅ Yes | Contact phone number |
| `school` | TEXT | ✅ Yes | School name |
| `district` | TEXT | ✅ Yes | District/location |
| `gender` | TEXT | ✅ Yes | Male, Female, Other, Prefer not to say |
| `stream` | TEXT | ✅ Yes | Stream/Course (Science, Commerce, etc.) |

**Constraints:**
- `gender` has CHECK constraint for valid values
- All fields are nullable in DB for backward compatibility
- CSV validation enforces these as required

### 3. User-Uploaded Custom Fields (CSV Import - Optional)
| Field | Type | Description |
|-------|------|-------------|
| `custom_fields` | JSONB | Bucket-specific custom fields from CSV |

**Example:**
```json
{
  "parent_name": "John Doe Sr.",
  "parent_phone": "9876543210",
  "previous_score": "85",
  "interested_in": "Engineering"
}
```

### 4. System-Managed Fields (NOT in CSV)
These fields are managed by the system, not uploaded by users:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `assigned_to` | UUID | NULL | User assigned to this lead |
| `assignment_date` | DATE | NULL | When lead was assigned |
| `status` | VARCHAR(50) | 'new' | Lead status |
| `category` | VARCHAR(100) | NULL | Lead category |
| `region` | VARCHAR(100) | NULL | Region |
| `email` | VARCHAR(255) | NULL | Email address |
| `value` | NUMERIC(10,2) | 0 | Lead value |
| `priority` | INTEGER | 0 | Priority level |
| `team` | TEXT | NULL | Team assignment |

**Note:** These fields exist for backward compatibility and future features but are NOT part of the CSV upload process.

## Indexes

### Standard Indexes
- `idx_leads_status` - Status filtering
- `idx_leads_category` - Category filtering
- `idx_leads_region` - Region filtering
- `idx_leads_created_at` - Date sorting
- `idx_leads_assigned_to` - Assignment queries
- `idx_leads_team` - Team filtering
- `idx_leads_bucket_id` - Bucket filtering

### New Mandatory Field Indexes
- `idx_leads_school` - School filtering
- `idx_leads_district` - District filtering
- `idx_leads_gender` - Gender filtering
- `idx_leads_stream` - Stream filtering
- `idx_leads_assignment_date` - Assignment date filtering

### Custom Field Indexes
- `idx_leads_custom_fields` - GIN index for JSONB queries
- `idx_leads_custom_source` - Custom field 'source'
- `idx_leads_custom_product` - Custom field 'product'

### Composite Indexes
- `idx_leads_status_category` - Combined status + category filtering

## Data Flow

### CSV Import Flow
```
User CSV Upload
    ↓
[name, phone, school, district, gender, stream, ...custom fields]
    ↓
Validation (6 mandatory fields required)
    ↓
Insert into leads table
    ↓
{
  name: "John Doe",
  phone: "1234567890",
  school: "Springfield HS",
  district: "Springfield",
  gender: "Male",
  stream: "Science",
  custom_fields: { /* bucket-specific */ },
  bucket_id: "uuid",
  created_by: "user-uuid",
  status: "new",  // default
  value: 0,       // default
  priority: 0     // default
}
```

### Assignment Flow
```
Admin/Manager assigns lead
    ↓
UPDATE leads SET
  assigned_to = 'user-uuid',
  assignment_date = CURRENT_DATE
WHERE id = 'lead-uuid'
```

## Constraints

### Foreign Keys
- `assigned_to` → `auth.users(id)` ON DELETE SET NULL
- `created_by` → `auth.users(id)` ON DELETE SET NULL
- `bucket_id` → `lead_buckets(id)` ON DELETE SET NULL

### Check Constraints
- `gender` must be one of: 'Male', 'Female', 'Other', 'Prefer not to say'

### Triggers
- `update_leads_updated_at` - Auto-updates `updated_at` on row modification

## Migration Strategy

### Current State
The table has all fields (old + new) for backward compatibility.

### Why Keep Old Fields?
1. **Backward Compatibility** - Existing data has status, category, etc.
2. **Future Features** - May want to use these fields later
3. **Gradual Migration** - Can migrate old data over time
4. **No Breaking Changes** - Existing queries still work

### Clean Migration (Optional Future)
If you want to remove unused fields later:

```sql
-- After ensuring no data uses these fields
ALTER TABLE public.leads
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS value,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS team,
DROP COLUMN IF EXISTS region;

-- Drop related indexes
DROP INDEX IF EXISTS idx_leads_team;
DROP INDEX IF EXISTS idx_leads_region;
```

## Query Examples

### Get All Leads with Filters
```sql
SELECT * FROM leads
WHERE school = 'Springfield HS'
  AND district = 'Springfield'
  AND gender = 'Male'
  AND stream = 'Science'
  AND bucket_id = 'bucket-uuid'
ORDER BY created_at DESC;
```

### Get Leads with Custom Field Filter
```sql
SELECT * FROM leads
WHERE custom_fields->>'parent_name' = 'John Doe Sr.'
  AND school = 'Springfield HS';
```

### Get Assigned Leads
```sql
SELECT * FROM leads
WHERE assigned_to = 'user-uuid'
  AND assignment_date >= '2024-01-01';
```

### Count by Gender and Stream
```sql
SELECT gender, stream, COUNT(*) as count
FROM leads
WHERE bucket_id = 'bucket-uuid'
GROUP BY gender, stream
ORDER BY count DESC;
```

## Best Practices

### For CSV Import
1. Always validate 6 mandatory fields before insert
2. Store bucket-specific fields in `custom_fields` JSONB
3. Set `bucket_id` to link to the template
4. Set `created_by` to track who imported
5. Let defaults handle `status`, `value`, `priority`

### For Filtering
1. Use indexed fields for WHERE clauses
2. Use GIN index for custom_fields queries
3. Combine filters efficiently (use composite indexes)
4. Cache unique values for filter dropdowns

### For Assignment
1. Set both `assigned_to` and `assignment_date` together
2. Use transactions for bulk assignments
3. Track assignment history if needed (separate table)

### For Performance
1. Use pagination (LIMIT/OFFSET or cursor-based)
2. Index frequently filtered fields
3. Use EXPLAIN ANALYZE to optimize queries
4. Consider partitioning for very large datasets

## Future Enhancements

### Potential Additions
1. **Lead History Table** - Track all changes
2. **Lead Notes Table** - Comments and interactions
3. **Lead Tags Table** - Flexible categorization
4. **Lead Scores Table** - Scoring/ranking system
5. **Lead Activities Table** - Track all activities

### Potential Optimizations
1. **Materialized Views** - For complex aggregations
2. **Partitioning** - By date or bucket_id
3. **Full-Text Search** - For name/school search
4. **Archived Leads** - Separate old/inactive leads

## Summary

✅ **User uploads:** 6 mandatory fields + custom fields
✅ **System manages:** Assignment, status, dates
✅ **Fully indexed:** All filterable fields
✅ **Backward compatible:** Old data still works
✅ **Flexible:** JSONB for bucket-specific fields
✅ **Performant:** Proper indexes and constraints
