"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { fadeInUp, smoothTransition } from "@/lib/motion-variants";
import { ComponentProps } from "react";

interface AnimatedCardProps extends ComponentProps<typeof Card> {
  delay?: number;
}

export function AnimatedCard({ children, delay = 0, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      exit={fadeInUp.exit}
      transition={{ ...smoothTransition, delay }}
    >
      <Card {...props}>{children}</Card>
    </motion.div>
  );
}

AnimatedCard.Header = CardHeader;
AnimatedCard.Title = CardTitle;
AnimatedCard.Description = CardDescription;
AnimatedCard.Content = CardContent;
AnimatedCard.Footer = CardFooter;
