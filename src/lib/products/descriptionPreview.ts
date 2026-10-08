export function descriptionPreview(text: string, maxCharacters = 300) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const characters = Array.from(normalized);
  const limit = Math.max(1, Math.floor(maxCharacters));
  if (characters.length <= limit) return { text: normalized, truncated: false };
  const excerpt = characters.slice(0, limit).join('');
  const lastSpace = excerpt.lastIndexOf(' ');
  const preview = lastSpace > excerpt.length / 2 ? excerpt.slice(0, lastSpace) : excerpt;
  return { text: `${preview.trimEnd()}…`, truncated: true };
}
