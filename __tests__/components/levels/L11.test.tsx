import { renderWithContext } from "../../../test-utils/renderWithContext";
import { PASSAGELEVEL } from "../../../src/constants";
import { L11 } from "../../../src/components/levels/L11";
import { createTest } from "../../../src/initials";
import {
  LEVEL_PASSAGE_ID,
  makeLevelState
} from "../../fixtures/levelPassages";

describe("testing level 11 rendering", () => {
  it("L11 renders correctly", async () => {
    const testState = makeLevelState(4);
    const test = createTest(123123, LEVEL_PASSAGE_ID, PASSAGELEVEL.l1);
    const tree = renderWithContext(
      <L11
        test={test}
        state={testState}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
