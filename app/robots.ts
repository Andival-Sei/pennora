import type { MetadataRoute } from "next";

// Базовый URL для robots.txt
const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://pennora.app";
};

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/budgets/", "/api/", "/demo/", "/callback/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
