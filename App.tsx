import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from "react-native";
import { storageName } from './src/constants';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { AppStateModel } from './src/models';
import { Navigator } from './src/navigator';
import Storage from "react-native-storage";
import AsyncStorage from "@react-native-community/async-storage";
import { createAppState } from "./src/initials"

const storage = new Storage({
  size: 100,
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

export default function App() {
  const [isReady, setReady] = useState(false);
  const [state, setState] : [AppStateModel, Dispatch<SetStateAction<AppStateModel>>] = useState(createAppState);

  useEffect(() => {
    storage.load({
      key: storageName
    }).then((data) => {
      setState(data);
      setReady(true);
    }).catch((e) => {
      console.error(e)
      setReady(true);
    })
  })

  return (
    <>
        {isReady && <Navigator state={state}/>}
        <StatusBar style="light"/>
    </>
  );
  
}