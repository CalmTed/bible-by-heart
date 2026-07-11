import React, { LinearGradient } from "expo-linear-gradient";
import { FC } from "react";
import { View, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";

export const DotIndicator: FC<{
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}> = ({ top = 15, bottom = -15, left = -35, right = 35 }) => {
  const { theme } = useAppContext();
  const dotIndicatorStyle = StyleSheet.create({
    view: {
      width: 10,
      aspectRatio: 1,
      borderRadius: 100,
      overflow: "hidden",
      marginLeft: left,
      marginRight: right,
      marginTop: top,
      marginBottom: bottom
    },
    gradient: {
      height: "100%",
      width: "100%"
    }
  });

  return (
    <View style={dotIndicatorStyle.view}>
      <LinearGradient
        colors={[theme.colors.gradient1, theme.colors.gradient2]}
        start={{ x: 0.0, y: 0 }}
        end={{ x: 0.0, y: 1.0 }}
        locations={[0, 1]}
        style={dotIndicatorStyle.gradient}
      />
    </View>
  );
};
