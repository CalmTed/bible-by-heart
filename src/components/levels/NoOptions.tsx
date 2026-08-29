import React, { FC } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../../context/AppContext";

/**
 * What a level renders when its generator handed it no options.
 *
 * A test whose `l` disagreed with the payload in its `d` used to draw the
 * question and then nothing at all - a level-1 test showed an address with an
 * empty half-screen under it, which reads as the app having frozen rather than
 * as anything having gone wrong. The state is a bug either way, but a bug the
 * user can SEE is one they can leave: the session's nav dots and the exit cross
 * are both still on screen above this.
 *
 * Deliberately no skip button. A test that offers too few options is already
 * substituted for at generation time, and a "passed" test nobody answered is
 * exactly the quiet corruption that rule exists to prevent.
 */
export const NoOptions: FC = () => {
  const { theme, t } = useAppContext();
  return (
    <View style={noOptionsStyle.wrapper}>
      <Text style={{ ...theme.theme.text, ...noOptionsStyle.text }}>
        {t("TestNoOptionsText")}
      </Text>
    </View>
  );
};

const noOptionsStyle = StyleSheet.create({
  // No flex of its own: it is rendered INSIDE the level's option area, which
  // already owns the space the options would have taken.
  wrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20
  },
  text: {
    textAlign: "center"
  }
});
