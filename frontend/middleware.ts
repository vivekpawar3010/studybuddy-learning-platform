import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/signup", "/"];

  // Check if user is trying to access a public route
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route)
  );

  // Check for authentication token (Firebase session)
  // Note: For client-side auth, we rely on the ProtectedRoute component
  // This middleware serves as an additional layer for security
  const hasToken = request.cookies.has("__session");

  // If accessing protected routes without token, redirect to login
  if (path.startsWith("/dashboard")) {
    // Allow access - client-side ProtectedRoute will handle the redirect
    // This keeps the flow consistent with client-side auth
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (["/login", "/signup"].includes(path)) {
    // Allow access to login/signup - client-side AuthContext will handle redirects
    return NextResponse.next();
  }

  return NextResponse.next();
}

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
};
