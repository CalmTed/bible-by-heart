import React, { FC, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import * as Linking from "expo-linking";
import { Button, IconButton } from "../Button";
import { Input } from "../Input";
import { MiniModal } from "../miniModal";
import { SettingsMenuItem } from "../setttingsMenuItem";
import {
  ACCESS_TOKEN_NAME,
  DAY,
  PRIVACY_POLICY_LINK,
  REFRESH_TOKEN_NAME,
  TERMS_OF_SERVICE_LINK,
  VERSION
} from "../../constants";
import { createAppState } from "../../initials";
import { WORD } from "../../l10n";
import { ActionName, AppStateModel } from "../../models";
import { ThemeAndColorsModel } from "../../utils/getThemeFromScheme";
import { reduce } from "../../utils/reduce";
import { IconName } from "../Icon";
import { readFile, writeFile } from "../../utils/fileManager";
import { convertState } from "../../utils/stateVersionConvert";
import { dateToString } from "../../utils/formatDateTime";
import toastShow from "../../utils/toastShow";
import { StackNavigationHelpers } from "node_modules/@react-navigation/stack/lib/typescript/src/types";
import * as SecureStore from "expo-secure-store";
import { logger } from "../../utils/logger";

interface AboutSettingsListModel {
  theme: ThemeAndColorsModel;
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
  navigation: StackNavigationHelpers;
  t: (w: WORD) => string;
}

export const AboutSettingsList: FC<AboutSettingsListModel> = ({
  theme,
  state,
  t,
  setState
}) => {
  const [isDevPasswordModalOpen, setIsDevPasswordModalOpen] = useState(false);
  const [isAboutModalShown, setIsAboutModalShown] = useState(false);
  const [isAboutTextModalShown, setIsAboutTextModalShown] = useState(false);
  const [isLegalModalShown, setIsLegalModalShown] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [loggerText, setLoggerText] = useState([] as string[]);

  useEffect(() => {
    if (state.settings.devModeEnabled) {
      logger
        .readAll()
        .then((loggerText) => {
          if (loggerText) {
            setLoggerText(loggerText.slice().reverse());
          }
        })
        .catch((err) => {
          console.error("Unable to load logs", err);
        });
    }
  }, [state.settings.devModeEnabled, loggerText, setLoggerText, logModalOpen]);

  const settingsGroupStyle = StyleSheet.create({
    miniModal: {
      width: "100%",
      height: "100%",
      paddingTop: 50
    },
    miniModalContent: {
      height: 60,
      flexWrap: "nowrap",
      flexDirection: "row",
      width: "100%",
      alignItems: "center"
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
    },
    devModeAppStateTextMiniModal: {
      width: "100%"
    },
    devModeAppStateTextScrollView: {
      width: "100%"
    },
    devModeAppStateTextarea: {
      width: "100%"
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
    <View>
      <SettingsMenuItem
        theme={theme}
        type="action"
        header={t("settsAboutHeader")}
        subtext=""
        actionCallBack={() => {
          setIsAboutModalShown(true);
        }}
      />
      <MiniModal
        theme={theme}
        shown={isAboutModalShown}
        handleClose={() => setIsAboutModalShown(false)}
        style={settingsGroupStyle.miniModal}
      >
        <View style={settingsGroupStyle.miniModalContent}>
          <IconButton
            theme={theme}
            icon={IconName.back}
            onPress={() => setIsAboutModalShown(false)}
          />
          <Text style={theme.theme.headerText}>{t("settsAboutHeader")}</Text>
        </View>
        <ScrollView>
          <SettingsMenuItem
            theme={theme}
            type="action"
            header={t("settsAboutHeader")}
            subtext={`${t("settsAboutSubtext")}: ${VERSION}`}
            actionCallBack={() => {
              setIsAboutTextModalShown(true);
            }}
          />
          <MiniModal
            theme={theme}
            shown={isAboutTextModalShown}
            handleClose={() => setIsAboutTextModalShown(false)}
          >
            <Text style={theme.theme.headerText}>{t("AboutHeader")}</Text>
            <Text style={theme.theme.text}>{t("AboutText")}</Text>
            <Text style={theme.theme.text}>
              {t("version")}: {VERSION}
            </Text>
            <Button
              theme={theme}
              title={t("Close")}
              onPress={() => setIsAboutTextModalShown(false)}
            />
          </MiniModal>
          <SettingsMenuItem
            theme={theme}
            type="action"
            header={t("settsLegalHeader")}
            subtext={t("settsLegalSubtext")}
            actionCallBack={() => {
              setIsLegalModalShown(true);
            }}
          />
          <MiniModal
            theme={theme}
            shown={isLegalModalShown}
            handleClose={() => setIsLegalModalShown(false)}
          >
            <Text style={theme.theme.headerText}>{t("LegalHeader")}</Text>
            <Text style={theme.theme.text}>{t("LegalText")}</Text>
            <Text style={theme.theme.text}>{t("LegalText2")}</Text>
            <Button
              theme={theme}
              title={t("Close")}
              onPress={() => setIsLegalModalShown(false)}
            />
          </MiniModal>
          <SettingsMenuItem
            theme={theme}
            type="action"
            header={t("settsPrivacyPolicyHeader")}
            subtext={t("OpenExternalLink")}
            actionCallBack={() => {
              Linking.openURL(PRIVACY_POLICY_LINK);
            }}
          />
          <SettingsMenuItem
            theme={theme}
            type="action"
            header={t("settsTermsOfServiceHeader")}
            subtext={t("OpenExternalLink")}
            actionCallBack={() => {
              Linking.openURL(TERMS_OF_SERVICE_LINK);
            }}
          />
          <SettingsMenuItem
            theme={theme}
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
            theme={theme}
            shown={isDevPasswordModalOpen}
            handleClose={() => setIsDevPasswordModalOpen(false)}
          >
            <Text style={settingsGroupStyle.miniModalDevPasswordHeader}>
              {t("settsDevPasswordHeader")}: {devModeKey}
            </Text>
            <Input
              theme={theme}
              placeholder={t("settsDevPasswordPlaceholder")}
              onChange={() => {}}
              onSubmit={handleCheckDevPassword}
              inputMode="numeric"
            />
          </MiniModal>
          {/* DEV MODE SETTINGS */}
          {state.settings.devModeEnabled && (
            <View style={settingsGroupStyle.devModeView}>
              <Text style={settingsGroupStyle.devModeHeader}>
                {t("settsGetDevAnswer")}:
              </Text>
              <Input
                inputMode="numeric"
                theme={theme}
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
                theme={theme}
                header={t("settsShowLogHeader")}
                subtext={t("settsShowLogSubtext")}
                type="action"
                actionCallBack={() => {
                  setLogModalOpen(true);
                }}
              />
              <MiniModal
                theme={theme}
                shown={logModalOpen}
                handleClose={() => setLogModalOpen(false)}
                style={{
                  ...settingsGroupStyle.devModeAppStateTextMiniModal,
                  flexGrow: 1,
                  paddingTop: 50
                }}
              >
                <ScrollView
                  style={{
                    width: "100%"
                  }}
                >
                  <Button
                    icon={IconName.back}
                    iconAlign="left"
                    title={t("Cancel")}
                    onPress={() => setLogModalOpen(false)}
                    theme={theme}
                  />
                  <Button
                    title={t("settsExportLog")}
                    onPress={() => {
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
                          logger.error(
                            `Error while exporting state. Error: ${err}`
                          );
                          toastShow(t("ErrorWhileWritingFile"), 1000);
                        });
                    }}
                    theme={theme}
                  />
                  <Button
                    color="red"
                    title={t("settsClearLog")}
                    onPress={() => {
                      logger.clearAll();
                      setLoggerText([]);
                    }}
                    theme={theme}
                  />
                  <Text
                    style={{ ...theme.theme.text }}
                  >{`Length: ${loggerText.length}`}</Text>
                  <View style={{ gap: 10 }}>
                    {loggerText.map((string, i) => {
                      return (
                        <View
                          style={{
                            ...theme.theme.rowView,
                            ...theme.theme.fullWidth
                          }}
                          key={`${string.substring(0, 10)}${i}`}
                        >
                          <Text
                            style={{
                              ...theme.theme.text,
                              color: string.includes("[ERROR]")
                                ? theme.colors.textDanger
                                : theme.colors.text
                            }}
                          >
                            {string.substring(0, 20)}
                          </Text>
                          <Text
                            style={{
                              ...theme.theme.text,
                              color: string.includes("[ERROR]")
                                ? theme.colors.textDanger
                                : theme.colors.text
                            }}
                          >
                            {string.substring(20)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  {/* <Text
                    style={{
                      ...theme.theme.text,
                      ...settingsGroupStyle.devModeAppStateTextarea
                    }}
                  >
                    {loggerText}
                  </Text> */}
                </ScrollView>
              </MiniModal>
            </View>
          )}
          {state.settings.devModeEnabled && (
            <View>
              <SettingsMenuItem
                theme={theme}
                type="action"
                subtext={t("settsExportStateSubtext")}
                header={t("settsExportStateHeader")}
                actionCallBack={() => {
                  const content = JSON.stringify(state, null, " ");
                  const fileName = `BibleByHeartState_${VERSION}_${dateToString(new Date().getTime())}.json`;
                  writeFile(fileName, content, "application/json")
                    .then((r) => {
                      if (r) {
                        logger.write(`State exported`);
                        toastShow(t("settsExported"), 1000);
                      }
                    })
                    .catch((err) => {
                      logger.error(
                        `Error while exporting state. Error: ${err}`
                      );
                      toastShow(t("ErrorWhileWritingFile"), 1000);
                    });
                }}
              />
            </View>
          )}
          {state.settings.devModeEnabled && (
            <View>
              <SettingsMenuItem
                theme={theme}
                type="action"
                subtext={t("settsImportStateSubtext")}
                header={t("settsImportStateHeader")}
                actionCallBack={() => {
                  readFile(["application/json"])
                    .then((r) => {
                      if (!r) {
                        logger.error(`Cant read file`);
                        toastShow(t("ErrorWhileReadingFile"), 1000);
                        return;
                      }
                      switch (r.mimeType) {
                        case "application/json":
                          const decodedData =
                            (JSON.parse(
                              r.content.replace(/_ /g, " ")
                            ) as AppStateModel) || undefined;
                          if (!decodedData) {
                            logger.error(
                              `Unable to decode imported state file`
                            );
                            toastShow(t("ErrorWhileDecoding"), 1000);
                            break;
                          }
                          if (!decodedData?.version) {
                            logger.error(`Impored state version in undefined`);
                            toastShow("Wrong version", 1000);
                            break;
                          }
                          const validData =
                            decodedData?.version === VERSION
                              ? decodedData
                              : convertState(decodedData);
                          if (!validData) {
                            logger.error(
                              `Cant convert from version: ${decodedData?.version} to version: ${VERSION}`
                            );
                            toastShow(
                              `Unable to convert to current version ${decodedData.version}>${VERSION}`,
                              1000
                            );
                            break;
                          }
                          logger.write(`State imported`);
                          toastShow(`${t("settsImported")}`, 1000);
                          setState(() => validData);
                          break;
                        default:
                          toastShow(t("ErrorWhileDecoding"), 1000);
                      }
                    })
                    .catch((err) => {
                      logger.error(
                        `Error while importing state. Error: ${err}`
                      );
                      toastShow(t("ErrorWhileReadingFile"), 1000);
                    });
                }}
              />
              <SettingsMenuItem
                theme={theme}
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
                theme={theme}
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
                theme={theme}
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
          {/* <View style={settingsStyle.groupView}>
        <Button type="outline" color="gray" title={t("settingsExport")} onPress={() => handleExportData(state)} />
        <Input style={settingsStyle.textarea} placeholder="" value={exportedText} multiline numberOfLines={1} disabled={false} onChange={()=>{setExportedText(exportedText)}} onSubmit={() => {}}/>
      </View>
      <View style={settingsStyle.groupView}>
        <Button type="outline" color="gray" title={t("settingsImport")} onPress={() => handleImportData(importedText)} disabled={!importedText.length} />
        <Input style={settingsStyle.textarea} value={importedText} multiline numberOfLines={1} onChange={(newVal) => setImportedText(newVal)} onSubmit={(newVal) => handleImportData(newVal)} placeholder="" />
      </View> */}
        </ScrollView>
      </MiniModal>
    </View>
  );
};
