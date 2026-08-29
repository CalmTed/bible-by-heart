import { VERSION } from "../../src/constants";
import { createAppState, createAppState009 } from "../../src/initials";
import {
  BACKUP_APP_TAG,
  BACKUP_FILE_EXTENSION,
  BackupEnvelopeModel,
  createBackupFileName,
  parseBackup,
  parseBackupEnvelope,
  readStateVersion,
  serializeBackup
} from "../../src/utils/backupFile";

// Only the pure half of backupFile is covered here - serialize / parse / name.
// The IO half (exportBackupFile / importBackupFile) is a thin wrapper over
// fileManager, which needs the real document picker to say anything true.

// createAppState009 stamps the CURRENT version on itself, so the version field
// is overridden to what a real 0.0.9 install would have had on disk.
const createLegacyState = () => ({
  ...createAppState009(),
  version: "0.0.9"
});

const EXPORT_TIME = new Date("2026-08-24T10:20:30Z").getTime();

describe("backupFile - readStateVersion", () => {
  it("reads the version of a state object", () => {
    expect(readStateVersion(createAppState())).toBe(VERSION);
    expect(readStateVersion(createLegacyState())).toBe("0.0.9");
  });

  it("falls back to 'unknown' for anything without a string version", () => {
    expect(readStateVersion(null)).toBe("unknown");
    expect(readStateVersion("0.1.0")).toBe("unknown");
    expect(readStateVersion({})).toBe("unknown");
    expect(readStateVersion({ version: 5 })).toBe("unknown");
    expect(readStateVersion({ version: "" })).toBe("unknown");
  });
});

describe("backupFile - createBackupFileName", () => {
  // 8.2.34: a backup is the app's own kind of file now, so it wears the app's
  // own extension - which is what the intent filter in app.config.js matches.
  it("names the file after the state version and the export date", () => {
    expect(createBackupFileName(EXPORT_TIME, "0.0.9")).toMatch(
      /^BibleByHeartBackup_0\.0\.9_\d{4}-\d{2}-\d{2}\.bbhbackup$/
    );
  });

  it("carries the app's own extension", () => {
    expect(
      createBackupFileName(EXPORT_TIME).endsWith(`.${BACKUP_FILE_EXTENSION}`)
    ).toBe(true);
  });

  it("defaults to the current state version", () => {
    expect(createBackupFileName(EXPORT_TIME)).toContain(`_${VERSION}_`);
  });
});

describe("backupFile - serializeBackup", () => {
  it("wraps the state in an envelope that names the app and the version", () => {
    const state = createAppState();

    const content = serializeBackup(state, EXPORT_TIME);

    expect(typeof content).toBe("string");
    const parsed = JSON.parse(content as string) as BackupEnvelopeModel;
    expect(parsed.app).toBe(BACKUP_APP_TAG);
    expect(parsed.exportedAt).toBe(EXPORT_TIME);
    expect(parsed.stateVersion).toBe(VERSION);
    expect(parsed.state).toEqual(JSON.parse(JSON.stringify(state)));
  });

  it("exports an older state as-is, labelled with its own version", () => {
    const legacy = createLegacyState();

    const parsed = JSON.parse(
      serializeBackup(legacy, EXPORT_TIME) as string
    ) as BackupEnvelopeModel;

    expect(parsed.stateVersion).toBe("0.0.9");
    expect((parsed.state as { version: string }).version).toBe("0.0.9");
  });

  it("refuses anything that is not an object", () => {
    expect(serializeBackup(null, EXPORT_TIME)).toBe(false);
    expect(serializeBackup(undefined, EXPORT_TIME)).toBe(false);
    expect(serializeBackup("just a string", EXPORT_TIME)).toBe(false);
  });

  it("returns false instead of throwing on a circular state", () => {
    const circular: Record<string, unknown> = { version: VERSION };
    circular.self = circular;

    expect(serializeBackup(circular, EXPORT_TIME)).toBe(false);
  });
});

describe("backupFile - parseBackup", () => {
  it("round-trips a current-version state through serializeBackup", () => {
    const state = createAppState();

    const restored = parseBackup(serializeBackup(state, EXPORT_TIME) as string);

    expect(restored).not.toBeNull();
    expect(restored?.version).toBe(VERSION);
    expect(restored).toEqual(JSON.parse(JSON.stringify(state)));
  });

  it("converts an older backup forward to the current version", () => {
    const legacy = createLegacyState();

    const restored = parseBackup(
      serializeBackup(legacy, EXPORT_TIME) as string
    );

    expect(restored).not.toBeNull();
    expect(restored?.version).toBe(VERSION);
  });

  it("accepts a bare state object, not just an envelope", () => {
    // What the pre-8.1.9 dev-mode export wrote, and what the emergency screen's
    // state dump gives you if it is pasted into a file.
    const restored = parseBackup(JSON.stringify(createAppState()));

    expect(restored?.version).toBe(VERSION);
  });

  it("rejects content that is not JSON", () => {
    expect(parseBackup("")).toBeNull();
    expect(parseBackup("not json at all")).toBeNull();
    expect(parseBackup("{ half an object")).toBeNull();
  });

  it("rejects JSON that is not a state", () => {
    expect(parseBackup("null")).toBeNull();
    expect(parseBackup('"a string"')).toBeNull();
    expect(parseBackup("42")).toBeNull();
    expect(parseBackup("{}")).toBeNull();
    expect(parseBackup('{"version":42}')).toBeNull();
  });

  it("rejects a state too old for the converter chain", () => {
    const ancient = JSON.stringify({
      app: BACKUP_APP_TAG,
      exportedAt: EXPORT_TIME,
      stateVersion: "0.0.1",
      state: { ...createLegacyState(), version: "0.0.1" }
    });

    expect(parseBackup(ancient)).toBeNull();
  });
});

/**
 * 8.2.34 — restoring replaces everything, so the confirmation has to say what
 * would change. That needs the file's date, which `parseBackup` threw away.
 */
describe("backupFile - parseBackupEnvelope", () => {
  it("hands back the state AND when the backup was written", () => {
    const state = createAppState();
    const parsed = parseBackupEnvelope(
      serializeBackup(state, EXPORT_TIME) as string
    );
    expect(parsed?.exportedAt).toBe(EXPORT_TIME);
    expect(parsed?.state.version).toBe(VERSION);
  });

  it("says so when the content is a bare state with no envelope", () => {
    // the pre-8.1.9 dev export and the emergency screen's text dump: still
    // restorable, but there is no date to show
    const parsed = parseBackupEnvelope(JSON.stringify(createAppState()));
    expect(parsed?.state.version).toBe(VERSION);
    expect(parsed?.exportedAt).toBeNull();
  });

  it("ignores a date that is not a number", () => {
    const parsed = parseBackupEnvelope(
      JSON.stringify({
        app: BACKUP_APP_TAG,
        exportedAt: "yesterday",
        stateVersion: VERSION,
        state: createAppState()
      })
    );
    expect(parsed?.exportedAt).toBeNull();
  });

  it("is null for content that is not a state at all, date or no date", () => {
    expect(parseBackupEnvelope("not json")).toBeNull();
    expect(
      parseBackupEnvelope(JSON.stringify({ exportedAt: EXPORT_TIME }))
    ).toBeNull();
  });
});
