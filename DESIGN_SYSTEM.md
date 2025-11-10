# Modern Design System Guide

This guide covers the new modern, responsive UI components built with shadcn/ui, Framer Motion, and Tailwind CSS.

## 🎨 Design Principles

1. **Responsive First** - Mobile to desktop, everything adapts
2. **Motion & Delight** - Subtle animations that enhance UX
3. **Accessibility** - WCAG compliant, keyboard navigable
4. **Consistency** - Unified spacing, colors, and patterns
5. **Performance** - Optimized animations and lazy loading

## 📦 Core Components

### Layout Components

#### Container
Responsive container with max-width constraints
```tsx
import { Container } from "@/components/layout/Container";

<Container size="xl"> {/* sm | md | lg | xl | full */}
  {children}
</Container>
```

#### Section
Animated section with scroll-triggered animations
```tsx
import { Section } from "@/components/layout/Section";

<Section animate={true} delay={0.2}>
  {children}
</Section>
```

#### PageHeader
Modern page header with icon, title, description, and actions
```tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { Users } from "lucide-react";

<PageHeader
  title="Dashboard"
  description="Welcome back!"
  icon={Users}
  actions={<Button>Action</Button>}
/>
```

### UI Components

#### AnimatedCard
Card with entrance animations
```tsx
import { AnimatedCard } from "@/components/ui/animated-card";

<AnimatedCard delay={0.1}>
  <AnimatedCard.Header>
    <AnimatedCard.Title>Title</AnimatedCard.Title>
    <AnimatedCard.Description>Description</AnimatedCard.Description>
  </AnimatedCard.Header>
  <AnimatedCard.Content>Content</AnimatedCard.Content>
</AnimatedCard>
```

#### StatCard
Dashboard stat card with trend indicators
```tsx
import { StatCard } from "@/components/ui/stat-card";
import { Users } from "lucide-react";

<StatCard
  title="Total Users"
  value="2,543"
  description="Active users"
  icon={Users}
  trend={{ value: 12.5, isPositive: true }}
  delay={0.1}
/>
```

#### AnimatedList
Staggered list animations
```tsx
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";

<AnimatedList>
  {items.map(item => (
    <AnimatedListItem key={item.id}>
      {item.content}
    </AnimatedListItem>
  ))}
</AnimatedList>
```

#### EmptyState
Beautiful empty states with actions
```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

<EmptyState
  icon={FileText}
  title="No data found"
  description="Get started by adding your first item"
  action={{
    label: "Add Item",
    onClick: handleAdd
  }}
/>
```

#### HoverCardEffect
Adds lift and scale on hover
```tsx
import { HoverCardEffect } from "@/components/ui/hover-card-effect";

<HoverCardEffect scale={1.02} lift={true}>
  <Card>Content</Card>
</HoverCardEffect>
```

#### ShimmerButton
Button with shimmer effect
```tsx
import { ShimmerButton } from "@/components/ui/shimmer-button";

<ShimmerButton shimmer={true}>
  Click Me
</ShimmerButton>
```

#### Loading States
```tsx
import { LoadingCard, LoadingTable } from "@/components/ui/loading-card";
import { Skeleton } from "@/components/ui/skeleton";

<LoadingCard />
<LoadingTable rows={5} />
<Skeleton className="h-4 w-full" />
```

## 🎭 Animations

### Motion Variants
Pre-built animation variants in `lib/motion-variants.ts`:

- `fadeIn` - Simple fade
- `fadeInUp` - Fade with upward motion
- `fadeInDown` - Fade with downward motion
- `scaleIn` - Scale from 95% to 100%
- `slideInRight` - Slide from right
- `slideInLeft` - Slide from left
- `staggerContainer` - Container for staggered children
- `staggerItem` - Item in staggered list

### Custom Animations
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

## 🎨 Utility Classes

### Custom Utilities (in globals.css)

- `.glass` - Glass morphism effect
- `.gradient-text` - Gradient text effect
- `.hover-lift` - Lift on hover (uses transition-all duration-300)
- `.focus-ring` - Modern focus ring

### Usage
```tsx
<div className="glass p-6 rounded-lg">
  <h2 className="gradient-text">Title</h2>
</div>
```

## 🔔 Notifications

### Toast System
```tsx
import { toast } from "@/lib/toast";

// Success
toast.success("Success!", "Operation completed");

// Error
toast.error("Error!", "Something went wrong");

// Info
toast.info("Info", "Here's some information");

// Warning
toast.warning("Warning", "Please be careful");

// Loading
const toastId = toast.loading("Processing...");

// Promise
toast.promise(
  fetchData(),
  {
    loading: "Loading...",
    success: "Success!",
    error: "Failed!"
  }
);
```

## 📱 Responsive Patterns

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Grid Patterns
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>

// Auto-fit grid
<div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>
```

### Mobile-First Approach
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
  <div>Left</div>
  <div>Right</div>
</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="block md:hidden">Mobile only</div>
```

## 🎯 Best Practices

1. **Use Container for page-level layouts**
2. **Wrap sections with Section for scroll animations**
3. **Add PageHeader to every page for consistency**
4. **Use AnimatedCard instead of plain Card**
5. **Implement loading states with LoadingCard/LoadingTable**
6. **Show EmptyState when no data**
7. **Use toast for user feedback**
8. **Apply HoverCardEffect to interactive cards**
9. **Use ShimmerButton for primary CTAs**
10. **Keep animations subtle (0.2-0.3s duration)**

## 📖 Example Page Structure

```tsx
"use client";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedCard } from "@/components/ui/animated-card";
import { StatCard } from "@/components/ui/stat-card";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  return (
    <Container>
      <Section>
        <PageHeader
          title="My Page"
          description="Page description"
          icon={Users}
          actions={<Button>Action</Button>}
        />

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Stat 1" value="100" icon={Users} />
          {/* More stats */}
        </div>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold mb-6">Content Section</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatedCard delay={0.1}>
            <AnimatedCard.Header>
              <AnimatedCard.Title>Card Title</AnimatedCard.Title>
            </AnimatedCard.Header>
            <AnimatedCard.Content>
              Card content
            </AnimatedCard.Content>
          </AnimatedCard>
        </div>
      </Section>
    </Container>
  );
}
```

## 🚀 Migration Guide

To modernize an existing page:

1. Wrap content in `<Container>`
2. Replace page title with `<PageHeader>`
3. Wrap sections in `<Section>`
4. Replace `<Card>` with `<AnimatedCard>`
5. Add loading states
6. Add empty states
7. Replace alerts with toast notifications
8. Add hover effects to interactive elements
9. Test responsive behavior
10. Add micro-interactions

See `components/examples/ModernDashboardExample.tsx` for a complete example.
