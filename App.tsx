import { VERSION, STORAGE_BACKUP_NAME, STORAGE_NAME } from "./src/constants";
import { act, Dispatch, SetStateAction, useEffect, useState } from "react";
import { AppStateModel } from "./src/models";
import { Navigator } from "./src/navigator";
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
  });
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
        toastShow("creating new state", 10000);
        console.warn(e);
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

  useEffect(() => {
    loadState();
  });
  try {
    return <>{isReady && <Navigator state={state} />}</>;
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
