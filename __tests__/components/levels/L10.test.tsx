import { renderWithContext } from "../../../test-utils/renderWithContext";
import { LANGCODE, PASSAGELEVEL } from "../../../src/constants";
import { createT } from "../../../src/l10n";
import { L10 } from "../../../src/components/levels/L10";
import { createTest } from "../../../src/initials";
import {
  LEVEL_PASSAGE_ID,
  makeLevelState,
  makeStateWith
} from "../../fixtures/levelPassages";

describe("testing level 10 rendering", () => {
  it("L10 renders correctly", async () => {
    const testState = makeLevelState(4);
    const test = createTest(123123, LEVEL_PASSAGE_ID, PASSAGELEVEL.l1);
    const tree = renderWithContext(
      <L10
        test={test}
        state={testState}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});

describe("L10 with no passage to show (8.2.6)", () => {
  it("renders nothing rather than reading the missing passage's text", () => {
    const submitTest = jest.fn();
    // L10 read `.verseText` straight off the result of a `.find()` — a test
    // pointing at a deleted passage crashed it into the ErrorBoundary instead
    // of letting TestsScreen's focus-gated effect leave the session.
    const screen = renderWithContext(
      <L10
        test={createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l1)}
        state={makeStateWith([])}
        submitTest={submitTest}
        dispatch={() => {}}
      />
    );

    expect(screen.toJSON()).toBeTruthy();
    expect(submitTest).not.toHaveBeenCalled();
  });
});

describe("L10 with no options to offer (8.2.38)", () => {
  it("says the test cannot be built instead of drawing half a screen", () => {
    const t = createT(LANGCODE.en);
    const screen = renderWithContext(
      <L10
        // a bare test, exactly as it looks before a generator fills its `d`
        test={createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l1)}
        state={makeLevelState(4)}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    );

    expect(screen.getByText(t("TestNoOptionsText"))).toBeTruthy();
  });
});
