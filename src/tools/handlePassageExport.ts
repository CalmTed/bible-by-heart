import { createT } from "../l10n";
import { PASSAGE_ROWS_TO_EXPORT } from "../constants";
import { AppStateModel, PassageModel } from "../models";
import addressToString from "./addressToString";
import timeToString from "./timeToString";

export const passagesToCSV: (state: AppStateModel) => string | false = (state) => {
  const headersRow: string[] = [];
  const dataRows: string[][] = [];
  const passages = state.passages;
  passages.map((p,verseIndex) => {
    return Object.entries(p).map(([key, value]) => {
      if(PASSAGE_ROWS_TO_EXPORT.includes(key as keyof PassageModel)){

        if(!dataRows[verseIndex] || !dataRows[verseIndex].length){
          dataRows[verseIndex] = []
        }
        //adding key one by one to save order of columns
        if(!verseIndex){
          headersRow.push(key)
        }
        let newValue = value;
        switch(key){
          case "address": newValue = addressToString(value, createT(state.settings.translations.filter(t => t.id == p.verseTranslation)[0].addressLanguage));break;
          case "dateCreated": newValue = timeToString(value);break;
          case "dateTested": newValue = timeToString(value);break;
          case "verseTranslation": newValue = state.settings.translations.filter(t => t.id == value)[0].name;break;
        }
        dataRows[verseIndex].push(JSON.stringify(newValue))
      }
    })
  })
  return arrayToCSV(headersRow, dataRows)
}

export const CSVToPassages: (dataString: string, state: AppStateModel) => PassageModel[] | false = (dataString, state) => {
  const {headers, data} = CSVToArray(dataString)
  //check validity
  
  const dataRowsAndHeadersLengthDifference = 
  data.map(row =>
    Math.abs(headers.length - row.length)
  ).reduce((ps, s) => {
    return ps + s;
  }, 0)
  if(dataRowsAndHeadersLengthDifference !== 0){
    return false;
  }
  return false;
}

export const arrayToCSV: (headersRow: string[], dataRows: string[][]) => string | false = (headersRow, dataRows) => {
  if(!headersRow || !dataRows || !headersRow.length || !dataRows.length){
    return false
  }
  //cheking if table has the same number of culumon in each row
  //headers row is a control one
  const dataRowsAndHeadersLengthDifference = 
  dataRows.map(row =>
    Math.abs(headersRow.length - row.length)
  ).reduce((ps, s) => {
    return ps + s;
  }, 0)
  if(dataRowsAndHeadersLengthDifference !== 0){
    return false
  }
  //encoding
  return [headersRow].concat(dataRows.map(row => {//each row
    const rowToSave = row.map(cell => {//each cell
      
      let cellToSave = cell.replace(/"/g, "'").replace(/\n/g, "%2F")//shielding
      if(cellToSave.includes(",")) {
        cellToSave = `"${cellToSave}"`;
      }
      return cellToSave;
    }).join(",");
    return rowToSave;
  })).join("\r\n");
};

export const CSVToArray: (dataString: string) => {headers: string[], data: string[][]} = (dataString) => {
  let str = dataString;
  let arr:string[][] = [];
  let quote = false;
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col]?.replace(/(%2F)/g, "\n") || "";
    if (cc === "\"" && quote && nc === "\"") { arr[row][col] += cc; ++c; continue; }
    if (cc === "\"") { quote = !quote; continue; }
    if (cc === "," && !quote) { ++col; continue; }
    if (cc === "\r" && nc === "\n" && !quote) { ++row; col = 0; ++c; continue; }
    if (cc === "\n" && !quote) { ++row; col = 0; continue; }
    if (cc === "\r" && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return {
    headers: arr[0],
    data: arr.splice(1)
  }
}