const { withAndroidManifest } = require("@expo/config-plugins");


function addAttributesToMainActivity(androidManifest) {
  const { manifest } = androidManifest;

  if (!Array.isArray(manifest["application"])) {
    console.warn(
      "withWordlLineIntentActivity: No application array in manifest?"
    );
    return androidManifest;
  }

  const application = manifest["application"].find(
    (item) => item.$["android:name"] === ".MainApplication"
  );
  if (!application) {
    console.warn("withWordlLineIntentActivity: No .MainApplication?");
    return androidManifest;
  }

  if (!Array.isArray(application["activity"])) {
    console.warn(
      "withWordlLineIntentActivity: No activity array in .MainApplication?"
    );
    return androidManifest;
  }

  const activity = application["activity"].find(
    (item) => item.$["android:name"] === ".MainActivity"
  );
  if (!activity) {
    console.warn("withWordlLineIntentActivity: No .MainActivity?");
    return androidManifest;
  }

  const action = {};
  action.$ = {
    ...action.$,
    ...{
      "android:name": "com.domain.action.PROCESS_TRANSACTION",
    },
  };

  const intent = { action: action };
  activity["intent-filter"].push(intent);

  return androidManifest;
}

module.exports = function withIntentActivity(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addAttributesToMainActivity(config.modResults);
    return config;
  });
};

