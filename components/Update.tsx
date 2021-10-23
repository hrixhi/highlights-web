import React, { useCallback, useEffect, useRef, useState, Fragment } from 'react';
import { Animated, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import Alert from '../components/Alert'
import { View, TouchableOpacity, Text } from '../components/Themed';
import Swiper from 'react-native-web-swiper'
import UpdateControls from './UpdateControls';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getCueThreads, getStatuses, getUnreadQACount, creatFolder, getFolder, getFolderCues, getChannelFolders, updateFolder, addToFolder, deleteFolder, removeFromFolder, getReleaseSubmissionStatus } from '../graphql/QueriesAndMutations';
import ThreadsList from './ThreadsList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscribersList from './SubscribersList';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import TextareaAutosize from 'react-textarea-autosize';
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
    arrayMove
} from 'react-sortable-hoc';
import { htmlStringParser, getContentIcon } from '../helpers/HTMLParser';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

const Update: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [modalAnimation] = useState(new Animated.Value(1))
    const [cueId] = useState(props.cueId)
    const [createdBy] = useState(props.createdBy)
    const [channelCreatedBy] = useState(props.channelCreatedBy)
    const [threads, setThreads] = useState<any[]>([])
    const [subscribers, setSubscribers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const scroll2: any = useRef()
    const scroll3: any = useRef()
    const [channelOwner, setChannelOwner] = useState(false)
    const [viewStatus, setViewStatus] = useState(false);
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false)
    const [showOriginal, setShowOriginal] = useState(true)
    const [isQuiz, setIsQuiz] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [save, setSave] = useState(false)
    const [del, setDel] = useState(false)

    // Folder 

    const [showFolder, setShowFolder] = useState(false);
    const [createNewFolder, setCreateNewFolder] = useState(false);
    const [newFolderTitle, setNewFolderTitle] = useState("");
    const [channelCues, setChannelCues] = useState<any[]>([]);
    const [selectedCues, setSelectedCues] = useState<any[]>([]);
    const [folderId, setFolderId] = useState(props.cue.folderId && props.cue.folderId !== "" ? props.cue.folderId : '')
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [channelFolders, setChannelFolders] = useState<any[]>([]);
    const [editFolder, setEditFolder] = useState(false);
    const [updatingFolder, setUpdatingFolder] = useState(false);
    const [deletingFolder, setDeletingFolder] = useState(false);
    const [addingToFolder, setAddingToFolder] = useState(false);
    const [folderCues, setFolderCues] = useState<any[]>([]);
    const [folder, setFolder] = useState<any>({});
    const [loadingFolderCues, setLoadingFolderCues] = useState(false);
    const [loadingFolder, setLoadingFolder] = useState(false)
    const [updateFolderTitle, setUpdateFolderTitle] = useState('');
    const [folderCuesToDisplay, setFolderCuesToDisplay] = useState<any[]>([]);

    const unableToLoadStatusesAlert = PreferredLanguageText('unableToLoadStatuses');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const unableToLoadCommentsAlert = PreferredLanguageText('unableToLoadComments')

    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data1 = props.cue.original;
            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1)
                if (obj.quizId) {
                    setIsQuiz(true)
                }
            }
        }
    }, [props.cue])

    // Every time a cue is opened we need to check if the releaseSubmission property was modified so that a student is not allowed to do submissions
    useEffect(() => {
        if (cueId && cueId !== "") {
            checkReleaseSubmissionStatus(cueId)
        }
    }, [cueId])

    const checkReleaseSubmissionStatus = (cueId: string) => {
        const server = fetchAPI("")
        server.query({
            query: getReleaseSubmissionStatus,
            variables: {
                cueId
            }
        }).then(async res => {
            if (res.data.cue.getReleaseSubmissionStatus) {
                // Update cue and refresh

                let subCues: any = {};
                try {
                    const value = await AsyncStorage.getItem("cues");
                    if (value) {
                        subCues = JSON.parse(value);
                    }
                } catch (e) { }
                if (subCues[props.cueKey].length === 0) {
                    return;
                }

                const currCue = subCues[props.cueKey][props.cueIndex]

                const saveCue = {
                    ...currCue,
                    releaseSubmission: true
                }

                subCues[props.cueKey][props.cueIndex] = saveCue

                const stringifiedCues = JSON.stringify(subCues);
                await AsyncStorage.setItem("cues", stringifiedCues);

                props.reloadCueListAfterUpdate();

            }
        }).catch((e) => {
            // Do nothing
        })
    }

    useEffect(() => {
        if (props.target && props.target === "Q&A") {
            setShowComments(true);
        }
    }, [props.target])

    useEffect(() => {

        if (!props.channelCues) return;

        const filterExisting = props.channelCues.filter((cue: any) => {
            return cue.folderId === "" || !cue.folderId
        })

        setChannelCues(filterExisting)
    }, [props.channelCues])

    const fetchChannelFolders = useCallback(async () => {

        const u = await AsyncStorage.getItem('user')
        let parsedUser: any = {}
        if (u) {
            parsedUser = JSON.parse(u)
        }

        const server = fetchAPI(parsedUser._id)
        server.query({
            query: getChannelFolders,
            variables: {
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data.folder.getFoldersForChannel) {
                setChannelFolders(res.data.folder.getFoldersForChannel)
            }
        }).catch((e) => {

        })


    }, [props.channelId])

    useEffect(() => {
        fetchChannelFolders()
    }, [props.channelId])


    useEffect(() => {

        if (folderId !== "" && folder && folder !== null && folder.cueIds && folderCues && folderCues.length > 0) {

            // const cuesInOrder = folder.cueIds.map((id: any) => {
            //     return folderCues.find((cue: any) => cue._id === id)
            // })

            // const filterUndefined = cuesInOrder.filter((cue: any) => cue !== undefined)

            setFolderCuesToDisplay(folderCues)
            setUpdateFolderTitle(folder.title)
        }

    }, [folder, folderCues, folderId])

    const fetchFolderCues = useCallback(async () => {
        if (props.cue && folderId && folderId !== "") {
            const u = await AsyncStorage.getItem('user')
            let parsedUser: any = {}
            if (u) {
                parsedUser = JSON.parse(u)
            }

            setLoadingFolderCues(true);
            setLoadingFolder(true);

            const server = fetchAPI(parsedUser._id)
            server.query({
                query: getFolderCues,
                variables: {
                    folderId,
                    userId: parsedUser._id
                }
            }).then(res => {
                if (res.data.folder.getCuesById) {
                    setFolderCues(res.data.folder.getCuesById)
                    setLoadingFolderCues(false);
                }
            }).catch((e) => {
                setLoadingFolderCues(false);
            })

            server.query({
                query: getFolder,
                variables: {
                    folderId,
                }
            }).then(res => {
                if (res.data.folder.findById) {
                    setFolder(res.data.folder.findById)
                    setLoadingFolder(false);
                }
            }).catch((e) => {
                setLoadingFolder(false);
            })
        }
    }, [folderId])

    useEffect(() => {
        fetchFolderCues()
    }, [folderId])

    const updateCueWithReleaseSubmission = async (releaseSubmission: boolean) => {

        // Release Submission

        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem("cues");
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) { }
        if (subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex]

        const saveCue = {
            ...currCue,
            releaseSubmission
        }

        subCues[props.cueKey][props.cueIndex] = saveCue

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);

        props.reloadCueListAfterUpdate();

    }

    const updateQAUnreadCount = async () => {
        const u = await AsyncStorage.getItem('user')
        let parsedUser: any = {}
        if (u) {
            parsedUser = JSON.parse(u)
        }

        if (Number.isNaN(Number(cueId))) {
            const server = fetchAPI(parsedUser._id)

            server.query({
                query: getUnreadQACount,
                variables: {
                    userId: parsedUser._id,
                    cueId,
                }
            }).then(async res => {

                // Update cue locally with the new Unread count so that the Unread count reflects in real time

                if (res.data.threadStatus.getUnreadQACount === null || res.data.threadStatus.getUnreadQACount === undefined) {
                    return null
                }


                let subCues: any = {};
                try {
                    const value = await AsyncStorage.getItem("cues");
                    if (value) {
                        subCues = JSON.parse(value);
                    }
                } catch (e) { }
                if (subCues[props.cueKey].length === 0) {
                    return;
                }

                const currCue = subCues[props.cueKey][props.cueIndex]

                const saveCue = {
                    ...currCue,
                    unreadThreads: res.data.threadStatus.getUnreadQACount
                }

                subCues[props.cueKey][props.cueIndex] = saveCue

                const stringifiedCues = JSON.stringify(subCues);
                await AsyncStorage.setItem("cues", stringifiedCues);

                props.reloadCueListAfterUpdate();

            })


            server.query({
                query: getCueThreads,
                variables: {
                    cueId
                }
            }).then(async res => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const parsedUser = JSON.parse(u)
                    let filteredThreads: any[] = []
                    if (parsedUser._id.toString().trim() === channelCreatedBy.toString().trim()) {
                        filteredThreads = res.data.thread.findByCueId;
                    } else {
                        filteredThreads = res.data.thread.findByCueId.filter((thread: any) => {
                            return !thread.isPrivate || (thread.userId === parsedUser._id)
                        })
                    }
                    setThreads(filteredThreads)
                }
            })


        }

    }

    const loadThreadsAndStatuses = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        let parsedUser: any = {}
        if (u) {
            parsedUser = JSON.parse(u)
        }
        if (Number.isNaN(Number(cueId))) {
            setLoading(true)
            const server = fetchAPI(parsedUser._id)
            server.query({
                query: getCueThreads,
                variables: {
                    cueId
                }
            }).then(async res => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const parsedUser = JSON.parse(u)
                    let filteredThreads: any[] = []
                    if (parsedUser._id.toString().trim() === channelCreatedBy.toString().trim()) {
                        filteredThreads = res.data.thread.findByCueId;
                    } else {
                        filteredThreads = res.data.thread.findByCueId.filter((thread: any) => {
                            return !thread.isPrivate || (thread.userId === parsedUser._id)
                        })
                    }
                    setThreads(filteredThreads)
                    if (parsedUser._id.toString().trim() === channelCreatedBy.toString().trim()) {
                        setChannelOwner(true)
                        server.query({
                            query: getStatuses,
                            variables: {
                                cueId
                            }
                        }).then(res2 => {
                            if (res2.data.status && res2.data.status.findByCueId) {
                                const subs: any[] = []
                                const statuses = res2.data.status.findByCueId
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
                                    })
                                })
                                setSubscribers(subs)
                                setLoading(false)
                                // modalAnimation.setValue(0)
                                // Animated.timing(modalAnimation, {
                                //     toValue: 1,
                                //     duration: 150,
                                //     useNativeDriver: true
                                // }).start();
                            } else {
                                setLoading(false)
                                // modalAnimation.setValue(0)
                                // Animated.timing(modalAnimation, {
                                //     toValue: 1,
                                //     duration: 150,
                                //     useNativeDriver: true
                                // }).start();
                            }
                        }).catch(err => {
                            Alert(unableToLoadStatusesAlert, checkConnectionAlert)
                            setLoading(false)
                            // modalAnimation.setValue(0)
                            // Animated.timing(modalAnimation, {
                            //     toValue: 1,
                            //     duration: 150,
                            //     useNativeDriver: true
                            // }).start();
                        })
                    } else {
                        setLoading(false)
                        // modalAnimation.setValue(0)
                        // Animated.timing(modalAnimation, {
                        //     toValue: 1,
                        //     duration: 150,
                        //     useNativeDriver: true
                        // }).start();
                    }
                } else {
                    setThreads(res.data.thread.findByCueId)
                    setLoading(false)
                    // modalAnimation.setValue(0)
                    // Animated.timing(modalAnimation, {
                    //     toValue: 1,
                    //     duration: 150,
                    //     useNativeDriver: true
                    // }).start();
                }
            }).catch(err => {
                Alert(unableToLoadCommentsAlert, checkConnectionAlert)
                setLoading(false)
                // modalAnimation.setValue(0)
                // Animated.timing(modalAnimation, {
                //     toValue: 1,
                //     duration: 150,
                //     useNativeDriver: true
                // }).start();
            })
        } else {
            setLoading(false)
            // modalAnimation.setValue(0)
            // Animated.timing(modalAnimation, {
            //     toValue: 1,
            //     duration: 150,
            //     useNativeDriver: true
            // }).start();
        }
    }, [cueId, modalAnimation, createdBy, channelCreatedBy])

    const reloadStatuses = useCallback(async () => {
        setLoading(true)
        const u = await AsyncStorage.getItem('user')
        let parsedUser: any = {}
        if (u) {
            parsedUser = JSON.parse(u)
        } else {
            return;
        }

        const server = fetchAPI(parsedUser._id)
        server.query({
            query: getStatuses,
            variables: {
                cueId
            }
        }).then(res2 => {
            if (res2.data.status && res2.data.status.findByCueId) {
                const subs: any[] = []
                const statuses = res2.data.status.findByCueId
                statuses.map((status: any) => {
                    subs.push({
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
                    })
                })
                setSubscribers(subs)
                setLoading(false)
                // modalAnimation.setValue(0)
                // Animated.timing(modalAnimation, {
                //     toValue: 1,
                //     duration: 150,
                //     useNativeDriver: true
                // }).start();
            } else {
                setLoading(false)
                // modalAnimation.setValue(0)
                // Animated.timing(modalAnimation, {
                //     toValue: 1,
                //     duration: 150,
                //     useNativeDriver: true
                // }).start();
            }
        }).catch(err => {
            Alert(unableToLoadStatusesAlert, checkConnectionAlert)
            setLoading(false)
            // modalAnimation.setValue(0)
            // Animated.timing(modalAnimation, {
            //     toValue: 1,
            //     duration: 150,
            //     useNativeDriver: true
            // }).start();
        })
    }, [cueId])


    useEffect(() => {
        loadThreadsAndStatuses()
    }, [props.cueId, props.channelId])


    /**
     * @description Handle used to drage cues for sorting
     */
    const DragHandle = SortableHandle(() => (<Text style={{ marginRight: 10 }}> <Ionicons name='menu-outline' size={22} color='#343A40' /> </Text>))

    /**
     * @description Sortable Cue for Create Folder
     */
    const SortableItem = SortableElement(({ value, sortIndex }: any) => {

        const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue)

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

        const col = colorChoices[value.color]


        return (<View
            style={{
                overflow: 'hidden',
                maxWidth: 150,
                maxHeight: 50,
                width: '100%',
                marginBottom: 10,
                marginRight: 15,
                shadowOffset: {
                    width: 3,
                    height: 0,
                },
                shadowOpacity: 0.8,
                borderRadius: 1,
                shadowColor: col,
                flexDirection: 'row',
            }}
        >
            <View
                key={'textPage'}
                style={{
                    maxWidth: 168,
                    width: '100%',
                    height: '100%',
                    borderRadius: 1,
                    padding: 10,
                    paddingHorizontal: 10,
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    margin: 0
                }}>

                <DragHandle />

                <Text
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                    style={{
                        fontFamily: 'inter',
                        fontSize: 12,
                        lineHeight: 25,
                        flex: 1, flexDirection: 'row',
                        // marginTop: 3,
                        color: value._id === props.cue._id ? '#3289D0' : '#343A40'
                    }}>
                    {title}
                </Text>

                {/* Add button here */}

                {value._id !== props.cue._id ? <TouchableOpacity
                    onPress={() => {

                        const temp = [...channelCues];
                        temp.push(value);
                        setChannelCues(temp);

                        const sCues = selectedCues.filter((c: any) => c._id !== value._id)
                        setSelectedCues(sCues);

                    }}
                    style={{
                        justifyContent: 'center',
                        marginTop: 2,
                        width: 20, height: 20, borderRadius: 10, backgroundColor: '#f94144'
                    }}
                >
                    <Text style={{
                        color: '#fff',
                        // width: '100%',
                        textAlign: 'center'
                    }}>
                        <Ionicons name='remove-circle-outline' size={22} />
                    </Text>
                </TouchableOpacity> : null}
            </View>
        </View>)
    })

    /**
     * @description Sortable Cue for Update Folder 
     * Needs to be stylisticaly same as SortableItem
     */
    const SortableItemUpdate = SortableElement(({ value, sortIndex }: any) => {
        const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue)

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

        const col = colorChoices[value.color]


        return (<View
            style={{
                overflow: 'hidden',
                maxWidth: 150,
                maxHeight: 50,
                width: '100%',
                marginBottom: 10,
                marginRight: 15,
                shadowOffset: {
                    width: 3,
                    height: 0,
                },
                shadowOpacity: 0.8,
                borderRadius: 1,
                shadowColor: col,
                flexDirection: 'row',
            }}
        >
            <View
                key={'textPage'}
                style={{
                    maxWidth: 168,
                    width: '100%',
                    height: '100%',
                    borderRadius: 1,
                    padding: 10,
                    paddingHorizontal: 10,
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    margin: 0
                }}>

                <DragHandle />

                <Text
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                    style={{
                        fontFamily: 'inter',
                        fontSize: 12,
                        lineHeight: 25,
                        flex: 1, flexDirection: 'row',
                        // marginTop: 5,
                        color: value._id === props.cue._id ? '#3289D0' : '#343A40'
                    }}>
                    {title}
                </Text>

                <TouchableOpacity
                    onPress={() => {

                        const temp = [...channelCues];
                        temp.push(value);
                        setChannelCues(temp);

                        const sCues = folderCuesToDisplay.filter((c: any) => c._id !== value._id)
                        setFolderCuesToDisplay(sCues);

                    }}
                    style={{
                        justifyContent: 'center',
                        marginTop: 2,
                        width: 20, height: 20, borderRadius: 10, backgroundColor: '#f94144'
                    }}
                >
                    <Text style={{ color: '#fff' }}>
                        <Ionicons name='remove-circle-outline' size={22} />
                    </Text>
                </TouchableOpacity>
            </View>
        </View>)
    })

    /**
     * @description Renders the Selected Cues as sortable for Create Folder
     */
    const SortableList = SortableContainer(({ items }: any) => {
        return (
            <ScrollView
                style={{
                    width: "100%",
                    maxWidth: 1000,
                    backgroundColor: '#E7EBEE',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    marginTop: 10
                }}
                horizontal={true}
                showsVerticalScrollIndicator={false}
            >
                {items.map((value: any, index: number) => (
                    <SortableItem
                        key={`item-${index}`}
                        index={index}
                        sortIndex={index}
                        value={value}
                    />
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
                    width: "100%",
                    maxWidth: 1000,
                    backgroundColor: '#E7EBEE',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    marginTop: 10
                }}
                horizontal={true}
                showsVerticalScrollIndicator={false}
            >
                {items.map((value: any, index: number) => (
                    <SortableItemUpdate
                        key={`item-${index}`}
                        index={index}
                        sortIndex={index}
                        value={value}
                    />
                ))}
            </ScrollView>
        );
    });


    /**
     * 
     * @description Used to sort the selected cues for Create Folder
     */
    const onSortEnd = ({ oldIndex, newIndex }: any) => {
        setSelectedCues(arrayMove(selectedCues, oldIndex, newIndex))
    };


    /**
    * 
     * 
    * 
    * @description Used to sort the selected cues for Update Folder
    */
    const onSortEndUpdate = ({ oldIndex, newIndex }: any) => {
        setFolderCuesToDisplay(arrayMove(folderCuesToDisplay, oldIndex, newIndex))
    };

    /**
     * @description Tabs (Content, Options, Submission, etc)
     */
    const options = <View style={{
        paddingLeft: Dimensions.get('window').width < 1024 ? 0 : 20,
        flexDirection: 'row',
        flex: 1,
        backgroundColor: '#16181C', // paddingVertical: 2,
        paddingTop: 10,
        height: 48,
        justifyContent: Dimensions.get('window').width < 1024 ? 'center' : 'flex-start'
        // alignSelf: 'center'
    }}>
        <TouchableOpacity
            style={{
                backgroundColor: '#16181C',
            }}
            onPress={() => {
                setShowOptions(false)
                setViewStatus(false)
                setShowOriginal(true)
                setShowComments(false)
            }}>
            <Text style={showOriginal ? styles.allGrayFill : styles.all}>
                {/* <Ionicons name='newspaper-outline' size={19} /> */}
                Content
            </Text>
            {/* <Text style={showOriginal ? styles.allGrayFill : styles.all}>
            Content
        </Text> */}
        </TouchableOpacity>
        <TouchableOpacity
            style={{
                backgroundColor: '#16181C',
            }}
            onPress={() => {
                setShowOptions(true)
                setViewStatus(false)
                setShowOriginal(false)
                setShowComments(false)
            }}>

            <Text style={showOptions ? styles.allGrayFill : styles.all}>
                {/* <Ionicons name='options-outline' size={19} /> */}
                DETAILS
            </Text>
            {/* <Text style={styles.all}>
            Settings
        </Text> */}
        </TouchableOpacity>
        {
            (props.channelId === '') || !submission || (channelOwner && submission) || isQuiz ? null :
                <TouchableOpacity
                    style={{
                        backgroundColor: '#16181C',
                    }}
                    onPress={() => {
                        setViewStatus(false)
                        setShowOriginal(false)
                        setShowComments(false)
                        setShowOptions(false)
                    }}>
                    <Text style={!showOriginal && !viewStatus && !showOptions && !showComments ? styles.allGrayFill : styles.all}>
                        {/* <Ionicons name='document-attach-outline' size={19} /> */}
                        Submission
                    </Text>
                    {/* <Text style={!showOriginal && !viewStatus && !showOptions && !showComments ? styles.allGrayFill : styles.all}>
                    Submission
                </Text> */}
                </TouchableOpacity>
        }
        {/* Add Status button here */}
        {
            (props.channelId === '') || !channelOwner ? null :
                <TouchableOpacity
                    style={{
                        backgroundColor: '#16181C',
                    }}
                    onPress={() => {
                        setViewStatus(true)
                        setShowOriginal(false)
                        setShowComments(false)
                        setShowOptions(false)
                    }}>
                    <Text style={viewStatus ? styles.allGrayFill : styles.all}>
                        {/* <Ionicons name='bar-chart-outline' size={19} /> */}
                        Responses
                    </Text>
                    {/* <Text style={viewStatus ? styles.allGrayFill : styles.all}>
                    Engagement
                </Text> */}
                </TouchableOpacity>
        }
    </View>


    /**
     * @description Renders the existing folder cues for the Header
     */
    const renderExistingFolder = () => {

        return <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: '#E7EBEE', paddingVertical: 10 }}>
            <ScrollView
                style={{
                    width: "100%",
                    maxWidth: 1000,
                    backgroundColor: '#E7EBEE',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    marginTop: 10
                }}
                horizontal={true}
                showsVerticalScrollIndicator={false}
            >
                {folderCuesToDisplay.map((cue: any) => {

                    if (!cue || !cue.channelId) return;

                    const { title } = htmlStringParser(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)

                    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

                    const col = colorChoices[cue.color]

                    return (<View
                        style={{
                            overflow: 'hidden',
                            maxWidth: 150,
                            maxHeight: 50,
                            width: '100%',
                            marginBottom: 10,
                            marginRight: 15,
                            shadowOffset: {
                                width: 3,
                                height: 0,
                            },
                            shadowOpacity: 0.8,
                            borderRadius: 1,
                            shadowColor: col,
                            flexDirection: 'row',
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => props.openCue(cue._id)}
                            key={'textPage'}
                            style={{
                                maxWidth: 168,
                                width: '100%',
                                height: '100%',
                                borderRadius: 1,
                                padding: 10,
                                paddingHorizontal: 10,
                                backgroundColor: '#fff',
                            }}>
                            <View style={styles.dateContainer}>
                                <Text style={styles.date2}>
                                    {
                                        (new Date(props.cue.date)).toString().split(' ')[1] +
                                        ' ' +
                                        (new Date(props.cue.date)).toString().split(' ')[2]
                                    }
                                </Text>
                            </View>
                            <Text
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 12,
                                    lineHeight: 25,
                                    flex: 1, flexDirection: 'row',
                                    // marginTop: 5,
                                    color: cue._id === props.cue._id ? '#3289D0' : '#343A40'
                                }}>
                                {title}
                            </Text>
                        </TouchableOpacity>
                    </View>)
                })}
            </ScrollView>
        </View>

    }

    /**
     * @description method to render the cue selections for new folder
     * Two Sections (First section shows all options and the second one shows the selected cues)
     */
    const renderNewFolderOptions = () => {

        return <View style={{ width: '100%', flexDirection: 'column', }}>

            {/* Section 1: Shows all cues from Channel */}
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: '#E7EBEE', paddingVertical: 10 }}>
                {channelCues.length !== 0 ? <ScrollView
                    style={{
                        width: "100%",
                        maxWidth: 1000,
                        backgroundColor: '#E7EBEE',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        marginTop: 10
                    }}
                    horizontal={true}
                    showsVerticalScrollIndicator={false}
                >
                    {channelCues.map((cue: any) => {
                        const { title } = htmlStringParser(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)

                        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

                        const col = colorChoices[cue.color]

                        return (<View
                            style={{
                                overflow: 'hidden',
                                maxWidth: 150,
                                maxHeight: 50,
                                width: '100%',
                                marginBottom: 10,
                                marginRight: 15,
                                shadowOffset: {
                                    width: 3,
                                    height: 0,
                                },
                                shadowOpacity: 0.8,
                                borderRadius: 1,
                                shadowColor: col,
                                flexDirection: 'row',
                            }}
                        >
                            <View
                                key={'textPage'}
                                style={{
                                    maxWidth: 168,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 1,
                                    padding: 10,
                                    paddingHorizontal: 10,
                                    backgroundColor: '#fff',
                                    flexDirection: 'row',
                                    margin: 0
                                }}>
                                <View style={{ display: 'flex', flexDirection: 'column', width: '80%' }}>
                                    <View style={styles.dateContainer}>
                                        <Text style={styles.date2}>
                                            {
                                                (new Date(props.cue.date)).toString().split(' ')[1] +
                                                ' ' +
                                                (new Date(props.cue.date)).toString().split(' ')[2]
                                            }
                                        </Text>
                                    </View>
                                    <Text
                                        ellipsizeMode={'tail'}
                                        numberOfLines={1}
                                        style={{
                                            fontFamily: 'inter',
                                            fontSize: 12,
                                            lineHeight: 25,
                                            flex: 1, flexDirection: 'row',
                                            // marginTop: 5,
                                            color: cue._id === props.cue._id ? '#3289D0' : '#343A40'
                                        }}>
                                        {title}
                                    </Text>
                                </View>

                                {/* Add button here */}
                                <TouchableOpacity
                                    onPress={() => {
                                        const temp = [...selectedCues];
                                        temp.push(cue);
                                        setSelectedCues(temp)

                                        // Remove from channel Cues
                                        const cCues = channelCues.filter((c: any) => c._id !== cue._id)
                                        setChannelCues(cCues)
                                    }}
                                    style={{
                                        justifyContent: 'center',
                                        width: 20, height: 20, borderRadius: 10, backgroundColor: '#3289D0'
                                    }}
                                >
                                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                                        <Ionicons name='add-outline' size={22} />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>)
                    })}
                </ScrollView> : <View>
                    <Text style={{ fontSize: 14, color: '#343A40', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#3289D0', paddingVertical: 20 }}>
                        No Content to select.
                    </Text>
                </View>}
            </View>

            {/* Section 2 */}

            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: '#E7EBEE', paddingVertical: 10 }}>
                <SortableList
                    axis={'x'}
                    lockAxis={'x'}
                    items={selectedCues} onSortEnd={onSortEnd} useDragHandle
                />
            </View>
        </View>
    }

    /**
    * @description method to render the cue selections for edit folder
    * Two Sections (First section shows all options and the second one shows the selected cues)
    */
    const renderEditFolderOptions = () => {
        return <View style={{ width: '100%', flexDirection: 'column', }}>

            {/* Section 1: Shows all cues from Channel */}
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: '#E7EBEE', paddingVertical: 10 }}>
                {channelCues.length !== 0 ?
                    <ScrollView
                        style={{
                            width: "100%",
                            maxWidth: 1000,
                            backgroundColor: '#E7EBEE',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            marginTop: 10
                        }}
                        horizontal={true}
                        showsVerticalScrollIndicator={false}
                    >
                        {channelCues.map((cue: any) => {
                            const { title } = htmlStringParser(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)

                            const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

                            const col = colorChoices[cue.color]

                            return (<View
                                style={{
                                    overflow: 'hidden',
                                    maxWidth: 150,
                                    maxHeight: 50,
                                    width: '100%',
                                    marginBottom: 10,
                                    marginRight: 15,
                                    shadowOffset: {
                                        width: 3,
                                        height: 0,
                                    },
                                    shadowOpacity: 0.8,
                                    borderRadius: 1,
                                    shadowColor: col,
                                    flexDirection: 'row',
                                }}
                            >
                                <View
                                    key={'textPage'}
                                    style={{
                                        maxWidth: 168,
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 1,
                                        padding: 10,
                                        paddingHorizontal: 10,
                                        backgroundColor: '#fff',
                                        flexDirection: 'row',
                                        margin: 0
                                    }}>

                                    <View style={{ display: 'flex', flexDirection: 'column', width: '80%' }}>
                                        <View style={styles.dateContainer}>
                                            <Text style={styles.date2}>
                                                {
                                                    (new Date(props.cue.date)).toString().split(' ')[1] +
                                                    ' ' +
                                                    (new Date(props.cue.date)).toString().split(' ')[2]
                                                }
                                            </Text>
                                        </View>
                                        <Text
                                            ellipsizeMode={'tail'}
                                            numberOfLines={1}
                                            style={{
                                                fontFamily: 'inter',
                                                fontSize: 12,
                                                lineHeight: 25,
                                                flex: 1, flexDirection: 'row',
                                                // marginTop: 5,
                                                color: cue._id === props.cue._id ? '#3289D0' : '#343A40'
                                            }}>
                                            {title}
                                        </Text>
                                    </View>

                                    {/* Add button here */}

                                    <TouchableOpacity
                                        onPress={() => {
                                            const temp = [...folderCuesToDisplay];
                                            temp.push(cue);
                                            setFolderCuesToDisplay(temp)

                                            // Remove from channel Cues
                                            const cCues = channelCues.filter((c: any) => c._id !== cue._id)
                                            setChannelCues(cCues)
                                        }}
                                        style={{
                                            justifyContent: 'center',
                                            alignSelf: 'flex-end',
                                            width: 20, height: 20, borderRadius: 10, backgroundColor: '#3289D0'
                                        }}
                                    >
                                        <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                                            <Ionicons name='add-outline' size={22} />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: col,
                                        flex: 1,
                                        // borderLeftWidth: 2,
                                        borderColor: cue._id === props.cue._id ? '#3289D0' : '#fff',
                                        opacity: 0.9,
                                        // width: '4%',
                                        height: '100%'
                                        // borderTopLeftRadius: 8,
                                        // borderBottomLeftRadius: 8,
                                    }}
                                ></View>
                            </View>)
                        })}
                    </ScrollView>
                    :
                    <View>
                        <Text style={{ fontSize: 14, color: '#343A40', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#3289D0', paddingVertical: 20 }}>
                            No Content to select.
                        </Text>
                    </View>
                }
            </View>

            {/* Section 2 */}

            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: '#E7EBEE', paddingVertical: 10 }}>
                <SortableListUpdate items={folderCuesToDisplay} onSortEnd={onSortEndUpdate} useDragHandle={true} axis={'x'} lockAxis={'x'}
                />
            </View>


        </View>
    }


    const windowHeight = Dimensions.get('window').height;

    const ContentView = <Animated.View style={{
        width: '100%',
        maxWidth: 1000,
        height: '100%',
        maxHeight: windowHeight,
        opacity: modalAnimation,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    }}
        key={JSON.stringify(threads)}
    >
        {!viewStatus ? <ScrollView
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
            horizontal={false}
            style={{
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
            }}
            contentContainerStyle={{
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
                maxHeight: windowHeight - 52
            }}
        >
            <UpdateControls
                // key={JSON.stringify(showOriginal) + JSON.stringify(viewStatus)}
                channelId={props.channelId}
                save={save}
                del={del}
                customCategories={props.customCategories}
                cue={props.cue}
                cueIndex={props.cueIndex}
                cueKey={props.cueKey}
                channelOwner={channelOwner}
                createdBy={createdBy}
                folderId={folderId}
                closeModal={() => props.closeModal()}
                reloadCueListAfterUpdate={() => props.reloadCueListAfterUpdate()}
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
                reloadStatuses={reloadStatuses}
            />
            {
                !Number.isNaN(Number(cueId))
                    || !props.channelId ? <View
                    style={{ flex: 1, backgroundColor: 'white' }}
                /> :
                    (
                        showComments ? <ScrollView
                            // key={Math.random()}
                            ref={scroll2}
                            contentContainerStyle={{
                                width: '100%',
                                maxWidth: 1000,
                                alignSelf: 'center',
                                height: '100%'
                            }}
                            contentOffset={{ x: 0, y: 1 }}
                            showsVerticalScrollIndicator={false}
                            overScrollMode={'always'}
                            alwaysBounceVertical={true}
                            scrollEnabled={true}
                            scrollEventThrottle={1}
                            keyboardDismissMode={'on-drag'}
                        >
                            <ThreadsList
                                channelCreatedBy={props.channelCreatedBy}
                                key={JSON.stringify(threads)}
                                threads={threads}
                                cueId={cueId}
                                channelId={props.channelId}
                                channelName={props.filterChoice}
                                closeModal={() => props.closeModal()}
                                reload={() => loadThreadsAndStatuses()}
                                updateQAUnreadCount={() => updateQAUnreadCount()}
                                type={"Q&A"}
                            />
                        </ScrollView> : null
                    )
            }
        </ScrollView>
            : <View style={{ paddingTop: 10 }}>
                {
                    channelOwner ?
                        <View
                            style={{
                                backgroundColor: 'white',
                                width: '100%',
                                height: windowHeight - 52,
                                // paddingHorizontal: 20,
                                borderTopRightRadius: 0,
                                borderTopLeftRadius: 0,
                                paddingTop: 10
                            }}>
                            <ScrollView
                                ref={scroll3}
                                contentContainerStyle={{
                                    width: '100%',
                                    height: windowHeight - 52
                                }}
                                showsVerticalScrollIndicator={false}
                                contentOffset={{ x: 0, y: 1 }}
                                key={channelOwner.toString()}
                                overScrollMode={'always'}
                                alwaysBounceVertical={true}
                                scrollEnabled={true}
                                scrollEventThrottle={1}
                                keyboardDismissMode={'on-drag'}
                            >
                                <SubscribersList
                                    key={JSON.stringify(subscribers)}
                                    subscribers={subscribers}
                                    cueId={cueId}
                                    channelName={props.filterChoice}
                                    channelId={props.channelId}
                                    closeModal={() => props.closeModal()}
                                    reload={() => loadThreadsAndStatuses()}
                                    cue={props.cue}
                                    updateCueWithReleaseSubmission={updateCueWithReleaseSubmission}
                                    reloadStatuses={reloadStatuses}
                                />
                            </ScrollView>
                        </View>
                        : null
                }
            </View>}

        {/* </Swiper> */}
    </Animated.View>


    /**
     * @description Renders all the Folder buttons (edit, add, delete, cancel, etc.) for the header
     */
    const renderFolderButtons = () => {

        return <React.Fragment>
            {/* Edit folder button */}
            {
                channelOwner && folderId !== "" && !editFolder ?
                    <TouchableOpacity
                        onPress={async () => {
                            setEditFolder(true)
                        }}
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                            // borderRadius: 15,
                            // backgroundColor: "white",
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 35,
                                // textAlign: "right",
                                // paddingRight: 20,
                                marginLeft: 20,
                                textTransform: "uppercase",
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                            }}
                        >
                            Edit Folder
                        </Text>
                    </TouchableOpacity>
                    : null
            }
            {/* Create new folder button */}
            {
                channelOwner && folderId === "" && !createNewFolder && !editFolder ?
                    <TouchableOpacity
                        onPress={() => {
                            setCreateNewFolder(true)

                            // Add the current one to the selected list

                            setSelectedCues([props.cue]);

                            const filter = props.channelCues.filter((cue: any) => cue._id !== props.cue._id)
                            setChannelCues(filter)
                        }}
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 35,
                                marginLeft: 20,
                                textTransform: "uppercase",
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                            }}
                        >
                            Add Folder
                        </Text>
                    </TouchableOpacity>
                    : null
            }
            {/* Add to existing folder button */}
            {channelFolders.length > 0 && channelOwner && folderId === "" && !createNewFolder && !editFolder ? <Menu
                onSelect={async (choice: any) => {
                    // setCalendarChoice(choice)

                    if (addingToFolder) {
                        return;
                    }
                    // Add to folder and if successful set folder id to the folder added to

                    const server = fetchAPI('')

                    setAddingToFolder(true)

                    server.mutate({
                        mutation: addToFolder,
                        variables: {
                            cueId: props.cue._id,
                            folderId: choice
                        }
                    }).then(async res => {

                        // Update cue locally with the new Unread count so that the Unread count reflects in real time
                        if (!res.data.folder.addToFolder) {
                            Alert("Could not add to list. Try again.")
                            setAddingToFolder(false)
                            return;
                        }

                        setAddingToFolder(false);
                        setFolderId(choice)

                    }).catch((e) => {
                        Alert("Could not add to list. Try again.")
                        setAddingToFolder(false)
                    })
                }}>
                <MenuTrigger>
                    <View
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                        }}
                    // style={{
                    //     backgroundColor: 'white',
                    //     overflow: 'hidden',
                    //     height: 35,
                    //     marginBottom: 20,
                    //     justifyContent: 'center',
                    //     flexDirection: 'row',
                    // }}
                    >
                        <Text style={{
                            lineHeight: 35,
                            marginLeft: 20,
                            textTransform: "uppercase",
                            fontSize: 12,
                            fontFamily: 'overpass',
                            color: '#fff',
                        }}>
                            Add to Folder
                        </Text>
                    </View>
                </MenuTrigger>
                <MenuOptions customStyles={{
                    optionsContainer: {
                        padding: 10,
                        borderRadius: 15,
                        shadowOpacity: 0,
                        borderWidth: 1,
                        borderColor: '#e9e9ec',
                        overflow: 'scroll',
                        maxHeight: '100%'
                    }
                }}>

                    {
                        channelFolders.map((folder: any) => {
                            return (<MenuOption
                                key={folder._id}
                                value={folder._id}>
                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                    <Text style={{ fontSize: 14, fontFamily: 'inter', color: '#343A40' }}>
                                        {folder.title && folder.title !== '' ? folder.title : 'Untitled'}
                                    </Text>
                                </View>
                            </MenuOption>)
                        })
                    }
                </MenuOptions>
            </Menu> : null}

            {/* New Folder selected */}

            {
                createNewFolder ? <React.Fragment>
                    <TouchableOpacity
                        onPress={async () => {

                            setCreatingFolder(true);

                            const server = fetchAPI('')

                            server.mutate({
                                mutation: creatFolder,
                                variables: {
                                    title: newFolderTitle,
                                    cueIds: selectedCues.map((cue: any) => cue._id)
                                }
                            }).then(async res => {

                                // Update cue locally with the new Unread count so that the Unread count reflects in real time

                                if (res.data.folder.create === null || res.data.folder.create === "") {
                                    Alert("Could not create folder. Try again.")
                                    setCreatingFolder(false)
                                    return;
                                }

                                setFolderId(res.data.folder.create);
                                setCreatingFolder(false);
                                setCreateNewFolder(false);

                                props.refreshCues()

                            }).catch((e) => {
                                Alert("Could not create folder. Try again.")
                                setCreatingFolder(false)
                            })


                        }}
                        disabled={selectedCues.length < 2 || creatingFolder}
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 35,
                                marginLeft: 20,
                                textTransform: "uppercase",
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                            }}
                        >
                            {creatingFolder
                                ? '...'
                                : 'Create'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={async () => {
                            setNewFolderTitle('')
                            setCreateNewFolder(false)
                            setSelectedCues([])
                        }}
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 35,
                                marginLeft: 20,
                                textTransform: "uppercase",
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                            }}
                        >
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </React.Fragment> : null
            }

            {/* Edit Folder selected */}

            {
                editFolder ? <React.Fragment>
                    <TouchableOpacity
                        onPress={async () => {

                            const server = fetchAPI('')

                            setUpdatingFolder(true)

                            const cueIds = folderCuesToDisplay.map((cue: any) => cue._id)

                            server.mutate({
                                mutation: updateFolder,
                                variables: {
                                    title: updateFolderTitle,
                                    cueIds,
                                    folderId
                                }
                            }).then(async res => {

                                // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                if (res.data.folder.update === null || res.data.folder.update === undefined) {
                                    Alert("Could not create folder. Try again.")
                                    setUpdatingFolder(false)
                                    return;
                                }

                                // Check if current cue was removed from the list then set folder id to ""
                                if (!cueIds.includes(props.cue._id)) {
                                    setFolderId('')
                                } else {
                                    await fetchFolderCues()
                                }

                                setUpdatingFolder(false);
                                setEditFolder(false);

                                props.refreshCues()

                            }).catch((e) => {
                                Alert("Could not create folder. Try again.")
                                setUpdatingFolder(false)
                            })


                        }}
                        disabled={folderCuesToDisplay.length < 2 || updatingFolder}
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 35,
                                marginLeft: 20,
                                textTransform: "uppercase",
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                            }}
                        >
                            {creatingFolder
                                ? '...'
                                : 'Update '}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={async () => {
                            const server = fetchAPI('')

                            setDeletingFolder(true)

                            server.mutate({
                                mutation: deleteFolder,
                                variables: {
                                    folderId
                                }
                            }).then(async res => {

                                // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                if (!res.data.folder.delete) {
                                    Alert("Could not delete list. Try again.")
                                    setDeletingFolder(false)
                                    return;
                                }

                                setDeletingFolder(false);
                                setFolderId("")

                                props.refreshCues()

                            }).catch((e) => {
                                Alert("Could not create folder. Try again.")
                                setDeletingFolder(false)
                            })
                        }}
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 35,
                                marginLeft: 20,
                                textTransform: "uppercase",
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                            }}
                        >
                            {deletingFolder
                                ? '...'
                                : 'Delete'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={async () => {
                            setEditFolder(false)

                            // Set cues to display to original
                            const cuesInOrder = folder.cueIds.map((id: any) => {
                                return folderCues.find((cue: any) => cue._id === id)
                            })

                            setFolderCuesToDisplay(cuesInOrder)

                        }}
                        style={{
                            backgroundColor: '#16181C',
                            paddingLeft: 0
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 35,
                                marginLeft: 20,
                                textTransform: "uppercase",
                                fontSize: 12,
                                fontFamily: 'overpass',
                                color: '#fff',
                            }}
                        >
                            {deletingFolder
                                ? '...'
                                : 'Cancel'}
                        </Text>
                    </TouchableOpacity>
                </React.Fragment> : null
            }


        </React.Fragment>
    }

    /**
    *  @description This function will render the Bar with Back button, Folder options, Option Tabs, And Save, Delete buttons  
    *             
    * */
    const renderHeader = () => {

        return <View style={{ width: '100%', backgroundColor: '#16181C', flexDirection: 'column' }}>
            {/* The first bar will be the main black bar with the back button, Cue Tabs and buttons */}
            <View style={{
                flexDirection: 'row',
                width: '100%', justifyContent: 'center',
                height: 52, backgroundColor: '#16181C',
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0,
            }}>
                <View style={{ flexDirection: 'row', flex: 1, maxWidth: 1000, backgroundColor: '#16181C', }}>

                    {/* BACK BUTTON */}
                    <TouchableOpacity
                        style={{
                            // justifyContent: 'center',
                            flexDirection: 'row',
                            paddingTop: 6,
                            backgroundColor: '#16181C'
                        }}
                        onPress={() => {
                            props.closeModal()
                        }}>
                        <Text>
                            <Ionicons name='arrow-back-outline' size={30} color={'#fff'} />
                        </Text>
                    </TouchableOpacity>

                    {/* CUE TABS IF THE DIMENSIONS IS BIGGER THAN 1024 */}
                    {Dimensions.get('window').width > 1024 && !createNewFolder && !editFolder ? options : null}

                    {/* Render Folder Title input if Create / Edit */}

                    {
                        createNewFolder ? <TextareaAutosize
                            value={newFolderTitle}
                            style={{
                                width: 210,
                                marginRight: 20,
                                maxWidth: '100%',
                                borderBottom: '1px solid #E7EBEE',
                                fontSize: 14,
                                paddingTop: 8,
                                paddingBottom: 8,
                                borderRadius: 1,
                                marginTop: 8,
                                marginBottom: 5,
                                // height: 35,
                                marginLeft: 15
                            }}
                            // style={styles.input}
                            rows={1}
                            placeholder={"Folder Title"}
                            onChange={(e: any) => setNewFolderTitle(e.target.value)}
                        /> : null
                    }

                    {
                        editFolder ?
                            <TextareaAutosize
                                value={updateFolderTitle}
                                style={{
                                    width: 210,
                                    marginRight: 20,
                                    maxWidth: '100%',
                                    borderBottom: '1px solid #E7EBEE',
                                    fontSize: 14,
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                    borderRadius: 1,
                                    marginTop: 8,
                                    marginBottom: 5,
                                    // height: 35,
                                    marginLeft: 15
                                }}
                                // style={styles.input}
                                rows={1}
                                placeholder={"Folder Title"}
                                onChange={(e: any) => setUpdateFolderTitle(e.target.value)}
                            /> : null
                    }

                    {/* BUTTONS */}
                    {
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: "#16181C",
                                justifyContent: "flex-end",
                                // display: "flex",
                                flexDirection: "row",
                                // height: 50,
                                paddingTop: 8,
                            }}
                        >
                            {
                                (channelOwner || showOptions || !props.channelId) && (!editFolder && !createNewFolder) ?
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setSave(true)
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            backgroundColor: '#16181C',
                                            marginLeft: 20,
                                            // borderRadius: 15,
                                            // backgroundColor: "white",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 35,
                                                backgroundColor: '#16181C',
                                                // textAlign: "right",
                                                // paddingRight: 20,
                                                textTransform: "uppercase",
                                                fontSize: 12,
                                                fontFamily: 'overpass',
                                                color: '#fff',
                                            }}
                                        >
                                            SAVE
                                        </Text>
                                    </TouchableOpacity> : null
                            }
                            {
                                (channelOwner || !props.channelId) && (!editFolder && !createNewFolder) ?
                                    <TouchableOpacity
                                        onPress={async () => {
                                            setDel(true)
                                        }}
                                        style={{
                                            paddingLeft: 0,
                                            marginLeft: 20,
                                            backgroundColor: '#16181C',
                                            // borderRadius: 15,
                                            // backgroundColor: "white",
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 35,
                                                backgroundColor: '#16181C',
                                                // textAlign: "right",
                                                // paddingRight: 20,
                                                textTransform: "uppercase",
                                                fontSize: 12,
                                                fontFamily: 'overpass',
                                                color: '#fff',
                                            }}
                                        >
                                            DELETE
                                        </Text>
                                    </TouchableOpacity> : null
                            }
                            {renderFolderButtons()}
                        </View>
                    }
                </View>
            </View>

            <View style={{
                backgroundColor: '#E7EBEE',
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0
            }}>
                {folderId !== "" && folderCuesToDisplay.length !== 0 && !editFolder && !createNewFolder ? renderExistingFolder() : null}
            </View>

            <View style={{
                backgroundColor: '#E7EBEE',
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0
            }}>
                {createNewFolder ? renderNewFolderOptions() : null}
            </View>

            <View style={{
                backgroundColor: '#E7EBEE',
                paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0
            }}>
                {editFolder ? renderEditFolderOptions() : null}
            </View>

        </View>

    }

    return (
        <View style={{
            width: '100%',
            height: windowHeight,
            backgroundColor: '#fff',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
        }}>
            {
                loading
                    ? <View style={{
                        width: '100%',
                        flex: 1,
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                    }}>
                        <ActivityIndicator color={'#343A40'} />
                    </View>
                    :
                    <View style={{ width: '100%', position: 'relative', height: windowHeight }}>
                        {/* Header */}
                        {renderHeader()}
                        {/* Main Content */}
                        <View style={{
                            paddingHorizontal: Dimensions.get('window').width < 1024 ? 20 : 0,
                            width: '100%', backgroundColor: 'white', flexDirection: 'row', justifyContent: 'center', flex: 1
                        }}>
                            {ContentView}
                        </View>
                        {/* Mobile tabs */}
                        {Dimensions.get('window').width < 1024 ?
                            <View style={{
                                position: 'absolute',
                                zIndex: 1000,
                                backgroundColor: '#16181C',
                                // borderColor: '#E7EBEE',
                                // borderTopWidth: 2,
                                bottom: 0,
                                //alignSelf: 'flex-end',
                                width: '100%',
                                paddingTop: 5,
                                paddingBottom: 10,
                                paddingHorizontal: 20,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                height: 54
                            }}>
                                {options}
                            </View> : null
                        }
                    </View>
            }
        </View >
    );
}

export default Update

const styles: any = StyleSheet.create({
    all: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#fff',
        height: 25,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        backgroundColor: '#16181C',
        lineHeight: 25,
        fontFamily: 'overpass',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    allGrayFill: {
        fontSize: Dimensions.get('window').width < 1024 ? 12 : 14,
        color: '#fff',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        borderRadius: 12,
        backgroundColor: '#3289D0',
        lineHeight: 25,
        height: 25,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    badge: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginRight: -2,
        marginTop: 0,
        borderRadius: 15,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 50
    },
    swiper: {
        borderRadius: 1,
        overflow: 'hidden',
        maxWidth: 150,
        maxHeight: 100,
        width: '100%',
        marginBottom: 10
    },
    card: {
        maxWidth: 150,
        width: '100%',
        height: '100%',
        borderRadius: 1,
        padding: 15,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e9e9ec',
        flexDirection: 'row'
    },
    footer: {
        width: "100%",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: 'center',
        marginTop: 30,
        lineHeight: 18,
    },
    dateContainer: {
        fontSize: 10,
        color: '#fff',
        height: '25%',
        // backgroundColor: '#E7EBEE',
        display: 'flex',
        flexDirection: 'row'
    },
    date2: {
        fontSize: 9,
        color: '#343A40',
        // marginLeft: 10,
        lineHeight: 10,
        textAlign: 'left',
        flex: 1
    },
})