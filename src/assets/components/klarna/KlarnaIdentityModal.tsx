'use client';

import { useSyncExternalStore } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import Image from 'next/image';
import { CloseIcon } from '@/components/utekos-icons/CloseIcon';
import { KlarnaIdentityButton } from './KlarnaIdentityButton';
import styles from './KlarnaIdentityModal.module.css';

const mobileQuery = '(max-width: 760px)';
function subscribe(listener: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const isMobile = () => window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;

export function KlarnaIdentityModal({ open, onOpenChange, preview }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: boolean;
}) {
  const mobile = useSyncExternalStore(subscribe, isMobile, serverSnapshot);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup} data-klarna-identity-modal>
          <Image
            src={`/images/kunnskap/utekos-klarna-${mobile ? 'black' : 'white'}-plus.svg`}
            alt="Utekos + Klarna"
            width={226}
            height={42}
            unoptimized
            className={styles.logos}
          />
          <div className={styles.copy}>
            <Dialog.Title className={styles.title}>
              Få beskjed først om unike lanseringer og spennende fordeler.
            </Dialog.Title>
            <Dialog.Description className={styles.description}>
              Lås opp tilbud som matcher din stil og dine interesser
            </Dialog.Description>
          </div>
          {preview ? <div className={styles.actionWrapper}>
            <button type="button" disabled className={styles.previewAction}>Fortsett med Klarna</button>
            <p className={styles.previewHint}>Klarna-innlogging er ikke tilgjengelig på denne forhåndsvisningen.</p>
          </div> : <KlarnaIdentityButton
            showDisconnect={false}
            fullWidth
            theme={mobile ? 'default' : 'light'}
            shape="pill"
            wrapperClassName={styles.actionWrapper}
            onConnected={() => onOpenChange(false)}
          />}
          <Dialog.Close className={styles.close} aria-label="Lukk vinduet">
            <CloseIcon size={20} />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
