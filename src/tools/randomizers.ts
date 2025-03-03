import { AddressType, PassageModel } from "src/models";

export const randomRange: (from: number, to: number) => number = (from, to) => {
  return Math.round(Math.random() * (to - from)) + from;
};
export const randomItem: (
  list: (number | string | AddressType | [number, string])[]
) => number | string | AddressType | [number, string] = (list) => {
  if (list.length < 2) {
    return list[0];
  }
  return list[randomRange(0, list.length - 1)];
};

export const randomListRange: (
  list: (number | string | PassageModel)[],
  length: number
) => (number | string | PassageModel)[] = (list, range) => {
  if (list.length < range) {
    return [...list].sort(() => (Math.random() > 0.5 ? -1 : 1));
  }
  return [...list].sort(() => (Math.random() > 0.5 ? -1 : 1)).slice(0, range);
};
