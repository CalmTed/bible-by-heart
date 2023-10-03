import { getAddressDifference } from "./addressDifference";
import { bibleReference } from "../bibleReference";
import { TESTLEVEL, PASSAGELEVEL, SORTINGOPTION } from "../constants";
import { createTest } from "../initials";
import {
  AddressType,
  AppStateModel,
  PassageModel,
  TestModel,
  TrainModeModel
} from "../models";
import { getPerfectTestsNumber } from "./getPerfectTests";
import { getSimularity } from "./getSimularity";
import { addressDistance } from "./addressDistance";
import { randomItem, randomListRange, randomRange } from "./randomizers";

//if no passages
//if not many passages(1-10) > not manu tests (even one) + say "you probably should add more passages ;)"
//if a lot of passages > limit ro 15 per session

//for each P.
//create test
//get level
//get common errors
//generate options
//addreses to passage: from errors, neigboring, +-1/2 to some parts, other passages(this book and other) <- select by weigthed random
//passages to address: erros, other passages(random weight from address distance)
//hidden words: random word, common errors(by word index), common errors from next levels

export const getPassagesByTrainMode: (
  state: AppStateModel,
  trainMode: TrainModeModel
) => PassageModel[] = (state, trainMode) => {
  const targetTranslation = state.settings.translations.find(
    (tr) => tr.id === trainMode.translation
  );
  //if train mode enabled
  //if translation exists
  if (!trainMode.enabled || !targetTranslation) {
    return [];
  }
  return state.passages
    .filter((p) => {
      //if translation right
      const isTranslationRight = p.verseTranslation === trainMode.translation;
      //include tags if not empty
      const hasAllIncludedTags = trainMode.includeTags.length
        ? trainMode.includeTags.filter((tag) => p.tags.includes(tag)).length ===
          trainMode.includeTags.length
        : true;
      //exclude if not empty
      const doesNotHasAnyExcludedTags = trainMode.excludeTags.length
        ? !trainMode.excludeTags.filter((tag) => p.tags.includes(tag)).length
        : true;
      return (
        isTranslationRight && hasAllIncludedTags && doesNotHasAnyExcludedTags
      );
    })
    .sort((a, b) => {
      switch (trainMode.sort) {
        case SORTINGOPTION.address:
          return getAddressDifference(a, b);
        case SORTINGOPTION.maxLevel:
          return b.maxLevel - a.maxLevel;
        case SORTINGOPTION.selectedLevel:
          return b.selectedLevel - a.selectedLevel;
        case SORTINGOPTION.resentlyCreated:
          return b.dateCreated - a.dateCreated;
        case SORTINGOPTION.oldestToTrain:
          return a.dateTested - b.dateTested;
        default:
          return 0;
      }
    })
    .slice(0, trainMode.length || Infinity) //limiting max number
    .sort(() => (Math.random() > 0.5 ? -1 : 1)); //shuffling again JUST FOR FUN!!!
};

export const generateTests: (state: AppStateModel) => TestModel[] = (state) => {
  const passages = state.passages;
  const history = state.testsHistory;
  const trainMode =
    state.settings.trainModesList.find(
      (m) => m.id === state.settings.activeTrainModeId
    ) || state.settings.trainModesList[0];
  if (!passages.length) {
    console.log("there are no passages to create tests");
    return [];
  }
  //TODO all due to (one if one left), other only if there are no passages due ot
  //TODO make getDueTo as a separate method
  const sessionId = Math.round(Math.random() * 10000000);
  const targetTestLevel =
    trainMode.testAsLevel !== null
      ? ((trainMode.testAsLevel + 1) as PASSAGELEVEL)
      : trainMode.testAsLevel;
  const tests: TestModel[] = getPassagesByTrainMode(state, trainMode).map(
    (p) => {
      const initialTest = createTest(sessionId, p.id, p.selectedLevel);
      return generateATest(initialTest, passages, targetTestLevel, history);
    }
  );
  return tests;
};

//generate a test
//require passages list
//get initial test or generate one
//get target test level or generate from target passage level
//   when downgrading we will already have lower level after redusing or we will call it from reduser
//get history or set to be []
export const generateATest: (
  initialTest: TestModel,
  passages: PassageModel[],
  targetTestLevel?: PASSAGELEVEL | null,
  history?: TestModel[]
) => TestModel = (initialTest, passages, targetTestLevel, history = []) => {
  const littleClearerInitialTest = {...initialTest, errorNumber: null, errorType: null} as TestModel
  const testTenghtSafeTest =
    passages.length > 3
      ? littleClearerInitialTest
      : littleClearerInitialTest.level === TESTLEVEL.l11
      ? { ...littleClearerInitialTest, level: TESTLEVEL.l10 }
      : littleClearerInitialTest;
  //filling test data here
  const testCreationList = {
    [TESTLEVEL.l10]: createL10Test,
    [TESTLEVEL.l11]: createL11Test,
    [TESTLEVEL.l20]: createL20Test,
    [TESTLEVEL.l21]: createL21Test,
    [TESTLEVEL.l30]: createL30Test,
    [TESTLEVEL.l40]: createL40Test,
    [TESTLEVEL.l50]: createL50Test
  };
  const randBool = Math.random() > 0.5;
  const onlyLevelFunctions: Record<PASSAGELEVEL, CreateTestMethodModel> = {
    [PASSAGELEVEL.l1]: randBool ? createL10Test : createL11Test,
    [PASSAGELEVEL.l2]: randBool ? createL20Test : createL21Test,
    [PASSAGELEVEL.l3]: createL30Test,
    [PASSAGELEVEL.l4]: createL40Test,
    [PASSAGELEVEL.l5]: createL50Test
  };
  const onlyLevelTestLevels = {
    //l11 cant be created without 4 passages minimum
    [PASSAGELEVEL.l1]:
      randBool || passages.length <= 3 ? TESTLEVEL.l10 : TESTLEVEL.l11,
    [PASSAGELEVEL.l2]: randBool ? TESTLEVEL.l20 : TESTLEVEL.l21,
    [PASSAGELEVEL.l3]: TESTLEVEL.l30,
    [PASSAGELEVEL.l4]: TESTLEVEL.l40,
    [PASSAGELEVEL.l5]: TESTLEVEL.l50
  };
  if (targetTestLevel) {
    return onlyLevelFunctions[targetTestLevel]({
      initialTest: {
        ...initialTest,
        level: onlyLevelTestLevels[targetTestLevel]
      },
      passages,
      history
    });
  }
  return testCreationList[testTenghtSafeTest.level]({
    initialTest: testTenghtSafeTest,
    passages,
    history
  });
};

interface CreateTestInputModel {
  initialTest: TestModel;
  passages: PassageModel[];
  history: TestModel[];
}
type CreateTestMethodModel = (data: CreateTestInputModel) => TestModel;

const createL10Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const p = passages.find((ps) => ps.id === initialTest.passageId); //aka targetPassage
  if (!p) {
    return initialTest;
  }
  const successStroke = getPerfectTestsNumber(history, p);
  const getRandomAddress = () => {
    //1 same book diff address
    const sameBookAddresses = passages
      .filter(
        (n) =>
          n.address.bookIndex === p.address.bookIndex && n.address !== p.address
      )
      .map((n) => n.address);
    //2 just random from passages
    const justRandomOtherNeigborAddresses = passages.map((n) => n.address);
    //3 just random address
    const randomBookIndex = randomItem([
      p.address.bookIndex > 0 ? p.address.bookIndex - 1 : p.address.bookIndex,
      p.address.bookIndex,
      p.address.bookIndex,
      p.address.bookIndex,
      p.address.bookIndex < bibleReference.length - 1
        ? p.address.bookIndex + 1
        : p.address.bookIndex,
      randomRange(0, bibleReference.length - 1)
    ]) as number;
    const randomStartChapterNumber = randomRange(
      0,
      bibleReference[randomBookIndex].chapters.length - 1
    );
    //if same chapter or null/NaN
    //then same as randomStart
    //else randomStart + originChapterDifference
    const randomEndChapterNumber =
      p.address.startChapterNum === p.address.endChapterNum ||
      !p.address.endChapterNum
        ? randomStartChapterNumber
        : randomStartChapterNumber +
          Math.min(
            Math.abs(p.address.endChapterNum - p.address.startChapterNum),
            bibleReference[randomBookIndex].chapters.length -
              randomStartChapterNumber
          );
    const randomStartVerseNumber = randomRange(
      0,
      bibleReference[randomBookIndex].chapters[randomStartChapterNumber]
    );
    //if same verse or null/NaN
    //then same as randomStart
    //else if same chapter
    //then random from starting verse to chapter end
    //else random from start to the end on end-chapter
    const randomEndVerseNumber =
      p.address.startVerseNum === p.address.endVerseNum ||
      !p.address.endVerseNum
        ? randomStartVerseNumber
        : randomStartChapterNumber === randomEndChapterNumber
        ? randomRange(
            randomStartVerseNumber,
            bibleReference[randomBookIndex].chapters[randomStartChapterNumber]
          )
        : randomRange(
            0,
            bibleReference[randomBookIndex].chapters[randomEndChapterNumber]
          );
    const justRandomAddress: AddressType = {
      bookIndex: randomBookIndex,
      startChapterNum: randomStartChapterNumber,
      endChapterNum: randomEndChapterNumber,
      startVerseNum: randomStartVerseNumber,
      endVerseNum: randomEndVerseNumber
    };
    //4 from errors
    const wrongAdressesWithSamePassage = history
      .filter((ph) => ph.passageId === p.id)
      .map((ph) => ph.wrongAddress)
      .flat();
    if (successStroke > 2 && wrongAdressesWithSamePassage.length > 4) {
      return randomItem([
        ...justRandomOtherNeigborAddresses,
        ...wrongAdressesWithSamePassage
      ]) as AddressType;
    } else {
      return randomItem([
        ...sameBookAddresses,
        ...justRandomOtherNeigborAddresses,
        ...wrongAdressesWithSamePassage,
        justRandomAddress
      ]) as AddressType;
    }
  };
  const addressOptions: AddressType[] = [p.address]; //adding right answer
  let iteration = 0;
  const maxIteration = 1000;
  while (addressOptions.length < 4 && iteration < maxIteration) {
    const randomAddress = getRandomAddress();
    if (
      !addressOptions
        .map((a) => JSON.stringify(a))
        .includes(JSON.stringify(randomAddress))
    ) {
      addressOptions.push(randomAddress);
    }
    iteration++;
  }
  if (iteration >= maxIteration) {
    console.warn("Max iteration number exided");
  }
  //shuffling
  initialTest.testData.addressOptions = addressOptions.sort(() =>
    Math.random() > 0.5 ? -1 : 1
  );
  return initialTest;
};

const createL11Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const optionsLength = 4;

  //if passages.length < optionsLength - replace with L10
  if (passages.length < optionsLength) {
    return createL10Test({ initialTest, passages, history });
  }
  //passages from errors
  const rightOne = passages.find(
    (p) => p.id === initialTest.passageId
  ) as PassageModel;
  const fromErrors = history
    .filter((ph) => ph.passageId === initialTest.passageId)
    .map((ph) =>
      passages.filter((p) => (ph.wrongPassagesId || []).includes(p.id))
    )
    .flat();
  //closest passages
  const closestPassages = passages.sort((a, b) =>
    addressDistance(a.address, b.address)
  );
  //random passages from the list
  const randomPassages = [] as PassageModel[];
  const wrongOptions = randomListRange(
    [...randomPassages, ...closestPassages, ...fromErrors]
      .filter((v, i, arr) => {
        return arr.indexOf(v) === i;
      })
      .filter((p) => p.id !== rightOne.id),
    optionsLength - 1
  ) as PassageModel[];
  const allOptions = [...wrongOptions, rightOne].sort(() =>
    Math.random() > 0.5 ? -1 : 1
  );
  const returnTest: TestModel = {
    ...initialTest,
    testData: { ...initialTest.testData, passagesOptions: allOptions }
  };
  return returnTest;
};

const createL20Test: CreateTestMethodModel = ({ initialTest }) => {
  return initialTest;
};

const createL21Test: CreateTestMethodModel = ({ initialTest }) => {
  return initialTest;
};

const createL30Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const targetPassage = passages.find((p) => p.id === initialTest.passageId);
  if (!targetPassage) {
    return initialTest;
  }

  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const words = targetPassage.verseText
    .replace(/ {2,3}/g, " ")
    .trim()
    .split(" ");
  if (!words.length) {
    return initialTest;
  }
  let missingWords: number[] = [];

  if (!successStroke) {
    //just few words: 10%
    //random words
    missingWords = words
      .map((w, i) => i)
      .sort(() => (Math.random() > 0.5 ? -1 : 1))
      .slice(0, Math.max(3, Math.floor(words.length * 0.2)))
      .map((w) => w);
  } else if (successStroke < 2) {
    //many words: 50%
    //simular words(length, chars, [meaning somehow?])
    //(sameCharactersNum / length) - lengthDiff
    //from errors
    //select next acconding to current list
    const whileFallBack = 1000;
    const targetListLength = Math.max(1, Math.floor(words.length * 0.7));
    let i = 0;
    while (i < whileFallBack && missingWords.length < targetListLength) {
      if (Math.random() > 0.5) {
        //we know that we have a pair if total number is even
        //if empty or evenLength select random
        if (!missingWords.length) {
          missingWords.push(randomRange(0, words.length - 1));
        } else {
          const randomFromExisting = randomRange(0, missingWords.length - 1);
          const mostSimmularArr = words
            .map((w, ind) => [ind, getSimularity(w, words[randomFromExisting])])
            .filter((w) => w[1] < 1)
            .sort((a, b) => b[1] - a[1]);
          let mostSimmular = 0;
          const wordsToAdd = mostSimmularArr
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            .filter((mostSimmularWord, ind) => {
              //first three from most simmular
              mostSimmular = mostSimmularWord[0];
              return (
                ind < 3 &&
                mostSimmular !== -1 &&
                !missingWords.includes(mostSimmular)
              );
            })
            .map((v) => v[0])
            .filter((v, ind, arr) => arr.slice(0, ind).includes(v));
          missingWords = [...missingWords, ...wordsToAdd];
        }
        //else select simular
      } else {
        //from errors or random
        const wordsFromErrors = history
          .filter(
            (t) =>
              t.passageId === initialTest.passageId &&
              t.errorType === "wrongWord"
          )
          .map((t) => t.wrongWords)
          .flat();
        if (!wordsFromErrors.length) {
          const randomIndex = randomRange(0, words.length - 1);
          if (!missingWords.includes(randomIndex)) {
            missingWords.push(randomIndex);
          }
        } else {
          const randomWordFromErrors = randomItem(wordsFromErrors) as [
            number,
            string
          ];
          const wrongWordIndex = words.indexOf(randomWordFromErrors[1]);
          if (
            wrongWordIndex > -1 &&
            !missingWords.includes(wrongWordIndex) &&
            !missingWords.includes(randomWordFromErrors[0])
          ) {
            missingWords.push(wrongWordIndex);
            missingWords.push(randomWordFromErrors[0]);
          }
        }
      }
      i++;
    }
  } else {
    //all words: 100%
    missingWords = words.map((w, i) => i);
  }
  return {
    ...initialTest,
    testData: {
      ...initialTest.testData,
      missingWords: missingWords.sort((a, b) =>
        ("" + words[a]).localeCompare(words[b])
      ) //sort alphabeticaly
    }
  };
};

const createL40Test: CreateTestMethodModel = ({ initialTest }) => {
  return {
    ...initialTest,
    testData: {
      ...initialTest.testData,
      showAddressOrFirstWords: Math.random() > 0.5
    }
  } as TestModel;
};

const createL50Test: CreateTestMethodModel = createL40Test;
