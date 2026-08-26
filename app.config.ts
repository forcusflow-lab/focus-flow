// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
// Bundle ID can only contain letters, numbers, and dots
// Android requires each dot-separated segment to start with a letter
const isPersonalUnlimitedBuild = process.env.FOCUS_FLOW_PERSONAL_UNLIMITED === "1";
const rawBundleId = isPersonalUnlimitedBuild ? "com.app.focusflow.personal" : "com.app.focusflow";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".") // Replace hyphens/underscores with dots
    .replace(/[^a-zA-Z0-9.]/g, "") // Remove invalid chars
    .replace(/\.+/g, ".") // Collapse consecutive dots
    .replace(/^\.+|\.+$/g, "") // Trim leading/trailing dots
    .toLowerCase()
    .split(".")
    .map((segment) => {
      // Android requires each segment to start with a letter
      // Prefix with 'x' if segment starts with a digit
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.manus.app";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = isPersonalUnlimitedBuild ? "manusfocusflowpersonal" : "manusfocusflow";

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Focus Flow",
  appSlug: "focus-flow",
  logoUrl: "/manus-storage/focus-flow-icon_b247e465.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  owner: "force-flow",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: env.iosBundleId,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#246B5A",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    // Google Playでは同一パッケージ内でバージョンコードを重複登録できない。
    // 本人専用APKは別パッケージなので、通常版の内部テスト版と競合しない。
    versionCode: isPersonalUnlimitedBuild ? 7 : 17,
    permissions: ["POST_NOTIFICATIONS"],
    blockedPermissions: ["android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE"],
    intentFilters: [
      {
        action: "VIEW",
        data: [
          {
            scheme: env.scheme,
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "./plugins/with-focus-flow-android",
    "expo-router",
    "expo-iap",
    "expo-notifications",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 118,
        resizeMode: "contain",
        backgroundColor: "#163E35",
        dark: {
          backgroundColor: "#163E35",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    personalUnlimitedBuild: isPersonalUnlimitedBuild,
    eas: {
      projectId: "6b20d097-806c-4b32-a93a-64ff132e4f0f",
    },
  },
};

export default config;
