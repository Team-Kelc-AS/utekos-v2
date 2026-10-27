import "server-only";

import { ArrowRightIcon } from "@/components/utekos-icons/ArrowRightIcon";
import { CaretDownIcon } from "@/components/utekos-icons/CaretDownIcon";
import { CartHost } from "@/components/commerce/CartHost";
import { CartSlot } from "@/components/commerce/CartSlot";
import { CloseIcon } from "@/components/utekos-icons/CloseIcon";
import { GroupIcon } from "@/components/utekos-icons/GroupIcon";
import { GuideIcon } from "@/components/utekos-icons/GuideIcon";
import { HeaderMenu } from "./HeaderMenu";
import { HeaderSearch } from "./HeaderSearch";
import { HeadsetIcon } from "@/components/utekos-icons/HeadsetIcon";
import Image from "next/image";
import { LineHorizontal3Icon } from "@/components/utekos-icons/LineHorizontal3Icon";
import Link from "next/link";
import { MoneyIcon } from "@/components/utekos-icons/MoneyIcon";
import { ProductCategories } from "./ProductCategories";
import { SearchIcon } from "@/components/utekos-icons/SearchIcon";
import { Suspense } from "react";
import { googleSansFlex } from "@/lib/fonts";
import { headerNavigation } from "./navigation";
import styles from "./Header.module.css";

const linkIcons = [GuideIcon, GroupIcon, HeadsetIcon] as const;

export default function Header() {
  const secondaryLinks = headerNavigation.links.map(
    ({ href, label }, index) => {
      const Icon = linkIcons[index];
      return (
        <li key={href}>
          <Link href={href} className={styles.link}>
            <Icon size={20} />
            {label}
          </Link>
        </li>
      );
    },
  );
  const closeIcon = (
    <CloseIcon size={20} tone="orange" className={styles.primaryIcon} />
  );

  return (
    <>
      <Link href="/produkter/comfyrobe" className={`${googleSansFlex.variable} ${styles.campaign}`}>
        <MoneyIcon size={20} className={styles.campaignMoney} />
        <span className={styles.campaignDesktop}>Høstens kupp? 50% rabatt på Comfyrobe™. <span className={styles.campaignSaving}>Spar 845,- og få fri frakt</span></span>
        <span className={styles.campaignMobile}>Høstens kupp? Halv pris på Comfyrobe! Kjøp her</span>
        <ArrowRightIcon size={20} />
      </Link>
    <header className={`${googleSansFlex.variable} ${styles.header}`}>
      <div className={styles.container}>
        <Link
          href="/"
          aria-label="Utekos – til forsiden"
          className={styles.logo}
        >
          <Image
            src="/IconWhite.svg"
            alt=""
            width={1280}
            height={1109}
            loading="eager"
            className={styles.icon}
          />
          <Image
            src="/WordmarkWhite.svg"
            alt=""
            width={1280}
            height={311}
            loading="eager"
            className={styles.wordmark}
          />
        </Link>
        <nav className={styles.desktopNavigation} aria-label="Hovedmeny">
          <ul className={styles.links}>
            <li className={styles.productRow}>
              <Link
                href={headerNavigation.products.href}
                className={styles.link}
              >
                {headerNavigation.products.label}
              </Link>
              <ProductCategories
                items={headerNavigation.categories}
                icon={
                  <CaretDownIcon
                    size={20}
                    tone="orange"
                    className={styles.primaryIcon}
                  />
                }
              />
            </li>
            {secondaryLinks}
          </ul>
        </nav>
        <HeaderSearch
          closeIcon={closeIcon}
          icon={
            <SearchIcon
              size={20}
              tone="orange"
              className={`${styles.primaryIcon} ${styles.actionIcon}`}
            />
          }
        />
        <div className={styles.actions}>
          <Suspense fallback={<CartHost />}>
            <CartSlot />
          </Suspense>
          <HeaderMenu
            trigger={
              <>
                <LineHorizontal3Icon
                  size={20}
                  tone="orange"
                  className={`${styles.primaryIcon} ${styles.actionIcon}`}
                />
                <span className={styles.menuLabel}>Meny</span>
              </>
            }
            logo={
              <Link href="/" aria-label="Utekos – til forsiden">
                <Image src="/IconWhite.svg" alt="" width={1280} height={1109} />
              </Link>
            }
            closeIcon={closeIcon}
            categories={
              <ul className={styles.menuCategoryLinks}>
                <li>
                  <Link href={headerNavigation.products.href} className={styles.link}>
                    Alle produkter
                  </Link>
                </li>
                {headerNavigation.categories.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className={styles.link}>{label}</Link>
                  </li>
                ))}
              </ul>
            }
          >
            {secondaryLinks}
          </HeaderMenu>
        </div>
      </div>
    </header>
    </>
  );
}
