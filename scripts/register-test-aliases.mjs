import { existsSync } from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const extensions = [".ts", ".tsx", ".js", ".mjs"];

function resolveAlias(specifier) {
  if (!specifier.startsWith("@/")) {
    return null;
  }

  const basePath = path.join(root, specifier.slice(2));

  for (const extension of extensions) {
    const withExtension = `${basePath}${extension}`;
    if (existsSync(withExtension)) {
      return pathToFileURL(withExtension).href;
    }
  }

  for (const extension of extensions) {
    const asIndex = path.join(basePath, `index${extension}`);
    if (existsSync(asIndex)) {
      return pathToFileURL(asIndex).href;
    }
  }

  return pathToFileURL(basePath).href;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const resolved = resolveAlias(specifier);
    if (resolved) {
      return nextResolve(resolved, context);
    }

    return nextResolve(specifier, context);
  }
});
