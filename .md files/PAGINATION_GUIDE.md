# Pagination System - Complete Guide

## Overview

The leads management system now supports **two pagination modes**:

1. **Standard Pagination** - Traditional page-based navigation
2. **Infinite Scroll** - Automatic loading as you scroll

Users can toggle between modes with a single click, and their preference is saved.

## Features

### Standard Pagination Mode

#### Top Controls
- **Results Info**: "Showing 1 to 100 of 3400 results"
- **Per Page Selector**: Choose from 10, 25, 50, 100, 200, or 500 items
- **Page Navigation**:
  - First page button (⏮)
  - Previous page button (◀)
  - Page number buttons (1, 2, 3, ...)
  - Next page button (▶)
  - Last page button (⏭)

#### Smart Page Display
- Shows up to 7 page buttons
- Near start: 1, 2, 3, 4, 5, 6, ..., Last
- In middle: 1, ..., 5, 6, 7, ..., Last
- Near end: 1, ..., 95, 96, 97, 98, 99, 100

#### Duplicate Controls
- Pagination controls appear at **both top and bottom**
- Easy navigation without scrolling

### Infinite Scroll Mode

#### Auto-Loading
- Automatically loads more data as you scroll down
- No need to click "Next" or page numbers
- Smooth, continuous browsing experience

#### Loading Indicator
- Shows "Loading more..." with spinner when fetching
- Shows "Scroll for more" when idle
- Shows "No more results" when all data loaded

#### Performance
- Loads data in chunks (based on page size setting)
- Efficient memory usage
- Smooth scrolling

### Mode Toggle

#### Easy Switching
- Button in top-right corner
- **Standard Mode**: Shows "Infinite Scroll" button with ∞ icon
- **Infinite Mode**: Shows "Standard Pages" button with ≡ icon
- Preference saved in localStorage

## User Interface

### Standard Mode Layout
```
┌─────────────────────────────────────────────────────────┐
│ Leads (3400)  [∞ Infinite Scroll] [Bulk Assign]        │
├─────────────────────────────────────────────────────────┤
│ Showing 1 to 100 of 3400 | Per page: [100 ▼]           │
│ [⏮] [◀] [1] [2] [3] ... [34] [▶] [⏭]                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Table with 100 rows]                                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Showing 1 to 100 of 3400 | Per page: [100 ▼]           │
│ [⏮] [◀] [1] [2] [3] ... [34] [▶] [⏭]                  │
└─────────────────────────────────────────────────────────┘
```

### Infinite Mode Layout
```
┌─────────────────────────────────────────────────────────┐
│ Leads (3400)  [≡ Standard Pages] [Bulk Assign]         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Table with loaded rows]                               │
│  [Row 1]                                                │
│  [Row 2]                                                │
│  ...                                                     │
│  [Row 100]                                              │
│                                                          │
│  ⟳ Loading more...                                      │
│                                                          │
│  [Row 101]                                              │
│  [Row 102]                                              │
│  ...                                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Components Created

1. **Pagination.tsx** - Standard pagination controls
   - Page navigation buttons
   - Page size selector
   - Results counter
   - Smart page number display

2. **InfiniteScroll.tsx** - Infinite scroll container
   - Intersection Observer for auto-loading
   - Loading states
   - End-of-data indicator

3. **useInfiniteLeads.ts** - Hook for infinite scroll data
   - React Query infinite queries
   - Automatic page fetching
   - Data flattening

### State Management

#### Filter Store Updates
```typescript
interface FilterState {
  // ... existing filters
  page: number
  pageSize: number
  paginationMode: 'standard' | 'infinite'  // NEW
  
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setPaginationMode: (mode) => void  // NEW
}
```

#### Persisted Settings
- `pageSize`: User's preferred items per page
- `paginationMode`: User's preferred pagination mode
- Saved in localStorage
- Restored on page reload

### Data Flow

#### Standard Mode
```
User clicks page 2
  ↓
setPage(1) called
  ↓
useLeads hook detects change
  ↓
Fetches leads with offset 100, limit 100
  ↓
Table updates with new data
```

#### Infinite Mode
```
User scrolls to bottom
  ↓
IntersectionObserver triggers
  ↓
fetchNextPage() called
  ↓
useInfiniteLeads fetches next page
  ↓
New data appended to existing data
  ↓
Table grows with new rows
```

## Usage Examples

### Example 1: Browse with Standard Pagination
1. User lands on page (default: standard mode)
2. Sees first 100 leads
3. Clicks page 5
4. Sees leads 401-500
5. Changes per page to 50
6. Now sees leads 201-250 (page resets to 1)

### Example 2: Browse with Infinite Scroll
1. User clicks "Infinite Scroll" button
2. Sees first 100 leads
3. Scrolls down
4. Automatically loads next 100 (201-300)
5. Continues scrolling
6. Keeps loading until all 3400 shown

### Example 3: Filter with Pagination
1. User applies filter (Status = New)
2. Results: 500 leads
3. Page resets to 1
4. Sees first 100 of filtered results
5. Can navigate through 5 pages

### Example 4: Bulk Assign with Pagination
1. User on page 3 (leads 201-300)
2. Selects 50 leads on current page
3. Clicks "Bulk Assign"
4. Dialog shows "50 selected"
5. Assigns those specific 50 leads

## Performance Considerations

### Standard Mode
- **Memory**: Only current page in memory (~100 leads)
- **Network**: One request per page change
- **Best for**: Large datasets, precise navigation

### Infinite Mode
- **Memory**: All loaded pages in memory (grows)
- **Network**: Multiple requests as you scroll
- **Best for**: Browsing, continuous scrolling

### Optimization Tips

1. **Adjust Page Size**
   - Smaller (10-25): Faster initial load, more requests
   - Larger (200-500): Slower initial load, fewer requests
   - Default (100): Good balance

2. **Use Standard Mode for**
   - Jumping to specific pages
   - Large datasets (10,000+ records)
   - Precise navigation needs

3. **Use Infinite Mode for**
   - Casual browsing
   - Mobile devices
   - Continuous scrolling workflows

## Keyboard Shortcuts (Future Enhancement)

Potential shortcuts for standard mode:
- `←` Previous page
- `→` Next page
- `Home` First page
- `End` Last page
- `1-9` Jump to page

## Accessibility

### Standard Mode
- All buttons have proper ARIA labels
- Keyboard navigable
- Screen reader friendly
- Disabled state for unavailable actions

### Infinite Mode
- Loading states announced
- End of data announced
- Keyboard accessible (scroll with arrow keys)

## Browser Compatibility

- **Standard Mode**: All modern browsers
- **Infinite Mode**: Requires IntersectionObserver
  - Chrome 51+
  - Firefox 55+
  - Safari 12.1+
  - Edge 15+

## Troubleshooting

### Issue: Pagination not showing
**Solution**: Check that `count > 0` and data is loaded

### Issue: Infinite scroll not loading
**Solution**: 
- Check browser console for errors
- Verify IntersectionObserver support
- Check network tab for failed requests

### Issue: Page resets when filtering
**Solution**: This is intentional - filters reset to page 1

### Issue: Selection lost when changing pages
**Solution**: This is intentional - selection is page-specific

### Issue: Infinite scroll loads too fast
**Solution**: Increase page size in settings

### Issue: Standard pagination too slow
**Solution**: Increase page size or use infinite scroll

## Future Enhancements

### Planned Features
- [ ] Virtual scrolling for better performance
- [ ] Keyboard shortcuts
- [ ] Jump to page input
- [ ] Remember scroll position
- [ ] Prefetch next page
- [ ] Smooth scroll animations
- [ ] Mobile swipe gestures
- [ ] Export current page
- [ ] Bookmark specific pages

### Advanced Features
- [ ] Hybrid mode (infinite + page numbers)
- [ ] Lazy loading images
- [ ] Progressive loading
- [ ] Offline caching
- [ ] Background sync

## API Reference

### Pagination Component
```typescript
<Pagination
  currentPage={number}      // 0-indexed
  totalCount={number}       // Total items
  pageSize={number}         // Items per page
  onPageChange={(page) => void}
  onPageSizeChange={(size) => void}
/>
```

### InfiniteScroll Component
```typescript
<InfiniteScroll
  onLoadMore={() => void}   // Called when more data needed
  hasMore={boolean}         // More data available?
  loading={boolean}         // Currently loading?
>
  {children}
</InfiniteScroll>
```

### useInfiniteLeads Hook
```typescript
const {
  allLeads,              // Flattened array of all loaded leads
  totalCount,            // Total count from first page
  fetchNextPage,         // Function to load next page
  hasNextPage,           // More pages available?
  isFetchingNextPage,    // Loading next page?
  isLoading,             // Initial load?
  error,                 // Error if any
  refetch,               // Refetch all data
} = useInfiniteLeads()
```

## Testing Checklist

- [ ] Standard mode loads first page
- [ ] Can navigate to next/previous page
- [ ] Can jump to specific page
- [ ] Can change page size
- [ ] Page size persists on reload
- [ ] Infinite mode loads first page
- [ ] Scrolling triggers next page load
- [ ] Loading indicator shows
- [ ] End message shows when done
- [ ] Can toggle between modes
- [ ] Mode preference persists
- [ ] Filters reset pagination
- [ ] Selection works in both modes
- [ ] Bulk assign works in both modes
- [ ] Performance acceptable with large datasets

## Summary

The pagination system provides flexible, user-friendly navigation with two distinct modes. Standard pagination offers precise control and is memory-efficient, while infinite scroll provides a seamless browsing experience. Users can switch between modes based on their workflow, and their preference is remembered.
