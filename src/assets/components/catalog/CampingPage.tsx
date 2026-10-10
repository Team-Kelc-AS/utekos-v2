import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { CategoryRelatedGuides } from '@/components/knowledge/RelatedContent';
import { ShippingReturnsSummary } from '@/components/commerce/ShippingReturnsSummary';
import { categories, categorySlugs, listingPath } from '@/lib/catalog/categories';
import { NBCC_PATH } from '@/lib/nbcc/content';
import { getProduct } from '@/lib/shopify/getProduct';
import { readCategoryListing, type CategoryPageProps } from './CategoryPage';
import { InfoDialogButton } from './InfoDialogButton';
import { ModelProductCard } from './ModelProductCard';
import styles from './camping.module.css';

const categoryKey = 'camping-og-bobil';
const category = categories[categoryKey];

export async function CampingPage({ searchParams }: CategoryPageProps) {
  const { products, page, hasNextPage } = await readCategoryListing(categoryKey, searchParams);
  // Resolve image dimensions before the first paint, so the grid reserves its native heights.
  const models = await Promise.all(products.map(product => getProduct(product.handle)));
  return <main className={styles.page} data-tracking-route={listingPath(categoryKey)}>
    <div className={styles.container}>
      <Breadcrumbs items={[{ label: 'Forsiden', href: '/' }, { label: 'Produkter', href: '/produkter' }, { label: category.label }]} />
      <header className={styles.hero}>
        <div><h1>{category.title}</h1><p>{category.intro}</p><a href="#camping-products" className={styles.heroLink}>Finn ditt varmeplagg <span aria-hidden="true">↓</span></a></div>
        <Image src="/images/kategorier/camping-og-bobil/camping-og-bobil_1600x900.webp" alt="Camping ved fjorden med bobil, bål og en rolig kveld ute" width={1600} height={900} sizes="(min-width: 900px) 46vw, 94vw" className={styles.heroImage} loading="eager" fetchPriority="high" />
      </header>
      <section id="camping-products" aria-labelledby="camping-products-title" data-tracking-category={categoryKey}
        data-tracking-category-name={category.title} data-tracking-page={page} data-tracking-list="camping-models" data-tracking-list-name="Varmeplagg til camping og bobil">
        <div className={styles.sectionHeading}><h2 id="camping-products-title">{page > 1 ? `Produkter – side ${page}` : 'Finn din Utekos'}</h2>
          <InfoDialogButton title="Frakt og retur"><div className={styles.policy}>
            <ShippingReturnsSummary className={styles.policySummary} />
            <Link href="/frakt-og-retur" prefetch={false}>Les fullstendige vilkår for frakt og retur →</Link>
          </div></InfoDialogButton>
        </div>
        {models.some(Boolean) ? <ul className={styles.models}>{models.map(product => product && <li key={product.handle}><ModelProductCard product={product} /></li>)}</ul> : <p>Ingen produkter er tilgjengelige i denne kategorien akkurat nå. <Link href="/produkter" prefetch={false}>Se alle produkter</Link>.</p>}
        {(page > 1 || hasNextPage) && <nav aria-label="Sider i produktoversikten" className={styles.pagination}>
          {page > 1 && <><Link href={listingPath(categoryKey)} prefetch={false}>Første side</Link><Link href={listingPath(categoryKey, page - 1)} prefetch={false}>Forrige side</Link></>}
          <span aria-current="page">Side {page}</span>
          {hasNextPage && <Link href={listingPath(categoryKey, page + 1)} prefetch={false}>Neste side</Link>}
        </nav>}
      </section>
      <div className={styles.afterProducts}>
        <section className={styles.explanation} aria-label="Varmeplagg på campingferien">
          <p>Når du pakker klær til campingferien, bør du også tenke på tiden du skal tilbringe i ro. Et ekstra varmeplagg er godt å ha lett tilgjengelig når du setter deg utenfor bobilen eller campingvognen. Siden temperaturen synker raskt på kjølige morgener og kvelder, har vi samlet plagg som gir umiddelbar varme uten at du trenger å trekke innendørs. Velg ytterplagg etter sesong, og finn isolasjonen som passer ditt uteliv.</p>
        </section>
        <aside className={styles.membership} aria-labelledby="nbcc-benefit-heading" data-tracking-promotion="nbcc-membership" data-tracking-creative="NBCC-medlemsfordel">
          <Image src="/images/partnere/nbcc_logo_1.svg" alt="NBCC - Norsk Bobil og Caravan Club" width={254} height={180} className={styles.nbccLogo} />
          <div><h2 id="nbcc-benefit-heading">Medlem i NBCC?</h2><p>Få 100 kr i rabatt hos Utekos. Se hvordan du aktiverer medlemsfordelen din.</p><Link href={NBCC_PATH} prefetch={false}>NBCC-medlemsfordel hos Utekos →</Link></div>
        </aside>
      </div>
      <div className={styles.guidance}>
        <section aria-labelledby="category-guidance"><h2 id="category-guidance">{category.guidanceTitle}</h2><ul>{category.guidance.map(text => <li key={text}>{text}</li>)}</ul></section>
        <CategoryRelatedGuides categoryKey={categoryKey} />
      </div>
      <nav className={styles.categoryLinks} aria-label="Produktkategorier"><h2>Se produkter etter bruk</h2><ul>{categorySlugs.filter(slug => slug !== categoryKey).map(slug => <li key={slug}><Link href={listingPath(slug)} prefetch={false}>{categories[slug].label} <span aria-hidden="true">↗</span></Link></li>)}</ul></nav>
    </div>
  </main>;
}

