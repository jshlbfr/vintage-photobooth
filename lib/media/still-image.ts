import { getCoverCrop } from "../composition";

function encode(canvas: HTMLCanvasElement, type = "image/jpeg"): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("The image could not be saved. Please try again.")), type, .94));
}

export async function captureStill(video: HTMLVideoElement, mirrored: boolean) {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) throw new Error("The camera is still warming up. Try again in a moment.");
  const crop = getCoverCrop(video.videoWidth, video.videoHeight, video.clientWidth || 650, video.clientHeight || 400);
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not create a photograph.");
    if (mirrored) { context.translate(canvas.width, 0); context.scale(-1, 1); }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return { blob: await encode(canvas), width: canvas.width, height: canvas.height,
      crop: { x: crop.x / video.videoWidth, y: crop.y / video.videoHeight, width: crop.width / video.videoWidth, height: crop.height / video.videoHeight } };
  } finally { canvas.width = 0; canvas.height = 0; }
}

export async function decodeUpload(file: File, signal: AbortSignal) {
  if (!/^image\/(jpeg|png|webp|gif|avif|heic|heif)$/i.test(file.type)) throw new Error("Choose a JPEG, PNG, WebP, GIF, AVIF or supported HEIC image.");
  if (file.size > 50 * 1024 * 1024) throw new Error("This image is larger than 50 MB. Choose a smaller copy.");
  const url = URL.createObjectURL(file);
  const image = new Image();
  const canvas = document.createElement("canvas");
  const cancel = () => { image.src = ""; };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    signal.throwIfAborted(); image.src = url;
    await image.decode(); signal.throwIfAborted();
    const { naturalWidth: width, naturalHeight: height } = image;
    if (!width || !height || width * height > 40_000_000) throw new Error("Choose an image up to 40 megapixels.");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image decoding is unavailable.");
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0);
    const blob = await encode(canvas); signal.throwIfAborted();
    return { blob, width, height };
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof Error && error.name !== "EncodingError") throw error;
    throw new Error("This image could not be opened. Try a JPEG, PNG or WebP copy.");
  } finally { signal.removeEventListener("abort", cancel); image.src = ""; URL.revokeObjectURL(url); canvas.width = 0; canvas.height = 0; }
}
