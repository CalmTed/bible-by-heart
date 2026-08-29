/**
 * 8.2.35 — the session dot sat off-centre in the test header. The Pressable
 * between the wrapper and the gradient had no size of its own, so the gradient's
 * `height: "100%"` resolved against a view sized by its 13px child: a 13px dot
 * in the top-left corner of an 18px wrapper, and a CURRENT dot — which has no
 * child at all — sized to nothing.
 */
import { render } from "@testing-library/react-native";
import { AppContext } from "../../src/context/AppContext";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { TestNavDot } from "../../src/components/TestNavDot";
import { LANGCODE, THEMETYPE } from "../../src/constants";
import { createAppState } from "../../src/initials";
import { createT } from "../../src/l10n";

const renderDot = (isCurrent: boolean) =>
  render(
    <AppContext.Provider
      value={{
        state: createAppState(),
        setState: () => {},
        dispatch: () => {},
        t: createT(LANGCODE.en),
        theme: getThemeFromScheme(THEMETYPE.dark)
      }}
    >
      <TestNavDot isCurrent={isCurrent} color="green" />
    </AppContext.Provider>
  );

describe("TestNavDot (8.2.35)", () => {
  [true, false].forEach((isCurrent) => {
    it(`is one centred 18px circle when isCurrent is ${isCurrent}`, () => {
      // the Pressable is the outermost node of the dot - it renders as a host
      // view, so the tree's root is what has to carry the size
      const dot = renderDot(isCurrent).toJSON();
      const style = Array.isArray(dot?.props.style)
        ? Object.assign({}, ...dot.props.style)
        : dot?.props.style;

      // the pressable IS the dot: it carries the size, and it centres what it
      // draws inside itself
      expect(style.width).toBe(18);
      expect(style.aspectRatio).toBe(1);
      expect(style.alignItems).toBe("center");
      expect(style.justifyContent).toBe("center");
    });
  });
});
