import { canvas, clear, ctx, cursor, end, font, preload, start, view, write } from "@danprince/games";
import { font2 } from "../tests/resources/font2";

let gradient = ctx.createLinearGradient(5, 0, 5, 60);
gradient.addColorStop(0, "red");
gradient.addColorStop(1, "blue");

function loop() {
  clear();
  view();
  font(font2);

  for (let i = 0; i < 100; i++) {
    cursor(10, 10, "red", "black");
    write(`The quick brown fox jumps over the lazy dog.`, 10, 10);
    write(`THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.`, 10, 20);
    write(`Text\nwith line\nbreaks`, 10, 30)
  }

  end();
}

function init() {
  preload(font2);
  start({ loop });
  document.body.append(canvas);
}

init();
