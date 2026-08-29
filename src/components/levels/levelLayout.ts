import { StyleSheet } from "react-native";

/**
 * 8.2.35 — the one arrangement every level fills.
 *
 * The five level screens each solved the same layout privately and disagreed
 * about all of it: level 2 sat its verse box in the top third and its SUBMIT at
 * ~75% of the height with a third of the screen empty between them, level 5 put
 * address, input and CHECK TEXT inside the top 45% with the bottom half empty,
 * the action button was centred on one and left-aligned on the other, and the
 * verse box was as tall as a third of the screen whether it held one line or
 * ten.
 *
 * Three blocks, top to bottom, and every level fills all three:
 *
 * · **prompt** — what the test gives you: the verse, or the address. It is as
 *   tall as its content and no taller (`flexShrink`, never `flex: 1`), so one
 *   short line is one short line, and it scrolls when the passage is long.
 * · **answer** — what the test asks of you: the options, the picker, the input.
 *   It takes everything the prompt did not, which is what keeps the empty band
 *   out of the middle of the screen.
 * · **action** — what finishes the test: SUBMIT, CONTINUE, the downgrade. It is
 *   pinned to the bottom, stretched to the column, identical on all five - the
 *   button is in the same place on every level, so it can be pressed without
 *   being looked for.
 *
 * This is a stylesheet and not a wrapper component on purpose: the 8.2.6 split
 * made the level files small enough to each hold their own arrangement, and a
 * wrapper would have to take the three blocks as props (or children in a fixed
 * order) to do the same job.
 */

// The column's side margin. One number, so a verse card, an option chip and the
// submit button all start at the same left edge - the level-3 chips used to
// start flush against the screen instead.
const GUTTER = 20;

export const levelLayout = StyleSheet.create({
  // the whole level, under the session header
  screen: {
    width: "100%",
    flex: 1
  },
  // prompt: content-sized, scrolls when the passage is longer than the room
  prompt: {
    width: "100%",
    flexGrow: 0,
    flexShrink: 1
  },
  promptContent: {
    paddingHorizontal: GUTTER,
    paddingVertical: 10
  },
  // the verse, on its own surface (background comes from the theme)
  promptCard: {
    borderRadius: 10,
    padding: 10
  },
  verseText: {
    fontSize: 18,
    letterSpacing: 0.5
  },
  addressText: {
    fontSize: 22,
    textTransform: "uppercase",
    fontWeight: "500",
    textAlign: "center"
  },
  // answer: everything the prompt did not take
  answer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: GUTTER,
    justifyContent: "center",
    gap: 10
  },
  // ...when the answer is a wrapping field of chips, which scrolls on its own
  answerScroll: {
    flex: 1,
    width: "100%"
  },
  answerScrollContent: {
    paddingHorizontal: GUTTER,
    paddingVertical: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  // action: the bottom of every level, same place, same width
  action: {
    width: "100%",
    paddingHorizontal: GUTTER,
    paddingTop: 10,
    paddingBottom: GUTTER,
    gap: 10
  }
});
