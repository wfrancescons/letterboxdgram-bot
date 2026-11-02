import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createWatermarkElements,
  WATERMARK_LOGO_SRC,
  WATERMARK_URL,
} from "@/rendering/watermark.ts";

describe("Watermark", () => {
  it("should generate logo on the left and glass pill on the right for multi-column grids (width > 230)", () => {
    const canvasWidth = 460;
    const canvasHeight = 734;
    const elements = createWatermarkElements({
      canvasWidth,
      canvasHeight,
      footerHeight: 44,
    });

    assert.equal(elements.length, 3);

    // 1. Left logo image
    const logo = elements[0];
    assert.equal(logo.type, "image");
    if (logo.type === "image") {
      assert.equal(logo.src, WATERMARK_LOGO_SRC);
      assert.equal(logo.x, 14);
    }

    // 2. Right glass pill container
    const pill = elements[1];
    assert.equal(pill.type, "rectangle");
    assert.equal(pill.style?.type, "glass");
    if (pill.type === "rectangle") {
      assert.equal(pill.x + pill.width, canvasWidth - 14);
    }

    // 3. Watermark URL text with primary vibrancy
    const text = elements[2];
    assert.equal(text.type, "text");
    if (text.type === "text") {
      assert.equal(text.text, WATERMARK_URL);
      assert.equal(text.vibrancy, "primary");
      assert.equal(text.align, "center");
    }
  });

  it("should generate only centered glass pill and URL text for single-column grids (width <= 230)", () => {
    const canvasWidth = 230;
    const canvasHeight = 389;
    const elements = createWatermarkElements({
      canvasWidth,
      canvasHeight,
      footerHeight: 44,
    });

    assert.equal(elements.length, 2);

    // 1. Centered glass pill container
    const pill = elements[0];
    assert.equal(pill.type, "rectangle");
    assert.equal(pill.style?.type, "glass");
    if (pill.type === "rectangle") {
      const expectedX = Math.round((canvasWidth - pill.width) / 2);
      assert.equal(pill.x, expectedX);
    }

    // 2. Centered watermark URL text
    const text = elements[1];
    assert.equal(text.type, "text");
    if (text.type === "text") {
      assert.equal(text.text, WATERMARK_URL);
      assert.equal(text.vibrancy, "primary");
    }
  });
});
