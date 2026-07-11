import {
  VERSION,
  STORAGE_BACKUP_NAME,
  STORAGE_NAME,
  SCREEN
} from "./src/constants";
import {
  act,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from "react";
import { AppStateModel } from "./src/models";
import { Navigator, navigationRef } from "./src/navigator";
import { AppProvider } from "./src/context/AppContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useShareIntent } from "expo-share-intent";
import { createAppState } from "./src/initials";
import storage from "./src/storage";
import { convertState } from "./src/utils/stateVersionConvert";
import React, {
  Button,
  ScrollView,
  View,
  Text,
  TextInput,
  Linking,
  AppRegistry,
  useColorScheme
} from "react-native";
import { logger } from "./src/utils/logger";
import toastShow from "./src/utils/toastShow";

export default function App() {
  const [isReady, setReady] = useState(false);
  const [state, setState]: [
    AppStateModel,
    Dispatch<SetStateAction<AppStateModel>>
  ] = useState(createAppState);
  const [clickCounter, setClickCounter] = useState(0);
  const counterMax = 5;
  const [textInputValue, setTextInputValue] = useState("");
  const [askedForHelp, setAskedForHelp] = useState(false);

  // Reads text shared into the app via the Android share sheet (SEND / text/plain).
  // This is the piece that was missing: the intent filter opened the app, but
  // nothing read Intent.EXTRA_TEXT (Linking only surfaces VIEW/URL intents).
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent({ debug: true, resetOnBackground: true });

  useEffect(() => {
    if (error) {
      logger.write(`[SHARE INTENT] error: ${error}`);
    }
    if (!hasShareIntent) {
      return;
    }
    const sharedText = shareIntent.text ?? shareIntent.webUrl ?? "";
    // proof it arrived — visible toast + persisted log (viewable in the log viewer)
    logger.write(`[SHARE INTENT] received: ${JSON.stringify(shareIntent)}`);
    toastShow(`Shared text: ${sharedText}`, 10000);
    // route into the passage-add flow: listScreen reads route.params.passageText
    // and runs handleTextFromIntent. On a cold start the nav container may not be
    // mounted yet, so retry briefly until it is ready.
    let tries = 0;
    const routeToList = () => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(SCREEN.listPassage, {
          passageText: sharedText
        });
        resetShareIntent();
      } else if (tries < 50) {
        tries += 1;
        setTimeout(routeToList, 100);
      }
    };
    routeToList();
  }, [hasShareIntent, error]);

  useEffect(() => {
    Linking.addEventListener("url", (link) => {
      if (state.settings.devModeEnabled) {
        logger.write(`[DEV] Recieved data: ${JSON.stringify(link)}`);
        toastShow("Recieved data:" + link, 1000);
      }
    });
    return () => {
      Linking.removeAllListeners("url");
    };
    // Was missing a dep array → re-subscribed on every App render. Only needs to
    // re-run when devMode toggles (rare); mount-once otherwise (8.1.1 finding #5).
  }, [state.settings.devModeEnabled]);
  const loadState = () => {
    storage
      .load({
        key: `${STORAGE_NAME}`
      })
      .then((data) => {
        const dataObj: AppStateModel = data as AppStateModel;
        //check if version is correct
        if (dataObj?.version === VERSION) {
          setState(data);
          setReady(true);
        } else {
          //if versions does not match
          //try to convert
          storage
            .save({
              key: STORAGE_BACKUP_NAME,
              data: dataObj
            })
            .then(() => {
              const convertedState = convertState(dataObj);
              if (convertedState) {
                toastShow(
                  `State converted from ${dataObj.version} to ${VERSION}`,
                  10000
                );
                storage
                  .save({
                    key: `${STORAGE_NAME}`,
                    data: convertedState
                  })
                  .then(() => {
                    setState(convertedState);
                    setReady(true);
                  });
              } else {
                //if it is not possible to convert create new one with backup
                toastShow(
                  "Error with convering app state. Backup saved.",
                  10000
                );
                setState(createAppState);
                setReady(true);
              }
            });
        }
      })
      .catch((e) => {
        logger.write("Creating new state b.c. there were none")
        // toastShow("Creating new state", 10000);
        storage
          .save({
            key: `${STORAGE_NAME}`,
            data: state
          })
          .then(() => {
              setReady(true);
          });
      });
  };

  // const theme = useColorScheme()

  // Load persisted state EXACTLY ONCE, then hand ownership to AppProvider (the
  // single source of truth, which does all subsequent storage writes). This
  // effect previously had no dependency array, so it re-read storage and
  // re-seeded on every render — an infinite reload loop that fought every state
  // mutation once state stopped being per-screen.
  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) {
      return;
    }
    didLoad.current = true;
    loadState();
  }, []);
  try {
    return (
      <>
        {isReady && (
          <SafeAreaProvider>
            <AppProvider initialState={state}>
              <Navigator />
            </AppProvider>
          </SafeAreaProvider>
        )}
      </>
    );
  } catch (err) {
    logger.error(`Error with rendering state on app start`);
    return (
      <ScrollView>
        <View
          style={{
            padding: 30,
            justifyContent: "center",
            gap: 30,
            minHeight: 600
          }}
        >
          <Text
            style={{
              fontSize: 30,
              fontWeight: "600",
              color: "#fff"
            }}
          >
            🤕 Critical error/Критична помилка
          </Text>
          <Button
            title="🫣 Restore from daily backup / Відновити з щоденого бекапу"
            onPress={() => {
              try {
                storage
                  .load({
                    key: STORAGE_BACKUP_NAME
                  })
                  .then((data) => {
                    const dataObj: AppStateModel = data as AppStateModel;
                    //check if version is correct
                    if (dataObj.version === VERSION) {
                      storage
                        .save({
                          key: `${STORAGE_NAME}`,
                          data: dataObj
                        })
                        .then(() => {
                          setState(dataObj);
                          setReady(true);
                          toastShow("Loaded from backup", 10000);
                        });
                    } else {
                      toastShow(
                        "Backup version does not match :(",
                        10000
                      );
                    }
                  });
              } catch (err) {
                logger.error(`Error on bloading backup`);
                toastShow("😟 Nope. Error here too...", 10000);
              }
            }}
          />
          <Button
            title={
              "🧳 Export passages list/Експортувати список текстів " +
              clickCounter
            }
            color={"#4a4"}
            onPress={() => {
              if (clickCounter < counterMax) {
                try {
                  storage
                    .load({
                      key: `${STORAGE_NAME}`
                    })
                    .then((data) => {
                      setTextInputValue(JSON.stringify(data.passages, null, 4));
                      toastShow("Showing passages", 10000);
                    })
                    .catch((err) => {
                      logger.error(`Error on encoding while exporting`);
                      toastShow("😟 Nope. " + err, 10000);
                    });
                } catch (err) {
                  logger.error(`Error while exporting`);
                  toastShow("😟 Nope. " + err, 10000);
                }
              } else {
                try {
                  storage
                    .load({
                      key: `${STORAGE_NAME}`
                    })
                    .then((data) => {
                      setTextInputValue(JSON.stringify(data, null, 4));
                      toastShow("Showing state", 10000);
                    })
                    .catch((err) => {
                      logger.error(`Error while getting data from storage`);
                      toastShow("😟 Nope. " + err, 10000);
                    });
                } catch (err) {
                  logger.error(`Error while getting data from storage 2`);
                  toastShow("😟 Nope. " + err, 10000);
                }
              }
              if (clickCounter >= counterMax * 2) {
                setClickCounter(0);
              } else {
                setClickCounter((prv) => prv + 1);
              }
            }}
          />
          <Button
            title="🛎️ Ask developer for help/Спитати допомоги у розробника"
            color={"#aa4"}
            onPress={() => {
              try {
                setAskedForHelp(true);
                Linking.openURL("https://t.me/BibleByHeartApp");
              } catch (err) {
                logger.error(`Unable to open telegram link`);
                toastShow("😟 Nope. " + err, 10000);
              }
            }}
          />
          <Button
            title="😣 Erase all data/Стерти всі данні"
            color={"#a44"}
            disabled={!askedForHelp}
            onPress={() => {
              try {
                const newState = createAppState();
                storage
                  .save({
                    key: `${STORAGE_NAME}`,
                    data: newState
                  })
                  .then(() => {
                    setState(newState);
                    setReady(true);
                    toastShow("Brand new data for you", 10000);
                  });
              } catch (err) {
                logger.error(`Unable to create new state`);
                toastShow("😟 Nope. " + err, 10000);
              }
            }}
          />

          <TextInput
            multiline
            value={textInputValue}
            style={{
              maxHeight: 600,
              color: clickCounter < counterMax + 1 ? "#fff" : "#0f0"
            }}
          />
        </View>
      </ScrollView>
    );
  }
}

AppRegistry.registerComponent("Bible by heart", () => App);
