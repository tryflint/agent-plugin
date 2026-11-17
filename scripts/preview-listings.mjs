#!/usr/bin/env node
// Renders every store listing from the manifests in this repo into one HTML page.
// Usage: node scripts/preview-listings.mjs [--sources sources.json] [--out preview.html] [--embed]
// --embed drops the full-height sidebar and page background, for viewers that frame the page.
// sources.json maps "file:path" or "path" to a note on where that value came from.

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args[i + 1]
}
const outPath = flag("--out") ?? join(root, "preview.html")
const sourcesPath = flag("--sources")
const embed = args.includes("--embed")
const sources = sourcesPath ? JSON.parse(readFileSync(sourcesPath, "utf8")) : {}

const read = (file) => {
  const full = join(root, file)
  return existsSync(full) ? JSON.parse(readFileSync(full, "utf8")) : undefined
}
const dataUri = (file) => {
  const full = join(root, file.replace(/^\.\//, ""))
  if (!existsSync(full)) return ""
  const mime = full.endsWith(".svg") ? "image/svg+xml" : "image/png"
  return `data:${mime};base64,${readFileSync(full).toString("base64")}`
}
// Keys can contain dots ("com.openai"), so match the longest key at each level.
function get(obj, path) {
  const parts = path.split(".")
  let node = obj
  let i = 0
  while (i < parts.length) {
    if (node == null || typeof node !== "object") return undefined
    let j = parts.length
    while (j > i && !(parts.slice(i, j).join(".") in node)) j--
    if (j === i) return undefined
    node = node[parts.slice(i, j).join(".")]
    i = j
  }
  return node
}
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

const files = {
  root: "plugin.json",
  mcp: "mcp.json",
  claude: ".claude-plugin/plugin.json",
  claudeMarket: ".claude-plugin/marketplace.json",
  claudeMcp: ".mcp.json",
  codexMarket: ".agents/plugins/marketplace.json",
  cursor: ".cursor-plugin/plugin.json",
  cursorMarket: ".cursor-plugin/marketplace.json",
  grok: ".grok-plugin/plugin.json",
  antigravity: ".antigravity-plugin/plugin.json",
  antigravityMcp: "mcp_config.json",
}
const m = Object.fromEntries(Object.entries(files).map(([k, f]) => [k, read(f)]))

// A value shown on the page, tagged with the manifest field it came from.
function field(key, path, { as = "text" } = {}) {
  const file = files[key]
  const value = get(m[key], path)
  const note = sources[`${file}:${path}`] ?? sources[path] ?? ""
  const missing = value === undefined || value === ""
  const shown = missing
    ? `<em class="missing">not set</em>`
    : as === "list"
      ? (Array.isArray(value) ? value : [value]).map((x) => `<span class="chip">${esc(x)}</span>`).join(" ")
      : as === "link"
        ? `<a href="${esc(value)}" target="_blank" rel="noreferrer">${esc(value)}</a>`
        : esc(value)
  const tip = `${file} → ${path}${note ? `\n\nSource: ${note}` : ""}`
  return `<span class="f${note ? " sourced" : ""}" title="${esc(tip)}" data-file="${esc(file)}" data-path="${esc(path)}" data-note="${esc(note)}">${shown}</span>`
}
const row = (label, html) => `<tr><th>${esc(label)}</th><td>${html}</td></tr>`
const logo = (key, path) => {
  const src = get(m[key], path)
  return src ? `<img class="logo" src="${dataUri(src)}" alt="" title="${esc(`${files[key]} → ${path}`)}">` : `<div class="logo none">no logo</div>`
}
const note = (text) => `<p class="note">${text}</p>`

const oa = "extensions.com.openai"
const oaTabs = () => {
  const cases = get(m.root, `${oa}.review.test_cases`) ?? {}
  const caseRows = (kind) =>
    (cases[kind] ?? [])
      .map(
        (_, i) =>
          `<tr><td>${field("root", `${oa}.review.test_cases.${kind}.${i}.prompt`)}</td><td>${field("root", `${oa}.review.test_cases.${kind}.${i}.description`)}</td><td>${kind === "positive" ? field("root", `${oa}.review.test_cases.${kind}.${i}.tools_triggered`) + "<br>" + field("root", `${oa}.review.test_cases.${kind}.${i}.expected_behavior`) : ""}</td></tr>`,
      )
      .join("")
  const light = get(m.root, `${oa}.interface.brandColor`)
  const dark = get(m.root, `${oa}.interface.brandColorDark`)
  return `
  <div class="card store-openai">
    ${logo("root", `${oa}.interface.logo`)}
    <div><h3>${field("root", `${oa}.interface.displayName`)}</h3>
    <div class="sub">${field("root", `${oa}.interface.shortDescription`)}</div>
    <div class="by">by ${field("root", `${oa}.interface.developerName`)} · ${field("root", `${oa}.interface.category`)}</div></div>
  </div>
  <p>${field("root", `${oa}.interface.longDescription`)}</p>
  <h4>Try asking</h4><div>${field("root", `${oa}.interface.defaultPrompt`, { as: "list" })}</div>
  <table>
    ${row("Capabilities", field("root", `${oa}.interface.capabilities`, { as: "list" }))}
    ${row("Brand colors", `<span class="swatch" style="background:${esc(light)}"></span>${field("root", `${oa}.interface.brandColor`)} &nbsp; <span class="swatch" style="background:${esc(dark)}"></span>${field("root", `${oa}.interface.brandColorDark`)}`)}
    ${row("Composer icon", logo("root", `${oa}.interface.composerIcon`))}
    ${row("Website", field("root", `${oa}.interface.websiteURL`, { as: "link" }))}
    ${row("Support", field("root", `${oa}.interface.supportURL`, { as: "link" }))}
    ${row("Privacy", field("root", `${oa}.interface.privacyPolicyURL`, { as: "link" }))}
    ${row("Terms", field("root", `${oa}.interface.termsOfServiceURL`, { as: "link" }))}
    ${row("MCP server", field("mcp", "mcpServers.flint.url"))}
    ${row("Codex marketplace category", field("codexMarket", "plugins.0.category"))}
    ${row("Demo video", field("root", `${oa}.review.demo_recording_url`, { as: "link" }))}
    ${row("Release notes", field("root", `${oa}.publication.release_notes`))}
  </table>
  <h4>Review test cases (sent to OpenAI reviewers, not shown to users)</h4>
  <table class="cases"><tr><th>Positive prompt</th><th>Setup</th><th>Expected</th></tr>${caseRows("positive")}</table>
  <table class="cases"><tr><th>Negative prompt</th><th>What should happen</th><th></th></tr>${caseRows("negative")}</table>`
}

const shared = (key, { logoPath = "logo", nameKey = "displayName" } = {}) => `
  <div class="card">
    ${logo(key, logoPath)}
    <div><h3>${field(key, nameKey)}</h3><div class="sub">${field(key, "description")}</div>
    <div class="by">by ${field(key, "author.name")} · v${field(key, "version")}</div></div>
  </div>`

const tabs = [
  {
    id: "openai",
    title: "ChatGPT / Codex",
    reads: "plugin.json (extensions.com.openai), mcp.json, .agents/plugins/marketplace.json",
    body: oaTabs,
  },
  {
    id: "claude",
    title: "Claude",
    reads: ".claude-plugin/plugin.json, .claude-plugin/marketplace.json, .mcp.json",
    body: () => `${shared("claude", { logoPath: "icon" })}
    <table>
      ${row("Keywords", field("claude", "keywords", { as: "list" }))}
      ${row("Marketplace category", field("claudeMarket", "plugins.0.category"))}
      ${row("Marketplace description", field("claudeMarket", "description"))}
      ${row("Homepage", field("claude", "homepage", { as: "link" }))}
      ${row("Documentation", field("claude", "documentationUrl", { as: "link" }))}
      ${row("Support", field("claude", "supportUrl", { as: "link" }))}
      ${row("Privacy", field("claude", "privacyPolicyUrl", { as: "link" }))}
      ${row("Terms", field("claude", "termsOfServiceUrl", { as: "link" }))}
      ${row("Repository", field("claude", "repository", { as: "link" }))}
      ${row("License", field("claude", "license"))}
      ${row("MCP server", field("claudeMcp", "mcpServers.flint.url"))}
    </table>
    <pre>/plugin marketplace add tryflint/agent-plugin\n/plugin install flint@flint</pre>`,
  },
  {
    id: "cursor",
    title: "Cursor / Grok Bot",
    reads: ".cursor-plugin/plugin.json, .cursor-plugin/marketplace.json, .mcp.json",
    body: () => `${shared("cursor")}
    <table>
      ${row("Category", field("cursor", "category"))}
      ${row("Tags", field("cursor", "tags", { as: "list" }))}
      ${row("Keywords", field("cursor", "keywords", { as: "list" }))}
      ${row("Homepage", field("cursor", "homepage", { as: "link" }))}
      ${row("Repository", field("cursor", "repository", { as: "link" }))}
      ${row("License", field("cursor", "license"))}
      ${row("Team marketplace description", field("cursorMarket", "metadata.description"))}
      ${row("MCP server", field("claudeMcp", "mcpServers.flint.url"))}
    </table>`,
  },
  {
    id: "grok",
    title: "Grok Build",
    reads: ".grok-plugin/plugin.json (Grok reads root plugin.json first when it exists), .mcp.json",
    body: () => `${note("Grok Build reads the root <code>plugin.json</code> ahead of <code>.grok-plugin/plugin.json</code>. This native file is used if the root manifest goes away.")}
    ${shared("grok", { nameKey: "name" })}
    <table>
      ${row("Keywords", field("grok", "keywords", { as: "list" }))}
      ${row("Homepage", field("grok", "homepage", { as: "link" }))}
      ${row("Repository", field("grok", "repository", { as: "link" }))}
      ${row("MCP server", field("claudeMcp", "mcpServers.flint.url"))}
    </table>`,
  },
  {
    id: "antigravity",
    title: "Antigravity",
    reads: ".antigravity-plugin/plugin.json, mcp_config.json",
    body: () => `${shared("antigravity")}
    <h4>Suggested prompts</h4><div>${field("antigravity", "suggestedPrompts", { as: "list" })}</div>
    <table>
      ${row("Keywords", field("antigravity", "keywords", { as: "list" }))}
      ${row("Homepage", field("antigravity", "homepage", { as: "link" }))}
      ${row("Repository", field("antigravity", "repository", { as: "link" }))}
      ${row("MCP server", field("antigravityMcp", "mcpServers.flint.serverUrl"))}
    </table>`,
  },
]

const embedCss = `body{display:flex;flex-direction:column-reverse;background:none;min-height:0}
main{padding:0;max-width:none} aside{position:static;height:auto;border:1px solid var(--border,var(--line));border-radius:var(--radius,8px);padding:12px 16px;margin-bottom:16px}
:root{--bg:transparent;--fg:var(--foreground);--mute:var(--muted-foreground);--line:var(--border);--chip:var(--secondary);--hl:var(--accent-surface,var(--accent))}
nav button[aria-selected=true]{background:var(--foreground);color:var(--background)}`

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Flint plugin listings</title>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#111;--mute:#666;--line:#e5e5e5;--chip:#f2f2f2;--hl:#fff3c4}
@media(prefers-color-scheme:dark){:root{--bg:#111;--fg:#eee;--mute:#999;--line:#2a2a2a;--chip:#222;--hl:#4a3f12}}
body{font:14px/1.5 system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;display:grid;grid-template-columns:1fr 320px;${embed ? "" : "min-height:100vh"}}
main{padding:24px 32px;max-width:900px} aside{border-left:1px solid var(--line);padding:24px;${embed ? "" : "position:sticky;top:0;height:100vh;overflow:auto;"}box-sizing:border-box}
nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px} nav button{border:1px solid var(--line);background:var(--chip);color:var(--fg);padding:6px 12px;border-radius:999px;cursor:pointer}
nav button[aria-selected=true]{background:var(--fg);color:var(--bg)} .reads{color:var(--mute);font-size:12px;margin-bottom:16px}
section{display:none} section.on{display:block}
.card{display:flex;gap:16px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:16px;margin:8px 0 16px}
.logo{width:64px;height:64px;border-radius:14px;object-fit:cover} .logo.none{display:grid;place-items:center;background:var(--chip);color:var(--mute);font-size:11px}
h3{margin:0;font-size:18px} .sub{color:var(--fg)} .by{color:var(--mute);font-size:12px}
table{border-collapse:collapse;width:100%;margin:8px 0 16px} th,td{text-align:left;vertical-align:top;padding:6px 8px;border-top:1px solid var(--line)} th{width:180px;color:var(--mute);font-weight:500}
.cases td{font-size:13px} .chip{display:inline-block;background:var(--chip);border-radius:999px;padding:2px 10px;margin:2px 2px 2px 0}
.f{cursor:help;border-radius:4px} .f:hover,.f.sel{background:var(--hl)} .f.sourced{border-bottom:1px dotted var(--mute)}
.missing{color:#c0392b} .swatch{display:inline-block;width:14px;height:14px;border:1px solid var(--line);border-radius:3px;vertical-align:middle;margin-right:4px}
.note{background:var(--chip);border-radius:8px;padding:8px 12px;color:var(--mute)} pre{background:var(--chip);padding:10px;border-radius:8px;overflow:auto}
aside code{word-break:break-all} #note{white-space:pre-wrap}
${embed ? embedCss : ""}
</style></head><body><main>
<h1>Flint plugin listings</h1>
<p class="reads">Generated from the manifests in this repo. Click any value to see which file and field it comes from, and where the value originated. Red <em class="missing">not set</em> marks a field a store reads that we leave empty.</p>
<nav>${tabs.map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${t.id}">${esc(t.title)}</button>`).join("")}</nav>
${tabs.map((t, i) => `<section id="${t.id}" class="${i === 0 ? "on" : ""}"><div class="reads">Reads: ${esc(t.reads)}</div>${t.body()}</section>`).join("")}
</main><aside><h3>Field</h3><p id="pick" class="reads">Click a value.</p><p><code id="file"></code></p><p><code id="path"></code></p><h4>Where it came from</h4><p id="note" class="reads">-</p></aside>
<script>
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.setAttribute("aria-selected",x===b));document.querySelectorAll("section").forEach(s=>s.classList.toggle("on",s.id===b.dataset.tab))});
document.querySelectorAll(".f").forEach(el=>el.onclick=(e)=>{e.preventDefault();document.querySelectorAll(".f.sel").forEach(x=>x.classList.remove("sel"));el.classList.add("sel");document.getElementById("pick").textContent=el.textContent.slice(0,200);document.getElementById("file").textContent=el.dataset.file;document.getElementById("path").textContent=el.dataset.path;document.getElementById("note").textContent=el.dataset.note||"No source note."});
</script></body></html>`

writeFileSync(outPath, html)
console.log(`Wrote ${outPath}`)
