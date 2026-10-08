import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/site';
export default function robots(): MetadataRoute.Robots {
  if(process.env.VERCEL_ENV === 'preview')return {rules:{userAgent:'*',disallow:'/'}};
  // Keep share documents crawlable so their noindex directives can be observed; never list them in sitemap.
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/'] }, sitemap: `${SITE_ORIGIN}/sitemap.xml` };
}
