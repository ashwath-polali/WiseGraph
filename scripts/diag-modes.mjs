// Diagnostic: capture every key surface in BOTH light and dark to find
// theme glitches. Reuses saved auth session.
//   node scripts/diag-modes.mjs
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = ".screenshots/diag";
const STATE = ".screenshots/auth-state.json";

if (!existsSync(STATE)) {
  console.error("no auth-state.json — run: node scripts/shoot.mjs baseline");
  process.exit(1);
}
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function run(theme) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: STATE,
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  // Force next-themes into the requested mode before any script runs.
  await ctx.addInitScript((t) => {
    try { localStorage.setItem("theme", t); } catch {}
  }, theme);
  const page = await ctx.newPage();

  // discover a student id from the dashboard
  await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  let studentHref = null;
  try {
    studentHref = await page
      .locator('a[href*="/dashboard/students/"]')
      .first()
      .getAttribute("href");
  } catch {}

  const routes = [
    ["/dashboard", "10-dashboard"],
    ["/dashboard/manage-students", "11-manage-students"],
    ["/dashboard/configure-assessment", "12-configure-assessment"],
    ["/dashboard/settings", "13-settings"],
  ];
  if (studentHref) routes.push([studentHref, "14-student"]);

  for (const [url, name] of routes) {
    try {
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      await page.screenshot({
        path: `${OUT}/${theme}-${name}.png`,
        fullPage: true,
      });
      console.log("shot", theme, name);
    } catch (e) {
      console.error("FAIL", theme, name, e.message?.split("\n")[0]);
    }
  }
  await ctx.close();
}

await run("light");
await run("dark");
await browser.close();
console.log("done");
