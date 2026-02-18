import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getValidatorInfo, getBalance } from '@/lib/rpc';
import { formatAIN } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';

export default async function ValidatorDetailPage({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;
  if (!address || !address.startsWith('0x')) notFound();

  const [validatorInfo, balance] = await Promise.all([
    getValidatorInfo(address).catch(() => null),
    getBalance(address).catch(() => 0),
  ]);

  if (!validatorInfo) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Validator Details</h1>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <dl className="divide-y divide-gray-200">
          <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900 flex items-center">
              <Link
                href={`/accounts/${address}`}
                className="text-blue-600 hover:underline font-mono break-all"
              >
                {address}
              </Link>
              <CopyButton text={address} />
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500">Balance</dt>
            <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900">
              {formatAIN(balance)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Validator Info</h2>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
          <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(validatorInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
