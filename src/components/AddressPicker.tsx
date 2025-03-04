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
import { AddressType } from "../models";
import { IconButton } from "./Button";
import { IconName } from "./Icon";
import { WORD } from "../l10n";
import { bibleReference } from "../bibleReference";
import { createAddress } from "../initials";
import { ThemeAndColorsModel } from "../tools/getTheme";
import { getNumberOfVerses } from "src/tools/getNumberOfVerses";
import { VIBRATION_PATTERNS } from "src/constants";

interface AddressPickerModel {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (address: AddressType) => void;
  t: (w: WORD) => string;
  address?: AddressType;
  theme: ThemeAndColorsModel;
}

const bookList = bibleReference.map((book) => book.titleShort);

export const AddressPicker: FC<AddressPickerModel> = ({
  visible,
  address,
  onCancel,
  onConfirm,
  t,
  theme,
}) => {
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
    const curPartIndex = Object.keys(tempAddress).indexOf(addressPart);
    switch (curPartIndex) {
      case -1:
        setAddressPart(Object.keys(tempAddress)[0]);
        break;
      case Object.keys(tempAddress).length - 1:
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
    
    if(addressPart === "startVerseNum"){
      handleConfirm({ ...tempAddress, [addressPart]: index });
    }else{
      handleListButtonPress(index)
    }
    Vibration.vibrate(VIBRATION_PATTERNS.APSelectVerse)
  }

  const handleConfirm: (a: AddressType) => void = (address) => {
    if(address?.endChapterNum){
      address.endChapterNum = address.startChapterNum
    }
    if(address?.endVerseNum){
      address.endVerseNum = address.startVerseNum
    }
    onConfirm(address);
  }
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

  const TitleLabel: (a:{addressPart: string, tempAddress: AddressType}) => React.JSX.Element = ({addressPart, tempAddress}) => {
    const curPartIndex = Object.keys(tempAddress).indexOf(addressPart);
    const book = curPartIndex < 1 ? t("APSelectBook") : t(bibleReference[tempAddress.bookIndex]?.longTitle as WORD);
    const startChapter = curPartIndex < 2 ? "" : tempAddress?.startChapterNum + 1
    const startVerse = curPartIndex < 3 ? "" : tempAddress?.startVerseNum + 1
    const endChapter = curPartIndex < 4 ? "" : (tempAddress?.endChapterNum || tempAddress.startChapterNum) + 1
    const endVerse = curPartIndex < 5 ? "" : (tempAddress?.endVerseNum || tempAddress.startVerseNum) + 1
    return (<Text style={{ ...APstyle.headerTitle, color: theme.colors.text }}>
      {book} {startChapter}:{startVerse} - {endChapter}:{endVerse}
    </Text>)
  }
  return (
    <Modal visible={visible}>
      {/* HEADER */}
      <View style={{ ...theme.theme.view, ...APstyle.headerView }}>
        <IconButton
          theme={theme}
          style={APstyle.headerBotton}
          icon={IconName.back}
          onPress={handleBack}
        />
        <TitleLabel addressPart={addressPart} tempAddress={tempAddress}/>
        <IconButton
          theme={theme}
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
        <ScrollView>
          <View style={APstyle.listView}>
            {addressPart === "bookIndex" &&
              bookList.map((bookItem, i) => {
                const title = bookItem as WORD;
                return (
                  <ListButton
                    key={title}
                    title={t(title)}
                    onPress={() => handleListButtonPress(i)}
                    theme={theme}
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
                      theme={theme}
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
                      theme={theme}
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
                      theme={theme}
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
                      theme={theme}
                    />
                  );
                }
              )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const ListButton: FC<{
  title: string;
  onPress: () => void;
  onLongPress?: () => void;
  theme: ThemeAndColorsModel;
}> = ({ title, onPress, onLongPress = () => {}, theme }) => {
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
      <View style={APstyle.listButton}>
        <Text
          style={{
            ...APstyle.listButtonLabel,
            color: theme.colors.text
          }}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
const APstyle = StyleSheet.create({
  headerView: {
    height: 60,
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
    height: "93%",
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "stretch",
    justifyContent: "space-evenly"
  },
  listButton: {
    width: 66,
    justifyContent: "center",
    alignItems: "center",
    aspectRatio: 1
  },
  listButtonLabel: {
    textTransform: "capitalize",
    fontSize: 15
  }
});
