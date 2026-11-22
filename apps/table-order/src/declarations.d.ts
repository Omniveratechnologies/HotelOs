declare module "@hotelos/utils";

interface HotelOSKioskBridge {
  readonly isKiosk: true;
  readonly platform: "hotelos";
  readonly version: string;
  readonly handoffCode?: string;
  readonly deviceId?: string;
}

interface Window {
  kiosk?: HotelOSKioskBridge;
}
