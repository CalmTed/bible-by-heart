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

// console.time("tests");
// const d1 = 0    
// const d2 = null
// const d3 = 1731077360208
// console.log(d1)
// console.log(timeToString(d1))
// console.log(d2)
//@ts-ignore
// console.log(timeToString(d2))
// console.log(d3)
// console.log(timeToString(d3))
// console.timeEnd("tests");