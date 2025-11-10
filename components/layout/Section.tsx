"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion-variants";

interface SectionProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
}

export function Section({ children, className, animate = true, delay = 0 }: SectionProps) {
  if (!animate) {
    return <section className={cn("py-8 md:py-12", className)}>{children}</section>;
  }

  return (
    <motion.section
      initial={fadeInUp.initial}
      whileInView={fadeInUp.animate}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      className={cn("py-8 md:py-12", className)}
    >
      {children}
    </motion.section>
  );
}
