import React, { FC, ReactElement, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { ThemeAndColorsModel } from "../tools/getTheme";
import { MiniModal } from "./miniModal";
import { ReminderModel, TrainModeModel, TranslationModel } from "../models";
import { IconButton } from "./Button";
import { IconName } from "./Icon";
import { secondsToString } from "../tools/secondsToString";

type ListItemType = TranslationModel | TrainModeModel | ReminderModel;

interface SettingsListWrapperModel {
  theme: ThemeAndColorsModel;
  shown: boolean;
  handleClose: () => void;
  header: string;
  handleAddNew: () => void;
  handleRemove: (changedItem: ListItemType) => void;
  handleItemChange: (changedItem: ListItemType) => void;
  items: ListItemType[];
  renderListItem: (
    item: ListItemType,
    handleChange: (changedItem: ListItemType) => void
  ) => ReactElement;
  renderEditItem: (
    item: ListItemType,
    handleChange: (changedItem: ListItemType) => void,
    handleRemove: (changedItem: ListItemType) => void
  ) => ReactElement;
}

export const SettingsListWrapper: FC<SettingsListWrapperModel> = ({
  theme,
  header,
  shown,
  handleClose,
  handleAddNew,
  handleRemove,
  handleItemChange,
  items,
  renderListItem,
  renderEditItem
}) => {
  const [itemSelectedID, setItemSelected] = useState(null as number | null);

  const settingsListWrapperStyle = StyleSheet.create({
    headerView: {
      height: 60,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    itemsListView: {
      width: "100%",
      gap: 5
    },
    itemView: {
      width: "100%",
      paddingHorizontal: 20,
      paddingVertical: 15
    },
    minimodalHeaderView: {
      height: 60,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    minimodalContentsView: {
      width: "100%"
    }
  });
  const itemSelected = items.find((i) => i.id === itemSelectedID);
  const titleText =
    typeof (itemSelected as TrainModeModel | TranslationModel)?.name !==
    "undefined"
      ? (itemSelected as TrainModeModel | TranslationModel).name || "---"
      : secondsToString((itemSelected as ReminderModel)?.timeInSec) || "---";
  return (
    <MiniModal
      theme={theme}
      shown={shown}
      handleClose={handleClose}
      style={{ width: "100%" }}
    >
      <View style={settingsListWrapperStyle.headerView}>
        <IconButton
          theme={theme}
          icon={IconName.back}
          onPress={handleClose}
          color={theme.colors.text}
        />
        <Text style={theme.theme.headerText}>{header}</Text>
        <IconButton
          theme={theme}
          icon={IconName.add}
          onPress={handleAddNew}
          color={theme.colors.text}
        />
      </View>
      <ScrollView style={settingsListWrapperStyle.itemsListView}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            style={settingsListWrapperStyle.itemView}
            onPress={() => setItemSelected(item.id)}
          >
            {renderListItem(item, handleItemChange)}
          </Pressable>
        ))}
      </ScrollView>
      <MiniModal
        theme={theme}
        shown={!!itemSelected}
        handleClose={() => setItemSelected(null)}
      >
        {itemSelected && (
          <View style={{ width: "100%" }}>
            <View style={settingsListWrapperStyle.minimodalHeaderView}>
              <IconButton
                theme={theme}
                icon={IconName.back}
                onPress={() => setItemSelected(null)}
                color={theme.colors.text}
              />
              <Text style={{ ...theme.theme.headerText, flex: 1 }}>
                {titleText}
              </Text>
            </View>
            <ScrollView style={settingsListWrapperStyle.minimodalContentsView}>
              {renderEditItem(itemSelected, handleItemChange, handleRemove)}
            </ScrollView>
          </View>
        )}
      </MiniModal>
    </MiniModal>
  );
};
