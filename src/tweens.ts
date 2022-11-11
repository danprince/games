import { clamp } from "./utils";

interface Tween {
  object: Record<any, any>;
  to: Record<any, number>;
  from: Record<any, number>;
  keys: string[];
  elapsed: number;
  duration: number;
  easing: Easing;
  callback(t: number): void;
  done(): void;
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
      done: resolve,
    });
  });
}

/**
 * @internal
 */
export function updateTweens(dt: number) {
  // Update tweens in progress
  for (let tween of _tweens) {
    tween.elapsed += dt;
    let t = clamp(0, 1, tween.elapsed / tween.duration);
    let k = tween.easing(t);

    for (let key of tween.keys) {
      let from = tween.from[key];
      let to = tween.to[key];
      let value = from + (to - from) * k;
      tween.object[key] = value;
    }

    tween.callback(t);

    if (tween.elapsed >= tween.duration) {
      tween.done();
    }
  }

  // Remove finished tweens
  _tweens = _tweens.filter(tween => tween.elapsed < tween.duration);
}

/**
 * @internal
 */
export function resetTweens() {
  _tweens = [];
}
