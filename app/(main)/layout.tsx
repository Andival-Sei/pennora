"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { QueryProvider } from "@/lib/query/provider";
import { SyncStatus } from "@/components/features/sync/SyncStatus";
import { useSyncStatusVisible } from "@/lib/hooks/useSync";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding");
  const isSyncStatusVisible = useSyncStatusVisible();

  // Не показываем навигацию на странице онбординга
  if (isOnboarding) {
    return (
      <ErrorBoundary>
        <QueryProvider>{children}</QueryProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryProvider>
        {/* Статус синхронизации в верхней части экрана */}
        <AnimatePresence>
          {isSyncStatusVisible && (
            <motion.div
              className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="container mx-auto px-4 py-2">
                <SyncStatus />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="pb-16">{children}</div>
        <BottomNav />
      </QueryProvider>
    </ErrorBoundary>
  );
}
