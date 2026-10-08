import Link from 'next/link';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/products/money';
import { optionLabel, optionParam } from '@/lib/products/variants';
import type { ProductVariant } from '@/lib/shopify/product-types';

// The headless compact/desktop header, with fixed labels instead of selectors.
export function ProductCardHeader({ title, href, variant }: { title: string; href: string; variant: ProductVariant }) {
  const options = variant.selectedOptions.filter(option => option.value !== 'Default Title' && optionParam(option.name) !== 'kjonn');
  const compare = variant.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount) ? variant.compareAtPrice : null;
  return <CardHeader className="relative z-10 mt-3 flex flex-col gap-2.5 rounded-none bg-night px-5 pt-1 pb-0 max-[360px]:px-3 md:gap-3 md:px-6 xl:-mt-6 xl:rounded-t-3xl xl:border-t xl:border-border xl:p-6 xl:pb-0">
    <div className="flex w-full flex-wrap items-baseline justify-between gap-x-2 gap-y-1 xl:flex-col xl:items-start xl:gap-3">
      <Link href={href} title={title} className="min-w-0 rounded-sm">
        <CardTitle className="font-sans text-base leading-6 font-extrabold tracking-tight md:text-lg md:leading-7 xl:text-xl xl:leading-8"><h3>{title}</h3></CardTitle>
      </Link>
      <p className="flex flex-wrap items-baseline gap-2 font-sans text-sm leading-none font-medium md:text-lg xl:text-2xl">
        <span>{formatMoney(variant.price)}</span>{compare && <del className="text-xs md:text-sm">{formatMoney(compare)}</del>}
      </p>
    </div>
    <dl className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium md:text-base">
      {options.map(option => <div key={option.name}>
        <dt className="sr-only">{optionLabel(option.name)}</dt><dd>{option.value}</dd>
      </div>)}
    </dl>
  </CardHeader>;
}
