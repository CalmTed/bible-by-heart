/**
 * One arrangement for all five levels. The five level screens each solved the
 * same layout privately: the verse box was a third of the screen tall whether
 * it held one line or ten, level 2 sat its SUBMIT at ~75% of the height with an
 * empty band above it, level 5 fitted everything into the top 45%, and the
 * action button was centred on one level and left-aligned on the next.
 *
 * What jest can hold is the arrangement itself: every level is the same three
 * blocks, out of the same stylesheet, in the same order. Whether it *feels*
 * right is device work — the snapshots next door carry the shape.
 */
import { renderWithContext } from "../../../test-utils/renderWithContext";
import { PASSAGELEVEL, TESTLEVEL } from "../../../src/constants";
import { L10 } from "../../../src/components/levels/L10";
import { L11 } from "../../../src/components/levels/L11";
import { L20 } from "../../../src/components/levels/L20";
import { L21 } from "../../../src/components/levels/L21";
import { L30 } from "../../../src/components/levels/L30";
import { L40 } from "../../../src/components/levels/L40";
import { L50 } from "../../../src/components/levels/L50";
import { levelLayout } from "../../../src/components/levels/levelLayout";
import { createTest } from "../../../src/initials";
import { generateATest } from "../../../src/utils/generateTests";
import { LevelComponentModel } from "../../../src/models";
import {
  LEVEL_PASSAGE_ID,
  makeLevelState
} from "../../fixtures/levelPassages";
import { FC } from "react";

const LEVELS: [string, FC<LevelComponentModel>, TESTLEVEL][] = [
  ["L10", L10, TESTLEVEL.l10],
  ["L11", L11, TESTLEVEL.l11],
  ["L20", L20, TESTLEVEL.l20],
  ["L21", L21, TESTLEVEL.l21],
  ["L30", L30, TESTLEVEL.l30],
  ["L40", L40, TESTLEVEL.l40],
  ["L50", L50, TESTLEVEL.l50]
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RenderedNode = any;

const stylesIn = (node: RenderedNode): object[] => {
  if (!node || typeof node !== "object") {
    return [];
  }
  const own = node.props?.style ? [node.props.style] : [];
  const children: RenderedNode[] = node.children || [];
  return [...own, ...children.map(stylesIn).flat()];
};

const renderLevel = (Level: FC<LevelComponentModel>, testLevel: TESTLEVEL) => {
  const state = makeLevelState(4);
  const test = generateATest(
    { ...createTest(1, LEVEL_PASSAGE_ID, PASSAGELEVEL.l3), l: testLevel },
    state.passages,
    undefined,
    []
  );
  return renderWithContext(
    <Level
      test={{ ...test, l: testLevel }}
      state={state}
      submitTest={() => {}}
      dispatch={() => {}}
    />
  ).toJSON() as RenderedNode;
};

describe("the shared level arrangement", () => {
  LEVELS.forEach(([name, Level, testLevel]) => {
    it(`${name} is the shared three blocks, not its own layout`, () => {
      const tree = renderLevel(Level, testLevel);
      // the level fills the column it is given...
      expect(tree.props.style).toEqual(levelLayout.screen);
      // ...and the middle block is the one that grows, so no empty band is left
      // between what the test gives and what it asks
      const styles = stylesIn(tree);
      expect(
        styles.some(
          (style) =>
            style === levelLayout.answer || style === levelLayout.answerScroll
        )
      ).toBe(true);
    });
  });

  it("never lets the prompt take a fixed share of the screen", () => {
    // the level-3 symptom: one short line occupying a quarter of the height,
    // because the verse box was `flex: 1` next to a `flex: 2` answer area
    expect(levelLayout.prompt).toEqual(
      expect.objectContaining({ flexGrow: 0, flexShrink: 1 })
    );
    expect(levelLayout.prompt).not.toHaveProperty("flex");
    expect(levelLayout.prompt).not.toHaveProperty("height");
  });

  it("gives the chips the same left edge as everything else", () => {
    // the level-3 option chip used to start flush against the screen
    expect(levelLayout.answerScrollContent.paddingHorizontal).toBe(
      levelLayout.action.paddingHorizontal
    );
    expect(levelLayout.answer.paddingHorizontal).toBe(
      levelLayout.action.paddingHorizontal
    );
  });
});
