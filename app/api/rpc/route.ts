import { NextRequest, NextResponse } from 'next/server';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet-api.ainetwork.ai/json-rpc';

let requestId = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, params } = body;

    if (!method) {
      return NextResponse.json({ error: 'method required' }, { status: 400 });
    }

    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: ++requestId,
        method,
        params: { protoVer: '1.0.0', ...params },
      }),
    });

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error: any) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'RPC request failed' },
      { status: 500 }
    );
  }
}
