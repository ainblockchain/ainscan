import { NextRequest, NextResponse } from 'next/server';

import { rpcEndpoint, EXPLORER_RPC_METHODS } from '@/lib/rpc-config';
import { DEFAULT_NETWORK, isNetwork } from '@/lib/network';

let requestId = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params, network = DEFAULT_NETWORK } = body ?? {};

    if (!isNetwork(network)) {
      return NextResponse.json({ error: 'Unsupported network' }, { status: 400 });
    }
    if (typeof method !== 'string' || !EXPLORER_RPC_METHODS.has(method)) {
      return NextResponse.json({ error: 'Unsupported explorer read method' }, { status: 400 });
    }
    if (params !== undefined && (!params || typeof params !== 'object' || Array.isArray(params))) {
      return NextResponse.json({ error: 'params must be an object' }, { status: 400 });
    }

    const res = await fetch(rpcEndpoint(network), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++requestId,
        method,
        params: { ...params, protoVer: '1.0.0' },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'RPC upstream unavailable' },
      { status: 502 }
    );
  }
}
