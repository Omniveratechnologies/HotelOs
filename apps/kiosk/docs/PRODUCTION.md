# Production Deployment & Tablet Provisioning Guide

This guide details how to build, sign, and provision the **HotelOS Android Kiosk** onto a dedicated physical tablet for on-site hotel deployment.

---

## 1. Hardware Checklist

Before provisioning a tablet for production:

- **Operating System**: Android 11 or higher (API 30+).
- **Clean State**: Factory-reset the device with **no Google accounts or enterprise MDM enrolled**. Device Owner status can only be established on an account-free device.
- **Developer Options**: Enable **Developer Options** and turn on **USB Debugging**.
- **Orientation**: Tablet mounted in landscape orientation.

---

## 2. Step-by-Step Production Setup

### Step 1: Create a Production Release Keystore

Generate a signing keystore (run this command once and store the file securely outside of git):

```bash
keytool -genkeypair -v -keystore hotelos-kiosk-release.keystore \
  -alias hotelos-kiosk \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass ChangeMe123 -keypass ChangeMe123
```

> [!IMPORTANT]
> Keep the keystore file and passwords safe. Installing future app updates over USB without wiping the device requires the exact same signing key.

---

### Step 2: Configure Release Environment Variables

Set the release signing variables in your shell or CI/CD environment:

```bash
export RELEASE_STORE_FILE="/path/to/hotelos-kiosk-release.keystore"
export RELEASE_STORE_PASSWORD="ChangeMe123"
export RELEASE_KEY_ALIAS="hotelos-kiosk"
export RELEASE_KEY_PASSWORD="ChangeMe123"
export EXPO_PUBLIC_API_URL="https://api.yourhotel.com"
```

---

### Step 3: Build the Production Release APK

1. Generate the native project configured for production:

   ```bash
   APP_VARIANT=production pnpm prebuild
   ```

2. Build the signed release APK using Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   _(On Windows Command Prompt or PowerShell, use `gradlew.bat assembleRelease`)_

The compiled release APK will be generated at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

---

### Step 4: Sideload the APK onto the Physical Tablet

Connect the factory-reset tablet to your computer via USB:

```bash
# Verify connection
adb devices

# Install release APK onto the tablet
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

### Step 5: Provision Device Owner via ADB

Set the HotelOS Kiosk app as the Android **Device Owner** (must be run on a device with zero signed-in accounts):

```bash
adb shell dpm set-device-owner com.kioskpoc.app/com.kioskpoc.kioskmanager.KioskDeviceAdminReceiver
```

**Expected output:**

```text
Success: Device owner set to package ComponentInfo{com.kioskpoc.app/com.kioskpoc.kioskmanager.KioskDeviceAdminReceiver}
Active admin set to component ...
```

Once provisioned:

- Android Lock Task Mode is fully enforced without any screen pinning dialogs.
- System navigation buttons (Home, Recents, Notifications shade) and power menu escape routes are permanently disabled.
- The app registers as the default Android `HOME` launcher.
- The app automatically launches whenever the tablet is powered on or rebooted.

---

### Step 6: One-Time Physical Activation

1. Open the **Super Admin** dashboard (`/kiosks`).
2. Click **Register Terminal**, pick the hotel, and note the generated 6-digit pair code.
3. Open the **HotelOS Kiosk** app on the tablet.
4. Enter the production HotelOS API server URL (e.g. `https://api.yourhotel.com`) and the 6-digit pairing code.
5. Tap **Pair & Activate Terminal**.
6. The tablet receives a persistent JWT token (`role: "KIOSK"`), stores its credentials securely, and automatically transitions into the full-screen kiosk dashboard.

---

## 3. Ongoing Fleet & Terminal Operations

Once deployed, the physical tablet is managed 100% remotely through the HotelOS dashboards:

- **Receptionist Front Desk Control**:
  - Front-desk staff can view the live connection status (Online/Offline) and battery level.
  - Staff can click **Turn On Maintenance** whenever the tablet requires cleaning or physical maintenance. The tablet displays a guest-friendly notice advising guests to approach the concierge.
  - Staff can click **Turn Off Maintenance** to instantly resume guest check-in or ordering operations.
- **Super Admin Central Control**:
  - Super Admin can reassign terminals to different hotels or switch target dashboards (`GUEST_CHECKIN`, `TABLE_ORDER`, `RECEPTIONIST_EXPRESS`, `CUSTOM_URL`, `DEMO_PORTAL`).
  - Super Admin can remotely trigger **Reload** or **Exit Kiosk** over WebSocket.
- **Applying App Updates**:
  - To install an updated APK on a deployed tablet, connect via USB and run `adb install -r <new-apk-path>`. Because the keystore is identical, the APK updates seamlessly without losing Device Owner provisioning.
