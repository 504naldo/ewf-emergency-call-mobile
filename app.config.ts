// Load environment variables with proper priority (system > .env)
require("./scripts/load-env.cjs");
import type { ExpoConfig } from "expo/config";

const rawBundleId = "space.manus.ewf.emergency.call.t20260206001445";

const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase()
    .split(".")
    .map((segment) =>
      /^[a-zA-Z]/.test(segment) ? segment : "x" + segment
    )
    .join(".") || "space.manus.app";

const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  appName: "EWF Emergency",
  appSlug: "ewf-emergency-call-mobile",
  logoUrl:
    "https://private-us-east-1.manuscdn.com/sessionFile/CPbiBeyvGQ3ft8SJYMGbxx/sandbox/tPzUBmboZY8T7vUgqhms6n-img-1_1770355541000_na1fn_ZXdmLWxvZ28.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  owner: "logicworks-studio",
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",

  extra: {
    eas: {
      projectId: "17df13f1-45dd-46a3-bb92-cad4ec845f78",
    },
  },

  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.logicworks.ewfemergency",
    permissions: ["INTERNET", "ACCESS_NETWORK_STATE", "POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
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
    "expo-asset",
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
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
    reactCompiler: false,
  },
};

export default config;
