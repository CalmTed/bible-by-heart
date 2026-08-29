import React, { FC, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { SettingsMenuItem } from "../components/SettingsMenuItem";
import { ARCHIVED_NAME, SCREEN } from "../constants";
import { ActionName, ScreenPropsModel } from "../models";
import {
  ParsedBackupModel,
  exportBackupFile,
  importBackupFile
} from "../utils/backupFile";
import { BackupRestoreModal } from "../components/BackupRestoreModal";
import { reduce } from "../utils/reduce";
import {
  LSVToArray,
  arrayToPassages,
  passagesToLSV
} from "../utils/handlePassageExport";
import { writeFile, readFile } from "../utils/fileManager";
import { schedulePushNotification } from "../utils/notifications";
import { dateToString } from "../utils/formatDateTime";
import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";

// List settings — was a MiniModal rendered inline in the settings list. Now a
// stack screen reached from settingsScreen.
export const ListSettingsScreen: FC<ScreenPropsModel<SCREEN.settingsList>> = ({
  navigation
}) => {
  const { state, setState, t, theme } = useAppContext();
  // Decoded and already converted forward, but NOT applied: the state swap
  // waits behind the confirmation, so the counts shown in it describe the file
  // the user actually picked.
  const [pendingRestore, setPendingRestore] =
    useState<ParsedBackupModel | null>(null);

  const allTags = [
    ARCHIVED_NAME,
    ...state.passages.map((p) => p.tags).flat()
  ].filter((v, i, arr) => !arr.slice(0, i).includes(v)); //get unique tags

  return (
    <SettingsSubScreen
      themeType={state.settings.theme}
      title={t("settsLabelList")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView
        style={listSettingsStyle.scrollView}
        contentContainerStyle={theme.theme.scrollContent}
      >
        <SettingsMenuItem
          header={t("settsLeftSwipeTag")}
          subtext={`"${
            state.settings.leftSwipeTag === ARCHIVED_NAME
              ? t(ARCHIVED_NAME)
              : state.settings.leftSwipeTag
          }"`}
          type="select"
          options={allTags.map((v) => {
            return {
              value: v,
              label: v === ARCHIVED_NAME ? t(v) : v
            };
          })}
          selectedIndex={allTags.indexOf(state.settings.leftSwipeTag)}
          onSelect={(value) => {
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setLeftSwipeTag,
                  payload: value
                }) || st
            );
          }}
        />
        <SettingsMenuItem
          type="action"
          header={t("settsTranslationsListHeader")}
          subtext={t("settsTranslationsListSubtext")}
          actionCallBack={() =>
            navigation.navigate(SCREEN.settingsTranslations)
          }
        />
        <SettingsMenuItem
          type="action"
          header={t("settingsExportPassages")}
          subtext={t("settsExportPassagesSubtext")}
          disabled={!state.passages.length}
          actionCallBack={() => {
            const content = passagesToLSV(state); //line separated values
            if (!content) {
              logger.error(`Error while encoding passages`);
              toastShow(t("ErrorWhileEncoding"), 1000);
              return;
            }
            const fileName = `BibleByHeartPassages_${dateToString(new Date().getTime())}.txt`;
            writeFile(fileName, content, "text/plain")
              .then((r) => {
                if (r) {
                  logger.write(`Passages exported`);
                  toastShow(t("settsExported"), 1000);
                }
              })
              .catch((err) => {
                logger.error(`Error while writing file. Error: ${err}`);
                toastShow(t("ErrorWhileWritingFile"), 1000);
              });
          }}
        />
        <SettingsMenuItem
          type="action"
          header={t("settingsImportPassages")}
          subtext={t("settsImportPassagesSubtext")}
          actionCallBack={() => {
            readFile(["text/plain"])
              .then((r) => {
                if (!r) {
                  logger.error(`Error while reading passages file`);
                  toastShow(t("ErrorWhileReadingFile"), 1000);
                  return;
                }
                switch (r.mimeType) {
                  case "text/plain":
                    const decodedData = LSVToArray(r.content);
                    if (!decodedData) {
                      logger.error(`Error while decoding passages`);
                      toastShow(t("ErrorWhileDecoding"), 1000);
                      break;
                    }
                    const convertedData = arrayToPassages(decodedData, state);
                    if (!convertedData) {
                      logger.error(`Error while converting decoded passages`);
                      toastShow(t("ErrorWhileDecoding"), 1000);
                      break;
                    }
                    const { passages, invalidIndexes, conflictedIndexes } =
                      convertedData;
                    if (invalidIndexes.length || conflictedIndexes.length) {
                      const errorDataString = `${invalidIndexes.length ? t("ErrorInvalidIndexes") + ": " + invalidIndexes.join(",") : ""} \n ${conflictedIndexes.length ? t("ErrorConflictedIndexes") + ": " + conflictedIndexes.join(",") : ""}`;
                      if (state.settings.remindersEnabled) {
                        schedulePushNotification(
                          t("ErrorWhileDecoding"),
                          errorDataString,
                          {}
                        );
                      } else {
                        logger.error(
                          `Error while schedoling notification on import`
                        );
                        toastShow(t("ErrorTurnOnRemindersOnImport"), 1000);
                      }
                    }
                    logger.write(`Passages imported`);
                    toastShow(
                      `${t("settsImportedVerses")}: ${passages.length}`,
                      1000
                    );
                    setState(
                      (st) =>
                        reduce(st, {
                          name: ActionName.importPassages,
                          payload: {
                            passages
                          }
                        }) || st
                    );
                    break;
                  default:
                    logger.error(
                      `Error while decoding file. Unknown type: ${r.mimeType}`
                    );
                    toastShow(t("ErrorWhileDecoding"), 1000);
                }
              })
              .catch((err) => {
                logger.error(`Error while reading file. Error: ${err}`);
                toastShow(t("ErrorWhileReadingFile"), 1000);
              });
          }}
        />
        <SettingsMenuItem
          type="action"
          header={t("settsBackupExportHeader")}
          subtext={t("settsBackupExportSubtext")}
          actionCallBack={() => {
            exportBackupFile(state, t);
          }}
        />
        <SettingsMenuItem
          type="action"
          header={t("settsBackupRestoreHeader")}
          subtext={t("settsBackupRestoreSubtext")}
          actionCallBack={() => {
            importBackupFile(t).then(setPendingRestore);
          }}
        />
      </ScrollView>
      <BackupRestoreModal
        pending={pendingRestore}
        onCancel={() => setPendingRestore(null)}
        onConfirm={(parsed) => {
          // AppProvider's persist effect writes the new state to storage; no
          // component touches storage directly. A whole snapshot on purpose - a
          // restore replaces the state, and this one came from a file, not from
          // a closure.
          setState(parsed.state);
          logger.write(
            `State restored from backup file (${parsed.state.passages.length} passages)`
          );
          toastShow(t("settsRestored"), 1000);
          setPendingRestore(null);
        }}
      />
    </SettingsSubScreen>
  );
};

const listSettingsStyle = StyleSheet.create({
  scrollView: {
    width: "100%",
    paddingHorizontal: 20
  }
});
