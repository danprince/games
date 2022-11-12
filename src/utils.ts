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