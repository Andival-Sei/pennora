"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Loading состояние для табов статистики
 */
export function StatisticsTabLoading() {
  return (
    <div className="space-y-6">
      {/* Карточки метрик skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <LoadingSkeleton width="80px" height="16px" className="mb-2" />
              <LoadingSkeleton width="120px" height="32px" className="mb-2" />
              <LoadingSkeleton width="100px" height="14px" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* График skeleton */}
      <Card>
        <CardHeader>
          <LoadingSkeleton width="150px" height="24px" />
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Загрузка графика...
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
