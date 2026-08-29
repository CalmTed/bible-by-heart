/**
 * 8.2.2 — the anchored popup, the non-dialog surface the modal purge added.
 * What matters here is that it is placed relative to the control that opened it
 * and that a missed measurement degrades into a corner popup, never into one
 * drawn at NaN or off screen.
 */
import { View } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { Text } from "../../src/components/Text";
import {
  AnchoredPopup,
  PopupAnchorModel
} from "../../src/components/AnchoredPopup";
import { ANIMATION } from "../../src/constants";
import { renderWithContext } from "../../test-utils/renderWithContext";

const renderPopup = (
  anchor: PopupAnchorModel | null,
  handleClose: () => void = () => {}
) =>
  renderWithContext(
    <AnchoredPopup shown={true} anchor={anchor} handleClose={handleClose}>
      <Text>option</Text>
    </AnchoredPopup>
  );

// The card is the only animated view in the popup — unlike MiniModal there is
// no dimmed backdrop to fade, which is the whole visual difference.
const cardStyle = (screen: ReturnType<typeof renderPopup>) => {
  const [card] = screen
    .UNSAFE_getAllByType(View)
    .filter((node) => node.props.jestAnimatedStyle !== undefined);
  expect(card).toBeTruthy();
  return Object.assign({}, ...[card.props.style].flat(Infinity));
};

describe("AnchoredPopup", () => {
  it("renders correctly", () => {
    expect(renderPopup({ x: 300, y: 120 }).toJSON()).toMatchSnapshot();
  });

  // Same canary as MiniModal's: proves the worklet toolchain still turns the
  // useAnimatedStyle callback into a worklet. Without it the popup would ship
  // permanently stuck at opacity 0 with no build-time complaint.
  it("computes the entrance frame from ANIMATION through a real worklet", () => {
    const [card] = renderPopup({ x: 300, y: 120 })
      .UNSAFE_getAllByType(View)
      .filter((node) => node.props.jestAnimatedStyle !== undefined);
    expect(card.props.jestAnimatedStyle.value).toEqual({
      opacity: 0,
      transform: [
        { translateY: ANIMATION.riseDistance },
        { scale: ANIMATION.riseScale }
      ]
    });
  });

  it("hangs its right edge under the anchor it was given", () => {
    // jest's window is 750x1334
    const style = cardStyle(renderPopup({ x: 300, y: 120 }));
    // just below the anchor's bottom edge...
    expect(style.top).toBeGreaterThan(120);
    expect(style.top).toBeLessThan(140);
    // ...with its right edge lined up with the anchor's (750 - 300)
    expect(style.right).toBe(450);
    // and never taller than the room left under it
    expect(style.maxHeight).toBeGreaterThan(0);
    expect(style.top + style.maxHeight).toBeLessThanOrEqual(1334);
  });

  it("falls back to the top-right corner when the anchor was never measured", () => {
    const anchored = cardStyle(renderPopup({ x: 300, y: 400 }));
    const fallback = cardStyle(renderPopup(null));
    // an unmeasured anchor must still produce a real, on-screen position
    expect(Number.isFinite(fallback.top)).toBe(true);
    expect(Number.isFinite(fallback.right)).toBe(true);
    expect(fallback.top).toBeLessThan(anchored.top);
    expect(fallback.right).toBeLessThan(anchored.right);
  });

  it("closes when the area outside it is tapped", () => {
    const handleClose = jest.fn();
    const screen = renderPopup({ x: 300, y: 120 }, handleClose);
    // the backdrop: the first pressable host node in the popup
    fireEvent.press(screen.UNSAFE_getAllByProps({ accessible: true })[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
