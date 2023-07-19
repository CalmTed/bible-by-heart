import React, { FC, useState } from "react";
import { ToastAndroid, View, Text, ScrollView, TextInput } from "react-native";
import * as Linking from "expo-linking";
import { Button } from "../Button";
import { Input } from "../Input";
import { MiniModal } from "../miniModal";
import { SettingsMenuItem } from "../setttingsMenuItem";
import { VERSION } from "../../constants";
import { createAppState } from "../../initials";
import { WORD } from "../../l10n";
import { ActionName, AppStateModel } from "../../models";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";

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
  const [isLegalModalShown, setIsLegalModalShown] = useState(false);
  const [isStateViewerModalOpen, setIsStateViewerModalOpen] = useState(false);

  const getPassword = () => {
    return Math.round(Math.random() * 10000);
  };
  const [devModeKey, setDevModeKey] = useState(getPassword());
  const devModeAnswer = (devModeKey * 2) % 9;

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

  // const handleExportData: (state: AppStateModel) => void  = (state) => {
  //   if(!exportedText.length){
  //     const exortingObject:exportingModel = {
  //       version: VERSION,
  //       passages: state.passages
  //     }
  //     setExportedText(JSON.stringify(exortingObject, null,undefined))
  //   }else{
  //     setExportedText("")
  //   }
  // }
  // const handleImportData: (stateString: string) => void = (stateString) => {
  //   try{
  //     //validate json
  //     const importedData:exportingModel = JSON.parse(stateString)
  //     //validate version
  //     if(alowedStateVersions.includes(importedData.version)){
  //       //setState
  //       setState(prv =>
  //         reduce(prv, {
  //           name: ActionName.setPassagesList,
  //           payload: importedData.passages
  //         }) || prv
  //       )
  //       ToastAndroid.show("Imported!", 100)
  //     }else{
  //       ToastAndroid.show(`Wrong version: ${importedData.version}, allowed: ${alowedStateVersions.join(", ")}`, 100)
  //     }
  //   }catch(e){
  //     ToastAndroid.show("Unable to parce data", 100)
  //   }
  // }
  return (
    <View>
      <SettingsMenuItem
        theme={theme}
        header={t("settsLabelAbout")}
        type="label"
      />
      <SettingsMenuItem
        theme={theme}
        type="action"
        header={t("settsAboutHeader")}
        subtext={`${t("settsAboutSubtext")}: ${VERSION}`}
        actionCallBack={() => {
          setIsAboutModalShown(true);
        }}
      />
      <MiniModal
        theme={theme}
        shown={isAboutModalShown}
        handleClose={() => setIsAboutModalShown(false)}
      >
        <Text style={theme.theme.headerText}>{t("AboutHeader")}</Text>
        <Text style={theme.theme.text}>{t("AboutText")}</Text>
        <Text style={theme.theme.text}>
          {t("version")}: {VERSION}
        </Text>
        <Button
          theme={theme}
          title={t("Close")}
          onPress={() => setIsAboutModalShown(false)}
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
        subtext={t(state.settings.devMode ? "settsEnabled" : "settsDisabled")}
        type="checkbox"
        checkBoxState={state.settings.devMode}
        onClick={(value) => {
          if (!value) {
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
        <Text style={{ color: theme.colors.text, fontSize: 16 }}>
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
      {state.settings.devMode && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap"
          }}
        >
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 16
            }}
          >
            {t("settsGetDevAnswer")}:
          </Text>
          <Input
            inputMode="numeric"
            theme={theme}
            onSubmit={(text) => {
              ToastAndroid.show(`${(parseInt(text, 10) * 2) % 9}`, 1000);
            }}
            placeholder="1234"
            onChange={() => {}}
          />
        </View>
      )}
      {state.settings.devMode && (
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
            style={{ width: "100%" }}
          >
            <ScrollView style={{ width: "100%" }}>
              {/* native input for ability to copy */}
              <TextInput
                style={{
                  ...theme.theme.text,
                  width: "100%"
                }}
                multiline={true}
              >
                {JSON.stringify(state, null, "_ ")}
              </TextInput>
            </ScrollView>
          </MiniModal>
        </View>
      )}
      {state.settings.devMode && (
        <View>
          <SettingsMenuItem
            theme={theme}
            type="action"
            subtext={t("settsOneWayDoor")}
            header={t("settsClearHistory")}
            actionCallBack={() =>
              setState((prv) => {
                return { ...prv, testsHistory: [] };
              })
            }
          />
          <SettingsMenuItem
            theme={theme}
            type="action"
            subtext={t("settsOneWayDoor")}
            header={t("settsClearPassages")}
            actionCallBack={() =>
              setState((prv) => {
                return { ...prv, passages: [] };
              })
            }
          />
          <SettingsMenuItem
            theme={theme}
            type="action"
            subtext={t("settsOneWayDoor")}
            header={t("settsClearData")}
            actionCallBack={() =>
              setState(() => {
                return createAppState();
              })
            }
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
    </View>
  );
};
