"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface InfoCardProps {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
  icon?: boolean;
}

const variants = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
    icon: AlertTriangle,
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-400",
  },
};

export function InfoCard({
  children,
  variant = "info",
  className,
  icon = true,
}: InfoCardProps) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm",
        config.container,
        className
      )}
    >
      <div className="flex gap-3">
        {icon && <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", config.iconColor)} />}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
