/** Browser-only helpers for turning a chosen photo into an upload-sized JPEG. */

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize to fit within maxDimension and re-encode as JPEG. Keeps uploads
 * small (a phone photo becomes ~150 KB) and strips EXIF, including location.
 */
export function resizeImage(dataUrl: string, maxDimension = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = dataUrl;
  });
}

export function splitDataUrl(dataUrl: string): { mediaType: string; data: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (!m) throw new Error("Not a data URL");
  return { mediaType: m[1], data: m[2] };
}
