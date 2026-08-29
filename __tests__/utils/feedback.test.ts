import { Vibration } from "react-native";
import { VIBRATION_PATTERNS } from "../../src/constants";
import { feedback } from "../../src/utils/feedback";

// 8.2.8 - the setting now holds in ONE place, so this is where it is proven.
// Two call sites (the passages list's long press, the address picker's verse
// long press) used to buzz regardless of what the user had chosen.

const settings = (hapticsEnabled: boolean) => ({
  hapticsEnabled,
  soundsEnabled: true
});

describe("feedback", () => {
  const vibrate = jest.spyOn(Vibration, "vibrate").mockImplementation(() => {});

  beforeEach(() => vibrate.mockClear());

  it("buzzes with the named pattern when haptics are on", () => {
    feedback(settings(true), "testRight");
    expect(vibrate).toHaveBeenCalledWith(VIBRATION_PATTERNS.testRight);
  });

  it("stays silent when haptics are off", () => {
    feedback(settings(false), "testRight");
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("respects the setting for every pattern the app has", () => {
    const names = Object.keys(VIBRATION_PATTERNS) as (keyof typeof VIBRATION_PATTERNS)[];
    names.forEach((name) => {
      vibrate.mockClear();
      feedback(settings(false), name);
      expect(vibrate).not.toHaveBeenCalled();
      feedback(settings(true), name);
      expect(vibrate).toHaveBeenCalledTimes(1);
      expect(vibrate).toHaveBeenCalledWith(VIBRATION_PATTERNS[name]);
    });
  });
});
