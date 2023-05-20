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
    //validate address copy start to end if one verse selected 
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
  const handleFilterChange:(arg: {category?: string, selectedLevel?: PASSAGE_LEVEL}) => void = ({category, selectedLevel}) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.toggleFilter,
        payload: {
          category: category,
          selectedLevel: selectedLevel
        }
      });
      return newState ? newState : prv;
    })
  }


  const filteredPassages = state.passages.filter(p => 
    p.verseText.toLowerCase().includes(searchText.toLowerCase())
    || addressToString(p.address, t).toLowerCase().includes(searchText.toLowerCase())
    || p.tags.join("").toLowerCase().includes(searchText.toLowerCase())
  )
  const sortedPassages = filteredPassages.sort((a, b) => {
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
    switch(state.sort){
      case SORTING_OPTION.adress:
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
  
  // const secondaryText = 
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
  const renderLeftActions = (progress:Animated.AnimatedInterpolation<string | number>, dragX:Animated.AnimatedInterpolation<string | number>) => {
    
    return <Animated.View style={[
      {
        ...listStyle.swipeableAnimatedView,
      },
    ]}>
      <Button title={t("Archive")} onPress={onArchive} />
    </Animated.View>
  }
  const renderRightActions = (progress:Animated.AnimatedInterpolation<string | number>, dragX:Animated.AnimatedInterpolation<string | number>) => {
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
        return passage.maxLevel;
      case SORTING_OPTION.selectedLevel:
        return passage.selectedLevel;
      case SORTING_OPTION.resentlyCreated:
        return timeToString(passage.dateCreated);
      case SORTING_OPTION.oldestToTrain:
        return timeToString(passage.dateTested);
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