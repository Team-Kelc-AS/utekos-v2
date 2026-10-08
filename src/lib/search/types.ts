export type SearchItem = { title: string; href: string; keywords: string[] };
export type SearchGroup = { label: "Produkter" | "Sider"; items: SearchItem[] };
export type SearchIndex = { groups: SearchGroup[] };
