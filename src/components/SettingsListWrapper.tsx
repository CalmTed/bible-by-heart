import React, { FC, ReactElement, useState } from "react";
import { ScrollView, StyleSheet, Pressable } from "react-native";
import { useAppContext } from "../context/AppContext";
import { ReminderModel, TrainModeModel, TranslationModel } from "../models";
import { IconButton } from "./Button";
import { IconName } from "./Icon";
import { THEMETYPE } from "../constants";
import { secondsToString } from "../utils/secondsToString";
import { SettingsSubScreen } from "./SettingsSubScreen";

type ListItemType = TranslationModel | TrainModeModel | ReminderModel;

interface SettingsListWrapperModel {
  themeType: THEMETYPE;
  // Back out of the whole list (returns to the parent settings sub-menu).
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

// A reusable editable-list screen body (translations / reminders / train modes).
// It used to render as a MiniModal with a second MiniModal for the item editor;
// now it is a plain screen body: the list and the per-item editor are two views
// toggled by local state, with no modal slide animation. The owning screen
// supplies the data handlers and back navigation via handleClose.
export const SettingsListWrapper: FC<SettingsListWrapperModel> = ({
  themeType,
  header,
  handleClose,
  handleAddNew,
  handleRemove,
  handleItemChange,
  items,
  renderListItem,
  renderEditItem
}) => {
  const { theme } = useAppContext();
  const [itemSelectedID, setItemSelected] = useState(null as number | null);

  const itemSelected = items.find((i) => i.id === itemSelectedID);
  const titleText =
    typeof (itemSelected as TrainModeModel | TranslationModel)?.name !==
    "undefined"
      ? (itemSelected as TrainModeModel | TranslationModel).name || "---"
      : secondsToString((itemSelected as ReminderModel)?.timeInSec) || "---";

  if (itemSelected) {
    return (
      <SettingsSubScreen
        themeType={themeType}
        title={titleText}
        onBack={() => setItemSelected(null)}
      >
        <ScrollView style={settingsListWrapperStyle.contentsView}>
          {renderEditItem(itemSelected, handleItemChange, handleRemove)}
        </ScrollView>
      </SettingsSubScreen>
    );
  }

  return (
    <SettingsSubScreen
      themeType={themeType}
      title={header}
      onBack={handleClose}
      headerRight={
        <IconButton
          icon={IconName.add}
          onPress={handleAddNew}
          color={theme.colors.text}
        />
      }
    >
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
    </SettingsSubScreen>
  );
};

const settingsListWrapperStyle = StyleSheet.create({
  itemsListView: {
    width: "100%",
    paddingHorizontal: 20
  },
  itemView: {
    width: "100%",
    paddingVertical: 15
  },
  contentsView: {
    width: "100%",
    paddingHorizontal: 20
  }
});
