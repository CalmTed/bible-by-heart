import { getNumberOfVerses } from "../../src/utils/getNumberOfVerses";

describe("get number of verses in address", () => {
  it("parsing data", () => {
    const versesNumber = getNumberOfVerses({
      bookIndex: 0,
      startChapterNum: 0,
      endChapterNum: 1,
      startVerseNum: 1,
      endVerseNum: 2
    });
    expect(versesNumber).toBe(33);
  });
});
