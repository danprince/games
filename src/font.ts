import defaultFontUrl from "./font.png";

/**
 * A bitmap font in the format that the engine understands.
 */
export interface Font {
  /**
   * The url of the font's image.
   */
  url: string;
  /**
   * The default width for each glyph, in pixels.
   */
  glyphWidth: number;
  /**
   * The default height for each glyph, in pixels.
   */
  glyphHeight: number;
  /**
   * The height for each line, in pixels.
   */
  lineHeight: number;
  /**
   * Widths for glyphs with variable widths.
   */
  glyphWidthsTable: Record<string, number>;
}

/**
 * The font that games use by default.
 */
export let defaultFont: Font = {
  url: defaultFontUrl,
  glyphWidth: 5,
  glyphHeight: 6,
  lineHeight: 7,
  glyphWidthsTable: {
    m: 6,
    M: 6,
    W: 6,
    T: 6,
    V: 6,
    w: 6,
    I: 4,
    "1": 4,
    f: 4,
    l: 3,
    j: 3,
    "<": 4,
    ">": 4,
    "-": 4,
    "=": 4,
    "*": 4,
    "+": 4,
    "?": 4,
    "{": 4,
    "}": 4,
    '"': 4,
    "[": 3,
    "]": 3,
    "(": 3,
    ")": 3,
    "|": 3,
    "'": 3,
    "`": 3,
    i: 2,
    ":": 2,
    ",": 3,
    ".": 2,
    "!": 2,
  },
};
