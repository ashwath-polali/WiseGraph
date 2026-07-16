// Sign up a psychologist test account, save its session, and screenshot the
// psych flow so fable-5 can iterate on the actual psych surface.
//   node scripts/psych-setup.mjs
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = ".screenshots";
const STATE = ".screenshots/psych-auth.json";
const EMAIL = "wisegraph.psych.test@gmail.com";
const PASS = "phase2-wisegraph!";
const NAME = "Dr. Test Psych";

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

async function fillSignup() {
  await p.goto(BASE + "/signup", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /psychologist/i }).first().click();
  await p.waitForTimeout(600);
  // step 2 form — resilient selectors
  const nameInput = p.locator('input[type="text"]').first();
  await nameInput.fill(NAME);
  await p.locator('input[type="email"]').first().fill(EMAIL);
  await p.locator('input[type="password"]').first().fill(PASS);
  await p.getByRole("button", { name: /create account/i }).click();
}

let loggedIn = false;
try {
  await fillSignup();
  await p.waitForURL("**/psych/**", { timeout: 15000 });
  loggedIn = true;
  console.log("signed up -> psych portal");
} catch (e) {
  console.log("signup path failed, trying login:", (await p.textContent("body").catch(() => "")).slice(0, 160));
  await p.goto(BASE + "/login", { waitUntil: "networkidle" });
  // pick Psychologist account type if a toggle exists
  try {
    await p.getByRole("button", { name: /psychologist/i }).first().click({ timeout: 3000 });
  } catch {}
  await p.locator('input[type="email"]').first().fill(EMAIL);
  await p.locator('input[type="password"]').first().fill(PASS);
  await p.getByRole("button", { name: /log in|sign in/i }).click();
  try {
    await p.waitForURL("**/psych/**", { timeout: 15000 });
    loggedIn = true;
    console.log("logged in -> psych portal");
  } catch {
    console.log("LOGIN ALSO FAILED. body:", (await p.textContent("body").catch(() => "")).slice(0, 200));
  }
}

if (loggedIn) {
  await ctx.storageState({ path: STATE });
  await p.goto(BASE + "/psych/dashboard", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/diag/psych-dashboard.png`, fullPage: true });
  await p.goto(BASE + "/psych/new-evaluation", { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/diag/psych-new-eval.png`, fullPage: true });
  console.log("saved psych-auth.json + screenshots");
}

await b.close();
