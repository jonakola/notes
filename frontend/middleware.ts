import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;
  
  // Define all paths that require authentication (add your additional routes here)
  const privateRoutes = [
    '/dashboard', 
    '/notes',
    '/profile',
  ];
  
  // Check if current path is a private route
  const isPrivatePath = privateRoutes.some(route => path.startsWith(route));
  
  // Skip middleware for public routes
  if (!isPrivatePath) {
    return NextResponse.next();
  }
  
  // Get the token
  const token = request.cookies.get('accessToken')?.value;
  
  // Check if token exists
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  

  try {
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const expiry = tokenData.exp * 1000; 
    
    if (Date.now() > expiry) {
      // Clear the invalid token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('accessToken');
      return response;
    }
  } catch (error) {
    // If token can't be decoded, consider it invalid
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    return response;
  }
  
  return NextResponse.next();
}

// Update the matcher to include all protected routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/notes/:path*',
    '/profile/:path*',
  ],
};