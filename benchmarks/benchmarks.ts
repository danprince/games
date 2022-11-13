import { canvas, clear, ctx, delta, draw, draw9Slice, fillRect, line, preload, pressed, stamp, start, strokeRect, write, _reset } from "@danprince/games";
import * as sprites from "../examples/sprites";

type BenchmarkFn = () => void;

let spritesArray = Object.values(sprites);
let textArray = Object.keys(sprites);
let colorsArray = generate(10, () => `hsl(${randomInt(360)}, 80%, 60%)`);
let sizesArray = generate(10, () => [randomInt(100), randomInt(100)]);
let stampsArray = [0x7EA77C04, 0x7FF8B9CE, 0x1F8FEBF, 0xEAFFF1, 0x15A4D07];

let fpsSamples: number[] = [];
let fps = 0;
let count = 0;
let stable = false;
let auto = false;

let benchmarks: BenchmarkFn[] = [];
let currentBenchmark: BenchmarkFn;
let controls = createBenchmarkControls();

function generate<T>(n: number, factory: () => T): T[] {
  return Array.from({ length: n }).map(factory);
}

function randomInt(max: number): number {
  return Math.random() * max | 0;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function measureFPS() {
  fpsSamples.push(delta());

  if (fpsSamples.length > 10) {
    fpsSamples.shift();
  }

  let total = fpsSamples.length;
  let mean = fpsSamples.reduce((t, dt) => t + dt, 0) / total;
  fps = 1000 / mean;
}

function createBenchmarkControls() {
  let container = document.createElement("div");
  container.style.position = "fixed";
  container.style.padding = "10px";

  let btn = (html: string = "") => {
    let element = document.createElement("button");
    element.innerHTML = html;
    element.style.font = "12pt monospace";
    element.style.fontWeight = "bold";
    element.style.background = "white";
    element.style.border = "solid 2px black";
    element.style.marginRight = "4px";
    element.style.marginBottom = "4px";
    return element;
  };

  let row1 = document.createElement("div");
  let fpsCounter = btn();
  let benchmarkName = btn();
  let nextBenchmarkButton = btn(">");
  let prevBenchmarkButton = btn("<");
  nextBenchmarkButton.onclick = nextBenchmark;
  prevBenchmarkButton.onclick = prevBenchmark;
  row1.append(fpsCounter, prevBenchmarkButton, nextBenchmarkButton, benchmarkName);

  let row2 = document.createElement("div");
  let itemsCounter = btn();
  row2.append(itemsCounter);

  let row3 = document.createElement("div");
  let buttonPlus1000 = btn("+1k")
  buttonPlus1000.onclick = () => count += 1000;
  let buttonMinus1000 = btn("-1k");
  buttonMinus1000.onclick = () => count -= 1000;
  let buttonPlus100 = btn("+100")
  buttonPlus100.onclick = () => count += 100;
  let buttonMinus100 = btn("-100");
  buttonMinus100.onclick = () => count -= 100;
  let buttonAuto = btn("auto");
  buttonAuto.onclick = findMaxCountAt60FPS;
  row3.append(buttonMinus1000, buttonMinus100, buttonPlus100, buttonPlus1000, buttonAuto);

  container.append(row1, row2, row3);
  document.body.append(container);

  return {
    update() {
      fpsCounter.innerHTML = `${Math.floor(fps)}FPS`;
      itemsCounter.innerHTML = `${count} items`;
      benchmarkName.innerHTML = `${currentBenchmark.name}`;
    }
  };
}

function reset() {
  count = 0;
  auto = false;
  stable = false;
  _reset();
  preload(sprites);
  start({ loop });
}

function nextBenchmark() {
  let newIndex = benchmarks.indexOf(currentBenchmark) + 1;
  newIndex = newIndex % benchmarks.length;
  currentBenchmark = benchmarks[newIndex];
  reset();
}

function prevBenchmark() {
  let newIndex = benchmarks.indexOf(currentBenchmark) - 1;
  if (newIndex < 0) newIndex = benchmarks.length - 1;
  currentBenchmark = benchmarks[newIndex];
  reset();
}

function findMaxCountAt60FPS() {
  auto = true;
  stable = false;
}

function loop() {
  clear();
  measureFPS();
  controls.update();

  if (pressed("ArrowRight")) nextBenchmark();
  if (pressed("ArrowLeft")) prevBenchmark();
  if (pressed(" ")) findMaxCountAt60FPS();

  if (auto) {
    if (!stable) {
      if (fps >= 60) count += 100;
      else stable = true;
    } else if (fps < 60) {
      count -= 100;
    }
  }

  let runs = Math.max(count, 1);
  for (let i = 0; i < runs; i++) {
    currentBenchmark();
  }
}

benchmarks = [
  function benchmarkSprites() {
    count ||= 9_000;
    let sprite = randomItem(spritesArray);
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    draw(sprite, x, y);
  },

  function benchmarkScaledSprites() {
    count ||= 9_000;
    let sprite = randomItem(spritesArray);
    let [w, h] = randomItem(sizesArray);
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    draw(sprite, x, y, w, h);
  },

  function benchmarkText() {
    count ||= 1000;
    let text = randomItem(textArray);
    let color = randomItem(colorsArray);
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    write(text, x, y, color);
  },

  function benchmarkTextMultiline() {
    count ||= 1000;
    let text = textArray.join("\n");
    let color = randomItem(colorsArray);
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    write(text, x, y, color);
  },

  function benchmarkTextWithShadows() {
    count ||= 1000;
    let text = randomItem(textArray);
    let color = randomItem(colorsArray);
    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    write(text, x, y, color, "black");
  },

  function benchmark9Slices() {
    count ||= 1000;
    let sprite = randomItem([sprites.panel_blue, sprites.panel_red]);
    let [w, h] = randomItem(sizesArray);
    let x = Math.random() * canvas.width | 0;
    let y = Math.random() * canvas.height | 0;
    draw9Slice(sprite, x, y, w, h);
  },

  function benchmarkStamps() {
    //count ||= 12_000;
    count ||= 2000;
    let pattern = randomItem(stampsArray);
    let color = randomItem(colorsArray);
    let x = Math.random() * canvas.width | 0;
    let y = Math.random() * canvas.height | 0;
    stamp(pattern, x, y, color);
  },

  function benchmarkFillRect() {
    count ||= 18_000;
    let color = randomItem(colorsArray);
    let [w, h] = randomItem(sizesArray);
    let x = randomInt(canvas.width);
    let y = randomInt(canvas.height);
    fillRect(x, y, w, h, color);
  },

  function benchmarkStrokeRect() {
    count ||= 16_000;
    let color = randomItem(colorsArray);
    let [w, h] = randomItem(sizesArray);
    let x = randomInt(canvas.width);
    let y = randomInt(canvas.height);
    strokeRect(x, y, w, h, color);
  },

  function benchmarkLine() {
    count ||= 600;
    let x0 = randomInt(canvas.width);
    let y0 = randomInt(canvas.height);
    let x1 = randomInt(canvas.width);
    let y1 = randomInt(canvas.height);
    let color = randomItem(colorsArray);
    line(x0, y0, x1, y1, color);
  },

];

currentBenchmark = benchmarks[0];

function init() {
  reset();
  document.body.append(canvas);
}

init();
