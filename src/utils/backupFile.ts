import { VERSION } from "../constants";
import { WORD } from "../l10n";
import { AppStateModel } from "../models";
import { restoreStateFromBackup } from "./bootBackup";
import { readFile, readFileAtUri, writeFile } from "./fileManager";
import { dateToString } from "./formatDateTime";
import { logger } from "./logger";
import toastShow from "./toastShow";

// The user-facing half of the safety net. `bootBackup.ts` keeps copies INSIDE
// the app (two storage slots); this module puts one OUTSIDE it, in a file the
// user owns - the only copy that survives an uninstall or a wiped device.
//
// The top half is pure (serialize / parse / name) and unit-tested; the bottom
// half is the thin IO wrapper the three call sites share (the post-upgrade
// offer, the settings rows, the dev-mode rows).

// A backup is the app's OWN kind of file: its own extension and its own MIME
// type, declared in `app.config.js` so Android offers Bible by Heart when one
// is opened from a file manager or a chat.
export const BACKUP_FILE_MIME = "application/vnd.biblebyheart.backup+json";
export const BACKUP_FILE_EXTENSION = "bbhbackup";
// Backups written are plain.json and must stay openable forever - a safety net
// that rejects the copies it made last year is not one. The picker offers these
// too, and the CONTENT decides validity, not the label: some Android providers
// hand any file over as text/plain or octet-stream.
export const BACKUP_LEGACY_MIMES = [
  "application/json",
  "text/plain",
  "application/octet-stream"
];
export const BACKUP_FILE_PREFIX = "BibleByHeartBackup";
export const BACKUP_APP_TAG = "bible-by-heart";
const UNKNOWN_VERSION = "unknown";

// What a backup file contains. The state is nested rather than spread at the top
// level so the file says which app and which state version wrote it without
// colliding with any current or future state field.
export interface BackupEnvelopeModel {
  app: string;
  exportedAt: number;
  stateVersion: string;
  state: unknown;
}

type TranslateModel = (word: WORD) => string;

/**
 * State version of an arbitrary object, for naming and labelling only - never
 * trusted for conversion decisions (`restoreStateFromBackup` re-checks it).
 */
export const readStateVersion: (rawState: unknown) => string = (rawState) => {
  if (!rawState || typeof rawState !== "object") {
    return UNKNOWN_VERSION;
  }
  const version = (rawState as { version?: unknown }).version;
  return typeof version === "string" && version.length
    ? version
    : UNKNOWN_VERSION;
};

export const createBackupFileName: (
  timeStamp: number,
  stateVersion?: string
) => string = (timeStamp, stateVersion = VERSION) =>
  `${BACKUP_FILE_PREFIX}_${stateVersion}_${dateToString(
    timeStamp
  )}.${BACKUP_FILE_EXTENSION}`;

/**
 * Wrap a state (of ANY version - a pre-conversion snapshot is exported exactly
 * as it was found) into the file envelope.
 *
 * @returns the file content, or false if the input is not serializable.
 */
export const serializeBackup: (
  rawState: unknown,
  timeStamp: number
) => string | false = (rawState, timeStamp) => {
  if (!rawState || typeof rawState !== "object") {
    logger.error(`Refusing to export a non-object backup: ${typeof rawState}`);
    return false;
  }
  try {
    const envelope: BackupEnvelopeModel = {
      app: BACKUP_APP_TAG,
      exportedAt: timeStamp,
      stateVersion: readStateVersion(rawState),
      state: rawState
    };
    return JSON.stringify(envelope, null, 1);
  } catch (e) {
    logger.error(`Unable to encode backup file e:${e}`);
    return false;
  }
};

/**
 * What a picked backup file turned out to hold: the state it will restore, and
 * when it was written (null for a bare state dump, which carries no date).
 */
export interface ParsedBackupModel {
  state: AppStateModel;
  exportedAt: number | null;
}

/**
 * Turn file content back into a state this build can run.
 *
 * Accepts both shapes on purpose: the envelope written by `serializeBackup`,
 * and a bare state object - which is what the dev-mode export produced and what
 * the emergency screen's "show state" text dump gives you. Version tolerance is
 * delegated to `restoreStateFromBackup`, so an older backup is converted
 * forward through the normal chain instead of being rejected.
 *
 * @returns a runnable state, or null if the content is not a convertible state.
 */
export const parseBackupEnvelope: (
  fileContent: string
) => ParsedBackupModel | null = (fileContent) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContent);
  } catch (e) {
    logger.error(`Unable to decode backup file e:${e}`);
    return null;
  }
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const envelopeState = (parsed as { state?: unknown }).state;
  const candidate =
    envelopeState && typeof envelopeState === "object" ? envelopeState : parsed;
  const state = restoreStateFromBackup(candidate);
  if (!state) {
    return null;
  }
  const exportedAt = (parsed as { exportedAt?: unknown }).exportedAt;
  return {
    state,
    exportedAt: typeof exportedAt === "number" ? exportedAt : null
  };
};

/** The state alone, for callers with nothing to say about when it was made. */
export const parseBackup: (fileContent: string) => AppStateModel | null = (
  fileContent
) => parseBackupEnvelope(fileContent)?.state ?? null;

/**
 * Ask for a location and write the backup there. Total: a cancelled folder
 * picker and a failed write both resolve to false, never throw - callers sit on
 * UI callbacks (and one of them on the post-upgrade path).
 */
export const exportBackupFile: (
  rawState: unknown,
  t: TranslateModel,
  timeStamp?: number
) => Promise<boolean> = async (
  rawState,
  t,
  timeStamp = new Date().getTime()
) => {
  const content = serializeBackup(rawState, timeStamp);
  if (!content) {
    toastShow(t("ErrorWhileEncoding"), 1000);
    return false;
  }
  try {
    const isWritten = await writeFile(
      createBackupFileName(timeStamp, readStateVersion(rawState)),
      content,
      BACKUP_FILE_MIME
    );
    if (!isWritten) {
      // writeFile already logged the reason; a declined folder permission is a
      // normal cancellation and must stay silent.
      return false;
    }
    logger.write(`Backup file exported (state ${readStateVersion(rawState)})`);
    toastShow(t("settsExported"), 1000);
    return true;
  } catch (e) {
    logger.error(`Error while writing backup file e:${e}`);
    toastShow(t("ErrorWhileWritingFile"), 1000);
    return false;
  }
};

/**
 * Pick a backup file and decode it. Does NOT apply anything - the caller shows
 * the confirmation and owns the state swap.
 *
 * @returns the runnable state, or null (already toasted) on cancel/failure.
 */
export const importBackupFile: (
  t: TranslateModel
) => Promise<ParsedBackupModel | null> = async (t) => {
  try {
    const file = await readFile([BACKUP_FILE_MIME, ...BACKUP_LEGACY_MIMES]);
    if (!file) {
      toastShow(t("ErrorWhileReadingFile"), 1000);
      return null;
    }
    const restored = parseBackupEnvelope(file.content);
    if (!restored) {
      toastShow(t("ErrorWhileDecoding"), 1000);
      return null;
    }
    return restored;
  } catch (e) {
    logger.error(`Error while reading backup file e:${e}`);
    toastShow(t("ErrorWhileReadingFile"), 1000);
    return null;
  }
};

/**
 * The other way in: a backup file OPENED from outside the app, which arrives as
 * a `content://` or `file://` URI rather than through the picker. Nothing is
 * applied here either - the caller shows the confirmation.
 *
 * @returns the parsed backup, or null if the URI held anything else. Silent on
 * purpose: every VIEW intent the app receives lands here, and a link that is
 * not a backup is not an error worth toasting at the user.
 */
export const readBackupFromUri: (
  uri: string
) => Promise<ParsedBackupModel | null> = async (uri) => {
  try {
    const content = await readFileAtUri(uri);
    if (!content) {
      return null;
    }
    return parseBackupEnvelope(content);
  } catch (e) {
    logger.error(`Error while opening backup file e:${e}`);
    return null;
  }
};
