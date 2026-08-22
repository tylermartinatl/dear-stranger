import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Dear Stranger writing surface", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>A QUIET EXCHANGE\?<\/title>/);
  assert.match(html, /<h1>A QUIET EXCHANGE\?<\/h1>/);
  assert.match(html, /aria-label="Interactive virtual typewriter"/);
  assert.match(html, /aria-label="Type your letter"/);
  assert.match(html, /typewriter-carriage-bed\.png/);
  assert.match(html, /typewriter-strike-up\.png/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("packages the validated raster stack and physical typing geometry", async () => {
  const [component, page, layout, css, assets] = await Promise.all([
    readFile(new URL("../app/RoyalTypewriter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readdir(new URL("../public/typewriter/", import.meta.url)),
  ]);

  assert.deepEqual(assets.sort(), [
    "typewriter-carriage-bed.png",
    "typewriter-carriage-foreground.png",
    "typewriter-carriage-rear.png",
    "typewriter-stationary.png",
    "typewriter-strike-up.png",
  ]);

  assert.match(component, /from "next\/image"/);
  assert.match(component, /const MAX_COLUMNS = 42/);
  assert.match(component, /const PAPER_MARGIN = \(PAPER_WIDTH - PRINTABLE_WIDTH\) \/ 2/);
  assert.match(component, /const ACTIVE_LINE_TOP = 162/);
  assert.match(component, /const LINE_FEED = 28/);
  assert.match(component, /<pre/);
  assert.match(page, /const CHARACTERS_PER_LINE = 42/);
  assert.match(page, /const CARRIAGE_STEP_DURATION = 64/);
  assert.match(page, /const CARRIAGE_RETURN_DURATION = 470/);
  assert.match(page, /const KEY_AUDIO_POOL_SIZE = 10/);
  assert.match(page, /const RETURN_SOUND_STEPS/);
  assert.match(page, /new Audio\("\/typewriter-key\.mp3"\)/);
  assert.match(page, /setStrikeId\(\(previous\) => previous \+ 1\)/);
  assert.match(page, /if \(character !== " "\) strike\(\)/);
  assert.match(page, /typeCharacter\(event\.key\)/);
  assert.match(page, /typeCharacter\(inputCharacter\)/);
  assert.doesNotMatch(page, /toUpperCase\(\)/);
  assert.match(page, /playCarriageReturnSound\(\)/);
  assert.doesNotMatch(page, /actionQueue|STRIKE_DURATION|await strike\(\)/);
  assert.doesNotMatch(layout, /next\/font/);
  assert.match(css, /@font-face\s*\{[\s\S]*?font-family: "Special Elite"/);
  assert.match(css, /url\("\/fonts\/special-elite\.ttf"\)/);
  assert.match(css, /--font-typewriter: "Special Elite"/);
  assert.match(css, /font-family: "Courier New", Courier, monospace/);
  assert.match(css, /font-weight: 600/);
  assert.match(css, /letter-spacing: \.026042cqi/);
  assert.match(css, /white-space: pre/);
  assert.match(css, /is-returning \.typewriter-paper-copy[\s\S]*?190ms/);
  assert.match(css, /\.typewriter-strike\s*\{[\s\S]*?z-index:\s*40/);
  assert.match(css, /translateY\(\.52cqi\)/);
  assert.doesNotMatch(css, /scaleY\(/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /grid-template-columns:\s*repeat\(42,/);
  assert.doesNotMatch(component, /typewriter-paper-glyph|ghost|ink-/);
  assert.doesNotMatch(component, /@react-three|typewriter\.glb/);
});
