import { FC, JSXElementConstructor, ReactElement, useState } from "react"
import { View, Text, ScrollView } from "react-native"
import { SettingsMenuItem } from "../setttingsMenuItem";
import { LANGCODE, PASSAGE_LEVEL, SETTINGS, SORTING_OPTION, archivedName } from "../../constants";
import { WORD, createT } from "../../l10n";
import { ActionName, AppStateModel, OptionModel, ReminderModel, TrainModeModel, TranslationModel } from "../../models";
import { ThemeAndColorsModel } from "../../tools/getTheme";
import { reduce } from "../../tools/reduce";
import { SettingsListWrapper } from "../settingsListWrapper";
import { createTrainMode } from "../../initials";
import { Button } from "../Button";

interface TestsSettingsListModel{
  theme: ThemeAndColorsModel
  state:AppStateModel
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>
  t: (w: WORD) => string
}

export const TestsSettingsList: FC<TestsSettingsListModel> = ({theme, state, t, setState}) => {

    const [trainModesListShown, setTrainModesShown] = useState(false);
    

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
      <SettingsMenuItem
        type="action"
        theme={theme}
        actionCallBack={() => {
            setTrainModesShown(true)
        }}
        header={t("settingsTrainModesListHeader")}
        subtext={t("settingsTrainModesListSubtext")}
      />
      <SettingsListWrapper
        theme={theme}
        shown={trainModesListShown}
        handleClose={() => {setTrainModesShown(false)}}
        header={t("settingsTrainModesListHeader")}
        handleAddNew={() => {
            if(state.settings.trainModesList.length >= 5){
                return;
            }
            setState(
                (st) =>
                    reduce(st, {
                        name: ActionName.setTrainModesList,
                        payload: [
                            ...st.settings.trainModesList,
                            createTrainMode(st.settings.langCode, state.settings.translations.filter(t => t.isDefault)[0].id || 1)
                        ]
                    }) || st
            );
        }}
        handleRemove={ (changedItem) => {
            setState(
                (st) =>
                    reduce(st, {
                        name: ActionName.setTrainModesList,
                        payload: st.settings.trainModesList.filter(item => item.id !== changedItem.id)
                    }) || st
            );
        } }
        handleItemChange={(changedItem) => {
            setState(
                (st) =>
                    reduce(st, {
                        name: ActionName.setTrainModesList,
                        payload: st.settings.trainModesList.map(item => item.id === changedItem.id ? changedItem : item) as TrainModeModel[]
                    }) || st
            );
        } }
        items={state.settings.trainModesList}
        renderListItem={(item, handleChange ) => {
            const trainModeItem = item as TrainModeModel
            return <View>
                <Text style={{...theme.theme.headerText}}>{trainModeItem.name || "---"}</Text>
            </View>
        }}
        renderEditItem={ (item, handleChange, handleRemove) => {
            const trainModeItem = item as TrainModeModel
            const lengthOptins = [
                {value: Infinity.toString(), label: t("settsAllPassagesOption")},
                ...new Array(15).fill(0).map((v,i) => i+5).map(i => ({value: i.toString(), label: i})),
            ] as OptionModel[]
            const levelsOptions = [
                {value: 'null', label: t("settsAsSelectedLevelOption")},
                ...Object.keys(Object.keys(PASSAGE_LEVEL).filter(l => !!parseInt(l))).map(v => ({value: v.toString(), label: `${t("Level")} ${parseInt(v)+1}`}))
            ]
            const allTags = [
                archivedName,
                ...state.passages.map(p => p.tags).flat().filter((v,i,arr) => !arr.slice(0,i).includes(v) && v !== archivedName)
                
            ]
            return <ScrollView>
                <SettingsMenuItem
                    theme={theme}
                    header={t('settsTrainModeNameInput')}
                    type="textinput"
                    value={trainModeItem.name}
                    onChange={(value) => {
                        handleChange({
                            ...trainModeItem,
                            name: value
                        });
                    }}
                    maxLength={20}
                />
                <SettingsMenuItem
                    theme={theme}
                    header={t('settsTrainModeEnabled')}
                    subtext={`${t(
                        trainModeItem.enabled
                            ? 'settsEnabled'
                            : 'settsDisabled'
                    )}`}
                    type="checkbox"
                    checkBoxState={trainModeItem.enabled}
                    onClick={(value) => {
                        handleChange({
                            ...trainModeItem,
                            enabled: value
                        });
                    }}
                    disabled={!trainModeItem.editable}
                />
                <SettingsMenuItem
                    theme={theme}
                    header={t('settsTrainModeLengthHeader')}
                    subtext={`${t('settsTrainModeLengthSubtext')}: ${trainModeItem.length.toString() === "Infinity" ? t("settsAllPassagesOption") : trainModeItem.length}`}
                    type="select"
                    options={lengthOptins}
                    selectedIndex={
                        lengthOptins
                            .map(i => i.value)
                            .indexOf(
                                lengthOptins
                                    .map(i => i.value)
                                    .filter(i => i === trainModeItem.length.toString())[0]
                            )
                    }
                    onSelect={(value) => {
                        handleChange({
                            ...trainModeItem,
                            length: value === 'Infinily' ? Infinity : value as unknown as number
                        });
                    }}
                    disabled={!trainModeItem.editable}
                />
                <SettingsMenuItem
                    theme={theme}
                    header={t('settsTrainModeTranslationHeader')}
                    subtext={`${t('settsTrainModeTranslationSubtext')}: ${state.settings.translations.find(t => t.id === trainModeItem.translation)?.name ?? ""}`}
                    type="select"
                    options={state.settings.translations.map((t) => ({value: t.id.toString(), label: t.name}))}
                    selectedIndex={
                        state.settings.translations
                            .indexOf(
                                state.settings.translations
                                    .filter(t => t.id === trainModeItem.translation)[0]
                            )
                    }
                    onSelect={(value) => {
                        handleChange({
                            ...trainModeItem,
                            translation: parseInt(value)
                        });
                    }}
                />
                <SettingsMenuItem
                    theme={theme}
                    header={t('settsTrainModeSortingHeader')}
                    subtext={`${t('settsTrainModeSortingSubtext')}: ${t(trainModeItem.sort)}`}
                    type="select"
                    options={Object.entries(SORTING_OPTION).map(([k,v]) => ({value: v, label: t(v)}))}
                    selectedIndex={
                        Object.values(SORTING_OPTION)
                            .indexOf(
                                Object.values(SORTING_OPTION)
                                    .filter(i => i === trainModeItem.sort)[0]
                            )
                    }
                    onSelect={(value) => {
                        handleChange({
                            ...trainModeItem,
                            sort: value as SORTING_OPTION
                        });
                    }}
                    disabled={!trainModeItem.editable}
                />
                <SettingsMenuItem
                    theme={theme}
                    header={t('settsTrainModeLevelHeader')}
                    subtext={`${t('settsTrainModeLevelSubtext')}: ${trainModeItem.testAsLevel === null ? t('settsAsSelectedLevelOption') : (trainModeItem.testAsLevel + 1).toString()}`}
                    type="select"
                    options={levelsOptions}
                    selectedIndex={
                        levelsOptions
                            .indexOf(
                                levelsOptions
                                    .filter(({value, label}) => value.toString() === (trainModeItem.testAsLevel?.toString() || "null"))[0]
                            )
                    }
                    onSelect={(value) => {
                        handleChange({
                            ...trainModeItem,
                            testAsLevel: value === 'null' ? null : parseInt(value) as never as PASSAGE_LEVEL
                        });
                    }}
                    disabled={!trainModeItem.editable}
                />
                <SettingsMenuItem
                    theme={theme}
                    t={t}
                    header={t('settsTrainModeIncludeTagsHeader')}
                    type="taglist"
                    optionsList={allTags.filter(t => !trainModeItem.includeTags.includes(t) && !trainModeItem.excludeTags.includes(t))}
                    valuesList={trainModeItem.includeTags}
                    onListChange={(includeTags) => {
                        handleChange({
                            ...trainModeItem,
                            includeTags
                        });
                    }}
                    disabled={!trainModeItem.editable}
                />
                <SettingsMenuItem
                    theme={theme}
                    t={t}
                    header={t('settsTrainModeExcludeTagsHeader')}
                    type="taglist"
                    optionsList={allTags.filter(t => !trainModeItem.includeTags.includes(t) && !trainModeItem.excludeTags.includes(t))}
                    valuesList={trainModeItem.excludeTags}
                    onListChange={(excludeTags) => {
                        handleChange({
                            ...trainModeItem,
                            excludeTags
                        });
                    }}
                    disabled={!trainModeItem.editable}
                />

                <Button
                    theme={theme}
                    color="red"
                    title={t("Remove")}
                    onPress={() => {
                        handleRemove(trainModeItem)
                    }}
                    disabled={!trainModeItem.editable}
                ></Button>    
            </ScrollView>
        }}    
    />
  </View>
}