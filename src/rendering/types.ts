export type CanvasTextAlign = "left" | "right" | "center" | "start" | "end";

export type GlobalCompositeOperation =
  | "source-over"
  | "source-in"
  | "source-out"
  | "source-atop"
  | "destination-over"
  | "destination-in"
  | "destination-out"
  | "destination-atop"
  | "lighter"
  | "copy"
  | "xor"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"
  | string;

export type ColorStop = {
  stop: number;
  color: string;
};

export type LinearGradientStyle = {
  type: "linearGradient";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colors: ColorStop[];
};

export type RadialGradientStyle = {
  type: "radialGradient";
  x0: number;
  y0: number;
  r0: number;
  x1: number;
  y1: number;
  r1: number;
  colors: ColorStop[];
};

export type ShadowStyle = {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  opacity?: number;
};

export type GlowStyle = {
  color?: string;
  intensity?: number;
  radius?: number;
  angle?: number;
};

export type GlassBorderOptions = {
  /** Light incidence angle on the border in degrees (e.g., 45, 135) */
  angle?: number;
  /** Border / illuminated rim thickness (e.g., 1 to 15) */
  thickness?: number;
  /** Maximum outline opacity (0 to 1) */
  opacity?: number;
  /** Border reflection color (default: "#ffffff") */
  color?: string;
};

export type GlassTintOptions = {
  /** Translucent tint color (e.g., "#ffffff", "#000000") */
  color?: string;
  /** Tint opacity (0 to 1) */
  opacity?: number;
};

export type GlassEffectOptions = {
  /** Optical refraction intensity (0 to 2, default: 0.8) */
  refraction?: number;
  /** Lens depth / edge curvature (1 to 50, default: 6) */
  depth?: number;
  /** Frosted glass blur intensity (0 to 50, default: 2) */
  frost?: number;
  /** RGB channel dispersion / chromatic aberration at edges (0 to 1, default: 0.03) */
  chromaticAberration?: number;
  /** Specular inner glow / surface highlight */
  glow?: GlowStyle;
  /** Directional reflective border configuration */
  border?: GlassBorderOptions;
  /** Translucent glass tint */
  tint?: GlassTintOptions;
  /** Drop shadow cast behind the glass */
  shadow?: ShadowStyle;
};

export type LiquidGlassOptions = GlassEffectOptions;

export type GlassElementStyle = {
  type: "glass";
  options?: GlassEffectOptions;
};

export type ElementEffects = {
  shadow?: ShadowStyle;
  glow?: GlowStyle;
  filter?: string;
  opacity?: number;
  composite?: GlobalCompositeOperation;
};

export type ImageElement = {
  type: "image" | "icon";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  filter?: string;
  composite?: GlobalCompositeOperation;
  opacity?: number;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type RectangleElement = {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  /** Corner border radius (0 for sharp rectangle) */
  borderRadius?: number;
  fillStyle?: string | LinearGradientStyle | RadialGradientStyle;
  style?: GlassElementStyle;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type CircleElement = {
  type: "circle";
  /** X coordinate (center by default, or top-left corner if anchor === 'top-left') */
  x: number;
  /** Y coordinate (center by default, or top-left corner if anchor === 'top-left') */
  y: number;
  width: number;
  height: number;
  /** Defines whether (x, y) represents the 'center' (default) or 'top-left' */
  anchor?: "center" | "top-left";
  fillStyle?: string | LinearGradientStyle | RadialGradientStyle;
  style?: GlassElementStyle;
  shadow?: ShadowStyle;
  effects?: ElementEffects;
};

export type TextElement = {
  type: "text";
  text: string;
  x: number;
  y: number;
  font?: string;
  fillStyle?: string;
  shadow?: ShadowStyle;
  maxWidth?: number;
  lineHeight?: number;
  align?: CanvasTextAlign;
  maxLines?: number;
  effects?: ElementEffects;
};

export type CanvasElement =
  | ImageElement
  | RectangleElement
  | CircleElement
  | TextElement;

export type CanvasTemplateData = {
  type: string;
  width: number;
  height: number;
  background?: string;
  elements: CanvasElement[];
};
