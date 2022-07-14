import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client';
import React, { useEffect, useReducer, useState } from 'react';
import {
    getCuesFromCloud,
    getSubscriptions,
    handleSaveCue,
    markAsRead,
    saveCuesToCloud,
} from '../graphql/QueriesAndMutations';
import { omitTypename } from '../helpers/omitTypename';

import OneSignalReact from 'react-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { origin } from '../constants/zoomCredentials';

export const AppContext = React.createContext<{ [label: string]: any }>({});

export const useAppContext = () => React.useContext(AppContext);

export const AppContextProvider: React.FC<React.ReactNode> = ({ value, children }) => {
    // NEED TO SWITCH TO USE REDUCER TO HANDLE QUEING FUNCTIONS

    const initialState = {
        // DATA
        userId: value.userId,
        user: undefined,
        org: undefined,
        subscriptions: undefined,
        allCues: undefined,
        cues: undefined,
        customCategories: [],
        // LOADING STATES
        savingCueToCloud: false,
        syncingCueFromBackend: false,
        syncCueError: false,
    };

    const [onlineStatus, setOnlineStatus] = useState<boolean>(true);
    const [openMessageId, setOpenMessageId] = useState('');
    const [openChannelId, setOpenChannelId] = useState('');

    // useEffect(() => {
    //     window.addEventListener('offline', () => {
    //         setOnlineStatus(false);
    //     });
    //     window.addEventListener('online', () => {
    //         setOnlineStatus(true);
    //     });

    //     return () => {
    //         window.removeEventListener('offline', () => {
    //             setOnlineStatus(false);
    //         });
    //         window.removeEventListener('online', () => {
    //             setOnlineStatus(true);
    //         });
    //     };
    // }, []);

    const setCuesHelper = (data: any[]) => {
        const cuesMap: any = {};
        data.map((x: any) => {
            const cue = JSON.parse(JSON.stringify(x), omitTypename);

            const channelId = cue.channelId && cue.channelId !== '' ? cue.channelId : 'local';

            if (cuesMap[channelId]) {
                cuesMap[channelId].push({ ...cue });
            } else {
                cuesMap[channelId] = [{ ...cue }];
            }
        });
        const custom: any = {};
        if (cuesMap['local']) {
            cuesMap['local'].map((item: any) => {
                if (item.customCategory !== '') {
                    if (!custom[item.customCategory]) {
                        custom[item.customCategory] = 0;
                    }
                }
            });
        } else {
            cuesMap['local'] = [];
        }

        const customC: any[] = Object.keys(custom);
        customC.sort();

        const cuesArray: any[] = [];

        Object.keys(cuesMap).map((key) => {
            cuesMap[key].map((cue: any, index: number) => {
                cuesArray.push({
                    ...cue,
                    key,
                    index,
                });
            });
        });

        return {
            cues: cuesMap,
            allCues: cuesArray,
            customCategories: customC,
        };
    };

    const reducer = (state: any, action: any) => {
        switch (action.type) {
            // CUES LOGIC
            case 'SET_CUES':
                const res = setCuesHelper([...action.payload]);
                return {
                    ...state,
                    cues: res.cues,
                    allCues: res.allCues,
                    customCategories: res.customCategories,
                };
            case 'ADD_CUE':
                const newRes = setCuesHelper([...state.allCues, action.payload]);

                return {
                    ...state,
                    cues: newRes.cues,
                    allCues: newRes.allCues,
                    customCategories: newRes.customCategories,
                };

            case 'UPDATE_CUE':
                let updateAllCues = [...state.allCues];

                updateAllCues = updateAllCues.filter((c: any) => c._id !== action.payload._id);

                updateAllCues.push(action.payload);

                const updateRes = setCuesHelper(updateAllCues);

                return {
                    ...state,
                    cues: updateRes.cues,
                    allCues: updateRes.allCues,
                    customCategories: updateRes.customCategories,
                };

            case 'REMOVE_CUE':
                let removeDeletedCue = [...state.allCues];

                removeDeletedCue = removeDeletedCue.filter((c: any) => c._id !== action.payload);

                const deleteRes = setCuesHelper(removeDeletedCue);

                return {
                    ...state,
                    cues: deleteRes.cues,
                    allCues: deleteRes.allCues,
                    customCategories: deleteRes.customCategories,
                };

            case 'MARK_CUE_READ':
                let markReadCues = [...state.allCues];

                markReadCues = markReadCues.map((cue: any) => {
                    if (cue._id === action.payload) {
                        return {
                            ...cue,
                            status: 'read',
                        };
                    } else {
                        return {
                            ...cue,
                        };
                    }
                });

                const updateRead = setCuesHelper(markReadCues);

                return {
                    ...state,
                    cues: updateRead.cues,
                    allCues: updateRead.allCues,
                    customCategories: updateRead.customCategories,
                };

            case 'SUBMISSION_DRAFT_UPDATE':
                let updateDraftCues = [...state.allCues];

                updateDraftCues = updateDraftCues.map((cue: any) => {
                    if (cue._id === action.payload.cueId) {
                        return {
                            ...cue,
                            cue: action.payload.cue,
                        };
                    } else {
                        return {
                            ...cue,
                        };
                    }
                });

                const updateDraft = setCuesHelper(updateDraftCues);

                return {
                    ...state,
                    cues: updateDraft.cues,
                    allCues: updateDraft.allCues,
                    customCategories: updateDraft.customCategories,
                };

            case 'RELEASE_SUBMISSION':
                let releaseSubmissionCues = [...state.allCues];

                releaseSubmissionCues = releaseSubmissionCues.map((cue: any) => {
                    if (cue._id === action.payload) {
                        return {
                            ...cue,
                            releaseSubmissionCues,
                        };
                    } else {
                        return {
                            ...cue,
                        };
                    }
                });

                const updateReleaseSubmission = setCuesHelper(releaseSubmissionCues);

                return {
                    ...state,
                    cues: updateReleaseSubmission.cues,
                    allCues: updateReleaseSubmission.allCues,
                    customCategories: updateReleaseSubmission.customCategories,
                };

            case 'SET_SUBSCRIPTIONS':
                return {
                    ...state,
                    subscriptions: action.payload,
                };

            case 'SET_USER':
                return {
                    ...state,
                    user: action.payload,
                };
            case 'SET_ORG':
                return {
                    ...state,
                    org: action.payload,
                };
            case 'SAVING_CUE_TO_CLOUD':
                return {
                    ...state,
                    savingCueToCloud: action.payload,
                };
            case 'LOGOUT':
                return {
                    ...state,
                    userId: '',
                    user: undefined,
                    org: undefined,
                    subscriptions: undefined,
                    allCues: undefined,
                    cues: undefined,
                    customCategories: [],
                    // LOADING STATES
                    savingCueToCloud: false,
                };
            case 'SYNCING_CUE_FROM_BACKEND':
                return {
                    ...state,
                    syncingCueFromBackend: action.payload,
                };
            case 'SYNC_CUE_FROM_BACKEND':
                //
                const newCue = action.payload.cue;
                const error = action.payload.error;

                if (error) {
                    return {
                        ...state,
                        syncCueError: true,
                    };
                }

                //
                let syncCues = [...state.allCues];

                syncCues = syncCues.filter((c: any) => c._id !== newCue._id);

                syncCues.push(newCue);

                const syncRes = setCuesHelper(syncCues);

                return {
                    ...state,
                    cues: syncRes.cues,
                    allCues: syncRes.allCues,
                    customCategories: syncRes.customCategories,
                    syncCueError: false,
                };

            default:
                throw Error('No action matches', action.type);
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    const [sortBy, setSortBy] = useState(value.sortByWorkspace);
    const [recentSearches, setRecentSearches] = useState(value.recentSearches);

    const server = useApolloClient();

    console.log('STATE', state);

    const [fetchSubs, { loading: loadingSubs, error: subsError, data: subsData }] = useLazyQuery(getSubscriptions, {
        variables: { userId: state.userId },
    });

    const [fetchCues, { loading: loadingCues, error: cuesError, data: cuesData }] = useLazyQuery(getCuesFromCloud, {
        variables: { userId: state.userId },
    });

    const [markCueRead, { loading: markingCueAsRead, data: markCueReadStatus }] = useMutation(markAsRead);

    const refreshCues = () => {
        fetchCues();
    };

    const refreshSubscriptions = () => {
        fetchSubs();
    };

    useEffect(() => {
        if (subsData) {
            handleSetSubscriptions(subsData.subscription.findByUserId);
        }
    }, [subsData]);

    useEffect(() => {
        if (cuesData) {
            handleSetCues(cuesData.cue.getCuesFromCloud);
        }
    }, [cuesData]);

    const handleSetUser = (data: any) => {
        const u = JSON.parse(JSON.stringify(data), omitTypename);

        dispatch({
            type: 'SET_USER',
            payload: u,
        });
    };

    const handleSetOrg = (data: any) => {
        dispatch({
            type: 'SET_ORG',
            payload: data,
        });
    };

    const handleSetSubscriptions = (data: any) => {
        const subscriptions = [...data];

        const sortedSubs = subscriptions.sort((a: any, b: any) => {
            if (a.channelName < b.channelName) {
                return -1;
            }
            if (a.channelName > b.channelName) {
                return 1;
            }
            return 0;
        });
        dispatch({
            type: 'SET_SUBSCRIPTIONS',
            payload: sortedSubs,
        });
    };

    const handleSetCues = (data: any) => {
        dispatch({
            type: 'SET_CUES',
            payload: data || [],
        });
    };

    // SAVE CUES TO CLOUD FUNCTION
    const handleUpdateCue = async (cueInput: any, create: boolean) => {
        console.log('HANDLE UPDATE CUE CALLED');

        if (state.savingCueToCloud || !state.allCues) return;

        const cue = {
            ...cueInput,
            _id: cueInput._id.toString(),
            color: cueInput.color.toString(),
            date: new Date(cueInput.date).toISOString(),
            gradeWeight: cueInput.submission && cueInput.gradeWeight ? cueInput.gradeWeight.toString() : undefined,
            endPlayAt:
                cueInput.endPlayAt && cueInput.endPlayAt !== '' ? new Date(cueInput.endPlayAt).toISOString() : '',
            allowedAttempts:
                cueInput.allowedAttempts && cueInput.allowedAttempts !== null
                    ? cueInput.allowedAttempts.toString()
                    : null,
            totalPoints: cueInput.totalPoints ? cueInput.totalPoints.toString() : null,
        };

        delete cue.score;
        delete cue.graded;
        delete cue.submittedAt;
        delete cue.comment;
        delete cue.folderId;
        delete cue.unreadThreads;
        delete cue.status;
        delete cue.channelName;
        delete cue.key;
        delete cue.index;

        dispatch({
            type: 'SAVING_CUE_TO_CLOUD',
            payload: true,
        });

        const res = await server.mutate({
            mutation: handleSaveCue,
            variables: {
                userId: state.userId,
                cue,
                create,
            },
        });

        if (res.data && res.data.cue.handleSaveCue) {
            // UPDATE LOCAL STATE FOR CUES
            if (create) {
                dispatch({
                    type: 'ADD_CUE',
                    payload: res.data.cue.handleSaveCue,
                });
            } else {
                // Filter out modified cue

                dispatch({
                    type: 'UPDATE_CUE',
                    payload: res.data.cue.handleSaveCue,
                });
            }

            dispatch({
                type: 'SAVING_CUE_TO_CLOUD',
                payload: false,
            });

            return true;
        } else {
            dispatch({
                type: 'SAVING_CUE_TO_CLOUD',
                payload: false,
            });
            return false;
        }
    };

    const handleAddCue = (cue: any) => {
        dispatch({
            type: 'ADD_CUE',
            payload: cue,
        });
    };

    const handleDeleteCue = (cueId: string) => {
        dispatch({
            type: 'REMOVE_CUE',
            payload: cueId,
        });
    };

    const handleReadCue = (cueId: string) => {
        markCueRead({
            variables: {
                cueId,
                userId: state.userId,
            },
        });

        dispatch({
            type: 'MARK_CUE_READ',
            payload: cueId,
        });
    };

    const handleSubmissionDraftUpdate = (cueId: string, cue: any) => {
        dispatch({
            type: 'SUBMISSION_DRAFT_UPDATE',
            payload: {
                cueId,
                cue,
            },
        });
    };

    const syncCueFromBackend = (cue: any, error: boolean) => {
        dispatch({
            type: 'SYNC_CUE_FROM_BACKEND',
            payload: {
                cue,
                error,
            },
        });
    };

    const changeSyncingCueFromBackend = (syncing: boolean) => {
        dispatch({
            type: 'SYNCING_CUE_FROM_BACKEND',
            payload: syncing,
        });
    };

    const handleCueReleaseSubmissionStatus = (cueId: string, releaseSubmission: boolean) => {
        dispatch({
            type: 'RELEASE_SUBMISSION',
            payload: releaseSubmission,
        });
    };

    // AUTHENTICATION FUNCTIONS (ADD LOGIN FOR DESKTOP AND NATIVE APPS)
    const logoutUser = async () => {
        OneSignalReact.removeExternalUserId();
        await AsyncStorage.clear();

        dispatch({
            type: 'LOGOUT',
        });

        window.location.href = `${origin}/login`;
    };

    return (
        <AppContext.Provider
            displayName="APP CONTEXT"
            value={{
                userId: state.userId,
                user: state.user,
                handleSetUser,
                org: state.org,
                handleSetOrg,
                subscriptions: state.subscriptions,
                handleSetSubscriptions,
                allCues: state.allCues,
                cues: state.cues,
                handleSetCues,
                customCategories: state.customCategories,
                sortBy,
                setSortBy,
                recentSearches,
                setRecentSearches,
                refreshSubscriptions,
                savingCueToCloud: state.savingCueToCloud,
                handleUpdateCue,
                handleDeleteCue,
                handleAddCue,
                refreshCues,
                logoutUser,
                handleReadCue,
                syncCueFromBackend,
                changeSyncingCueFromBackend,
                syncingCueFromBackend: state.syncingCueFromBackend,
                syncCueError: state.syncCueError,
                onlineStatus,
                handleCueReleaseSubmissionStatus,
                handleSubmissionDraftUpdate,
                openMessageId,
                setOpenMessageId,
                openChannelId,
                setOpenChannelId,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
