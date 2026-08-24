import {
  STORAGE_BACKUP_NAME,
  STORAGE_PRECONVERT_BACKUP_NAME,
  VERSION
} from "../../src/constants";
import { createAppState009 } from "../../src/initials";
import {
  BackupStorageModel,
  loadRestorableBackup,
  restoreStateFromBackup,
  savePreConvertSnapshot
} from "../../src/utils/bootBackup";

// In-memory stand-in for src/storage.ts. react-native-storage rejects (rather
// than resolving undefined) when a key was never written, which is exactly the
// "no snapshot yet" case savePreConvertSnapshot has to detect.
const createMockStorage = (initial: Record<string, unknown> = {}) => {
  const store: Record<string, unknown> = { ...initial };
  const load = jest.fn((params: { key: string }): Promise<unknown> => {
    if (!(params.key in store)) {
      return Promise.reject(new Error("NotFoundError"));
    }
    return Promise.resolve(store[params.key]);
  });
  const save = jest.fn((params: { key: string; data: unknown }) => {
    store[params.key] = params.data;
    return Promise.resolve();
  });
  const storage: BackupStorageModel = { load, save };
  return { store, storage, load, save };
};

// A realistic older-version state: createAppState009 stamps the CURRENT version
// on itself, so the version field is overridden to what a real 0.0.9 install
// would have had on disk.
const createLegacyState = () => ({
  ...createAppState009(),
  version: "0.0.9"
});

describe("bootBackup - savePreConvertSnapshot", () => {
  it("writes the raw state to the pre-conversion slot when it is empty", async () => {
    const { store, storage, save } = createMockStorage();
    const legacy = createLegacyState();

    const didWrite = await savePreConvertSnapshot(legacy, storage);

    expect(didWrite).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(store[STORAGE_PRECONVERT_BACKUP_NAME]).toBe(legacy);
  });

  it("never overwrites an existing snapshot", async () => {
    const original = createLegacyState();
    const { store, storage, save } = createMockStorage({
      [STORAGE_PRECONVERT_BACKUP_NAME]: original
    });

    const didWrite = await savePreConvertSnapshot(
      { ...createLegacyState(), version: "0.1.0" },
      storage
    );

    expect(didWrite).toBe(false);
    expect(save).not.toHaveBeenCalled();
    expect(store[STORAGE_PRECONVERT_BACKUP_NAME]).toBe(original);
  });

  it("does not touch the daily backup slot", async () => {
    const dailyBackup = { version: VERSION, marker: "daily" };
    const { store, storage } = createMockStorage({
      [STORAGE_BACKUP_NAME]: dailyBackup
    });

    await savePreConvertSnapshot(createLegacyState(), storage);

    // The two slots were ONE key before 8.1.8, which is how the daily backup
    // silently ate the pre-conversion snapshot within a day of an upgrade.
    expect(STORAGE_BACKUP_NAME).not.toBe(STORAGE_PRECONVERT_BACKUP_NAME);
    expect(store[STORAGE_BACKUP_NAME]).toBe(dailyBackup);
  });

  it("resolves false instead of throwing when the write fails", async () => {
    const { storage } = createMockStorage();
    storage.save = jest.fn(() => Promise.reject(new Error("disk full")));

    await expect(
      savePreConvertSnapshot(createLegacyState(), storage)
    ).resolves.toBe(false);
  });
});

describe("bootBackup - restoreStateFromBackup", () => {
  it("passes a current-version snapshot through untouched", () => {
    const current = { ...createAppState009(), version: VERSION };

    expect(restoreStateFromBackup(current)).toBe(current);
  });

  it("converts an older-version snapshot forward instead of rejecting it", () => {
    const legacy = createLegacyState();
    legacy.passages = [];

    const restored = restoreStateFromBackup(legacy);

    // The old emergency restore compared version === VERSION and bailed, so it
    // refused the very pre-conversion snapshot the app had just saved (8.1.8).
    expect(restored).not.toBeNull();
    expect(restored?.version).toBe(VERSION);
  });

  it("keeps passages and settings through the forward conversion", () => {
    const legacy = createLegacyState();
    legacy.settings.hapticsEnabled = false;

    const restored = restoreStateFromBackup(legacy);

    expect(restored?.passages.length).toBe(legacy.passages.length);
    expect(restored?.settings.hapticsEnabled).toBe(false);
  });

  it("returns null for a version the converter chain cannot reach", () => {
    expect(
      restoreStateFromBackup({ ...createLegacyState(), version: "0.0.1" })
    ).toBeNull();
  });

  it("returns null for anything that is not a state object", () => {
    expect(restoreStateFromBackup(null)).toBeNull();
    expect(restoreStateFromBackup(undefined)).toBeNull();
    expect(restoreStateFromBackup("not a state")).toBeNull();
    expect(restoreStateFromBackup({})).toBeNull();
  });
});

describe("bootBackup - loadRestorableBackup", () => {
  it("restores an old-version snapshot straight out of storage", async () => {
    const { storage } = createMockStorage({
      [STORAGE_PRECONVERT_BACKUP_NAME]: createLegacyState()
    });

    const restored = await loadRestorableBackup(
      STORAGE_PRECONVERT_BACKUP_NAME,
      storage
    );

    expect(restored?.version).toBe(VERSION);
  });

  it("restores the daily backup slot independently of the snapshot slot", async () => {
    const daily = { ...createAppState009(), version: VERSION };
    const { storage } = createMockStorage({
      [STORAGE_BACKUP_NAME]: daily,
      [STORAGE_PRECONVERT_BACKUP_NAME]: createLegacyState()
    });

    const fromDaily = await loadRestorableBackup(STORAGE_BACKUP_NAME, storage);
    const fromSnapshot = await loadRestorableBackup(
      STORAGE_PRECONVERT_BACKUP_NAME,
      storage
    );

    expect(fromDaily).toBe(daily);
    expect(fromSnapshot?.version).toBe(VERSION);
    expect(fromSnapshot).not.toBe(daily);
  });

  it("returns null when the slot is empty", async () => {
    const { storage } = createMockStorage();

    await expect(
      loadRestorableBackup(STORAGE_PRECONVERT_BACKUP_NAME, storage)
    ).resolves.toBeNull();
  });
});
