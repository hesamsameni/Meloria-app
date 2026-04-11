const MAX_AVATAR_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_AVATAR_DIM = 512;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Failed to encode image"));
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== "undefined") return createImageBitmap(file);

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });
    return createImageBitmap(img as any);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function resizeAndCompressAvatar(file: File): Promise<File> {
  if (file.size <= MAX_AVATAR_BYTES * 0.9) return file;

  const bitmap = await loadImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_AVATAR_DIM / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const preferredType = "image/webp";
  const fallbackType = "image/jpeg";

  const tryEncode = async (type: string, quality: number) => {
    const blob = await canvasToBlob(canvas, type, quality);
    return new File(
      [blob],
      type === preferredType ? "avatar.webp" : "avatar.jpg",
      {
        type,
        lastModified: Date.now(),
      },
    );
  };

  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45];

  for (const q of qualities) {
    const out = await tryEncode(preferredType, q);
    if (out.size <= MAX_AVATAR_BYTES) return out;
  }
  for (const q of qualities) {
    const out = await tryEncode(fallbackType, q);
    if (out.size <= MAX_AVATAR_BYTES) return out;
  }

  return tryEncode(fallbackType, qualities[qualities.length - 1]);
}
