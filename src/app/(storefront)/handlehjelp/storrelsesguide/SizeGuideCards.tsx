// SizeGuideCards.tsx
import "server-only";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./sizeGuide.module.css";

export function SizeGuideGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

export function SizeOptionCard({
  id,
  title,
  measurement,
  label = "Din høyde",
  tableId,
  children,
}: {
  id: string;
  title: string;
  measurement: string;
  label?: string;
  tableId: string;
  children: ReactNode;
}) {
  return (
    <Card className={styles.sizeCard} aria-labelledby={id}>
      <CardHeader>
        <CardTitle>
          <h3 id={id}>{title}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className={styles.sizeContent}>
        <p className={styles.measurement}>
          <strong>{label}:</strong> <span>{measurement}</span>
        </p>
        <div style={{ flexGrow: 1 }}>{children}</div>
      </CardContent>
      <CardFooter className={styles.sizeFooter}>
        <a href={`#${tableId}`} aria-label={`Se tabellen for ${title}`}>
          Se tabellen
        </a>
      </CardFooter>
    </Card>
  );
}

export function GuideNotice({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.notice}>
      <Image
        src="/images/size-guide/listen.svg"
        width={35}
        height={35}
        alt=""
        aria-hidden="true"
      />
      <div>{children}</div>
    </aside>
  );
}

export function GuideInfoCard({ children }: { children: ReactNode }) {
  return (
    <Card className={styles.infoCard}>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function GuideStep({
  number,
  title,
  children,
}: {
  number?: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className={styles.stepCard}>
      <CardHeader>
        <CardTitle>
          <h4>
            {number ? `${number}. ` : ""}
            {title}
          </h4>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ flexGrow: 1 }}>{children}</div>
      </CardContent>
    </Card>
  );
}
