// robots.txt (F-12): allow all, keep /for and /print out, point at the sitemap.
import type { APIRoute } from 'astro';
import { SITE_ORIGIN } from '../components/seo.ts';

export const GET: APIRoute = () => {
  const body = `User-agent: *\nAllow: /\nDisallow: /for/\nDisallow: /print/\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
