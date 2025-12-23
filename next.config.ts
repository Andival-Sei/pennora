import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Отключаем TypeScript проверку при сборке для ускорения (проверка выполняется отдельно)
  typescript: {
    ignoreBuildErrors: false, // Оставляем false для безопасности, но можно включить для dev
  },
  // Оптимизация производительности
  experimental: {
    // Используем оптимизированный SWC минификатор
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Конфигурация webpack для исключения pdfjs-dist из серверного бандла
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Исключаем pdfjs-dist из серверного бандла, так как он использует браузерные API
      config.externals = config.externals || [];
      config.externals.push("pdfjs-dist");
    }
    return config;
  },
  // Оптимизация изображений для Vercel
  images: {
    // Форматы изображений для оптимизации
    formats: ["image/avif", "image/webp"],
    // Минимальное время кеширования (в секундах)
    minimumCacheTTL: 60,
    // Разрешенные размеры изображений
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Security headers для Vercel
  async headers() {
    return [
      {
        // Применяем security headers ко всем маршрутам
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Кеширование для статических ресурсов
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Кеширование для изображений
        source: "/:path*\\.(jpg|jpeg|png|gif|webp|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Кеширование для шрифтов
        source: "/:path*\\.(woff|woff2|ttf|otf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
