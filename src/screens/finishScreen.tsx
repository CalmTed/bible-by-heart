import React, { FC } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SCREEN } from "../constants";
import { navigateWithState } from "../screeenManagement";
import { Button } from "../components/Button";
import { FinishCupSVG } from "../svg/finishCup";
import { ScreenModel } from "./homeScreen";
import { useApp } from "../tools/useApp";

export const FinishScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, t, theme } = useApp({ route, navigation });

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
          theme={theme}
          type="main"
          title={t("Continue")}
          onPress={() =>
            navigateWithState({
              navigation,
              screen: SCREEN.home,
              state: state
            })
          }
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
