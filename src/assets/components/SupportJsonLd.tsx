import 'server-only';
import { buildSupportJsonLd } from '@/lib/seo/JSON-LD/buildSupportJsonLd';
import { serializeJsonLd } from '@/lib/seo/JSON-LD/serializeJsonLd';
import { supportPages, type SupportPageKey } from '@/lib/seo/supportPages';
import SupportJsonLdScript from './SupportJsonLdScript';

export default function SupportJsonLd({ page }: { page: SupportPageKey }) {
  return <SupportJsonLdScript path={supportPages[page].path} id={`support-${page}`}
    json={serializeJsonLd(buildSupportJsonLd(page))} />;
}
