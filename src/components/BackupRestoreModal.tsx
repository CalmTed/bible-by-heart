import React, { FC } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { useAppContext } from "../context/AppContext";
import { ParsedBackupModel } from "../utils/backupFile";
import { dateToString } from "../utils/formatDateTime";

interface BackupRestoreModalModel {
  /** The decoded, NOT yet applied backup. `null` keeps the dialog closed. */
  pending: ParsedBackupModel | null;
  onCancel: () => void;
  onConfirm: (pending: ParsedBackupModel) => void;
}

/**
 * "Restore this backup?" — the one place the question is asked.
 *
 * Restoring replaces everything, so the dialog says what would CHANGE rather
 * than only what the file holds: when it was written, and each count as
 * `now -> after`. The arrow is the whole point — "12 passages" alone does not
 * tell you that you currently have 40.
 *
 * Two ways in and both land here: the settings row that picks a file, and a
 * backup opened from outside the app.
 */
export const BackupRestoreModal: FC<BackupRestoreModalModel> = ({
  pending,
  onCancel,
  onConfirm
}) => {
  const { state, t } = useAppContext();
  const change = (now: number, next: number) =>
    now === next ? `${now}` : `${now} → ${next}`;
  const lines = pending
    ? [
        t("BackupRestoreConfirmationText"),
        pending.exportedAt
          ? `${t("BackupMadeOn")}: ${dateToString(pending.exportedAt)}`
          : t("BackupMadeOnUnknown"),
        `${t("NumberOfPassages")}: ${change(
          state.passages.length,
          pending.state.passages.length
        )}`,
        `${t("TestsCompleted")}: ${change(
          state.testsHistory.length,
          pending.state.testsHistory.length
        )}`
      ]
    : [];
  return (
    <ConfirmModal
      shown={pending !== null}
      text={lines.join("\n")}
      confirmTitle={t("settsBackupRestoreConfirm")}
      cancelTitle={t("Cancel")}
      onCancel={onCancel}
      onConfirm={() => {
        if (pending) {
          onConfirm(pending);
        }
      }}
    />
  );
};
