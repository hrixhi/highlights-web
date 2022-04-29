// REACT
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Image,
    Dimensions,
    Linking,
    ScrollView,
    Switch,
    Platform,
    TextInput as DefaultInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import _ from 'lodash';
import moment from 'moment';

// API
import axios from 'axios';
import { fetchAPI } from '../graphql/FetchAPI';
import {
    checkChannelStatus,
    subscribe,
    markAttendance,
    meetingRequest,
    startInstantMeeting,
    getOngoingMeetings,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text, TouchableOpacity } from '../components/Themed';
import Walkthrough from './Walkthrough';
import Channels from './Channels';
import Create from './Create';
import CalendarX from './Calendar';
import { TextInput } from './CustomTextInput';
import alert from './Alert';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Performance from './Performance';
import SearchResultCard from './SearchResultCard';
import Inbox from './Inbox';
import Card from './Card';
import Alert from '../components/Alert';
import Discussion from './Discussion';
import ChannelSettings from './ChannelSettings';
import { Datepicker, Select, Popup } from '@mobiscroll/react5';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import logo from '../components/default-images/cues-logo-white-exclamation-hidden.jpg';
import InsetShadow from 'react-native-inset-shadow';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { htmlStringParser } from '../helpers/HTMLParser';
import { disableEmailId, zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';

const Dashboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const styles = styleObject();
    const [userId, setUserId] = useState('');
    const [avatar, setAvatar] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userCreatedOrg, setUserCreatedOrg] = useState(false);
    const scrollViewRef: any = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [collapseMap, setCollapseMap] = useState<any>({});
    const [results, setResults] = useState<any>({
        Courses: [],
        Content: [],
        Messages: [],
        Discussion: [],
    });
    const [resultCount, setResultCount] = useState(0);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [filterStart, setFilterStart] = useState<any>(null);
    const [filterEnd, setFilterEnd] = useState<any>(null);
    const [searchOptions] = useState(['Content', 'Messages', 'Discussion', 'Courses']);
    const [sortBy, setSortBy] = useState('Date ↑');
    const [cueMap, setCueMap] = useState<any>({});
    const [categoryMap, setCategoryMap] = useState<any>({});
    const [editFolderChannelId, setEditFolderChannelId] = useState('');
    const [cueIds, setCueIds] = useState<any[]>([]);
    const [filterByChannel, setFilterByChannel] = useState('All');
    const [indexMap, setIndexMap] = useState<any>({});
    const [channelKeyList, setChannelKeyList] = useState<any[]>([]);
    const [channelHeightList, setChannelHeightList] = useState<any[]>([]);
    const [filterEventsType, setFilterEventsType] = useState('All');
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState();
    const [openChannelId, setOpenChannelId] = useState('');
    let cancelTokenRef: any = useRef({});
    const tabs = ['Content', 'Discuss', 'Meet', 'Scores', 'Settings'];
    const width = Dimensions.get('window').width;
    const windowHeight = width < 768 ? Dimensions.get('window').height - 0 : Dimensions.get('window').height;
    const sortbyOptions = [
        {
            value: 'Date ↑',
            text: 'Date ↑',
        },
        {
            value: 'Date ↓',
            text: 'Date ↓',
        },
        {
            value: 'Priority',
            text: 'Priority',
        },
    ];
    const [showInstantMeeting, setShowInstantMeeting] = useState(false);
    const [instantMeetingChannelId, setInstantMeetingChannelId] = useState<any>('');
    const [instantMeetingCreatedBy, setInstantMeetingCreatedBy] = useState<any>('');
    const [instantMeetingTitle, setInstantMeetingTitle] = useState<any>('');
    const [instantMeetingDescription, setInstantMeetingDescription] = useState<any>('');
    const [instantMeetingStart, setInstantMeetingStart] = useState<any>('');
    const [instantMeetingEnd, setInstantMeetingEnd] = useState<any>('');
    const [instantMeetingAlertUsers, setInstantMeetingAlertUsers] = useState<any>(true);
    const [ongoingMeetings, setOngoingMeetings] = useState<any[]>([]);
    const [userZoomInfo, setUserZoomInfo] = useState<any>('');
    const [meetingProvider, setMeetingProvider] = useState('');
    const [selectedWorkspace, setSelectedWorkspace] = useState<any>(
        props.selectedWorkspace ? props.selectedWorkspace : ''
    );
    const [showNewDiscussionPost, setShowNewDiscussionPost] = useState(false);
    const [searchResultTabs, setSearchResultTabs] = useState<string[]>([]);
    const [activeSearchResultsTab, setActiveSearchResultsTab] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [reversedSearches, setReversedSearches] = useState<string[]>([]);
    const [exportScores, setExportScores] = useState(false);

    // ALERTS
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');

    /**
     * @description Save Sort by option in settings
     */
    useEffect(() => {
        (async () => {
            const sortByWorkspace = await AsyncStorage.getItem('sortByWorkspace');

            if (sortByWorkspace) {
                setSortBy(sortByWorkspace);
            }
        })();
    }, []);

    const updateSortByAsync = useCallback(async (sortByValue: string) => {
        await AsyncStorage.setItem('sortByWorkspace', sortByValue);
    }, []);

    // const openThreadFromSearch = useCallback(
    //     (channelId: String) => {
    //         if (
    //             scrollViewRef &&
    //             scrollViewRef.current !== null &&
    //             channelKeyList &&
    //             channelKeyList.length > 0 &&
    //             channelHeightList &&
    //             channelHeightList.length > 0
    //         ) {
    //             let matchIndex = -1;

    //             channelKeyList.map((key: any, index: number) => {
    //                 if (key === channelId) {
    //                     matchIndex = index;
    //                 }
    //             });

    //             let indexMapKey = '';

    //             Object.keys(indexMap).map((key: any) => {
    //                 if (key.split('-SPLIT-')[1] === channelId) {
    //                     indexMapKey = key;
    //                 }
    //             });

    //             if (matchIndex === -1 || !channelHeightList[matchIndex] || indexMapKey === '') {
    //                 Alert('Cannot open discussion.');
    //             }

    //             const temp = JSON.parse(JSON.stringify(indexMap));
    //             temp[indexMapKey] = 2;
    //             setIndexMap(temp);

    //             const tempCollapse = JSON.parse(JSON.stringify(collapseMap));
    //             tempCollapse[indexMapKey] = !collapseMap[indexMapKey];
    //             setCollapseMap(tempCollapse);

    //             scrollViewRef.current.scrollTo({
    //                 x: 0,
    //                 y: channelHeightList[matchIndex],
    //                 animated: true
    //             });
    //         }
    //     },
    //     [scrollViewRef.current, channelKeyList, channelHeightList, indexMap]
    // );

    // useEffect(() => {
    //     props.setSelectedWorkspace(selectedWorkspace);
    //     console.log('Selected workspace dashboard', selectedWorkspace);
    // }, [selectedWorkspace]);

    const getWorkspaceNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                return props.activeWorkspaceTab === op ? 'book' : 'book-outline';
            case 'Discuss':
                return props.activeWorkspaceTab === op ? 'chatbubbles' : 'chatbubbles-outline';
            case 'Meet':
                return props.activeWorkspaceTab === op ? 'videocam' : 'videocam-outline';
            case 'Scores':
                return props.activeWorkspaceTab === op ? 'bar-chart' : 'bar-chart-outline';
            default:
                return props.activeWorkspaceTab === op ? 'build' : 'build-outline';
        }
    };

    const getWorkspaceNavbarIconColor = (op: string) => {
        if (op === props.activeWorkspaceTab) {
            return '#fff';
        }
        return '#fff';
    };

    const getSearchNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                return activeSearchResultsTab === op ? 'book' : 'book-outline';
            case 'Messages':
                return activeSearchResultsTab === op ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
            case 'Discussion':
                return activeSearchResultsTab === op ? 'chatbubbles' : 'chatbubbles-outline';
            case 'Courses':
                return activeSearchResultsTab === op ? 'school' : 'school-outline';
            default:
                return activeSearchResultsTab === op ? 'build' : 'build-outline';
        }
    };

    const getSearchNavbarIconColor = (op: string) => {
        if (op === activeSearchResultsTab) {
            return '#000';
        }
        return '#000';
    };

    const getAccountNavbarIconName = (op: string) => {
        switch (op) {
            case 'profile':
                return op === props.activeAccountTab ? 'person' : 'person-outline';
            case 'courses':
                return op === props.activeAccountTab ? 'school' : 'school-outline';
            default:
                return '';
        }
    };

    const getAccountNavbarIconColor = (op: string) => {
        if (op === props.activeAccountTab) {
            return '#000';
        }
        return '#000';
    };

    // HOOKS

    /**
     * @description Fetch meeting provider for org
     */
    useEffect(() => {
        (async () => {
            const org = await AsyncStorage.getItem('school');

            if (org) {
                const school = JSON.parse(org);

                setMeetingProvider(school.meetingProvider ? school.meetingProvider : '');
            }
        })();
    }, []);

    /**
     * @description Open discussion from Activity using loadDiscussionForChannelId => It will open that Channel in ScrollView
     */
    useEffect(() => {
        setLoadDiscussionForChannelId(props.loadDiscussionForChannelId);
    }, [props.loadDiscussionForChannelId]);

    /**
     * @description Opens a channel in ScrollView
     */
    useEffect(() => {
        setOpenChannelId(props.openChannelId);
    }, [props.openChannelId]);

    /**
     * @description Scrolls to specific channel in Channels ScrollView for loadDiscussionForChannelId
     */
    useEffect(() => {
        let matchIndex = -1;
        let indexMapKey = '';

        if (loadDiscussionForChannelId !== '') {
            Object.keys(cueMap).map((obj: any, index: number) => {
                if (obj.split('-SPLIT-')[1] === loadDiscussionForChannelId) {
                    indexMapKey = obj;
                    matchIndex = index;
                }
            });
        }

        if (matchIndex === -1 || indexMapKey === '' || !loadDiscussionForChannelId) return;

        const temp = JSON.parse(JSON.stringify(indexMap));
        temp[indexMapKey] = 1;
        setIndexMap(temp);
        setSelectedWorkspace(indexMapKey);

        props.setLoadDiscussionForChannelId('');
        props.setWorkspaceActiveTab('Discuss');
    }, [scrollViewRef.current, channelKeyList, channelHeightList, loadDiscussionForChannelId, indexMap]);

    /**
     * @description Scrolls to specific channel in Channels ScrollView for openChannelId
     */
    useEffect(() => {
        if (openChannelId !== '') {
            Object.keys(cueMap).map((obj: any) => {
                if (obj.split('-SPLIT-')[1] === openChannelId) {
                    setSelectedWorkspace(obj);
                }
            });
        }

        if (
            scrollViewRef &&
            scrollViewRef.current !== null &&
            channelKeyList &&
            channelKeyList.length > 0 &&
            channelHeightList &&
            channelHeightList.length > 0 &&
            openChannelId !== ''
        ) {
            let matchIndex = -1;

            channelKeyList.map((key: any, index: number) => {
                if (key === openChannelId) {
                    matchIndex = index;
                }
            });

            let indexMapKey = '';

            Object.keys(indexMap).map((key: any) => {
                if (key.split('-SPLIT-')[1] === openChannelId) {
                    indexMapKey = key;
                }
            });

            if (matchIndex === -1 || !channelHeightList[matchIndex] || !openChannelId) return;

            const tempCollapse = JSON.parse(JSON.stringify(collapseMap));
            tempCollapse[indexMapKey] = !collapseMap[indexMapKey];
            setCollapseMap(tempCollapse);

            scrollViewRef.current.scrollTo({
                x: 0,
                y: channelHeightList[matchIndex],
                animated: true,
            });

            props.setOpenChannelId('');
        }
    }, [scrollViewRef.current, channelKeyList, channelHeightList, openChannelId, cueMap]);

    /**
     * @description Prepares all the data to be displayed in workspace
     */
    useEffect(() => {
        if (props.user) {
            setUserId(props.user._id);
            setUserEmail(props.user.email);

            if (props.user.avatar) {
                setAvatar(props.user.avatar);
            } else {
                setAvatar('https://cues-files.s3.amazonaws.com/images/default.png');
            }

            if (props.user.userCreatedOrg) {
                setUserCreatedOrg(props.user.userCreatedOrg);
            }

            if (props.user.zoomInfo) {
                setUserZoomInfo(props.user.zoomInfo);
            }
        }

        const temp: any = {};
        const tempCat: any = {};
        const mycues: any[] = [];
        temp['My Notes'] = [];
        const tempIndexes: any = {};

        let dateFilteredCues: any[] = [];
        if (filterStart && filterEnd) {
            dateFilteredCues = props.cues.filter((item: any) => {
                const date = new Date(item.date);
                return date >= filterStart && date <= filterEnd;
            });
        } else {
            dateFilteredCues = props.cues;
        }

        props.subscriptions.map((sub: any) => {
            // const tempCategories: any = {}
            const tempCues: any[] = [];
            const cat: any = { '': [] };
            dateFilteredCues.map((cue: any, ind: any) => {
                if (cue.channelId === sub.channelId) {
                    tempCues.push(cue);
                    if (!cat[cue.customCategory]) {
                        cat[cue.customCategory] = '';
                    }
                }
            });

            // Sort alphabetically
            tempCues.sort((a: any, b: any) => {
                return a.title > b.title ? -1 : 1;
            });

            if (sortBy === 'Priority') {
                // tempCues.reverse();
                tempCues.sort((a: any, b: any) => {
                    return a.colorCode < b.colorCode ? 1 : -1;
                });
            } else if (sortBy === 'Date ↑') {
                tempCues.sort((a: any, b: any) => {
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
                tempCues.sort((a: any, b: any) => {
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

            const key =
                sub.channelName +
                '-SPLIT-' +
                sub.channelId +
                '-SPLIT-' +
                sub.channelCreatedBy +
                '-SPLIT-' +
                sub.colorCode;
            temp[key] = tempCues;
            tempIndexes[key] = 0;
            if (!cat['']) {
                delete cat[''];
            }
            tempCat[key] = Object.keys(cat);
        });

        // Sort the category map alphabetically
        const sortedCategories: any = {};

        Object.keys(tempCat).map((channelId: string) => {
            const currentCategories = [...tempCat[channelId]];

            currentCategories.sort();

            sortedCategories[channelId] = [...currentCategories];
        });

        const cat: any = { '': [] };
        props.cues.map((cue: any) => {
            if (!cue.channelId || cue.channelId === '') {
                mycues.push(cue);
                if (!cat[cue.customCategory]) {
                    cat[cue.customCategory] = 1;
                }
            }
        });

        // Sort alphabetically
        mycues.sort((a: any, b: any) => {
            return a.title > b.title ? -1 : 1;
        });

        if (sortBy === 'Priority') {
            // mycues.reverse();
            mycues.sort((a: any, b: any) => {
                return a.colorCode < b.colorCode ? 1 : -1;
            });
        } else if (sortBy === 'Date ↑') {
            mycues.sort((a: any, b: any) => {
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
            mycues.sort((a: any, b: any) => {
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

        temp['My Notes'] = mycues;
        if (!cat['']) {
            delete cat[''];
        }
        const myNotesCategories = Object.keys(cat);
        myNotesCategories.sort();
        sortedCategories['My Notes'] = myNotesCategories;
        tempIndexes['My Notes'] = 0;

        setCueMap(temp);
        setCategoryMap(sortedCategories);
        console.log('Sorted categories', sortedCategories);
        setIndexMap(tempIndexes);
    }, [sortBy, filterStart, filterEnd, props.subscriptions, props.cues, props.user]);

    useEffect(() => {
        const tempCollapse: any = {};
        tempCollapse['My Notes'] = false;

        props.subscriptions.map((sub: any) => {
            // const tempCategories: any = {}
            const key =
                sub.channelName +
                '-SPLIT-' +
                sub.channelId +
                '-SPLIT-' +
                sub.channelCreatedBy +
                '-SPLIT-' +
                sub.colorCode;
            tempCollapse[key] = false;
        });
    }, [props.subscriptions]);

    /**
     * @description Calls method to fetch any ongoing meetings
     */
    useEffect(() => {
        if (selectedWorkspace && selectedWorkspace.split('-SPLIT-')[0] !== 'My Notes') {
            getCurrentMeetings();
        }
    }, [userId, selectedWorkspace]);

    const loadRecentSearches = useCallback(async () => {
        const recentSearches = await AsyncStorage.getItem('recentSearches');

        if (recentSearches) {
            setRecentSearches(JSON.parse(recentSearches));
        }
    }, []);

    useEffect(() => {
        setReversedSearches(recentSearches.reverse());
    }, [recentSearches]);

    const updateRecentSearches = useCallback(async () => {
        if (searchTerm.trim().length === 0) return;

        let currentSearches = [...recentSearches];
        currentSearches.push(searchTerm);

        if (currentSearches.length > 10) {
            currentSearches.shift();
        }

        setRecentSearches(currentSearches);

        await AsyncStorage.setItem('recentSearches', JSON.stringify(currentSearches));
    }, [recentSearches, searchTerm]);

    const removeRecentSearch = useCallback(
        async (searchTerm: string) => {
            const removed = recentSearches.filter((term) => term !== searchTerm);

            setRecentSearches(removed);

            await AsyncStorage.setItem('recentSearches', JSON.stringify(removed));
        },
        [recentSearches]
    );

    /**
     * @description Fetches search results for search term
     */
    useEffect(() => {
        if (searchTerm.trim().length === 0) {
            setResults({
                Courses: [],
                Content: [],
                Messages: [],
                Discussion: [],
            });
            setResultCount(0);
            setSearchResultTabs([]);
            setActiveSearchResultsTab('');
            cancelTokenRef.current = axios.CancelToken.source();
            setLoadingSearchResults(false);
            return;
        }

        setLoadingSearchResults(true);

        if (typeof cancelTokenRef.current != typeof undefined) {
            cancelTokenRef.current &&
                cancelTokenRef.current.cancel &&
                cancelTokenRef.current.cancel('Operation canceled due to new request.');
        }

        //Save the cancel token for the current request
        cancelTokenRef.current = axios.CancelToken.source();

        try {
            axios
                .post(
                    `https://api.learnwithcues.com/search`,
                    {
                        term: searchTerm,
                        userId,
                    },
                    { cancelToken: cancelTokenRef.current.token }
                )
                .then((res: any) => {
                    const totalCount =
                        res.data.personalCues.length +
                        res.data.channelCues.length +
                        res.data.channels.length +
                        res.data.threads.length +
                        res.data.messages.length;

                    const tempResults = {
                        Content: [...res.data.personalCues, ...res.data.channelCues],
                        Courses: res.data.channels,
                        Discussion: res.data.threads,
                        Messages: res.data.messages,
                    };

                    const tabsFound = [];
                    let activeTab = '';

                    if (res.data.personalCues.length + res.data.channelCues.length > 0) {
                        tabsFound.push('Content');
                        activeTab = 'Content';
                    }

                    if (res.data.messages.length > 0) {
                        tabsFound.push('Messages');
                        activeTab = activeTab !== '' ? activeTab : 'Messages';
                    }

                    if (res.data.threads.length > 0) {
                        tabsFound.push('Discussion');
                        activeTab = activeTab !== '' ? activeTab : 'Discussion';
                    }

                    if (res.data.channels.length > 0) {
                        tabsFound.push('Courses');
                        activeTab = activeTab !== '' ? activeTab : 'Courses';
                    }

                    // Sort all the search results by date
                    const sortContent = [...tempResults['Content']];
                    sortContent.sort((a: any, b: any) => {
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

                    const sortThreads = [...tempResults['Discussion']];
                    sortThreads.sort((a: any, b: any) => {
                        const aDate = new Date(a.time);
                        const bDate = new Date(b.time);

                        if (aDate < bDate) {
                            return 1;
                        } else if (aDate > bDate) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });

                    const sortMessages = [...tempResults['Messages']];
                    sortMessages.sort((a: any, b: any) => {
                        const aDate = new Date(a.sentAt);
                        const bDate = new Date(b.sentAt);

                        if (aDate < bDate) {
                            return 1;
                        } else if (aDate > bDate) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });

                    const sortCourses = [...tempResults['Courses']];
                    sortCourses.sort((a: any, b: any) => {
                        return a.name < b.name ? 1 : -1;
                    });

                    let sortedResults = {
                        Content: sortContent,
                        Courses: sortCourses,
                        Discussion: sortThreads,
                        Messages: sortMessages,
                    };

                    setResults(sortedResults);
                    setActiveSearchResultsTab(activeTab);
                    setSearchResultTabs(tabsFound);

                    setResultCount(totalCount);
                    // setResults(sortedResults);
                    setLoadingSearchResults(false);
                });
        } catch (error) {
            setLoadingSearchResults(false);
            console.log(error);
        }
    }, [searchTerm, userId]);

    /**
     * @description API call to start instant meeting
     */
    const createInstantMeeting = useCallback(() => {
        if (instantMeetingTitle === '') {
            Alert('Enter topic for meeting');
            return;
        }

        const startDate = new Date();
        const server = fetchAPI('');
        server
            .mutate({
                mutation: startInstantMeeting,
                variables: {
                    userId: instantMeetingCreatedBy,
                    channelId: instantMeetingChannelId,
                    title: instantMeetingTitle,
                    description: instantMeetingDescription,
                    start: startDate.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    notifyUsers: instantMeetingAlertUsers,
                },
            })
            .then((res) => {
                if (res.data && res.data.channel.startInstantMeeting !== 'error') {
                    if (meetingProvider !== '' && res.data.channel.startInstantMeeting === 'MEETING_LINK_NOT_SET') {
                        Alert(
                            'No meeting link has been set for the course. Go to Course settings and add a meeting link.'
                        );
                        return;
                    }

                    setShowInstantMeeting(false);
                    setInstantMeetingChannelId('');
                    setInstantMeetingCreatedBy('');
                    setInstantMeetingTitle('');
                    setInstantMeetingDescription('');
                    setInstantMeetingStart('');
                    setInstantMeetingEnd('');
                    setInstantMeetingAlertUsers(true);

                    window.open(res.data.channel.startInstantMeeting, '_blank');

                    getCurrentMeetings();
                } else {
                    Alert('Something went wrong. Try again.');
                }
            })
            .catch((err) => {
                Alert('Something went wrong.');
            });
    }, [
        instantMeetingTitle,
        instantMeetingDescription,
        instantMeetingStart,
        instantMeetingEnd,
        instantMeetingChannelId,
        instantMeetingCreatedBy,
        instantMeetingAlertUsers,
        meetingProvider,
    ]);

    /**
     * @description Handle create instant meeting for channel owners
     */
    const getCurrentMeetings = useCallback(async () => {
        console.log('Get ongoing meetings channelId', selectedWorkspace);
        console.log('');

        if (userId !== '' && selectedWorkspace !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getOngoingMeetings,
                    variables: {
                        userId,
                        channelId: selectedWorkspace.split('-SPLIT-')[1],
                    },
                })
                .then((res) => {
                    if (res.data && res.data.channel.ongoingMeetings) {
                        console.log('Ongoing meetings', res.data.channel.ongoingMeetings);
                        setOngoingMeetings(res.data.channel.ongoingMeetings);
                    }
                })
                .catch((err) => {
                    console.log('Error in getCurrentMeeting', err);
                    Alert('Something went wrong.');
                });
        }
    }, [userId, selectedWorkspace]);

    /**
     * @description Handle create instant meeting for channel owners
     */
    const handleStartMeeting = async (channelId: string, channelCreatedBy: string) => {
        const u = await AsyncStorage.getItem('user');

        if (u) {
            const user = JSON.parse(u);
            if (user.zoomInfo || (meetingProvider && meetingProvider !== '')) {
                setInstantMeetingChannelId(channelId);
                setInstantMeetingCreatedBy(channelCreatedBy);
                const current = new Date();
                setInstantMeetingStart(current);
                setInstantMeetingEnd(new Date(current.getTime() + 1000 * 40 * 60));
                setShowInstantMeeting(true);
            } else {
                // ZOOM OATH
                Alert(
                    'You must connect your account with Zoom to start a meeting.',
                    'Would you like to proceed to setup?',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => {
                                return;
                            },
                        },
                        {
                            text: 'Yes',
                            onPress: () => {
                                const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                                    zoomRedirectUri
                                )}&state=${userId}`;

                                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                    Linking.openURL(url);
                                } else {
                                    window.open(url, '_blank');
                                }
                            },
                        },
                    ]
                );
            }
        } else {
            return;
        }
    };

    /**
     * @description Call to enter classroom
     */
    const handleEnterClassroom = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');

        if (u) {
            const user = JSON.parse(u);
            if (user.zoomInfo) {
                // Zoom is connected
                const server = fetchAPI('');
                server
                    .mutate({
                        mutation: meetingRequest,
                        variables: {
                            userId,
                            channelId: instantMeetingChannelId,
                            isOwner: user._id.toString().trim() === instantMeetingCreatedBy,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.channel.meetingRequest !== 'error') {
                            server.mutate({
                                mutation: markAttendance,
                                variables: {
                                    userId: userId,
                                    channelId: props.channelId,
                                },
                            });
                            window.open(res.data.channel.meetingRequest, '_blank');
                        } else {
                            Alert('Classroom not in session. Waiting for instructor.');
                        }
                    })
                    .catch((err) => {
                        Alert('Something went wrong.');
                    });
            }
        }
    }, [userId, instantMeetingChannelId, instantMeetingCreatedBy]);

    /**
     * @description Fetches status of channel and depending on that handles subscription to channel
     */
    const handleSub = useCallback(async (channelId) => {
        const server = fetchAPI('');
        server
            .query({
                query: checkChannelStatus,
                variables: {
                    channelId,
                },
            })
            .then(async (res) => {
                if (res.data.channel && res.data.channel.getChannelStatus) {
                    const channelStatus = res.data.channel.getChannelStatus;
                    switch (channelStatus) {
                        case 'password-not-required':
                            handleSubscribe(channelId, '');
                            break;
                        case 'password-required':
                            let pass: any = await prompt('Enter Password');
                            if (!pass || pass === '') {
                                Alert('Enter a valid password.');
                                return;
                            }
                            handleSubscribe(channelId, pass);
                            break;
                        case 'non-existant':
                            Alert(doesNotExistAlert);
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                Alert(somethingWrongAlert, checkConnectionAlert);
            });
    }, []);

    /**
     * @description Subscribes user to a channel
     */
    const handleSubscribe = useCallback(
        async (channelId, pass) => {
            const uString: any = await AsyncStorage.getItem('user');
            const user = JSON.parse(uString);

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: subscribe,
                    variables: {
                        userId: user._id,
                        channelId,
                        password: pass,
                    },
                })
                .then((res) => {
                    if (res.data.subscription && res.data.subscription.subscribe) {
                        const subscriptionStatus = res.data.subscription.subscribe;
                        switch (subscriptionStatus) {
                            case 'subscribed':
                                alert('Subscribed successfully!');
                                setSearchTerm('');
                                props.reloadData();
                                break;
                            case 'incorrect-password':
                                Alert(incorrectPasswordAlert);
                                break;
                            case 'already-subbed':
                                Alert(alreadySubscribedAlert);
                                break;
                            case 'error':
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                            default:
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                        }
                    }
                })
                .catch((err) => {
                    Alert(somethingWrongAlert, checkConnectionAlert);
                });
        },
        [props.closeModal]
    );

    // FUNCTIONS

    const renderTabs = (key: any) => {
        const activeTab = tabs[indexMap[key]];

        return (
            <View
                style={{
                    flexDirection: 'row',
                    marginBottom: 30,
                    paddingTop: 10,
                    backgroundColor: '#fff',
                    flex: 1,
                    justifyContent: 'center',
                    //paddingVertical: 20
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        maxWidth: 1024,
                        flex: 1,
                        backgroundColor: '#fff',
                    }}
                >
                    <TouchableOpacity
                        style={{
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            marginRight: 5,
                        }}
                        onPress={() => {
                            const temp = JSON.parse(JSON.stringify(indexMap));
                            temp[key] = 0;
                            setIndexMap(temp);
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                color: activeTab === 'Content' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                height: 20,
                                lineHeight: 20,
                                paddingHorizontal: 8,
                                fontFamily: 'inter',
                                textAlign: 'center',
                                marginBottom: 1,
                            }}
                        >
                            <Ionicons
                                name={activeTab === 'Content' ? 'library' : 'library-outline'}
                                size={18}
                                style={{ marginBottom: 5 }}
                            />
                        </Text>
                        <Text
                            style={{
                                fontSize: 11,
                                color: activeTab === 'Content' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                height: 20,
                                lineHeight: 20,
                                paddingHorizontal: 8,
                                fontFamily: 'inter',
                                textAlign: 'center',
                                marginBottom: 1,
                            }}
                        >
                            Library
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            justifyContent: 'center',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            marginRight: 5,
                        }}
                        onPress={() => {
                            const temp = JSON.parse(JSON.stringify(indexMap));
                            temp[key] = 1;
                            setIndexMap(temp);
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                color: activeTab === 'Discuss' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                height: 20,
                                lineHeight: 20,
                                paddingHorizontal: 8,
                                fontFamily: 'inter',
                                textAlign: 'center',
                                marginBottom: 1,
                            }}
                        >
                            <Ionicons
                                name={activeTab === 'Discuss' ? 'chatbubbles' : 'chatbubbles-outline'}
                                size={18}
                            />
                        </Text>
                        <Text
                            style={{
                                fontSize: 11,
                                color: activeTab === 'Discuss' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                height: 20,
                                lineHeight: 20,
                                paddingHorizontal: 8,
                                fontFamily: 'inter',
                                textAlign: 'center',
                                marginBottom: 1,
                            }}
                        >
                            Discussion
                        </Text>
                    </TouchableOpacity>
                    {props.version !== 'read' ? (
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                marginRight: 5,
                            }}
                            onPress={() => {
                                const temp = JSON.parse(JSON.stringify(indexMap));
                                temp[key] = 2;
                                setIndexMap(temp);
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: activeTab === 'Meet' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                    height: 20,
                                    lineHeight: 20,
                                    paddingHorizontal: 8,
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                    marginBottom: 1,
                                }}
                            >
                                <Ionicons name={activeTab === 'Meet' ? 'videocam' : 'videocam-outline'} size={18} />
                            </Text>
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: activeTab === 'Meet' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                    height: 20,
                                    lineHeight: 20,
                                    paddingHorizontal: 8,
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                    marginBottom: 1,
                                }}
                            >
                                Meetings
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    {props.version !== 'read' ? (
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                marginRight: 5,
                            }}
                            onPress={() => {
                                const temp = JSON.parse(JSON.stringify(indexMap));
                                temp[key] = 3;
                                setIndexMap(temp);
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: activeTab === 'Scores' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                    height: 20,
                                    lineHeight: 20,
                                    paddingHorizontal: 8,
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                    marginBottom: 1,
                                }}
                            >
                                <Ionicons name={activeTab === 'Scores' ? 'bar-chart' : 'bar-chart-outline'} size={18} />
                            </Text>
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: activeTab === 'Scores' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                    height: 20,
                                    lineHeight: 20,
                                    paddingHorizontal: 8,
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                    marginBottom: 1,
                                }}
                            >
                                Scores
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                    {key.split('-SPLIT-')[2] === userId ? (
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                marginRight: 5,
                            }}
                            onPress={() => {
                                const temp = JSON.parse(JSON.stringify(indexMap));
                                temp[key] = 4;
                                setIndexMap(temp);
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: activeTab === 'Settings' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                    height: 20,
                                    lineHeight: 20,
                                    paddingHorizontal: 8,
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                    marginBottom: 1,
                                }}
                            >
                                <Ionicons name={activeTab === 'Settings' ? 'build' : 'build-outline'} size={18} />
                            </Text>
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: activeTab === 'Settings' ? key.split('-SPLIT-')[3] : '#1F1F1F',
                                    height: 20,
                                    lineHeight: 20,
                                    paddingHorizontal: 8,
                                    fontFamily: 'inter',
                                    textAlign: 'center',
                                    marginBottom: 1,
                                }}
                            >
                                Settings
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    const renderAccountTabs = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    paddingVertical: 15,
                    backgroundColor: '#f8f8f8',
                    paddingHorizontal: width < 1024 ? 10 : 0,
                    height: 54,
                }}
            >
                <View
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 1024,
                        alignSelf: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'none',
                    }}
                >
                    {props.accountTabs.map((tab: string, ind: number) => {
                        return (
                            <TouchableOpacity
                                key={ind.toString()}
                                style={{
                                    marginRight: 30,
                                    paddingVertical: 3,
                                    backgroundColor: 'none',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomColor: '#000',
                                    borderBottomWidth: props.activeAccountTab === tab ? 1 : 0,
                                }}
                                onPress={() => {
                                    props.setActiveAccountTab(tab);
                                }}
                            >
                                {/* <Ionicons
                                    name={getAccountNavbarIconName(tab)}
                                    style={{ color: getAccountNavbarIconColor(tab) }}
                                    size={props.activeAccountTab === 'profile' ? 13 : 15}
                                /> */}
                                <Text
                                    style={{
                                        color: getAccountNavbarIconColor(tab),
                                        fontSize: 14,
                                        fontFamily: props.activeAccountTab === tab ? 'Inter' : 'overpass',
                                        textTransform: 'uppercase',
                                        // paddingLeft: 7,
                                    }}
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    /**
     * @description Renders View for search results
     */
    const searchResultsMobile = (
        <View
            style={{
                height: Dimensions.get('window').height,
                backgroundColor: '#fff',
            }}
        >
            <View
                style={{
                    width: '100%',
                    backgroundColor: '#fff',
                }}
            >
                {!loadingSearchResults &&
                searchTerm.trim().length !== 0 &&
                activeSearchResultsTab !== '' &&
                searchResultTabs.length > 0 ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            paddingVertical: 15,
                            backgroundColor: '#f8f8f8',
                            height: 54,
                        }}
                    >
                        <View
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: 1024,
                                alignSelf: 'center',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'none',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    position: 'absolute',
                                    left: 0,
                                    backgroundColor: 'none',
                                    paddingHorizontal: 5,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: 'overpass',
                                    }}
                                >
                                    {resultCount} results
                                </Text>
                            </View>
                            {searchResultTabs.map((tab: string, ind: number) => {
                                return (
                                    <TouchableOpacity
                                        key={ind.toString()}
                                        style={{
                                            marginRight: 38,
                                            paddingVertical: 3,
                                            backgroundColor: 'none',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderBottomColor: '#000',
                                            borderBottomWidth: tab === activeSearchResultsTab ? 1 : 0,
                                        }}
                                        onPress={() => {
                                            setActiveSearchResultsTab(tab);
                                        }}
                                    >
                                        {/* <Ionicons
                                            name={getSearchNavbarIconName(tab)}
                                            style={{ color: getSearchNavbarIconColor(tab) }}
                                            size={tab === 'Courses' ? 15 : 13}
                                        /> */}
                                        <Text
                                            style={{
                                                color: getSearchNavbarIconColor(tab),
                                                fontSize: 14,
                                                fontFamily: tab === activeSearchResultsTab ? 'Inter' : 'overpass',
                                                textTransform: 'uppercase',
                                                // paddingLeft: 7,
                                            }}
                                        >
                                            {tab === 'Discussion'
                                                ? 'Discussion'
                                                : tab === 'Content'
                                                ? 'Coursework'
                                                : tab}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}
                <View
                    style={{
                        maxWidth: 1024,
                        alignSelf: 'center',
                        width: '100%',
                    }}
                >
                    {!loadingSearchResults &&
                    searchTerm.trim().length !== 0 &&
                    results &&
                    results[searchOptions[0]].length === 0 &&
                    results[searchOptions[1]].length === 0 &&
                    results[searchOptions[2]].length === 0 &&
                    results[searchOptions[3]].length === 0 ? (
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 18,
                                paddingVertical: 50,
                                textAlign: 'center',
                                lineHeight: 30,
                                fontFamily: 'inter',
                                backgroundColor: '#fff',
                            }}
                        >
                            {searchTerm.trim().length !== 0 &&
                            results[searchOptions[0]].length === 0 &&
                            results[searchOptions[1]].length === 0 &&
                            results[searchOptions[2]].length === 0 &&
                            results[searchOptions[3]].length === 0
                                ? 'No search results found.'
                                : ''}
                        </Text>
                    ) : null}

                    {!loadingSearchResults && searchTerm.trim().length === 0 ? (
                        <View
                            style={{
                                maxHeight: Dimensions.get('window').height - 64,
                                backgroundColor: '#fff',
                                paddingHorizontal: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 20,
                                    paddingVertical: 20,
                                    fontFamily: 'inter',
                                    paddingLeft: 5,
                                    color: '#000',
                                    backgroundColor: '#fff',
                                    marginTop: recentSearches.length > 0 ? 0 : 50,
                                }}
                            >
                                {recentSearches.length > 0 ? 'Recent' : ''}
                            </Text>

                            {reversedSearches.map((search: string, ind: number) => {
                                return (
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            justifyContent: 'space-between',
                                        }}
                                        key={ind.toString()}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}
                                            onPress={() => setSearchTerm(search)}
                                        >
                                            <Ionicons name="time-outline" color="#000" size={22} />

                                            <Text
                                                style={{
                                                    paddingLeft: 12,
                                                    color: '#000',
                                                    // fontFamily: 'Inter',
                                                    fontSize: 16,
                                                }}
                                            >
                                                {search}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 'auto',
                                                paddingRight: 10,
                                                paddingTop: 2,
                                            }}
                                            onPress={() => removeRecentSearch(search)}
                                        >
                                            <Ionicons name="close-outline" size={20} color="" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                    {loadingSearchResults ? (
                        <View
                            style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                paddingVertical: 100,
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : null}
                    {!activeSearchResultsTab || loadingSearchResults || searchTerm.trim().length === 0 ? null : (
                        <ScrollView
                            style={{
                                maxHeight: Dimensions.get('window').height - 64,
                                backgroundColor: '#fff',
                            }}
                            showsVerticalScrollIndicator={true}
                            horizontal={false}
                            indicatorStyle="black"
                        >
                            {results[activeSearchResultsTab].map((obj: any, ind: number) => {
                                let t = '';
                                let s = '';
                                let channelName = '';
                                let colorCode = '';
                                let subscribed = false;
                                let messageSenderName = '';
                                let messageSenderAvatar = '';
                                let createdAt = '';

                                if (activeSearchResultsTab === 'Content') {
                                    const { title, subtitle } = htmlStringParser(obj.cue);
                                    t = title;
                                    s = subtitle;
                                    const filterChannel = props.subscriptions.filter((channel: any) => {
                                        return channel.channelId === obj.channelId;
                                    });

                                    if (filterChannel && filterChannel.length !== 0) {
                                        channelName = filterChannel[0].channelName;
                                        colorCode = filterChannel[0].colorCode;
                                    }

                                    createdAt = obj.date;
                                } else if (activeSearchResultsTab === 'Courses') {
                                    t = obj.name;

                                    channelName = obj.name;
                                    // Determine if already subscribed or not
                                    const existingSubscription = props.subscriptions.filter((channel: any) => {
                                        return channel.channelId === obj._id;
                                    });

                                    if (existingSubscription && existingSubscription.length !== 0) {
                                        subscribed = true;
                                    }
                                } else if (activeSearchResultsTab === 'Discussion') {
                                    if (obj.title) {
                                        const o = JSON.parse(obj.message);
                                        const { title, subtitle } = htmlStringParser(o.html);
                                        t = obj.title;
                                        s = subtitle;
                                    } else if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                        const o = JSON.parse(obj.message);
                                        t = o.title;
                                        s = o.type;
                                    } else {
                                        const { title, subtitle } = htmlStringParser(obj.message);
                                        t = title;
                                        s = subtitle;
                                    }
                                    const filterChannel = props.subscriptions.filter((channel: any) => {
                                        return channel.channelId === obj.channelId;
                                    });

                                    if (filterChannel && filterChannel.length !== 0) {
                                        channelName = filterChannel[0].channelName;
                                        colorCode = filterChannel[0].colorCode;
                                    }

                                    createdAt = obj.time;
                                } else if (activeSearchResultsTab === 'Messages') {
                                    const users = obj.groupId.users;

                                    const sender = users.filter((user: any) => user._id === obj.sentBy)[0];

                                    if (obj.groupId && obj.groupId.name) {
                                        messageSenderName = obj.groupId.name + ' > ' + sender.fullName;
                                        messageSenderAvatar = obj.groupId.image
                                            ? obj.groupId.image
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                    } else if (sender) {
                                        messageSenderName = sender.fullName;
                                        messageSenderAvatar = sender.avatar
                                            ? sender.avatar
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                    }

                                    if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                        const o = JSON.parse(obj.message);
                                        t = o.title;
                                        s = o.type;
                                    } else {
                                        const { title, subtitle } = htmlStringParser(obj.message);
                                        t = title;
                                        s = subtitle;
                                    }

                                    createdAt = obj.sentAt;
                                }

                                return (
                                    <SearchResultCard
                                        key={ind.toString()}
                                        title={t}
                                        subtitle={s}
                                        channelName={channelName}
                                        colorCode={colorCode}
                                        option={activeSearchResultsTab}
                                        subscribed={subscribed}
                                        messageSenderName={messageSenderName}
                                        messageSenderAvatar={messageSenderAvatar}
                                        createdAt={createdAt}
                                        handleSub={() => handleSub(obj._id)}
                                        onPress={async () => {
                                            if (activeSearchResultsTab === 'Content') {
                                                props.openCueFromCalendar(obj.channelId, obj._id, obj.createdBy);
                                                setSearchTerm('');
                                            } else if (activeSearchResultsTab === 'Discussion') {
                                                await AsyncStorage.setItem(
                                                    'openThread',
                                                    obj.parentId && obj.parentId !== '' ? obj.parentId : obj._id
                                                );

                                                if (obj.cueId && obj.cueId !== '') {
                                                    props.openQAFromSearch(obj.channelId, obj.cueId);
                                                } else {
                                                    props.openDiscussionFromSearch(obj.channelId);

                                                    props.setLoadDiscussionForChannelId(obj.channelId);
                                                }

                                                setSearchTerm('');
                                            } else if (activeSearchResultsTab === 'Messages') {
                                                // open chat and set Chat ID and users in Async storage to open that specific chat

                                                await AsyncStorage.setItem(
                                                    'openChat',
                                                    JSON.stringify({
                                                        _id: obj.groupId._id,
                                                        users: obj.users,
                                                    })
                                                );

                                                props.setOption('Inbox');

                                                setSearchTerm('');
                                            } else if (activeSearchResultsTab === 'Courses') {
                                                if (subscribed) {
                                                    // Open the channel meeting
                                                    props.openChannelFromActivity(obj._id);
                                                }
                                            }
                                        }}
                                        user={props.user}
                                    />
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </View>
        </View>
    );

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const renderOngoingMeetings = (createdBy: string, colorCode: string) => {
        return (
            <View style={{ width: '100%', maxWidth: 1024, backgroundColor: '#fff', paddingBottom: 30, paddingTop: 20 }}>
                <Text style={{ color: '#1f1f1f', fontSize: 15, fontFamily: 'inter', marginBottom: 20 }}>
                    In Progress
                </Text>

                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        // paddingTop: 10,
                        maxHeight: 500,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cccccc',
                        // borderLeftColor: colorCode,
                        // borderLeftWidth: 3,
                        // shadowOffset: {
                        //     width: 2,
                        //     height: 2,
                        // },
                        // shadowOpacity: 0.1,
                        // shadowRadius: 10,
                        // zIndex: 5000000,
                    }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        contentContainerStyle={{
                            paddingHorizontal: Dimensions.get('window').width < 768 ? 5 : 10,
                            borderColor: '#cccccc',
                            borderRadius: 2,
                            width: '100%',
                            maxHeight: Dimensions.get('window').width < 768 ? 400 : 500,
                        }}
                    >
                        {ongoingMeetings.map((meeting: any, ind: number) => {
                            let startTime = emailTimeDisplay(meeting.start);
                            let endTime = emailTimeDisplay(meeting.end);

                            return (
                                <View
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        borderColor: '#cccccc',
                                        paddingVertical: meeting.description ? 8 : 16,
                                        borderBottomWidth: ind === ongoingMeetings.length - 1 ? 0 : 1,
                                        // minWidth: 600, // flex: 1,
                                        width: '100%',
                                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                                    }}
                                    key={ind.toString()}
                                >
                                    <View style={{}}>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                padding: 5,
                                                fontFamily: 'inter',
                                                maxWidth: 300,
                                            }}
                                        >
                                            {meeting.title}
                                        </Text>
                                        {meeting.description ? (
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    padding: 5,
                                                    maxWidth: 300,
                                                }}
                                            >
                                                {meeting.description}
                                                {/* This is a sample description */}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginLeft: Dimensions.get('window').width < 768 ? 0 : 'auto',
                                            marginTop: Dimensions.get('window').width < 768 ? 5 : 0,
                                        }}
                                    >
                                        <View style={{ marginRight: 20 }}>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    padding: 5,
                                                    lineHeight: 13,
                                                }}
                                            >
                                                {startTime} to {endTime}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (meetingProvider !== '' && meeting.joinUrl) {
                                                        if (
                                                            Platform.OS === 'web' ||
                                                            Platform.OS === 'macos' ||
                                                            Platform.OS === 'windows'
                                                        ) {
                                                            window.open(meeting.joinUrl, '_blank');
                                                        } else {
                                                            Linking.openURL(meeting.joinUrl);
                                                        }
                                                    } else if (meetingProvider !== '' && !meeting.joinUrl) {
                                                        Alert('No meeting link found. Contact your instructor.');
                                                        return;
                                                    } else if (!userZoomInfo || userZoomInfo.accountId === '') {
                                                        Alert('Join Meeting?', '', [
                                                            {
                                                                text: 'Cancel',
                                                                style: 'cancel',
                                                                onPress: () => {
                                                                    return;
                                                                },
                                                            },
                                                            {
                                                                text: 'Okay',
                                                                onPress: () => {
                                                                    if (createdBy === userId) {
                                                                        if (
                                                                            Platform.OS === 'web' ||
                                                                            Platform.OS === 'macos' ||
                                                                            Platform.OS === 'windows'
                                                                        ) {
                                                                            window.open(meeting.startUrl, '_blank');
                                                                        } else {
                                                                            Linking.openURL(meeting.startUrl);
                                                                        }
                                                                    } else {
                                                                        if (
                                                                            Platform.OS === 'web' ||
                                                                            Platform.OS === 'macos' ||
                                                                            Platform.OS === 'windows'
                                                                        ) {
                                                                            window.open(meeting.joinUrl, '_blank');
                                                                        } else {
                                                                            Linking.openURL(meeting.joinUrl);
                                                                        }
                                                                    }
                                                                },
                                                            },
                                                        ]);
                                                    } else {
                                                        if (createdBy === userId) {
                                                            if (
                                                                Platform.OS === 'web' ||
                                                                Platform.OS === 'macos' ||
                                                                Platform.OS === 'windows'
                                                            ) {
                                                                window.open(meeting.startUrl, '_blank');
                                                            } else {
                                                                Linking.openURL(meeting.startUrl);
                                                            }
                                                        } else {
                                                            if (
                                                                Platform.OS === 'web' ||
                                                                Platform.OS === 'macos' ||
                                                                Platform.OS === 'windows'
                                                            ) {
                                                                window.open(meeting.joinUrl, '_blank');
                                                            } else {
                                                                Linking.openURL(meeting.joinUrl);
                                                            }
                                                        }
                                                    }
                                                }}
                                                style={{}}
                                                disabled={props.user.email === disableEmailId}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        fontFamily: 'inter',
                                                        color: '#000',
                                                        marginRight: 20,
                                                    }}
                                                >
                                                    Join {createdBy === userId ? '' : 'Meeting'}
                                                </Text>
                                            </TouchableOpacity>

                                            {createdBy === userId ? (
                                                <TouchableOpacity
                                                    onPress={async () => {
                                                        await navigator.clipboard.writeText(meeting.joinUrl);
                                                        Alert('Invite link copied!');
                                                    }}
                                                    style={{}}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 15,
                                                            fontFamily: 'inter',
                                                            color: '#000',
                                                            marginRight: 20,
                                                        }}
                                                    >
                                                        Copy Invite
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        );
    };

    const renderInstantMeetingPopup = () => {
        return (
            <Popup
                isOpen={showInstantMeeting}
                buttons={[
                    {
                        text: 'Start',
                        color: 'dark',
                        handler: function (event) {
                            createInstantMeeting();
                        },
                        disabled: props.user.email === disableEmailId,
                    },
                    {
                        text: 'Cancel',
                        color: 'dark',
                        handler: function (event) {
                            setShowInstantMeeting(false);
                            setInstantMeetingChannelId('');
                            setInstantMeetingCreatedBy('');
                            setInstantMeetingTitle('');
                            setInstantMeetingDescription('');
                            setInstantMeetingStart('');
                            setInstantMeetingEnd('');
                        },
                    },
                ]}
                theme="ios"
                themeVariant="light"
                onClose={() => {
                    setShowInstantMeeting(false);
                    setInstantMeetingChannelId('');
                    setInstantMeetingCreatedBy('');
                }}
                responsive={{
                    small: {
                        display: 'bottom',
                    },
                    medium: {
                        // Custom breakpoint
                        display: 'center',
                    },
                }}
            >
                <View
                    style={{
                        flexDirection: 'column',
                        paddingHorizontal: Dimensions.get('window').width > 768 ? 25 : 0,
                        backgroundColor: '#f8f8f8',
                    }}
                    className="mbsc-align-center mbsc-padding"
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        contentContainerStyle={{
                            width: '100%',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                paddingHorizontal: 20,
                                marginVertical: 20,
                                minWidth: Dimensions.get('window').width > 768 ? 400 : 200,
                                maxWidth: Dimensions.get('window').width > 768 ? 400 : 300,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter',
                                    marginBottom: 20,
                                }}
                            >
                                Start an Instant meeting
                            </Text>

                            <View style={{ width: '100%', maxWidth: 400, marginTop: 20, backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    Topic
                                </Text>
                                <View style={{ marginTop: 10, marginBottom: 10 }}>
                                    <DefaultInput
                                        style={{
                                            padding: 10,
                                            fontSize: 15,
                                            borderColor: '#f2f2f2',
                                            borderBottomWidth: 1,
                                        }}
                                        value={instantMeetingTitle}
                                        placeholder={''}
                                        onChangeText={(val) => setInstantMeetingTitle(val)}
                                        placeholderTextColor={'#1F1F1F'}
                                        // required={true}
                                    />
                                </View>
                            </View>

                            <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    Description
                                </Text>
                                <View style={{ marginTop: 10, marginBottom: 10 }}>
                                    <DefaultInput
                                        style={{
                                            padding: 10,
                                            fontSize: 15,
                                            borderColor: '#f2f2f2',
                                            borderBottomWidth: 1,
                                        }}
                                        value={instantMeetingDescription}
                                        placeholder={''}
                                        onChangeText={(val) => setInstantMeetingDescription(val)}
                                        placeholderTextColor={'#1F1F1F'}
                                        // required={true}
                                    />
                                </View>
                            </View>
                            {/* <View
                            style={{
                                width: '100%',
                                maxWidth: 400,
                                // paddingVertical: 15,
                                backgroundColor: '#f8f8f8'
                            }}>
                            <Text style={styles.text}>{PreferredLanguageText('start')}</Text>
                            <View style={{ marginTop: 10, marginBottom: 10 }}>
                                <Datepicker
                                    controls={['date', 'time']}
                                    touchUi={true}
                                    theme="ios"
                                    value={instantMeetingStart}
                                    themeVariant="light"
                                    // inputComponent="input"
                                    inputProps={{
                                        placeholder: 'Select start...',
                                        backgroundColor: 'white'
                                    }}
                                    onChange={(event: any) => {
                                        const date = new Date(event.value);
                                        const roundOffDate = roundSeconds(date);
                                        setInstantMeetingStart(roundOffDate);
                                    }}
                                    responsive={{
                                        xsmall: {
                                            controls: ['date', 'time'],
                                            display: 'bottom',
                                            touchUi: true
                                        },
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false
                                        }
                                    }}
                                />
                            </View>
                        </View> */}
                            <View
                                style={{
                                    width: '100%',
                                    maxWidth: 400,
                                    // paddingVertical: 15,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    {PreferredLanguageText('end')}
                                </Text>
                                <View style={{ marginTop: 10, marginBottom: 10 }}>
                                    <Datepicker
                                        controls={['date', 'time']}
                                        touchUi={true}
                                        theme="ios"
                                        value={instantMeetingEnd}
                                        themeVariant="light"
                                        // inputComponent="input"
                                        inputProps={{
                                            placeholder: 'Select end...',
                                            backgroundColor: 'white',
                                        }}
                                        onChange={(event: any) => {
                                            const date = new Date(event.value);
                                            const roundOffDate = roundSeconds(date);
                                            setInstantMeetingEnd(roundOffDate);
                                        }}
                                        responsive={{
                                            xsmall: {
                                                controls: ['date', 'time'],
                                                display: 'bottom',
                                                touchUi: true,
                                            },
                                            medium: {
                                                controls: ['date', 'time'],
                                                display: 'anchored',
                                                touchUi: false,
                                            },
                                        }}
                                    />
                                </View>
                            </View>
                            <View
                                style={{
                                    width: '100%',
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    Notify Users
                                </Text>
                            </View>
                            <View
                                style={{
                                    height: 40,
                                    marginRight: 10,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Switch
                                    value={instantMeetingAlertUsers}
                                    onValueChange={() => {
                                        setInstantMeetingAlertUsers(!instantMeetingAlertUsers);
                                    }}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#000',
                                        true: '#007AFF',
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                            {/* <View
                                style={{
                                    width: '100%',
                                    maxWidth: 400,
                                    // paddingVertical: 15,

                                    backgroundColor: '#f8f8f8'
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: '#000000',
                                        textTransform: 'uppercase',
                                        lineHeight: 20,
                                        fontFamily: 'Inter'
                                    }}
                                >
                                    NOTE: You can schedule future meetings under Agenda
                                </Text>
                            </View> */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    width: '100%',
                                    backgroundColor: '#f8f8f8',
                                    borderRadius: 10,
                                }}
                            >
                                <Text style={{}}>
                                    <Ionicons name="time-outline" size={23} color="#f3722c" />
                                </Text>
                                <Text
                                    style={{
                                        paddingLeft: 10,
                                        fontSize: 13,
                                        color: '#000000',
                                        lineHeight: 20,
                                        fontFamily: 'Overpass',
                                    }}
                                >
                                    Note: You can schedule future meetings under Agenda
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Popup>
        );
    };

    /**
     * @description Formats time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    const renderWorkspaceNavbar = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    paddingVertical: 15,
                    backgroundColor:
                        selectedWorkspace.split('-SPLIT-')[0] === 'My Notes'
                            ? '#000'
                            : selectedWorkspace.split('-SPLIT-')[3],
                    height: 64,
                }}
            >
                {/* Arrow back */}
                <View
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 1024,
                        alignSelf: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'none',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            position: 'absolute',
                            left: 0,
                            backgroundColor: 'none',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedWorkspace('');
                                props.setSelectedWorkspace('');
                                props.setOpenChannelId('');
                                props.setWorkspaceActiveTab('Content');
                            }}
                            style={{
                                width: 30,
                                backgroundColor: 'none',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 15,
                            }}
                        >
                            <Ionicons size={32} name="arrow-back-outline" color="#fff" />
                        </TouchableOpacity>
                        <Text
                            style={{
                                fontSize: 20,
                                fontFamily: 'Inter',
                                marginRight: 75,
                                color: '#fff',
                                // textTransform: 'uppercase',
                            }}
                        >
                            {selectedWorkspace.split('-SPLIT-')[0]}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'none',
                            zIndex: 50000,
                            // backgroundColor: '#f8f8f8',
                        }}
                    >
                        {selectedWorkspace.split('-SPLIT-')[0] !== 'My Notes' &&
                            props.workspaceOptions.map((tab: string, ind: number) => {
                                if (tab === 'Settings' && selectedWorkspace.split('-SPLIT-')[2] !== userId) return null;
                                return (
                                    <TouchableOpacity
                                        key={ind.toString()}
                                        style={{
                                            marginRight: 38,
                                            paddingVertical: 3,
                                            backgroundColor: 'none',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderBottomColor: '#fff',
                                            borderBottomWidth: tab === props.activeWorkspaceTab ? 1 : 0,
                                        }}
                                        onPress={() => {
                                            props.setWorkspaceActiveTab(tab);
                                        }}
                                    >
                                        {/* <Ionicons
                                            name={getWorkspaceNavbarIconName(tab)}
                                            style={{ color: getWorkspaceNavbarIconColor(tab) }}
                                            size={tab === 'Meet' ? 15 : tab === 'Scores' ? 14 : 13}
                                        /> */}
                                        <Text
                                            style={{
                                                color: getWorkspaceNavbarIconColor(tab),
                                                fontSize: 14,
                                                fontFamily: tab === props.activeWorkspaceTab ? 'inter' : 'overpass',
                                                textTransform: 'uppercase',
                                                // paddingLeft: 5,
                                            }}
                                        >
                                            {tab === 'Content'
                                                ? 'Coursework'
                                                : tab === 'Discuss'
                                                ? 'Discussion'
                                                : tab === 'Meet'
                                                ? 'Meetings'
                                                : tab}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                    </View>
                    <View
                        style={{
                            right: 0,
                            position: 'absolute',
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'none',
                        }}
                    >
                        {selectedWorkspace && props.activeWorkspaceTab === 'Content' ? (
                            <TouchableOpacity
                                style={{ backgroundColor: 'none', marginLeft: 15 }}
                                onPress={() => {
                                    setShowFilterPopup(true);
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: '#fff',
                                        textAlign: 'right',
                                    }}
                                >
                                    <Ionicons name="filter-outline" size={20} />
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </View>
        );
    };

    /**
     * @description Overview nested
     */
    const overviewNested = (
        <View
            key={collapseMap.toString()}
            style={{
                flexDirection: 'row',
                width: '100%',
            }}
        >
            {/* Add sort by filter here */}
            <ScrollView
                persistentScrollbar={true}
                showsVerticalScrollIndicator={true}
                horizontal={false}
                contentContainerStyle={{
                    width: '100%',
                    height: width < 768 ? Dimensions.get('window').height - 115 : Dimensions.get('window').height - 64,
                    backgroundColor: '#fff',
                }}
                ref={scrollViewRef}
            >
                {selectedWorkspace === '' ? (
                    <View>
                        {Object.keys(cueMap).map((key: any, ind: any) => {
                            return (
                                // Do not add a parent component above this
                                <View key={ind}>
                                    <View
                                        style={{
                                            backgroundColor: '#fff',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            borderColor: '#f2f2f2',
                                            paddingHorizontal: width < 1024 && props.option === 'Classroom' ? 20 : 0,
                                            borderTopWidth: ind === 0 ? 0 : 1,
                                            paddingBottom: 0,
                                            maxWidth: 1024,
                                            alignSelf: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                backgroundColor: '#fff',
                                            }}
                                            onPress={() => {
                                                setSelectedWorkspace(key);
                                                props.setSelectedWorkspace(key);
                                                scrollViewRef.current?.scrollTo({
                                                    y: 0,
                                                    animated: false,
                                                });
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 20,
                                                    paddingVertical: 25,
                                                    fontFamily: 'inter',
                                                    flex: 1,
                                                    backgroundColor: '#fff',
                                                    lineHeight: 20,
                                                    color: '#000000',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: 12,
                                                        // marginTop: 2,
                                                        marginRight: 8,
                                                        backgroundColor: key.split('-SPLIT-')[3]
                                                            ? key.split('-SPLIT-')[3]
                                                            : '#000',
                                                    }}
                                                />{' '}
                                                {key.split('-SPLIT-')[0]}
                                            </Text>
                                        </TouchableOpacity>
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                paddingLeft: 15,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'center',
                                                    display: 'flex',
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setSelectedWorkspace(key);
                                                    }}
                                                    style={{
                                                        backgroundColor: '#fff',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            lineHeight: 30,
                                                            backgroundColor: '#fff',
                                                        }}
                                                    >
                                                        <Ionicons
                                                            name={'chevron-forward-outline'}
                                                            size={23}
                                                            color={'#dddddd'}
                                                        />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : null}
                {/* Since only one Selected workspace */}
                {selectedWorkspace && cueMap[selectedWorkspace] ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#fff',
                            height: props.activeWorkspaceTab === 'Discuss' ? '100%' : 'auto',
                        }}
                        key={selectedWorkspace.toString()}
                    >
                        <View
                            style={{
                                width: '100%',
                                maxWidth: 1024,
                                backgroundColor: '#fff',
                                paddingHorizontal: width < 1024 ? 20 : 0,
                                height: props.activeWorkspaceTab === 'Discuss' ? '100%' : 'auto',
                            }}
                        >
                            {props.activeWorkspaceTab !== 'Content' ? (
                                props.activeWorkspaceTab === 'Discuss' ? (
                                    <Discussion
                                        channelId={selectedWorkspace.split('-SPLIT-')[1]}
                                        filterChoice={selectedWorkspace.split('-SPLIT-')[0]}
                                        channelCreatedBy={selectedWorkspace.split('-SPLIT-')[2]}
                                        refreshUnreadDiscussionCount={() => props.refreshUnreadDiscussionCount()}
                                        channelColor={selectedWorkspace.split('-SPLIT-')[3]}
                                        showNewDiscussionPost={showNewDiscussionPost}
                                        setShowNewDiscussionPost={setShowNewDiscussionPost}
                                        user={props.user}
                                    />
                                ) : // Meet
                                props.activeWorkspaceTab === 'Meet' ? (
                                    <View
                                        style={{
                                            alignItems: 'center',
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        {/* {selectedWorkspace.split('-SPLIT-')[2] === userId ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    marginBottom: 20,
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        handleStartMeeting(
                                                            selectedWorkspace.split('-SPLIT-')[1],
                                                            selectedWorkspace.split('-SPLIT-')[2]
                                                        )
                                                    }
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        overflow: 'hidden',
                                                        height: 35,
                                                        justifyContent: 'center',
                                                        flexDirection: 'row',
                                                        marginLeft: 'auto',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            lineHeight: 34,
                                                            color: '#fff',
                                                            borderRadius: 15,
                                                            backgroundColor: '#007AFF',
                                                            fontSize: 13,
                                                            paddingHorizontal: 20,
                                                            fontFamily: 'inter',
                                                            height: 35,
                                                            width: 175,
                                                            textTransform: 'uppercase',
                                                        }}
                                                    >
                                                        Start Meeting
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : null} */}

                                        {ongoingMeetings.length > 0
                                            ? renderOngoingMeetings(
                                                  selectedWorkspace.split('-SPLIT-')[2],
                                                  selectedWorkspace.split('-SPLIT-')[3]
                                              )
                                            : null}

                                        <Performance
                                            channelName={selectedWorkspace.split('-SPLIT-')[0]}
                                            onPress={(name: any, id: any, createdBy: any) => {
                                                props.setChannelFilterChoice('All');
                                                props.handleFilterChange(name);
                                                props.setChannelId(id);
                                                props.setChannelCreatedBy(createdBy);
                                                props.openGrades();
                                                props.hideHome();
                                            }}
                                            filterStart={filterStart}
                                            filterEnd={filterEnd}
                                            channelId={selectedWorkspace.split('-SPLIT-')[1]}
                                            channelCreatedBy={selectedWorkspace.split('-SPLIT-')[2]}
                                            subscriptions={props.subscriptions}
                                            openCueFromGrades={props.openCueFromCalendar}
                                            colorCode={selectedWorkspace.split('-SPLIT-')[3]}
                                            activeTab={'meetings'}
                                            isOwner={selectedWorkspace.split('-SPLIT-')[2] === userId}
                                            userId={userId}
                                            user={props.user}
                                        />
                                    </View>
                                ) : // Scores
                                props.activeWorkspaceTab === 'Scores' ? (
                                    <Performance
                                        channelName={selectedWorkspace.split('-SPLIT-')[0]}
                                        onPress={(name: any, id: any, createdBy: any) => {
                                            props.setChannelFilterChoice('All');
                                            props.handleFilterChange(name);
                                            props.setChannelId(id);
                                            props.setChannelCreatedBy(createdBy);
                                            props.openGrades();
                                            props.hideHome();
                                        }}
                                        filterStart={filterStart}
                                        channelId={selectedWorkspace.split('-SPLIT-')[1]}
                                        channelCreatedBy={selectedWorkspace.split('-SPLIT-')[2]}
                                        filterEnd={filterEnd}
                                        subscriptions={props.subscriptions}
                                        openCueFromGrades={props.openCueFromCalendar}
                                        colorCode={selectedWorkspace.split('-SPLIT-')[3]}
                                        activeTab={'scores'}
                                        isOwner={selectedWorkspace.split('-SPLIT-')[2] === userId}
                                        userId={userId}
                                        exportScores={exportScores}
                                        setExportScores={(exp: boolean) => setExportScores(exp)}
                                        user={props.user}
                                    />
                                ) : (
                                    <ChannelSettings
                                        channelId={selectedWorkspace.split('-SPLIT-')[1]}
                                        refreshSubscriptions={props.refreshSubscriptions}
                                        userId={userId}
                                        channelColor={selectedWorkspace.split('-SPLIT-')[3]}
                                        userCreatedOrg={userCreatedOrg}
                                        user={props.user}
                                    />
                                )
                            ) : cueMap[selectedWorkspace].length === 0 ? (
                                <Text
                                    style={{
                                        width: '100%',
                                        color: '#1F1F1F',
                                        fontSize: 16,
                                        paddingVertical: 100,
                                        paddingHorizontal: 5,
                                        fontFamily: 'inter',
                                    }}
                                >
                                    {selectedWorkspace.split('-SPLIT-')[0] !== 'My Notes'
                                        ? selectedWorkspace.split('-SPLIT-')[2] === userId
                                            ? PreferredLanguageText('noCuesCreatedInstructor')
                                            : PreferredLanguageText('noCuesCreated')
                                        : PreferredLanguageText('noNotesCreated')}
                                </Text>
                            ) : (
                                <ScrollView
                                    horizontal={true}
                                    contentContainerStyle={{
                                        maxWidth: '100%',
                                        width: '100%',
                                        backgroundColor: '#fff',
                                        paddingTop: 25,
                                    }}
                                    showsHorizontalScrollIndicator={false}
                                >
                                    {categoryMap[selectedWorkspace].map((category: any, i: any) => {
                                        // Check if even one category exists in cues

                                        const foundCue = cueMap[selectedWorkspace].find(
                                            (cue: any) =>
                                                cue.customCategory.toString().trim() === category.toString().trim()
                                        );

                                        if (!foundCue) return null;

                                        return (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    maxWidth: 155,
                                                    backgroundColor: '#fff',
                                                    marginRight: 25,
                                                }}
                                                key={i.toString()}
                                            >
                                                <View
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        paddingLeft: 5,
                                                        marginBottom: 12,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            flex: 1,
                                                            flexDirection: 'row',
                                                            color: '#1F1F1F',
                                                            fontSize: 14,
                                                            lineHeight: 25,
                                                            fontFamily: 'inter',
                                                            backgroundColor: '#fff',
                                                        }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {category === '' ? ' ' : category}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={{
                                                        maxWidth: 155,
                                                        paddingLeft: 5,
                                                        backgroundColor: '#fff',
                                                        width: '100%',
                                                    }}
                                                    key={i.toString()}
                                                >
                                                    {cueMap[selectedWorkspace].map((cue: any, index: any) => {
                                                        if (
                                                            cue.customCategory.toString().trim() !==
                                                            category.toString().trim()
                                                        ) {
                                                            return null;
                                                        }
                                                        return (
                                                            <View
                                                                style={{
                                                                    marginBottom: 15,
                                                                    backgroundColor: '#fff',
                                                                    width: '100%',
                                                                    maxWidth: 155,
                                                                }}
                                                                key={index}
                                                            >
                                                                <Card
                                                                    gray={true}
                                                                    cueIds={cueIds}
                                                                    fadeAnimation={props.fadeAnimation}
                                                                    updateModal={() => {
                                                                        props.openUpdate(
                                                                            cue.key,
                                                                            cue.index,
                                                                            0,
                                                                            cue._id,
                                                                            cue.createdBy ? cue.createdBy : '',
                                                                            cue.channelId ? cue.channelId : ''
                                                                        );
                                                                    }}
                                                                    cue={cue}
                                                                    channelId={props.channelId}
                                                                    subscriptions={props.subscriptions}
                                                                />
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
            {props.option === 'Classroom' &&
            selectedWorkspace &&
            !showNewDiscussionPost &&
            props.activeWorkspaceTab !== 'Settings' &&
            (props.activeWorkspaceTab !== 'Meet' || selectedWorkspace.split('-SPLIT-')[2] === userId) &&
            !(
                props.activeWorkspaceTab === 'Content' &&
                !(
                    selectedWorkspace.split('-SPLIT-')[0] === 'My Notes' ||
                    selectedWorkspace.split('-SPLIT-')[2] === userId
                )
            ) ? (
                <TouchableOpacity
                    onPress={() => {
                        if (props.activeWorkspaceTab === 'Content') {
                            props.openCreate();
                        } else if (props.activeWorkspaceTab === 'Discuss') {
                            console.log('Set show new discussion post true');
                            setShowNewDiscussionPost(true);
                        } else if (props.activeWorkspaceTab === 'Meet') {
                            handleStartMeeting(
                                selectedWorkspace.split('-SPLIT-')[1],
                                selectedWorkspace.split('-SPLIT-')[2]
                            );
                        } else if (props.activeWorkspaceTab === 'Scores') {
                            setExportScores(true);
                        }
                    }}
                    style={{
                        position: 'absolute',
                        marginRight:
                            Dimensions.get('window').width >= 1200
                                ? (Dimensions.get('window').width - 1200) / 2
                                : Dimensions.get('window').width >= 1024
                                ? (Dimensions.get('window').width - 1024) / 2 - 20
                                : 20,
                        marginBottom: Dimensions.get('window').width < 768 ? 77 : 25,
                        right: 0,
                        justifyContent: 'center',
                        bottom: 0,
                        width: 58,
                        height: 58,
                        borderRadius: 29,
                        backgroundColor:
                            selectedWorkspace.split('-SPLIT-')[0] === 'My Notes'
                                ? '#000'
                                : selectedWorkspace.split('-SPLIT-')[3],
                        borderColor: '#000',
                        borderWidth: 0,
                        // shadowColor: '#000',
                        // shadowOffset: {
                        //     width: 4,
                        //     height: 4,
                        // },
                        // shadowOpacity: 0.12,
                        // shadowRadius: 10,
                        zIndex: 500000,
                    }}
                >
                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                        {props.activeWorkspaceTab === 'Content' ? (
                            <Ionicons
                                name="create-outline"
                                size={25}
                                style={{
                                    paddingLeft: 3,
                                }}
                            />
                        ) : props.activeWorkspaceTab === 'Discuss' ? (
                            <Ionicons name="add-outline" size={35} />
                        ) : props.activeWorkspaceTab === 'Meet' ? (
                            <Ionicons name="videocam-outline" size={25} />
                        ) : props.activeWorkspaceTab === 'Scores' ? (
                            <Ionicons name="download-outline" size={28} />
                        ) : null}
                    </Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );

    const renderMainNavbar = () => {
        return (
            <View
                style={{
                    backgroundColor: '#000',
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 0 : 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    width: '100%',
                    height: 64,
                    paddingVertical: 2,
                    zIndex: 500000,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        maxWidth: 1024,
                        backgroundColor: 'none',
                        // paddingVertical: 10,
                        padding: '0.5rem 1rem',
                        flex: 1,
                        maxHeight: 50,
                    }}
                >
                    {Dimensions.get('window').width < 768 ? null : (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'none',
                                flex: 1,
                                // height: 28,
                                paddingBottom: 2,
                                paddingTop: 0,
                            }}
                        >
                            <Image
                                source={logo}
                                style={{
                                    width: 61,
                                    // marginTop: 1,
                                    height: 23,
                                    marginRight: 20,
                                }}
                                resizeMode={'contain'}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    paddingRight: 30,
                                    flex: 1,
                                    backgroundColor: 'none',
                                    paddingTop: 1,
                                }}
                            >
                                {props.options.map((op: any, ind: number) => {
                                    if (op === 'Account') return null;

                                    return (
                                        <TouchableOpacity
                                            key={ind.toString()}
                                            style={{
                                                backgroundColor: 'none',
                                            }}
                                            onPress={() => {
                                                if (op === 'To Do') {
                                                    setFilterEventsType('');
                                                    setFilterByChannel('');
                                                }
                                                if (op === 'Classroom') {
                                                    props.closeCreateModal();
                                                }
                                                props.setOption(op);
                                                if (op === 'Browse') {
                                                    props.openCreate();
                                                }
                                            }}
                                        >
                                            <Text style={op === props.option ? styles.allGrayFill : styles.all}>
                                                {op === 'Classroom'
                                                    ? props.version === 'read'
                                                        ? 'Library'
                                                        : 'Workspace'
                                                    : op === 'Performance'
                                                    ? 'Performance'
                                                    : op === 'To Do'
                                                    ? 'Agenda'
                                                    : op}
                                            </Text>

                                            {op === 'Inbox' && props.unreadMessages > 0 ? (
                                                <View
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: 7,
                                                        backgroundColor: '#f94144',
                                                        position: 'absolute',
                                                        top: -1,
                                                        right: 6,
                                                    }}
                                                />
                                            ) : null}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'none',
                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                            margin: 0,
                        }}
                    >
                        {Dimensions.get('window').width < 768 ? (
                            <Image
                                source={logo}
                                style={{
                                    width: 56,
                                    marginTop: 1,
                                    height: 20,
                                    marginRight: 13,
                                }}
                                resizeMode={'contain'}
                            />
                        ) : null}

                        <TouchableOpacity
                            style={{ backgroundColor: 'none', marginRight: 15 }}
                            onPress={() => {
                                props.openHelpModal(true);
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: '#1F1F1F',
                                    marginTop: 1,
                                    textAlign: 'right',
                                }}
                            >
                                <Ionicons
                                    name="help-circle-outline"
                                    size={20}
                                    color={props.option === 'Settings' && props.showHelp ? '#007AFF' : '#f2f2f2'}
                                />
                            </Text>
                        </TouchableOpacity>

                        {props.option === 'Account' || props.option === 'Inbox' ? null : (
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: '#e8e8e8',
                                    paddingVertical: 6,
                                    paddingHorizontal: 12,
                                    borderRadius: 24,
                                }}
                            >
                                <Ionicons size={15} name="search-outline" color={'#000'} style={{}} />
                                <DefaultInput
                                    value={searchTerm}
                                    style={{
                                        color: '#727272',
                                        backgroundColor: 'none',
                                        fontSize: 13,
                                        flex: 1,
                                        fontFamily: 'Inter',
                                        paddingLeft: 5,
                                        maxWidth: 225,
                                    }}
                                    placeholder={'Search'}
                                    onChangeText={(val) => setSearchTerm(val)}
                                    placeholderTextColor={'#727272'}
                                />
                                {searchTerm !== '' ? (
                                    <TouchableOpacity
                                        style={{
                                            marginLeft: 'auto',
                                            backgroundColor: '#e8e8e8',
                                            width: 15,
                                        }}
                                        onPress={() => {
                                            setSearchTerm('');
                                        }}
                                    >
                                        <Ionicons name="close-outline" size={15} color="#000" />
                                    </TouchableOpacity>
                                ) : (
                                    <View
                                        style={{
                                            marginLeft: 'auto',
                                            width: 15,
                                        }}
                                    />
                                )}
                            </View>
                        )}
                        <TouchableOpacity
                            style={{
                                marginLeft: 15,
                                backgroundColor: 'none',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                height: 30,
                            }}
                            onPress={() => {
                                props.setOption('Account');
                            }}
                        >
                            <Image
                                style={{
                                    height: 30,
                                    width: 30,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri: avatar,
                                }}
                            />
                        </TouchableOpacity>

                        {Dimensions.get('window').width < 768 && props.option === 'Account' ? (
                            <Menu
                                style={{
                                    marginLeft: 15,
                                    right: 0,
                                }}
                                onSelect={(op: any) => {
                                    props.setActiveAccountTab(op);
                                }}
                            >
                                <MenuTrigger>
                                    <Text>
                                        <Ionicons name={'menu-outline'} size={23} color={'#f2f2f2'} />
                                    </Text>
                                </MenuTrigger>
                                <MenuOptions
                                    optionsContainerStyle={{
                                        shadowOffset: {
                                            width: 2,
                                            height: 2,
                                        },
                                        shadowColor: '#000',
                                        // overflow: 'hidden',
                                        shadowOpacity: 0.07,
                                        shadowRadius: 7,
                                        padding: 7,
                                        // borderWidth: 1,
                                        // borderColor: '#CCC'
                                    }}
                                >
                                    {props.accountTabs.map((tab: string, ind: number) => {
                                        return (
                                            <MenuOption value={tab} key={ind.toString()}>
                                                <Text
                                                    style={{
                                                        fontFamily: 'inter',
                                                        fontSize: 15,
                                                        fontWeight: 'bold',
                                                        color: tab === props.activeAccountTab ? '#007AFF' : '#1f1f1f',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {tab}
                                                </Text>
                                            </MenuOption>
                                        );
                                    })}
                                </MenuOptions>
                            </Menu>
                        ) : null}
                    </View>
                </div>
            </View>
        );
    };

    // MAIN RETURN
    return (
        <View
            style={{
                height: windowHeight,
                backgroundColor: props.option === 'To Do' ? '#f8f8f8' : '#fff',
            }}
        >
            {renderInstantMeetingPopup()}
            {/* Hide navbar if workspace is open */}
            {selectedWorkspace === '' && props.modalType !== 'Create' ? renderMainNavbar() : null}

            {searchTerm === '' ? (
                props.modalType === 'Create' && (props.option === 'Classroom' || props.option === 'Browse') ? (
                    <Create
                        key={JSON.stringify(props.customCategories)}
                        customCategories={props.customCategories}
                        closeModal={() => props.closeModal()}
                        closeAfterCreatingMyNotes={() => props.closeAfterCreatingMyNotes()}
                        option={props.option}
                        version={props.version}
                        user={props.user}
                        courseColor={
                            selectedWorkspace.split('-SPLIT-')[0] === 'My Notes'
                                ? '#000'
                                : selectedWorkspace.split('-SPLIT-')[3]
                        }
                        courseName={selectedWorkspace.split('-SPLIT-')[0]}
                    />
                ) : (
                    <View
                        style={{
                            alignSelf: 'center',
                            width: '100%',
                            backgroundColor: props.option === 'To Do' ? '#f8f8f8' : '#fff',
                            height: width < 768 ? windowHeight - 104 : windowHeight - 64,
                        }}
                    >
                        {/* Add tabs to switch between Account tabs  */}
                        {props.option === 'Account' && Dimensions.get('window').width > 768
                            ? renderAccountTabs()
                            : null}
                        {props.option === 'Account' && props.activeAccountTab === 'profile' ? (
                            <Walkthrough
                                closeModal={() => {}}
                                saveDataInCloud={() => props.saveDataInCloud()}
                                reOpenProfile={() => props.reOpenProfile()}
                                reloadData={() => props.reloadData()}
                                setShowHelp={(val: any) => props.setShowHelp(val)}
                                showHelp={props.showHelp}
                                user={props.user}
                            />
                        ) : null}
                        {props.option === 'Account' && props.activeAccountTab === 'courses' ? (
                            <Channels
                                setShowCreate={(val: any) => props.setShowCreate(val)}
                                showCreate={props.showCreate}
                                closeModal={() => {}}
                                subscriptions={props.subscriptions}
                                refreshSubscriptions={props.refreshSubscriptions}
                                user={props.user}
                            />
                        ) : null}
                        {props.option === 'Classroom' && selectedWorkspace ? renderWorkspaceNavbar() : null}
                        {props.option === 'Classroom' ? overviewNested : null}
                        {props.option === 'To Do' ? (
                            <CalendarX
                                tab={props.tab}
                                version={props.version}
                                setTab={(val: any) => props.setTab(val)}
                                filterStart={filterStart}
                                filterEnd={filterEnd}
                                cues={props.calendarCues}
                                subscriptions={props.subscriptions}
                                openCueFromCalendar={props.openCueFromCalendar}
                                openDiscussion={props.openDiscussionFromActivity}
                                openChannel={props.openChannelFromActivity}
                                openQA={props.openQAFromActivity}
                                filterByChannel={filterByChannel}
                                filterEventsType={filterEventsType}
                                user={props.user}
                            />
                        ) : null}
                        {props.option === 'Inbox' ? (
                            <Inbox
                                showDirectory={props.showDirectory}
                                setShowDirectory={(val: any) => props.setShowDirectory(val)}
                                subscriptions={props.subscriptions}
                                refreshUnreadInbox={props.refreshUnreadInbox}
                                hideNewChatButton={props.hideNewChatButton}
                                userId={userId}
                                user={props.user}
                            />
                        ) : null}
                    </View>
                )
            ) : (
                searchResultsMobile
            )}
            <Popup
                isOpen={showFilterPopup}
                buttons={[
                    {
                        text: 'Ok',
                        color: 'dark',
                        handler: function (event) {
                            setShowFilterPopup(false);
                        },
                    },
                    {
                        text: 'Reset',
                        color: 'dark',
                        handler: function (event) {
                            setFilterStart(null);
                            setFilterEnd(null);
                            setFilterByChannel('All');
                            setFilterEventsType('All');
                            setShowFilterPopup(false);
                        },
                    },
                ]}
                themeVariant="light"
                theme="ios"
                onClose={() => setShowFilterPopup(false)}
                responsive={{
                    small: {
                        display: 'center',
                    },
                    medium: {
                        display: 'center',
                    },
                }}
            >
                {/* Show all the settings here */}
                <View
                    style={{ flexDirection: 'column', padding: 25, backgroundColor: 'none' }}
                    className="mbsc-align-center mbsc-padding"
                >
                    {props.option === 'Classroom' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                    paddingLeft: 5,
                                    paddingBottom: 10,
                                }}
                            >
                                Sort By
                            </Text>

                            <label style={{ width: 200, backgroundColor: 'white' }}>
                                <Select
                                    touchUi={true}
                                    theme="ios"
                                    themeVariant="light"
                                    value={sortBy}
                                    onChange={(val: any) => {
                                        setSortBy(val.value);
                                        updateSortByAsync(val.value);
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble',
                                        },
                                        medium: {
                                            touchUi: false,
                                        },
                                    }}
                                    dropdown={false}
                                    data={sortbyOptions}
                                />
                            </label>
                        </div>
                    ) : null}

                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: 'Inter',
                                color: '#000000',
                                paddingLeft: 5,
                                paddingBottom: 10,
                            }}
                        >
                            Filter
                        </Text>

                        <label style={{ width: 200, backgroundColor: 'white' }}>
                            <Datepicker
                                theme="ios"
                                themeVariant="light"
                                controls={['calendar']}
                                select="range"
                                touchUi={true}
                                inputProps={{
                                    placeholder: 'Select',
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble',
                                    },
                                    medium: {
                                        touchUi: false,
                                    },
                                }}
                                value={[filterStart, filterEnd]}
                                onChange={(val: any) => {
                                    setFilterStart(val.value[0]);
                                    setFilterEnd(val.value[1]);
                                }}
                            />
                        </label>
                    </div>
                </View>
            </Popup>
        </View>
    );
};

// export default React.memo(Dashboard, (prev, next) => {
//     return _.isEqual(
//         {
//             ...prev.cues,
//             ...prev.tab,
//             ...prev.showDirectory,
//             ...prev.showHelp,
//             ...prev.modalType,
//         },
//         {
//             ...next.cues,
//             ...next.tab,
//             ...next.showDirectory,
//             ...next.showHelp,
//             ...next.modalType
//         }
//     );
// });

export default Dashboard;

const styleObject: any = () =>
    StyleSheet.create({
        all: {
            fontSize: 14,
            color: '#fff',
            height: 24,
            marginHorizontal: 15,
            backgroundColor: 'none',
            lineHeight: 24,
            fontFamily: 'overpass',
            textTransform: 'uppercase',
            // marginRight: 5,
        },
        allGrayFill: {
            fontSize: 14,
            color: '#fff',
            marginHorizontal: 15,
            backgroundColor: 'none',
            lineHeight: 24,
            height: 24,
            fontFamily: 'inter',
            textTransform: 'uppercase',
            borderBottomColor: '#fff',
            borderBottomWidth: 1,
            // marginRight: 5,
        },
        all1: {
            fontSize: 11,
            color: '#1F1F1F',
            height: 20,
            lineHeight: 20,
            paddingHorizontal: 8,
            backgroundColor: '#f8f8f8',
            fontFamily: 'inter',
            textAlign: 'center',
            marginBottom: 1,
        },
        allGrayFill1: {
            fontSize: 11,
            color: '#007AFF',
            height: 20,
            lineHeight: 20,
            paddingHorizontal: 8,
            fontFamily: 'inter',
            textAlign: 'center',
            marginBottom: 1,
        },
    });
