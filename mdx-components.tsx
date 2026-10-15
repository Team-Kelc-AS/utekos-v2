/** Shared MDX registry. Component implementations live in @/components/mdx. */
import type { MDXComponents } from "mdx/types";
import { mdxTypography } from "@/components/mdx/typography";
import { MdxContent } from "@/components/mdx/content";
import { Callout } from "@/components/mdx/callout";
import { SizeFitCallout } from "@/components/mdx/document-callout";
import { MdxCard } from "@/components/mdx/card";
import { Details, Summary } from "@/components/mdx/disclosure";
import { Table, MeasurementTable } from "@/components/mdx/table";
import {
  TableOfContents,
  ArticleTableOfContents,
} from "@/components/mdx/table-of-contents";
import { ArticleSection } from "@/components/mdx/article-section";
import { ArticleReferences, Cite, References } from "@/components/mdx/references";
import { ArticleMeta } from "@/components/mdx/article-meta";
import { Lead } from "@/components/mdx/lead";
import { CardGrid, InfoCard } from "@/components/mdx/card-grid";
import { Steps, Step } from "@/components/mdx/steps";
import { DoDont, Do, Dont } from "@/components/mdx/do-dont";
import { MdxTabs, MdxTab, SpecRow } from "@/components/mdx/mdx-tabs";
import { Faq, FaqItem } from "@/components/mdx/faq";
import { ArticleImage } from "@/components/knowledge/ArticleImage";
import { KnowledgeCallout } from "@/components/knowledge/KnowledgeCallout";
import { KnowledgeArticleMeta } from "@/components/knowledge/KnowledgeArticleMeta";
import { SizeGuideCallout } from "@/components/size-guide/SizeGuideCallout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const components = {
  ...mdxTypography,
  wrapper: MdxContent,
  Lead,
  CardGrid,
  InfoCard,
  Steps,
  Step,
  DoDont,
  Do,
  Dont,
  MdxTabs,
  MdxTab,
  SpecRow,
  Faq,
  FaqItem,
  // Existing names retained for current MDX documents.
  ArticleImage,
  KnowledgeCallout,
  SizeGuideCallout,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Card: MdxCard,
  CardHeader,
  CardTitle,
  CardContent,
  MeasurementTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ArticleTableOfContents,
  ArticleSection,
  ArticleReferences,
  KnowledgeArticleMeta,
  // Shared primitives for new documents, no per-document imports needed.
  Callout,
  SizeFitCallout,
  Cite,
  References,
  ArticleMeta,
  TableOfContents,
  Details,
  Summary,
  Table,
} satisfies MDXComponents;

declare global {
  type MDXProvidedComponents = typeof components;
}

// Current Next.js convention: zero arguments. Local MDX overrides belong on
// <Content components={...} />; the compiler merges those with this registry.
export function useMDXComponents(): MDXComponents {
  return components;
}
