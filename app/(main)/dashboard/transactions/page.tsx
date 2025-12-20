import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ResponsiveContainer } from "@/components/layout";
import { Receipt } from "lucide-react";
import { TransactionPageContent } from "@/components/features/transactions/TransactionPageContent";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  // Если пользователь не авторизован, редиректим на логин
  if (!user) {
    redirect("/login");
  }

  const t = await getTranslations("transactions");

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Receipt className="h-8 w-8 text-primary" />
          <h2 className="text-2xl sm:text-3xl font-bold">{t("title")}</h2>
        </div>
        <TransactionPageContent />
      </ResponsiveContainer>
    </main>
  );
}
