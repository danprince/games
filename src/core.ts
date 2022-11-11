import { Font } from ".";

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

export type Fill = string | CanvasGradient | CanvasPattern;

export interface DrawState {
  x: number;
  y: number;
  w: number;
  h: number;
  textX: number;
  textY: number;
  color: Fill;
  textShadowColor: Fill | undefined;
  font: Font;
}

export let canvas = document.createElement("canvas");
export let ctx = canvas.getContext("2d")!;

let _maxCanvasScale = Infinity;

export let _stack: DrawState[] = [];
export let _state: DrawState = {
  x: 0,
  y: 0,
  w: Infinity,
  h: Infinity,
  color: "black",
  textX: 0,
  textY: 0,
  textShadowColor: undefined,
  font: undefined!,
};

/**
 * @param x The x coordinate in screen space
 * @param y The y coordinate in screen space
 * @returns The point, relative to the canvas.
 * @internal
 */
export function screenToCanvas(x: number, y: number): Point {
  let rect = canvas.getBoundingClientRect();
  let scaleX = canvas.width / rect.width;
  let scaleY = canvas.height / rect.height;
  return {
    x: (x - rect.x) * scaleX,
    y: (y - rect.y) * scaleY,
  };
}

/**
 * Resize the canvas to a specific resolution. After resizing the canvas, it
 * will be upscaled to fill the available screen space.
 *
 * @param w Width in pixels
 * @param h Height in pixels
 */
export function resize(w: number, h: number, maxScale = _maxCanvasScale) {
  _maxCanvasScale = maxScale;
  let scaleX = window.innerWidth / w;
  let scaleY = window.innerHeight / h;
  let scale = Math.min(scaleX, scaleY, maxScale);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  canvas.style.imageRendering = "pixelated";
  ctx.imageSmoothingEnabled = false;
  onresize = () => resize(w, h);
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
 * Set the current font.
 */
export function font(font: Font) {
  _state.font = font;
}

/**
 * Sets the cursor position (and optionally color) for {@link write} and
 * {@link writeLine}.
 */
export function cursor(
  x: number,
  y: number,
  col = _state.color,
  shadow = _state.textShadowColor,
) {
  _state.textX = x;
  _state.textY = y;
  _state.color = col;
  _state.textShadowColor = shadow;
}

/**
 * Set the current drawing color. This can be a CSS color, a
 * {@link CanvasGradient}, or a {@link CanvasPattern}.
 */
export function color(color: Fill) {
  _state.color = color;
}

/**
 * Start drawing a new view.
 * @param x The x coordinate of the view (relative to parent view)
 * @param y The y coordinate of the view (relative to the parent view)
 * @param w The width of the view
 * @param h The height of the view
 */
export function view(x: number = 0, y: number = 0, w?: number, h?: number) {
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

let _animationFrame: number;

/**
 * Calls the callback function once per frame, passing the delta time
 * in milliseconds since the previous frame.
 * @internal
 */
export function createLoop(callback: (dt: number) => void) {
  let lastFrameTime = 0;

  function loop(time: number) {
    _animationFrame = requestAnimationFrame(loop);
    lastFrameTime = lastFrameTime || time;
    let dt = time - lastFrameTime;
    lastFrameTime = time;
    callback(dt);
  }

  requestAnimationFrame(loop);
}

/**
 * @internal
 */
export function resetCore() {
  _state = _stack[0] || _state;
  _stack = [];
  cancelAnimationFrame(_animationFrame);
  clear();
}
