// Screenshot the real psych surface (uses the saved psych session) in light + dark.
//   node scripts/shot.mjs <path> <name> [waitMs]
// e.g. node scripts/shot.mjs /psych/evaluations/164d859b-2580-4988-b386-ce7f8474f8b1 report
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const OUT = ".screenshots/shots";
const STATE = ".screenshots/psych-auth.json";

const path = process.argv[2] || "/psych/dashboard";
const name = process.argv[3] || "shot";
const waitMs = Number(process.argv[4] || 2600);

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();

async function capture(theme) {
  const ctx = await b.newContext({
    storageState: existsSync(STATE) ? STATE : undefined,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  // Force theme before any app JS runs (next-themes reads localStorage 'theme')
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  // belt + suspenders: ensure the class is set post-hydration
  await p.evaluate((t) => {
    const r = document.documentElement;
    r.classList.remove("light", "dark");
    r.classList.add(t);
  }, theme);
  await p.waitForTimeout(waitMs);
  // top-of-page viewport shot (masthead + hero) before we scroll
  await p.screenshot({ path: `${OUT}/${name}-${theme}-top.png`, fullPage: false });
  // scroll through to trigger every ScrollTrigger reveal, then settle at top
  await p.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    const max = document.body.scrollHeight;
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 180));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 500));
  });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/${name}-${theme}.png`, fullPage: true });
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  await ctx.close();
  console.log(`shot ${name}-${theme} done`);
}

await capture("light");
await capture("dark");
await b.close();
console.log("saved to", OUT);
