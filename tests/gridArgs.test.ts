import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateGridFromCount,
  CLEAN_PARAM_ALIASES,
  NO_TITLES_PARAM_ALIASES,
  parseGridArgs,
  TIME_ALIASES,
  validateGrid,
} from "@/commands/handleGridlb.ts";

describe("Grid Arguments & Validations", () => {
  describe("parseGridArgs", () => {
    it("should parse default values when no args are provided", () => {
      const parsed = parseGridArgs("/gridlb");
      assert.equal(parsed.grid, null);
      assert.equal(parsed.param, null);
      assert.equal(parsed.time, "all");
    });

    it("should parse explicit grid size (e.g. 3x3, 4x3, 2x2)", () => {
      const p1 = parseGridArgs("/gridlb 3x3");
      assert.equal(p1.grid, "3x3");
      assert.equal(p1.param, null);

      const p2 = parseGridArgs("/gridlb 4x3 7d");
      assert.equal(p2.grid, "4x3");
      assert.equal(p2.time, "7d");
    });

    it("should parse clean / notexts aliases correctly", () => {
      for (const alias of CLEAN_PARAM_ALIASES) {
        const parsed = parseGridArgs(`/gridlb 3x3 ${alias}`);
        assert.equal(
          parsed.param,
          "notexts",
          `Failed to parse alias: ${alias}`,
        );
      }
    });

    it("should parse minimal / notitles aliases correctly", () => {
      for (const alias of NO_TITLES_PARAM_ALIASES) {
        const parsed = parseGridArgs(`/gridlb 3x3 ${alias}`);
        assert.equal(
          parsed.param,
          "notitles",
          `Failed to parse alias: ${alias}`,
        );
      }
    });

    it("should parse time aliases (7d, 15d, 1w, 30d, 1m, all, overall)", () => {
      assert.equal(parseGridArgs("/gridlb 7d").time, "7d");
      assert.equal(parseGridArgs("/gridlb 1w").time, "7d");
      assert.equal(parseGridArgs("/gridlb 15d").time, "15d");
      assert.equal(parseGridArgs("/gridlb 30d").time, "30d");
      assert.equal(parseGridArgs("/gridlb 1m").time, "1m");
      assert.equal(parseGridArgs("/gridlb all").time, "all");
      assert.equal(parseGridArgs("/gridlb overall").time, "overall");
    });

    it("should handle combination of grid, param and time in any order", () => {
      const p1 = parseGridArgs("/gridlb 4x3 clean 1m");
      assert.equal(p1.grid, "4x3");
      assert.equal(p1.param, "notexts");
      assert.equal(p1.time, "1m");

      const p2 = parseGridArgs("/gridlb 30d minimal 5x5");
      assert.equal(p2.grid, "5x5");
      assert.equal(p2.param, "notitles");
      assert.equal(p2.time, "30d");
    });
  });

  describe("validateGrid", () => {
    it("should validate and parse valid grid string into columns and rows", () => {
      assert.deepEqual(validateGrid("4x3"), { columns: 4, rows: 3 });
      assert.deepEqual(validateGrid("3x3"), { columns: 3, rows: 3 });
      assert.deepEqual(validateGrid("1x1"), { columns: 1, rows: 1 });
      assert.deepEqual(validateGrid("7x7"), { columns: 7, rows: 7 });
    });

    it("should throw COLLAGE_INCORRECT_ARGS for invalid formats", () => {
      assert.throws(() => validateGrid("invalid"), /COLLAGE_INCORRECT_ARGS/);
      assert.throws(() => validateGrid("3-3"), /COLLAGE_INCORRECT_ARGS/);
      assert.throws(() => validateGrid("3x"), /COLLAGE_INCORRECT_ARGS/);
    });

    it("should throw COLLAGE_INCORRECT_ARGS when exceeding maximum (7x7) or minimum (1x1)", () => {
      assert.throws(() => validateGrid("8x8"), /COLLAGE_INCORRECT_ARGS/);
      assert.throws(() => validateGrid("8x3"), /COLLAGE_INCORRECT_ARGS/);
      assert.throws(() => validateGrid("3x8"), /COLLAGE_INCORRECT_ARGS/);
      assert.throws(() => validateGrid("0x0"), /COLLAGE_INCORRECT_ARGS/);
      assert.throws(() => validateGrid("0x3"), /COLLAGE_INCORRECT_ARGS/);
    });
  });

  describe("calculateGridFromCount", () => {
    it("should return default grid when count is 0 or negative", () => {
      assert.deepEqual(calculateGridFromCount(0), { columns: 4, rows: 3 });
      assert.deepEqual(calculateGridFromCount(-5), { columns: 4, rows: 3 });
    });

    it("should calculate squared grid dimensions for given count", () => {
      // 4 films -> 2x2
      assert.deepEqual(calculateGridFromCount(4), { columns: 2, rows: 2 });
      // 9 films -> 3x3
      assert.deepEqual(calculateGridFromCount(9), { columns: 3, rows: 3 });
      // 12 films -> 4x3
      assert.deepEqual(calculateGridFromCount(12), { columns: 4, rows: 3 });
      // 16 films -> 4x4
      assert.deepEqual(calculateGridFromCount(16), { columns: 4, rows: 4 });
    });

    it("should clamp within MIN (1) and MAX (7)", () => {
      const large = calculateGridFromCount(100);
      assert.equal(large.columns <= 7, true);
      assert.equal(large.rows <= 7, true);
    });
  });
});
