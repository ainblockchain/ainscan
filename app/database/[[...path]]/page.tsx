'use client';

import { useState, useEffect, useCallback } from 'react';
import DatabaseTreeView from '@/components/DatabaseTreeView';
import Link from 'next/link';

async function clientRpc(method: string, params: Record<string, any> = {}): Promise<any> {
  const res = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(typeof json.error === 'string' ? json.error : json.error.message);
  const wrapper = json.result;
  if (wrapper && typeof wrapper === 'object' && 'code' in wrapper && wrapper.code !== 0 && wrapper.result == null) {
    throw new Error(wrapper.message || `RPC error code ${wrapper.code}`);
  }
  return wrapper?.result ?? wrapper;
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
  const dbPath = '/' + (params.path || []).join('/');
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
    async (tab: TabKey) => {
      const rpcType = tabs.find((t) => t.key === tab)!.rpcType;
      setLoading((prev) => ({ ...prev, [tab]: true }));
      setErrors((prev) => ({ ...prev, [tab]: null }));
      try {
        let result;
        try {
          result = await clientRpc('ain_get', { type: rpcType, ref: dbPath });
        } catch {
          // Retry with shallow fetch for large nodes
          result = await clientRpc('ain_get', { type: rpcType, ref: dbPath, is_shallow: true });
        }
        // Strip #state_ph placeholders from shallow results, keeping only key names
        if (result && typeof result === 'object') {
          const cleaned: Record<string, any> = {};
          for (const [key, val] of Object.entries(result)) {
            if (typeof val === 'object' && val !== null && '#state_ph' in (val as any)) {
              cleaned[key] = { '...': '(click to expand)' };
            } else {
              cleaned[key] = val;
            }
          }
          result = cleaned;
        }
        setData((prev) => ({ ...prev, [tab]: result }));
      } catch (err: any) {
        setErrors((prev) => ({
          ...prev,
          [tab]: err.message || 'Failed to fetch',
        }));
        setData((prev) => ({ ...prev, [tab]: null }));
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [dbPath],
  );

  useEffect(() => {
    setData({
      value: undefined,
      rule: undefined,
      function: undefined,
      owner: undefined,
    });
    setActiveTab('value');
    fetchTab('value');
  }, [dbPath, fetchTab]);

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
      <h1 className="text-2xl font-bold text-gray-900">Database Explorer</h1>

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
