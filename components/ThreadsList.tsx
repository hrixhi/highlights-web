import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ActivityIndicator, ScrollView, Dimensions, Image, Platform, Linking, TextInput } from 'react-native';
import Alert from '../components/Alert'
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import ThreadCard from './ThreadCard';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { createMessage, deleteThread, getThreadWithReplies, markThreadsAsRead, getThreadCategories } from '../graphql/QueriesAndMutations';
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
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
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
    const [privatePost, setPrivatePost] = useState(false)
    const [threadCategories, setThreadCategories] = useState<any[]>([])
    const [customCategory, setCustomCategory] = useState('')
    const [addCustomCategory, setAddCustomCategory] = useState(false)

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

    const loadCategories = useCallback(async () => {
        if (props.channelId === undefined || props.channelId === null || props.channelId === '') {
            return;
        }
        const server = fetchAPI('')
        server.query({
            query: getThreadCategories,
            variables: {
                channelId: props.channelId
            }
        })
            .then(res => {
                if (res.data.thread && res.data.thread.getChannelThreadCategories) {
                    setThreadCategories(res.data.thread.getChannelThreadCategories)
                }
            })
            .catch(err => {
            })
    }, [props.channelId])

    useEffect(() => {
        loadCategories()
    }, [props.channelId])

    // Load chat opened from Search
    useEffect(() => {
        (
            async () => {
                const tId = await AsyncStorage.getItem('openThread')
                if (tId && tId !== "" && threads.length !== 0) {

                    // Clear the openChat

                    await AsyncStorage.removeItem('openThread')

                    loadCueDiscussions(tId)

                }
            }
        )()
    }, [threads])


    const onSend = useCallback(async (messages: any) => {

        const server = fetchAPI('')
        server.mutate({
            mutation: createMessage,
            variables: {
                message: messages[0].text,
                userId,
                channelId: props.channelId,
                isPrivate: showPost && !isOwner ? privatePost : false,
                anonymous: false,
                cueId: props.cueId === null ? 'NULL' : props.cueId,
                parentId: threadId === '' ? 'INIT' : threadId,
                category: showPost ? customCategory : ''
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

    }, [props.cueId, props.channelId, threadId, userId, showPost, customCategory, privatePost, isOwner])

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

    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#007AFF'
                    }
                }}
            />
        )
    }

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;

    const customCategoryInput = (<View style={{ width: '100%', backgroundColor: 'white', paddingTop: 20, paddingBottom: 10 }}>
        <View style={{ width: '100%', paddingBottom: 10, backgroundColor: 'white' }}>
            <Text style={{ fontSize: 10, color: '#43434f', textTransform: 'uppercase' }}>
                {PreferredLanguageText('category')}
            </Text>
        </View>
        <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
            <View style={{ width: '85%', backgroundColor: 'white' }}>
                {
                    addCustomCategory ?
                        <View style={styles.colorBar}>
                            <TextInput
                                value={customCategory}
                                style={styles.allOutline}
                                placeholder={'Enter Category'}
                                onChangeText={val => {
                                    setCustomCategory(val)
                                }}
                                placeholderTextColor={'#818385'}
                            />
                        </View> :
                        <Menu
                            onSelect={(cat: any) => setCustomCategory(cat)}>
                            <MenuTrigger>
                                <Text style={{ fontSize: 14, color: '#818385' }}>
                                    {customCategory === '' ? 'None' : customCategory}<Ionicons name='caret-down' size={14} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#FBFBFC',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}>
                                <MenuOption
                                    value={''}>
                                    <Text>
                                        None
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
                        </Menu>}
            </View>
            <View style={{ width: '15%', backgroundColor: 'white' }}>
                <TouchableOpacity
                    onPress={() => {
                        if (addCustomCategory) {
                            setCustomCategory('')
                            setAddCustomCategory(false)
                        } else {
                            setCustomCategory('')
                            setAddCustomCategory(true)
                        }
                    }}
                    style={{ backgroundColor: 'white' }}>
                    <Text style={{ textAlign: 'right', lineHeight: 20, width: '100%' }}>
                        <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#818385'} />
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>)

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: props.cueId ? windowHeight - 200 : windowHeight - 50,
            paddingRight: 20,
            paddingLeft: Dimensions.get('window').width < 1024 ? 20 : 0,
            borderTopRightRadius: props.cueId ? 0 : 30,
            borderTopLeftRadius: props.cueId ? 0 : 30,
            paddingTop: props.cueId ? 0 : 0,
            // borderWidth: 1
        }}>
            {
                !showPost && !showThreadCues ?
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: !props.cueId ? 0 : 0, width: '100%' }}>
                        {
                            props.cueId === null && !showPost ?
                                <View style={{
                                    // width: '100%',
                                    height: 60,
                                    paddingRight: 20,
                                    // paddingTop: 7,
                                    backgroundColor: 'white',
                                }}>
                                    <Menu
                                        onSelect={(cat: any) => setFilterChoice(cat)}>
                                        <MenuTrigger>
                                            <Text style={{ fontSize: 14, color: '#1D1D20' }}>
                                                {filterChoice === '' ? 'All' : filterChoice}<Ionicons name='caret-down' size={14} />
                                            </Text>
                                        </MenuTrigger>
                                        <MenuOptions customStyles={{
                                            optionsContainer: {
                                                padding: 10,
                                                borderRadius: 15,
                                                shadowOpacity: 0,
                                                borderWidth: 1,
                                                borderColor: '#f0f0f2',
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
                                    </Menu>
                                    <Text style={{ fontSize: 10, color: '#1D1D20', width: '100%', paddingTop: 3 }}>
                                        Topic
                                    </Text>
                                </View> : null}
                        {
                            showComments && !showPost ?
                                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row' }}>
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
                                            flexDirection: 'row',
                                            right: 0
                                        }}>
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 30,
                                            color: '#fff',
                                            fontSize: 12,
                                            backgroundColor: '#35AC78',
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            height: 30,
                                            // width: 100,
                                            borderRadius: 15,
                                            textTransform: 'uppercase'
                                        }}>
                                            POST <Ionicons name='chatbox-ellipses-outline' size={12} />
                                            {/* <Ionicons name='create-outline' size={20} color={'#1D1D20'} /> */}
                                        </Text>
                                    </TouchableOpacity>
                                </View> : null
                        }
                    </View> : <TouchableOpacity
                        onPress={() => {
                            setShowPost(false)
                            setShowThreadCues(false)
                        }}
                        style={{
                            paddingRight: 20,
                            paddingTop: 15,
                            alignSelf: 'flex-start'
                        }}
                    >
                        <Text style={{ lineHeight: 35, width: '100%', textAlign: 'center' }}>
                            <Ionicons name='arrow-back-outline' size={25} color={'#1D1D20'} />
                        </Text>
                    </TouchableOpacity>
            }
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
                                {
                                    showPost ?
                                        <View style={{
                                            width: '100%',
                                            maxWidth: 800,
                                            paddingLeft: 20,
                                            height: Dimensions.get('window').height - 350,
                                        }}
                                        // key={threadChat.toString()}
                                        >
                                            <GiftedChat
                                                renderUsernameOnMessage={true}
                                                renderBubble={renderBubble}
                                                messages={threadChat}
                                                onSend={messages => onSend(messages)}
                                                user={{
                                                    _id: userId,
                                                    avatar
                                                }}
                                                renderActions={() => (
                                                    <View style={{
                                                        // marginTop: -10
                                                    }}>

                                                        {props.type === "Discussion" ? customCategoryInput : null}

                                                        {/* Add private option here only if not owner */}
                                                        {!isOwner ? <View style={{ paddingTop: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                                            <input
                                                                style={{ paddingRight: 20 }}
                                                                type='checkbox'
                                                                checked={privatePost}
                                                                onChange={(e) => {
                                                                    setPrivatePost(!privatePost)
                                                                }}
                                                            />
                                                            <Text style={{ fontSize: 10, textTransform: 'uppercase', marginLeft: 10 }}>
                                                                Private
                                                            </Text>
                                                        </View> : null}
                                                        <FileUpload
                                                            onUpload={(u: any, t: any) => {
                                                                const title = prompt('Enter title and click on OK to share.')

                                                                if (title === "") {
                                                                    return;
                                                                }

                                                                const obj = { url: u, type: t, title };
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
                                                width: '100%',
                                                maxWidth: 800,
                                                paddingLeft: 20,
                                                height: Dimensions.get('window').height - 350,
                                            }}
                                            // key={threadChat.toString()}
                                            >
                                                <GiftedChat
                                                    renderUsernameOnMessage={true}
                                                    messages={threadChat}
                                                    onSend={messages => onSend(messages)}
                                                    user={{
                                                        _id: userId,
                                                        avatar
                                                    }}
                                                    renderBubble={renderBubble}
                                                    renderActions={() => (
                                                        <View style={{
                                                            marginTop: -10
                                                        }}>
                                                            <FileUpload
                                                                onUpload={(u: any, t: any) => {
                                                                    const title = prompt('Enter title and click on OK to share.')
                                                                    if (title === "") {
                                                                        return;
                                                                    }
                                                                    const obj = { url: u, type: t, title };
                                                                    onSend([{
                                                                        text: JSON.stringify(obj)
                                                                    }])
                                                                }}
                                                            />
                                                        </View>
                                                    )}
                                                />
                                            </View> : <View style={{ width: '100%', maxWidth: 800, marginTop: 20 }}>
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
                                                                borderRightWidth: 1,
                                                                borderColor: '#f0f0f2',
                                                                borderRadius: 0,
                                                                width: '100%',
                                                                maxHeight: 600,
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
                                                                            backgroundColor: '#f8f8fa',
                                                                            flexDirection: 'row',
                                                                            borderColor: '#f0f0f2',
                                                                            borderRightWidth: 1,
                                                                            borderBottomWidth: ind === filteredThreads.length - 1 ? 0 : 1,
                                                                            // minWidth: 600, // flex: 1,
                                                                            width: '100%'
                                                                        }}>
                                                                        <View style={{ backgroundColor: '#f8f8fa', padding: 10 }}>
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
                                                                                source={{ uri: thread.avatar ? thread.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                                            />
                                                                        </View>
                                                                        <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                            <Text style={{ fontSize: 13, padding: 10 }} ellipsizeMode='tail'>
                                                                                {thread.anonymous ? 'Anonymous' : thread.fullName}
                                                                            </Text>
                                                                            <Text style={{ fontSize: 16, padding: 10, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                                                {title}
                                                                            </Text>
                                                                        </View>
                                                                        <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                                                            <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                                {
                                                                                    thread.isPrivate ?
                                                                                        <Text style={{ fontSize: 15, padding: 10, color: '#007AFF', textAlign: 'center' }} ellipsizeMode='tail'>
                                                                                            <Ionicons name='eye-off-outline' size={20} />
                                                                                        </Text>
                                                                                        : null
                                                                                }
                                                                                <Text style={{ fontSize: 15, padding: 10, color: '#007AFF', textAlign: 'center' }} ellipsizeMode='tail'>
                                                                                    <Ionicons name='chevron-forward-outline' size={20} />
                                                                                </Text>
                                                                            </View>
                                                                        </View>
                                                                    </TouchableOpacity>
                                                                })
                                                            }
                                                        </ScrollView>
                                                }
                                            </View>)
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
            borderRadius: 0,
            borderWidth: 1,
            borderColor: '#818385',
            color: 'white'
        },
        allOutline: {
            fontSize: 12,
            color: '#818385',
            height: 22,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#818385'
        },
    })
}
