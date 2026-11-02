import { describe, it } from "node:test";
import assert from "node:assert/strict";
import gridlbTemplate from "@/commands/templates/gridlbTemplate.ts";
import type { DiaryEntry } from "@/services/letterboxd/types.ts";

function createSampleEntry(
  title: string,
  year = 2024,
  score = 4.5,
): DiaryEntry {
  return {
    date: { published: Date.now(), watched: Date.now() },
    film: {
      title,
      year,
      poster: {
        tiny: "https://example.com/tiny.jpg",
        small: "https://example.com/small.jpg",
        medium: "https://example.com/medium.jpg",
        large: "https://example.com/large.jpg",
      },
    },
    rating: { text: "★★★★½", score },
    review: "A fantastic cinematic experience.",
    spoilers: false,
    isRewatch: true,
    link: `https://letterboxd.com/film/${
      title.toLowerCase().replace(/\s+/g, "-")
    }/`,
  };
}

describe("Grid Template Generation", () => {
  it("should generate 2x2 grid template with correct dimensions", () => {
    const entries = [
      createSampleEntry("Interstellar", 2014, 5.0),
      createSampleEntry("Dune: Part Two", 2024, 4.5),
      createSampleEntry("Oppenheimer", 2023, 4.5),
      createSampleEntry("The Substance", 2024, 4.0),
    ];

    const template = gridlbTemplate({
      lastFilms: entries,
      columns: 2,
      rows: 2,
      param: null,
    });

    assert.equal(template.type, "grid");
    // Standard config: POSTER_WIDTH = 230, POSTER_HEIGHT = 345, bottom bar = 44
    assert.equal(template.width, 460);
    assert.equal(template.height, 734);
    assert.equal(template.elements.length > 0, true);

    // Verify watermark element
    const watermarkText = template.elements.find(
      (el) => el.type === "text" && el.text === "boxdgrid.com",
    );
    assert.notEqual(watermarkText, undefined);

    // Verify title elements have vibrancy: "primary"
    const interstellarTitle = template.elements.find(
      (el) => el.type === "text" && el.text === "Interstellar",
    );
    assert.notEqual(interstellarTitle, undefined);
    if (interstellarTitle && interstellarTitle.type === "text") {
      assert.equal(interstellarTitle.vibrancy, "primary");
    }

    // Verify glass rating pill exists
    const glassPill = template.elements.find(
      (el) => el.type === "rectangle" && el.style?.type === "glass",
    );
    assert.notEqual(glassPill, undefined);

    // Verify rewatch/review glass circle badges exist
    const glassCircles = template.elements.filter(
      (el) => el.type === "circle" && el.style?.type === "glass",
    );
    assert.equal(glassCircles.length >= 2, true);
  });

  it("should omit text and badges when param is 'notexts' (clean mode)", () => {
    const entries = [
      createSampleEntry("Interstellar", 2014),
      createSampleEntry("The Substance", 2024),
    ];

    const template = gridlbTemplate({
      lastFilms: entries,
      columns: 2,
      rows: 1,
      param: "notexts",
    });

    // In clean mode, no text elements except watermark
    const textElements = template.elements.filter(
      (el) => el.type === "text" && el.text !== "boxdgrid.com",
    );
    assert.equal(textElements.length, 0);

    // Only the footer watermark glass pill should exist in clean mode (no poster rating pills or circle badges)
    const glassPills = template.elements.filter(
      (el) => el.type === "rectangle" && el.style?.type === "glass",
    );
    assert.equal(glassPills.length, 1);

    const glassCircles = template.elements.filter(
      (el) => el.type === "circle" && el.style?.type === "glass",
    );
    assert.equal(glassCircles.length, 0);

    // 2 crisp poster images + 1 watermark logo image (+ 2 blurred ambient glow images)
    const crispImages = template.elements.filter(
      (el) => el.type === "image" && !el.filter,
    );
    assert.equal(crispImages.length, 3);

    const ambientImages = template.elements.filter(
      (el) => el.type === "image" && Boolean(el.filter),
    );
    assert.equal(ambientImages.length, 2);
  });

  it("should omit titles and release years when param is 'notitles' (minimal mode)", () => {
    const entries = [
      createSampleEntry("Interstellar", 2014),
      createSampleEntry("The Substance", 2024),
    ];

    const template = gridlbTemplate({
      lastFilms: entries,
      columns: 2,
      rows: 1,
      param: "notitles",
    });

    // Titles must NOT be present
    const title = template.elements.find(
      (el) => el.type === "text" && el.text === "Interstellar",
    );
    assert.equal(title, undefined);

    const year = template.elements.find(
      (el) => el.type === "text" && el.text === "2014",
    );
    assert.equal(year, undefined);

    // But rating pill and badges ARE still present
    const glassPill = template.elements.find(
      (el) => el.type === "rectangle" && el.style?.type === "glass",
    );
    assert.notEqual(glassPill, undefined);
  });

  it("should calculate dimensions accurately for larger grids (e.g. 5x5)", () => {
    const entries = Array.from(
      { length: 25 },
      (_, i) => createSampleEntry(`Movie ${i + 1}`, 2020 + (i % 5)),
    );

    const template = gridlbTemplate({
      lastFilms: entries,
      columns: 5,
      rows: 5,
      param: null,
    });

    // With 5 columns and 5 rows: width = 5 * 230 = 1150, height = 5 * 345 + 44 = 1769
    assert.equal(template.width, 1150);
    assert.equal(template.height, 1769);
  });
});
