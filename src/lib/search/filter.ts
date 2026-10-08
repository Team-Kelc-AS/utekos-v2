import type { SearchGroup } from "./types";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("nb-NO").normalize("NFC");
}

export function filterSearchGroups(groups: SearchGroup[], query: string): SearchGroup[] {
  const normalized = normalize(query);
  const words = normalized.split(/\s+/).filter(Boolean);
  return groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const haystack = normalize([item.title, ...item.keywords].join(" "));
      return words.every((word) => haystack.includes(word));
    }).sort((a, b) => Number(normalize(b.title).startsWith(normalized)) - Number(normalize(a.title).startsWith(normalized))),
  })).filter((group) => group.items.length > 0);
}
