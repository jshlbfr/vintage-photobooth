export const SHARE_TTL_MS=10*60*1000;
// Below Vercel’s 4.5 MB request and response limit.
export const MAX_SHARE_BYTES=4_000_000;
export const SHARE_ID=/^[a-f0-9]{48}$/;
export function activeShare(expiresAt:string,now=Date.now()){return Number.isFinite(Date.parse(expiresAt))&&now<Date.parse(expiresAt);}
export const PRIVATE_HEADERS={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, noarchive'};
