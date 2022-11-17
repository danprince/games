import { expect, test } from "vitest";
import { seed, randomInt, randomFloat, randomElement, shuffle } from "./random";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

test("seed throws if value is zero", () => {
  expect(() => seed(0)).toThrow("seed value must be non-zero");
});

test("randomInt", () => {
  seed(0xABCDEF);
  let values = [];
  for (let i = 0; i < 100; i++) {
    values.push(randomInt(100));
  }
  expect(values).toMatchSnapshot();
  let rounded = values.map(Math.floor);
  expect(values).toEqual(rounded);
});

test("randomInt", () => {
  seed(0xABCDEF);
  let values = [];
  for (let i = 0; i < 100; i++) {
    values.push(randomFloat(100));
  }
  expect(values).toMatchSnapshot();
});

test("randomElement", () => {
  seed(0xABCDEF);
  let array = ALPHABET;

  for (let i = 0; i < 100; i++) {
    let item = randomElement(array);
    expect(array).toContain(item);
  }
});

test("shuffle", () => {
  seed(1);
  expect(shuffle(ALPHABET).join("")).toMatchInlineSnapshot('"xhnseukqgtrvypfjliwcdmboza"');
  seed(2);
  expect(shuffle(ALPHABET).join("")).toMatchInlineSnapshot('"vhxkwpnlcmqyjbourfgsetidza"');
  seed(3);
  expect(shuffle(ALPHABET).join("")).toMatchInlineSnapshot('"grhdwymlsiuzpovntefxcjkqba"');
});
