/**
 * Config Plugin: withBootReceiver
 *
 * Registers com.kioskpoc.kioskmanager.BootReceiver as a manifest
 * <receiver> listening for BOOT_COMPLETED, and ensures the
 * RECEIVE_BOOT_COMPLETED permission is present. This is the ONLY
 * supported way this project adds native manifest entries — never edit
 * android/app/src/main/AndroidManifest.xml by hand, since `expo prebuild`
 * regenerates that file from scratch and any manual edit would be lost.
 *
 * Usage (see app.config.ts "plugins"):
 *   ["./plugins/withBootReceiver.ts", { "launchActivity": ".MainActivity" }]
 */
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from "@expo/config-plugins";

export interface WithBootReceiverProps {
  /** Reserved for future use — which activity to relaunch on boot. */
  launchActivity?: string;
}

const RECEIVER_NAME = "com.kioskpoc.kioskmanager.BootReceiver";
const PERMISSION = "android.permission.RECEIVE_BOOT_COMPLETED";

interface ManifestNamedItem {
  $?: {
    "android:name"?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

const withBootReceiver: ConfigPlugin<WithBootReceiverProps | void> = (
  config,
  _props,
) => {
  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;

    // 1. Ensure the permission.
    manifest["uses-permission"] = manifest["uses-permission"] || [];
    const hasPermission = (
      manifest["uses-permission"] as ManifestNamedItem[]
    ).some((p) => p.$?.["android:name"] === PERMISSION);
    if (!hasPermission) {
      manifest["uses-permission"].push({
        $: { "android:name": PERMISSION },
      } as unknown as AndroidConfig.Manifest.ManifestUsesPermission);
    }

    // 2. Ensure the <receiver> inside <application>.
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      modConfig.modResults,
    );
    application.receiver = application.receiver || [];

    const alreadyRegistered = (
      application.receiver as ManifestNamedItem[]
    ).some((r) => r.$?.["android:name"] === RECEIVER_NAME);

    if (!alreadyRegistered) {
      (application.receiver as unknown[]).push({
        $: {
          "android:name": RECEIVER_NAME,
          "android:enabled": "true",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "android.intent.action.BOOT_COMPLETED" } },
            ],
            category: [
              { $: { "android:name": "android.intent.category.DEFAULT" } },
            ],
          },
        ],
      });
    }

    return modConfig;
  });

  return config;
};

export default withBootReceiver;
