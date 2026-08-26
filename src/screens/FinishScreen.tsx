import React, { FC } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SCREEN } from "../constants";
import { Button } from "../components/Button";
import { FinishCupSVG } from "../svg/finishCup";
import { ScreenPropsModel } from "../models";
import { useAppContext } from "../context/AppContext";

export const FinishScreen: FC<ScreenPropsModel<SCREEN.testResults>> = ({
  navigation
}) => {
  const { t, theme } = useAppContext();

  return (
    <View
      style={{
        ...theme.theme.screen,
        ...theme.theme.view,
        ...finishStyle.screen
      }}
    >
      <View style={finishStyle.logoView}>
        <FinishCupSVG />
        <Text style={{ ...theme.theme.text, ...finishStyle.titleText }}>
          {t("titleWelldone")}
        </Text>
      </View>
      <View style={finishStyle.buttonView}>
        <Button
          type="main"
          title={t("Continue")}
          onPress={() => navigation.navigate(SCREEN.home)}
        />
      </View>
    </View>
  );
};

const finishStyle = StyleSheet.create({
  screen: {
    justifyContent: "center",
    height: "100%"
  },
  logoView: {
    alignItems: "center",
    justifyContent: "center",
    flex: 4
  },
  titleText: {
    fontSize: 35,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  buttonView: {
    flex: 1,
    alignItems: "center"
  }
});
