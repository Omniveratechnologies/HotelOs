import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { UsbDeviceInfo } from "../../types/index.ts";

const execAsync = promisify(exec);

async function listWindowsUsbDevices(): Promise<UsbDeviceInfo[]> {
  try {
    const command =
      "powershell -NoProfile -Command \"Get-CimInstance Win32_PnPEntity | Where-Object { $_.DeviceID -like 'USB*' } | Select-Object -Property DeviceID, Name, Manufacturer, Description | ConvertTo-Json\"";
    const { stdout } = await execAsync(command, { timeout: 4000 });
    if (!stdout.trim()) return [];

    const parsed = JSON.parse(stdout);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    return items
      .filter((item) => Boolean(item && item.DeviceID))
      .map((item) => {
        const matchVid = /VID_([0-9A-Fa-f]{4})/.exec(item.DeviceID || "");
        const matchPid = /PID_([0-9A-Fa-f]{4})/.exec(item.DeviceID || "");
        return {
          vendorId: matchVid ? `0x${matchVid[1]}` : "0x0000",
          productId: matchPid ? `0x${matchPid[1]}` : "0x0000",
          name: item.Name || item.Description || "USB Device",
          manufacturer: item.Manufacturer || undefined,
        };
      });
  } catch {
    return [];
  }
}

async function listMacUsbDevices(): Promise<UsbDeviceInfo[]> {
  try {
    const { stdout } = await execAsync("system_profiler SPUSBDataType -json", {
      timeout: 4000,
    });
    const data = JSON.parse(stdout);
    const devices: UsbDeviceInfo[] = [];

    const walk = (items: any[]) => {
      for (const item of items) {
        const itemName = item["_name"];
        if (itemName) {
          devices.push({
            vendorId: item.vendor_id || "0x0000",
            productId: item.product_id || "0x0000",
            name: itemName,
            manufacturer: item.manufacturer,
            serialNumber: item.serial_num,
          });
        }
        const childItems = item["_items"];
        if (childItems && Array.isArray(childItems)) {
          walk(childItems);
        }
      }
    };

    if (data?.SPUSBDataType) {
      walk(data.SPUSBDataType);
    }
    return devices;
  } catch {
    return [];
  }
}

async function listLinuxUsbDevices(): Promise<UsbDeviceInfo[]> {
  try {
    const { stdout } = await execAsync("lsusb", { timeout: 4000 });
    const lines = stdout.split("\n").filter(Boolean);
    return lines.map((line) => {
      const parts = line.split("ID ");
      const idPart = parts[1] ? parts[1].split(" ") : [];
      const [vidPid, ...nameParts] = idPart;
      const [vid, pid] = (vidPid || "").split(":");
      return {
        vendorId: vid ? `0x${vid}` : "0x0000",
        productId: pid ? `0x${pid}` : "0x0000",
        name: nameParts.join(" ") || line,
      };
    });
  } catch {
    return [];
  }
}

export const usbService = {
  async listUsbDevices(): Promise<UsbDeviceInfo[]> {
    const platform = process.platform;
    try {
      if (platform === "win32") {
        return await listWindowsUsbDevices();
      } else if (platform === "darwin") {
        return await listMacUsbDevices();
      } else if (platform === "linux") {
        return await listLinuxUsbDevices();
      }
    } catch (error) {
      console.warn("[UsbService] Device enumeration error:", error);
    }
    return [];
  },
};
