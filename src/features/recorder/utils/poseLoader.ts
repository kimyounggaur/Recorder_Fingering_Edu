const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadPose(source: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(source);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageCache.delete(source);
      reject(new Error(`Unable to load recorder pose: ${source}`));
    };
    image.src = source;
  });
  imageCache.set(source, pending);
  return pending;
}
