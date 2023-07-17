import React, { LinearGradient } from 'expo-linear-gradient';
import { FC } from 'react';
import { View } from 'react-native';
import { ThemeAndColorsModel } from 'src/tools/getTheme';

export const DotIndicator: FC<{
    theme: ThemeAndColorsModel;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
}> = ({ theme, top = 15, bottom = -15, left = -35, right = 35 }) => {
    return (
        <View
            style={{
                width: 10,
                aspectRatio: 1,
                borderRadius: 100,
                overflow: 'hidden',
                marginLeft: left,
                marginRight: right,
                marginTop: top,
                marginBottom: bottom
            }}
        >
            <LinearGradient
                colors={[theme.colors.gradient1, theme.colors.gradient2]}
                start={{ x: 0.0, y: 0 }}
                end={{ x: 0.0, y: 1.0 }}
                locations={[0, 1]}
                style={{
                    height: '100%',
                    width: '100%'
                }}
            />
        </View>
    );
};
