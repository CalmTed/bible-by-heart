import { StatusBar } from 'expo-status-bar';
import { storageName } from './src/constants';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { AppStateModel } from './src/models';
import { Navigator } from './src/navigator';
import { createAppState } from './src/initials';
import storage from './src/storage';

export default function App() {
    const [isReady, setReady] = useState(false);
    const [state, setState]: [
        AppStateModel,
        Dispatch<SetStateAction<AppStateModel>>
    ] = useState(createAppState);

    useEffect(() => {
        storage
            .load({
                key: storageName
            })
            .then((data) => {
                setState(data);
                setReady(true);
            })
            .catch((e) => {
                console.error(e);
                setReady(true);
            });
    });

    return (
        <>
            {isReady && <Navigator state={state}/>}
            <StatusBar style="light" />
        </>
    );
}
