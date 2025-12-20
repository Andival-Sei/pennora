/**
 * Skeleton компонент для карточек балансов
 * Используется как fallback в Suspense boundary
 */

import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/motion";
import { Loader2 } from "lucide-react";

export function BalanceCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {[1, 2, 3].map((i) => (
        <FadeIn key={i} delay={0.1 * i}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ))}
    </div>
  );
}
