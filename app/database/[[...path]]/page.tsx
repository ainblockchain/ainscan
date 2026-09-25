'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import DatabaseTreeView from '@/components/DatabaseTreeView';
import Link from '@/components/NetworkLink';
import { useNetwork } from '@/components/NetworkProvider';
import { useSearchParams } from 'next/navigation';
import LayerSelector from '@/components/LayerSelector';
import type { Network } from '@/lib/network';

async function clientRpc(network: Network, layer: string, method: string, params: Record<string, any> = {}): Promise<any> {
  const res = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ network, method, params: { ...params, layer, is_final: true } }),
  });
  const json = await res.json();
  if (json.error) throw new Error(typeof json.error === 'string' ? json.error : json.error.message);
  const wrapper = json.result;
  if (wrapper && typeof wrapper === 'object' && 'code' in wrapper && wrapper.code !== 0 && wrapper.result == null) {
    throw new Error(wrapper.message || `RPC error code ${wrapper.code}`);
  }
  return wrapper && typeof wrapper === 'object' && 'result' in wrapper ? wrapper.result : wrapper;
}

type TabKey = 'value' | 'rule' | 'function' | 'owner';

const tabs: { key: TabKey; label: string; rpcType: string }[] = [
  { key: 'value', label: 'Value', rpcType: 'GET_VALUE' },
  { key: 'rule', label: 'Rule', rpcType: 'GET_RULE' },
  { key: 'function', label: 'Function', rpcType: 'GET_FUNCTION' },
  { key: 'owner', label: 'Owner', rpcType: 'GET_OWNER' },
];

export default function DatabasePage({
  params,
}: {
  params: { path?: string[] };
}) {
  const network = useNetwork();
  const layer = useSearchParams().get('layer') === 'L1' ? 'L1' : 'L2';
  const dbPath = '/' + (params.path || []).join('/');
  // Responses for a previous network/path must not land in the current view.
  const viewKey = useRef('');
  const pages = useRef<Record<string, { proof: string | null; cursor: string | null }>>({});
  const [activeTab, setActiveTab] = useState<TabKey>('value');
  const [data, setData] = useState<Record<TabKey, any>>({
    value: undefined,
    rule: undefined,
    function: undefined,
    owner: undefined,
  });
  const [loading, setLoading] = useState<Record<TabKey, boolean>>({
    value: true,
    rule: false,
    function: false,
    owner: false,
  });
  const [errors, setErrors] = useState<Record<TabKey, string | null>>({
    value: null,
    rule: null,
    function: null,
    owner: null,
  });

  const fetchTab = useCallback(
    async (tab: TabKey, more = false) => {
      const key = `${network}:${layer}:${dbPath}`;
      const current = () => viewKey.current === key;
      const rpcType = tabs.find((t) => t.key === tab)!.rpcType;
      setLoading((prev) => ({ ...prev, [tab]: true }));
      setErrors((prev) => ({ ...prev, [tab]: null }));
      try {
        const proofPath = '/' + ({ value: 'values', rule: 'rules', function: 'functions', owner: 'owners' }[tab]) + dbPath;
        const before = await clientRpc(network, layer, 'ain_getProofHash', { ref: proofPath });
        const previous = pages.current[tab];
        if (more && (!previous || previous.proof !== before)) throw Error('State changed while browsing. Refresh this view to load a consistent page.');
        let result = await clientRpc(network, layer, 'ain_get', { type: rpcType, ref: dbPath,
          is_partial: true, ...(more ? { last_end_label: previous.cursor } : {}) });
        const after = await clientRpc(network, layer, 'ain_getProofHash', { ref: proofPath });
        if (before !== after) throw Error('State changed during this read. Refresh to try again.');
        if (!current()) return;
        pages.current[tab] = { proof: after, cursor: result?.['#end_label'] || null };
        // Strip #state_ph placeholders from shallow results, keeping only key names
        if (result && typeof result === 'object') {
          const cleaned: Record<string, any> = {};
          for (const [key, val] of Object.entries(result)) {
            if (key.startsWith('#')) continue;
            if (typeof val === 'object' && val !== null && '#state_ph' in (val as any)) {
              cleaned[key] = { '...': '(click to expand)' };
            } else {
              cleaned[key] = val;
            }
          }
          result = cleaned;
        }
        if (!current()) return;
        setData((prev) => ({ ...prev, [tab]: more && result && typeof result === 'object' ? { ...prev[tab], ...result } : result }));
      } catch (err: any) {
        if (!current()) return;
        setErrors((prev) => ({
          ...prev,
          [tab]: err.message || 'Failed to fetch',
        }));
        setData((prev) => ({ ...prev, [tab]: null }));
      } finally {
        if (current()) setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [dbPath, network, layer],
  );

  useEffect(() => {
    viewKey.current = `${network}:${layer}:${dbPath}`;
    pages.current = {};
    setData({
      value: undefined,
      rule: undefined,
      function: undefined,
      owner: undefined,
    });
    setLoading({ value: false, rule: false, function: false, owner: false });
    setActiveTab('value');
    fetchTab('value');
  }, [dbPath, network, layer, fetchTab]);

  useEffect(() => {
    if (data[activeTab] === undefined && !loading[activeTab]) {
      fetchTab(activeTab);
    }
  }, [activeTab, data, loading, fetchTab]);

  // Build breadcrumbs
  const pathParts = dbPath.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, i) => ({
    label: part,
    path: pathParts.slice(0, i + 1).join('/'),
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{layer} Database Explorer</h1>
      <LayerSelector />
      <p className="text-sm text-gray-500">Latest committed {layer} state. Browse values, rules, functions and owners for any public app.</p>

      <nav className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
        {pathParts.length === 0 ? (
          <span className="font-medium text-gray-900">/</span>
        ) : (
          <Link href="/database" className="text-blue-600 hover:underline">
            /
          </Link>
        )}
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            <span>/</span>
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            ) : (
              <Link
                href={`/database/${crumb.path}`}
                className="text-blue-600 hover:underline"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex gap-4 px-4 pt-3 text-sm">
          <button className="text-blue-600" disabled={loading[activeTab]} onClick={() => fetchTab(activeTab)}>Refresh state</button>
          {pages.current[activeTab]?.cursor && <button className="text-blue-600" disabled={loading[activeTab]} onClick={() => fetchTab(activeTab, true)}>Load more entries</button>}
        </div>
        <div className="p-4 min-h-[200px]">
          {loading[activeTab] ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : errors[activeTab] ? (
            <p className="text-red-500 text-sm">{errors[activeTab]}</p>
          ) : (
            <DatabaseTreeView
              data={data[activeTab]}
              basePath={dbPath.replace(/^\//, '')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
