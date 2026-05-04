import fs from "node:fs";

export function readEnvFile(envPath) {
  try {
    return fs.readFileSync(envPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

export function readEnvValue(envPath, key) {
  const pattern = new RegExp(`^${key}\\s*=\\s*(.*)$`, "m");
  const match = readEnvFile(envPath).match(pattern);

  if (!match) {
    return "";
  }

  return match[1].trim().replace(/^["']|["']$/g, "");
}

export function normalizePublicUrl(value) {
  return value.trim().replace(/\/$/, "");
}

export function upsertEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  return `${content}${suffix}${line}\n`;
}

export function writeEnvFile(envPath, content) {
  fs.writeFileSync(envPath, content, "utf8");
}
