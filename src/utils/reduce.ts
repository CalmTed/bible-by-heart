import {
  PERFECT_TESTS_TO_PROCEED,
  PASSAGELEVEL,
  TESTLEVEL,
  DEFAULT_TRAINMODE_ID,
  ARCHIVED_NAME,
  DAY
} from "../constants";
import {
  ActionModel,
  ActionName,
  AppStateModel,
  PassageModel,
  TestModel,
  TrainModeModel
} from "../models";
import { getPerfectTestsNumbers } from "./getPerfectTests";
import { checkSchedule } from "./notifications";
import {
  generateATest,
  generateStudyOneTests,
  generateTests,
  getPassagesByTrainMode
} from "./generateTests";
import { createAppState, createTest } from "../initials";
import { sortTranslations } from "./translation";
import { logger } from "./logger";

export const reduce: (
  state: AppStateModel,
  action: ActionModel
) => AppStateModel | null = (state, action) => {
  let changedState: AppStateModel | null = null;
  switch (action.name) {
    case ActionName.setLang:
      let defaultLangChanged = false; //this flag is to set new default translation only once, if there are few translations in the same language
      const noPassages = !state.passages.length;
      // Changing the interface language moves the default translation to one
      // written in it. An address language the interface does not speak can
      // never be the same as it, so a translation like the Синодальний is never
      // picked as a default by this rule and never un-defaulted by it either -
      // it simply is not in the running, which is the whole reason the address
      // language is a wider type than the interface one.
      const updatedTranslations = state.settings.translations.map(
        (translation) => {
          const isDefault = translation.isDefault;
          const isTransLangSameAsInterface =
            action.payload === translation.addressLanguage;
          if (!isDefault && isTransLangSameAsInterface && !defaultLangChanged) {
            defaultLangChanged = true;
            return { ...translation, isDefault: true };
          }
          if (isDefault && !isTransLangSameAsInterface) {
            return { ...translation, isDefault: false };
          }
          return translation;
        }
      );
      const updatedTrainModesList = state.settings.trainModesList.map(
        (trainMode) => {
          const isDefault = trainMode.id === DEFAULT_TRAINMODE_ID;
          const modeTranslationLangauge = state.settings.translations.filter(
            (translation) => translation.id === trainMode.translation
          )?.[0]?.addressLanguage; //seting undefined if there are no corresponding translation
          const isModeLangSameAsInterface =
            action.payload === modeTranslationLangauge;
          const defaultTranslation = updatedTranslations.find(
            (translation) => translation.isDefault
          );
          // There may be no default to move to: the rule above only ever marks
          // one written in the new interface language, and the user may have
          // deleted every translation in it. The mode then keeps the
          // translation it had, which is the one thing that is certainly still
          // there - reaching for `.id` on nothing used to crash the language
          // switch itself.
          if (isDefault && !isModeLangSameAsInterface && defaultTranslation) {
            return { ...trainMode, translation: defaultTranslation.id };
          } else {
            return trainMode;
          }
        }
      );
      changedState = {
        ...state,
        settings: {
          ...state.settings,
          langCode: action.payload,
          translations: noPassages
            ? updatedTranslations
            : state.settings.translations,
          trainModesList: noPassages
            ? updatedTrainModesList
            : state.settings.trainModesList
        }
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
                verseText: action.payload.verseText.trim(),
                dateEdited: new Date().getTime()
              }
            : p
        );

        //why do we get teags only from changes passages
        //why do we need to cahnge tags at all??
        // const newTags = changedPassages
        // const newTags = state.passages
        //   .map((p) => p.tags)
        //   .flat()
        //   //saving only unique
        //   .filter((v, i, arr) => !arr.slice(0, i).includes(v));
        // //blocking to add more then 500 verses on english
        // if (
        //   Passage.countEnglishVerses(
        //     state.settings.translations,
        //     changedPassages
        //   ) > 500
        // ) {
        //   return state;
        // }
        // (JSON.stringify(newTags), JSON.stringify(state.filters.tags))
        changedState = {
          ...state,
          passages: changedPassages
          // filters: {
          // ...state.filters,
          //tags: JSON.stringify(newTags) !== JSON.stringify(state.filters.tags) ? newTags : state.filters.tags
          // }
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
      //TODO: conflicts with set settings param (can change dev mode withount setting time)
      logger.write(
        `[DEV] Changing dev mode to ${action.payload ? "true" : "false"}`
      );
      changedState = {
        ...state,
        settings: {
          ...state.settings,
          devModeEnabled: action.payload,
          devModeActivationTime:
            action.payload && !state.settings.devModeActivationTime
              ? new Date().getTime()
              : state.settings.devModeActivationTime
        }
      };
      break;
    case ActionName.removePassage:
      changedState = {
        ...state,
        testsHistory: state.testsHistory.filter((t) => t.pi !== action.payload),
        passages: state.passages.filter((p) => p.id !== action.payload)
      };
      break;
    case ActionName.clearActiveTests:
      if (state.testsActive.length) {
        changedState = { ...state, testsActive: [] };
      }
      break;
    case ActionName.generateTests:
      //if passages exists
      const nonArchivedPassages = state.passages.filter(
        (p) => !p.tags.includes(ARCHIVED_NAME)
      );
      if (nonArchivedPassages.length === 0) {
        //TODO show the reason to user
        break;
      }
      //if trainMode filtered passages exists
      //selected or default(settings.activeMode)
      const selectedTrainMode = state.settings.trainModesList.filter((t) =>
        action.trainModeId
          ? t.id === action.trainModeId
          : t.id === state.settings.activeTrainModeId
      )[0];
      const slectedTrainModeWithPassageLanguage: TrainModeModel = {
        ...selectedTrainMode,
        translation: nonArchivedPassages[0]?.verseTranslation
      };
      const filteredPassages = getPassagesByTrainMode(state, selectedTrainMode);
      const filteredWithOtherTranslationPassages = getPassagesByTrainMode(
        state,
        slectedTrainModeWithPassageLanguage
      );

      const generatedTests = filteredPassages.length
        ? generateTests(state, selectedTrainMode)
        : generateTests(state, slectedTrainModeWithPassageLanguage);

      let changedDefaultTrainMode: TrainModeModel;
      //if there are no passages other then in unknown translation set default mode language to this language
      if (
        !filteredPassages.length &&
        filteredWithOtherTranslationPassages.length &&
        !selectedTrainMode.editable
      ) {
        changedDefaultTrainMode = slectedTrainModeWithPassageLanguage;
      }
      const changedSettings = {
        ...state.settings,
        trainModesList: state.settings.trainModesList.map((tm) =>
          tm.id === selectedTrainMode.id ? (changedDefaultTrainMode ?? tm) : tm
        ),
        activeTrainModeId: selectedTrainMode.id
      };
      if (generatedTests) {
        changedState = {
          ...state,
          testsActive: generatedTests,
          settings: changedSettings
        };
      } else {
        logger.error("Unable to generate tests");
      }
      break;
    case ActionName.generateStudyOneTests:
      //a drill of one passage: only testsActive changes, so the active train
      //mode and the modes list survive it untouched
      const studyOneTests = generateStudyOneTests(
        state,
        action.payload.passageId
      );
      if (studyOneTests.length) {
        changedState = { ...state, testsActive: studyOneTests };
      } else {
        logger.error(
          `Unable to generate a study session for passage ${action.payload.passageId}`
        );
      }
      break;
    case ActionName.updateTest:
      const updatedTests = [
        ...state.testsActive.map((t) => {
          if (t.i === action.payload.test.i) {
            return {
              ...action.payload.test,
              f: action.payload.isRight ? true : t.f,
              td: action.payload.test.td.map((td, i, a) =>
                i === a.length - 1 ? [...td, new Date().getTime()] : td
              )
            };
          }
          return t;
        })
      ].sort((a) =>
        action.payload.isRight ? 0 : a.i === action.payload.test.i ? 1 : -1
      );
      //sorting active tests to float last wrong one to the end
      const sortedTests = action.payload.isRight
        ? updatedTests
        : [
            ...updatedTests.filter((t) => !!t.f), //finished
            ...updatedTests.filter((t) => !t.f && !t.en), //unfinished without error
            ...updatedTests.filter((t) => !t.f && !!t.en) //unfinished with error
          ];
      changedState = { ...state, testsActive: sortedTests };
      break;
    case ActionName.downgradePassage:
      //check if level is higher then 1
      if ([TESTLEVEL.l10, TESTLEVEL.l11].includes(action.payload.test.l)) {
        break;
      }
      const levelDowngradingMap: PASSAGELEVEL[] = [
        //0
        PASSAGELEVEL.l1,
        //1
        PASSAGELEVEL.l1,
        //level 2
        PASSAGELEVEL.l1,
        //level 3
        PASSAGELEVEL.l2,
        //level 4
        PASSAGELEVEL.l3,
        //level 5
        PASSAGELEVEL.l4
      ];
      const targetPassage = state.passages.find(
        (p) => p.id === action.payload.test.pi
      );
      if (!targetPassage) {
        break;
      }
      //change selected level
      const newPassageLevel = levelDowngradingMap[targetPassage.selectedLevel];
      //remove date of upgrading to max level
      const newUpgradeDates = {
        ...targetPassage.upgradeDates,
        [targetPassage.maxLevel]: 0
      };
      const updatedPassages = state.passages.map((p) =>
        p.id === action.payload.test.pi
          ? ({
              ...p,
              //we taking from selectedLevel, b.c. if selected is hard then max is even harder
              selectedLevel: newPassageLevel,
              maxLevel: newPassageLevel,
              upgradeDates: newUpgradeDates
            } as PassageModel)
          : p
      );
      //regenerate test with new level
      const targetTest: TestModel = state.testsActive.filter(
        (t) => t.i === action.payload.test.i
      )[0];

      const recreatedTest: TestModel = {
        ...generateATest(
          createTest(targetTest.si, targetTest.pi, newPassageLevel),
          state.passages,
          newPassageLevel,
          state.testsHistory
        ),
        wa: targetTest.wa,
        ww: targetTest.ww,
        wp: targetTest.wp
      };
      const updatedActiveTests: TestModel[] = state.testsActive.map((t) =>
        t.i === action.payload.test.i ? recreatedTest : t
      );
      const updatedTestHistory: TestModel[] = [
        ...state.testsHistory,
        {
          ...action.payload.test,
          f: true,
          td: [[action.payload.test.td[0][0], new Date().getTime()]],
          d: {},
          en: (action.payload.test.en || 0) + 1,
          et: [...action.payload.test.et, "downgrading"]
        }
      ];
      changedState = {
        ...state,
        testsHistory: updatedTestHistory,
        testsActive: updatedActiveTests,
        passages: updatedPassages
      };
      break;
    case ActionName.finishTesting:
      //updating last test finish time is finished flag
      const finishingTime = new Date().getTime();
      const testsWithUpdatedLastTest = action.payload.tests.map((t) => {
        //clearing testing data
        //summing triesDuration up to one set from..to
        return {
          ...t,
          td: t.td.map((td) => (td.length === 1 ? [...td, finishingTime] : td)),
          f: true,
          d: {}
        };
      });
      //updating history
      const newHistory = [...state.testsHistory, ...testsWithUpdatedLastTest];
      // One pass over the history for ALL passages: the single-passage form
      // used to filter and sort the whole history once per passage.
      const perfectTests = getPerfectTestsNumbers(newHistory, state.passages);
      const newPassages = state.passages.map((p) => {
        //updating passages max level
        //updating passages new level awalible
        const perfectTestsNumber = perfectTests.get(p.id) || 0;
        const hasErrorFromLastThreeTests =
          perfectTestsNumber <= PERFECT_TESTS_TO_PROCEED;
        const nextLevel = {
          [PASSAGELEVEL.l1]: PASSAGELEVEL.l2,
          [PASSAGELEVEL.l2]: PASSAGELEVEL.l3,
          [PASSAGELEVEL.l3]: PASSAGELEVEL.l4,
          [PASSAGELEVEL.l4]: PASSAGELEVEL.l5
        };
        //if has 4 perfect test stroke and not l5
        const level =
          !hasErrorFromLastThreeTests && p.maxLevel !== PASSAGELEVEL.l5
            ? nextLevel[p.maxLevel]
            : p.maxLevel;
        //if new max level is not the current one
        const flag = level !== p.maxLevel;
        const newUpgradeDates = flag
          ? {
              ...p.upgradeDates,
              [level]: finishingTime
            }
          : p.upgradeDates;
        const lastTest = testsWithUpdatedLastTest.find((t) => t.pi === p.id);
        //update passages last tested time
        const lastTestedTime = lastTest
          ? lastTest.td[lastTest.td.length - 1]?.[1]
          : p.dateTested;
        return {
          ...p,
          maxLevel: level,
          selectedLevel:
            state.settings.autoIncreaseLevel && level !== p.selectedLevel
              ? level
              : p.selectedLevel,
          isNewLevelAwalible: flag,
          dateTested: lastTestedTime,
          upgradeDates: newUpgradeDates
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
          p.id === action.payload ? { ...p, isNewLevelAwalible: false } : p
        )
      };
      break;
    case ActionName.setSorting:
      changedState = { ...state, sort: action.payload };
      break;
    case ActionName.toggleFilter:
      //if existed, add or remove from list
      const newTags = action.payload.tag
        ? state.filters.tags.includes(action.payload.tag)
          ? state.filters.tags.filter((c) => c !== action.payload.tag)
          : [...state.filters.tags, action.payload.tag]
        : state.filters.tags;
      const newSelectedLevels = action.payload.selectedLevel
        ? state.filters.selectedLevels.includes(action.payload.selectedLevel)
          ? state.filters.selectedLevels.filter(
              (c) => c !== action.payload.selectedLevel
            )
          : [...state.filters.selectedLevels, action.payload.selectedLevel]
        : state.filters.selectedLevels;
      const newMaxLevels = action.payload.maxLevel
        ? state.filters.maxLevels.includes(action.payload.maxLevel)
          ? state.filters.maxLevels.filter((c) => c !== action.payload.maxLevel)
          : [...state.filters.maxLevels, action.payload.maxLevel]
        : state.filters.maxLevels;
      //TODO check if translation exists
      const newTranslationFilters = action.payload.translationId
        ? state.filters.translations.includes(action.payload.translationId)
          ? state.filters.translations.filter(
              (c) => c !== action.payload.translationId
            )
          : [...state.filters.translations, action.payload.translationId]
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
    case ActionName.importPassages:
      if (!action?.payload?.passages?.length) {
        break;
      }
      const importedPassages = action.payload.passages;
      //TODO check for conflicts
      changedState = {
        ...state,
        passages: [...state.passages, ...importedPassages]
      };
      break;
    case ActionName.setUserData:
      if (!action.payload) {
        break;
      }
      changedState = {
        ...state,
        settings: {
          ...state.settings,
          langCode: action.payload.applang
            ? action.payload.applang
            : state.settings.langCode
        },
        userData: {
          ...state.userData,
          lastUserDataSync: new Date().getTime(),
          uuid: action.payload.uuid ? action.payload.uuid : state.userData.uuid,
          email: action.payload.email
            ? action.payload.email
            : state.userData.email,
          registrationDate: action.payload.registrationDate
            ? action.payload.registrationDate
            : state.userData.registrationDate,
          isEmailConfirmed: action.payload.isEmailConfirmed
            ? action.payload.isEmailConfirmed
            : state.userData.isEmailConfirmed,
          userName: action.payload.userName
            ? action.payload.userName
            : state.userData.userName,
          userTitle: action.payload.userTitle
            ? action.payload.userTitle
            : state.userData.userTitle,
          userPicture: action.payload.userPicture
            ? action.payload.userPicture
            : state.userData.userPicture,
          birthDate: action.payload.birthDate
            ? action.payload.birthDate
            : state.userData.birthDate,
          userRights: action.payload.userRights
            ? action.payload.userRights
            : state.userData.userRights,
          isProfilePublic: action.payload.isProfilePublic
            ? action.payload.isProfilePublic
            : state.userData.isProfilePublic,
          isDataPublic: action.payload.isDataPublic
            ? action.payload.isDataPublic
            : state.userData.isDataPublic,
          friendRequests: action.payload.friendRequests
            ? action.payload.friendRequests
            : state.userData.friendRequests,
          friends: action.payload.friends
            ? action.payload.friends
            : state.userData.friends,
          blockedUsers: action.payload.blockedUsers
            ? action.payload.blockedUsers
            : state.userData.blockedUsers,
          sessions: action.payload.sessions
            ? action.payload.sessions
            : state.userData.sessions
        }
      };
      break;
    case ActionName.resetUserData:
      changedState = {
        ...state,
        userData: createAppState().userData
      };
      break;
    default:
      logger.error(`Unknown action name Action: ${JSON.stringify(action)}`);
  }
  if (changedState) {
    const timeOfChange = new Date().getTime();
    // Copy-on-write from here down. Every branch above builds a NEW top-level
    // object, but most of them keep the previous state's `settings` object, so
    // assigning into `changedState.settings` writes into the state React has
    // already rendered. That was invisible while the reducer ended in a full
    // deep clone; without it it is a live shared reference. Build a new
    // settings object only when a heal actually fires.
    let settings = changedState.settings;
    if (
      settings.devModeActivationTime &&
      settings.devModeActivationTime + DAY * 1000 < timeOfChange
    ) {
      settings = {
        ...settings,
        devModeActivationTime: null,
        devModeEnabled: false
      };
    }
    // Heal a dangling left-swipe tag. Tags have no registry — they exist only
    // as long as some passage carries them — so removing a tag from every
    // passage can leave settings.leftSwipeTag pointing at a tag that no longer
    // exists. ARCHIVED_NAME is always available, so fall back to it.
    // Centralized here so it covers every passage-mutating action. The scan is
    // O(passages), so run it only when something could have stranded the tag:
    // the passages changed, or settings did (setLeftSwipeTag).
    const swipeTag = settings.leftSwipeTag;
    if (
      (changedState.passages !== state.passages ||
        changedState.settings !== state.settings) &&
      swipeTag !== ARCHIVED_NAME &&
      !changedState.passages.some((p) => p.tags.includes(swipeTag))
    ) {
      settings = { ...settings, leftSwipeTag: ARCHIVED_NAME };
    }
    // Put the translations back in the order every list offers them in. It is
    // healed here rather than converted once, because the order is not a state
    // MODEL change - no shape moves, no id changes - and a state written by an
    // older build, restored from a backup or merged from the catalogue arrives
    // in whatever order it was written in. `sortTranslations` hands the SAME
    // array back when nothing moves, so the common case allocates nothing.
    const orderedTranslations = sortTranslations(settings.translations);
    if (orderedTranslations !== settings.translations) {
      settings = { ...settings, translations: orderedTranslations };
    }
    // Safe to assign: `changedState` is always a fresh top-level object.
    changedState.settings = settings;
    changedState.lastChange = timeOfChange;
  }
  // No deep clone here. It cost a full JSON round-trip of passages + history on
  // EVERY action, which is what made the app feel slow. The only failure it
  // caught — a state that cannot be serialized — is caught by the persist path
  // in AppContext, which stringifies the very same object and already logs and
  // toasts.
  return changedState;
};
