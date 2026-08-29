import * as SecureStore from "expo-secure-store";
import { fetchAPI } from "../../src/services/fetch";
import { API_LINK, LANGCODE, SCREEN } from "../../src/constants";
import { createAppState } from "../../src/initials";
import { AppStateModel, RootStackNavigationModel } from "../../src/models";

// An already-expired JWT: the logout path needs BOTH the access and the refresh
// token to be past their `exp`, which is what makes fetchAPI give up and reset.
const expiredToken = () => {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 })
  ).toString("base64");
  return `header.${payload}.signature`;
};

jest.mock("expo-secure-store", () => ({
  getItem: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(async () => undefined),
  setItemAsync: jest.fn(async () => undefined)
}));

/**
 * 8.2.24 - the class of bug behind "picking a language undoes itself".
 *
 * fetchAPI is awaited. Anything it captured before the await is a snapshot of a
 * state that has since moved on, so writing that snapshot back rolls the whole
 * app one step backwards. It used to be handed `logoutMethods.state` and to
 * `setState(reduce(thatSnapshot, resetUserData))`; the language the user picked
 * WHILE the request was in flight went with it.
 */
describe("fetchAPI logging out (8.2.24)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItem as jest.Mock).mockReturnValue(expiredToken());
  });

  const logoutOnce = async () => {
    const setState = jest.fn();
    await fetchAPI({
      link: API_LINK.logout,
      method: "POST",
      headers: { Authorization: `Bearer ${expiredToken()}` },
      logoutMethods: {
        setState,
        navigation: {
          dispatch: () => {},
          navigate: () => {}
        } as unknown as RootStackNavigationModel,
        screen: SCREEN.settings
      }
    });
    return setState;
  };

  it("writes through an updater, never a captured snapshot", async () => {
    const setState = await logoutOnce();

    expect(setState).toHaveBeenCalled();
    setState.mock.calls.forEach(([arg]) => {
      expect(typeof arg).toBe("function");
    });
  });

  it("keeps a change made while the request was in flight", async () => {
    const setState = await logoutOnce();
    const updater = setState.mock.calls[0][0] as (
      s: AppStateModel
    ) => AppStateModel;

    // the state as it is NOW: the user picked a language during the request
    const moved: AppStateModel = {
      ...createAppState(),
      settings: { ...createAppState().settings, langCode: LANGCODE.ua }
    };

    const next = updater(moved);
    expect(next.settings.langCode).toBe(LANGCODE.ua);
    // and the logout itself still happened
    expect(next.userData.uuid).toBeNull();
  });
});
