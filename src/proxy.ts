import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  if (request.nextUrl.searchParams.has("code") && request.nextUrl.pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = "/auth/callback"
    return NextResponse.redirect(callbackUrl)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public routes
  const publicPaths = ["/", "/login", "/signup", "/auth/callback", "/manifest.json"]
  if (publicPaths.includes(pathname)) return supabaseResponse

  // Require auth for protected routes
  if (!user) {
    const loginUrl = new URL("/login", request.url)
    const nextPath = `${pathname}${request.nextUrl.search}`
    if (pathname !== "/login") {
      loginUrl.searchParams.set("next", nextPath)
    }
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|txt|xml)$).*)"],
}
