import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function normalizePath(pathname: string): string {
  const m = pathname.match(/^\/_next\/data\/[^/]+(\/.*)\.json$/)
  return m ? m[1] : pathname
}

// Helper function to check if user has admin role
function isAdminRole(role: string): boolean {
  return ['ADMIN', 'GENERAL_MANAGER', 'MANAGER', 'CS', 'MD'].includes(role)
}

// Helper function to check if path matches pattern
function matchesPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const basePath = pattern.slice(0, -2)
    return path === basePath || path.startsWith(basePath + '/')
  }
  return path === pattern
}

export function middleware(req: NextRequest) {
  const rawPath = req.nextUrl.pathname
  const path = normalizePath(rawPath)
  const token = req.cookies.get('access_token')?.value
  const role = req.cookies.get('role')?.value
  const isAuthenticated = !!token && !!role

  // Define public routes (accessible without authentication)
  const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/products/*',
    '/market',
    '/service',
    '/contents',
    '/special',
    '/community', // View community posts
  ]

  // Define protected routes (require authentication)
  const protectedRoutes = [
    '/community/create',
    '/orders/*',
    '/my-page/*',
    '/cart',
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => matchesPattern(path, route))

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => matchesPattern(path, route))

  // Handle sign-in/sign-up pages - redirect if already logged in
  if (path === '/sign-in' || path === '/sign-up' || path === '/admin/sign-in') {
    if (isAuthenticated && role) {
      if (isAdminRole(role)) {
        return NextResponse.redirect(new URL('/admin/members', req.url))
      }
      if (role === 'USER') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    return NextResponse.next()
  }

  // Handle admin area - only admin roles can access; /admin/sign-in is public
  if (path.startsWith('/admin')) {
    const isAdminSignIn = path === '/admin/sign-in' || path.startsWith('/admin/sign-in/')
    if (isAdminSignIn) {
      return NextResponse.next()
    }
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/sign-in', req.url))
    }
    if (!isAdminRole(role!)) {
      return NextResponse.redirect(new URL('/admin/sign-in', req.url))
    }
    return NextResponse.next()
  }

  // Handle protected routes - require authentication
  if (isProtectedRoute) {
    if (!isAuthenticated) {
      // Redirect to sign-in with return URL
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('returnUrl', path)
      return NextResponse.redirect(signInUrl)
    }
    // Allow admin roles to access /community/create
    if (path === '/community/create') {
      // Both USER and admin roles can access community/create
      return NextResponse.next()
    }
    // Allow all authenticated users (USER and admin) to access /my-page/*
    if (path.startsWith('/my-page')) {
      // Both USER and admin roles can access my-page
      return NextResponse.next()
    }
    // Allow all authenticated users (USER and admin) to access /cart
    if (path === '/cart') {
      // Both USER and admin roles can access cart
      return NextResponse.next()
    }
    // Allow all authenticated users (USER and admin) to access /orders/*
    if (path.startsWith('/orders')) {
      // Both USER and admin roles can access orders
      return NextResponse.next()
    }
    // Only USER role can access other protected routes (admin should use admin panel)
    if (role !== 'USER') {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    return NextResponse.next()
  }

  // Handle public routes - allow everyone
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Default: allow access (for any other routes not explicitly defined)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|bmp|txt|xml|json|css|js|map|woff|woff2|ttf|otf)).*)',
  ],
}

