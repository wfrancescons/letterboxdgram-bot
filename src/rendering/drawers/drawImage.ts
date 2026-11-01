import { resolve } from "node:path";
import process from "node:process";
import {
  type CanvasRenderingContext2D,
  type Image,
  loadImage,
} from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import type { ImageElement } from "../types.ts";
import { drawRect } from "./drawShape.ts";

// Static local image cache (icons, logos) to optimize performance
const localImageCache = new Map<string, Image>();

async function loadCachedImage(src: string): Promise<Image> {
  if (src.startsWith("./src/")) {
    const resolved = resolve(process.cwd(), src);
    const cached = localImageCache.get(resolved);
    if (cached) return cached;

    const img = await loadImage(resolved);
    localImageCache.set(resolved, img);
    return img;
  }

  return await loadImage(src);
}

/**
 * Loads all images of a template in parallel before the sequential drawing pass.
 */
export async function preloadImages(
  srcs: string[],
): Promise<Map<string, Image | Error>> {
  const unique = [...new Set(srcs.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (src): Promise<[string, Image | Error]> => {
      try {
        return [src, await loadCachedImage(src)];
      } catch (error) {
        return [src, error instanceof Error ? error : new Error(String(error))];
      }
    }),
  );
  return new Map(entries);
}

export async function drawImage(
  ctx: CanvasRenderingContext2D,
  element: ImageElement,
  preloaded?: Map<string, Image | Error>,
): Promise<void> {
  try {
    let image: Image | null = null;
    const fromMap = preloaded?.get(element.src);
    if (fromMap && !(fromMap instanceof Error)) {
      image = fromMap;
    } else {
      image = await loadCachedImage(element.src);
    }

    await withContextEffects(ctx, element, (c) => {
      const radius = element.borderRadius ?? 0;
      if (radius > 0 && typeof c.roundRect === "function") {
        c.beginPath();
        c.roundRect(
          element.x,
          element.y,
          element.width,
          element.height,
          radius,
        );
        c.clip();
      }

      c.drawImage(image!, element.x, element.y, element.width, element.height);
    });
  } catch (error) {
    console.error("Error on loadImage:", error, element.src);
    await drawRect(ctx, {
      type: "rectangle",
      fillStyle: "rgba(0, 0, 0, 0.5)",
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    });
  }
}
