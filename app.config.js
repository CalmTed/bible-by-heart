export default {
    expo: {
      name: process.env.APP_ENV === 'production' ? 'Bible by heart' : 'BBH dev',
      slug: "bible-by-heart",
      version: "0.0.9",
      orientation: "portrait",
      icon: process.env.APP_ENV === 'production' ? "./assets/icon.png" : "./assets/dev.png",
      userInterfaceStyle: "automatic",
      primaryColor: "#1A9E37",
      backgroundColor: "#272A27",
      newArchEnabled: true,
      splash: {
        image: process.env.APP_ENV === 'production' ? "./assets/icon.png" : "./assets/dev.png",
        resizeMode: "contain",
        backgroundColor: "#272A27"
      },
      assetBundlePatterns: [
        "**/*"
      ],
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
            category: [
              "BROWSABLE",
              "DEFAULT"
            ]
          }
        ],
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ECECEC",
          monochromeImage: "./assets/adaptive-icon.png"
        },
        package: process.env.APP_ENV === 'production' ? 'com.CalmTed.bibleByHeart' : 'com.CalmTed.bibleByHeartStaging',
        versionCode: new Date().toISOString().slice(2,16).replace(/[-T:]/g,'') //format is yymmddhhmm like 2506271021 for +0 UMT
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      extra: {
        eas: {
          projectId: "c76e832f-dde7-42aa-b303-7c97507b9ac9"
        },
        ESVTOKEN: process.env.ESVTOKEN,
        HOST: process.env.HOST,
      },
      plugins: [
        [
          "expo-notifications",
          {
            icon: "./assets/notification.png",
            color: "#ECECEC"
          }
        ],
          [
            "./plugins/handlingIntents"
        ]
      ]
    }
}