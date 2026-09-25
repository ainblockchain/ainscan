'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ComponentProps } from 'react';
import { withNetwork } from '@/lib/network';
import { useNetwork } from './NetworkProvider';

type NetworkLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/** next/link that keeps the selected network (`?network=`) on internal hrefs. */
export default function NetworkLink({ href, ...props }: NetworkLinkProps) {
  const network = useNetwork();
  const layer = useSearchParams().get('layer');
  let target = withNetwork(href, network);
  if ((layer === 'L1' || layer === 'L2') && target.startsWith('/database')) {
    const url = new URL(target, 'http://ainscan.local');
    if (!url.searchParams.has('layer')) url.searchParams.set('layer', layer);
    target = url.pathname + url.search;
  }
  return <Link href={target} {...props} />;
}
