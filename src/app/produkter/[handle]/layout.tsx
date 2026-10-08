import { Suspense, type ReactNode } from 'react';
import ProductJsonLD from './ProductJsonLD';

export default function ProductLayout({ children, params }: {
  children: ReactNode;
  params: Promise<{ handle: string }>;
}) {
  return <>
    {children}
    <Suspense fallback={null}><ProductJsonLD params={params} /></Suspense>
  </>;
}
