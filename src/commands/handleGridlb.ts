import gridlbTemplate from "@/commands/templates/gridlbTemplate.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLetterboxdUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import renderCanvas from "@/rendering/renderCanvas.ts";
import {
  type DiaryEntry,
  getLastFilmsSeen,
  type TimeFilter,
} from "@/services/letterboxd.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { InputFile } from "grammy";

const MAX_ROWS = 7;
const MIN_ROWS = 1;
const MAX_COLUMNS = 7;
const MIN_COLUMNS = 1;

const DEFAULT_GRID = "4x3";
const DEFAULT_TIME: TimeFilter = "all";
const GRID_REGEX = /^(\d+)x(\d+)$/;

const TIME_ALIASES: Record<string, TimeFilter> = {
  "7d": "7d",
  "15d": "15d",
  "1w": "7d",
  "30d": "30d",
  "1m": "1m",
  "all": "all",
  "overall": "overall",
};

const CLEAN_PARAM_ALIASES = [
  "notexts",
  "notext",
  "clean",
  "posters",
  "onlyposters",
];

const NO_TITLES_PARAM_ALIASES = [
  "notitles",
  "notitle",
  "minimal",
];

function parseGridArgs(rawText: string) {
  const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);

  const grid = parts.find((arg) => GRID_REGEX.test(arg)) || null;

  let param: string | null = null;
  if (parts.some((arg) => CLEAN_PARAM_ALIASES.includes(arg))) {
    param = "notexts";
  } else if (parts.some((arg) => NO_TITLES_PARAM_ALIASES.includes(arg))) {
    param = "notitles";
  }

  const timeArg = parts.find((arg) => TIME_ALIASES[arg]);
  const time: TimeFilter = timeArg ? TIME_ALIASES[timeArg] : DEFAULT_TIME;

  return { grid, param, time };
}

function validateGrid(grid: string) {
  const match = grid.match(GRID_REGEX);
  if (!match) throw "COLLAGE_INCORRECT_ARGS";

  const columns = Number(match[1]);
  const rows = Number(match[2]);

  if (
    columns > MAX_COLUMNS ||
    columns < MIN_COLUMNS ||
    rows > MAX_ROWS ||
    rows < MIN_ROWS
  ) {
    throw "COLLAGE_INCORRECT_ARGS";
  }

  return { columns, rows };
}

function calculateGridFromCount(count: number) {
  if (count <= 0) {
    return validateGrid(DEFAULT_GRID);
  }

  let columns = Math.ceil(Math.sqrt(count));
  let rows = Math.ceil(count / columns);

  columns = Math.min(Math.max(columns, MIN_COLUMNS), MAX_COLUMNS);
  rows = Math.min(Math.max(rows, MIN_ROWS), MAX_ROWS);

  return { columns, rows };
}

export default async function handleGridlb(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("gridlb", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const letterboxd_username = await getLetterboxdUser(telegram_id);
    if (!letterboxd_username) {
      throw "USER_NOT_FOUND";
    }

    const rawText = ctx.message?.text || "";
    const { grid, param, time } = parseGridArgs(rawText);

    let columns: number;
    let rows: number;
    let lastFilms: DiaryEntry[];
    let finalGrid: string;

    const shouldUseAutoGrid = !grid && time !== DEFAULT_TIME;

    if (grid) {
      ({ columns, rows } = validateGrid(grid));

      lastFilms = await getLastFilmsSeen({
        username: letterboxd_username,
        limit: columns * rows,
        time,
      });

      finalGrid = grid;
    } else if (shouldUseAutoGrid) {
      lastFilms = await getLastFilmsSeen({
        username: letterboxd_username,
        limit: MAX_COLUMNS * MAX_ROWS,
        time,
      });

      ({ columns, rows } = calculateGridFromCount(lastFilms.length));
      finalGrid = `${columns}x${rows}`;
      lastFilms = lastFilms.slice(0, columns * rows);
    } else {
      ({ columns, rows } = validateGrid(DEFAULT_GRID));

      lastFilms = await getLastFilmsSeen({
        username: letterboxd_username,
        limit: columns * rows,
        time: DEFAULT_TIME,
      });

      finalGrid = DEFAULT_GRID;
    }

    if (!lastFilms || lastFilms.length === 0) {
      throw "ZERO_ACTIVITIES";
    }

    const tip = new FormattedString(`Generating your ${finalGrid} grid...\n\n`)
      .italic(
        "💡 Tip: customize your grid with sizes, time filters, or clean styles:\n",
      )
      .code("/gridlb 4x1")
      .plain("\n")
      .code("/gridlb 7d")
      .plain("\n")
      .code("/gridlb 4x3 clean")
      .plain("\n")
      .code("/gridlb 4x3 notitles")
      .plain("\n")
      .code("/gridlb 2x2 1m");

    const progressMsg = await ctx.reply(tip.text, {
      entities: tip.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });

    await ctx.replyWithChatAction("upload_photo");

    const templateData = {
      lastFilms,
      columns,
      rows,
      param,
    };

    const template = gridlbTemplate(templateData);
    const canvasBuffer = await renderCanvas(template);

    const displayName = ctx.from?.first_name || ctx.from?.username || "User";
    const caption = `${displayName}, your ${finalGrid} grid`;

    await ctx.replyWithPhoto(new InputFile(canvasBuffer, "grid.jpg"), {
      caption,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });

    try {
      await progressMsg.delete();
    } catch {
      // Ignore error if message cannot be deleted
    }
  } catch (error) {
    await errorHandler(ctx, error);
  }
}
