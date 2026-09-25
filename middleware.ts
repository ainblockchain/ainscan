import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_NETWORK, NETWORK_COOKIE, NETWORK_PARAM, isNetwork } from '@/lib/network';

// A page load without ?network= uses the network remembered in the browser. Redirecting
// (rather than rendering the default and switching client-side) keeps server-rendered
// data and the URL on the same network. In-app navigations and prefetches (fetch
// requests) already carry the network in their links and are left alone; Next strips
// its RSC headers before middleware runs, so Sec-Fetch-Mode tells them apart.
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const fetchMode = request.headers.get('sec-fetch-mode');
  if (
    request.method !== 'GET'
    || url.searchParams.has(NETWORK_PARAM)
    || (fetchMode !== null && fetchMode !== 'navigate')
  ) {
    return NextResponse.next();
  }

  const remembered = request.cookies.get(NETWORK_COOKIE)?.value;
  if (!isNetwork(remembered) || remembered === DEFAULT_NETWORK) return NextResponse.next();

  const target = url.clone();
  target.searchParams.set(NETWORK_PARAM, remembered);
  return NextResponse.redirect(target, 307);
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico).*)'],
};
