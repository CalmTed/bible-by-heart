import { FC, useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { OptionModel } from '../models';
import { SelectModal } from './SelectModal';
import { ThemeAndColorsModel } from '../tools/getTheme';
import { LinearGradient } from 'expo-linear-gradient';

type settingsMenuItemModel =
    | {
          theme: ThemeAndColorsModel;
          header: string;
          subtext: string;
          type: 'action';
          actionCallBack: () => void; //aka open modal
          disabled?: boolean;
      }
    | {
          theme: ThemeAndColorsModel;
          header: string;
          subtext: string;
          type: 'checkbox';
          checkBoxState: boolean;
          onClick: (newState: boolean) => void;
          disabled?: boolean;
      }
    | {
          theme: ThemeAndColorsModel;
          header: string;
          subtext: string;
          type: 'select';
          selectedIndex: number;
          options: OptionModel[];
          onSelect: (selectedValue: string) => void;
          disabled?: boolean;
      }
    | {
          theme: ThemeAndColorsModel;
          header: string;
          type: 'label';
      };

export const SettingsMenuItem: FC<settingsMenuItemModel> = (data) => {
    const [selectOpen, setSelectOpen] = useState(false);

    const handleOpenSelectList = () => {
        setSelectOpen(true);
    };
    const handleOptionSelect = (value: string) => {
        setSelectOpen(false);
        if (data.type === 'select') {
            data.onSelect(value);
        }
    };
    const settingsMenuItemStyles = StyleSheet.create({
        view: {
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 15
        },
        labelView: {
            alignItems: 'flex-end',
            paddingTop: 25,
            paddingBottom: 0
            // paddingVertical: 5,
        },
        header: {
            color: data.theme.colors.text,
            fontSize: 21,
            fontWeight: '600'
        },
        subtext: {
            color: data.theme.colors.textSecond,
            fontSize: 14
        },
        label: {
            color: data.theme.colors.textSecond,
            fontSize: 14,
            textTransform: 'uppercase',
            fontWeight: '600'
        },
        checkBoxView: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
        },
        checkBoxWrapper: {
            height: 30,
            width: 55,
            borderRadius: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: '#efe'
        },
        checkBoxCircle: {
            borderRadius: 50,
            height: '100%',
            aspectRatio: 1
        }
    });
    return (
        <View
            style={{
                ...settingsMenuItemStyles.view,
                ...(data.type === 'label'
                    ? settingsMenuItemStyles.labelView
                    : {})
            }}
        >
            {data.type === 'label' && (
                <Text style={settingsMenuItemStyles.label}>{data.header}</Text>
            )}
            {data.type === 'action' && (
                <Pressable
                    style={{...{ width: '100%' },...(data.disabled ? {opacity: 0.5} : {})}}
                    onPress={data.actionCallBack}
                    disabled={data.disabled}
                >
                    <Text style={settingsMenuItemStyles.header}>
                        {data.header}
                    </Text>
                    <Text style={settingsMenuItemStyles.subtext}>
                        {data.subtext}
                    </Text>
                </Pressable>
            )}
            {data.type === 'checkbox' && (
                <Pressable
                    onPress={() => data.onClick(!data.checkBoxState)}
                    style={{...settingsMenuItemStyles.checkBoxView, ...(data.disabled ? {opacity: 0.5} : {})}}
                    disabled={data.disabled}
                >
                    <View style={{ maxWidth: '80%' }}>
                        <Text style={settingsMenuItemStyles.header}>
                            {data.header}
                        </Text>
                        <Text style={settingsMenuItemStyles.subtext}>
                            {data.subtext}
                        </Text>
                    </View>
                    <View>
                        <View
                            style={{
                                ...settingsMenuItemStyles.checkBoxWrapper
                            }}
                        >
                            <LinearGradient
                                colors={
                                    data.checkBoxState
                                        ? [
                                              data.theme.colors.gradient2,
                                              data.theme.colors.gradient1
                                          ]
                                        : [
                                              data.theme.colors.textSecond,
                                              data.theme.colors.textSecond
                                          ]
                                }
                                start={{ x: 0.0, y: 0 }}
                                end={{ x: 0.0, y: 1.0 }}
                                locations={[0, 1]}
                                style={{
                                    width: '100%',
                                    padding: 3
                                }}
                            >
                                <View
                                    style={{
                                        ...settingsMenuItemStyles.checkBoxCircle,
                                        backgroundColor: data.checkBoxState
                                            ? data.theme.colors.text
                                            : data.theme.colors.bgSecond,
                                        marginLeft: data.checkBoxState
                                            ? '50%'
                                            : '0%'
                                    }}
                                ></View>
                            </LinearGradient>
                        </View>
                    </View>
                </Pressable>
            )}
            {data.type === 'select' && (
                <View style={{ width: '100%' }}>
                    <Pressable
                        onPress={handleOpenSelectList}
                        style={(data.disabled ? {opacity: 0.5} : {})}
                        disabled={data.disabled}
                    >
                        <Text style={settingsMenuItemStyles.header}>
                            {data.header}
                        </Text>
                        <Text style={settingsMenuItemStyles.subtext}>
                            {data.subtext}
                        </Text>
                    </Pressable>
                    <SelectModal
                        theme={data.theme}
                        isShown={selectOpen}
                        options={data.options}
                        selectedIndex={data.selectedIndex}
                        onSelect={handleOptionSelect}
                        onCancel={() => setSelectOpen(false)}
                    />
                </View>
            )}
        </View>
    );
};
