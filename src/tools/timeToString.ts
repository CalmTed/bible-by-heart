import addZero from './addZero';

const timeToString: (timeStamp: number) => string = (timeStamp) => {
    const d = new Date(timeStamp);
    return `${addZero(d.getFullYear(), 4)}-${addZero(
        d.getMonth() + 1
    )}-${addZero(d.getDate())} ${addZero(d.getHours())}:${addZero(
        d.getMinutes()
    )}:${addZero(d.getSeconds())}`;
};

export default timeToString;
