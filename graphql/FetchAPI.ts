import ApolloClient from 'apollo-boost';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { origin } from '../constants/zoomCredentials';

export const fetchAPI = (userId: any) => {
    const uri = 'http://localhost:8081/';
    // const uri = 'https://api.learnwithcues.com';

    const logoutUser = async () => {
        await AsyncStorage.clear();
        window.location.href = `${origin}/login`;
    };

    return new ApolloClient({
        uri,
        headers: {
            userId,
        },
        fetchOptions: {
            credentials: 'include',
        },
        request: async (operation) => {
            const token = await AsyncStorage.getItem('jwt_token');
            operation.setContext({
                headers: {
                    authorization: token || '',
                },
            });
        },
        onError: ({ graphQLErrors, networkError }) => {
            if (graphQLErrors) {
                console.log('Graphql Errors', graphQLErrors);
            }
            if (graphQLErrors) {
                for (let err of graphQLErrors) {
                    if (err.message === 'NOT_AUTHENTICATED') {
                        alert('Session Timed out. You will be logged out.');
                        logoutUser();
                        return;
                    }
                }
            }
            if (networkError) {
                // logoutUser();
                console.log(networkError);
            }
        },
    });
};
