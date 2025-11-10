"use client";

/**
 * Modern Dashboard Example
 * This component demonstrates how to use the new modern UI components
 * Copy patterns from here to modernize other pages
 */

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { HoverCardEffect } from "@/components/ui/hover-card-effect";
import { LoadingCard, LoadingTable } from "@/components/ui/loading-card";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Plus,
  FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export function ModernDashboardExample() {
  const stats = [
    {
      title: "Total Leads",
      value: "2,543",
      description: "Active leads in system",
      icon: Users,
      trend: { value: 12.5, isPositive: true },
    },
    {
      title: "Conversion Rate",
      value: "24.8%",
      description: "Last 30 days",
      icon: TrendingUp,
      trend: { value: 3.2, isPositive: true },
    },
    {
      title: "Revenue",
      value: "$45.2K",
      description: "This month",
      icon: DollarSign,
      trend: { value: 8.1, isPositive: true },
    },
    {
      title: "Active Users",
      value: "127",
      description: "Online now",
      icon: Activity,
      trend: { value: 2.3, isPositive: false },
    },
  ];

  return (
    <Container>
      <Section>
        <PageHeader
          title="Dashboard"
          description="Welcome back! Here's what's happening with your leads today."
          icon={Activity}
          actions={
            <>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Export
              </Button>
              <ShimmerButton size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </ShimmerButton>
            </>
          }
        />

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index * 0.1} />
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
        
        <AnimatedList className="space-y-4">
          {[1, 2, 3].map((item) => (
            <AnimatedListItem key={item}>
              <HoverCardEffect>
                <AnimatedCard>
                  <AnimatedCard.Header>
                    <AnimatedCard.Title>Lead #{item}</AnimatedCard.Title>
                    <AnimatedCard.Description>
                      Updated 2 hours ago
                    </AnimatedCard.Description>
                  </AnimatedCard.Header>
                  <AnimatedCard.Content>
                    <p className="text-sm text-muted-foreground">
                      Sample lead information and activity details...
                    </p>
                  </AnimatedCard.Content>
                </AnimatedCard>
              </HoverCardEffect>
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </Section>

      <Section>
        <h2 className="text-2xl font-bold mb-6">Empty State Example</h2>
        <EmptyState
          icon={FileText}
          title="No leads found"
          description="Get started by importing your first batch of leads"
          action={{
            label: "Import Leads",
            onClick: () => toast.success("Navigation triggered!"),
          }}
        />
      </Section>

      <Section>
        <h2 className="text-2xl font-bold mb-6">Loading States</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <LoadingCard />
          <LoadingCard />
        </div>
        <div className="mt-6">
          <LoadingTable rows={3} />
        </div>
      </Section>
    </Container>
  );
}
