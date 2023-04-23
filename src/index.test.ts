import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { bounds, canvas, end, global, local, measure, start, view, _update, _reset, down, pressed, released, Buttons, pointer, tween, delta, delay, write, draw, draw9Slice, font, preload, restore, save, writeLine, fillRect, color, strokeRect, line, stamp, drawFlipped, cancelTweens } from "../src/index";
import { font2 } from "./__fixtures__/font2";
import { font as testFont } from "./__fixtures__/font";
import * as sprites from "./__fixtures__/sprites";

// JSDOM doesn't support PointerEvent, so use MouseEvent when dispatching in
// tests.
let PointerEvent = MouseEvent;

/**
 * Advance to the next frame with the given time delta.
 * @param dt Milliseconds since last frame.
 */
async function frame(dt: number = 15) {
  _update(dt);
}

/**
 * Images need to be converted to base64 so that JSDOM can load them.
 */
function readAsDataUrl(path: string): string {
  let relative = join(__dirname, path);
  let binary = readFileSync(relative, { encoding: "base64" });
  return `data:image/png;base64,${binary}`;
}

vi.mock("./font.png", () => ({
  default: readAsDataUrl("./font.png"),
}));

vi.mock("./__fixtures__/sprites.png", () => ({
  default: readAsDataUrl("./__fixtures__/sprites.png")
}));

vi.mock("./__fixtures__/font.png", () => ({
  default: readAsDataUrl("./__fixtures__/font.png"),
}));

vi.mock("./__fixtures__/font2.png", () => ({
  default: readAsDataUrl("./__fixtures__/font2.png"),
}));

afterEach(() => _reset());

beforeEach(() => {
  // Don't allow tests to edit the default drawing state (it can cause
  // subsequent tests to fail).
  save();
});

test("delta", async () => {
  await start();
  frame(20);
  expect(delta()).toBe(20);
});

test("start sets canvas size", async () => {
  await start({ width: 110, height: 120 });
  expect(canvas.width).toBe(110);
  expect(canvas.height).toBe(120);
});

test("start appends canvas to body", async () => {
  await start({ width: 110, height: 120 });
  expect(document.body.children[0]).toBe(canvas);
});

test("automatic canvas scale", async () => {
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  await start({ width: 50, height: 100 });
  expect(canvas.style.width).toBe("500px");
  expect(canvas.style.height).toBe("1000px");
});

test("max canvas scale", async () => {
  window.innerWidth = 1000;
  window.innerHeight = 1000;
  await start({ width: 50, height: 100, maxCanvasScale: 3 });
  expect(canvas.style.width).toBe("150px");
  expect(canvas.style.height).toBe("300px");
});

test("measure text", () => {
  expect([
    "Hello world!",
    "!!!",
    "WWW",
    "Text with a \nnewline",
  ].map(text => measure(text))).toMatchSnapshot();
});

test("measure text with alternate font", () => {
  expect([
    "Hello world!",
    "!!!",
    "WWW",
    "Text with a \nnewline",
  ].map(text => measure(text, font2))).toMatchSnapshot();
});

test("writing text", async () => {
  await start({ width: 100, height: 100 });
  write("hello world", 0, 10, "red", "black");
  write("hello world", 30, 40, "green", "black");
  write("hello world", 60, 70, "blue", "black");
  expect(canvas).toMatchSnapshot();
});

test("writing text with cursor state", async () => {
  await start({ width: 100, height: 100 });
  write("p1", 0, 10, "red");
  write("and p2");
  write("and p3");
  expect(canvas).toMatchSnapshot();
});

test("writing text in lines", async () => {
  await start({ width: 100, height: 100 });
  writeLine("this is line 1", 0, 10);
  writeLine("and this is line 2");
  writeLine("finally, line 3");
  expect(canvas).toMatchSnapshot();
});

test("writing with alternate fonts", async () => {
  preload(font2);
  await start();
  write("This is the default font", 10, 10);

  save();
  font(font2);
  write("This is an alternate font", 10, 20);
  restore();

  write("Back to the default font", 10, 30);

  expect(canvas).toMatchSnapshot();
});

test("font with shaded glyphs", async () => {
  preload(testFont);
  await start({ width: 100, height: 100 });
  font(testFont);
  write("abc", 0, 0, "red");
  expect(canvas).toMatchSnapshot();
});

test("font with precolored glyphs", async () => {
  preload(testFont);
  await start({ width: 100, height: 100 });
  font(testFont);
  writeLine("\x01\x02\x03\x04\x05\x06");
  expect(canvas).toMatchSnapshot();
});

test("fillRect", () => {
  start({ width: 100, height: 100 });
  fillRect(0, 10, 20, 30, "red");
  color("blue");
  fillRect(50, 10, 20, 30);
  expect(canvas).toMatchSnapshot();
});

test("strokeRect", () => {
  start({ width: 100, height: 100 });
  strokeRect(0, 10, 20, 30, "red");
  color("blue");
  strokeRect(50, 10, 20, 30);
  expect(canvas).toMatchSnapshot();
});

test("line", () => {
  start({ width: 100, height: 100 });
  line(0, 10, 20, 30, "red");
  color("blue");
  line(50, 10, 20, 30);
  expect(canvas).toMatchSnapshot();
});

test("stamp", () => {
  start({ width: 100, height: 100 });
  stamp(0xEAFFF1, 0, 10, "red");
  color("blue");
  stamp(0xEAFFF1, 10, 10);
  expect(canvas).toMatchSnapshot();
});

test("drawing sprites", async () => {
  preload(sprites);
  await start({ width: 100, height: 100 });
  draw(sprites.green_man, 0, 0);
  draw(sprites.red_man, 10, 20);
  expect(canvas).toMatchSnapshot();
});

test("drawing flipped sprites", async () => {
  preload(sprites);
  await start({ width: 100, height: 100 });
  draw(sprites.green_man, 0, 0);
  drawFlipped(sprites.green_man, 20, 0, true, false);
  drawFlipped(sprites.green_man, 40, 0, false, true);
  drawFlipped(sprites.green_man, 60, 0, true, true);
  expect(canvas).toMatchSnapshot();
});

test("drawing nine slice sprites", async () => {
  preload(sprites);
  await start({ width: 100, height: 100 });
  draw9Slice(sprites.nine_slice, 0, 0, 10, 10);
  draw9Slice(sprites.nine_slice, 20, 20, 30, 40);
  draw9Slice(sprites.nine_slice, 60, 20, 5, 5);
  expect(canvas).toMatchSnapshot();
});

test("views", async () => {
  await start({ width: 100, height: 100 });
  view(10, 10, 50, 50);
  write("hello", 0, 0);
  end();
  expect(canvas).toMatchSnapshot();
});

test("nesting views", async () => {
  await start({ width: 100, height: 100 });
  view(20, 20);
  write("view 1", 0, 0);
  view(20, 20);
  write("view 2", 0, 0);
  end();
  end();
  expect(canvas).toMatchSnapshot();
});

test("global coordinates", () => {
  expect(global(0, 0)).toEqual({ x: 0, y: 0 });

  view(10, 20);
  expect(global(0, 0)).toEqual({ x: 10, y: 20 });
  expect(global(5, 5)).toEqual({ x: 15, y: 25 });
  end();

  expect(global(0, 0)).toEqual({ x: 0, y: 0 });
});

test("local coordinates", () => {
  expect(local(0, 0)).toEqual({ x: 0, y: 0 });

  view(10, 20);
  expect(local(10, 20)).toEqual({ x: 0, y: 0 });
  expect(local(15, 25)).toEqual({ x: 5, y: 5 });
  expect(local(5, 15)).toEqual({ x: -5, y: -5 });
  end();

  expect(global(0, 0)).toEqual({ x: 0, y: 0 });
});

test("bounds", () => {
  expect(bounds()).toEqual({ x: 0, y: 0, w: Infinity, h: Infinity });
  view(10, 20, 30, 40);
  expect(bounds()).toEqual({ x: 10, y: 20, w: 30, h: 40 });
  end();
  expect(bounds()).toEqual({ x: 0, y: 0, w: Infinity, h: Infinity });
});

test("keyboard button states", async () => {
  await start();

  expect(down("Enter")).toBe(false);
  expect(pressed("Enter")).toBe(false);
  expect(released("Enter")).toBe(false);

  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
  expect(down("Enter")).toBe(true);
  expect(pressed("Enter")).toBe(true);

  frame();
  expect(down("Enter")).toBe(true);
  expect(pressed("Enter")).toBe(false);

  window.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
  expect(down("Enter")).toBe(false);
  expect(released("Enter")).toBe(true);

  frame();
  expect(released("Enter")).toBe(false);
});

test("mouse button states", async () => {
  await start();

  expect(down(Buttons.MouseLeft)).toBe(false);
  expect(pressed(Buttons.MouseLeft)).toBe(false);
  expect(released(Buttons.MouseLeft)).toBe(false);

  window.dispatchEvent(new PointerEvent("pointerdown"));
  expect(down(Buttons.MouseLeft)).toBe(true);
  expect(pressed(Buttons.MouseLeft)).toBe(true);

  frame();
  expect(down(Buttons.MouseLeft)).toBe(true);
  expect(pressed(Buttons.MouseLeft)).toBe(false);

  window.dispatchEvent(new PointerEvent("pointerup"));
  expect(down(Buttons.MouseLeft)).toBe(false);
  expect(released(Buttons.MouseLeft)).toBe(true);

  frame();
  expect(released(Buttons.MouseLeft)).toBe(false);
});

test("pointer coordinates", async () => {
  await start({ width: 20, height: 40 });

  canvas.getBoundingClientRect = () =>
    ({ x: 20, y: 40, width: 200, height: 400 } as DOMRect);

  window.dispatchEvent(new PointerEvent("pointermove", {
    bubbles: true,
    clientX: 100,
    clientY: 200,
  }));

  expect(pointer()).toEqual({ x: 8, y: 16 });
});

test("tweens", async () => {
  await start();
  let object = { a: 0 };
  let promise = tween(object, { a: 100 }, { duration: 1000 });
  frame(100);
  expect(object.a).toBe(10);
  frame(500);
  expect(object.a).toBe(60);
  frame(500);
  expect(object.a).toBe(100);
  expect(promise).resolves.toBe(undefined);
});

test("tween with custom easing", async () => {
  await start();
  let object = { a: 0 };
  let promise = tween(
    object,
    { a: 100 },
    { duration: 1000, easing: t => (t < 0.5 ? 0 : 1) },
  );
  frame(100);
  expect(object.a).toBe(0);
  frame(500);
  expect(object.a).toBe(100);
  expect(promise).resolves.toBe(undefined);
});

test("tween with step function", async () => {
  await start();
  let object = { a: 0 };
  let step = vi.fn();
  tween(
    object,
    { a: 100 },
    { duration: 1000, step },
  );
  frame(100);
  expect(step).toHaveBeenCalledWith(0.1);
  frame(100);
  expect(step).toHaveBeenCalledWith(0.2);
});

test("cancel tweens", async () => {
  await start();

  let object = { a: 0, b: 0, c: 0 };
  let step = vi.fn();

  tween(
    object,
    { a: 100 },
    { duration: 100, id: "t", step },
  );

  tween(
    object,
    { b: 100 },
    { duration: 100, id: "t" },
  );

  tween(
    object,
    { c: 100 },
    { duration: 100 },
  );

  frame(50);
  expect(object).toEqual({ a: 50, b: 50, c: 50 });
  cancelTweens("t");
  expect(object).toEqual({ a: 100, b: 100, c: 50 });
  frame(50);
  expect(object).toEqual({ a: 100, b: 100, c: 100 });
  expect(step).toHaveBeenCalledTimes(2);
});

test("delay", async () => {
  let callback = vi.fn();
  delay(100).then(callback);
  await frame(50);
  expect(callback).not.toHaveBeenCalled();
  await frame(50);
  expect(callback).toHaveBeenCalled();
  await frame(50);
  expect(callback).toHaveBeenCalledTimes(1);
});
