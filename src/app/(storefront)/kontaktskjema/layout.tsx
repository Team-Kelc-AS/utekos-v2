import 'server-only';
import type { ReactNode } from 'react';
import SupportJsonLd from '@/components/SupportJsonLd';
import { buildSupportMetadata } from '@/lib/seo/buildSupportMetadata';

export const metadata = buildSupportMetadata('contact');

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <><SupportJsonLd page="contact" />{children}</>;
}
