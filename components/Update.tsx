import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { View } from '../components/Themed';
import Swiper from 'react-native-web-swiper'
import UpdateControls from './UpdateControls';
import { ScrollView } from 'react-native-gesture-handler'
import { fetchAPI } from '../graphql/FetchAPI';
import { getCueThreads, getStatuses } from '../graphql/QueriesAndMutations';
import ThreadsList from './ThreadsList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SubscribersList from './SubscribersList';

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

    const loadThreadsAndStatuses = useCallback(() => {
        if (Number.isNaN(Number(cueId))) {
            setLoading(true)
            const server = fetchAPI('')
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
                                        displayName: status.displayName,
                                        _id: status.userId,
                                        fullName: status.status,
                                        submission: status.submission,
                                        score: status.score,
                                        graded: status.graded,
                                        userId: status.userId
                                    })
                                })
                                setSubscribers(subs)
                                setLoading(false)
                                modalAnimation.setValue(0)
                                Animated.timing(modalAnimation, {
                                    toValue: 1,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start();
                            } else {
                                setLoading(false)
                                modalAnimation.setValue(0)
                                Animated.timing(modalAnimation, {
                                    toValue: 1,
                                    duration: 150,
                                    useNativeDriver: true
                                }).start();
                            }
                        }).catch(err => {
                            Alert.alert("Unable to load statuses.", "Check connection.")
                            setLoading(false)
                            modalAnimation.setValue(0)
                            Animated.timing(modalAnimation, {
                                toValue: 1,
                                duration: 150,
                                useNativeDriver: true
                            }).start();
                        })
                    } else {
                        setLoading(false)
                        modalAnimation.setValue(0)
                        Animated.timing(modalAnimation, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true
                        }).start();
                    }
                } else {
                    setThreads(res.data.thread.findByCueId)
                    setLoading(false)
                    modalAnimation.setValue(0)
                    Animated.timing(modalAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                }
            }).catch(err => {
                Alert.alert("Unable to load comments.", "Check connection.")
                setLoading(false)
                modalAnimation.setValue(0)
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            })
        } else {
            setLoading(false)
            modalAnimation.setValue(0)
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, [cueId, modalAnimation, createdBy, channelCreatedBy])

    useEffect(() => {
        loadThreadsAndStatuses()
        if (props.channelId && props.channelId !== '') {
            Alert.alert("Swipe left for comments.")
        }
    }, [props.cueId, props.channelId])

    const windowHeight = Dimensions.get('window').height;
    return (
        <View style={{
            width: '100%',
            height: windowHeight - 30,
            backgroundColor: '#f4f4f4',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
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
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                    }}>
                        <ActivityIndicator color={'#a6a2a2'} />
                    </View>
                    :
                    <Animated.View style={{
                        width: '100%',
                        height: windowHeight - 30,
                        opacity: modalAnimation,
                        borderTopLeftRadius: 30,
                        borderTopRightRadius: 30,
                    }}
                        key={JSON.stringify(threads)}
                    >
                        <Swiper
                            key={JSON.stringify(threads) + JSON.stringify(threads.length)}
                            vertical={false}
                            from={0}
                            minDistanceForAction={0.1}
                            controlsProps={{
                                dotsTouchable: true,
                                prevPos: 'left',
                                nextPos: 'right',
                                nextTitle: '›',
                                nextTitleStyle: { color: '#a6a2a2', fontSize: 50, fontFamily: 'overpass' },
                                prevTitle: '‹',
                                prevTitleStyle: { color: '#a6a2a2', fontSize: 50, fontFamily: 'overpass' },
                                dotActiveStyle: { backgroundColor: !Number.isNaN(Number(cueId)) ? '#fff' : '#0079fe' }
                            }}
                        >
                            <UpdateControls
                                channelId={props.channelId}
                                customCategories={props.customCategories}
                                cue={props.cue}
                                cueIndex={props.cueIndex}
                                cueKey={props.cueKey}
                                createdBy={createdBy}
                                closeModal={() => {
                                    Animated.timing(modalAnimation, {
                                        toValue: 0,
                                        duration: 150,
                                        useNativeDriver: true
                                    }).start(() => props.closeModal())
                                }}
                                reloadCueListAfterUpdate={() => props.reloadCueListAfterUpdate()}
                            />
                            {
                                !Number.isNaN(Number(cueId)) ? null :
                                    <ScrollView
                                        key={Math.random()}
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
                                        />
                                    </ScrollView>
                            }
                            {
                                channelOwner ?
                                    <ScrollView
                                        ref={scroll3}
                                        contentContainerStyle={{
                                            width: '100%',
                                            height: '100%'
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
                                        />
                                    </ScrollView> : null
                            }
                        </Swiper>
                    </Animated.View>
            }
        </View>
    );
}

export default Update