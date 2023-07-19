import React, { FC, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View
} from "react-native";
import { PASSAGELEVEL, archivedName } from "../constants";
import { AddressType, AppStateModel, PassageModel } from "../models";
import { Button, IconButton } from "./Button";
import { IconName } from "./Icon";
import { WORD, createT } from "../l10n";
import addressToString from "../tools/addressToString";
import { TextInput } from "react-native-gesture-handler";
import timeToString from "../tools/timeToString";
import { getVersesNumber } from "../initials";
import { AddressPicker } from "./AddressPicker";
import { LevelPicker } from "./LevelPicker";
import { ThemeAndColorsModel, getTheme } from "../tools/getTheme";
import { Select } from "./Select";
import { getNumberOfVersesInEnglish } from "../tools/getNumberOfEnglishVerses";
import { fetchESV } from "../tools/fetchESV";

interface PassageEditorModel {
  visible: boolean;
  passage: PassageModel;
  onConfirm: (passage: PassageModel) => void;
  onRemove: (arg: number) => void;
  t: (w: WORD) => string;
  state: AppStateModel;
}

export const PassageEditor: FC<PassageEditorModel> = ({
  visible,
  passage,
  onConfirm,
  onRemove,
  t,
  state
}) => {
  const [isAPVisible, setAPVisible] = useState(false);
  const [tempPassage, setPassage] = useState(passage);

  const handleTextFetch = (translation?: number) => {
    const translationId = translation || tempPassage.verseTranslation;
    //1 is hardwired id for ESV
    if (translationId === 1) {
      fetchESV(tempPassage.address)
        .then((data) => {
          setPassage((prevPassage) => {
            return { ...prevPassage, verseText: data };
          });
        })
        .catch((e) => {
          ToastAndroid.show(e, 10000);
        });
    } else {
    }
  };

  useEffect(() => {
    setPassage(passage);
    if (!tempPassage.verseText.length) {
      handleTextFetch();
    }
  }, [visible]);

  useEffect(() => {
    handleTextFetch();
  }, [JSON.stringify(tempPassage.address), tempPassage.verseTranslation]);

  const handleConfirm = () => {
    onConfirm(tempPassage);
  };
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
        (tag !== archivedName && prv.tags.includes(tag))
      ) {
        return prv;
      }
      const newTags =
        tag === archivedName && prv.tags.includes(archivedName)
          ? prv.tags.filter((tg) => tg !== archivedName)
          : [...prv.tags, tag];
      return { ...prv, tags: newTags };
    });
  };
  const handleTagRemove = (tag: string) => {
    setPassage((prv) => {
      return { ...prv, tags: prv.tags.filter((tg) => tg !== tag) };
    });
  };
  // const handleReminderToggle = () => {
  //     setPassage((prv) => {
  //         return { ...prv, isReminderOn: !prv.isReminderOn };
  //     });
  // };
  const handleAddresChange = (newAdress: AddressType) => {
    const versesInEnglish = getNumberOfVersesInEnglish(
      state.settings.translations,
      state.passages.map((p) => (p.id === tempPassage.id ? tempPassage : p))
    );
    if (versesInEnglish <= 500) {
      setPassage((prv) => {
        return {
          ...prv,
          address: newAdress,
          versesNumber: getVersesNumber(newAdress)
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
        verseTranslation: value === "null" ? null : parseInt(value, 10)
      };
    });
  };
  const theme = getTheme(state.settings.theme);
  const PEstyle = StyleSheet.create({
    //top
    headerView: {
      height: 60,
      alignContent: "center",
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between"
    },
    headerTitle: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 18,
      textTransform: "uppercase",
      fontWeight: "500",
      paddingHorizontal: 10
    },
    headerBotton: {
      height: "100%",
      aspectRatio: 1
    },
    listView: {
      backgroundColor: theme.colors.bg,
      height: "93%",
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "stretch",
      justifyContent: "space-evenly"
    },
    bodyTop: {
      width: "100%",
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: "row",
      height: 60,
      justifyContent: "space-between",
      alignItem: "center"
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
    bodyButtons: {
      width: "100%",
      flexDirection: "row"
    }
  });
  const tempT = createT(
    state.settings.translations.find(
      (tr) => tr.id === tempPassage.verseTranslation
    )?.addressLanguage || state.settings.langCode
  );
  return (
    <Modal visible={visible}>
      <View style={{ ...theme.theme.view, ...PEstyle.headerView }}>
        <IconButton
          theme={theme}
          style={PEstyle.headerBotton}
          icon={IconName.back}
          onPress={handleConfirm}
        />
        {/* <IconButton theme={theme} style={PEstyle.headerBotton} icon={IconName.back} onPress={handleBack} /> */}
        <Text style={PEstyle.headerTitle}>{t("EditPassageTitle")}</Text>
      </View>

      <View style={PEstyle.listView}>
        <ScrollView>
          <View style={PEstyle.bodyTop}>
            <Pressable onPress={() => setAPVisible(true)}>
              <Text style={PEstyle.bodyTopAddress}>
                {addressToString(tempPassage.address, tempT)}
                {`(${getVersesNumber(tempPassage.address)})`}
              </Text>
            </Pressable>
            {/* <IconButton onPress={handleReminderToggle} icon={tempPassage.isReminderOn ? IconName.bellGradient : IconName.bellOutline}/> */}
          </View>
          <View style={PEstyle.bodyText}>
            <TextInput
              style={PEstyle.bodyTextInput}
              multiline
              numberOfLines={8}
              onChangeText={handleTextChange}
            >
              {tempPassage.verseText}
            </TextInput>
          </View>
          <View style={PEstyle.tagItemListBlock}>
            <View style={PEstyle.tagItemList}>
              {tempPassage.tags.map((p) => (
                <TagItem
                  key={p}
                  theme={theme}
                  title={p === archivedName ? t("Archived") : p.slice(0, 20)}
                  onRemove={() => handleTagRemove(p)}
                />
              ))}
            </View>
            <TextInput
              placeholderTextColor={theme.colors.textSecond}
              style={PEstyle.tagListInput}
              placeholder={t("AddTag")}
              maxLength={15}
              onSubmitEditing={(newVal) =>
                handleTagAdd(newVal.nativeEvent.text.trim())
              }
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
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-evenly",
              alignItems: "center"
            }}
          >
            <Select
              theme={theme}
              options={[
                { label: t("TranslationOther"), value: "null" },
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
            <LevelPicker
              t={t}
              targetPassage={tempPassage}
              handleChange={handleLevelChange}
              handleOpen={handleLevelPickerOpen}
              state={state}
            />
          </View>
          <View style={PEstyle.bodyButtons}>
            <Button
              theme={theme}
              title={
                tempPassage.tags.includes(archivedName)
                  ? t("Unrchive")
                  : t("Archive")
              }
              onPress={() => handleTagAdd(archivedName)}
            />
            <Button
              theme={theme}
              title={t("Remove")}
              onPress={() => handleRemove(tempPassage.id)}
              color="red"
            />
          </View>
        </ScrollView>
      </View>
      <AddressPicker
        theme={theme}
        visible={isAPVisible}
        address={tempPassage.address}
        onCancel={() => setAPVisible(false)}
        onConfirm={handleAddresChange}
        t={tempT}
      />
    </Modal>
  );
};

export const TagItem: FC<
  | {
      title: string;
      onRemove: () => void;
      theme: ThemeAndColorsModel;
      onPress?: () => void;
      disabled?: boolean;
    }
  | {
      title: string;
      onPress: () => void;
      theme: ThemeAndColorsModel;
      onRemove?: () => void;
      disabled?: boolean;
    }
> = ({ theme, onPress, onRemove, title, disabled }) => {
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
          theme={theme}
          icon={IconName.cross}
          onPress={onRemove}
          disabled={disabled}
        />
      )}
      {!onRemove && !!onPress && (
        <IconButton
          theme={theme}
          icon={IconName.add}
          onPress={onPress}
          disabled={disabled}
        />
      )}
    </View>
  );
};
