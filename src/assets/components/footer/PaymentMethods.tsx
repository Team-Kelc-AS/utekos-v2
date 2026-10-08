import "server-only";

import { getImageProps } from "next/image";
import styles from "./Newsletter.module.css";

const base = "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/";
const alt = "Betalingsmetoder: Vipps, Shop Pay, Visa, Mastercard og Klarna";
const sizes = "(min-width: 1072px) 1024px, calc(100vw - 48px)";

export default function PaymentMethods() {
  const { props: desktop } = getImageProps({ src: `${base}FooterPayIcons.webp?v=1784837537`, alt, width: 1200, height: 180, sizes });
  const { props: tablet } = getImageProps({ src: `${base}PayIconsIpad.webp?v=1784837673`, alt, width: 800, height: 150, sizes });
  const { props: mobile } = getImageProps({ src: `${base}PayIconsMobile.webp?v=1784837536`, alt, width: 390, height: 50, sizes });

  return (
    <div className={styles.payments}>
      <picture className={styles.paymentPicture}>
        <source media="(min-width: 1024px)" srcSet={desktop.srcSet} sizes={sizes} width={1200} height={180} />
        <source media="(min-width: 768px)" srcSet={tablet.srcSet} sizes={sizes} width={800} height={150} />
        {/* getImageProps supplies Next-optimized sources without a client component. */}
        <img {...mobile} alt={alt} className={styles.paymentImage} />
      </picture>
    </div>
  );
}
