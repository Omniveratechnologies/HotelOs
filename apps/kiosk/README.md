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
   - Switch target dashboard modes:
     - `GUEST_DASHBOARD`: Hotel room guest portal (`apps/guest`, port `5177`)
     - `SELF_CHECKIN`: Express guest self check-in wizard (`apps/self-checkin`, port `5178`)
     - `DIGITAL_MENU`: Restaurant dining menu & ordering (`apps/table-order`, port `5179`)
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

6. **True Escape-Proof Lockdown & Persistent Launcher**:
   - Enterprise Android Device Owner provisioning completely blocks the top shutter (notification shade & quick settings via `setStatusBarDisabled`) and disables Home/Recents multitasking (`LOCK_TASK_FEATURE_NONE`).
   - Automatically registers as the persistent default Android `HOME` launcher, preventing app minimization or desktop escape.
   - On restart or reboot, paired terminals boot directly into the active dashboard (`/kiosk`), hiding technical Terminal Info unless Super Admin explicitly dispatches `device:exit-kiosk`.

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
# 1. From monorepo root, run unified interactive development launcher:
# (Auto-syncs local LAN IP, launches Expo in a dedicated interactive terminal, and starts Turborepo)
pnpm dev:kiosk

# 2. Or standalone setup inside apps/kiosk:
cp .env.example .env
pnpm prebuild
pnpm android
```

### Local Network Scripts

- **`pnpm dev:kiosk` (`scripts/dev-kiosk.mjs`)**: Launches Expo in an independent native terminal window (PowerShell / cmd / Terminal) with full interactive keystroke support (`a` to launch Android, `r` to reload), while running all backend and frontend services concurrently in the main console.
- **`pnpm sync:ip` (`scripts/sync-kiosk-ip.mjs`)**: Scans host network interfaces, identifies the active IPv4 Wi-Fi/Ethernet address, and updates `apps/kiosk/.env` along with all frontend `.env` files automatically.

Follow the detailed step-by-step instructions in **[`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)** to provision Device Owner and complete activation.
