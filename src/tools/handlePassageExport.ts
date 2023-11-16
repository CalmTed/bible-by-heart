import { createT } from "../l10n";
import { PASSAGE_ROWS_TO_EXPORT } from "../constants";
import { AppStateModel, PassageModel } from "../models";
import addressToString from "./addressToString";
import { addressFromString } from "./addressFromString";
import { createPassage } from "../initials";
import { getAddressDifference } from "./addressDifference";



//line separated values
export const passagesToLSV: (state: AppStateModel) => string | false = (state) => {
  const headersRow: string[] = [];
  const dataRows: string[][] = [];
  const passages = state.passages;
  if(!passages.length){
    return false;
  }
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
          case "address": newValue = addressToString(value, createT(state.settings.translations.filter(t => t.id == p.verseTranslation)?.[0]?.addressLanguage || state.settings.langCode));break;
          case "verseText": newValue = value;break;
          case "verseTranslation": newValue = state.settings.translations.filter(t => t.id == value)[0]?.name || "";break;
          case "tags": newValue = value.join(",");break;
        }
        if(typeof newValue !== "string"){
          console.error(`caught non string value while encoding passages. Param: ${key}, Value: ${newValue}`);
          return false;
        }
        dataRows[verseIndex].push(newValue.replace(/\|/g, "_"))
      }
    })
  })
  return arrayToLSV(headersRow, dataRows)
}


export const arrayToLSV: (headersRow: string[], dataRows: string[][]) => string | false = (headersRow, dataRows) => {
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
  return [headersRow.join("|")].concat(dataRows.map(row => {//each row
    const rowToSave = row.map(cell => {//each cell
      let cellToSave = cell.replace(/\n/g, "%2F")//shielding
      return cellToSave;
    }).join("|");
    return rowToSave;
  })).join("\n");
};

interface importArrayModel{
  headers: string[]
  data: string[][]
}

export const LSVToArray: (dataString: string) => importArrayModel | false = (dataString) => {
  let str = dataString;
  if(!dataString.length){
    return false
  }
  let arr:string[][] = str.replace(/\r/g, "").split(/\n/).map(row => {
    return row.replace(/%2F/g,"\n").split("|")
  })
  const headersRow = arr[0];
  const dataRows = arr.splice(1)
  const dataRowsAndHeadersLengthDifference = 
  arr.map(row =>
    Math.abs(headersRow.length - row.length)
  ).reduce((ps, s) => {
    return ps + s;
  }, 0)
  if(dataRowsAndHeadersLengthDifference !== 0 || !arr[0].length){
    return false
  }
  return {
    headers: headersRow,
    data: dataRows
  }
}

interface importPassagesListModel{
  passages: PassageModel[]
  conflictedIndexes: number[]
  invalidIndexes: number[]
}

export const arrayToPassages: (decodedData: importArrayModel, state: AppStateModel) => importPassagesListModel | false = ({headers, data}, state) => {
  //validate:
      //data exists
      const dataExists = headers && data && headers.length && data.length
      //same number of columns
      const invalidIndexes: number[] = []
      const conflictedIndexes: number[] = []
      const sameColumnsNumber = 
      data.map(row =>
        Math.abs(headers.length - row.length)
        ).reduce((ps, s) => {
          return ps + s;
        }, 0) === 0
      //required headers: address
      const hasRequiredHeaders = headers.includes("address")
      //BE AWARE: we dont check for data type here b.c. we read it from strings and see all as strings even tags param(witch have , as separator)
      if(!dataExists || !sameColumnsNumber || !hasRequiredHeaders){
        return false;
      }
      //generate passages
      const importedPassages: PassageModel[] = data.map((passage, importedDataItemIndex) => {
        const addressColumnIndex = headers.indexOf("address")
        const address = addressFromString(passage[addressColumnIndex])
        if(!address){
          invalidIndexes.push(importedDataItemIndex)
          return null;
        }
        const newPassage = createPassage(address.address);

        //assigning values from imported list
        headers.map((header, headerIndex) => {
          const typedHeader = header as keyof PassageModel
          if(typedHeader === "address"){
            return;
          }
          if(typedHeader === "tags"){
            newPassage.tags = passage[headerIndex]?.split(",").filter(t => t.length).map(t => t.trim()) ?? []
          }
          if(typedHeader === "verseTranslation"){
            newPassage.verseTranslation = state.settings.translations.find(translation => translation.name === passage[headerIndex])?.id || null
          }
          //done in a hackable way on purpose
          if(typeof newPassage[typedHeader] === typeof passage[headerIndex]){
            newPassage[typedHeader] = passage[headerIndex] as never//this one is not on purpose
          }
        })
        const samePassage = state.passages.find(ep => {
          const sameAddress =  getAddressDifference(newPassage.address, ep.address) === 0;
          const sameTranslation = newPassage.verseTranslation === ep.verseTranslation;
          return sameAddress && sameTranslation;
        })
        if(samePassage){
          conflictedIndexes.push(importedDataItemIndex)
          return null;
        }
        return newPassage;
      }).filter(p => p !== null) as PassageModel[]
      
      

      return {
        passages: importedPassages,
        conflictedIndexes,
        invalidIndexes
      }
}