// Phase 2 visual-iteration harness.
// Usage:
//   node scripts/shoot.mjs baseline   -> public pages + signup a test teacher + authed pages
//   node scripts/shoot.mjs authed     -> reuse saved session, shoot authed pages
//   node scripts/shoot.mjs page <url> <name> -> single page (uses saved session if present)
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = ".screenshots";
const STATE = ".screenshots/auth-state.json";
const TEST_EMAIL = "wisegraph.phase2.test@gmail.com";
const TEST_PASS = "phase2-wisegraph!";

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const mode = process.argv[2] ?? "baseline";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: mode !== "baseline" && existsSync(STATE) ? STATE : undefined,
});
const page = await ctx.newPage();

async function shoot(url, name, { fullPage = true, settle = 800 } = {}) {
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(settle);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log(`shot ${name} <- ${url}`);
}

if (mode === "page") {
  await shoot(process.argv[3], process.argv[4] ?? "page");
} else {
  if (mode === "baseline") {
    await shoot("/", "00-landing");
    await shoot("/login", "01-login");
    await shoot("/signup", "02-signup-choice");

    // Create/log into the test teacher account.
    await page.goto(BASE + "/signup");
    await page.getByRole("button", { name: /Continue as a teacher/i }).click();
    await page.getByPlaceholder("Enter your full name").fill("Phase Two Test");
    await page.getByPlaceholder("you@school.edu").fill(TEST_EMAIL);
    await page.getByPlaceholder("At least 6 characters").fill(TEST_PASS);
    await page.screenshot({ path: `${OUT}/03-signup-form.png` });
    await page.getByRole("button", { name: /Create Account/i }).click();
    try {
      await page.waitForURL("**/dashboard", { timeout: 15000 });
      console.log("signup ok -> dashboard");
    } catch {
      // Account probably exists already -> log in instead.
      console.log("signup blocked, trying login:", await page.textContent("body").then(t => t.slice(0, 200)));
      await page.goto(BASE + "/login");
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASS);
      await page.getByRole("button", { name: /log in|sign in/i }).click();
      await page.waitForURL("**/dashboard", { timeout: 15000 });
      console.log("login ok -> dashboard");
    }
    await ctx.storageState({ path: STATE });
  }

  await shoot("/dashboard", "10-dashboard");
  await shoot("/dashboard/manage-students", "11-manage-students");
  await shoot("/dashboard/configure-assessment", "12-configure-assessment");
  await shoot("/dashboard/settings", "13-settings");
}

await browser.close();
