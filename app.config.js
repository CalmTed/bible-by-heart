import "dotenv/config"
// single source of truth for the app version — bump it in package.json only
const { version } = require("./package.json");
const versionCode = parseInt(
  new Date().toISOString().slice(2, 15).replace(/[-T:]/g, ""),
  10
);//in the format of yymmddhh. Can ont be larger than 2147483647. Must be an integer. Time is UMT+0

export default {
  expo: {
    name:
      process.env.APP_ENV === "production"
        ? "Bible by heart"
        : `BBH dev ${versionCode}`,
    slug: "bible-by-heart",
    version,
    githubUrl: "https://github.com/CalmTed/bible-by-heart",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    backgroundColor: "#272A27",
    primaryColor: "#1A9E37",
    icon:
      process.env.APP_ENV === "production"
        ? "./assets/icon.png"
        : "./assets/dev.png",
    developmentClient: process.env.APP_ENV !== "production",
    scheme: ["bible-by-heart", "bbh"],
    plugins: [
      "expo-localization",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/notification.png",
          color: "#ECECEC"
        }
      ],
      [
        "expo-share-intent",
        {
          // Android only for now (build-dev targets Android); skip the iOS share
          // extension which needs an app-group identifier + extra Xcode target.
          disableIOS: true,
          androidIntentFilters: ["text/*"]
        }
      ],
      [
        'expo-build-properties',
        {
          android: {
            // Google Play requires new releases to target Android 16 (API 36).
            // Edge-to-edge is enforced on API 36 — see android.edgeToEdgeEnabled below.
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            buildToolsVersion: '36.0.0',
            minSdkVersion: 24
          }
        },
      ],
    ],
    splash: {
      image:
        process.env.APP_ENV === "production"
          ? "./assets/icon.png"
          : "./assets/dev.png",
      resizeMode: "contain",
      backgroundColor: "#272A27"
    },
    newArchEnabled: true,
    assetBundlePatterns: ["**/*"],
    ios: {
      appleTeamId: "78UUZH378R",
      bundleIdentifier: "com.CalmTed.bibleByHeart",
      backgroundColor: "#272A27",
      supportsTablet: false,
      buildNumber: versionCode.toString(),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    android: {
      // The SEND / text share filter is added by the expo-share-intent plugin
      // above (androidIntentFilters: ["text/*"]); only the App-Links VIEW filter
      // is declared manually here.
      intentFilters: [
        {
          autoVerify: true,
          action: "VIEW",
          // Both hosts, because the site answers on both and a link shared from
          // a browser carries whichever one the user landed on. Android
          // verifies every host in an autoVerify filter, so www must serve the
          // same /.well-known/assetlinks.json - it does.
          data: [
            {
              "scheme": "https",
              "host": "biblebyheart.app"
            },
            {
              "scheme": "https",
              "host": "www.biblebyheart.app"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        },
        // Opening a backup file offers Bible by Heart. The app's own MIME type
        // (see src/utils/backupFile.ts) is what makes the offer specific -
        // matching application/json would put the app in the chooser for every
        // JSON file on the phone. No BROWSABLE here: this is a file being
        // opened, not a link being followed.
        {
          action: "VIEW",
          data: [
            {
              scheme: "content",
              mimeType: "application/vnd.biblebyheart.backup+json"
            },
            {
              scheme: "file",
              mimeType: "application/vnd.biblebyheart.backup+json"
            }
          ],
          category: [
            "DEFAULT"
          ]
        }
      ],
      allowBackup: true,
      softwareKeyboardLayoutMode: "resize",
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage:
          process.env.APP_ENV === "production"
            ? "./assets/adaptive-icon.png"
            : "./assets/adaptive-dev.png",
        backgroundColor:
          process.env.APP_ENV === "production" ? "#ECECEC" : "#434343",
        monochromeImage:
          process.env.APP_ENV === "production"
            ? "./assets/adaptive-icon.png"
            : "./assets/adaptive-dev.png"
      },
      package: "com.CalmTed.bibleByHeart",
      versionCode: versionCode
    },
    extra: {
      eas: {
        projectId: "c76e832f-dde7-42aa-b303-7c97507b9ac9"
      },
      // No text-source key lives here: every translation, ESV included, is
      // fetched through the API, which holds the key server-side.
      HOST: process.env.HOST
    },

  }
};
