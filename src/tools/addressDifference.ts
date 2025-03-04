import { AddressType } from "src/models";


export const getAddressDifference:(a: AddressType, b: AddressType)=> boolean = (a,b) => {
  if(!a.endChapterNum){
    a.endChapterNum = a.startChapterNum
  }
  if(!a.endVerseNum){
    a.endVerseNum = a.startVerseNum
  }
  if(!b.endChapterNum){
    b.endChapterNum = b.startChapterNum
  }
  if(!b.endVerseNum){
    b.endVerseNum = b.startVerseNum
  }
  return JSON.stringify(a) === JSON.stringify(b);

  //|             |A               |B                    |result|
  //|book         |1               |1/2                  |T/F|
  //|startChapter |1               |1/2                  |T/F|
  //|startVerse   |1               |1/2                  |T/F|
  //|endChapter   |start/diff/null |start/diff1/diff2/n  |Astart: T/F/F/T Adiff: F/T/F/F Anull: T/F/F/T 
  //|endVerse     |start/diff/null |start/diff1/diff2/n  |Astart: T/F/F/T Adiff: F/T/F/F Anull: T/F/F/T


  // //if book isnt the same
  // if (a.bookIndex !== b.bookIndex) {
  //   return false;
  // }
  // //if chapter isnt the same
  // if (a.startChapterNum !== b.startChapterNum) {
  //   return false;
  // }
  // //if start verse isnt the same
  // if (a.startVerseNum !== b.startVerseNum) {
  //   return false;
  // }

  // //if chapter a.end and b.end are defined 
  // //and if a.end are different from a.start (the only option for a&b to be the same is for b.end to be the same as a.end)
  // //and if b.end is not the same as corresponding a.end
  // if(a.endChapterNum && b.endChapterNum 
  //     && (a.startChapterNum !== a.endChapterNum)
  //     && (a.endChapterNum !== b.endChapterNum)
  // ){
  //   return false;
  // }

  // //same but with verses
  // if(a.endVerseNum && b.endVerseNum 
  //   && (a.startVerseNum !== a.endVerseNum)
  //   && (a.endVerseNum !== b.endVerseNum)
  // ){
  //   return false;
  // }
  
  // //if a.end are null or eqial to a.start
  // //if b.end are different from corresponding a.end
  // if( (!a.endChapterNum || a.endChapterNum === a.startChapterNum) && (!a.endVerseNum || a.endVerseNum === a.startVerseNum)
  //   && (b.endChapterNum !== a.endChapterNum || b.endVerseNum !== a.endVerseNum)
  // ){
  //   return false;
  // }

  return true;
};


const testAddressDifferece = () => {
  //addres variations

  //a.book != b.book
  //a.book == b.book
  //a.startCh != b.startCh
  //a.startCh == b.startCh
  //a.startVerse != b.startVerse
  //a.startVerse == b.startVerse

  //a.endCh == a.startCh
    //b.endCh == b.startCh
    //b.endCh == a.endCh
    //b.endCh != a.endCh
    //b.endCh = null
  //a.endCh != a.startCh
    //b.endCh == b.startCh
    //b.endCh == a.endCh
    //b.endCh != a.endCh
    //b.endCh = null
  //a.endCh = null
    //b.endCh == b.startCh
    //b.endCh == a.endCh
    //b.endCh != a.endCh
    //b.endCh = null

  //a.endVerse == a.startVerse
    //b.endVerse == b.startVerse
    //b.endVerse == a.endVerse
    //b.endVerse != a.endVerse
    //b.endVerse = null
  //a.endVerse != a.startVerse
    //b.endVerse == b.startVerse
    //b.endVerse == a.endVerse
    //b.endVerse != a.endVerse
    //b.endVerse = null
  //a.endVerse = null
    //b.endVerse == b.startVerse
    //b.endVerse == a.endVerse
    //b.endVerse != a.endVerse
    //b.endVerse = null

  const addr: Record<string, AddressType> = {
    book1: {
      bookIndex: 1,
      startChapterNum: 0,
      startVerseNum: 0,
      endChapterNum: 0,
      endVerseNum: 0
    },
    book2: {
      bookIndex: 2,
      startChapterNum: 0,
      startVerseNum: 0,
      endChapterNum: 0,
      endVerseNum: 0
    },
    startChapter1: {
      bookIndex: 0,
      startChapterNum: 1,
      startVerseNum: 0,
      endChapterNum: 0,
      endVerseNum: 0
    },
    startChapter2: {
      bookIndex: 0,
      startChapterNum: 2,
      startVerseNum: 0,
      endChapterNum: 0,
      endVerseNum: 0
    },
    startVerse1: {
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: 1,
      endChapterNum: 0,
      endVerseNum: 0
    },
    startVerse2: {
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: 2,
      endChapterNum: 0,
      endVerseNum: 0
    },
    endChapterStart: {
      bookIndex: 0,
      startChapterNum: 1,
      startVerseNum: 0,
      endChapterNum: 1,
      endVerseNum: 0
    },
    endChapterDiff1: {
      bookIndex: 0,
      startChapterNum: 1,
      startVerseNum: 0,
      endChapterNum: 2,
      endVerseNum: 0
    },
    endChapterDiff2: {
      bookIndex: 0,
      startChapterNum: 1,
      startVerseNum: 0,
      endChapterNum: 3,
      endVerseNum: 0
    },
    endChapterNull: {
      bookIndex: 0,
      startChapterNum: 1,
      startVerseNum: 0,
      endChapterNum: null,
      endVerseNum: null
    },
    endVerseStart: {
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: 1,
      endChapterNum: 0,
      endVerseNum: 1
    },
    endVerseDiff1: {
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: 1,
      endChapterNum: 0,
      endVerseNum: 2
    },
    endVerseDiff2: {
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: 1,
      endChapterNum: 0,
      endVerseNum: 3
    },
    endVerseNull: {
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: 1,
      endChapterNum: null,
      endVerseNum: null
    },

    normalNoNull: {
      bookIndex: 4,
      startChapterNum: 4,
      startVerseNum: 4,
      endChapterNum: 4,
      endVerseNum: 4
    },
    normalNull: {
      bookIndex: 4,
      startChapterNum: 4,
      startVerseNum: 4,
      endChapterNum: null,
      endVerseNum: null
    },
  };
  
  const comparisonMatrix1 = [
  //a.book != b.book
  //a.book == b.book
  //a.startCh != b.startCh
  //a.startCh == b.startCh
  //a.startVerse != b.startVerse
  //a.startVerse == b.startVerse
    {
      a: addr.book1,
      b: addr.book1,
      exp: true
    },
    {
      a: addr.book1,
      b: addr.book2,
      exp: false
    },
    {
      a: addr.startChapter1,
      b: addr.startChapter1,
      exp: true
    },
    {
      a: addr.startChapter1,
      b: addr.startChapter2,
      exp: false
    },
    {
      a: addr.startVerse1,
      b: addr.startVerse1,
      exp: true
    },
    {
      a: addr.startVerse1,
      b: addr.startVerse2,
      exp: false
    },
  ]

  const comparosonMatrix2 = [
  //a.endCh == a.startCh
    //b.endCh == b.startCh
    //b.endCh == a.endCh
    //b.endCh != a.endCh
    //b.endCh = null
  //a.endCh != a.startCh
    //b.endCh == b.startCh
    //b.endCh == a.endCh
    //b.endCh != a.endCh
    //b.endCh = null
  //a.endCh = null
    //b.endCh == b.startCh
    //b.endCh == a.endCh
    //b.endCh != a.endCh
    //b.endCh = null
    {
      a: addr.endChapterStart,
      b: addr.endChapterStart,
      exp: true
    },
    {
      a: addr.endChapterStart,
      b: addr.endChapterDiff1,
      exp: false
    },
    {
      a: addr.endChapterStart,
      b: addr.endChapterDiff2,
      exp: false
    },
    {
      a: addr.endChapterStart,
      b: addr.endChapterNull,
      exp: true
    },

    {
      a: addr.endChapterDiff1,
      b: addr.endChapterStart,
      exp: false
    },
    {
      a: addr.endChapterDiff1,
      b: addr.endChapterDiff1,
      exp: true
    },
    {
      a: addr.endChapterDiff1,
      b: addr.endChapterDiff2,
      exp: false
    },
    {
      a: addr.endChapterDiff1,
      b: addr.endChapterNull,
      exp: false
    },
    
    {
      a: addr.endChapterNull,
      b: addr.endChapterStart,
      exp: true
    },
    {
      a: addr.endChapterNull,
      b: addr.endChapterDiff1,
      exp: false
    },
    {
      a: addr.endChapterNull,
      b: addr.endChapterDiff2,
      exp: false
    },
    {
      a: addr.endChapterNull,
      b: addr.endChapterNull,
      exp: true
    }
  ]

  const comparosonMatrix3 = [
    //a.endVerse == a.startVerse
      //b.endVerse == b.startVerse
      //b.endVerse == a.endVerse
      //b.endVerse != a.endVerse
      //b.endVerse = null
    //a.endVerse != a.startVerse
      //b.endVerse == b.startVerse
      //b.endVerse == a.endVerse
      //b.endVerse != a.endVerse
      //b.endVerse = null
    //a.endVerse = null
      //b.endVerse == b.startVerse
      //b.endVerse == a.endVerse
      //b.endVerse != a.endVerse
      //b.endVerse = null
    {
      a: addr.endVerseStart,
      b: addr.endVerseStart,
      exp: true
    },
    {
      a: addr.endVerseStart,
      b: addr.endVerseDiff1,
      exp: false
    },
    {
      a: addr.endVerseStart,
      b: addr.endVerseDiff2,
      exp: false
    },
    {
      a: addr.endVerseStart,
      b: addr.endVerseNull,
      exp: true
    },

    {
      a: addr.endVerseDiff1,
      b: addr.endVerseStart,
      exp: false
    },
    {
      a: addr.endVerseDiff1,
      b: addr.endVerseDiff1,
      exp: true
    },
    {
      a: addr.endVerseDiff1,
      b: addr.endVerseDiff2,
      exp: false
    },
    {
      a: addr.endVerseDiff1,
      b: addr.endVerseNull,
      exp: false
    },

    {
      a: addr.endVerseNull,
      b: addr.endVerseStart,
      exp: true
    },
    {
      a: addr.endVerseNull,
      b: addr.endVerseDiff1,
      exp: false
    },
    {
      a: addr.endVerseNull,
      b: addr.endVerseDiff2,
      exp: false
    },
    {
      a: addr.endVerseNull,
      b: addr.endVerseNull,
      exp: true
    },
  ]
  const cm = [...comparisonMatrix1, ...comparosonMatrix2, ...comparosonMatrix3]
  const counter = cm.filter( i => getAddressDifference(i.a, i.b) !== i.exp)
  // console.log(`${cm.length - counter.length}/${cm.length} tests passed`)
  if(counter.length){
    counter.map(i => {
      // console.log(JSON.stringify(i))
    })
  }
}

// testAddressDifferece()