"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem, smoothTransition } from "@/lib/motion-variants";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      transition={smoothTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
