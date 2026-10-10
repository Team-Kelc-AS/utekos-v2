import { z } from 'zod';

const editorialDate = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);
const image = z.object({
  src: z.string().min(1).refine(value => value.startsWith('/') && !value.startsWith('//') && !/[?#]/.test(value), 'Expected an original local image path'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().min(1),
});
const reference = z.object({
  title: z.string(), attribution: z.string(), url: z.httpUrl().optional(),
  additionalLinks: z.array(z.object({ url: z.httpUrl(), label: z.string().min(1) })).optional(),
});
const article = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  path: z.string().startsWith('/uteguiden/'),
  title: z.string().trim().min(1), metaTitle: z.string().trim().min(1),
  metaDescription: z.string().trim().min(1), authorId: z.literal('utekos'),
  articleSection: z.string().trim().min(1), topics: z.array(z.string().min(1)),
  publishedAt: editorialDate.optional(), updatedAt: editorialDate.optional(),
  readingMinutes: z.number().int().positive().optional(),
  images: z.array(image).min(1), cardImage: image, socialImage: image,
  references: z.array(reference),
}).superRefine((value, ctx) => {
  if (value.path !== `/uteguiden/${value.slug}`) ctx.addIssue({ code: 'custom', path: ['path'], message: 'Path must match slug' });
  if (value.publishedAt && value.updatedAt && Date.parse(value.updatedAt) < Date.parse(value.publishedAt)) {
    ctx.addIssue({ code: 'custom', path: ['updatedAt'], message: 'Update precedes publication' });
  }
  if (value.socialImage.width !== 1200 || value.socialImage.height !== 630) {
    ctx.addIssue({ code: 'custom', path: ['socialImage'], message: 'Share images must be composed at 1200 × 630' });
  }
});

export function validateKnowledgeArticles(values: readonly unknown[]): void {
  z.array(article).superRefine((articles, ctx) => {
    for (const field of ['slug', 'path'] as const) {
      const seen = new Set<string>();
      articles.forEach((entry, index) => {
        if (seen.has(entry[field])) ctx.addIssue({ code: 'custom', path: [index, field], message: `Duplicate ${field}` });
        seen.add(entry[field]);
      });
    }
  }).parse(values);
}
