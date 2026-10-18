import Image from "next/image";
import { sherpaCoreArticle } from "@/lib/knowledge/sherpacoreArticle";
import chrome from "@/components/knowledge/knowledgeChrome.module.css";

// Render the supplied original where available. Keep the remaining editorial
// inputs without requesting missing images or substituting product photographs.
export function EditorialFigure({ src, alt, caption }: {
  src: string;
  alt: string;
  caption: string;
  editorialPrompt?: string;
}) {
  const image = sherpaCoreArticle.images.find((image) => image.src === src);
  return (
    <figure className={chrome.figure}>
      {image ? (
        <span className={chrome.figureFrame}>
          <Image {...image} alt={alt} className={chrome.figureImage} sizes="(min-width: 56rem) 51rem, calc(100vw - 2.5rem)" />
        </span>
      ) : null}
      <figcaption className={chrome.figcaption}>{caption}</figcaption>
    </figure>
  );
}
