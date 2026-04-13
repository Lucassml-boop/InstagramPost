import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const MAX_LINES = 200;
const root = process.cwd();
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
const ignoredDirs = new Set([".git", ".next", "node_modules"]);

function walk(dir, output = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const relativePath = path.relative(root, fullPath);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (!ignoredDirs.has(entry)) {
        walk(fullPath, output);
      }
      continue;
    }

    if (allowedExtensions.has(path.extname(entry))) {
      output.push(relativePath);
    }
  }

  return output;
}

const offenders = walk(root)
  .map((relativePath) => {
    const content = readFileSync(path.join(root, relativePath), "utf8");
    return {
      relativePath,
      lines: content.split("\n").length
    };
  })
  .filter((file) => file.lines > MAX_LINES)
  .sort((a, b) => b.lines - a.lines);

if (offenders.length > 0) {
  console.error(`Found ${offenders.length} files above ${MAX_LINES} lines:`);

  for (const offender of offenders) {
    console.error(`- ${offender.relativePath}: ${offender.lines} lines`);
  }

  process.exit(1);
}

console.log(`All checked source files are within ${MAX_LINES} lines.`);
