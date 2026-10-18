// sitemap.xml (F-12): the indexable pages only. Never /for, /print or the 404. Generated at build time.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../components/seo.ts';

const INDEXABLE = ['/', '/privacy/'];

export const GET: APIRoute = () => {
  const urls = INDEXABLE.map((p) => `  <url><loc>${SITE_ORIGIN}${p}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
