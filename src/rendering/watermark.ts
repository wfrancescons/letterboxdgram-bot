import {
  createGlassPillElement,
  createImageElement,
  createTextElement,
  DEFAULT_GLASS_OPTIONS,
} from "./elements.ts";
import { measureText } from "./drawers/drawText.ts";
import type { CanvasElement, GlassEffectOptions } from "./types.ts";

export const WATERMARK_URL = "boxdgrid.com";
export const WATERMARK_LOGO_SRC =
  "./src/commands/templates/assets/boxdgrid-logo.png";

export type WatermarkOptions = {
  canvasWidth: number;
  canvasHeight: number;
  footerHeight?: number;
  singleColumnThreshold?: number;
  glassOptions?: GlassEffectOptions;
  customUrl?: string;
};

export function createWatermarkElements({
  canvasWidth,
  canvasHeight,
  footerHeight = 44,
  singleColumnThreshold = 230,
  glassOptions,
  customUrl,
}: WatermarkOptions): CanvasElement[] {
  const elements: CanvasElement[] = [];

  const watermarkText = customUrl || WATERMARK_URL;
  const footerCenterY = Math.round(canvasHeight - footerHeight / 2);
  const horizontalMargin = 14;

  // 1. Multi-column version: show boxdgrid logo on the left
  if (canvasWidth > singleColumnThreshold) {
    const logoWidth = 98;
    const logoHeight = 18;
    const logoX = horizontalMargin;
    const logoY = Math.round(footerCenterY - logoHeight / 2);

    elements.push(
      createImageElement({
        src: WATERMARK_LOGO_SRC,
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
        shadow: {
          color: "rgba(0, 0, 0, 0.22)",
          offsetX: 0,
          offsetY: 1,
          blur: 3,
        },
      }),
    );
  }

  // 2. Glass pill with site URL (right-aligned on multi-column, centered on single-column)
  const pillHeight = 26;
  const fontSize = 13;
  const paddingX = 13;
  const font = `${fontSize}px "NotoSans-Bold", sans-serif`;

  const textWidth = measureText(watermarkText, font).width;
  const pillWidth = Math.round(textWidth + paddingX * 2);

  const pillX = canvasWidth > singleColumnThreshold
    ? Math.round(canvasWidth - horizontalMargin - pillWidth)
    : Math.round((canvasWidth - pillWidth) / 2);
  const pillY = Math.round(footerCenterY - pillHeight / 2);

  const effectiveGlassOptions: GlassEffectOptions = {
    ...DEFAULT_GLASS_OPTIONS,
    frost: 2,
    tint: {
      color: "#000000",
      opacity: 0.35,
    },
    shadow: {
      color: "rgba(0, 0, 0, 0.2)",
      opacity: 0.2,
      blur: 6,
      offsetX: 0,
      offsetY: 2,
    },
    ...glassOptions,
  };

  elements.push(
    createGlassPillElement({
      x: pillX,
      y: pillY,
      width: pillWidth,
      height: pillHeight,
      options: effectiveGlassOptions,
    }),
    createTextElement({
      text: watermarkText,
      x: Math.round(pillX + pillWidth / 2),
      y: Math.round(footerCenterY + fontSize * 0.35),
      font,
      fillStyle: "#ffffff",
      align: "center",
      vibrancy: "primary",
      shadow: {
        color: "rgba(0, 0, 0, 0.35)",
        offsetX: 0,
        offsetY: 1,
        blur: 2,
      },
      maxWidth: textWidth + 10,
      maxLines: 1,
    }),
  );

  return elements;
}

export default createWatermarkElements;
