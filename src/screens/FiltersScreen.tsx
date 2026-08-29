import React, { FC } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ARCHIVED_NAME,
  NO_TAGS_NAME,
  PASSAGELEVEL,
  SCREEN
} from "../constants";
import { ActionName, ScreenPropsModel } from "../models";
import { useAppContext } from "../context/AppContext";
import { SettingsSubScreen } from "../components/SettingsSubScreen";
import { Button } from "../components/Button";
import { Text } from "../components/Text";
import { reduce } from "../utils/reduce";

// Passage-list filters - was a MiniModal rendered inline in ListScreen with a
// ScrollView and four sections inside it, i.e. a sub-menu wearing a dialog's
// clothes (8.2.2). Now a stack screen reached from the list's filter button, so
// backing out is the ordinary gesture and the sections get the whole height.
// The filters themselves live in app state, so nothing has to be handed back:
// the list re-filters the moment this screen dispatches.

const LEVELS = [
  PASSAGELEVEL.l1,
  PASSAGELEVEL.l2,
  PASSAGELEVEL.l3,
  PASSAGELEVEL.l4,
  PASSAGELEVEL.l5
];

export const FiltersScreen: FC<ScreenPropsModel<SCREEN.listFilters>> = ({
  navigation
}) => {
  const { state, setState, t, theme } = useAppContext();

  // Every tag any passage carries, ARCHIVED_NAME included (it is stored as an
  // ordinary tag), first-seen order, no duplicates. NO_TAGS_NAME is not a tag
  // any passage carries - it is the name the hide-list gives to "carries no
  // tags at all" (8.2.25), offered only while some passage actually has none.
  const allTags = state.passages
    .map((p) => p.tags)
    .flat()
    .filter((v, i, arr) => !arr.slice(0, i).includes(v));
  // Only worth offering when it separates something: some passage has tags and
  // some has none. In a library where nothing is tagged it would only be a way
  // to empty the list.
  const tagOptions =
    allTags.length && state.passages.some((p) => !p.tags.length)
      ? [...allTags, NO_TAGS_NAME]
      : allTags;

  const handleFilterChange: (arg: {
    tag?: string;
    selectedLevel?: PASSAGELEVEL;
    maxLevel?: PASSAGELEVEL;
    translation?: number;
  }) => void = ({ tag, selectedLevel, maxLevel, translation }) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.toggleFilter,
        payload: {
          tag: tag,
          selectedLevel: selectedLevel,
          maxLevel: maxLevel,
          translationId: translation
        }
      });
      return newState ? newState : prv;
    });
  };

  const filtersStyle = StyleSheet.create({
    scrollView: {
      width: "100%",
      paddingHorizontal: 20
    },
    listHeader: {
      ...theme.theme.text,
      marginTop: 20,
      marginBottom: 10
    },
    optionsView: {
      ...theme.theme.rowView,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10
    }
  });

  return (
    <SettingsSubScreen
      themeType={state.settings.theme}
      title={t("TitleFilters")}
      onBack={() => navigation.goBack()}
    >
      <ScrollView
        style={filtersStyle.scrollView}
        contentContainerStyle={theme.theme.scrollContent}
      >
        <Text style={filtersStyle.listHeader}>{t("SelectedLevel")}</Text>
        <View style={filtersStyle.optionsView}>
          {LEVELS.map((sl) => (
            <Button
              key={sl}
              type="outline"
              color={
                state.filters.selectedLevels.includes(sl) ? "gray" : "green"
              }
              title={sl.toString()}
              onPress={() => handleFilterChange({ selectedLevel: sl })}
            />
          ))}
        </View>
        <Text style={filtersStyle.listHeader}>{t("MaxLevel")}</Text>
        <View style={filtersStyle.optionsView}>
          {LEVELS.map((ml) => (
            <Button
              key={ml}
              type="outline"
              color={state.filters.maxLevels.includes(ml) ? "gray" : "green"}
              title={ml.toString()}
              onPress={() => handleFilterChange({ maxLevel: ml })}
            />
          ))}
        </View>
        {!!tagOptions.length && (
          <View>
            <Text style={filtersStyle.listHeader}>{t("Tags")}</Text>
            <View style={filtersStyle.optionsView}>
              {tagOptions.map((option) => (
                <Button
                  key={option}
                  type="outline"
                  color={state.filters.tags.includes(option) ? "gray" : "green"}
                  title={
                    option === ARCHIVED_NAME
                      ? t("Archived")
                      : option === NO_TAGS_NAME
                        ? t("FilterNoTags")
                        : option.slice(0, 20)
                  }
                  onPress={() => handleFilterChange({ tag: option })}
                />
              ))}
            </View>
          </View>
        )}
        {!tagOptions.length && (
          <Text style={filtersStyle.listHeader}>{t("NoTagsFound")}</Text>
        )}
        <View>
          <Text style={filtersStyle.listHeader}>{t("Translations")}</Text>
          <View style={filtersStyle.optionsView}>
            {state.settings.translations.map((option) => (
              <Button
                key={option.id}
                type="outline"
                color={
                  state.filters.translations.includes(option.id)
                    ? "gray"
                    : "green"
                }
                title={option.name.slice(0, 20)}
                onPress={() =>
                  handleFilterChange({
                    translation: option.id
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SettingsSubScreen>
  );
};
