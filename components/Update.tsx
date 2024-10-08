// REACT
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ActivityIndicator, Dimensions, StyleSheet, TextInput } from 'react-native';

// API

import {
    getStatuses,
    creatFolder,
    getFolder,
    getFolderCues,
    getChannelFolders,
    updateFolder,
    addToFolder,
    deleteFolder,
    findCueById,
    handleReleaseSubmission,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { View, TouchableOpacity, Text } from '../components/Themed';
import UpdateControls from './UpdateControls';
import { ScrollView } from 'react-native-gesture-handler';
import SubscribersList from './SubscribersList';
import { Ionicons } from '@expo/vector-icons';
import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import InsetShadow from 'react-native-inset-shadow';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';
import { omitTypename } from '../helpers/omitTypename';

const Update: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const {
        user,
        userId,
        refreshCues,
        savingCueToCloud,
        // SYNC FROM BACKEND
        syncCueFromBackend,
        changeSyncingCueFromBackend,
        syncingCueFromBackend,
        syncCueError,
        handleCueReleaseSubmissionStatus,
    } = useAppContext();

    const [modalAnimation] = useState(new Animated.Value(1));

    // CUE PROPERTIES
    const [init, setInit] = useState(false);
    const [cue, setCue] = useState<any>();
    const [cueId] = useState(props.cueId);
    const [createdBy] = useState(props.createdBy);

    const [channelCreatedBy] = useState(props.channelCreatedBy);
    const [channelOwner, setChannelOwner] = useState(userId === channelCreatedBy);

    const [submission, setSubmission] = useState(false);
    const [isQuiz, setIsQuiz] = useState(false);
    const [folderId, setFolderId] = useState('');

    // UI CONTEXT
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loadingStatuses, setLoadingStatuses] = useState(true);
    const [viewStatus, setViewStatus] = useState(false);
    const [showOriginal, setShowOriginal] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [save, setSave] = useState(false);
    const [del, setDel] = useState(false);
    const [activeTab, setActiveTab] = useState('Content');

    // FOLDER PROPERTIES
    const [showFolder, setShowFolder] = useState(false);
    const [createNewFolder, setCreateNewFolder] = useState(false);
    const [newFolderTitle, setNewFolderTitle] = useState('');
    const [channelCues, setChannelCues] = useState<any[]>([]);
    const [selectedCues, setSelectedCues] = useState<any[]>([]);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [channelFolders, setChannelFolders] = useState<any[]>([]);
    const [editFolder, setEditFolder] = useState(false);
    const [updatingFolder, setUpdatingFolder] = useState(false);
    const [deletingFolder, setDeletingFolder] = useState(false);
    const [addingToFolder, setAddingToFolder] = useState(false);
    const [folderCues, setFolderCues] = useState<any[]>([]);
    const [folder, setFolder] = useState<any>({});
    const [loadingFolderCues, setLoadingFolderCues] = useState(false);
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [updateFolderTitle, setUpdateFolderTitle] = useState('');
    const [folderCuesToDisplay, setFolderCuesToDisplay] = useState<any[]>([]);
    const [showExistingFolder, setShowExistingFolder] = useState(false);

    const windowHeight = Dimensions.get('window').height;

    const server = useApolloClient();

    // HOOKS

    /**
     * @description Set if cue is a Quiz
     */
    useEffect(() => {
        if (cue && cue.channelId) {
            const data1 = cue.original;
            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1);
                if (obj.quizId) {
                    setIsQuiz(true);
                }
            }
            setSubmission(cue.submission);
            setFolderId(cue.folderId);
        }
    }, [cue]);

    /**
     * @description Every time a cue is opened we need to Sync the cue with the database to ensure that we have the latest object since we use multiple devices (LATER ON WE MUST SUBSCRIBE CUES TO WEBHOOKS TO MONITOR REAL TIME CHANGES)
     */
    useEffect(() => {
        if (cueId && cueId !== '' && props.channelId && props.channelId !== '') {
            // SYNC CUE
            fetchCueFromBackend(cueId);
        } else {
            setCue(props.cue);
        }
        setInit(true);
    }, [cueId, props.channelId]);

    /**
     * @description Filter out all channel Cues that already have a folderID
     */
    useEffect(() => {
        if (!props.channelCues) return;

        let filterExisting = props.channelCues.filter((channelCue: any) => {
            return channelCue.folderId === '' || !channelCue.folderId;
        });

        // Filter out current
        if (folderId) {
            filterExisting = filterExisting.filter((channelCue: any) => {
                return channelCue._id !== cue._id;
            });
        }

        setChannelCues(filterExisting);
    }, [props.channelCues, folderId, cue]);

    /**
     * @description Fetch all Channel Folders
     */
    useEffect(() => {
        fetchChannelFolders();
    }, [props.channelId]);

    /**
     * @description Set folder cues to display
     */
    useEffect(() => {
        if (folderId !== '' && folder && folder !== null && folder.cueIds && folderCues && folderCues.length > 0) {
            setFolderCuesToDisplay(folderCues);
            setUpdateFolderTitle(folder.title);
        }
    }, [folder, folderCues, folderId]);

    /**
     * @description Fetch folder cues if folder id is set
     */
    useEffect(() => {
        fetchFolderCues();
    }, [folderId]);

    /**
     * @description Load threads and statuses
     */
    useEffect(() => {
        loadStudentResponses();
    }, [cueId, props.channelId]);

    const fetchCueFromBackend = (cueId: string) => {
        changeSyncingCueFromBackend(true);
        server
            .query({
                query: findCueById,
                variables: {
                    cueId,
                    userId,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.findCueById) {
                    const newCue = JSON.parse(JSON.stringify(res.data.cue.findCueById), omitTypename);

                    setCue(newCue);
                    syncCueFromBackend(newCue, false);
                } else {
                    // FALLBACK TO DEFAULT IF NOT A SUBMISSION (MAY BE USEFUL FOR OFFLINE FUNCTIONALITY)
                    // setCue(props.cue)
                    syncCueFromBackend(undefined, true);
                }
                changeSyncingCueFromBackend(false);
            })
            .catch((e) => {
                syncCueFromBackend(undefined, true);
                changeSyncingCueFromBackend(false);
            });
    };

    /**
     * @description Fetch all the channel folders
     */
    const fetchChannelFolders = useCallback(async () => {
        server
            .query({
                query: getChannelFolders,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data.folder.getFoldersForChannel) {
                    setChannelFolders(res.data.folder.getFoldersForChannel);
                }
            })
            .catch((e) => {});
    }, [props.channelId]);

    /**
     * @description Fetch folder cues if current cue has folder Id
     */
    const fetchFolderCues = useCallback(() => {
        if (folderId && folderId !== '') {
            setLoadingFolderCues(true);
            setLoadingFolder(true);

            server
                .query({
                    query: getFolderCues,
                    variables: {
                        folderId,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.folder.getCuesById) {
                        setFolderCues(res.data.folder.getCuesById);
                        setLoadingFolderCues(false);
                    }
                })
                .catch((e) => {
                    setLoadingFolderCues(false);
                });

            server
                .query({
                    query: getFolder,
                    variables: {
                        folderId,
                    },
                })
                .then((res) => {
                    if (res.data.folder.findById) {
                        setFolder(res.data.folder.findById);
                        setLoadingFolder(false);
                    }
                })
                .catch((e) => {
                    setLoadingFolder(false);
                });
        }
    }, [folderId]);

    /**
     * @description Update cue with release Submission
     */
    const updateCueWithReleaseSubmission = async (releaseSubmission: boolean) => {
        // Release Submission

        server
            .mutate({
                mutation: handleReleaseSubmission,
                variables: {
                    entryId: cueId,
                    gradebookEntry: false,
                    releaseSubmission,
                },
            })
            .then((res) => {
                if (res.data && res.data.gradebook.handleReleaseSubmission) {
                    Alert(
                        releaseSubmission
                            ? 'Grades are now visible to students.'
                            : 'Grades are now hidden from students.'
                    );

                    handleCueReleaseSubmissionStatus(cueId, releaseSubmission);

                    const updateCurrentCue = { ...cue, releaseSubmission };

                    setCue(updateCurrentCue);
                } else {
                    Alert('Failed to modify status. Try again.');
                }
            })
            .catch((e) => {
                Alert('Failed to modify status. Try again.');
            });
    };

    /**
     * @description Load threads and statuses
     */
    const loadStudentResponses = useCallback(() => {
        if (userId === channelCreatedBy.toString().trim()) {
            setLoadingStatuses(true);
            setChannelOwner(true);
            server
                .query({
                    query: getStatuses,
                    variables: {
                        cueId,
                    },
                })
                .then((res) => {
                    if (res.data.status && res.data.status.findByCueId) {
                        const subs: any[] = [];
                        const statuses = [...res.data.status.findByCueId];

                        statuses.sort((a: any, b: any) => {
                            return a.fullName > b.fullName ? -1 : 1;
                        });

                        statuses.map((status: any) => {
                            subs.push({
                                avatar: status.avatar,
                                displayName: status.fullName,
                                _id: status.userId,
                                fullName: status.status,
                                submission: status.submission,
                                comment: status.comment,
                                score: status.score,
                                graded: status.graded,
                                userId: status.userId,
                                submittedAt: status.submittedAt,
                                deadline: status.deadline,
                                releaseSubmission: status.releaseSubmission,
                                totalPoints: status.totalPoints,
                                pointsScored: status.pointsScored,
                            });
                        });
                        setSubscribers(subs);
                        setLoadingStatuses(false);
                    } else {
                        setLoadingStatuses(false);
                    }
                })
                .catch((err) => {
                    // Alert(unableToLoadStatusesAlert, checkConnectionAlert);
                    setLoadingStatuses(false);
                });
        }
    }, [cueId, modalAnimation, createdBy, channelCreatedBy]);

    /**
     * @description Handle used to drage cues for sorting
     */
    const DragHandle = SortableHandle(() => (
        <Text style={{ marginRight: 5, marginTop: 3, cursor: 'pointer' }}>
            {' '}
            <Ionicons name="swap-horizontal-outline" size={14} color="#000000" />{' '}
        </Text>
    ));

    /**
     * @description Sortable Cue for Create Folder
     */
    const SortableItem = SortableElement(({ value, sortIndex }: any) => {
        const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue);

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse();

        const col = colorChoices[value.color];

        return (
            <View
                style={{
                    height: '100%',
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    maxWidth: 130,
                    width: 130,
                    borderColor: col,
                    borderLeftWidth: 3,
                    flexDirection: 'row',
                    shadowOffset: {
                        width: 2,
                        height: 2,
                    },
                    overflow: 'hidden',
                    shadowOpacity: 0.07,
                    shadowRadius: 7,
                    zIndex: 500000,
                    marginRight: 15,
                }}
            >
                <View
                    key={'textPage'}
                    style={{
                        maxWidth: 210,
                        height: '100%',
                        width: '100%',
                        padding: 7,
                        paddingHorizontal: 10,
                        backgroundColor: '#fff',
                    }}
                >
                    <View
                        style={{
                            height: '30%',
                            backgroundColor: '#fff',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={styles.date2}>
                            {new Date(value.date).toString().split(' ')[1] +
                                ' ' +
                                new Date(value.date).toString().split(' ')[2]}
                        </Text>

                        {value._id === cueId ? null : (
                            <TouchableOpacity
                                onPress={() => {
                                    const temp = [...channelCues];
                                    temp.push(value);
                                    setChannelCues(temp);

                                    const sCues = selectedCues.filter((c: any) => c._id !== value._id);
                                    setSelectedCues(sCues);
                                }}
                            >
                                <Text style={{ color: '#f94144' }}>
                                    <Ionicons name="remove-circle-outline" size={16} />
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View
                        style={{
                            backgroundColor: '#fff',
                            width: '100%',
                            flexDirection: 'row',
                            flex: 1,
                            height: '70%',
                            alignItems: 'center',
                        }}
                    >
                        <DragHandle />

                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={{
                                fontFamily: 'inter',
                                fontSize: 13,
                                lineHeight: 20,
                                flex: 1,
                                marginTop: 5,
                                color: '#000000',
                            }}
                        >
                            {title}
                        </Text>
                    </View>
                </View>
            </View>
        );
    });

    /**
     * @description Sortable Cue for Update Folder
     * Needs to be stylisticaly same as SortableItem
     */
    const SortableItemUpdate = SortableElement(({ value, sortIndex }: any) => {
        const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue);

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse();

        const col = colorChoices[value.color];

        return (
            <View
                style={{
                    height: '100%',
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    maxWidth: 130,
                    width: 130,
                    borderColor: col,
                    borderLeftWidth: 3,
                    flexDirection: 'row',
                    shadowOffset: {
                        width: 2,
                        height: 2,
                    },
                    overflow: 'hidden',
                    shadowOpacity: 0.07,
                    shadowRadius: 7,
                    zIndex: 500000,
                    marginRight: 15,
                }}
            >
                <View
                    key={'textPage'}
                    style={{
                        maxWidth: 210,
                        height: '100%',
                        width: '100%',
                        padding: 7,
                        paddingHorizontal: 10,
                        backgroundColor: '#fff',
                    }}
                >
                    <View
                        style={{
                            height: '30%',
                            backgroundColor: '#fff',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={styles.date2}>
                            {new Date(value.date).toString().split(' ')[1] +
                                ' ' +
                                new Date(value.date).toString().split(' ')[2]}
                        </Text>

                        {value._id === cueId ? null : (
                            <TouchableOpacity
                                onPress={() => {
                                    const temp = [...channelCues];
                                    temp.push(value);
                                    setChannelCues(temp);

                                    const sCues = folderCuesToDisplay.filter((c: any) => c._id !== value._id);
                                    setFolderCuesToDisplay(sCues);
                                }}
                            >
                                <Text style={{ color: '#f94144' }}>
                                    <Ionicons name="remove-circle-outline" size={16} />
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View
                        style={{
                            backgroundColor: '#fff',
                            width: '100%',
                            flexDirection: 'row',
                            flex: 1,
                            height: '70%',
                            alignItems: 'center',
                        }}
                    >
                        <DragHandle />

                        <Text
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                            style={{
                                fontFamily: 'inter',
                                fontSize: 13,
                                lineHeight: 20,
                                flex: 1,
                                marginTop: 5,
                                color: value._id === cueId ? '#007AFF' : '#000000',
                            }}
                        >
                            {title}
                        </Text>
                    </View>
                </View>
            </View>
        );
    });

    /**
     * @description Renders the Selected Cues as sortable for Create Folder
     */
    const SortableList = SortableContainer(({ items }: any) => {
        return (
            <ScrollView
                style={{
                    width: '100%',
                    maxWidth: 1024,
                    backgroundColor: '#f8f8f8',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    paddingBottom: 15,
                }}
                horizontal={true}
                showsHorizontalScrollIndicator={true}
            >
                {items.map((value: any, index: number) => (
                    <SortableItem key={`item-${index}`} index={index} sortIndex={index} value={value} />
                ))}
            </ScrollView>
        );
    });

    /**
     * @description Renders the Selected Cues as sortable for Update Folder
     */
    const SortableListUpdate = SortableContainer(({ items }: any) => {
        return (
            <ScrollView
                style={{
                    width: '100%',
                    maxWidth: 1024,
                    backgroundColor: '#f8f8f8',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    paddingBottom: 15,
                }}
                horizontal={true}
                showsHorizontalScrollIndicator={true}
            >
                {items.map((value: any, index: number) => (
                    <SortableItemUpdate key={`item-${index}`} index={index} sortIndex={index} value={value} />
                ))}
            </ScrollView>
        );
    });

    /**
     *
     * @description Used to sort the selected cues for Create Folder
     */
    const onSortEnd = ({ oldIndex, newIndex }: any) => {
        setSelectedCues(arrayMove(selectedCues, oldIndex, newIndex));
    };

    /**
     *
     *
     *
     * @description Used to sort the selected cues for Update Folder
     */
    const onSortEndUpdate = ({ oldIndex, newIndex }: any) => {
        setFolderCuesToDisplay(arrayMove(folderCuesToDisplay, oldIndex, newIndex));
    };

    /**
     * @description Helpter for icon to use in navbar
     */
    const getNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                if (isQuiz) {
                    return activeTab === op ? 'checkbox' : 'checkbox-outline';
                }
                return activeTab === op ? 'create' : 'create-outline';
            case 'Details':
                return activeTab === op ? 'options' : 'options-outline';
            case 'Submission':
                return activeTab === op ? 'time' : 'time-outline';
            case 'Feedback':
                return activeTab === op ? 'bar-chart' : 'bar-chart-outline';
            default:
                return activeTab === op ? 'person' : 'person-outline';
        }
    };

    const getNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return isQuiz ? 'Quiz' : submission && !channelOwner ? 'Assignment' : 'Content';
            case 'Details':
                return 'Details';
            case 'Submission':
                return 'Submission';
            case 'Feedback':
                return submission || isQuiz ? 'Feedback' : 'Status';
            default:
                return activeTab === op ? 'person' : 'person-outline';
        }
    };

    const getNavbarIconColor = (op: string) => {
        if (op === activeTab) {
            return '#fff';
        }
        return '#fff';
    };

    const width = Dimensions.get('window').width;

    /**
     * @description Tabs (Content, Options, Submission, etc)
     */
    const mobileOptions = (
        <View
            style={{
                position: 'absolute',
                alignSelf: 'flex-end',
                width: '100%',
                paddingTop: 10,
                paddingBottom: Dimensions.get('window').width < 768 ? 10 : 20,
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                flexDirection: 'row',
                justifyContent: 'center',
                height: Dimensions.get('window').width < 768 ? 60 : 68,
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: -10,
                },
                bottom: 0,
                right: 0,
                shadowOpacity: 0.03,
                shadowRadius: 12,
                zIndex: 100,
                elevation: 120,
                borderTopColor: props.activeChannelColor,
                borderTopWidth: 1,
                backgroundColor: props.activeChannelColor,
            }}
        >
            <TouchableOpacity
                // style={showOriginal ? styles.allBlueTabButton : styles.tabButton}
                style={{
                    backgroundColor: 'none',
                    width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                    flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={() => {
                    setShowOptions(false);
                    setViewStatus(false);
                    setShowOriginal(true);
                    setShowComments(false);
                    setActiveTab('Content');
                }}
            >
                {/* <Text style={showOriginal ? styles.allGrayFill : styles.all}>Content</Text> */}
                <Ionicons
                    name={getNavbarIconName('Content')}
                    style={{
                        color: getNavbarIconColor('Content'),
                        marginBottom: Dimensions.get('window').width < 800 ? 3 : 6,
                    }}
                    size={21}
                />
                <Text
                    style={{
                        fontSize: width < 800 ? 11 : 16,
                        lineHeight: width < 800 ? 11 : 23,
                        color: getNavbarIconColor('Content'),
                        fontFamily: activeTab === 'Content' ? 'Inter' : 'overpass',
                        marginBottom: width < 800 ? 0 : 6,
                        paddingLeft: width < 800 ? 0 : 5,
                    }}
                >
                    {getNavbarText('Content')}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                // style={showOptions ? styles.allBlueTabButton : styles.tabButton}
                style={{
                    backgroundColor: 'none',
                    width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                    flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={() => {
                    setShowOptions(true);
                    setViewStatus(false);
                    setShowOriginal(false);
                    setShowComments(false);
                    setActiveTab('Details');
                }}
            >
                {/* <Text style={showOptions ? styles.allGrayFill : styles.all}>DETAILS</Text> */}
                <Ionicons
                    name={getNavbarIconName('Details')}
                    style={{
                        color: getNavbarIconColor('Details'),
                        marginBottom: Dimensions.get('window').width < 800 ? 3 : 6,
                    }}
                    size={21}
                />
                <Text
                    style={{
                        fontSize: width < 800 ? 11 : 16,
                        lineHeight: width < 800 ? 11 : 23,
                        color: getNavbarIconColor('Details'),
                        fontFamily: activeTab === 'Details' ? 'Inter' : 'overpass',
                        marginBottom: width < 800 ? 0 : 6,
                        paddingLeft: width < 800 ? 0 : 5,
                    }}
                >
                    {getNavbarText('Details')}
                </Text>
            </TouchableOpacity>
            {props.channelId === '' || !submission || (channelOwner && submission) || isQuiz ? null : (
                <TouchableOpacity
                    // style={
                    //     !showOriginal && !viewStatus && !showOptions && !showComments
                    //         ? styles.allBlueTabButton
                    //         : styles.tabButton
                    // }
                    style={{
                        backgroundColor: 'none',
                        width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    }}
                    onPress={() => {
                        setViewStatus(false);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                        setActiveTab('Submission');
                    }}
                >
                    {/* <Text
                        style={
                            !showOriginal && !viewStatus && !showOptions && !showComments
                                ? styles.allGrayFill
                                : styles.all
                        }
                    >
                        SUBMISSION
                    </Text> */}
                    <Ionicons
                        name={getNavbarIconName('Submission')}
                        style={{
                            color: getNavbarIconColor('Submission'),
                            marginBottom: Dimensions.get('window').width < 800 ? 3 : 6,
                        }}
                        size={21}
                    />
                    <Text
                        style={{
                            fontSize: width < 800 ? 11 : 16,
                            lineHeight: width < 800 ? 11 : 23,
                            color: getNavbarIconColor('Submission'),
                            fontFamily: activeTab === 'Submission' ? 'Inter' : 'overpass',
                            marginBottom: width < 800 ? 0 : 6,
                            paddingLeft: width < 800 ? 0 : 5,
                        }}
                    >
                        {getNavbarText('Submission')}
                    </Text>
                </TouchableOpacity>
            )}
            {/* Add Status button here */}
            {props.channelId === '' || !channelOwner ? null : (
                <TouchableOpacity
                    // style={viewStatus ? styles.allBlueTabButton : styles.tabButton}
                    style={{
                        backgroundColor: 'none',
                        width: (submission && !channelOwner) || channelOwner ? '33%' : '50%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                    }}
                    onPress={() => {
                        setViewStatus(true);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                        setActiveTab('Feedback');
                    }}
                >
                    {/* <Text style={viewStatus ? styles.allGrayFill : styles.all}>Feedback</Text> */}
                    <Ionicons
                        name={getNavbarIconName('Feedback')}
                        style={{
                            color: getNavbarIconColor('Feedback'),
                            marginBottom: Dimensions.get('window').width < 800 ? 3 : 6,
                        }}
                        size={21}
                    />
                    <Text
                        style={{
                            fontSize: width < 800 ? 11 : 16,
                            lineHeight: width < 800 ? 11 : 23,
                            color: getNavbarIconColor('Feedback'),
                            fontFamily: activeTab === 'Feedback' ? 'Inter' : 'overpass',
                            marginBottom: width < 800 ? 0 : 6,
                            paddingLeft: width < 800 ? 0 : 5,
                        }}
                    >
                        {getNavbarText('Feedback')}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    /**
     * @description Tabs (Content, Options, Submission, etc)
     */
    const options = (
        <View
            style={{
                paddingLeft: Dimensions.get('window').width < 1024 ? 0 : 20,
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                backgroundColor: 'none',
                justifyContent: Dimensions.get('window').width < 1024 ? 'center' : 'flex-start',
            }}
        >
            <TouchableOpacity
                style={{
                    backgroundColor: 'none',
                }}
                onPress={() => {
                    setShowOptions(false);
                    setViewStatus(false);
                    setShowOriginal(true);
                    setShowComments(false);
                    setActiveTab('Content');
                }}
            >
                <Text style={showOriginal ? styles.allGrayFill : styles.all}>Content</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    backgroundColor: 'none',
                }}
                onPress={() => {
                    setShowOptions(true);
                    setViewStatus(false);
                    setShowOriginal(false);
                    setShowComments(false);
                    setActiveTab('Details');
                }}
            >
                <Text style={showOptions ? styles.allGrayFill : styles.all}>DETAILS</Text>
            </TouchableOpacity>
            {props.channelId === '' || !submission || (channelOwner && submission) || isQuiz ? null : (
                <TouchableOpacity
                    style={{
                        backgroundColor: 'none',
                    }}
                    onPress={() => {
                        setViewStatus(false);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                        setActiveTab('Submission');
                    }}
                >
                    <Text
                        style={
                            !showOriginal && !viewStatus && !showOptions && !showComments
                                ? styles.allGrayFill
                                : styles.all
                        }
                    >
                        SUBMISSION
                    </Text>
                </TouchableOpacity>
            )}
            {/* Add Status button here */}
            {props.channelId === '' || !channelOwner ? null : (
                <TouchableOpacity
                    style={{
                        backgroundColor: 'none',
                    }}
                    onPress={() => {
                        setViewStatus(true);
                        setShowOriginal(false);
                        setShowComments(false);
                        setShowOptions(false);
                        setActiveTab('Feedback');
                    }}
                >
                    <Text style={viewStatus ? styles.allGrayFill : styles.all}>
                        {submission || isQuiz ? 'Feedback' : 'Status'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    /**
     * @description Renders the existing folder cues for the Header
     */
    const renderExistingFolder = () => {
        return (
            <InsetShadow
                shadowColor={'#000'}
                shadowOffset={2}
                shadowOpacity={0.12}
                shadowRadius={10}
                elevation={500000}
                containerStyle={{
                    height: 'auto',
                    zIndex: 500001,
                }}
            >
                <View
                    style={{
                        zIndex: 500001,
                        flex: 1,
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#f8f8f8',
                        paddingVertical: 14,
                        paddingHorizontal: paddingResponsive(),
                    }}
                >
                    {/* Render Folder Title */}

                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'Inter',
                            color: '#1F1F1F',
                            paddingBottom: 10,
                            width: '100%',
                            maxWidth: 1024,
                        }}
                    >
                        {folder.title && folder.title !== '' ? folder.title : 'Untitled'}
                    </Text>

                    {/* Render Existing cues */}
                    <ScrollView
                        style={{
                            width: '100%',
                            maxWidth: 1024,
                            backgroundColor: '#f8f8f8',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            paddingBottom: 15,
                        }}
                        horizontal={true}
                        showsHorizontalScrollIndicator={true}
                    >
                        {folderCuesToDisplay.map((folderCue: any, ind: number) => {
                            if (!folderCue || !folderCue.channelId) return;

                            const { title } = htmlStringParser(
                                folderCue.channelId && folderCue.channelId !== '' ? folderCue.original : folderCue.cue
                            );

                            const colorChoices: any[] = [
                                '#f94144',
                                '#f3722c',
                                '#f8961e',
                                '#f9c74f',
                                '#3abb83',
                            ].reverse();

                            const col = colorChoices[folderCue.color];

                            return (
                                <View
                                    style={{
                                        height: '100%',
                                        backgroundColor: '#fff',
                                        borderRadius: 1,
                                        maxWidth: 130,
                                        width: 130,
                                        borderColor: col,
                                        borderLeftWidth: 3,
                                        flexDirection: 'row',
                                        shadowOffset: {
                                            width: 2,
                                            height: 2,
                                        },
                                        overflow: 'hidden',
                                        shadowOpacity: 0.07,
                                        shadowRadius: 7,
                                        zIndex: 500000,
                                        marginRight: 15,
                                    }}
                                    key={ind.toString()}
                                >
                                    <TouchableOpacity
                                        onPress={() => props.openCue(folderCue._id)}
                                        key={'textPage'}
                                        style={{
                                            maxWidth: 210,
                                            height: '100%',
                                            // borderTop
                                            width: '100%',
                                            padding: 7,
                                            paddingHorizontal: 10,
                                            backgroundColor: '#fff',
                                        }}
                                    >
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.date2}>
                                                {new Date(folderCue.date).toString().split(' ')[1] +
                                                    ' ' +
                                                    new Date(folderCue.date).toString().split(' ')[2]}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                width: '100%',
                                                flexDirection: 'row',
                                                flex: 1,
                                                height: '70%',
                                            }}
                                        >
                                            <Text
                                                ellipsizeMode={'tail'}
                                                numberOfLines={1}
                                                style={{
                                                    fontFamily: 'inter',
                                                    // fontWeight: 'bold',
                                                    fontSize: 13,
                                                    lineHeight: 20,
                                                    flex: 1,
                                                    marginTop: 5,
                                                    color: folderCue._id === cueId ? '#007AFF' : '#000000',
                                                }}
                                            >
                                                {title}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </InsetShadow>
        );
    };

    /**
     * @description method to render the cue selections for new folder
     * Two Sections (First section shows all options and the second one shows the selected cues)
     */
    const renderNewFolderOptions = () => {
        return (
            <InsetShadow
                shadowColor={'#000'}
                shadowOffset={2}
                shadowOpacity={0.12}
                shadowRadius={10}
                elevation={500000}
                containerStyle={{
                    height: 'auto',
                }}
            >
                <View
                    style={{ width: '100%', flexDirection: 'column', flex: 1, paddingHorizontal: paddingResponsive() }}
                >
                    {/* Section 1: Shows all cues from Channel */}
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#f8f8f8',
                            paddingTop: 14,
                            paddingBottom: 7,
                        }}
                    >
                        {channelCues.length !== 0 ? (
                            <ScrollView
                                style={{
                                    width: '100%',
                                    maxWidth: 1024,
                                    backgroundColor: '#f8f8f8',
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    paddingBottom: 15,
                                }}
                                horizontal={true}
                                showsHorizontalScrollIndicator={true}
                            >
                                {channelCues.map((channelCue: any, ind: number) => {
                                    const { title } = htmlStringParser(
                                        channelCue.channelId && channelCue.channelId !== ''
                                            ? channelCue.original
                                            : channelCue.cue
                                    );

                                    const colorChoices: any[] = [
                                        '#f94144',
                                        '#f3722c',
                                        '#f8961e',
                                        '#f9c74f',
                                        '#3abb83',
                                    ].reverse();

                                    const col = colorChoices[channelCue.color];

                                    return (
                                        <View
                                            style={{
                                                height: '100%',
                                                backgroundColor: '#fff',
                                                borderRadius: 1,
                                                maxWidth: 130,
                                                width: 130,
                                                borderColor: col,
                                                borderLeftWidth: 3,
                                                flexDirection: 'row',
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2,
                                                },
                                                overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                zIndex: 500000,
                                                marginRight: 15,
                                            }}
                                            key={ind.toString()}
                                        >
                                            <View
                                                key={'textPage'}
                                                style={{
                                                    maxWidth: 210,
                                                    height: '100%',
                                                    // borderTop
                                                    width: '100%',
                                                    padding: 7,
                                                    paddingHorizontal: 10,
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: '30%',
                                                        backgroundColor: '#fff',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={styles.date2}>
                                                        {new Date(channelCue.date).toString().split(' ')[1] +
                                                            ' ' +
                                                            new Date(channelCue.date).toString().split(' ')[2]}
                                                    </Text>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const temp = [...selectedCues];
                                                            temp.push(channelCue);
                                                            setSelectedCues(temp);

                                                            // Remove from channel Cues
                                                            const cCues = channelCues.filter(
                                                                (c: any) => c._id !== channelCue._id
                                                            );
                                                            setChannelCues(cCues);
                                                        }}
                                                        style={{
                                                            marginLeft: 'auto',
                                                        }}
                                                    >
                                                        <Text style={{ color: '#007AFF', textAlign: 'center' }}>
                                                            <Ionicons name="add-outline" size={16} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <View
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        width: '100%',
                                                        flexDirection: 'row',
                                                        flex: 1,
                                                        height: '70%',
                                                    }}
                                                >
                                                    <Text
                                                        ellipsizeMode={'tail'}
                                                        numberOfLines={1}
                                                        style={{
                                                            fontFamily: 'inter',
                                                            fontSize: 13,
                                                            lineHeight: 20,
                                                            flex: 1,
                                                            marginTop: 5,
                                                            color: '#000000',
                                                        }}
                                                    >
                                                        {title}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={{ backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#000000',
                                        textAlign: 'center',
                                        fontFamily: 'inter',
                                        backgroundColor: '#f8f8f8',
                                        paddingVertical: 20,
                                    }}
                                >
                                    No Content to select.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Section 2 */}

                    {channelCues.length === 0 && selectedCues.length === 0 ? null : selectedCues.length !== 0 ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                backgroundColor: '#f8f8f8',
                                paddingTop: 7,
                                // paddingBottom: 14,
                            }}
                        >
                            <SortableList
                                axis={'x'}
                                lockAxis={'x'}
                                items={selectedCues}
                                onSortEnd={onSortEnd}
                                useDragHandle
                            />
                        </View>
                    ) : (
                        <View style={{ backgroundColor: '#f8f8f8' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    textAlign: 'center',
                                    fontFamily: 'inter',
                                    backgroundColor: '#f8f8f8',
                                    paddingVertical: 20,
                                }}
                            >
                                No selection.
                            </Text>
                        </View>
                    )}
                </View>
            </InsetShadow>
        );
    };

    /**
     * @description method to render the cue selections for edit folder
     * Two Sections (First section shows all options and the second one shows the selected cues)
     */
    const renderEditFolderOptions = () => {
        return (
            <InsetShadow
                shadowColor={'#000'}
                shadowOffset={2}
                shadowOpacity={0.12}
                shadowRadius={10}
                elevation={500000}
                containerStyle={{
                    height: 'auto',
                }}
            >
                <View style={{ width: '100%', flexDirection: 'column', paddingHorizontal: paddingResponsive() }}>
                    {/* Section 1: Shows all cues from Channel */}
                    <View
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            backgroundColor: '#f8f8f8',
                            paddingTop: 14,
                            paddingBottom: 7,
                        }}
                    >
                        {channelCues.length !== 0 ? (
                            <ScrollView
                                style={{
                                    width: '100%',
                                    maxWidth: 1024,
                                    backgroundColor: '#f8f8f8',
                                    borderTopLeftRadius: 0,
                                    borderTopRightRadius: 0,
                                    paddingBottom: 15,
                                    // marginTop: 10
                                }}
                                horizontal={true}
                                showsHorizontalScrollIndicator={true}
                                // showsVerticalScrollIndicator={false}
                            >
                                {channelCues.map((channelCue: any, ind: number) => {
                                    const { title } = htmlStringParser(
                                        channelCue.channelId && channelCue.channelId !== ''
                                            ? channelCue.original
                                            : channelCue.cue
                                    );

                                    const colorChoices: any[] = [
                                        '#f94144',
                                        '#f3722c',
                                        '#f8961e',
                                        '#f9c74f',
                                        '#3abb83',
                                    ].reverse();

                                    const col = colorChoices[channelCue.color];

                                    return (
                                        <View
                                            style={{
                                                height: '100%',
                                                backgroundColor: '#fff',
                                                borderRadius: 1,
                                                maxWidth: 130,
                                                width: 130,
                                                borderColor: col,
                                                borderLeftWidth: 3,
                                                flexDirection: 'row',
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2,
                                                },
                                                overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                zIndex: 500000,
                                                marginRight: 15,
                                            }}
                                            key={ind.toString()}
                                        >
                                            <View
                                                key={'textPage'}
                                                style={{
                                                    maxWidth: 210,
                                                    height: '100%',
                                                    // borderTop
                                                    width: '100%',
                                                    padding: 7,
                                                    paddingHorizontal: 10,
                                                    backgroundColor: '#fff',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        height: '30%',
                                                        backgroundColor: '#fff',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text style={styles.date2}>
                                                        {new Date(channelCue.date).toString().split(' ')[1] +
                                                            ' ' +
                                                            new Date(channelCue.date).toString().split(' ')[2]}
                                                    </Text>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            const temp = [...folderCuesToDisplay];
                                                            temp.push(channelCue);
                                                            setFolderCuesToDisplay(temp);

                                                            // Remove from channel Cues
                                                            const cCues = channelCues.filter(
                                                                (c: any) => c._id !== channelCue._id
                                                            );
                                                            setChannelCues(cCues);
                                                        }}
                                                        style={{
                                                            marginLeft: 'auto',
                                                        }}
                                                    >
                                                        <Text style={{ color: '#007AFF', textAlign: 'center' }}>
                                                            <Ionicons name="add-outline" size={16} />
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>

                                                <View
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        width: '100%',
                                                        flexDirection: 'row',
                                                        flex: 1,
                                                        height: '70%',
                                                    }}
                                                >
                                                    <Text
                                                        ellipsizeMode={'tail'}
                                                        numberOfLines={1}
                                                        style={{
                                                            fontFamily: 'inter',
                                                            fontSize: 13,
                                                            lineHeight: 20,
                                                            flex: 1,
                                                            marginTop: 5,
                                                            color: '#000000',
                                                        }}
                                                    >
                                                        {title}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        ) : (
                            <View style={{ backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#000000',
                                        textAlign: 'center',
                                        fontFamily: 'inter',
                                        backgroundColor: '#f8f8f8',
                                        paddingVertical: 20,
                                    }}
                                >
                                    No Content to select.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Section 2 */}

                    {folderCuesToDisplay.length !== 0 ? (
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                backgroundColor: '#f8f8f8',
                                paddingTop: 7,
                                // paddingBottom: 14,
                            }}
                        >
                            <SortableListUpdate
                                items={folderCuesToDisplay}
                                onSortEnd={onSortEndUpdate}
                                useDragHandle={true}
                                axis={'x'}
                                lockAxis={'x'}
                            />
                        </View>
                    ) : (
                        <View style={{ backgroundColor: '#f8f8f8' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    textAlign: 'center',
                                    fontFamily: 'inter',
                                    backgroundColor: '#f8f8f8',
                                    paddingVertical: 20,
                                }}
                            >
                                No selection.
                            </Text>
                        </View>
                    )}
                </View>
            </InsetShadow>
        );
    };

    if (!init) return null;

    /**
     * @description Content view
     */
    const ContentView = (
        <Animated.View
            style={{
                width: '100%',
                // maxWidth: 1024,
                height: '100%',
                maxHeight: windowHeight,
                opacity: modalAnimation,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                backgroundColor: channelOwner ? '#f8f8f8' : '#fff',
            }}
        >
            {!viewStatus ? (
                <UpdateControls
                    key={JSON.stringify(cue) + props.cueId}
                    channelId={props.channelId}
                    save={save}
                    del={del}
                    cue={cue}
                    channelOwner={channelOwner}
                    createdBy={createdBy}
                    folderId={folderId}
                    closeModal={() => props.closeModal()}
                    changeViewStatus={() => setViewStatus(true)}
                    viewStatus={viewStatus}
                    showOptions={showOptions}
                    showOriginal={showOriginal}
                    showFolder={showFolder}
                    setShowOptions={(op: boolean) => setShowOptions(op)}
                    setShowOriginal={(val: boolean) => setShowOriginal(val)}
                    showComments={showComments}
                    setShowComments={(s: any) => setShowComments(s)}
                    setShowFolder={(s: any) => setShowFolder(s)}
                    reloadStatuses={loadStudentResponses}
                    setSave={(save: boolean) => setSave(save)}
                    setDelete={(del: boolean) => setDel(del)}
                />
            ) : (
                <View>
                    {loadingStatuses ? (
                        <View
                            style={{
                                width: '100%',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                flex: 1,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'column',
                                    alignSelf: 'center',
                                    alignItems: 'center',
                                    backgroundColor: '#f8f8f8',
                                    marginTop: 100,
                                }}
                            >
                                <View
                                    style={{
                                        marginTop: 10,
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <ActivityIndicator size={20} color={'#1F1F1F'} />
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            marginTop: 10,
                                        }}
                                    >
                                        Loading...
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                backgroundColor: '#f8f8f8',
                                width: '100%',
                                height:
                                    width < 768
                                        ? Dimensions.get('window').height - (64 + 60)
                                        : // : width < 1024
                                          // ? Dimensions.get('window').height - (64 + 68)
                                          Dimensions.get('window').height - 64,
                                // paddingHorizontal: 20,
                                borderTopRightRadius: 0,
                                borderTopLeftRadius: 0,
                            }}
                        >
                            <ScrollView
                                contentContainerStyle={{
                                    width: '100%',
                                    height:
                                        Dimensions.get('window').width < 768
                                            ? Dimensions.get('window').height - (64 + 60)
                                            : Dimensions.get('window').height - 64,
                                    alignItems: 'center',
                                    backgroundColor: channelOwner ? '#f8f8f8' : '#fff',
                                }}
                                showsVerticalScrollIndicator={true}
                                contentOffset={{ x: 0, y: 1 }}
                                key={channelOwner.toString()}
                                overScrollMode={'always'}
                                alwaysBounceVertical={true}
                                scrollEnabled={true}
                                scrollEventThrottle={1}
                                keyboardDismissMode={'on-drag'}
                            >
                                <View style={{ maxWidth: 1024, width: '100%' }}>
                                    <SubscribersList
                                        key={JSON.stringify(subscribers)}
                                        subscribers={subscribers}
                                        cueId={cueId}
                                        channelId={props.channelId}
                                        closeModal={() => props.closeModal()}
                                        cue={cue}
                                        updateCueWithReleaseSubmission={updateCueWithReleaseSubmission}
                                        reloadStatuses={loadStudentResponses}
                                        isQuiz={isQuiz}
                                    />
                                </View>
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}
        </Animated.View>
    );

    /**
     * @description Renders all the Folder buttons (edit, add, delete, cancel, etc.) for the header
     */
    const renderFolderButtons = () => {
        return (
            <React.Fragment>
                {/* Edit folder button */}
                {channelOwner && folderId && !editFolder && showOriginal ? (
                    <TouchableOpacity
                        onPress={async () => {
                            setEditFolder(true);
                        }}
                        style={{
                            backgroundColor: 'none',
                            paddingLeft: 0,
                        }}
                        disabled={user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                lineHeight: 34,
                                marginLeft: 20,
                                textTransform: 'capitalize',
                                fontSize: 15,
                                fontFamily: 'Inter',
                                color: '#fff',
                            }}
                        >
                            Edit Folder
                        </Text>
                    </TouchableOpacity>
                ) : null}
                {/* Create new folder button */}
                {channelOwner && !folderId && !createNewFolder && !editFolder && showOriginal && props.channelId ? (
                    <TouchableOpacity
                        onPress={() => {
                            setCreateNewFolder(true);
                            setSelectedCues([cue]);
                            const filter = props.channelCues.filter(
                                (channelCue: any) =>
                                    channelCue._id !== cue._id && (!channelCue.folderId || channelCue.folderId === '')
                            );
                            setChannelCues(filter);
                        }}
                        style={{
                            backgroundColor: 'none',
                            paddingLeft: 0,
                        }}
                        disabled={user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                lineHeight: 34,
                                marginLeft: 20,
                                textTransform: 'capitalize',
                                fontSize: 15,
                                fontFamily: 'Inter',
                                color: '#fff',
                            }}
                        >
                            New Folder
                        </Text>
                    </TouchableOpacity>
                ) : null}
                {/* Add to existing folder button */}
                {channelFolders.length > 0 &&
                channelOwner &&
                !folderId &&
                !createNewFolder &&
                !editFolder &&
                showOriginal ? (
                    <Menu
                        onSelect={async (choice: any) => {
                            if (addingToFolder) {
                                return;
                            }

                            setAddingToFolder(true);
                            server
                                .mutate({
                                    mutation: addToFolder,
                                    variables: {
                                        cueId,
                                        folderId: choice,
                                    },
                                })
                                .then(async (res) => {
                                    // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                    if (!res.data.folder.addToFolder) {
                                        Alert('Could not add to list. Try again.');
                                        setAddingToFolder(false);
                                        return;
                                    }

                                    // Filter out current cue from FolderCuesToDisplay
                                    const filterOutCurrent = folderCuesToDisplay.filter((folderCue: any) => {
                                        return folderCue._id !== cueId;
                                    });

                                    setFolderCuesToDisplay(filterOutCurrent);

                                    setAddingToFolder(false);
                                    setFolderId(choice);
                                })
                                .catch((e) => {
                                    Alert('Could not add to list. Try again.');
                                    setAddingToFolder(false);
                                });
                        }}
                    >
                        <MenuTrigger>
                            <View
                                style={{
                                    backgroundColor: 'none',
                                    paddingLeft: 0,
                                }}
                            >
                                <Text
                                    style={{
                                        lineHeight: 34,
                                        marginLeft: 20,
                                        textTransform: 'capitalize',
                                        fontSize: 15,
                                        fontFamily: 'Inter',
                                        color: '#fff',
                                    }}
                                >
                                    Add to Folder
                                </Text>
                            </View>
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
                                borderWidth: 1,
                                borderColor: '#CCC',
                            }}
                        >
                            {channelFolders.map((folder: any) => {
                                return (
                                    <MenuOption key={folder._id} value={folder._id}>
                                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                                            <Text style={{ fontSize: 15, fontFamily: 'inter', color: '#000000' }}>
                                                {folder.title && folder.title !== '' ? folder.title : 'Untitled'}
                                            </Text>
                                        </View>
                                    </MenuOption>
                                );
                            })}
                        </MenuOptions>
                    </Menu>
                ) : null}

                {/* New Folder selected */}

                {createNewFolder ? (
                    <React.Fragment>
                        <TouchableOpacity
                            onPress={async () => {
                                setCreatingFolder(true);

                                if (selectedCues.length < 2) {
                                    Alert('Folder must contain at least 2 items.');
                                    setCreatingFolder(false);
                                    return;
                                }

                                if (newFolderTitle.trim() === '') {
                                    Alert('Folder title cannot be empty.');
                                    setCreatingFolder(false);
                                    return;
                                }

                                server
                                    .mutate({
                                        mutation: creatFolder,
                                        variables: {
                                            title: newFolderTitle,
                                            cueIds: selectedCues.map((cue: any) => cue._id),
                                        },
                                    })
                                    .then(async (res) => {
                                        // Update cue locally with the new Unread count so that the Unread count reflects in real time

                                        if (res.data.folder.create === null || res.data.folder.create === '') {
                                            Alert('Could not create folder. Try again.');
                                            setCreatingFolder(false);
                                            return;
                                        }

                                        setFolderId(res.data.folder.create);
                                        setCreatingFolder(false);
                                        setCreateNewFolder(false);

                                        refreshCues();
                                    })
                                    .catch((e) => {
                                        Alert('Could not create folder. Try again.');
                                        setCreatingFolder(false);
                                    });
                            }}
                            disabled={creatingFolder || user.email === disableEmailId}
                            style={{
                                backgroundColor: 'none',
                                paddingLeft: 0,
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'capitalize',
                                    fontSize: 15,
                                    fontFamily: 'Inter',
                                    color: '#fff',
                                }}
                            >
                                {creatingFolder ? '...' : 'Create'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                setNewFolderTitle('');
                                setCreateNewFolder(false);
                                setSelectedCues([]);
                            }}
                            style={{
                                backgroundColor: 'none',
                                paddingLeft: 0,
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'capitalize',
                                    fontSize: 15,
                                    fontFamily: 'Inter',
                                    color: '#fff',
                                }}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </React.Fragment>
                ) : null}

                {/* Edit Folder selected */}

                {editFolder ? (
                    <React.Fragment>
                        <TouchableOpacity
                            onPress={async () => {
                                // Add alert first
                                Alert('Update folder?', '', [
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
                                            setUpdatingFolder(true);

                                            const cueIds = folderCuesToDisplay.map((cue: any) => cue._id);

                                            if (cueIds.length < 2) {
                                                Alert('Folder must contain at least 2 items.');
                                                setUpdatingFolder(false);
                                                return;
                                            }

                                            if (updateFolderTitle.trim() === '') {
                                                Alert('Folder title cannot be empty.');
                                                setUpdatingFolder(false);
                                                return;
                                            }

                                            server
                                                .mutate({
                                                    mutation: updateFolder,
                                                    variables: {
                                                        title: updateFolderTitle,
                                                        cueIds,
                                                        folderId,
                                                    },
                                                })
                                                .then(async (res) => {
                                                    // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                                    if (
                                                        res.data.folder.update === null ||
                                                        res.data.folder.update === undefined
                                                    ) {
                                                        Alert('Could not update folder. Try again.');
                                                        setUpdatingFolder(false);
                                                        return;
                                                    }

                                                    // Check if current cue was removed from the list then set folder id to ""
                                                    if (!cueIds.includes(cueId)) {
                                                        setFolderId('');
                                                    } else {
                                                        await fetchFolderCues();
                                                    }

                                                    setUpdatingFolder(false);
                                                    setEditFolder(false);
                                                })
                                                .catch((e) => {
                                                    Alert('Could not update folder. Try again.');
                                                    setUpdatingFolder(false);
                                                });
                                        },
                                    },
                                ]);
                            }}
                            disabled={updatingFolder || user.email === disableEmailId}
                            style={{
                                backgroundColor: 'none',
                                paddingLeft: 0,
                            }}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'capitalize',
                                    fontSize: 15,
                                    fontFamily: 'Inter',
                                    color: '#fff',
                                }}
                            >
                                {creatingFolder ? '...' : 'Update '}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                // Add alert first
                                Alert('Delete folder?', '', [
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
                                            setDeletingFolder(true);

                                            server
                                                .mutate({
                                                    mutation: deleteFolder,
                                                    variables: {
                                                        folderId,
                                                    },
                                                })
                                                .then(async (res) => {
                                                    // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                                    if (!res.data.folder.delete) {
                                                        Alert('Could not delete list. Try again.');
                                                        setDeletingFolder(false);
                                                        return;
                                                    }

                                                    setDeletingFolder(false);
                                                    setEditFolder(false);
                                                    setFolderId('');

                                                    fetchChannelFolders();
                                                })
                                                .catch((e) => {
                                                    Alert('Could not delete folder. Try again.');
                                                    setDeletingFolder(false);
                                                });
                                        },
                                    },
                                ]);
                            }}
                            style={{
                                backgroundColor: 'none',
                                paddingLeft: 0,
                            }}
                            disabled={user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'capitalize',
                                    fontSize: 15,
                                    fontFamily: 'Inter',
                                    color: '#fff',
                                }}
                            >
                                {deletingFolder ? '...' : 'Delete'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={async () => {
                                setEditFolder(false);

                                // Set cues to display to original
                                const cuesInOrder = folder.cueIds.map((id: any) => {
                                    return folderCues.find((cue: any) => cue._id === id);
                                });

                                setFolderCuesToDisplay(cuesInOrder);
                            }}
                            style={{
                                backgroundColor: 'none',
                                paddingLeft: 0,
                            }}
                            disabled={user.email === disableEmailId}
                        >
                            <Text
                                style={{
                                    lineHeight: 34,
                                    marginLeft: 20,
                                    textTransform: 'capitalize',
                                    fontSize: 15,
                                    fontFamily: 'Inter',
                                    color: '#fff',
                                }}
                            >
                                {deletingFolder ? '...' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </React.Fragment>
                ) : null}
            </React.Fragment>
        );
    };

    /**
     *  @description This function will render the Bar with Back button, Folder options, Option Tabs, And Save, Delete buttons
     *
     * */
    const renderHeader = () => {
        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: props.activeChannelColor,
                    flexDirection: 'column',
                    zIndex: 500000,
                }}
            >
                {/* The first bar will be the main black bar with the back button, Cue Tabs and buttons */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 64,
                        backgroundColor: 'none',
                        paddingHorizontal: paddingResponsive(),
                        zIndex: 500000,
                    }}
                >
                    {folderId !== '' &&
                    folderCuesToDisplay.length !== 0 &&
                    !editFolder &&
                    !createNewFolder &&
                    showOriginal ? (
                        <TouchableOpacity
                            onPress={() => setShowExistingFolder(!showExistingFolder)}
                            style={{
                                position: 'absolute',
                                zIndex: 500001,
                                bottom: -17,
                                left: '50%',
                                width: 35,
                                height: 35,
                                borderRadius: '100%',
                                backgroundColor: '#f8f8f8',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: {
                                    width: 10,
                                    height: 10,
                                },
                                shadowOpacity: 0.1,
                                shadowRadius: 15,
                            }}
                        >
                            <Ionicons
                                name={showExistingFolder ? 'chevron-up-outline' : 'chevron-down-outline'}
                                size={20}
                                color="#1f1f1f"
                            />
                        </TouchableOpacity>
                    ) : null}
                    <View style={{ flexDirection: 'row', flex: 1, maxWidth: 1024, backgroundColor: 'none' }}>
                        {/* BACK BUTTON */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                backgroundColor: 'none',
                            }}
                            onPress={() => {
                                props.closeModal();
                            }}
                        >
                            <Text>
                                <Ionicons name="arrow-back-outline" size={32} color={'#fff'} />
                            </Text>
                        </TouchableOpacity>

                        {/* CUE TABS IF THE DIMENSIONS IS BIGGER THAN 1024 */}
                        {Dimensions.get('window').width >= 768 && !createNewFolder && !editFolder ? options : null}

                        {/* Render Folder Title input if Create / Edit */}

                        {createNewFolder ? (
                            <TextInput
                                value={newFolderTitle}
                                style={{
                                    color: '#000',
                                    backgroundColor: '#f8f8f8',
                                    borderRadius: 24,
                                    fontSize: 13,
                                    paddingVertical: 6,
                                    paddingHorizontal: 20,
                                    marginLeft: 10,
                                    marginRight: 2,
                                    maxWidth: 225,
                                }}
                                autoCompleteType={'xyz'}
                                placeholderTextColor={'#000'}
                                placeholder={'Folder Title'}
                                onChange={(e: any) => setNewFolderTitle(e.target.value)}
                            />
                        ) : null}

                        {editFolder ? (
                            <TextInput
                                value={updateFolderTitle}
                                style={{
                                    color: '#000',
                                    backgroundColor: '#f8f8f8',
                                    borderRadius: 24,
                                    fontSize: 13,
                                    paddingVertical: 6,
                                    paddingHorizontal: 20,
                                    marginLeft: 10,
                                    marginRight: 2,
                                    maxWidth: 225,
                                }}
                                autoCompleteType={'xyz'}
                                placeholderTextColor={'#000'}
                                placeholder={'Folder Title'}
                                onChange={(e: any) => setUpdateFolderTitle(e.target.value)}
                            />
                        ) : null}

                        {/* BUTTONS */}
                        {
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'none',
                                    justifyContent: 'flex-end',
                                    flexDirection: 'row',
                                }}
                            >
                                {((channelOwner && showOriginal && !isQuiz) || showOptions || !props.channelId) &&
                                !editFolder &&
                                !createNewFolder ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setSave(true);
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            backgroundColor: 'none',
                                            marginLeft: 20,
                                        }}
                                        disabled={user.email === disableEmailId || syncingCueFromBackend}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: 'none',
                                                textTransform: 'capitalize',
                                                fontSize: 15,
                                                fontFamily: 'Inter',
                                                color: '#fff',
                                            }}
                                        >
                                            {savingCueToCloud ? 'Saving...' : 'Save'}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                {((channelOwner && showOriginal) ||
                                    (channelOwner && showOptions) ||
                                    !props.channelId) &&
                                !editFolder &&
                                !createNewFolder ? (
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setDel(true);
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            marginLeft: 20,
                                            backgroundColor: 'none',
                                        }}
                                        disabled={user.email === disableEmailId || syncingCueFromBackend}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                backgroundColor: 'none',
                                                textTransform: 'capitalize',
                                                fontSize: 15,
                                                fontFamily: 'Inter',
                                                color: '#fff',
                                            }}
                                        >
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                                {syncingCueFromBackend || syncCueError ? null : renderFolderButtons()}
                            </View>
                        }
                    </View>
                </View>

                {/* These are the expanded menues with folders */}

                <View
                    style={{
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {folderId !== '' &&
                    folderCuesToDisplay.length !== 0 &&
                    !editFolder &&
                    !createNewFolder &&
                    showOriginal &&
                    showExistingFolder
                        ? renderExistingFolder()
                        : null}
                </View>

                <View
                    style={{
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {createNewFolder ? renderNewFolderOptions() : null}
                </View>

                <View
                    style={{
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    {editFolder ? renderEditFolderOptions() : null}
                </View>
            </View>
        );
    };

    return (
        <View
            style={{
                width: '100%',
                height: windowHeight,
                backgroundColor: '#fff',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
            }}
        >
            <View style={{ width: '100%', position: 'relative', height: windowHeight }}>
                {/* Header */}
                {renderHeader()}

                {/* Main Content */}
                {syncingCueFromBackend && !syncCueError ? (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            flex: 1,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignSelf: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    marginTop: 10,
                                }}
                            >
                                <ActivityIndicator size={20} color={'#1F1F1F'} />
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                        marginTop: 10,
                                    }}
                                >
                                    Loading...
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : syncCueError || !cue ? (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            flex: 1,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignSelf: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons name={'cloud-offline-outline'} size={50} />

                            <Text
                                style={{
                                    fontSize: 20,
                                    fontFamily: 'Inter',
                                    marginTop: 10,
                                }}
                            >
                                Failed to fetch content. Try again.
                            </Text>

                            {syncingCueFromBackend ? (
                                <View
                                    style={{
                                        marginTop: 10,
                                    }}
                                >
                                    <ActivityIndicator size={20} color={'#1F1F1F'} />
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: 'white',
                                        marginTop: 25,
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                    onPress={() => {
                                        fetchCueFromBackend(cueId);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            borderColor: '#000',
                                            borderWidth: 1,
                                            color: '#fff',
                                            backgroundColor: '#000',
                                            fontSize: 11,
                                            paddingHorizontal: 24,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'uppercase',
                                            width: 130,
                                        }}
                                    >
                                        Reload page
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : (
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: 'white',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            flex: 1,
                        }}
                    >
                        {ContentView}
                    </View>
                )}
                {/* Mobile tabs */}
                {Dimensions.get('window').width < 768 ? mobileOptions : null}
            </View>
        </View>
    );
};

export default Update;

const styles: any = StyleSheet.create({
    all: {
        fontSize: 14,
        color: '#fff',
        height: 24,
        marginHorizontal: 15,
        backgroundColor: 'none',
        lineHeight: 24,
        fontFamily: 'overpass',
        textTransform: 'uppercase',
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
    },
    dateContainer: {
        fontSize: 11,
        color: '#fff',
        height: '30%',
        display: 'flex',
        flexDirection: 'row',
    },
    date2: {
        fontSize: 11,
        color: '#1F1F1F',
        // marginLeft: 10,
        lineHeight: 12,
        textAlign: 'left',
        paddingVertical: 2,
        flex: 1,
    },
});
