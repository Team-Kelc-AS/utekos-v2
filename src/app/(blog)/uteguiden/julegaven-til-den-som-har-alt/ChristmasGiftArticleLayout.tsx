import type { ReactNode } from "react";
import Image from "next/image";
import { ArticleReadingProgress } from "@/components/knowledge/ArticleReadingProgress";
import { KnowledgeArticleScaffold } from "@/components/knowledge/KnowledgeArticleScaffold";
import imageStyles from "@/components/knowledge/knowledgeChrome.module.css";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";

export function ChristmasGiftArticleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const article = knowledgeArticles.christmasGift;
  const heroImage = article.images[0];

  return (
    <KnowledgeArticleScaffold
      article={article}
      tocLayout="sidebar"
      hero={
        <figure className={imageStyles.figure}>
          <span className={imageStyles.figureFrame}>
            <Image
              className={imageStyles.figureImage}
              src={heroImage.src}
              alt={heroImage.alt}
              width={heroImage.width}
              height={heroImage.height}
              sizes="(min-width: 1024px) 816px, (min-width: 832px) 752px, (min-width: 800px) calc(100vw - 80px), (min-width: 400px) 90vw, calc(100vw - 40px)"
              preload
            />
          </span>
          <figcaption className={imageStyles.figcaption}>{heroImage.caption}</figcaption>
        </figure>
      }
    >
      <ArticleReadingProgress />
      {children}
    </KnowledgeArticleScaffold>
  );
}
