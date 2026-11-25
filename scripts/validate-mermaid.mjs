import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const readme = fs.readFileSync("README.md", "utf8");
const blocks = [...readme.matchAll(/```mermaid\n([\s\S]*?)```/g)];
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "mermaid-check");
fs.mkdirSync(dir, { recursive: true });

const issues = [];

blocks.forEach((m, i) => {
  const code = m[1].trim();
  const file = path.join(dir, `diagram-${i + 1}.mmd`);
  fs.writeFileSync(file, code + "\n");

  // Heuristic warnings
  if (/\[[^"\]]*\/[^"\]]*\]/.test(code)) {
    issues.push({ i: i + 1, type: "unquoted-slash-in-brackets", snippet: code.match(/\[[^"\]]*\/[^"\]]*\]/)?.[0] });
  }
  if (/\[\//.test(code)) {
    issues.push({ i: i + 1, type: "trapezoid-syntax", snippet: code.match(/\[\/.+?\]/)?.[0] });
  }
  if (/\\n/.test(code)) {
    issues.push({ i: i + 1, type: "escaped-newline", snippet: "\\n in labels" });
  }
  if (/subgraph modes\b/.test(code)) {
    issues.push({ i: i + 1, type: "subgraph-modes-id" });
  }

  try {
    execSync(`npx -y @mermaid-js/mermaid-cli@11.4.0 -i "${file}" -o "${file}.svg"`, {
      stdio: "pipe",
      timeout: 60000,
    });
  } catch (e) {
    const err = e.stderr?.toString() || e.stdout?.toString() || e.message;
    issues.push({ i: i + 1, type: "render-failed", error: err.slice(0, 500) });
  }
});

console.log(JSON.stringify({ total: blocks.length, issues }, null, 2));
