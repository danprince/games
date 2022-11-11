import { preload, resetAssets, waitForAssetsToLoad } from "./assets";
import { createLoop, resetCore, resize, restore, save, _state } from "./core";
import { Font, defaultFont } from "./font";
import { addInputListeners, resetInputs, updateInputs } from "./input";
import { resetTimers, updateTimers } from "./timers";
import { resetTweens, updateTweens } from "./tweens";

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
  _state.font = font;
  preload(font.url);
  await waitForAssetsToLoad();
  resize(width, height, maxCanvasScale);
  addInputListeners();
  createLoop(dt => {
    save();
    loop();
    restore();
    _update(dt);
  });
}

/**
 * Advance internal state by one frame.
 * @param dt The time since the previous frame, in milliseconds.
 */
export function _update(dt: number) {
  updateTweens(dt);
  updateTimers(dt);
  updateInputs();
}

/**
 * Resets all internal state, used for testing.
 */
export function _reset() {
  resetCore();
  resetAssets();
  resetTweens();
  resetInputs();
  resetTimers();
}

export type { Point, Rectangle, Fill } from "./core";
export type { Font } from "./font";
export type { Sprite, NineSliceSprite, PivotSprite, SpriteSheet } from "./sprites";
export {
  canvas,
  ctx,
  save,
  restore,
  font,
  cursor,
  color,
  view,
  end,
  local,
  global,
  bounds,
  clear,
} from "./core";
export { preload } from "./assets";
export { defaultFont } from "./font";
export { Buttons, down, pressed, released, pointer, over } from "./input";
export { draw, draw9Slice } from "./sprites";
export { measure, write, writeLine } from "./text";
export { delay } from "./timers";
export { tween } from "./tweens";
export { assert, clamp } from "./utils";
