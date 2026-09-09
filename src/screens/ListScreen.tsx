import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  StyleProp,
  TextStyle
} from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle
} from "react-native-reanimated";
import {
  ANIMATION,
  ARCHIVED_NAME,
  NO_TAGS_NAME,
  ADDRESSLANG,
  LAYOUT,
  SORTINGOPTION,
  SCREEN
} from "../constants";
import {
  ActionName,
  AddressType,
  PassageModel,
  ScreenPropsModel
} from "../models";

import { Header } from "../components/Header";
import { Button, IconButton } from "../components/Button";
import { Icon, IconName } from "../components/Icon";
import { createAddress, createPassage } from "../initials";
import { AddressPicker } from "../components/AddressPicker";
import { createAddressT } from "../addressLanguage";
import { Address } from "../utils/address";
import { Passage } from "../utils/passage";
import ReanimatedSwipeable, {
  SwipeableMethods
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { reduce } from "../utils/reduce";
import { SelectModal } from "../components/SelectModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { timeToString } from "../utils/formatDateTime";
import { useAppContext } from "../context/AppContext";
import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";
import { parseSharedPassage } from "../utils/parseSharedPassage";
import { getTranslationChoice } from "../utils/getTranslationChoice";
import { feedback } from "../utils/feedback";

// The add-passage flow is a sequence of steps, not a pair of independent
// modals: translation -> address -> editor. One value says where the user is,
// so no two steps can be open at once and "back" always has somewhere to go.
type AddFlowStep = "closed" | "translation" | "address";

export const ListScreen: FC<ScreenPropsModel<SCREEN.listPassage>> = ({
  route,
  navigation
}) => {
  const { state, setState, t, theme } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(createAddress);
  const translationChoice = getTranslationChoice(state.settings.translations);
  const addingFirstPassage = state.passages.length === 0;
  // Where the add-passage flow stands. Translation comes BEFORE the address
  //: translations disagree on verse numbering, so which numbering the
  // picker shows has to be decided before a single chapter or verse number is
  // on screen. The step is still skipped silently when the answer is not in
  // doubt — one translation, or none, is chosen for the user.
  const firstAddStep: AddFlowStep = translationChoice.needsChoice
    ? "translation"
    : "address";
  const [addFlowStep, setAddFlowStep] = useState<AddFlowStep>(
    addingFirstPassage ? firstAddStep : "closed"
  );
  // The translation the flow carries to the editor: preselected by
  // getTranslationChoice, replaced by the user's pick when the step is shown.
  const [flowTranslationId, setFlowTranslationId] = useState<
    number | undefined
  >(translationChoice.translationId);

  const [searchText, setSearch] = useState("");
  const [isSortingOpen, setOpenSorting] = useState(false);
  const [passageIdToRemove, setPassageIdToRemove] = useState<number | null>(
    null
  );

  // route.params is undefined whenever the list is reached without args (the
  // primary home->list tap, PassageScreen save, deep link `bbh://passages`).
  // Destructuring it directly crashes the screen — guard with a default.
  const { passageText } = route.params ?? {};

  const handleAddFlowStart = () => {
    setFlowTranslationId(translationChoice.translationId);
    setAddFlowStep(firstAddStep);
  };
  const handleTranslationSelect = (value: string) => {
    setFlowTranslationId(parseInt(value, 10));
    setAddFlowStep("address");
  };
  // Backing out of the picker returns to the step in front of it, so the flow
  // has a real back stack; with the translation step skipped there is nothing
  // behind the picker and the flow simply closes.
  const handleAPCancel = () => {
    setAddFlowStep(translationChoice.needsChoice ? "translation" : "closed");
    setSelectedAddress(createAddress);
  };
  const handleAPSubmit = (address: AddressType) => {
    setAddFlowStep("closed");
    const newPassage = createPassage(
      address,
      "",
      flowTranslationId,
      state.userData.uuid !== null ? state.userData.uuid : undefined
    );
    const versesInEnglish = Passage.countEnglishVerses(
      state.settings.translations,
      [...state.passages, newPassage]
    );
    if (versesInEnglish >= 500) {
      logger.write("English verses number limit reached");
      toastShow(t("ErrorCantAddMoreEngVerses"), 10000);
      return;
    }
    // Open the editor screen to add a passage at this address, with the
    // translation the flow has already settled. Nothing is persisted until the
    // user taps Save there (momentary/draft edit).
    navigation.navigate(SCREEN.passage, {
      address,
      translationId: flowTranslationId
    });
  };
  // Row-facing handlers are wrapped in useCallback so their identities stay
  // stable across renders — this is what lets the React.memo'd ListItem skip
  // re-rendering rows whose data didn't change. setState /
  // navigation / setPassageIdToRemove are all referentially stable.
  const handlePESubmit = useCallback(
    (passage: PassageModel) => {
      setState((prv) => {
        const newState = reduce(prv, {
          name: ActionName.setPassage,
          payload: passage
        });
        return newState ? newState : prv;
      });
    },
    [setState]
  );
  const handlePERemove = (id: number) => {
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.removePassage,
        payload: id
      });
      return newState ? newState : prv;
    });
  };
  const handleListItemEdit = useCallback(
    (passage: PassageModel) => {
      navigation.navigate(SCREEN.passage, { passageId: passage.id });
    },
    [navigation]
  );
  const handleListItemToggleTag = useCallback(
    (passage: PassageModel, tag: string) => {
      const newTags = passage.tags.includes(tag)
        ? passage.tags.filter((tg) => tg !== tag)
        : [...passage.tags, tag];
      handlePESubmit({
        ...passage,
        tags: newTags
      });
    },
    [handlePESubmit]
  );
  const handleListItemLongPress = useCallback(
    (passage: PassageModel) => {
      feedback(state.settings, "longPress");
      handlePESubmit({
        ...passage,
        isCollapsed: !passage.isCollapsed
      });
    },
    [handlePESubmit]
  );
  const handleListItemEditTag = useCallback(
    (passage: PassageModel) =>
      handleListItemToggleTag(passage, state.settings.leftSwipeTag),
    [handleListItemToggleTag, state.settings.leftSwipeTag]
  );
  const handleListItemArchive = useCallback(
    (passage: PassageModel) => handleListItemToggleTag(passage, ARCHIVED_NAME),
    [handleListItemToggleTag]
  );
  const handleListItemRemove = useCallback(
    (passage: PassageModel) => setPassageIdToRemove(passage.id),
    []
  );
  const handleSortChange = (option: SORTINGOPTION) => {
    setOpenSorting(false);
    setState((prv) => {
      const newState = reduce(prv, {
        name: ActionName.setSorting,
        payload: option
      });
      return newState ? newState : prv;
    });
  };
  const handleTextFromIntent: (rawText: string) => void = (rawText) => {
    // Shared text comes from arbitrary apps (YouVersion, MyBible…): reference,
    // translation stamp, link and verse in one blob, in untypable characters.
    // `parseSharedPassage` takes it apart — the typing test later demands the
    // exact character.
    const shared = parseSharedPassage(rawText, state.settings.translations);
    // Open the editor screen with the parsed address + verse text (the "confirm
    // before add" step). Nothing is persisted until Save. Passing the parsed
    // fields as small route params — not app state — is the deep-link-friendly
    // path (also reused by the address picker's plain add).
    setAddFlowStep("closed");
    navigation.navigate(SCREEN.passage, {
      address: shared.address,
      passageText: shared.passageText,
      translationId: shared.translationId
    });
  };
  // Run once when shared/intent text arrives (route param), NOT on every render —
  // handleTextFromIntent calls setSelectedPassage with a fresh object, so calling it
  // during render would re-trigger renders endlessly.
  useEffect(() => {
    if (typeof passageText !== "undefined") {
      handleTextFromIntent(passageText);
    }
  }, [passageText]);
  // Memoized on what it actually reads. Every dispatch hands each consumer a new
  // context value, so this used to refilter the whole library on state changes
  // that had nothing to do with it.
  const searchLower = searchText.toLowerCase();
  const filteredPassages = useMemo(
    () =>
      state.passages.filter((p) => {
        // A hide-list, exactly like the three below it: a passage is hidden
        // because it carries a tag the user chose to hide, and for no other
        // reason. It used to be the inverse - shown only if it carried at least
        // one NON-hidden tag - so an untagged passage vanished the moment any
        // tag existed anywhere in the library.
        const isTagFilteringShown = p.tags.length
          ? !p.tags.some((tag) => state.filters.tags.includes(tag))
          : !state.filters.tags.includes(NO_TAGS_NAME);
        const isSelectedLevelFilteringShown =
          state.filters.selectedLevels.filter(
            (SLFilter) => p.selectedLevel === SLFilter
          ).length === 0;
        const isMaxLevelFilteringShown =
          state.filters.maxLevels.filter((MLFilter) => p.maxLevel === MLFilter)
            .length === 0;
        const isTranslationsFilteringShown =
          state.filters.translations.filter(
            (TFilter) => p.verseTranslation === TFilter
          ).length === 0;
        const isSearchMetFilteringNeeded = !!searchLower.length;
        const isSearchFilteringShown = isSearchMetFilteringNeeded
          ? p.verseText.toLowerCase().includes(searchLower) ||
            Address.format(p.address, t).toLowerCase().includes(searchLower) ||
            p.tags.join("").toLowerCase().includes(searchLower)
          : true;
        return (
          isTagFilteringShown &&
          isSearchFilteringShown &&
          isSelectedLevelFilteringShown &&
          isMaxLevelFilteringShown &&
          isTranslationsFilteringShown
        );
      }),
    [state.passages, state.filters, searchLower, t]
  );
  // The FlatList's `data`: a fresh array on every render defeats every
  // memoization below it, so it moves with the filter.
  const sortedPassages = useMemo(
    () =>
      [...filteredPassages].sort((a, b) => {
        switch (state.sort) {
          case SORTINGOPTION.address:
            return Address.order(b.address) - Address.order(a.address);
          case SORTINGOPTION.maxLevel:
            return b.maxLevel - a.maxLevel;
          case SORTINGOPTION.selectedLevel:
            return b.selectedLevel - a.selectedLevel;
          case SORTINGOPTION.resentlyCreated:
            return b.dateCreated - a.dateCreated;
          case SORTINGOPTION.oldestToTrain:
            return a.dateTested - b.dateTested;
          default:
            return 0;
        }
      }),
    [filteredPassages, state.sort]
  );
  // What is actually narrowing the list, named. A list shorter than the library
  // has to say why, and "Archived" is a reason like any other - hiding it is
  // only the default, not an absence of filtering.
  const activeFilterNames = useMemo(() => {
    const names: string[] = [];
    if (state.filters.tags.includes(ARCHIVED_NAME)) {
      names.push(t("Archived"));
    }
    if (state.filters.tags.includes(NO_TAGS_NAME)) {
      names.push(t("FilterNoTags"));
    }
    if (
      state.filters.tags.some(
        (tag) => tag !== ARCHIVED_NAME && tag !== NO_TAGS_NAME
      )
    ) {
      names.push(t("Tags"));
    }
    if (state.filters.selectedLevels.length) {
      names.push(t("SelectedLevel"));
    }
    if (state.filters.maxLevels.length) {
      names.push(t("MaxLevel"));
    }
    if (state.filters.translations.length) {
      names.push(t("Translations"));
    }
    if (searchLower.length) {
      names.push(t("Search"));
    }
    return names;
  }, [state.filters, searchLower, t]);
  // The dot means "you have set something", so the default archived-hidden
  // does not light it. It used to compare two counts, which lit for any
  // archived passage that a search had also hidden.
  const isAnyFilterSet =
    state.filters.tags.some((tag) => tag !== ARCHIVED_NAME) ||
    !!state.filters.selectedLevels.length ||
    !!state.filters.maxLevels.length ||
    !!state.filters.translations.length;
  const listStyle = StyleSheet.create({
    searchView: {
      flexDirection: "row",
      paddingHorizontal: 20,
      alignItems: "center",
      height: 50
    },
    searchTextInput: {
      flex: 1,
      color: theme.colors.text,
      paddingHorizontal: 20,
      fontSize: 16
    },
    listView: {
      width: "100%",
      flex: 1,
      // Search field and rows are one column, so they stop growing together
      //. Unfolded, a row otherwise runs a verse across the whole panel
      // and the sort/filter icons end up a hand's width from the search field.
      // The Header stays full-width on purpose - a bar spans, a column does not.
      maxWidth: LAYOUT.maxContentWidth
    },
    passagesList: {
      flex: 1
    },
    passagesListContent: {
      // The last row scrolls clear of the screen edge instead of ending flush
      // against it, which is what made the list feel like it was cut off rather
      // than finished. The number moved to LAYOUT, where every other scrolling
      // surface now reads it too.
      paddingBottom: LAYOUT.scrollBottomGap
    },
    hiddenLabel: {
      ...theme.theme.subText,
      textAlign: "center",
      paddingTop: 10
    },
    hiddenReasonLabel: {
      ...theme.theme.subText,
      textAlign: "center",
      paddingBottom: 10
    },
    devStatsView: {
      margin: 20
    }
  });
  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      <Header
        title={t("listScreenTitle")}
        onBack={() => navigation.navigate(SCREEN.home)}
        right={<IconButton icon={IconName.add} onPress={handleAddFlowStart} />}
      />
      <View style={listStyle.listView}>
        <View style={listStyle.searchView}>
          <Icon color={theme.colors.textSecond} iconName={IconName.search} />
          <TextInput
            style={listStyle.searchTextInput}
            value={searchText}
            onChangeText={(newVal) => setSearch(newVal)}
          />
          {!!searchText.length && (
            <IconButton icon={IconName.cross} onPress={() => setSearch("")} />
          )}
          <IconButton
            icon={IconName.sort}
            onPress={() => setOpenSorting(true)}
            color={theme.colors.textSecond}
          />
          <IconButton
            icon={IconName.filter}
            onPress={() => navigation.navigate(SCREEN.listFilters)}
            color={theme.colors.textSecond}
            dot={isAnyFilterSet}
          />
        </View>
        <FlatList
          style={listStyle.passagesList}
          data={sortedPassages}
          keyExtractor={(passage) => passage.id.toString()}
          renderItem={({ item: passage }) => (
            <ListItem
              data={passage}
              sort={state.sort}
              leftSwipeTag={state.settings.leftSwipeTag}
              addressLanguage={
                state.settings.translations.find(
                  (tr) => tr.id === passage.verseTranslation
                )?.addressLanguage || state.settings.langCode
              }
              onPress={handleListItemEdit}
              onRemove={handleListItemRemove}
              onToggleTag={handleListItemEditTag}
              onLongPress={handleListItemLongPress}
              onArchive={handleListItemArchive}
            />
          )}
          ListFooterComponent={
            state.passages.length > sortedPassages.length ? (
              <View>
                <Text style={listStyle.hiddenLabel}>{`${t(
                  "PassagesHidden"
                )} ${state.passages.length - sortedPassages.length}`}</Text>
                {!!activeFilterNames.length && (
                  <Text style={listStyle.hiddenReasonLabel}>{`${t(
                    "FilteredBy"
                  )}: ${activeFilterNames.join(", ")}`}</Text>
                )}
              </View>
            ) : null
          }
          initialNumToRender={10}
          windowSize={11}
          removeClippedSubviews
          contentContainerStyle={listStyle.passagesListContent}
          // Scroll feel. The list sits directly under a search field, so
          // dragging it is the natural way to put the keyboard away - and a tap
          // on a row while the keyboard is up should open that row instead of
          // being spent dismissing it, which is what `handled` buys.
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          // One less thing moving over a list whose rows already swipe.
          showsVerticalScrollIndicator={false}
        />
        {/* {state.settings.devModeEnabled && (
          <View style={listStyle.devStatsView}>
            <Text style={theme.theme.text}>
              {t("NumberOfPassages")}: {state.passages.length} {"( "}
              {
                state.passages.filter((p) => p.maxLevel === PASSAGELEVEL.l1)
                  .length
              }{" "}
              {", "}
              {
                state.passages.filter((p) => p.maxLevel === PASSAGELEVEL.l2)
                  .length
              }{" "}
              {", "}
              {
                state.passages.filter((p) => p.maxLevel === PASSAGELEVEL.l3)
                  .length
              }{" "}
              {", "}
              {
                state.passages.filter((p) => p.maxLevel === PASSAGELEVEL.l4)
                  .length
              }{" "}
              {", "}
              {
                state.passages.filter((p) => p.maxLevel === PASSAGELEVEL.l5)
                  .length
              }{" "}
              {")"}
            </Text>
            <Text style={theme.theme.text}>
              {t("NumberOfVerses")}:{" "}
              {state.passages.reduce((ps, p) => ps + p.versesNumber, 0)} {"( "}
              {state.passages
                .filter((p) => p.maxLevel === PASSAGELEVEL.l1)
                .reduce((ps, p) => ps + p.versesNumber, 0)}{" "}
              {", "}
              {state.passages
                .filter((p) => p.maxLevel === PASSAGELEVEL.l2)
                .reduce((ps, p) => ps + p.versesNumber, 0)}{" "}
              {", "}
              {state.passages
                .filter((p) => p.maxLevel === PASSAGELEVEL.l3)
                .reduce((ps, p) => ps + p.versesNumber, 0)}{" "}
              {", "}
              {state.passages
                .filter((p) => p.maxLevel === PASSAGELEVEL.l4)
                .reduce((ps, p) => ps + p.versesNumber, 0)}{" "}
              {", "}
              {state.passages
                .filter((p) => p.maxLevel === PASSAGELEVEL.l5)
                .reduce((ps, p) => ps + p.versesNumber, 0)}{" "}
              {")"}
            </Text>
            <Text style={theme.theme.text}>
              {t("NumberOfVersesLeanredAddress")}
              {": "}
              {state.passages
                .filter((p) =>
                  [PASSAGELEVEL.l3, PASSAGELEVEL.l4, PASSAGELEVEL.l5].includes(
                    p.maxLevel
                  )
                )
                .reduce((ps, p) => ps + p.versesNumber, 0)}
            </Text>
            <Text style={theme.theme.text}>
              {t("NumberOfVersesLeanredText")}
              {": "}
              {state.passages
                .filter((p) => [PASSAGELEVEL.l5].includes(p.maxLevel))
                .reduce((ps, p) => ps + p.versesNumber, 0)}
            </Text>
          </View>
        )} */}
      </View>
      {/* Sorting used to hang off the search row in an anchored popup.
          It read as broken - five options each centred at their own width, no
          dim behind it, and nothing on screen it visibly came from. It is the
          same list of choices SelectModal already draws for every other picker
          in the app: titled, dimmed, centred, one left edge. */}
      <SelectModal
        isShown={isSortingOpen}
        title={t("TitleSort")}
        options={Object.values(SORTINGOPTION).map((option) => ({
          value: option,
          label: t(option)
        }))}
        selectedIndex={Object.values(SORTINGOPTION).indexOf(state.sort)}
        onSelect={(value) => handleSortChange(value as SORTINGOPTION)}
        onCancel={() => setOpenSorting(false)}
      />
      {/* the add-passage flow, in the order the user walks it */}
      <SelectModal
        isShown={addFlowStep === "translation"}
        title={t("SelectTranslationTitle")}
        options={state.settings.translations.map((tr) => ({
          label: tr.name,
          value: tr.id.toString()
        }))}
        selectedIndex={state.settings.translations.findIndex(
          (tr) => tr.id === flowTranslationId
        )}
        onSelect={handleTranslationSelect}
        onCancel={() => setAddFlowStep("closed")}
      />
      <AddressPicker
        visible={addFlowStep === "address"}
        address={selectedAddress}
        translationId={flowTranslationId}
        onCancel={handleAPCancel}
        onConfirm={handleAPSubmit}
      />
      <ConfirmModal
        shown={passageIdToRemove !== null}
        text={t("PassageDeleteConfirmationText")}
        confirmTitle={t("Remove")}
        cancelTitle={t("Cancel")}
        onCancel={() => setPassageIdToRemove(null)}
        onConfirm={() => {
          if (passageIdToRemove !== null) {
            handlePERemove(passageIdToRemove);
          }
          setPassageIdToRemove(null);
        }}
      />
    </View>
  );
};

// The action revealed behind a swiped row. It is a real component, not an
// element returned from the render callback, because it holds a hook —
// ReanimatedSwipeable CALLS renderLeftActions/renderRightActions rather than
// rendering them as a component, so a useAnimatedStyle written inline there
// would be a hook in a plain function. Module level, so it is one type for the
// whole list rather than a fresh one per render.
//
// `progress` is 0 closed, 1 open, and above 1 while overshooting. Clamping it is
// what keeps the button from growing past its own size when the row is dragged
// further than the panel is wide.
const SwipeActionPanel: FC<{
  progress: SharedValue<number>;
  side: "left" | "right";
  children: React.ReactNode;
}> = ({ progress, side, children }) => {
  const revealStyle = useAnimatedStyle(() => {
    const shown = Math.min(1, progress.value);
    return {
      opacity: shown,
      transform: [
        // it trails the row it is coming out from under, instead of already
        // being there in full the instant the finger moves
        {
          translateX:
            (1 - shown) *
            (side === "left" ? -ANIMATION.riseDistance : ANIMATION.riseDistance)
        },
        { scale: ANIMATION.riseScale + shown * (1 - ANIMATION.riseScale) }
      ]
    };
  });
  return (
    <Animated.View style={[swipeActionStyle.panel, revealStyle]}>
      {children}
    </Animated.View>
  );
};

const swipeActionStyle = StyleSheet.create({
  panel: {
    justifyContent: "center",
    height: "100%"
  }
});

// React.memo: the passage list re-renders on every dispatch AND on every search
// keystroke (local state). With stable `t`/`theme` from context, stable
// callbacks, and primitive props (sort/leftSwipeTag/addressLanguage) instead of
// the whole `state` object, a row only re-renders when its OWN passage data
// changes — search typing and unrelated edits skip untouched rows. Callbacks
// receive the passage so the parent can keep one stable reference instead of a
// fresh closure per row.
const ListItemBase: FC<{
  data: PassageModel;
  sort: SORTINGOPTION;
  leftSwipeTag: string;
  addressLanguage: ADDRESSLANG;
  onPress: (passage: PassageModel) => void;
  onToggleTag: (passage: PassageModel) => void;
  onRemove: (passage: PassageModel) => void;
  onLongPress: (passage: PassageModel) => void;
  onArchive: (passage: PassageModel) => void;
}> = ({
  data,
  sort,
  leftSwipeTag,
  addressLanguage,
  onPress,
  onToggleTag,
  onRemove,
  onLongPress,
  onArchive
}) => {
  const { t, theme } = useAppContext();
  const additionalStyles = data.isCollapsed
    ? { overflow: "visible" }
    : { overflow: "hidden", height: 22 };
  const listItemStyle = StyleSheet.create({
    listItemAddress: {
      color: theme.colors.text,
      textTransform: "uppercase",
      fontSize: 18,
      fontWeight: "500"
    },
    secondaryHeader: {
      color: theme.colors.textSecond,
      fontSize: 16
    },
    listItemText: {
      color: theme.colors.textSecond,
      fontSize: 16
    },
    listItemView: {
      backgroundColor: theme.colors.bgSecond,
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
    }
  });
  const limitLegth = (inWord: string) => {
    const maxLength = 15;
    return inWord.length > maxLength
      ? `${inWord.substring(0, maxLength - 3)}...`
      : inWord;
  };
  const tagName =
    leftSwipeTag === ARCHIVED_NAME
      ? data.tags.includes(ARCHIVED_NAME)
        ? t("Unrchive")
        : t("Archive")
      : data.tags.includes(leftSwipeTag)
        ? limitLegth(`${t("Remove")}  ${leftSwipeTag}`)
        : limitLegth(`${t("Add")} ${leftSwipeTag}`);
  // An action closes the panel it was tapped in. Every one of them rewrites the
  // row's own label - "Archive" becomes "Unarchive", the tag button flips to
  // "Remove <tag>" - so leaving the panel open would leave the user staring at
  // a button that has silently become its own opposite.
  const renderLeftActions = (
    progress: SharedValue<number>,
    _translation: SharedValue<number>,
    swipeable: SwipeableMethods
  ) => (
    <SwipeActionPanel progress={progress} side="left">
      <Button
        title={tagName}
        onPress={() => {
          swipeable.close();
          onToggleTag(data);
        }}
      />
    </SwipeActionPanel>
  );
  const renderRightActions = (
    progress: SharedValue<number>,
    _translation: SharedValue<number>,
    swipeable: SwipeableMethods
  ) => (
    <SwipeActionPanel progress={progress} side="right">
      {data.tags.includes(ARCHIVED_NAME) ? (
        <Button
          title={t("Remove")}
          onPress={() => {
            swipeable.close();
            onRemove(data);
          }}
          color="red"
        />
      ) : (
        <Button
          title={t("Archive")}
          onPress={() => {
            swipeable.close();
            onArchive(data);
          }}
          color="green"
        />
      )}
    </SwipeActionPanel>
  );
  const getSecondaryOptions = (
    sortType: SORTINGOPTION,
    passage: PassageModel
  ) => {
    switch (sortType) {
      case SORTINGOPTION.maxLevel:
        return `${t("MaxLevel")} ${passage.maxLevel}`;
      case SORTINGOPTION.selectedLevel:
        return `${t("SelectedLevel")} ${passage.selectedLevel}`;
      case SORTINGOPTION.resentlyCreated:
        return `${timeToString(passage.dateCreated)}`;
      case SORTINGOPTION.oldestToTrain:
        return `${passage.dateTested ? timeToString(passage.dateTested) : t("Never")}`;
    }
  };
  const customT = createAddressT(addressLanguage);
  // The Pressable sits INSIDE the swipeable, wrapping the row and nothing else.
  // The other way round, wrapping the whole `Swipeable`, puts the action
  // panels inside the row's press area, so a tap on the empty part of a
  // revealed panel opened the editor instead of doing nothing.
  return (
    <ReanimatedSwipeable
      friction={2}
      overshootFriction={10}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      <Pressable
        onPress={() => onPress(data)}
        onLongPress={() => onLongPress(data)}
      >
        <View style={listItemStyle.listItemView}>
          <View style={listItemStyle.headerGroup}>
            <Text style={listItemStyle.listItemAddress}>
              {Address.format(data.address, customT)}
            </Text>
            <Text style={listItemStyle.secondaryHeader}>
              {getSecondaryOptions(sort, data)}
            </Text>
          </View>
          <Text
            style={
              {
                ...listItemStyle.listItemText,
                ...additionalStyles
              } as StyleProp<TextStyle>
            }
          >
            {data.verseText}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
};
const ListItem = React.memo(ListItemBase);
ListItem.displayName = "ListItem";
