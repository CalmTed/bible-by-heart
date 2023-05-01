
const addZero: (number: number, length?: number) => string = (number, length = 2) => {

  return `${Array((length - number.toString().length)).fill("0").join("")}${number}`;
}

export default addZero;