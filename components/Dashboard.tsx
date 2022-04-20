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
import { zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';

const Dashboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const styles = styleObject();
    const [userId, setUserId] = useState('');
    const [avatar, setAvatar] = useState('');
    const [userCreatedOrg, setUserCreatedOrg] = useState(false);
    const scrollViewRef: any = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [collapseMap, setCollapseMap] = useState<any>({});
    const [results, setResults] = useState<any>({
        Channels: [],
        Classroom: [],
        Messages: [],
        Threads: [],
    });
    const [resultCount, setResultCount] = useState(0);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [filterStart, setFilterStart] = useState<any>(null);
    const [filterEnd, setFilterEnd] = useState<any>(null);
    const [searchOptions] = useState(['Classroom', 'Messages', 'Threads', 'Channels']);
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
    const [selectedWorkspace, setSelectedWorkspace] = useState<any>();
    const [showNewDiscussionPost, setShowNewDiscussionPost] = useState(false);

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

    useEffect(() => {
        props.setSelectedWorkspace(selectedWorkspace);
    }, [selectedWorkspace]);

    const getWorkspaceNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                return props.activeWorkspaceTab === op ? 'library' : 'library-outline';
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
            return selectedWorkspace.split('-SPLIT-')[3];
        }
        return '#797979';
    };

    const getAccountNavbarIconName = (op: string) => {
        switch (op) {
            case 'profile':
                return 'person-outline';
            case 'courses':
                return 'school-outline';
            default:
                return '';
        }
    };

    const getAccountNavbarIconColor = (op: string) => {
        if (op === props.activeAccountTab) {
            return '#000';
        }
        return '#797979';
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
     * @description Update selected Workspace in Home
     */
    //  useEffect(() => {
    //     props.setSelectedWorkspace(selectedWorkspace);
    //     // setCategoryPositionList([])
    // }, [selectedWorkspace]);

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
     * @description Scrolls to specific channel in Channels ScrollView for openChannelId
     */
    useEffect(() => {
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

            setOpenChannelId('');
        }
    }, [scrollViewRef.current, channelKeyList, channelHeightList, openChannelId]);

    /**
     * @description Scrolls to specific channel in Channels ScrollView for loadDiscussionForChannelId
     */
    useEffect(() => {
        if (
            scrollViewRef &&
            scrollViewRef.current !== null &&
            channelKeyList &&
            channelKeyList.length > 0 &&
            channelHeightList &&
            channelHeightList.length > 0 &&
            loadDiscussionForChannelId !== ''
        ) {
            let matchIndex = -1;

            channelKeyList.map((key: any, index: number) => {
                if (key === loadDiscussionForChannelId) {
                    matchIndex = index;
                }
            });

            let indexMapKey = '';

            Object.keys(indexMap).map((key: any) => {
                if (key.split('-SPLIT-')[1] === loadDiscussionForChannelId) {
                    indexMapKey = key;
                }
            });

            if (
                matchIndex === -1 ||
                !channelHeightList[matchIndex] ||
                indexMapKey === '' ||
                !loadDiscussionForChannelId
            )
                return;

            const temp = JSON.parse(JSON.stringify(indexMap));
            temp[indexMapKey] = 1;
            setIndexMap(temp);

            const tempCollapse = JSON.parse(JSON.stringify(collapseMap));
            tempCollapse[indexMapKey] = !collapseMap[indexMapKey];
            setCollapseMap(tempCollapse);

            scrollViewRef.current.scrollTo({
                x: 0,
                y: channelHeightList[matchIndex],
                animated: true,
            });

            setLoadDiscussionForChannelId('');
        }
    }, [scrollViewRef.current, channelKeyList, channelHeightList, loadDiscussionForChannelId, indexMap, collapseMap]);

    /**
     * @description Prepares all the data to be displayed in workspace
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                setUserId(user._id);

                if (user.avatar) {
                    setAvatar(user.avatar);
                } else {
                    setAvatar('https://cues-files.s3.amazonaws.com/images/default.png');
                }

                if (user.userCreatedOrg) {
                    setUserCreatedOrg(user.userCreatedOrg);
                }

                if (user.zoomInfo) {
                    setUserZoomInfo(user.zoomInfo);
                }
            }
        })();

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
        tempCat['My Notes'] = Object.keys(cat);
        tempIndexes['My Notes'] = 0;

        setCueMap(temp);
        setCategoryMap(tempCat);
        setIndexMap(tempIndexes);
    }, [sortBy, filterStart, filterEnd, props.subscriptions, props.cues]);

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
        getCurrentMeetings();
    }, [userId, collapseMap]);

    /**
     * @description Fetches search results for search term
     */
    useEffect(() => {
        if (searchTerm.trim() === '') {
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
                        Classroom: [...res.data.personalCues, ...res.data.channelCues],
                        Channels: res.data.channels,
                        Threads: res.data.threads,
                        Messages: res.data.messages,
                    };

                    setResultCount(totalCount);
                    setResults(tempResults);
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
        let channelId = '';

        Object.keys(collapseMap).map((key: any) => {
            if (collapseMap[key] && key.split('-SPLIT-')[0] !== 'My Notes') {
                channelId = key.split('-SPLIT-')[1];
            }
        });

        if (userId !== '' && channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getOngoingMeetings,
                    variables: {
                        userId,
                        channelId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.channel.ongoingMeetings) {
                        setOngoingMeetings(res.data.channel.ongoingMeetings);
                    }
                })
                .catch((err) => {
                    Alert('Something went wrong.');
                });
        }
    }, [userId, collapseMap]);

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
                                }}
                                onPress={() => {
                                    props.setActiveAccountTab(tab);
                                }}
                            >
                                <Ionicons
                                    name={getAccountNavbarIconName(tab)}
                                    style={{ color: getAccountNavbarIconColor(tab) }}
                                    size={17}
                                />
                                <Text
                                    style={{
                                        color: getAccountNavbarIconColor(tab),
                                        fontSize: 15,
                                        fontFamily: 'Inter',
                                        textTransform: 'capitalize',
                                        paddingLeft: 7,
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
     * @description Renders filter for Agenda
     */
    const renderEventFilters = () => {
        const channelOptions = [
            { value: 'All', text: 'All' },
            { value: 'My Events', text: 'My Events' },
        ];

        props.subscriptions.map((sub: any) => {
            channelOptions.push({
                value: sub.channelId,
                text: sub.channelName,
            });
        });

        const typeOptions = [
            { value: 'All', text: 'All' },
            { value: 'Meetings', text: 'Meetings' },
            { value: 'Submissions', text: 'Submissions' },
            { value: 'Events', text: 'Events' },
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: 'Inter',
                            color: '#000000',
                            paddingLeft: 5,
                            paddingBottom: 10,
                        }}
                    >
                        Workspace
                    </Text>
                    <label style={{ width: 200, backgroundColor: 'white' }}>
                        <Select
                            touchUi={true}
                            theme="ios"
                            themeVariant="light"
                            value={filterByChannel}
                            onChange={(val: any) => {
                                setFilterByChannel(val.value);
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
                            data={channelOptions}
                        />
                    </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: 'Inter',
                            color: '#000000',
                            paddingLeft: 5,
                            paddingBottom: 10,
                        }}
                    >
                        Type
                    </Text>

                    <label style={{ width: 200, backgroundColor: 'white' }}>
                        <Select
                            touchUi={true}
                            theme="ios"
                            themeVariant="light"
                            value={filterEventsType}
                            onChange={(val: any) => {
                                setFilterEventsType(val.value);
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
                            data={typeOptions}
                        />
                    </label>
                </div>
            </div>
        );
    };

    /**
     * @description Renders View for search results
     */
    const searchResults = (
        <View
            key={cueMap.toString() + JSON.stringify(results)}
            style={{
                flexDirection: 'row',
                height:
                    Dimensions.get('window').width < 768
                        ? Dimensions.get('window').height - 115
                        : Dimensions.get('window').height - 52,
                width: '100%',
                overflow: 'hidden',
                justifyContent: 'center',
                backgroundColor: '#f8f8f8',
            }}
        >
            <View
                style={{
                    width: '100%',
                    maxWidth: 1024,
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 0,
                    backgroundColor: '#f8f8f8',
                }}
            >
                {!loadingSearchResults && resultCount !== 0 ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            backgroundColor: '#f8f8f8',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                paddingVertical: 30,
                                fontFamily: 'inter',
                                // flex: 1,
                                lineHeight: 23,
                                color: '#006AFF',
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            {resultCount} Results
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#f8f8f8',
                                overflow: 'hidden',
                                height: 30,
                                alignSelf: 'center',
                            }}
                            onPress={() => {
                                setSearchTerm('');
                            }}
                        >
                            <Ionicons name="close-outline" size={24} />
                        </TouchableOpacity>
                    </View>
                ) : null}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    horizontal={true}
                    nestedScrollEnabled={true}
                    contentContainerStyle={{
                        width: '100%',
                        backgroundColor: '#fff',
                    }}
                >
                    {!loadingSearchResults &&
                    results &&
                    results[searchOptions[0]].length === 0 &&
                    results[searchOptions[1]].length === 0 &&
                    results[searchOptions[2]].length === 0 &&
                    results[searchOptions[3]].length === 0 ? (
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 20,
                                paddingVertical: 50,
                                fontFamily: 'inter',
                                flex: 1,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            No search results found.
                        </Text>
                    ) : null}
                    {loadingSearchResults ? (
                        <View
                            style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : null}
                    <View style={{ flexDirection: 'row', backgroundColor: '#f8f8f8' }}>
                        {searchOptions.map((option: any, ind: number) => {
                            if (results[option].length === 0 || loadingSearchResults) {
                                return null;
                            }

                            return (
                                <View key={ind.toString()} style={{ marginRight: 20, backgroundColor: '#f8f8f8' }}>
                                    <Text
                                        style={{
                                            flexDirection: 'row',
                                            color: '#1F1F1F',
                                            // fontWeight: 'bold',
                                            fontSize: 14,
                                            lineHeight: 25,
                                            fontFamily: 'inter',
                                            paddingBottom: 10,
                                        }}
                                    >
                                        {option === 'Classroom' ? 'Content' : option}
                                    </Text>
                                    <ScrollView
                                        contentContainerStyle={{
                                            paddingRight: 10,
                                        }}
                                    >
                                        {results[option].map((obj: any, index: number) => {
                                            let t = '';
                                            let s = '';
                                            let channelName = '';
                                            let colorCode = '';
                                            let subscribed = false;
                                            let messageSenderName = '';
                                            let messageSenderAvatar = '';

                                            if (option === 'Classroom') {
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
                                            } else if (option === 'Channels') {
                                                t = obj.name;

                                                channelName = obj.name;
                                                // Determine if already subscribed or not
                                                const existingSubscription = props.subscriptions.filter(
                                                    (channel: any) => {
                                                        return channel.channelId === obj._id;
                                                    }
                                                );

                                                if (existingSubscription && existingSubscription.length !== 0) {
                                                    subscribed = true;
                                                }
                                            } else if (option === 'Threads') {
                                                if (
                                                    obj.message[0] === '{' &&
                                                    obj.message[obj.message.length - 1] === '}'
                                                ) {
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
                                            } else if (option === 'Messages') {
                                                const users = obj.groupId.users;

                                                const sender = users.filter((user: any) => user._id === obj.sentBy)[0];

                                                if (obj.groupId && obj.groupId.name) {
                                                    messageSenderName = obj.groupId.name + ' > ' + sender.fullName;
                                                    messageSenderAvatar = obj.groupId.image ? obj.groupId.image : '';
                                                } else if (sender) {
                                                    messageSenderName = sender.fullName;
                                                    messageSenderAvatar = sender.avatar ? sender.avatar : '';
                                                }

                                                if (
                                                    obj.message[0] === '{' &&
                                                    obj.message[obj.message.length - 1] === '}'
                                                ) {
                                                    const o = JSON.parse(obj.message);
                                                    t = o.title;
                                                    s = o.type;
                                                } else {
                                                    const { title, subtitle } = htmlStringParser(obj.message);
                                                    t = title;
                                                    s = subtitle;
                                                }
                                            }

                                            return (
                                                <View
                                                    style={{
                                                        // height: 150,
                                                        marginBottom: 15,
                                                        // marginBottom: i === priorities.length - 1 ? 0 : 20,
                                                        // maxWidth: 150,
                                                        backgroundColor: '#f8f8f8',
                                                        width: '100%',
                                                        maxWidth: 160,
                                                    }}
                                                    key={index}
                                                >
                                                    <SearchResultCard
                                                        title={t}
                                                        subtitle={s}
                                                        channelName={channelName}
                                                        messageSenderName={messageSenderName}
                                                        messageSenderAvatar={messageSenderAvatar}
                                                        colorCode={colorCode}
                                                        option={option}
                                                        subscribed={subscribed}
                                                        handleSub={() => handleSub(obj._id)}
                                                        onPress={async () => {
                                                            if (option === 'Classroom') {
                                                                props.openCueFromCalendar(
                                                                    obj.channelId,
                                                                    obj._id,
                                                                    obj.createdBy
                                                                );
                                                                setSearchTerm('');
                                                            } else if (option === 'Threads') {
                                                                await AsyncStorage.setItem(
                                                                    'openThread',
                                                                    obj.parentId && obj.parentId !== ''
                                                                        ? obj.parentId
                                                                        : obj._id
                                                                );

                                                                if (obj.cueId && obj.cueId !== '') {
                                                                    props.openQAFromSearch(obj.channelId, obj.cueId);
                                                                } else {
                                                                    props.openDiscussionFromSearch(obj.channelId);

                                                                    props.setLoadDiscussionForChannelId(obj.channelId);
                                                                }

                                                                setSearchTerm('');
                                                            } else if (option === 'Messages') {
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
                                                            } else if (option === 'Channels') {
                                                                if (subscribed) {
                                                                    // Open the channel meeting
                                                                    props.openChannelFromActivity(obj._id);
                                                                    setSearchTerm('');
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
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
            <View style={{ width: '100%', maxWidth: 1024, backgroundColor: '#fff', paddingBottom: 30 }}>
                <Text style={{ color: '#1f1f1f', fontSize: 15, fontFamily: 'inter', marginBottom: 20 }}>
                    In Progress
                </Text>

                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        // paddingTop: 10,
                        maxHeight: 500,
                        paddingHorizontal: 10,
                        borderRadius: 1,
                        borderLeftColor: colorCode,
                        borderLeftWidth: 3,
                        shadowOffset: {
                            width: 2,
                            height: 2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        zIndex: 5000000,
                    }}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        // style={{ height: '100%' }}
                        contentContainerStyle={{
                            // borderWidth: 1,
                            // borderRightWidth: 0,
                            // borderLeftWidth: 0,
                            // borderRightWidth: 1,
                            paddingHorizontal: Dimensions.get('window').width < 768 ? 5 : 10,
                            borderColor: '#f2f2f2',
                            borderRadius: 1,
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
                                        borderColor: '#f2f2f2',
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
                                                fontSize: 13,
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
                                                    fontSize: 12,
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
                                                    fontSize: 12,
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
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily: 'inter',
                                                        color: '#006AFF',
                                                        marginRight: 20,
                                                    }}
                                                >
                                                    JOIN {createdBy === userId ? '' : 'MEETING'}
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
                                                            fontSize: 12,
                                                            fontFamily: 'inter',
                                                            color: '#006AFF',
                                                            marginRight: 20,
                                                        }}
                                                    >
                                                        COPY INVITE
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
                        text: 'START',
                        handler: function (event) {
                            createInstantMeeting();
                        },
                    },
                    {
                        text: 'CANCEL',
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
                                        fontSize: 12,
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
                                            fontSize: 14,
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
                                        fontSize: 12,
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
                                            fontSize: 14,
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
                                        fontSize: 12,
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
                                        fontSize: 12,
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
                                        false: '#f2f2f2',
                                        true: '#006AFF',
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
                                        fontSize: 12,
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
                    backgroundColor: '#f8f8f8',
                    height: 54,
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
                            <Ionicons size={28} name="arrow-back-outline" color="#1f1f1f" />
                        </TouchableOpacity>
                        <Text
                            style={{
                                fontSize: 18,
                                fontFamily: 'inter',
                                marginRight: 75,
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
                        }}
                    >
                        {selectedWorkspace.split('-SPLIT-')[0] !== 'My Notes' &&
                            props.workspaceOptions.map((tab: string, ind: number) => {
                                if (tab === 'Settings' && selectedWorkspace.split('-SPLIT-')[2] !== userId) return null;
                                return (
                                    <TouchableOpacity
                                        key={ind.toString()}
                                        style={{
                                            marginRight: 30,
                                            paddingVertical: 3,
                                            backgroundColor: 'none',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => {
                                            props.setWorkspaceActiveTab(tab);
                                        }}
                                    >
                                        <Ionicons
                                            name={getWorkspaceNavbarIconName(tab)}
                                            style={{ color: getWorkspaceNavbarIconColor(tab) }}
                                            size={17}
                                        />
                                        <Text
                                            style={{
                                                color: getWorkspaceNavbarIconColor(tab),
                                                fontSize: 15,
                                                fontFamily: 'Inter',
                                                textTransform: 'capitalize',
                                                paddingLeft: 7,
                                            }}
                                        >
                                            {tab === 'Content' ? 'Coursework' : tab === 'Discuss' ? 'FAQ' : tab}
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
                                        color: '#1f1f1f',
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
                    height:
                        width < 768
                            ? Dimensions.get('window').height - 115
                            : Dimensions.get('window').height - 52 - (selectedWorkspace ? 45 : 0),
                    backgroundColor: '#fff',
                }}
                ref={scrollViewRef}
            >
                {Object.keys(cueMap).map((key: any, ind: any) => {
                    return (
                        // Do not add a parent component above this
                        <View key={ind}>
                            {!selectedWorkspace ? (
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
                                            scrollViewRef.current?.scrollTo({
                                                y: 0,
                                                animated: false,
                                            });
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 18,
                                                paddingVertical: 20,
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
                                                    borderRadius: 9,
                                                    // marginTop: 2,
                                                    marginRight: 5,
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
                                                        size={18}
                                                        color={'#006AFF'}
                                                    />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    );
                })}
                {/* Since only one Selected workspace */}
                {selectedWorkspace ? (
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
                                                            backgroundColor: '#006AFF',
                                                            fontSize: 12,
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
                                    />
                                ) : (
                                    <ChannelSettings
                                        channelId={selectedWorkspace.split('-SPLIT-')[1]}
                                        refreshSubscriptions={props.refreshSubscriptions}
                                        userId={userId}
                                        channelColor={selectedWorkspace.split('-SPLIT-')[3]}
                                        userCreatedOrg={userCreatedOrg}
                                    />
                                )
                            ) : cueMap[selectedWorkspace].length === 0 ? (
                                <Text
                                    style={{
                                        width: '100%',
                                        color: '#1F1F1F',
                                        fontSize: 18,
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
                                                    maxWidth: 145,
                                                    backgroundColor: '#fff',
                                                    marginRight: 15,
                                                }}
                                                key={i.toString()}
                                            >
                                                <View
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        paddingLeft: 5,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            flex: 1,
                                                            flexDirection: 'row',
                                                            color: '#1F1F1F',
                                                            // fontWeight: 'bold',
                                                            fontSize: 12,
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
                                                        maxWidth: 145,
                                                        paddingLeft: 5,
                                                        backgroundColor: '#fff',
                                                        width: '100%',
                                                    }}
                                                    key={i.toString() + selectedWorkspace.toString()}
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
                                                                    maxWidth: 145,
                                                                }}
                                                                key={index}
                                                            >
                                                                <Card
                                                                    gray={true}
                                                                    cueIds={cueIds}
                                                                    onLongPress={() => {
                                                                        setCueIds([]);
                                                                        setEditFolderChannelId(
                                                                            cue.channelId ? cue.channelId : 'My Notes'
                                                                        );
                                                                    }}
                                                                    add={() => {
                                                                        const temp = JSON.parse(JSON.stringify(cueIds));
                                                                        const found = temp.find((i: any) => {
                                                                            return i === cue._id;
                                                                        });
                                                                        if (!found) {
                                                                            temp.push(cue._id);
                                                                        }
                                                                        setCueIds(temp);
                                                                    }}
                                                                    remove={() => {
                                                                        const temp = JSON.parse(JSON.stringify(cueIds));
                                                                        const upd = temp.filter((i: any) => {
                                                                            return i !== cue._id;
                                                                        });
                                                                        setCueIds(upd);
                                                                    }}
                                                                    editFolderChannelId={editFolderChannelId}
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
        </View>
    );

    // /**
    //  * @description Renders all the channels under workspace
    //  */
    // const overview = (
    //     <View
    //         key={collapseMap.toString()}
    //         style={{
    //             flexDirection: 'row',
    //             width: '100%',
    //             bottom: 0,
    //         }}
    //     >
    //         {/* Add sort by filter here */}
    //         <ScrollView
    //             persistentScrollbar={true}
    //             showsVerticalScrollIndicator={true}
    //             horizontal={false}
    //             contentContainerStyle={{
    //                 width: '100%',
    //                 height: width < 768 ? Dimensions.get('window').height - 115 : Dimensions.get('window').height - 52,
    //                 backgroundColor: '#f8f8f8',
    //             }}
    //             ref={scrollViewRef}
    //         >
    //             {Object.keys(cueMap).map((key: any, ind: any) => {
    //                 return (
    //                     // Do not add a parent component above this
    //                     <View
    //                         key={ind}
    //                         onLayout={(event) => {
    //                             const layout = event.nativeEvent.layout;
    //                             const temp1 = [...channelKeyList];
    //                             const temp2 = [...channelHeightList];
    //                             temp1[ind] = key.split('-SPLIT-')[1];
    //                             temp2[ind] = layout.y;
    //                             setChannelKeyList(temp1);
    //                             setChannelHeightList(temp2);
    //                         }}
    //                     >
    //                         <InsetShadow
    //                             shadowColor={'#000'}
    //                             shadowOffset={2}
    //                             shadowOpacity={0} // no shadow
    //                             shadowRadius={collapseMap[key] ? 10 : 0}
    //                             elevation={500000}
    //                             containerStyle={{
    //                                 height: 'auto',
    //                             }}
    //                         >
    //                             <View
    //                                 style={{
    //                                     backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                     borderColor: '#f2f2f2',
    //                                     borderTopWidth: ind !== 0 && collapseMap[key] ? 1 : 0,
    //                                     // paddingBottom: 10,
    //                                 }}
    //                             >
    //                                 {ind !== 0 ? (
    //                                     <View
    //                                         style={{
    //                                             backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                             flexDirection: 'row',
    //                                             borderColor: '#f2f2f2',
    //                                             paddingTop: 10,
    //                                             paddingHorizontal:
    //                                                 width < 1024 && props.option === 'Classroom' ? 20 : 0,
    //                                             borderTopWidth:
    //                                                 ind === 0 ||
    //                                                 collapseMap[key] ||
    //                                                 collapseMap[Object.keys(cueMap)[ind - 1]]
    //                                                     ? 0
    //                                                     : 1,
    //                                             paddingBottom: 0,
    //                                             maxWidth: 1024,
    //                                             alignSelf: 'center',
    //                                             width: '100%',
    //                                         }}
    //                                     >
    //                                         <TouchableOpacity
    //                                             style={{
    //                                                 flex: 1,
    //                                                 flexDirection: 'row',
    //                                                 backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                             }}
    //                                             onPress={() => {
    //                                                 const tempCollapse = JSON.parse(JSON.stringify(collapseMap));

    //                                                 Object.keys(tempCollapse).forEach((item: any, index: any) => {
    //                                                     if (item === key) return;
    //                                                     tempCollapse[item] = false;
    //                                                 });

    //                                                 tempCollapse[key] = !collapseMap[key];
    //                                                 setCollapseMap(tempCollapse);
    //                                             }}
    //                                         >
    //                                             <Text
    //                                                 style={{
    //                                                     fontSize: 18,
    //                                                     paddingBottom: 20,
    //                                                     paddingTop: 9,
    //                                                     fontFamily: 'inter',
    //                                                     flex: 1,
    //                                                     backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                     lineHeight: 18,
    //                                                     color: collapseMap[key] ? '#000000' : '#1a3026',
    //                                                 }}
    //                                             >
    //                                                 <View
    //                                                     style={{
    //                                                         width: 12,
    //                                                         height: 12,
    //                                                         borderRadius: 9,
    //                                                         // marginTop: 2,
    //                                                         marginRight: 5,
    //                                                         backgroundColor: key.split('-SPLIT-')[3],
    //                                                     }}
    //                                                 />{' '}
    //                                                 {key.split('-SPLIT-')[0]}
    //                                             </Text>
    //                                         </TouchableOpacity>
    //                                         <View
    //                                             style={{
    //                                                 backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                 paddingTop: 5,
    //                                                 paddingLeft: 15,
    //                                             }}
    //                                         >
    //                                             <View
    //                                                 style={{
    //                                                     flexDirection: 'row',
    //                                                     justifyContent: 'center',
    //                                                     display: 'flex',
    //                                                     backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                 }}
    //                                             >
    //                                                 <TouchableOpacity
    //                                                     onPress={() => {
    //                                                         // const tempCollapse = JSON.parse(
    //                                                         //     JSON.stringify(collapseMap)
    //                                                         // );

    //                                                         // Object.keys(tempCollapse).forEach(
    //                                                         //     (item: any, index: any) => {
    //                                                         //         if (item === key) return;
    //                                                         //         tempCollapse[item] = false;
    //                                                         //     }
    //                                                         // );

    //                                                         // tempCollapse[key] = !collapseMap[key];
    //                                                         // setCollapseMap(tempCollapse);
    //                                                         setSelectedWorkspace(key);
    //                                                     }}
    //                                                     style={{
    //                                                         backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                     }}
    //                                                 >
    //                                                     <Text
    //                                                         style={{
    //                                                             textAlign: 'center',
    //                                                             lineHeight: 30,
    //                                                             backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                         }}
    //                                                     >
    //                                                         <Ionicons
    //                                                             name={
    //                                                                 collapseMap[key]
    //                                                                     ? 'chevron-up-outline'
    //                                                                     : 'chevron-down-outline'
    //                                                             }
    //                                                             size={18}
    //                                                             color={collapseMap[key] ? '#1F1F1F' : '#006AFF'}
    //                                                         />
    //                                                     </Text>
    //                                                 </TouchableOpacity>
    //                                             </View>
    //                                         </View>
    //                                     </View>
    //                                 ) : (
    //                                     <View
    //                                         style={{
    //                                             backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                             flexDirection: 'row',
    //                                             paddingBottom: 0,
    //                                             paddingHorizontal:
    //                                                 width < 1024 && props.option === 'Classroom' ? 20 : 0,
    //                                             maxWidth: 1024,
    //                                             alignSelf: 'center',
    //                                             width: '100%',
    //                                         }}
    //                                     >
    //                                         <TouchableOpacity
    //                                             style={{
    //                                                 flex: 1,
    //                                                 flexDirection: 'row',
    //                                                 backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                             }}
    //                                             onPress={() => {
    //                                                 const tempCollapse = JSON.parse(JSON.stringify(collapseMap));

    //                                                 Object.keys(tempCollapse).forEach((item: any, index: any) => {
    //                                                     if (item === key) return;
    //                                                     tempCollapse[item] = false;
    //                                                 });

    //                                                 tempCollapse[key] = !collapseMap[key];
    //                                                 setCollapseMap(tempCollapse);
    //                                             }}
    //                                         >
    //                                             <Text
    //                                                 ellipsizeMode="tail"
    //                                                 style={{
    //                                                     fontSize: 18,
    //                                                     paddingBottom: 20,
    //                                                     backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                     paddingTop: 19,
    //                                                     fontFamily: 'inter',
    //                                                     flex: 1,
    //                                                     lineHeight: 18,
    //                                                     color: collapseMap[key] ? '#000000' : '#1F1F1F',
    //                                                 }}
    //                                             >
    //                                                 <View
    //                                                     style={{
    //                                                         width: 12,
    //                                                         height: 12,
    //                                                         marginRight: 5,
    //                                                         borderRadius: 9,
    //                                                         backgroundColor: '#000000',
    //                                                     }}
    //                                                 />{' '}
    //                                                 {key}
    //                                             </Text>
    //                                         </TouchableOpacity>
    //                                         <View
    //                                             style={{
    //                                                 flexDirection: 'row',
    //                                                 justifyContent: 'space-evenly',
    //                                                 backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                 paddingTop: 10,
    //                                             }}
    //                                         >
    //                                             <View
    //                                                 style={{
    //                                                     flexDirection: 'row',
    //                                                     paddingLeft: 7,
    //                                                     justifyContent: 'center',
    //                                                     display: 'flex',
    //                                                     backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                 }}
    //                                             >
    //                                                 <TouchableOpacity
    //                                                     onPress={() => {
    //                                                         const tempCollapse = JSON.parse(
    //                                                             JSON.stringify(collapseMap)
    //                                                         );
    //                                                         tempCollapse[key] = !collapseMap[key];

    //                                                         Object.keys(tempCollapse).forEach(
    //                                                             (item: any, index: any) => {
    //                                                                 if (item === key) return;
    //                                                                 tempCollapse[item] = false;
    //                                                             }
    //                                                         );

    //                                                         setCollapseMap(tempCollapse);
    //                                                     }}
    //                                                     style={{
    //                                                         backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                         paddingTop: 5,
    //                                                         paddingLeft: 15,
    //                                                     }}
    //                                                 >
    //                                                     <Text
    //                                                         style={{
    //                                                             textAlign: 'center',
    //                                                             lineHeight: 30,
    //                                                             backgroundColor: collapseMap[key] ? '#fff' : '#f8f8f8',
    //                                                         }}
    //                                                     >
    //                                                         <Ionicons
    //                                                             name={
    //                                                                 collapseMap[key]
    //                                                                     ? 'chevron-up-outline'
    //                                                                     : 'chevron-down-outline'
    //                                                             }
    //                                                             size={18}
    //                                                             color={collapseMap[key] ? '#1F1F1F' : '#006AFF'}
    //                                                         />
    //                                                     </Text>
    //                                                 </TouchableOpacity>
    //                                             </View>
    //                                         </View>
    //                                     </View>
    //                                 )}
    //                                 {collapseMap[key] && ind !== 0 ? renderTabs(key) : null}
    //                                 <View
    //                                     style={{
    //                                         flexDirection: 'row',
    //                                         justifyContent: 'center',
    //                                         backgroundColor: '#fff',
    //                                         borderColor: '#f2f2f2',
    //                                         borderBottomWidth:
    //                                             collapseMap[key] && ind !== Object.keys(cueMap).length - 1 ? 1 : 0,
    //                                     }}
    //                                     key={collapseMap.toString()}
    //                                 >
    //                                     <View
    //                                         style={{
    //                                             width: '100%',
    //                                             maxWidth: 1024,
    //                                             backgroundColor: '#fff',
    //                                             paddingHorizontal: width < 1024 ? 20 : 0,
    //                                         }}
    //                                     >
    //                                         {collapseMap[key] ? (
    //                                             <View
    //                                                 style={{
    //                                                     width: '100%',
    //                                                     paddingBottom: 25,
    //                                                     backgroundColor: '#fff',
    //                                                 }}
    //                                                 key={
    //                                                     editFolderChannelId.toString() +
    //                                                     cueIds.toString() +
    //                                                     cueMap.toString()
    //                                                 }
    //                                             >
    //                                                 {indexMap[key] !== 0 ? (
    //                                                     indexMap[key] === 1 ? (
    //                                                         <Discussion
    //                                                             channelId={key.split('-SPLIT-')[1]}
    //                                                             filterChoice={key.split('-SPLIT-')[0]}
    //                                                             channelCreatedBy={key.split('-SPLIT-')[2]}
    //                                                             refreshUnreadDiscussionCount={() =>
    //                                                                 props.refreshUnreadDiscussionCount()
    //                                                             }
    //                                                             channelColor={key.split('-SPLIT-')[3]}
    //                                                         />
    //                                                     ) : // Meet
    //                                                     indexMap[key] === 2 ? (
    //                                                         <View
    //                                                             style={{
    //                                                                 alignItems: 'center',
    //                                                                 backgroundColor: '#fff',
    //                                                             }}
    //                                                         >
    //                                                             {key.split('-SPLIT-')[2] === userId ? (
    //                                                                 <View
    //                                                                     style={{
    //                                                                         width: '100%',
    //                                                                         marginBottom: 20,
    //                                                                         backgroundColor: '#fff',
    //                                                                     }}
    //                                                                 >
    //                                                                     <TouchableOpacity
    //                                                                         onPress={() =>
    //                                                                             handleStartMeeting(
    //                                                                                 key.split('-SPLIT-')[1],
    //                                                                                 key.split('-SPLIT-')[2]
    //                                                                             )
    //                                                                         }
    //                                                                         style={{
    //                                                                             backgroundColor: '#fff',
    //                                                                             overflow: 'hidden',
    //                                                                             height: 35,
    //                                                                             marginTop: 20,
    //                                                                             justifyContent: 'center',
    //                                                                             flexDirection: 'row',
    //                                                                             marginLeft: 'auto',
    //                                                                         }}
    //                                                                     >
    //                                                                         <Text
    //                                                                             style={{
    //                                                                                 textAlign: 'center',
    //                                                                                 lineHeight: 34,
    //                                                                                 color: '#fff',
    //                                                                                 borderRadius: 15,
    //                                                                                 backgroundColor: '#006AFF',
    //                                                                                 fontSize: 12,
    //                                                                                 paddingHorizontal: 20,
    //                                                                                 fontFamily: 'inter',
    //                                                                                 height: 35,
    //                                                                                 width: 175,
    //                                                                                 textTransform: 'uppercase',
    //                                                                             }}
    //                                                                         >
    //                                                                             Start Meeting
    //                                                                         </Text>
    //                                                                     </TouchableOpacity>
    //                                                                 </View>
    //                                                             ) : null}

    //                                                             {ongoingMeetings.length > 0
    //                                                                 ? renderOngoingMeetings(
    //                                                                       key.split('-SPLIT-')[2],
    //                                                                       key.split('-SPLIT-')[3]
    //                                                                   )
    //                                                                 : null}

    //                                                             <Performance
    //                                                                 channelName={key.split('-SPLIT-')[0]}
    //                                                                 onPress={(name: any, id: any, createdBy: any) => {
    //                                                                     props.setChannelFilterChoice('All');
    //                                                                     props.handleFilterChange(name);
    //                                                                     props.setChannelId(id);
    //                                                                     props.setChannelCreatedBy(createdBy);
    //                                                                     props.openGrades();
    //                                                                     props.hideHome();
    //                                                                 }}
    //                                                                 filterStart={filterStart}
    //                                                                 filterEnd={filterEnd}
    //                                                                 channelId={key.split('-SPLIT-')[1]}
    //                                                                 channelCreatedBy={key.split('-SPLIT-')[2]}
    //                                                                 subscriptions={props.subscriptions}
    //                                                                 openCueFromGrades={props.openCueFromCalendar}
    //                                                                 colorCode={key.split('-SPLIT-')[3]}
    //                                                                 activeTab={'meetings'}
    //                                                             />
    //                                                         </View>
    //                                                     ) : // Scores
    //                                                     indexMap[key] === 3 ? (
    //                                                         <Performance
    //                                                             channelName={key.split('-SPLIT-')[0]}
    //                                                             onPress={(name: any, id: any, createdBy: any) => {
    //                                                                 props.setChannelFilterChoice('All');
    //                                                                 props.handleFilterChange(name);
    //                                                                 props.setChannelId(id);
    //                                                                 props.setChannelCreatedBy(createdBy);
    //                                                                 props.openGrades();
    //                                                                 props.hideHome();
    //                                                             }}
    //                                                             filterStart={filterStart}
    //                                                             channelId={key.split('-SPLIT-')[1]}
    //                                                             channelCreatedBy={key.split('-SPLIT-')[2]}
    //                                                             filterEnd={filterEnd}
    //                                                             subscriptions={props.subscriptions}
    //                                                             openCueFromGrades={props.openCueFromCalendar}
    //                                                             colorCode={key.split('-SPLIT-')[3]}
    //                                                             activeTab={'scores'}
    //                                                             isEditor={key.split('-SPLIT-')[2] === userId}
    //                                                         />
    //                                                     ) : (
    //                                                         <View
    //                                                             style={{
    //                                                                 width: '100%',
    //                                                                 maxWidth: 400,
    //                                                                 alignSelf: 'center',
    //                                                                 borderTopRightRadius: 10,
    //                                                                 borderBottomRightRadius: 10,
    //                                                             }}
    //                                                         >
    //                                                             <ChannelSettings
    //                                                                 channelId={key.split('-SPLIT-')[1]}
    //                                                                 refreshSubscriptions={props.refreshSubscriptions}
    //                                                                 closeModal={() => {
    //                                                                     // setShowHome(false)
    //                                                                     // closeModal()
    //                                                                 }}
    //                                                                 userId={userId}
    //                                                                 channelColor={key.split('-SPLIT-')[3]}
    //                                                                 userCreatedOrg={userCreatedOrg}
    //                                                             />
    //                                                         </View>
    //                                                     )
    //                                                 ) : cueMap[key].length === 0 ? (
    //                                                     <Text
    //                                                         style={{
    //                                                             width: '100%',
    //                                                             color: '#1F1F1F',
    //                                                             fontSize: 16,
    //                                                             paddingTop: 50,
    //                                                             paddingBottom: 50,
    //                                                             paddingHorizontal: 5,
    //                                                             fontFamily: 'inter',
    //                                                             flex: 1,
    //                                                         }}
    //                                                     >
    //                                                         {key.split('-SPLIT-')[0] !== 'My Notes'
    //                                                             ? key.split('-SPLIT-')[2] === userId
    //                                                                 ? PreferredLanguageText('noCuesCreatedInstructor')
    //                                                                 : PreferredLanguageText('noCuesCreated')
    //                                                             : PreferredLanguageText('noNotesCreated')}
    //                                                     </Text>
    //                                                 ) : (
    //                                                     <ScrollView
    //                                                         horizontal={true}
    //                                                         contentContainerStyle={{
    //                                                             maxWidth: '100%',
    //                                                             width: '100%',
    //                                                             backgroundColor: '#fff',
    //                                                         }}
    //                                                         showsHorizontalScrollIndicator={false}
    //                                                         key={
    //                                                             editFolderChannelId.toString() +
    //                                                             cueIds.toString() +
    //                                                             cueMap.toString()
    //                                                         }
    //                                                     >
    //                                                         {categoryMap[key].map((category: any, i: any) => {
    //                                                             // Check if even one category exists in cues

    //                                                             const foundCue = cueMap[key].find(
    //                                                                 (cue: any) =>
    //                                                                     cue.customCategory.toString().trim() ===
    //                                                                     category.toString().trim()
    //                                                             );

    //                                                             if (!foundCue) return null;

    //                                                             return (
    //                                                                 <View
    //                                                                     style={{
    //                                                                         width: '100%',
    //                                                                         maxWidth: 145,
    //                                                                         backgroundColor: '#fff',
    //                                                                         marginRight: 15,
    //                                                                     }}
    //                                                                     key={i.toString()}
    //                                                                 >
    //                                                                     <View
    //                                                                         style={{
    //                                                                             backgroundColor: '#fff',
    //                                                                             paddingLeft: 5,
    //                                                                         }}
    //                                                                     >
    //                                                                         <Text
    //                                                                             style={{
    //                                                                                 flex: 1,
    //                                                                                 flexDirection: 'row',
    //                                                                                 color: '#1F1F1F',
    //                                                                                 // fontWeight: 'bold',
    //                                                                                 fontSize: 12,
    //                                                                                 lineHeight: 25,
    //                                                                                 fontFamily: 'inter',
    //                                                                                 backgroundColor: '#fff',
    //                                                                             }}
    //                                                                             ellipsizeMode="tail"
    //                                                                         >
    //                                                                             {category === '' ? ' ' : category}
    //                                                                         </Text>
    //                                                                     </View>
    //                                                                     <View
    //                                                                         style={{
    //                                                                             // borderWidth: 1,
    //                                                                             maxWidth: 145,
    //                                                                             paddingLeft: 5,
    //                                                                             backgroundColor: '#fff',
    //                                                                             width: '100%',
    //                                                                             // height: 190
    //                                                                         }}
    //                                                                         key={i.toString() + key.toString()}
    //                                                                     >
    //                                                                         {cueMap[key].map((cue: any, index: any) => {
    //                                                                             if (
    //                                                                                 cue.customCategory
    //                                                                                     .toString()
    //                                                                                     .trim() !==
    //                                                                                 category.toString().trim()
    //                                                                             ) {
    //                                                                                 return null;
    //                                                                             }
    //                                                                             return (
    //                                                                                 <View
    //                                                                                     style={{
    //                                                                                         marginBottom: 15,
    //                                                                                         backgroundColor: '#fff',
    //                                                                                         width: '100%',
    //                                                                                         maxWidth: 145,
    //                                                                                     }}
    //                                                                                     key={index}
    //                                                                                 >
    //                                                                                     <Card
    //                                                                                         gray={true}
    //                                                                                         cueIds={cueIds}
    //                                                                                         onLongPress={() => {
    //                                                                                             setCueIds([]);
    //                                                                                             setEditFolderChannelId(
    //                                                                                                 cue.channelId
    //                                                                                                     ? cue.channelId
    //                                                                                                     : 'My Notes'
    //                                                                                             );
    //                                                                                         }}
    //                                                                                         add={() => {
    //                                                                                             const temp = JSON.parse(
    //                                                                                                 JSON.stringify(
    //                                                                                                     cueIds
    //                                                                                                 )
    //                                                                                             );
    //                                                                                             const found = temp.find(
    //                                                                                                 (i: any) => {
    //                                                                                                     return (
    //                                                                                                         i ===
    //                                                                                                         cue._id
    //                                                                                                     );
    //                                                                                                 }
    //                                                                                             );
    //                                                                                             if (!found) {
    //                                                                                                 temp.push(cue._id);
    //                                                                                             }
    //                                                                                             setCueIds(temp);
    //                                                                                         }}
    //                                                                                         remove={() => {
    //                                                                                             const temp = JSON.parse(
    //                                                                                                 JSON.stringify(
    //                                                                                                     cueIds
    //                                                                                                 )
    //                                                                                             );
    //                                                                                             const upd = temp.filter(
    //                                                                                                 (i: any) => {
    //                                                                                                     return (
    //                                                                                                         i !==
    //                                                                                                         cue._id
    //                                                                                                     );
    //                                                                                                 }
    //                                                                                             );
    //                                                                                             setCueIds(upd);
    //                                                                                         }}
    //                                                                                         editFolderChannelId={
    //                                                                                             editFolderChannelId
    //                                                                                         }
    //                                                                                         fadeAnimation={
    //                                                                                             props.fadeAnimation
    //                                                                                         }
    //                                                                                         updateModal={() => {
    //                                                                                             props.openUpdate(
    //                                                                                                 cue.key,
    //                                                                                                 cue.index,
    //                                                                                                 0,
    //                                                                                                 cue._id,
    //                                                                                                 cue.createdBy
    //                                                                                                     ? cue.createdBy
    //                                                                                                     : '',
    //                                                                                                 cue.channelId
    //                                                                                                     ? cue.channelId
    //                                                                                                     : ''
    //                                                                                             );
    //                                                                                         }}
    //                                                                                         cue={cue}
    //                                                                                         channelId={props.channelId}
    //                                                                                         subscriptions={
    //                                                                                             props.subscriptions
    //                                                                                         }
    //                                                                                     />
    //                                                                                 </View>
    //                                                                             );
    //                                                                         })}
    //                                                                     </View>
    //                                                                 </View>
    //                                                             );
    //                                                         })}
    //                                                     </ScrollView>
    //                                                 )}
    //                                             </View>
    //                                         ) : null}
    //                                     </View>
    //                                 </View>
    //                             </View>
    //                         </InsetShadow>
    //                     </View>
    //                 );
    //             })}
    //         </ScrollView>
    //     </View>
    // );

    // MAIN RETURN
    return (
        <View
            style={{
                height: windowHeight,
                backgroundColor: props.option === 'To Do' ? '#f8f8f8' : '#fff',
            }}
        >
            {renderInstantMeetingPopup()}
            {/* Hide navbar if create is open */}
            <View
                style={{
                    backgroundColor: '#000000de',
                    paddingHorizontal: Dimensions.get('window').width < 768 ? 0 : 0,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    width: '100%',
                    height: 54,
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
                                                        width: 7,
                                                        height: 7,
                                                        borderRadius: 7,
                                                        backgroundColor: '#f94144',
                                                        position: 'absolute',
                                                        top: -1,
                                                        right: 9,
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
                        {props.option === 'Account' || props.option === 'Inbox' ? null : (
                            <DefaultInput
                                value={searchTerm}
                                style={{
                                    color: '#000',
                                    backgroundColor: '#f2f2f2',
                                    borderRadius: 15,
                                    fontSize: 12,
                                    paddingVertical: 6,
                                    paddingHorizontal: 16,
                                    marginRight: 2,
                                    maxWidth: 225,
                                }}
                                autoCompleteType={'xyz'}
                                placeholder={'Search'}
                                onChangeText={(val) => setSearchTerm(val)}
                                placeholderTextColor={'#000'}
                            />
                        )}
                        {Dimensions.get('window').width < 768 ? (
                            <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'none' }} />
                        ) : null}
                        {/* {props.option === 'To Do' || props.option === 'Classroom' ? (
                            <TouchableOpacity
                                style={{ backgroundColor: 'none', marginLeft: 15 }}
                                onPress={() => {
                                    setShowFilterPopup(true);
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: '#f2f2f2',
                                        textAlign: 'right',
                                    }}
                                >
                                    <Ionicons name="filter-outline" size={20} />
                                </Text>
                            </TouchableOpacity>
                        ) : null} */}
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
                        <TouchableOpacity
                            style={{ backgroundColor: 'none', marginLeft: 15 }}
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
                                    color={props.option === 'Settings' && props.showHelp ? '#006AFF' : '#f2f2f2'}
                                />
                            </Text>
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
                                                        fontSize: 14,
                                                        fontWeight: 'bold',
                                                        color: tab === props.activeAccountTab ? '#006AFF' : '#1f1f1f',
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
            {searchTerm === '' ? (
                props.modalType === 'Create' && (props.option === 'Classroom' || props.option === 'Browse') ? (
                    <Create
                        key={JSON.stringify(props.customCategories)}
                        customCategories={props.customCategories}
                        closeModal={() => props.closeModal()}
                        closeAfterCreatingMyNotes={() => props.closeAfterCreatingMyNotes()}
                        option={props.option}
                        version={props.version}
                    />
                ) : (
                    <View
                        style={{
                            alignSelf: 'center',
                            width: '100%',
                            backgroundColor: props.option === 'To Do' ? '#f8f8f8' : '#fff',
                            height: width < 768 ? windowHeight - 104 : windowHeight - 52,
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
                            />
                        ) : null}
                        {props.option === 'Account' && props.activeAccountTab === 'courses' ? (
                            <Channels
                                setShowCreate={(val: any) => props.setShowCreate(val)}
                                showCreate={props.showCreate}
                                closeModal={() => {}}
                                subscriptions={props.subscriptions}
                                refreshSubscriptions={props.refreshSubscriptions}
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
                            />
                        ) : null}
                        {props.option === 'Classroom' &&
                        selectedWorkspace &&
                        !showNewDiscussionPost &&
                        props.activeWorkspaceTab !== 'Settings' &&
                        (props.activeWorkspaceTab !== 'Meet' || selectedWorkspace.split('-SPLIT-')[2] === userId) ? (
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
                                    backgroundColor: '#006AFF',
                                    borderColor: '#f2f2f2',
                                    borderWidth: 0,
                                    shadowColor: '#000',
                                    shadowOffset: {
                                        width: 4,
                                        height: 4,
                                    },
                                    shadowOpacity: 0.12,
                                    shadowRadius: 10,
                                    zIndex: 500000,
                                }}
                            >
                                <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                                    {props.activeWorkspaceTab === 'Content' ? (
                                        <Ionicons name="pencil-outline" size={25} />
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
                )
            ) : (
                searchResults
            )}
            <Popup
                isOpen={showFilterPopup}
                buttons={[
                    {
                        text: 'OK',
                        handler: function (event) {
                            setShowFilterPopup(false);
                        },
                    },
                    {
                        text: 'RESET',
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
                                    fontSize: 12,
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
                                fontSize: 12,
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
            fontSize: 13,
            color: '#fff',
            height: 24,
            paddingHorizontal: 15,
            backgroundColor: 'none',
            lineHeight: 24,
            fontFamily: 'overpass',
            textTransform: 'uppercase',
            marginRight: 5,
        },
        allGrayFill: {
            fontSize: 13,
            color: '#006AFF',
            paddingHorizontal: 15,
            borderRadius: 12,
            backgroundColor: 'none',
            lineHeight: 24,
            height: 24,
            fontFamily: 'overpass',
            textTransform: 'uppercase',
            marginRight: 5,
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
            color: '#006AFF',
            height: 20,
            lineHeight: 20,
            paddingHorizontal: 8,
            fontFamily: 'inter',
            textAlign: 'center',
            marginBottom: 1,
        },
    });
