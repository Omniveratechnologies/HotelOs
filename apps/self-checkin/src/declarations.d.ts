declare module "@hotelos/api";
declare module "@hotelos/ui";
declare module "@hotelos/ui/*";
declare module "@hotelos/utils";
declare module "@hotelos/styles";
declare module "*.css";

interface HotelOSKioskBridge {
  readonly isKiosk: true;
  readonly platform: "hotelos";
  readonly version: string;
}

interface Window {
  kiosk?: HotelOSKioskBridge;
}
