import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useColorScheme } from "react-native";
import * as Notifications from "expo-notifications";

import { ActionModel, ActionName, AppStateModel } from "../models";
import { reduce } from "../utils/reduce";
import {
  ThemeAndColorsModel,
  getThemeFromScheme
} from "../utils/getThemeFromScheme";
import { WORD, createT } from "../l10n";
import {
  DAY,
  LANGCODE,
  SCREEN,
  STORAGE_BACKUP_NAME,
  STORAGE_NAME
} from "../constants";
import storage from "../storage";
import {
  checkSchedule,
  registerForPushNotificationsAsync
} from "../utils/notifications";
import { navigationRef } from "../navigator";
import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";

// The single global source of truth. AppState used to be threaded through
// react-navigation route params (every screen kept its own useState copy); now
// it lives here and navigation only carries small screen-specific params.
export interface AppContextModel {
  state: AppStateModel;
  setState: React.Dispatch<React.SetStateAction<AppStateModel>>;
  // Sanctioned mutation path: wraps the reducer, ignoring null (no-op) results.
  dispatch: (action: ActionModel) => void;
  t: (w: WORD) => string;
  theme: ThemeAndColorsModel;
}

// Exported so tests (and any narrowly-scoped provider) can supply a context
// value directly without mounting the full AppProvider and its side effects.
export const AppContext = createContext<AppContextModel | null>(null);

export const useAppContext: () => AppContextModel = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
};

interface AppProviderModel {
  initialState: AppStateModel;
  children?: React.ReactNode;
}

export const AppProvider: FC<AppProviderModel> = ({
  initialState,
  children
}) => {
  const [state, setState] = useState(initialState);

  // Stable identity: the reducer + setState are constant, so dispatch never
  // needs to change. A fresh dispatch each render used to break React.memo on
  // every child that received it (render lag P0 — STRATEGY §2/§8.1.2).
  const dispatch = useCallback((action: ActionModel) => {
    setState((prev) => {
      const next = reduce(prev, action);
      return next ? next : prev;
    });
  }, []);

  // Persist every state change + take a daily backup (moved here from useApp so
  // there is exactly one writer instead of one per mounted screen). Keyed on the
  // `state` reference — the reducer returns a new object only on a real change,
  // so this fires exactly when it should WITHOUT the per-render
  // `JSON.stringify(state)` that ran on every render regardless (O(history) —
  // a primary render-lag suspect, STRATEGY §8.1.1).
  useEffect(() => {
    storage
      .save({
        key: STORAGE_NAME,
        data: { ...state }
      })
      .catch((e) => {
        logger.error(`Error on saving state in AppProvider e:${e}`);
        toastShow(e, 10000);
      });

    if ((state?.lastBackup || 0) < new Date().getTime() - DAY) {
      // Deep clone only on the once-a-day backup path, not on every save.
      const safeObject = JSON.parse(JSON.stringify(state)) as AppStateModel;
      // This is the ROLLING slot - always current-version, overwritten daily.
      // The pre-conversion snapshot lives in its own write-once key
      // (STORAGE_PRECONVERT_BACKUP_NAME, written by the boot path in App.tsx),
      // so this write can no longer bury the last known-good pre-upgrade state
      // 24h after an upgrade (8.1.8).
      storage
        .save({
          key: STORAGE_BACKUP_NAME,
          data: safeObject
        })
        .then(() => {
          setState((prev) => ({
            ...prev,
            lastBackup: new Date().getTime()
          }));
        })
        .catch((e) => {
          // Never let a failed backup take the app down - the real state was
          // already saved above; lastBackup stays put so the next change retries.
          logger.error(`Error on saving daily backup in AppProvider e:${e}`);
        });
    }
  }, [state]);

  // Notification-response handling. Uses the imperative navigationRef + the
  // deep-link-aware stack instead of a per-screen navigation object.
  const notificationListener = useRef(
    undefined as unknown as Notifications.Subscription
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (state.passages.length > 0 && state.settings.remindersEnabled) {
      registerForPushNotificationsAsync(
        state.settings?.langCode || LANGCODE.en
      );

      notificationListener.current =
        Notifications.addNotificationResponseReceivedListener((responce) => {
          const current = stateRef.current;
          logger.write(
            `Notification responce received. ${JSON.stringify(responce.notification.request.content)}`
          );
          const intentText =
            responce.notification.request.content.data?.[
              "android.intent.extra.TEXT"
            ];
          if (typeof intentText !== "undefined" && navigationRef.isReady()) {
            navigationRef.navigate(SCREEN.listPassage, {
              passageText: intentText
            });
          }
          if (
            typeof responce.notification.request.content.data?.id !==
            "undefined"
          ) {
            logger.write(
              `Recieved responce from reminder with id ${responce.notification.request.content.data?.id}`
            );
            // Generate a session then open training. dispatch mutates the global
            // state the tests screen reads; no state travels through navigation.
            dispatch({
              name: ActionName.generateTests,
              trainModeId: current.settings.trainModesList?.[0]?.id
            });
            if (navigationRef.isReady()) {
              navigationRef.navigate(SCREEN.test);
            }
          }
          checkSchedule(current);
        });

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false
        })
      });
    }
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, []);

  const colorScheme = useColorScheme();

  // Stabilize theme/t so their identities only change when their real inputs do
  // (theme setting / OS scheme; language). Previously both were rebuilt every
  // render, defeating any React.memo downstream and re-styling the whole tree on
  // every dispatch. Stable now → row/component memoization becomes possible
  // (the memoization deferred on 2026-07-10; STRATEGY §8.1.2).
  const theme = useMemo(
    () => getThemeFromScheme(state.settings.theme, colorScheme),
    [state.settings.theme, colorScheme]
  );
  const langCode = state?.settings?.langCode || LANGCODE.en;
  const t = useMemo(() => createT(langCode), [langCode]);

  // Memoize the context value so a provider re-render that does NOT change
  // state/theme/t (e.g. a parent re-render) doesn't hand consumers a new object.
  const value = useMemo(
    () => ({ state, setState, dispatch, t, theme }),
    [state, dispatch, t, theme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
