import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createCircleElement,
  createGlassCircleElement,
  createGlassPillElement,
  createGradientRectangle,
  createImageElement,
  createRectangleElement,
  createTextElement,
  DEFAULT_GLASS_OPTIONS,
} from "@/rendering/elements.ts";

describe("Rendering Elements Builders", () => {
  it("should create text element with all fields preserved and vibrancy support", () => {
    const el = createTextElement({
      text: "Interstellar",
      x: 10,
      y: 20,
      font: "bold 24px sans-serif",
      fillStyle: "#ffffff",
      align: "center",
      vibrancy: "primary",
      maxWidth: 200,
      maxLines: 2,
      lineHeight: 28,
      shadow: {
        color: "rgba(0, 0, 0, 0.7)",
        blur: 4,
        offsetX: 2,
        offsetY: 2,
      },
    });

    assert.equal(el.type, "text");
    assert.equal(el.text, "Interstellar");
    assert.equal(el.x, 10);
    assert.equal(el.y, 20);
    assert.equal(el.vibrancy, "primary");
    assert.equal(el.align, "center");
    assert.equal(el.maxWidth, 200);
    assert.equal(el.maxLines, 2);
    assert.equal(el.lineHeight, 28);
    assert.deepEqual(el.shadow, {
      color: "rgba(0, 0, 0, 0.7)",
      blur: 4,
      offsetX: 2,
      offsetY: 2,
    });
  });

  it("should create image element with shadow and borderRadius", () => {
    const el = createImageElement({
      src: "https://example.com/poster.jpg",
      x: 0,
      y: 0,
      width: 300,
      height: 450,
      borderRadius: 12,
      shadow: {
        color: "#000000",
        blur: 10,
        offsetX: 0,
        offsetY: 4,
      },
    });

    assert.equal(el.type, "image");
    assert.equal(el.src, "https://example.com/poster.jpg");
    assert.equal(el.width, 300);
    assert.equal(el.height, 450);
    assert.equal(el.borderRadius, 12);
  });

  it("should create rectangle element with rotation and solid color", () => {
    const rect = createRectangleElement({
      x: 10,
      y: 10,
      width: 100,
      height: 50,
      fillStyle: "#ff0000",
      borderRadius: 8,
      rotation: 15,
    });

    assert.equal(rect.type, "rectangle");
    assert.equal(rect.fillStyle, "#ff0000");
    assert.equal(rect.borderRadius, 8);
    assert.equal(rect.rotation, 15);
  });

  it("should create circle element with dimensions", () => {
    const circle = createCircleElement({
      x: 50,
      y: 50,
      width: 30,
      height: 30,
      fillStyle: "#ffffff",
    });

    assert.equal(circle.type, "circle");
    assert.equal(circle.x, 50);
    assert.equal(circle.y, 50);
    assert.equal(circle.width, 30);
    assert.equal(circle.height, 30);
    assert.equal(circle.fillStyle, "#ffffff");
  });

  it("should create glass pill element with auto borderRadius (height / 2) and default glass options", () => {
    const pill = createGlassPillElement({
      x: 20,
      y: 30,
      width: 120,
      height: 36,
    });

    assert.equal(pill.type, "rectangle");
    assert.equal(pill.borderRadius, 18);
    assert.equal(pill.style?.type, "glass");
    assert.equal(
      pill.style?.options?.refraction,
      DEFAULT_GLASS_OPTIONS.refraction,
    );
    assert.equal(
      pill.style?.options?.dispersion,
      DEFAULT_GLASS_OPTIONS.dispersion,
    );
    assert.equal(pill.style?.options?.frost, DEFAULT_GLASS_OPTIONS.frost);
  });

  it("should allow overriding glass options on glass pill element", () => {
    const pill = createGlassPillElement({
      x: 10,
      y: 10,
      width: 80,
      height: 40,
      borderRadius: 10,
      options: {
        frost: 0.8,
        depth: 8,
      },
    });

    assert.equal(pill.borderRadius, 10);
    assert.equal(pill.style?.options?.frost, 0.8);
    assert.equal(pill.style?.options?.depth, 8);
    // Preserves other default options
    assert.equal(
      pill.style?.options?.refraction,
      DEFAULT_GLASS_OPTIONS.refraction,
    );
  });

  it("should create glass circle element with center coordinates and diameter", () => {
    const glassCircle = createGlassCircleElement({
      cx: 150,
      cy: 200,
      diameter: 44,
    });

    assert.equal(glassCircle.type, "circle");
    assert.equal(glassCircle.x, 150);
    assert.equal(glassCircle.y, 200);
    assert.equal(glassCircle.width, 44);
    assert.equal(glassCircle.height, 44);
    assert.equal(glassCircle.style?.type, "glass");
    assert.equal(
      glassCircle.style?.options?.refraction,
      DEFAULT_GLASS_OPTIONS.refraction,
    );
  });

  it("should create gradient rectangle positioned at the bottom", () => {
    const grad = createGradientRectangle({
      x: 0,
      y: 0,
      width: 300,
      height: 450,
      gradientHeight: 180,
      direction: "bottom",
    });

    assert.equal(grad.type, "rectangle");
    assert.equal(grad.x, 0);
    assert.equal(grad.y, 270);
    assert.equal(grad.width, 300);
    assert.equal(grad.height, 180);
    assert.equal(typeof grad.fillStyle, "object");
  });

  it("should create gradient rectangle with custom color stops", () => {
    const stops = [
      { stop: 0, color: "rgba(0,0,0,0)" },
      { stop: 1, color: "rgba(0,0,0,0.9)" },
    ];
    const grad = createGradientRectangle({
      x: 10,
      y: 10,
      width: 100,
      height: 200,
      gradientHeight: 50,
      direction: "top",
      colors: stops,
    });

    assert.equal(grad.y, 10);
    assert.equal(grad.height, 50);
    if (
      typeof grad.fillStyle === "object" && grad.fillStyle &&
      "colorStops" in grad.fillStyle
    ) {
      assert.deepEqual(grad.fillStyle.colorStops, stops);
    }
  });
});
