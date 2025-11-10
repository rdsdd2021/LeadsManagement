"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { fadeIn, smoothTransition } from "@/lib/motion-variants";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={fadeIn.initial}
        animate={fadeIn.animate}
        exit={fadeIn.exit}
        transition={smoothTransition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
