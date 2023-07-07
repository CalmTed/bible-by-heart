import { FC } from "react"
import { View } from "react-native"
import { SettingsMenuItem } from "../setttingsMenuItem";
import { SETTINGS } from "../../constants";
import { WORD } from "../../l10n";
import { ActionName, AppStateModel } from "../../models";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";

interface TestsSettingsListModel{
  theme: ThemeAndColorsModel
  state:AppStateModel
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>
  t: (w: WORD) => string
}

export const TestsSettingsList: FC<TestsSettingsListModel> = ({theme, state, t, setState}) => {
  
  return <View>
      <SettingsMenuItem
          theme={theme}
          header={t('settsLabelTests')}
          type="label"
      />
      <SettingsMenuItem
          theme={theme}
          header={t('settsHaptics')}
          subtext={t(
              state.settings.hapticsEnabled
                  ? 'settsEnabled'
                  : 'settsDisabled'
          )}
          type="checkbox"
          checkBoxState={state.settings.hapticsEnabled}
          onClick={(value) => {
              setState(
                  (st) =>
                      reduce(st, {
                          name: ActionName.setSettingsParam,
                          payload: {
                              param: SETTINGS.hapticsEnabled,
                              value: value
                          }
                      }) || st
              );
          }}
      />
      <SettingsMenuItem
          theme={theme}
          header={t('settsAutoIncreseLevel')}
          subtext={t(
              state.settings.autoIncreeseLevel
                  ? 'settsEnabled'
                  : 'settsDisabled'
          )}
          type="checkbox"
          checkBoxState={state.settings.autoIncreeseLevel}
          onClick={(value) => {
              setState(
                  (st) =>
                      reduce(st, {
                          name: ActionName.setSettingsParam,
                          payload: {
                              param: SETTINGS.autoIncreeseLevel,
                              value: value
                          }
                      }) || st
              );
          }}
      />
  </View>
}