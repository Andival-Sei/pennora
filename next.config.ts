import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Отключаем ESLint при сборке для ускорения (линтинг выполняется отдельно)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Отключаем TypeScript проверку при сборке для ускорения (проверка выполняется отдельно)
  typescript: {
    ignoreBuildErrors: false, // Оставляем false для безопасности, но можно включить для dev
  },
  // Оптимизация производительности
  experimental: {
    // Используем оптимизированный SWC минификатор
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
