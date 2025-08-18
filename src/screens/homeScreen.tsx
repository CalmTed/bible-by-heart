import React, { FC, useState } from "react";
import { View, Text, StyleSheet, Linking } from "react-native";
import { SCREEN, THEMETYPE } from "../constants";
import { navigateWithState } from "../screeenManagement";
import { Button } from "../components/Button";
import { DaggerLogoSVG } from "../svg/daggetLogo";
import { getStroke } from "../utils/getStats";
import { WeekActivityComponent } from "../components/weekActivityComponent";
import { StatusBar } from "expo-status-bar";
import { useApp } from "../utils/useApp";
import { IconName } from "../components/Icon";
import { SelectModal } from "../components/SelectModal";
import { ActionName } from "../models";
import { getPassagesByTrainMode } from "../utils/generateTests";
import { reduce } from "../utils/reduce";
import { MangerSVG } from "../svg/manger";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";
import { logger } from "../utils/logger";

export interface ScreenModel {
  route: any;
  navigation: StackNavigationHelpers;
}

export const HomeScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, t, theme } = useApp({ route, navigation });

  const [showTrainModesList, setShowTrainModesList] = useState(false);

  let strokeData = getStroke(state.testsHistory);
  const activeTrainModes = state.settings.trainModesList.filter(
    (m) => m.enabled
  );

  Linking.getInitialURL()
    .then((url) => {
      if (url) {
        // toastShow(`Recieved text or link, ${url}`, 10000);
        logger.write(`Recieved text or link, ${url}`);
      } else {
        if (state.settings.devModeEnabled) {
          logger.write(`Recieved NO text or link url:${typeof url}`);
        }
      }
    })
    .catch((err) => {
      logger.error("An error occurred on home screen no getting initial url");
    });
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
  const LogoBlock = () => (
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
  const MainButtons = () => {
    return (
      <View style={homeStyle.buttonView}>
        <View style={homeStyle.buttonView}>
          {state.passages.length === 0 && (
            <Button
              key={"addFirstPassageButton"}
              theme={theme}
              type="main"
              color="green"
              title={t("AddPassages")}
              onPress={() =>
                navigateWithState({
                  navigation,
                  screen: SCREEN.listPassage,
                  state: state
                })
              }
            />
          )}
          {state.passages.length > 0 && [
            <Button
              key={"practiceButton"}
              theme={theme}
              type="main"
              color="green"
              title={t("homePractice")}
              onPress={() =>
                activeTrainModes.length > 1
                  ? setShowTrainModesList(true)
                  : navigateWithState({
                      navigation,
                      screen: SCREEN.test,
                      state:
                        reduce(state, { name: ActionName.generateTests }) ||
                        state
                    })
              }
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
              onPress={() =>
                navigateWithState({
                  navigation,
                  screen: SCREEN.listPassage,
                  state: state
                })
              }
            />,
            <Button
              key={"statsButton"}
              theme={theme}
              title={t("homeStats")}
              onPress={() =>
                navigateWithState({
                  navigation,
                  screen: SCREEN.stats,
                  state: state
                })
              }
            />
          ]}
          <Button
            theme={theme}
            title={t("homeSettings")}
            onPress={() =>
              navigateWithState({
                navigation,
                screen: SCREEN.settings,
                state: state
              })
            }
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
            const newState =
              reduce(state, {
                name: ActionName.generateTests,
                trainModeId: parseInt(value, 10)
              }) || state;
            navigateWithState({
              navigation,
              screen: SCREEN.test,
              state: newState
            });
          }}
          onCancel={() => {
            setShowTrainModesList(false);
          }}
          theme={theme}
        />
      </View>
    );
  };
  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      <StatusBar
        style={state.settings.theme === THEMETYPE.light ? "dark" : "light"}
      />
      <LogoBlock />
      <WeekActivityComponent theme={theme} state={state} t={t} />
      <MainButtons />
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
