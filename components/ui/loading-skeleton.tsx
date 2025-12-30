"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

/**
 * Универсальный компонент skeleton для loading состояний
 */
export function LoadingSkeleton({
  className,
  width = "100%",
  height = "1rem",
  rounded = "md",
}: LoadingSkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-muted animate-pulse",
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
    />
  );
}
