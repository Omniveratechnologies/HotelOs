package com.kioskpoc.kioskmanager

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.UserManager
import android.widget.Toast

/**
 * KioskDeviceAdminReceiver
 *
 * DeviceAdminReceiver provisioned as Device Owner via:
 * `adb shell dpm set-device-owner com.kioskpoc.app/com.kioskpoc.kioskmanager.KioskDeviceAdminReceiver`
 *
 * Automatically whitelists lock task mode, registers the kiosk as the
 * persistent system HOME launcher, and enforces enterprise kiosk restrictions.
 */
class KioskDeviceAdminReceiver : DeviceAdminReceiver() {
  override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
    super.onProfileProvisioningComplete(context, intent)
    applyInitialProvisioning(context)
  }

  override fun onEnabled(context: Context, intent: Intent) {
    super.onEnabled(context, intent)
    applyInitialProvisioning(context)
    Toast.makeText(context, "HotelOS Kiosk device owner enabled", Toast.LENGTH_SHORT).show()
  }

  override fun onDisabled(context: Context, intent: Intent) {
    super.onDisabled(context, intent)
    Toast.makeText(context, "HotelOS Kiosk device owner disabled", Toast.LENGTH_SHORT).show()
  }

  private fun applyInitialProvisioning(context: Context) {
    val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
      ?: return
    val admin = getWho(context)
    val pkg = context.packageName

    if (!dpm.isDeviceOwnerApp(pkg)) return

    try {
      // 1. Set terminal profile name
      dpm.setProfileName(admin, "HotelOS Kiosk")

      // 2. Whitelist package for lock task
      dpm.setLockTaskPackages(admin, arrayOf(pkg))

      // 3. Turn off all lock task features (no home, no recents, no notifications)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE)
      }

      // 4. Register as default HOME launcher
      dpm.clearPackagePersistentPreferredActivities(admin, pkg)
      val component = ComponentName(pkg, "com.kioskpoc.app.MainActivity")
      val filter = IntentFilter(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_HOME)
        addCategory(Intent.CATEGORY_DEFAULT)
      }
      dpm.addPersistentPreferredActivity(admin, filter, component)

      // 5. Disable keyguard (lockscreen)
      dpm.setKeyguardDisabled(admin, true)

      // 6. User restrictions
      dpm.addUserRestriction(admin, UserManager.DISALLOW_SAFE_BOOT)
      dpm.addUserRestriction(admin, UserManager.DISALLOW_SYSTEM_ERROR_DIALOGS)
      dpm.addUserRestriction(admin, UserManager.DISALLOW_CREATE_WINDOWS)
    } catch (_: Throwable) {
      // Best-effort during provisioning
    }
  }
}
