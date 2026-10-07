import type { MetadataRoute } from 'next';
import { CONTENT_ROUTES, SITE_ORIGIN } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return CONTENT_ROUTES.map(path => ({ url: `${SITE_ORIGIN}${path === '/' ? '' : path}` }));
}
