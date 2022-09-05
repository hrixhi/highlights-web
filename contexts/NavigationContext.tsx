import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client';
import React, { useEffect, useReducer, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { origin } from '../constants/zoomCredentials';

export const NavigationContext = React.createContext<{ [label: string]: any }>({});

export const useNavigationContext = () => React.useContext(NavigationContext);

export const NavigationContextProvider: React.FC<React.ReactNode> = ({ value, children }) => {
    const initialState = {
        // DATA
        theme: 'light',
        route: 'home',
        history: [],
        home: {},
        workspace: {},
        inbox: {},
        myNotes: {},
        settings: {},
        profile: {},
        notifications: {},
        create: {},
        view: {},
    };

    useEffect(() => {
        // Change the icons inside the button based on previous settings
        if (
            localStorage.getItem('color-theme') === 'dark' ||
            (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ) {
            dispatch({
                type: 'CHANGE_THEME',
                payload: 'dark',
            });
        } else {
            dispatch({
                type: 'CHANGE_THEME',
                payload: 'light',
            });
        }
    }, []);

    // ACTIONS

    const switchRoute = (route: string) => {
        dispatch({
            type: 'SET_ROUTE',
            payload: route,
        });
    };

    const changeTheme = (theme: string) => {
        dispatch({
            type: 'CHANGE_THEME',
            payload: theme,
        });
    };

    // REDUCER

    const reducer = (state: any, action: any) => {
        switch (action.type) {
            case 'CHANGE_THEME':
                return {
                    ...state,
                    theme: action.payload,
                };
            case 'SET_ROUTE':
                return {
                    ...state,
                };
            case 'ADD_TO_HISTORY':
                // Depending on the main route, we must store objects
                return {
                    ...state,
                };
            case 'REMOVE_FROM_HISTORY':
                return {
                    ...state,
                };
            // Depending on the main route we must remove objects such as Cues, Workspaces that have been deleted
            default:
                return {
                    ...state,
                };
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <NavigationContext.Provider
            displayName="NAVIGATION CONTEXT"
            value={{
                theme: state.theme,
                route: state.route,
                history: state.history,
                home: state.home,
                workspace: state.workspace,
                inbox: state.inbox,
                myNotes: state.myNotes,
                settings: state.settings,
                profile: state.profile,
                notifications: state.notifications,
                create: state.create,
                view: state.view,
                // ACTIONS
                changeTheme,
                switchRoute,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};
