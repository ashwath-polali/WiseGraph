// Interaction smoke test for the redesigned psych report — proves the frozen
// behaviors survived the layout rebuild.
//   node scripts/verify.mjs <evalId>
import { chromium } from "playwright";
import { existsSync } from "fs";

const BASE = "http://localhost:3000";
const STATE = ".screenshots/psych-auth.json";
const OUT = ".screenshots/shots";
const id = process.argv[2] || "164d859b-2580-4988-b386-ce7f8474f8b1";

const b = await chromium.launch();
const ctx = await b.newContext({
  storageState: existsSync(STATE) ? STATE : undefined,
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
});
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(String(e)));
p.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text());
});

const results = {};
await p.goto(`${BASE}/psych/evaluations/${id}`, { waitUntil: "networkidle" });
await p.waitForTimeout(2500);

// 1. spreads rendered
results.spreads = await p.locator(".domain-spread").count();

// 2. spine category click updates subtests
await p.getByRole("button", { name: /Mathematics/ }).first().click();
await p.waitForTimeout(500);
const subtestText = await p.locator("text=SUBTESTS").locator("xpath=..").innerText().catch(() => "");
results.mathSubtestShown = /Arithmetic|Problem|Pattern/i.test(subtestText);

// 3. domain spread click drives spine selection (Science becomes selected → bg-psych)
await p.locator(".domain-spread", { hasText: "Science" }).first().click();
await p.waitForTimeout(700);
const scienceBtn = p.getByRole("button", { name: /^Science/ }).first();
results.scienceSelected = await scienceBtn.evaluate((el) =>
  el.className.includes("bg-psych")
).catch(() => false);

// 4. Expand opens the fullscreen modal
await p.getByRole("button", { name: /Expand/ }).first().click();
await p.waitForTimeout(700);
results.modalOpen = await p.evaluate(() => {
  const r = document.getElementById("chart-modal-root");
  return !!r && r.childElementCount > 0;
});
await p.screenshot({ path: `${OUT}/verify-expand.png`, fullPage: false });
await p.keyboard.press("Escape");
await p.waitForTimeout(400);

// 5. chart still has an interactive svg with wedge paths
results.chartPaths = await p.locator("#chart-container svg path").count();

results.errors = errors.slice(0, 8);
console.log(JSON.stringify(results, null, 2));

await b.close();
