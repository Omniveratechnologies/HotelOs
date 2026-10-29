declare module "@hotelos/utils";

interface HotelOSKioskBridge {
  readonly isKiosk: true;
  readonly platform: "hotelos";
  readonly version: string;
}

interface Window {
  kiosk?: HotelOSKioskBridge;
}
