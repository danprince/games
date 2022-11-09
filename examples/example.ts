import { canvas, clear, delta, down, easeOutBack, measure, over, pointer, pressed, start, tween, write } from "@danprince/games";

let t = { y: 0 };

function loop() {
  clear();
  delta();
  button("Hello", 10, 10);
  write("tween", 50, t.y);

  let { x, y } = pointer();
  write(` ${x},${y}`, x, y);

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

start({ loop });
document.body.append(canvas);
