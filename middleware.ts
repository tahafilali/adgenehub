import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';

export function middleware(request: NextRequest) {
  // Completely disabled middleware - doing nothing
  return NextResponse.next();
}

// Keep the matcher configuration to satisfy Next.js requirements
export const config = {
  matcher: [],
}; 