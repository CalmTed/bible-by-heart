const addZero: (number: number, length?: number) => string = (
  number,
  length = 2
) => {
  try {
    return `${Array(length - Math.abs(number).toString().length)
      .fill("0")
      .join("")}${Math.abs(number)}`;
  } catch (e) {
    console.error(e);
    return number.toString();
  }
};

export default addZero;
