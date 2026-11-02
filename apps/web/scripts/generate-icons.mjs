// Renders the PNG icons of the web manifest from icon.svg. Run after changing the icon.
import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const publicDir = resolve(import.meta.dirname, "../public");
const browser = await chromium.launch();

for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.goto(pathToFileURL(resolve(publicDir, "icon.svg")).href);
  await page.screenshot({ path: resolve(publicDir, `icon-${size}.png`) });
  await page.close();
}

await browser.close();
