import type { ReactNode } from 'react';
import { ClipboardIcon } from '@/components/utekos-icons/ClipboardIcon';
import { CompassIcon } from '@/components/utekos-icons/CompassIcon';
import { Layers4Icon } from '@/components/utekos-icons/Layers4Icon';
import { MerchantTruckOutlineIcon } from '@/components/utekos-icons/MerchantTruckOutlineIcon';
import { Path2Icon } from '@/components/utekos-icons/Path2Icon';
import { RulerIcon } from '@/components/utekos-icons/RulerIcon';
import { RoundRulerIcon } from '@/components/utekos-icons/RoundRulerIcon';
import { WashingMachine4Icon } from '@/components/utekos-icons/WashingMachine4Icon';
import type { ProductAccordionSectionId } from '@/lib/products/content';
import styles from './product.module.css';

const detailIcons = {
  materialer: ClipboardIcon,
  funksjoner: Path2Icon,
  egenskaper: Layers4Icon,
  bruksomrader: CompassIcon,
  passform: RoundRulerIcon,
  vaskeanvisning: WashingMachine4Icon,
  storrelser: RulerIcon,
  'frakt-og-retur': MerchantTruckOutlineIcon,
};

export function ProductDetailLabel({ section, children }: {
  section: ProductAccordionSectionId | 'storrelser' | 'frakt-og-retur';
  children: ReactNode;
}) {
  const Icon = detailIcons[section];
  return <span className={styles.detailLabel}>
    <Icon tone="orange" size={28} className={styles.detailIcon} />
    <span>{children}</span>
  </span>;
}
