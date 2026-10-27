import type { LetterboxdProfile } from "@/services/letterboxd/index.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export type FormatProfileLbParams = {
  firstName: string;
  profile: LetterboxdProfile;
};

export default function formatProfileLb({
  firstName,
  profile,
}: FormatProfileLbParams) {
  const profileLink = `https://letterboxd.com/${profile.username}`;

  const namePossessive = firstName.endsWith("s") || firstName.endsWith("S")
    ? `${firstName}'`
    : `${firstName}'s`;

  let message = new FormattedString("👤 ")
    .link(namePossessive, profileLink)
    .plain(" Letterboxd:\n\n");

  // Stats
  if (profile.stats.length > 0) {
    const statsLines = profile.stats.map(
      (s) => `• ${s.definition}: ${s.value.toLocaleString("pt-BR")}`,
    );
    message = message.bold("📊 Stats:\n").plain(statsLines.join("\n") + "\n\n");
  }

  // Favourites
  if (profile.favourites.length > 0) {
    message = message.bold("❤️ Favorite Films:\n");
    for (const fav of profile.favourites) {
      message = message.plain(`• ${fav.film}\n`);
    }
    message = message.plain("\n");
  }

  // Recent Activity
  if (profile.recentActivity.length > 0) {
    message = message.bold("⏰ Recent Activity:\n");
    for (const entry of profile.recentActivity.slice(0, 4)) {
      const yearStr = entry.film.year ? ` (${entry.film.year})` : "";
      const ratingStr = entry.rating.text ? ` - ${entry.rating.text}` : "";
      message = message.plain(`• ${entry.film.title}${yearStr}${ratingStr}\n`);
    }
  }

  return {
    text: message.text.trimEnd(),
    entities: message.entities,
    link_preview_options: {
      prefer_small_media: true,
      url: profileLink,
    },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open on Letterboxd",
            url: profileLink,
          },
        ],
      ],
    },
  };
}
