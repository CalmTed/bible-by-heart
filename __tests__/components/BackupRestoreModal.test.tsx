import { renderWithContext } from "../../test-utils/renderWithContext";
import { BackupRestoreModal } from "../../src/components/BackupRestoreModal";
import { createAppState, createPassage, createAddress } from "../../src/initials";
import { createT } from "../../src/l10n";
import { LANGCODE } from "../../src/constants";
import { dateToString } from "../../src/utils/formatDateTime";
import { AppStateModel } from "../../src/models";

/**
 * A restore replaces EVERYTHING, so the question has to say what would change,
 * not only what the file holds. "12 passages" alone never told the user that
 * they currently have 40.
 */
const t = createT(LANGCODE.en);
const EXPORTED_AT = new Date("2026-08-24T10:20:30Z").getTime();

const stateWith = (passages: number): AppStateModel => ({
  ...createAppState(),
  passages: Array.from({ length: passages }, (_, i) =>
    createPassage(i + 1, createAddress())
  )
});

const renderModal = (
  current: AppStateModel,
  backup: AppStateModel,
  exportedAt: number | null = EXPORTED_AT
) =>
  renderWithContext(
    <BackupRestoreModal
      pending={{ state: backup, exportedAt }}
      onCancel={() => {}}
      onConfirm={() => {}}
    />,
    { state: current }
  );

describe("BackupRestoreModal", () => {
  it("shows the date the backup was written", () => {
    const screen = renderModal(stateWith(1), stateWith(2));
    expect(
      screen.getByText(
        new RegExp(`${t("BackupMadeOn")}: ${dateToString(EXPORTED_AT)}`)
      )
    ).toBeTruthy();
  });

  it("says a dateless backup is dateless instead of showing a wrong date", () => {
    const screen = renderModal(stateWith(1), stateWith(2), null);
    expect(screen.getByText(new RegExp(t("BackupMadeOnUnknown")))).toBeTruthy();
    expect(screen.queryByText(new RegExp(t("BackupMadeOn") + ":"))).toBeNull();
  });

  it("states each count as now -> after, which is the difference", () => {
    const screen = renderModal(stateWith(40), stateWith(12));
    expect(
      screen.getByText(new RegExp(`${t("NumberOfPassages")}: 40 → 12`))
    ).toBeTruthy();
  });

  it("does not draw an arrow when the number does not move", () => {
    const screen = renderModal(stateWith(3), stateWith(3));
    expect(
      screen.getByText(new RegExp(`${t("NumberOfPassages")}: 3(?!.*→)`))
    ).toBeTruthy();
  });

  it("asks nothing while there is no pending backup", () => {
    const screen = renderWithContext(
      <BackupRestoreModal
        pending={null}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.queryByText(t("settsBackupRestoreConfirm"))).toBeNull();
  });
});
