import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // With localStorage-only auth, middleware is minimal
  // Redirects are handled client-side by protected route components
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
