'use client';

import { useState, useEffect } from 'react';
import {
  registerPasskey,
  getStoredPasskeyAccount,
  clearPasskeyAccount,
  isPasskeySupported,
  PasskeyAccount,
} from '@/lib/passkey';

interface Props {
  onAccountChange?: (account: PasskeyAccount | null) => void;
}

export default function PasskeyAuth({ onAccountChange }: Props) {
  const [account, setAccount] = useState<PasskeyAccount | null>(null);
  const [supported, setSupported] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isPasskeySupported());
    const stored = getStoredPasskeyAccount();
    if (stored) {
      setAccount(stored);
      onAccountChange?.(stored);
    }
  }, [onAccountChange]);

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    try {
      const result = await registerPasskey('ainscan-user');
      if (result) {
        setAccount(result);
        onAccountChange?.(result);
      } else {
        setError('Passkey registration was cancelled');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register passkey');
    } finally {
      setRegistering(false);
    }
  };

  const handleDisconnect = () => {
    clearPasskeyAccount();
    setAccount(null);
    onAccountChange?.(null);
  };

  if (!supported) {
    return (
      <div className="text-xs text-gray-400">
        Passkeys not supported in this browser
      </div>
    );
  }

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-mono text-green-700">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRegister}
        disabled={registering}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
        {registering ? 'Authenticating...' : 'Connect Passkey'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
