# Quick Reference Card

## 🚀 Most Used Components

### Layout
```tsx
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";

<Container>
  <Section>
    <PageHeader title="Page Title" description="Description" />
  </Section>
</Container>
```

### Cards
```tsx
import { AnimatedCard } from "@/components/ui/animated-card";

<AnimatedCard delay={0.1}>
  <AnimatedCard.Header>
    <AnimatedCard.Title>Title</AnimatedCard.Title>
  </AnimatedCard.Header>
  <AnimatedCard.Content>Content</AnimatedCard.Content>
</AnimatedCard>
```

### Stats
```tsx
import { StatCard } from "@/components/ui/stat-card";
import { Users } from "lucide-react";

<StatCard
  title="Total Users"
  value="1,234"
  icon={Users}
  trend={{ value: 12, isPositive: true }}
/>
```

### Tables
```tsx
import { DataTable } from "@/components/ui/data-table";

<DataTable
  data={items}
  columns={[
    { key: 'name', header: 'Name', render: (item) => item.name },
    { key: 'email', header: 'Email', render: (item) => item.email },
  ]}
  keyExtractor={(item) => item.id}
  selectable
  selectedIds={selected}
  onSelectionChange={setSelected}
/>
```

### Responsive Table
```tsx
import { ResponsiveTable } from "@/components/ui/responsive-table";

<ResponsiveTable
  data={items}
  columns={[
    { 
      key: 'name', 
      header: 'Name', 
      mobileLabel: 'Name',
      render: (item) => item.name 
    },
  ]}
  keyExtractor={(item) => item.id}
/>
```

### Loading States
```tsx
import { LoadingCard, LoadingTable } from "@/components/ui/loading-card";
import { Skeleton } from "@/components/ui/skeleton";

{isLoading ? <LoadingTable rows={5} /> : <Table />}
{isLoading ? <LoadingCard /> : <Card />}
<Skeleton className="h-4 w-full" />
```

### Empty States
```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

<EmptyState
  icon={FileText}
  title="No data"
  description="Get started by adding items"
  action={{ label: "Add Item", onClick: handleAdd }}
/>
```

### Info Cards
```tsx
import { InfoCard } from "@/components/ui/info-card";

<InfoCard variant="info">Information message</InfoCard>
<InfoCard variant="success">Success message</InfoCard>
<InfoCard variant="warning">Warning message</InfoCard>
<InfoCard variant="error">Error message</InfoCard>
```

### Buttons
```tsx
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";

<Button variant="default">Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<ShimmerButton>Primary CTA</ShimmerButton>
```

### Notifications
```tsx
import { toast } from "@/lib/toast";

toast.success("Success!", "Description");
toast.error("Error!", "Description");
toast.info("Info", "Description");
toast.warning("Warning", "Description");

const id = toast.loading("Processing...");
// Later: toast.dismiss(id);

toast.promise(fetchData(), {
  loading: "Loading...",
  success: "Done!",
  error: "Failed!"
});
```

### Animations
```tsx
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion-variants";

<motion.div
  initial={fadeInUp.initial}
  animate={fadeInUp.animate}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Lists
```tsx
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";

<AnimatedList>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      <Card>{item.name}</Card>
    </AnimatedListItem>
  ))}
</AnimatedList>
```

### Hover Effects
```tsx
import { HoverCardEffect } from "@/components/ui/hover-card-effect";

<HoverCardEffect scale={1.02} lift={true}>
  <Card>Hover me</Card>
</HoverCardEffect>
```

## 🎨 Common Patterns

### Grid Layouts
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Stats grid
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

// Auto-fit
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
```

### Flex Layouts
```tsx
// Stack mobile, row desktop
<div className="flex flex-col md:flex-row gap-4">

// Space between
<div className="flex items-center justify-between">

// Center
<div className="flex items-center justify-center">
```

### Spacing
```tsx
// Sections
<Section className="py-8 md:py-12">

// Cards
<Card className="p-4 md:p-6">

// Gaps
<div className="space-y-4"> // Vertical
<div className="space-x-4"> // Horizontal
<div className="gap-4"> // Grid/Flex
```

### Typography
```tsx
<h1 className="text-3xl font-bold tracking-tight">
<h2 className="text-2xl font-bold">
<p className="text-sm text-muted-foreground">
<span className="text-xs text-muted-foreground">
```

### Colors
```tsx
// Text
text-primary
text-secondary
text-muted-foreground
text-destructive

// Background
bg-background
bg-card
bg-muted
bg-primary

// Border
border-border
border-primary
```

### Utility Classes
```tsx
.glass // Glass morphism
.gradient-text // Gradient text
.hover-lift // Lift on hover
.focus-ring // Modern focus
```

## 📱 Responsive Breakpoints

```tsx
sm:  // 640px
md:  // 768px
lg:  // 1024px
xl:  // 1280px
2xl: // 1536px
```

## 🎭 Animation Variants

```tsx
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  staggerContainer,
  staggerItem,
  springTransition,
  smoothTransition,
} from "@/lib/motion-variants";
```

## 🔥 Quick Wins

1. Replace `alert()` → `toast.success()`
2. Replace `<Card>` → `<AnimatedCard>`
3. Add `<PageHeader>` to every page
4. Wrap pages in `<Container>`
5. Add loading states with `<LoadingTable>`
6. Add empty states with `<EmptyState>`
7. Use `<ShimmerButton>` for primary CTAs
8. Add `<HoverCardEffect>` to interactive cards

## 📚 Full Documentation

- `DESIGN_SYSTEM.md` - Complete component reference
- `MODERNIZATION_GUIDE.md` - Step-by-step migration guide
- `components/examples/ModernDashboardExample.tsx` - Working example

## 🎯 Common Imports

```tsx
// Layout
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHeader } from "@/components/layout/PageHeader";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { InfoCard } from "@/components/ui/info-card";

// Utils
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

// Icons
import { Users, Plus, Edit, Trash } from "lucide-react";
```
