'use client';
import { recordVariantIntent } from '@/lib/tracking/variant-selection';
import { useEffect, useRef, useTransition, type ReactNode, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './product.module.css';
export function VariantOptions({ children, selectedId }: { children: ReactNode; selectedId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const destination = useRef<string | null>(null);
  useEffect(() => {
    if (!pending && destination.current) {
      const link = [...(ref.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])].find(a => a.getAttribute('href') === destination.current);
      link?.focus(); destination.current = null;
    }
  }, [pending, selectedId]);
  function navigate(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-variant]');
    if (!link) return;
    event.preventDefault();
    if (pending || destination.current || link.getAttribute('aria-current') === 'true') return;
    destination.current = link.getAttribute('href');
    recordVariantIntent(destination.current!, selectedId);
    startTransition(() => router.push(destination.current!, { scroll: false }));
  }
  return <div ref={ref} onClickCapture={navigate} aria-busy={pending} className={styles.options}>
    {children}<p className={styles.pending} role="status">{pending ? 'Oppdaterer variant …' : ''}</p>
  </div>;
}
