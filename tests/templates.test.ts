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
    // Standard config: POSTER_WIDTH = 230, POSTER_HEIGHT = 345, bottom bar = 60
    assert.equal(template.width, 460);
    assert.equal(template.height, 750);
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

    // No glass pills or glass circles in clean mode
    const glassPills = template.elements.filter(
      (el) => el.type === "rectangle" && el.style?.type === "glass",
    );
    assert.equal(glassPills.length, 0);

    // Images for posters are present + 1 watermark logo image
    const images = template.elements.filter((el) => el.type === "image");
    assert.equal(images.length, 3);
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

    // With 5 columns and 5 rows: width = 5 * 230 = 1150, height = 5 * 345 + 60 = 1785
    assert.equal(template.width, 1150);
    assert.equal(template.height, 1785);
  });
});
