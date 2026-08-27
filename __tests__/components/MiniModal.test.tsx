import { Text, View } from "react-native";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { ANIMATION, LANGCODE, THEMETYPE } from "../../src/constants";
import { createT } from "../../src/l10n";
import { MiniModal } from "../../src/components/MiniModal";
import { Button } from "../../src/components/Button";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing mini modal", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const t = createT(LANGCODE.ua);
    const tree = renderWithContext(
      <MiniModal shown={true} handleClose={() => {}}>
        <Text style={theme.theme.headerText}>{t("fetchPropositionText")}</Text>
        <View
          style={{
            ...theme.theme.rowView,
            ...theme.theme.marginVertical,
            ...theme.theme.gap20
          }}
        >
          <Button onPress={() => {}} type="secondary" title={t("Cancel")} />
          <Button
            onPress={() => {}}
            type="main"
            color="green"
            title={t("Fetch")}
          />
        </View>
      </MiniModal>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  // 8.2.1 canary. This asserts the reanimated TOOLCHAIN, not the library: if
  // babel-preset-expo ever stops applying react-native-worklets/plugin, the
  // useAnimatedStyle callback is never turned into a worklet, no style is
  // produced, and every dialog in the app ships stuck at opacity 0. That failure
  // is silent at build time - historically the flakiest thing in this repo
  // (STRATEGY 6) - so it gets a test that fails loudly instead.
  // What jest CANNOT show here: the animation actually progressing. jest-expo's
  // mock never advances frames (advanceAnimationByTime is a no-op), so the
  // 0 -> 1 travel is verified on a device by the build this step ends with.
  it("computes the entrance frame from ANIMATION through a real worklet", () => {
    const screen = renderWithContext(
      <MiniModal shown={true} handleClose={() => {}}>
        <Text>content</Text>
      </MiniModal>
    );
    const animated = screen.UNSAFE_getAllByType(View).filter(
      (node) => node.props.jestAnimatedStyle !== undefined
    );
    // backdrop + card
    expect(animated).toHaveLength(2);
    const [backdrop, card] = animated;
    expect(backdrop.props.jestAnimatedStyle.value).toEqual({ opacity: 0 });
    expect(card.props.jestAnimatedStyle.value).toEqual({
      opacity: 0,
      transform: [
        { translateY: ANIMATION.riseDistance },
        { scale: ANIMATION.riseScale }
      ]
    });
  });
});
