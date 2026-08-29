import React, { FC } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../../context/AppContext";
import { Passage } from "../../utils/passage";
import { CONTEXT_SENTENCES } from "../../constants";

// The sentences on either side of the part the user is typing (L40, L50). Both
// levels drew this block inline and identically, down to the "..." rules —
// 8.2.6 made it one component over `Passage.getContext*`.

const sentenceContextStyle = StyleSheet.create({
  otherSentencesTextView: {
    marginHorizontal: 10,
    marginVertical: 5
  }
});

interface SentenceContextPropsModel {
  text: string;
  range?: number[];
  side: "before" | "after";
}

export const SentenceContext: FC<SentenceContextPropsModel> = ({
  text,
  range,
  side
}) => {
  const { theme } = useAppContext();
  const context =
    side === "before"
      ? Passage.getContextBefore(text, range, CONTEXT_SENTENCES)
      : Passage.getContextAfter(text, range, CONTEXT_SENTENCES);
  if (!context) {
    return null;
  }
  // The ellipsis always points AT the part being typed: the block before it
  // ends with one, the block after it starts with one. The other side only
  // gets one when there is more passage out there than is being shown.
  return (
    <View style={sentenceContextStyle.otherSentencesTextView}>
      <Text style={theme.theme.text}>
        {side === "before" ? (context.truncated ? "..." : "") : "..."}
        {context.text}
        {side === "before" ? "..." : context.truncated ? "..." : ""}
      </Text>
    </View>
  );
};
