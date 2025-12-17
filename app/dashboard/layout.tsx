"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding");

  // Не показываем навигацию на странице онбординга
  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pb-16">{children}</div>
      <BottomNav />
    </>
  );
}
