import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import Alert from '../components/Alert'
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import ThreadCard from './ThreadCard';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { deleteThread, getThreadWithReplies, markThreadsAsRead } from '../graphql/QueriesAndMutations';
import NewMessage from './NewMessage';
import ThreadReplyCard from './ThreadReplyCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Collapse } from 'react-collapse';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';


const ThreadsList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loading, setLoading] = useState(false)
    const unparsedThreads: any[] = JSON.parse(JSON.stringify(props.threads))
    const [threads] = useState<any[]>(unparsedThreads.reverse())
    const [threadWithReplies, setThreadWithReplies] = useState<any[]>([])
    const styles = styleObject()
    const [showThreadCues, setShowThreadCues] = useState(false)
    const [filterChoice, setFilterChoice] = useState('All')
    const [showPost, setShowPost] = useState(false)
    const [threadId, setThreadId] = useState('')
    const [showComments, setShowComments] = useState(true)
    const [isOwner, setIsOwner] = useState(false)
    const categories: any[] = []
    const categoryObject: any = {}
    let filteredThreads: any[] = []
    threads.map((item) => {
        if (item.category !== '' && !categoryObject[item.category]) {
            categoryObject[item.category] = 'category'
        }
    })
    Object.keys(categoryObject).map((key) => {
        categories.push(key)
    })
    if (filterChoice === 'All') {
        filteredThreads = threads
    } else {
        filteredThreads = threads.filter((item) => {
            return item.category === filterChoice
        })
    }

    const unableToLoadThreadAlert = PreferredLanguageText('unableToLoadThread')
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');


    const loadCueDiscussions = useCallback(async (tId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const user = JSON.parse(u)
            setThreadId(tId)
            setLoading(true)
            setShowThreadCues(true)
            const server = fetchAPI('')
            server.query({
                query: getThreadWithReplies,
                variables: {
                    threadId: tId
                }
            })
                .then(res => {
                    setThreadWithReplies(res.data.thread.getThreadWithReplies)
                    setLoading(false)
                })
                .catch(err => {
                    Alert(unableToLoadThreadAlert, checkConnectionAlert)
                    setLoading(false)
                })
            server.mutate({
                mutation: markThreadsAsRead,
                variables: {
                    userId: user._id,
                    threadId: tId
                }
            }).then(res => {
                if (props.refreshUnreadDiscussionCount) {
                    props.refreshUnreadDiscussionCount()
                }
            })
                .catch(e => console.log(e))
        }

    }, [])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem("user")
                if (u) {
                    const user = JSON.parse(u)
                    if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [])

    const deletePost = useCallback((threadId: string) => {
        if (!isOwner) {
            return;
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: deleteThread,
            variables: {
                threadId
            }
        }).then((res) => {
            if (res.data && res.data.thread.delete) {
                props.reload()
            } else {
                Alert(somethingWentWrongAlert)
            }
        }).catch(e => Alert(somethingWentWrongAlert))
    }, [isOwner])

    if (showPost) {
        return <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            paddingHorizontal: 20,
            borderTopRightRadius: props.cueId ? 0 : 30,
            borderTopLeftRadius: props.cueId ? 0 : 30
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <NewMessage
                cueId={props.cueId}
                channelId={props.channelId}
                parentId={null}
                back={() => {
                    props.reload()
                    setShowPost(false)
                    setThreadId('')
                }}
                placeholder='Post...'
            />
        </View>
    }

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;
    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: props.cueId ? 'auto' : windowHeight - 50,
            paddingHorizontal: 20,
            borderTopRightRadius: props.cueId ? 0 : 30,
            borderTopLeftRadius: props.cueId ? 0 : 30,
            // marginBottom: props.cueId ? 0 : 25,
            // borderBottomColor: '#F8F9FA',
            // borderBottomWidth: props.cueId ? 0 : 1
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            {
                showThreadCues ?
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white'
                            }}
                            onPress={() => {
                                if (props.cueId !== null) {
                                    props.updateQAUnreadCount()
                                }
                                props.reload()
                                setThreadWithReplies([])
                                setShowThreadCues(false)
                            }}>
                            <Text style={{
                                width: '100%',
                                lineHeight: 23
                            }}>
                                <Ionicons name='arrow-back-outline' size={23} color={'#2f2f3c'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: !props.cueId ? 0 : 25, maxWidth: 500 }}>
                        {
                            !props.cueId
                                ? <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        fontSize: 25,
                                        paddingBottom: 20,
                                        fontFamily: 'inter',
                                        // textTransform: "uppercase",
                                        // paddingLeft: 10,
                                        paddingTop: 2,
                                        flex: 1,
                                        lineHeight: 25
                                    }}>
                                    {PreferredLanguageText('discussion')}
                                </Text>
                                : <View style={{ flex: 1, flexDirection: 'row' }} />
                            // <TouchableOpacity
                            //     onPress={() => setShowComments(!showComments)}
                            //     style={{
                            //         flex: 1,
                            //         flexDirection: 'row',
                            //         // paddingTop: 40,
                            //         paddingBottom: 40
                            //     }}>
                            //     <Text style={{
                            //         lineHeight: 23,
                            //         marginRight: 10,
                            //         color: '#2f2f3c',
                            //         fontSize: 11,
                            //         textTransform: 'uppercase'
                            //     }}>
                            //         {PreferredLanguageText('comments')}
                            //     </Text>
                            //     <Text style={{ lineHeight: 21 }}>
                            //         <Ionicons size={14} name={showComments ? 'caret-down-outline' : 'caret-forward-outline'} color='#2f2f3c' />
                            //     </Text>
                            // </TouchableOpacity>
                        }
                        {
                            showThreadCues ? null :
                                <View style={{
                                    // width: '100%',
                                    height: 60,
                                    paddingRight: 20,
                                    paddingTop: 7,
                                    backgroundColor: 'white',
                                }}>
                                    {
                                        props.cueId === null ?
                                            <Menu
                                                onSelect={(cat: any) => setFilterChoice(cat)}>
                                                <MenuTrigger>
                                                    <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#818385' }}>
                                                        {filterChoice === '' ? 'All' : filterChoice}<Ionicons name='caret-down' size={14} />
                                                    </Text>
                                                </MenuTrigger>
                                                <MenuOptions customStyles={{
                                                    optionsContainer: {
                                                        padding: 10,
                                                        borderRadius: 15,
                                                        shadowOpacity: 0,
                                                        borderWidth: 1,
                                                        borderColor: '#F8F9FA',
                                                        overflow: 'scroll',
                                                        maxHeight: '100%'
                                                    }
                                                }}>
                                                    <MenuOption
                                                        value={'All'}>
                                                        <Text>
                                                            All
                                                        </Text>
                                                    </MenuOption>
                                                    {
                                                        categories.map((category: any) => {
                                                            return <MenuOption
                                                                value={category}>
                                                                <Text>
                                                                    {category}
                                                                </Text>
                                                            </MenuOption>
                                                        })
                                                    }
                                                </MenuOptions>
                                            </Menu> : null
                                    }
                                </View>
                        }
                        {
                            showComments ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    onPress={() => setShowPost(true)}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        // marginTop: 15,
                                        justifyContent: 'center',
                                        flexDirection: 'row'
                                    }}>
                                    <Text style={{
                                        textAlign: 'center',
                                        lineHeight: 30,
                                        color: showPost ? '#2f2f3c' : '#fff',
                                        fontSize: 12,
                                        backgroundColor: showPost ? '#F8F9FA' : '#53BE6D',
                                        paddingHorizontal: 25,
                                        fontFamily: 'inter',
                                        height: 30,
                                        // width: 100,
                                        borderRadius: 15,
                                        textTransform: 'uppercase'
                                    }}>
                                        POST <Ionicons name='chatbox-ellipses-outline' size={12} />
                                        {/* <Ionicons name='create-outline' size={20} color={'#2f2f3c'} /> */}
                                    </Text>
                                </TouchableOpacity> : null
                        }
                    </View>
            }
            <Collapse isOpened={showComments} style={{ flex: 1 }}>
                {
                    threads.length === 0 ?
                        <View style={{ backgroundColor: 'white', flex: 1 }}>
                            <Text style={{ width: '100%', color: '#818385', fontSize: 22, paddingTop: 100, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                {
                                    !props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')
                                }
                            </Text>
                        </View>
                        : (
                            loading ?
                                <View style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    flex: 1,
                                    flexDirection: 'column',
                                    backgroundColor: 'white'
                                }}>
                                    <ActivityIndicator color={'#818385'} />
                                </View> :
                                <View style={{
                                    width: '100%',
                                    height: props.cueId ? 'auto' : windowHeight - 100,
                                    // borderWidth: 1,
                                    backgroundColor: 'white',
                                    flex: 1
                                }}
                                    key={JSON.stringify(filteredThreads)}
                                >
                                    {
                                        !showThreadCues ?
                                            <ScrollView
                                                showsVerticalScrollIndicator={false}
                                                horizontal={false}
                                                // style={{ height: '100%' }}
                                                contentContainerStyle={{
                                                    // borderWidth: 2,
                                                    width: '100%',
                                                    // height: windowHeight - 200,
                                                }}
                                            >
                                                {
                                                    filteredThreads.map((thread: any, index) => {
                                                        return <View style={styles.col} key={index}>
                                                            <ThreadCard
                                                                fadeAnimation={props.fadeAnimation}
                                                                thread={thread}
                                                                onPress={() => loadCueDiscussions(thread._id)}
                                                                channelCreatedBy={props.channelCreatedBy}
                                                            />
                                                        </View>
                                                    })
                                                }
                                            </ScrollView>
                                            :
                                            <ScrollView
                                                showsVerticalScrollIndicator={false}
                                                keyboardDismissMode={'on-drag'}
                                                style={{ flex: 1, paddingTop: 12 }}>
                                                {
                                                    threadWithReplies.map((thread, index) => {
                                                        return <View style={{ width: '100%', maxWidth: 500, paddingBottom: 10, backgroundColor: 'white' }} key={Math.random()}>
                                                            <ThreadReplyCard
                                                                index={index}
                                                                deleteThread={() => deletePost(thread._id)}
                                                                isOwner={isOwner}
                                                                channelCreatedBy={props.channelCreatedBy}
                                                                thread={thread} />
                                                        </View>
                                                    })
                                                }
                                                <View style={{ backgroundColor: 'white' }}>
                                                    <NewMessage
                                                        cueId={props.cueId}
                                                        channelId={props.channelId}
                                                        parentId={threadId}
                                                        back={() => {
                                                            props.reload()
                                                            setShowPost(false)
                                                            setThreadId('')
                                                        }}
                                                        placeholder={`${PreferredLanguageText('reply')}...`}
                                                    />
                                                </View>
                                            </ScrollView>
                                    }
                                </View>
                        )
                }
            </Collapse>
        </View >
    );
}

export default React.memo(ThreadsList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        marginSmall: {
            height: 10
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            backgroundColor: 'white'
        },
        colorBar: {
            width: '100%',
            height: '10%',
            flexDirection: 'row'
        },
        channelOption: {
            width: '33.333%'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        cusCategory: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 15,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#818385',
            color: 'white'
        }
    })
}
