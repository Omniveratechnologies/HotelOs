# HotelOS Kiosk — Standalone Android Touchscreen Kiosk

Enterprise Android touchscreen kiosk application for HotelOS. Built on Expo SDK 54+ and Kotlin native modules, the app enforces escape-proof hardware lockdown through Android **Device Owner + Lock Task Mode**, boot receivers, and dynamic dashboard webviews.

All native Android capabilities are managed through **Expo Modules** and **Expo Config Plugins** (`plugins/`), ensuring reproducible native builds via `expo prebuild`.

---

## Documentation

- **[Development & Testing Guide](./docs/DEVELOPMENT.md)** — Step-by-step instructions for running on Android Studio emulators or physical devices via USB, ADB Device Owner provisioning, pairing, and feature testing.
- **[Production Deployment Guide](./docs/PRODUCTION.md)** — How to generate release keystores, build signed production APKs, sideload onto dedicated tablets, and manage live hardware.

---

## Architectural Highlights

1. **One-Time Physical Pairing**:
   - The technician enters the HotelOS Server URL and a 6-digit pairing code issued from the **Super Admin** dashboard once.
   - The device authenticates, receives a long-lived JWT token (`role: "KIOSK"`), stores its credentials in secure storage, and enters full-screen Lock Task mode.
   - The tablet never requires manual reconfiguration again.

2. **Centralized Fleet Control (Super Admin)**:
   - Full lifecycle management from `apps/super-admin` (`/kiosks`).
   - Reassign terminals between hotels with one click.
   - Switch target dashboard modes: `GUEST_CHECKIN`, `TABLE_ORDER`, `RECEPTIONIST_EXPRESS`, `CUSTOM_URL`, or `DEMO_PORTAL`.
   - Real-time remote controls: **Reload** WebView and **Exit Kiosk** mode over WebSocket.

3. **Front-Desk Maintenance Mode (Receptionist)**:
   - Front-desk staff can monitor terminal health (Online/Offline presence, battery level).
   - 1-click **Turn On Maintenance** / **Turn Off Maintenance** toggles maintenance mode.
   - The tablet immediately displays a guest-friendly maintenance notice directing guests to the concierge desk.

4. **Instant Offline-to-Online Synchronization**:
   - When a tablet is offline and an administrator updates its configuration or maintenance mode, the backend immediately pushes `device:config-updated` the instant the tablet reconnects over WebSocket.
   - The tablet reflects the latest status within milliseconds without waiting for periodic polling intervals.

5. **In-App WebView Back Navigation & Domain Security**:
   - Hardware back button navigates backwards through web history inside the WebView, stopping safely at the assigned dashboard landing page.
   - Native security boundary (`onShouldStartLoadWithRequest`) enforces same-site domain isolation, blocking all third-party external URLs or malicious redirects.

---

## Project Structure

```text
apps/kiosk/
├── docs/                       # DEVELOPMENT.md, PRODUCTION.md step-by-step guides
├── app/                        # Expo Router routes
│   ├── _layout.tsx             # Hardware back button swallow in kiosk mode
│   ├── index.tsx               # Entry home screen (Pairing or Kiosk redirect)
│   ├── pairing.tsx             # One-time setup pairing screen
│   └── kiosk.tsx               # Kiosk WebView & full-screen status notices
├── src/
│   ├── components/             # DeviceInfoCard
│   ├── screens/                # HomeScreen, PairingScreen, KioskScreen
│   ├── hooks/                  # useDeviceInfo, useKioskMode, useHeartbeat, useSocketCommands
│   ├── services/               # kioskApi, heartbeatService, socketService
│   ├── lib/                    # storage (AsyncStorage), urlSecurity (same-site validation)
│   └── types/                  # Shared TypeScript types
├── plugins/                    # Expo Config Plugins (Manifest permissions, Boot receiver, Device Admin)
├── modules/
│   └── kiosk-manager/          # Kotlin Expo Native Module (LockTask, BootReceiver, DeviceAdmin)
├── app.config.ts               # Dynamic Expo config (dev vs production variant)
├── package.json
└── tsconfig.json
```

---

## Quick Start

```bash
# 1. Set environment variables
cp .env.example .env

# 2. Generate native Android project
pnpm prebuild

# 3. Launch debug build on connected Android emulator or device
pnpm android
```

Follow the detailed step-by-step instructions in **[`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)** to provision Device Owner and complete activation.
