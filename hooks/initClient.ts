import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const useAppClient = () => {
    const [userId, setUserId] = useState<string>('');
    const [sortByWorkspace, setSortByWorkspace] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState(true);
    const [recentSearches, setRecentSearches] = useState([]);
    const [theme, setTheme] = useState('light');

    // Init
    useEffect(() => {
        fetchUserFromStorage();
    }, []);

    const fetchUserFromStorage = async () => {
        const items = await AsyncStorage.multiGet(['user', 'sortByWorkspace', 'recentSearches', 'theme']);

        console.log('Items', items);
        if (items[0] && items[0][1]) {
            // FETCH ALL ASYNC ITEMS AT ONCE
            const parsedUser = await JSON.parse(items[0][1]);

            setUserId(parsedUser._id);
            setSortByWorkspace(items[1][1] ? items[1][1] : 'Date ↑');
            if (items[2][1]) {
                setRecentSearches(JSON.parse(items[2][1]));
            }

            if (items[3][1]) {
                setTheme(items[3][1]);
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
        theme,
    };
};
