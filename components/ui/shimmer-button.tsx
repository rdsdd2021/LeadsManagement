"use client";

import { motion } from "framer-motion";
import { Button } from "./button";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends ComponentProps<typeof Button> {
  shimmer?: boolean;
}

export function ShimmerButton({ 
  children, 
  className, 
  shimmer = true,
  ...props 
}: ShimmerButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        className={cn(
          shimmer && "relative overflow-hidden",
          shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}
