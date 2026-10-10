import Breadcrumbs from "@/components/Breadcrumbs";
import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import { knowledgeBreadcrumbs } from "@/lib/knowledge/knowledgeBreadcrumbs";
import styles from "./knowledgeChrome.module.css";

export function KnowledgeArticleBreadcrumbs({
  article,
}: {
  article: Pick<KnowledgeArticle, "title" | "path">;
}) {
  return (
    <div className={styles.breadcrumbs}>
      <Breadcrumbs
        items={knowledgeBreadcrumbs(article).map((item, index, items) =>
          index === items.length - 1 ? { label: item.label } : item,
        )}
      />
    </div>
  );
}
