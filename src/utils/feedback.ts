import { Vibration } from "react-native";
import { VIBRATION_PATTERNS } from "../constants";

// The one place that decides whether the phone is allowed to buzz.
//
// Before this, eleven call sites across five level screens each wrote
// `if (state.settings.hapticsEnabled) { Vibration.vibrate(PATTERN) }` by hand,
// and two of them (the passages list's long-press, the address picker's verse
// long-press) simply forgot the check - so a user who had turned haptics off
// still got buzzed by two controls. A setting that only holds where somebody
// remembered to read it is not a setting.
//
// Takes the settings rather than reading app state itself: the util stays pure
// and unit-testable, and components keep passing what they already hold.

export type VibrationPatternName = keyof typeof VIBRATION_PATTERNS;

/**
 * Only what feedback needs. Structural on purpose, so `state.settings` of any
 * state version satisfies it without importing a versioned model.
 */
export interface FeedbackSettingsModel {
  hapticsEnabled: boolean;
  soundsEnabled: boolean;
}

/**
 * Play the feedback for `name`, if the user allows it.
 *
 * Sound is not wired yet - `soundsEnabled` exists in settings and in every
 * converter, but no player does. When one arrives it goes HERE, behind the same
 * one call, and no component changes.
 */
export const feedback: (
  settings: FeedbackSettingsModel,
  name: VibrationPatternName
) => void = (settings, name) => {
  if (settings.hapticsEnabled) {
    Vibration.vibrate(VIBRATION_PATTERNS[name]);
  }
};
