import React, { FC, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SCREEN, VERSION } from "../constants";
import { ScreenPropsModel } from "../models";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { Button } from "../components/Button";
import { Text } from "../components/Text";
import { writeFile } from "../utils/fileManager";
import { dateToString } from "../utils/formatDateTime";
import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";

// Dev-mode log viewer - was a MiniModal styled to fill the screen inside the
// About sub-menu, with its own hand-rolled back button in it. A full-height
// scrolling list is a screen; now it is one, reached from About. The read
// effect runs on mount and after a clear, NOT on every render: the old version
// listed `loggerText` among its own dependencies, so each read re-triggered
// itself for as long as the modal stayed open.
export const LogSettingsScreen: FC<ScreenPropsModel<SCREEN.settingsLog>> = ({
  navigation
}) => {
  const { state, t, theme } = useAppContext();
  const [loggerText, setLoggerText] = useState([] as string[]);

  useEffect(() => {
    logger
      .readAll()
      .then((lines) => {
        if (lines) {
          setLoggerText(lines.slice().reverse());
        }
      })
      .catch((err) => {
        logger.error(`Unable to load logs: ${err}`);
      });
  }, []);

  const logStyle = StyleSheet.create({
    scrollView: {
      width: "100%",
      paddingHorizontal: 20
    },
    linesView: {
      gap: 10
    },
    lineView: {
      ...theme.theme.rowView,
      ...theme.theme.fullWidth
    }
  });

  const handleExport = () => {
    const content = JSON.stringify(logger, null, " ");
    const fileName = `BBH_Log_${VERSION}_${dateToString(new Date().getTime())}.json`;
    writeFile(fileName, content, "application/json")
      .then((r) => {
        if (r) {
          logger.write(`Log exported`);
          toastShow(t("settsLogExported"), 1000);
        }
      })
      .catch((err) => {
        logger.error(`Error while exporting state. Error: ${err}`);
        toastShow(t("ErrorWhileWritingFile"), 1000);
      });
  };

  return (
    <SettingsSubScreen
      themeType={state.settings.theme}
      title={t("settsShowLogHeader")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView
        style={logStyle.scrollView}
        contentContainerStyle={theme.theme.scrollContent}
      >
        <Button title={t("settsExportLog")} onPress={handleExport} />
        <Button
          color="red"
          title={t("settsClearLog")}
          onPress={() => {
            logger.clearAll();
            setLoggerText([]);
          }}
        />
        <Text>{`Length: ${loggerText.length}`}</Text>
        <View style={logStyle.linesView}>
          {loggerText.map((string, i) => {
            const color = string.includes("[ERROR]") ? "textDanger" : "text";
            return (
              <View
                style={logStyle.lineView}
                key={`${string.substring(0, 10)}${i}`}
              >
                <Text color={color}>{string.substring(0, 20)}</Text>
                <Text color={color}>{string.substring(20)}</Text>
              </View>
            );
          })}
        </View>
        <Text>New beginning</Text>
      </ScrollView>
    </SettingsSubScreen>
  );
};
