import { SORTING_OPTION, STATS_METRICS, THEME_TYPE } from '../constants';
import { en } from './en';

export const ua: typeof en = {
    name: 'Українська',
    flag: '🇺🇦',
    appName: "Біблія напам'ять",

    AboutHeader: "Про Біблію напам'ять",
    AboutText:
        "Додаток для вивчення віршів з Біблії напам'ять. Інструмент для того, хто має бажання вчити і повторювати вірші щоденно не просто щоб бити повітря.",
    LegalHeader: 'Юридична інформація',
    LegalText:
        'Цей додаток використовує API(application programming intarface, інтерфейс прикладного програмування) для автоматичного додавання вірша у певному перекладі (ESV, UCVNTR). Ці переклади не можуть розповсюджуватись вільно, але виключно згідно із наступними умовами. Використовуючи цей додаток ти даєш згоду із наступними умовами:',
    LegalText2:
        'ESV: Scripture quotations marked “ESV” are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated into any other language. Users may not copy or download more than 500 verses of the ESV Bible or more than one half of any book of the ESV Bible.',

    //buttons
    homePractice: 'Практика',
    homeList: 'Список',
    homeSettings: 'Налаштування',
    Archive: 'Архівувати',
    Unrchive: 'Розархівувати',
    Archived: 'Архівовано',
    Add: 'Додати',
    Remove: 'Видалити',
    Edit: 'Редагувати',
    Continue: 'Продовжити',
    Submit: 'Далі',
    ShowAnswer: 'Підказка',
    Reset: 'Заново',
    Level: 'Рівень',
    MaxLevel: 'Доступний рівень',
    SelectedLevel: 'Обраний рівень',
    AddPassages: 'Додати вірші',
    Close: 'Закрити',
    RestartTests: 'Почати все заново',
    CheckText: 'Перевірити текст',
    LevelSkip: 'Пропустити рівень',
    ButtonContinue: 'Продовжити',
    [SORTING_OPTION.address]: 'Адреса',
    [SORTING_OPTION.selectedLevel]: 'Обраний рівень',
    [SORTING_OPTION.maxLevel]: 'Доступний рівень',
    [SORTING_OPTION.oldestToTrain]: 'Треновані найдавніше',
    [SORTING_OPTION.resentlyCreated]: 'Нещодавно додані',
    TranslationSetDefault: 'Поставити за замовченням',

    [THEME_TYPE.auto]: 'Системна',
    [THEME_TYPE.dark]: 'Темна',
    [THEME_TYPE.light]: 'Світла',

    [STATS_METRICS.minutes]: 'Хвилини',
    [STATS_METRICS.verses]: 'Кількість віршів',
    [STATS_METRICS.sesstions]: 'Підходи',
    //titles
    listScreenTitle: 'Список віршів',
    APSelectBook: 'Оберіть книгу',
    EditPassageTitle: 'Редагування тексту',
    titleWelldone: 'Чудова робота!',
    LevelPickerHeading: 'Оберіть рівень',
    settingsScreenTitle: 'Налаштування',
    TitleSort: 'Сортування',
    TitleFilters: 'Фільтрування',

    notificationTitle1: 'Готовий повторити вірші?',
    notificationTitle2: 'Не забув потренувати вірші сьогодні?',
    notificationTitle3: 'Маєш трохи вільного часу?',
    notificationBody1: 'В будь якому разі не забуть це зробити 😌',
    notificationBody2: 'Навіть якщо забув, ось тобі нагадування ☝️',
    notificationBody3: 'Хоча, ти ж знаєш, що вільний час, це питання пріоритетів 😏',

    //sub texts
    DateCreated: 'Додано',
    DateEdited: 'Остання зміна',
    DateTested: 'Практиковано',
    AddTag: 'Додати категорію...',
    LevelSelectAddress: 'Обери адресу',
    LevelStartWritingPassage: 'Напиши перші слова',
    LevelWritePassageText: 'Напиши текст вірша',
    LevelPickerSubtext:
        'Пройди цей рівень тричі без помилок, щоби відкрити наступний рівень',
    LevelPickerSubtextSecond: 'Рівень зміниться наступного разу',
    LevelPickerSubtextL5: 'Тестів без помилок поспіль',
    TestsAddPassagesToTest: 'Додай тексти у список щоб мати змогу їх вчити',
    version: 'Веріся',
    TestsCompleted: 'Завдань завершено',
    ErrorsMade: 'Помилок зроблено',
    NumberOfPassages: 'Кількість текстів',
    NumberOfVerses: 'Кількість віршів',
    NumberOfVersesLeanredAddress: 'Віршів із вивченою адресою',
    NumberOfVersesLeanredText: 'Віршів із вивченим текстом',
    FinishPassage: 'Заверши цей вірш, щоби ввести адресу',
    FinishPassageL5: 'Заверши цей вірш без жодного автодоповнення',
    LevelL40Hint:
        'Тисни Enter для швидкого обрання першого варіанту зі списку автодоповнення',
    LevelL50Warning:
        'Введено більше одного символа за раз. Наступного разу це вважатиметься помилкою',
    PassagesHidden: 'Текстів приховано',
    DaysStroke: 'Днів поспіль',
    NoTagsFound: 'Додай категорії текстам, щоби вони відображались тут',
    Tags: 'Категорії',
    Translations: 'Переклади',
    //settings lables, headers and subtexts
    settsLabelMain: 'Головне',
    settsLabelList: 'Список',
    settsLabelTests: 'Тестування',
    settsLabelAbout: 'Про додаток',
    settsChangeTheme: 'Змінити кольорову тему',
    settsChangeLang: 'Змінити мову',
    settsDevMode: 'Режим розробника',
    settsLeftSwipeTag: 'Присвоєння категорії свайпом вправо',
    settsHaptics: 'Вібрація',
    settsDevPasswordHeader: 'Введи відповідь на число',
    settsDevPasswordPlaceholder: 'Введи число',
    settsGetDevAnswer: 'Отримання відповіді для режиму розробника',
    settsAboutHeader: 'Про додаток',
    settsAboutSubtext: 'опис, версія',
    settsLegalHeader: 'Юридична інформація',
    settsLegalSubtext: 'Інформаця про використання перекладу',
    settsAutoIncreseLevel: 'Автоматично підвищувати рівень',
    settsShowStateHeader: 'Файл даних додатку',
    settsShowStateSubtext: 'Показати текст стану додатка',
    settingsExport: 'Експортувати вірші',
    settingsImport: 'Імпортувати вірші',
    settsClearHistory: 'Видалити історію',
    settsClearPassages: 'Видалити список віршів',
    settsClearData: 'Видалити всі дані',
    settsOneWayDoor: '⚠️ Данні буде втрачано без можливості відновлення',
    settsEnabled: 'Увімкнено',
    settsDisabled: 'Вимкнено',
    settsTranslationsListHeader: 'Список перекладів',
    settsTranslationsListSubtext: 'Редагувати список перекладів Біблії',
    settsTranslationItemName: 'Назва перекладу',
    settsTranslationItemLanguage: 'Мова перекладу',
    settsLabelStats: 'Статистика',
    settsWeeklyMetrics: 'Тижнева статистика',
    settsLabelReminders: 'Нагадування',
    settsEnableReminders: 'Нагадування',
    settsRemindersAutomaticTime: 'Автоматичний час нагадування',
    settsRemindersAutomaticTimeSubtext:
        'Визначення закономірності за останій місяць',
    settsRemindersList: 'Час нагадувань',
    settsRemindersListHeader: 'Список нагадувань',
    settsRemindersListSubtext: 'Налаштовуваний час сповіщень',
    settsReminderEnabled: 'Увімкнути нагадування',

    TranslationOther: 'Інший',

    ErrorCantAddMoreEngVerses:
        'Не можна додавати більше 500 віршів англійською',

    dayMO: 'Пн',
    dayTU: 'Вт',
    dayWE: 'Ср',
    dayTH: 'Чт',
    dayFR: 'Пт',
    daySA: 'Сб',
    daySU: 'Нд',
    dayEveryday: 'Кожного дня',
    dayWeekdays: 'У будні дні',
    dayWeekends: 'У вихідні',

    bGenShrt: 'Бут',
    bGenLong: 'Буття',

    bExoShrt: 'Вих',
    bExoLong: 'Вихід',

    bLevShrt: 'Лев',
    bLevLong: 'Левіт',

    bNumShrt: 'Чис',
    bNumLong: 'Числа',

    bDeuShrt: 'Повт',
    bDeuLong: 'Повторення',

    bJoshShrt: 'І Н',
    bJoshLong: 'Ісуса Навіна',

    bJudgShrt: 'Суд',
    bJudgLong: 'Сідді',

    bRuthShrt: 'Рут',
    bRuthLong: 'Рут',

    b1SamShrt: '1 Сам',
    b1SamLong: '1 Самуїла',

    b2SamShrt: '2 Сам',
    b2SamLong: '2 Самуїла',

    b1KinShrt: '1 Цар',
    b1KinLong: '1 Царів',

    b2KinShrt: '2 Цар',
    b2KinLong: '2 Царів',

    b1ChrShrt: '1 Хр',
    b1ChrLong: '1 Хронік',

    b2ChrShrt: '2 Хр',
    b2ChrLong: '2 Хронік',

    bEzrShrt: 'Ез',
    bEzrLong: 'Ездри',

    bNehShrt: 'Неєм',
    bNehLong: 'Неємії',

    bEsthShrt: 'Ест',
    bEsthLong: 'Естер',

    bJobShrt: 'Йов',
    bJobLong: 'Йова',

    bPsShrt: 'Пс',
    bPsLong: 'Псалом',

    bProvShrt: 'Прип',
    bProvLong: 'Приповісті',

    bEcclShrt: 'Еккл',
    bEcclLong: 'Екклезіаста',

    bSongShrt: 'Пісн',
    bSongLong: 'Пісні пісень',

    bIsaShrt: 'Іс',
    bIsaLong: 'Ісаї',

    bJerShrt: 'Єр',
    bJerLong: 'Єремії',

    bLamShrt: 'Пл Єр',
    bLamLong: 'Плач Єремії',

    bEzekShrt: 'Єз',
    bEzekLong: 'Єзекіїла',

    bDanShrt: 'Дан',
    bDanLong: 'Даниїла',

    bHosShrt: 'Ос',
    bHosLong: 'Осії',

    bJoelShrt: 'Йоіл',
    bJoelLong: 'Йоіла',

    bAmShrt: 'Ам',
    bAmLong: 'Амоса',

    bObaShrt: 'Авд',
    bObaLong: 'Авдія',

    bJonaShrt: 'Йони',
    bJonaLong: 'Йони',

    bMicShrt: 'Мих',
    bMicLong: 'Михея',

    bNahShrt: 'Наум',
    bNahLong: 'Наума',

    bHabShrt: 'Ав',
    bHabLong: 'Аввакума',

    bZephShrt: 'Соф',
    bZephLong: 'Софонії',

    bHagShrt: 'Аг',
    bHagLong: 'Аггея',

    bZechShrt: 'Зах',
    bZechLong: 'Захарії',

    bMalShrt: 'Мал',
    bMalLong: 'Малахії',

    bMatShrt: 'Мт',
    bMatLong: 'Матвія',

    bMarShrt: 'Мр',
    bMarLong: 'Марка',

    bLukShrt: 'Лк',
    bLukLong: 'Луки',

    bJohnShrt: 'Ів',
    bJohnLong: 'Івана',

    bActsShrt: 'Дії',
    bActsLong: 'Дії',

    bRomShrt: 'Рим',
    bRomLong: 'Римлян',

    b1CorShrt: '1 Кор',
    b1CorLong: '1 Коринтян',

    b2CorShrt: '2 Кор',
    b2CorLong: '2 КОринтян',

    bGalShrt: 'Гал',
    bGalLong: 'Галатів',

    bEphShrt: 'Еф',
    bEphLong: 'Ефесян',

    bPhilShrt: 'Флп',
    bPhilLong: "Филип'ян",

    bColShrt: 'Кол',
    bColLong: 'Колосян',

    b1ThsShrt: '1 Сол',
    b1ThsLong: '1 Солунян',

    b2ThsShrt: '2 Сол',
    b2ThsLong: '2 Солунян',

    b1TimShrt: '1 Тим',
    b1TimLong: '1 Тимофія',

    b2TimShrt: '2 Тим',
    b2TimLong: '2 Тимофія',

    bTitShrt: 'Тита',
    bTitLong: 'Тита',

    bPhlmShrt: 'Флм',
    bPhlmLong: 'Филимона',

    bHebShrt: 'Євр',
    bHebLong: 'Євреїв',

    bJamShrt: 'Як',
    bJamLong: 'Якова',

    b1PetShrt: '1 Пет',
    b1PetLong: '1 Петра',

    b2PetShrt: '2 Пет',
    b2PetLong: '2 Петра',

    b1JnShrt: '1 Ів',
    b1JnLong: '1 Івана',

    b2JnShrt: '2 Ів',
    b2JnLong: '2 Івана',

    b3JnShrt: '3 Ів',
    b3JnLong: '3 Івана',

    bJudShrt: 'Юди',
    bJudLong: 'Юди',

    bRevShrt: 'Об',
    bRevLong: "Об'явлення"
};
