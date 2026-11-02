"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "cn";
import { useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { CloseIcon } from "@/components/utekos-icons/CloseIcon";
import { NBCC_LOGIN_URL, NBCC_PATH, nbccSteps } from "@/lib/nbcc/content";
import styles from "./NbccMembership.module.css";

export function NbccMembershipDialog() {
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="link" className={styles.detailsTrigger} />}>
        Slik bruker du medlemsfordelen
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup ref={popupRef} initialFocus={popupRef} className={styles.popup} data-nbcc-membership-modal>
          <div className={styles.modalLogos}>
            <picture>
              <source media="(max-width: 760px)" srcSet="/assets/logo/wordmark-black.svg" />
              <Image src="/WordmarkWhite.svg" alt="Utekos" width={1280} height={311} className={styles.modalWordmark} unoptimized />
            </picture>
            <span aria-hidden="true">+</span>
            <Image src="/images/partnere/nbcc-logo.svg" alt="NBCC" width={286} height={203} className={styles.modalClubLogo} unoptimized />
          </div>
          <div>
            <Dialog.Title className={styles.modalTitle}>Din medlemsfordel hos Utekos</Dialog.Title>
            <Dialog.Description className={styles.modalDescription}>
              Som NBCC-medlem får du 100 kr rabatt. Hent medlemskoden i Gnist-appen og bruk den når du bestiller.
            </Dialog.Description>
          </div>
          <ol className={styles.modalSteps}>
            {nbccSteps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
          <div className={styles.modalActions}>
            <a href={NBCC_LOGIN_URL} className={cn(buttonVariants(), styles.modalPrimary)}>
              Til Gnist-app
            </a>
            <Link href={NBCC_PATH} prefetch={false} className={cn(buttonVariants({ variant: "link" }), styles.modalMore)}>
              Finn ut mer
            </Link>
          </div>
          <Dialog.Close render={<Button variant="ghost" size="icon" className={styles.close} />} aria-label="Lukk NBCC-medlemsfordel">
            <CloseIcon size={20} />
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
