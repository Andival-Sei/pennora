import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Защищённые роуты — требуют авторизации
const protectedRoutes = [
  "/dashboard",
  "/budgets", // Защищаем все маршруты /budgets/[id]/*
];

// Публичные роуты для авторизации — редирект на dashboard если уже авторизован
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // Проверяем защищённые роуты
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Проверяем auth роуты
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Используем getSession() вместо getUser() для лучшей производительности
  // getSession() проверяет JWT локально без сетевого запроса к Supabase
  // Это намного быстрее для проверки авторизации (было ~100-200ms, стало ~5-10ms)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  // Проверка защищённых роутов
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Редирект авторизованных пользователей со страниц входа/регистрации
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Редирект с /dashboard/settings на /dashboard/settings/app
  // Но только если нет query параметра section=account (явный переход на настройки аккаунта)
  if (pathname === "/dashboard/settings" && user) {
    const section = request.nextUrl.searchParams.get("section");
    if (section !== "account") {
      return NextResponse.redirect(
        new URL("/dashboard/settings/app", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Применяем proxy ко всем путям кроме:
     * - _next/static (статические файлы)
     * - _next/image (оптимизация изображений)
     * - _next/webpack-hmr (Hot Module Replacement)
     * - favicon.ico, sitemap.xml, robots.txt
     * - файлы с расширениями (изображения, шрифты и т.д.)
     */
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
