import { StyleSheet } from "react-native";

export const VERSION = "1.0.0"

export const API_VERSION = "0.0.1"
//cant sync with oudated version
//can convert one stare version to the new one
//recreate the state if version is outdated

export const storageName = "data"

export enum SCREEN {
  home = "home",
  listPassage = "listPassage",
  editPassage = "editPassage",
  addressPicker = "addressPicker",
  test = "test",
  testResults = "testResults",
  settings = "settings"
}

export enum LANGCODE {
  en = "en",
  ua = "ua"
}

export const COLOR = {
  bg: '#272A27',
  bgSecond: '#2C302C',
  text: '#ECECEC',
  textSecond: '#A0A0A0',
  textDanger: '#E5633B',
  mainColor: '#1A9E37',
} 

export const globalStyle = StyleSheet.create({
  screen: {
    paddingTop: 30,
    backgroundColor: COLOR.bg,
    width:"100%",
    height: "100%",
    justifyContent: "flex-start"
  },
  view: {
    backgroundColor: COLOR.bg,
    width:"100%",
    height: "100%",
    alignItems: "center"
  },
  text: {
    color: COLOR.text
  }
});

export enum TestLevel{
  l10 = "l10",
  l11 = "l11",
  l20 = "l20",
  l21 = "l21",
  l30 = "l30",
  l40 = "l40",
  l50 = "l50"
}

