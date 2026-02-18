import { notFound } from 'next/navigation';
import { getBalance, getNonce, getValidatorInfo } from '@/lib/rpc';
import { formatAIN } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';

export default async function AccountDetailPage({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;
  if (!address || !address.startsWith('0x')) notFound();

  const [balance, nonce, validatorInfo] = await Promise.all([
    getBalance(address).catch(() => 0),
    getNonce(address).catch(() => 0),
    getValidatorInfo(address).catch(() => null),
  ]);

  const isValidator = validatorInfo != null && typeof validatorInfo === 'object';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account</h1>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <dl className="divide-y divide-gray-200">
          <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900 flex items-center">
              <span className="font-mono break-all">{address}</span>
              <CopyButton text={address} />
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Balance</dt>
            <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900">
              {formatAIN(balance)}
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Nonce</dt>
            <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900">
              {nonce}
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Validator</dt>
            <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900">
              {isValidator ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active Validator
                </span>
              ) : (
                <span className="text-gray-500">No</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {isValidator && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Validator Info</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(validatorInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
