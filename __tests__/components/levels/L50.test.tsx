import { fireEvent } from "@testing-library/react-native";
import type { ReactTestInstance } from "react-test-renderer";
import { renderWithContext } from "../../../test-utils/renderWithContext";
import { PASSAGELEVEL } from "../../../src/constants";
import { L50 } from "../../../src/components/levels/L50";
import { createTest } from "../../../src/initials";
import {
  LEVEL_PASSAGE_ID,
  makeLevelState
} from "../../fixtures/levelPassages";

describe("testing level 50 rendering", () => {
  it("L50 renders correctly", async () => {
    const testState = makeLevelState(1);
    const test = createTest(123123, LEVEL_PASSAGE_ID, PASSAGELEVEL.l5);
    const tree = renderWithContext(
      <L50
        test={test}
        state={testState}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

// A code point by number, so no invisible byte hides in this file.
const chr = (code: number) => String.fromCharCode(code);

// The characters a phone keyboard cannot make, inside a stored passage: a curly
// apostrophe and an em dash. Both are in the four bundled Ukrainian
// translations, both are what a share-sheet paste leaves behind, and neither can
// be typed - so before 8.2.7 this passage could not be answered at level 5 at
// all, no matter what the user did.
const UNTYPEABLE_TEXT = `God${chr(0x2019)}s word ${chr(0x2014)} it stands.`;
const TYPEABLE_ANSWER = "God's word - it stands.";

const makeL50Test = () => ({
  ...createTest(123123, LEVEL_PASSAGE_ID, PASSAGELEVEL.l5),
  d: { showAddressOrFirstWords: true }
});

const makeUntypeableState = () => {
  const state = makeLevelState(1);
  return {
    ...state,
    passages: [{ ...state.passages[0], verseText: UNTYPEABLE_TEXT }]
  };
};

// Level 5 accepts ONE character per change event (anything else is treated as
// autocomplete), so the answer is typed the way a user types it.
const typeAnswer = (input: ReactTestInstance, answer: string) => {
  answer.split("").forEach((char, i) => {
    fireEvent.changeText(input, answer.slice(0, i + 1));
  });
};

describe("L50 typing tolerance (8.2.7)", () => {
  it("accepts the answer a keyboard can actually produce", () => {
    const screen = renderWithContext(
      <L50
        test={makeL50Test()}
        state={makeUntypeableState()}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    );
    typeAnswer(screen.getByPlaceholderText("Write passage text"), TYPEABLE_ANSWER);
    fireEvent.press(screen.getByText(/Check text/));
    // the check button is replaced by the one that finishes the test
    expect(screen.queryByText(/Check text/)).toBeNull();
    expect(screen.getByText(/Submit/)).toBeTruthy();
  });

  it("still knows a wrong answer from a lookalike one", () => {
    const submitTest = jest.fn();
    const screen = renderWithContext(
      <L50
        test={makeL50Test()}
        state={makeUntypeableState()}
        submitTest={submitTest}
        dispatch={() => {}}
      />
    );
    typeAnswer(
      screen.getByPlaceholderText("Write passage text"),
      "God's word - it falls."
    );
    fireEvent.press(screen.getByText(/Check text/));
    // not accepted, and the attempt is handed back trimmed to what was right
    // (plus the one character that was not - that character is the hint)
    expect(screen.queryByText(/Check text/)).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Write passage text").props.value
    ).toBe(UNTYPEABLE_TEXT.slice(0, "God's word - it ".length + 1));
  });
});
