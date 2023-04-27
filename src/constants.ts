import { StyleSheet } from "react-native";

export const VERSION = "1.0.0"

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
  color: '#ECECEC',
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
    justifyContent: "center"
  },
  view: {
    backgroundColor: COLOR.bg,
    width:"100%",
    height: "100%",
    alignItems: "center"
  },
  text: {
    color: COLOR.color
  }
});

