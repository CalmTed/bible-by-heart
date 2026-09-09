import React, { FC } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";
import { SettingsListWrapper } from "../components/SettingsListWrapper";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { ADDRESS_LANGS, ADDRESSLANG, SCREEN } from "../constants";
import { getAddressLangName } from "../addressLanguage";
import { ActionName, ScreenPropsModel, TranslationModel } from "../models";
import { createTranslation } from "../initials";
import { reduce } from "../utils/reduce";

// Translations list — was a modal-in-modal (SettingsListWrapper inside the List
// settings MiniModal). Now a stack screen reached from ListSettingsScreen.
export const TranslationsSettingsScreen: FC<
  ScreenPropsModel<SCREEN.settingsTranslations>
> = ({ navigation }) => {
  const { state, setState, t, theme } = useAppContext();

  // The languages an ADDRESS may be written in, which is more than the two the
  // interface speaks: a Russian translation names its books in Russian in an
  // English app, and this is the list that says so.
  const languageOptions = ADDRESS_LANGS.map((language) => ({
    value: language,
    label: getAddressLangName(language)
  }));

  return (
    <SettingsListWrapper
      themeType={state.settings.theme}
      handleClose={() => navigation.goBack()}
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
          <View style={translationsStyle.tranlationOptionsView}>
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
                  addressLanguage: value as ADDRESSLANG
                })
              }
              disabled={!translationItem.editable}
            />
            {/* set default */}
            <Button
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
              title={t(
                translationItem.isDefault
                  ? "TranslationIsDefault"
                  : "TranslationSetDefault"
              )}
            />
            <Button
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
  );
};

const translationsStyle = StyleSheet.create({
  tranlationOptionsView: {
    gap: 20
  }
});
