import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client';

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useReducer } from 'react';
import { getChannelThreads } from '../graphql/QueriesAndMutations';

export const CourseContext = React.createContext<{ [label: string]: any }>({});

export const useCourseContext = () => React.useContext(CourseContext);

export const CourseContextProvider: React.FC<React.ReactNode> = ({ value, children }) => {
    const initialState = {
        courseData: undefined,
        overview: {},
        coursework: {
            allCues: [],
            filteredAndSortedCues: [],
            categories: [],
            sortBy: value.sortBy,
            filterStart: undefined,
            filterEnd: undefined,
        },
        discussion: {
            //
            allThreads: [],
            filteredAndSortedThreads: [],
            categories: [],
            selectedCategories: [],
            error: 'Failed to fetch.',
            selectedThreadId: '',
            searchTerm: '',
        },
        grades: {},
        meetings: {},
        settings: {},
    };

    const reducer = (state: any, action: any) => {
        switch (action.type) {
            case 'SET_COURSE_DATA':
                return {
                    ...state,
                    courseData: action.payload,
                };
            case 'SET_COURSE_CUES':
                //
                const filterCourseCues = action.payload.cues.filter((cue: any) => {
                    return cue.channelId === action.payload.courseId;
                });

                console.log('Filtered Cues', filterCourseCues);

                if (state.coursework.sortBy === 'Priority') {
                    // tempCues.reverse();
                    filterCourseCues.sort((a: any, b: any) => {
                        return a.color < b.color ? 1 : -1;
                    });
                } else if (state.coursework.sortBy === 'Date ↑') {
                    filterCourseCues.sort((a: any, b: any) => {
                        const aDate = new Date(a.date);
                        const bDate = new Date(b.date);
                        if (aDate < bDate) {
                            return 1;
                        } else if (aDate > bDate) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                } else {
                    filterCourseCues.sort((a: any, b: any) => {
                        const aDate = new Date(a.date);
                        const bDate = new Date(b.date);
                        if (aDate < bDate) {
                            return -1;
                        } else if (aDate > bDate) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                }

                let dateFilteredCues: any[] = [];

                if (state.coursework.filterStart && state.coursework.filterEnd) {
                    dateFilteredCues = filterCourseCues.filter((item: any) => {
                        const date = new Date(item.date);
                        return date >= state.coursework.filterStart && date <= state.coursework.filterEnd;
                    });
                } else {
                    dateFilteredCues = filterCourseCues;
                }

                const cueCategoriesSet: any = new Set();

                dateFilteredCues.map((cue: any) => {
                    if (!cue.customCategory) {
                        cueCategoriesSet.add('');
                    } else {
                        cueCategoriesSet.add(cue.customCategory);
                    }
                });

                return {
                    ...state,
                    coursework: Object.assign({}, state.coursework, {
                        allCues: filterCourseCues,
                        filteredAndSortedCues: dateFilteredCues,
                        categories: Array.from(cueCategoriesSet),
                    }),
                };
            case 'SET_DATE_FILTER': {
                let filteredCues: any[] = state.coursework.allCues;

                if (action.payload.filterStart && action.payload.filterEnd) {
                    filteredCues = filteredCues.filter((item: any) => {
                        const date = new Date(item.date);
                        return date >= state.coursework.filterStart && date <= state.coursework.filterEnd;
                    });
                }

                return {
                    ...state,
                    coursework: Object.assign({}, state.coursework, {
                        filteredAndSortedCues: filteredCues,
                        filterStart: action.payload.filterStart,
                        filterEnd: action.payload.filterEnd,
                    }),
                };
            }
            case 'SET_SORT_BY':
                let sortedCues: any[] = state.coursework.allCues;

                if (action.payload.sortBy === 'Priority') {
                    // tempCues.reverse();
                    sortedCues.sort((a: any, b: any) => {
                        return a.color < b.color ? 1 : -1;
                    });
                } else if (action.payload.sortBy === 'Date ↑') {
                    sortedCues.sort((a: any, b: any) => {
                        const aDate = new Date(a.date);
                        const bDate = new Date(b.date);
                        if (aDate < bDate) {
                            return 1;
                        } else if (aDate > bDate) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                } else {
                    sortedCues.sort((a: any, b: any) => {
                        const aDate = new Date(a.date);
                        const bDate = new Date(b.date);
                        if (aDate < bDate) {
                            return -1;
                        } else if (aDate > bDate) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                }

                let filteredCues: any[] = sortedCues;

                if (state.coursework.filterStart && state.coursework.filterEnd) {
                    filteredCues = filterCourseCues.filter((item: any) => {
                        const date = new Date(item.date);
                        return date >= state.coursework.filterStart && date <= state.coursework.filterEnd;
                    });
                }

                return {
                    ...state,
                    coursework: Object.assign({}, state.coursework, {
                        filteredAndSortedCues: filteredCues,
                        sortBy: action.payload.sortBy,
                    }),
                };
            case 'SET_COURSE_DISCUSSION_THREADS':
                const topics = new Set();

                action.payload.map((thread: any) => {
                    topics.add(thread.category);
                });

                return {
                    ...state,
                    discussion: Object.assign({}, state.discussion, {
                        allThreads: action.payload,
                        filteredAndSortedThreads: action.payload,
                        categories: Array.from(topics),
                        error: undefined,
                    }),
                };
            case 'SET_COURSE_DISCUSSION_THREADS_ERROR':
                return {
                    ...state,
                    discussion: Object.assign({}, state.discussion, {
                        allThreads: [],
                        filteredAndSortedThreads: [],
                        categories: [],
                        error: action.payload,
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

    const server = useApolloClient();

    const [fetchDiscussionThreads, { loading: loadingDiscussionThreads, error: threadsError, data: threadsData }] =
        useLazyQuery(getChannelThreads);

    useEffect(() => {
        if (state.courseData && state.courseData.channelId) {
            loadChannelDiscussion();
        }
    }, [state.courseData]);

    const loadChannelDiscussion = useCallback(async () => {
        const res = await fetchDiscussionThreads({
            variables: {
                channelId: state.courseData.channelId,
            },
        });

        if (res.data && res.data.thread.findByChannelId) {
            dispatch({
                type: 'SET_COURSE_DISCUSSION_THREADS',
                payload: res.data.thread.findByChannelId,
            });
        } else {
            dispatch({
                type: 'SET_COURSE_DISCUSSION_THREADS_ERROR',
                payload: 'Failed to fetch discussion threads',
            });
        }
    }, [state.courseData]);

    // ACTIONS

    const setCourseData = (data: any) => {
        dispatch({
            type: 'SET_COURSE_DATA',
            payload: data,
        });
    };

    const setCourseCues = (courseId: string, cues: any[]) => {
        dispatch({
            type: 'SET_COURSE_CUES',
            payload: {
                courseId,
                cues,
            },
        });
    };

    const setSortBy = async (sortBy: string) => {
        await updateSortByAsync(sortBy);
        dispatch({
            type: 'SET_SORT_BY',
            payload: {
                sortBy,
            },
        });
    };

    const setDateFilters = (filterStart: any, filterEnd: any) => {
        dispatch({
            type: 'SET_DATE_FILTER',
            payload: {
                filterStart,
                filterEnd,
            },
        });
    };

    const updateSortByAsync = async (sortByValue: string) => {
        await AsyncStorage.setItem('sortByWorkspace', sortByValue);
    };

    return (
        <CourseContext.Provider
            displayName="COURSE CONTEXT"
            value={{
                courseData: state.courseData,
                coursework: state.coursework,
                discussion: state.discussion,
                loadingDiscussionThreads,
                setCourseData,
                setCourseCues,
                setDateFilters,
                setSortBy,
                loadChannelDiscussion,
            }}
        >
            {children}
        </CourseContext.Provider>
    );
};
