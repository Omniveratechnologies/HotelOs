import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

// Color helpers for terminal output
const c = {
  reset: "\x1b[0m",
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  boldCyan: (s) => `\x1b[1m\x1b[36m${s}\x1b[0m`,
  boldGreen: (s) => `\x1b[1m\x1b[32m${s}\x1b[0m`,
};

/**
 * Detect the host LAN IPv4 address.
 */
function detectHostIp() {
  const cliArg = process.argv[2]?.trim();
  if (cliArg) {
    if (!IPV4_REGEX.test(cliArg)) {
      console.error(c.red(`Invalid IP address provided: "${cliArg}"`));
      process.exit(1);
    }
    console.log(c.cyan(`Using manually provided IP: ${cliArg}`));
    return cliArg;
  }

  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    for (const net of nets) {
      const isIpv4 = net.family === "IPv4" || net.family === 4;
      if (!isIpv4 || net.internal || net.address.startsWith("127.")) {
        continue;
      }

      const isVirtual =
        /vethernet|hyper-v|virtualbox|vmware|wsl|docker|tailscale|zerotier|loopback/i.test(
          name,
        );

      candidates.push({
        name,
        address: net.address,
        isVirtual,
        isPriority: /wi-fi|wifi|ethernet|eth|wlan|en/i.test(name),
      });
    }
  }

  // Prioritize physical Wi-Fi / Ethernet adapters
  candidates.sort((a, b) => {
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    if (a.isVirtual !== b.isVirtual) return a.isVirtual ? 1 : -1;
    return 0;
  });

  if (candidates.length > 0) {
    const selected = candidates[0];
    console.log(
      c.cyan(
        `Detected LAN IP: ${c.bold(selected.address)} on interface "${selected.name}"`,
      ),
    );
    return selected.address;
  }

  console.warn(
    c.yellow(
      "Could not detect active physical LAN interface. Defaulting to 127.0.0.1",
    ),
  );
  return "127.0.0.1";
}

/**
 * Safely update or append key-value pairs in a .env file.
 */
function updateEnvFile(relativeFilePath, updates, keysToRemove = []) {
  const absolutePath = path.resolve(rootDir, relativeFilePath);
  let content = "";
  if (fs.existsSync(absolutePath)) {
    content = fs.readFileSync(absolutePath, "utf8");
  }

  for (const key of keysToRemove) {
    const removeRegex = new RegExp(`^${key}=.*$[\r\n]*`, "gm");
    content = content.replace(removeRegex, "");
  }

  for (const [key, value] of Object.entries(updates)) {
    const keyRegex = new RegExp(`^${key}=.*$`, "m");
    if (keyRegex.test(content)) {
      content = content.replace(keyRegex, `${key}=${value}`);
    } else {
      content = content.trimEnd();
      content = content ? `${content}\n${key}=${value}\n` : `${key}=${value}\n`;
    }
  }

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, "utf8");
  console.log(c.green(`  ✔ Updated ${relativeFilePath}`));
}

function main() {
  console.log(c.boldCyan("HotelOS Kiosk LAN IP Synchronization"));
  console.log(c.cyan("========================================"));

  const ip = detectHostIp();

  console.log(c.yellow(`\nSyncing configuration for LAN IP: ${ip}...`));

  // 1. Guest Dashboard
  updateEnvFile("apps/guest/.env", {
    VITE_API_URL: `http://${ip}:5001`,
  });

  // 2. Standalone Self Check-in
  updateEnvFile("apps/self-checkin/.env", {
    VITE_API_URL: `http://${ip}:5001`,
  });

  // 3. Digital Menu / Table Order
  updateEnvFile("apps/table-order/.env", {
    VITE_API_URL: `http://${ip}:5001`,
  });

  // 4. Kiosk Expo Tablet Client
  updateEnvFile("apps/kiosk/.env", {
    EXPO_PUBLIC_API_URL: `http://${ip}:5001`,
    EXPO_PUBLIC_SOCKET_URL: `http://${ip}:5001`,
  });

  // 5. Backend Server
  updateEnvFile(
    "apps/backend/.env",
    {
      GUEST_FRONTEND_URL: `http://${ip}:5177`,
      SELF_CHECKIN_FRONTEND_URL: `http://${ip}:5178`,
      TABLE_ORDER_FRONTEND_URL: `http://${ip}:5179`,
    },
    [
      "KIOSK_GUEST_DASHBOARD_URL",
      "KIOSK_SELF_CHECKIN_URL",
      "KIOSK_DIGITAL_MENU_URL",
    ],
  );

  console.log(c.boldGreen("\nSync completed successfully!"));
  console.log(c.bold("Endpoints summary:"));
  console.log(
    `  ${c.blue("Backend API:")}             ${c.cyan(`http://${ip}:5001`)}`,
  );
  console.log(
    `  ${c.blue("Guest Dashboard:")}         ${c.cyan(`http://${ip}:5177`)}`,
  );
  console.log(
    `  ${c.blue("Self Check-In:")}           ${c.cyan(`http://${ip}:5178`)}`,
  );
  console.log(
    `  ${c.blue("Table Order (Menu):")}      ${c.cyan(`http://${ip}:5179`)}`,
  );
  console.log(
    `  ${c.blue("Kiosk App Target Server:")} ${c.cyan(`http://${ip}:5001`)}\n`,
  );
}

main();
