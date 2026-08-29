import { VERSION, STORAGE_NAME, SCREEN } from "./src/constants";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from "react";
import { AppStateModel } from "./src/models";
import { Navigator, navigationRef } from "./src/navigator";
import { AppProvider } from "./src/context/AppContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useShareIntent } from "expo-share-intent";
import { createAppState } from "./src/initials";
import storage from "./src/storage";
import { convertState } from "./src/utils/stateVersionConvert";
import {
  loadRestorableBackup,
  loadStoredState,
  savePreConvertSnapshot
} from "./src/utils/bootBackup";
import {
  BackupOfferModal,
  BackupOfferModel
} from "./src/components/BackupOfferModal";
import { BackupFileOpener } from "./src/components/BackupFileOpener";
import { EmergencyScreen } from "./src/components/EmergencyScreen";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { Linking, AppRegistry } from "react-native";
import { logger } from "./src/utils/logger";
import toastShow from "./src/utils/toastShow";

export default function App() {
  const [isReady, setReady] = useState(false);
  const [state, setState]: [
    AppStateModel,
    Dispatch<SetStateAction<AppStateModel>>
  ] = useState(createAppState);
  // The boot read failed (as opposed to finding nothing). The stored state is
  // left strictly untouched and the emergency screen is shown instead.
  const [bootFailed, setBootFailed] = useState(false);
  // Set only when this boot actually converted a state, and carries the raw
  // pre-conversion data so the offer can write THAT to a file - the in-storage
  // snapshot is worthless once the device is wiped or the app uninstalled. Null
  // on every ordinary boot, so nothing is ever shown.
  const [backupOffer, setBackupOffer] = useState<BackupOfferModel | null>(null);

  // Reads text shared into the app via the Android share sheet (SEND / text/plain).
  // This is the piece that was missing: the intent filter opened the app, but
  // nothing read Intent.EXTRA_TEXT (Linking only surfaces VIEW/URL intents).
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent({ resetOnBackground: true });

  useEffect(() => {
    if (error) {
      logger.write(`[SHARE INTENT] error: ${error}`);
    }
    if (!hasShareIntent) {
      return;
    }
    const sharedText = shareIntent.text ?? shareIntent.webUrl ?? "";
    logger.write(`[SHARE INTENT] received (${sharedText.length} chars)`);
    // route into the passage-add flow: listScreen reads
    // route.params.passageText, sanitizes it and opens the passage editor
    // pre-filled — the review / confirm-before-add step. On a cold start the
    // nav container may not be mounted yet, so retry briefly until it is ready.
    let tries = 0;
    const routeToList = () => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(SCREEN.listPassage, {
          passageText: sharedText
        });
        resetShareIntent();
      } else if (tries < 50) {
        tries += 1;
        setTimeout(routeToList, 100);
      }
    };
    routeToList();
  }, [hasShareIntent, error]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", (link) => {
      if (state.settings.devModeEnabled) {
        logger.write(`[DEV] Recieved data: ${JSON.stringify(link)}`);
        toastShow("Recieved data:" + link, 1000);
      }
    });
    // Removes THIS listener, not every url listener in the app:
    // `removeAllListeners` also unsubscribed BackupFileOpener's, so opening a
    // backup while the app was running went nowhere as soon as devMode toggled.
    return () => {
      subscription.remove();
    };
    // Was missing a dep array → re-subscribed on every App render. Only needs
    // to re-run when devMode toggles (rare); mount-once otherwise.
  }, [state.settings.devModeEnabled]);

  // Persist the freshly converted state, then hand ownership to AppProvider. A
  // failed write is NOT fatal - the app runs on the converted state in memory
  // and AppProvider will try to persist it again on the next change.
  const saveAndRun = (nextState: AppStateModel) =>
    storage
      .save({
        key: `${STORAGE_NAME}`,
        data: nextState
      })
      .catch((err) => {
        logger.error(`Unable to persist state on boot e:${err}`);
      })
      .then(() => {
        setState(nextState);
        setReady(true);
      });

  const loadState = () => {
    // loadStoredState separates "the key was never written" from "the read
    // failed". The old bare.catch collapsed both into "no state yet" and then
    // SAVED a blank state, so one unreadable read - a half-written record, a
    // flaky native call - permanently erased a real install.
    loadStoredState().then((result) => {
      if (result.status === "failed") {
        logger.error(
          `Boot read failed, storage left untouched. e:${result.error}`
        );
        setBootFailed(true);
        return;
      }
      if (result.status === "empty") {
        logger.write("Creating new state b.c. there were none");
        storage
          .save({
            key: `${STORAGE_NAME}`,
            data: state
          })
          .then(() => {
            setReady(true);
          })
          .catch((err) => {
            logger.error(`Unable to save the initial state e:${err}`);
            setBootFailed(true);
          });
        return;
      }
      const dataObj = result.raw as AppStateModel;
      //check if version is correct
      if (dataObj?.version === VERSION) {
        setState(dataObj);
        setReady(true);
        return;
      }
      //if versions does not match
      //try to convert
      // The raw state goes into its OWN write-once slot, not the rolling daily
      // backup - the daily backup used to overwrite this snapshot within 24h of
      // an upgrade, so a converter bug became unrecoverable after one day.
      // savePreConvertSnapshot never rejects, so a failed snapshot can't leave
      // the app stuck at "not ready".
      savePreConvertSnapshot(dataObj).then((didWrite) => {
        logger.write(
          `State version ${dataObj?.version} != ${VERSION}. Pre-conversion snapshot ${didWrite ? "saved" : "already present"}.`
        );
        // Offer the file export regardless of what the conversion does
        // next: if it succeeds the user gets a copy of the last state the
        // previous build ran, and if it fails this raw object is the only
        // copy of their data that exists outside storage.
        setBackupOffer({
          rawState: dataObj,
          fromVersion: dataObj?.version || "unknown"
        });
        const convertedState = convertState(dataObj);
        if (convertedState) {
          toastShow(
            `State converted from ${dataObj.version} to ${VERSION}`,
            10000
          );
          saveAndRun(convertedState);
        } else {
          // Unconvertible. The snapshot above is safe, so the running app may
          // start empty - but storage keeps the original until the user
          // decides, and the offer modal still hands them the file.
          toastShow("Error with convering app state. Backup saved.", 10000);
          setState(createAppState);
          setReady(true);
        }
      });
    });
  };

  // Emergency-screen restore, shared by both recovery slots. It accepts an
  // OLDER-version snapshot and converts it forward: the previous
  // version-equality check made restore reject the very pre-conversion snapshot
  // the app had just saved, so recovery was unreachable exactly when it was
  // needed - right after a bad conversion.
  const restoreFromKey = (
    storageKey: string,
    label: string,
    onRecovered: () => void
  ) => {
    loadRestorableBackup(storageKey)
      .then((restored) => {
        if (!restored) {
          toastShow(`No usable ${label} / Немає придатної копії`, 10000);
          return;
        }
        storage
          .save({
            key: `${STORAGE_NAME}`,
            data: restored
          })
          .then(() => {
            setState(restored);
            setReady(true);
            setBootFailed(false);
            onRecovered();
            toastShow(`Loaded from ${label} / Відновлено`, 10000);
          })
          .catch((err) => {
            logger.error(`Error on saving restored ${label} e:${err}`);
            toastShow("😟 Nope. Error here too...", 10000);
          });
      })
      .catch((err) => {
        logger.error(`Error on loading ${label} e:${err}`);
        toastShow("😟 Nope. Error here too...", 10000);
      });
  };

  // The emergency screen's last button. Only reachable after "ask developer for
  // help", and it overwrites storage on purpose - unlike the boot path, which
  // now never does.
  const eraseAllData = (onRecovered: () => void) => {
    const newState = createAppState();
    storage
      .save({
        key: `${STORAGE_NAME}`,
        data: newState
      })
      .then(() => {
        setState(newState);
        setReady(true);
        setBootFailed(false);
        onRecovered();
        toastShow("Brand new data for you", 10000);
      })
      .catch((err) => {
        logger.error(`Unable to create new state e:${err}`);
        toastShow("😟 Nope. " + err, 10000);
      });
  };

  // Load persisted state EXACTLY ONCE, then hand ownership to AppProvider (the
  // single source of truth, which does all subsequent storage writes). This
  // effect previously had no dependency array, so it re-read storage and
  // re-seeded on every render — an infinite reload loop that fought every state
  // mutation once state stopped being per-screen.
  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) {
      return;
    }
    didLoad.current = true;
    loadState();
  }, []);

  // A read failure means the app must not boot at all: showing the normal UI
  // would let AppProvider persist the blank in-memory state over the real one.
  if (bootFailed) {
    return (
      <EmergencyScreen
        onRestore={(storageKey, label) =>
          restoreFromKey(storageKey, label, () => {})
        }
        onErase={() => eraseAllData(() => {})}
      />
    );
  }
  // A REAL error boundary, not the render-time try/catch this used to be: React
  // never routes a child's render error through the parent's call stack, so the
  // old catch block could not fire and the emergency screen was dead code
  //. `reset` clears the caught error once a usable state is back.
  return (
    <ErrorBoundary
      renderFallback={(_error, reset) => (
        <EmergencyScreen
          onRestore={(storageKey, label) =>
            restoreFromKey(storageKey, label, reset)
          }
          onErase={() => eraseAllData(reset)}
        />
      )}
    >
      {isReady && (
        <SafeAreaProvider>
          <AppProvider initialState={state}>
            <Navigator />
            <BackupOfferModal
              offer={backupOffer}
              onClose={() => setBackupOffer(null)}
            />
            {/* a backup file opened from outside the app - inside the
                provider, because restoring writes the state the provider owns */}
            <BackupFileOpener />
          </AppProvider>
        </SafeAreaProvider>
      )}
    </ErrorBoundary>
  );
}

AppRegistry.registerComponent("Bible by heart", () => App);
