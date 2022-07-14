import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { origin } from '../constants/zoomCredentials';

export const useAppClient = () => {
    const [userId, setUserId] = useState<string>('');
    const [sortByWorkspace, setSortByWorkspace] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState(true);
    const [recentSearches, setRecentSearches] = useState([]);

    // Init
    useEffect(() => {
        fetchUserFromStorage();
    }, []);

    const fetchUserFromStorage = async () => {
        // const user = await AsyncStorage.getItem('user');

        const items = await AsyncStorage.multiGet(['user', 'sortByWorkspace', 'recentSearches']);

        console.log('Items', items);
        if (items[0] && items[0][1]) {
            // FETCH ALL ASYNC ITEMS AT ONCE
            const parsedUser = await JSON.parse(items[0][1]);

            // const sortBy = await AsyncStorage.getItem('sortByWorkspace');
            // const recentSearches = await AsyncStorage.getItem('recentSearches');

            setUserId(parsedUser._id);
            setSortByWorkspace(items[1][1] ? items[1][1] : 'Date ↑');
            if (items[2][1]) {
                setRecentSearches(JSON.parse(items[2][1]));
            }
        } else {
            setUserId('');
            setSortByWorkspace('');
            setRecentSearches([]);
        }
        setIsConnecting(false);
    };

    return {
        userId,
        setUserId,
        isConnecting,
        sortByWorkspace,
        recentSearches,
    };
};
