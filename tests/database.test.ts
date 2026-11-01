import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { initDatabase } from "@/database/schema.ts";
import {
  countUsers,
  createUser,
  deleteUser,
  getLetterboxdUser,
  getUser,
  setLetterboxdUsername,
  updateUser,
} from "@/database/services/users.ts";
import {
  getCommandRankByDateRange,
  getUsageStatsByDateRange,
  logCommand,
} from "@/database/services/commandLogs.ts";

const DB_TEST_USER_1 = 987654001;
const DB_TEST_USER_2 = 987654002;

describe("Database Services", () => {
  before(async () => {
    await initDatabase();
    await deleteUser(DB_TEST_USER_1);
    await deleteUser(DB_TEST_USER_2);
  });

  after(async () => {
    await deleteUser(DB_TEST_USER_1);
    await deleteUser(DB_TEST_USER_2);
  });

  describe("Users Service", () => {
    it("should return null when user does not exist", async () => {
      const user = await getUser(DB_TEST_USER_1);
      assert.equal(user, null);

      const username = await getLetterboxdUser(DB_TEST_USER_1);
      assert.equal(username, null);
    });

    it("should create user and retrieve letterboxd username", async () => {
      const created = await createUser(DB_TEST_USER_1, "cinephile99");
      assert.equal(created.telegram_id, DB_TEST_USER_1);
      assert.equal(created.letterboxd_username, "cinephile99");

      const user = await getUser(DB_TEST_USER_1);
      assert.notEqual(user, null);
      assert.equal(user?.letterboxd_username, "cinephile99");

      const username = await getLetterboxdUser(DB_TEST_USER_1);
      assert.equal(username, "cinephile99");
    });

    it("should update user letterboxd username", async () => {
      const updated = await updateUser(DB_TEST_USER_1, "updated_user");
      assert.notEqual(updated, null);
      assert.equal(updated?.letterboxd_username, "updated_user");

      const username = await getLetterboxdUser(DB_TEST_USER_1);
      assert.equal(username, "updated_user");
    });

    it("should use setLetterboxdUsername for create or update upsert behavior", async () => {
      // Upsert existing user
      const existing = await setLetterboxdUsername(
        DB_TEST_USER_1,
        "upserted_user",
      );
      assert.notEqual(existing, null);
      assert.equal(existing?.letterboxd_username, "upserted_user");

      // Upsert new user
      const newUser = await setLetterboxdUsername(
        DB_TEST_USER_2,
        "brand_new_user",
      );
      assert.notEqual(newUser, null);
      assert.equal(newUser?.telegram_id, DB_TEST_USER_2);
      assert.equal(newUser?.letterboxd_username, "brand_new_user");
    });

    it("should count users accurately", async () => {
      const count = await countUsers();
      assert.equal(count >= 2, true);
    });

    it("should delete user", async () => {
      await deleteUser(DB_TEST_USER_1);
      const user = await getUser(DB_TEST_USER_1);
      assert.equal(user, null);
    });
  });

  describe("Command Usage Logs Service", () => {
    it("should log command execution and retrieve date range stats", async () => {
      const testChatPrivate = DB_TEST_USER_2;
      const testChatGroup = -100123456789;

      const now = new Date();
      const startIso = new Date(now.getTime() - 60000).toISOString();

      await logCommand("lb", DB_TEST_USER_2, testChatPrivate);
      await logCommand("gridlb", DB_TEST_USER_2, testChatGroup);
      await logCommand("lb", DB_TEST_USER_2, testChatGroup);

      const endIso = new Date(now.getTime() + 60000).toISOString();

      const stats = await getUsageStatsByDateRange(startIso, endIso);
      assert.equal(stats.totalCommands >= 3, true);
      assert.equal(stats.uniqueUsers >= 1, true);

      const ranking = await getCommandRankByDateRange(startIso, endIso);
      assert.equal(ranking.length > 0, true);
      const lbRank = ranking.find((r) => r.command === "lb");
      assert.notEqual(lbRank, undefined);
      assert.equal(lbRank!.count >= 2, true);
    });
  });
});
