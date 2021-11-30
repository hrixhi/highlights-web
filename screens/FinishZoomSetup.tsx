import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';
import OneSignal from 'react-onesignal';
import alert from '../components/Alert';
import { fetchAPI } from '../graphql/FetchAPI';
import { connectZoom } from '../graphql/QueriesAndMutations';

export default function FinishZoomSetup({ navigation, route }: StackScreenProps<any, 'zoom_auth'>) {
    React.useEffect(() => {
        if (Platform.OS === 'web') {
            // check URL over here

            const code = route?.params?.code;
            const userId = route?.params?.state;

            if (!code || !userId) {
                // DEV
                window.location.href = 'http://localhost:19006';
                // LIVE
                // window.location.href = 'https://web.cuesapp.co';
            }

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: connectZoom,
                    variables: {
                        code,
                        userId
                    }
                })
                .then(async res => {
                    if (res.data && res.data.user.connectZoom) {
                        const u = await AsyncStorage.getItem('user');
                        if (!u) {
                            return;
                        }
                        const user = JSON.parse(u);
                        user.zoomInfo = res.data.user.connectZoom;
                        const updatedUser = JSON.stringify(user);
                        await AsyncStorage.setItem('user', updatedUser);
                        alert('Zoom connected!');
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }, []);

    return null;
}
