import { getImageByUrl } from "./assets";
import { Rectangle, Point, ctx, Fill, _state } from "./core";
import { createCacheKey as $k } from "./utils";

/**
 * Cache of sprites that were expensive to render.
 */
let _sprites: Record<string, HTMLCanvasElement> = {};

/**
 * Measure a string of text. Respects linebreaks, but does no wrapping.
 * @param text The text to measure.
 * @returns The rectangle size required to render this text.
 */
export function measure(text: string): Rectangle {
  let { glyphWidth, lineHeight, glyphWidthsTable } = _state.font;
  let lineWidth = 0;
  let boxWidth = 0;
  let boxHeight = lineHeight;

  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (char === "\n") {
      boxWidth = Math.max(boxWidth, lineWidth);
      boxHeight += lineHeight;
      lineWidth = 0;
    } else {
      lineWidth += glyphWidthsTable[char] ?? glyphWidth;
    }
  }

  // Ensure that the final line fits in the box
  boxWidth = Math.max(boxWidth, lineWidth);

  return { x: 0, y: 0, w: boxWidth, h: boxHeight };
}

/**
 * Cache the final position of the cursor after rendering the text.
 */
let _textCursorCache: Record<string, Point> = {};

/**
 * Writes text to the canvas using a bitmap font.
 * @param text String of text to write.
 * @param x X coordinate to start writing to.
 * @param y Y coordinate to start writing from.
 * @param color The text color/fill.
 * @param shadow The text shadow color.
 */
export function write(
  text: string,
  x = _state.textX,
  y = _state.textY,
  color = _state.color,
  shadow = _state.textShadowColor,
) {
  // Rendering text is an expensive operation (4 draw calls per char when
  // using shadows), so we can significantly increase performance by
  // caching the result, then rendering it directly in the future.
  let key = `text:${_state.font.url}/${$k(color)}/${$k(shadow)}/${text}`;
  let canvas = _sprites[key];
  let cursor = _textCursorCache[key];
  let { lineHeight, glyphWidth, glyphHeight, glyphWidthsTable } = _state.font;

  if (!canvas) {
    canvas = _sprites[key] = document.createElement("canvas");
    cursor = _textCursorCache[key] = { x: 0, y: 0 };

    let image = _tint(color);
    let imageShadow = _tint(shadow || "transparent");

    let bounds = measure(text);
    canvas.width = bounds.w;
    canvas.height = bounds.h;
    let ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < text.length; i++) {
      let char = text[i];

      if (char === "\n") {
        cursor.x = 0;
        cursor.y += lineHeight;
        continue;
      }

      let code = char.charCodeAt(0);
      let gw = glyphWidth;
      let gh = glyphHeight;
      let sx = (code % 16) * gw;
      let sy = ((code / 16) | 0) * gh;
      let dx = cursor.x;
      let dy = cursor.y;

      if (shadow) {
        ctx.drawImage(imageShadow, sx, sy, gw, gh, dx + 1, dy, gw, gh);
        ctx.drawImage(imageShadow, sx, sy, gw, gh, dx, dy + 1, gw, gh);
        ctx.drawImage(imageShadow, sx, sy, gw, gh, dx + 1, dy + 1, gw, gh);
      }

      // Glyphs below 32 are considered to be colored icons already.
      let img = code < 32 ? getImageByUrl(_state.font.url) : image;
      ctx.drawImage(img, sx, sy, gw, gh, dx, dy, gw, gh);

      cursor.x += glyphWidthsTable[char] ?? gw;
    }
  }

  ctx.drawImage(canvas, x, y);
  _state.textX = x + cursor.x + (glyphWidthsTable[" "] ?? glyphWidth);
  _state.textY = y + cursor.y;
}

/**
 * Writes a line of text to the canvas using a bitmap font.
 * @param text String of text to write.
 * @param x X coordinate to start writing to.
 * @param y Y coordinate to start writing from.
 * @param color The text color/fill.
 * @param shadow The text shadow color.
 */
export function writeLine(
  text: string,
  x = _state.textX,
  y = _state.textY,
  color = _state.color,
  shadow = _state.textShadowColor,
) {
  write(text, x, y, color, shadow);
  _state.textX = x;
  _state.textY += _state.font.lineHeight;
}

/**
 * Recolor the font's image as a canvas (coloring operation is cached).
 */
function _tint(col: Fill): HTMLCanvasElement {
  let key = `tint:${_state.font.url}/${$k(col)}`;
  let canvas = _sprites[key];

  if (!canvas) {
    canvas = _sprites[key] = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    let img = getImageByUrl(_state.font.url);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = col;
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return canvas;
}
