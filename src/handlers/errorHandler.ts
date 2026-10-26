import config from "@/config.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import type { Context } from "grammy";

export async function errorHandler(
  ctx: BotContext | Context,
  error: unknown,
  info?: string,
): Promise<void> {
  const isInlineQuery = Boolean(ctx.inlineQuery);
  const errorCode = typeof error === "string"
    ? error
    : error instanceof Error
    ? error.message
    : "UNKNOWN_ERROR";

  try {
    switch (errorCode) {
      case "COLLAGE_INCORRECT_ARGS": {
        const msg = new FormattedString("Invalid arguments 🤔\n\n")
          .plain(
            "✅ Type a columns x rows value greater than 0 and up to 7\n\n",
          )
          .plain("➡️ Examples:\n")
          .code("/gridlb 4x1")
          .plain("\n")
          .code("/gridlb 5x3 notitles")
          .plain("\n")
          .code("/gridlb 7x7 clean");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
        break;
      }

      case "USER_NOT_FOUND": {
        if (isInlineQuery) {
          await ctx.answerInlineQuery([
            {
              type: "article",
              id: "error-user-not-found",
              title: "⚠️ User not found",
              description: "Use /setlb to set your Letterboxd username",
              input_message_content: {
                message_text:
                  "Type /setlb <your_username> to set your Letterboxd username",
              },
            },
          ], { cache_time: 0 });
          break;
        }

        const msg = new FormattedString(
          "⚠️ You need to sign up first to use the bot\n\n",
        )
          .plain("What's your username on Letterboxd? 🤔\n\n")
          .plain("➡️ Type ")
          .code("/setlb your_username")
          .plain(" to set it");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
        break;
      }

      case "REG_WITHOUT_ARGS":
      case "MISSING_USERNAME": {
        const msg = new FormattedString(
          "What's your username on Letterboxd? 🤔\n\n",
        )
          .plain("➡️ Type ")
          .code("/setlb your_username")
          .plain(" to set it\n\n")
          .plain("Please, try again 🙂");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
        break;
      }

      case "NOT_A_VALID_LETTERBOXD_USER":
      case "LETTERBOXD_USER_NOT_FOUND": {
        const targetUser = info || "That";
        const msg = FormattedString
          .bold(targetUser)
          .plain(" isn't a valid Letterboxd username ❌\n\n")
          .plain("Is it correct? 🤔\n\n")
          .plain("Please, try again 🙂");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
        break;
      }

      case "ZERO_ACTIVITIES": {
        if (isInlineQuery) {
          await ctx.answerInlineQuery([
            {
              type: "article",
              id: "error-zero-activities",
              title: "⚠️ No films found",
              description: "There aren't any films in your Letterboxd diary 🙁",
              input_message_content: {
                message_text: "⚠️ No films found in your Letterboxd diary",
              },
            },
          ], { cache_time: 0 });
          break;
        }

        const msg = new FormattedString(
          "There aren't any films in your Letterboxd Diary 🙁\n",
        )
          .plain("Is your username correct? 🤔\n\n")
          .plain("➡️ Type ")
          .code("/setlb your_username")
          .plain(" to update it");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
        break;
      }

      default: {
        const errorDesc = String(
          (error as { description?: string })?.description || "",
        );
        if (errorDesc.includes("message to delete not found")) {
          break;
        }

        console.error("Handler error:", error);

        if (isInlineQuery) {
          await ctx.answerInlineQuery([], { cache_time: 0 });
          break;
        }

        const supportText = config.bot.support_chat
          ? `\nIf the issue keeps happening, contact: ${config.bot.support_chat}`
          : "";
        await ctx.reply(
          `Something went wrong with Letterboxd 🥴\nBut don't fret, let's give it another shot in a couple of minutes.${supportText}`,
          {
            reply_parameters: ctx.message
              ? { message_id: ctx.message.message_id }
              : undefined,
          },
        );
        break;
      }
    }
  } catch (handlingErr) {
    console.error("Critical error inside errorHandler:", handlingErr);
  }
}

export default errorHandler;
