import addZero from "./addZero";

export const secondsToString: (secs: number) => string = (secs) => {
  if (!secs) {
    return "00:00";
  }
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs - h * 3600) / 60);
  return `${addZero(h)}:${addZero(m)}`;
};
