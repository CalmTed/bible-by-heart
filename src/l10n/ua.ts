import { SORTINGOPTION, STATSMETRICS, THEMETYPE } from "../constants";
import { en } from "./en";

export const ua: typeof en = {
  name: "Українська",
  flag: "🇺🇦",
  appName: "Біблія напам'ять",

  AboutHeader: "Про Біблію напам'ять",
  AboutText:
    "Додаток для вивчення віршів з Біблії напам'ять. Інструмент для того, хто має бажання вчити і повторювати вірші щоденно не просто щоб бити повітря.",
  LegalHeader: "Юридична інформація",
  LegalText:
    "Цей додаток використовує API(application programming intarface, інтерфейс прикладного програмування) для автоматичного додавання вірша у певному перекладі (ESV, UCVNTR). Ці переклади не можуть розповсюджуватись вільно, але виключно згідно із наступними умовами. Використовуючи цей додаток ти даєш згоду із наступними умовами:",
  LegalText2:
    "ESV: Scripture quotations marked “ESV” are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated into any other language. Users may not copy or download more than 500 verses of the ESV Bible or more than one half of any book of the ESV Bible.",

  //buttons
  homePractice: "Практика",
  homeList: "Список",
  homeSettings: "Налаштування",
  homeStats: "Статистика",
  Archive: "Архівувати",
  Unrchive: "Розархівувати",
  Archived: "Архівовано",
  Disabled: "Вимкнено",
  Add: "Додати",
  Remove: "Видалити",
  Edit: "Редагувати",
  Continue: "Продовжити",
  Submit: "Далі",
  ShowAnswer: "Підказка",
  Reset: "Заново",
  Fetch: "Підтягнути",
  Cancel: "Назад",
  ExitTesting: "Завершити",
  Level: "Рівень",
  MaxLevel: "Доступний рівень",
  SelectedLevel: "Обраний рівень",
  AddPassages: "Додати вірші",
  AddPassage: "Додати вірш",
  Close: "Закрити",
  RestartTests: "Почати сессію заново",
  CheckText: "Перевірити текст",
  LevelSkip: "Пропустити рівень",
  ButtonContinue: "Продовжити",
  DowngradeLevel: "Понизити рівень",
  [SORTINGOPTION.address]: "Адреса",
  [SORTINGOPTION.selectedLevel]: "Обраний рівень",
  [SORTINGOPTION.maxLevel]: "Доступний рівень",
  [SORTINGOPTION.oldestToTrain]: "Треновані найдавніше",
  [SORTINGOPTION.resentlyCreated]: "Нещодавно додані",
  TranslationSetDefault: "Поставити за замовчуванням",
  TranslationIsDefault: "Переклад за замовчуванням",

  [THEMETYPE.auto]: "Системна",
  [THEMETYPE.dark]: "Темна",
  [THEMETYPE.light]: "Світла",

  [STATSMETRICS.minutes]: "Хвилини",
  [STATSMETRICS.verses]: "Кількість віршів",
  [STATSMETRICS.sesstions]: "Підходи",
  //titles
  listScreenTitle: "Список віршів",
  statsScreenTitle: "Cтатистика",
  APSelectBook: "Обрання книги",
  EditPassageTitle: "Редагування тексту",
  titleWelldone: "Чудова робота!",
  LevelPickerHeading: "Обрання рівня",
  settingsScreenTitle: "Налаштування",
  TitleSort: "Сортування",
  TitleFilters: "Фільтрування",
  Repeat: "Повторювати раз на",
  NextRepeat: "Натупне повторення",
  calendarScreenTitle: "Календар",
  dayStatsTitle: "Статистика дня",
  loginScreenTitle: "Увійти",
  registerScreenTitle: "Реєстрація",

  notificationTitle1: "Готовий повторити вірші?",
  notificationTitle2: "Не забув потренувати вірші сьогодні?",
  notificationTitle3: "Маєш трохи вільного часу?",
  notificationBody1: "В будь якому разі не забуть це зробити 😌",
  notificationBody2: "Навіть якщо забув, ось тобі нагадування ☝️",
  notificationBody3:
    "Хоча, ти ж знаєш, що вільний час, це питання пріоритетів 😏",

  //chatGpt ones
  notificationTitle4: "Час потренуватися у вивченні віршів?",
  notificationTitle5: "Трохи практики — і великий результат!",
  notificationTitle6: "Тебе чекає новий вірш!",
  notificationTitle7: "Не забувай підтримувати знання віршів у пам’яті!",
  notificationTitle8: "Щоденна практика веде до досконалості!",
  notificationTitle9: "Завжди гарний час для повторення Біблійних віршів!",
  notificationTitle10: "Залишайся зосередженим—тренуй свою пам’ять!",
  notificationTitle11: "Швидке нагадування про тренування віршів!",
  notificationTitle12: "Продовжуй у тому ж дусі!",
  notificationTitle13: "Писання найкраще запам’ятовується щодня!",

  notificationBody4: "Лише кілька хвилин можуть змінити все! ⏳",
  notificationBody5:
    "Невелике зусилля сьогодні принесе великі результати завтра! 💪",
  notificationBody6: "Будь послідовним, і ти побачиш дивовижний прогрес! 🙌",
  notificationBody7: "Твій духовний ріст вартий витраченого часу! ✨",
  notificationBody8:
    "Навіть швидкий повтор допоможе зберегти вірші в серці! ❤️",
  notificationBody9: "Дисципліна сьогодні — мудрість завтра! 📖",
  notificationBody10: "Боже Слово варто пам’ятати щодня! 🙏",
  notificationBody11: "Без тиску, просто дружнє нагадування! 😊",
  notificationBody12: "Твої зусилля окупляться—продовжуй! 🚀",
  notificationBody13: "Трохи уваги зараз — вічна мудрість у майбутньому! 💡",

  //subtexts
  DateCreated: "Додано",
  DateEdited: "Остання зміна",
  DateTested: "Практиковано",
  Never: "Ніколи",
  AddTag: "Додати категорію...",
  TranslationLabel: "Переклад",
  LevelLabel: "Рівень",
  LevelSelectAddress: "Обери адресу",
  LevelStartWritingPassage: "Напиши перші слова",
  LevelWritePassageText: "Напиши текст вірша",
  LevelPickerSubtext:
    "Пройди цей рівень без помилок кілька раз, щоби відкрити наступний рівень",
  LevelPickerSubtextSecond: "Рівень зміниться наступного разу",
  LevelPickerSubtextL5: "Тестів без помилок поспіль",
  TestsAddPassagesToTest: "Додай тексти у список щоб мати змогу їх вчити",
  version: "Веріся",
  TestsCompleted: "Завдань завершено",
  ErrorsMade: "Помилок зроблено",
  NumberOfPassages: "Кількість текстів",
  NumberOfVerses: "Кількість віршів",
  NumberOfVersesLeanredAddress: "Віршів із вивченою адресою",
  NumberOfVersesLeanredText: "Віршів із вивченим текстом",
  FinishPassage: "Заверши цей вірш, щоби ввести адресу",
  FinishPassageL5: "Заверши цей вірш без жодного автодоповнення",
  LevelL40Hint:
    "Тисни Enter для швидкого обрання першого варіанту зі списку автодоповнення",
  LevelL50Warning:
    "Введено більше одного символа за раз. Наступного разу це вважатиметься помилкою",
  PassagesHidden: "Текстів приховано",
  DaysStroke: "Днів поспіль",
  NoTagsFound: "Додай категорії текстам, щоби вони відображались тут",
  Tags: "Категорії",
  Translations: "Переклади",
  fetchPropositionText: "Підтягнути текст автоматично?",
  Loading: "Заванатження...",
  NotAFetchableTranslation: "Введи текст вірша тут",
  NoDataForThisDay: "Для цього дня немає даних",
  TestExitConfirmationText: "Пройдені завдання не будуть збережені",
  //settings lables, headers and subtexts
  settsLabelMain: "Головне",
  settsLabelList: "Список",
  settsLabelTests: "Вивчення",
  settsLabelAbout: "Про додаток",
  settsChangeTheme: "Змінити кольорову тему",
  settsChangeLang: "Змінити мову",
  settsDevMode: "Режим розробника",
  settsLeftSwipeTag: "Присвоєння категорії свайпом вправо",
  settsHaptics: "Вібрація",
  settsDevPasswordHeader: "Введи відповідь на число",
  settsDevPasswordPlaceholder: "Введи число",
  settsGetDevAnswer: "Отримання відповіді для режиму розробника",
  settsAboutHeader: "Про додаток",
  settsAboutSubtext: "опис, версія",
  settsLegalHeader: "Юридична інформація",
  settsLegalSubtext: "Інформаця про використання перекладу",
  settsAutoIncreseLevel: "Автоматично підвищувати рівень",
  settsExportStateHeader: "Експортувати стан додатку",
  settsExportStateSubtext: "Зберегти стан даних додатку у JSON файл",
  settsImportStateHeader: "Імпортувати стан додатку",
  settsImportStateSubtext: "Відкрити стан даних додатку з JSON файлу",
  settingsExportPassages: "Експортувати вірші",
  settingsImportPassages: "Імпортувати вірші",
  settsExportPassagesSubtext: "Записати вірші у txt файл",
  settsImportPassagesSubtext: "Зчитати вірші із спеціального txt файлу",
  settsExported: "Експортовано!",
  settsImportedVerses: "Імпортовано віршів",
  settsImported: "Імпортовано!",
  settsCleared: "Видалено!",
  settsClearHistory: "Видалити історію",
  settsClearPassages: "Видалити список віршів",
  settsClearData: "Видалити всі дані",
  settsOneWayDoor: "⚠️ Данні буде втрачано без можливості відновлення",
  settsEnabled: "Увімкнено",
  settsDisabled: "Вимкнено",
  settsTranslationsListHeader: "Список перекладів",
  settsTranslationsListSubtext: "Редагувати список перекладів Біблії",
  settsTranslationItemName: "Назва перекладу",
  settsTranslationItemLanguage: "Мова перекладу",
  settsLabelStats: "Статистика",
  settsWeeklyMetrics: "Тижнева статистика",
  settsLabelReminders: "Нагадування",
  settsEnableReminders: "Нагадування",
  settsRemindersAutomaticTime: "Автоматичний час нагадування",
  settsRemindersAutomaticTimeSubtext:
    "Визначення закономірності за останій місяць",
  settsRemindersList: "Час нагадувань",
  settsRemindersListHeader: "Список нагадувань",
  settsRemindersListSubtext: "Налаштовуваний час сповіщень",
  settsReminderEnabled: "Увімкнути нагадування",
  settsTestNotification: "Тестове сповіщення",
  settingsTrainModesListHeader: "Режими тренування",
  settingsTrainModesListSubtext: "Редагування списку режимів тренування",
  settsTrainModeEnabled: "Відображати режим",
  settsAllPassagesOption: "Усі",
  settsAsSelectedLevelOption: "Як обрано",
  settsTrainModeNameInput: "Назва режиму",
  settsTrainModeLengthHeader: "Кількість завдань",
  settsTrainModeLengthSubtext: "кількість текстів кожний підхід",
  settsTrainModeTranslationHeader: "Переклад",
  settsTrainModeTranslationSubtext: "фільтрування текстів за перекладом",
  settsTrainModeSortingHeader: "Сортування",
  settsTrainModeSortingSubtext: "сортувати тексти",
  settsTrainModeLevelHeader: "Рівень",
  settsTrainModeLevelSubtext: "Тренувати у певному рівні (якщо доступно)",
  settsTrainModeIncludeTagsHeader:
    "Включаючи категорії(якщо не обрано жодного, відображаються всі)",
  settsTrainModeExcludeTagsHeader: "Виключаючи категорії",
  NewTranslationName: "Новий переклад",
  DefaultTrainModeName: "Звичайний режим",
  NewTrainModeName: "Новий режим",
  settsPrivacyPolicyHeader: "Політика конфіденційності",
  OpenExternalLink: "Зовнішнє посилання (англійською)",
  DaysLabelSingular: "день",
  DaysLabelTwoThreeFour: "дня",
  DaysLabelMultiple: "днів",
  statsTotalTimesTested: "Тестовано разів",
  statsTotalTimeSpent: "Всього часу витрачено",
  statsAverageDuration: "Середній час на тест",
  statsAverageTestDuration: "Середній час завдання",
  statsAverageSessionDuration: "Середній час підходу",
  statsSessionNumber: "Кількість підходів",
  statsTimesTested: "Разів тестовано",
  statsTimeSpent: "Часу витрачено",
  statsMostCommonAddressErrorHeader: "Найчастіші помилкові адреси",
  statsWrongWordsHeatmapHeader: "Карта найчастіших помилок у словах",
  statsAbsoluteScoreSubtext: "Загальна оцінка",
  statsScoreCalculatingHintText:
    "Загальна оцінка - це сума оцінок всіх текстів (кількість_віршів * (доступний_рівень - 1) * 2) \n\nВідносна оцінка (друге число) - це різниця загальної оцінки цього місяця і минулого",
  statsPassagesNumber: "Текстів",
  statsVersesNumber: "Віршів",
  statsAddressesLearned: "Адрес вивчено",
  statsFullyLearned: "Цілком вивчено",
  statsUpgradeDate: "Дата досягнення",
  statsDailyTime: "Часу на день",
  statsWeeklyTime: "Часу на тиждень",

  TranslationOther: "Інший",
  hrs: "год", //hours

  ErrorCantAddMoreEngVerses: "Не можна додавати більше 500 віршів англійською",
  ErrorNoPassagesForThisTrainMode:
    "Для цього режиму тренування немає жодного тексту, перевір режими тренування у налаштуваннях",
  ErrorWhileReadingFile: "Помилка читання файлу",
  ErrorWhileWritingFile: "Помилка запису у файл",
  ErrorWhileEncoding: "Помилка форматування",
  ErrorWhileDecoding: "Помилка розшифровування",
  CantGenerateTestsForThisTrainMode:
    "Не вдалось згенерувати завдання для обраного режиму",
  ErrorInvalidIndexes: "Нерозпізнані строки",
  ErrorConflictedIndexes: "Дублікати",
  ErrorTurnOnRemindersOnImport:
    "Увімкніть нагадування щоб побачити помилки при імпортуванні",

  //login
  provideEmailLabel: "ел. пошта",
  providePasswsordLabel: "пароль",
  providePasswsordAgainLabel: "пароль ще раз",
  legalCheckLabel:
    "Я згоден із умовами використання застосунку і політикою безпеки",
  loginButton: "Увійти",
  registerButton: "Реєстрація",
  passwordRulesLabel:
    "Пароль повинен містити як мінімум одну заглавну літеру, одну строчну літеру, одну ціфру, один символ зі списку:[@.#$!%*?&]. Довжина 8-40 літер",
  ComingSoon: "Скоро буде 😉",
  //register
  openLegalPrivacyPolicy: "Політика безпеки(eng)",
  openLegalTermsOfService: "Умови використання(eng)",

  dayMO: "Пн",
  dayTU: "Вт",
  dayWE: "Ср",
  dayTH: "Чт",
  dayFR: "Пт",
  daySA: "Сб",
  daySU: "Нд",
  dayEveryday: "Кожного дня",
  dayWeekdays: "У будні дні",
  dayWeekends: "У вихідні",

  Month_1: "Січень",
  Month_2: "Лютий",
  Month_3: "Березень",
  Month_4: "Квітень",
  Month_5: "Травень",
  Month_6: "Червень",
  Month_7: "Липень",
  Month_8: "Серпень",
  Month_9: "Вересень",
  Month_10: "Жовтень",
  Month_11: "Листопад",
  Month_12: "Грудень",

  bGenShrt: "Бут",
  bGenLong: "Буття",

  bExoShrt: "Вих",
  bExoLong: "Вихід",

  bLevShrt: "Лев",
  bLevLong: "Левіт",

  bNumShrt: "Чис",
  bNumLong: "Числа",

  bDeuShrt: "Повт",
  bDeuLong: "Повторення",

  bJoshShrt: "І Н",
  bJoshLong: "Ісуса Навіна",

  bJudgShrt: "Суд",
  bJudgLong: "Сідді",

  bRuthShrt: "Рут",
  bRuthLong: "Рут",

  b1SamShrt: "1 Сам",
  b1SamLong: "1 Самуїла",

  b2SamShrt: "2 Сам",
  b2SamLong: "2 Самуїла",

  b1KinShrt: "1 Цар",
  b1KinLong: "1 Царів",

  b2KinShrt: "2 Цар",
  b2KinLong: "2 Царів",

  b1ChrShrt: "1 Хр",
  b1ChrLong: "1 Хронік",

  b2ChrShrt: "2 Хр",
  b2ChrLong: "2 Хронік",

  bEzrShrt: "Ез",
  bEzrLong: "Ездри",

  bNehShrt: "Неєм",
  bNehLong: "Неємії",

  bEsthShrt: "Ест",
  bEsthLong: "Естер",

  bJobShrt: "Йов",
  bJobLong: "Йова",

  bPsShrt: "Пс",
  bPsLong: "Псалом",

  bProvShrt: "Прип",
  bProvLong: "Приповісті",

  bEcclShrt: "Еккл",
  bEcclLong: "Екклезіаста",

  bSongShrt: "Пісн",
  bSongLong: "Пісні пісень",

  bIsaShrt: "Іс",
  bIsaLong: "Ісаї",

  bJerShrt: "Єр",
  bJerLong: "Єремії",

  bLamShrt: "Пл Єр",
  bLamLong: "Плач Єремії",

  bEzekShrt: "Єз",
  bEzekLong: "Єзекіїла",

  bDanShrt: "Дан",
  bDanLong: "Даниїла",

  bHosShrt: "Ос",
  bHosLong: "Осії",

  bJoelShrt: "Йоіл",
  bJoelLong: "Йоіла",

  bAmShrt: "Ам",
  bAmLong: "Амоса",

  bObaShrt: "Авд",
  bObaLong: "Авдія",

  bJonaShrt: "Йони",
  bJonaLong: "Йони",

  bMicShrt: "Мих",
  bMicLong: "Михея",

  bNahShrt: "Наум",
  bNahLong: "Наума",

  bHabShrt: "Ав",
  bHabLong: "Аввакума",

  bZephShrt: "Соф",
  bZephLong: "Софонії",

  bHagShrt: "Аг",
  bHagLong: "Аггея",

  bZechShrt: "Зах",
  bZechLong: "Захарії",

  bMalShrt: "Мал",
  bMalLong: "Малахії",

  bMatShrt: "Мт",
  bMatLong: "Матвія",

  bMarShrt: "Мр",
  bMarLong: "Марка",

  bLukShrt: "Лк",
  bLukLong: "Луки",

  bJohnShrt: "Ів",
  bJohnLong: "Івана",

  bActsShrt: "Дії",
  bActsLong: "Дії",

  bRomShrt: "Рим",
  bRomLong: "Римлян",

  b1CorShrt: "1 Кор",
  b1CorLong: "1 Коринтян",

  b2CorShrt: "2 Кор",
  b2CorLong: "2 Коринтян",

  bGalShrt: "Гал",
  bGalLong: "Галатів",

  bEphShrt: "Еф",
  bEphLong: "Ефесян",

  bPhilShrt: "Флп",
  bPhilLong: "Филип'ян",

  bColShrt: "Кол",
  bColLong: "Колосян",

  b1ThsShrt: "1 Сол",
  b1ThsLong: "1 Солунян",

  b2ThsShrt: "2 Сол",
  b2ThsLong: "2 Солунян",

  b1TimShrt: "1 Тим",
  b1TimLong: "1 Тимофія",

  b2TimShrt: "2 Тим",
  b2TimLong: "2 Тимофія",

  bTitShrt: "Тита",
  bTitLong: "Тита",

  bPhlmShrt: "Флм",
  bPhlmLong: "Филимона",

  bHebShrt: "Євр",
  bHebLong: "Євреїв",

  bJamShrt: "Як",
  bJamLong: "Якова",

  b1PetShrt: "1 Пет",
  b1PetLong: "1 Петра",

  b2PetShrt: "2 Пет",
  b2PetLong: "2 Петра",

  b1JnShrt: "1 Ів",
  b1JnLong: "1 Івана",

  b2JnShrt: "2 Ів",
  b2JnLong: "2 Івана",

  b3JnShrt: "3 Ів",
  b3JnLong: "3 Івана",

  bJudShrt: "Юди",
  bJudLong: "Юди",

  bRevShrt: "Об",
  bRevLong: "Об'явлення"
};
