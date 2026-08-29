import { AppState as RNAppState, AppStateStatus } from "react-native";
import { act, render } from "@testing-library/react-native";

import { AppProvider, useAppContext } from "../../src/context/AppContext";
import { createAppState } from "../../src/initials";
import {
  SORTINGOPTION,
  STATE_PERSIST_DEBOUNCE,
  STORAGE_NAME
} from "../../src/constants";
import { ActionModel, ActionName } from "../../src/models";
import storage from "../../src/storage";

jest.mock("../../src/storage", () => ({
  __esModule: true,
  default: { save: jest.fn(() => Promise.resolve()) }
}));

// The provider only needs navigationRef to exist; importing the real navigator
// would pull every screen into this suite.
jest.mock("../../src/navigator", () => ({
  navigationRef: { isReady: () => false, navigate: jest.fn() }
}));

const save = storage.save as jest.Mock;

// 8.2.20 — the state persist is coalesced instead of running on every action.
// What has to stay true: one write per window however many actions land in it,
// and nothing pending when the app stops being the foreground app.
describe("AppProvider state persist (8.2.20)", () => {
  type AppStateHandler = (status: AppStateStatus) => void;
  let appStateHandlers: AppStateHandler[] = [];
  const dispatchRef: { current: ((a: ActionModel) => void) | null } = {
    current: null
  };

  const Probe = () => {
    dispatchRef.current = useAppContext().dispatch;
    return null;
  };

  // lastBackup is "now" so the once-a-day backup path stays out of these counts.
  const renderProvider = () =>
    render(
      <AppProvider
        initialState={{ ...createAppState(), lastBackup: new Date().getTime() }}
      >
        <Probe />
      </AppProvider>
    );

  const stateWrites = () =>
    save.mock.calls.filter((c) => c[0]?.key === STORAGE_NAME).length;

  beforeEach(() => {
    jest.useFakeTimers();
    save.mockClear();
    appStateHandlers = [];
    jest
      .spyOn(RNAppState, "addEventListener")
      .mockImplementation((_type, handler) => {
        appStateHandlers.push(handler as AppStateHandler);
        return { remove: jest.fn() } as unknown as ReturnType<
          typeof RNAppState.addEventListener
        >;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("writes nothing until the window closes, then writes once", () => {
    renderProvider();
    expect(stateWrites()).toBe(0);
    act(() => {
      jest.advanceTimersByTime(STATE_PERSIST_DEBOUNCE);
    });
    expect(stateWrites()).toBe(1);
  });

  it("coalesces several actions in one window into a single write", () => {
    renderProvider();
    act(() => {
      dispatchRef.current?.({
        name: ActionName.setSorting,
        payload: SORTINGOPTION.address
      });
      dispatchRef.current?.({
        name: ActionName.setSorting,
        payload: SORTINGOPTION.maxLevel
      });
      dispatchRef.current?.({
        name: ActionName.setSorting,
        payload: SORTINGOPTION.selectedLevel
      });
    });
    expect(stateWrites()).toBe(0);
    act(() => {
      jest.advanceTimersByTime(STATE_PERSIST_DEBOUNCE);
    });
    expect(stateWrites()).toBe(1);
    // and the write carries the LAST state, not the first
    const written = save.mock.calls.filter((c) => c[0]?.key === STORAGE_NAME)[0];
    expect(written[0].data.sort).toBe(SORTINGOPTION.selectedLevel);
  });

  it("flushes the pending state when the app leaves the foreground", () => {
    renderProvider();
    act(() => {
      dispatchRef.current?.({
        name: ActionName.setSorting,
        payload: SORTINGOPTION.address
      });
    });
    expect(stateWrites()).toBe(0);
    expect(appStateHandlers.length).toBeGreaterThan(0);
    act(() => {
      appStateHandlers.forEach((h) => h("background"));
    });
    const written = save.mock.calls.filter((c) => c[0]?.key === STORAGE_NAME);
    expect(written.length).toBe(1);
    expect(written[0][0].data.sort).toBe(SORTINGOPTION.address);
    // the flush consumed the pending state, so the timer has nothing left to do
    act(() => {
      jest.advanceTimersByTime(STATE_PERSIST_DEBOUNCE * 2);
    });
    expect(stateWrites()).toBe(1);
  });

  it("flushes the pending state on unmount", () => {
    const { unmount } = renderProvider();
    expect(stateWrites()).toBe(0);
    act(() => {
      unmount();
    });
    expect(stateWrites()).toBe(1);
  });
});
