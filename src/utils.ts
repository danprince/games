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

let _keys = new Map<any, number>();

/**
 * Creates a consistent cache friendly key for any object.
 * @internal
 */
export function createCacheKey(obj: any) {
  if (typeof obj !== "object") return obj;
  if (!_keys.has(obj)) _keys.set(obj, _keys.size);
  return _keys.get(obj);
}
