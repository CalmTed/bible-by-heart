import { VERSION, STORAGE_BACKUP_NAME, STORAGE_NAME } from "./src/constants";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AppStateModel } from "./src/models";
import { Navigator } from "./src/navigator";
import { createAppState } from "./src/initials";
import storage from "./src/storage";
import { convertState } from "./src/utils/stateVersionConvert";
import React, {
  Button,
  ToastAndroid,
  ScrollView,
  View,
  Text,
  TextInput,
  Linking,
  AppRegistry,
  useColorScheme
} from "react-native";
import { logger } from "src/utils/logger";


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
      if(state.settings.devModeEnabled){
        logger.write(`[DEV] Recieved data: ${link}`)
        ToastAndroid.show("Recieved data:" + link, 1000)
      }
    })
    return () => {
      Linking.removeAllListeners("url")
    }
  })
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
                ToastAndroid.show(
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
                ToastAndroid.show(
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
        ToastAndroid.show("creating new state", 10000);
        console.warn(e);
        storage
          .save({
            key: `${STORAGE_NAME}`,
            data: state
          }).then(() => {
            setReady(true);
          })
      });
  };

  const theme = useColorScheme()

  useEffect(() => {
    loadState();
  });
  try {
    return <>{isReady && <Navigator state={state} />}</>;
  } catch (err) {
    logger.error(`Error with rendering state on app start`)
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
                          ToastAndroid.show("Loaded from backup", 10000);
                        });
                    } else {
                      ToastAndroid.show(
                        "Backup version does not match :(",
                        10000
                      );
                    }
                  });
              } catch (err) {
                logger.error(`Error on bloading backup`)
                ToastAndroid.show("😟 Nope. Error here too...", 10000);
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
                      ToastAndroid.show("Showing passages", 10000);
                    })
                    .catch((err) => {
                      logger.error(`Error on encoding while exporting`)
                      ToastAndroid.show("😟 Nope. " + err, 10000);
                    });
                  } catch (err) {
                  logger.error(`Error while exporting`)
                  ToastAndroid.show("😟 Nope. " + err, 10000);
                }
              } else {
                try {
                  storage
                    .load({
                      key: `${STORAGE_NAME}`
                    })
                    .then((data) => {
                      setTextInputValue(JSON.stringify(data, null, 4));
                      ToastAndroid.show("Showing state", 10000);
                    })
                    .catch((err) => {
                      logger.error(`Error while getting data from storage`)
                      ToastAndroid.show("😟 Nope. " + err, 10000);
                    });
                } catch (err) {
                  logger.error(`Error while getting data from storage 2`)
                  ToastAndroid.show("😟 Nope. " + err, 10000);
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
                logger.error(`Unable to open telegram link`)
                ToastAndroid.show("😟 Nope. " + err, 10000);
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
                    ToastAndroid.show("Brand new data for you", 10000);
                  });
              } catch (err) {
                logger.error(`Unable to create new state`)
                ToastAndroid.show("😟 Nope. " + err, 10000);
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
