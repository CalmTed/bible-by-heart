import React, { FC, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { SettingsMenuItem } from "../components/SettingsMenuItem";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { MiniModal } from "../components/MiniModal";
import {
  ACCESS_TOKEN_NAME,
  DAY,
  PRIVACY_POLICY_LINK,
  REFRESH_TOKEN_NAME,
  SCREEN,
  TERMS_OF_SERVICE_LINK,
  VERSION
} from "../constants";
import { createAppState } from "../initials";
import { ActionName, ScreenPropsModel } from "../models";
import { reduce } from "../utils/reduce";
import { exportBackupFile, importBackupFile } from "../utils/backupFile";
import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";

// About / dev settings — was a MiniModal rendered inline in the settings list.
// Now a stack screen reached from settingsScreen. The small info / dev-password
// popups inside stay MiniModals (they are dialogs, not sub-menus); the log
// viewer, which filled the screen, became its own screen in 8.2.2.
export const AboutSettingsScreen: FC<
  ScreenPropsModel<SCREEN.settingsAbout>
> = ({ navigation }) => {
  const { state, setState, t, theme } = useAppContext();

  const [isDevPasswordModalOpen, setIsDevPasswordModalOpen] = useState(false);
  const [isAboutTextModalShown, setIsAboutTextModalShown] = useState(false);
  const [isLegalModalShown, setIsLegalModalShown] = useState(false);
  const aboutSettingsStyle = StyleSheet.create({
    scrollView: {
      width: "100%",
      paddingHorizontal: 20
    },
    miniModalDevPasswordHeader: {
      color: theme.colors.text,
      fontSize: 16
    },
    devModeView: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    },
    devModeHeader: {
      color: theme.colors.text,
      fontSize: 16
    }
  });

  const getPassword = () => {
    return Math.round(Math.random() * 10000);
  };
  const [devModeKey, setDevModeKey] = useState(getPassword());
  const encodeDevKey: (n: number) => number = (n) => {
    return (n * 17) % 9999;
  };
  const devModeAnswer = encodeDevKey(devModeKey);

  const handleCheckDevPassword = (value: string) => {
    if (value === devModeAnswer.toString()) {
      logger.error(`Entered right dev mode password`);
      setState(
        (st) =>
          reduce(st, {
            name: ActionName.setDevMode,
            payload: true
          }) || st
      );
    } else {
      setDevModeKey(getPassword());
      logger.error(`Entered wrong dev mode password`);
      toastShow("nope...", 1000);
    }
    setIsDevPasswordModalOpen(false);
  };
  const timeOfDevModeLeft = state.settings.devModeActivationTime
    ? " " +
      Math.floor(
        (state.settings.devModeActivationTime +
          DAY * 1000 -
          new Date().getTime()) /
          (1000 * 60 * 60)
      ).toString() +
      t("hrs")
    : "";

  return (
    <SettingsSubScreen
      themeType={state.settings.theme}
      title={t("settsAboutHeader")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView style={aboutSettingsStyle.scrollView}>
        <SettingsMenuItem
          type="action"
          header={t("settsAboutHeader")}
          subtext={`${t("settsAboutSubtext")}: ${VERSION}`}
          actionCallBack={() => {
            setIsAboutTextModalShown(true);
          }}
        />
        <MiniModal
          shown={isAboutTextModalShown}
          handleClose={() => setIsAboutTextModalShown(false)}
        >
          <Text style={theme.theme.headerText}>{t("AboutHeader")}</Text>
          <Text style={theme.theme.text}>{t("AboutText")}</Text>
          <Text style={theme.theme.text}>
            {t("version")}: {VERSION}
          </Text>
          <Button
            title={t("Close")}
            onPress={() => setIsAboutTextModalShown(false)}
          />
        </MiniModal>
        <SettingsMenuItem
          type="action"
          header={t("settsLegalHeader")}
          subtext={t("settsLegalSubtext")}
          actionCallBack={() => {
            setIsLegalModalShown(true);
          }}
        />
        <MiniModal
          shown={isLegalModalShown}
          handleClose={() => setIsLegalModalShown(false)}
        >
          <Text style={theme.theme.headerText}>{t("LegalHeader")}</Text>
          <Text style={theme.theme.text}>{t("LegalText")}</Text>
          <Text style={theme.theme.text}>{t("LegalText2")}</Text>
          <Button
            title={t("Close")}
            onPress={() => setIsLegalModalShown(false)}
          />
        </MiniModal>
        <SettingsMenuItem
          type="action"
          header={t("settsPrivacyPolicyHeader")}
          subtext={t("OpenExternalLink")}
          actionCallBack={() => {
            Linking.openURL(PRIVACY_POLICY_LINK);
          }}
        />
        <SettingsMenuItem
          type="action"
          header={t("settsTermsOfServiceHeader")}
          subtext={t("OpenExternalLink")}
          actionCallBack={() => {
            Linking.openURL(TERMS_OF_SERVICE_LINK);
          }}
        />
        <SettingsMenuItem
          header={t("settsDevMode")}
          subtext={
            t(
              state.settings.devModeEnabled ? "settsEnabled" : "settsDisabled"
            ) + timeOfDevModeLeft
          }
          type="checkbox"
          checkBoxState={state.settings.devModeEnabled}
          onClick={(value) => {
            if (!value) {
              setState(
                (st) =>
                  reduce(st, {
                    name: ActionName.setDevMode,
                    payload: value
                  }) || st
              );
            } else if (
              state.settings.devModeActivationTime &&
              state.settings.devModeActivationTime + DAY * 1000 >
                new Date().getTime()
            ) {
              setState(
                (st) =>
                  reduce(st, {
                    name: ActionName.setDevMode,
                    payload: value
                  }) || st
              );
            } else {
              setIsDevPasswordModalOpen(true);
            }
          }}
        />
        <MiniModal
          shown={isDevPasswordModalOpen}
          handleClose={() => setIsDevPasswordModalOpen(false)}
        >
          <Text style={aboutSettingsStyle.miniModalDevPasswordHeader}>
            {t("settsDevPasswordHeader")}: {devModeKey}
          </Text>
          <Input
            placeholder={t("settsDevPasswordPlaceholder")}
            onChange={() => {}}
            onSubmit={handleCheckDevPassword}
            inputMode="numeric"
          />
        </MiniModal>
        {/* DEV MODE SETTINGS */}
        {state.settings.devModeEnabled && (
          <View style={aboutSettingsStyle.devModeView}>
            <Text style={aboutSettingsStyle.devModeHeader}>
              {t("settsGetDevAnswer")}:
            </Text>
            <Input
              inputMode="numeric"
              onSubmit={(text) => {
                logger.write(
                  `Requested dev key for number: ${text} is ${encodeDevKey(parseInt(text, 10))}`
                );
                toastShow(`${encodeDevKey(parseInt(text, 10))}`, 1000);
              }}
              placeholder="1234"
              onChange={() => {}}
            />
          </View>
        )}
        {state.settings.devModeEnabled && (
          <View>
            <SettingsMenuItem
              header={t("settsShowLogHeader")}
              subtext={t("settsShowLogSubtext")}
              type="action"
              actionCallBack={() => {
                navigation.navigate(SCREEN.settingsLog);
              }}
            />
          </View>
        )}
        {state.settings.devModeEnabled && (
          <View>
            <SettingsMenuItem
              type="action"
              subtext={t("settsExportStateSubtext")}
              header={t("settsExportStateHeader")}
              // Same file format as the user-facing backup rows in List
              // settings (8.1.9) - one writer, so a dev export can be restored
              // by an ordinary user and vice versa.
              actionCallBack={() => {
                exportBackupFile(state, t);
              }}
            />
          </View>
        )}
        {state.settings.devModeEnabled && (
          <View>
            <SettingsMenuItem
              type="action"
              subtext={t("settsImportStateSubtext")}
              header={t("settsImportStateHeader")}
              // Stays unconfirmed on purpose: this row only exists behind dev
              // mode. The confirmed, user-facing restore lives in List settings.
              actionCallBack={() => {
                importBackupFile(t).then((restored) => {
                  if (!restored) {
                    return;
                  }
                  logger.write(`State imported`);
                  toastShow(`${t("settsImported")}`, 1000);
                  setState(restored);
                });
              }}
            />
            <SettingsMenuItem
              type="action"
              subtext=""
              header={t("settsResetLocalUserData")}
              actionCallBack={async () => {
                const newState = reduce(state, {
                  name: ActionName.resetUserData
                });
                if (newState === null) {
                  return logger.error(
                    `Unknown error: Unable to reset user data`
                  );
                }
                logger.write("[DEV] cleared local user data");
                setState(newState);
                await SecureStore.deleteItemAsync(ACCESS_TOKEN_NAME);
                await SecureStore.deleteItemAsync(REFRESH_TOKEN_NAME);
              }}
            ></SettingsMenuItem>
          </View>
        )}
        {state.settings.devModeEnabled && (
          <View>
            <SettingsMenuItem
              type="action"
              subtext={t("settsOneWayDoor")}
              header={t("settsClearPassages")}
              actionCallBack={() => {
                setState((prv) => {
                  return { ...prv, passages: [], testsHistory: [] };
                });
                logger.write("[DEV] cleared passages");
                toastShow(t("settsCleared"), 1000);
              }}
            />
            <SettingsMenuItem
              type="action"
              subtext={t("settsOneWayDoor")}
              header={t("settsClearData")}
              actionCallBack={() => {
                setState(() => {
                  return createAppState();
                });
                logger.write("[DEV] cleared state");
                toastShow(t("settsCleared"), 1000);
              }}
            />
          </View>
        )}
      </ScrollView>
    </SettingsSubScreen>
  );
};
