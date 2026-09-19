// index.html の fetchData() そのものを Node で実行してスナップショットを生成する(再実装しないので常に一致)
// 使い方(プロジェクトのフォルダで): node tools/gen-snapshot.mjs   → data-snapshot.js(PvP/Seasonal用) と data-snapshot-pve.js(PvE用) を両方作り直す
import fs from "fs"; import vm from "vm"; import path from "path"; import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const inlineJs = scripts[scripts.length - 1][1];
async function gen(mode, out){
const lines = inlineJs.split("\n");
const endIdx = lines.findIndex(l => /return \{ maps, tasks(, story)? \};/.test(l));
const a = lines.findIndex(l => /^let LANG = /.test(l));
const t0 = lines.findIndex(l => /^function applyStaticI18n/.test(l));
const c0 = lines.findIndex(l => /^const canonMap = /.test(l));
const j0 = lines.findIndex(l => /^const JD_BASE/.test(l));
// 1) LANG/MODE/STR/T  2) canonMap以降のMAP_ALIAS等は下で個別に拾う  3) JD_BASE 〜 fetchData末尾
const ma = lines.findIndex(l => /MAP_ALIAS\s*=/.test(l));
let src = lines.slice(a, t0).join("\n") + "\n";
// MAP_ALIAS ブロック(単一文)を拾う
let k = ma; let depth = 0, buf = [];
for (; k < lines.length; k++) { buf.push(lines[k]); for (const ch of lines[k]) { if (ch === "{") depth++; else if (ch === "}") depth--; } if (depth === 0 && /;\s*(\/\/.*)?$/.test(lines[k])) break; }
src += buf.join("\n") + "\n" + lines[c0] + "\n";
src += lines.slice(j0, endIdx + 2).join("\n") + "\n";
src += "\nthis.__fetchData = fetchData;";
const ctx = { localStorage: { getItem: k => k === "eft_qm_mode" ? mode : (k === "eft_qm_lang" ? "ja" : null), setItem(){} }, fetch, console, setTimeout };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const data = await ctx.__fetchData();
fs.writeFileSync(out, (mode === "pve" ? "window.__EFT_SNAPSHOT_PVE__ = " : "window.__EFT_SNAPSHOT__ = ") + JSON.stringify({ generated: new Date().toISOString(), data }) + ";\n", "utf8");
console.log(mode, "tasks", data.tasks.length, "maps", data.maps.length, "->", out, (fs.statSync(out).size / 1e6).toFixed(2) + "MB");
}
await gen("pvp", path.join(root, "data-snapshot.js"));
await gen("pve", path.join(root, "data-snapshot-pve.js"));
