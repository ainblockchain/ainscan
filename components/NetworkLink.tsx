'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { withNetwork } from '@/lib/network';
import { useNetwork } from './NetworkProvider';

type NetworkLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/** next/link that keeps the selected network (`?network=`) on internal hrefs. */
export default function NetworkLink({ href, ...props }: NetworkLinkProps) {
  const network = useNetwork();
  return <Link href={withNetwork(href, network)} {...props} />;
}
