import {
  STORAGE_NAME,
  STORAGE_PRECONVERT_BACKUP_NAME,
  VERSION
} from "../constants";
import { AppStateModel } from "../models";
import defaultStorage from "../storage";
import { logger } from "./logger";
import { convertState } from "./stateVersionConvert";

// The boot path's two safety-net operations, kept out of App.tsx so they can be
// unit-tested without mounting the app (8.1.8). Both are deliberately
// total: they log and resolve instead of throwing, because every caller sits on
// the cold-start path where an unhandled rejection means the app never becomes
// ready at all.

// The slice of `src/storage.ts` (react-native-storage) these helpers use.
// Injected so tests can drive the empty/present/failing cases directly.
export interface BackupStorageModel {
  load: (params: { key: string }) => Promise<unknown>;
  save: (params: { key: string; data: unknown }) => Promise<void>;
}

/**
 * What a read of the persisted state slot turned out to be. The distinction is
 * the whole point: "empty" is a fresh install and may be overwritten with a
 * blank state, "failed" must NEVER be, because the key is probably still there
 * and simply unreadable right now (8.1.9a).
 */
export type StoredStateModel =
  | { status: "found"; raw: unknown }
  | { status: "empty" }
  | { status: "failed"; error: unknown };

/**
 * react-native-storage rejects with a `NotFoundError` when a key was never
 * written - that, and only that, means "no state yet". Every other rejection
 * (a JSON.parse SyntaxError over half-written data, a native AsyncStorage or
 * disk failure) leaves the stored state intact and unread, so treating it as a
 * fresh install is how a working install got erased.
 *
 * `ExpiredError` deliberately counts as a failure: this app sets
 * `defaultExpires: null` so it cannot happen, and if it ever did it would mean
 * data exists.
 */
export const isKeyMissingError: (e: unknown) => boolean = (e) =>
  typeof e === "object" &&
  e !== null &&
  (e as { name?: unknown }).name === "NotFoundError";

/**
 * Read the persisted state and say which of the three cases it is, instead of
 * collapsing "unreadable" into "absent" the way a bare `.catch` does.
 * Total - it never rejects, so the caller cannot get stuck before "ready".
 */
export const loadStoredState: (
  key?: string,
  storage?: BackupStorageModel
) => Promise<StoredStateModel> = async (
  key = STORAGE_NAME,
  storage = defaultStorage
) => {
  try {
    const raw = await storage.load({ key });
    if (raw === null || typeof raw === "undefined") {
      // The library rejects instead of resolving nothing, but a backend that
      // resolves null still means the same thing: nothing was ever stored.
      return { status: "empty" };
    }
    return { status: "found", raw };
  } catch (e) {
    if (isKeyMissingError(e)) {
      return { status: "empty" };
    }
    logger.error(`Unable to read stored state from key ${key} e:${e}`);
    return { status: "failed", error: e };
  }
};

/**
 * Write the raw, still-unconverted state into the pre-conversion slot - but
 * ONLY if that slot is empty. The oldest snapshot is the valuable one: if a
 * converter shipped broken, every later boot would otherwise overwrite the good
 * data with the corrupted output. Write-once means the state from before the
 * first conversion this install ever ran survives indefinitely.
 *
 * @returns true if a snapshot was written, false if one already existed or the
 *          write failed. Never rejects - conversion must proceed regardless.
 */
export const savePreConvertSnapshot: (
  rawState: unknown,
  storage?: BackupStorageModel
) => Promise<boolean> = async (rawState, storage = defaultStorage) => {
  try {
    const existing = await storage
      .load({ key: STORAGE_PRECONVERT_BACKUP_NAME })
      // react-native-storage rejects with NotFoundError when the key is empty.
      .catch(() => null);
    if (existing !== null && typeof existing !== "undefined") {
      return false;
    }
    await storage.save({
      key: STORAGE_PRECONVERT_BACKUP_NAME,
      data: rawState
    });
    return true;
  } catch (e) {
    logger.error(`Unable to save pre-conversion snapshot e:${e}`);
    return false;
  }
};

/**
 * Turn whatever sits in a backup slot into a state this build can actually run.
 *
 * The emergency restore used to hard-reject anything whose version !== VERSION,
 * which made it refuse the pre-conversion snapshot it had just saved - i.e.
 * restore was unreachable exactly when it was needed, right after a bad
 * conversion. An older snapshot is now converted forward through the same
 * chain the normal boot path uses.
 *
 * @returns the runnable state, or null if the input is not a state at all or
 *          its version is too old for the converter chain to reach.
 */
export const restoreStateFromBackup: (raw: unknown) => AppStateModel | null = (
  raw
) => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const candidate = raw as AppStateModel;
  if (typeof candidate.version !== "string") {
    return null;
  }
  if (candidate.version === VERSION) {
    return candidate;
  }
  return convertState(candidate);
};

/**
 * Read a backup slot and hand back a runnable state. Wraps both failure modes -
 * an empty slot and an unconvertible snapshot - into a single null.
 */
export const loadRestorableBackup: (
  key: string,
  storage?: BackupStorageModel
) => Promise<AppStateModel | null> = async (key, storage = defaultStorage) => {
  try {
    const data = await storage.load({ key });
    return restoreStateFromBackup(data);
  } catch (e) {
    logger.error(`Unable to load backup from key ${key} e:${e}`);
    return null;
  }
};
