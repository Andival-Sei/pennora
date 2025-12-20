"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { QueryProvider } from "@/lib/query/provider";

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
      <div className="pb-16">{children}</div>
      <BottomNav />
    </QueryProvider>
  );
}
