import Image from "next/image";
import fabric from "@public/images/kunnskap/stoffprove-i-nordisk-atelier.webp";
import comfyrobe from "@public/images/kunnskap/comfyrobe-mann-pa-kaien-sjo-utsikt-1600x900.webp";
import styles from "@/components/knowledge/knowledgeChrome.module.css";
import articleStyles from "./hydroguard.module.css";

const images = {
  "/images/kunnskap/stoffprove-i-nordisk-atelier.webp": fabric,
  "/images/kunnskap/comfyrobe-mann-pa-kaien-sjo-utsikt-1600x900.webp": comfyrobe,
};

export function EditorialFigure({ src, alt, caption }: {
  src: string;
  alt: string;
  caption: string;
  editorialPrompt?: string;
}) {
  const image = images[src as keyof typeof images];
  // Preserve the supplied caption when its planned image is not available.
  if (!image) {
    return <p className={articleStyles.captionNote}>{caption}</p>;
  }
  return (
    <figure className={styles.figure}>
      <span className={styles.figureFrame}>
        <Image src={image} alt={alt} className={styles.figureImage}
          sizes="(min-width: 42rem) 640px, calc(100vw - 40px)" />
      </span>
      <figcaption className={styles.figcaption}>{caption}</figcaption>
    </figure>
  );
}
