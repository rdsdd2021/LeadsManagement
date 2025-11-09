# Clean Schema Summary

## ✅ Final Leads Table Schema

### User-Uploaded Fields (6 Mandatory + Custom)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | TEXT | ✅ | Lead's full name |
| `phone` | VARCHAR(20) | ✅ | Contact phone number |
| `school` | TEXT | ✅ | School name |
| `district` | TEXT | ✅ | District/location |
| `gender` | TEXT | ✅ | Male, Female, Other, Prefer not to say |
| `stream` | TEXT | ✅ | Stream/Course (Science, Commerce, etc.) |
| `custom_fields` | JSONB | ✅ | Bucket-specific custom fields |

### System Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `created_at` | TIMESTAMPTZ | Auto-generated timestamp |
| `updated_at` | TIMESTAMPTZ | Auto-updated timestamp |
| `created_by` | UUID | User who created the lead |
| `bucket_id` | UUID | Lead bucket/template reference |
| `assigned_to` | UUID | User assigned to this lead |
| `assignment_date` | DATE | When lead was assigned |

### Removed Fields ❌
- ~~status~~ - Not needed
- ~~category~~ - Not needed
- ~~region~~ - Not needed
- ~~email~~ - Not needed
- ~~value~~ - Not needed
- ~~priority~~ - Not needed
- ~~team~~ - Not needed

## Indexes

### Active Indexes
- `idx_leads_school` - School filtering
- `idx_leads_district` - District filtering
- `idx_leads_gender` - Gender filtering
- `idx_leads_stream` - Stream filtering
- `idx_leads_created_at` - Date sorting
- `idx_leads_assigned_to` - Assignment queries
- `idx_leads_bucket_id` - Bucket filtering
- `idx_leads_assignment_date` - Assignment date filtering
- `idx_leads_custom_fields` - GIN index for JSONB queries

### Removed Indexes ❌
- ~~idx_leads_status~~
- ~~idx_leads_category~~
- ~~idx_leads_region~~
- ~~idx_leads_status_category~~
- ~~idx_leads_team~~

## Filters Available

### Standard Filters (4)
1. **School** - Multi-select with counts
2. **District** - Multi-select with counts
3. **Gender** - Multi-select with counts
4. **Stream** - Multi-select with counts

### Dynamic Filters
5. **Custom Fields** - Based on bucket configuration

### Search
- Search across: name, phone

## CSV Upload Format

### Required Columns (6)
```csv
Name,Phone Number,School,District,Gender,Stream
John Doe,1234567890,Springfield HS,Springfield,Male,Science
```

### With Custom Fields
```csv
Name,Phone Number,School,District,Gender,Stream,Parent Name,Parent Phone
John Doe,1234567890,Springfield HS,Springfield,Male,Science,John Sr.,9876543210
```

## Data Flow

### Import
```
CSV Upload → Validation → Insert
{
  name: "John Doe",
  phone: "1234567890",
  school: "Springfield HS",
  district: "Springfield",
  gender: "Male",
  stream: "Science",
  custom_fields: { parent_name: "John Sr.", parent_phone: "9876543210" },
  bucket_id: "uuid",
  created_by: "user-uuid"
}
```

### Assignment
```
Admin Action → Update
{
  assigned_to: "user-uuid",
  assignment_date: "2024-01-15"
}
```

## Migration Applied

### What Changed
✅ Added `stream` column
✅ Removed `status`, `category`, `region`, `email`, `value`, `priority`, `team`
✅ Removed related indexes
✅ Added column comments
✅ Cleaned up schema

### Command
```bash
supabase db push
```

## Benefits

1. **Simpler Schema** - Only fields you actually use
2. **Better Performance** - Fewer indexes to maintain
3. **Clearer Purpose** - Each field has a clear role
4. **Easier Maintenance** - Less complexity
5. **Focused Filtering** - Only relevant filters
6. **Smaller Database** - Less storage per row

## TypeScript Types

### Lead Interface
```typescript
interface Lead {
  // System
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  bucket_id: string | null
  
  // User-uploaded (mandatory)
  name: string
  phone: string | null
  school: string | null
  district: string | null
  gender: string | null
  stream: string | null
  
  // User-uploaded (custom)
  custom_fields: Record<string, any>
  
  // Assignment
  assigned_to: string | null
  assignment_date: string | null
}
```

## Summary

✅ **Clean schema** - Only necessary fields
✅ **6 mandatory fields** - name, phone, school, district, gender, stream
✅ **Custom fields** - Flexible JSONB for bucket-specific data
✅ **4 filters** - school, district, gender, stream
✅ **Assignment tracking** - assigned_to, assignment_date
✅ **No bloat** - Removed unused fields
✅ **Type-safe** - Full TypeScript support
✅ **Performant** - Proper indexes only where needed

Ready for production! 🚀
