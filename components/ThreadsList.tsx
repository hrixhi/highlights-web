import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Dimensions, Image, Platform, Linking } from 'react-native';
import Alert from '../components/Alert'
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import ThreadCard from './ThreadCard';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { createMessage, deleteThread, getThreadWithReplies, markThreadsAsRead } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Collapse } from 'react-collapse';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { htmlStringParser } from '../helpers/HTMLParser';
import { GiftedChat } from 'react-native-gifted-chat';
import FileUpload from './UploadFiles';


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
    const [avatar, setAvatar] = useState('')

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

    const [threadChat, setThreadChat] = useState<any[]>([])

    const [userId, setUserId] = useState('')

    const onSend = useCallback(async (messages: any) => {

        const server = fetchAPI('')
        server.mutate({
            mutation: createMessage,
            variables: {
                message: messages[0].text,
                userId,
                channelId: props.channelId,
                isPrivate: false,
                anonymous: false,
                cueId: props.cueId === null ? 'NULL' : props.cueId,
                parentId: threadId === '' ? 'INIT' : threadId,
                category: ''
            }
        }).then(res => {
            if (res.data.thread.writeMessage) {
                setThreadChat(threadChat => GiftedChat.append(threadChat, messages))
                props.reload()
            } else {
                Alert(checkConnectionAlert)
            }
        }).catch(err => {
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })

    }, [props.cueId, props.channelId, threadId, userId])

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
                    const tempChat: any[] = []
                    res.data.thread.getThreadWithReplies.map((msg: any) => {
                        let text: any = ''
                        if (msg.message[0] === '{' && msg.message[msg.message.length - 1] === '}') {
                            const obj = JSON.parse(msg.message)
                            text = <TouchableOpacity style={{ backgroundColor: '#2484FF' }}>
                                <Text style={{
                                    textDecorationLine: 'underline',
                                    backgroundColor: '#2484FF',
                                    color: '#fff'
                                }}
                                    onPress={() => {
                                        if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                            window.open(obj.url, '_blank')
                                        } else {
                                            Linking.openURL(obj.url)
                                        }
                                    }}
                                >
                                    {obj.title + '.' + obj.type}
                                </Text>
                            </TouchableOpacity>
                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(msg.message)
                            text = t
                        }
                        tempChat.push({
                            _id: msg._id,
                            text,
                            createdAt: msg.time,
                            user: {
                                _id: msg.userId,
                                name: msg.fullName,
                                avatar: msg.avatar ? msg.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png'
                            },
                        })
                    })
                    tempChat.reverse()
                    setThreadChat(tempChat)
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
                    setUserId(user._id)
                    if (user.avatar) {
                        setAvatar(user.avatar)
                    } else {
                        setAvatar('https://cues-files.s3.amazonaws.com/images/default.png')
                    }
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

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;
    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: props.cueId ? 'auto' : windowHeight - 50,
            paddingRight: 20,
            paddingLeft: Dimensions.get('window').width < 1024 ? 20 : 0,
            borderTopRightRadius: props.cueId ? 0 : 30,
            borderTopLeftRadius: props.cueId ? 0 : 30,
            paddingTop: props.cueId ? 0 : 0
        }}>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: !props.cueId ? 0 : 0 }}>
                {
                    !props.cueId
                        ? <Text
                            ellipsizeMode="tail"
                            style={{
                                fontSize: 23,
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
                        : null
                }
                <View style={{
                    // width: '100%',
                    height: 60,
                    paddingRight: 20,
                    // paddingTop: 7,
                    backgroundColor: 'white',
                }}>
                    {
                        props.cueId === null ?
                            <Menu
                                onSelect={(cat: any) => setFilterChoice(cat)}>
                                <MenuTrigger>
                                    <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#43434f' }}>
                                        {filterChoice === '' ? 'All' : filterChoice}<Ionicons name='caret-down' size={14} />
                                    </Text>
                                </MenuTrigger>
                                <MenuOptions customStyles={{
                                    optionsContainer: {
                                        padding: 10,
                                        borderRadius: 15,
                                        shadowOpacity: 0,
                                        borderWidth: 1,
                                        borderColor: '#f8f9fa',
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
                    <Text style={{ fontSize: 10, color: '#43434F', width: '100%', paddingTop: 3 }}>
                        Topic
                    </Text>
                </View>
                {
                    showComments ?
                        <TouchableOpacity
                            key={Math.random()}
                            onPress={() => {
                                setThreadId('')
                                setThreadChat([])
                                setShowPost(true)
                            }}
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
                                color: '#fff',
                                fontSize: 12,
                                backgroundColor: '#53BE6D',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 30,
                                // width: 100,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                POST <Ionicons name='chatbox-ellipses-outline' size={12} />
                                {/* <Ionicons name='create-outline' size={20} color={'#43434F'} /> */}
                            </Text>
                        </TouchableOpacity> : null
                }
            </View>
            <Collapse isOpened={showComments} style={{ flex: 1 }}>
                {
                    (
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
                                flex: 1,
                                flexDirection: 'row'
                            }}
                                key={JSON.stringify(filteredThreads) + JSON.stringify(showPost)}
                            >
                                <View style={{
                                    width: '50%'
                                }}>
                                    {
                                        threads.length === 0 ?
                                            <View style={{ backgroundColor: 'white', flex: 1 }}>
                                                <Text style={{ width: '100%', color: '#818385', fontSize: 23, paddingTop: 100, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                    {
                                                        !props.cueId ? PreferredLanguageText('noPosts') : PreferredLanguageText('noComments')
                                                    }
                                                </Text>
                                            </View>
                                            : <ScrollView
                                                showsVerticalScrollIndicator={false}
                                                horizontal={false}
                                                // style={{ height: '100%' }}
                                                contentContainerStyle={{
                                                    borderWidth: 1,
                                                    borderColor: '#eeeeee',
                                                    borderRadius: 12,
                                                    width: '100%',
                                                    // height: windowHeight - 200,
                                                }}
                                            >
                                                {
                                                    filteredThreads.map((thread: any, ind) => {

                                                        let title = ''

                                                        if (thread.message[0] === '{' && thread.message[thread.message.length - 1] === '}') {
                                                            const obj = JSON.parse(thread.message)
                                                            title = obj.title
                                                        } else {
                                                            const { title: t, subtitle: s } = htmlStringParser(thread.message)
                                                            title = t
                                                        }

                                                        return <TouchableOpacity
                                                            onPress={() => loadCueDiscussions(thread._id)}
                                                            style={{
                                                                backgroundColor: '#f8f9fa',
                                                                flexDirection: 'row',
                                                                borderColor: '#eeeeee',
                                                                borderBottomWidth: ind === filteredThreads.length - 1 ? 0 : 1,
                                                                // minWidth: 600, // flex: 1,
                                                                width: '100%'
                                                            }}>
                                                            {/* <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 10 }}>
                                                                <Image
                                                                    style={{
                                                                        height: 40,
                                                                        width: 40,
                                                                        marginTop: 5,
                                                                        marginBottom: 5,
                                                                        borderRadius: 75,
                                                                        // marginTop: 20,
                                                                        alignSelf: 'center'
                                                                    }}
                                                                    source={{ uri: user.avatar ? user.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                                />
                                                            </View> */}
                                                            <View style={{ flex: 1, backgroundColor: '#f8f9fa', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 12, padding: 10, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                                    {thread.anonymous ? 'Anonymous' : thread.fullName}
                                                                </Text>
                                                            </View>
                                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 12, padding: 10 }} ellipsizeMode='tail'>
                                                                    {title}
                                                                </Text>
                                                            </View>
                                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 15, padding: 10, color: '#3b64f8' }} ellipsizeMode='tail'>
                                                                    <Ionicons name='chevron-forward-outline' size={20} />
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>

                                                        return <View style={styles.col} key={ind}>
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
                                    }
                                </View>
                                {
                                    showPost ?
                                        <View style={{
                                            width: '60%',
                                            paddingLeft: 20,
                                            height: Dimensions.get('window').height - 230,
                                        }}
                                            key={threadChat.toString()}
                                        >
                                            <GiftedChat
                                                messages={threadChat}
                                                onSend={messages => onSend(messages)}
                                                user={{
                                                    _id: userId,
                                                    avatar
                                                }}
                                                renderActions={() => (
                                                    <View style={{
                                                        marginTop: -10
                                                    }}>
                                                        <FileUpload
                                                            onUpload={(u: any, t: any) => {
                                                                const title = prompt('Enter title and click on OK to share.')
                                                                const obj = { url: u, type: t, title: (title + '.' + t) };
                                                                onSend([{
                                                                    text: JSON.stringify(obj)
                                                                }])
                                                            }}
                                                        />
                                                    </View>
                                                )}
                                            />
                                        </View>
                                        : (showThreadCues ?
                                            <View style={{
                                                width: '50%',
                                                paddingLeft: 20,
                                                height: Dimensions.get('window').height - 230,
                                            }}
                                                key={threadChat.toString()}
                                            >
                                                <GiftedChat
                                                    messages={threadChat}
                                                    onSend={messages => onSend(messages)}
                                                    user={{
                                                        _id: userId,
                                                        avatar
                                                    }}
                                                    renderActions={() => (
                                                        <View style={{
                                                            marginTop: -10
                                                        }}>
                                                            <FileUpload
                                                                onUpload={(u: any, t: any) => {
                                                                    const title = prompt('Enter title and click on OK to share.')
                                                                    const obj = { url: u, type: t, title: (title + '.' + t) };
                                                                    onSend([{
                                                                        text: JSON.stringify(obj)
                                                                    }])
                                                                }}
                                                            />
                                                        </View>
                                                    )}
                                                />
                                            </View> : null)
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
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#818385',
            color: 'white'
        }
    })
}
