import React, { useCallback, useEffect, useRef, useState, Fragment } from 'react';
import { Animated, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import Alert from '../components/Alert'
import { View, TouchableOpacity, Text } from '../components/Themed';
import Swiper from 'react-native-web-swiper'
import UpdateControls from './UpdateControls';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getCueThreads, getStatuses, getUnreadQACount } from '../graphql/QueriesAndMutations';
import ThreadsList from './ThreadsList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscribersList from './SubscribersList';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

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
    const [showOriginal, setShowOriginal] = useState(props.cue.channelId && props.cue.channelId !== '' ? true : false)
    const [isQuiz, setIsQuiz] = useState(false)
    const [showOptions, setShowOptions] = useState(false)
    const [showComments, setShowComments] = useState(false)

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

    useEffect(() => {
        loadThreadsAndStatuses()
    }, [props.cueId, props.channelId])

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;

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
                        <ActivityIndicator color={'#818385'} />
                    </View>
                    :
                    <Animated.View style={{
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
                                closeModal={() => {
                                    Animated.timing(modalAnimation, {
                                        toValue: 0,
                                        duration: 150,
                                        useNativeDriver: true
                                    }).start(() => props.closeModal())
                                }}
                                reloadCueListAfterUpdate={() => props.reloadCueListAfterUpdate()}
                                changeViewStatus={() => setViewStatus(true)}
                                viewStatus={viewStatus}
                                showOptions={showOptions}
                                showOriginal={showOriginal}
                                setShowOptions={(op: boolean) => setShowOptions(op)}
                                setShowOriginal={(val: boolean) => setShowOriginal(val)}
                                showComments={showComments}
                                setShowComments={(s: any) => setShowComments(s)}
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
                                            />
                                        </ScrollView> : null
                                    )
                            }
                        </ScrollView>
                            : <Fragment>
                                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30, backgroundColor: 'white' }}>
                                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                                </Text>
                                <View style={{ flexDirection: 'row' }}>
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
                                            {PreferredLanguageText('viewShared')}
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
                                            Settings
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
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
                                            Q&A
                                            {props.cue.unreadThreads > 0 ? <View style={styles.badge} /> : null}
                                        </Text>
                                    </TouchableOpacity>
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
                                                    {PreferredLanguageText('mySubmission')}
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
                                                    Responses
                                                </Text>
                                            </TouchableOpacity>
                                    }
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
                                                    closeModal={() => {
                                                        Animated.timing(modalAnimation, {
                                                            toValue: 0,
                                                            duration: 150,
                                                            useNativeDriver: true
                                                        }).start(() => props.closeModal())
                                                    }}
                                                    reload={() => loadThreadsAndStatuses()}
                                                    cue={props.cue}
                                                    updateCueWithReleaseSubmission={updateCueWithReleaseSubmission}
                                                />
                                            </ScrollView>
                                        </View>
                                        : null
                                }
                            </Fragment>}

                        {/* </Swiper> */}
                    </Animated.View>
            }
        </View >
    );
}

export default Update

const styles: any = StyleSheet.create({
    all: {
        fontSize: 13,
        color: '#43434F',
        height: 24,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        lineHeight: 24,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    allGrayFill: {
        fontSize: 13,
        color: '#fff',
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#43434F',
        lineHeight: 24,
        height: 24,
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
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
})