"use server";

import { revalidatePath } from "next/cache";

/**
 * Инвалидирует кеш dashboard после создания счетов в онбординге
 */
export async function revalidateDashboard() {
  revalidatePath("/dashboard", "layout");
}
