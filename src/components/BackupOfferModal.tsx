import React, { FC, useState } from "react";
import { VERSION } from "../constants";
import { useAppContext } from "../context/AppContext";
import { exportBackupFile } from "../utils/backupFile";
import { ConfirmModal } from "./ConfirmModal";

// What App.tsx hands over after a state-version conversion happened on boot:
// the raw, still-unconverted state plus the version it was found at.
export interface BackupOfferModel {
  rawState: unknown;
  fromVersion: string;
}

interface BackupOfferModalModel {
  offer: BackupOfferModel | null;
  onClose: () => void;
}

/**
 * The post-upgrade backup offer (8.1.9). The pre-conversion snapshot is already
 * saved silently into storage by the boot path; this merely OFFERS to put the
 * same data in a file the user keeps. It is never blocking: "Later" and the
 * Android back button both dismiss it, and it does not come back - the next boot
 * finds a matching version and converts nothing.
 */
export const BackupOfferModal: FC<BackupOfferModalModel> = ({
  offer,
  onClose
}) => {
  const { t } = useAppContext();
  const [isExporting, setExporting] = useState(false);
  if (!offer) {
    return null;
  }
  return (
    <ConfirmModal
      shown={true}
      text={`${t("BackupOfferText")}\n${t("version")}: ${offer.fromVersion} → ${VERSION}`}
      confirmTitle={t("BackupOfferConfirm")}
      cancelTitle={t("BackupOfferLater")}
      confirmColor="green"
      onCancel={onClose}
      onConfirm={() => {
        if (isExporting) {
          return;
        }
        setExporting(true);
        // Closed either way: a failed or cancelled export already toasted, and
        // re-asking on the boot path is exactly the nagging this must not do.
        exportBackupFile(offer.rawState, t).then(onClose, onClose);
      }}
    />
  );
};
