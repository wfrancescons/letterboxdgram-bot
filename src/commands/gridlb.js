import { logCommand } from "../database/services/commandUsageLog.js";
import { getLetterboxdUser } from "../database/services/user.js";
import errorHandler from "../handlers/errorHandler.js";
import renderCanvas from "../rendering/renderCanva.js";
import { getLastFilmsSeen } from "../services/letterboxd.js";
import createEntity from "../utils/createEntity.js";
import { sendPhotoMessage, sendTextMessage } from "../utils/messageSender.js";
import gridlbTemplate from "./templates/gridlbTemplate.js";

const MAX_ROWS = 7;
const MIN_ROWS = 1;
const MAX_COLUMNS = 7;
const MIN_COLUMNS = 1;

const DEFAULT_GRID = "4x3";
const DEFAULT_TIME = "all";
const GRID_REGEX = /^(\d+)x(\d+)$/;

const TIME_ALIASES = {
    "7d": "7d",
    "15d": "15d",
    "1w": "15d",
    "30d": "1m",
    "1m": "1m",
    "all": "all",
    "overall": "all",
};

function parseArgs(args) {
    const safeArgs = (args || []).filter((arg) => typeof arg === "string");

    const grid = safeArgs.find((arg) => arg.match(GRID_REGEX)) || null;
    const param = safeArgs.find((arg) => arg === "notexts");

    const timeArg = safeArgs.find((arg) => TIME_ALIASES[arg]);
    const time = timeArg ? TIME_ALIASES[timeArg] : DEFAULT_TIME;

    return { grid, param, time };
}

function validateGrid(grid) {
    const match = grid.match(GRID_REGEX);
    if (!match) throw "COLLAGE_INCORRECT_ARGS";

    const COLUMNS = Number(match[1]);
    const ROWS = Number(match[2]);

    if (
        COLUMNS > MAX_COLUMNS ||
        COLUMNS < MIN_COLUMNS ||
        ROWS > MAX_ROWS ||
        ROWS < MIN_ROWS
    ) {
        throw "COLLAGE_INCORRECT_ARGS";
    }

    return { COLUMNS, ROWS };
}

function calculateGridFromCount(count) {
    if (count <= 0) {
        return validateGrid(DEFAULT_GRID);
    }

    let columns = Math.ceil(Math.sqrt(count));
    let rows = Math.ceil(count / columns);

    columns = Math.min(Math.max(columns, MIN_COLUMNS), MAX_COLUMNS);
    rows = Math.min(Math.max(rows, MIN_ROWS), MAX_ROWS);

    return { COLUMNS: columns, ROWS: rows };
}

async function gridlb(ctx) {
    const telegram_id = ctx.message.from.id;
    const chat_id = ctx.message.chat.id;
    const first_name = ctx.update.message.from.first_name;
    const args = ctx.update.message.text.trim().toLowerCase().split(" ");

    logCommand("gridlb", telegram_id, chat_id);

    try {
        await ctx.replyWithChatAction("typing");

        const letterboxd_user = await getLetterboxdUser(telegram_id);
        if (!letterboxd_user) throw "USER_NOT_FOUND";

        const { grid, param, time } = parseArgs(args);

        let COLUMNS;
        let ROWS;
        let lastFilms;
        let finalGrid;

        const shouldUseAutoGrid = !grid && time !== DEFAULT_TIME;

        if (grid) {
            ({ COLUMNS, ROWS } = validateGrid(grid));

            lastFilms = await getLastFilmsSeen(
                letterboxd_user,
                COLUMNS * ROWS,
                time,
            );

            finalGrid = grid;
        } else if (shouldUseAutoGrid) {
            lastFilms = await getLastFilmsSeen(
                letterboxd_user,
                MAX_COLUMNS * MAX_ROWS,
                time,
            );

            ({ COLUMNS, ROWS } = calculateGridFromCount(lastFilms.length));
            finalGrid = `${COLUMNS}x${ROWS}`;

            lastFilms = lastFilms.slice(0, COLUMNS * ROWS);
        } else {
            ({ COLUMNS, ROWS } = validateGrid(DEFAULT_GRID));

            lastFilms = await getLastFilmsSeen(
                letterboxd_user,
                COLUMNS * ROWS,
                DEFAULT_TIME,
            );

            finalGrid = DEFAULT_GRID;
        }

        const responseExtra = {
            reply_to_message_id: ctx.message?.message_id,
            entities: [],
        };

        const examplesCommand = [
            "/gridlb 4x1",
            "/gridlb 7d",
            "/gridlb 4x3 notexts",
            "/gridlb 2x2 1m",
        ];
        const tipText =
            "💡 Tip: you can define your grid or make a collage with no text\n";

        const responseMessage = `Generating your ${finalGrid} grid...\n` +
            `\n${tipText}` +
            `${examplesCommand.join("\n")}`;

        responseExtra.entities.push(
            createEntity(
                responseMessage.indexOf(tipText),
                tipText.length,
                "italic",
            ),
        );

        for (const example of examplesCommand) {
            responseExtra.entities.push(
                createEntity(
                    responseMessage.indexOf(example),
                    example.length,
                    "code",
                ),
            );
        }

        const response = await sendTextMessage(
            ctx,
            responseMessage,
            responseExtra,
        );

        const extra = {
            reply_to_message_id: ctx.message?.message_id,
            caption: `${first_name}, your ${finalGrid} grid`,
        };

        await ctx.replyWithChatAction("upload_photo");

        const templateData = {
            lastFilms,
            columns: COLUMNS,
            rows: ROWS,
            param,
        };

        const template = gridlbTemplate(templateData);
        const canva = await renderCanvas(template);

        await sendPhotoMessage(ctx, { source: canva }, extra);
        await ctx.deleteMessage(response.message_id);
    } catch (error) {
        errorHandler(ctx, error);
    }
}

export default gridlb;
