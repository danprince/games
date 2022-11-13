import { canvas, clear, fillRect, font, preload, start, write } from "@danprince/games";
import { font2 } from "../src/__fixtures__/font2";

import { Font } from "@danprince/games";
import shadedFontUrl from "./shaded-font.png";

export let shadedFont: Font = {
  url: shadedFontUrl,
  glyphWidth: 6,
  glyphHeight: 6,
  lineHeight: 7,
  glyphWidthsTable: {},
};

function loop() {
  clear();
  font(shadedFont);

  fillRect(0, 0, 16 * 6, 16 * 6, "black");
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      let glyph = x + y * 16;
      let ch = String.fromCharCode(glyph);
      let color = `hsl(${x * y}, 60%, 50%)`;
      write(ch, x * 6, y * 6, color);
    }
  }
}

function init() {
  preload(shadedFont);
  preload(font2);
  start({ loop });
  document.body.append(canvas);
}

init();
