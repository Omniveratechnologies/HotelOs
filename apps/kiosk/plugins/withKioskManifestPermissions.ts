/**
 * Config Plugin: withKioskManifestPermissions
 *
 * Adds the small set of Android manifest flags that don't belong to any one
 * receiver — locked task / screen behavior flags plus the HOME intent-filter
 * on the launch Activity — so MainActivity supports
 * android:lockTaskMode="if_whitelisted" and can be selected as the device's
 * default launcher, without anyone hand-editing the generated Activity block.
 */
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from "@expo/config-plugins";

interface ManifestNamedItem {
  $?: {
    "android:name"?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

interface ManifestIntentFilter {
  action?: ManifestNamedItem[];
  category?: ManifestNamedItem[];
  [key: string]: unknown;
}

const withKioskManifestPermissions: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      modConfig.modResults,
    );
    application.$["android:usesCleartextTraffic"] = "true";
    const activities = (application.activity || []) as ManifestNamedItem[];
    const mainActivity = activities.find(
      (a) =>
        a.$?.["android:name"] === ".MainActivity" ||
        a.$?.["android:name"]?.endsWith(".MainActivity"),
    );

    if (mainActivity && mainActivity.$) {
      // "if_whitelisted" defers the actual allow-list to
      // DevicePolicyManager#setLockTaskPackages(), set at runtime by
      // KioskManagerModule once the app is provisioned as Device Owner.
      // Kiosk mode requires that provisioning; there is no pinning fallback.
      mainActivity.$["android:lockTaskMode"] = "if_whitelisted";
      mainActivity.$["android:showWhenLocked"] = "true";
      mainActivity.$["android:turnScreenOn"] = "true";

      // Keep the kiosk out of the recents list (when not locked down) so it
      // isn't easy to re-enter / inspect.
      mainActivity.$["android:excludeFromRecents"] = "true";

      // Register as a HOME app so the device can be set to always return to
      // the kiosk. With Device Owner, KioskManagerModule also calls
      // DevicePolicyManager#addPersistentPreferredActivity to force this.
      const intentFilters = (mainActivity["intent-filter"] ||
        []) as ManifestIntentFilter[];
      const hasHomeFilter = intentFilters.some((f) =>
        (f.category || []).some(
          (c) => c.$?.["android:name"] === "android.intent.category.HOME",
        ),
      );
      if (!hasHomeFilter) {
        intentFilters.push({
          action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
          category: [
            { $: { "android:name": "android.intent.category.HOME" } },
            { $: { "android:name": "android.intent.category.DEFAULT" } },
          ],
        });
      }
      mainActivity["intent-filter"] = intentFilters;
    }

    return modConfig;
  });
};

export default withKioskManifestPermissions;
