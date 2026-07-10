import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => { if (m.type() === "error") console.log("[console]", m.text().slice(0, 300)); });
page.on("response", (r) => { if (r.status() >= 400) console.log("[http]", r.status(), r.url().slice(0, 120)); });

await page.goto("http://localhost:3000/signup");
await page.getByRole("button", { name: /Continue as a teacher/i }).click();
await page.getByPlaceholder("Enter your full name").fill("Phase Two Test");
await page.getByPlaceholder("you@school.edu").fill("wisegraph.phase2.test@gmail.com");
await page.getByPlaceholder("At least 6 characters").fill("phase2-wisegraph!");
await page.getByRole("button", { name: /Create account/i }).click();
await page.waitForTimeout(8000);
console.log("url now:", page.url());
const err = await page.locator(".text-destructive").allTextContents();
console.log("visible error:", JSON.stringify(err));
await page.screenshot({ path: ".screenshots/probe-signup.png" });
await browser.close();
