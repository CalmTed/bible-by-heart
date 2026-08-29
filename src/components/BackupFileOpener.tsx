import React, { FC, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useAppContext } from "../context/AppContext";
import { BackupRestoreModal } from "./BackupRestoreModal";
import { ParsedBackupModel, readBackupFromUri } from "../utils/backupFile";
import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";

// A backup file opened from outside the app (8.2.34). The intent filter in
// `app.config.js` puts Bible by Heart in the chooser for the app's own MIME
// type; Android then starts (or resumes) the app with a `content://` URI, which
// reaches JS as an ordinary Linking url.
//
// Lives inside AppProvider on purpose: restoring replaces app state, and the
// only live state is the provider's. App.tsx's own `state` stops being the
// truth the moment the provider mounts.

// The app's own links (bbh://, bible-by-heart://, https://biblebyheart.app) are
// not files. Anything file-shaped is worth trying to read; the content decides.
const isFileUri: (url: string) => boolean = (url) =>
  url.startsWith("content://") || url.startsWith("file://");

export const BackupFileOpener: FC = () => {
  const { setState, t } = useAppContext();
  const [pending, setPending] = useState<ParsedBackupModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handle = (url: string | null) => {
      if (!url || !isFileUri(url)) {
        return;
      }
      readBackupFromUri(url).then((parsed) => {
        if (cancelled) {
          return;
        }
        if (!parsed) {
          // The app was opened WITH a file, so silence here would look like
          // nothing happened - unlike a stray link, which readBackupFromUri
          // ignores quietly.
          logger.error(`Opened file is not a usable backup: ${url}`);
          toastShow(t("ErrorWhileDecoding"), 1000);
          return;
        }
        setPending(parsed);
      });
    };
    // A cold start carries the URI in getInitialURL; a running app gets an event.
    Linking.getInitialURL()
      .then(handle)
      .catch((e) => logger.error(`Unable to read the launch URL e:${e}`));
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handle(url)
    );
    return () => {
      cancelled = true;
      subscription.remove();
    };
    // t is stable per language; re-subscribing on a language change is harmless
    // and keeps the toast in the language the app is in now.
  }, [t]);

  return (
    <BackupRestoreModal
      pending={pending}
      onCancel={() => setPending(null)}
      onConfirm={(parsed) => {
        // A whole-snapshot write on purpose, like the settings restore: this
        // state came from a file, not from a closure over the old one (8.2.24).
        setState(parsed.state);
        logger.write(
          `State restored from an opened backup file (${parsed.state.passages.length} passages)`
        );
        toastShow(t("settsRestored"), 1000);
        setPending(null);
      }}
    />
  );
};
