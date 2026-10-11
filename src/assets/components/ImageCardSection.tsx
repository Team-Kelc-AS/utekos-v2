import "server-only";

import type { ReactNode } from "react";
import { ImageCard, type ImageCardProps } from "./ImageCard";
import styles from "./ImageCardSection.module.css";

type ImageCardSectionProps = {
  id: string;
  title: string;
  cards: readonly ImageCardProps[];
  as?: "section" | "nav";
  children?: ReactNode;
};

// Shared presentation for linked categories and editorial recommendations.
export function ImageCardSection({
  id,
  title,
  cards,
  as: Element = "section",
  children,
}: ImageCardSectionProps) {
  return (
    <Element aria-labelledby={id} className={styles.section}>
      <h2 id={id} className={styles.heading}>{title}</h2>
      <ul className={styles.grid}>
        {cards.map((card) => (
          <li key={card.href}><ImageCard {...card} /></li>
        ))}
      </ul>
      {children}
    </Element>
  );
}
