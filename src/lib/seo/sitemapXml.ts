import type { MetadataRoute } from 'next';

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]!);
}

// Next 16.3.8 interpolates these fields directly into XML. Escape at this one
// output boundary, keeping the URLs used by pages and media helpers unchanged.
export function encodeSitemapEntry(entry: MetadataRoute.Sitemap[number]): MetadataRoute.Sitemap[number] {
  return {
    ...entry,
    url: escapeXml(entry.url),
    ...(entry.images && { images: entry.images.map(escapeXml) }),
    ...(entry.videos && { videos: entry.videos.map((video) => ({
      ...video,
      title: escapeXml(video.title),
      description: escapeXml(video.description),
      thumbnail_loc: escapeXml(video.thumbnail_loc),
      ...(video.content_loc && { content_loc: escapeXml(video.content_loc) }),
      ...(video.player_loc && { player_loc: escapeXml(video.player_loc) }),
    })) }),
  };
}
