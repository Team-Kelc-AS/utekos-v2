'use client';

import { lazy, Suspense, useState } from 'react';

const KnowledgeNewsletterDialog = lazy(() => import('./KnowledgeNewsletterDialog'));

export function KnowledgeSignupButton({ className }: { className: string }) {
  const [open, setOpen] = useState(false);

  return <>
    <button className={className} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
      Meld deg på
    </button>
    {open && <Suspense fallback={null}>
      <KnowledgeNewsletterDialog onClose={() => setOpen(false)} />
    </Suspense>}
  </>;
}
