// Walks the class-overview chart through every interactive state and
// screenshots each one. Requires a saved session (run shoot.mjs baseline once).
//   node scripts/chart-states.mjs
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = ".screenshots";
const STATE = ".screenshots/auth-state.json";

if (!existsSync(STATE)) {
  console.error("no auth-state.json — run: node scripts/shoot.mjs baseline");
  process.exit(1);
}
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: STATE,
});
const page = await ctx.newPage();

await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });

const card = page
  .locator('div[class*="rounded-xl"]', {
    has: page.getByRole("heading", { name: "Class overview" }),
  })
  .first();

async function snap(name, settle = 850) {
  await page.waitForTimeout(settle);
  await card.screenshot({ path: `${OUT}/${name}.png` });
  console.log("snap", name);
}

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    console.error(`FAILED ${name}:`, e.message?.split("\n")[0]);
  }
}

// ---- radial ----
await step("radial default", async () => {
  await snap("50-radial-default");
});

await step("radial hover", async () => {
  await page.locator('path[fill="url(#wg-0)"]').first().hover();
  await snap("51-radial-hover");
});

await step("radial drill", async () => {
  await page.locator('path[fill="url(#wg-0)"]').first().click();
  await snap("52-radial-drill");
  await page.getByRole("button", { name: /All categories/i }).click();
});

await step("radial dots", async () => {
  await page.getByRole("button", { name: "Dots", exact: true }).click();
  await snap("53-radial-dots");
  await page.locator('circle[fill="var(--chart-2)"]').nth(6).click({ force: true });
  await snap("54-radial-dot-active", 500);
});

await step("radial compare", async () => {
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.locator("select").selectOption({ index: 3 });
  await page.waitForTimeout(400);
  await page.locator('path[fill="url(#wg-0)"]').first().hover();
  await snap("55-radial-compare-hover");
});

// ---- bell ----
await step("bell default", async () => {
  await page.getByRole("button", { name: /Bell curve/i }).click();
  await snap("56-bell-default", 1100);
});

await step("bell hover marker", async () => {
  await page.locator('circle[fill="var(--chart-1)"]').first().hover();
  await snap("57-bell-hover", 400);
});

await step("bell dots", async () => {
  await page.getByRole("button", { name: "Dots", exact: true }).click();
  await snap("58-bell-dots", 600);
  await page.locator('circle[fill="var(--chart-4)"]').nth(3).click({ force: true });
  await snap("59-bell-dot-active", 400);
});

await step("bell compare", async () => {
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  await page.locator("select").selectOption({ index: 5 });
  await snap("60-bell-compare", 600);
});

// ---- dark mode radial ----
await step("dark radial", async () => {
  await page.getByRole("button", { name: /Switch to dark mode/i }).click();
  await page.getByRole("button", { name: "Radial", exact: true }).click();
  await page.getByRole("button", { name: "Class avg", exact: true }).click();
  await snap("61-radial-dark", 1000);
  await page.getByRole("button", { name: /Switch to light mode/i }).click();
});

await browser.close();
console.log("done");
