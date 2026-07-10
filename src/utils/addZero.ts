import { logger } from "./logger";

const addZero: (number: number, length?: number) => string = (
  number,
  length = 2
) => {
  try {
    // Math.max guards against a negative array length when the number already
    // has more digits than the requested width (e.g. addZero(176) → no pad).
    const padCount = Math.max(0, length - Math.abs(number).toString().length);
    return `${Array(padCount).fill("0").join("")}${Math.abs(number)}`;
  } catch (e) {
    logger.error(`addZero failed for ${number}: ${e}`);
    return number.toString();
  }
};

export default addZero;
