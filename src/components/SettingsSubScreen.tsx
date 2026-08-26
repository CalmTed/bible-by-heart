import React, { FC } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { THEMETYPE } from "../constants";
import { useAppContext } from "../context/AppContext";
import { Header } from "./Header";
import { IconButton } from "./Button";
import { IconName } from "./Icon";

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
      <Header
        showBackButton={false}
        alignChildren="flex-start"
        additionalChild={
          <View style={settingsSubScreenStyle.headerRow}>
            <IconButton
              icon={IconName.back}
              onPress={onBack}
              color={theme.colors.text}
            />
            <Text
              style={{ ...theme.theme.headerText, ...theme.theme.flexOne }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {headerRight}
          </View>
        }
      />
      {children}
      <StatusBar style={themeType === THEMETYPE.light ? "dark" : "light"} />
    </View>
  );
};

const settingsSubScreenStyle = StyleSheet.create({
  headerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
  }
});
