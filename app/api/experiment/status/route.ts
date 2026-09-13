import { NextRequest, NextResponse } from 'next/server';
import { getExperimentSnapshot, recordExperimentStatus } from '@/lib/experiment-status';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(request: NextRequest): boolean {
  const expected = process.env.AINSCAN_EXPERIMENT_STATUS_TOKEN;
  if (!expected) return false;
  const received = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    || request.headers.get('x-ainscan-status-token');
  return received === expected;
}

export async function GET(request: NextRequest) {
  const snapshot = getExperimentSnapshot(request.nextUrl.searchParams.get('runId') || undefined);
  return NextResponse.json(snapshot || { status: 'waiting' }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const status = recordExperimentStatus(body);
    return NextResponse.json({ ok: true, runId: status.runId, nodeId: status.nodeId }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'invalid status' }, { status: 400 });
  }
}
