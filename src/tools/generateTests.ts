import { getAddressDifference } from '../screens/listScreen';
import { bibleReference } from '../bibleReference';
import {
    TEST_LIST_NUMBER,
    TEST_LEVEL,
    PASSAGE_LEVEL,
    SORTING_OPTION
} from '../constants';
import { createTest } from '../initials';
import {
    AddressType,
    AppStateModel,
    PassageModel,
    TestModel,
    TrainModeModel
} from '../models';
import { getPerfectTestsNumber } from './getPerfectTests';
import { getSimularity } from './getSimularity';
import { addressDistance } from './addressDistance';
import { randomItem, randomListRange, randomRange } from './randomizers';

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

//for debugging
let onlyLevel: TEST_LEVEL | null = null; //TEST_LEVEL.l30;
let listLength: number | null = null; //3

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
            const isTranslationRight =
                p.verseTranslation === trainMode.translation;
            //include tags if not empty
            const hasAllIncludedTags = trainMode.includeTags.length
                ? trainMode.includeTags.filter((tag) => p.tags.includes(tag))
                      .length === trainMode.includeTags.length
                : true;
            //exclude if not empty
            const doesNotHasAnyExcludedTags = trainMode.excludeTags.length
                ? !trainMode.excludeTags.filter((tag) => p.tags.includes(tag))
                      .length
                : true;
            return (
                isTranslationRight &&
                hasAllIncludedTags &&
                doesNotHasAnyExcludedTags
            );
        })
        .sort((a, b) => {
            switch (trainMode.sort) {
                case SORTING_OPTION.address:
                    return getAddressDifference(a, b);
                case SORTING_OPTION.maxLevel:
                    return b.maxLevel - a.maxLevel;
                case SORTING_OPTION.selectedLevel:
                    return b.selectedLevel - a.selectedLevel;
                case SORTING_OPTION.resentlyCreated:
                    return b.dateCreated - a.dateCreated;
                case SORTING_OPTION.oldestToTrain:
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
        console.log('there are no passages to create tests');
        return [];
    }
    //TODO all due to (one if one left), other only if there are no passages due ot
    //TODO make getDueTo as a separate method
    const sessionId = Math.round(Math.random() * 10000000);
    const tests: TestModel[] = getPassagesByTrainMode(state, trainMode).map(
        (p) => {
            const initialTest = createTest(sessionId, p.id, p.selectedLevel);
            //l11 can't be done without 4 passages min
            const testTenghtSafeTest =
                passages.length > 3
                    ? initialTest
                    : initialTest.level === TEST_LEVEL.l11
                    ? { ...initialTest, level: TEST_LEVEL.l10 }
                    : initialTest;
            //filling test data here
            const testCreationList = {
                [TEST_LEVEL.l10]: createL10Test,
                [TEST_LEVEL.l11]: createL11Test,
                [TEST_LEVEL.l20]: createL20Test,
                [TEST_LEVEL.l21]: createL21Test,
                [TEST_LEVEL.l30]: createL30Test,
                [TEST_LEVEL.l40]: createL40Test,
                [TEST_LEVEL.l50]: createL50Test
            };
            const randBool = Math.random() > 0.5;
            const onlyLevelFunctions = {
                [PASSAGE_LEVEL.l1]: randBool ? createL10Test : createL11Test,
                [PASSAGE_LEVEL.l2]: randBool ? createL20Test : createL21Test,
                [PASSAGE_LEVEL.l3]: createL30Test,
                [PASSAGE_LEVEL.l4]: createL40Test,
                [PASSAGE_LEVEL.l5]: createL50Test
            };
            const onlyLevelTestLevels = {
                //l11 cant be created without 4 passages minimum
                [PASSAGE_LEVEL.l1]:
                    randBool || passages.length <= 3
                        ? TEST_LEVEL.l10
                        : TEST_LEVEL.l11,
                [PASSAGE_LEVEL.l2]: randBool ? TEST_LEVEL.l20 : TEST_LEVEL.l21,
                [PASSAGE_LEVEL.l3]: TEST_LEVEL.l30,
                [PASSAGE_LEVEL.l4]: TEST_LEVEL.l40,
                [PASSAGE_LEVEL.l5]: TEST_LEVEL.l50
            };
            const onlyLevel = trainMode.testAsLevel
                ? ((trainMode.testAsLevel + 1) as PASSAGE_LEVEL)
                : trainMode.testAsLevel;
            if (onlyLevel) {
                return onlyLevelFunctions[onlyLevel]({
                    initialTest: {
                        ...initialTest,
                        level: onlyLevelTestLevels[onlyLevel]
                    },
                    passages,
                    passageHistory: history
                });
            }
            return testCreationList[testTenghtSafeTest.level]({
                initialTest: testTenghtSafeTest,
                passages,
                passageHistory: history
            });
        }
    );
    return tests;
};

interface CreateTestInputModel {
    initialTest: TestModel;
    passages: PassageModel[];
    passageHistory: TestModel[];
}
type CreateTestMethodModel = (data: CreateTestInputModel) => TestModel;

const createL10Test: CreateTestMethodModel = ({
    initialTest,
    passages,
    passageHistory
}) => {
    const p = passages.find((p) => p.id === initialTest.passageId); //aka targetPassage
    if (!p) {
        return initialTest;
    }
    const successStroke = getPerfectTestsNumber(passageHistory, p);
    const getRandomAddress = () => {
        //1 same book diff address
        const sameBookAddresses = passages
            .filter(
                (n) =>
                    n.address.bookIndex === p.address.bookIndex &&
                    n.address !== p.address
            )
            .map((n) => n.address);
        //2 just random from passages
        const justRandomOtherNeigborAddresses = passages.map((n) => n.address);
        //3 just random address
        const randomBookIndex = randomItem([
            p.address.bookIndex > 0
                ? p.address.bookIndex - 1
                : p.address.bookIndex,
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
                      Math.abs(
                          p.address.endChapterNum - p.address.startChapterNum
                      ),
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
                      bibleReference[randomBookIndex].chapters[
                          randomStartChapterNumber
                      ]
                  )
                : randomRange(
                      0,
                      bibleReference[randomBookIndex].chapters[
                          randomEndChapterNumber
                      ]
                  );
        const justRandomAddress: AddressType = {
            bookIndex: randomBookIndex,
            startChapterNum: randomStartChapterNumber,
            endChapterNum: randomEndChapterNumber,
            startVerseNum: randomStartVerseNumber,
            endVerseNum: randomEndVerseNumber
        };
        //4 from errors
        const wrongAdressesWithSamePassage = passageHistory
            .filter((ph) => ph.passageId === p.id)
            .map((p) => p.wrongAddress)
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
        console.warn('Max iteration number exided');
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
    passageHistory
}) => {
    const optionsLength = 4;

    //if passages.length < optionsLength - replace with L10
    if (passages.length < optionsLength) {
        return createL10Test({ initialTest, passages, passageHistory });
    }
    //passages from errors
    const rightOne = passages.find(
        (p) => p.id === initialTest.passageId
    ) as PassageModel;
    const fromErrors = passageHistory
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
    passageHistory
}) => {
    const targetPassage = passages.find((p) => p.id === initialTest.passageId);
    if (!targetPassage) {
        return initialTest;
    }

    const successStroke = getPerfectTestsNumber(passageHistory, targetPassage);
    const words = targetPassage.verseText.split(' ');
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
                    const randomFromExisting = randomRange(
                        0,
                        missingWords.length - 1
                    );
                    const mostSimmularArr = words
                        .map((w, i) => [
                            i,
                            getSimularity(w, words[randomFromExisting])
                        ])
                        .filter((w) => w[1] < 1)
                        .sort((a, b) => b[1] - a[1]);
                    mostSimmularArr.map((mostSimmularWord, i) => {
                        //first three from most simmular
                        const mostSimmular = mostSimmularWord[0];
                        if (
                            i < 3 &&
                            mostSimmular !== -1 &&
                            !missingWords.includes(mostSimmular)
                        ) {
                            missingWords.push(mostSimmular);
                        }
                    });
                }
                //else select simular
            } else {
                //from errors or random
                const wordsFromErrors = passageHistory
                    .filter(
                        (t) =>
                            t.passageId === initialTest.passageId &&
                            t.errorType === 'wrongWord'
                    )
                    .map((t) => t.wrongWords)
                    .flat();
                if (!wordsFromErrors.length) {
                    const randomIndex = randomRange(0, words.length - 1);
                    if (!missingWords.includes(randomIndex)) {
                        missingWords.push(randomIndex);
                    }
                } else {
                    const randomWordFromErrors = randomItem(
                        wordsFromErrors
                    ) as [number, string];
                    const wrongWordIndex = words.indexOf(
                        randomWordFromErrors[1]
                    );
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
                ('' + words[a]).localeCompare(words[b])
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
