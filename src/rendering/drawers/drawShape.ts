import type { CanvasRenderingContext2D } from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import { renderGlassEffectShape } from "../effects/glassEffect.ts";
import type {
  CircleElement,
  LinearGradientStyle,
  RadialGradientStyle,
  RectangleElement,
} from "../types.ts";

function resolveFillStyle(
  ctx: CanvasRenderingContext2D,
  fillStyle?: string | LinearGradientStyle | RadialGradientStyle,
) {
  if (!fillStyle) return "black";
  if (typeof fillStyle === "string") return fillStyle;

  if (fillStyle.type === "linearGradient") {
    const grad = ctx.createLinearGradient(
      fillStyle.x0,
      fillStyle.y0,
      fillStyle.x1,
      fillStyle.y1,
    );
    for (const stop of fillStyle.colors) {
      grad.addColorStop(stop.stop, stop.color);
    }
    return grad;
  }

  if (fillStyle.type === "radialGradient") {
    const grad = ctx.createRadialGradient(
      fillStyle.x0,
      fillStyle.y0,
      fillStyle.r0,
      fillStyle.x1,
      fillStyle.y1,
      fillStyle.r1,
    );
    for (const stop of fillStyle.colors) {
      grad.addColorStop(stop.stop, stop.color);
    }
    return grad;
  }

  return "black";
}

export async function drawRect(
  ctx: CanvasRenderingContext2D,
  element: RectangleElement,
): Promise<void> {
  if (element.style?.type === "glass") {
    renderGlassEffectShape(
      ctx,
      {
        shape: "rectangle",
        cx: element.x + element.width / 2,
        cy: element.y + element.height / 2,
        width: element.width,
        height: element.height,
        borderRadius: element.borderRadius ?? 0,
      },
      element.style.options,
    );
    return;
  }

  await withContextEffects(ctx, element, (c) => {
    c.fillStyle = resolveFillStyle(c, element.fillStyle);
    const radius = element.borderRadius ?? 0;

    if (radius > 0 && typeof c.roundRect === "function") {
      c.beginPath();
      c.roundRect(element.x, element.y, element.width, element.height, radius);
      c.fill();
    } else {
      c.fillRect(element.x, element.y, element.width, element.height);
    }
  });
}

export async function drawCircle(
  ctx: CanvasRenderingContext2D,
  element: CircleElement,
): Promise<void> {
  const isTopLeft = element.anchor === "top-left";
  const cx = isTopLeft ? element.x + element.width / 2 : element.x;
  const cy = isTopLeft ? element.y + element.height / 2 : element.y;

  if (element.style?.type === "glass") {
    renderGlassEffectShape(
      ctx,
      {
        shape: "circle",
        cx,
        cy,
        width: element.width,
        height: element.height,
        borderRadius: Math.min(element.width, element.height) / 2,
      },
      element.style.options,
    );
    return;
  }

  await withContextEffects(ctx, element, (c) => {
    c.fillStyle = resolveFillStyle(c, element.fillStyle);
    const rx = element.width / 2;
    const ry = element.height / 2;

    c.beginPath();
    c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  });
}
