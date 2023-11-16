import { getAddressDifference } from "./addressDifference";
import { bibleReference } from "../bibleReference";
import { TESTLEVEL, PASSAGELEVEL, SORTINGOPTION, SENTENCE_SEPARATOR, MINIMUM_SENTENCE_LENGTH, PERFECT_TESTS_TO_PROCEED, FIRST_FEW_WORDS } from "../constants";
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


export const getPassagesByTrainMode: (
  state: AppStateModel,
  trainMode: TrainModeModel
) => PassageModel[] = (state, trainMode) => {
  const targetTranslation = state.settings.translations.find(
    (tr) => tr.id === trainMode.translation
  );
  //if train mode enabled AND translation exists
  if (!trainMode.enabled || !targetTranslation) {
    return [];
  }

  //TODO all due to (one if one left), other only if there are no passages due ot
  //TODO make getDueTo as a separate method
  return state.passages
    .filter((p) => {
      //if translation right
      const isTranslationRight = p.verseTranslation === trainMode.translation;
      //include tags if not empty
      const hasAllIncludedTags = trainMode.includeTags.length
        //if passage has all of the tags of trainMode
        ? trainMode.includeTags.filter((tag) => p.tags.includes(tag)).length ===
          trainMode.includeTags.length
        : true;
      //exclude tags if not empty
      const doesNotHasAnyExcludedTags = trainMode.excludeTags.length
        //if passage has none of the tags of trainMode 
        ? !trainMode.excludeTags.filter((tag) => p.tags.includes(tag)).length
        : true;
      const hasTargetLevelAvalible = trainMode.testAsLevel 
        ? p.maxLevel > trainMode.testAsLevel - 1 || state.settings.devMode
        : true;
      return (
        isTranslationRight && hasAllIncludedTags && doesNotHasAnyExcludedTags && hasTargetLevelAvalible
      );
    })
    .sort((a, b) => {
      switch (trainMode.sort) {
        case SORTINGOPTION.address:
          return getAddressDifference(a.address, b.address);
        case SORTINGOPTION.maxLevel:
          return b.maxLevel - a.maxLevel;
        case SORTINGOPTION.selectedLevel:
          return b.selectedLevel - a.selectedLevel;
        case SORTINGOPTION.resentlyCreated:
          return b.dateCreated - a.dateCreated;
        case SORTINGOPTION.oldestToTrain:
          return a.dateTested - b.dateTested;
        default:
          console.warn("Undefined sorting option", trainMode.sort)
          return 0;
      }
    })
    .slice(0, trainMode.length || Infinity) //limiting max number
    .sort(() => (Math.random() > 0.5 ? -1 : 1)); //shuffling again JUST FOR FUN!!!
};

export const generateTests: (state: AppStateModel, trainMode: TrainModeModel) => TestModel[] = (state, trainMode) => {
  const passages = state.passages;
  const history = state.testsHistory;
  if (!passages.length) {
    console.log("there are no passages to create tests");
    return [];
  }
  const sessionId = Math.round(Math.random() * 10000000);
  const tests: TestModel[] = getPassagesByTrainMode(state, trainMode).map(
    (p) => {
      const initialTest = createTest(sessionId, p.id, p.selectedLevel);
      return generateATest(initialTest, passages, trainMode.testAsLevel, history);
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
    [PASSAGELEVEL.l1]: 
      randBool || passages.length <= 3 ? createL10Test : createL11Test,
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
  if (typeof targetTestLevel === "number") {
    return onlyLevelFunctions[targetTestLevel as PASSAGELEVEL]({
      initialTest: {
        ...initialTest,
        level: onlyLevelTestLevels[targetTestLevel as PASSAGELEVEL]
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

interface ErrorGradedWord {
  index: number
  string: string
  times: number
}

const getWordsFromErrors: (history: TestModel[], passageId: number) => ErrorGradedWord[] = (history, passageId) => {
  return history
    .filter(
      (t) =>
        t.passageId === passageId 
        && t.errorType === "wrongWord"
    )
    .map((t) => t.wrongWords)
    .flat()
    .map((w,i, arr) => {
      return {
        index: w[0],
        string: w[1],
        times: arr.filter( arrW => arrW[0] === w[0] && arrW[1] === w[1]).length
      }
    })
    // getting unique 
    .filter((w,i,arr) => 
      arr.slice(0, i+1).filter(arrW => arrW.index === w.index && arrW.string === w.string).length === 1
    )
    //soring by most popular
    .sort((a,b) => b.times - a.times)
}

const getErrorGradedSentences: (sentences: string[], wordsFromErrors: ErrorGradedWord[]) => {sentanceIndex: number, errorRate: number}[] = (sentences, wordsFromErrors) => {
  return sentences.map((s,i, arr) => {
    //number of words in the prevous sentences
    const wordIndexMargin = i === 0 ? 0 : arr.slice(0,i).join("").trim().split(" ").length;
    const wordIndexWidth = wordIndexMargin + s.trim().split(" ").length - (i === 0 ? 0 : 1);
    const errorRate = wordsFromErrors.filter(wfe => wfe.index >= wordIndexMargin && wfe.index < wordIndexWidth).map(wfe => wfe.times).flat().reduce((partialSum, w) => partialSum + w, 0)
    return {
      sentanceIndex: i,
      errorRate: errorRate
    }
  }).sort((a,b) => b.errorRate - a.errorRate)
}

const createL10Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const targetPassage = passages.find((ps) => ps.id === initialTest.passageId); //targetPassage
  const optionsLength = 4;
  if (!targetPassage) {
    return initialTest;
  }

  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const sentases = targetPassage.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length > 1);
  const randomSentenceStart = randomRange(1, sentases.length > 1 ? sentases.length-1 : 1);
  const randomSentenceEnd = randomRange(randomSentenceStart + 1, Math.max(randomSentenceStart + 1, sentases.length-1));
  const shouldntSlice = 
    !successStroke 
    || sentases.length < 2 
    || sentases.slice(randomSentenceStart, randomSentenceEnd).join().length < 20
    || Math.random() > 0.5
  const sentenceRange = shouldntSlice ? [] : [randomSentenceStart,randomSentenceEnd]
  const errorAddresses = history
    //same passage, any level, but some wrong address (maybe from 2nd level even)
    .filter(h => h.passageId == targetPassage.id && h.wrongAddress.length)
    .map(h => h.wrongAddress)
    .flat()
  let uniqueErrorAddresses = errorAddresses.filter((a, i, arr) => {
    return arr.filter(a2 => 
      getAddressDifference(a, a2) === 0
    ).length === 1
  })
  const neigborsAddresses = passages.filter(np => 
    np.versesNumber === targetPassage.versesNumber 
    && (np.address.bookIndex === targetPassage.address.bookIndex
    || np.address.startChapterNum === targetPassage.address.startChapterNum)
  ).map(np => np.address)
  let uniqueNeigborsAddresses = neigborsAddresses.filter(a => 
    uniqueErrorAddresses.filter(a2 => 
      getAddressDifference(a, a2) === 0
    ).length === 0 &&
    getAddressDifference(a, targetPassage.address) !== 0
  )
  const probabilityOptionError =  errorAddresses.length ? 0.5 : 0;
  const probabilityOptionNeigbor = neigborsAddresses.length ? probabilityOptionError + 0.4 : 0;

  const getRandomAddress: (p: PassageModel,exept: AddressType[]) => AddressType = (target,exept) => {
    //just random address (a book before, same book,a book after, just a random)
    const randomBookIndex = randomItem([
      target.address.bookIndex > 0 ? target.address.bookIndex - 1 : target.address.bookIndex,
      target.address.bookIndex,
      target.address.bookIndex,
      target.address.bookIndex,
      target.address.bookIndex < bibleReference.length - 1
        ? target.address.bookIndex + 1
        : target.address.bookIndex,
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
      target.address.startChapterNum === target.address.endChapterNum ||
      !target.address.endChapterNum
        ? randomStartChapterNumber
        : randomStartChapterNumber +
          Math.min(
            Math.abs(target.address.endChapterNum - target.address.startChapterNum),
            bibleReference[randomBookIndex].chapters.length -
              randomStartChapterNumber
          );
    const randomStartVerseNumber = randomRange(
      0,
      bibleReference[randomBookIndex].chapters[randomStartChapterNumber]
    );
    //if same verse or null/NaN
    //  then same as randomStart
    //else if same chapter
    //  then random from starting verse to chapter end
    //  else random from start to the end on end-chapter
    const randomEndVerseNumber =
      target.address.startVerseNum === target.address.endVerseNum ||
      !target.address.endVerseNum
        ? randomStartVerseNumber
        : randomStartChapterNumber === randomEndChapterNumber
        ? Math.min(bibleReference[randomBookIndex].chapters[randomStartChapterNumber], randomStartVerseNumber + target.versesNumber)
        : randomRange(
            0,
            Math.min(bibleReference[randomBookIndex].chapters[randomEndChapterNumber], target.versesNumber)
          );
    const justRandomAddress: AddressType = {
      bookIndex: randomBookIndex,
      startChapterNum: randomStartChapterNumber,
      endChapterNum: randomEndChapterNumber,
      startVerseNum: randomStartVerseNumber,
      endVerseNum: randomEndVerseNumber
    };
    //call itself to regenerate other random address
    if(exept.find(e => getAddressDifference(e, justRandomAddress) === 0)){
      return getRandomAddress(target, exept)
    }
    return justRandomAddress
  };
  
  const addressOptions: AddressType[] = [targetPassage.address]; //adding right answer
  for(let i = 0; i < optionsLength - 1; i++){
    if(Math.random() < probabilityOptionError && uniqueErrorAddresses.length){
      const selectedErrorItem = randomItem(uniqueErrorAddresses) as AddressType
      addressOptions.push(selectedErrorItem);
      uniqueErrorAddresses = uniqueErrorAddresses.filter(a => getAddressDifference(a, selectedErrorItem) !== 0)
    }else if (Math.random() < probabilityOptionNeigbor && uniqueNeigborsAddresses.length){
      const selectedNeigborItem = randomItem(uniqueNeigborsAddresses) as AddressType
      addressOptions.push(selectedNeigborItem);
      uniqueNeigborsAddresses = uniqueNeigborsAddresses.filter(a => getAddressDifference(a, selectedNeigborItem) !== 0)
    }else{
      addressOptions.push(getRandomAddress(targetPassage, [targetPassage.address, ...uniqueErrorAddresses, ...uniqueNeigborsAddresses]));
    }
  }
  return {
    ...initialTest,
    testData: {
      ...initialTest.testData,
      addressOptions: addressOptions.sort(() => Math.random() > 0.5 ? 1 : -1),
      sentenceRange 
  }};
};

const createL11Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const optionsLength = 4;
  //if passages.length < optionsLength then replace with L10
  if (passages.length < optionsLength) {
    return createL10Test({ initialTest, passages, history });
  }
  //passages from errors
  const targetPassage = passages.find(
    (p) => p.id === initialTest.passageId
    ) as PassageModel;
  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const fromErrors = history
    .filter(ph => ph.passageId === initialTest.passageId || ph.wrongPassagesId || ph.wrongAddress)
    .filter(ph => ph.wrongPassagesId.includes(ph.id))
    .map((ph) =>
      passages.filter((p) => ph.wrongPassagesId.includes(p.id) || ph.wrongAddress.find(wa => getAddressDifference(p.address, wa) === 0))
    )
    .flat();
  //simular passages
  const closestPassages = passages
    .filter(p => addressDistance(targetPassage.address, p.address) !== 0 && !fromErrors.filter(frp => p.id === frp.id).length)
    .sort((a, b) => {
      let bias = 0;
      bias += b.address.bookIndex !== targetPassage.address.bookIndex ? -1000000 : 0;
      bias += b.address.startChapterNum !== targetPassage.address.startChapterNum ? -100000 : 0;
      bias += b.address.startVerseNum !== targetPassage.address.startVerseNum ? -100000 : 0;
      bias += b.versesNumber !== targetPassage.versesNumber ? -100000 : 0;
      return bias
    })
    .slice(0, optionsLength * 4)
  const wrongOptions = randomListRange(
    [...closestPassages, ...fromErrors]
      .filter((v, i, arr) => {
        return arr.slice(0,i).filter(arrV => arrV.id === v.id).length === 0 && v.id !== targetPassage.id;
      }),
    optionsLength - 1
  ) as PassageModel[];
  const allOptions = [...wrongOptions, targetPassage].sort(() =>
    Math.random() > 0.5 ? -1 : 1
  );
  //random range from 0 and maximum possible
  const maxSENTENCELength = Math.max(...allOptions.map(ao => ao.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length > 2).length))
  const rangeStart = randomRange(0, maxSENTENCELength - 1)
  const sentenceRange = successStroke ? [rangeStart, randomRange(rangeStart + 1, maxSENTENCELength)] : []
  const returnTest: TestModel = {
    ...initialTest,
    testData: {
      ...initialTest.testData,
      passagesOptions: allOptions,
      sentenceRange
    }
  };
  return returnTest;
};

const createL20Test: CreateTestMethodModel = ({ initialTest, history, passages }) => {
  const targetPassage = passages.filter(p => p.id === initialTest.passageId)[0];
  const successStroke = getPerfectTestsNumber(history, targetPassage);

  const sentaces = targetPassage.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length)
  const sentenceRangeStart = sentaces.length > 1 ? randomRange(0, sentaces.length-1) : 0;
  const sentenceRangeEnd = sentaces.length > 1 ? randomRange(sentenceRangeStart, sentaces.length) : sentaces.length;

  const sentenceRange = 
    successStroke
    && sentaces.slice(sentenceRangeStart, sentenceRangeEnd).join().length >= MINIMUM_SENTENCE_LENGTH 
    ? [sentenceRangeStart, sentenceRangeEnd] 
    : [];
  return {
    ...initialTest,
    testData: {
      sentenceRange
    }
  };
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
  const words = targetPassage.verseText
    .replace(/ {2,3}/g, " ")
    .trim()
    .split(" ");
  if (!words.length) {
    return initialTest;
  }
  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const sentances = targetPassage.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length > 1);
  const wordsFromErrors = getWordsFromErrors(history, initialTest.passageId)
  let missingWords: number[] = [];
  if(successStroke === PERFECT_TESTS_TO_PROCEED) { //last time before next level
    //add all words
    missingWords = words.map((w, i) => i);
  }else{
    if(
      sentances.length > 2 
      && successStroke !== 0 
      && sentances.join().length > MINIMUM_SENTENCE_LENGTH
      && Math.random() > 0.3
    ){
      //IF there are several sentances THEN add one or two to missing
      if(Math.random() > 0.5){
        const sentancesErrorGraded = getErrorGradedSentences(sentances, wordsFromErrors)
        const totalErrorRateNumber = sentancesErrorGraded.map(s => s.errorRate).reduce((ps,r) => ps + r,0)
        const randomNumber = randomRange(0,totalErrorRateNumber)
        //first that is bigger b.c. there could be bug number that will not match === condition
        const biasedRandomSentence = sentancesErrorGraded
        .filter((s,i,arr) => {
          arr.slice(0,i).reduce((ps,r) => ps + r.errorRate,0) >= randomNumber
          }
        )[0] || sentancesErrorGraded[0]
        const sentanceIndexToAdd = biasedRandomSentence.sentanceIndex
        const startingWordIndexStart = sentanceIndexToAdd === 0 ? 0 : sentances.slice(0,sentanceIndexToAdd).join("").trim().split(" ").length;
        missingWords = Array(sentances[sentanceIndexToAdd].trim().split(" ").length).fill(0).map((v,i) => i + startingWordIndexStart)
      }else{

        const numberOfNiegbors = Math.random() > 0.5 ? 0 : 1;
        const randomIndexToAdd = randomRange(0, Math.min(1, sentances.length - numberOfNiegbors))
        const startingWordIndexStart = randomIndexToAdd === 0 ? 0 : sentances.slice(0,randomIndexToAdd).join("").trim().split(" ").length;
        const wordsNumber = sentances[randomIndexToAdd]?.trim()?.split(" ")?.length || 1 //+ (sentances[randomIndexToAdd + numberOfNiegbors]?.trim()?.split(" ")?.length || 0)
        missingWords = Array(wordsNumber).fill(0).map((v,i) => i + startingWordIndexStart)
      }
    }else{
      //Just words
      //number of seed words 1..2%(min 3) OR 3..5%(min 7)
      const numberOfSeeds = successStroke > 0 ? randomRange(1,Math.max(7, Math.floor(words.length / 20))) : randomRange(2, Math.max(3, Math.floor(words.length / 50)))
      Array(numberOfSeeds).fill(0).map((v,i) => {
        const wordsAfter = randomRange(0, 2)
        const wordsBefore = randomRange(0, 2)
        if(wordsFromErrors.filter(wfe => !missingWords.includes(wfe.index)).length && Math.random() > 0.5){//50% chance if there are some errors
          //seed from errors
          const randomNumber = randomRange(0, wordsFromErrors.reduce((ps,w) => ps + w.times,0))
          const biasedRandomWord = wordsFromErrors
            .filter((s,i,arr) => {
              arr.slice(0,i).reduce((ps,r) => ps + r.times,0) >= randomNumber
              }
            )[0] || wordsFromErrors[0]
          const wordsToAdd = words
          .map((w,i) =>{
            return {
              word: w,
              index: i
            }
          })
          .filter((w) => {
            return w.index >= biasedRandomWord.index - wordsBefore && w.index <= biasedRandomWord.index + wordsAfter
          })
          .map(w => w.index)
          .filter(w => words[w] && missingWords.filter(mw => mw === w).length === 0)
          missingWords.push(
            ...wordsToAdd
          )
        }else if(Math.random() > 0.5){//25%
          //just random words and neigbors
          const randomNumber = randomRange(0, words.length)
          const wordsToAdd = words
          .map((w,i) =>{
            return {
              word: w,
              index: i
            }
          })
          .filter((w) => {
            return w.index >= randomNumber - wordsBefore && w.index <= randomNumber + wordsAfter
          })
          .map(w => w.index)
          .filter(w => words[w] && missingWords.filter(mw => mw === w).length === 0)
          missingWords.push(
            ...wordsToAdd
          )
        }else{//25%
          //random seed and simular words
          const randomNumber = randomRange(0, words.length)
          const targetWord = words[randomNumber]
          const mostSimularWords = words
            .map((w, ind) => 
              [ind, getSimularity(w, targetWord)])
            .filter((w) => w[1] < 1)
            .sort((a, b) => b[1] - a[1]);
          const wordsToAdd = [
            randomNumber,
            ...mostSimularWords.slice(0,wordsBefore + wordsAfter).map(w => w[0])
          ]
          .filter(w => words[w] && missingWords.filter(mw => mw === w).length === 0)
          missingWords.push(
            ...wordsToAdd
          )
        }
      })
    }
  }
  const alphabeticalMissingWords = missingWords.sort((a, b) =>
    ("" + words[a]).localeCompare(words[b])
  );
  return {
    ...initialTest,
    testData: {
      ...initialTest.testData,
      missingWords: alphabeticalMissingWords 
    }
  };
};

const createL40Test: CreateTestMethodModel = ({ initialTest, passages, history }) => {
  const targetPassage = passages.find(p => p.id === initialTest.passageId)
  if(!targetPassage){
    return initialTest;
  }
  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const sentences = targetPassage ? targetPassage.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length > 1) : undefined
  if(!sentences){
    return initialTest
  }
  const wordsFromErrors = getWordsFromErrors(history, initialTest.passageId)
  const sentancesErrorGraded = getErrorGradedSentences(sentences, wordsFromErrors)
  const biasedRandomSentence = sentancesErrorGraded
        .filter((s,i,arr) => {
          arr.slice(0,i).reduce((ps,r) => ps + r.errorRate,0) >= randomRange(0,sentancesErrorGraded.map(s => s.errorRate).reduce((ps,r) => ps + r,0))
          }
        )[0] || sentancesErrorGraded[0]
  const sentanceIndexToAdd = biasedRandomSentence.sentanceIndex
  const numberOfSentences = randomRange(1,2);
  const sentanceStartIndex = 
  sentences.length > 2 && sentanceIndexToAdd < sentences.length - numberOfSentences 
  ? sentanceIndexToAdd
  : 0;
  const sentenceRange = sentences.length < 3 || successStroke >= PERFECT_TESTS_TO_PROCEED ? [] : [sentanceStartIndex,sentanceStartIndex + numberOfSentences];
  return {
    ...initialTest,
    testData: {
      ...initialTest.testData,
      //show first words instead of address only if there are more then 4 words
      showAddressOrFirstWords: targetPassage.verseText.split(" ").length > FIRST_FEW_WORDS ? Math.random() > 0.5 : true,
      sentenceRange
    }
  } as TestModel;
};

const createL50Test: CreateTestMethodModel = createL40Test;
