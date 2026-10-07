import 'server-only';
import { PRIVATE_HEADERS } from './policy';
export class ShareError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
/** Never log bodies, URLs, exception messages or credentials. */
export function shareError(error: unknown, operation: string) {
  if (!(error instanceof ShareError)) console.error(JSON.stringify({ event: 'sharing_failure', operation }));
  const status = error instanceof ShareError ? error.status : 503;
  return Response.json({ error: error instanceof ShareError ? error.message : 'Temporary sharing is unavailable. Please try again.' }, {
    status, headers: { ...PRIVATE_HEADERS, ...(status === 429 ? { 'Retry-After': '60' } : {}) },
  });
}
export async function boundedBody(request: Request, limit: number) {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > limit)) throw new ShareError(413, 'The request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new ShareError(400, 'The request body is missing.');
  const chunks: Uint8Array[] = []; let size = 0, timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 15000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut) throw new ShareError(408, 'The upload timed out. Please try again.');
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new ShareError(413, 'The request is too large.'); }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally { clearTimeout(timer); reader.releaseLock(); }
}
