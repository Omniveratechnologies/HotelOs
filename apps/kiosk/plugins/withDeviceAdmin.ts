/**
 * Config Plugin: withDeviceAdmin
 *
 * Registers com.kioskpoc.kioskmanager.KioskDeviceAdminReceiver as a
 * protected (BIND_DEVICE_ADMIN) manifest <receiver>, wired to the
 * device_admin.xml policy resource that ships inside the kiosk-manager
 * Expo Module (modules/kiosk-manager/android/src/main/res/xml). Because
 * that resource lives inside the module's own android/ sources, it is
 * merged into the generated app automatically by Gradle resource merging
 * during `expo run:android` — this plugin only has to add the manifest
 * wiring that points at it.
 *
 * Usage (see app.config.ts "plugins"):
 *   ["./plugins/withDeviceAdmin.ts", { "receiverName": "KioskDeviceAdminReceiver" }]
 */
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from "@expo/config-plugins";

export interface WithDeviceAdminProps {
  receiverName?: string;
}

const FULL_RECEIVER_NAME = "com.kioskpoc.kioskmanager.KioskDeviceAdminReceiver";

interface ManifestNamedItem {
  $?: {
    "android:name"?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

const withDeviceAdmin: ConfigPlugin<WithDeviceAdminProps | void> = (
  config,
  _props,
) => {
  return withAndroidManifest(config, (modConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      modConfig.modResults,
    );
    application.receiver = application.receiver || [];

    const alreadyRegistered = (
      application.receiver as ManifestNamedItem[]
    ).some((r) => r.$?.["android:name"] === FULL_RECEIVER_NAME);

    if (!alreadyRegistered) {
      // @expo/config-plugins' ManifestReceiver type omits some valid <receiver>
      // children/attributes (e.g. <meta-data>, android:permission), so the
      // element is cast rather than fighting the incomplete SDK types.
      (application.receiver as unknown[]).push({
        $: {
          "android:name": FULL_RECEIVER_NAME,
          "android:permission": "android.permission.BIND_DEVICE_ADMIN",
          "android:exported": "true",
        },
        "meta-data": [
          {
            $: {
              "android:name": "android.app.device_admin",
              "android:resource": "@xml/device_admin",
            },
          },
        ],
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.app.action.DEVICE_ADMIN_ENABLED",
                },
              },
            ],
          },
        ],
      });
    }

    return modConfig;
  });
};

export default withDeviceAdmin;
