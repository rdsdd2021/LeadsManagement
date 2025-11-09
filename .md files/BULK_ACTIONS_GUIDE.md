# Bulk Actions System - Complete Guide

## Overview

The new bulk actions system provides a flexible way to select leads and perform various operations on them. This replaces the previous single-purpose bulk assign button with a comprehensive action menu.

## Key Features

### 1. **Bulk Select Dialog**
- Select a specific number of leads from filtered results
- Quick select buttons (10, 50, 100, All)
- Visual preview of selection
- Respects current filters
- Selects leads in order (newest first)

### 2. **Bulk Actions Menu**
- Dropdown menu with multiple actions
- Shows selected count
- Disabled when no leads selected
- Extensible for future actions

### 3. **Available Actions**

#### ✅ Currently Implemented:
1. **Assign to Users** - Distribute leads to team members
2. **Delete Selected** - Remove leads permanently

#### 🔜 Ready for Implementation:
3. **Export Selected** - Download as CSV/Excel
4. **Send Email** - Bulk email to selected leads
5. **Add Tags** - Tag leads for organization
6. **Archive** - Move to archive

## User Workflow

### Scenario 1: Select Specific Count
```
1. User applies filters (e.g., Status = "new")
   → Filtered Results: 140 leads

2. Click "Select Leads" button
   → Dialog opens

3. Enter count: 50
   → Or use quick select buttons

4. Click "Select 50 Leads"
   → 50 leads selected (shown in header)

5. Click "Bulk Actions (50)" dropdown
   → Choose action (Assign, Delete, etc.)

6. Complete action
   → Selection cleared
```

### Scenario 2: Manual Selection + Bulk Select
```
1. User manually selects 10 leads using checkboxes
   → "10 selected" shown

2. Click "Select Leads" button
   → Dialog shows current selection: 10

3. Change to 100
   → Click "Select 100 Leads"

4. Now 100 leads selected
   → Perform bulk action
```

### Scenario 3: Manual Selection Only
```
1. User manually selects leads using checkboxes
   → "25 selected" shown

2. Click "Bulk Actions (25)" dropdown
   → Choose action

3. Action performed on 25 manually selected leads
```

## UI Components

### Bulk Select Dialog

**Location:** Top right, "Select Leads" button

**Features:**
- Input field for count
- Quick select buttons (10, 50, 100, All)
- Current status display
- Selection preview
- Validation (min 1, max filtered count)

**Visual:**
```
┌─────────────────────────────────────────┐
│ Select Leads for Bulk Action            │
├─────────────────────────────────────────┤
│                                          │
│ ℹ️ Current Status:                       │
│ • Total filtered leads: 140              │
│ • Currently selected: 10                 │
│                                          │
│ Number of Leads to Select:               │
│ [50                    ]                 │
│ Maximum: 140 leads                       │
│                                          │
│ Quick Select:                            │
│ [10] [50] [100] [All]                   │
│                                          │
│ ✓ 50 leads will be selected              │
│                                          │
│           [Cancel] [Select 50 Leads]     │
└─────────────────────────────────────────┘
```

### Bulk Actions Menu

**Location:** Top right, next to "Select Leads"

**Visual:**
```
┌─────────────────────────────────┐
│ Bulk Actions (50) ▼             │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ Actions for 50 leads             │
├─────────────────────────────────┤
│ 👤 Assign to Users               │
│ 📥 Export Selected               │
│ ✉️  Send Email                   │
│ 🏷️  Add Tags                     │
│ 📦 Archive                       │
├─────────────────────────────────┤
│ 🗑️  Delete Selected              │
└─────────────────────────────────┘
```

## Technical Implementation

### Components Created

1. **BulkSelectDialog.tsx**
   - Dialog for selecting lead count
   - Quick select buttons
   - Validation and preview

2. **BulkActionsMenu.tsx**
   - Dropdown menu component
   - Action items
   - Extensible structure

3. **dropdown-menu.tsx**
   - Radix UI dropdown wrapper
   - Styled components
   - Accessible

### Hooks Created

1. **useBulkDelete.ts**
   - Delete multiple leads
   - Loading state
   - Error handling

### State Management

```typescript
// Selection state
const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
const [bulkSelectedCount, setBulkSelectedCount] = useState(0)

// Dialog state
const [showBulkSelect, setShowBulkSelect] = useState(false)
const [showBulkAssign, setShowBulkAssign] = useState(false)

// Get total selected count
const getTotalSelectedCount = () => {
  if (bulkSelectedCount > 0) return bulkSelectedCount
  if (selectedLeads.size > 0) return selectedLeads.size
  return 0
}
```

### Selection Priority

1. **Bulk Selected Count** (from dialog) - Highest priority
2. **Manual Selection** (checkboxes) - Medium priority
3. **No Selection** - Actions disabled

## API Integration

### Bulk Delete

```typescript
// Delete selected leads
const { bulkDelete, loading } = useBulkDelete()

await bulkDelete(leadIds)
// Returns: number of deleted leads
```

### Bulk Assign

```typescript
// Assign leads to users
const { bulkAssign, loading } = useBulkAssign()

await bulkAssign(assignments, count, selectedIds)
// assignments: Array of {userId, count}
// count: Total leads to assign
// selectedIds: Optional array of specific lead IDs
```

## Adding New Actions

### Step 1: Add to BulkActionsMenu

```typescript
// In BulkActionsMenu.tsx
interface BulkActionsMenuProps {
  // ... existing props
  onExport?: () => void  // Add new action
}

// In menu items
{onExport && (
  <DropdownMenuItem onClick={onExport}>
    <Download className="mr-2 h-4 w-4" />
    Export Selected
  </DropdownMenuItem>
)}
```

### Step 2: Create Hook (if needed)

```typescript
// hooks/useBulkExport.ts
export function useBulkExport() {
  const [loading, setLoading] = useState(false)

  const bulkExport = async (leadIds: string[]) => {
    setLoading(true)
    try {
      // Export logic here
      // ...
    } finally {
      setLoading(false)
    }
  }

  return { bulkExport, loading }
}
```

### Step 3: Integrate in Page

```typescript
// In app/page.tsx
const { bulkExport, loading: exportLoading } = useBulkExport()

const handleBulkExport = async () => {
  const leadIds = /* get selected lead IDs */
  await bulkExport(leadIds)
  // Handle success/error
}

// Pass to menu
<BulkActionsMenu
  // ... existing props
  onExport={handleBulkExport}
/>
```

## Security Considerations

### Row-Level Security (RLS)

All bulk actions respect RLS policies:

```sql
-- Only admins can delete leads
CREATE POLICY "Admins can delete leads"
ON leads FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND users.role = 'admin'
  )
);
```

### Validation

1. **Count Validation**
   - Minimum: 1 lead
   - Maximum: Total filtered count
   - Real-time validation in dialog

2. **Permission Checks**
   - Only admins see bulk actions
   - Actions disabled for non-admins
   - Server-side permission verification

3. **Confirmation**
   - Destructive actions require confirmation
   - Clear messaging about impact
   - Cannot be undone warning

## Performance Optimization

### Efficient Queries

```typescript
// Delete in single query
await supabase
  .from('leads')
  .delete()
  .in('id', leadIds)

// Assign in batches
for (const assignment of assignments) {
  await supabase
    .from('leads')
    .update({ assigned_to: assignment.userId })
    .in('id', leadsToAssign)
}
```

### Caching

- React Query caching
- Invalidate on mutations
- Optimistic updates (future)

### Limits

- Max 10,000 leads per operation
- Configurable in hooks
- Prevents timeout issues

## User Experience

### Visual Feedback

1. **Selection Counter**
   - Shows in header: "50 selected"
   - Blue color for visibility
   - Updates in real-time

2. **Loading States**
   - Buttons disabled during operations
   - Loading spinners
   - Clear progress indication

3. **Success/Error Messages**
   - Alert on success
   - Error details on failure
   - Actionable error messages

### Accessibility

- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## Testing Checklist

### Bulk Select
- [ ] Dialog opens
- [ ] Can enter count
- [ ] Quick select buttons work
- [ ] Validation prevents invalid counts
- [ ] Preview shows correct count
- [ ] Selection applies correctly

### Bulk Actions Menu
- [ ] Menu opens
- [ ] Shows correct count
- [ ] Disabled when no selection
- [ ] All actions clickable
- [ ] Menu closes after action

### Bulk Delete
- [ ] Confirmation dialog shows
- [ ] Deletes correct count
- [ ] Table refreshes
- [ ] Selection clears
- [ ] Error handling works

### Bulk Assign
- [ ] Dialog opens with correct count
- [ ] Assignment works
- [ ] Distribution correct
- [ ] Table refreshes
- [ ] Selection clears

### Integration
- [ ] Works with filters
- [ ] Works with pagination
- [ ] Works with infinite scroll
- [ ] Manual + bulk selection
- [ ] Mode switching clears selection

## Future Enhancements

### Planned Features

1. **Export to CSV/Excel**
   - Download selected leads
   - Custom column selection
   - Format options

2. **Bulk Email**
   - Email templates
   - Variable substitution
   - Send tracking

3. **Tagging System**
   - Create/apply tags
   - Tag management
   - Filter by tags

4. **Archive**
   - Soft delete
   - Archive view
   - Restore functionality

5. **Bulk Edit**
   - Update fields
   - Batch operations
   - Preview changes

6. **Scheduling**
   - Schedule actions
   - Recurring operations
   - Automation rules

### Advanced Features

- **Undo/Redo** - Reverse recent actions
- **Action History** - Audit log
- **Batch Processing** - Large datasets
- **Progress Tracking** - Real-time progress
- **Webhooks** - External integrations

## Troubleshooting

### Issue: Selection not showing
**Solution:** Check that count > 0 and user is admin

### Issue: Actions disabled
**Solution:** Ensure leads are selected (manual or bulk)

### Issue: Delete fails
**Solution:** 
- Verify admin permissions
- Check RLS policies
- Check for foreign key constraints

### Issue: Selection clears unexpectedly
**Solution:** Selection clears on:
- Page change
- Filter change
- Mode switch
- After action completion

## Summary

The new bulk actions system provides:

✅ **Flexible Selection** - Multiple ways to select leads
✅ **Multiple Actions** - Extensible action menu
✅ **Great UX** - Clear feedback and validation
✅ **Secure** - RLS and permission checks
✅ **Performant** - Efficient queries
✅ **Extensible** - Easy to add new actions

The system is production-ready and designed for future growth!
