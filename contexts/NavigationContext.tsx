import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client';
import React, { useEffect, useReducer, useState } from 'react';

export const NavigationContext = React.createContext<{ [label: string]: any }>({});

export const useNavigationContext = () => React.useContext(NavigationContext);

export const NavigationContextProvider: React.FC<React.ReactNode> = ({ value, children }) => {
    const initialState = {
        // DATA
        theme: 'light',
        route: 'home',
        history: [],
        home: {
            showEventForm: false,
            editEvent: undefined,
        },
        courses: {},
        inbox: {},
        myNotes: {},
        settings: {},
        profile: {},
        notifications: {},
        create: {},
        view: {},
        hideNavbar: false,
        viewCourse: {
            courseId: undefined,
            activeCourseTab: 'overview',
            activeClassroomTab: undefined,
            showNewPostModal: false,
            selectedThreadId: undefined,
            selectedPlaylist: undefined,
        },
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

    const setHideNavbar = (hide: string) => {
        dispatch({
            type: 'CHANGE_HIDE_NAVBAR',
            payload: hide,
        });
    };

    // HOME

    const showAddEvent = () => {
        dispatch({
            type: 'SHOW_ADD_EVENT',
        });
    };

    const setEditEvent = (editEvent: any) => {
        dispatch({
            type: 'SET_EDIT_EVENT',
            payload: editEvent,
        });
    };

    const closeEventForm = () => {
        dispatch({
            type: 'CLOSE_EVENT_FORM',
        });
    };

    // COURSES

    const openCourse = (courseId: string) => {
        dispatch({
            type: 'SET_VIEW_COURSE',
            payload: courseId,
        });
    };

    const exitCourse = () => {
        dispatch({
            type: 'EXIT_COURSE',
        });
    };

    // View Course

    const switchCourseActiveTab = (tab: string) => {
        dispatch({
            type: 'SWITCH_COURSE_TAB',
            payload: tab,
        });
    };

    const switchClassroomActiveTab = (tab?: string) => {
        dispatch({
            type: 'SET_CLASSROOM_TAB',
            payload: tab,
        });
    };

    const setShowNewPostModal = (show: boolean) => {
        dispatch({
            type: 'SET_SHOW_NEW_DISCUSSION',
            payload: show,
        });
    };

    const setSelectedThreadId = (threadId: string) => {
        dispatch({
            type: 'SET_SELECTED_THREAD_ID',
            payload: threadId,
        });
    };

    const setSelectedPlaylist = (playlist: any) => {
        dispatch({
            type: 'SET_SELECTED_PLAYLIST',
            payload: playlist,
        });
    };

    // REDUCER

    const reducer = (state: any, action: any) => {
        const history = [...state.history];

        switch (action.type) {
            case 'CHANGE_THEME':
                return {
                    ...state,
                    theme: action.payload,
                };
            case 'SET_ROUTE':
                return {
                    ...state,
                    route: action.payload,
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
            case 'HIDE_NAVBAR':
                return {
                    ...state,
                    hideNavbar: action.payload,
                };
            case 'SHOW_ADD_EVENT':
                history.push({
                    route: 'home',
                    location: 'NEW_EVENT',
                });

                return {
                    ...state,
                    home: Object.assign({}, state.home, {
                        showEventForm: true,
                    }),
                    hideNavbar: true,
                    history,
                };
            case 'SET_EDIT_EVENT':
                history.push({
                    route: 'home',
                    location: 'EDIT_EVENT',
                    payload: action.payload,
                });

                return {
                    ...state,
                    home: Object.assign({}, state.home, {
                        showEventForm: true,
                        editEvent: action.payload,
                    }),
                    hideNavbar: true,
                    history,
                };
            case 'CLOSE_EVENT_FORM':
                return {
                    ...state,
                    home: Object.assign({}, state.home, {
                        showEventForm: false,
                        editEvent: undefined,
                    }),
                    hideNavbar: false,
                };
            case 'SET_VIEW_COURSE':
                return {
                    ...state,
                    route: 'viewCourse',
                    viewCourse: Object.assign({}, state.viewCourse, {
                        courseId: action.payload,
                        activeCourseTab: 'overview',
                    }),
                    hideNavbar: true,
                };
            case 'EXIT_COURSE':
                return {
                    ...state,
                    route: 'courses',
                    viewCourse: Object.assign({}, state.viewCourse, {
                        courseId: undefined,
                        activeCourseTab: 'overview',
                    }),
                    hideNavbar: false,
                };
            case 'SWITCH_COURSE_TAB':
                return {
                    ...state,
                    viewCourse: Object.assign({}, state.viewCourse, {
                        activeCourseTab: action.payload,
                    }),
                };
            case 'SET_CLASSROOM_TAB':
                return {
                    ...state,
                    viewCourse: Object.assign({}, state.viewCourse, {
                        activeClassroomTab: action.payload,
                    }),
                };
            case 'SET_SHOW_NEW_DISCUSSION':
                return {
                    ...state,
                    viewCourse: Object.assign({}, state.viewCourse, {
                        showNewPostModal: action.payload,
                    }),
                };
            case 'SET_SELECTED_THREAD_ID':
                return {
                    ...state,
                    viewCourse: Object.assign({}, state.viewCourse, {
                        selectedThreadId: action.payload,
                    }),
                };
            case 'SET_SELECTED_PLAYLIST':
                return {
                    ...state,
                    viewCourse: Object.assign({}, state.viewCourse, {
                        selectedPlaylist: action.payload,
                    }),
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
                courses: state.courses,
                inbox: state.inbox,
                myNotes: state.myNotes,
                settings: state.settings,
                profile: state.profile,
                notifications: state.notifications,
                create: state.create,
                view: state.view,
                hideNavbar: state.hideNavbar,
                viewCourse: state.viewCourse,
                // ACTIONS
                changeTheme,
                switchRoute,
                setHideNavbar,
                showAddEvent,
                setEditEvent,
                closeEventForm,
                openCourse,
                exitCourse,
                switchCourseActiveTab,
                switchClassroomActiveTab,
                setShowNewPostModal,
                setSelectedThreadId,
                setSelectedPlaylist,
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};
