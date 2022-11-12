import { canvas, clear, ctx, down, easeOutBack, end, fillRect, font, line, measure, over, pointer, preload, pressed, stamp, start, strokeRect, tween, view, write } from "@danprince/games";
import { font2 } from "../src/__fixtures__/font2";

let t = { y: 0 };

function loop() {
  clear();

  fillRect(30.5, 30, 10, 10, "black");
  strokeRect(30.5, 30, 10, 10, "red");
  stamp(0x7FFDBBF5, 33, 33, "red");
  stamp(0x447CC4, 20, 40, "blue");
  button("Hello", 10, 70);

  line(50, 50, 80, 60, "green");

  view();
  write("01234", 0, 0);
  write("tween", 90, t.y);
  end();

  {
    let { x, y } = pointer();
    view();
    font(font2);
    write(`The quick brown fox jumps over the lazy dog.`, 10, 10)
    write(`THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.`, 10, 20)
    write(` ${x},${y}`, x, y);
    end();
  }

  if (pressed()) {
    t.y = 0;
    tween(t, { y: 100 }, 1000, easeOutBack);
  }
}

function button(text: string, x: number, y: number): boolean {
  let { w, h } = measure(text);
  let hover = over(x, y, w, h)
  let color = hover ? "cyan" : "black";
  write(text, x, y, color);
  return hover && down();
}

function init() {
  preload(font2);
  start({ loop });
  document.body.append(canvas);
}

init();
