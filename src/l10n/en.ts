import { SORTINGOPTION, STATSMETRICS, THEMETYPE } from "../constants";

export const en = {
  name: "English",
  flag: "🇺🇸",
  appName: "Bible by heart",
  AboutHeader: "About Bible by heart",
  AboutText:
    "An app to learn Bible verses by heart. The tool for those who want to create a habit to learn and repeat veses everyday",
  LegalHeader: "Legal information",
  LegalText:
    "This app uses API(application programming intarface) to get Bible translations(ESV, UCVNTR). These translation can not be freely distributed, but with the folowing conditions. By using this app you agree to follow following conditions:",
  LegalText2:
    "ESV: Scripture quotations marked “ESV” are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated into any other language. Users may not copy or download more than 500 verses of the ESV Bible or more than one half of any book of the ESV Bible.",
  //buttons
  homePractice: "Practice",
  homeList: "List",
  homeSettings: "Settings",
  homeStats: "Statistics",
  Archive: "Archive",
  Unrchive: "Unrchive",
  Archived: "Archived",
  Disabled: "Disabled",
  Add: "Add",
  Remove: "Remove",
  Edit: "Edit",
  Continue: "Continue",
  Submit: "Submit",
  ShowAnswer: "Show answer",
  Reset: "Reset",
  Fetch: "Fetch",
  Cancel: "Cancel",
  Level: "Level",
  MaxLevel: "Max level",
  SelectedLevel: "Selected level",
  AddPassages: "Add passages",
  AddPassage: "Add passage",
  Close: "Close",
  RestartTests: "Restart session",
  CheckText: "Check text",
  LevelSkip: "Skip level",
  ButtonContinue: "Contunue",
  DowngradeLevel: "Downgrade level",
  [SORTINGOPTION.address]: "Address",
  [SORTINGOPTION.selectedLevel]: "Selected level",
  [SORTINGOPTION.maxLevel]: "Max level",
  [SORTINGOPTION.oldestToTrain]: "Oldest to train",
  [SORTINGOPTION.resentlyCreated]: "Recently created",
  TranslationSetDefault: "Set as default",
  TranslationIsDefault: "Translation is defualt",

  [THEMETYPE.auto]: "System default",
  [THEMETYPE.dark]: "Dark",
  [THEMETYPE.light]: "Light",

  [STATSMETRICS.minutes]: "Minutes",
  [STATSMETRICS.verses]: "Sum of verses",
  [STATSMETRICS.sesstions]: "Sessions",
  //titles
  listScreenTitle: "Passages list",
  statsScreenTitle: "Statistics",
  APSelectBook: "Select book",
  EditPassageTitle: "Edit passage",
  titleWelldone: "Well done",
  LevelPickerHeading: "Select level",
  settingsScreenTitle: "Settings",
  TitleSort: "Sorting",
  TitleFilters: "Filters",
  Repeat: "Repeat every",
  NextRepeat: "Next time",

  notificationTitle1: "Ready to practice verses?",
  notificationTitle2: "Don't forget to train Bible verses!",
  notificationTitle3: "Have some free time?",
  notificationBody1: "Anyway don't forget to do so 😌",
  notificationBody2: "And even if you did, here is a reminder for you ☝️",
  notificationBody3:
    "Surely you know that free time is a question of priorities 😏",

  //subtexts
  DateCreated: "Date created",
  DateEdited: "Date edited",
  DateTested: "Date tested",
  Never: "Never",
  AddTag: "Add tag...",
  TranslationLabel: "Translation",
  LevelLabel: "Level",
  LevelSelectAddress: "Select address",
  LevelStartWritingPassage: "Start writing passage",
  LevelWritePassageText: "Write passage text",
  LevelPickerSubtext:
    "Train this passage several times without an error to open next level",
  LevelPickerSubtextSecond: "Level will change next time",
  LevelPickerSubtextL5: "Perfect stroke",
  TestsAddPassagesToTest: "Add some passages to list to be able to test them",
  version: "Version",
  TestsCompleted: "Tests completed",
  ErrorsMade: "Errors made",
  NumberOfPassages: "Number of passages",
  NumberOfVerses: "Number of verses",
  NumberOfVersesLeanredAddress: "Verses with address learned",
  NumberOfVersesLeanredText: "Verses with text learned",
  FinishPassage: "Finish passage text",
  FinishPassageL5: "Finish passage without any autocomplete",
  LevelL40Hint: "Press Enter to select first autocomplete option from list",
  LevelL50Warning:
    "Warning! More than one character was entered. Next time it will be consideres as an error",
  PassagesHidden: "Passages hidden",
  DaysStroke: "Days stroke",
  NoTagsFound: "Add tags to passages to add them here",
  Tags: "Tags",
  Translations: "Translations",
  fetchPropositionText: "Do you want to fetch passage text?",
  Loading: "Loading...",
  NotAFetchableTranslation: "Enter passage text here",
  //settings lables, headers and subtexts
  settsLabelMain: "Main",
  settsLabelList: "List",
  settsLabelTests: "Tests",
  settsLabelAbout: "About",
  settsChangeTheme: "Change color theme",
  settsChangeLang: "Change Language",
  settingsExportPassages: "Export passages",
  settingsImportPassages: "Import passages",
  settsExportPassagesSubtext: "Write passales to .txt file",
  settsImportPassagesSubtext: "Read passales from special .txt file",
  settsExported: "Exported!", 
  settsImportedVerses: "Imported verses", 
  settsImported: "Imported!", 
  settsCleared: "Cleared!", 
  settsDevMode: "Dev mode",
  settsHaptics: "Haptics vibration",
  settsLeftSwipeTag: "Right swipe category",
  settsDevPasswordHeader: "Enter answer to number",
  settsDevPasswordPlaceholder: "Write number",
  settsGetDevAnswer: "Get dev answer",
  settsAboutHeader: "About",
  settsAboutSubtext: "description, version",
  settsLegalHeader: "Legal",
  settsLegalSubtext: "legal imformation",
  settsAutoIncreseLevel: "Auto increase level",
  settsExportStateHeader: "Export state",
  settsExportStateSubtext: "Save state data as JSON file",
  settsImportStateHeader: "Import state",
  settsImportStateSubtext: "Open state from JSON file",
  settsClearHistory: "Clear history",
  settsClearPassages: "Clear passages",
  settsClearData: "Reset all data",
  settsOneWayDoor: "⚠️ Data will be lost irretrievably",
  settsEnabled: "Enabled",
  settsDisabled: "Disabled",
  settsTranslationsListHeader: "Translations list",
  settsTranslationsListSubtext: "Edit list of passage Bible translations",
  settsTranslationItemName: "Translation name/code",
  settsTranslationItemLanguage: "Translation language",
  settsLabelStats: "Statistics",
  settsWeeklyMetrics: "Weekly metrics",
  settsLabelReminders: "Reminders",
  settsEnableReminders: "Reminders enabled",
  settsRemindersAutomaticTime: "Automatic reminders time",
  settsRemindersAutomaticTimeSubtext:
    "Analize last month data to get average training time",
  settsRemindersList: "Reminders list",
  settsRemindersListHeader: "Reminders list",
  settsRemindersListSubtext: "List of custom nutifications",
  settsReminderEnabled: "Enable reminder",
  settsTestNotification: "Test notification",
  settingsTrainModesListHeader: "Train modes list",
  settingsTrainModesListSubtext: "List of custom training modes",
  settsTrainModeEnabled: "Show mode in list",
  settsAllPassagesOption: "All",
  settsAsSelectedLevelOption: "As selected",
  settsTrainModeNameInput: "Mode name",
  settsTrainModeLengthHeader: "Number of tasks",
  settsTrainModeLengthSubtext: "number of passages each session",
  settsTrainModeTranslationHeader: "Translation",
  settsTrainModeTranslationSubtext: "filter passages by translation",
  settsTrainModeSortingHeader: "Sorting",
  settsTrainModeSortingSubtext: "sort passages list by",
  settsTrainModeLevelHeader: "Target level",
  settsTrainModeLevelSubtext: "train in a specific level (if avalible)",
  settsTrainModeIncludeTagsHeader:
    "Include tags(if none then all passages are shown)",
  settsTrainModeExcludeTagsHeader: "Exclude tags",
  NewTranslationName: "New translation",
  DefaultTrainModeName: "Default training mode",
  NewTrainModeName: "New training mode",
  settsPrivacyPolicyHeader: "Privacy policy",
  OpenExternalLink: "Open external link",
  DaysLabelSingular: "day",
  DaysLabelTwoThreeFour: "days",
  DaysLabelMultiple: "days",
  statsTotalTimesTested: "Total times tested",
  statsTotalTimeSpent: "Total time spent",
  statsAverageDuration: "Average duration",
  statsAverageTestDuration: "Average test duration",
  statsAverageSessionDuration: "Average session duration",
  statsSessionNumber: "Session number",
  statsTimesTested: "Times tested",
  statsTimeSpent: "Time spent",
  statsMostCommonAddressErrorHeader: "Most common adderss error",
  statsWrongWordsHeatmapHeader: "Wrong words heatmap",
  statsAbsoluteScoreSubtext: "Total score",
  statsScoreCalculatingHintText: "Absolute score is is a sum of all passage scores (number_of_verses * (max_level - 1) * 2). \n\nRelative score(second number) is a difference of this month absolute score and the prevous month",
  statsPassagesNumber: "Passages",
  statsVersesNumber: "Verses",
  statsAddressesLearned: "Addresses learned",
  statsFullyLearned: "Fully learned",
  statsUpgradeDate: "Upgrade date",
  statsDailyTime: "Average time per day",
  statsWeeklyTime: "Average time per week",

  TranslationOther: "Other",
  hrs: "hrs",//hours

  ErrorCantAddMoreEngVerses: "Can't add more then 500 verses in English",
  ErrorNoPassagesForThisTrainMode:
    "There are no passages for this train mode, check train mode list in settings",
  ErrorWhileReadingFile: "Error occured while reading file",
  ErrorWhileWritingFile: "Error occured while writing file",
  ErrorWhileEncoding: "Error occured while encoding",
  ErrorWhileDecoding: "Error occured while decoding",
  CantGenerateTestsForThisTrainMode: "Can't generate tests for selected train mode",
  ErrorInvalidIndexes: "Invalid indexes",
  ErrorConflictedIndexes: "Duplicates",
  ErrorTurnOnRemindersOnImport: "Turn on notifications to see import errors",

  dayMO: "Mo",
  dayTU: "Tu",
  dayWE: "We",
  dayTH: "Th",
  dayFR: "Fr",
  daySA: "Sa",
  daySU: "Su",
  dayEveryday: "Everyday",
  dayWeekdays: "Weekdays",
  dayWeekends: "Weekends",

  bGenShrt: "Gen",
  bGenLong: "Genesis",

  bExoShrt: "Exo",
  bExoLong: "Exodus",

  bLevShrt: "Lev",
  bLevLong: "Leviticus",

  bNumShrt: "Num",
  bNumLong: "Numbers",

  bDeuShrt: "Deu",
  bDeuLong: "Deoteronomy",

  bJoshShrt: "Josh",
  bJoshLong: "Joshua",

  bJudgShrt: "Judg",
  bJudgLong: "Judges",

  bRuthShrt: "Ruth",
  bRuthLong: "Ruth",

  b1SamShrt: "1 Sam",
  b1SamLong: "1 Samuel",

  b2SamShrt: "2 Sam",
  b2SamLong: "2 Samuel",

  b1KinShrt: "1 Kin",
  b1KinLong: "1 Kings",

  b2KinShrt: "2 Kin",
  b2KinLong: "2 Kings",

  b1ChrShrt: "1 Chr",
  b1ChrLong: "1 Chronicles",

  b2ChrShrt: "2 Chr",
  b2ChrLong: "2 Chronicles",

  bEzrShrt: "Ezr",
  bEzrLong: "Ezra",

  bNehShrt: "Neh",
  bNehLong: "Nehemiah",

  bEsthShrt: "Esth",
  bEsthLong: "Esther",

  bJobShrt: "Job",
  bJobLong: "Job",

  bPsShrt: "Ps",
  bPsLong: "Psalm",

  bProvShrt: "Prov",
  bProvLong: "Proverbs",

  bEcclShrt: "Eccl",
  bEcclLong: "Ecclesiastes",

  bSongShrt: "Song",
  bSongLong: "Song of Solomon",

  bIsaShrt: "Isa",
  bIsaLong: "Isaiah",

  bJerShrt: "Jer",
  bJerLong: "Jeremiah",

  bLamShrt: "Lam",
  bLamLong: "Lamentations",

  bEzekShrt: "Ezek",
  bEzekLong: "Ezekiel",

  bDanShrt: "Dan",
  bDanLong: "Daniel",

  bHosShrt: "Hos",
  bHosLong: "Hosea",

  bJoelShrt: "Joel",
  bJoelLong: "Joel",

  bAmShrt: "Am",
  bAmLong: "Amos",

  bObaShrt: "Oba",
  bObaLong: "Obadiah",

  bJonaShrt: "Jona",
  bJonaLong: "Jonah",

  bMicShrt: "Mic",
  bMicLong: "Micah",

  bNahShrt: "Nah",
  bNahLong: "Nahum",

  bHabShrt: "Hab",
  bHabLong: "Habakkuk",

  bZephShrt: "Zeph",
  bZephLong: "Zephaniah",

  bHagShrt: "Hag",
  bHagLong: "Haggai",

  bZechShrt: "Zech",
  bZechLong: "Zechariah",

  bMalShrt: "Mal",
  bMalLong: "Malachi",

  bMatShrt: "Mat",
  bMatLong: "Matthew",

  bMarShrt: "Mar",
  bMarLong: "Mark",

  bLukShrt: "Luk",
  bLukLong: "Luke",

  bJohnShrt: "John",
  bJohnLong: "John",

  bActsShrt: "Acts",
  bActsLong: "Acts",

  bRomShrt: "Rom",
  bRomLong: "Romans",

  b1CorShrt: "1 Cor",
  b1CorLong: "1 Corinthians",

  b2CorShrt: "2 Cor",
  b2CorLong: "2 Corinthians",

  bGalShrt: "Gal",
  bGalLong: "Galatians",

  bEphShrt: "Eph",
  bEphLong: "Ephesians",

  bPhilShrt: "Phil",
  bPhilLong: "Philippians",

  bColShrt: "Col",
  bColLong: "Colossians",

  b1ThsShrt: "1 Ths",
  b1ThsLong: "1 Thessalonians",

  b2ThsShrt: "2 Ths",
  b2ThsLong: "2 Thessalonians",

  b1TimShrt: "1 Tim",
  b1TimLong: "1 Timothy",

  b2TimShrt: "2 Tim",
  b2TimLong: "2 Timothy",

  bTitShrt: "Tit",
  bTitLong: "Titus",

  bPhlmShrt: "Phlm",
  bPhlmLong: "Philemon",

  bHebShrt: "Heb",
  bHebLong: "Hebrews",

  bJamShrt: "Jam",
  bJamLong: "James",

  b1PetShrt: "1 Pet",
  b1PetLong: "1 Peter",

  b2PetShrt: "2 Pet",
  b2PetLong: "2 Peter",

  b1JnShrt: "1 Jn",
  b1JnLong: "1 John",

  b2JnShrt: "2 Jn",
  b2JnLong: "2 John",

  b3JnShrt: "3 Jn",
  b3JnLong: "3 John",

  bJudShrt: "Jud",
  bJudLong: "Jude",

  bRevShrt: "Rev",
  bRevLong: "Revelation"
};
