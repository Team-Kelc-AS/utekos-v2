'use client';

import { useEffect, useRef, useState } from 'react';
import { KlarnaIdentityButton } from './KlarnaIdentityButton';

export function KlarnaIdentityOffer() {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={container} className="w-full" data-klarna-identity-offer>
    {visible && <KlarnaIdentityButton showDisconnect={false} />}
  </div>;
}
