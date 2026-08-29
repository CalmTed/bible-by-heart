import { renderWithContext } from "../../../test-utils/renderWithContext";
import { PASSAGELEVEL } from "../../../src/constants";
import { L40 } from "../../../src/components/levels/L40";
import { createTest } from "../../../src/initials";
import {
  LEVEL_PASSAGE_ID,
  makeLevelState
} from "../../fixtures/levelPassages";

describe("testing level 40 rendering", () => {
  it("L40 renders correctly", async () => {
    const testState = makeLevelState(1);
    const test = createTest(123123, LEVEL_PASSAGE_ID, PASSAGELEVEL.l4);
    const tree = renderWithContext(
      <L40
        test={test}
        state={testState}
        submitTest={() => {}}
        dispatch={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
