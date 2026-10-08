import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { absoluteUrl } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Glamping i Norge: Dette bør du sjekke før du bestiller – og pakke før du drar',
  description: 'For å velge riktig glampingopphold og pakke riktig, må du kartlegge stedets standard for oppvarming, toalettforhold, adkomst og mattilbud, og deretter tilpasse utstyret ditt med lag-på-lag-bekledning og vanntett fottøy.',
  alternates: { canonical: absoluteUrl('/uteguiden/glamping-i-norge') },
};

export default function GlampingArticleLayout({ children }: { children: ReactNode }) {
  return children;
}
