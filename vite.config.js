import * as path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@danprince/games": path.resolve(__dirname, "./src"),
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "index",
      fileName: format => `index.${format}.js`,
    },
  },
  test: {
    // Canvas tests don't work if vitest is running with worker threads.
    // https://xebia.com/blog/how-to-solve-canvas-crash-in-vitest-with-threads-and-jsdom/
    //threads: false,

    include: ["**/{*.test,tests}.ts"],
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        resources: "usable"
      },
    }
  },
});
