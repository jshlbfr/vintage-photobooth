import { gradeCanvas } from './engine';
import type { FilterId } from './presets';

export type PreviewFrame = { bitmap: ImageBitmap; filter: FilterId };
export type PreviewResult = { bitmap: ImageBitmap; elapsed: number } | { error: true };
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<PreviewFrame>) => void) | null;
  postMessage: (result: PreviewResult, transfer?: Transferable[]) => void;
};
let canvas: OffscreenCanvas | null = null;
scope.onmessage = ({ data: { bitmap, filter } }) => {
  const started = performance.now();
  try {
    canvas ??= new OffscreenCanvas(bitmap.width, bitmap.height);
    if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
      canvas.width = bitmap.width; canvas.height = bitmap.height;
    }
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Preview canvas unavailable');
    context.drawImage(bitmap, 0, 0);
    gradeCanvas(canvas, filter);
    const output = canvas.transferToImageBitmap();
    scope.postMessage({ bitmap: output, elapsed: performance.now() - started }, [output]);
  } catch {
    scope.postMessage({ error: true });
  } finally {
    bitmap.close();
  }
};
