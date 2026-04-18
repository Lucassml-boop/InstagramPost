import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");
const localPort = 3020;
const localUrl = `http://127.0.0.1:${localPort}`;
const redirectPath = "/api/auth/instagram/callback";
const shouldSkipTunnel = process.env.SKIP_TUNNEL === "1" || process.env.SKIP_TUNNEL === "true";

let shuttingDown = false;
let nextProcess;
let tunnelProcess;

function log(message) {
  process.stdout.write(`[dev-with-tunnel] ${message}\n`);
}
function readEnvFile() {
  try {
    return fs.readFileSync(envPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

function readEnvEntries() {
  return readEnvFile()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce((env, line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      const quoted = rawValue.startsWith('"') && rawValue.endsWith('"');
      env[key] = quoted ? rawValue.slice(1, -1) : rawValue;
      return env;
    }, {});
}
function upsertEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  return `${content}${suffix}${line}\n`;
}

function updateEnvFile(publicUrl) {
  let content = readEnvFile();
  content = upsertEnvValue(content, "APP_BASE_URL", publicUrl);
  content = upsertEnvValue(content, "INSTAGRAM_REDIRECT_URI", `${publicUrl}${redirectPath}`);
  fs.writeFileSync(envPath, content, "utf8");
  log(`.env.local atualizado com a URL do tunel: ${publicUrl}`);
}
function cleanupAndExit(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGINT");
  }

  if (tunnelProcess && !tunnelProcess.killed) {
    tunnelProcess.kill("SIGINT");
  }

  setTimeout(() => process.exit(exitCode), 300);
}
function startNext() {
  try {
    nextProcess = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "dev", "-p", String(localPort)], {
      cwd: projectRoot,
      env: {
        ...process.env,
        ...readEnvEntries()
      },
      stdio: "inherit"
    });
  } catch (error) {
    log(`Falha ao iniciar o Next.js: ${error instanceof Error ? error.message : String(error)}`);
    cleanupAndExit(1);
    return;
  }

  nextProcess.on("exit", (code, signal) => {
    if (signal) {
      cleanupAndExit(0);
      return;
    }

    cleanupAndExit(code ?? 0);
  });
}
function startTunnel() {
  try {
    tunnelProcess = spawn(
      "cloudflared",
      ["tunnel", "--url", localUrl, "--no-autoupdate"],
      {
        cwd: projectRoot,
        env: process.env,
        stdio: ["inherit", "pipe", "pipe"]
      }
    );
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;

    if (code === "ENOENT" || code === "EPERM") {
      log("Nao foi possivel iniciar o cloudflared neste ambiente. Iniciando a app localmente sem tunel.");
      log("Se quiser pular essa tentativa sempre, use SKIP_TUNNEL=1 npm run dev.");
      startNext();
      return;
    }
    throw error;
  }

  let resolved = false;
  const timeout = setTimeout(() => {
    if (!resolved) {
      log("Nao consegui identificar a URL do tunel a tempo. Iniciando a app mesmo assim.");
      startNext();
      resolved = true;
    }
  }, 15000);

  const handleTunnelOutput = (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);

    if (resolved) {
      return;
    }

    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (!match) {
      return;
    }

    resolved = true;
    clearTimeout(timeout);
    const publicUrl = match[0];
    updateEnvFile(publicUrl);
    log(`Tunel ativo em ${publicUrl}`);
    startNext();
  };

  tunnelProcess.stdout.on("data", handleTunnelOutput);
  tunnelProcess.stderr.on("data", handleTunnelOutput);
  tunnelProcess.on("error", (error) => {
    if (resolved) {
      return;
    }

    clearTimeout(timeout);
    resolved = true;

    if (error && typeof error === "object" && "code" in error && (error.code === "ENOENT" || error.code === "EPERM")) {
      log("Nao foi possivel iniciar o cloudflared neste ambiente. Iniciando a app localmente sem tunel.");
      log("Se quiser pular essa tentativa sempre, use SKIP_TUNNEL=1 npm run dev.");
      startNext();
      return;
    }
    log(`Falha ao iniciar o tunel: ${error instanceof Error ? error.message : String(error)}`);
    startNext();
  });

  tunnelProcess.on("exit", (code) => {
    if (!resolved) {
      clearTimeout(timeout);
      log(`cloudflared encerrou antes de fornecer a URL do tunel (codigo ${code ?? "desconhecido"}).`);
      startNext();
      resolved = true;
      return;
    }
    if (!shuttingDown) {
      log("cloudflared foi encerrado. Finalizando o servidor local tambem.");
      cleanupAndExit(code ?? 0);
    }
  });
}

process.on("SIGINT", () => cleanupAndExit(0));
process.on("SIGTERM", () => cleanupAndExit(0));

if (shouldSkipTunnel) {
  log("SKIP_TUNNEL ativo. Iniciando a app localmente sem tunel.");
  startNext();
} else {
  startTunnel();
}
