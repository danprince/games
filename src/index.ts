import { defaultFont } from "./font";

/**
 * A point in 2D space.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  /**
   * X coordinate of top left of the rectangle.
   */
  x: number;
  /**
   * Y coordinate of top left of the rectangle.
   */
  y: number;
  /**
   * Width of the rectangle.
   */
  w: number;
  /**
   * Height of the rectangle.
   */
  h: number;
}

/**
 * A sprite within an image, as defined by the rectangle. Sprites of this
 * format can be generated by the Aseprite extension included in the repo.
 */
export interface Sprite extends Rectangle {
  /**
   * Image url for the sprite.
   */
  url: string;
}

/**
 * A collection
 */
export interface SpriteSheet {
  [id: string]: Sprite;
}

export interface Font {
  url: string;
  glyphWidth: number;
  glyphHeight: number;
  lineHeight: number;
  glyphWidthsTable: Record<string, number>;
}

export type Fill = string | CanvasGradient | CanvasPattern;

interface DrawState {
  x: number;
  y: number;
  w: number;
  h: number;
  textX: number;
  textY: number;
  color: Fill;
  textShadowColor: Fill | undefined;
}

export let canvas = document.createElement("canvas");
export let ctx = canvas.getContext("2d")!;

let _delta = 0;
let _images: Record<string, HTMLImageElement> = {};
let _font: Font = defaultFont;
let _assets: Promise<any>[] = [];
let _animationFrame: number;

let _pointer: Point = { x: NaN, y: NaN };
let _down = new Set<InputButton>();
let _pressed = new Set<InputButton>();
let _released = new Set<InputButton>();

let _maxCanvasScale = Infinity;
let _stack: DrawState[] = [];
let _state: DrawState = {
  x: 0,
  y: 0,
  w: Infinity,
  h: Infinity,
  color: "black",
  textX: 0,
  textY: 0,
  textShadowColor: undefined,
};

/**
 * Loads an image, using a cached version if the image was loaded before
 * or preloaded before initialization.
 * @param src The url to the image.
 * @returns The image
 */
function _image(src: string): HTMLImageElement {
  if (_images[src]) return _images[src];
  let img = new Image();
  img.src = src;
  return (_images[src] = img);
}

/**
 * @param url Preload an image asset from a URL before the game starts.
 */
export function preload(url: string): void;
/**
 * @param sprites Preload a spritesheet's image before the game starts.
 */
export function preload(sprites: SpriteSheet): void;
/**
 * @param promise Wait for some promise to resolve before the game starts.
 */
export function preload(promise: Promise<any>): void;

export function preload(resource: string | SpriteSheet | Promise<any>): void {
  if (resource instanceof Promise) {
    _assets.push(resource);
  } else if (typeof resource !== "string") {
    let id = Object.keys(resource)[0];
    resource = resource[id]?.url;
  }

  if (typeof resource === "string") {
    let img = _image(resource);
    _assets.push(
      new Promise<void>((resolve, reject) => {
        img.addEventListener("load", () => resolve());
        img.addEventListener("error", reject);
      }),
    );
  }
}

interface Config {
  /**
   * Desired canvas width in pixels (defaults to 320).
   */
  width?: number;
  /**
   * Desired canvas height in pixels (defaults to 180).
   */
  height?: number;
  /**
   * The bitmap font to use for rendering text.
   */
  font?: Font;
  /**
   * The max scaling factor for the canvas when attempting to fill the window.
   */
  maxCanvasScale?: number;
  /**
   * A callback function that will be run once per frame.
   */
  loop?(): void;
}

/**
 * Call once to configure the game, wait for {@link preload|assets to load}),
 * then start the update loop.
 */
export async function start({
  width = 320,
  height = 180,
  maxCanvasScale = Infinity,
  font = defaultFont,
  loop = () => {},
}: Config = {}) {
  _font = font;
  _maxCanvasScale = maxCanvasScale;
  await _load();
  _resize(width, height);
  _listen();
  _loop(loop);
}

/**
 * Removes event listeners. This function is replaced when {@see _listen} is called.
 */
let _unlisten = () => {};

/**
 * Register event listeners.
 * @internal
 */
function _listen() {
  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  _unlisten = () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };

  function onResize() {
    _resize(canvas.width, canvas.height);
  }

  function onPointerMove(event: PointerEvent) {
    let { x, y } = _screenToCanvas(event.clientX, event.clientY);
    _pointer.x = Math.floor(x);
    _pointer.y = Math.floor(y);
  }

  function onPointerDown(event: PointerEvent) {
    _down.add(event.button);
    _pressed.add(event.button);
  }

  function onPointerUp(event: PointerEvent) {
    _down.delete(event.button);
    _released.add(event.button);
  }

  function onKeyDown(event: KeyboardEvent) {
    _down.add(event.key);
    _pressed.add(event.key);
  }

  function onKeyUp(event: KeyboardEvent) {
    _down.delete(event.key);
    _released.add(event.key);
  }
}

/**
 * @param x The x coordinate in screen space
 * @param y The y coordinate in screen space
 * @returns The point, relative to the canvas.
 * @internal
 */
function _screenToCanvas(x: number, y: number): Point {
  let rect = canvas.getBoundingClientRect();
  let scaleX = canvas.width / rect.width;
  let scaleY = canvas.height / rect.height;
  return {
    x: (x - rect.x) * scaleX,
    y: (y - rect.y) * scaleY,
  };
}

/**
 * Returns a promise that resolves when all assets have loaded.
 * @internal
 */
async function _load(): Promise<void> {
  preload(_font.url);
  await Promise.all(_assets);
}

/**
 * Calls {@see _update} and the callback function once per frame.
 * @internal
 */
function _loop(callback: () => void) {
  let lastFrameTime = 0;

  function loop(time: number) {
    _animationFrame = requestAnimationFrame(loop);
    lastFrameTime = lastFrameTime || time;
    let delta = time - lastFrameTime;
    lastFrameTime = time;
    save();
    callback();
    restore();
    _update(delta);
  }

  requestAnimationFrame(loop);
}

/**
 * Called once per frame to update internal state.
 * @internal
 */
function _update(dt: number) {
  _delta = dt;
  _updateTweens();
  _updateInputs();
}

/**
 * Resize the canvas to a specific resolution. After resizing the canvas, it
 * will be upscaled to fill the available screen space.
 *
 * @param w Width in pixels
 * @param h Height in pixels
 */
function _resize(w: number, h: number) {
  let scaleX = window.innerWidth / w;
  let scaleY = window.innerHeight / h;
  let scale = Math.min(scaleX, scaleY, _maxCanvasScale);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
}

/**
 * Returns the number of milliseconds between the current frame and the
 * previous frame.
 */
export function delta() {
  return _delta;
}

/**
 * Enumeration of input buttons.
 */
export enum Buttons {
  MouseLeft = 0,
  MouseMiddle = 1,
  MouseRight = 2,
  MouseBack = 3,
  MouseForward = 4,
}

type InputButton =
  // A key name from a keyboard event
  | string
  // A button index from a pointer event
  | number;

/**
 * Returns true if the button in question is currently down.
 */
export function down(btn: InputButton = Buttons.MouseLeft): boolean {
  return _down.has(btn);
}

/**
 * Returns true if the button in question was pressed during this frame.
 */
export function pressed(btn: InputButton = Buttons.MouseLeft): boolean {
  return _pressed.has(btn);
}

/**
 * Returns true if the button in question was released during this frame.
 */
export function released(btn: InputButton = Buttons.MouseLeft): boolean {
  return _released.has(btn);
}

/**
 * Returns the current position of the mouse pointer in integer coordinates
 * relative to the canvas.
 */
export function pointer(): Point {
  return { x: _pointer.x, y: _pointer.y };
}

/**
 * Reset input state at the start of each frame.
 */
function _updateInputs() {
  _pressed.clear();
  _released.clear();
}

/**
 * Returns a rectangle representing the bounds of the current view in global
 * coordinate space.
 */
export function bounds(): Rectangle {
  return { x: _state.x, y: _state.y, w: _state.w, h: _state.h };
}

/**
 * Clears the canvas.
 */
export function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Push a new state onto the drawing stack.
 */
export function save() {
  ctx.save();
  _stack.push(_state);
  _state = { ..._state };
}

/**
 * Pop a state from the drawing stack.
 */
export function restore() {
  ctx.restore();
  if (_stack.length) {
    _state = _stack.pop()!;
  }
}

/**
 * Start drawing a new view.
 * @param x The x coordinate of the view (relative to parent view)
 * @param y The y coordinate of the view (relative to the parent view)
 * @param w The width of the view
 * @param h The height of the view
 */
export function view(x: number, y: number, w?: number, h?: number) {
  save();
  ctx.translate(x, y);
  _state.x = _state.x + x;
  _state.y = _state.y + y;
  _state.w = w ?? _state.w;
  _state.h = h ?? _state.h;
}

/**
 * Finish drawing the current view.
 */
export function end() {
  restore();
}

/**
 * Converts from global coordinates (relative to the canvas) to local
 * coordinates (relative to the current view).
 * @param globalX A global x coordinate
 * @param globalY A global y coordinate
 * @returns Point in local coordinate space
 */
export function local(globalX: number, globalY: number): Point {
  return {
    x: globalX - _state.x,
    y: globalY - _state.y,
  };
}

/**
 * Converts from local coordinates (relative to the current view) to global
 * coordinates (relative to the canvas).
 * @param localX A local x coordinate
 * @param localY A local y coordinate
 * @returns Point in global coordinate space
 */
export function global(localX: number, localY: number): Point {
  return {
    x: localX + _state.x,
    y: localY + _state.y,
  };
}

/**
 * Returns true if the pointer is over a given rectangle in _local_ coordinate
 * space.
 * @param x The x coordinate for left of the rectangle, in pixels.
 * @param y The y coordinate for the top of the rectangle, in pixels.
 * @param w The width of the rectangle, in pixels.
 * @param h The height of the rectangle, in pixels.
 */
export function over(x: number, y: number, w: number, h: number): boolean {
  let { x: px, y: py } = local(_pointer.x, _pointer.y);
  return px >= x && py >= y && px < x + w && py < y + h;
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

interface Tween {
  object: Record<any, any>;
  to: Record<any, number>;
  from: Record<any, number>;
  keys: string[];
  elapsed: number;
  duration: number;
  easing: Easing;
  callback(t: number): void;
  resolve(): void;
}

type TweenableProps<T extends Record<any, any>> = {
  [K in keyof T as T[K] extends number ? K : never]: T[K];
};

export type Easing = (t: number) => number;

let _tweens: Tween[] = [];

export let easeLinear: Easing = t => t;
export let easeInOut: Easing = t =>
  (t *= 2) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1);
export let easeOutBack: Easing = t =>
  --t * t * ((1.70158 + 1) * t + 1.70158) + 1;

/**
 * @param object Object to tween
 * @param to Values to tween to
 * @param duration Length of tween in milliseconds
 * @param easing Easing timing function
 * @param callback Callback called once per frame with the tween value.
 * @returns A promise that resolves when the tween is done.
 */
export function tween<
  Target extends Record<any, any>,
  Props extends TweenableProps<Target>,
>(
  object: Target,
  to: Partial<Props>,
  duration: number,
  easing: Easing = easeLinear,
  callback: (t: number) => void = () => {},
): Promise<void> {
  return new Promise(resolve => {
    let keys = Object.keys(to);
    let from: Tween["from"] = {};

    for (let key of keys) {
      from[key] = object[key];
    }

    _tweens.push({
      object,
      to: to as Tween["to"],
      from,
      keys,
      duration,
      elapsed: 0,
      easing,
      callback,
      resolve,
    });
  });
}

function _updateTweens() {
  // Update tweens in progress
  for (let tween of _tweens) {
    tween.elapsed += _delta;
    let t = clamp(0, 1, tween.elapsed / tween.duration);
    let k = tween.easing(t);

    for (let key of tween.keys) {
      let from = tween.from[key];
      let to = tween.to[key];
      let value = from + (to - from) * k;
      tween.object[key] = value;
    }

    tween.callback(t);
  }

  // Remove finished tweens
  _tweens = _tweens.filter(tween => {
    let done = tween.elapsed >= tween.duration;
    if (done) tween.resolve();
    return !done;
  });
}

/**
 * Draws a sprite at the given coordinates.
 */
export function draw(sprite: Sprite, x: number, y: number) {
  let { x: sx, y: sy, w: sw, h: sh } = sprite;
  let dx = x;
  let dy = y;
  let img = _image(sprite.url);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
}

/**
 * Measure a string of text. Respects linebreaks, but does no wrapping.
 * @param text The text to measure.
 * @returns The required width and height in pixels
 */
export function measure(text: string): Rectangle {
  let { glyphWidth, lineHeight, glyphWidthsTable } = _font;
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
 * @param text
 * @param x
 * @param y
 * @param color
 * @param shadow
 */
export function write(
  text: string,
  x = _state.textX,
  y = _state.textY,
  color = _state.color,
  shadow = _state.textShadowColor,
) {
  let currentX = x;
  let currentY = y;
  let image = _tint(color);
  let imageShadow = _tint(shadow || "transparent");
  let { lineHeight, glyphWidth, glyphHeight, glyphWidthsTable } = _font;

  for (let i = 0; i < text.length; i++) {
    let char = text[i];

    if (char === "\n") {
      currentX = x;
      currentY += lineHeight;
      continue;
    }

    let code = char.charCodeAt(0);
    let gw = glyphWidth;
    let gh = glyphHeight;
    let sx = (code % 16) * gw;
    let sy = ((code / 16) | 0) * gh;
    let dx = currentX;
    let dy = currentY;

    if (shadow) {
      ctx.drawImage(imageShadow, sx, sy, gw, gh, dx + 1, dy, gw, gh);
      ctx.drawImage(imageShadow, sx, sy, gw, gh, dx, dy + 1, gw, gh);
      ctx.drawImage(imageShadow, sx, sy, gw, gh, dx + 1, dy + 1, gw, gh);
    }

    // Glyphs below 32 are considered to be colored icons already.
    let img = code < 32 ? _image(_font.url) : image;
    ctx.drawImage(img, sx, sy, gw, gh, dx, dy, gw, gh);

    currentX += glyphWidthsTable[char] ?? gw;
  }

  _state.textX = currentX + (glyphWidthsTable[" "] ?? glyphWidth);
  _state.textY = currentY;
}

/**
 * @param text
 * @param x
 * @param y
 * @param color
 * @param shadow
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
  _state.textY += _font.lineHeight;
}

let _tints = new Map<Fill, HTMLCanvasElement>();

/**
 * Recolor the font's image as a canvas (coloring operation is cached).
 */
function _tint(col: Fill): HTMLCanvasElement {
  if (!_tints.has(col)) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d")!;
    let img = _image(_font.url);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = col;
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    _tints.set(col, canvas);
  }

  return _tints.get(col)!;
}

/**
 * Resets all internal state, used for testing.
 * @internal
 */
function _reset() {
  _images = {};
  _tints.clear();
  _state = _stack[0] || _state;
  _stack = [];
  _assets = [];
  _tweens = [];
  _down.clear();
  _pressed.clear();
  _released.clear();
  cancelAnimationFrame(_animationFrame);
  _unlisten();
  clear();
}

/**
 * Exports for testing (not part of the public API).
 * @internal
 */
export { _reset as __reset__, _update as __update__ };