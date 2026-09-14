import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin passthrough for the node's REST reads (/recent_blocks_with_transactions, /get_value …).
 *
 * Paired with NEXT_PUBLIC_RPC_PROXY=1 in lib/rpc.ts: it lets the explorer read a node that sends no
 * CORS headers, which is the normal state of a private or test chain. Reads only — the node's write
 * endpoints are not reachable through here.
 */
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet-api.ainetwork.ai/json-rpc';
const REST_BASE = RPC_URL.replace(/\/json-rpc$/, '');

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path || []).map(encodeURIComponent).join('/');
  const query = request.nextUrl.search || '';
  try {
    const res = await fetch(`${REST_BASE}/${path}${query}`, { cache: 'no-store' });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return new NextResponse(text, { status: res.status, headers: { 'content-type': 'text/plain' } });
    }
  } catch (error: any) {
    return NextResponse.json({ error: String(error?.message ?? error) }, { status: 502 });
  }
}
