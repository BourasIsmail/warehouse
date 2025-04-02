import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check if the user is authenticated by looking for the token in cookies
  const token = request.cookies.get("keyrock_token")?.value

  // If the user is not authenticated and trying to access a protected route
  if (!token && !request.nextUrl.pathname.startsWith("/login")) {
    // Redirect to the login page
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the user is authenticated and trying to access the login page
  if (token && request.nextUrl.pathname.startsWith("/login")) {
    // Redirect to the home page
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

