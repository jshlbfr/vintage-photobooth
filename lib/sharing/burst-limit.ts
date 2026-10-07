/** Per-instance burst protection; not a distributed quota. No IPs or media stored. */
export class BurstLimiter {
  private entries = new Map<string, { count: number; end: number }>();
  take(key: string, limit: number, now = Date.now()) {
    for (const [id, entry] of this.entries) if (entry.end <= now) this.entries.delete(id);
    const entry = this.entries.get(key);
    if (entry) { if (entry.count >= limit) return false; entry.count++; return true; }
    if (this.entries.size >= 1024) return false;
    this.entries.set(key, { count: 1, end: now + 60000 }); return true;
  }
}
export const sharingBursts = new BurstLimiter();
