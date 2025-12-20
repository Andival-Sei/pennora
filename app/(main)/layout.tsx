"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { QueryProvider } from "@/lib/query/provider";
import { SyncStatus } from "@/components/features/sync/SyncStatus";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding");

  // Не показываем навигацию на странице онбординга
  if (isOnboarding) {
    return <QueryProvider>{children}</QueryProvider>;
  }

  return (
    <QueryProvider>
      {/* Статус синхронизации в верхней части экрана */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-2">
          <SyncStatus />
        </div>
      </div>
      <div className="pb-16">{children}</div>
      <BottomNav />
    </QueryProvider>
  );
}
