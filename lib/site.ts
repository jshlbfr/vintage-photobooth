import type { Metadata } from 'next';
export const SITE_ORIGIN = 'https://thevintagebooth.vercel.app';
export const CONTENT_ROUTES = ['/', '/how-it-works', '/features', '/faq', '/privacy', '/terms'] as const;
export const AD_CONTENT_ROUTES: readonly string[] = ['/', '/how-it-works', '/features', '/faq'];
export const SITE_CONTACT = 'the.vintage.pb@gmail.com';
export function contentMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { title, description, url: path, siteName: 'The Vintage Photobooth', type: 'website' } };
}
