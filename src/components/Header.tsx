import React, { FC } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "./Button";
import { IconName } from "./Icon";
import { useAppContext } from "../context/AppContext";
import { RootStackNavigationModel } from "../models";

interface HeaderModel {
  // Only `goBack()` is used, but the real navigation type keeps a wrong object
  // from being passed in — it replaced an import through a raw
  // `node_modules/...` path (8.1.14).
  navigation?: RootStackNavigationModel;
  showBackButton?: boolean;
  title?: string;
  additionalChild?: React.ReactNode;
  additionalChildren?: React.ReactNode[];
  alignChildren?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
}

export const Header: FC<HeaderModel> = ({
  navigation,
  title,
  showBackButton,
  additionalChild,
  additionalChildren,
  alignChildren
}) => {
  const { theme } = useAppContext();
  const insets = useSafeAreaInsets();
  const handleBack = () => {
    navigation?.goBack();
  };

  const headerStyle = StyleSheet.create({
    view: {
      // Clear the device's top safe area (Android status-bar / camera cutouts,
      // iPhone notch/Dynamic Island) with the real inset instead of a fixed
      // guess, so the header never sits under the cutout.
      paddingTop: insets.top,
      height: 60 + insets.top,
      width: "100%",
      flexDirection: "row",
      justifyContent: alignChildren || "flex-end",
      alignItems: "center"
    },
    textView: {
      height: "100%",
      justifyContent: "center",
      marginHorizontal: 20,
      flex: 1
    },
    text: {
      fontSize: 18,
      fontWeight: "500",
      textTransform: "uppercase"
    }
  });

  return (
    <View style={headerStyle.view}>
      {showBackButton && navigation && (
        <IconButton onPress={handleBack} icon={IconName.back} />
      )}
      {title && (
        <View style={headerStyle.textView}>
          {title && (
            <Text
              style={{
                ...headerStyle.text,
                color: theme.colors.text
              }}
            >
              {title}
            </Text>
          )}
        </View>
      )}
      {additionalChild}
      {additionalChildren &&
        additionalChildren.map((child, i) => {
          return <View key={i}>{child}</View>;
        })}
    </View>
  );
};
