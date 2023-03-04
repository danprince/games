# @danprince/games
A library for building tiny 2D games.

### Setup

```ts
import { start, canvas } from "@danprince/games";

function loop() {
  // will be called once per frame
}

// Start the game with a 100x200 canvas and add it to the DOM
start({ width: 100, height: 200, loop });

document.body.append(canvas);
```

### Text

```ts
import { write } from "@danprince/games";

// Write "Hello, world!" at (10, 20) in red text, with a black shadow
write("Hello, world!", 10, 20, "red", "black");
```

### Sprites
The `draw` functions expect to work with the sprites format from the [TypeScript Sprites](https://github.com/danprince/aseprite-typescript-sprites) Aseprite extension.

```ts
import { preload, draw } from "@danprince/games";
import * as sprites from "./sprites";

// Ensure sprites are loaded before rendering
preload(sprites);

// Draw a sprite slice at 10, 20
draw(sprites.redBall, 10, 20);
```

### Pointer Coordinates

```ts
import { pointer, write } from "@danprince/games";

let { x, y } = pointer();
write(`${x},${y}`, x, y);
```

### Button State

```ts
import { down, pressed, released, Buttons } from "@danprince/games";

if (down("Enter")) {
  // The "Enter" key is currently down
}

if (pressed("Enter")) {
  // The "Enter" key went down during this frame
}

if (released("Enter")) {
  // The "Enter" key went up during this frame
}

if (down(Buttons.MouseLeft)) {
  // Mouse/tap is down
}
```

### Views

```ts
import { view, end, write } from "@danprince/games";

// Create a 200x200 view at 100,100
view(100, 100, 200, 200);
// Everything here is relative to the view until `end()` is called
write("View", 0, 0);
end();
```

### Local/Global Coords

```ts
view(100, 100, 200, 200);

// Convert global coordinates to local view coordinates
let p1 = local(100, 100); // { x: 0, y: 0 }

// Convert local coordinates to global view coordinates
let p2 = global(0, 0); // { x: 100, y: 100 };

end();
```

### Immediate Mode UI

```ts
import { write, measure, over, down } from "@danprince/games";

function button(text: string, x: number, y: number): boolean {
  let { w, h } = measure(text);
  let hover = over(x, y, w, h)
  let color = hover ? "cyan" : "black";
  write(text, x, y, color);
  return hover && down();
}

if (button("click")) {
  // button is currently down
}
```

### Tween
Using a tween to mutate an object over time.

```ts
import { tween, easeLinear, easeInOut, easeOutBack } from "@danprince/games";

// Tween player's x & y coordinates to (10, 10) over 1s of game time with
// various timing functions.
await tween(player, { x: 10, y: 10 }, 1000, easeLinear);
await tween(player, { x: 10, y: 10 }, 1000, easeInOut);
await tween(player, { x: 10, y: 10 }, 1000, easeOutBack);
```
