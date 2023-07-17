import React, { FC, useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AddressType } from '../models';
import { IconButton } from './Button';
import { IconName } from './Icon';
import { WORD } from '../l10n';
import { bibleReference } from '../bibleReference';
import { createAddress, getVersesNumber } from '../initials';
import { ThemeAndColorsModel } from '../tools/getTheme';

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
    theme
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
    const [tempAddres, setAddress] = useState(
        isAddressProvided ? address : createAddress()
    );
    const [addresPart, setAddressPart] = useState(
        isAddressProvided
            ? Object.keys(tempAddres)[Object.keys(tempAddres).length - 1]
            : Object.keys(tempAddres)[0]
    );
    useEffect(() => {
        setAddressPart(
            isAddressProvided
                ? Object.keys(tempAddres)[Object.keys(tempAddres).length - 1]
                : Object.keys(tempAddres)[0]
        );
        setAddress(isAddressProvided ? address : createAddress());
    }, [visible]);//dont change this list please:)
    const chaptersNumber =
        bibleReference[tempAddres.bookIndex]?.chapters.length;
    const versesNumber =
        bibleReference[tempAddres.bookIndex]?.chapters[
            tempAddres[
                addresPart === 'startVerseNum'
                    ? 'startChapterNum'
                    : 'endChapterNum'
            ]
        ];
    const handleBack = () => {
        const curPartIndex = Object.keys(tempAddres).indexOf(addresPart);
        switch (curPartIndex) {
            case -1:
            case 0:
                onCancel();
                setAddressPart(Object.keys(tempAddres)[0]);
                break;
            default:
                setAddress((prv) => {
                    return {
                        ...prv,
                        [Object.keys(tempAddres)[curPartIndex - 1]]: NaN,
                        [Object.keys(tempAddres)[curPartIndex]]: NaN
                    };
                });
                setAddressPart(Object.keys(tempAddres)[curPartIndex - 1]);
        }
    };
    const handleListButtonPress: (index: number) => void = (index) => {
        setAddress((prv) => {
            return { ...prv, [addresPart]: index };
        });
        const curPartIndex = Object.keys(tempAddres).indexOf(addresPart);
        switch (curPartIndex) {
            case -1:
                setAddressPart(Object.keys(tempAddres)[0]);
                break;
            case Object.keys(tempAddres).length - 1:
                //auto confirming address
                if (!isDoneDisabled) {
                    onConfirm({ ...tempAddres, [addresPart]: index });
                }
                break;
            default:
                setAddressPart(Object.keys(tempAddres)[curPartIndex + 1]);
        }
    };
    const allBookAddress: AddressType = {
        bookIndex: tempAddres.bookIndex,
        startChapterNum: 0,
        startVerseNum: 0,
        endChapterNum: chaptersNumber,
        endVerseNum:
            bibleReference[tempAddres.bookIndex]?.chapters[chaptersNumber - 1]
    };
    const isDoneDisabled =
        isNaN(tempAddres.bookIndex) ||
        isNaN(tempAddres.startChapterNum) ||
        isNaN(tempAddres.startVerseNum) ||
        (!isNaN(tempAddres.endChapterNum) && isNaN(tempAddres.endVerseNum)) ||
        getVersesNumber(tempAddres) > 500 ||
        //if more then one chapter and more then half of the book
        (tempAddres.endChapterNum !== tempAddres.startChapterNum &&
            getVersesNumber(tempAddres) > getVersesNumber(allBookAddress) / 2);
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
                <Text
                    style={{ ...APstyle.headerTitle, color: theme.colors.text }}
                >
                    {addresPart === 'bookIndex'
                        ? t('APSelectBook')
                        : `${t(
                              bibleReference[tempAddres.bookIndex]
                                  ?.longTitle as WORD
                          )} ${tempAddres.startChapterNum + 1 || ' _ '}:${
                              tempAddres.startVerseNum + 1 || ' _ '
                          }-${tempAddres.endChapterNum + 1 || ' _ '}:${
                              tempAddres.endVerseNum + 1 || ' _ '
                          }`}
                </Text>
                <IconButton
                    theme={theme}
                    style={APstyle.headerBotton}
                    icon={IconName.done}
                    onPress={() => {
                        onConfirm(tempAddres);
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
                        {addresPart === 'bookIndex' &&
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
                        {['startChapterNum'].includes(addresPart) &&
                            Array.from(
                                { length: chaptersNumber },
                                (v, i) => i
                            ).map((chapter, i) => {
                                const title = (chapter + 1).toString();
                                return (
                                    <ListButton
                                        key={title}
                                        title={title}
                                        onPress={() => handleListButtonPress(i)}
                                        theme={theme}
                                    />
                                );
                            })}
                        {['endChapterNum'].includes(addresPart) &&
                            Array.from(
                                { length: chaptersNumber },
                                (v, i) => i
                            ).map((chapter, i) => {
                                const title = (chapter + 1).toString();
                                if (i < tempAddres.startChapterNum) {
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
                            })}
                        {['startVerseNum'].includes(addresPart) &&
                            Array.from(
                                { length: versesNumber },
                                (v, i) => i
                            ).map((verse, i) => {
                                const title = (verse + 1).toString();
                                return (
                                    <ListButton
                                        key={title}
                                        title={title}
                                        onPress={() => handleListButtonPress(i)}
                                        theme={theme}
                                    />
                                );
                            })}
                        {['endVerseNum'].includes(addresPart) &&
                            Array.from(
                                { length: versesNumber },
                                (v, i) => i
                            ).map((verse, i) => {
                                const title = (verse + 1).toString();
                                if (
                                    tempAddres.startChapterNum ===
                                        tempAddres.endChapterNum &&
                                    i < tempAddres.startVerseNum
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
                            })}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const ListButton: FC<{
    title: string;
    onPress: () => void;
    theme: ThemeAndColorsModel;
}> = ({ title, onPress, theme }) => {
    return (
        <TouchableOpacity onPress={onPress}>
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
        alignContent: 'center',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        textTransform: 'uppercase',
        fontWeight: '500',
        paddingHorizontal: 10
    },
    headerBotton: {
        height: '100%',
        aspectRatio: 1
    },
    listView: {
        height: '93%',
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'stretch',
        justifyContent: 'space-evenly'
    },
    listButton: {
        width: 66,
        justifyContent: 'center',
        alignItems: 'center',
        aspectRatio: 1
    },
    listButtonLabel: {
        textTransform: 'capitalize',
        fontSize: 15
    }
});
