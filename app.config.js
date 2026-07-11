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
      ["./plugins/handlingIntents"],
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
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: '35.0.0',
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
      intentFilters: [
        {
          autoVerify: true,
          action: "SEND",
          
          data: {
            mimeType: "text/plain"
          },
          category: ["BROWSABLE", "DEFAULT"]
        },
        {
          autoVerify: true,
          action: "VIEW",
          data: {
            "scheme": "https",
            "host": "biblebyheart.app"
          },
          category: [
            "BROWSABLE",
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
      ESVTOKEN: process.env.ESVTOKEN,
      HOST: process.env.HOST
    },

  }
};
