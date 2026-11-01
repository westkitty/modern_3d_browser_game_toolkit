import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const OUT = process.env.OMNI_EVIDENCE_DIR || "omni-browser-evidence";
const ids = [
  "01-tactics-table", "02-raycast-labyrinth", "03-character-course",
  "04-verified-glb-adventure", "05-webgl-shader-arena",
  "06-puzzle-museum", "07-ik-telemetry", "08-crowd-lab",
  "09-strategy-globe", "10-gpu-field"
];
const report = { browser: "Chromium / Linux software rendering", routes: [], checks: [], failures: [] };
mkdirSync(OUT, { recursive: true });

function proof(label, detail = "") {
  report.checks.push({ label, detail });
  console.log("PASS " + label + (detail ? " :: " + detail : ""));
}
function fail(reason) {
  report.failures.push(reason);
  throw new Error(reason);
}
async function waitStatus(page, id, timeout = 60000) {
  await page.waitForFunction(
    (wanted) => {
      const status = window.__DEMO_STATUS__;
      return status?.id === wanted && ["ready", "unsupported", "error"].includes(status.state);
    },
    id, { timeout }
  );
  return page.evaluate(() => window.__DEMO_STATUS__);
}
async function route(page, id) {
  await page.evaluate((next) => { window.location.hash = "#/demo/" + next; }, id);
  const status = await waitStatus(page, id);
  if (status.state === "error") fail(id + " failed to mount: " + status.detail);
  const diag = await page.evaluate(() => window.__LAUNCHER_DIAGNOSTICS__ || null);
  const ownerCount = diag?.activeLoopOwners ?? -1;
  if (ownerCount < 0 || ownerCount > 1) fail(id + " loop owners invalid: " + ownerCount);
  const heading = await page.locator(".demo-panel h2").first().textContent().catch(() => "");
  const item = { id, status: status.state, detail: status.detail ?? "", activeLoopOwners: ownerCount, heading };
  report.routes.push(item);
  await page.screenshot({ path: join(OUT, id + ".png"), fullPage: true });
  console.log("ROUTE " + JSON.stringify(item));
  return status;
}
async function home(page) {
  await page.evaluate(() => { window.location.hash = "#/"; });
  await page.waitForFunction(
    () => document.querySelectorAll(".demo-card").length === 10 &&
      window.__LAUNCHER_DIAGNOSTICS__?.activeLoopOwners === 0, null,
    { timeout: 45000 }
  );
}
async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--enable-webgl",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--disable-dev-shm-usage"
    ]
  });
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 820 }, reducedMotion: "no-preference" });
  const page = await desktop.newPage();
  page.setDefaultTimeout(12000);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await page.goto(BASE + "/#/", { waitUntil: "domcontentloaded" });
    await page.locator(".demo-card").first().waitFor();
    assert.equal(await page.locator(".demo-card").count(), 10);
    proof("All ten demo cards render");

    await page.locator(".demo-card .launch").first().focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement?.closest(".demo-card")?.getAttribute("data-demo-id")), ids[1]);
    proof("Catalog arrow-key focus navigation");

    for (const id of ids) {
      const status = await route(page, id);
      if (status.state === "ready") {
        assert.equal(await page.locator(".demo-shell").count(), 1, "expected demo shell for " + id);
      } else {
        console.log("CAPABILITY " + id + ": " + status.state + " - " + status.detail);
      }

      if (id === "01-tactics-table" && status.state === "ready") {
        const unit = page.locator(".tactics-units button").first();
        await unit.click();
        console.log("TACTICS STATE " + JSON.stringify(await page.locator(".tactics-panel").evaluate((panel) => ({
          text: panel.textContent?.slice(0, 380),
          units: [...panel.querySelectorAll(".tactics-units button")].map((node) => ({ text: node.textContent, disabled: node.disabled, selected: node.getAttribute("aria-selected") })),
          actions: [...panel.querySelectorAll(".tactics-actions button")].map((node) => ({ text: node.textContent, disabled: node.disabled }))
        }))));
        await page.locator(".tactics-actions button").filter({ hasText: /^move$/ }).click();
        await page.getByRole("button", { name: /^Move to / }).first().click();
        const note = await page.locator(".tactics-panel").innerText();
        assert.match(note, /Turn 1|Turn 2/);
        proof("Tactics interaction and semantic controls");
      }
      if (id === "02-raycast-labyrinth" && status.state === "ready") {
        assert.equal(await page.locator(".labyrinth-shell canvas").count(), 1);
        await page.keyboard.down("w");
        await page.waitForTimeout(130);
        await page.keyboard.up("w");
        proof("Canvas 2D raycaster runs with keyboard input");
      }
      if (id === "03-character-course" && status.state === "ready") {
        await page.keyboard.down("w");
        await page.waitForTimeout(160);
        await page.keyboard.up("w");
        assert.match(await page.locator("#course-status").innerText(), /speed/);
        proof("Fixed-step course keyboard movement");
      }
      if (id === "04-verified-glb-adventure" && status.state === "ready") {
        const log = await page.locator(".demo-panel pre").first().innerText();
        assert.doesNotMatch(log, /fallback.*(hash mismatch|parse error|clip missing)/i);
        await page.getByRole("button", { name: "Save", exact: true }).click();
        await page.getByText(/Saved schema v3/).waitFor();
        await page.getByRole("button", { name: "Clear save" }).click();
        await page.getByText("Save cleared. Defaults restored.").waitFor();
        await page.getByRole("button", { name: "Load", exact: true }).click();
        await page.locator(".demo-panel p[aria-live]").first().waitFor();
        proof("GLB adventure save, clear and load controls");
      }
      if (id === "05-webgl-shader-arena" && status.state === "ready") {
        await page.getByRole("button", { name: "Toggle reduced effects" }).click();
        assert.equal(await page.getByRole("button", { name: "Toggle reduced effects" }).count(), 1);
        proof("Raw WebGL effects toggle");
      }
      if (id === "06-puzzle-museum") {
        await page.getByRole("button", { name: "cyan", exact: true }).click();
        await page.getByRole("button", { name: "3", exact: true }).click();
        await page.getByRole("button", { name: "circle", exact: true }).click();
        await page.getByText(/All three rooms completed/).waitFor();
        await page.getByRole("button", { name: "Replay museum" }).click();
        await page.getByText(/Hall of Sequence/).first().waitFor();
        proof("Museum can complete all three puzzles and replay");
      }
      if (id === "07-ik-telemetry" && status.state === "ready") {
        await page.getByRole("button", { name: "mirrored" }).click();
        await page.getByText(/mirrored reach:/).first().waitFor();
        proof("Inverse-kinematics pose changes update telemetry");
      }
      if (id === "08-crowd-lab" && status.state === "ready") {
        await page.getByRole("button", { name: "Next scenario" }).click();
        await page.getByText(/scenario movement/).first().waitFor();
        for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next scenario" }).click();
        await page.getByText(/scenario crowd/).first().waitFor();
        proof("Performance scenarios switch through crowd mode");
      }
      if (id === "09-strategy-globe" && status.state === "ready") {
        await page.getByRole("button", { name: "End turn" }).click();
        await page.getByText(/Turn 2/).first().waitFor();
        await page.waitForTimeout(250);
        await page.reload({ waitUntil: "domcontentloaded" });
        await waitStatus(page, id);
        await page.getByText(/Turn 2/).first().waitFor();
        proof("IndexedDB campaign persists across page reload");
      }
      if (id === "10-gpu-field" && status.state === "unsupported") {
        assert.match(status.detail, /WebGPU|GPU|secure|adapter/i);
        proof("WebGPU unsupported state is explicit and non-fatal");
      }
      await home(page);
      const owners = await page.evaluate(() => window.__LAUNCHER_DIAGNOSTICS__?.activeLoopOwners);
      assert.equal(owners, 0, "demo " + id + " retained a render-loop owner");
    }
    proof("All ten demos navigate back to a zero-loop catalog");

    // Explicitly exercise overlapping asynchronous route requests.
    await page.route("**/assets/demos/04-verified-glb-adventure/manifest.json", async (intercept) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await intercept.continue();
    });
    await page.evaluate(() => { window.location.hash = "#/demo/04-verified-glb-adventure"; });
    await page.waitForFunction(() => window.__DEMO_STATUS__?.id === "04-verified-glb-adventure" &&
      window.__DEMO_STATUS__?.state === "loading");
    await page.evaluate(() => { window.location.hash = "#/demo/03-character-course"; });
    const finalStatus = await waitStatus(page, "03-character-course", 70000);
    assert.notEqual(finalStatus.state, "error");
    await page.waitForTimeout(400);
    assert.match(await page.locator(".chrome-title").innerText(), /03/);
    await home(page);
    await page.unrouteAll({ behavior: "ignoreErrors" });
    proof("Rapid navigation while GLB manifest fetch is pending");

    const touch = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true, hasTouch: true,
      reducedMotion: "reduce"
    });
    const mobile = await touch.newPage();
    const mobileErrors = [];
    mobile.on("pageerror", (error) => mobileErrors.push(error.message));
    await mobile.goto(BASE + "/#/demo/03-character-course", { waitUntil: "domcontentloaded" });
    const mobileStatus = await waitStatus(mobile, "03-character-course");
    if (mobileStatus.state === "ready") {
      await mobile.locator(".touch-controls").waitFor();
      await mobile.getByRole("button", { name: "Jump" }).tap();
      proof("Mobile touch controls rendered and jump accepted");
      await mobile.screenshot({ path: join(OUT, "touch-controls.png"), fullPage: true });
    } else {
      console.log("CAPABILITY mobile 03: " + mobileStatus.state + " :: " + mobileStatus.detail);
    }
    await mobile.evaluate(() => { window.location.hash = "#/"; });
    await mobile.waitForFunction(() => document.querySelectorAll(".demo-card").length === 10);
    assert.equal(mobileErrors.length, 0, "mobile page errors: " + mobileErrors.join(" / "));
    await touch.close();

    assert.equal(pageErrors.length, 0, "desktop page errors: " + pageErrors.join(" / "));
    proof("No uncaught page errors across checked routes");
  } finally {
    await page.screenshot({ path: join(OUT, "final-state.png"), fullPage: true }).catch(() => undefined);
    await browser.close();
  }
}

try {
  await run();
  report.outcome = "passed";
} catch (error) {
  report.outcome = "failed";
  const message = error instanceof Error ? error.stack || error.message : String(error);
  report.failures.push(message);
  console.error("BROWSER FAILURE:", message);
  process.exitCode = 1;
} finally {
  writeFileSync(join(OUT, "summary.json"), JSON.stringify(report, null, 2));
  console.log("BROWSER SUMMARY " + JSON.stringify({
    outcome: report.outcome,
    routes: report.routes.map((item) => [item.id, item.status]),
    checks: report.checks.length, failures: report.failures.length
  }));
}
