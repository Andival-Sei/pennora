import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

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
  // Конфигурация webpack для исключения модулей из клиентского/серверного бандла
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Исключаем pdfjs-dist из серверного бандла, так как он использует браузерные API
      config.externals = config.externals || [];
      config.externals.push("pdfjs-dist");
    } else {
      // Исключаем eml-parser и html-pdf из клиентского бандла, так как они требуют Node.js модули
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        path: false,
        stream: false,
      };
      // Исключаем eml-parser и html-pdf из клиентского бандла
      config.externals = config.externals || [];
      config.externals.push("eml-parser");
      config.externals.push("html-pdf");

      // Добавляем плагин для игнорирования этих модулей в клиентском бандле
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(eml-parser|html-pdf)$/,
        })
      );
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

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

// Сначала применяем next-intl и bundle analyzer, затем Sentry
const configWithPlugins = withBundleAnalyzer(withNextIntl(nextConfig));

// Оборачиваем в withSentryConfig для интеграции Sentry
export default withSentryConfig(configWithPlugins, {
  // Организация и проект для загрузки source maps (опционально)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Только выводить логи загрузки source maps в CI
  silent: !process.env.CI,

  // Настройки для загрузки source maps
  widenClientFileUpload: true,
});
