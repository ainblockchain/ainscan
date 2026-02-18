'use client';

import Link from 'next/link';
import { useState } from 'react';

interface TreeViewProps {
  data: any;
  basePath: string;
}

function TreeNode({
  name,
  value,
  path,
}: {
  name: string;
  value: any;
  path: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isObject = value != null && typeof value === 'object';
  const keys = isObject ? Object.keys(value) : [];

  return (
    <div className="ml-4">
      <div className="flex items-center gap-1 py-0.5">
        {isObject && keys.length > 0 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs"
          >
            {expanded ? '\u25BC' : '\u25B6'}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {isObject ? (
          <Link
            href={`/database/${path}`}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            {name}
          </Link>
        ) : (
          <span className="text-sm">
            <span className="font-medium text-gray-700">{name}</span>
            <span className="text-gray-400 mx-1">:</span>
            <span className="text-green-700">
              {typeof value === 'string' ? `"${value}"` : String(value)}
            </span>
          </span>
        )}
      </div>
      {expanded && isObject && (
        <div>
          {keys.map((key) => (
            <TreeNode
              key={key}
              name={key}
              value={value[key]}
              path={`${path}/${key}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DatabaseTreeView({ data, basePath }: TreeViewProps) {
  if (data == null) {
    return <p className="text-gray-500 text-sm">No data at this path.</p>;
  }

  if (typeof data !== 'object') {
    return (
      <div className="text-sm">
        <span className="text-green-700">
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return <p className="text-gray-500 text-sm">Empty object.</p>;
  }

  return (
    <div className="font-mono text-sm">
      {keys.map((key) => (
        <TreeNode
          key={key}
          name={key}
          value={data[key]}
          path={`${basePath}/${key}`.replace(/^\/+/, '')}
        />
      ))}
    </div>
  );
}
