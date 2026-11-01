import { describe, it } from "node:test";
import assert from "node:assert/strict";
import formatLb from "@/commands/formatters/formatLb.ts";
import formatProfileLb from "@/commands/formatters/formatProfileLb.ts";
import formatWatchlistLb from "@/commands/formatters/formatWatchlistLb.ts";
import type {
  DiaryEntry,
  LetterboxdProfile,
} from "@/services/letterboxd/types.ts";

const samplePoster = { tiny: null, small: null, medium: null, large: null };

describe("Message Formatters", () => {
  describe("formatLb", () => {
    it("should format watched film correctly with rating and date", () => {
      const entry: DiaryEntry = {
        film: { title: "Dune", year: 2021, poster: samplePoster },
        date: {
          watched: new Date("2024-03-01T12:00:00Z").getTime(),
          published: null,
        },
        isRewatch: false,
        rating: { text: "★★★★★", score: 5 },
        review: null,
        spoilers: false,
        link: "https://letterboxd.com/film/dune-2021/",
      };

      const result = formatLb({ ...entry, displayName: "Alex" });
      assert.match(result.text, /Alex watched:/);
      assert.match(result.text, /Dune \(2021\)/);
      assert.match(result.text, /★★★★★/);
      assert.match(result.text, /📅/);
      assert.equal(result.entities.length > 0, true);
    });

    it("should format rewatched film with review and spoiler warning", () => {
      const entry: DiaryEntry = {
        film: { title: "Memento", year: 2000, poster: samplePoster },
        date: {
          watched: new Date("2024-03-01T12:00:00Z").getTime(),
          published: null,
        },
        isRewatch: true,
        rating: { text: "★★★★½", score: 4.5 },
        review: "Still mind-bending after all these years.",
        spoilers: true,
        link: "https://letterboxd.com/film/memento/",
      };

      const result = formatLb({ ...entry, displayName: "Wesley" });
      assert.match(result.text, /Wesley rewatched:/);
      assert.match(result.text, /Memento \(2000\)/);
      assert.match(result.text, /This review may contain spoilers/);
      assert.match(result.text, /Still mind-bending/);
      assert.equal(
        result.reply_markup.inline_keyboard[0][0].text,
        "Check it out on Letterboxd",
      );
      assert.equal(
        result.reply_markup.inline_keyboard[0][0].url,
        "https://letterboxd.com/film/memento/",
      );
    });
  });

  describe("formatProfileLb", () => {
    it("should format profile stats and favorites correctly", () => {
      const profile: LetterboxdProfile = {
        name: "Wesley",
        username: "wesley",
        avatar: null,
        accountType: "pro",
        stats: [
          { definition: "Films", value: 1250 },
          { definition: "This year", value: 85 },
        ],
        favourites: [
          { film: "Blade Runner 2049" },
          { film: "La La Land" },
        ],
        recentActivity: [
          {
            film: { title: "Past Lives", year: 2023, poster: samplePoster },
            rating: { text: "★★★★★", score: 5 },
            date: { watched: Date.now(), published: Date.now() },
            isRewatch: false,
            review: null,
            spoilers: false,
            link: "https://letterboxd.com/",
          },
        ],
      };

      const result = formatProfileLb({ firstName: "Wesley", profile });
      // Name ending with 'y' -> Wesley's
      assert.match(result.text, /Wesley's Letterboxd:/);
      assert.match(result.text, /📊 Stats:/);
      assert.match(result.text, /Films: 1\.250|Films: 1,250/);
      assert.match(result.text, /❤️ Favorite Films:/);
      assert.match(result.text, /Blade Runner 2049/);
      assert.match(result.text, /⏰ Recent Activity:/);
      assert.match(result.text, /Past Lives \(2023\) - ★★★★★/);
    });

    it("should handle names ending with 's' correctly (e.g. Lucas' Letterboxd)", () => {
      const profile: LetterboxdProfile = {
        name: "Lucas",
        username: "lucas",
        avatar: null,
        accountType: "free",
        stats: [],
        favourites: [],
        recentActivity: [],
      };

      const result = formatProfileLb({ firstName: "Lucas", profile });
      assert.match(result.text, /Lucas' Letterboxd:/);
    });
  });

  describe("formatWatchlistLb", () => {
    it("should format watchlist count and recently added items", () => {
      const result = formatWatchlistLb({
        displayName: "John",
        count: 42,
        recentlyAdded: ["Challengers", "Civil War", "Furiosa"],
        url: new URL("https://letterboxd.com/john/watchlist/"),
      });

      assert.match(result.text, /Watchlist for John:/);
      assert.match(result.text, /42 films to watch/);
      assert.match(result.text, /Recently added:/);
      assert.match(result.text, /• Challengers/);
      assert.match(result.text, /• Civil War/);
      assert.match(result.text, /• Furiosa/);
      assert.notEqual(result.reply_markup, undefined);
    });

    it("should format singular 'film' when count is 1", () => {
      const result = formatWatchlistLb({
        displayName: "Maria",
        count: 1,
        recentlyAdded: ["Challengers"],
        url: new URL("https://letterboxd.com/maria/watchlist/"),
      });

      assert.match(result.text, /1 film to watch/);
    });
  });
});
