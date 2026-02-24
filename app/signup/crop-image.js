/**
 * Produces a circular PNG blob from the selected crop region.
 *
 * @param {string} imageSrc
 * @param {{ x: number, y: number, width: number, height: number }} pixelCrop
 * @returns {Promise<Blob>}
 */
export default function getCroppedImage(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(pixelCrop.width, pixelCrop.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        size,
        size,
        0,
        0,
        size,
        size
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Image processing failed"));
          return;
        }
        resolve(blob);
      }, "image/png");
    };
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = imageSrc;
  });
}
