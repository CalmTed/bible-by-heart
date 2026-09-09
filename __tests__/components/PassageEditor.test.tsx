/**
 * When the editor is allowed to reach for text, and when it must not.
 *
 * The rule is about what the user can lose. An empty field costs nothing to
 * fill, so picking an address or a translation fills it. A field with text in it
 * is the user's, so nothing replaces it without being asked — and it used to be
 * asked on every change of either, i.e. while somebody was in the middle of
 * typing, where one wrong tap wipes what they wrote.
 */
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { renderWithContext } from "../../test-utils/renderWithContext";
import { PassageEditor } from "../../src/components/PassageEditor";
import { createAddress, createAppState, createPassage } from "../../src/initials";
import { createT } from "../../src/l10n";
import { LANGCODE } from "../../src/constants";
import { AppStateModel, PassageModel } from "../../src/models";
import { fetchPassageText } from "../../src/services/fetchPassageText";

jest.mock("../../src/services/fetchPassageText", () => ({
  fetchPassageText: jest.fn(() => Promise.resolve("fetched verse text")),
  // the live catalogue answers with exactly what the app ships, so the editor's
  // idea of what is fetchable does not change halfway through a test
  fetchTranslationCatalogue: jest.fn(() =>
    Promise.resolve(
      jest.requireActual("../../src/constants").BUNDLED_TRANSLATION_SOURCES
    )
  )
}));

const fetchText = fetchPassageText as jest.Mock;
const t = createT(LANGCODE.en);

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

const GENESIS_1_1 = {
  ...createAddress(),
  bookIndex: 0,
  startChapterNum: 0,
  startVerseNum: 0,
  endChapterNum: 0,
  endVerseNum: 0
};

const state: AppStateModel = createAppState();
// The two the user is offered first, which is also the pair a translation change
// runs between.
const [firstTranslation, secondTranslation] = state.settings.translations;

const makePassage = (verseText: string): PassageModel => ({
  ...createPassage(GENESIS_1_1, verseText),
  verseTranslation: firstTranslation.id
});

const renderEditor = (verseText: string) =>
  renderWithContext(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <PassageEditor
        passage={makePassage(verseText)}
        state={state}
        onConfirm={() => {}}
        onRemove={() => {}}
        onBack={() => {}}
      />
    </SafeAreaProvider>
  );

// The Select is a label that opens a modal listing every option by name.
const chooseTranslation = (
  screen: ReturnType<typeof renderWithContext>,
  name: string
) => {
  fireEvent.press(screen.getAllByText(firstTranslation.name)[0]);
  fireEvent.press(screen.getAllByText(name).slice(-1)[0]);
};

beforeEach(() => {
  fetchText.mockClear();
});

describe("PassageEditor fetching over text the user already has", () => {
  it("does not ask, and does not fetch, when the translation changes under text", () => {
    const screen = renderEditor("In the beginning God created the heaven");

    chooseTranslation(screen, secondTranslation.name);

    expect(screen.queryByText(t("fetchOverwriteText"))).toBeNull();
    expect(fetchText).not.toHaveBeenCalled();
  });

  // An editor opened on an empty field reaches for the text once by itself, so
  // both of these let that first attempt FAIL: the field is then still empty,
  // which is the state the assertion is actually about, and the call being
  // counted can only be the one the test caused.
  it("fills an empty field on its own when the translation changes", async () => {
    fetchText.mockRejectedValueOnce(new Error("offline"));
    const screen = renderEditor("");
    // The editor reaches for the text itself the moment it opens on an empty
    // field, and the button is dead while a fetch is out - so let that first
    // attempt settle before pressing anything.
    await act(async () => {});
    expect(fetchText).toHaveBeenCalledTimes(1);

    chooseTranslation(screen, secondTranslation.name);

    await waitFor(() => expect(fetchText).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(t("fetchOverwriteText"))).toBeNull();
  });

  it("asks before the fetch button replaces text that is there", async () => {
    const screen = renderEditor("In the beginning God created the heaven");

    fireEvent.press(screen.getByText(t("Fetch")));

    expect(screen.getByText(t("fetchOverwriteText"))).toBeTruthy();
    expect(fetchText).not.toHaveBeenCalled();

    fireEvent.press(screen.getAllByText(t("Fetch")).slice(-1)[0]);
    await waitFor(() => expect(fetchText).toHaveBeenCalledTimes(1));
  });

  it("leaves the text alone when the question is declined", () => {
    const screen = renderEditor("In the beginning God created the heaven");

    fireEvent.press(screen.getByText(t("Fetch")));
    fireEvent.press(screen.getByText(t("Cancel")));

    expect(fetchText).not.toHaveBeenCalled();
  });

  it("asks nothing when the field the button fills is empty", async () => {
    fetchText.mockRejectedValueOnce(new Error("offline"));
    const screen = renderEditor("");
    // The editor reaches for the text itself the moment it opens on an empty
    // field, and the button is dead while a fetch is out - so let that first
    // attempt settle before pressing anything.
    await act(async () => {});
    expect(fetchText).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText(t("Fetch")));

    expect(screen.queryByText(t("fetchOverwriteText"))).toBeNull();
    await waitFor(() => expect(fetchText).toHaveBeenCalledTimes(2));
  });
});
