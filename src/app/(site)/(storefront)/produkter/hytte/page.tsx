import { HyttePage, getHytteMetadata } from '@/components/catalog/HyttePage';
import type { CategoryPageProps } from '@/components/catalog/CategoryPage';

export const instant = false;

export function generateMetadata({ searchParams }: CategoryPageProps) {
  return getHytteMetadata(searchParams);
}

export default function Page({ searchParams }: CategoryPageProps) {
  return <HyttePage searchParams={searchParams} />;
}
