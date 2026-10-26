import type { CanvasRenderingContext2D } from "skia-canvas";
import type { GlassEffectOptions } from "../types.ts";
import { applyFrostBlur } from "./blur.ts";
import { clamp, parseColor, smoothstep } from "./colorUtils.ts";

export type GlassShapeGeometry = {
  shape: "circle" | "rectangle";
  /** Shape center X on canvas */
  cx: number;
  /** Shape center Y on canvas */
  cy: number;
  /** Total shape width */
  width: number;
  /** Total shape height */
  height: number;
  /** Corner border radius (for circle, equal to min(width, height) / 2) */
  borderRadius?: number;
};

/**
 * Signed Distance Function (SDF) for a rounded rectangle (or circle/pill).
 * Returns < 0 inside the shape, 0 on the exact boundary, and > 0 outside the shape.
 */
function sdfRoundedBox(
  dx: number,
  dy: number,
  halfW: number,
  halfH: number,
  radius: number,
): number {
  const r = Math.min(radius, halfW, halfH);
  const qx = Math.abs(dx) - (halfW - r);
  const qy = Math.abs(dy) - (halfH - r);

  const outX = Math.max(qx, 0);
  const outY = Math.max(qy, 0);
  const outDist = Math.hypot(outX, outY);
  const inDist = Math.min(Math.max(qx, qy), 0);

  return outDist + inDist - r;
}

/**
 * Sub-pixel bilinear sampling in an RGBA buffer for smooth refraction without aliasing.
 */
function sampleBilinear(
  buf: Uint8ClampedArray,
  bufW: number,
  bufH: number,
  fx: number,
  fy: number,
): [number, number, number, number] {
  const x = clamp(fx, 0, bufW - 1.001);
  const y = clamp(fy, 0, bufH - 1.001);

  const x0 = x | 0;
  const y0 = y | 0;
  const x1 = Math.min(x0 + 1, bufW - 1);
  const y1 = Math.min(y0 + 1, bufH - 1);

  const tx = x - x0;
  const ty = y - y0;

  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;

  const i00 = (y0 * bufW + x0) * 4;
  const i10 = (y0 * bufW + x1) * 4;
  const i01 = (y1 * bufW + x0) * 4;
  const i11 = (y1 * bufW + x1) * 4;

  const r = buf[i00] * w00 + buf[i10] * w10 + buf[i01] * w01 + buf[i11] * w11;
  const g = buf[i00 + 1] * w00 + buf[i10 + 1] * w10 + buf[i01 + 1] * w01 +
    buf[i11 + 1] * w11;
  const b = buf[i00 + 2] * w00 + buf[i10 + 2] * w10 + buf[i01 + 2] * w01 +
    buf[i11 + 2] * w11;
  const a = buf[i00 + 3] * w00 + buf[i10 + 3] * w10 + buf[i01 + 3] * w01 +
    buf[i11 + 3] * w11;

  return [r, g, b, a];
}

/**
 * Renders a geometric shape (circle, pill, rectangle, or rounded-rect)
 * applying the glass effect shader (Figma style):
 * - Crystalline 3D optical refraction (convex lens + edge meniscus)
 * - Optional frost (0 by default for clear, haze-free glass)
 * - Chromatic Aberration (RGB dispersion along curved edges)
 * - Sharp, fine specular edge highlight (without fogging the interior)
 * - Illuminated directional outline (rim light)
 */
export function renderGlassEffectShape(
  ctx: CanvasRenderingContext2D,
  geometry: GlassShapeGeometry,
  options: GlassEffectOptions = {},
): void {
  const { cx, cy, width, height, shape } = geometry;
  if (width <= 0 || height <= 0) return;

  const halfW = width / 2;
  const halfH = height / 2;
  const minHalf = Math.min(halfW, halfH);

  const cornerRadius = shape === "circle"
    ? minHalf
    : clamp(geometry.borderRadius ?? 0, 0, minHalf);

  // Configurable parameters (frost = 0 by default for pure crystalline glass)
  const refraction = options.refraction ?? 1.0;
  const depth = options.depth ?? 6;
  const frost = options.frost ?? 0;
  const chromaticAberration = options.chromaticAberration ?? 0.05;

  // Drop shadow cast by the glass piece
  const shadowColor = parseColor(
    options.shadow?.color ?? "#000000",
    options.shadow?.opacity ?? 0.42,
  );
  const shadowBlur = options.shadow?.blur ?? 5;
  const shadowOffsetX = options.shadow?.offsetX ?? 0;
  const shadowOffsetY = options.shadow?.offsetY ?? 2;

  // Translucent tint (0 by default for maximum crystalline transparency)
  const tintColor = parseColor(options.tint?.color ?? "#ffffff", 1);
  const tintOpacity = clamp(options.tint?.opacity ?? 0, 0, 1);

  // Glow / Specular Highlight
  const glowColor = parseColor(options.glow?.color ?? "#ffffff", 1);
  const glowIntensity = clamp(options.glow?.intensity ?? 0.35, 0, 2);

  // Specular border (Figma-style directional Rim Light)
  const borderAngleDeg = options.border?.angle ?? options.glow?.angle ?? 45;
  const borderAngleRad = ((borderAngleDeg - 135) * Math.PI) / 180;
  const lightDirX = Math.cos(borderAngleRad);
  const lightDirY = Math.sin(borderAngleRad);

  const borderThicknessRaw = options.border?.thickness ?? 1.5;
  const borderOpacity = clamp(options.border?.opacity ?? 0.85, 0, 1);
  const borderColor = parseColor(options.border?.color ?? "#ffffff", 1);

  // 1. Refraction / Edge Meniscus Zone (proportional to depth, keeping the lens center flat and readable)
  const effectiveDepth = Math.max(depth, 3.5);
  const refractionZone = clamp(
    effectiveDepth * 1.65,
    5.5,
    Math.min(minHalf * 0.72, 24.0),
  );

  // 2. Specular Highlight Zone (concentrated along edge curvature)
  const specularZone = clamp(
    refractionZone * 0.55,
    3.0,
    12.0,
  );

  // Realistic optical displacement scale (avoids image inversion / funhouse mirror effect)
  const maxMeniscusShift = refractionZone * 0.42;
  const maxBodyShift = Math.min(minHalf * 0.06, 2.5);
  const maxRefractionShift = Math.ceil(
    Math.abs(refraction) * (maxMeniscusShift + maxBodyShift) + 4,
  );

  const captureMargin = Math.ceil(
    Math.max(
      maxRefractionShift + frost * 2 + 6,
      shadowBlur + Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY)) +
        6,
    ),
  );

  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  const x0 = clamp(Math.floor(cx - halfW - captureMargin), 0, canvasW - 1);
  const y0 = clamp(Math.floor(cy - halfH - captureMargin), 0, canvasH - 1);
  const x1 = clamp(Math.ceil(cx + halfW + captureMargin), 0, canvasW);
  const y1 = clamp(Math.ceil(cy + halfH + captureMargin), 0, canvasH);

  const regW = x1 - x0;
  const regH = y1 - y0;
  if (regW <= 0 || regH <= 0) return;

  const originalImageData = ctx.getImageData(x0, y0, regW, regH);
  const srcPixels = originalImageData.data as Uint8ClampedArray;

  const outImageData = ctx.createImageData(regW, regH);
  const outPixels = outImageData.data;
  outPixels.set(srcPixels);

  // Only apply blur if frost > 0
  const refractedSourcePixels: Uint8ClampedArray = frost > 0.05
    ? applyFrostBlur(srcPixels, regW, regH, frost)
    : srcPixels;

  // Calibrated chromatic dispersion in pixels (avoids exaggerated rainbow artifacts)
  const caMaxPixels = chromaticAberration > 0
    ? clamp(chromaticAberration * 26, 0, 2.8)
    : 0;

  // Sharp outer edge rim width (1px to 1.5px)
  const rimSharpWidth = clamp(borderThicknessRaw * 0.42, 0.9, 1.5);

  // Effective inner bevel curvature radius (ensures smooth corners without 45° diagonal lines on rectangles)
  const roundness = clamp(cornerRadius / refractionZone, 0, 1);

  for (let py = 0; py < regH; py++) {
    const worldY = y0 + py + 0.5;
    const dy = worldY - cy;

    for (let px = 0; px < regW; px++) {
      const worldX = x0 + px + 0.5;
      const dx = worldX - cx;

      const dist = sdfRoundedBox(dx, dy, halfW, halfH, cornerRadius);
      const outIdx = (py * regW + px) * 4;

      // 1. Soft outer drop shadow outside the lens
      if (dist > -0.5 && shadowColor.a > 0 && shadowBlur > 0) {
        const sDist = sdfRoundedBox(
          dx - shadowOffsetX,
          dy - shadowOffsetY,
          halfW,
          halfH,
          cornerRadius,
        );
        if (sDist < shadowBlur) {
          const shadowFactor = 1 - smoothstep(-1, shadowBlur, sDist);
          const sa = shadowFactor * shadowFactor * shadowColor.a;
          if (sa > 0.002) {
            const bgR = outPixels[outIdx];
            const bgG = outPixels[outIdx + 1];
            const bgB = outPixels[outIdx + 2];
            outPixels[outIdx] = bgR * (1 - sa) + shadowColor.r * sa;
            outPixels[outIdx + 1] = bgG * (1 - sa) + shadowColor.g * sa;
            outPixels[outIdx + 2] = bgB * (1 - sa) + shadowColor.b * sa;
          }
        }
      }

      if (dist > 0.5) {
        continue;
      }

      const edgeAlpha = clamp(0.5 - dist, 0, 1);
      const distInside = Math.max(0, -dist);

      // 2. Normals and optical displacement combining curved geometry (circles/pills/rounded)
      //    and separable X/Y geometry (sharp rectangles), eliminating 100% of diagonal corner lines!
      const rqx = Math.max(Math.abs(dx) - (halfW - cornerRadius), 0);
      const rqy = Math.max(Math.abs(dy) - (halfH - cornerRadius), 0);
      const rLen = Math.hypot(rqx, rqy);

      let nxRound = 0;
      let nyRound = 0;
      if (rLen > 1e-4) {
        nxRound = (dx >= 0 ? 1 : -1) * (rqx / rLen);
        nyRound = (dy >= 0 ? 1 : -1) * (rqy / rLen);
      } else {
        const dX = halfW - Math.abs(dx);
        const dY = halfH - Math.abs(dy);
        if (dX < dY) {
          nxRound = dx >= 0 ? 1 : -1;
        } else {
          nyRound = dy >= 0 ? 1 : -1;
        }
      }

      const signX = dx >= 0 ? 1 : -1;
      const signY = dy >= 0 ? 1 : -1;

      // Separable profile (for sharp or slightly rounded corners: X depends only on dx, Y depends only on dy)
      const ux = clamp(1 - (halfW - Math.abs(dx)) / refractionZone, 0, 1);
      const uy = clamp(1 - (halfH - Math.abs(dy)) / refractionZone, 0, 1);
      const slopeXSharp = signX * Math.pow(ux, 2.1);
      const slopeYSharp = signY * Math.pow(uy, 2.1);

      // Radial profile (for rounded corners / circles / pills)
      const tRound = clamp(1 - distInside / refractionZone, 0, 1);
      const slopeRoundMag = Math.pow(tRound, 2.1);
      const slopeXRound = nxRound * slopeRoundMag;
      const slopeYRound = nyRound * slopeRoundMag;

      // Smooth blend based on how rounded the corner is relative to the refraction zone
      const slopeX = slopeXRound * roundness + slopeXSharp * (1 - roundness);
      const slopeY = slopeYRound * roundness + slopeYSharp * (1 - roundness);

      // Gentle convex body lens for curved shapes
      const tBody = clamp(1 - distInside / minHalf, 0, 1);
      const bodyMag = Math.sin(tBody * Math.PI * 0.5) * maxBodyShift *
        roundness;

      // 3. 3D Refraction Displacement
      const shiftX = -refraction *
        (slopeX * maxMeniscusShift + nxRound * bodyMag);
      const shiftY = -refraction *
        (slopeY * maxMeniscusShift + nyRound * bodyMag);

      // 4. Chromatic Aberration (RGB dispersion proportional to local lens slope)
      const caOffsetX = caMaxPixels * slopeX;
      const caOffsetY = caMaxPixels * slopeY;

      const rShiftX = shiftX - caOffsetX;
      const rShiftY = shiftY - caOffsetY;

      const gShiftX = shiftX;
      const gShiftY = shiftY;

      const bShiftX = shiftX + caOffsetX;
      const bShiftY = shiftY + caOffsetY;

      const [rSample] = sampleBilinear(
        refractedSourcePixels,
        regW,
        regH,
        px + rShiftX,
        py + rShiftY,
      );
      const [, gSample] = sampleBilinear(
        refractedSourcePixels,
        regW,
        regH,
        px + gShiftX,
        py + gShiftY,
      );
      const [, , bSample] = sampleBilinear(
        refractedSourcePixels,
        regW,
        regH,
        px + bShiftX,
        py + bShiftY,
      );

      let glassR = rSample;
      let glassG = gSample;
      let glassB = bSample;

      // 5. Subtle optical lens clarity boost
      const lensClarityBoost = 1.02;
      glassR = clamp((glassR - 128) * lensClarityBoost + 128, 0, 255);
      glassG = clamp((glassG - 128) * lensClarityBoost + 128, 0, 255);
      glassB = clamp((glassB - 128) * lensClarityBoost + 128, 0, 255);

      // 6. Translucent tint (if configured)
      if (tintOpacity > 0) {
        glassR = glassR * (1 - tintOpacity) + tintColor.r * tintOpacity;
        glassG = glassG * (1 - tintOpacity) + tintColor.g * tintOpacity;
        glassB = glassB * (1 - tintOpacity) + tintColor.b * tintOpacity;
      }

      // 7. Polished Glass Specular Reflection (without 45° diagonal corner seams)
      const sx = clamp(1 - (halfW - Math.abs(dx)) / specularZone, 0, 1);
      const sy = clamp(1 - (halfH - Math.abs(dy)) / specularZone, 0, 1);
      const tSpecRound = clamp(1 - distInside / specularZone, 0, 1);

      const specVecX = nxRound * Math.pow(tSpecRound, 2.2) * roundness +
        signX * Math.pow(sx, 2.2) * (1 - roundness);
      const specVecY = nyRound * Math.pow(tSpecRound, 2.2) * roundness +
        signY * Math.pow(sy, 2.2) * (1 - roundness);
      const specMag = Math.min(1, Math.hypot(specVecX, specVecY));

      if (specMag > 0.001) {
        const specDot = specVecX * lightDirX + specVecY * lightDirY;
        const primarySpec = Math.max(0, specDot);
        const bounceSpec = Math.max(0, -specDot);

        const topHighlight = Math.pow(primarySpec, 1.6) * glowIntensity * 0.55;
        const bottomCaustic = Math.pow(bounceSpec, 2.2) * glowIntensity * 0.28;
        const subtleRim = Math.pow(specMag, 1.4) * glowIntensity * 0.14;

        const totalSpec = clamp(topHighlight + bottomCaustic + subtleRim, 0, 1);
        glassR = glassR + (glowColor.r - glassR) * totalSpec;
        glassG = glassG + (glowColor.g - glassG) * totalSpec;
        glassB = glassB + (glowColor.b - glassB) * totalSpec;
      }

      // 8. Fine Specular Edge Outline (Rim Light) Figma style
      if (borderOpacity > 0 && borderThicknessRaw > 0) {
        const outerEdgeRim = 1 - smoothstep(0, rimSharpWidth, distInside);
        if (outerEdgeRim > 0.002) {
          const rimNx = nxRound * roundness + signX * ux * (1 - roundness);
          const rimNy = nyRound * roundness + signY * uy * (1 - roundness);
          const rimLen = Math.hypot(rimNx, rimNy) || 1;
          const rimDot = (rimNx / rimLen) * lightDirX +
            (rimNy / rimLen) * lightDirY;
          const primaryRim = Math.max(0, rimDot);
          const bounceRim = Math.max(0, -rimDot);

          const angularFactor = 0.25 +
            0.75 * Math.pow(primaryRim, 1.4) +
            0.45 * Math.pow(bounceRim, 2.0);

          const rimAlpha = clamp(
            outerEdgeRim * borderOpacity * angularFactor,
            0,
            1,
          );
          glassR = glassR + (borderColor.r - glassR) * rimAlpha;
          glassG = glassG + (borderColor.g - glassG) * rimAlpha;
          glassB = glassB + (borderColor.b - glassB) * rimAlpha;
        }
      }

      // 9. Final composition with boundary anti-aliasing
      const baseR = outPixels[outIdx];
      const baseG = outPixels[outIdx + 1];
      const baseB = outPixels[outIdx + 2];

      outPixels[outIdx] = clamp(
        Math.round(baseR * (1 - edgeAlpha) + glassR * edgeAlpha),
        0,
        255,
      );
      outPixels[outIdx + 1] = clamp(
        Math.round(baseG * (1 - edgeAlpha) + glassG * edgeAlpha),
        0,
        255,
      );
      outPixels[outIdx + 2] = clamp(
        Math.round(baseB * (1 - edgeAlpha) + glassB * edgeAlpha),
        0,
        255,
      );
      outPixels[outIdx + 3] = 255;
    }
  }

  ctx.putImageData(outImageData, x0, y0);
}

// Backwards compatibility alias
export const renderLiquidGlassShape = renderGlassEffectShape;
