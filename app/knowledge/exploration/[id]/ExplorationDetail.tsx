'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { KnowledgeExploration, GraphData } from '@/lib/types';
import PasskeyAuth from '@/components/PasskeyAuth';
import { PasskeyAccount, signWithPasskey } from '@/lib/passkey';

const KnowledgeGraph = dynamic(() => import('@/components/KnowledgeGraph'), { ssr: false });

interface Props {
  nodeId: string;
  exploration: KnowledgeExploration | null;
  address: string;
  topicKey: string;
  entryId: string;
  graphData: GraphData;
}

export default function ExplorationDetail({ nodeId, exploration, address, topicKey, entryId, graphData }: Props) {
  const [account, setAccount] = useState<PasskeyAccount | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ txHash: string; currency: string } | null>(null);

  const isGated = exploration?.price && exploration?.gateway_url;
  const hasContent = exploration?.content || content;
  const topicPath = topicKey.replace(/_/g, '/');

  const handlePay = useCallback(async () => {
    if (!exploration?.gateway_url || !account) return;
    setPaying(true);
    setPayError(null);

    try {
      // Step 1: Request content (will get 402)
      const initialRes = await fetch('/api/x402', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayUrl: exploration.gateway_url }),
      });

      if (initialRes.status === 402) {
        const { paymentRequired } = await initialRes.json();
        if (!paymentRequired) throw new Error('No payment requirements received');

        // Step 2: Sign payment authorization with passkey
        const paymentData = JSON.stringify({
          scheme: 'ain-transfer',
          payTo: paymentRequired.payTo || paymentRequired.recipient,
          amount: paymentRequired.maxAmountRequired || paymentRequired.amount || exploration.price,
          from: account.address,
          timestamp: Date.now(),
        });

        const signed = await signWithPasskey(paymentData);
        if (!signed) throw new Error('Passkey signing was cancelled');

        // Step 3: Send payment proof
        const paymentPayload = btoa(JSON.stringify({
          scheme: 'ain-transfer',
          network: 'ain:local',
          from: account.address,
          to: paymentRequired.payTo || paymentRequired.recipient,
          amount: paymentRequired.maxAmountRequired || paymentRequired.amount,
          signature: signed.signature,
        }));

        const paidRes = await fetch('/api/x402', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gatewayUrl: exploration.gateway_url, paymentPayload }),
        });

        if (!paidRes.ok) throw new Error('Payment verification failed');
        const result = await paidRes.json();
        setContent(result.content);
        if (result.txHash) {
          setReceipt({ txHash: result.txHash, currency: result.currency || 'AIN' });
        }
      } else {
        // Content is freely accessible
        const result = await initialRes.json();
        setContent(result.content);
      }
    } catch (err: any) {
      setPayError(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  }, [exploration, account]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/knowledge/${encodeURIComponent(topicPath)}`} className="text-sm text-blue-600 hover:underline">
          &larr; Back to {topicPath}
        </Link>
        <PasskeyAuth onAccountChange={setAccount} />
      </div>

      {/* Exploration Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{exploration?.title || nodeId}</h1>
        {exploration && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-700">{exploration.summary}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500">Topic</div>
                <Link
                  href={`/knowledge/${encodeURIComponent(topicPath)}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {topicPath}
                </Link>
              </div>
              <div>
                <div className="text-xs text-gray-500">Explorer</div>
                <Link
                  href={`/accounts/${address}`}
                  className="text-sm text-blue-600 hover:underline font-mono"
                >
                  {address.slice(0, 10)}...
                </Link>
              </div>
              <div>
                <div className="text-xs text-gray-500">Depth</div>
                <div className="text-sm font-medium">{exploration.depth}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Price</div>
                {exploration.price ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {exploration.price} AIN
                  </span>
                ) : (
                  <span className="text-sm text-green-600">Free</span>
                )}
              </div>
            </div>
            {exploration.tags && (
              <div className="flex gap-2 flex-wrap">
                {exploration.tags.split(',').map((tag) => (
                  <span
                    key={tag.trim()}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-400">
              Created {exploration.created_at ? new Date(exploration.created_at).toLocaleString() : '—'}
              {exploration.updated_at && exploration.updated_at !== exploration.created_at && (
                <> &middot; Updated {new Date(exploration.updated_at).toLocaleString()}</>
              )}
            </div>
          </div>
        )}
        {!exploration && (
          <p className="mt-4 text-gray-500">Exploration data not found on-chain.</p>
        )}
      </div>

      {/* Content / Payment */}
      {exploration && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Content</h2>
          {hasContent ? (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded-lg">
                {content || exploration.content}
              </pre>
              {receipt && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <span className="text-green-700 font-medium">Payment successful</span>
                  <span className="text-green-600 ml-2">
                    Tx: {receipt.txHash?.slice(0, 16)}... ({receipt.currency})
                  </span>
                </div>
              )}
            </div>
          ) : isGated ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <div className="text-amber-800 font-medium mb-2">
                This content requires payment of {exploration.price} AIN
              </div>
              <p className="text-sm text-amber-600 mb-4">
                Connect your passkey wallet and pay to unlock the full content.
              </p>
              {account ? (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {paying ? 'Processing payment...' : `Pay ${exploration.price} AIN to unlock`}
                </button>
              ) : (
                <p className="text-sm text-gray-500">Connect a passkey above to make a payment</p>
              )}
              {payError && (
                <p className="mt-3 text-sm text-red-600">{payError}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No content available.</p>
          )}
        </div>
      )}

      {/* Neighborhood Graph */}
      {graphData.nodes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Graph Neighborhood</h2>
          <KnowledgeGraph data={graphData} height="400px" />
        </div>
      )}
    </div>
  );
}
