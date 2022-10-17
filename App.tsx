import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation/Navigator';
import * as SplashScreen from 'expo-splash-screen';
import './styles';
import './web/htmlParser.css';
import './web/mobiscrollCustom.css';
import './web/vex.css';
import './node_modules/froala-editor/css/themes/dark.min.css';
import './node_modules/froala-editor/css/themes/gray.min.css';
import './node_modules/froala-editor/css/themes/royal.min.css';

import { LanguageProvider } from './helpers/LanguageContext';
import { MenuProvider } from 'react-native-popup-menu';

import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider, from, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppClient } from './hooks/initClient';
import { AppContextProvider } from './contexts/AppContext';
import { NavigationContextProvider } from './contexts/NavigationContext';
import { apiURL, origin } from './constants/zoomCredentials';

import LinkingConfiguration from './navigation/Linking';

export default function App() {
    const isLoadingComplete = useCachedResources();
    const colorScheme = useColorScheme();

    const { userId, isConnecting, sortByWorkspace, recentSearches, setUserId, theme } = useAppClient();

    const httpLink = new HttpLink({
        uri: apiURL,
    });

    const withUserInfo = setContext(async () => {
        const token = await AsyncStorage.getItem('jwt_token');
        const u = await AsyncStorage.getItem('user');

        if (u && token) {
            const user: any = await JSON.parse(u);
            return { token, userId: user._id };
        }

        return {
            token: '',
            userId: '',
        };
    });

    // let timeoutMessageDisplayed = false;

    const logoutUser = async () => {
        await AsyncStorage.clear();

        window.location.href = `${origin}/login`;
    };

    const withToken = new ApolloLink((operation, forward) => {
        const { token, userId } = operation.getContext();
        operation.setContext(() => ({
            headers: {
                Authorization: token ? token : '',
                userId,
            },
        }));
        return forward(operation);
    });

    const resetToken = onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
            console.log('Graphql Errors', graphQLErrors);
        }
        if (graphQLErrors) {
            for (let err of graphQLErrors) {
                if (err.message === 'NOT_AUTHENTICATED') {
                    // alert('Session Timed out. You will be logged out.');
                    // timeoutMessageDisplayed = true;
                    setUserId('');
                    logoutUser();
                    return;
                }
            }
        }
        if (networkError) {
            // logoutUser();
            console.log(networkError);
        }
    });

    // CURRENTLY DISABLING CACHE, WILL USE IN FUTURE
    const defaultOptions = {
        watchQuery: {
            fetchPolicy: 'network-only',
        },
        query: {
            fetchPolicy: 'network-only',
        },
    };

    const client = new ApolloClient({
        cache: new InMemoryCache(),
        link: from([withUserInfo, withToken.concat(resetToken), httpLink]),
        defaultOptions,
    });

    const longerSplashScreen = useCallback(async () => {
        await SplashScreen.preventAutoHideAsync();
        const a: any = new Date();
        let b: any = new Date();
        while (b - a < 1000) {
            b = new Date();
        }
        await SplashScreen.hideAsync();
    }, []);

    useEffect(() => {
        longerSplashScreen();
    }, []);

    if (!isLoadingComplete || isConnecting) {
        return null;
    } else {
        return (
            <ApolloProvider client={client}>
                <AppContextProvider
                    value={{
                        userId,
                        sortByWorkspace,
                        recentSearches,
                    }}
                    key={userId}
                >
                    <NavigationContextProvider
                        value={{
                            theme,
                        }}
                    >
                        <SafeAreaProvider style={styles.font}>
                            <MenuProvider>
                                <LanguageProvider>
                                    <Navigation colorScheme={colorScheme} />
                                </LanguageProvider>
                            </MenuProvider>
                            <StatusBar />
                        </SafeAreaProvider>
                    </NavigationContextProvider>
                </AppContextProvider>
            </ApolloProvider>
        );
    }
}

const styles: any = StyleSheet.create({
    font: {
        maxHeight: '100%',
    },
});
