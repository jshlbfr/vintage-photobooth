"use client";
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { AD_CONTENT_ROUTES } from '@/lib/site';
/** Only rendered by publisher pages. All links crossing this document boundary use native navigation. */
export function ContentAdsClient() {
  const pathname = usePathname();
  if (!AD_CONTENT_ROUTES.includes(pathname)) return null;
  return <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1193568598392219" crossOrigin="anonymous" />;
}
