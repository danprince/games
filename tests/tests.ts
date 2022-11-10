import { afterEach, expect, test, vi } from "vitest";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { assert, bounds, canvas, clamp, draw, end, global, local, measure, preload, start, view, write, writeLine, __update__, __reset__, down, pressed, released, Buttons, pointer, tween, delta, delay, Font, font, save, restore, draw9Slice } from "../src";
import * as sprites from "./resources/sprites";
import { font2 } from "./resources/font2";

// JSDOM doesn't support PointerEvent, so use MouseEvent when dispatching in
// tests.
let PointerEvent = MouseEvent;

/**
 * Advance to the next frame with the given time delta.
 * @param dt Milliseconds since last frame.
 */
async function frame(dt: number = 15) {
  __update__(dt);
}

/**
 * Images need to be converted to base64 so that JSDOM can load them.
 */
function readAsDataUrl(path: string): string {
  let relative = join(__dirname, path);
  let binary = readFileSync(relative, { encoding: "base64" });
  return `data:image/png;base64,${binary}`;
}

vi.mock("./resources/sprites.png", () => ({
  default: readAsDataUrl("./resources/sprites.png")
}));

vi.mock("../src/font.png", () => ({
  default: readAsDataUrl("../src/font.png"),
}));

vi.mock("../resources/font2.png", () => ({
  default: readAsDataUrl("../resources/font2.png"),
}));

afterEach(() => __reset__());

test("assert", () => {
  expect(() => assert(true)).not.toThrow();
  expect(() => assert(1)).not.toThrow();

  expect(() => assert(false)).toThrow(/Assertion failed/);
  expect(() => assert(0)).toThrow(/Assertion failed/);
  expect(() => assert(null)).toThrow(/Assertion failed/);
  expect(() => assert(false, "custom message")).toThrow(/custom message/);
});

test("clamp", () => {
  expect(clamp(0, 10, 5)).toBe(5);
  expect(clamp(0, 10, 15)).toBe(10);
  expect(clamp(0, 10, -5)).toBe(0);
});

test("delta", async () => {
  await start();
  frame(20);
  expect(delta()).toBe(20);
});

test("canvas size", async () => {
  await start({ width: 100, height: 100 });
  expect(canvas.width).toBe(100);
  expect(canvas.height).toBe(100);
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

test("measure", () => {
  expect([
    "Hello world!",
    "!!!",
    "WWW",
    "Text with a \nnewline",
  ].map(measure)).toMatchSnapshot();
});

test("writing text", async () => {
  await start({ width: 100, height: 100 });
  write("hello world", 0, 10, "red", "black");
  write("hello world", 30, 40, "green", "black");
  write("hello world", 60, 70, "blue", "black");
  expect(canvas).toMatchCanvasSnapshot();
});

test("writing text with cursor state", async () => {
  await start({ width: 100, height: 100 });
  write("p1", 0, 10, "red");
  write("and p2");
  write("and p3");
  expect(canvas).toMatchCanvasSnapshot();
});

test("writing text in lines", async () => {
  await start({ width: 100, height: 100 });
  writeLine("this is line 1", 0, 10);
  writeLine("and this is line 2");
  writeLine("finally, line 3");
  expect(canvas).toMatchCanvasSnapshot();
});

test("writing icons", async () => {
  await start({ width: 100, height: 100 });
  write("icon: \x01", 0, 10, "black");
});

test("drawing sprites", async () => {
  preload(sprites);
  await start({ width: 100, height: 100 });
  draw(sprites.green_man, 0, 0);
  draw(sprites.red_man, 10, 20);
  expect(canvas).toMatchCanvasSnapshot();
});

test("drawing nine slices", async () => {
  preload(sprites);
  await start({ width: 100, height: 100 });
  draw9Slice(sprites.nine_slice, 0, 0, 10, 10);
  draw9Slice(sprites.nine_slice, 20, 20, 30, 40);
  draw9Slice(sprites.nine_slice, 60, 20, 5, 5);
  expect(canvas).toMatchCanvasSnapshot();
});

test("views", async () => {
  await start({ width: 100, height: 100 });
  view(10, 10, 50, 50);
  write("hello", 0, 0);
  end();
  expect(canvas).toMatchCanvasSnapshot();
});

test("nested views", async () => {
  await start({ width: 100, height: 100 });
  view(20, 20);
  write("view 1", 0, 0);
  view(20, 20);
  write("view 2", 0, 0);
  end();
  end();
  expect(canvas).toMatchCanvasSnapshot();
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
  let promise = tween(object, { a: 100 }, 1000);
  frame(100);
  expect(object.a).toBe(10);
  frame(500);
  expect(object.a).toBe(60);
  frame(500);
  expect(object.a).toBe(100);
  expect(promise).resolves.toBe(undefined);
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

test("alternate fonts", async () => {
  preload(font2);
  await start();
  write("This is the default font", 10, 10);

  save();
  font(font2);
  write("This is an alternate font", 10, 20);
  restore();

  write("Back to the default font", 10, 30);

  expect(canvas).toMatchCanvasSnapshot();
});
