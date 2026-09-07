import { test, expect, type Page } from "@playwright/test";
import fs from "fs";

const SHOTS = process.env.SHOTS_DIR ?? ".playwright/shots";
fs.mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  { path: "/", h1: /Abi's\s*Lookbook/ },
  { path: "/lookbook", h1: /Lookbook/ },
  { path: "/lookbook/statement-suit", h1: /Statement Suit/ },
  { path: "/closet", h1: /Abi's Closet/ },
  { path: "/closet/jackets", h1: /Jackets/ },
  { path: "/style-dna", h1: /Style DNA/ },
  { path: "/before-you-buy", h1: /Should I buy this/ },
  { path: "/about", h1: /The person/ },
];

async function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

for (const route of ROUTES) {
  test(`renders ${route.path}`, async ({ page }, info) => {
    const errors = await collectErrors(page);
    await page.goto(route.path);
    await expect(page.locator("h1").first()).toHaveText(route.h1);

    // Every image that is in the initial viewport must have loaded.
    const firstImg = page.locator("main img").first();
    if (await firstImg.count()) {
      await firstImg.scrollIntoViewIfNeeded();
      await expect
        .poll(async () => firstImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
        .toBe(true);
    }

    // No horizontal overflow on any viewport.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, "horizontal overflow").toBeLessThanOrEqual(1);

    await page.waitForTimeout(800); // let entrance animations settle
    const name = route.path === "/" ? "home" : route.path.slice(1).replace(/\//g, "-");
    await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage: false });

    expect(errors, errors.join("\n")).toEqual([]);
  });
}

test("closet card reveals the looks an item appears in", async ({ page }) => {
  await page.goto("/closet");
  await page.waitForLoadState("networkidle");
  // The button's accessible name flips between Show/Hide, so locate it by its badge text.
  const btn = page.locator("button[aria-controls]").filter({ hasText: "7 LOOKS" }).first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await expect(btn).toHaveAttribute("aria-expanded", "true");
  const panel = page.locator(`[id="${await btn.getAttribute("aria-controls")}"]`);
  await expect(panel.getByRole("link")).toHaveCount(7);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/closet-expanded-${test.info().project.name}.png` });
});

test("lookbook filters narrow the grid and announce the count", async ({ page }) => {
  await page.goto("/lookbook");
  await page.waitForLoadState("networkidle");
  const winter = page.getByRole("group", { name: "SEASON" }).getByRole("button", { name: "WINTER", exact: true });
  await winter.click();
  await expect(winter).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/^2 LOOKS$/)).toBeVisible();
  await expect(page.locator(".masonry-grid a")).toHaveCount(2);
});

test("admin route is not served publicly", async ({ page }) => {
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});

test("the advisor renders, reports its status, and handles a demo request", async ({ page }) => {
  await page.goto("/before-you-buy");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "ASK THE CLOSET" })).toBeDisabled();
  await page.getByLabel("OR DESCRIBE IT").fill("Burgundy merino crewneck");
  await expect(page.getByRole("button", { name: "ASK THE CLOSET" })).toBeEnabled();

  const status = await page.request.get("/api/advise").then((r) => r.json());
  expect(status).toEqual(expect.objectContaining({ model: expect.any(String), dailyCap: expect.any(Number) }));

  await page.getByRole("button", { name: "A BURGUNDY MERINO CREWNECK" }).click();
  // Either a real verdict (key configured / precomputed) or the editorial "paused" state.
  await expect(page.locator("#verdict-heading, [role=status], [role=alert]").first()).toBeVisible({ timeout: 60_000 });
  await expect(page.locator("text=THE VERDICT").or(page.locator("text=Live verdicts are switched off"))).toBeVisible({ timeout: 60_000 });
});

test("the advise route validates input and never leaks the key", async ({ request }) => {
  const bad = await request.post("/api/advise", { data: {} });
  expect(bad.status()).toBe(400);
  const gif = await request.post("/api/advise", { data: { image: { mediaType: "image/gif", data: "x".repeat(32) } } });
  expect(gif.status()).toBe(400);
  const text = await (await request.get("/api/advise")).text();
  expect(text).not.toMatch(/sk-ant/);
});
