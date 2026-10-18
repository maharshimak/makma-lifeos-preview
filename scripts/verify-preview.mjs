import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const html = readFileSync(new URL("../MAKMA_LifeOS_Preview.html", import.meta.url), "utf8");
assert.match(html, /^<!doctype html>/i, "HTML must have a document type");
assert.match(html, /<html\b[^>]*\blang=["']en["']/i, "Document must declare its language");
assert.match(html, /<meta\s+name=["']viewport["']/i, "Responsive viewport meta tag required");
assert.match(html, /<title>[^<]*LifeOS[^<]*<\/title>/i, "Descriptive title required");
assert.match(html, /<\/body>\s*<\/html>\s*$/i, "Document must close its body and html tags");

const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, "Standalone preview should have exactly one inline script");
assert.doesNotMatch(scripts[0][1], /\bsrc\s*=/i, "No external script dependency in offline preview");
assert.ok(scripts[0][2].trim().length > 0, "Inline script may not be empty");
new Script(scripts[0][2], { filename: "MAKMA_LifeOS_Preview.inline.js" });

const staticMarkup = html.slice(0, scripts[0].index);
const staticIds = [...staticMarkup.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
assert.equal(new Set(staticIds).size, staticIds.length, "Static HTML IDs must be unique");
for (const id of ["searchTrigger", "notificationBtn", "openNav", "closeNav", "sidebarScrim"]) {
  assert.ok(staticIds.includes(id), `Required UI control #${id} is missing`);
}
console.log("PASS: LifeOS HTML document, inline JS syntax, offline script, and static UI controls");
