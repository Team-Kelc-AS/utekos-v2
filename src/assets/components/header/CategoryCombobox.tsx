"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput,
  ComboboxItem, ComboboxList, ComboboxTrigger,
} from "@/components/ui/combobox";
import styles from "./Header.module.css";

type CategoryLink = Readonly<{ label: string; href: string }>;

export default function CategoryCombobox({ items, icon, listId }: {
  items: readonly CategoryLink[];
  icon: ReactNode;
  listId: string;
}) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  return (
    <Combobox
      items={items}
      value={null}
      open={open}
      onOpenChange={setOpen}
      itemToStringLabel={(item: CategoryLink) => item.label}
      onValueChange={(item: CategoryLink | null) => {
        if (!item) return;
        setOpen(false);
        router.push(item.href);
      }}
    >
      <ComboboxTrigger showIcon={false} aria-label="Vis produktkategorier" className={`${styles.control} ${styles.categoryTrigger}`}>
        {icon}
      </ComboboxTrigger>
      <ComboboxContent className={styles.categoryPopup}>
        <ComboboxInput aria-label="Filtrer kategorier" placeholder="Filtrer kategorier" showTrigger={false} />
        <ComboboxEmpty>Ingen kategorier funnet.</ComboboxEmpty>
        <ComboboxList id={listId}>
          {(item: CategoryLink) => <ComboboxItem key={item.href} value={item} className={styles.categoryOption}>{item.label}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
