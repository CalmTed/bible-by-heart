import React, { FC, useState } from "react";
import { View, Text } from "react-native";
import { Button, IconButton } from "../Button";
import { Input } from "../Input";
import { Select } from "../Select";
import { SettingsListWrapper } from "../settingsListWrapper";
import { SettingsMenuItem } from "../setttingsMenuItem";
import { LANGCODE, ARCHIVED_NAME } from "../../constants";
import { createTranslation } from "../../initials";
import { WORD } from "../../l10n";
import {
  ActionName,
  AppStateModel,
  OptionModel,
  TranslationModel
} from "../../models";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";
import { MiniModal } from "../miniModal";
import { IconName } from "../Icon";
// import { readFile } from "../../tools/fileManager";

interface ListSettingsListModel {
  theme: ThemeAndColorsModel;
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
  t: (w: WORD) => string;
  languageOptions: OptionModel[];
}

export const ListSettingsList: FC<ListSettingsListModel> = ({
  theme,
  state,
  t,
  setState,
  languageOptions
}) => {
  const [isListSettingsShown, setListSettingsShown] = useState(false);
  const [isTranslationsListShown, setTranslationsListShown] = useState(false);

  const allTags = [
    ARCHIVED_NAME,
    ...state.passages.map((p) => p.tags).flat()
  ].filter((v, i, arr) => !arr.slice(0, i).includes(v)); //get unique tags

  return (
    <View>
      <SettingsMenuItem
        theme={theme}
        type="action"
        header={t("settsLabelList")}
        subtext=""
        actionCallBack={() => setListSettingsShown(true)}
      />
      <MiniModal
        theme={theme}
        shown={isListSettingsShown}
        handleClose={() => setListSettingsShown(false)}
        style={{
          width: "100%"
        }}
      >
        <View
          style={{
            height: 60,
            flexWrap: "nowrap",
            flexDirection: "row",
            width: "100%",
            alignItems: "center"
          }}
        >
          <IconButton
            theme={theme}
            icon={IconName.back}
            onPress={() => setListSettingsShown(false)}
          />
          <Text style={theme.theme.headerText}>{t("settsLabelList")}</Text>
        </View>
        <SettingsMenuItem
          theme={theme}
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
          theme={theme}
          type="action"
          header={t("settsTranslationsListHeader")}
          subtext={t("settsTranslationsListSubtext")}
          actionCallBack={() => setTranslationsListShown(true)}
        />
        <SettingsListWrapper
          theme={theme}
          shown={isTranslationsListShown}
          handleClose={() => setTranslationsListShown(false)}
          header={t("settsTranslationsListHeader")}
          handleAddNew={() =>
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setTranslationsList,
                  payload: [
                    ...state.settings.translations,
                    createTranslation(state.settings.langCode)
                  ]
                }) || st
            )
          }
          handleRemove={(changedItem) =>
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setTranslationsList,
                  payload: state.settings.translations.filter(
                    (tr) => tr.id !== changedItem.id
                  )
                }) || st
            )
          }
          handleItemChange={(changedItem) =>
            setState(
              (st) =>
                reduce(st, {
                  name: ActionName.setTranslationsList,
                  payload: state.settings.translations.map((tr) =>
                    tr.id === changedItem.id
                      ? (changedItem as TranslationModel)
                      : tr
                  )
                }) || st
            )
          }
          items={state.settings.translations}
          renderListItem={(item) => (
            <Text style={theme.theme.headerText}>
              {`${(item as TranslationModel).name} ${
                (item as TranslationModel).isDefault ? "*" : ""
              }`}
            </Text>
          )}
          renderEditItem={(item, handleChange, handleRemove) => {
            const translationItem = item as TranslationModel;
            return (
              <View style={{ gap: 20 }}>
                {/* name */}
                <Text style={theme.theme.text}>
                  {t("settsTranslationItemName")}:
                </Text>
                <Input
                  value={`${translationItem.name}${
                    translationItem.isDefault ? " *" : ""
                  }`}
                  onChange={(value) =>
                    handleChange({
                      ...item,
                      name: value
                    })
                  }
                  onSubmit={(value) =>
                    handleChange({
                      ...item,
                      name: value
                    })
                  }
                  placeholder={t("settsTranslationItemName")}
                  theme={theme}
                  disabled={!translationItem.editable}
                  maxLength={20}
                />
                {/* language */}
                <Text style={theme.theme.text}>
                  {t("settsTranslationItemLanguage")}:
                </Text>
                <Select
                  options={languageOptions}
                  selectedIndex={languageOptions
                    .map((o) => o.value)
                    .indexOf(translationItem.addressLanguage)}
                  onSelect={(value) =>
                    handleChange({
                      ...item,
                      addressLanguage: value as LANGCODE
                    })
                  }
                  theme={theme}
                  disabled={!translationItem.editable}
                />
                {/* remove */}
                <Button
                  theme={theme}
                  onPress={() =>
                    setState(
                      (st) =>
                        reduce(st, {
                          name: ActionName.setTranslationsList,
                          payload: state.settings.translations.map((tr) =>
                            tr.id === translationItem.id
                              ? {
                                  ...translationItem,
                                  isDefault: true
                                }
                              : {
                                  ...tr,
                                  isDefault: false
                                }
                          )
                        }) || st
                    )
                  }
                  type={!translationItem.isDefault ? "outline" : "transparent"}
                  disabled={translationItem.isDefault}
                  title={t("TranslationSetDefault")}
                />
                <Button
                  theme={theme}
                  onPress={() => handleRemove(translationItem)}
                  type={translationItem.editable ? "outline" : "transparent"}
                  color="red"
                  title={t("Remove")}
                  disabled={!translationItem.editable}
                />
              </View>
            );
          }}
        />
      </MiniModal>
      {/* <SettingsMenuItem
        theme={theme}
        type="action"
        header={t("settsTranslationsListHeader")}
        subtext={t("settsTranslationsListSubtext")}
        actionCallBack={() => {
          readFile();
        }}
      /> */}
    </View>
  );
};
