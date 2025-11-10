"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp, smoothTransition } from "@/lib/motion-variants";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  delay = 0,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ ...smoothTransition, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className={cn("relative overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1 text-xs">
                  <span
                    className={cn(
                      "font-medium",
                      trend.isPositive ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-muted-foreground">vs last period</span>
                </div>
              )}
            </div>
            {Icon && (
              <div className="rounded-lg bg-primary/10 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
