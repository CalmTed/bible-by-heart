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
