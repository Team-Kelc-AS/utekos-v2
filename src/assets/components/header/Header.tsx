import "server-only";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CartSlot } from "@/components/commerce/CartSlot";
import { CartHost } from "@/components/commerce/CartHost";
import { GuideIcon } from "@/components/utekos-icons/GuideIcon";
import { GroupIcon } from "@/components/utekos-icons/GroupIcon";
import { HeadsetIcon } from "@/components/utekos-icons/HeadsetIcon";
import { SearchIcon } from "@/components/utekos-icons/SearchIcon";
import { CaretDownIcon } from "@/components/utekos-icons/CaretDownIcon";
import { CloseIcon } from "@/components/utekos-icons/CloseIcon";
import { LineHorizontal3Icon } from "@/components/utekos-icons/LineHorizontal3Icon";
import { googleSansFlex } from "@/lib/fonts";
import { HeaderMenu } from "./HeaderMenu";
import { HeaderSearch } from "./HeaderSearch";
import { ProductCategories } from "./ProductCategories";
import { headerNavigation } from "./navigation";
import styles from "./Header.module.css";

const linkIcons = [GuideIcon, GroupIcon, HeadsetIcon] as const;

export default function Header() {
  const secondaryLinks = headerNavigation.links.map(({ href, label }, index) => {
    const Icon = linkIcons[index];
    return <li key={href}><Link href={href} className={styles.link}><Icon size={20} />{label}</Link></li>;
  });
  const closeIcon = <CloseIcon size={20} tone="orange" className={styles.primaryIcon} />;

  return (
    <header className={`${googleSansFlex.variable} ${styles.header}`}>
      <div className={styles.container}>
        <Link href="/" aria-label="Utekos – til forsiden" className={styles.logo}>
          <Image src="/IconWhite.svg" alt="" width={1280} height={1109} loading="eager" className={styles.icon} />
          <Image src="/WordmarkWhite.svg" alt="" width={1280} height={311} loading="eager" className={styles.wordmark} />
        </Link>
        <nav className={styles.desktopNavigation} aria-label="Hovedmeny">
          <ul className={styles.links}>
            <li className={styles.productRow}>
              <Link href={headerNavigation.products.href} className={styles.link}>{headerNavigation.products.label}</Link>
              <ProductCategories items={headerNavigation.categories} icon={<CaretDownIcon size={20} tone="orange" className={styles.primaryIcon} />} />
            </li>
            {secondaryLinks}
          </ul>
        </nav>
        <HeaderSearch closeIcon={closeIcon} icon={<SearchIcon size={20} tone="orange" className={styles.primaryIcon} />} />
        <div className={styles.actions}>
          <Suspense fallback={<CartHost />}><CartSlot /></Suspense>
          <HeaderMenu
            trigger={<><LineHorizontal3Icon size={20} tone="orange" className={styles.primaryIcon} /><span>Meny</span></>}
            logo={<Link href="/" aria-label="Utekos – til forsiden"><Image src="/IconWhite.svg" alt="" width={1280} height={1109} /></Link>}
            closeIcon={closeIcon}
          >
            <nav className={styles.panelNavigation} aria-label="Alle sider">
              <ul className={styles.menuLinks}>
                <li>
                  <details className={styles.menuCategories}>
                    <summary><span>Produkter</span><CaretDownIcon size={20} tone="orange" className={styles.primaryIcon} /></summary>
                    <ul>
                      <li><Link href={headerNavigation.products.href} className={styles.link}>Alle produkter</Link></li>
                      {headerNavigation.categories.map(({ href, label }) => <li key={href}><Link href={href} className={styles.link}>{label}</Link></li>)}
                    </ul>
                  </details>
                </li>
                {secondaryLinks}
              </ul>
            </nav>
          </HeaderMenu>
        </div>
      </div>
    </header>
  );
}
