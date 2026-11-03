import { spawn, type ChildProcess } from "node:child_process";
import http from "node:http";

const PORT = process.env.PORT || "5175";
const DEV_URL =
  process.env.VITE_DEV_SERVER_URL ||
  process.env.VITE_FRONTEND_URL ||
  `http://localhost:${PORT}`;

function isServerRunning(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(Boolean(res.statusCode && res.statusCode < 500));
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForServer(url: string, maxWaitMs = 20000): Promise<void> {
  const start = Date.now();

  function poll(): Promise<void> {
    if (Date.now() - start >= maxWaitMs) {
      return Promise.reject(
        new Error(`Timeout waiting for Vite dev server at ${url}`),
      );
    }
    return isServerRunning(url).then((running) => {
      if (running) return Promise.resolve();
      return delay(400).then(poll);
    });
  }

  return poll();
}

async function main(): Promise<void> {
  let viteProcess: ChildProcess | null = null;
  const alreadyRunning = await isServerRunning(DEV_URL);

  if (!alreadyRunning) {
    console.log(`[Electron Dev] Starting Vite dev server on port ${PORT}...`);
    viteProcess = spawn("pnpm", ["dev"], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        PORT,
      },
    });
  } else {
    console.log(
      `[Electron Dev] Vite dev server already running at ${DEV_URL}.`,
    );
  }

  await waitForServer(DEV_URL);
  console.log(
    `[Electron Dev] Vite server is ready at ${DEV_URL}. Launching Electron...`,
  );

  const electronProcess = spawn(
    "pnpm",
    ["exec", "electron", "dist-electron/main.js"],
    {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: "development",
        VITE_DEV_SERVER_URL: DEV_URL,
      },
    },
  );

  electronProcess.on("exit", (code) => {
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error("[Electron Dev Error]", err);
  process.exit(1);
});
