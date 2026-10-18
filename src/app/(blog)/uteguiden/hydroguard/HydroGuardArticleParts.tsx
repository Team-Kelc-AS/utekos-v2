import Image from "next/image";
import fabric from "@public/images/kunnskap/stoffprove-i-nordisk-atelier.webp";
import comfyrobe from "@public/images/kunnskap/comfyrobe-mann-pa-kaien-sjo-utsikt-1600x900.webp";
import styles from "@/components/knowledge/knowledgeChrome.module.css";

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
  return (
    <figure className={styles.figure}>
      {image ? (
        <span className={styles.figureFrame}>
          <Image src={image} alt={alt} className={styles.figureImage}
            sizes="(min-width: 56rem) 51rem, calc(100vw - 2.5rem)" />
        </span>
      ) : null}
      <figcaption className={styles.figcaption}>{caption}</figcaption>
    </figure>
  );
}
