const versionCode = parseInt(
  new Date().toISOString().slice(2, 14).replace(/[-T:]/g, ""),
  10
);
//in the format of yymmddhh. Can ont be larger than 2147483647. Must be an integer. Time is UMT+0

export default {
  expo: {
    name:
      process.env.APP_ENV === "production"
        ? "Bible by heart"
        : `BBH dev ${versionCode}`,
    slug: "bible-by-heart",
    version: "0.0.9",
    orientation: "portrait",
    icon:
      process.env.APP_ENV === "production"
        ? "./assets/icon.png"
        : "./assets/dev.png",
    userInterfaceStyle: "automatic",
    primaryColor: "#1A9E37",
    backgroundColor: "#272A27",
    newArchEnabled: true,
    splash: {
      image:
        process.env.APP_ENV === "production"
          ? "./assets/icon.png"
          : "./assets/dev.png",
      resizeMode: "contain",
      backgroundColor: "#272A27"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false
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
        }
      ],
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
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "c76e832f-dde7-42aa-b303-7c97507b9ac9"
      },
      ESVTOKEN: process.env.ESVTOKEN,
      HOST: process.env.HOST
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification.png",
          color: "#ECECEC"
        }
      ],
      ["./plugins/handlingIntents"]
    ]
  }
};
