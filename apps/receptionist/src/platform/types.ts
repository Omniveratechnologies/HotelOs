export interface PlatformAPI {
  platform: "web" | "electron";
  isDesktop: boolean;
  print(): Promise<void>;
  openExternal(url: string): Promise<boolean>;
  openFile(): Promise<string | null>;
  getAppVersion(): Promise<string>;
}
