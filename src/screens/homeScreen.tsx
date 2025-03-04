import React, { FC, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SCREEN, THEMETYPE } from "../constants";
import { StackNavigationHelpers } from "@react-navigation/stack/src/types";
import { navigateWithState } from "../screeenManagement";
import { Button } from "../components/Button";
import { DaggerLogoSVG } from "../svg/daggetLogo";
import { getStroke } from "../tools/getStats";
import { WeekActivityComponent } from "../components/weekActivityComponent";
import { StatusBar } from "expo-status-bar";
import { useApp } from "../tools/useApp";
import { IconName } from "../components/Icon";
import { SelectModal } from "../components/SelectModal";
import { ActionName } from "../models";
import { getPassagesByTrainMode } from "../tools/generateTests";
import { reduce } from "../tools/reduce";
import { MangerSVG } from "../svg/manger";
import { FinishCupSVG } from "src/svg/finishCup";

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

  // Linking.getInitialURL().then((url) => {
  //   if (url) {
  //     ToastAndroid.show("Recieved text or link", 10000);
  //     console.log(`shared string/text is: ${url}`);
  //     setInitialURL(url);
  //   }else{
  //     state.settings.devMode ? ToastAndroid.show("No initial link", 10000) : null;
  //   }
  // }).catch(err => {
  //   ToastAndroid.show("An error occurred on home screen no getting initial url", 10000);
  //   console.error('An error occurred on home screen no getting initial url', err)
  // });
  // const [data, setData] = React.useState<ExpoIntentReceiver.IntentInfo[]>([]);
  // const refIntent = React.useRef(ExpoIntentReceiver.getInitialIntent());
  
    // if(!initialIntent && refIntent.current){
    //   setInitialIntent(refIntent.current);
    //   ToastAndroid.show(`Recieved intent ${JSON.stringify(refIntent.current[0])}`, 10000);
    // }
    // if(!refIntent.current){
    //   state.settings.devMode ? ToastAndroid.show("No initial link", 10000) : null;   
    // }
    // const subscription = ExpoIntentReceiver.addChangeListener(({ data }) => {
    //   setData((currentData) => [...currentData, ...data])
    // })
    // return () => subscription.remove();
    // ReceiveSharingIntent.getReceivedFiles((data:any)=> {
      //   ToastAndroid.show(`Received intent data ${data.length}`, 1000)
      //   initialIntent(data)
      //   // console.log(data);
      // },
      // (err:any)=>{
        //   ToastAndroid.show(`Error while receiveing intents ${err}`, 1000)
        //   console.log(err);
        // });
        
    //   React.useEffect(() => {
    //     try{
    //     DeviceEventEmitter.addListener("result", message => {
    //       state.settings.devMode ? ToastAndroid.show( message,1000) : null
    //       setInitialIntent(message)
    //     })
    //     return () => {
    //       DeviceEventEmitter.removeAllListeners()
    //     }
    //   }catch(e){
    //     state.settings.devMode ? ToastAndroid.show(`Error while calling module`, 1000) : null
    //     return () => {}
    //   }
    // }, []);
  const LogoBlock = () => (<View style={homeStyle.logoView}>
    {
      new Date().getMonth() !== 11 &&
      <DaggerLogoSVG isOutline={strokeData.today} color={theme.colors.text} />
    }
    {
      new Date().getMonth() === 11 &&
      <MangerSVG isOutline={strokeData.today} color={theme.colors.text} />
    }
    <Text style={{ ...theme.theme.text, ...homeStyle.titleText }}>
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
    
  </View>)

  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      <LogoBlock/>
      <WeekActivityComponent theme={theme} state={state} t={t} />
      <View style={homeStyle.buttonView}>
        {state.passages.length === 0 &&<Button
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
        }
        {
          state.passages.length > 0 && [
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
                state: reduce(state, {name: ActionName.generateTests}) || state
              })
            }
            icon={activeTrainModes.length > 1 ? IconName.selectArrow : undefined}
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
            state: newState,
          });
        }}
        onCancel={() => {
          setShowTrainModesList(false);
        }}
        theme={theme}
      />
      <StatusBar
        style={state.settings.theme === THEMETYPE.light ? "dark" : "light"}
      />
      {/* <MiniModal 
        shown={!!initialIntent} 
        handleClose={
         () => setInitialIntent(undefined)
        }
        theme={theme}
      >
        <View style={homeStyle.sharingModalView}>
          <Text style={{...homeStyle.sharingModalVerseText, ...theme.theme.text}}>{JSON.stringify(initialIntent)}</Text>
           <Text style={{...homeStyle.sharingModalVerseText, ...theme.theme.text}}>{initialIntent ? JSON.stringify(addressFromString(initialIntent[0]. || "")) : ""}</Text>
          <View style={theme.theme.rowView}>
            <Button
              title={t("Cancel")}
              theme={theme}
              onPress={() => setInitialIntent(undefined)}
            />
            <Button
              type="main"
              title={t("AddPassage")}
              theme={theme}
              onPress={() => {}}
            />

          </View>
        </View>
      </MiniModal> */}
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
