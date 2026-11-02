package com.kioskpoc.kioskmanager

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

/**
 * KioskDeviceAdminReceiver
 *
 * Minimal DeviceAdminReceiver so the app CAN request Device Admin (and, in a
 * full production rollout, be provisioned as Device Owner via
 * `adb shell dpm set-device-owner`) which unlocks:
 *   - setLockTaskPackages() for dialog-free, unremovable kiosk lock task
 *   - disabling the status bar / recents / factory reset from Settings
 *   - remote wipe / lock as a fleet-management safety net
 *
 * This POC only registers the receiver and its policy xml
 * (res/xml/device_admin.xml) via plugins/withDeviceAdmin.ts — it does not
 * walk the user through the "Activate device admin app" system flow or
 * attempt Device Owner provisioning, since that requires either a fresh
 * device or `adb` access and is out of scope for a UI-level demo.
 */
class KioskDeviceAdminReceiver : DeviceAdminReceiver() {
  override fun onEnabled(context: Context, intent: Intent) {
    super.onEnabled(context, intent)
    Toast.makeText(context, "Kiosk device admin enabled", Toast.LENGTH_SHORT).show()
  }

  override fun onDisabled(context: Context, intent: Intent) {
    super.onDisabled(context, intent)
    Toast.makeText(context, "Kiosk device admin disabled", Toast.LENGTH_SHORT).show()
  }
}
