import type { Point, Rectangle } from ".";

/**
 * A stable map of keys for objects that otherwise can't be used in a cache.
 */
let _keys = new WeakMap<any, number>();

/**
 * The next key we'll use when we see an object that isn't in {@see _keys}.
 */
let _nextKey = 0;

/**
 * Return a unique key for a given object, to be used in caches.
 */
export function getKey(object: object): number;
export function getKey<T>(object: T): T;
export function getKey(object: any): any {
  if (typeof object !== "object") {
    return object;
  }

  if (_keys.has(object)) {
    return _keys.get(object)!;
  }

  let key = _nextKey++;
  _keys.set(object, key);
  return key;
}

/**
 * Asserts that `cond` is truthy, or throws an error with `msg` as the text.
 */
export function assert(
  cond: any,
  msg: string = "Assertion failed",
): asserts cond {
  if (!cond) throw new Error(msg);
}

/**
 * Clamps `value` into the inclusive range (`min`, `max`).
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @param value The value to clamp
 */
export function clamp(min: number, max: number, value: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

interface LRUNode<Key, Value> {
  key: Key;
  value: Value;
  next: LRUNode<Key, Value> | null;
  prev: LRUNode<Key, Value> | null;
}

export class LRUCache<Key, Value> {
  private head: LRUNode<Key, Value> | null = null;
  private tail: LRUNode<Key, Value> | null = null;
  private cache = new Map<Key, LRUNode<Key, Value>>();
  constructor(readonly maxSize: number) {}

  set(key: Key, value: Value) {
    if (this.cache.has(key)) return;

    let node: LRUNode<Key, Value> = { key, value, next: null, prev: null };

    if (this.cache.size === 0) {
      this.head = this.tail = node;
      this.cache.set(key, node);
    }

    if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.tail!.key);
      this.tail = this.tail!.prev;
      this.tail!.next = null;
    }

    this.head!.prev = node;
    node.next = this.head;
    this.head = node;
    this.cache.set(node.key, node);
  }

  get(key: Key): Value | undefined {
    let node = this.cache.get(key);
    if (node == null) return undefined;
    if (node === this.head) return node.value;
    if (node === this.tail) {
      this.tail = node.prev;
      this.tail!.next = null;
    } else {
      node.prev!.next = node.next;
      node.next!.prev = node.prev;
    }

    this.head!.prev = node;
    node.next = this.head;
    node.prev = null;
    this.head = node;

    return node.value;
  }

  clear() {
    this.head = this.tail = null;
    this.cache.clear();
  }
}

/**
 * Calculates the points on a rasterised version of a single pixel line using
 * [Bresenham's algorithm](https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm).
 * @param x1 X coordinate of the first point.
 * @param y1 Y coordinate of the first point.
 * @param x2 X coordinate of the second point.
 * @param y2 Y coordinate of the second point.
 * @returns An array of points along the line.
 */
export function lineToPoints(x1: number, y1: number, x2: number, y2: number): Point[] {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let sx = Math.sign(dx);
  let sy = Math.sign(dy);
  if (sx === 0 && sy === 0) return [];

  let err = 0;
  let points: Point[] = [];
  dx = Math.abs(dx);
  dy = Math.abs(dy);

  if (dx > dy) {
    for (let x = x1, y = y1; sx < 0 ? x >= x2 : x <= x2; x += sx) {
      points.push({ x, y });
      err += dy;
      if (err * 2 >= dx) {
        y += sy;
        err -= dx;
      }
    }
  }

  else {
    for (let x = x1, y = y1; sy < 0 ? y >= y2 : y <= y2; y += sy) {
      points.push({ x, y });
      err += dx;
      if (err * 2 >= dy) {
        x += sx;
        err -= dy;
      }
    }
  }

  return points;
}

/**
 * A very simple batched texture that can hold multiple textures as a more
 * performant alternative to caching and rendering from multiple canvases.
 *
 * Note: texture caches will grow indefinitely and can easily cause
 * memory leaks.
 *
 * To avoid reshaping the underlying texture too often, all the textures
 * are arranged in a horizontal strip that is doubled in width whenever
 * a texture is added that would overflow. The height is expanded to
 * match the height of the tallest texture.
 */
export class TextureCache {
  readonly canvas = document.createElement("canvas");
  private ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
  private cursor = 0;
  private rects: Record<string, Rectangle> = {};

  clear() {
    this.rects = {};
    this.canvas.width = this.canvas.width;
  }

  findOrCreate(key: string, create: () => HTMLCanvasElement) {
    return this.rects[key] || this.add(key, create());
  }

  get(key: string): Rectangle | undefined {
    return this.rects[key];
  }

  add(key: string, canvas: HTMLCanvasElement): Rectangle {
    let { width, height } = this.canvas;
    let requiredWidth = this.cursor + canvas.width;
    let requiredHeight = canvas.height;

    if (requiredWidth > width || requiredHeight > height) {
      let imageData = this.ctx.getImageData(0, 0, width, height);

      while (this.canvas.width < requiredWidth) {
        this.canvas.width *= 2;
      }

      if (this.canvas.height < requiredHeight) {
        this.canvas.height = requiredHeight;
      }

      this.ctx.putImageData(imageData, 0, 0);
    }

    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(canvas, this.cursor, 0);

    let rect = this.rects[key] = {
      x: this.cursor,
      y: 0,
      w: canvas.width,
      h: canvas.height,
    };

    this.cursor += canvas.width;

    return rect;
  }
}
