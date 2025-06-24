import addZero from "./addZero";

export const timeStringFromMS: (ms: number) => string = (ms) => {
    const S = 1000;
    const M = S * 60;
    const H = M * 60;
    const h = Math.floor(ms / H)
    const m = Math.floor((ms - h * H) / M)
    const s = Math.floor((ms - h * H - m * M) / S)
    return `${addZero(h)}:${addZero(m)}:${addZero(s)}`
}

export const dateToString: (timeStamp: number) => string = (timeStamp) => {
    const d = new Date(timeStamp);
    return `${addZero(
        d.getFullYear(), 4
        )}-${addZero(
            d.getMonth() + 1
        )}-${addZero(
        d.getDate()
        )}`;
};

export const timeToString: (timeStamp: number) => string = (timeStamp) => {
    const d = new Date(timeStamp);
    return `${addZero(d.getFullYear(), 4)}-${addZero(d.getMonth() + 1)}-${addZero(
        d.getDate()
    )} ${addZero(d.getHours())}:${addZero(d.getMinutes())}:${addZero(
        d.getSeconds()
    )}`;
};