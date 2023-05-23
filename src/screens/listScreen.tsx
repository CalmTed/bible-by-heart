import React, { FC, useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, StyleProp, TextStyle, Animated, Vibration } from "react-native"
import { storageName, globalStyle, COLOR, archivedName, PASSAGE_LEVEL, SORTING_OPTION } from "../constants"
import { ActionName, AddressType, AppStateModel, PassageModel } from "../models"
import { navigateWithState } from "../screeenManagement"
import { SCREEN } from "../constants";
import { Header } from "../components/Header"
import { Button, IconButton } from "../components/Button"
import { Icon, IconName } from "../components/Icon"
import { createAddress, createPassage, getVersesNumber } from "../initials"
import { AddressPicker } from "../components/AddressPicker"
import { WORD, createT } from "../l10n"
import { ScreenModel } from "./homeScreen"
import storage from "../storage"
import { PassageEditor } from "../components/PassageEditor"
import addressToString from "../tools/addressToString"
import { Swipeable } from "react-native-gesture-handler"
import { reduce } from "../tools/reduce"
import { MiniModal } from "../components/miniModal"
import timeToString from "../tools/timeToString"

export const ListScreen: FC<ScreenModel> = ({route, navigation}) => {
  const oldState = route.params as AppStateModel;
  const [selectedAddress, setSelectedAddress] = useState(createAddress);
  const [isAPOpen, setAPOpen] = useState(false);
  
  const [isPEOpen, setPEOpen] = useState(false);
  const [selectedPassage, setSelectedPassage] = useState(createPassage(createAddress(), ""));
  const [state, setState] = useState(oldState);

  const [searchText, setSearch] = useState("");
  const [isFiltersOpen, setOpenFilters] = useState(false)
  const [isSortingOpen, setOpenSorting] = useState(false)

  const t = createT(state.langCode);
  useEffect(() => {
    setState(oldState);
  }, [JSON.stringify(oldState)]);

  useEffect(() => {
    storage.save({
      key: storageName,
      data: {...state}
    }).then((e) => {
    })
  }, [JSON.stringify(state)]);
  
  const handleAPOpen = () => {
    setAPOpen(true);
  }
  const handleAPCancel = () => {
    setAPOpen(false);
    setSelectedAddress(createAddress);
  }
  const handleAPSubmit = (address: AddressType) => {
    setAPOpen(false);
    setSelectedPassage(createPassage(address, ""));
    setPEOpen(true);
  }
  const handlePECancel = () => {
    setPEOpen(false);
  }
  const handlePESubmit = (passage: PassageModel) => {
    //reduce set pasage
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.setPassage,
        payload: passage
      });
      return newState ? newState : prv;
    })
    setPEOpen(false);
  }
  const  handlePERemove = (id: number) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.removePassage,
        payload: id
      });
      return newState ? newState : prv;
    })
    setPEOpen(false);
  } 
  const handleListItemEdit = (passage: PassageModel) => {
    setSelectedPassage(passage);
    setPEOpen(true);
  } 
  const handleListItemArchive = (passage: PassageModel) => {
    if(passage.tags.includes(archivedName)){
      return;
    }
    handlePESubmit({
      ...passage, tags: [...passage.tags, archivedName]
    })    
  }
  const handleListItemLongPress = (passage: PassageModel) => {
    Vibration.vibrate(30)
    handlePESubmit({
      ...passage, isCollapsed: !passage.isCollapsed
    })    
  }
  const handleSortChange = (option: SORTING_OPTION) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.setSorting,
        payload: option
      });
      return newState ? newState : prv;
    })
  }
  const handleFilterChange:(arg: {tag?: string, selectedLevel?: PASSAGE_LEVEL, maxLevel?: PASSAGE_LEVEL}) => void = ({tag, selectedLevel, maxLevel}) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.toggleFilter,
        payload: {
          tag: tag,
          selectedLevel: selectedLevel,
          maxLevel: maxLevel
        }
      });
      return newState ? newState : prv;
    })
  }

  const allTags = state.passages.map(p => p.tags).flat().filter((v,i,arr) => !arr.slice(0,i).includes(v))
  const filteredPassages = state.passages.filter(p => {
    //way1 if passage have tags:[archive, favorite] and we filter archive it showld be hidden
    //way2 it shuold be shown only if all rules are met
      //so we filter all values that are in state.filter data
    //+ we apply search filter is filter is not empty
    const invertedTags = allTags.filter(at => !state.filters.tags.includes(at))
    const isTagFinteringNedded = invertedTags.length > 0
    const isTagFilteringShown = isTagFinteringNedded ?
      JSON.stringify(invertedTags) === JSON.stringify(p.tags) : 
      true;
    const isSelectedLevelFilteringShown = state.filters.selectedLevels.filter(SLFilter => p.selectedLevel === SLFilter).length === 0
    const isMaxLevelFilteringShown = state.filters.maxLevels.filter(SLFilter => p.maxLevel === SLFilter).length === 0
    const isSearchMetFilteringNeeded = !!searchText.length
    const isSearchFilteringShown = isSearchMetFilteringNeeded ?
      p.verseText.toLowerCase().includes(searchText.toLowerCase())
      || addressToString(p.address, t).toLowerCase().includes(searchText.toLowerCase())
      || p.tags.join("").toLowerCase().includes(searchText.toLowerCase()) :
      true;
    return isTagFilteringShown && isSearchFilteringShown && isMaxLevelFilteringShown && isSearchFilteringShown
  })
  const sortedPassages = filteredPassages.sort((a, b) => {
    switch(state.sort){
      case SORTING_OPTION.adress:
        const getAddressDifference = (a: PassageModel, b: PassageModel) => {
          if(a.address.bookIndex !== b.address.bookIndex){
            return a.address.bookIndex - b.address.bookIndex
          }
          if(a.address.startChapterNum !== b.address.startChapterNum){
            return a.address.startChapterNum - b.address.startChapterNum
          }
          if(a.address.startVerseNum !== b.address.startVerseNum){
            return a.address.startVerseNum - b.address.startVerseNum
          }
          return 0
        }
        return getAddressDifference(a,b);
      case SORTING_OPTION.maxLevel:
        return b.maxLevel - a.maxLevel;
      case SORTING_OPTION.selectedLevel:
        return b.selectedLevel - a.selectedLevel;
      case SORTING_OPTION.resentlyCreated:
        return b.dateCreated - a.dateCreated;
      case SORTING_OPTION.oldestToTrain:
        return a.dateTested - b.dateTested;
      default:
        return 0;
    }
  })
  return <View style={{...globalStyle.screen,...globalStyle.view}}>
    <Header navigation={navigation} showBackButton={false} title={t("listScreenTitle")} additionalChildren={[
      <IconButton icon={IconName.add} onPress={handleAPOpen} />,
      <IconButton icon={IconName.done} onPress={() => navigateWithState({navigation, screen: SCREEN.home, state})} />
    ]} />
    <ScrollView style={listStyle.listView}>
      <View style={listStyle.searchView}>
        <Icon iconName={IconName.search} />
        <TextInput style={listStyle.searchTextInput} value={searchText} onChangeText={(newVal) => setSearch(newVal)}/>
        {!!searchText.length && <IconButton icon={IconName.cross} onPress={() => setSearch("")}/>}
        <IconButton icon={IconName.sort} onPress={() => setOpenSorting(true)}/>
        <IconButton icon={IconName.filter} onPress={() => setOpenFilters(true)}/>
      </View>
      <View>
        {sortedPassages.map(passage => {
          return <ListItem
            key={passage.id}
            data={passage}
            sort={state.sort}
            t={t}
            onPress={() => handleListItemEdit(passage)}
            onRemove={() => handlePERemove(passage.id)}
            onArchive={() => handleListItemArchive(passage)}
            onLongPress={() => handleListItemLongPress(passage)}
          />
        })}
      </View>
      {
        state.passages.length > sortedPassages.length &&
        <Text style={{...globalStyle.subText,textAlign: "center", paddingVertical: 10}}>{`${t("PassagesHidden")} ${state.passages.length - sortedPassages.length}`}</Text>
      }
      {
        state.devMode && 
        <View style={{margin: 20}}>
          <Text style={globalStyle.text}>{t("NumberOfVerses")}: {state.passages.map(p => getVersesNumber(p.address)).reduce((partialSum, a) => partialSum + a, 0)}</Text>
          <Text style={globalStyle.text}>{t("NumberOfPassages")}: {state.passages.length}</Text>
          <Text style={globalStyle.text}>{t("NumberOfPassages") + " " + t("Level") + " " + 1}: {state.passages.filter(p => p.maxLevel === PASSAGE_LEVEL.l1).length}</Text>
          <Text style={globalStyle.text}>{t("NumberOfPassages") + " " + t("Level") + " " + 2}: {state.passages.filter(p => p.maxLevel === PASSAGE_LEVEL.l2).length}</Text>
          <Text style={globalStyle.text}>{t("NumberOfPassages") + " " + t("Level") + " " + 3}: {state.passages.filter(p => p.maxLevel === PASSAGE_LEVEL.l3).length}</Text>
          <Text style={globalStyle.text}>{t("NumberOfPassages") + " " + t("Level") + " " + 4}: {state.passages.filter(p => p.maxLevel === PASSAGE_LEVEL.l4).length}</Text>
          <Text style={globalStyle.text}>{t("NumberOfPassages") + " " + t("Level") + " " + 5}: {state.passages.filter(p => p.maxLevel === PASSAGE_LEVEL.l5).length}</Text>
        </View>
      }
    </ScrollView>
    <MiniModal shown={isSortingOpen} handleClose={() => setOpenSorting(false)}>
      <Text style={globalStyle.headerText}>{t("TitleSort")}</Text>
      {Object.values(SORTING_OPTION).map(option => 
        <Button key={option} type="outline" color={option === state.sort ? "green" : "gray"} title={t(option)} onPress={() => handleSortChange(option)}/>
      )}
      <Button title={t("Close")} onPress={() => setOpenSorting(false)}/>
    </MiniModal>
    <MiniModal shown={isFiltersOpen} handleClose={() => setOpenFilters(false)}>
      <Text  style={globalStyle.headerText}>{t("TitleFilters")}</Text>
      <ScrollView>
      {allTags.map(option => 
        <Button
          key={option}
          type="outline"
          color={state.filters.tags.includes(option) ? "gray" : "green"}
          title={option === archivedName ? t("Archived") : option.slice(0,20)}
          onPress={() => handleFilterChange({tag: option})}
        />
      )}
      <Text style={{...globalStyle.text}}>{t("SelectedLevel")}</Text>
      <View style={{...globalStyle.rowView}}>
        {[PASSAGE_LEVEL.l1,PASSAGE_LEVEL.l2,PASSAGE_LEVEL.l3,PASSAGE_LEVEL.l4,PASSAGE_LEVEL.l5].map(sl => 
          <Button
            key={sl}
            type="outline"
            color={state.filters.selectedLevels.includes(sl) ? "gray" : "green"}
            title={sl.toString()}
            onPress={() => handleFilterChange({selectedLevel: sl})}
          />
        )}
      </View>
      <Text style={{...globalStyle.text}}>{t("MaxLevel")}</Text>
      <View style={{...globalStyle.rowView}}>
        {[PASSAGE_LEVEL.l1,PASSAGE_LEVEL.l2,PASSAGE_LEVEL.l3,PASSAGE_LEVEL.l4,PASSAGE_LEVEL.l5].map(ml => 
          <Button
            key={ml}
            type="outline"
            color={state.filters.maxLevels.includes(ml) ? "gray" : "green"}
            title={ml.toString()}
            onPress={() => handleFilterChange({maxLevel: ml})}
          />
        )}
      </View>
      </ScrollView>
      <Button title={t("Close")} onPress={() => setOpenFilters(false)}/>
    </MiniModal>
    <AddressPicker visible={isAPOpen} address={selectedAddress} onCancel={handleAPCancel} onConfirm={handleAPSubmit} t={t}/>
    <PassageEditor visible={isPEOpen} passage={selectedPassage} onCancel={handlePECancel} onConfirm={handlePESubmit} onRemove={handlePERemove} t={t} />
  </View>
}

const ListItem: FC<{
  data: PassageModel, 
  t:(w: WORD) => string,
  onPress: () => void,
  onArchive: () => void
  onRemove: () => void
  onLongPress: () => void
  sort: SORTING_OPTION
}> = ({data, t, onPress, onArchive, onRemove, onLongPress, sort}) => {
  const additionalStyles = (data.isCollapsed ? {overflow: "visible"} : {overflow: "hidden", height: 22})
  const renderLeftActions = () => {
    
    return <Animated.View style={[
      {
        ...listStyle.swipeableAnimatedView,
      },
    ]}>
      <Button title={t("Archive")} onPress={onArchive} />
    </Animated.View>
  }
  const renderRightActions = () => {
    return <Animated.View style={[
      {
        ...listStyle.swipeableAnimatedView,
      },
    ]}>
      <Button title={t("Remove")} onPress={onRemove} color="red" />
    </Animated.View>
  }
  const getSecondaryOptions = (sort: SORTING_OPTION, passage: PassageModel) => {
    switch(sort) {
      case SORTING_OPTION.maxLevel:
        return `${t("MaxLevel")} ${passage.maxLevel}`;
      case SORTING_OPTION.selectedLevel:
        return `${t("SelectedLevel")} ${passage.selectedLevel}`;
      case SORTING_OPTION.resentlyCreated:
        // return `${t("DateCreated")} ${timeToString(passage.dateCreated)}`;
        return `${timeToString(passage.dateCreated)}`;
      case SORTING_OPTION.oldestToTrain:
        // return `${t("DateTested")} ${timeToString(passage.dateTested)}`;
        return `${timeToString(passage.dateTested)}`;
    }
  }
  return <Pressable onPress={onPress} onLongPress={onLongPress}>
    <Swipeable
    friction={2}
    overshootFriction={10}
    renderLeftActions={renderLeftActions}
    renderRightActions={renderRightActions}>
      <View style={listStyle.listItemView}>
        <View style={listStyle.headerGroup}>
          <Text style={listStyle.listItemAddress}>{addressToString(data.address,t)}</Text>
          <Text style={listStyle.secondaryHeader}>{getSecondaryOptions(sort, data)}</Text>
        </View>
        <Text style={{...listStyle.listItemText, ...additionalStyles} as StyleProp<TextStyle>}>{data.verseText}</Text>
      </View>
    </Swipeable>
  </Pressable>
}

const listStyle = StyleSheet.create({
  searchView: {
    flexDirection: "row",
    paddingHorizontal: 20,
    alignItems: "center",
    height: 50
  },
  searchTextInput: {
    flex: 1,
    color: COLOR.text,
    paddingHorizontal: 20,
    fontSize: 16
  },
  listView: {
    width: "100%",
  },
  listItemView: {
    backgroundColor: COLOR.bgSecond,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    marginVertical: 5
  },
  headerGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 10
  },
  listItemAddress: {
    color: COLOR.text,
    textTransform: "uppercase",
    fontSize: 18,
    fontWeight: "500"
  },
  secondaryHeader: {
    color: COLOR.textSecond,
    fontSize: 16,
  },
  listItemText: {
    color: COLOR.textSecond,
    fontSize: 16
  },
  swipeableAnimatedView:{
    justifyContent: "center",
    height: "100%"
  }
});