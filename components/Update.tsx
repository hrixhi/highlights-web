import React, { useCallback, useEffect, useRef, useState, Fragment } from 'react';
import { Animated, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import Alert from '../components/Alert'
import { View, TouchableOpacity, Text } from '../components/Themed';
import Swiper from 'react-native-web-swiper'
import UpdateControls from './UpdateControls';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getCueThreads, getStatuses, getUnreadQACount, creatFolder, getFolder, getFolderCues, getChannelFolders, updateFolder, addToFolder, deleteFolder, removeFromFolder } from '../graphql/QueriesAndMutations';
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


    const DragHandle = SortableHandle(() => (<Text style={{ marginRight: 10 }}> <Ionicons name='menu-outline' size={22} color='#50566B' /> </Text>))

    const SortableItem = SortableElement(({ value, sortIndex }: any) => {

        const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue)

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

        const col = colorChoices[value.color]


        return (<View
            style={styles.swiper}
        >
            <View
                key={'textPage'}
                style={{
                    maxWidth: 300,
                    width: '100%',
                    height: '100%',
                    borderRadius: 10,
                    padding: 15,
                    paddingHorizontal: 20,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: value._id === props.cue._id ? '#1A2036' : '#e9e9ec',
                    flexDirection: 'row'
                }}>

                <DragHandle />

                <View style={{ flexDirection: 'column', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name={getContentIcon(value.channelId && value.channelId !== '' ? value.original : value.cue)} size={18} />
                </View>

                <Text
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                    style={{
                        fontFamily: 'inter',
                        fontSize: 14,
                        lineHeight: 20,
                        flex: 1,
                        marginTop: 4,
                        color: col
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
                        alignSelf: 'flex-end',
                        width: 20, height: 20, borderRadius: 10, backgroundColor: '#f94144'
                    }}
                >
                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                        <Ionicons name='remove-circle-outline' size={22} />
                    </Text>
                </TouchableOpacity> : null}


            </View>
        </View>)
    })


    const SortableItemUpdate = SortableElement(({ value, sortIndex }: any) => {
        const { title } = htmlStringParser(value.channelId && value.channelId !== '' ? value.original : value.cue)

        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

        const col = colorChoices[value.color]


        return (<View
            style={styles.swiper}
        >
            <View
                key={'textPage'}
                style={{
                    maxWidth: 300,
                    width: '100%',
                    height: '100%',
                    borderRadius: 1,
                    padding: 15,
                    paddingHorizontal: 20,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: value._id === props.cue._id ? '#1A2036' : '#e9e9ec',
                    flexDirection: 'row'
                }}>

                <DragHandle />

                <View style={{ flexDirection: 'column', justifyContent: 'center', marginRight: 10 }}>
                    <Ionicons name={getContentIcon(value.channelId && value.channelId !== '' ? value.original : value.cue)} size={18} />
                </View>

                <Text
                    ellipsizeMode={'tail'}
                    numberOfLines={1}
                    style={{
                        fontFamily: 'inter',
                        fontSize: 14,
                        lineHeight: 20,
                        flex: 1,
                        marginTop: 4,
                        color: col
                    }}>
                    {title}
                </Text>

                {/* Add button here */}

                {value._id !== props.cue._id ? <TouchableOpacity
                    onPress={() => {

                        const temp = [...channelCues];
                        temp.push(value);
                        setChannelCues(temp);

                        const sCues = folderCuesToDisplay.filter((c: any) => c._id !== value._id)
                        setFolderCuesToDisplay(sCues);

                    }}
                    style={{
                        justifyContent: 'center',
                        alignSelf: 'flex-end',
                        width: 20, height: 20, borderRadius: 10, backgroundColor: '#f94144'
                    }}
                >
                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                        <Ionicons name='remove-circle-outline' size={22} />
                    </Text>
                </TouchableOpacity> : null}


            </View>
        </View>)
    })


    const SortableList = SortableContainer(({ items }: any) => {
        return (
            <ul style={{ padding: 0, margin: 0, marginTop: 20 }}>
                {items.map((value: any, index: number) => (
                    <SortableItem
                        key={`item-${index}`}
                        index={index}
                        sortIndex={index}
                        value={value}
                    />
                ))}
            </ul>
        );
    });

    const SortableListUpdate = SortableContainer(({ items }: any) => {
        return (
            <ul style={{ padding: 0, margin: 0, marginTop: 20 }}>
                {items.map((value: any, index: number) => (
                    <SortableItemUpdate
                        key={`item-${index}`}
                        index={index}
                        sortIndex={index}
                        value={value}
                    />
                ))}
            </ul>
        );
    });


    const onSortEnd = ({ oldIndex, newIndex }: any) => {
        setSelectedCues(arrayMove(selectedCues, oldIndex, newIndex))
    };

    const onSortEndUpdate = ({ oldIndex, newIndex }: any) => {
        setFolderCuesToDisplay(arrayMove(folderCuesToDisplay, oldIndex, newIndex))
    };

    const renderCreateNewFolderOptions = () => {

        return (<View>
            <View
                style={{
                    // display: "flex",
                    // flexDirection: "row",
                    backgroundColor: "white",
                }}
            >
                <TextareaAutosize
                    value={newFolderTitle}
                    style={{
                        width: 300,
                        maxWidth: '100%',
                        borderBottom: '1px solid #E3E8EE',
                        fontSize: 14,
                        paddingTop: 13,
                        paddingBottom: 13,
                        borderRadius: 0,
                        marginTop: 0,
                        marginBottom: 15
                    }}
                    // style={styles.input}
                    minRows={1}
                    placeholder={"E.g. Exam 1 material"}
                    onChange={(e: any) => setNewFolderTitle(e.target.value)}
                />

                {/* Channel Cues  */}
                {channelCues.length !== 0 ?
                    <ScrollView
                        style={{
                            width: "100%",
                            height: 350,
                            backgroundColor: "white",
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            overflow: "scroll",
                            marginTop: 20
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {channelCues.map((cue: any) => {
                            const { title } = htmlStringParser(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)

                            const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

                            const col = colorChoices[cue.color]

                            return (<View
                                style={styles.swiper}
                            >
                                <View
                                    key={'textPage'}
                                    style={{
                                        maxWidth: 300,
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 10,
                                        padding: 15,
                                        paddingHorizontal: 20,
                                        backgroundColor: '#fff',
                                        borderWidth: 1,
                                        borderColor: cue._id === props.cue._id ? '#1A2036' : '#e9e9ec',
                                        flexDirection: 'row'
                                    }}>

                                    <View style={{ flexDirection: 'column', justifyContent: 'center', marginRight: 10 }}>
                                        <Ionicons name={getContentIcon(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)} size={18} />
                                    </View>

                                    <Text
                                        ellipsizeMode={'tail'}
                                        numberOfLines={1}
                                        style={{
                                            fontFamily: 'inter',
                                            fontSize: 14,
                                            lineHeight: 20,
                                            flex: 1,
                                            marginTop: 4,
                                            color: col
                                        }}>
                                        {title}
                                    </Text>

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
                                            alignSelf: 'flex-end',
                                            width: 20, height: 20, borderRadius: 10, backgroundColor: '#5469D4'
                                        }}
                                    >
                                        <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                                            <Ionicons name='add-outline' size={22} />
                                        </Text>
                                    </TouchableOpacity>


                                </View>
                            </View>)
                        })}
                    </ScrollView>
                    :
                    <View>
                        <Text style={{ fontSize: 14, color: '#50566B', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff', paddingVertical: 20 }}>
                            No Content to select.
                        </Text>
                    </View>}

                <View
                    style={{
                        // display: "flex",
                        // flexDirection: "row",
                        backgroundColor: "white",
                        marginVertical: 30
                    }}
                >
                    {
                        selectedCues.length > 0 ? <SortableList items={selectedCues} onSortEnd={onSortEnd} useDragHandle /> : <View >
                            <Text style={{ fontSize: 14, color: '#50566B', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff', }}>
                                No Selection
                            </Text>
                        </View>
                    }
                </View>

            </View>

            <View style={styles.footer}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                        justifyContent: "center",
                        display: "flex",
                        flexDirection: "row",
                        height: 50,
                        paddingTop: 10,
                    }}
                >
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
                            borderRadius: 15,
                            backgroundColor: "white",
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "center",
                                lineHeight: 35,
                                color: "white",
                                fontSize: 12,
                                backgroundColor: "#5469D4",
                                borderRadius: 15,
                                paddingHorizontal: 20,
                                fontFamily: "inter",
                                overflow: "hidden",
                                height: 35,
                                textTransform: "uppercase",
                            }}
                        >
                            {creatingFolder
                                ? 'Adding...'
                                : 'Add'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                        justifyContent: "center",
                        display: "flex",
                        flexDirection: "row",
                        height: 50,
                        paddingTop: 10,
                    }}
                >
                    <TouchableOpacity
                        onPress={async () => {
                            setNewFolderTitle('')
                            setCreateNewFolder(false)
                            setSelectedCues([])
                        }}
                        style={{
                            borderRadius: 15,
                            backgroundColor: "white",
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#5469D4',
                                borderWidth: 1,
                                borderColor: '#5469D4',
                                fontSize: 12,
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}
                        >
                            {/* {isSubmitting
                                ? 'Creating...'
                                : 'Create'} */}
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>

            </View>



        </View>)
    }

    const renderFolderCues = () => {

        if (folderCuesToDisplay.length === 0) {
            return <View >
                <Text style={{ fontSize: 14, color: '#50566B', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff', }}>
                    Fetching cues...
                </Text>
            </View>
        }

        return channelOwner && editFolder ? <View style={{ width: '100%' }}>

            <View>
                <TouchableOpacity onPress={async () => {
                    setEditFolder(false)

                    // Set cues to display to original
                    const cuesInOrder = folder.cueIds.map((id: any) => {
                        return folderCues.find((cue: any) => cue._id === id)
                    })

                    setFolderCuesToDisplay(cuesInOrder)

                }}>
                    <Ionicons name='arrow-back-outline' size={22} color={'#50566B'} />
                </TouchableOpacity>
            </View>

            <TextareaAutosize
                value={updateFolderTitle}
                style={{
                    width: 300,
                    maxWidth: '100%',
                    borderBottom: '1px solid #E3E8EE',
                    fontSize: 14,
                    paddingTop: 13,
                    paddingBottom: 13,
                    borderRadius: 0,
                    marginTop: 0,
                    marginBottom: 15
                }}
                // style={styles.input}
                minRows={1}
                placeholder={PreferredLanguageText("title")}
                onChange={(e: any) => setUpdateFolderTitle(e.target.value)}
            />

            {channelCues.length !== 0 ?
                <ScrollView
                    style={{
                        width: "100%",
                        height: 350,
                        backgroundColor: "white",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        overflow: "scroll",
                        marginTop: 20
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {channelCues.map((cue: any) => {
                        const { title } = htmlStringParser(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)

                        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

                        const col = colorChoices[cue.color]

                        return (<View
                            style={styles.swiper}
                        >
                            <View
                                key={'textPage'}
                                style={{
                                    maxWidth: 300,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 10,
                                    padding: 15,
                                    paddingHorizontal: 20,
                                    backgroundColor: '#fff',
                                    borderWidth: 1,
                                    borderColor: cue._id === props.cue._id ? '#1A2036' : '#e9e9ec',
                                    flexDirection: 'row'
                                }}>

                                <View style={{ flexDirection: 'column', justifyContent: 'center', marginRight: 10 }}>
                                    <Ionicons name={getContentIcon(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)} size={18} />
                                </View>

                                <Text
                                    ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={{
                                        fontFamily: 'inter',
                                        fontSize: 14,
                                        lineHeight: 20,
                                        flex: 1,
                                        marginTop: 4,
                                        color: col
                                    }}>
                                    {title}
                                </Text>

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
                                        width: 20, height: 20, borderRadius: 10, backgroundColor: '#5469D4'
                                    }}
                                >
                                    <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                                        <Ionicons name='add-outline' size={22} />
                                    </Text>
                                </TouchableOpacity>


                            </View>
                        </View>)
                    })}
                </ScrollView>
                :
                <View>
                    <Text style={{ fontSize: 14, color: '#50566B', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff', paddingVertical: 20 }}>
                        No Content to select.
                    </Text>
                </View>}

            <SortableListUpdate items={folderCuesToDisplay} onSortEnd={onSortEndUpdate} useDragHandle />

            <View style={styles.footer}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                        justifyContent: "center",
                        display: "flex",
                        flexDirection: "row",
                        height: 50,
                        paddingTop: 10,
                    }}
                >
                    <TouchableOpacity
                        onPress={async () => {

                            const server = fetchAPI('')

                            setUpdatingFolder(true)

                            server.mutate({
                                mutation: updateFolder,
                                variables: {
                                    title: updateFolderTitle,
                                    cueIds: folderCuesToDisplay.map((cue: any) => cue._id),
                                    folderId
                                }
                            }).then(async res => {

                                // Update cue locally with the new Unread count so that the Unread count reflects in real time
                                if (res.data.folder.update === null || res.data.folder.update === undefined) {
                                    Alert("Could not create folder. Try again.")
                                    setUpdatingFolder(false)
                                    return;
                                }

                                setUpdatingFolder(false);
                                setEditFolder(false);

                                await fetchFolderCues()

                                props.refreshCues()

                            }).catch((e) => {
                                Alert("Could not create folder. Try again.")
                                setUpdatingFolder(false)
                            })

                        }}
                        disabled={folderCuesToDisplay.length < 2 || updatingFolder}
                        style={{
                            borderRadius: 15,
                            backgroundColor: "white",
                        }}
                    >
                        <Text
                            style={{
                                textAlign: "center",
                                lineHeight: 35,
                                color: "white",
                                fontSize: 12,
                                backgroundColor: "#5469D4",
                                borderRadius: 15,
                                paddingHorizontal: 20,
                                fontFamily: "inter",
                                overflow: "hidden",
                                height: 35,
                                textTransform: "uppercase",
                            }}
                        >
                            {creatingFolder
                                ? 'Saving...'
                                : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>



            </View>



        </View> :
            <View style={{ width: '100%', marginTop: 10 }}>
                <Text style={{ fontSize: 14, color: '#1A2036', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff', }}>
                    {folder.title}
                </Text>
                <ScrollView
                    style={{
                        width: "100%",
                        // height: 350,
                        backgroundColor: "white",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        overflow: "scroll",
                        marginTop: 20
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {folderCuesToDisplay.map((cue: any) => {

                        if (!cue || !cue.channelId) return;

                        const { title } = htmlStringParser(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)

                        const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#3abb83'].reverse()

                        const col = colorChoices[cue.color]

                        return (<View
                            style={styles.swiper}
                        >
                            <TouchableOpacity
                                onPress={() => props.openCue(cue._id)}
                                key={'textPage'}
                                style={{
                                    maxWidth: 300,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 10,
                                    padding: 15,
                                    paddingHorizontal: 20,
                                    backgroundColor: '#fff',
                                    borderWidth: 1,
                                    borderColor: cue._id === props.cue._id ? '#1A2036' : '#e9e9ec',
                                    flexDirection: 'row'
                                }}>

                                <View style={{ flexDirection: 'column', justifyContent: 'center', marginRight: 10 }}>
                                    <Ionicons name={getContentIcon(cue.channelId && cue.channelId !== '' ? cue.original : cue.cue)} size={18} />
                                </View>

                                <Text
                                    ellipsizeMode={'tail'}
                                    numberOfLines={1}
                                    style={{
                                        fontFamily: 'inter',
                                        fontSize: 14,
                                        lineHeight: 20,
                                        flex: 1,
                                        marginTop: 4,
                                        color: col
                                    }}>
                                    {title}
                                </Text>



                            </TouchableOpacity>
                        </View>)
                    })}
                </ScrollView>

                {channelOwner ? <View style={styles.footer}>
                    <View
                        style={{
                            flex: 1,
                            backgroundColor: "white",
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "row",
                            height: 50,
                            paddingTop: 10,
                        }}
                    >
                        <TouchableOpacity
                            onPress={async () => {
                                setEditFolder(true)
                            }}
                            style={{
                                borderRadius: 15,
                                backgroundColor: "white",
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    color: "white",
                                    fontSize: 12,
                                    backgroundColor: "#5469D4",
                                    borderRadius: 15,
                                    paddingHorizontal: 20,
                                    fontFamily: "inter",
                                    overflow: "hidden",
                                    height: 35,
                                    textTransform: "uppercase",
                                }}
                            >

                                Edit
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        style={{
                            flex: 1,
                            backgroundColor: "white",
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "row",
                            height: 50,
                            paddingTop: 10,
                        }}
                    >
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
                                borderRadius: 15,
                                backgroundColor: "white",
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    backgroundColor: "white",
                                    color: '#5469D4',
                                    fontSize: 12,
                                    borderWidth: 1,
                                    borderColor: "#5469D4",
                                    borderRadius: 15,
                                    paddingHorizontal: 20,
                                    fontFamily: "inter",
                                    overflow: "hidden",
                                    height: 35,
                                    textTransform: "uppercase",
                                }}
                            >
                                {deletingFolder
                                    ? 'Deleting...'
                                    : 'Delete'}

                            </Text>
                        </TouchableOpacity>
                    </View>

                </View> : null}
            </View>

    }



    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height : Dimensions.get('window').height;


    const FolderView = <ScrollView
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        horizontal={false}
        contentContainerStyle={{
            maxHeight: Dimensions.get('window').height
        }}
    >
        <Text style={{ width: '100%', textAlign: 'center', height: 0, paddingBottom: 30, backgroundColor: 'white' }}>
            {/* <Ionicons name='chevron-down' size={15} color={'#e0e0e0'} /> */}
        </Text>
        {!createNewFolder && folderId === "" ? <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <TouchableOpacity
                onPress={() => {
                    setCreateNewFolder(true)

                    // Add the current one to the selected list

                    setSelectedCues([props.cue]);

                    const filter = props.channelCues.filter((cue: any) => cue._id !== props.cue._id)
                    setChannelCues(filter)
                }}
                style={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    height: 35,
                    // marginTop: 15,
                    marginBottom: 15,
                    justifyContent: 'center',
                    flexDirection: 'row',
                }}>
                <Text style={{
                    textAlign: 'center',
                    lineHeight: 35,
                    color: '#fff',
                    // borderWidth: 1,
                    backgroundColor: '#5469D4',
                    fontSize: 12,
                    paddingHorizontal: 20,
                    fontFamily: 'inter',
                    height: 35,
                    borderRadius: 15,
                    width: 150,
                    textTransform: 'uppercase'
                }}>
                    Add Files
                </Text>
            </TouchableOpacity>
        </View> : null}
        {channelFolders.length > 0 ? <Menu
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
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginBottom: 20,
                        justifyContent: 'center',
                        flexDirection: 'row',
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: '#5469D4',
                        borderWidth: 1,
                        borderColor: '#5469D4',
                        fontSize: 12,
                        paddingHorizontal: 20,
                        fontFamily: 'inter',
                        width: 150,
                        height: 35,
                        borderRadius: 15,
                        textTransform: 'uppercase'
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
                                <Text style={{ marginLeft: 5 }}>
                                    {folder.title}
                                </Text>
                            </View>
                        </MenuOption>)
                    })
                }
            </MenuOptions>
        </Menu> : null}

        {createNewFolder ? renderCreateNewFolderOptions() : null}

        {folderId !== "" ? renderFolderCues() : null}

    </ScrollView>

    const ContentView = <Animated.View style={{
        width: '100%',
        height: windowHeight,
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
                minHeight: windowHeight
            }}
        >
            <UpdateControls
                // key={JSON.stringify(showOriginal) + JSON.stringify(viewStatus)}
                channelId={props.channelId}
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
            : <View style={{ paddingTop: 30 }}>
                <View style={{ width: '100%', flexDirection: 'row' }}>
                    {
                        showFolder ? null :
                            <View style={{}}>
                                <TouchableOpacity
                                    style={{
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        marginRight: 20,
                                        paddingTop: 2
                                    }}
                                    onPress={() => {
                                        props.closeModal()
                                    }}>
                                    <Text>
                                        <Ionicons name='arrow-back-outline' size={25} color={'#50566B'} />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                    }
                    {/* <View style={{}}>
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                marginRight: 20
                            }}
                            onPress={() => {
                                setShowFolder(!showFolder)
                            }}>
                            <Text>
                                <Ionicons name={showFolder ? 'close-outline' : 'document-attach-outline'} size={25} color={'#5469D4'} />
                            </Text>
                        </TouchableOpacity> 
                    </View>
                    */}
                    <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}
                            onPress={() => {
                                setShowOptions(false)
                                setViewStatus(false)
                                setShowOriginal(true)
                                setShowComments(false)
                            }}>
                            <Text style={showOriginal ? styles.allGrayFill : styles.all}>
                                <Ionicons name='newspaper-outline' size={15} />
                            </Text>
                            <Text style={showOriginal ? styles.allGrayFill : styles.all}>
                                Content
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                            onPress={() => {
                                setShowOptions(true)
                                setViewStatus(false)
                                setShowOriginal(false)
                                setShowComments(false)
                            }}>

                            <Text style={styles.all}>
                                <Ionicons name='options-outline' size={15} />
                            </Text>
                            <Text style={styles.all}>
                                Settings
                            </Text>
                        </TouchableOpacity>
                        {/* <TouchableOpacity
                            style={{
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                            onPress={() => {
                                setShowOptions(false)
                                setViewStatus(false)
                                setShowOriginal(false)
                                setShowComments(true)
                            }}>
                            <Text style={styles.all}>
                                <Ionicons name='chatbubbles-outline' size={15} />
                                {/* {props.cue.unreadThreads > 0 ? <View style={styles.badge} /> : null} 
                            </Text>
                            <Text style={styles.all}>
                                Q&A
                            </Text>
                        </TouchableOpacity> */}
                        {
                            !submission || (channelOwner && submission) || isQuiz ? null :
                                <TouchableOpacity
                                    style={{
                                        justifyContent: 'center',
                                        flexDirection: 'column'
                                    }}
                                    onPress={() => {
                                        setViewStatus(false)
                                        setShowOriginal(false)
                                        setShowComments(false)
                                        setShowOptions(false)
                                    }}>
                                    <Text style={!showOriginal && !viewStatus && !showOptions && !showComments ? styles.allGrayFill : styles.all}>
                                        <Ionicons name='document-attach-outline' size={15} />
                                    </Text>
                                    <Text style={!showOriginal && !viewStatus && !showOptions && !showComments ? styles.allGrayFill : styles.all}>
                                        Submission
                                    </Text>
                                </TouchableOpacity>
                        }
                        {/* Add Status button here */}
                        {
                            !channelOwner ? null :
                                <TouchableOpacity
                                    style={{
                                        justifyContent: 'center',
                                        flexDirection: 'column'
                                    }}
                                    onPress={() => {
                                        setViewStatus(true)
                                        setShowOriginal(false)
                                        setShowComments(false)
                                        setShowOptions(false)
                                    }}>
                                    <Text style={viewStatus ? styles.allGrayFill : styles.all}>
                                        <Ionicons name='stats-chart-outline' size={15} />
                                    </Text>
                                    <Text style={viewStatus ? styles.allGrayFill : styles.all}>
                                        Engagement
                                    </Text>
                                </TouchableOpacity>
                        }
                    </View>
                </View>
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
                        <ActivityIndicator color={'#50566B'} />
                    </View>
                    :
                    <View style={{ width: '100%', flexDirection: 'row' }}>
                        {showFolder ? <View style={{ width: 200, backgroundColor: 'white' }}>
                            {loadingFolder || loadingFolderCues ? <View style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: 'white',
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                            }}>
                                <ActivityIndicator color={'#50566B'} />
                            </View> : FolderView}
                        </View> : null}
                        <View style={{ paddingLeft: showFolder ? 20 : 0, width: showFolder ? '80%' : '100%', backgroundColor: 'white' }}>
                            {ContentView}
                        </View>

                    </View>
            }
        </View >
    );
}

export default Update

const styles: any = StyleSheet.create({
    all: {
        fontSize: 10,
        color: '#50566B',
        height: 20,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        // textTransform: 'uppercase',
        lineHeight: 20,
        textAlign: 'center',
        // fontFamily: 'inter'
    },
    allGrayFill: {
        fontSize: 10,
        color: '#5469D4',
        height: 20,
        paddingHorizontal: 5,
        textAlign: 'center',
        backgroundColor: '#fff',
        // textTransform: 'uppercase',
        lineHeight: 20,
        // fontFamily: 'inter'
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
        maxWidth: 300,
        width: '100%',
        marginBottom: 10
    },
    card: {
        maxWidth: 300,
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
})