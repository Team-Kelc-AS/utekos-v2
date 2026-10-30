"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  refreshKlarnaPreferences,
  useKlarnaPreferences,
} from "@/lib/klarna/preferences-client";
import {
  KlarnaIdentityButton,
  KlarnaDisconnectButton,
} from "./KlarnaIdentityButton";
import { KlarnaMarketingPreferences } from "./KlarnaMarketingPreferences";
import { KlarnaPreferencesQuestionnaire } from "./KlarnaPreferencesQuestionnaire";
import styles from "./KlarnaMarketingPreferences.module.css";

export function KlarnaPreferencesContent({
  questionnaire = false,
  onSaved,
}: {
  questionnaire?: boolean;
  onSaved?: () => void;
}) {
  const state = useKlarnaPreferences();
  if (state.phase === "loading")
    return <p role="status">Henter valgene dine …</p>;
  if (state.phase === "error")
    return (
      <div className={styles.feedback}>
        <p role="alert">Valgene kunne ikke hentes. Prøv igjen.</p>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => {
            void refreshKlarnaPreferences();
          }}
        >
          Hent valgene på nytt
        </Button>
      </div>
    );
  if (!state.connected)
    return <KlarnaIdentityButton fullWidth showDisconnect={false} />;
  return questionnaire ? (
    <KlarnaPreferencesQuestionnaire
      profile={state.profile}
      onSaved={onSaved ?? (() => {})}
    />
  ) : (
    <>
      <KlarnaMarketingPreferences profile={state.profile} />
      <KlarnaDisconnectButton />
    </>
  );
}
export function KlarnaPreferencesButton({ menu = false }: { menu?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" />}
        className={`${styles.entry} ${menu ? styles.menuEntry : ""}`}
        data-klarna-preferences-trigger
      >
        Mine preferanser og samtykker
      </DialogTrigger>
      <DialogContent
        className={`${styles.theme} ${styles.modal}`}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Mine preferanser og samtykker</DialogTitle>
        </DialogHeader>
        <KlarnaPreferencesContent
          questionnaire
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
export function KlarnaProductPreferences() {
  const state = useKlarnaPreferences();
  if (state.phase !== "ready" || !state.connected || state.profile !== null)
    return null;
  return (
    <div data-klarna-product-preferences className={styles.productEntry}>
      <KlarnaPreferencesButton />
    </div>
  );
}
export function KlarnaSavedPreferencesLink({
  className,
}: {
  className: string;
}) {
  const state = useKlarnaPreferences();
  if (!state.connected || !state.profile) return null;
  return (
    <li data-klarna-saved-preferences>
      <Link
        href="/handlehjelp/preferanser"
        prefetch={false}
        className={className}
      >
        Mine preferanser og samtykker
      </Link>
    </li>
  );
}

export function KlarnaMenuPreferences() {
  const { connected } = useKlarnaPreferences();
  return (
    <div className="flex flex-col gap-2">
      <KlarnaPreferencesButton menu />
      {connected && <KlarnaDisconnectButton />}
    </div>
  );
}
