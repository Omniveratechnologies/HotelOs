package com.kioskpoc.kioskmanager

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * BootReceiver
 *
 * Listens for android.intent.action.BOOT_COMPLETED and relaunches the
 * kiosk app so an unattended device comes back into kiosk mode after a
 * power cycle without anyone touching it.
 *
 * Registration (intent-filter + <receiver> element + the
 * RECEIVE_BOOT_COMPLETED permission) is added entirely by
 * plugins/withBootReceiver.ts — this class is never referenced from a
 * manually-edited AndroidManifest.xml.
 *
 * Actual "resume kiosk mode" logic (checking pairing state, deciding
 * whether autoStartKiosk is on) lives in JS — see src/hooks/useKioskMode.ts
 * and src/lib/storage — this receiver's only native job is getting the
 * Activity back on screen; JS picks up from there on mount.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

    val launchIntent = Intent(context, resolveMainActivityClass(context)).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or
        Intent.FLAG_ACTIVITY_CLEAR_TOP or
        Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
      putExtra("launchedFromBoot", true)
    }

    try {
      context.startActivity(launchIntent)
    } catch (t: Throwable) {
      // On some OEM skins, starting an Activity directly from a
      // BOOT_COMPLETED receiver is restricted. A production build would
      // fall back to a foreground Service + notification here; omitted in
      // this POC for brevity.
    }
  }

  /**
   * Resolves the app's launch activity by package manager lookup instead of
   * hardcoding a class name, so this receiver keeps working regardless of
   * the host app's package (com.kioskpoc.app in app.config.ts, but configurable).
   */
  private fun resolveMainActivityClass(context: Context): Class<*> {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val className = launchIntent?.component?.className
      ?: throw IllegalStateException("No launch activity found for ${context.packageName}")
    return Class.forName(className)
  }
}
