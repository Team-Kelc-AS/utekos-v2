"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import type { KnowledgeArticle } from "@/lib/knowledge/knowledgeArticles";
import styles from "./docsTableOfContents.module.css";

// Adapted from shadcn/ui's docs-toc.tsx (MIT):
// https://github.com/shadcn-ui/ui/blob/main/apps/v4/components/docs-toc.tsx
export function DocsTableOfContents({
  article,
  variant,
  title = "I denne artikkelen",
}: {
  article: Pick<KnowledgeArticle, "slug" | "toc">;
  variant: "accordion" | "list";
  title?: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(article.toc[0]?.id ?? null);
  const itemIds = useMemo(() => article.toc.map((item) => item.id), [article.toc]);
  const headingId = `${article.slug}-innhold-${variant}`;

  useEffect(() => {
    // Scope lookups to this article: Next.js can retain hidden routes in the DOM.
    const layout = navRef.current?.closest("[data-knowledge-layout]");
    if (!layout) return;

    const targets = itemIds.flatMap((id) => {
      const anchor = layout.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
      if (!anchor) return [];
      // Legacy anchors can be empty spans immediately before a heading.
      const element = anchor.matches("span:empty")
        ? anchor.nextElementSibling ?? anchor
        : anchor;
      return [{ id, element }];
    });
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      if (!navRef.current?.getClientRects().length) return;
      const activationLine = window.innerHeight / 3;
      let current: string | null = targets[0]?.id ?? null;
      for (const target of targets) {
        if (target.element.getBoundingClientRect().top <= activationLine) {
          current = target.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateActive);
    };
    const observer = new IntersectionObserver(scheduleUpdate, {
      rootMargin: "0px 0px -66.67% 0px",
    });
    targets.forEach(({ element }) => observer.observe(element));
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const articleElement = layout.querySelector("article");
    if (articleElement) resizeObserver.observe(articleElement);
    // Also cover large scroll jumps and upward scrolling between distant headings.
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [itemIds]);

  const links = (
    <ol className={styles.links}>
      {article.toc.map((item) => (
        <li key={item.id} data-depth={item.depth ?? 2}>
          <a
            href={`#${item.id}`}
            aria-current={activeId === item.id ? "location" : undefined}
            data-active={activeId === item.id}
            onClick={() => setActiveId(item.id)}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav
      ref={navRef}
      className={styles.toc}
      aria-labelledby={headingId}
      data-article-toc={variant}
    >
      {variant === "accordion" ? (
        <Accordion defaultValue={[]}>
          <AccordionItem value="contents" variant="settings">
            <AccordionTrigger
              id={headingId}
              variant="settings"
              headingLevel={2}
              typography="inherit"
            >
              {title}
            </AccordionTrigger>
            <AccordionContent variant="settings" typography="inherit" keepMounted>
              {links}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <>
          <h2 id={headingId}>{title}</h2>
          {links}
        </>
      )}
    </nav>
  );
}
