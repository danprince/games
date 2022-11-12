import { expect, test } from "vitest";
import { LRUCache, assert, clamp } from "./utils";

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

test("lru cache", () => {
  let a = { name: "a" };
  let b = { name: "b" };
  let c = { name: "c" };
  let d = { name: "d" };
  let lru = new LRUCache<any, number>(3);
  expect(lru.get(a)).toBe(undefined);

  lru.set(a, 1);
  lru.set(b, 2);
  lru.set(c, 3);
  expect(lru.get(a)).toBe(1);
  expect(lru.get(b)).toBe(2);
  expect(lru.get(c)).toBe(3);

  // Cache is full, least recently used item should be evicted
  expect(lru.set(d, 4));
  expect(lru.get(a)).toBe(undefined);
  expect(lru.get(b)).toBe(2);
  expect(lru.get(c)).toBe(3);
  expect(lru.get(d)).toBe(4);

  // Cache is full, least recently used item should be evicted
  expect(lru.set(a, 5));
  expect(lru.get(a)).toBe(5);
  expect(lru.get(b)).toBe(undefined);
  expect(lru.get(c)).toBe(3);
  expect(lru.get(d)).toBe(4);
});
