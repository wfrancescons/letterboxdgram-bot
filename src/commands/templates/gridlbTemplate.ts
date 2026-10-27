import type {
  CanvasElement,
  CanvasTemplateData,
  CircleElement,
  GlassEffectOptions,
  ImageElement,
  RectangleElement,
  TextElement,
} from "@/rendering/renderCanvas.ts";
import { getTextLines, measureText } from "@/rendering/renderCanvas.ts";
import type { DiaryEntry } from "@/services/letterboxd.ts";

const WATERMARK_URL = "boxdgrid.com";

export type TemplateConfig = {
  POSTER_WIDTH: number;
  POSTER_HEIGHT: number;
  GRADIENT_HEIGHT: number;
  ICON_SIZE: number;
  GLASS_SIZE: number;
  GLASS_GAP: number;
  ICON_MARGIN_RIGHT: number;
  ICON_MARGIN_BOTTOM: number;
  TEXT_PADDING: number;
  TEXT_LINE_HEIGHT: number;
  TITLE_FONT_SIZE: number;
  YEAR_FONT_SIZE: number;
  RATING_FONT_SIZE: number;
  RATING_PILL_HEIGHT: number;
  RATING_PILL_PADDING_X: number;
};

const DEFAULT_GLASS_OPTIONS: GlassEffectOptions = {
  light: {
    angle: -45,
    intensity: 0.55,
  },
  refraction: 2.5,
  depth: 5,
  dispersion: 0.5,
  frost: 1,
  tint: {
    color: "#000000",
    opacity: 0.15,
  },
  shadow: {
    color: "#000000",
    opacity: 0.1,
    blur: 10,
    offsetX: 2,
    offsetY: 2,
  },
};

function createImageElement(params: {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}): ImageElement {
  return { type: "image", ...params };
}

function createIconElement(params: {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shadow?: ImageElement["shadow"];
}): ImageElement {
  return { type: "icon", ...params };
}

function createRectangleElement(params: {
  fillStyle?: RectangleElement["fillStyle"];
  style?: RectangleElement["style"];
  borderRadius?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}): RectangleElement {
  return { type: "rectangle", ...params };
}

function createTextElement(params: {
  text: string;
  x: number;
  y: number;
  font: string;
  fillStyle: string;
  align?: TextElement["align"];
  shadow?: {
    color?: string;
    offsetX?: number;
    offsetY?: number;
    blur?: number;
  };
  maxWidth?: number;
  maxLines?: number;
  lineHeight?: number;
}): TextElement {
  return { type: "text", ...params };
}

export function createGlassCircleElement({
  cx,
  cy,
  diameter,
  options,
}: {
  cx: number;
  cy: number;
  diameter: number;
  options?: GlassEffectOptions;
}): CircleElement {
  return {
    type: "circle",
    x: cx,
    y: cy,
    width: diameter,
    height: diameter,
    style: {
      type: "glass",
      options: {
        ...DEFAULT_GLASS_OPTIONS,
        ...options,
      },
    },
  };
}

export function createGlassPillElement({
  x,
  y,
  width,
  height,
  options,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  options?: GlassEffectOptions;
}): RectangleElement {
  return {
    type: "rectangle",
    x,
    y,
    width,
    height,
    borderRadius: height / 2,
    style: {
      type: "glass",
      options: {
        ...DEFAULT_GLASS_OPTIONS,
        ...options,
      },
    },
  };
}

function createGradientRectangle(
  x: number,
  y: number,
  config: TemplateConfig,
  gradientHeight: number = config.GRADIENT_HEIGHT,
): RectangleElement {
  return createRectangleElement({
    fillStyle: {
      type: "linearGradient",
      colors: [
        { stop: 0, color: "rgba(14, 14, 14, 0)" },
        { stop: 0.45, color: "rgba(14, 14, 14, 0.3)" },
        { stop: 1, color: "rgba(14, 14, 14, 0.7)" },
      ],
      x0: x,
      y0: y + config.POSTER_HEIGHT - gradientHeight,
      x1: x,
      y1: y + config.POSTER_HEIGHT,
    },
    x,
    y: y + config.POSTER_HEIGHT - gradientHeight,
    width: config.POSTER_WIDTH,
    height: gradientHeight,
  });
}

function generatePosterData(
  item: DiaryEntry,
  index: number,
  columns: number,
  param: string | null,
  config: TemplateConfig,
  glassOptions?: GlassEffectOptions,
): CanvasElement[] {
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = column * config.POSTER_WIDTH;
  const y = row * config.POSTER_HEIGHT;

  const posterElements: CanvasElement[] = [];

  const posterUrl = item.film.poster.large || item.film.poster.medium;
  if (posterUrl) {
    posterElements.push(
      createImageElement({
        src: posterUrl,
        x,
        y,
        width: config.POSTER_WIDTH,
        height: config.POSTER_HEIGHT,
      }),
    );
  } else {
    posterElements.push(
      createRectangleElement({
        fillStyle: "rgba(0, 0, 0, 0.5)",
        x,
        y,
        width: config.POSTER_WIDTH,
        height: config.POSTER_HEIGHT,
      }),
    );
  }

  // 1. Clean mode: posters only with no overlay
  const isClean = param === "notexts" ||
    param === "notext" ||
    param === "clean" ||
    param === "posters" ||
    param === "minimal" ||
    param === "nooverlay";

  if (isClean) {
    return posterElements;
  }

  const isNoTitles = param === "notitles" || param === "notitle";
  const glassRadius = config.GLASS_SIZE / 2;
  const bottomRowCenterY = y + config.POSTER_HEIGHT -
    config.ICON_MARGIN_BOTTOM - glassRadius;

  // 2. Mode: "notitles" (only rating pill on bottom-left and review/rewatch icons on bottom-right)
  if (isNoTitles) {
    const hasAnyBottomElement = Boolean(
      item.rating?.text || item.review || item.isRewatch,
    );
    if (!hasAnyBottomElement) {
      return posterElements;
    }

    // Discreet, low gradient since there is no stacked title
    posterElements.push(createGradientRectangle(x, y, config, 90));

    // Bottom-left: Rating stars inside glass pill, aligned with the right-side icons
    if (item.rating?.text) {
      const ratingFont =
        `${config.RATING_FONT_SIZE}px "NotoSans-Symble", sans-serif`;
      const starsWidth = measureText(item.rating.text, ratingFont).width;

      const pillHeight = config.RATING_PILL_HEIGHT;
      const pillWidth = Math.max(
        pillHeight,
        starsWidth + config.RATING_PILL_PADDING_X * 2,
      );
      const pillX = x + config.TEXT_PADDING;
      const pillY = bottomRowCenterY - pillHeight / 2;

      posterElements.push(
        createGlassPillElement({
          x: pillX,
          y: pillY,
          width: pillWidth,
          height: pillHeight,
          options: glassOptions,
        }),
      );

      posterElements.push(
        createTextElement({
          text: item.rating.text,
          x: pillX + pillWidth / 2,
          y: bottomRowCenterY + config.RATING_FONT_SIZE * 0.35,
          font: ratingFont,
          fillStyle: "#00e054",
          align: "center",
          shadow: {
            color: "rgba(0, 0, 0, 0.25)",
            offsetX: 0,
            offsetY: 1,
            blur: 4,
          },
          maxWidth: pillWidth,
          lineHeight: config.RATING_FONT_SIZE,
        }),
      );
    }

    // Bottom-right: Review and rewatch icons with glass circles
    let badgeCenterX = x + config.POSTER_WIDTH - config.ICON_MARGIN_RIGHT -
      glassRadius;

    if (item.review) {
      posterElements.push(
        createGlassCircleElement({
          cx: badgeCenterX,
          cy: bottomRowCenterY,
          diameter: config.GLASS_SIZE,
          options: glassOptions,
        }),
      );

      posterElements.push(
        createIconElement({
          src: "./src/commands/templates/assets/review.png",
          x: badgeCenterX - config.ICON_SIZE / 2,
          y: bottomRowCenterY - config.ICON_SIZE / 2,
          width: config.ICON_SIZE,
          height: config.ICON_SIZE,
          shadow: {
            color: "rgba(0, 0, 0, 0.5)",
            offsetX: 0,
            offsetY: 1,
            blur: 2,
          },
        }),
      );

      badgeCenterX -= config.GLASS_SIZE + config.GLASS_GAP;
    }

    if (item.isRewatch) {
      posterElements.push(
        createGlassCircleElement({
          cx: badgeCenterX,
          cy: bottomRowCenterY,
          diameter: config.GLASS_SIZE,
          options: glassOptions,
        }),
      );

      posterElements.push(
        createIconElement({
          src: "./src/commands/templates/assets/rewatch.png",
          x: badgeCenterX - config.ICON_SIZE / 2,
          y: bottomRowCenterY - config.ICON_SIZE / 2,
          width: config.ICON_SIZE,
          height: config.ICON_SIZE,
          shadow: {
            color: "rgba(0, 0, 0, 0.5)",
            offsetX: 0,
            offsetY: 1,
            blur: 2,
          },
        }),
      );
    }

    return posterElements;
  }

  // 3. Default mode: Full overlay
  // Layout:
  // - Bottom: Rating pill (bottom-left) and review/rewatch badges (bottom-right)
  // - Directly above bottom row: Film title
  // - Above title: Release year (if available)
  posterElements.push(createGradientRectangle(x, y, config));

  const hasBottomRow = Boolean(
    item.rating?.text || item.review || item.isRewatch,
  );

  // 3.1 Bottom-left: Rating stars on a glass pill background
  if (item.rating?.text) {
    const ratingFont =
      `${config.RATING_FONT_SIZE}px "NotoSans-Symble", sans-serif`;
    const starsWidth = measureText(item.rating.text, ratingFont).width;

    const pillHeight = config.RATING_PILL_HEIGHT;
    const pillWidth = Math.max(
      pillHeight,
      starsWidth + config.RATING_PILL_PADDING_X * 2,
    );
    const pillX = x + config.TEXT_PADDING;
    const pillY = bottomRowCenterY - pillHeight / 2;

    posterElements.push(
      createGlassPillElement({
        x: pillX,
        y: pillY,
        width: pillWidth,
        height: pillHeight,
        options: glassOptions,
      }),
    );

    posterElements.push(
      createTextElement({
        text: item.rating.text,
        x: pillX + pillWidth / 2,
        y: bottomRowCenterY + config.RATING_FONT_SIZE * 0.35,
        font: ratingFont,
        fillStyle: "#00e054",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.25)",
          offsetX: 0,
          offsetY: 1,
          blur: 4,
        },
        maxWidth: pillWidth,
        lineHeight: config.RATING_FONT_SIZE,
      }),
    );
  }

  // 3.2 Bottom-right: Review and rewatch icons with glass circles
  let badgeCenterX = x + config.POSTER_WIDTH - config.ICON_MARGIN_RIGHT -
    glassRadius;

  if (item.review) {
    posterElements.push(
      createGlassCircleElement({
        cx: badgeCenterX,
        cy: bottomRowCenterY,
        diameter: config.GLASS_SIZE,
        options: glassOptions,
      }),
    );

    posterElements.push(
      createIconElement({
        src: "./src/commands/templates/assets/review.png",
        x: badgeCenterX - config.ICON_SIZE / 2,
        y: bottomRowCenterY - config.ICON_SIZE / 2,
        width: config.ICON_SIZE,
        height: config.ICON_SIZE,
        shadow: {
          color: "rgba(0, 0, 0, 0.5)",
          offsetX: 0,
          offsetY: 1,
          blur: 2,
        },
      }),
    );

    badgeCenterX -= config.GLASS_SIZE + config.GLASS_GAP;
  }

  if (item.isRewatch) {
    posterElements.push(
      createGlassCircleElement({
        cx: badgeCenterX,
        cy: bottomRowCenterY,
        diameter: config.GLASS_SIZE,
        options: glassOptions,
      }),
    );

    posterElements.push(
      createIconElement({
        src: "./src/commands/templates/assets/rewatch.png",
        x: badgeCenterX - config.ICON_SIZE / 2,
        y: bottomRowCenterY - config.ICON_SIZE / 2,
        width: config.ICON_SIZE,
        height: config.ICON_SIZE,
        shadow: {
          color: "rgba(0, 0, 0, 0.5)",
          offsetX: 0,
          offsetY: 1,
          blur: 2,
        },
      }),
    );
  }

  // 3.3 Above bottom row: Left-aligned film title (limited to 2 lines with "...")
  const titleText = item.film.title;
  const titleFont = `${config.TITLE_FONT_SIZE}px "NotoSans-Bold", sans-serif`;
  const titleMaxWidth = config.POSTER_WIDTH - 2 * config.TEXT_PADDING;

  const titleBaselineY = hasBottomRow
    ? bottomRowCenterY - Math.max(glassRadius, config.RATING_PILL_HEIGHT / 2) -
      8
    : y + config.POSTER_HEIGHT - 18;

  // Determine line count via rendering module to adjust elements above it
  const titleLinesCount = Math.max(
    1,
    getTextLines(titleText, titleMaxWidth, 2, titleFont).length,
  );

  posterElements.push(
    createTextElement({
      text: titleText,
      x: x + config.TEXT_PADDING,
      y: titleBaselineY,
      font: titleFont,
      fillStyle: "#ffffff",
      shadow: {
        color: "rgba(0, 0, 0, 0.65)",
        offsetX: 2,
        offsetY: 2,
        blur: 4,
      },
      maxWidth: titleMaxWidth,
      maxLines: 2,
      lineHeight: config.TEXT_LINE_HEIGHT,
    }),
  );

  // 3.4 Above title: Film release year
  if (item.film.year) {
    const firstLineBaselineY = titleBaselineY -
      (titleLinesCount - 1) * config.TEXT_LINE_HEIGHT;
    const titleTopY = firstLineBaselineY - config.TITLE_FONT_SIZE;
    const yearBaselineY = titleTopY - 6;

    posterElements.push(
      createTextElement({
        text: String(item.film.year),
        x: x + config.TEXT_PADDING,
        y: yearBaselineY,
        font: `${config.YEAR_FONT_SIZE}px "NotoSans-Bold", sans-serif`,
        fillStyle: "rgba(255, 255, 255, 0.7)",
        shadow: {
          color: "rgba(0, 0, 0, 0.6)",
          offsetX: 1,
          offsetY: 1,
          blur: 3,
        },
        maxWidth: titleMaxWidth,
        lineHeight: config.YEAR_FONT_SIZE,
      }),
    );
  }

  return posterElements;
}

function generateWatermark(width: number, height: number): CanvasElement[] {
  const elements: CanvasElement[] = [];

  if (width > 230) {
    elements.push(
      createImageElement({
        src: "./src/commands/templates/assets/boxdgrid-logo.png",
        x: 15,
        y: height - 30 - 11,
        width: 120,
        height: 22,
      }),
    );
  }

  elements.push(
    createTextElement({
      text: WATERMARK_URL,
      x: width - 150,
      y: height - 22,
      font: `20px "NotoSans-Bold", sans-serif`,
      fillStyle: "#dcdbdc",
      shadow: {
        color: "rgba(0, 0, 0, 0.5)",
        offsetX: 2,
        offsetY: 2,
        blur: 4,
      },
      maxWidth: 150,
      lineHeight: 20,
    }),
  );

  return elements;
}

export type GridlbTemplateParams = {
  lastFilms: DiaryEntry[];
  columns: number;
  rows: number;
  param?: string | null;
  glassOptions?: GlassEffectOptions;
};

export function gridlbTemplate({
  lastFilms,
  columns,
  rows,
  param = null,
  glassOptions,
}: GridlbTemplateParams): CanvasTemplateData {
  const config: TemplateConfig = {
    POSTER_WIDTH: 230,
    POSTER_HEIGHT: 345,
    GRADIENT_HEIGHT: 185,
    ICON_SIZE: 15,
    GLASS_SIZE: 28,
    GLASS_GAP: 6,
    ICON_MARGIN_RIGHT: 14,
    ICON_MARGIN_BOTTOM: 12,
    TEXT_PADDING: 15,
    TEXT_LINE_HEIGHT: 21,
    TITLE_FONT_SIZE: 17,
    YEAR_FONT_SIZE: 14,
    RATING_FONT_SIZE: 17,
    RATING_PILL_HEIGHT: 26,
    RATING_PILL_PADDING_X: 11,
  };

  const width = columns * config.POSTER_WIDTH;
  const height = rows * config.POSTER_HEIGHT + 60;

  const data: CanvasTemplateData = {
    type: "grid",
    width,
    height,
    background: "#0E0E0E",
    elements: [],
  };

  const watermark = generateWatermark(width, height);

  lastFilms.forEach((film, i) => {
    const posterElements = generatePosterData(
      film,
      i,
      columns,
      param,
      config,
      glassOptions,
    );
    data.elements.push(...posterElements);
  });

  data.elements.push(...watermark);

  return data;
}

export default gridlbTemplate;
