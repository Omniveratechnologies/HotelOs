import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");

// Color helpers for terminal output
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  magenta: (s) => `\x1b[35m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  boldCyan: (s) => `\x1b[1m\x1b[36m${s}\x1b[0m`,
  boldMagenta: (s) => `\x1b[1m\x1b[35m${s}\x1b[0m`,
  boldGreen: (s) => `\x1b[1m\x1b[32m${s}\x1b[0m`,
  boldYellow: (s) => `\x1b[1m\x1b[33m${s}\x1b[0m`,
};

// 1. Run IP synchronization pre-flight
console.log(c.boldCyan("🔄 Syncing local IP for Kiosk..."));
try {
  execFileSync(process.execPath, [path.join(scriptDir, "sync-kiosk-ip.mjs")], {
    cwd: rootDir,
    stdio: "inherit",
  });
} catch {
  console.error(
    c.red(
      "\n❌ Kiosk IP synchronization failed. Aborting dev:kiosk startup.\n",
    ),
  );
  process.exit(1);
}

// 2. Open an independent, interactive terminal window for Expo
function openKioskTerminal() {
  const platform = os.platform();
  const kioskCmd = "pnpm -F kiosk dev";

  const logOpening = (termName) => {
    console.log(c.boldMagenta(`🚀 Opening in <${termName}> terminal...`));
  };

  // Check for terminal multiplexers (tmux / GNU Screen)
  if (process.env.TMUX) {
    logOpening("tmux");
    spawn(
      "tmux",
      [
        "new-window",
        "-n",
        "HotelOS Kiosk",
        "-c",
        rootDir,
        `${kioskCmd}; exec bash`,
      ],
      { detached: true, stdio: "ignore" },
    ).unref();
    return;
  }

  if (process.env.STY) {
    logOpening("GNU Screen");
    spawn(
      "screen",
      [
        "-X",
        "screen",
        "-t",
        "HotelOS Kiosk",
        "bash",
        "-c",
        `cd "${rootDir}" && ${kioskCmd}; exec bash`,
      ],
      { detached: true, stdio: "ignore" },
    ).unref();
    return;
  }

  if (platform === "win32") {
    // If running inside a Windows Terminal tab, attach a new tab
    if (process.env.WT_SESSION) {
      logOpening("Windows Terminal (New Tab)");
      spawn(
        "wt.exe",
        [
          "-w",
          "0",
          "nt",
          "-d",
          rootDir,
          "--title",
          "HotelOS Kiosk",
          "cmd.exe",
          "/k",
          kioskCmd,
        ],
        { detached: true, stdio: "ignore" },
      ).unref();
      return;
    }

    // If wt.exe is available on the system, open a Windows Terminal window
    const hasWt =
      spawnSync("where.exe", ["wt.exe"], { stdio: "ignore" }).status === 0;
    if (hasWt) {
      logOpening("Windows Terminal");
      spawn(
        "wt.exe",
        ["-d", rootDir, "--title", "HotelOS Kiosk", "cmd.exe", "/k", kioskCmd],
        { detached: true, stdio: "ignore" },
      ).unref();
      return;
    }

    // Default Windows fallback: spawns standard Windows CMD window
    // `/k` keeps the terminal window open and interactive if the command fails or exits
    logOpening("Windows Command Prompt");
    spawn(
      "cmd.exe",
      [
        "/c",
        "start",
        "HotelOS Kiosk",
        "/D",
        rootDir,
        "cmd.exe",
        "/k",
        kioskCmd,
      ],
      { detached: true, stdio: "ignore" },
    ).unref();
    return;
  }

  if (platform === "darwin") {
    logOpening("macOS Terminal");
    // macOS Terminal.app via AppleScript with bash wrapper to keep output visible on crash
    const appleScript = `tell application "Terminal"
      activate
      do script "cd '${rootDir}' && ${kioskCmd}; exec bash"
    end tell`;

    spawn("osascript", ["-e", appleScript], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  // Linux desktop check
  if (!process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) {
    console.error(
      c.red(
        "❌ Cannot open a graphical terminal window in a headless Linux environment.",
      ),
    );
    console.error(
      c.yellow(
        "   Please run `pnpm -F kiosk dev` manually in another terminal or tmux window.",
      ),
    );
    process.exit(1);
  }

  const linuxTerminals = [
    {
      bin: "x-terminal-emulator",
      name: "x-terminal-emulator",
      args: ["-e", `bash -c "cd '${rootDir}' && ${kioskCmd}; exec bash"`],
    },
    {
      bin: "gnome-terminal",
      name: "GNOME Terminal",
      args: ["--", "bash", "-c", `cd '${rootDir}' && ${kioskCmd}; exec bash`],
    },
    {
      bin: "konsole",
      name: "Konsole",
      args: ["-e", "bash", "-c", `cd '${rootDir}' && ${kioskCmd}; exec bash`],
    },
    {
      bin: "xfce4-terminal",
      name: "XFCE Terminal",
      args: ["-e", `bash -c "cd '${rootDir}' && ${kioskCmd}; exec bash"`],
    },
    {
      bin: "alacritty",
      name: "Alacritty",
      args: ["-e", "bash", "-c", `cd '${rootDir}' && ${kioskCmd}; exec bash`],
    },
    {
      bin: "kitty",
      name: "Kitty",
      args: ["bash", "-c", `cd '${rootDir}' && ${kioskCmd}; exec bash`],
    },
    {
      bin: "xterm",
      name: "xterm",
      args: ["-e", `bash -c "cd '${rootDir}' && ${kioskCmd}; exec bash"`],
    },
  ];

  for (const term of linuxTerminals) {
    if (spawnSync("which", [term.bin], { stdio: "ignore" }).status === 0) {
      logOpening(term.name);
      spawn(term.bin, term.args, { detached: true, stdio: "ignore" }).unref();
      return;
    }
  }

  console.error(
    c.red(
      "❌ No supported Linux terminal emulator found (x-terminal-emulator, gnome-terminal, konsole, etc.).",
    ),
  );
  console.error(
    c.yellow("   Please run `pnpm -F kiosk dev` manually in another terminal."),
  );
  process.exit(1);
}

openKioskTerminal();

// 3. Start remaining 4 apps in the current terminal via Turbo
console.log(
  c.boldGreen(
    "📦 Starting backend, guest, self-checkin, and table-order with Turbo...\n",
  ),
);

const turboFilters = [
  "dev",
  "--filter=backend",
  "--filter=guest",
  "--filter=self-checkin",
  "--filter=table-order",
];

let child;
try {
  const require = createRequire(import.meta.url);
  const turboBin = require.resolve("turbo");
  child = spawn(process.execPath, [turboBin, ...turboFilters], {
    cwd: rootDir,
    stdio: "inherit",
  });
} catch {
  child = spawn(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "turbo", ...turboFilters],
    {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
}

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    if (child && !child.killed) {
      child.kill(sig);
    }
  });
}
