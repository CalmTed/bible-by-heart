import React, { FC } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { THEMETYPE } from "../constants";
import { useAppContext } from "../context/AppContext";
import { Header } from "./Header";

interface SettingsSubScreenModel {
  themeType: THEMETYPE;
  title: string;
  onBack: () => void;
  // Optional element rendered at the right edge of the header (e.g. an add button).
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
}

// Shared shell for every settings sub-menu screen. Replaces the old MiniModal
// wrapper the settings sub-lists used to render inside, so drilling into a
// sub-menu is now a normal stack push instead of a modal slide.
export const SettingsSubScreen: FC<SettingsSubScreenModel> = ({
  themeType,
  title,
  onBack,
  headerRight,
  children
}) => {
  const { theme } = useAppContext();
  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      <Header title={title} onBack={onBack} right={headerRight} />
      {children}
      <StatusBar style={themeType === THEMETYPE.light ? "dark" : "light"} />
    </View>
  );
};
