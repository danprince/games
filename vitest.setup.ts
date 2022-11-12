import { expect } from "vitest";

expect.addSnapshotSerializer({
  serialize(val: HTMLCanvasElement): string {
    return val.toDataURL();
  },
  test(val) {
    return val instanceof HTMLCanvasElement;
  },
});
