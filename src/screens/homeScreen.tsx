import React, { FC, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { SCREEN, THEMETYPE } from "../constants";
import { Button } from "../components/Button";
import { DaggerLogoSVG } from "../svg/daggetLogo";
import { getStroke } from "../utils/getStats";
import { WeekActivityComponent } from "../components/weekActivityComponent";
import { StatusBar } from "expo-status-bar";
import { useAppContext } from "../context/AppContext";
import { IconName } from "../components/Icon";
import { SelectModal } from "../components/SelectModal";
import { ActionName } from "../models";
import { getPassagesByTrainMode } from "../utils/generateTests";
import { MangerSVG } from "../svg/manger";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";
import { logger } from "../utils/logger";

export interface ScreenModel {
  route: any;
  navigation: StackNavigationHelpers;
}

export const HomeScreen: FC<ScreenModel> = ({ navigation }) => {
  const { state, dispatch, t, theme } = useAppContext();

  const [showTrainModesList, setShowTrainModesList] = useState(false);

  // getStroke walks the whole history (O(history)); recompute only when the
  // history actually changes, not on every re-render (8.1.1 finding #4/d).
  const strokeData = useMemo(
    () => getStroke(state.testsHistory),
    [state.testsHistory]
  );
  const activeTrainModes = state.settings.trainModesList.filter(
    (m) => m.enabled
  );

  // Was firing on EVERY render (async work, no effect guard — 8.1.1 finding #4);
  // it only needs to read the launch URL once on mount.
  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          // toastShow(`Recieved text or link, ${url}`, 10000);
          logger.write(`Recieved text or link, ${JSON.stringify(url)}`);
        } else {
          if (state.settings.devModeEnabled) {
            logger.write(`Recieved NO text or link url:${JSON.stringify(url)}`);
          }
        }
      })
      .catch((err) => {
        logger.error("An error occurred on home screen no getting initial url");
      });
  }, []);
  // const [data, setData] = React.useState<ExpoIntentReceiver.IntentInfo[]>([]);
  // const refIntent = React.useRef(ExpoIntentReceiver.getInitialIntent());

  // if(!initialIntent && refIntent.current){
  //   setInitialIntent(refIntent.current);
  //   toastShow(`Recieved intent ${JSON.stringify(refIntent.current[0])}`, 10000);
  // }
  // if(!refIntent.current){
  //   state.settings.devMode ? toastShow("No initial link", 10000) : null;
  // }
  // const subscription = ExpoIntentReceiver.addChangeListener(({ data }) => {
  //   setData((currentData) => [...currentData, ...data])
  // })
  // return () => subscription.remove();
  // ReceiveSharingIntent.getReceivedFiles((data:any)=> {
  //   toastShow(`Received intent data ${data.length}`, 1000)
  //   initialIntent(data)
  // },
  // (err:any)=>{
  //   toastShow(`Error while receiveing intents ${err}`, 1000)
  // });

  // React.useEffect(() => {
  //   try {
  //     DeviceEventEmitter.addListener("result", (message) => {
  //       state.settings.devModeEnabled ? toastShow(message, 1000) : null;
  //       logger.write(`Recieved event message: ${message}`);
  //     });
  //     return () => {
  //       DeviceEventEmitter.removeAllListeners();
  //     };
  //   } catch (e) {
  //     logger.error(
  //       `Recieved intentError while calling module DeviceEventEmitter`
  //     );
  //     return () => {};
  //   }
  // }, []);
  // Elements, NOT nested component functions. Declaring `const LogoBlock = () =>`
  // and rendering `<LogoBlock/>` mints a NEW component type every render, so React
  // unmounts + remounts the whole subtree each time (8.1.1 finding #4/e). Plain
  // elements just reconcile.
  const logoBlock = (
    <View style={homeStyle.logoView}>
      {new Date().getMonth() !== 11 && (
        <DaggerLogoSVG isOutline={strokeData.today} color={theme.colors.text} />
      )}
      {new Date().getMonth() === 11 && (
        <MangerSVG isOutline={strokeData.today} color={theme.colors.text} />
      )}
      <Text style={{ ...theme.theme.text, ...homeStyle.titleText }}>
        {/* Bible by heart */}
        {t("appName")}
      </Text>
      <Text
        style={{
          ...theme.theme.text,
          color: theme.colors.textSecond
        }}
      >
        {t("DaysStroke")}: {strokeData.length}
      </Text>
    </View>
  );
  const mainButtons = (
    <View style={homeStyle.buttonView}>
      <View style={homeStyle.buttonView}>
        {state.passages.length === 0 && (
          <Button
            key={"addFirstPassageButton"}
            theme={theme}
            type="main"
            color="green"
            title={t("AddPassages")}
            onPress={() => navigation.navigate(SCREEN.listPassage)}
          />
        )}
        {state.passages.length > 0 && [
          <Button
            key={"practiceButton"}
            theme={theme}
            type="main"
            color="green"
            title={t("homePractice")}
            onPress={() => {
              if (activeTrainModes.length > 1) {
                setShowTrainModesList(true);
              } else {
                dispatch({ name: ActionName.generateTests });
                navigation.navigate(SCREEN.test);
              }
            }}
            icon={
              activeTrainModes.length > 1 ? IconName.selectArrow : undefined
            }
            iconAlign="right"
            disabled={state.passages.length === 0}
          />,
          <Button
            key={"listButton"}
            theme={theme}
            title={t("homeList")}
            onPress={() => navigation.navigate(SCREEN.listPassage)}
          />,
          <Button
            key={"statsButton"}
            theme={theme}
            title={t("homeStats")}
            onPress={() => navigation.navigate(SCREEN.stats)}
          />
        ]}
        <Button
          theme={theme}
          title={t("homeSettings")}
          onPress={() => navigation.navigate(SCREEN.settings)}
        />
      </View>
      <SelectModal
        isShown={showTrainModesList}
        options={activeTrainModes.map((m) => ({
          value: m.id.toString(),
          label: `${m.name} (${getPassagesByTrainMode(state, m).length})`
        }))}
        disabledIndexes={activeTrainModes.map((m, i) =>
          !getPassagesByTrainMode(state, m).length ? i : Infinity
        )}
        selectedIndex={activeTrainModes.indexOf(
          activeTrainModes.filter(
            (m) => m.id === state.settings.activeTrainModeId
          )[0]
        )}
        onSelect={(value) => {
          setShowTrainModesList(false);
          dispatch({
            name: ActionName.generateTests,
            trainModeId: parseInt(value, 10)
          });
          navigation.navigate(SCREEN.test);
        }}
        onCancel={() => {
          setShowTrainModesList(false);
        }}
      />
    </View>
  );
  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      <StatusBar
        style={state.settings.theme === THEMETYPE.light ? "dark" : "light"}
      />
      {logoBlock}
      <WeekActivityComponent theme={theme} state={state} t={t} />
      {mainButtons}
    </View>
  );
};

const homeStyle = StyleSheet.create({
  logoView: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  titleText: {
    fontSize: 35,
    fontWeight: "700"
  },
  buttonView: {
    flex: 1,
    alignItems: "center",
    gap: 10
  }
});
