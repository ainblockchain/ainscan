import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTransactionByHash, getBlockByNumber, getLastBlockNumber, getBlockList } from '@/lib/rpc';
import { formatTimestamp, getOperationType } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';
import { trainingRecord, trainingRecordLatency } from '@/lib/training-record';
import { transactionChannels, transactionEscrows } from '@/lib/state-channel';
import StateChannelDetails from '@/components/StateChannelDetails';
import EscrowDetails from '@/components/EscrowDetails';
import { inferenceRecord } from '@/lib/inference-record';
import NestedNativeRecords from '@/components/NestedNativeRecords';

/** Normalize a raw transaction object into a flat shape. */
function normalizeTx(raw: any, blockNumber?: number, blockTimestamp?: number) {
  const txBody = raw.tx_body || {};
  return {
    hash: raw.hash,
    address: raw.address,
    block_number: raw.block_number ?? blockNumber,
    timestamp: raw.timestamp ?? txBody.timestamp ?? blockTimestamp,
    nonce: raw.nonce ?? txBody.nonce,
    gas_price: raw.gas_price ?? txBody.gas_price,
    operation: raw.operation ?? txBody.operation,
    parent_tx_hash: raw.parent_tx_hash ?? txBody.parent_tx_hash,
    exec_result: raw.exec_result,
    receipt: raw.receipt,
  };
}

/** Try to find a transaction by hash in a specific block. */
async function findTxInBlock(blockNumber: number, hash: string) {
  const block = await getBlockByNumber(blockNumber, true).catch(() => null);
  if (!block?.transactions) return null;
  for (const tx of block.transactions) {
    if (typeof tx === 'object' && tx.hash === hash) {
      return normalizeTx(tx, block.number, block.timestamp);
    }
  }
  return null;
}

/** Scan recent blocks to find a transaction by hash. */
async function scanForTx(hash: string) {
  const lastBlock = await getLastBlockNumber().catch(() => 0);
  if (!lastBlock) return null;

  for (let end = lastBlock; end >= 0; ) {
    const start = Math.max(0, end - 19);
    const blocks = await getBlockList(start, end).catch(() => []);
    if (!Array.isArray(blocks)) break;
    for (const b of blocks) {
      if (b.transactions?.length > 0) {
        const found = await findTxInBlock(b.number, hash);
        if (found) return found;
      }
    }
    end = start - 1;
  }
  return null;
}

export default async function TransactionDetailPage({
  params,
  searchParams,
}: {
  params: { hash: string };
  searchParams: { block?: string };
}) {
  // Try getTransactionByHash first (works when tx index is enabled)
  // Response may be a wrapper: { state, number, transaction: { tx_body, hash, address }, receipt }
  let tx = await getTransactionByHash(params.hash)
    .then((raw) => {
      if (!raw) return null;
      if (raw.transaction && typeof raw.transaction === 'object') {
        // Unwrap: actual tx is inside raw.transaction
        const unwrapped = normalizeTx(raw.transaction, raw.number, raw.timestamp);
        unwrapped.exec_result = unwrapped.exec_result || raw.exec_result;
        unwrapped.receipt = unwrapped.receipt || raw.receipt;
        return unwrapped;
      }
      return normalizeTx(raw);
    })
    .catch(() => null);

  // Fallback: fetch from specific block if block number is provided
  if (!tx && searchParams.block) {
    tx = await findTxInBlock(parseInt(searchParams.block, 10), params.hash);
  }

  // Last resort: scan blocks
  if (!tx) {
    tx = await scanForTx(params.hash);
  }

  if (!tx) notFound();

  const opType = getOperationType(tx);
  const lesson = trainingRecord(tx.operation);
  const inference = inferenceRecord(tx.operation);
  const channelIds = transactionChannels(tx.operation);
  const escrows = transactionEscrows(tx.operation);
  const inclusionBlock = Number.isSafeInteger(tx.block_number) && tx.block_number >= 0
    ? await getBlockByNumber(tx.block_number, false).catch(() => null) : null;
  const latency = lesson ? trainingRecordLatency(lesson, inclusionBlock, tx.hash) : null;

  const details = [
    { label: 'Transaction Hash', value: tx.hash, mono: true, copy: true },
    {
      label: 'Block',
      value: tx.block_number,
      link: tx.block_number != null ? `/blocks/${tx.block_number}` : undefined,
    },
    { label: 'Timestamp', value: tx.timestamp ? formatTimestamp(tx.timestamp) : '-' },
    {
      label: 'From',
      value: tx.address,
      mono: true,
      link: tx.address ? `/accounts/${tx.address}` : undefined,
      copy: true,
    },
    { label: 'Nonce', value: tx.nonce ?? '-' },
    { label: 'Operation Type', value: opType },
  ];

  if (tx.parent_tx_hash) {
    details.push({
      label: 'Parent Tx',
      value: tx.parent_tx_hash,
      mono: true,
      link: `/transactions/${tx.parent_tx_hash}`,
      copy: true,
    });
  }

  if (lesson) {
    details.push(
      { label: 'Training Job', value: lesson.jobId },
      { label: 'Dataset', value: lesson.datasetId ?? '-' },
      { label: 'Dataset SHA-256', value: lesson.datasetSha256 ?? '-', mono: true, copy: lesson.datasetSha256 !== null },
      { label: 'Training Rows (reported)', value: lesson.rows === null ? '-' : lesson.rows.toLocaleString('en-US') },
      { label: 'Knowledge / Draft ID', value: lesson.patchId ?? '-' },
      { label: 'Knowledge SHA-256', value: lesson.patchSha256 ?? '-', mono: true, copy: lesson.patchSha256 !== null },
      { label: 'Training Status', value: lesson.status ?? '-' },
      { label: 'Training Backend', value: lesson.backend ?? '-' },
      { label: 'Model ID (trainer-reported)', value: lesson.modelId ?? '-' },
      { label: 'Record Path', value: lesson.path, link: `/database${lesson.path.split('/').map(encodeURIComponent).join('/')}` },
      { label: 'Submitted At (reported)', value: lesson.submittedAt === null ? '-' : new Date(lesson.submittedAt).toISOString() },
      { label: 'Training Record Latency', value: latency === null ? 'Unavailable' : `${latency.toLocaleString('en-US')} ms` },
    );
  }

  if (inference) {
    details.push(
      { label: 'Inference Model (reported)', value: inference.modelId },
      { label: 'Completed Requests (reported)', value: inference.requestCount.toLocaleString('en-US') },
      { label: 'Interval Start (reported)', value: new Date(inference.startedAt).toISOString() },
      { label: 'Interval End (reported)', value: new Date(inference.finishedAt).toISOString() },
      { label: 'Inference Requests / Second (reported)', value: inference.requestsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 3 }) },
      { label: 'Receipt Commitment (unverified)', value: inference.receiptRoot, mono: true, copy: true },
      { label: 'Inference Record Path', value: inference.path, link: `/database${inference.path}` },
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
      {inference && <p className="text-sm text-gray-500">Inference throughput is reported by the sender, not onchain TPS. These transaction fields do not prove successful execution, receipt coverage, client delivery or model quality. The commitment and content-addressed path are not independently verified here. Rates from overlapping intervals must not be added.</p>}
      {lesson && <p className="text-sm text-gray-500">Training record latency measures the reporter-provided submission time to the containing block timestamp. It excludes finality wait and requires synchronized clocks.</p>}
      {lesson && <p className="text-sm text-gray-500">Dataset and knowledge fields are reported by the transaction sender. Inclusion does not verify training quality, public availability, or inference success. Training rows are not a count of datasets.</p>}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <dl className="divide-y divide-gray-200">
          {details.map((item) => (
            <div key={item.label} className="px-4 py-3 sm:grid sm:grid-cols-4 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-3 text-sm text-gray-900 flex items-center">
                {item.link ? (
                  <Link href={item.link} className="text-blue-600 hover:underline font-mono break-all">
                    {String(item.value)}
                  </Link>
                ) : (
                  <span className={item.mono ? 'font-mono break-all' : ''}>
                    {String(item.value ?? '-')}
                  </span>
                )}
                {item.copy && <CopyButton text={String(item.value)} />}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <NestedNativeRecords operation={tx.operation} block={inclusionBlock} txHash={tx.hash} />

      {tx.operation && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Operation</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap break-all">
              {JSON.stringify(tx.operation, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {channelIds.slice(0, 5).map(channelId => <StateChannelDetails key={channelId} channelId={channelId} />)}
      {channelIds.length > 5 && <p className="text-sm text-gray-500">Showing the first five channels. All channel paths remain available in the transaction operation.</p>}
      {escrows.slice(0, 5).map(escrow => <EscrowDetails key={escrow.root} escrow={escrow} />)}
      {escrows.length > 5 && <p className="text-sm text-gray-500">Showing the first five escrow contracts. All paths remain available in the transaction operation.</p>}

      {tx.exec_result && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Execution Result</h2>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden p-4">
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(tx.exec_result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
