import React, { FC, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  PASSAGELEVEL,
  ARCHIVED_NAME,
  CUSTOM_TRANSLATION_NAME,
  BUNDLED_TRANSLATION_SOURCES,
  DAY,
  LAYOUT,
  TranslationSourceModel
} from "../constants";
import {
  ActionName,
  AddressType,
  AppStateModel,
  PassageModel
} from "../models";
import { Button, IconButton } from "./Button";
import { Header } from "./Header";
import { IconName } from "./Icon";
import { WORD, createT } from "../l10n";
import { Address } from "../utils/address";
import { Passage } from "../utils/passage";
import { TextInput } from "react-native-gesture-handler";
import {
  dateToString,
  timeToString,
  timeStringFromMS
} from "../utils/formatDateTime";
import { AddressPicker } from "./AddressPicker";
import { LevelPicker } from "./LevelPicker";
import { Select } from "./Select";
import {
  fetchPassageText,
  fetchTranslationCatalogue
} from "../services/fetchPassageText";
import {
  isFetchableTranslation,
  mergeCatalogueIntoTranslations
} from "../utils/translation";
import { reduce } from "../utils/reduce";
import { MiniModal } from "./MiniModal";
import { ConfirmModal } from "./ConfirmModal";
import { Input } from "./Input";
import { getPassageStats } from "../utils/getStats";

import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";
import { useAppContext } from "../context/AppContext";

interface PassageEditorModel {
  passage: PassageModel;
  isNew?: boolean;
  // Save persists the draft; onBack leaves without saving (called after the
  // dirty-check confirm resolves).
  onConfirm: (passage: PassageModel) => void;
  onRemove: (arg: number) => void;
  onBack: () => void;
  state: AppStateModel;
}

export const PassageEditor: FC<PassageEditorModel> = ({
  passage,
  isNew,
  onConfirm,
  onRemove,
  onBack,
  state
}) => {
  const { theme, t, setState } = useAppContext();
  const [isAPVisible, setAPVisible] = useState(false);
  const [isFetchPropositionOpen, setFetchPropositionOpen] = useState(false);
  // Offline-first: the editor opens on the shipped catalogue, so a translation
  // is selectable and fetchable with no network at all. The live one replaces
  // it if the server answers.
  const [catalogue, setCatalogue] = useState<TranslationSourceModel[]>(
    BUNDLED_TRANSLATION_SOURCES
  );
  const [tempPassage, setPassage] = useState(passage);
  const [newTagTempValue, setTempTagText] = useState("");
  const [fetchingInProgress, setFetchingInProgress] = useState(false);
  const [reminderModalShown, setReminderModalShown] = useState(false);
  const [isRemoveConfirmShown, setRemoveConfirmShown] = useState(false);
  const [isDiscardConfirmShown, setDiscardConfirmShown] = useState(false);

  // Momentary/draft editing: the draft (tempPassage) is only committed to the
  // global state when the user taps Save. Comparing against the original tells
  // us whether to warn before leaving.
  const isDirty = JSON.stringify(tempPassage) !== JSON.stringify(passage);
  const handleSave = () => {
    onConfirm(tempPassage);
  };
  const handleBackPress = () => {
    if (isDirty) {
      setDiscardConfirmShown(true);
    } else {
      onBack();
    }
  };

  // Which of the user's translations this id names, and whether the API has text
  // for it. A translation the user invented has no source and is typed by hand.
  const getTranslation = (translationId: number | null) =>
    state.settings.translations.find((tr) => tr.id === translationId);
  const canFetchTranslation = (translationId: number | null) =>
    isFetchableTranslation(getTranslation(translationId), catalogue);

  const handleTextFetch = (translation?: number) => {
    const translationId = translation || tempPassage.verseTranslation;
    const sourceId = getTranslation(translationId)?.sourceId;
    const validAdress =
      tempPassage.address.bookIndex !== null &&
      tempPassage.address.startChapterNum !== null &&
      tempPassage.address.startVerseNum !== null;
    if (sourceId && validAdress && canFetchTranslation(translationId)) {
      if (state.settings.devModeEnabled) {
        logger.write(
          `Fetching passage: ${sourceId} ${JSON.stringify(tempPassage.address)}`
        );
      }
      setFetchingInProgress(true);
      fetchPassageText(tempPassage.address, sourceId)
        .then((data) => {
          setPassage((prevPassage) => {
            return { ...prevPassage, verseText: data };
          });
        })
        .catch((e) => {
          logger.error(
            `Error while fetching ${sourceId} text Address:${JSON.stringify(tempPassage.address)}: ${e}`
          );
          // No text source means no text, never a broken app: the user is told
          // once and the field stays theirs to type in.
          toastShow(t("TextSourceUnavailable"), 10000);
        })
        .finally(() => {
          setFetchingInProgress(false);
        });
    }
  };

  useEffect(() => {
    // Translations come from the catalogue: whatever the API serves and the app
    // has never seen becomes one more entry in the user's list. Appends only -
    // nothing already there is renamed, renumbered or un-defaulted.
    let dropped = false;
    fetchTranslationCatalogue().then((liveCatalogue) => {
      if (dropped) {
        return;
      }
      setCatalogue(liveCatalogue);
      setState((prev) => {
        const merged = mergeCatalogueIntoTranslations(
          prev.settings.translations,
          liveCatalogue
        );
        return merged === prev.settings.translations
          ? prev
          : (reduce(prev, {
              name: ActionName.setTranslationsList,
              payload: merged
            }) ?? prev);
      });
    });
    return () => {
      dropped = true;
    };
  }, []);

  useEffect(() => {
    // On mount: if we already have a valid address but no text yet (e.g. adding
    // from a picked address / shared intent), fetch the verse text.
    const addressExists =
      tempPassage.address.bookIndex !== null &&
      tempPassage.address.startChapterNum !== null &&
      tempPassage.address.startVerseNum !== null;
    const textIsEmpty = !tempPassage.verseText.length;
    if (addressExists && textIsEmpty) {
      handleTextFetch();
    }
  }, []);

  useEffect(() => {
    //checknig if data changed after first PE rendering
    const fetchableTranslation = canFetchTranslation(
      tempPassage.verseTranslation
    );
    const addressORTranslationChanged =
      passage.verseTranslation !== tempPassage.verseTranslation ||
      JSON.stringify(passage.address) !== JSON.stringify(tempPassage.address);
    const textEmpty = !tempPassage.verseText.length;
    //should ask user to fetch if verse taxt is not empty
    if (fetchableTranslation && addressORTranslationChanged) {
      if (!textEmpty) {
        setFetchPropositionOpen(true);
      } else {
        handleTextFetch();
      }
    }
  }, [JSON.stringify(tempPassage.address), tempPassage.verseTranslation]);

  const handleTextChange = (newVal: string) => {
    setPassage((prv) => {
      return { ...prv, verseText: newVal.replace(/ {2}/g, " ").trim() };
    });
  };
  const handleRemove = (id: number) => {
    onRemove(id);
  };

  const handleTagAdd = (tag: string) => {
    setPassage((prv) => {
      if (
        tag === t("Archive") ||
        !tag ||
        (tag !== ARCHIVED_NAME && prv.tags.includes(tag))
      ) {
        return prv;
      }
      const newTags =
        tag === ARCHIVED_NAME && prv.tags.includes(ARCHIVED_NAME)
          ? prv.tags.filter((tg) => tg !== ARCHIVED_NAME)
          : [...prv.tags, tag];
      return { ...prv, tags: newTags };
    });
  };
  const handleTagRemove = (tag: string) => {
    setPassage((prv) => {
      return { ...prv, tags: prv.tags.filter((tg) => tg !== tag) };
    });
  };
  const handleAddresChange = (newAdress: AddressType) => {
    const versesInEnglish = Passage.countEnglishVerses(
      state.settings.translations,
      state.passages.map((p) => (p.id === tempPassage.id ? tempPassage : p))
    );
    if (versesInEnglish <= 500) {
      setPassage((prv) => {
        return {
          ...prv,
          address: newAdress,
          versesNumber: Address.versesCount(newAdress)
        };
      });
    }
    setAPVisible(false);
  };
  const handleLevelPickerOpen = () => {
    setPassage((prv) => {
      return { ...prv, isNewLevelAwalible: false };
    });
  };
  const handleLevelChange = (level: PASSAGELEVEL) => {
    setPassage((prv) => {
      return { ...prv, selectedLevel: level };
    });
  };
  const handleTranslationChange = (value: string) => {
    setPassage((prv) => {
      return {
        ...prv,
        //null for custom
        verseTranslation:
          value === CUSTOM_TRANSLATION_NAME ? null : parseInt(value, 10)
      };
    });
  };
  const handleFetchConfirm = () => {
    handleTextFetch();
    setFetchPropositionOpen(false);
  };
  const handleRepeatingIntervalChange = (newNumber: string) => {
    const parsed = parseInt(newNumber, 10);
    const valid =
      !isNaN(parseInt(newNumber, 10)) &&
      parseInt(newNumber, 10) > 0 &&
      parseInt(newNumber, 10) < 100;
    if (newNumber.length !== 0 && !valid) {
      return;
    }
    const newValue = newNumber.length ? parsed : null;
    const reminderToggleValue =
      newNumber.length !== 0 || newValue ? true : false;
    setPassage((prv) => {
      return {
        ...prv,
        minIntervalDaysNum: newValue,
        isReminderOn: reminderToggleValue
      };
    });
  };
  // const theme = getThemeFromScheme(state.settings.theme);
  const PEstyle = StyleSheet.create({
    //top
    screen: {
      flex: 1,
      backgroundColor: theme.colors.bg
    },
    // This used to be `height: "93%"` — 93% of the WHOLE screen, laid out BELOW
    // the Header, so the scroll area's bottom hung off the screen by the
    // header's height less 7% of it. On a level-5 passage "Level 5" and one row
    // under it were the last things reachable. flex takes the room the header
    // leaves, and no more.
    listView: {
      backgroundColor: theme.colors.bg,
      flex: 1,
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "stretch",
      justifyContent: "space-evenly"
    },
    listContent: {
      // the last row scrolls clear of the screen edge instead of ending flush
      // against it
      paddingBottom: LAYOUT.scrollBottomGap
    },
    bodyTop: {
      width: "100%",
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: "row",
      height: 60,
      justifyContent: "space-between",
      alignItems: "center"
    },
    //address
    bodyTopAddress: {
      color: theme.colors.text,
      textTransform: "uppercase",
      fontSize: 20,
      fontWeight: "500",
      alignItems: "flex-start",
      marginLeft: 5
    },
    //translation
    translationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      paddingBottom: 10
    },
    //text
    bodyText: {
      marginHorizontal: 20,
      marginVertical: 0
    },
    bodyTextInput: {
      backgroundColor: theme.colors.bgSecond,
      paddingHorizontal: 10,
      paddingVertical: 10,
      color: theme.colors.text,
      fontSize: 16,
      borderRadius: 10,
      textAlignVertical: "top"
    },
    //meta
    tagItemListBlock: {
      padding: 5,
      marginHorizontal: 15
    },
    tagItemList: {
      flexDirection: "row",
      flexWrap: "wrap"
    },
    tagListInput: {
      color: theme.colors.text
    },
    bodyMeta: {
      padding: 20,
      paddingVertical: 10,
      width: "100%"
    },
    bodyMetaText: {
      color: theme.colors.textSecond
    },
    bodyMetaTextHeader: {
      color: theme.colors.textSecond,
      fontWeight: "bold",
      marginTop: 5
    },
    bodyButtons: {
      width: "100%",
      flexDirection: "row"
    },
    selectorsWrapper: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-evenly",
      alignItems: "flex-start"
    },
    selectorSectionWrapper: {
      flexDirection: "column",
      justifyContent: "space-evenly",
      alignItems: "center"
    },
    //reminder modal
    reminderModalHeader: {
      marginHorizontal: 30,
      marginTop: 30,
      flexDirection: "row",
      gap: 20
    },
    reminderModalBody: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 20,
      marginBottom: 30
    },
    heatmapView: {
      flexDirection: "row",
      flexWrap: "wrap",
      margin: 20,
      marginTop: 5
    },
    heatmapViewWord: {
      backgroundColor: theme.colors.mainColor,
      color: theme.colors.textSecond,
      paddingHorizontal: 2.5,
      borderRadius: 2
    }
  });
  const tempT = createT(
    state.settings.translations.find(
      (tr) => tr.id === tempPassage.verseTranslation
    )?.addressLanguage || state.settings.langCode
  );
  const multipleDaysVariation: (n: number) => 0 | 1 | 2 = (n) => {
    // ends with with 1, exept 11
    // ends with 2-4, exept 12-14
    // 5-0
    const lastDight = parseInt(n.toString()[n.toString().length - 1], 10);
    if (isNaN(lastDight)) {
      return 2;
    }
    if (lastDight === 1 && n !== 11) {
      return 0;
    } else if (lastDight > 1 && lastDight < 5 && ![12, 13, 14].includes(n)) {
      return 1;
    } else {
      return 2;
    }
  };

  const passageStats = getPassageStats(state, passage);
  return (
    <View style={PEstyle.screen}>
      <Header
        title={isNew ? t("AddPassageTitle") : t("EditPassageTitle")}
        onBack={handleBackPress}
        right={
          <Button
            title={t("Save")}
            type="transparent"
            color="green"
            onPress={handleSave}
          />
        }
      />

      <View style={PEstyle.listView}>
        <ScrollView contentContainerStyle={PEstyle.listContent}>
          <View style={PEstyle.bodyTop}>
            <Pressable onPress={() => setAPVisible(true)}>
              <Text style={PEstyle.bodyTopAddress}>
                {Address.format(tempPassage.address, tempT)}
                {`(${Address.versesCount(tempPassage.address)})`}
              </Text>
            </Pressable>
            <IconButton
              onPress={() => setReminderModalShown(true)}
              icon={
                tempPassage.isReminderOn
                  ? IconName.bellGradient
                  : IconName.bellOutline
              }
            />
          </View>
          {/* Right under the address and above the text it decides: the
              translation is met as part of the address step, not as a field far
              down the editor. */}
          <View style={PEstyle.translationRow}>
            <Text style={theme.theme.subText}>{t("TranslationLabel")}:</Text>
            <Select
              options={[
                {
                  label: t("TranslationOther"),
                  value: CUSTOM_TRANSLATION_NAME
                },
                ...state.settings.translations.map((tr) => {
                  return {
                    label: tr.name,
                    value: tr.id.toString()
                  };
                })
              ]}
              selectedIndex={
                state.settings.translations
                  .map((tr) => tr.id)
                  .indexOf(tempPassage.verseTranslation || -1) + 1
              }
              onSelect={handleTranslationChange}
            />
          </View>
          <View style={PEstyle.bodyText}>
            <TextInput
              style={PEstyle.bodyTextInput}
              multiline
              numberOfLines={8}
              onChangeText={handleTextChange}
              placeholder={
                canFetchTranslation(tempPassage.verseTranslation)
                  ? ""
                  : t("NotAFetchableTranslation")
              }
              placeholderTextColor={theme.colors.textSecond}
            >
              {fetchingInProgress ? t("Loading") : tempPassage.verseText}
            </TextInput>
          </View>
          <View style={PEstyle.tagItemListBlock}>
            <View style={PEstyle.tagItemList}>
              {tempPassage.tags.map((p) => (
                <TagItem
                  key={p}
                  title={p === ARCHIVED_NAME ? t("Archived") : p.slice(0, 20)}
                  onRemove={() => handleTagRemove(p)}
                />
              ))}
            </View>
            <TextInput
              placeholderTextColor={theme.colors.textSecond}
              style={PEstyle.tagListInput}
              placeholder={t("AddTag")}
              maxLength={15}
              value={newTagTempValue}
              onChange={(e) => {
                setTempTagText(e.nativeEvent.text);
              }}
              onSubmitEditing={(newVal) => {
                handleTagAdd(newVal.nativeEvent.text.trim());
                setTempTagText("");
              }}
            />
          </View>
          <View style={PEstyle.bodyMeta}>
            <Text style={PEstyle.bodyMetaText}>
              {t("DateCreated")}: {timeToString(tempPassage.dateCreated)}
            </Text>
            <Text style={PEstyle.bodyMetaText}>
              {t("DateEdited")}: {timeToString(tempPassage.dateEdited)}
            </Text>
            <Text style={PEstyle.bodyMetaText}>
              {tempPassage.dateTested
                ? t("DateTested") + ": " + timeToString(tempPassage.dateTested)
                : ""}
            </Text>
          </View>
          <View style={PEstyle.selectorsWrapper}>
            <View style={PEstyle.selectorSectionWrapper}>
              <Text style={theme.theme.subText}>{t("LevelLabel")}:</Text>
              <LevelPicker
                targetPassage={tempPassage}
                handleChange={handleLevelChange}
                handleOpen={handleLevelPickerOpen}
                state={state}
              />
            </View>
          </View>
          <View style={PEstyle.bodyButtons}>
            <Button
              title={
                tempPassage.tags.includes(ARCHIVED_NAME)
                  ? t("Unrchive")
                  : t("Archive")
              }
              onPress={() => handleTagAdd(ARCHIVED_NAME)}
            />
            {tempPassage.tags.includes(ARCHIVED_NAME) && (
              <Button
                title={t("Remove")}
                onPress={() => setRemoveConfirmShown(true)}
                color="red"
              />
            )}
          </View>
          {passageStats.totalTimeSpentMS > 0 && (
            <View style={{ marginHorizontal: 20 }}>
              <Text style={PEstyle.bodyMetaText}>
                {t("statsTotalTimesTested")}: {passageStats.totalTestsNumber}
              </Text>

              <Text style={PEstyle.bodyMetaText}>
                {t("statsTotalTimeSpent")}:{" "}
                {timeStringFromMS(passageStats.totalTimeSpentMS)}
              </Text>

              <Text style={PEstyle.bodyMetaText}>
                {t("statsAverageDuration")}:{" "}
                {timeStringFromMS(passageStats.avgDurationMS)}
              </Text>

              {Object.keys(passageStats.avgDurationByLevel).map((key) => {
                const level = key as unknown as PASSAGELEVEL;
                return passage.upgradeDates[level] > 0 ? (
                  [
                    <Text
                      key={level + "title"}
                      style={PEstyle.bodyMetaTextHeader}
                    >
                      {t("Level")} {level}
                    </Text>,
                    <Text key={level + "times"} style={PEstyle.bodyMetaText}>
                      {t("statsTimesTested")}:{" "}
                      {passageStats.avgDurationByLevel[level].number}
                    </Text>,
                    <Text key={level + "duration"} style={PEstyle.bodyMetaText}>
                      {t("statsTimeSpent")}:{" "}
                      {timeStringFromMS(
                        passageStats.avgDurationByLevel[level].duration
                      )}
                    </Text>,
                    <Text
                      key={level + "avgDuration"}
                      style={PEstyle.bodyMetaText}
                    >
                      {t("statsAverageDuration")}:{" "}
                      {timeStringFromMS(
                        passageStats.avgDurationByLevel[level].duration /
                          (passageStats.avgDurationByLevel[level].number || 1)
                      )}
                    </Text>,
                    <Text
                      key={level + "avgUpgradeTime"}
                      style={PEstyle.bodyMetaText}
                    >
                      {t("statsUpgradeDate")}:{" "}
                      {timeToString(
                        passage?.upgradeDates?.[level] || passage.dateCreated
                      )}
                    </Text>
                    // <Text key={level + "errors"}  style={PEstyle.bodyMetaText}>
                    //   {t("Errors")} {passageStats.avgDurationByLevel[level].errorRate}
                    // </Text>
                  ]
                ) : (
                  <View key={level + "none"}></View>
                );
              })}
            </View>
          )}
          {Math.max(
            ...passageStats.mostOftenAdressErrors.map((i) => i.errorNumber)
          ) > 1 && (
            <Text
              key="AddressesTitle"
              style={{ ...PEstyle.bodyMetaTextHeader, marginHorizontal: 20 }}
            >
              {t("statsMostCommonAddressErrorHeader")}
            </Text>
          )}
          {passageStats.mostOftenAdressErrors.length > 1 && (
            <View
              key="wrongAddressesView"
              style={{ marginHorizontal: 20, marginBottom: 10 }}
            >
              {passageStats.mostOftenAdressErrors.slice(0, 10).map((w, i) => {
                const addressString = Address.format(w.address, tempT);
                return (
                  <Text
                    key={addressString.replace(/( |:|-)/g, "") + "address"}
                    style={PEstyle.bodyMetaText}
                  >
                    {addressString}: {w.errorNumber}
                  </Text>
                );
              })}
            </View>
          )}
          {Math.max(...passageStats.wordErrorsHeatMap) > 1 && (
            <Text
              key="HeatmapTitle"
              style={{ ...PEstyle.bodyMetaTextHeader, marginHorizontal: 20 }}
            >
              {t("statsWrongWordsHeatmapHeader")} (0-
              {Math.max(...passageStats.wordErrorsHeatMap)})
            </Text>
          )}
          {Math.max(...passageStats.wordErrorsHeatMap) > 1 && (
            <View key={"heatmapView"} style={PEstyle.heatmapView}>
              {passage.verseText
                .split(" ")
                .filter((w) => w.length)
                .map((w, i) => {
                  const max = Math.max(...passageStats.wordErrorsHeatMap);
                  const percent =
                    (2 / max) * (passageStats.wordErrorsHeatMap?.[i] || 0) || 0;
                  return (
                    <Text
                      key={w + "-" + i}
                      style={{
                        ...PEstyle.heatmapViewWord,
                        backgroundColor: `rgba(114,44,29,${percent})`
                      }}
                    >
                      {w}
                    </Text>
                  );
                })}
            </View>
          )}
        </ScrollView>
      </View>
      <AddressPicker
        visible={isAPVisible}
        address={tempPassage.address}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddresChange}
      />
      <ConfirmModal
        shown={isRemoveConfirmShown}
        text={t("PassageDeleteConfirmationText")}
        confirmTitle={t("Remove")}
        cancelTitle={t("Cancel")}
        onCancel={() => setRemoveConfirmShown(false)}
        onConfirm={() => {
          setRemoveConfirmShown(false);
          handleRemove(tempPassage.id);
        }}
      />
      <ConfirmModal
        shown={isDiscardConfirmShown}
        text={t("PassageDiscardConfirmText")}
        confirmTitle={t("Discard")}
        cancelTitle={t("Cancel")}
        onCancel={() => setDiscardConfirmShown(false)}
        onConfirm={() => {
          setDiscardConfirmShown(false);
          onBack();
        }}
      />
      <MiniModal
        shown={isFetchPropositionOpen}
        handleClose={() => setFetchPropositionOpen(false)}
      >
        <Text style={theme.theme.headerText}>{t("fetchPropositionText")}</Text>
        <View
          style={{
            ...theme.theme.rowView,
            ...theme.theme.marginVertical,
            ...theme.theme.gap20
          }}
        >
          <Button
            onPress={() => setFetchPropositionOpen(false)}
            type="secondary"
            title={t("Cancel")}
          />
          <Button
            onPress={() => handleFetchConfirm()}
            type="main"
            color="green"
            title={t("Fetch")}
          />
        </View>
      </MiniModal>
      <MiniModal
        shown={reminderModalShown}
        handleClose={() => setReminderModalShown(false)}
      >
        <View style={PEstyle.reminderModalHeader}>
          {/* <Icon iconName={tempPassage.isReminderOn ? IconName.bellGradient : IconName.bellOutline}/> */}
          <Text style={theme.theme.headerText}>{t("Repeat")}</Text>
          {/* <Pressable
            onPress={handleReminderToggle}
          >
            <Checkbox theme={theme} isEnabled={tempPassage.isReminderOn} ></Checkbox>
          </Pressable> */}
        </View>
        <View style={PEstyle.reminderModalBody}>
          <Input
            onChange={handleRepeatingIntervalChange}
            placeholder={"0"}
            value={tempPassage.minIntervalDaysNum?.toString() || ""}
            textStyle={{ minWidth: 50, width: 50 }}
            inputMode="numeric"
            onSubmit={() => setReminderModalShown(false)}
          />
          <Text style={theme.theme.headerText}>
            {t(
              [
                "DaysLabelSingular",
                "DaysLabelTwoThreeFour",
                "DaysLabelMultiple"
              ][
                multipleDaysVariation(tempPassage.minIntervalDaysNum || 0)
              ] as WORD
            )}
          </Text>
        </View>
        {tempPassage?.minIntervalDaysNum && (
          <Text style={theme.theme.subText}>
            {t("NextRepeat")}:{" "}
            {dateToString(
              tempPassage.dateTested +
                tempPassage.minIntervalDaysNum * DAY * 1000
            )}
          </Text>
        )}
        <Button
          type="main"
          color="green"
          onPress={() => setReminderModalShown(false)}
          title={t("Close")}
        ></Button>
      </MiniModal>
    </View>
  );
};

export const TagItem: FC<
  | {
      title: string;
      onRemove: () => void;
      onPress?: () => void;
      disabled?: boolean;
    }
  | {
      title: string;
      onPress: () => void;
      onRemove?: () => void;
      disabled?: boolean;
    }
> = ({ onPress, onRemove, title, disabled }) => {
  const { theme } = useAppContext();
  const tagItemStyles = StyleSheet.create({
    tagItemView: {
      borderRadius: 50,
      paddingLeft: 10,
      margin: 3,
      flexDirection: "row",
      height: 40,
      alignItems: "center",
      borderColor: !onRemove ? theme.colors.mainColor : theme.colors.textSecond,
      borderWidth: 2
    },
    tagItemText: {
      color: theme.colors.text,
      fontSize: 16
    }
  });
  return (
    <View style={tagItemStyles.tagItemView}>
      {!!onRemove && <Text style={tagItemStyles.tagItemText}> {title}</Text>}
      {!!onRemove && (
        <IconButton
          icon={IconName.cross}
          onPress={onRemove}
          disabled={disabled}
        />
      )}
      {!onRemove && !!onPress && (
        <IconButton icon={IconName.add} onPress={onPress} disabled={disabled} />
      )}
    </View>
  );
};
