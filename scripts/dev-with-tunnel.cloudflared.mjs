import fs from "node:fs";
import path from "node:path";

export function getCloudflaredCommand() {
  const candidates = [
    "cloudflared",
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Links", "cloudflared.exe")
      : "",
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Microsoft", "WindowsApps", "cloudflared.exe")
      : ""
  ].filter(Boolean);

  const wingetPackagesDir = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages")
    : "";

  if (wingetPackagesDir && fs.existsSync(wingetPackagesDir)) {
    const packageDirs = fs
      .readdirSync(wingetPackagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("Cloudflare.cloudflared_"))
      .map((entry) => path.join(wingetPackagesDir, entry.name, "cloudflared.exe"));

    candidates.push(...packageDirs);
  }

  return candidates.find((candidate) => candidate === "cloudflared" || fs.existsSync(candidate)) ?? "cloudflared";
}
