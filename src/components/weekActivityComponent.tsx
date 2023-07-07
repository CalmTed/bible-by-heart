import { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppStateModel } from '../models';
import { getWeeklyStats } from '../tools/getStats';
import { WORD } from 'src/l10n';
import { ThemeAndColorsModel } from 'src/tools/getTheme';

export const WeekActivityComponent: FC<{
    state: AppStateModel;
    t: (w: WORD) => string;
    theme: ThemeAndColorsModel;
}> = ({ state, t, theme }) => {
    const weekActivityData = getWeeklyStats(state);
    const maxValue = Math.max(...weekActivityData.map((d) => d.number));
    const day = new Date().getDay();
    const weekActivityStyles = StyleSheet.create({
        wrapper: {
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-end',
            height: 100,
            marginBottom: 20
        }
    });
    return (
        <View style={weekActivityStyles.wrapper}>
            {weekActivityData.map((data, i) => {
                return (
                    <DayActivityBar
                        theme={theme}
                        key={data.label}
                        value={data.number}
                        maxValue={maxValue}
                        label={t(data.label as WORD)}
                        isToday={(!!day ? day - 1 : 6) === i} //[0-6], 6 is sunday
                    />
                );
            })}
        </View>
    );
};

const DayActivityBar: FC<{
    value: number;
    maxValue: number;
    label: string;
    isToday: boolean;
    theme: ThemeAndColorsModel;
}> = ({ value, maxValue, label, isToday, theme }) => {
    const barHeight = `${(80 / maxValue) * value + 20}%`;
    const gradientColors = !!value
        ? [theme.colors.gradient1, theme.colors.gradient2]
        : [theme.colors.bgSecond, theme.colors.bgSecond];
    const DayActivityBarStyles = StyleSheet.create({
        dayItemGroup: {
            height: 80,
            minHeight: 20,
            justifyContent: 'flex-end',
            alignItems: 'center'
        },
        itemLabel: {
            color: theme.colors.textSecond,
            textTransform: 'uppercase',
            marginTop: 5,
            fontSize: 10
        },
        itemBar: {
            borderRadius: 20,
            width: 25,
            alignContent: 'center'
        },
        itemNumberText: {
            fontSize: 11,
            color: theme.colors.text,
            textAlign: 'center'
        }
    });
    return (
        <View style={DayActivityBarStyles.dayItemGroup}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0.0, y: 0 }}
                end={{ x: 0.0, y: 1.0 }}
                locations={[0, 1]}
                style={{ ...DayActivityBarStyles.itemBar, height: barHeight }}
            >
                <Text style={DayActivityBarStyles.itemNumberText}>{value}</Text>
            </LinearGradient>
            <Text
                style={{
                    ...DayActivityBarStyles.itemLabel,
                    ...(isToday ? { color: theme.colors.text } : {})
                }}
            >
                {label}
            </Text>
        </View>
    );
};
