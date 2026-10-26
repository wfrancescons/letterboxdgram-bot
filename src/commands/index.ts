import config from "@/config.ts";
import type { BotContext } from "@/types/context.ts";
import { CommandGroup } from "@grammyjs/commands";

import handleBotStatus from "@/commands/dev/handleBotStatus.ts";
import handleGridlb from "@/commands/handleGridlb.ts";
import handleHelp from "@/commands/handleHelp.ts";
import handleLb from "@/commands/handleLb.ts";
import handleProfilelb from "@/commands/handleProfilelb.ts";
import handleSetlb from "@/commands/handleSetlb.ts";
import handleStart from "@/commands/handleStart.ts";
import handleWatchlistlb from "@/commands/handleWatchlistlb.ts";

export const userCommands = new CommandGroup<BotContext>();

userCommands.command("start", "Initialize the bot", handleStart);
userCommands.command("lb", "Send your last logged movie", handleLb);
userCommands.command("gridlb", "Generate a grid collage", handleGridlb);
userCommands.command(
  "profilelb",
  "Send stats from your Letterboxd",
  handleProfilelb,
);
userCommands.command(
  "watchlistlb",
  "Send your Letterboxd watchlist",
  handleWatchlistlb,
);
userCommands.command("setlb", "Set your Letterboxd username", handleSetlb);
userCommands.command("help", "Send a list of valid commands", handleHelp);

export const devCommands = new CommandGroup<BotContext>();

const adminChatIds = config.bot.devs
  .map((id) => Number(id))
  .filter((id) => !Number.isNaN(id) && id !== 0);

function registerForAdmins(
  name: string,
  description: string,
  handler: (ctx: BotContext) => Promise<void>,
) {
  const cmd = devCommands.command(name, description);
  for (const chatId of adminChatIds) {
    cmd.addToScope({ type: "chat", chat_id: chatId }, handler);
  }
}

if (adminChatIds.length > 0) {
  registerForAdmins("lb", "Send your last logged movie", handleLb);
  registerForAdmins("gridlb", "Generate a grid collage", handleGridlb);
  registerForAdmins(
    "profilelb",
    "Send stats from your Letterboxd",
    handleProfilelb,
  );
  registerForAdmins(
    "watchlistlb",
    "Send your Letterboxd watchlist",
    handleWatchlistlb,
  );
  registerForAdmins("setlb", "Set your Letterboxd username", handleSetlb);
  registerForAdmins("help", "Send a list of valid commands", handleHelp);
  registerForAdmins(
    "botstatuslb",
    "View bot server and usage statistics (Dev only)",
    handleBotStatus,
  );
}
