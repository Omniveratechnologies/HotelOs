/**
 * Dynamic Expo config (replaces app.json).
 *
 * The only thing that varies by build is the "variant":
 *
 *   APP_VARIANT unset / anything else  ->  development build
 *   APP_VARIANT=production             ->  shipping kiosk build
 *
 * `expo-dev-client` is a *devDependency*, and Expo autolinks its config plugin
 * whenever the package is installed. So a truly clean production build comes
 * from installing without dev dependencies:
 *
 *   pnpm install --frozen-lockfile --prod   # production install
 *   APP_VARIANT=production pnpm prebuild
 *
 * A normal `pnpm install` (dev) keeps expo-dev-client installed, so dev builds
 * get the launcher / dev menu as usual. The production variant also drops the
 * plugin from the list below so a `--prod` install never tries to resolve a
 * package that isn't there.
 *
 * See docs/PRODUCTION.md for the full self-managed (no EAS, no MDM) flow.
 */

const IS_PRODUCTION = process.env.APP_VARIANT === "production";

// Type the incoming context loosely so this file typechecks even when the
// pnpm store is only partially installed (Expo passes { config, projectRoot }).
export default ({ config }: { config?: Record<string, unknown> } = {}) => ({
  ...config,

  name: IS_PRODUCTION ? "Kiosk" : "Kiosk POC (dev)",
  slug: "kiosk-poc",
  scheme: "kioskpoc",
  version: "1.0.0",
  orientation: "landscape",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  android: {
    // PERMANENT once provisioned as Device Owner — never change without a
    // factory reset. Update every hard-coded reference in docs/scripts too.
    package: "com.kioskpoc.app",
    versionCode: 1,
    usesCleartextTraffic: true,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0F172A",
    },
    permissions: [
      "RECEIVE_BOOT_COMPLETED",
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "WAKE_LOCK",
      "DISABLE_KEYGUARD",
      // Lets Build.getSerial() be used for the stable device id. As Device
      // Owner the app self-grants this at runtime (see KioskManagerModule);
      // the permission only needs to be declared here.
      "READ_PHONE_STATE",
    ],
  },

  plugins: [
    "expo-router",
    // Dev-only. Listed here so it resolves in a dev install; in a production
    // install the package is absent (devDependency + `pnpm install --prod`),
    // so it is neither resolved nor autolinked — no dev launcher, no `exp+`.
    ...(IS_PRODUCTION ? [] : ["expo-dev-client"]),
    "./modules/kiosk-manager/app.plugin.js",
    ["./plugins/withBootReceiver.ts", { launchActivity: ".MainActivity" }],
    [
      "./plugins/withDeviceAdmin.ts",
      { receiverName: "KioskDeviceAdminReceiver" },
    ],
    "./plugins/withKioskManifestPermissions.ts",
    // Injects a release signingConfig into the generated android/app/build.gradle
    // from KIOSK_* env vars. No-op (falls back to the debug key) when unset.
    "./plugins/withReleaseSigning.ts",
  ],

  extra: {
    router: {
      origin: false,
    },
  },
});
