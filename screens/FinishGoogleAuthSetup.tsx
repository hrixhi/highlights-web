import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';
import alert from '../components/Alert';

import { connectGoogleOauth } from '../graphql/QueriesAndMutations';
import { useApolloClient } from '@apollo/client';
import axios from 'axios';
import { apiURL } from '../constants/zoomCredentials';

export default function FinishGoogleAuthSetup({ navigation, route }: StackScreenProps<any, 'google_auth'>) {
    const server = useApolloClient();

    React.useEffect(() => {
        (async () => {
            if (Platform.OS === 'web') {
                // check URL over here

                const code = route?.params?.code;

                // Need to redirect to Google integration page only if user is authenticated
                const u = await AsyncStorage.getItem('user');

                if (code && u) {
                    const user = await JSON.parse(u);

                    server
                        .mutate({
                            mutation: connectGoogleOauth,
                            variables: {
                                code,
                                userId: user._id,
                            },
                        })
                        .then(async (res) => {
                            if (res.data && res.data.user.connectGoogleOauth) {
                                const u = await AsyncStorage.getItem('user');
                                if (!u) {
                                    return;
                                }
                                const user = JSON.parse(u);
                                user.googleIntegrated = true;
                                const updatedUser = JSON.stringify(user);
                                await AsyncStorage.setItem('user', updatedUser);
                                alert('Google Integration active!');

                                // Redirect back to /
                                window.location.href = origin;
                            } else {
                                alert('Failed to connect to Google.');
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    if (!u) {
                        window.location.href = `${origin}/login?redirect=google`;
                        return;
                    }

                    const user = JSON.parse(u);

                    if (!user._id) {
                        window.location.href = `${origin}/login?redirect=google`;
                    } else if (user.googleIntegrated) {
                        alert('Your Google account is already connected!');
                        window.location.href = origin;
                    } else {
                        // Redirect to Google integration

                        // Axios call to get the redirect URL
                        const response = await axios.get(apiURL + '/google_auth_url');

                        if (response.status === 200) {
                            const url = response.data.authorizeUrl;
                            // Open in same tab to avoid redundant tabs
                            window.location.href = url;
                        } else {
                            const error = response.data.error ? response.data.error : 'Failed to redirect to Google.';
                            alert(error);
                        }
                    }
                }
            }
        })();
    }, []);

    return null;
}
