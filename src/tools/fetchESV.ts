import { ESVTOKEN } from "../../apiTokens";
import { AddressType } from "../models"
import addressToString from "./addressToString";
import { LANGCODE } from "../constants";
import { createT } from "../l10n"

export const fetchESV: (address: AddressType) => Promise<string> = (address) => {
  const addressString = addressToString(address,createT(LANGCODE.en))
  if(addressString === "-"){
    return new Promise(() => { return false })
  }
  const  q = `q=${addressString}`
  const params = Object.entries({
    "include-passage-references":false,
    "include-verse-numbers":false,
    "include-first-verse-numbers":false,
    "include-footnotes":false,
    "include-footnote-body":false,
    "include-headings":false,
    "include-short-copyright":false,
    "include-copyright":false,
    "horizontal-line-length":99999,
    "include-selahs":false,
    "indent-using":"",
    "indent-paragraphs":0,
    "indent-poetry":false,
    "indent-poetry-lines":0,
    "indent-declares":0,
    "indent-psalm-doxology":0
  }).map(([key, value]) => {
    return `&${key}=${value}`
  }).join("");
  return fetch(`https://api.esv.org/v3/passage/text/?${q}${params}`, {
    headers: {
      Authorization: ESVTOKEN
    },
  }).then((response) => response.json()
  ).then((data) => {
    return data.passages[0].trim().replace(/\n/g," ").replace(/  /g," ").replace(/   /g," ");
  }).catch(error => {
    return "Unable to get passage text"
  })
}