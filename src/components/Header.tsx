import { FC } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StackNavigationHelpers } from '@react-navigation/stack/src/types';
import { IconButton } from './Button';
import { IconName } from './Icon';
import { ThemeAndColorsModel } from '../tools/getTheme';

interface HeaderModel {
    navigation: StackNavigationHelpers;
    showBackButton?: boolean;
    title?: string;
    additionalChild?: React.ReactNode;
    additionalChildren?: React.ReactNode[];
    alignChildren?:
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'space-between'
        | 'space-around'
        | 'space-evenly';
    theme: ThemeAndColorsModel;
}

export const Header: FC<HeaderModel> = ({
    theme,
    navigation,
    title,
    showBackButton,
    additionalChild,
    additionalChildren,
    alignChildren
}) => {
    const handleBack = () => {
        navigation.goBack();
    };
    return (
        <View
            style={{
                ...headerStyle.view,
                justifyContent: alignChildren || 'flex-end',
                alignItems: 'center'
            }}
        >
            {showBackButton && (
                <IconButton
                    theme={theme}
                    onPress={handleBack}
                    icon={IconName.back}
                ></IconButton>
            )}
            {title && (
                <View style={headerStyle.textView}>
                    {title && (
                        <Text
                            style={{
                                ...headerStyle.text,
                                color: theme.colors.text
                            }}
                        >
                            {title}
                        </Text>
                    )}
                </View>
            )}
            {additionalChild}
            {additionalChildren &&
                additionalChildren.map((child, i) => {
                    return <View key={i}>{child}</View>;
                })}
        </View>
    );
};

const headerStyle = StyleSheet.create({
    view: {
        height: 60,
        width: '100%',
        flexDirection: 'row'
    },
    textView: {
        height: '100%',
        justifyContent: 'center',
        marginHorizontal: 20,
        flex: 1
    },
    text: {
        fontSize: 18,
        fontWeight: '500',
        textTransform: 'uppercase'
    }
});
