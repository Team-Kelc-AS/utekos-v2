import 'server-only';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { CategoryRelatedGuides } from '@/components/knowledge/RelatedContent';
import { ShippingReturnsSummary } from '@/components/commerce/ShippingReturnsSummary';
import { categories, listingPath } from '@/lib/catalog/categories';
import { NBCC_PATH } from '@/lib/nbcc/content';
import { getProduct } from '@/lib/shopify/getProduct';
import { publicVariants } from '@/lib/products/variants';
import { readCategoryListing, type CategoryPageProps } from './CategoryPage';
import { InfoDialogButton } from './InfoDialogButton';
import { ProductCarousel } from '@/components/ProductCard/ProductCarousel';
import { ModelProductCard } from './ModelProductCard';
import { CategoryNavigation } from './CategoryNavigation';
import styles from './camping.module.css';

const categoryKey = 'camping-og-bobil';
const category = categories[categoryKey];

export async function CampingPage({ searchParams }: CategoryPageProps) {
  const { products, page, hasNextPage } = await readCategoryListing(categoryKey, searchParams);
  // Resolve image dimensions before the first paint, so the grid reserves its native heights.
  const models = await Promise.all(products.map(product => getProduct(product.handle)));
  const cards = models.filter(product => product !== null).flatMap(product =>
    publicVariants(product).map(variant => ({ product, variant })),
  );
  return <main className={styles.page} data-tracking-route={listingPath(categoryKey)}>
    <div className={styles.container}>
      <Breadcrumbs items={[{ label: 'Forsiden', href: '/' }, { label: 'Produkter', href: '/produkter' }, { label: category.label }]} />
      <header className={styles.hero}>
        <h1>{category.title}</h1>
        <Image src="/images/products/bobil-camping.webp" alt="Bobil med campingstoler, bord og tent bålpanne ved en fjord i solnedgang" width={2017} height={807} sizes="(min-width: 1280px) 1184px, (min-width: 1200px) calc(100vw - 96px), 92vw" className={styles.heroImage} loading="eager" fetchPriority="high" />
        <div><p>{category.intro}</p><a href="#camping-products" className={styles.heroLink}>Finn ditt varmeplagg <span aria-hidden="true">↓</span></a></div>
      </header>
      <section id="camping-products" aria-labelledby="camping-products-title" data-tracking-category={categoryKey}
        data-tracking-category-name={category.title} data-tracking-page={page} data-tracking-list="camping-models" data-tracking-list-name="Varmeplagg til camping og bobil">
        <div className={styles.sectionHeading}><h2 id="camping-products-title">{page > 1 ? `Produkter – side ${page}` : 'Finn din Utekos'}</h2>
          <InfoDialogButton title="Frakt og retur" footer={<Link href="/frakt-og-retur" prefetch={false} className={styles.policyFooterLink}>Les fullstendige vilkår for frakt og retur →</Link>}>
            <ShippingReturnsSummary className={styles.policySummary} />
          </InfoDialogButton>
        </div>
        {cards.length > 0 ? <ProductCarousel label="Varmeplagg til camping og bobil">{cards.map(({ product, variant }) => <ModelProductCard key={variant.id} product={product} variant={variant} />)}</ProductCarousel> : <p>Ingen produkter er tilgjengelige i denne kategorien akkurat nå. <Link href="/produkter" prefetch={false}>Se alle produkter</Link>.</p>}
        <Link href="/handlehjelp/storrelsesguide" prefetch={false} data-tracking-size-guide className={styles.heroLink}>Størrelsesguide →</Link>
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
        <CategoryRelatedGuides categoryKey={categoryKey} />
        <CategoryNavigation current={categoryKey} />
      </div>
    </div>
  </main>;
}

