import { local, Point, screenToCanvas } from "./core";

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
 * The pointer's current canvas position.
 */
let _pointer: Point = { x: NaN, y: NaN };

/**
 * The set of buttons which are currently down.
 */
let _down = new Set<InputButton>();

/**
 * The set of buttons which went down during this frame.
 */
let _pressed = new Set<InputButton>();

/**
 * The set of buttons which came up during this frame.
 */
let _released = new Set<InputButton>();

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
 * @internal
 */
export function updateInputs() {
  _pressed.clear();
  _released.clear();
}

function onPointerMove(event: PointerEvent) {
  let { x, y } = screenToCanvas(event.clientX, event.clientY);
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

/**
 * Register event listeners.
 * @internal
 */
export function addInputListeners() {
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
}

/**
 * Unregister event listeners.
 * @internal
 */
export function removeInputListeners() {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerdown", onPointerDown);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
}

/**
 * Reset all input state.
 * @internal
 */
export function resetInputs() {
  removeInputListeners();
  _down.clear();
  _pressed.clear();
  _released.clear();
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
  let p = pointer();
  let { x: px, y: py } = local(p.x, p.y);
  return px >= x && py >= y && px < x + w && py < y + h;
}
