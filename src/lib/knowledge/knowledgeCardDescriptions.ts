import type { KnowledgeArticle } from './knowledgeArticles';

// Card copy is intentionally separate from article text and SEO descriptions.
const descriptions: Readonly<Record<string, string | undefined>> = {
  'hvordan-holde-varmen-ute': 'Å holde varmen ute handler om balanse i kroppens eget varmeregnskap',
  'julegaven-til-den-som-har-alt': 'Velg praktisk nytteverdi til den som har alt.',
  'hva-er-glamping': 'Glamping kombinerer naturnære opplevelser med luksuriøs hotellkomfort',
  cloudweave: 'Vått vær? Slik bevarer CloudWeave™ isolasjonen i fuktig norsk nullføre.',
  'hvordan-forlenge-terassesesongen': 'Hvordan kan du forlenge utesesongen på terrassen uten dyre overraskelser?',
  'hva-skal-man-ha-innerst': 'Finnes et optimalt innerplag for all uteaktivitet?',
  hydroguard: 'Hva er hemmeligheten bak et ytterstoff som stopper regn og puster?',
  sherpacore: 'Hva gjør SherpaCore™ i stand til å fange luften som varmer kroppen?',
};

export function knowledgeCardDescription(article: Pick<KnowledgeArticle, 'slug' | 'description'>): string {
  return descriptions[article.slug] ?? article.description;
}
