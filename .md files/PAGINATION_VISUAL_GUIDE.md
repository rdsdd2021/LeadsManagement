# Pagination Visual Guide

## Standard Pagination Mode

### Top Controls (Primary Navigation)
```
┌────────────────────────────────────────────────────────────────────┐
│  Leads (3400)  [50 selected]    [∞ Infinite Scroll] [Bulk Assign] │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Showing 201 to 300 of 3400 results    Per page: [100 ▼]          │
│                                                                     │
│  [⏮] [◀] [1] [2] [3] ... [34] [▶] [⏭]                            │
│   │    │   │  │  │       │    │    │                              │
│   │    │   │  │  └─ Current page (highlighted)                    │
│   │    │   │  └─ Adjacent pages                                   │
│   │    │   └─ First page                                          │
│   │    └─ Previous page                                           │
│   └─ First page (jump)                                            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Page Number Display Logic

**When on Page 1-4:**
```
[1] [2] [3] [4] [5] [6] ... [34]
 ^
Current
```

**When on Page 15 (middle):**
```
[1] ... [14] [15] [16] ... [34]
             ^
          Current
```

**When on Page 31-34 (end):**
```
[1] ... [29] [30] [31] [32] [33] [34]
                                   ^
                                Current
```

### Per Page Selector
```
┌─────────────────┐
│ Per page: [100▼]│
└─────────────────┘
        │
        └─ Click to open
        
┌─────────────────┐
│ Per page: [100▼]│
├─────────────────┤
│ 10              │
│ 25              │
│ 50              │
│ 100         ✓   │ ← Current
│ 200             │
│ 500             │
└─────────────────┘
```

### Bottom Controls (Duplicate)
```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  [Table with 100 rows]                                             │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│  Showing 201 to 300 of 3400 results    Per page: [100 ▼]          │
│                                                                     │
│  [⏮] [◀] [1] [2] [3] ... [34] [▶] [⏭]                            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Infinite Scroll Mode

### Initial Load
```
┌────────────────────────────────────────────────────────────────────┐
│  Leads (3400)                    [≡ Standard Pages] [Bulk Assign]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ [✓] │ Lead 1   │ New      │ Real Estate │ $5000 │ Assigned │ │
│  │ [ ] │ Lead 2   │ New      │ Real Estate │ $3000 │ Assigned │ │
│  │ [ ] │ Lead 3   │ New      │ Real Estate │ $7000 │ Assigned │ │
│  │ ... (97 more rows)                                           │ │
│  │ [ ] │ Lead 100 │ New      │ Real Estate │ $4000 │ Assigned │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│                    ↓ Scroll down ↓                                 │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Loading More
```
┌────────────────────────────────────────────────────────────────────┐
│  ... (previous 100 rows)                                           │
│  [ ] │ Lead 100 │ New      │ Real Estate │ $4000 │ Assigned │     │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│                    ⟳ Loading more...                               │
│                                                                     │
│  ────────────────────────────────────────────────────────────────  │
│  [ ] │ Lead 101 │ New      │ Real Estate │ $6000 │ Assigned │     │
│  [ ] │ Lead 102 │ New      │ Real Estate │ $5500 │ Assigned │     │
│  ... (98 more rows loading)                                        │
│                                                                     │
│                    ↓ Keep scrolling ↓                              │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### End of Data
```
┌────────────────────────────────────────────────────────────────────┐
│  ... (all previous rows)                                           │
│  [ ] │ Lead 3398│ New      │ Real Estate │ $4200 │ Assigned │     │
│  [ ] │ Lead 3399│ New      │ Real Estate │ $3800 │ Assigned │     │
│  [ ] │ Lead 3400│ New      │ Real Estate │ $5100 │ Assigned │     │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│                      No more results                               │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Mode Toggle Button

### In Standard Mode
```
┌──────────────────────┐
│ ∞ Infinite Scroll    │  ← Click to switch
└──────────────────────┘
```

### In Infinite Mode
```
┌──────────────────────┐
│ ≡ Standard Pages     │  ← Click to switch back
└──────────────────────┘
```

## Button States

### Enabled Buttons
```
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│ ⏮  │  │ ◀  │  │  3  │  │ ▶  │
└─────┘  └─────┘  └─────┘  └─────┘
 Blue     Blue     Blue     Blue
 Hover    Hover    Hover    Hover
```

### Disabled Buttons (at boundaries)
```
┌─────┐  ┌─────┐              ┌─────┐  ┌─────┐
│ ⏮  │  │ ◀  │              │ ▶  │  │ ⏭  │
└─────┘  └─────┘              └─────┘  └─────┘
 Gray     Gray                 Gray     Gray
 No Hover No Hover             No Hover No Hover

(When on first page)          (When on last page)
```

### Active Page Button
```
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│  1  │  │  2  │  │  3  │  │  4  │
└─────┘  └─────┘  └─────┘  └─────┘
 White    White    Blue     White
 Border   Border   Solid    Border
                    ↑
                 Current
```

## Responsive Behavior

### Desktop (Wide Screen)
```
┌────────────────────────────────────────────────────────────────────┐
│  Showing 1 to 100 of 3400 | Per page: [100▼]                      │
│  [⏮] [◀] [1] [2] [3] [4] [5] [6] [7] ... [34] [▶] [⏭]           │
└────────────────────────────────────────────────────────────────────┘
```

### Tablet (Medium Screen)
```
┌──────────────────────────────────────────────────────────┐
│  Showing 1 to 100 of 3400 | Per page: [100▼]            │
│  [⏮] [◀] [1] [2] [3] ... [34] [▶] [⏭]                  │
└──────────────────────────────────────────────────────────┘
```

### Mobile (Small Screen)
```
┌────────────────────────────────────────┐
│  1 to 100 of 3400 | [100▼]             │
│  [⏮] [◀] [3] [▶] [⏭]                  │
└────────────────────────────────────────┘
```

## Loading States

### Standard Mode - Page Change
```
┌────────────────────────────────────────────────────────────────────┐
│  Leads (3400)                                                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                          ⟳                                         │
│                    Loading leads...                                │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Infinite Mode - Loading Next Page
```
┌────────────────────────────────────────────────────────────────────┐
│  ... (existing rows visible)                                       │
│  [ ] │ Lead 100 │ New      │ Real Estate │ $4000 │ Assigned │     │
│  ────────────────────────────────────────────────────────────────  │
│                                                                     │
│                    ⟳ Loading more...                               │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Empty States

### No Results
```
┌────────────────────────────────────────────────────────────────────┐
│  Leads (0)                                                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                  No leads found.                                   │
│              Try adjusting your filters.                           │
│                                                                     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## Interaction Flow

### Standard Mode Navigation
```
User on Page 1
     │
     ├─ Click [3] ──────────────────────────────┐
     │                                            │
     ├─ Click [▶] ──────────────────────────────┤
     │                                            │
     └─ Click [⏭] ──────────────────────────────┤
                                                  ↓
                                          Fetch Page Data
                                                  │
                                                  ↓
                                          Update Table
                                                  │
                                                  ↓
                                          Scroll to Top
```

### Infinite Scroll Flow
```
User scrolls down
     │
     ↓
Reaches bottom threshold (90%)
     │
     ↓
Trigger fetchNextPage()
     │
     ↓
Show "Loading more..."
     │
     ↓
Fetch next page data
     │
     ↓
Append to existing data
     │
     ↓
Hide loading indicator
     │
     ↓
User continues scrolling
```

## Color Scheme

### Standard Mode
- **Active Page**: Blue background (#3B82F6)
- **Inactive Pages**: White background, gray border
- **Hover**: Light blue background
- **Disabled**: Gray background, no hover

### Infinite Mode
- **Loading Text**: Gray (#6B7280)
- **Spinner**: Blue (#3B82F6)
- **End Message**: Light gray (#9CA3AF)

## Accessibility Features

### Keyboard Navigation
```
Tab       → Move to next button
Shift+Tab → Move to previous button
Enter     → Activate button
Space     → Activate button
```

### Screen Reader Announcements
```
"Showing 1 to 100 of 3400 results"
"Page 3 of 34"
"Loading more results"
"No more results available"
"First page button, disabled"
"Next page button"
```

## Animation & Transitions

### Page Change
```
Old content fades out (100ms)
     ↓
New content fades in (200ms)
     ↓
Smooth scroll to top (300ms)
```

### Infinite Scroll
```
Scroll reaches threshold
     ↓
Loading indicator appears (fade in 150ms)
     ↓
New rows appear (slide up 200ms)
     ↓
Loading indicator disappears (fade out 150ms)
```

## Summary

The pagination system provides:
- ✅ Clear visual hierarchy
- ✅ Intuitive controls
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Accessible interface
- ✅ Multiple interaction methods
- ✅ Clear loading states
- ✅ Helpful feedback
