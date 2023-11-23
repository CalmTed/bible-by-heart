import React, { FC } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {StyleSheet, View } from "react-native";
import { ThemeAndColorsModel } from "src/tools/getTheme";

interface SettingsMenuItemModel{
    isEnabled: boolean
    theme: ThemeAndColorsModel
}



export const Checkbox: FC<SettingsMenuItemModel> = (data) => {
    const checkboxStyles = StyleSheet.create({
    
        checkBoxWrapper: {
            height: 30,
            width: 55,
            borderRadius: 50,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: "#efe"
        },
        checkBoxGradient:  {
            width: "100%",
            padding: 3
        },  
        checkBoxCircle: {
            borderRadius: 50,
            height: "100%",
            aspectRatio: 1
        },
        bgText: {
            backgroundColor: data.theme.colors.text
        },
        bgSecond: {
            backgroundColor: data.theme.colors.bgSecond
        },
        ml50: {
          marginLeft: "50%"
        },
        ml0: {
          marginLeft: "0%"
        }
    });
    return <View
              style={{
                ...checkboxStyles.checkBoxWrapper
              }}
            >
              <LinearGradient
                colors={
                  data.isEnabled
                    ? [data.theme.colors.gradient2, data.theme.colors.gradient1]
                    : [
                        data.theme.colors.textSecond,
                        data.theme.colors.textSecond
                      ]
                }
                start={{ x: 0.0, y: 0 }}
                end={{ x: 0.0, y: 1.0 }}
                locations={[0, 1]}
                style={checkboxStyles.checkBoxGradient}
              >
                <View
                  style={{
                    ...checkboxStyles.checkBoxCircle,
                    ...(data.isEnabled
                      ? checkboxStyles.bgText
                      : checkboxStyles.bgSecond),
                    ...(data.isEnabled
                      ? checkboxStyles.ml50
                      : checkboxStyles.ml0)
                  }}
                />
              </LinearGradient>
            </View>
}