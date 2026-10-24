# Kiosk Development & Testing Guide

This guide walks you through running, provisioning, and testing the **HotelOS Android Kiosk** on an Android Studio emulator (AVD) or a physical tablet connected via USB.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:

| Requirement                    | Details                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **JDK 17**                     | Bundled with Android Studio or standalone (set as `JAVA_HOME`)                                                                            |
| **Android Studio**             | Latest version with **Android SDK Platform-Tools**, **Build-Tools**, **NDK (Side by side)**, and **CMake** installed via SDK Manager      |
| **ADB on PATH**                | Ensure `adb` is accessible in your terminal (`%ANDROID_HOME%\platform-tools` on Windows or `$ANDROID_HOME/platform-tools` on macOS/Linux) |
| **Android Device or Emulator** | A virtual device (AVD) or a physical Android tablet connected over USB                                                                    |

> [!IMPORTANT]
> If using an emulator, create an AVD with a **"Google APIs"** system image (Android 11–14). Avoid "Google Play" images because pre-signed Google accounts prevent setting Device Owner.

---

## 2. Step-by-Step Setup

### Step 1: Configure Environment Variables

Create `.env` in `apps/kiosk/`:

```bash
# In apps/kiosk/
cp .env.example .env
```

Configure `EXPO_PUBLIC_API_URL` based on your testing environment:

```ini
# Android Studio Emulator (10.0.2.2 points to host machine localhost)
EXPO_PUBLIC_API_URL=http://10.0.2.2:5001

# Physical Tablet over Wi-Fi (replace with your computer's local LAN IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.50:5001
```

---

### Step 2: Generate Native Android Project & Run

Generate the native Android project and compile the debug development build onto your connected emulator or device:

```bash
# Generate the native android project (runs expo prebuild)
pnpm prebuild

# Build native Kotlin module and install debug APK onto device
pnpm android
```

> [!NOTE]
> The `android/` directory is fully managed by Expo Config Plugins in `plugins/` and `modules/kiosk-manager/`. Never edit files in `android/` directly because `pnpm prebuild` will overwrite them.

---

### Step 3: Provision Device Owner via ADB

The app uses Android's enterprise **Device Owner + Lock Task Mode** for an escape-proof kiosk lockdown. Run this command once in your terminal while your device or emulator is connected:

```bash
adb shell dpm set-device-owner com.kioskpoc.app/com.kioskpoc.kioskmanager.KioskDeviceAdminReceiver
```

**Expected output:**

```text
Success: Device owner set to package ComponentInfo{com.kioskpoc.app/com.kioskpoc.kioskmanager.KioskDeviceAdminReceiver}
Active admin set to component ...
```

> [!TIP]
> If ADB returns _"Not allowed to set the device owner because there are already some accounts on the device"_, wipe the emulator data in Android Studio Device Manager (**Device Manager → Right Click AVD → Wipe Data**) or factory-reset the physical tablet, and re-run the command before signing in to any accounts.

---

### Step 4: Pair with HotelOS Backend

1. Start your HotelOS backend (`pnpm --filter backend dev`) and Super Admin dashboard (`pnpm --filter super-admin dev`).
2. In your browser, open the Super Admin dashboard at `http://localhost:5173/kiosks`.
3. Click **Register Terminal**:
   - Provide a device name (e.g. _Lobby Touchscreen 1_).
   - Select the assigned hotel.
   - Choose a target dashboard (e.g. _Interactive Demo_, _Guest Check-in_, or _Custom Web_).
   - Click **Register & Generate Pair Code** and copy the **6-digit pairing code** (e.g., `839201`).
4. On the tablet, open the **HotelOS Kiosk** app:
   - Enter your HotelOS server URL (e.g. `http://10.0.2.2:5001`).
   - Enter the 6-digit pairing code.
   - Tap **Pair & Activate Terminal**.
5. The device authenticates with the backend, receives a long-lived JWT token (`role: "KIOSK"`), saves credentials in secure storage, and automatically locks into the assigned dashboard.

---

## 3. Testing Features & Behaviors

Once paired, you can verify the following features:

### 1. Hardware Back Button Navigation

- When navigating links inside the loaded dashboard, pressing the tablet's hardware **Back Button** steps backward through your browsing history.
- Once you reach the initial assigned dashboard URL, subsequent back button presses are safely swallowed, preventing guests from exiting the app or reaching an empty state.

### 2. Strict Domain & Same-Site Security

- Guests cannot navigate away to third-party websites. Any external URL redirects or link clicks that do not match the assigned site domain are blocked by the native security boundary (`onShouldStartLoadWithRequest`).

### 3. Maintenance Mode Notice

- Open the Receptionist dashboard (`http://localhost:5175/kiosks`) or Super Admin (`http://localhost:5173/kiosks`).
- Click **Turn On Maintenance**:
  - The tablet immediately transitions to a full-screen, guest-friendly maintenance notice advising guests to visit the front desk concierge.
- Click **Turn Off Maintenance**:
  - The maintenance notice disappears and normal kiosk operations resume immediately.

### 4. Instant Offline-to-Online Sync

- Disconnect Wi-Fi on the tablet (or toggle Airplane mode). The dashboard marks the terminal as **Offline**.
- While the tablet is offline, toggle **Turn On Maintenance** in the Super Admin or Receptionist dashboard.
- Reconnect Wi-Fi on the tablet:
  - The tablet reconnects to the backend WebSocket and immediately receives `device:config-updated`.
  - The tablet displays the full-screen maintenance message within milliseconds without waiting for periodic polling.

### 5. Remote Super Admin Controls

- In Super Admin (`/kiosks`), find the tablet's card:
  - **Reload**: Dispatches `device:reload` over WebSocket to refresh the WebView.
  - **Exit Kiosk**: Dispatches `device:exit-kiosk` to unlock Android Lock Task mode and return the device to the technician setup screen.

---

## 4. Useful ADB Commands

| Task                           | Command                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **List connected devices**     | `adb devices`                                                                                                   |
| **Check Device Owner status**  | `adb shell dumpsys device_policy \| grep -i owner`                                                              |
| **Check Lock Task status**     | `adb shell dumpsys activity activities \| grep -i locktask`                                                     |
| **Test boot auto-start**       | `adb reboot` (tablet automatically relaunches kiosk upon booting)                                               |
| **Launch app manually**        | `adb shell am start -n com.kioskpoc.app/.MainActivity`                                                          |
| **Stream kiosk logs**          | `adb logcat \| grep -i "kiosk\|ReactNative"` (or `findstr` on Windows)                                          |
| **Inspect WebView via Chrome** | Navigate to `chrome://inspect/#devices` in Google Chrome to inspect the live DOM, console, and network requests |
