'use client';

import { usePathname } from 'next/navigation';

/** Cache Components retains hidden routes: only the active route exposes its graph. */
export default function SupportJsonLdScript({ path, id, json }: { path: string; id: string; json: string }) {
  const pathname = usePathname();
  if (pathname !== path) return null;
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
