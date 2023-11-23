import React, { FC, useState } from "react";
import {
  ToastAndroid,
  View,
  Text,
  StyleSheet
} from "react-native";
import * as Linking from "expo-linking";
import { Button, IconButton } from "../Button";
import { Input } from "../Input";
import { MiniModal } from "../miniModal";
import { SettingsMenuItem } from "../setttingsMenuItem";
import { DAY, VERSION } from "../../constants";
import { createAppState } from "../../initials";
import { WORD } from "../../l10n";
import { ActionName, AppStateModel } from "../../models";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";
import { IconName } from "../Icon";
import { readFile, writeFile } from "../../tools/fileManager";
import { convertState } from "../../tools/stateVersionConvert";
import { dateToString } from "../../tools/formatDateTime";

interface AboutSettingsListModel {
  theme: ThemeAndColorsModel;
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
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

  const settingsGroupStyle = StyleSheet.create({
    miniModal: {
      width: "100%"
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
    return (n * 17) % 9999
  }
  const devModeAnswer = encodeDevKey(devModeKey);

  const handleCheckDevPassword = (value: string) => {
    if (value === devModeAnswer.toString()) {
      setState(
        (st) =>
          reduce(st, {
            name: ActionName.setDevMode,
            payload: true
          }) || st
      );
    } else {
      setDevModeKey(getPassword());
      ToastAndroid.show("nope...", 1000);
    }
    setIsDevPasswordModalOpen(false);
  };
  const timeOfDevModeLeft = 
    state.settings.devModeActivationTime 
    ?  " " + Math.floor((
        state.settings.devModeActivationTime + DAY * 1000 - new Date().getTime()
      ) / (1000 * 60 * 60)
    ).toString() + t("hrs") 
    : ""
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
        {/* <SettingsMenuItem
          theme={theme}
          header={t("settsLabelAbout")}
          type="label"
        /> */}
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
            Linking.openURL(
              "https://ted9.xyz/pp/bible-by-heart-privacy-policy.html"
            );
          }}
        />
        <SettingsMenuItem
          theme={theme}
          header={t("settsDevMode")}
          subtext={
            t(state.settings.devModeEnabled ? "settsEnabled" : "settsDisabled") + 
            timeOfDevModeLeft
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
            } else if(state.settings.devModeActivationTime && state.settings.devModeActivationTime + DAY * 1000 > new Date().getTime()){
              setState(
                (st) =>
                  reduce(st, {
                    name: ActionName.setDevMode,
                    payload: value
                  }) || st
              )
            }else{
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
                ToastAndroid.show(`${encodeDevKey(parseInt(text, 10))}`, 1000);
              }}
              placeholder="1234"
              onChange={() => {}}
            />
          </View>
        )}

        {/* {state.settings.devMode && (
          <View>
            <SettingsMenuItem
              theme={theme}
              header={t("settsShowStateHeader")}
              subtext={t("settsShowStateSubtext")}
              type="action"
              actionCallBack={() => {
                setIsStateViewerModalOpen(true);
              }}
            />
            <MiniModal
              theme={theme}
              shown={isStateViewerModalOpen}
              handleClose={() => setIsStateViewerModalOpen(false)}
              style={settingsGroupStyle.devModeAppStateTextMiniModal}
            >
              <ScrollView
                style={settingsGroupStyle.devModeAppStateTextScrollView}
              >
                <TextInput
                  style={{
                    ...theme.theme.text,
                    ...settingsGroupStyle.devModeAppStateTextarea
                  }}
                  multiline={true}
                >
                  {JSON.stringify(state, null, "_ ")}
                </TextInput>
              </ScrollView>
            </MiniModal>
          </View>
        )} */}
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
                  if(r){
                    ToastAndroid.show(t("settsExported"),1000)
                  }
                } 
                ).catch(err => {
                  console.error(err)
                  ToastAndroid.show(t("ErrorWhileWritingFile"), 1000)
                })
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
                readFile([
                  "application/json"
                ])
                .then((r) =>{
                  if(!r){
                    ToastAndroid.show(t("ErrorWhileReadingFile"), 1000)
                    return;
                  }
                  switch(r.mimeType){
                    case "application/json":
                      const decodedData = JSON.parse(r.content.replace(/_ /g, " ")) as AppStateModel || undefined
                      if(!decodedData){
                        ToastAndroid.show(t("ErrorWhileDecoding"), 1000);
                        break;
                      }
                      console.log(decodedData.version)
                      if(!decodedData?.version){
                        ToastAndroid.show("Wrong version", 1000);
                        break;
                      }
                      const validData = decodedData?.version === VERSION ? decodedData : convertState(decodedData)
                      if(!validData){
                        ToastAndroid.show(`Unable to convert to current version ${decodedData.version}>${VERSION}`, 1000);
                        break;
                      }
                      ToastAndroid.show(`${t("settsImported")}`,1000)
                      setState(
                        () =>
                          validData
                      );
                      break; 
                    default: ToastAndroid.show(t("ErrorWhileDecoding"), 1000);
                  }
                })
                .catch(err => {
                  console.error(err)
                  ToastAndroid.show(t("ErrorWhileReadingFile"), 1000)
      
                })
                // const content = JSON.stringify(state, null, " ");
                // writeFile("BibleByHeartState.json", content, "application/json")
                // .then((r) => {
                //   if(r){
                //     ToastAndroid.show(t("settsImported"),1000)
                //   }
                // } 
                // ).catch(err => {
                //   console.error(err)
                //   ToastAndroid.show(t("ErrorWhileWritingFile"), 1000)
                // })
              }}
            />
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
                })
                ToastAndroid.show(t("settsCleared"), 1000)
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
                })
                ToastAndroid.show(t("settsCleared"), 1000)
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
      </MiniModal>
    </View>
  );
};
