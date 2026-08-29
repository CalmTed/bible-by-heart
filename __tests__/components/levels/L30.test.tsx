import {
  makeContextValue,
  renderWithContext
} from "../../../test-utils/renderWithContext";
import { AppContext } from "../../../src/context/AppContext";
import { StyleSheet } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { PASSAGELEVEL, TESTLEVEL } from "../../../src/constants";
import { Passage } from "../../../src/utils/passage";
import { createL30Test } from "../../../src/utils/generateTests/createL30Test";
import { L30 } from "../../../src/components/levels/L30";
import { PassageModel } from "../../../src/models";
import { createTest } from "../../../src/initials";
import {
  LEVEL_PASSAGE_ID,
  makeLevelPassage,
  makeLevelState,
  makeStateWith
} from "../../fixtures/levelPassages";

describe("testing level 30 rendering", () => {
  it("L30 renders correctly", async () => {
    const testState = makeLevelState(1);
    const test = createTest(123123, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3);
    const tree = renderWithContext(
      <L30
        test={test}
        state={testState}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

/**
 * L30 was the one level that answered a test from inside its render body. Two
 * things were wrong with it and both are pinned here.
 */
describe("Level 3 answering outside the render body", () => {
  const passage = (): PassageModel => ({
    ...makeLevelPassage(),
    verseText: "All things work together for good."
  });

  it("never answers a test whose passage was deleted", () => {
    const submitTest = jest.fn();
    // every other level renders an empty View here and lets TestsScreen leave
    // the session; this one used to submit the test as CORRECT, mid-render
    const screen = renderWithContext(
      <L30
        test={createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3)}
        state={makeStateWith([])}
        submitTest={submitTest}
        dispatch={() => {}}
      />
    );

    expect(submitTest).not.toHaveBeenCalled();
    expect(screen.toJSON()).toBeTruthy();
  });

  it("passes an unplayable test once, from an effect rather than every render", () => {
    const submitTest = jest.fn();
    // no missingWords: nothing to fill in, so the user would sit on a screen
    // with no way forward. The valve opens - but exactly once. Submitting from
    // the render body fired it again on every single render.
    const test = createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3);
    const screen = renderWithContext(
      <L30
        test={test}
        state={makeStateWith([passage()])}
        submitTest={submitTest}
        dispatch={() => {}}
      />
    );
    expect(submitTest).toHaveBeenCalledTimes(1);
    expect(submitTest).toHaveBeenCalledWith({
      isRight: true,
      modifiedTest: test
    });

    // rerender replaces the WHOLE tree, so the provider has to come with it
    screen.rerender(
      <AppContext.Provider value={makeContextValue()}>
        <L30
          test={test}
          state={makeStateWith([passage()])}
          submitTest={submitTest}
          dispatch={() => {}}
        />
      </AppContext.Provider>
    );
    expect(submitTest).toHaveBeenCalledTimes(1);
  });

  it("leaves a playable test alone", () => {
    const submitTest = jest.fn();
    const test = createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3);
    renderWithContext(
      <L30
        test={{ ...test, d: { missingWords: [1, 3] } }}
        state={makeStateWith([passage()])}
        submitTest={submitTest}
        dispatch={() => {}}
      />
    );

    expect(submitTest).not.toHaveBeenCalled();
  });
});

/**
 * The test level 3 has never had: a missing word is not readable.
 *
 * L3's whole question is which words are gone, so a missing word rendered in a
 * readable colour is the answer printed above the options. Nothing asserted
 * this, which is why the report could only ever come from a screenshot.
 */
describe("Level 3 hiding the words it took out", () => {
  // The word's own Text node, found by the word itself. queryAllByText also
  // matches the option Button below the verse - the verse is rendered first, so
  // the first hit is the one in the passage.
  const verseWordStyle = (
    screen: ReturnType<typeof renderWithContext>,
    word: string
  ) => StyleSheet.flatten(screen.queryAllByText(word)[0]?.props.style);

  it("renders every missing word transparent, whatever the generator picked", () => {
    // Several shapes on purpose: the generator has four ways of choosing
    // (a sentence range, an isle of words, seeds from errors, similar words) and
    // which one runs depends on the sentence count and on Math.random.
    const texts = [
      "All things work together for good.",
      "One. Two. Three. Four. Five sentences here.",
      // Fedir's own two-token passage, which is the shape he screenshotted
      "Even one. Two three."
    ];
    texts.forEach((verseText) => {
      const target = { ...makeLevelPassage(), verseText };
      const words = Passage.getWords(verseText);
      for (let run = 0; run < 25; run++) {
        const test = createL30Test({
          initialTest: {
            ...createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3),
            l: TESTLEVEL.l30
          },
          passages: [target],
          history: []
        });
        const missingWords = test.d.missingWords ?? [];
        if (!missingWords.length) {
          continue; // the unplayable test - its own safety valve is tested above
        }
        const screen = renderWithContext(
          <L30
            test={test}
            state={makeStateWith([target])}
            submitTest={() => {}}
            dispatch={() => {}}
          />
        );
        missingWords.forEach((index) => {
          expect(verseWordStyle(screen, words[index])?.color).toBe(
            "transparent"
          );
        });
        // and the other side of it: nothing readable is a word being asked for
        words.forEach((word, index) => {
          if (!missingWords.includes(index)) {
            expect(verseWordStyle(screen, word)?.color).not.toBe("transparent");
          }
        });
        screen.unmount();
      }
    });
  });

  it("keeps hiding the word that is still to be filled after one is answered", () => {
    const target = {
      ...makeLevelPassage(),
      verseText: "All things work together for good."
    };
    const words = Passage.getWords(target.verseText);
    const screen = renderWithContext(
      <L30
        test={{
          ...createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3),
          d: { missingWords: [1, 3] }
        }}
        state={makeStateWith([target])}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    );

    expect(verseWordStyle(screen, words[1])?.color).toBe("transparent");
    expect(verseWordStyle(screen, words[3])?.color).toBe("transparent");

    // answering the first one reveals THAT word and nothing else
    fireEvent.press(screen.getAllByText(words[1])[1]);
    expect(verseWordStyle(screen, words[1])?.color).not.toBe("transparent");
    expect(verseWordStyle(screen, words[3])?.color).toBe("transparent");
  });

  // The two paths that reveal words on purpose, pinned so a future change has to
  // mean it: a test carried back with the words already done shows them, and a
  // finished test being reviewed through the nav dots shows all of it.
  it("reveals the words once the answer has moved on to the address", () => {
    const target = {
      ...makeLevelPassage(),
      verseText: "All things work together for good."
    };
    const words = Passage.getWords(target.verseText);
    const screen = renderWithContext(
      <L30
        test={{
          ...createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3),
          d: { missingWords: [1, 3] },
          et: ["wrongAddressToVerse"]
        }}
        state={makeStateWith([target])}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    );

    expect(verseWordStyle(screen, words[1])?.color).not.toBe("transparent");
    expect(verseWordStyle(screen, words[3])?.color).not.toBe("transparent");
  });

  it("reveals the words of a finished test being looked back at", () => {
    const target = {
      ...makeLevelPassage(),
      verseText: "All things work together for good."
    };
    const words = Passage.getWords(target.verseText);
    const screen = renderWithContext(
      <L30
        test={{
          ...createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3),
          d: { missingWords: [1, 3] },
          f: true
        }}
        state={makeStateWith([target])}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    );

    expect(verseWordStyle(screen, words[1])?.color).not.toBe("transparent");
  });
});

/**
 * The word bank answers by letters (Fedir's call on the repeated-word question:
 * don't hide every occurrence, accept every occurrence).
 */
describe("Level 3 accepting a word by its letters", () => {
  // "good." is the word at index 5; "good" appears at index 1 as well, so the
  // bank offers two chips whose letters are the same and only one of which is
  // the exact string the verse wants next.
  const target = {
    ...makeLevelPassage(),
    verseText: "Only good things are truly good."
  };
  const words = Passage.getWords(target.verseText);

  it("answers when the pressed word differs only in punctuation", () => {
    const screen = renderWithContext(
      <L30
        test={{
          ...createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3),
          d: { missingWords: [1, 5] }
        }}
        state={makeStateWith([target])}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    );

    // index 1 is "good", index 5 is "good." — the verse wants 1 first, and the
    // user reaches for the chip that says "good." Same word, so it lands.
    expect(words[1]).toBe("good");
    expect(words[5]).toBe("good.");
    const chip = screen.getAllByText(words[5]).slice(-1)[0];
    fireEvent.press(chip);

    expect(
      StyleSheet.flatten(screen.queryAllByText(words[1])[0]?.props.style).color
    ).not.toBe("transparent");
  });

  it("still refuses a word that is merely similar", () => {
    const submitTest = jest.fn();
    const near = {
      ...makeLevelPassage(),
      verseText: "God is good"
    };
    const nearWords = Passage.getWords(near.verseText);
    const screen = renderWithContext(
      <L30
        test={{
          ...createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3),
          d: { missingWords: [0, 2] }
        }}
        state={makeStateWith([near])}
        submitTest={submitTest}
        dispatch={() => {}}
      />
    );

    // "good" is not "God": pressing it puts the level into its error state,
    // which is the panel with a Continue button, not a revealed word.
    fireEvent.press(screen.getAllByText(nearWords[2]).slice(-1)[0]);
    expect(
      StyleSheet.flatten(screen.queryAllByText(nearWords[0])[0]?.props.style)
        .color
    ).toBe("transparent");
    expect(submitTest).not.toHaveBeenCalled();
  });
});
