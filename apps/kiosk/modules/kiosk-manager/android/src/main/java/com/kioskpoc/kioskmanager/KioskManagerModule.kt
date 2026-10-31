package com.kioskpoc.kioskmanager

import android.Manifest
import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.media.MediaDrm
import android.os.Build
import android.view.View
import android.view.WindowManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest

/**
 * KioskManagerModule
 *
 * Native Android half of the "kiosk-manager" Expo Module. Exposes kiosk
 * lifecycle controls to JavaScript via expo-modules-core's Promise-based
 * bridge:
 *
 *   - startKioskMode()      -> enters Android "Lock Task Mode"
 *   - stopKioskMode()       -> exits Lock Task Mode
 *   - isKioskModeEnabled()  -> reports current lock task state
 *   - isDeviceOwner()       -> true when escape-proof lock task is available
 *   - getDeviceId()         -> returns a stable, hardware-derived device id
 *
 * Kiosk mode requires this app to be provisioned as **Device Owner**. There
 * is no screen-pinning fallback: if the app is not Device Owner,
 * startKioskMode() fails with a clear error instead of silently degrading to
 * the escapable screen-pinning behavior.
 *
 * When Device Owner, startKioskMode():
 *   - setLockTaskPackages() so startLockTask() is dialog-free and the
 *     package is always allowed
 *   - setLockTaskFeatures(LOCK_TASK_FEATURE_NONE) so Home, Recents, the
 *     notification shade, global actions and the keyguard are all disabled,
 *     and the "Back + Recents" escape hatch is removed
 *   - setStatusBarDisabled() to fully take over the status bar
 *   - addPersistentPreferredActivity() to make this app the HOME app
 */
class KioskManagerModuleException(message: String) : CodedException(message)

class KioskManagerModule : Module() {
  private val prefs: SharedPreferences
    get() = appContext.reactContext!!.getSharedPreferences(
      "kiosk_manager_prefs",
      Context.MODE_PRIVATE
    )

  private val reactContext: Context
    get() = appContext.reactContext!!

  private val devicePolicyManager: DevicePolicyManager?
    get() = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE)
      as? DevicePolicyManager

  /** ComponentName of our DeviceAdminReceiver, used as the DPM admin. */
  private val adminComponent: ComponentName
    get() = ComponentName(reactContext.packageName, KioskDeviceAdminReceiver::class.java.name)

  override fun definition() = ModuleDefinition {
    // Name JS uses with requireNativeModule("KioskManager").
    Name("KioskManager")

    AsyncFunction("startKioskMode") { promise: expo.modules.kotlin.Promise ->
      val activity = appContext.currentActivity
        ?: return@AsyncFunction promise.reject(
          KioskManagerModuleException("No current activity to pin.")
        )

      activity.runOnUiThread {
        try {
          applyDeviceOwnerPolicyOrThrow()
          if (!isLockTaskActive(activity)) {
            activity.startLockTask()
          }
          applyImmersiveMode(activity)
          // Remember that the app *wants* to be locked so we can re-apply
          // the lockdown if it ever briefly loses foreground lock task state.
          prefs.edit().putBoolean(KEY_KIOSK_EXPECTED, true).apply()
          promise.resolve(true)
        } catch (t: KioskManagerModuleException) {
          promise.reject(t)
        } catch (t: Throwable) {
          promise.reject(KioskManagerModuleException("startLockTask failed: ${t.message}"))
        }
      }
    }

    AsyncFunction("stopKioskMode") { promise: expo.modules.kotlin.Promise ->
      val activity = appContext.currentActivity
        ?: return@AsyncFunction promise.reject(
          KioskManagerModuleException("No current activity to unpin.")
        )

      activity.runOnUiThread {
        prefs.edit().putBoolean(KEY_KIOSK_EXPECTED, false).apply()
        try {
          activity.stopLockTask()
          restoreSystemBars(activity)
          promise.resolve(true)
        } catch (t: Throwable) {
          // stopLockTask() throws if the task isn't currently locked — treat
          // that as "already stopped" rather than a hard failure.
          restoreSystemBars(activity)
          promise.resolve(false)
        }
      }
    }

    AsyncFunction("isKioskModeEnabled") { promise: expo.modules.kotlin.Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      promise.resolve(isLockTaskActive(activity))
    }

    AsyncFunction("isDeviceOwner") { promise: expo.modules.kotlin.Promise ->
      promise.resolve(isDeviceOwnerApp())
    }

    // One-shot read-and-clear of the flag BootReceiver puts on the launch
    // Intent. Clearing it prevents a later return to Home (after an admin
    // exit) from immediately bouncing back into kiosk mode.
    AsyncFunction("consumeLaunchedFromBoot") { promise: expo.modules.kotlin.Promise ->
      val intent = appContext.currentActivity?.intent
      val fromBoot = intent?.getBooleanExtra(EXTRA_LAUNCHED_FROM_BOOT, false) ?: false
      intent?.removeExtra(EXTRA_LAUNCHED_FROM_BOOT)
      promise.resolve(fromBoot)
    }

    AsyncFunction("getDeviceId") { promise: expo.modules.kotlin.Promise ->
      promise.resolve(getOrCreateDeviceId())
    }

    // Resilience: whenever the app returns to the foreground while the JS
    // layer expects kiosk mode to be active, re-assert lock task (device
    // owner path is dialog-free) and immersive mode. This catches cases
    // where an OEM skin or a system dialog temporarily dropped the lock.
    OnActivityEntersForeground {
      val activity = appContext.currentActivity ?: return@OnActivityEntersForeground
      val expected = prefs.getBoolean(KEY_KIOSK_EXPECTED, false)
      // Never attempt to re-lock (or pin) unless we are Device Owner.
      if (!expected || !isDeviceOwnerApp()) return@OnActivityEntersForeground

      activity.runOnUiThread {
        try {
          if (!isLockTaskActive(activity)) {
            applyDeviceOwnerPolicyOrThrow()
            activity.startLockTask()
          }
          applyImmersiveMode(activity)
        } catch (_: Throwable) {
          // Best-effort only; never crash the app on re-lock attempts.
        }
      }
    }
  }

  /** True when this Activity is currently in Android Lock Task Mode. */
  private fun isLockTaskActive(activity: Activity): Boolean {
    val activityManager =
      activity.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
    return activityManager.lockTaskModeState != android.app.ActivityManager.LOCK_TASK_MODE_NONE
  }

  /** True when this app is provisioned as the device's Device Owner. */
  private fun isDeviceOwnerApp(): Boolean =
    devicePolicyManager?.isDeviceOwnerApp(reactContext.packageName) ?: false

  /**
   * Applies the device-owner lockdown policy, or throws if this app is not
   * Device Owner. There is intentionally NO screen-pinning fallback: a device
   * that has not been provisioned must not be allowed to masquerade as a
   * kiosk.
   */
  private fun applyDeviceOwnerPolicyOrThrow() {
    val dpm = devicePolicyManager
      ?: throw KioskManagerModuleException("Device policy service unavailable.")

    val pkg = reactContext.packageName
    if (!dpm.isDeviceOwnerApp(pkg)) {
      throw KioskManagerModuleException(
        "Kiosk mode requires this app to be provisioned as Device Owner. " +
          "Run: adb shell dpm set-device-owner $pkg/" +
          KioskDeviceAdminReceiver::class.java.name
      )
    }

    // Allow (and keep) our own package in lock task mode.
    dpm.setLockTaskPackages(adminComponent, arrayOf(pkg))

    // API 28+: turn off every lock task feature so Home / Recents /
    // notifications / global actions / keyguard are all unavailable and
    // the Back+Recents escape is not offered.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      dpm.setLockTaskFeatures(adminComponent, DevicePolicyManager.LOCK_TASK_FEATURE_NONE)
    }

    // API 23+: take over the status bar entirely.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      dpm.setStatusBarDisabled(adminComponent, true)
    }

    // Make this app the persistent HOME app so Home always returns here.
    makePersistentHome(dpm)
  }

  /**
   * Registers our launch activity as the device's persistent preferred HOME
   * activity. Device-owner only; no-op / swallowed otherwise.
   */
  private fun makePersistentHome(dpm: DevicePolicyManager) {
    val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)
      ?: return
    val component = launchIntent.component ?: return
    val filter = IntentFilter(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
      addCategory(Intent.CATEGORY_DEFAULT)
    }
    dpm.addPersistentPreferredActivity(adminComponent, filter, component)
  }

  /**
   * Hides the status and navigation bars using immersive-sticky flags. In
   * full lock task mode the system already blocks these; this also keeps the
   * WebView edge-to-edge and re-asserts the bars stay hidden.
   */
  private fun applyImmersiveMode(activity: Activity) {
    activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    @Suppress("DEPRECATION")
    activity.window.decorView.systemUiVisibility = (
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
        or View.SYSTEM_UI_FLAG_FULLSCREEN
        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      )
  }

  private fun restoreSystemBars(activity: Activity) {
    activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    @Suppress("DEPRECATION")
    activity.window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
  }

  /**
   * Resolves the device's stable identifier, e.g. "KIOSK-3F9A2C1D".
   *
   * The seed is taken from hardware so the value is the SAME after a factory
   * reset or a reinstall — unlike Settings.Secure.ANDROID_ID (reset-scoped) or
   * a random value. Order of preference:
   *
   *   1. the device serial number — needs READ_PHONE_STATE, which we hold
   *      because this app is the Device Owner (see ensureReadPhoneStateGranted)
   *   2. the Widevine/MediaDrm "deviceUniqueId" — TEE-backed, no permission
   *   3. a persisted random UUID — last resort, the only case that is not
   *      stable across a factory reset
   *
   * The seed is hashed to a uniform, human-scannable id rather than being used
   * raw, so the output shape never depends on which source won.
   */
  private fun getOrCreateDeviceId(): String {
    val seed = readSerialNumber() ?: readWidevineDeviceId()
    if (seed != null) return formatDeviceId(seed)

    // No serial and no Widevine: keep a stable id for this install.
    prefs.getString(KEY_DEVICE_ID, null)?.let { return it }
    val random = formatDeviceId(java.util.UUID.randomUUID().toString())
    prefs.edit().putString(KEY_DEVICE_ID, random).apply()
    return random
  }

  private fun formatDeviceId(seed: String): String =
    "KIOSK-" + sha256Hex(seed).take(8).uppercase()

  /**
   * The hardware serial number. On Android 10+ this needs only
   * READ_PHONE_STATE when the caller is the device/profile owner (otherwise
   * it needs the privileged READ_PRIVILEGED_PHONE_STATE). Returns null when it
   * isn't available so the caller can fall back.
   */
  private fun readSerialNumber(): String? {
    ensureReadPhoneStateGranted()
    return try {
      @Suppress("DEPRECATION")
      val serial = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Build.getSerial()
      } else {
        Build.SERIAL
      }
      serial?.takeIf { it.isNotBlank() && !it.equals("unknown", ignoreCase = true) }
    } catch (_: SecurityException) {
      null
    } catch (_: Throwable) {
      null
    }
  }

  /**
   * Grants READ_PHONE_STATE to ourselves while we are Device Owner, so
   * Build.getSerial() works with no user-visible permission prompt. It is
   * re-applied on every fresh install (and therefore after a factory reset),
   * because the app is provisioned as Device Owner before its first launch.
   * No-op when we are not Device Owner; the documented
   * `adb shell pm grant … READ_PHONE_STATE` is the fallback there.
   */
  private fun ensureReadPhoneStateGranted() {
    val dpm = devicePolicyManager ?: return
    val pkg = reactContext.packageName
    if (!dpm.isDeviceOwnerApp(pkg)) return
    try {
      dpm.setPermissionGrantState(
        adminComponent,
        pkg,
        Manifest.permission.READ_PHONE_STATE,
        DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
      )
    } catch (_: Throwable) {
      // Best-effort only — never block id resolution on this.
    }
  }

  /**
   * Widevine/MediaDrm device-unique id: a TEE-backed value that stays the same
   * across app reinstall and factory reset and needs no permission. Returns
   * null on devices without a Widevine DRM plugin.
   */
  private fun readWidevineDeviceId(): String? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR2) return null
    return try {
      val drm = MediaDrm(WIDEVINE_UUID)
      try {
        drm.getPropertyByteArray(MediaDrm.PROPERTY_DEVICE_UNIQUE_ID)
          ?.takeIf { it.isNotEmpty() }
          ?.joinToString("") { "%02x".format(it.toInt() and 0xFF) }
      } finally {
        drm.release()
      }
    } catch (_: Throwable) {
      null
    }
  }

  private fun sha256Hex(input: String): String =
    MessageDigest.getInstance("SHA-256")
      .digest(input.toByteArray(Charsets.UTF_8))
      .joinToString("") { "%02x".format(it.toInt() and 0xFF) }

  companion object {
    private const val KEY_DEVICE_ID = "device_id"
    private const val KEY_KIOSK_EXPECTED = "kiosk_expected"
    private const val EXTRA_LAUNCHED_FROM_BOOT = "launchedFromBoot"

    /**
     * Widevine DRM scheme UUID. android.media.MediaDrm has no public constant
     * for it, so it is spelled out here (this value is fixed by the spec).
     */
    private val WIDEVINE_UUID: java.util.UUID =
      java.util.UUID.fromString("edef8ba9-79d6-4ace-a3c8-27dcd51d21ed")
  }
}
