import { createAppState } from "../../src/initials";
import { checkSchedule } from "../../src/utils/notifications";

describe("basic notification features", () => {
  it("check schedule", async () => {
    const result = await checkSchedule(createAppState());
    expect(result).toBe(false);
  });
});
