import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform, Alert } from 'react-native';
import OneSignal from 'react-onesignal';
import alert from '../components/Alert';

import { connectZoom } from '../graphql/QueriesAndMutations';
import { origin, zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';

export default function FinishZoomSetup({ navigation, route }: StackScreenProps<any, 'zoom_auth'>) {
    const server = useApolloClient();

    React.useEffect(() => {
        (async () => {
            if (Platform.OS === 'web') {
                // check URL over here

                const code = route?.params?.code;
                const userId = route?.params?.state;

                if (code && userId) {
                    server
                        .mutate({
                            mutation: connectZoom,
                            variables: {
                                code,
                                userId,
                            },
                        })
                        .then(async (res) => {
                            if (res.data && res.data.user.connectZoom) {
                                const u = await AsyncStorage.getItem('user');
                                if (!u) {
                                    return;
                                }
                                const user = JSON.parse(u);
                                user.zoomInfo = res.data.user.connectZoom;
                                const updatedUser = JSON.stringify(user);
                                await AsyncStorage.setItem('user', updatedUser);
                                alert('Zoom account connected!');

                                // Redirect back to /
                                window.location.href = origin;
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    // Need to redirect to Zoom integration page if user is authenticated
                    const u = await AsyncStorage.getItem('user');

                    if (!u) {
                        window.location.href = `${origin}/login?redirect=zoom`;
                        return;
                    }

                    const user = JSON.parse(u);

                    if (!user._id) {
                        window.location.href = `${origin}/login?redirect=zoom`;
                    } else if (user.zoomInfo) {
                        alert('Your Zoom account is already connected!');
                        window.location.href = origin;
                    } else {
                        // Redirect to Zoom integration
                        const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                            zoomRedirectUri
                        )}&state=${user._id}`;

                        window.open(url, '_blank');
                    }
                }
            }
        })();
    }, []);

    return null;
}
