import { Font } from "./font";
import { SpriteSheet } from "./sprites";

/**
 * Image cached by their url. Allows code that works with fonts/sprite urls
 * to retrieve the underlying image synchronously.
 */
let _images: Record<string, HTMLImageElement> = {};

/**
 * List of promises, representing assets that need to load before the game can
 * be started.
 */
let _assets: Promise<void>[] = [];

/**
 * Returns a promise that resolves when all assets have loaded.
 * @internal
 */
export async function waitForAssetsToLoad(): Promise<void> {
  await Promise.all(_assets);
}

/**
 * Loads an image, using a cached version if the image was loaded before
 * or preloaded before initialization.
 * @internal
 */
export function getImageByUrl(src: string): HTMLImageElement {
  if (_images[src]) return _images[src];
  let img = new Image();
  img.src = src;
  return (_images[src] = img);
}

/**
 * Preload an image asset from a URL before the game starts.
 */
export function preload(url: string): void;
/**
 * Preload a spritesheet's image before the game starts.
 */
export function preload(sprites: SpriteSheet): void;
/**
 * Preload a font's image before the game starts.
 */
export function preload(font: Font): void;
/**
 * Wait for some promise to resolve before the game starts.
 */
export function preload(promise: Promise<any>): void;

export function preload(resource: string | SpriteSheet | Font | Promise<any>): void {
  if (resource instanceof Promise) {
    _assets.push(resource);
  } else if (typeof resource !== "string") {
    if ("glyphWidth" in resource && "glyphHeight" in resource) {
      resource = (resource as Font).url;
    } else {
      let id = Object.keys(resource)[0];
      resource = resource[id]?.url;
    }
  }

  if (typeof resource === "string") {
    let img = getImageByUrl(resource);
    _assets.push(
      new Promise<void>((resolve, reject) => {
        img.addEventListener("load", () => resolve());
        img.addEventListener("error", reject);
      }),
    );
  }
}

/**
 * @internal
 */
export function resetAssets() {
  _assets = [];
  _images = {};
}
