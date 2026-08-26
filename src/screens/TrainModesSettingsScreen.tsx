import React, { FC } from "react";
import { View, Text } from "react-native";
import { useAppContext } from "../context/AppContext";
import { SettingsListWrapper } from "../components/SettingsListWrapper";
import { SettingsMenuItem } from "../components/SettingsMenuItem";
import { Button } from "../components/Button";
import {
  PASSAGELEVEL,
  SORTINGOPTION,
  ARCHIVED_NAME,
  SCREEN
} from "../constants";
import {
  ActionName,
  OptionModel,
  ScreenPropsModel,
  TrainModeModel
} from "../models";
import { createTrainMode } from "../initials";
import { reduce } from "../utils/reduce";

// Train modes list — was a modal-in-modal (SettingsListWrapper inside the Tests
// settings MiniModal). Now a stack screen reached from TestsSettingsScreen.
export const TrainModesSettingsScreen: FC<
  ScreenPropsModel<SCREEN.settingsTrainModes>
> = ({ navigation }) => {
  const { state, setState, t, theme } = useAppContext();

  return (
    <SettingsListWrapper
      themeType={state.settings.theme}
      handleClose={() => navigation.goBack()}
      header={t("settingsTrainModesListHeader")}
      handleAddNew={() => {
        if (state.settings.trainModesList.length >= 5) {
          return;
        }
        setState(
          (st) =>
            reduce(st, {
              name: ActionName.setTrainModesList,
              payload: [
                ...st.settings.trainModesList,
                createTrainMode(
                  st.settings.langCode,
                  state.settings.translations.filter((tr) => tr.isDefault)[0]
                    .id || 1
                )
              ]
            }) || st
        );
      }}
      handleRemove={(changedItem) => {
        setState(
          (st) =>
            reduce(st, {
              name: ActionName.setTrainModesList,
              payload: st.settings.trainModesList.filter(
                (item) => item.id !== changedItem.id
              )
            }) || st
        );
      }}
      handleItemChange={(changedItem) => {
        setState(
          (st) =>
            reduce(st, {
              name: ActionName.setTrainModesList,
              payload: st.settings.trainModesList.map((item) =>
                item.id === changedItem.id ? changedItem : item
              ) as TrainModeModel[]
            }) || st
        );
      }}
      items={state.settings.trainModesList}
      renderListItem={(item) => {
        const trainModeItem = item as TrainModeModel;
        return (
          <View>
            <Text
              style={{
                ...theme.theme.headerText,
                ...(trainModeItem.enabled
                  ? {}
                  : { color: theme.colors.textSecond })
              }}
            >
              {trainModeItem.name || "---"}
            </Text>
          </View>
        );
      }}
      renderEditItem={(item, handleChange, handleRemove) => {
        const trainModeItem = item as TrainModeModel;
        const lengthOptins = [
          {
            value: Infinity.toString(),
            label: t("settsAllPassagesOption")
          },
          ...new Array(15)
            .fill(0)
            .map((v, i) => i + 5)
            .map((i) => ({ value: i.toString(), label: i }))
        ] as OptionModel[];
        const levelsOptions = [
          {
            value: "null",
            label: t("settsAsSelectedLevelOption")
          },
          ...Object.keys(
            Object.keys(PASSAGELEVEL).filter((l) => !!parseInt(l, 10))
          ).map((v) => ({
            value: (parseInt(v, 10) + 1).toString(),
            label: `${t("Level")} ${parseInt(v, 10) + 1}`
          }))
        ];
        const allTags = [
          ARCHIVED_NAME,
          ...state.passages
            .map((p) => p.tags)
            .flat()
            .filter(
              (v, i, arr) => !arr.slice(0, i).includes(v) && v !== ARCHIVED_NAME
            )
        ];
        return (
          <View>
            <SettingsMenuItem
              header={t("settsTrainModeNameInput")}
              type="textinput"
              value={trainModeItem.name}
              onChange={(value) => {
                handleChange({
                  ...trainModeItem,
                  name: value
                });
              }}
              maxLength={20}
            />
            <SettingsMenuItem
              header={t("settsTrainModeEnabled")}
              subtext={`${t(
                trainModeItem.enabled ? "settsEnabled" : "settsDisabled"
              )}`}
              type="checkbox"
              checkBoxState={trainModeItem.enabled}
              onClick={(value) => {
                handleChange({
                  ...trainModeItem,
                  enabled: value
                });
              }}
              disabled={!trainModeItem.editable}
            />
            <SettingsMenuItem
              header={t("settsTrainModeLengthHeader")}
              subtext={`${t("settsTrainModeLengthSubtext")}: ${
                trainModeItem.length.toString() === "Infinity"
                  ? t("settsAllPassagesOption")
                  : trainModeItem.length
              }`}
              type="select"
              options={lengthOptins}
              selectedIndex={lengthOptins
                .map((i) => i.value)
                .indexOf(
                  lengthOptins
                    .map((i) => i.value)
                    .filter((i) => i === trainModeItem.length.toString())[0]
                )}
              onSelect={(value) => {
                handleChange({
                  ...trainModeItem,
                  length:
                    value === "Infinily"
                      ? Infinity
                      : (value as unknown as number)
                });
              }}
              disabled={!trainModeItem.editable}
            />
            <SettingsMenuItem
              header={t("settsTrainModeTranslationHeader")}
              subtext={`${t("settsTrainModeTranslationSubtext")}: ${
                state.settings.translations.find(
                  (tr) => tr.id === trainModeItem.translation
                )?.name ?? ""
              }`}
              type="select"
              options={state.settings.translations.map((tr) => ({
                value: tr.id.toString(),
                label: tr.name
              }))}
              selectedIndex={state.settings.translations.indexOf(
                state.settings.translations.filter(
                  (tr) => tr.id === trainModeItem.translation
                )[0]
              )}
              onSelect={(value) => {
                handleChange({
                  ...trainModeItem,
                  translation: parseInt(value, 10)
                });
              }}
            />
            <SettingsMenuItem
              header={t("settsTrainModeSortingHeader")}
              subtext={`${t("settsTrainModeSortingSubtext")}: ${t(
                trainModeItem.sort
              )}`}
              type="select"
              options={Object.entries(SORTINGOPTION).map(([, v]) => ({
                value: v,
                label: t(v)
              }))}
              selectedIndex={Object.values(SORTINGOPTION).indexOf(
                Object.values(SORTINGOPTION).filter(
                  (i) => i === trainModeItem.sort
                )[0]
              )}
              onSelect={(value) => {
                handleChange({
                  ...trainModeItem,
                  sort: value as SORTINGOPTION
                });
              }}
              disabled={!trainModeItem.editable}
            />
            <SettingsMenuItem
              header={t("settsTrainModeLevelHeader")}
              subtext={`${t("settsTrainModeLevelSubtext")}: ${
                trainModeItem.testAsLevel === null
                  ? t("settsAsSelectedLevelOption")
                  : trainModeItem.testAsLevel.toString()
              }`}
              type="select"
              options={levelsOptions}
              selectedIndex={levelsOptions.indexOf(
                levelsOptions.filter(
                  ({ value }) =>
                    value.toString() ===
                    (trainModeItem.testAsLevel?.toString() || "null")
                )[0]
              )}
              onSelect={(value) => {
                handleChange({
                  ...trainModeItem,
                  testAsLevel:
                    value === "null"
                      ? null
                      : (parseInt(value, 10) as never as PASSAGELEVEL)
                });
              }}
              disabled={!trainModeItem.editable}
            />
            <SettingsMenuItem
              header={t("settsTrainModeIncludeTagsHeader")}
              type="taglist"
              optionsList={allTags.filter(
                (tr) =>
                  !trainModeItem.includeTags.includes(tr) &&
                  !trainModeItem.excludeTags.includes(tr)
              )}
              valuesList={trainModeItem.includeTags}
              onListChange={(includeTags) => {
                handleChange({
                  ...trainModeItem,
                  includeTags
                });
              }}
              disabled={!trainModeItem.editable}
            />
            <SettingsMenuItem
              header={t("settsTrainModeExcludeTagsHeader")}
              type="taglist"
              optionsList={allTags.filter(
                (tr) =>
                  !trainModeItem.includeTags.includes(tr) &&
                  !trainModeItem.excludeTags.includes(tr)
              )}
              valuesList={trainModeItem.excludeTags}
              onListChange={(excludeTags) => {
                handleChange({
                  ...trainModeItem,
                  excludeTags
                });
              }}
              disabled={!trainModeItem.editable}
            />
            <Button
              color="red"
              title={t("Remove")}
              onPress={() => {
                handleRemove(trainModeItem);
              }}
              disabled={!trainModeItem.editable}
            />
          </View>
        );
      }}
    />
  );
};
