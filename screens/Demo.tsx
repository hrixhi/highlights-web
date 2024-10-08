import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import Alert from '../components/Alert';
import { login } from '../graphql/QueriesAndMutations';
import { View, Text } from '../components/Themed';
import { origin } from '../constants/zoomCredentials';
import { ActivityIndicator } from 'react-native';
import { useApolloClient } from '@apollo/client';

export default function Demo({ navigation, route }: StackScreenProps<any, 'demo'>) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const server = useApolloClient();

    useEffect(() => {
        (async () => {
            setTimeout(async () => {
                const email = 'instructor@learnwithcues.com';
                const password = 'password';

                setIsLoggingIn(true);

                server
                    .query({
                        query: login,
                        variables: {
                            email,
                            password,
                        },
                    })
                    .then(async (r: any) => {
                        if (r.data.user.login.user && r.data.user.login.token && !r.data.user.login.error) {
                            const u = r.data.user.login.user;
                            const token = r.data.user.login.token;
                            if (u.__typename) {
                                delete u.__typename;
                            }

                            const sU = JSON.stringify(u);
                            await AsyncStorage.setItem('jwt_token', token);
                            await AsyncStorage.setItem('user', sU);
                            await AsyncStorage.setItem('show_onboard_modal', 'true');

                            window.location.href = origin;
                        } else {
                            const { error } = r.data.user.login;
                            setIsLoggingIn(false);
                            Alert(error);
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                        setIsLoggingIn(false);
                        Alert('Something went wrong. Try again.');
                    });
            }, 1000);
        })();
    }, []);

    return (
        <View
            style={{
                flex: 1,
                flexDirection: 'row',
                height: '100%',
                width: '100%',
            }}
        >
            <View
                style={{
                    width: '100%',
                    paddingVertical: 50,
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator color={'#000'} style={{ alignSelf: 'center' }} />
            </View>
        </View>
    );
}
