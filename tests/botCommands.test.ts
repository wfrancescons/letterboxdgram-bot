import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { initDatabase } from "@/database/schema.ts";
import {
  deleteUser,
  setLetterboxdUsername,
} from "@/database/services/users.ts";
import { createMockBot } from "./helpers/mockBot.ts";
import { createTestUpdate } from "./helpers/testUpdates.ts";

const DEV_USER_ID = 288412769;
const NORMAL_USER_ID = 999801;
const TARGET_USER_ID = 999802;

const TEST_USERS = [DEV_USER_ID, NORMAL_USER_ID, TARGET_USER_ID];

const MOCK_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:letterboxd="https://letterboxd.com">
  <channel>
    <title>Letterboxd - testlbuser</title>
    <link>https://letterboxd.com/testlbuser/</link>
    <item>
      <title>Dune: Part Two, 2024 - ★★★★★</title>
      <link>https://letterboxd.com/testlbuser/film/dune-part-two/</link>
      <letterboxd:watchedDate>2024-03-01</letterboxd:watchedDate>
      <letterboxd:filmTitle>Dune: Part Two</letterboxd:filmTitle>
      <letterboxd:filmYear>2024</letterboxd:filmYear>
      <letterboxd:memberRating>5.0</letterboxd:memberRating>
      <letterboxd:rewatch>No</letterboxd:rewatch>
      <description><![CDATA[<p><img src="https://a.ltrbxd.com/resized/film-poster/1/2/3/123-dune-part-two-0-500-0-750-crop.jpg"/></p><p>Watched on Friday March 1, 2024.</p><p>Incredible masterpiece.</p>]]></description>
    </item>
  </channel>
</rss>`;

const MOCK_EMPTY_RSS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:letterboxd="https://letterboxd.com">
  <channel>
    <title>Letterboxd - emptyuser</title>
    <link>https://letterboxd.com/emptyuser/</link>
  </channel>
</rss>`;

const MOCK_PROFILE_HTML = `<!DOCTYPE html>
<html>
<body>
  <div class="profile-header"><h1 class="title-1">testlbuser</h1></div>
  <div class="profile-stats">
    <div class="profile-statistic"><span class="value">450</span><span class="definition">Films</span></div>
    <div class="profile-statistic"><span class="value">32</span><span class="definition">This year</span></div>
  </div>
  <section class="section section-favourites">
    <ul>
      <li class="poster-container">
        <div data-film-name="Interstellar" data-target-link="/film/interstellar/"></div>
      </li>
    </ul>
  </section>
</body>
</html>`;

const MOCK_WATCHLIST_HTML = `<!DOCTYPE html>
<html>
<body>
  <div class="js-watchlist-count">15 films</div>
  <ul class="grid">
    <li class="griditem">
      <div class="react-component" data-item-name="Challengers"></div>
    </li>
    <li class="griditem">
      <div class="react-component" data-item-name="Civil War"></div>
    </li>
  </ul>
</body>
</html>`;

const originalFetch = globalThis.fetch;

function setupLetterboxdFetchMock() {
  globalThis.fetch = (input: string | URL | Request) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

    if (url.includes("/invalid_user/rss/")) {
      return Promise.resolve(
        new Response("Not Found", {
          status: 404,
          headers: { "content-type": "text/html" },
        }),
      );
    }

    if (url.includes("/emptyuser/rss/")) {
      return Promise.resolve(
        new Response(MOCK_EMPTY_RSS_XML, {
          status: 200,
          headers: { "content-type": "application/xml" },
        }),
      );
    }

    if (url.includes("/rss/")) {
      return Promise.resolve(
        new Response(MOCK_RSS_XML, {
          status: 200,
          headers: { "content-type": "application/xml" },
        }),
      );
    }

    if (url.includes("/watchlist/")) {
      return Promise.resolve(
        new Response(MOCK_WATCHLIST_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );
    }

    if (url.includes("letterboxd.com/")) {
      return Promise.resolve(
        new Response(MOCK_PROFILE_HTML, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );
    }

    return Promise.resolve(new Response("", { status: 200 }));
  };
}

describe("GrammY Bot Commands (Update Handling & API Transformers)", () => {
  before(async () => {
    await initDatabase();
    for (const id of TEST_USERS) {
      await deleteUser(id);
    }
    setupLetterboxdFetchMock();
  });

  after(async () => {
    for (const id of TEST_USERS) {
      await deleteUser(id);
    }
    globalThis.fetch = originalFetch;
  });

  describe("/start command", () => {
    it("should respond with welcome message and keyboard", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/start", {
        userId: NORMAL_USER_ID,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendChatAction = filterCalls("sendChatAction");
      assert.equal(sendChatAction.length >= 1, true);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Welcome/i);
      assert.match(text, /\/setlb/);
    });
  });

  describe("/help command", () => {
    it("should return the list of valid commands", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/help", { userId: NORMAL_USER_ID });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Valid commands:/);
      assert.match(text, /\/lb/);
      assert.match(text, /\/gridlb/);
      assert.match(text, /\/profilelb/);
      assert.match(text, /\/watchlistlb/);
      assert.match(text, /\/setlb/);
    });
  });

  describe("/setlb command", () => {
    it("should instruct user when called without username argument", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/setlb", { userId: NORMAL_USER_ID });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /What's your username on Letterboxd\?/i);
      assert.match(text, /\/setlb your_username/i);
    });

    it("should fail when username is not found on Letterboxd", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/setlb invalid_user", {
        userId: NORMAL_USER_ID,
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /invalid_user isn't a valid Letterboxd user/i);
    });

    it("should register valid Letterboxd username successfully", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/setlb testlbuser", {
        userId: NORMAL_USER_ID,
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /testlbuser set as your Letterboxd username/i);
    });
  });

  describe("/lb command", () => {
    it("should prompt user to sign up if no Letterboxd account is linked", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/lb", { userId: TARGET_USER_ID });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /What's your username on Letterboxd\?/i);
    });

    it("should return formatted latest movie when user is registered", async () => {
      const { bot, filterCalls } = createMockBot();
      // Ensure NORMAL_USER_ID is registered
      await setLetterboxdUsername(NORMAL_USER_ID, "testlbuser");

      const update = createTestUpdate("/lb", {
        userId: NORMAL_USER_ID,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      // /lb sends a photo or message
      const photos = filterCalls("sendPhoto");
      const messages = filterCalls("sendMessage");
      assert.equal(photos.length + messages.length >= 1, true);

      const content = photos.length > 0
        ? (photos[0].payload.caption as string)
        : (messages[0].payload.text as string);

      assert.match(content, /Dune: Part Two/);
      assert.match(content, /★★★★★/);
    });

    it("should check last film of replied user when replying to their message", async () => {
      const { bot, filterCalls } = createMockBot();
      // Register target user
      await setLetterboxdUsername(TARGET_USER_ID, "targetlbuser");

      const update = createTestUpdate("/lb", {
        userId: NORMAL_USER_ID,
        replyToMessage: {
          userId: TARGET_USER_ID,
          firstName: "Bob",
        },
      });

      await bot.handleUpdate(update);

      const photos = filterCalls("sendPhoto");
      const messages = filterCalls("sendMessage");
      assert.equal(photos.length + messages.length >= 1, true);

      const content = photos.length > 0
        ? (photos[0].payload.caption as string)
        : (messages[0].payload.text as string);

      assert.match(content, /Dune: Part Two/);
    });
  });

  describe("/profilelb command", () => {
    it("should return user profile overview and inline button", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/profilelb", {
        userId: NORMAL_USER_ID,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice's Letterboxd:/);
      assert.match(text, /Stats:/);
      assert.match(text, /Films: 450/);
    });
  });

  describe("/watchlistlb command", () => {
    it("should return watchlist count and recent films", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/watchlistlb", {
        userId: NORMAL_USER_ID,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Watchlist for Alice:/);
      assert.match(text, /15 films to watch/);
      assert.match(text, /Challengers/);
      assert.match(text, /Civil War/);
    });
  });

  describe("Dev Commands", () => {
    describe("/userinfolb", () => {
      it("should ignore when invoked by non-dev user", async () => {
        const { bot, filterCalls } = createMockBot();
        const update = createTestUpdate("/userinfolb", {
          userId: NORMAL_USER_ID,
        });

        await bot.handleUpdate(update);

        const sendMessages = filterCalls("sendMessage");
        assert.equal(sendMessages.length, 0);
      });

      it("should guide dev to reply to a message when invoked without reply", async () => {
        const { bot, filterCalls } = createMockBot();
        const update = createTestUpdate("/userinfolb", {
          userId: DEV_USER_ID,
        });

        await bot.handleUpdate(update);

        const sendMessages = filterCalls("sendMessage");
        assert.equal(sendMessages.length, 1);
        const text = sendMessages[0].payload.text as string;
        assert.match(text, /Please reply to a user's message/i);
      });

      it("should return target user info when dev replies to their message", async () => {
        const { bot, filterCalls } = createMockBot();
        await setLetterboxdUsername(TARGET_USER_ID, "targetuser_registered");

        const update = createTestUpdate("/userinfolb", {
          userId: DEV_USER_ID,
          replyToMessage: {
            userId: TARGET_USER_ID,
            firstName: "TargetUser",
          },
        });

        await bot.handleUpdate(update);

        const sendMessages = filterCalls("sendMessage");
        assert.equal(sendMessages.length, 1);
        const text = sendMessages[0].payload.text as string;
        assert.match(text, new RegExp(String(TARGET_USER_ID)));
        assert.match(text, /targetuser_registered/);
        assert.match(text, /will be deleted in 10 seconds/i);
      });
    });

    describe("/botstatuslb", () => {
      it("should ignore when invoked by non-dev user", async () => {
        const { bot, filterCalls } = createMockBot();
        const update = createTestUpdate("/botstatuslb", {
          userId: NORMAL_USER_ID,
        });

        await bot.handleUpdate(update);

        const sendMessages = filterCalls("sendMessage");
        assert.equal(sendMessages.length, 0);
      });

      it("should return bot server stats when invoked by dev user", async () => {
        const { bot, filterCalls } = createMockBot();
        const update = createTestUpdate("/botstatuslb", {
          userId: DEV_USER_ID,
        });

        await bot.handleUpdate(update);

        const sendMessages = filterCalls("sendMessage");
        assert.equal(sendMessages.length, 1);
        const text = sendMessages[0].payload.text as string;
        assert.match(text, /BOT OVERVIEW|Server Health/i);
        assert.match(text, /Uptime/i);
        assert.match(text, /Users/i);
      });
    });
  });
});
