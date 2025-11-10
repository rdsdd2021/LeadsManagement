"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HoverCardEffectProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  lift?: boolean;
}

export function HoverCardEffect({ 
  children, 
  className, 
  scale = 1.02,
  lift = true 
}: HoverCardEffectProps) {
  return (
    <motion.div
      whileHover={{ 
        scale,
        y: lift ? -4 : 0,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </motion.div>
  );
}
