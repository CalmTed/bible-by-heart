import React, { FC } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ANIMATION, LAYOUT, SCREEN } from "../constants";
import { Text } from "../components/Text";
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { Entrance } from "../components/Entrance";
import { FinishCupSVG } from "../svg/finishCup";
import { ScreenPropsModel } from "../models";
import { useAppContext } from "../context/AppContext";

/**
 * The end of a training session (8.2.5 — the shell).
 *
 * What it says today is only "well done", but the shape is the one 8.5.2 needs:
 * a scrolling body between the device's top margin and a Continue button that
 * stays put. The screen used to be `justifyContent: center` with a `flex: 4`
 * hero over a `flex: 1` button, which could not host a summary at all — a list
 * of what was trained would have fought the cup for the same fixed share of the
 * screen. With nothing in the body yet, `flexGrow` + centring puts the cup
 * exactly where it was.
 *
 * What goes in the body is what the session actually did (8.5.2): which
 * passages, how long, what levelled up, what to repeat next — and NEVER an
 * error count, which is a product rule, not an oversight (ARCHITECTURE §2.2).
 */
export const FinishScreen: FC<ScreenPropsModel<SCREEN.testResults>> = ({
  navigation
}) => {
  const { t, theme } = useAppContext();

  return (
    <View
      style={{
        ...theme.theme.screen,
        ...theme.theme.view
      }}
    >
      {/* No bar of its own - but the top margin still comes from the device */}
      <Header />
      <ScrollView
        style={finishStyle.body}
        contentContainerStyle={finishStyle.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Entrance style={finishStyle.hero}>
          <FinishCupSVG />
          <Text style={finishStyle.titleText}>{t("titleWelldone")}</Text>
        </Entrance>
      </ScrollView>
      {/* Staggered behind the hero for the same reason the Header staggers
          behind its screen transition: the reward lands, then the way out */}
      <Entrance delayMs={ANIMATION.staggerMs} style={finishStyle.footer}>
        <Button
          type="main"
          title={t("Continue")}
          onPress={() => navigation.navigate(SCREEN.home)}
        />
      </Entrance>
    </View>
  );
};

const finishStyle = StyleSheet.create({
  body: {
    flex: 1,
    width: "100%"
  },
  bodyContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 20
  },
  hero: {
    width: "100%",
    maxWidth: LAYOUT.maxContentWidth,
    alignItems: "center",
    justifyContent: "center"
  },
  titleText: {
    fontSize: 35,
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center"
  },
  footer: {
    width: "100%",
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 20
  }
});
