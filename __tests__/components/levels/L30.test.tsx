import {
  makeContextValue,
  renderWithContext
} from "../../../test-utils/renderWithContext";
import { AppContext } from "../../../src/context/AppContext";
import { PASSAGELEVEL } from "../../../src/constants";
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
 * 8.2.5 — L30 was the one level that answered a test from inside its render
 * body. Two things were wrong with it and both are pinned here.
 */
describe("Level 3 answering outside the render body (8.2.5)", () => {
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
