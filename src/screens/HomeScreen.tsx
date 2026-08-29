import React, { FC, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  useWindowDimensions
} from "react-native";
import { LAYOUT, LOGO_RATIO, SCREEN, THEMETYPE } from "../constants";
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { DaggerLogoSVG } from "../svg/daggetLogo";
import { getStroke } from "../utils/getStats";
import { WeekActivity } from "../components/WeekActivity";
import { StatusBar } from "expo-status-bar";
import { useAppContext } from "../context/AppContext";
import { IconName } from "../components/Icon";
import { SelectModal } from "../components/SelectModal";
import { ActionName, ScreenPropsModel } from "../models";
import { getPassagesByTrainMode } from "../utils/generateTests";
import { MangerSVG } from "../svg/manger";
import { HomeSwipe, SwipeDirection } from "../components/HomeSwipe";
import { logger } from "../utils/logger";

export const HomeScreen: FC<ScreenPropsModel<SCREEN.home>> = ({
  navigation
}) => {
  const { state, dispatch, t, theme } = useAppContext();

  const [showTrainModesList, setShowTrainModesList] = useState(false);

  // The logo is a share of the screen, not 160px on every device. The width cap
  // is what stops it on an unfolded foldable, where a fifth of the height would
  // be wider than the column the buttons live in.
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const logoHeight = Math.max(
    MIN_LOGO_HEIGHT,
    Math.min(
      windowHeight * LOGO_HEIGHT_SHARE,
      (Math.min(windowWidth, LAYOUT.maxContentWidth) - LOGO_SIDE_MARGIN * 2) /
        LOGO_RATIO
    )
  );

  // getStroke walks the whole history (O(history)); recompute only when the
  // history actually changes, not on every re-render.
  const strokeData = useMemo(
    () => getStroke(state.testsHistory),
    [state.testsHistory]
  );
  const activeTrainModes = state.settings.trainModesList.filter(
    (m) => m.enabled
  );
  const hasPassages = state.passages.length > 0;

  // One definition of "start practising", so the button and the pull-down
  // gesture cannot drift apart. More than one train mode still asks which one -
  // a swipe may not silently pick for the user.
  const startPractice = () => {
    if (activeTrainModes.length > 1) {
      setShowTrainModesList(true);
      return;
    }
    dispatch({ name: ActionName.generateTests });
    navigation.navigate(SCREEN.test);
  };

  // The four edges, in the same words `utils/screenTransition.ts` uses for the
  // four card directions: the finger runs the way the card travels. Settings
  // lives to the LEFT, so it is a swipe rightwards that pulls it in.
  const handleSwipe = (direction: SwipeDirection) => {
    switch (direction) {
      case "right":
        navigation.navigate(SCREEN.settings);
        return;
      case "left":
        navigation.navigate(SCREEN.listPassage);
        return;
      case "up":
        navigation.navigate(SCREEN.stats);
        return;
      case "down":
        startPractice();
    }
  };

  // Settings and the list are always reachable; stats and practice need
  // something to be about, exactly as the buttons below them do.
  const swipeDirections: SwipeDirection[] = hasPassages
    ? ["left", "right", "up", "down"]
    : ["left", "right"];

  // Was firing on EVERY render (async work, no effect guard); it only needs to
  // read the launch URL once on mount.
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
  // }, []); Elements, NOT nested component functions. Declaring `const
  // LogoBlock = () =>` and rendering `<LogoBlock/>` mints a NEW component type
  // every render, so React unmounts + remounts the whole subtree each time.
  // Plain elements just reconcile.
  const logoBlock = (
    <View style={homeStyle.logoView}>
      {new Date().getMonth() !== 11 && (
        <DaggerLogoSVG
          isOutline={strokeData.today}
          color={theme.colors.text}
          height={logoHeight}
        />
      )}
      {new Date().getMonth() === 11 && (
        <MangerSVG
          isOutline={strokeData.today}
          color={theme.colors.text}
          height={logoHeight}
        />
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
      {!hasPassages && (
        <Button
          key={"addFirstPassageButton"}
          type="main"
          color="green"
          title={t("AddPassages")}
          onPress={() => navigation.navigate(SCREEN.listPassage)}
        />
      )}
      {hasPassages && [
        <Button
          key={"practiceButton"}
          type="main"
          color="green"
          title={t("homePractice")}
          onPress={startPractice}
          icon={activeTrainModes.length > 1 ? IconName.selectArrow : undefined}
          iconAlign="right"
        />,
        <Button
          key={"listButton"}
          title={t("homeList")}
          onPress={() => navigation.navigate(SCREEN.listPassage)}
        />,
        <Button
          key={"statsButton"}
          title={t("homeStats")}
          onPress={() => navigation.navigate(SCREEN.stats)}
        />
      ]}
      <Button
        title={t("homeSettings")}
        onPress={() => navigation.navigate(SCREEN.settings)}
      />
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
      {/* No bar of its own - but the top margin still comes from the device */}
      <Header />
      {/* The four blocks are spaced on purpose. The logo used to sit in
          a `flex: 1` box that centred it, so ALL the slack collected in two
          equal voids - one above the logo, one under "Days stroke" - and the
          week row was left pinned above the buttons. space-between spends the
          same slack as two ordinary gaps: mark at the top, the week in the
          middle, the buttons where the thumb is. */}
      {/* The same four destinations the buttons below reach, reachable
          with the finger and from the edge each of them arrives from. */}
      <HomeSwipe onSwipe={handleSwipe} available={swipeDirections}>
        <View style={homeStyle.column}>
          {logoBlock}
          <WeekActivity state={state} />
          {mainButtons}
        </View>
      </HomeSwipe>
    </View>
  );
};

// A fifth of the screen for the mark itself; with the app name and the stroke
// line under it the whole block lands near the 40% Fedir asked for. The floor
// keeps it a logo rather than an icon on a short phone.
const LOGO_HEIGHT_SHARE = 0.2;
const MIN_LOGO_HEIGHT = 96;
const LOGO_SIDE_MARGIN = 20;

const homeStyle = StyleSheet.create({
  column: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10
  },
  // The one block that gives when the screen is short: it holds the logo and
  // two lines of text, and losing some of its breathing room is survivable in a
  // way an unreachable Settings button is not. Content-sized, because as
  // `flex: 1` it was the thing manufacturing the dead zones.
  logoView: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1
  },
  titleText: {
    fontSize: 35,
    fontWeight: "700"
  },
  // Sized by its contents, NOT flex: 1. It used to be flex: 1 twice over - the
  // same style on a wrapper and on the column inside it - so on a short phone
  // the buttons got exactly half the space left over and the last one was cut
  // off by the screen edge. Content-sized, they are all there and the logo
  // above absorbs the squeeze instead.
  buttonView: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 20,
    width: "100%",
    // and unfolded, the column stops rather than the buttons drifting apart
    maxWidth: LAYOUT.maxContentWidth
  }
});
