import { SORTING_OPTION } from "../constants";
import { en } from "./en";

export const ua: typeof en = {
  name: "Українська",
  flag: "🇺🇦",
  appName: "Біблія напам'ять",
  //buttons
  homePractice: "Практика",
  homeList: "Список",
  homeSettings: "Налаштування",
  settingsChangeLang: "Змінити мову",
  settingsToggleDevMode: "Режим розробника",
  settingsExport: "Експортувати вірші",
  settingsImport: "Імпортувати вірші",
  settingsClearHistory: "Видалити історію",
  settingsClearPassages: "Видалити список віршів",
  settingsClearData: "Видалити всі данні",
  Archive: "Архівувати",
  Archived: "Архівовано",
  Remove: "Видалити",
  Edit: "Редагувати",
  Continue: "Продовжити",
  Submit: "Далі",
  ShowAnswer: "Підказка",
  Reset: "Заново",
  Level: "Рівень",
  MaxLevel: "Доступний рівень",
  SelectedLevel: "Обраний рівень",
  AddPassages: "Додати вірші",
  Close: "Закрити",
  RestartTests: "Почати все заново",
  CheckText: "Перевірити текст",
  [SORTING_OPTION.adress]: "Адреса",
  [SORTING_OPTION.selectedLevel]: "Обраний рівень", 
  [SORTING_OPTION.maxLevel]: "Доступний рівень", 
  [SORTING_OPTION.oldestToTrain]: "Треновані найдавніше", 
  [SORTING_OPTION.resentlyCreated]: "Нещодавно додані", 

  //titles
  listScreenTitle: "Список віршів",
  APSelectBook: "Оберіть книгу",
  EditPassageTitle: "Редагування тексту",
  titleWelldone: "Чудова робота!",
  LanguagePickerHeading: "Оберіть рівень",
  settingsScreenTitle: "Налаштування",
  TitleSort: "Сортування",
  TitleFilters: "Фільтрування",

  //sub texts
  DateCreated: "Додано",
  DateEdited: "Остання зміна",
  DateTested: "Практиковано",
  AddTag: "Додати категорію...",
  LevelSelectAddress: "Обери адресу",
  LevelStartWritingPassage: "Напиши перші слова",
  LevelWritePassageText: "Напиши текст вірша",
  LanguagePickerSubtext: "Потренуйте цей текст тричі без помилок поспіль щоб відкрити наступний рівень",
  LanguagePickerSubtextSecond: "Рівень зміниться наступного разу",
  TestsAddPassagesToTest: "Додай тексти у список щоб мати змогу їх вчити",
  version: "Веріся",
  TestsCompleted: "Завдань завершено",
  ErrorsMade: "Помилок зроблено",
  NumberOfPassages: "Кількість текстів",
  NumberOfVerses: "Кількість віршів", 
  FinishPassage: "Заверши цей вірш щоб ввести адресу",
  FinishPassageL5: "Заверши цей вірш без жодного автодоповнення",
  LevelL40Hint: "Тисни Enter для швидкого обрання першого варіанту зі списку автодоповнення",
  LevelL50Warning: "Введено більше одного символа за раз. Наступного разу це вважатиметься помилкою",
  PassagesHidden: "Текстів приховано",

  bGenShrt:"Бут",
  bGenLong: "Буття",

  bExoShrt:"Вих",
  bExoLong: "Вихід",

  bLevShrt:"Лев",
  bLevLong: "Левіт",

  bNumShrt:"Чис",
  bNumLong: "Числа",

  bDeuShrt:"Повт",
  bDeuLong: "Повторення",


  bJoshShrt:"І Н",
  bJoshLong: "Ісуса Навіна",

  bJudgShrt:"Суд",
  bJudgLong: "Сідді",

  bRuthShrt:"Рут",
  bRuthLong: "Рут",


  b1SamShrt:"1 Сам",
  b1SamLong: "1 Самуїла",

  b2SamShrt:"2 Сам",
  b2SamLong: "1 Самуїла",

  b1KinShrt:"1 Цар",
  b1KinLong: "1 Царів",

  b2KinShrt:"2 Цар",
  b2KinLong: "2 Царів",

  b1ChrShrt:"1 Хр",
  b1ChrLong: "1 Хронік",

  b2ChrShrt:"2 Хр",
  b2ChrLong: "2 Хронік",

  bEzrShrt:"Ез",
  bEzrLong: "Ездри",

  bNehShrt:"Неєм",
  bNehLong: "Неємії",

  bEsthShrt:"Ест",
  bEsthLong: "Естер",


  bJobShrt:"Йов",
  bJobLong: "Йова",

  bPsShrt:"Пс",
  bPsLong: "Псалом",

  bProvShrt:"Прип",
  bProvLong: "Приповісті",

  bEcclShrt:"Еккл",
  bEcclLong: "Екклезіаста",

  bSongShrt:"Пісн",
  bSongLong: "Пісні пісень",

  bIsaShrt:"Іс",
  bIsaLong: "Ісаї",

  bJerShrt:"Єр",
  bJerLong: "Єремії",

  bLamShrt:"Пл Єр",
  bLamLong: "Плач Єремії",

  bEzekShrt:"Єз",
  bEzekLong: "Єзекіїла",

  bDanShrt:"Дан",
  bDanLong: "Даниїла",

  bHosShrt:"Ос",
  bHosLong: "Осії",

  bJoelShrt:"Йоіл",
  bJoelLong: "Йоіла",

  bAmShrt:"Ам",
  bAmLong: "Амоса",

  bObaShrt:"Авд",
  bObaLong: "Авдія",

  bJonaShrt:"Йони",
  bJonaLong: "Йони",

  bMicShrt:"Мих",
  bMicLong: "Михея",

  bNahShrt:"Наум",
  bNahLong: "Наума",

  bHabShrt:"Ав",
  bHabLong: "Аввакума",

  bZephShrt:"Соф",
  bZephLong: "Софонії",

  bHagShrt:"Аг",
  bHagLong: "Аггея",

  bZechShrt:"Зах",
  bZechLong: "Захарії",

  bMalShrt:"Мал",
  bMalLong: "Малахії",


  bMatShrt:"Мт",
  bMatLong: "Матвія",

  bMarShrt:"Мр",
  bMarLong: "Марка",

  bLukShrt:"Лк",
  bLukLong: "Луки",

  bJohnShrt:"Ів",
  bJohnLong: "Івана",

  bActsShrt:"Дії",
  bActsLong: "Дії",

  bRomShrt:"Рим",
  bRomLong: "Римлян",

  b1CorShrt:"1 Кор",
  b1CorLong: "1 Коринтян",

  b2CorShrt:"2 Кор",
  b2CorLong: "2 КОринтян",

  bGalShrt:"Гал",
  bGalLong: "Галатів",

  bEphShrt:"Еф",
  bEphLong: "Ефесян",

  bPhilShrt:"Флп",
  bPhilLong: "Филип'ян",

  bColShrt:"Кол",
  bColLong: "Колосян",

  b1ThsShrt:"1 Сол",
  b1ThsLong: "1 Солунян",

  b2ThsShrt:"2 Сол",
  b2ThsLong: "2 Солунян",

  
  b1TimShrt:"1 Тим",
  b1TimLong: "1 Тимофія",

  b2TimShrt:"2 Тим",
  b2TimLong: "2 Тимофія",

  bTitShrt:"Тита",
  bTitLong: "Тита",

  bPhlmShrt:"Флм",
  bPhlmLong: "Филимона",

  bHebShrt:"Євр",
  bHebLong: "Євреїв",

  bJamShrt:"Як",
  bJamLong: "Якова",

  b1PetShrt:"1 Пет",
  b1PetLong: "1 Петра",

  b2PetShrt:"2 Пет",
  b2PetLong: "2 Петра",

  b1JnShrt:"1 Ів",
  b1JnLong: "1 Івана",

  b2JnShrt:"2 Ів",
  b2JnLong: "2 Івана",

  b3JnShrt:"3 Ів",
  b3JnLong: "3 Івана",

  bJudShrt:"Юди",
  bJudLong: "Юди",

  bRevShrt:"Об",
  bRevLong: "Об'явлення",

}
