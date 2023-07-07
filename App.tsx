import { VERSION, storageName } from './src/constants';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { AppStateModel } from './src/models';
import { Navigator } from './src/navigator';
import { createAppState } from './src/initials';
import storage from './src/storage';
import { convertState } from './src/tools/stateVersionConvert';
import { ToastAndroid } from 'react-native';

export default function App() {
    const [isReady, setReady] = useState(false);
    const [state, setState]: [
        AppStateModel,
        Dispatch<SetStateAction<AppStateModel>>
    ] = useState(createAppState);

    useEffect(() => {
        storage
            .load({
                key: `${storageName}`
            })
            .then((data) => {
                const dataObj: AppStateModel = data as AppStateModel;
                //check if version is correct
                if (dataObj.version === VERSION) {
                    setState(data);
                    setReady(true);
                } else {
                    //if versions does not match
                    //try to convert
                    storage
                        .save({
                            key: `${storageName}${dataObj.version}`,
                            data: dataObj
                        })
                        .then(() => {
                            const convertedState = convertState(dataObj);
                            if (convertedState) {
                                ToastAndroid.show(
                                    `State converted from ${dataObj.version} to ${VERSION}`,
                                    10000
                                );
                                storage
                                    .save({
                                        key: `${storageName}`,
                                        data: dataObj
                                    })
                                    .then(() => {
                                        setState(convertedState);
                                        setReady(true);
                                    });
                            } else {
                                //if it is not possible to convert create new one with backup
                                ToastAndroid.show(
                                    'Error with convering app state. Backup saved.',
                                    10000
                                );
                                setState(createAppState);
                                setReady(true);
                            }
                        });
                }
            })
            .catch((e) => {
                ToastAndroid.show(e, 10000);
                console.error(e);
                setReady(true);
            });
    });

    return <>{isReady && <Navigator state={state} />}</>;
}
