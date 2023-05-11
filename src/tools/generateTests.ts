import { bibleReference } from "../bibleReference";
import { TestLevel } from "../constants";
import { createAddress, createTest } from "../initials";
import { AddressType, PassageModel, TestModel } from "../models";

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

export const generateTests: (passages: PassageModel[], history: TestModel[]) => TestModel[] = (passages, history) => {
  if(!passages.length){
    console.log("there are no passages to create tests");
    return [];
  }
  const sessionId = Math.round(Math.random() * 10000000)
  //sort for oldest tested
  //TODO add some randomness 
  const tests: TestModel[] = passages
    .sort((a,b) => a.dateTested - b.dateTested)//getting oldest to test
    .slice(0,Math.min(passages.length, 5))//limiting max number
    .sort(() => Math.random() > 0.5 ? -1 : 1)//shuffling
    .map(p => {
    const initialTest = createTest(sessionId, p.id, p.selectedLevel)
    //filling test data here
    switch(initialTest.level){
      case TestLevel.l10://select right address from options
        const test =  createL10Test({
          initialTest,
          passages,
          passageHistory: history
        })
        return test;
      case TestLevel.l11://select right passage from options
        return initialTest;
      case TestLevel.l20://select address with AP
        return initialTest;
      case TestLevel.l21://start typing first words with autocomplete
        return initialTest;
      case TestLevel.l30://complete missing words 10-100%
        return initialTest;
      case TestLevel.l40://write passage with autocomplete(from all passages)
        return initialTest;
      case TestLevel.l50://write passage without autocomplete and with checking on finish
        return initialTest;
      default:
        console.error("Unknown level type, unable to create test")
        return initialTest;
    }
  })
  return tests;
}

const randomRange: (from: number, to: number) => number = (from, to) => {
  return Math.round(Math.random() * (to - from)) + from
}
const randomItem: (list: (number | string | AddressType)[]) => (number | string | AddressType) = (list) => {
  if (list.length < 2){
    return list[0];
  }
  return list[randomRange(0, list.length-1)];
}

const addressDistance: (address1: AddressType, address2: AddressType) => number = (address1, address2) => {
  return (Math.abs(address2.bookIndex - address1.bookIndex) * 100)
          + (Math.abs(address2.startChapterNum - address1.startChapterNum) * 10)
          + Math.abs(address2.startVerseNum - address1.startVerseNum);
}


interface CreateTestInputModel {
  initialTest: TestModel
  passages: PassageModel[]
  passageHistory: TestModel[]
}
type CreateTestMethodModel = (data: CreateTestInputModel) => TestModel

const createL10Test: CreateTestMethodModel = ({initialTest, passages, passageHistory}) => {
  const p = passages.find(p => p.id === initialTest.passageId)
  if(!p){
    return initialTest
  }
  const getRandomItem = () => {
    //1 same book diff address
    const sameBookAddresses = passages.filter(n => n.address.bookIndex === p.address.bookIndex && n.address !== p.address).map(n => n.address);
    //2 just random from passages
    const justRandomOtherNeigborAddresses = passages.map(n => n.address);
    //3 just random address
    const randomBookIndex = randomItem([
      (p.address.bookIndex > 0 ? p.address.bookIndex - 1 : p.address.bookIndex),
      p.address.bookIndex,
      p.address.bookIndex,
      p.address.bookIndex,
      (p.address.bookIndex < bibleReference.length-1 ? p.address.bookIndex + 1 : p.address.bookIndex),
      randomRange(0, bibleReference.length-1)
    ]) as number;
    const randomStartChapterNumber = randomRange(0, bibleReference[randomBookIndex].chapters.length-1);
    //if same chapter or null/NaN
      //then same as randomStart
      //else randomStart + originChapterDifference
    const randomEndChapterNumber = p.address.startChapterNum === p.address.endChapterNum || !p.address.endChapterNum ? randomStartChapterNumber : randomStartChapterNumber + Math.min(Math.abs(p.address.endChapterNum - p.address.startChapterNum), bibleReference[randomBookIndex].chapters.length - randomStartChapterNumber);
    const randomStartVerseNumber = randomRange(0, bibleReference[randomBookIndex].chapters[randomStartChapterNumber])
    //if same verse or null/NaN 
      //then same as randomStart
      //else if same chapter
        //then random from starting verse to chapter end
        //else random from start to the end on end-chapter
    const randomEndVerseNumber = p.address.startVerseNum === p.address.endVerseNum || !p.address.endVerseNum ? randomStartVerseNumber : randomStartChapterNumber === randomEndChapterNumber ? randomRange(randomStartVerseNumber, bibleReference[randomBookIndex].chapters[randomStartChapterNumber]) : randomRange(0, bibleReference[randomBookIndex].chapters[randomEndChapterNumber])
    const justRandomAddress: AddressType = {
      bookIndex: randomBookIndex,
      startChapterNum: randomStartChapterNumber,
      endChapterNum: randomEndChapterNumber,
      startVerseNum: randomStartVerseNumber,
      endVerseNum: randomEndVerseNumber
    }
    //4 from errors
    const wrongAdressesWithSamePassage = passageHistory.filter(ph => ph.passageId === p.id).map(p => p.wrongAddress).flat()
    return randomItem([...sameBookAddresses, ...justRandomOtherNeigborAddresses, ...wrongAdressesWithSamePassage, justRandomAddress]) as AddressType
  }
  const addressOptions:AddressType[] = [p.address]
  while(addressOptions.length < 4){
    const randomAddres = getRandomItem()
    if(!addressOptions.map(a => JSON.stringify(a)).includes(JSON.stringify(randomAddres))){
      addressOptions.push(randomAddres)
    }
  }
  //shuffling
  initialTest.testData.addressOptions = addressOptions.sort(() => Math.random() > 0.5 ? -1 : 1);
  return initialTest;
}