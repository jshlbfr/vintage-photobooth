import type { MediaReference } from "../session/types";

/** Browser-local ownership. Only IDs/dimensions enter session state. */
export class MediaResourceStore {
  private entries = new Map<string, { blob: Blob; url: string }>();
  add(blob: Blob, width: number, height: number): MediaReference {
    const resourceId = crypto.randomUUID();
    this.entries.set(resourceId, { blob, url: URL.createObjectURL(blob) });
    return { kind: "local", resourceId, mimeType: blob.type, width, height };
  }
  resolve = (reference: MediaReference): string | undefined => reference.kind === "sample"
    ? reference.src : this.entries.get(reference.resourceId)?.url;
  getBlob(id: string) { return this.entries.get(id)?.blob; }
  release(id: string) {
    const entry = this.entries.get(id);
    if (entry) { URL.revokeObjectURL(entry.url); this.entries.delete(id); }
  }
  clear() { for (const id of this.entries.keys()) this.release(id); }
}
