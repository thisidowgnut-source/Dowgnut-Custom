import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const storeSource = readFileSync(resolve("src/store/use-shop.ts"), "utf8");
const sliderSource = readFileSync(
  resolve("src/components/dohnut/donut-slider.tsx"),
  "utf8",
);

describe("catalog failure presentation contract", () => {
  test("stores a catalog request error separately from an empty result", () => {
    expect(storeSource).toContain("donutsError");
    expect(storeSource).toMatch(/catch\s*\([^)]*\)?\s*\{[\s\S]*donutsError/);
  });

  test("offers recovery instead of presenting a request failure as empty", () => {
    expect(sliderSource).toContain("donutsError");
    expect(sliderSource).toContain("loadDonuts");
    expect(sliderSource).toMatch(/try again/i);
  });
});
