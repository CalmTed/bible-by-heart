import React, { FC, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AddressType } from "../models";
import { Button, IconButton } from "./Button";
import { IconName } from "./Icon";
import { WORD } from "../l10n";
import { bibleReference } from "../bibleReference";
import { createAddress } from "../initials";
import { getNumberOfVerses } from "../utils/getNumberOfVerses";
import addressToString from "../utils/addressToString";
import { VIBRATION_PATTERNS } from "../constants";
import { useAppContext } from "../context/AppContext";

interface AddressPickerModel {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (address: AddressType) => void;
  address?: AddressType;
}

const bookList = bibleReference.map((book) => book.titleShort);

//the title describes what has been PICKED, not which part is being edited — since
//8.1.7 the picker stops on the start verse, so a part-index-driven title could never
//show it (8.2.1a). NaN = not picked yet; a complete address goes to addressToString.
const getPickerTitle: (
  address: AddressType,
  t: (word: WORD) => string
) => string = (address, t) => {
  const book = bibleReference[address.bookIndex];
  if (isNaN(address.bookIndex) || !book) {
    return t("APSelectBook");
  }
  const bookTitle = t(book.longTitle);
  if (isNaN(address.startChapterNum)) {
    return bookTitle;
  }
  if (isNaN(address.startVerseNum)) {
    return `${bookTitle} ${address.startChapterNum + 1}`;
  }
  const start = `${bookTitle} ${address.startChapterNum + 1}:${
    address.startVerseNum + 1
  }`;
  //endChapterNum / endVerseNum are nullable in the model, and unpicked is NaN
  const endChapter = address.endChapterNum;
  if (endChapter === null || isNaN(endChapter)) {
    return start;
  }
  if (address.endVerseNum === null || isNaN(address.endVerseNum)) {
    return `${start}-${endChapter + 1}`;
  }
  return addressToString(address, t);
};

export const AddressPicker: FC<AddressPickerModel> = ({
  visible,
  address,
  onCancel,
  onConfirm
}) => {
  const { theme, t } = useAppContext();
  const isNoAddress = !address;
  const isAddressNull =
    address?.bookIndex === null ||
    address?.startChapterNum === null ||
    address?.startVerseNum === null;
  const isAddressNaN =
    !isNoAddress &&
    (isNaN(address.bookIndex) ||
      isNaN(address.startChapterNum) ||
      isNaN(address.startVerseNum));
  const isAddressProvided = !isNoAddress && !isAddressNull && !isAddressNaN;
  const [tempAddress, setAddress] = useState(
    isAddressProvided ? address : createAddress()
  );
  //address part curently being edited
  const [addressPart, setAddressPart] = useState(
    isAddressProvided
      ? Object.keys(tempAddress)[Object.keys(tempAddress).length - 1]
      : Object.keys(tempAddress)[0]
  );
  useEffect(() => {
    setAddressPart(
      isAddressProvided
        ? Object.keys(tempAddress)[Object.keys(tempAddress).length - 1]
        : Object.keys(tempAddress)[0]
    );
    setAddress(isAddressProvided ? address : createAddress());
  }, [visible]); //dont change this list please:)
  const chaptersNumber = bibleReference[tempAddress.bookIndex]?.chapters.length;
  const versesNumber =
    bibleReference[tempAddress.bookIndex]?.chapters[
      tempAddress[
        addressPart === "startVerseNum" ? "startChapterNum" : "endChapterNum"
      ] || tempAddress.startChapterNum
    ];
  const handleBack = () => {
    const curPartIndex = Object.keys(tempAddress).indexOf(addressPart);
    switch (curPartIndex) {
      case -1:
      case 0:
        onCancel();
        setAddressPart(Object.keys(tempAddress)[0]);
        break;
      default:
        setAddress((prv) => {
          return {
            ...prv,
            [Object.keys(tempAddress)[curPartIndex - 1]]: NaN,
            [Object.keys(tempAddress)[curPartIndex]]: NaN
          };
        });
        setAddressPart(Object.keys(tempAddress)[curPartIndex - 1]);
    }
  };
  const handleListButtonPress: (index: number) => void = (index) => {
    setAddress((prv) => {
      return { ...prv, [addressPart]: index };
    });
    //after the start verse is picked, stop and let the footer offer a primary
    //"add one verse" action with a secondary "extend range" affordance (8.1.7).
    if (addressPart === "startVerseNum") {
      return;
    }
    const curPartIndex = Object.keys(tempAddress).indexOf(addressPart);
    switch (curPartIndex) {
      case -1:
        setAddressPart(Object.keys(tempAddress)[0]);
        break;
      case Object.keys(tempAddress).length - 1: // why not to use exact name? b.c. its index.
        //auto confirming address
        if (!isDoneDisabled) {
          handleConfirm({ ...tempAddress, [addressPart]: index });
        }
        break;
      default:
        setAddressPart(Object.keys(tempAddress)[curPartIndex + 1]);
    }
  };

  const handleListButtonLongPress: (index: number) => void = (index) => {
    //if editing start verse - select just one verse (fill end values with start values)

    if (addressPart === "startVerseNum") {
      handleConfirm({ ...tempAddress, [addressPart]: index });
    } else {
      handleListButtonPress(index);
    }
    Vibration.vibrate(VIBRATION_PATTERNS.APSelectVerse);
  };

  const handleConfirm: (a: AddressType) => void = (address) => {
    if (!address?.endChapterNum) {
      address.endChapterNum = address.startChapterNum;
    }
    if (!address?.endVerseNum) {
      address.endVerseNum = address.startVerseNum;
    }
    onConfirm(address);
  };
  const allBookAddress: AddressType = {
    bookIndex: tempAddress.bookIndex,
    startChapterNum: 0,
    startVerseNum: 0,
    endChapterNum: chaptersNumber,
    endVerseNum:
      bibleReference[tempAddress.bookIndex]?.chapters[chaptersNumber - 1]
  };
  const isDoneDisabled =
    isNaN(tempAddress.bookIndex) ||
    isNaN(tempAddress.startChapterNum) ||
    isNaN(tempAddress.startVerseNum) ||
    // (!tempAddress.endChapterNum || !tempAddress.endVerseNum) ||
    getNumberOfVerses(tempAddress) > 500 ||
    //if more then one chapter and more then half of the book
    (tempAddress.endChapterNum !== tempAddress.startChapterNum &&
      getNumberOfVerses(tempAddress) > getNumberOfVerses(allBookAddress) / 2);
  //once a start verse is chosen, a single verse is already a valid passage — show
  //the primary "add" / secondary "extend range" footer (8.1.7).
  const isStartVerseSelected =
    addressPart === "startVerseNum" && !isNaN(tempAddress.startVerseNum);

  return (
    <Modal visible={visible}>
      <View style={{ ...APstyle.root, backgroundColor: theme.colors.bg }}>
        {/* HEADER */}
        <View style={APstyle.headerView}>
          <IconButton
            style={APstyle.headerBotton}
            icon={IconName.back}
            onPress={handleBack}
          />
          <Text style={{ ...APstyle.headerTitle, color: theme.colors.text }}>
            {getPickerTitle(tempAddress, t)}
          </Text>
          <IconButton
            style={APstyle.headerBotton}
            icon={IconName.done}
            onPress={() => {
              handleConfirm(tempAddress);
            }}
            disabled={isDoneDisabled}
          />
        </View>
        {/* LIST */}
        <View
          style={{
            ...APstyle.listView,
            backgroundColor: theme.colors.bgSecond
          }}
        >
          <ScrollView contentContainerStyle={APstyle.listContent}>
            {addressPart === "bookIndex" &&
              bookList.map((bookItem, i) => {
                const title = bookItem as WORD;
                return (
                  <ListButton
                    key={title}
                    title={t(title)}
                    onPress={() => handleListButtonPress(i)}
                  />
                );
              })}
            {["startChapterNum"].includes(addressPart) &&
              Array.from({ length: chaptersNumber }, (v, i) => i).map(
                (chapter, i) => {
                  const title = (chapter + 1).toString();
                  return (
                    <ListButton
                      key={title}
                      title={title}
                      onPress={() => handleListButtonPress(i)}
                    />
                  );
                }
              )}
            {["endChapterNum"].includes(addressPart) &&
              Array.from({ length: chaptersNumber }, (v, i) => i).map(
                (chapter, i) => {
                  const title = (chapter + 1).toString();
                  if (i < tempAddress.startChapterNum) {
                    return;
                  }
                  return (
                    <ListButton
                      key={title}
                      title={title}
                      onPress={() => handleListButtonPress(i)}
                    />
                  );
                }
              )}
            {["startVerseNum"].includes(addressPart) &&
              Array.from({ length: versesNumber }, (v, i) => i).map(
                (verse, i) => {
                  const title = (verse + 1).toString();
                  return (
                    <ListButton
                      key={title}
                      title={title}
                      onPress={() => handleListButtonPress(i)}
                      onLongPress={() => handleListButtonLongPress(i)}
                      selected={
                        isStartVerseSelected && i === tempAddress.startVerseNum
                      }
                    />
                  );
                }
              )}
            {["endVerseNum"].includes(addressPart) &&
              Array.from({ length: versesNumber }, (v, i) => i).map(
                (verse, i) => {
                  const title = (verse + 1).toString();
                  if (
                    tempAddress.startChapterNum === tempAddress.endChapterNum &&
                    i < tempAddress.startVerseNum
                  ) {
                    return;
                  }
                  return (
                    <ListButton
                      key={title}
                      title={title}
                      onPress={() => handleListButtonPress(i)}
                    />
                  );
                }
              )}
          </ScrollView>
        </View>
        {/* SINGLE-VERSE FOOTER — one verse is enough by default (8.1.7).
            A real row in the layout flow, so it can never cover the last
            row of verses the way the absolute one did (8.2.1a). */}
        {isStartVerseSelected && (
          <View
            style={{
              ...APstyle.footerView,
              backgroundColor: theme.colors.bgSecond
            }}
          >
            <Button
              type="transparent"
              title={t("APExtendRange")}
              onPress={() =>
                setAddressPart(
                  Object.keys(tempAddress)[
                    Object.keys(tempAddress).indexOf("startVerseNum") + 1
                  ]
                )
              }
            />
            <Button
              type="main"
              color="green"
              title={t("APAddVerse")}
              style={APstyle.footerPrimary}
              onPress={() => handleConfirm(tempAddress)}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const ListButton: FC<{
  title: string;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}> = ({ title, onPress, onLongPress = () => {}, selected = false }) => {
  const { theme } = useAppContext();
  const label = (
    <Text style={{ ...APstyle.listButtonLabel, color: theme.colors.text }}>
      {title}
    </Text>
  );
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
      {selected ? (
        //the app's selected idiom is a gradient ring over bgSecond, the same one
        //`Button type="outline"` draws — not a flat mainColor fill (8.2.1a).
        <LinearGradient
          colors={[theme.colors.gradient1, theme.colors.gradient2] as const}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={APstyle.listButtonSelected}
        >
          <View
            style={{
              ...APstyle.listButtonSelectedInner,
              backgroundColor: theme.colors.bgSecond
            }}
          >
            {label}
          </View>
        </LinearGradient>
      ) : (
        <View style={APstyle.listButton}>{label}</View>
      )}
    </TouchableOpacity>
  );
};
const APstyle = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%"
  },
  headerView: {
    height: 100,
    paddingTop: 50,
    alignContent: "center",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerTitle: {
    flex: 1,
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
    flex: 1,
    width: "100%"
  },
  listContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
    justifyContent: "space-evenly",
    paddingVertical: 8
  },
  listButton: {
    width: 66,
    justifyContent: "center",
    alignItems: "center",
    aspectRatio: 1
  },
  listButtonSelected: {
    width: 66,
    aspectRatio: 1,
    borderRadius: 33,
    padding: 2
  },
  listButtonSelectedInner: {
    flex: 1,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center"
  },
  listButtonLabel: {
    textTransform: "capitalize",
    fontSize: 15
  },
  footerView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8
  },
  footerPrimary: {
    paddingHorizontal: 40
  }
});
