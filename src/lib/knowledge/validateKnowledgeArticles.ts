import * as z from '@/lib/validation/zodMini';

const editorialDate = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);
const image = z.object({
  src: z.string().check(z.minLength(1), z.refine(value => value.startsWith('/') && !value.startsWith('//') && !/[?#]/.test(value), 'Expected an original local image path')),
  width: z.number().check(z.int(), z.gt(0)),
  height: z.number().check(z.int(), z.gt(0)),
  alt: z.string().check(z.trim(), z.minLength(1)),
});
const reference = z.object({
  title: z.string(), attribution: z.string(), url: z.optional(z.httpUrl()),
  additionalLinks: z.optional(z.array(z.object({ url: z.httpUrl(), label: z.string().check(z.minLength(1)) }))),
});
const article = z.object({
  slug: z.string().check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  path: z.string().check(z.startsWith('/uteguiden/')),
  title: z.string().check(z.trim(), z.minLength(1)), metaTitle: z.string().check(z.trim(), z.minLength(1)),
  metaDescription: z.string().check(z.trim(), z.minLength(1)), authorId: z.literal('utekos'),
  articleSection: z.string().check(z.trim(), z.minLength(1)), topics: z.array(z.string().check(z.minLength(1))),
  publishedAt: z.optional(editorialDate), updatedAt: z.optional(editorialDate),
  readingMinutes: z.optional(z.number().check(z.int(), z.gt(0))),
  images: z.array(image).check(z.minLength(1)), cardImage: image, socialImage: image,
  references: z.array(reference),
}).check(z.superRefine((value, ctx) => {
  if (value.path !== `/uteguiden/${value.slug}`) ctx.addIssue({ code: 'custom', path: ['path'], message: 'Path must match slug' });
  if (value.publishedAt && value.updatedAt && Date.parse(value.updatedAt) < Date.parse(value.publishedAt)) {
    ctx.addIssue({ code: 'custom', path: ['updatedAt'], message: 'Update precedes publication' });
  }
  if (value.socialImage.width !== 1200 || value.socialImage.height !== 630) {
    ctx.addIssue({ code: 'custom', path: ['socialImage'], message: 'Share images must be composed at 1200 × 630' });
  }
}));

export function validateKnowledgeArticles(values: readonly unknown[]): void {
  z.array(article).check(z.superRefine((articles, ctx) => {
    for (const field of ['slug', 'path'] as const) {
      const seen = new Set<string>();
      articles.forEach((entry, index) => {
        if (seen.has(entry[field])) ctx.addIssue({ code: 'custom', path: [index, field], message: `Duplicate ${field}` });
        seen.add(entry[field]);
      });
    }
  })).parse(values);
}
