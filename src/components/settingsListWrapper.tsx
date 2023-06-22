import {FC, ReactElement, useState} from "react"
import {View, Text, ScrollView, StyleSheet, Pressable} from "react-native"
import { ThemeAndColorsModel } from "../tools/getTheme"
import { MiniModal } from "./miniModal"
import { ReminderModel, TrainModeModel, TranslationModel } from "../models"
import { IconButton } from "./Button"
import { IconName } from "./Icon"

type ListItemType = TranslationModel | TrainModeModel | ReminderModel

interface SettingsListWrapperModel{
  theme: ThemeAndColorsModel
  shown: boolean
  handleClose: () => void
  header: string
  handleAddNew: () => void
  handleRemove: (changedItem: ListItemType) => void
  handleItemChange: (changedItem: ListItemType) => void
  items: ListItemType[]
  renderListItem: (item: ListItemType, handleChange: (changedItem: ListItemType) => void) => ReactElement
  renderEditItem: (item: ListItemType, handleChange: (changedItem: ListItemType) => void) => ReactElement
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
  renderEditItem,
}) => {
  const [itemSelected, setItemSelected] = useState(null as ListItemType | null);

  const settingsListWrapperStyle = StyleSheet.create({
    headerView: {
      height: 60,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    itemsListView: {

    },
    itemView: {

    },
    minimodalHeaderView: {
      height: 60,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    minimodalContentsView: {

    }
  })

  return <MiniModal
    theme={theme}
    shown={shown}
    handleClose={handleClose}
  >
    <View style={settingsListWrapperStyle.headerView}>
      <IconButton theme={theme} icon={IconName.back} onPress={handleClose} color={theme.colors.text}/>
      <Text style={theme.theme.headerText}>{header}</Text>
      <IconButton theme={theme} icon={IconName.add} onPress={handleAddNew} color={theme.colors.text}/>
    </View>
    <ScrollView  style={settingsListWrapperStyle.itemsListView}>
      {items.map(item => 
      <Pressable
        key={item.id}
        style={settingsListWrapperStyle.itemView}
        onPress={() => setItemSelected(item)}
      >
        {renderListItem(item, handleItemChange)}
      </Pressable>)}
    </ScrollView>
    <MiniModal
      theme={theme}
      shown={!!itemSelected}
      handleClose={() => setItemSelected(null)}
    >
      {itemSelected && 
        <View>
          <View style={settingsListWrapperStyle.minimodalHeaderView}>
            <IconButton theme={theme} icon={IconName.back} onPress={() => setItemSelected(null)} color={theme.colors.text}/>
            <Text  style={theme.theme.headerText}>{(itemSelected as TrainModeModel | TranslationModel)?.name || (itemSelected as ReminderModel)?.timeInSec}</Text>
          </View>
          <ScrollView style={settingsListWrapperStyle.minimodalContentsView}>
            <Text style={theme.theme.text}>{JSON.stringify(itemSelected as TranslationModel)}</Text>
          </ScrollView>
        </View>
      }
      {itemSelected ? renderEditItem(itemSelected, handleItemChange) : null}
    </MiniModal>
  </MiniModal>
}