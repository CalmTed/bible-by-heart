import { LOGGER_MAX_ARRAY_SIZE, STORAGE_LOGGER } from "../constants";
import storage from "../storage";
import addZero from "./addZero";

const append = (string: string) => {
  try {
    const d = new Date();
    const timeString = `${d.getFullYear()}-${addZero(d.getMonth() + 1)}-${addZero(d.getDate())} ${addZero(d.getHours())}:${addZero(d.getMinutes())}:${addZero(d.getSeconds())}`;

    storage
      .load({
        key: `${STORAGE_LOGGER}`
      })
      .then((data) => {
        const limitedData =
          data.length > LOGGER_MAX_ARRAY_SIZE
            ? (data = data.slice(-LOGGER_MAX_ARRAY_SIZE))
            : data;
        storage.save({
          key: STORAGE_LOGGER,
          data: [...limitedData, `${timeString} ${string}`]
        });
      })
      .catch((err) => {
        console.error("Unable to wrile to log", err);
        if (err.toString().includes("NotFoundError")) {
          storage.save({
            key: STORAGE_LOGGER,
            data: [`${timeString} ${string}`]
          });
        }
      });
  } catch (err) {
    console.error("Unable to wrile to log", err);
  }
};

const handleWrite = (text: string) => {
  append(`[LOG] ${text}`);
};

const handleError = (text: string) => {
  console.error(text);
  append(`[ERROR] ${text}`);
};

const handleReadAll = async () => {
  const data = await storage.load({ key: `${STORAGE_LOGGER}` });
  return data;
};

const handleClearAll = async () => {
  await storage.save({ key: `${STORAGE_LOGGER}`, data: [] });
};

export const logger = {
  write: handleWrite,
  error: handleError,
  readAll: handleReadAll,
  clearAll: handleClearAll
};
