import type { NextConfig } from "next";
// Enforce low-risk protections now; observe resource restrictions before enforcement.
// Static Next hydration needs inline scripts. The observed policy has no unsafe-eval exception.
const observedCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.googleadservices.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.googleadservices.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.googleadservices.com",
  "frame-src https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
  "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
].join('; ');
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      ...(process.env.VERCEL_ENV === 'preview' ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] : []),
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=(), browsing-topics=()' },
      { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Content-Security-Policy-Report-Only', value: observedCsp }] : []),
      // Vercel supplies production HTTPS/HSTS. Do not apply HSTS to local HTTP.
    ] }, { source: '/share/:path*', headers: [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
    ] }];
  },
};
export default nextConfig;
