/**
 * Config plugin entry point for the kiosk-manager Expo Module.
 *
 * Autolinking already picks up the native Kotlin code under android/ because
 * of expo-module.config.json — this plugin only needs to add the Android
 * manifest pieces the module's *runtime behavior* depends on (permissions
 * used by startKioskMode/stopKioskMode via Android's Lock Task / Device
 * Policy APIs). Everything here is applied through @expo/config-plugins
 * mods, never by hand-editing android/app/src/main/AndroidManifest.xml.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

const KIOSK_PERMISSIONS = [
  "android.permission.REORDER_TASKS",
  "android.permission.DISABLE_KEYGUARD",
  "android.permission.WAKE_LOCK",
];

/**
 * Idempotently ensures each permission in KIOSK_PERMISSIONS exists as a
 * <uses-permission> entry in the merged manifest object that
 * @expo/config-plugins hands us (parsed via xml2js — NOT raw XML text).
 * Manipulating this object, rather than the generated android/app/src/main
 * /AndroidManifest.xml file on disk, is what keeps this "no manual edits".
 */
function withKioskManagerPermissions(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    manifest["uses-permission"] = manifest["uses-permission"] || [];

    const existing = new Set(
      manifest["uses-permission"].map((p) => p.$["android:name"]),
    );

    for (const permission of KIOSK_PERMISSIONS) {
      if (!existing.has(permission)) {
        manifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    }

    return config;
  });
}

module.exports = withKioskManagerPermissions;
