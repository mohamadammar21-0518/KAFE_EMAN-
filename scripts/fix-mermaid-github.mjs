/**
 * Normalize README Mermaid blocks for GitHub's renderer.
 * Run: node scripts/fix-mermaid-github.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const readmePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "README.md");
let readme = fs.readFileSync(readmePath, "utf8");

function fixBlock(code) {
  let c = code;

  // participant X as Label with spaces/special chars → quoted
  c = c.replace(/^(\s*participant\s+\w+\s+as\s+)([^"\n]+)$/gm, (line, prefix, label) => {
    const t = label.trim();
    if (t.startsWith('"') || !/[\s()/.&]/.test(t)) return line;
    return `${prefix}"${t.replace(/"/g, "'")}"`;
  });

  // Unquoted node labels containing &
  c = c.replace(/(\w+)\[([^\]"]*&[^\]"]*)\]/g, (_, id, label) => {
    return `${id}["${label.trim().replace(/"/g, "'")}"]`;
  });

  // Cylinder nodes: [(foo.bar)] → [("foo.bar")]
  c = c.replace(/\[\(([^)"']+)\)\]/g, (match, body) => {
    if (body.startsWith('"') || body.startsWith("'")) return match;
    return `[("${body.replace(/"/g, "'")}")]`;
  });

  // Sequence messages with slashes (GitHub parser)
  c = c.replace(/^(\s*\w+(-+>>?|-->>?)\w+:\s*)(.+)$/gm, (line, prefix, msg) => {
    const t = msg.trim();
    if (t.startsWith('"') || !/\//.test(t)) return line;
    return `${prefix}"${t.replace(/"/g, "'")}"`;
  });

  // Trim trailing blank lines inside block
  return c.replace(/\n{3,}$/, "\n").replace(/\s+$/, "");
}

readme = readme.replace(/```mermaid\n([\s\S]*?)```/g, (_, block) => {
  return "```mermaid\n" + fixBlock(block) + "\n```";
});

fs.writeFileSync(readmePath, readme);
console.log("Updated README.md Mermaid blocks for GitHub compatibility.");
