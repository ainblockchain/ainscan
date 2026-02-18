import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { gatewayUrl, paymentPayload } = await request.json();
    if (!gatewayUrl) {
      return NextResponse.json({ error: 'gatewayUrl required' }, { status: 400 });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (paymentPayload) {
      headers['X-PAYMENT'] = paymentPayload;
    }

    const res = await fetch(gatewayUrl, { headers });

    if (res.status === 402) {
      const paymentRequired = res.headers.get('x-payment-required');
      return NextResponse.json({
        status: 402,
        paymentRequired: paymentRequired
          ? JSON.parse(Buffer.from(paymentRequired, 'base64').toString('utf-8'))
          : null,
      }, { status: 402 });
    }

    const content = await res.text();
    const txHash = res.headers.get('x-payment-tx-hash');
    const currency = res.headers.get('x-payment-currency');

    return NextResponse.json({
      content,
      txHash,
      currency,
    });
  } catch (error: any) {
    console.error('x402 proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
