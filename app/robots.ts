import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  // Keep share documents crawlable so their noindex directives can be observed; never list them in sitemap.
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/'] }, sitemap: `${SITE_ORIGIN}/sitemap.xml` };
}
