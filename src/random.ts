import { assert } from "./utils";

let _state = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);

/**
 * Seed the current random number generator.
 * @param value A non-zero integer seed value.
 */
export function seed(value: number) {
  assert(value !== 0, "seed value must be non-zero");
  _state = value;
}

/**
 * Returns a random float between 0 and 1.
 */
function rand() {
  _state ^= _state << 13; _state ^= _state >>> 17; _state ^= _state << 5;
  return (_state >>> 0) / 4294967296;
}

/**
 * Returns a random integer between 0 and `max`.
 */
export function randomInt(max: number): number {
  return Math.floor(rand() * max);
}

/**
 * Returns a random float between 0 and `max`.
 */
export function randomFloat(max: number): number {
  return rand() * max;
}

/**
 * Returns a random element from `array`.
 */
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(rand() * array.length)];
}

/**
 * Returns a shuffled copy of an array.
 */
export function shuffle<T>(array: T[]): T[] {
  array = [...array];
  let m = array.length;

  while (m) {
    let i = randomInt(m--);
    [array[m], array[i]] = [array[i], array[m]];
  }

  return array;
}
