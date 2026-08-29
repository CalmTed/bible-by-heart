import { renderWithContext } from "../../../test-utils/renderWithContext";
import { PASSAGELEVEL } from "../../../src/constants";
import { L20 } from "../../../src/components/levels/L20";
import { createTest } from "../../../src/initials";
import {
  LEVEL_PASSAGE_ID,
  makeLevelState
} from "../../fixtures/levelPassages";

describe("testing level 20 rendering", () => {
  it("L20 renders correctly", async () => {
    const testState = makeLevelState(1);
    const test = createTest(123123, LEVEL_PASSAGE_ID, PASSAGELEVEL.l2);
    const tree = renderWithContext(
      <L20
        test={test}
        state={testState}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
