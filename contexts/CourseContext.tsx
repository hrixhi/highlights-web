import { useApolloClient, useLazyQuery, useMutation } from '@apollo/client';

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useReducer } from 'react';
import {
    getChannelThreads,
    getThreadWithReplies,
    getAttendanceBook,
    getGradebookInstructor,
    findChannelById,
    getUserCount,
} from '../graphql/QueriesAndMutations';

export const CourseContext = React.createContext<{ [label: string]: any }>({});

export const useCourseContext = () => React.useContext(CourseContext);

export const CourseContextProvider: React.FC<React.ReactNode> = ({ value, children }) => {
    const initialState = {
        courseData: undefined,
        overview: {},
        coursework: {
            // Files
            allCues: [],
            filteredAndSortedCues: [],
            categories: [],
            sortBy: value.sortBy,
            filterStart: undefined,
            filterEnd: undefined,
            // Playlists
            activePlaylistTab: 'lists',
        },
        discussion: {
            //
            allThreads: [],
            filteredAndSortedThreads: [],
            categories: [],
            selectedCategories: [],
            error: undefined,
            selectedThread: undefined,
            selectedThreadReplies: undefined,
            selectedThreadRepliesError: undefined,
            searchTerm: '',
        },
        meetings: {
            instructorAttendanceBook: undefined,
            instructorAttendanceBookError: undefined,
            attendanceBookEntries: [],
            attendanceBookUsers: [],
            attendanceBookUsersDropdownOptions: [],
            attendanceBookAnalyticsSelectedUser: undefined,
        },
        grades: {
            instructorGradebook: undefined,
            instructorGradebookError: undefined,
            gradebookEntries: [],
            gradebookUsers: [],
            courseStudents: [],
        },
        settings: {
            data: undefined,
            error: undefined,
            allUsers: undefined,
            allUsersError: undefined,
        },
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
            case 'SET_COURSE_DISCUSSION_REPLIES':
                const filterMainThread = action.payload.filter((thread: any) => {
                    return thread._id !== state.discussion.selectedThread._id;
                });

                console.log('Filter Main Thread', filterMainThread);

                return {
                    ...state,
                    discussion: Object.assign({}, state.discussion, {
                        selectedThreadReplies: filterMainThread,
                        selectedThreadRepliesError: undefined,
                    }),
                };
            case 'SET_COURSE_DISCUSSION_REPLIES_ERROR':
                return {
                    ...state,
                    discussion: Object.assign({}, state.discussion, {
                        selectedThreadReplies: undefined,
                        selectedThreadRepliesError: action.payload,
                    }),
                };
            case 'SET_SELECTED_THREAD':
                return {
                    ...state,
                    discussion: Object.assign({}, state.discussion, {
                        selectedThread: action.payload,
                    }),
                };
            case 'SET_ATTENDANCE_BOOK_INSTRUCTOR':
                let userDropdowns = [];
                if (action.payload.users.length > 0) {
                    userDropdowns = action.payload.users.map((user: any) => {
                        return {
                            value: user.userId,
                            text: user.fullName,
                            img: user.avatar,
                        };
                    });
                }

                const selectedUser = {
                    value: action.payload.users[0].userId,
                    text: action.payload.users[0].fullName,
                    img: action.payload.users[0].avatar,
                };

                return {
                    ...state,
                    meetings: Object.assign({}, state.meetings, {
                        instructorAttendanceBook: action.payload,
                        attendanceBookEntries: action.payload.entries,
                        attendanceBookUsers: action.payload.users,
                        instructorAttendanceBookError: undefined,
                        attendanceBookUsersDropdownOptions: userDropdowns,
                        attendanceBookAnalyticsSelectedUser: selectedUser,
                    }),
                };
            case 'SET_ATTENDANCE_BOOK_INSTRUCTOR_ERROR':
                return {
                    ...state,
                    meetings: Object.assign({}, state.meetings, {
                        instructorAttendanceBook: undefined,
                        attendanceBookEntries: [],
                        attendanceBookUsers: [],
                        instructorAttendanceBookError: action.payload,
                    }),
                };
            case 'SET_GRADEBOOK_INSTRUCTOR':
                return {
                    ...state,
                    grades: Object.assign({}, state.grades, {
                        instructorGradebook: action.payload,
                        gradebookEntries: action.payload.entries,
                        gradebookUsers: action.payload.users,
                        instructorGradebookError: undefined,
                    }),
                };
            case 'SET_GRADEBOOK_INSTRUCTOR_ERROR':
                return {
                    ...state,
                    grades: Object.assign({}, state.grades, {
                        instructorGradebook: undefined,
                        gradebookEntries: [],
                        gradebookUsers: [],
                        instructorGradebookError: action.payload,
                    }),
                };
            case 'SET_COURSE_SETTINGS_DATA':
                return {
                    ...state,
                    settings: Object.assign({}, state.settings, {
                        data: action.payload,
                        error: undefined,
                    }),
                };
            case 'SET_COURSE_SETTINGS_ERROR':
                return {
                    ...state,
                    settings: Object.assign({}, state.settings, {
                        data: undefined,
                        error: action.payload,
                    }),
                };
            case 'SET_SCHOOL_USERS_DATA':
                return {
                    ...state,
                    settings: Object.assign({}, state.settings, {
                        allUsers: action.payload,
                        allUsersError: undefined,
                    }),
                };
            case 'SET_SCHOOL_USERS_ERROR':
                return {
                    ...state,
                    settings: Object.assign({}, state.settings, {
                        allUsers: undefined,
                        allUsersError: action.payload,
                    }),
                };
            case 'SWITCH_PLAYLIST_VIEW':
                return {
                    ...state,
                    coursework: Object.assign({}, state.coursework, {
                        activePlaylistTab: action.payload,
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

    const [
        fetchThreadWithReplies,
        { loading: loadingThreadWithReplies, error: threadWithRepliesError, data: selectedThreadData },
    ] = useLazyQuery(getThreadWithReplies);

    const [
        fetchAttendancebookInstructor,
        { loading: loadingAttendanceBookInstructor, error: attendanceBookInstructorError, data: attendanceBookData },
    ] = useLazyQuery(getAttendanceBook);

    const [
        fetchGradebookInstructor,
        { loading: loadingGradebookInstructor, error: gradebookInstructorError, data: gradebookInstructorData },
    ] = useLazyQuery(getGradebookInstructor);

    const [fetchCourseData, { loading: loadingChannelData, error: channelDataError, data: courseData }] =
        useLazyQuery(findChannelById);

    const [fetchSchoolUsers, { loading: loadingSchoolUsers, error: userCountError, data: schoolUserData }] =
        useLazyQuery(getUserCount);

    useEffect(() => {
        if (state.courseData && state.courseData.channelId && state.courseData.isOwner) {
            fetchCourseAttendanceBookInstructor();
            fetchCourseGradebookInstructor();
            fetchCourseSettingsData();
        }
    }, [state.courseData]);

    useEffect(() => {
        if (state.discussion && state.discussion.selectedThread) {
            loadSelectedThreadReplies();
        }
    }, [state.discussion.selectedThread]);

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

    const loadSelectedThreadReplies = useCallback(async () => {
        const res = await fetchThreadWithReplies({
            variables: {
                threadId: state.discussion.selectedThread._id,
            },
        });

        console.log('Res thread with replies', res);

        if (res.data && res.data.thread.getThreadWithReplies) {
            dispatch({
                type: 'SET_COURSE_DISCUSSION_REPLIES',
                payload: res.data.thread.getThreadWithReplies,
            });
        } else {
            dispatch({
                type: 'SET_COURSE_DISCUSSION_REPLIES_ERROR',
                payload: 'Failed to fetch discussion thread responses.',
            });
        }
    }, [state.discussion]);

    const fetchCourseAttendanceBookInstructor = useCallback(async () => {
        const res = await fetchAttendancebookInstructor({
            variables: {
                channelId: state.courseData.channelId,
            },
        });

        if (res.data && res.data.attendance.getAttendanceBook) {
            dispatch({
                type: 'SET_ATTENDANCE_BOOK_INSTRUCTOR',
                payload: res.data.attendance.getAttendanceBook,
            });
        } else {
            dispatch({
                type: 'SET_ATTENDANCE_BOOK_INSTRUCTOR_ERROR',
                payload: 'Failed to fetch attendance book.',
            });
        }
    }, [state.courseData]);

    const fetchCourseGradebookInstructor = useCallback(async () => {
        const res = await fetchGradebookInstructor({
            variables: {
                channelId: state.courseData.channelId,
            },
        });

        if (res.data && res.data.gradebook.getGradebook) {
            dispatch({
                type: 'SET_GRADEBOOK_INSTRUCTOR',
                payload: res.data.gradebook.getGradebook,
            });
        } else {
            dispatch({
                type: 'SET_GRADEBOOK_INSTRUCTOR_ERROR',
                payload: 'Failed to fetch gradebook.',
            });
        }
    }, [state.courseData]);

    const fetchCourseSettingsData = useCallback(async () => {
        const res = await fetchCourseData({
            variables: {
                channelId: state.courseData.channelId,
            },
        });

        if (res.data && res.data.channel.findById) {
            dispatch({
                type: 'SET_COURSE_SETTINGS_DATA',
                payload: res.data.channel.findById,
            });
        } else {
            dispatch({
                type: 'SET_COURSE_SETTINGS_ERROR',
                payload: 'Failed to fetch gradebook.',
            });
        }
    }, [state.courseData]);

    const fetchSchoolUsersData = useCallback(
        async (schoolId: string) => {
            const res = await fetchSchoolUsers({
                variables: {
                    schoolId,
                },
            });

            if (res.data && res.data.user.getSchoolUsers) {
                dispatch({
                    type: 'SET_SCHOOL_USERS_DATA',
                    payload: res.data.user.getSchoolUsers,
                });
            } else {
                dispatch({
                    type: 'SET_SCHOOL_USERS_ERROR',
                    payload: 'Failed to fetch gradebook.',
                });
            }
        },
        [state.courseData]
    );

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

    const setSelectedThread = (data: any) => {
        dispatch({
            type: 'SET_SELECTED_THREAD',
            payload: data,
        });
    };

    const switchPlaylistView = (view: any) => {
        dispatch({
            type: 'SWITCH_PLAYLIST_VIEW',
            payload: view,
        });
    };

    return (
        <CourseContext.Provider
            displayName="COURSE CONTEXT"
            value={{
                courseData: state.courseData,
                coursework: state.coursework,
                discussion: state.discussion,
                meetings: state.meetings,
                grades: state.grades,
                settings: state.settings,
                loadingDiscussionThreads,
                loadingThreadWithReplies,
                loadingAttendanceBookInstructor,
                loadingGradebookInstructor,
                loadingChannelData,
                loadingSchoolUsers,
                setCourseData,
                setCourseCues,
                setDateFilters,
                setSortBy,
                loadChannelDiscussion,
                setSelectedThread,
                loadSelectedThreadReplies,
                fetchCourseSettingsData,
                fetchSchoolUsersData,
                switchPlaylistView,
            }}
        >
            {children}
        </CourseContext.Provider>
    );
};
