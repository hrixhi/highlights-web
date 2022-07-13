import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
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
        const user = await AsyncStorage.getItem('user');
        if (user) {
            // FETCH ALL ASYNC ITEMS AT ONCE
            const parsedUser = await JSON.parse(user);
            const sortBy = await AsyncStorage.getItem('sortByWorkspace');
            const recentSearches = await AsyncStorage.getItem('recentSearches');

            setUserId(parsedUser._id);
            setSortByWorkspace(sortBy ? sortBy : 'Date ↑');
            if (recentSearches) {
                setRecentSearches(JSON.parse(recentSearches));
            }
        } else {
            setUserId('');
            setSortByWorkspace('');
            setRecentSearches('');
            // Redirect only if trying to access main app
            if (window.location.href === `${origin}`) {
                window.location.href = `${origin}/login`;
            }
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
