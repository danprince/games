import { rm } from "fs/promises";
import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { afterAll, beforeAll, expect } from "vitest";
import { createCanvas, createImageData, Image } from "canvas";
import * as glob from "fast-glob"

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchCanvasSnapshot(): Promise<R>
    }
  }
}

expect.extend({ toMatchCanvasSnapshot });

let obsoleteSnapshotFiles = new Set<string>();

beforeAll(() => {
  let ignore = ["node_modules"];
  let files = glob.sync("**/__canvas_snapshots__/*", { ignore });
  let snapshotFiles = files.map(file => join(process.cwd(), file));
  obsoleteSnapshotFiles = new Set(snapshotFiles);
});

afterAll(async () => {
  let files = Array.from(obsoleteSnapshotFiles);
  await Promise.all(files.map(file => rm(file)));
});

function writeImageDataToDisk(fileName: string, imageData: ImageData) {
  let canvas = createCanvas(imageData.width, imageData.height);
  let ctx = canvas.getContext("2d")!;
  ctx.putImageData(imageData, 0, 0);
  let buffer = canvas.toBuffer();
  writeFileSync(fileName, buffer);
}

function readImageDataFromDisk(fileName: string) {
  try {
    let image = new Image()
    image.src = readFileSync(fileName) as any;
    let canvas = createCanvas(image.width, image.height);
    let ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.width, image.height);
  } catch (err) {
    if (err instanceof Error && /ENOENT/.test(err.message)) {
      return undefined;
    } else {
      throw err;
    }
  }
}

let colorCodeRegex = /\u001b\[\d+m/g;
let kebabCaseRegex = /[^\w\-_\.]+/g;

function getSnapshotIdentifier(currentTestName: string) {
  let testName = currentTestName!.replace(colorCodeRegex, "");
  return testName.split(" > ").slice(1).join("/").replace(kebabCaseRegex, "-");
}

function getSnapshotDirectory(testPath: string) {
  return join(dirname(testPath!), "__canvas_snapshots__");
}

function checkForChanges(img1: ImageData, img2: ImageData) {
  expect(img1.width).toBe(img2.width);
  expect(img1.height).toBe(img2.height);
  let diff = createImageData(img1.width, img1.height);
  let numberOfChangedPixels = 0;

  for (let i = 0; i < img1.data.length; i += 4) {
    let r1 = img1.data[i];
    let g1 = img1.data[i + 1];
    let b1 = img1.data[i + 2];
    let a1 = img1.data[i + 3];

    let r2 = img2.data[i];
    let g2 = img2.data[i + 1];
    let b2 = img2.data[i + 2];
    let a2 = img2.data[i + 3];

    let changed = r1 !== r2 || g1 !== g2 || b1 !== b2 || a1 !== a2;
    if (changed) numberOfChangedPixels += 1;

    let show = a2 > 0;
    let diffAlpha = 0.5;

    diff.data[i + 0] = show ? 255 : r1 * diffAlpha;
    diff.data[i + 1] = show ?   0 : g1 * diffAlpha;
    diff.data[i + 2] = show ?   0 : b1 * diffAlpha;
    diff.data[i + 3] = show ? 255 : a1 * diffAlpha;
  }

  let changed = numberOfChangedPixels > 0;

  return {
    changed,
    numberOfChangedPixels,
    preview: changed ? createDiffPreview(img1, img2, diff) : undefined,
  };
}

type MatcherState = ReturnType<typeof expect["getState"]>;

function toMatchCanvasSnapshot(this: MatcherState, canvas: HTMLCanvasElement) {
  let { testPath, currentTestName, snapshotState } = this;
  let { width, height } = canvas;
  let ctx = canvas.getContext("2d")!;

  let snapshotId = getSnapshotIdentifier(currentTestName!);
  let snapshotsDir = getSnapshotDirectory(testPath!);
  let snapshotFile = join(snapshotsDir, `${snapshotId}.png`);

  obsoleteSnapshotFiles.delete(snapshotFile);

  let forceUpdate = (snapshotState as any)._updateSnapshot === "all";
  let expectedImageData = readImageDataFromDisk(snapshotFile);
  let actualImageData = ctx.getImageData(0, 0, width, height);

  if (expectedImageData && !forceUpdate) {
    let results = checkForChanges(expectedImageData, actualImageData);

    if (results.changed) {
      snapshotState.unmatched += 1;
      let diffPreviewPath = `/tmp/canvas-diffs/${snapshotId}.png`;
      mkdirSync(dirname(diffPreviewPath), { recursive: true });
      writeImageDataToDisk(diffPreviewPath, results.preview!);

      return {
        pass: false,
        message: () => `Canvas changed by ${results.numberOfChangedPixels} pixels. Preview: ${diffPreviewPath}`,
      };
    } else {
      snapshotState.matched += 1
    }
  } else {
    snapshotState.added += 1;
    mkdirSync(snapshotsDir, { recursive: true });
    writeImageDataToDisk(snapshotFile, actualImageData);
  }

  return {
    pass: true,
    message: () => "",
  };
}

function createDiffPreview(img1: ImageData, img2: ImageData, diff: ImageData) {
  let canvas = createCanvas(img1.width * 3, img1.height);
  let ctx = canvas.getContext("2d")!;
  ctx.putImageData(img1, 0, 0);
  ctx.putImageData(img2, img1.width, 0);
  ctx.putImageData(diff, img1.width + img2.width, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
