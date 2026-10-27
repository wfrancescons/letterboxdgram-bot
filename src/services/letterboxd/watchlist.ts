import { DOMParser, Element } from "@b-fuze/deno-dom";
import { LETTERBOXD_BASE_URL, LETTERBOXD_HTTP_HEADERS } from "./client.ts";
import type { GetWatchlistParams, Watchlist } from "./types.ts";

export async function getWatchlist({
  username,
  limit = 10,
}: GetWatchlistParams): Promise<Watchlist> {
  const watchlistUrl = new URL(`${LETTERBOXD_BASE_URL}/${username}/watchlist/`);
  try {
    const response = await fetch(watchlistUrl, {
      headers: LETTERBOXD_HTTP_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist: ${response.status}`);
    }

    const html = await response.text();
    const document = new DOMParser().parseFromString(
      html,
      "text/html",
    );

    if (!document) {
      throw new Error("Failed to parse HTML");
    }

    const countElement = document.querySelector(".js-watchlist-count");

    if (!countElement) {
      return {
        url: watchlistUrl,
        count: 0,
        recentlyAdded: [],
      };
    }

    const rawCount = countElement.textContent
      ?.replace(/[^0-9]/g, "") ?? "0";

    const count = Number(rawCount);

    if (count === 0) {
      return {
        url: watchlistUrl,
        count: 0,
        recentlyAdded: [],
      };
    }

    const gridItems = document.querySelectorAll(
      "ul.grid li.griditem",
    );

    const recentlyAdded: string[] = [];

    for (const item of gridItems) {
      const reactComponent = item.querySelector(
        ".react-component",
      ) as Element | null;

      const itemName = reactComponent?.getAttribute(
        "data-item-name",
      );

      if (itemName) {
        recentlyAdded.push(itemName);
      }

      if (recentlyAdded.length >= limit) {
        break;
      }
    }

    return {
      count,
      recentlyAdded,
      url: watchlistUrl,
    };
  } catch (_error) {
    return {
      count: 0,
      recentlyAdded: [],
      url: watchlistUrl,
    };
  }
}
