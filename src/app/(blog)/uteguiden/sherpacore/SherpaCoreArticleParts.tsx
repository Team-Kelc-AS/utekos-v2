import Image from "next/image";
import Link from "next/link";
import { knowledgeAuthors } from "@/content/authors/knowledgeAuthors";
import { sherpaCoreArticle } from "@/lib/knowledge/sherpacoreArticle";
import chrome from "@/components/knowledge/knowledgeChrome.module.css";
import styles from "./sherpacore.module.css";

// Keep the supplied byline and date while using the existing original mark.
export function AuthorCard({ author, badgeAlt, publishedDate, displayDate }: {
  author: string;
  badgeAlt: string;
  publishedDate: string;
  displayDate: string;
}) {
  return (
    <aside className={`${chrome.authorCard} ${styles.panel}`} aria-label="Forfatter og publiseringsinformasjon">
      <div className={chrome.logoFrame}>
        <Image {...knowledgeAuthors.utekos.avatarImage} className={chrome.logo} sizes="80px" alt={badgeAlt} />
      </div>
      <div>
        <p className={chrome.authorName}><Link href={knowledgeAuthors.utekos.path} rel="author">{author}</Link></p>
        <p className={chrome.publicationLine}><time dateTime={publishedDate}>{displayDate}</time></p>
      </div>
    </aside>
  );
}

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
