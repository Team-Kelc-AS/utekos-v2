import 'server-only';

import { StockedProducts } from '@/components/ProductCard/StockedProducts';
import { googleSansFlex } from '@/lib/fonts';
import styles from '@/components/ProductCard/ProductCarousel.module.css';

const sectionClassName = `${googleSansFlex.variable} ${styles.section} font-sans`;

export function HomeProductsLoading() {
  return <section className={`${sectionClassName} ${styles.loading}`} aria-label="Produkter på lager" aria-busy="true">
    <h2>Finn din Utekos</h2><p role="status">Henter produkter …</p>
  </section>;
}

export function HomeProducts() {
  return <StockedProducts title="Finn din Utekos" headingId="home-products-heading" listId="home-products" route="/" />;
}
