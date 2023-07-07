import { PERFECT_TESTS_TO_PRCEED, PASSAGE_LEVEL } from '../constants';
import { ActionModel, ActionName, AppStateModel } from '../models';
import { getPerfectTestsNumber } from './getPerfectTests';
import { getNumberOfVersesInEnglish } from './getNumberOfEnglishVerses';
import { checkSchedule } from './notifications';

export const reduce: (
    state: AppStateModel,
    action: ActionModel
) => AppStateModel | null = (state, action) => {
    let changedState: AppStateModel | null = null;

    switch (action.name) {
        case ActionName.setLang:
            changedState = {
                ...state,
                settings: { ...state.settings, langCode: action.payload }
            };
            break;
        case ActionName.setTheme:
            changedState = {
                ...state,
                settings: { ...state.settings, theme: action.payload }
            };
            break;
        case ActionName.setLeftSwipeTag:
            changedState = {
                ...state,
                settings: { ...state.settings, leftSwipeTag: action.payload }
            };
            break;
        case ActionName.setSettingsParam:
            changedState = {
                ...state,
                settings: {
                    ...state.settings,
                    [action.payload.param]: action.payload.value
                }
            };
            break;
        case ActionName.setPassage:
            //check number of verses, not just esv but others too

            //check is exists
            if (state.passages.find((p) => p.id === action.payload.id)) {
                const changedPassages = state.passages.map((p) =>
                    p.id === action.payload.id
                        ? {
                              ...action.payload,
                              dateEdited: new Date().getTime()
                          }
                        : p
                );
                //if tags changed add to filter new ones
                const allTagsBefore = state.passages
                    .map((p) => p.tags)
                    .flat()
                    .filter((v, i, arr) => !arr.slice(0, i).includes(v));
                const allTagsAfter = changedPassages
                    .map((p) => p.tags)
                    .flat()
                    .filter((v, i, arr) => !arr.slice(0, i).includes(v));
                //add new tags
                //we do not remove old ones b.c. user might be using them
                const newTags = allTagsAfter.filter(
                    (t) => !allTagsBefore.includes(t)
                );
                //blocking to add more then 500 verses on english
                if (
                    getNumberOfVersesInEnglish(
                        state.settings.translations,
                        changedPassages
                    ) > 500
                ) {
                    return state;
                }
                changedState = {
                    ...state,
                    passages: changedPassages,
                    filters: {
                        ...state.filters,
                        tags: [...state.filters.tags, ...newTags]
                    }
                };
            } else {
                changedState = {
                    ...state,
                    passages: [...state.passages, action.payload]
                };
            }
            break;
        case ActionName.setPassagesList:
            changedState = {
                ...state,
                passages: action.payload
            };
            break;
        case ActionName.setDevMode:
            changedState = {
                ...state,
                settings: {
                    ...state.settings,
                    devMode: action.payload
                }
            };
            break;
        case ActionName.removePassage:
            changedState = {
                ...state,
                testsHistory: state.testsHistory.filter(
                    (t) => t.passageId !== action.payload
                ),
                passages: state.passages.filter((p) => p.id !== action.payload)
            };
            break;
        case ActionName.setActiveTests:
            if (!state.testsActive.length) {
                changedState = { ...state, testsActive: action.payload };
            } else {
                changedState = { ...state, testsActive: [] };
            }
            break;
        case ActionName.updateTest:
            const updatedTests = state.testsActive
                .map((t) => {
                    if (t.id === action.payload.test.id) {
                        return {
                            ...action.payload.test,
                            isFinished: action.payload.isRight
                                ? true
                                : t.isFinished,
                            triesDuration:
                                action.payload.test.triesDuration.map(
                                    (td, i, a) =>
                                        i === a.length - 1
                                            ? [...td, new Date().getTime()]
                                            : td
                                )
                        };
                    }
                    return t;
                })
                .sort((a) =>
                    action.payload.isRight
                        ? 0
                        : a.id === action.payload.test.id
                        ? 1
                        : -1
                );
            //sorting active tests to float last wrong one to the end
            const sortedTests = action.payload.isRight
                ? updatedTests
                : [
                      ...updatedTests.filter((t) => !!t.isFinished), //finished
                      ...updatedTests.filter(
                          (t) => !t.isFinished && !t.errorNumber
                      ), //unfinished without error
                      ...updatedTests.filter(
                          (t) => !t.isFinished && !!t.errorNumber
                      ) //unfinished with error
                  ];
            changedState = { ...state, testsActive: sortedTests };
            break;
        case ActionName.finishTesting:
            //updating last test finish time is finished flag
            const testsWithUpdatedLastTest = action.payload.tests.map((t) => {
                return {
                    ...t,
                    triesDuration: t.triesDuration.map((td) =>
                        td.length === 1 ? [...td, new Date().getTime()] : td
                    ),
                    isFinished: true,
                    testData: {}
                };
            });
            //+update history
            const newHistory = [
                ...state.testsHistory,
                ...testsWithUpdatedLastTest
            ];
            const newPassages = state.passages.map((p) => {
                //+update passages max level
                //+update passages new level awalible
                const perfectTestsNumber = getPerfectTestsNumber(newHistory, p);
                const hasErrorFromLastThreeTests =
                    perfectTestsNumber !== PERFECT_TESTS_TO_PRCEED;
                const nextLevel = {
                    [PASSAGE_LEVEL.l1]: PASSAGE_LEVEL.l2,
                    [PASSAGE_LEVEL.l2]: PASSAGE_LEVEL.l3,
                    [PASSAGE_LEVEL.l3]: PASSAGE_LEVEL.l4,
                    [PASSAGE_LEVEL.l4]: PASSAGE_LEVEL.l5
                };
                //if has 3 perfect test stroke and not l5
                const level =
                    !hasErrorFromLastThreeTests &&
                    p.maxLevel !== PASSAGE_LEVEL.l5
                        ? nextLevel[p.maxLevel]
                        : p.maxLevel;
                //if new max level is not the current one
                const flag = level !== p.maxLevel;
                const lastTest = testsWithUpdatedLastTest.find(
                    (t) => t.passageId === p.id
                );
                //update passages last tested time
                const lastTestedTime = lastTest
                    ? lastTest.triesDuration[
                          lastTest.triesDuration.length - 1
                      ]?.[1]
                    : p.dateTested;
                return {
                    ...p,
                    maxLevel: level,
                    selectedLevel:
                        state.settings.autoIncreeseLevel &&
                        level !== p.selectedLevel
                            ? level
                            : p.selectedLevel,
                    isNewLevelAwalible: flag,
                    dateTested: lastTestedTime
                };
            });
            //clear active tests
            changedState = {
                ...state,
                testsActive: [],
                testsHistory: newHistory,
                passages: newPassages
            };
            break;
        case ActionName.setPassageLevel:
            const passagesWithNewLevel = state.passages.map((p) =>
                p.id === action.payload.passageId
                    ? { ...p, selectedLevel: action.payload.level }
                    : p
            );
            changedState = { ...state, passages: passagesWithNewLevel };
            break;
        case ActionName.disableNewLevelFlag:
            changedState = {
                ...state,
                passages: state.passages.map((p) =>
                    p.id === action.payload
                        ? { ...p, isNewLevelAwalible: false }
                        : p
                )
            };
            break;
        case ActionName.setSorting:
            changedState = { ...state, sort: action.payload };
            break;
        case ActionName.toggleFilter:
            //id existed add or remove from list
            const newTags = action.payload.tag
                ? state.filters.tags.includes(action.payload.tag)
                    ? state.filters.tags.filter((c) => c !== action.payload.tag)
                    : [...state.filters.tags, action.payload.tag]
                : state.filters.tags;
            const newSelectedLevels = action.payload.selectedLevel
                ? state.filters.selectedLevels.includes(
                      action.payload.selectedLevel
                  )
                    ? state.filters.selectedLevels.filter(
                          (c) => c !== action.payload.selectedLevel
                      )
                    : [
                          ...state.filters.selectedLevels,
                          action.payload.selectedLevel
                      ]
                : state.filters.selectedLevels;
            const newMaxLevels = action.payload.maxLevel
                ? state.filters.maxLevels.includes(action.payload.maxLevel)
                    ? state.filters.maxLevels.filter(
                          (c) => c !== action.payload.maxLevel
                      )
                    : [...state.filters.maxLevels, action.payload.maxLevel]
                : state.filters.maxLevels;
            const newTranslationFilters = action.payload.translationId
                ? state.filters.translations.includes(
                      action.payload.translationId
                  )
                    ? state.filters.translations.filter(
                          (c) => c !== action.payload.translationId
                      )
                    : [
                          ...state.filters.translations,
                          action.payload.translationId
                      ]
                : state.filters.translations;
            changedState = {
                ...state,
                filters: {
                    tags: newTags,
                    selectedLevels: newSelectedLevels,
                    maxLevels: newMaxLevels,
                    translations: newTranslationFilters
                }
            };
            break;
        case ActionName.setTranslationsList:
            //setting translation to null when deleting translation
            const newPassagesAfterRemovingTranslation =
                state.settings.translations.length > action.payload.length
                    ? state.passages.map((passage) =>
                          action.payload
                              .map((t) => t.id)
                              .indexOf(passage.verseTranslation || NaN) === -1
                              ? { ...passage, translation: null }
                              : passage
                      )
                    : state.passages;
            changedState = {
                ...state,
                passages: newPassagesAfterRemovingTranslation,
                settings: { ...state.settings, translations: action.payload }
            };
            break;
        case ActionName.setRemindersList:
            changedState = {
                ...state,
                settings: { ...state.settings, remindersList: action.payload }
            };
            checkSchedule(changedState);
            break;
        case ActionName.setTrainModesList:
            changedState = {
                ...state,
                settings: { ...state.settings, trainModesList: action.payload }
            };
            break;
        default:
            console.warn('unknown action name: ', action);
    }
    if (changedState) {
        changedState.lastChange = new Date().getTime();
    }
    return changedState;
};
