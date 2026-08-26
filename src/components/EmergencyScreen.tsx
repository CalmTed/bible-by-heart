import React, { FC, useState } from "react";
import {
  Button,
  ScrollView,
  Text,
  TextInput,
  View,
  Linking
} from "react-native";
import {
  STORAGE_BACKUP_NAME,
  STORAGE_PRECONVERT_BACKUP_NAME,
  STORAGE_NAME
} from "../constants";
import storage from "../storage";
import { logger } from "../utils/logger";
import toastShow from "../utils/toastShow";

interface EmergencyScreenModel {
  // Both are owned by App.tsx: it holds the state the app boots from, so it is
  // the only place that can put a restored state back and mark the app ready.
  onRestore: (storageKey: string, label: string) => void;
  onErase: () => void;
}

/**
 * The last-resort recovery UI (extracted from App.tsx in 8.1.9a).
 *
 * Reached from two places, both of which mean the normal app cannot be trusted:
 * a render error caught by `ErrorBoundary`, and a state read that FAILED (as
 * opposed to finding nothing) on the boot path.
 *
 * It renders OUTSIDE `AppProvider` by design - that is the whole point, it has
 * to work when the state, theme or l10n code is what is broken. So, uniquely in
 * this repo, it uses raw react-native primitives and hardcoded bilingual
 * strings instead of themed components and `t(...)` (CODING_RULES §7).
 */
export const EmergencyScreen: FC<EmergencyScreenModel> = ({
  onRestore,
  onErase
}) => {
  const [clickCounter, setClickCounter] = useState(0);
  const counterMax = 5;
  const [textInputValue, setTextInputValue] = useState("");
  const [askedForHelp, setAskedForHelp] = useState(false);
  return (
    <ScrollView>
      <View
        style={{
          padding: 30,
          justifyContent: "center",
          gap: 30,
          minHeight: 600
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "600",
            color: "#fff"
          }}
        >
          🤕 Critical error/Критична помилка
        </Text>
        <Button
          title="🫣 Restore from daily backup / Відновити з щоденного бекапу"
          onPress={() => {
            try {
              onRestore(STORAGE_BACKUP_NAME, "daily backup");
            } catch (err) {
              logger.error(`Error on loading daily backup e:${err}`);
              toastShow("😟 Nope. Error here too...", 10000);
            }
          }}
        />
        <Button
          title="🛟 Restore pre-update snapshot / Відновити копію до оновлення"
          color={"#44a"}
          onPress={() => {
            try {
              onRestore(STORAGE_PRECONVERT_BACKUP_NAME, "pre-update snapshot");
            } catch (err) {
              logger.error(`Error on loading pre-update snapshot e:${err}`);
              toastShow("😟 Nope. Error here too...", 10000);
            }
          }}
        />
        <Button
          title={
            "🧳 Export passages list/Експортувати список текстів " +
            clickCounter
          }
          color={"#4a4"}
          onPress={() => {
            if (clickCounter < counterMax) {
              try {
                storage
                  .load({
                    key: `${STORAGE_NAME}`
                  })
                  .then((data) => {
                    setTextInputValue(JSON.stringify(data.passages, null, 4));
                    toastShow("Showing passages", 10000);
                  })
                  .catch((err) => {
                    logger.error(`Error on encoding while exporting`);
                    toastShow("😟 Nope. " + err, 10000);
                  });
              } catch (err) {
                logger.error(`Error while exporting`);
                toastShow("😟 Nope. " + err, 10000);
              }
            } else {
              try {
                storage
                  .load({
                    key: `${STORAGE_NAME}`
                  })
                  .then((data) => {
                    setTextInputValue(JSON.stringify(data, null, 4));
                    toastShow("Showing state", 10000);
                  })
                  .catch((err) => {
                    logger.error(`Error while getting data from storage`);
                    toastShow("😟 Nope. " + err, 10000);
                  });
              } catch (err) {
                logger.error(`Error while getting data from storage 2`);
                toastShow("😟 Nope. " + err, 10000);
              }
            }
            if (clickCounter >= counterMax * 2) {
              setClickCounter(0);
            } else {
              setClickCounter((prv) => prv + 1);
            }
          }}
        />
        <Button
          title="🛎️ Ask developer for help/Спитати допомоги у розробника"
          color={"#aa4"}
          onPress={() => {
            try {
              setAskedForHelp(true);
              Linking.openURL("https://t.me/BibleByHeartApp");
            } catch (err) {
              logger.error(`Unable to open telegram link`);
              toastShow("😟 Nope. " + err, 10000);
            }
          }}
        />
        <Button
          title="😣 Erase all data/Стерти всі данні"
          color={"#a44"}
          disabled={!askedForHelp}
          onPress={onErase}
        />

        <TextInput
          multiline
          value={textInputValue}
          style={{
            maxHeight: 600,
            color: clickCounter < counterMax + 1 ? "#fff" : "#0f0"
          }}
        />
      </View>
    </ScrollView>
  );
};
