import type { ReactNode } from "react";
import Image from "next/image";
import { KnowledgeArticleScaffold } from "@/components/knowledge/KnowledgeArticleScaffold";
import imageStyles from "@/components/knowledge/knowledgeChrome.module.css";
import { knowledgeArticles } from "@/lib/knowledge/knowledgeArticles";

export function ChristmasGiftArticleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <KnowledgeArticleScaffold
      article={knowledgeArticles.christmasGift}
      heroPlacement="after-title"
      hero={
        <figure className={imageStyles.figure}>
          <span className={imageStyles.figureFrame}>
            <Image
              className={imageStyles.figureImage}
              src="/images/kunnskap/julegavenes_mystiske_spadom.webp"
              alt="En rådvill julegavehandler søker råd hos en spåkone, omgitt av tankebobler med mulige gaver."
              width={1260}
              height={709}
              sizes="(min-width: 1024px) 816px, (min-width: 832px) 752px, (min-width: 800px) calc(100vw - 80px), (min-width: 400px) 90vw, calc(100vw - 40px)"
              preload
            />
          </span>
        </figure>
      }
    >
      {children}
    </KnowledgeArticleScaffold>
  );
}
