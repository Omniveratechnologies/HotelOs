export interface PrinterInfo {
  name: string;
  displayName?: string;
  description?: string;
  status?: number;
  isDefault: boolean;
}

export interface PrintOptions {
  silent?: boolean;
  printBackground?: boolean;
  deviceName?: string;
  copies?: number;
  margins?: {
    marginType?: "default" | "none" | "printableArea" | "custom";
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  pageSize?: string | { width: number; height: number };
}

export interface UsbDeviceInfo {
  vendorId: string;
  productId: string;
  name: string;
  manufacturer?: string;
  serialNumber?: string;
}

export interface DownloadOptions {
  url?: string;
  data?: string | Uint8Array;
  filename: string;
  mimeType?: string;
  promptSaveAs?: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  osVersion: string;
  electronVersion?: string;
  appVersion: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
}

export interface DesktopAPI {
  platform: "electron";
  isDesktop: true;
  isWeb: false;
  printer: {
    getPrinters(): Promise<PrinterInfo[]>;
    print(
      options?: PrintOptions,
    ): Promise<{ success: boolean; failureReason?: string }>;
    printRaw(printerName: string, data: string | Uint8Array): Promise<boolean>;
  };
  hardware: {
    listUsbDevices(): Promise<UsbDeviceInfo[]>;
  };
  file: {
    downloadFile(options: DownloadOptions): Promise<boolean>;
    openFile(
      filters?: { name: string; extensions: string[] }[],
    ): Promise<string | null>;
  };
  window: {
    keepAwake(enable: boolean): Promise<boolean>;
    setFullScreen(enable: boolean): Promise<boolean>;
  };
  notification: {
    showNotification(options: NotificationOptions): Promise<boolean>;
  };
  system: {
    getInfo(): Promise<SystemInfo>;
    getVersion(): Promise<string>;
    openExternal(url: string): Promise<boolean>;
  };
  // Legacy compatibility helpers
  print(): Promise<void>;
  openExternal(url: string): Promise<boolean>;
  openFile(): Promise<string | null>;
  getAppVersion(): Promise<string>;
}

export interface PlatformAPI {
  platform: "web" | "electron";
  isDesktop: boolean;
  isWeb: boolean;
  printer: {
    getPrinters(): Promise<PrinterInfo[]>;
    print(
      options?: PrintOptions,
    ): Promise<{ success: boolean; failureReason?: string }>;
    printRaw(printerName: string, data: string | Uint8Array): Promise<boolean>;
  };
  hardware: {
    listUsbDevices(): Promise<UsbDeviceInfo[]>;
  };
  file: {
    downloadFile(options: DownloadOptions): Promise<boolean>;
    openFile(
      filters?: { name: string; extensions: string[] }[],
    ): Promise<string | null>;
  };
  window: {
    keepAwake(enable: boolean): Promise<boolean>;
    setFullScreen(enable: boolean): Promise<boolean>;
  };
  notification: {
    showNotification(options: NotificationOptions): Promise<boolean>;
  };
  system: {
    getInfo(): Promise<SystemInfo>;
    getVersion(): Promise<string>;
    openExternal(url: string): Promise<boolean>;
  };
  // Legacy compatibility helpers
  print(): Promise<void>;
  openExternal(url: string): Promise<boolean>;
  openFile(): Promise<string | null>;
  getAppVersion(): Promise<string>;
}
