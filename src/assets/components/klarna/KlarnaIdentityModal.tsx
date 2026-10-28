'use client';

import { Dialog } from '@base-ui/react/dialog';
import Image from 'next/image';
import { CloseIcon } from '@/components/utekos-icons/CloseIcon';
import { KlarnaIdentityButton } from './KlarnaIdentityButton';
import styles from './KlarnaIdentityModal.module.css';

export function KlarnaIdentityModal({ open, onOpenChange, preview }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <Image
            src="/assets/klarna/KlarnaPlusUtekos.svg"
            alt=""
            width={1472}
            height={800}
            unoptimized
            className={styles.reference}
          />
          <div className={styles.mobileContent}>
            <div className={styles.logos} aria-hidden="true">
              <Image src="/assets/logo/UtekosOrangeSVG.svg" alt="" width={590} height={239} unoptimized className={styles.utekosLogo} />
              <span className={styles.plus}>+</span>
              <Image src="/assets/klarna/KlarnaBadgeSource.png" alt="" width={618} height={258} unoptimized className={styles.klarnaLogo} />
            </div>
          </div>
          <Dialog.Title className={styles.title}>Meld deg inn og få eksklusive tilbud</Dialog.Title>
          <Dialog.Description className={styles.description}>
            Skaff deg tilgang til tilbud som matcher dine interesser og stil
          </Dialog.Description>
          {preview ? <div className={styles.actionWrapper}>
            <button type="button" disabled className={styles.action} aria-label="Klarna-innlogging er ikke tilgjengelig i forhåndsvisningen">
              <span>Fortsett med</span>
              <Image src="/assets/klarna/KlarnaBadgeSource.png" alt="" width={618} height={258} unoptimized className={styles.actionLogo} />
            </button>
            <p className={styles.previewHint}>Klarna-innloggingen er ikke tilgjengelig på denne forhåndsvisningen.</p>
          </div> : <KlarnaIdentityButton
            showDisconnect={false}
            customButton={{
              wrapperClassName: styles.actionWrapper,
              className: styles.action,
              children: <>
                <span>Fortsett med</span>
                <Image src="/assets/klarna/KlarnaBadgeSource.png" alt="" width={618} height={258} unoptimized className={styles.actionLogo} />
              </>,
            }}
          />}
          <Dialog.Close className={styles.close} aria-label="Lukk vinduet">
            <CloseIcon size={20} />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
