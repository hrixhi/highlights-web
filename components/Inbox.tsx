import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Platform, Linking } from 'react-native';
import Alert from '../components/Alert'
import { Text, TouchableOpacity, View } from './Themed';
import { ScrollView } from 'react-native'
import { fetchAPI } from '../graphql/FetchAPI';
import { getAllUsers, getChats, getGroups, getMessages, getSubscribers, markMessagesAsRead, sendDirectMessage, sendMessage } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchResultCard from './SearchResultCard';
import { htmlStringParser } from '../helpers/HTMLParser';
import { GiftedChat, Bubble } from 'react-native-gifted-chat'
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import Multiselect from 'multiselect-react-dropdown';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import alert from '../components/Alert';
import { Ionicons } from '@expo/vector-icons';
import FileUpload from './UploadFiles';
import moment from 'moment';
import mobiscroll, { Form as MobiscrollForm, FormGroup, Button as MobiscrollButton, Select, Input, FormGroupTitle } from '@mobiscroll/react'


const Inbox: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loadingSubs, setLoadingSubs] = useState(true)
    const [loadingChats, setLoadingChats] = useState(true)
    const [chats, setChats] = useState<any[]>([])
    const [userId, setUserId] = useState('')
    const [avatar, setAvatar] = useState('')
    const [fullName, setFullName] = useState('')
    const [chat, setChat] = useState<any[]>([])
    const [showChat, setShowChat] = useState(false)
    const [users, setUsers] = useState<any>([])
    const [showNewGroup, setShowNewGroup] = useState(false)
    const [chatUsers, setChatUsers] = useState<any[]>([])

    const [roleFilter, setRoleFilter] = useState('')
    const [gradeFilter, setGradeFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')

    const [channelFilter, setChannelFilter] = useState('')
    const [filterChannelName, setFilterChannelName] = useState('')
    const [filterChannelId, setFilterChannelId] = useState('All')

    const [showDirectory, setShowDirectory] = useState<any>(false)

    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",]
    const roles = ['student', 'instructor']

    const [selected, setSelected] = useState<any[]>([])

    const loadUsers = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        let server: any = null
        let user: any = {}
        if (u) {
            user = JSON.parse(u)
            server = fetchAPI(user._id)
            setUserId(user._id)
            if (user.avatar) {
                setAvatar(user.avatar)
            } else {
                setAvatar('https://cues-files.s3.amazonaws.com/images/default.png')
            }
            setFullName(user.fullName)
        } else {
            return
        }
        setLoadingSubs(true)
        server.query({
            query: getAllUsers,
            variables: {
                userId: user._id
            }
        }).then((res: any) => {
            if (res.data.user && res.data.user.getAllUsers) {
                setUsers(res.data.user.getAllUsers)
            }
            setLoadingSubs(false)
        }).catch((err: any) => {
            Alert("Unable to load subscribers.", "Check connection.")
            setLoadingSubs(false)
        })

    }, [])

    // Load chat opened from Search
    useEffect(() => {
        (
            async () => {
                const chat = await AsyncStorage.getItem('openChat')
                if (chat && chats.length !== 0) {
                    const parseChat: any = JSON.parse(chat)

                    // Clear the openChat

                    await AsyncStorage.removeItem('openChat')

                    if (parseChat.users && parseChat.users.length > 2) {
                        loadGroupChat(parseChat.users, parseChat._id)
                    } else {
                        loadChat(
                            parseChat.users[0] === userId ? parseChat.users[1] : parseChat.users[0]
                            , parseChat._id)
                    }

                }
            }
        )()
    }, [chats])

    const loadChats = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        let server: any = null
        let user: any = {}
        if (u) {
            user = JSON.parse(u)
            server = fetchAPI(user._id)
        } else {
            return
        }
        setLoadingChats(true)

        server.query({
            query: getChats,
            variables: {
                userId: user._id
            }
        }).then((res: any) => {
            if (res.data && res.data.group.getChats) {
                setChats(res.data.group.getChats)
                setShowChat(false)
                setShowNewGroup(false)
                setShowDirectory(false)
            }
        }).catch((err: any) => {
            console.log(err)
        })
    }, [])

    const reload = useCallback(() => {
        loadUsers()
        loadChats()
    }, [loadUsers, loadChats])

    const loadGroupChat = useCallback(async (groupUsers, groupId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setChatUsers(groupUsers)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: groupUsers
                }
            })
                .then(res => {
                    const tempChat: any[] = []
                    res.data.message.getMessagesThread.map((msg: any) => {
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
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.displayName,
                                avatar: msg.avatar ? msg.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                            },
                        })
                    })
                    tempChat.reverse()
                    setChat(tempChat)
                    setShowChat(true)
                })
                .catch(err => {
                    // Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => console.log(res))
                .catch(e => console.log(e))
        }
    }, [])

    console.log("Chat users", chatUsers);

    const width = Dimensions.get('window').width

    const createGroup = useCallback(async () => {

        const message = 'New Group Created'

        if (selected.length === 0) {
            alert('Select users.')
            return
        }

        const groupIds = selected.map((item: any) => {
            return item.value
        })

        const saveCue = message

        const server = fetchAPI('')
        server.mutate({
            mutation: sendMessage,
            variables: {
                users: [userId, ...groupIds],
                message: saveCue,
                userId
            }
        }).then(res => {
            // setSendingThread(false)
            if (res.data.message.createDirect) {
                loadChats()
            } else {
                Alert(unableToPostAlert, checkConnectionAlert)
            }
        }).catch(err => {
            // setSendingThread(false)
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })
    }, [selected, userId])

    const unableToPostAlert = PreferredLanguageText('unableToPost');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');


    const onSend = useCallback(async (messages = []) => {
        const message = messages[0].text
        const u = await AsyncStorage.getItem('user')
        if (!message || message === '' || !u) {
            // setSendingThread(false)
            return
        }
        if (message.replace(/\&nbsp;/g, '').replace(/\s/g, '') === '<div></div>') {
            // setSendingThread(false)
            return
        }
        const user = JSON.parse(u)
        const saveCue = message

        const server = fetchAPI('')
        server.mutate({
            mutation: sendMessage,
            variables: {
                users: chatUsers,
                message: saveCue,
                userId
            }
        }).then(res => {
            // setSendingThread(false)
            if (res.data.message.createDirect) {
                setChat(previousMessages => GiftedChat.append(previousMessages, messages))
            } else {
                Alert(unableToPostAlert, checkConnectionAlert)
            }
        }).catch(err => {
            // setSendingThread(false)
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })
    }, [chatUsers, userId])

    const loadChat = useCallback(async (uId, groupId) => {
        setChat([])
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setChatUsers([parsedUser._id, uId])
            // setMeetingOn(false)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: [parsedUser._id, uId]
                }
            })
                .then(res => {
                    const tempChat: any[] = []
                    res.data.message.getMessagesThread.map((msg: any) => {
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
                                    {obj.title}
                                </Text>
                            </TouchableOpacity>
                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(msg.message)
                            text = t
                        }
                        tempChat.push({
                            _id: msg._id,
                            text,
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.displayName,
                                avatar: msg.avatar ? msg.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                            },
                        })
                    })
                    tempChat.reverse()
                    setChat(tempChat)
                    setShowChat(true)
                })
                .catch(err => {
                    console.log(err)
                    // Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark chat as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => {
                // props.refreshUnreadMessagesCount()
            })
                .catch(e => console.log(e))
        }
    }, [])

    const loadNewChat = useCallback(async (uId) => {
        setChat([])
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setChatUsers([parsedUser._id, uId])
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: [parsedUser._id, uId]
                }
            })
                .then(res => {
                    const tempChat: any[] = []
                    res.data.message.getMessagesThread.map((msg: any) => {
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
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.displayName,
                                avatar: msg.avatar ? msg.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png',
                            },
                        })
                    })
                    tempChat.reverse()
                    setChat(tempChat)
                    setShowChat(true)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    }, [])

    useEffect(() => {
        reload()
    }, [])

    let options = users.map((sub: any) => {
        return {
            value: sub._id, label: sub.fullName
        }
    })


    let roleFiltered: any[] = []
    let gradeFiltered: any[] = []
    let sectionFiltered: any[] = []
    // let dropdownOptionsRoleFiltered: any[] = []
    // let dropdownOptionsGradeFiltered: any[] = []
    // let dropdownOptionsSectionFiltered: any[] = []

    // filter by role
    if (roleFilter !== '') {
        roleFiltered = users.filter((u: any) => {
            return u.role === roleFilter
        })
        // dropdownOptionsRoleFiltered = users.filter((item: any) => {
        //     const ind = roleFiltered.find((r) => {

        //         return r._id === item._id
        //     })
        //     return ind ? true : false
        // })
    } else {
        roleFiltered = users
        // dropdownOptionsRoleFiltered = users
    }
    if (roleFilter !== 'instructor') {
        // filter by grade (if not instructor)
        if (gradeFilter !== '') {
            gradeFiltered = roleFiltered.filter((u: any) => {
                return u.grade === gradeFilter
            })
            // dropdownOptionsGradeFiltered = dropdownOptionsRoleFiltered.filter(item => {
            //     const ind = gradeFiltered.find((r) => {
            //         return r._id === item._id
            //     })
            //     return ind ? true : false
            // })
        } else {

            gradeFiltered = roleFiltered
            // dropdownOptionsGradeFiltered = dropdownOptionsRoleFiltered
        }
        // filter by section (if not instructor)
        if (sectionFilter !== '') {
            sectionFiltered = gradeFiltered.filter((u: any) => {
                return u.section === sectionFilter
            })
            // dropdownOptionsSectionFiltered = dropdownOptionsGradeFiltered.filter(item => {
            //     const ind = sectionFiltered.find((r) => {
            //         return r._id === item._id
            //     })
            //     return ind ? true : false
            // })
        } else {
            sectionFiltered = gradeFiltered
            // dropdownOptionsSectionFiltered = dropdownOptionsGradeFiltered
        }
    } else {
        // if instructor then set the role filtered to the section filter... cause its the final filter
        sectionFiltered = roleFiltered
        // dropdownOptionsSectionFiltered = dropdownOptionsRoleFiltered
    }

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height;

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

    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day'))
            return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year'))
            return date.format("MMM DD");
        else
            return date.format("MM/DD/YYYY");
    }

    let channelOptions = [{ value: 'All', text: 'All' }]

    props.subscriptions.map((subscription: any) => {

        channelOptions.push({
            value: subscription.channelId,
            text: subscription.channelName
        })

    })
    return (
        <View>
            {
                loadingSubs
                    ? <View style={{
                        width: '100%',
                        flex: 1,
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        marginTop: 50
                    }}>
                        <ActivityIndicator color={'#818385'} />
                    </View>
                    :
                    <View style={{
                        padding: 15,
                        paddingHorizontal: width < 1024 ? 0 : 20,
                        width: '100%',
                        marginTop: 7,
                        height: Dimensions.get('window').height - 230,
                        backgroundColor: 'white',
                        // overflow: 'scroll'
                    }} key={1}>
                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                            <View style={{ width: '100%', maxWidth: 800, alignSelf: 'center' }}>
                                <View style={{
                                    backgroundColor: '#fff', width: '100%',
                                    marginBottom: width < 1024 ? 20 : 0
                                }}>
                                    <View style={{ flexDirection: 'row', width: '100%' }}>
                                        {
                                            showNewGroup || showChat || showDirectory ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        loadChats()
                                                    }}
                                                    style={{
                                                        paddingRight: 20,
                                                        paddingTop: 5,
                                                        alignSelf: 'flex-start'
                                                    }}
                                                >
                                                    <Text style={{ lineHeight: 35, width: '100%', textAlign: 'center' }}>
                                                        <Ionicons name='arrow-back-outline' size={25} color={'#1D1D20'} />
                                                    </Text>
                                                </TouchableOpacity> :
                                                <TouchableOpacity
                                                    onPress={() => reload()}
                                                    style={{
                                                        paddingRight: 20,
                                                        paddingTop: 5,
                                                        alignSelf: 'flex-start'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            lineHeight: 30,
                                                            // color: '#1D1D20',
                                                            fontSize: 10,
                                                            // backgroundColor: '#f7f7f7',
                                                            paddingHorizontal: 20,
                                                            // marginRight: 15,
                                                            // fontFamily: 'inter',
                                                            height: 30,
                                                            // width: 100,
                                                            borderRadius: 15,
                                                            textTransform: 'uppercase'
                                                        }}
                                                    >
                                                        <Ionicons name='reload-outline' size={20} color={'#1D1D20'} />
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 5, backgroundColor: '#fff', textAlign: 'center' }}>
                                                        Refresh
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                        <View style={{ flexDirection: 'row', flex: 1 }} />
                                        {
                                            showNewGroup || showChat || showDirectory ? null :
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setShowDirectory(!showDirectory)
                                                    }}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        overflow: 'hidden',
                                                        // height: 35,
                                                        marginTop: 5,
                                                        justifyContent: 'center',
                                                        // flexDirection: 'row',
                                                        // alignSelf: 'flex-end'
                                                    }}>
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        lineHeight: 30,
                                                        // color: '#1D1D20',
                                                        fontSize: 10,
                                                        // backgroundColor: '#f7f7f7',
                                                        paddingHorizontal: 20,
                                                        // marginRight: 15,
                                                        // fontFamily: 'inter',
                                                        height: 30,
                                                        // width: 100,
                                                        borderRadius: 15,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        <Ionicons name='list-outline' size={20} color={'#1D1D20'} />
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 5, backgroundColor: '#fff', textAlign: 'center' }}>
                                                        Directory
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                        {
                                            showNewGroup || showChat || showDirectory ? null :
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setShowNewGroup(!showNewGroup)
                                                    }}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        overflow: 'hidden',
                                                        // height: 35,
                                                        marginTop: 5,
                                                        justifyContent: 'center',
                                                        // flexDirection: 'row',
                                                        // alignSelf: 'flex-end'
                                                    }}>
                                                    <Text style={{
                                                        textAlign: 'center',
                                                        lineHeight: 30,
                                                        // color: showNewGroup || showChat ? '#1D1D20' : '#fff',
                                                        fontSize: 10,
                                                        // backgroundColor: showNewGroup || showChat ? '#f7f7f7' : '#35AC78',
                                                        // paddingHorizontal: 20,
                                                        // fontFamily: 'inter',
                                                        height: 30,
                                                        // width: 100,
                                                        borderRadius: 15,
                                                        // textTransform: 'uppercase'
                                                    }}>
                                                        <Ionicons name='people-circle-outline' size={20} color={'#1D1D20'} />
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 5, backgroundColor: '#fff', textAlign: 'center' }}>
                                                        New Group
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                        {
                                            showDirectory ?
                                                <View style={{ backgroundColor: '#fff', paddingTop: 15 }}>
                                                    <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                                        
                                                    <label style={{ width: 150 }}>
                                                        <Select
                                                            touchUi={true}
                                                            themeVariant="light"
                                                            value={filterChannelId}
                                                            onChange={(val: any) => {
                                                                   setFilterChannelId(val.value)
                                                                }}
                                                                responsive={{
                                                                    small: {
                                                                        display: 'bubble'
                                                                    },
                                                                    medium: {
                                                                        touchUi: false,
                                                                    }
                                                                }}
                                                                data={channelOptions}
                                                            />
                                                            
                                                    </label>

                                                    </View>
                                                    <Text style={{ fontSize: 10, color: '#1D1D20',  paddingLeft: 5, paddingTop: 10 }}>
                                                        Channel
                                                    </Text>
                                                </View> : null
                                        }
                                    </View>
                                    {
                                        showChat ?
                                            <View style={{
                                                width: '100%',
                                                height: Dimensions.get('window').height - 230,
                                            }}>
                                                <GiftedChat
                                                    // showUserAvatar={false}
                                                    renderUsernameOnMessage={chatUsers.length > 2}
                                                    messages={chat}
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
                                                                    const obj = { url: u, type: t, title: (title + '.' + t) };
                                                                    onSend([{
                                                                        text: JSON.stringify(obj)
                                                                    }])
                                                                }}
                                                            />
                                                        </View>
                                                    )}
                                                />
                                            </View> :
                                            (
                                                showNewGroup ? <View>
                                                    <ScrollView
                                                        showsVerticalScrollIndicator={false}
                                                        keyboardDismissMode={'on-drag'}
                                                        style={{ flex: 1, paddingTop: 12 }}>
                                                        <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll', marginBottom: 25 }}>
                                                            <View style={{ width: '90%', padding: 5, maxWidth: 500, minHeight: 200 }}>
                                                                <Multiselect
                                                                    placeholder='Select users'
                                                                    displayValue='label'
                                                                    options={options} // Options to display in the dropdown
                                                                    selectedValues={selected} // Preselected value to persist in dropdown
                                                                    onSelect={(e, f) => {
                                                                        setSelected(e);
                                                                        return true
                                                                    }} // Function will trigger on select event
                                                                    onRemove={(e, f) => {
                                                                        setSelected(e);
                                                                        return true
                                                                    }}
                                                                />
                                                            </View>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => createGroup()}
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
                                                                lineHeight: 35,
                                                                color: '#fff',
                                                                fontSize: 12,
                                                                backgroundColor: '#007AFF',
                                                                paddingHorizontal: 25,
                                                                fontFamily: 'inter',
                                                                height: 35,
                                                                // width: 100,
                                                                borderRadius: 15,
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                CREATE
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </ScrollView>
                                                </View> :
                                                    (
                                                        showDirectory ?
                                                            <View style={{
                                                                flex: 1, width: '100%', borderWidth: 1,
                                                                borderRadius: 0,
                                                                borderColor: '#e8e8ea',
                                                                overflow: 'hidden',
                                                                marginTop: 30
                                                            }}>
                                                                <ScrollView contentContainerStyle={{
                                                                    maxHeight: windowHeight - 250,
                                                                    width: '100%',
                                                                    borderRadius: 0,
                                                                    // flex: 1
                                                                }}>
                                                                    {
                                                                        sectionFiltered.map((user: any, ind: any) => {
                                                                            if (filterChannelId !== 'All') {
                                                                                const id = user.channelIds
                                                                                    ? user.channelIds.find((id: any) => {
                                                                                        return id === filterChannelId
                                                                                    }) : undefined
                                                                                if (!id) {
                                                                                    return null
                                                                                }
                                                                            }
                                                                            return <TouchableOpacity
                                                                                onPress={() => {
                                                                                    loadNewChat(user._id)
                                                                                }}
                                                                                style={{
                                                                                    backgroundColor: '#f7f7f7',
                                                                                    flexDirection: 'row',
                                                                                    borderColor: '#e8e8ea',
                                                                                    borderBottomWidth: ind === sectionFiltered.length - 1 ? 0 : 1,
                                                                                    width: '100%'
                                                                                }}>
                                                                                <View style={{ backgroundColor: '#f7f7f7', padding: 10 }}>
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
                                                                                </View>
                                                                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                                    <Text style={{ fontSize: 16, padding: 10, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                                                        {user.fullName}
                                                                                    </Text>
                                                                                    <Text style={{ fontSize: 13, padding: 10 }} ellipsizeMode='tail'>
                                                                                        {user.email}
                                                                                    </Text>
                                                                                </View>
                                                                                {/* <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 15, padding: 10, color: '#007AFF', textAlign: 'center' }} ellipsizeMode='tail'>
                                                                    <Ionicons name='chatbubble-ellipses-outline' size={20} />
                                                                </Text>
                                                            </View> */}
                                                                            </TouchableOpacity>
                                                                        })
                                                                    }
                                                                </ScrollView>
                                                            </View>
                                                            :
                                                            <View style={{ backgroundColor: '#fff', paddingTop: 20 }}>
                                                                <ScrollView
                                                                    showsVerticalScrollIndicator={false}
                                                                    horizontal={false}
                                                                    // style={{ height: '100%' }}
                                                                    contentContainerStyle={{
                                                                        borderWidth: 1,
                                                                        borderColor: '#e8e8ea',
                                                                        borderRadius: 0,
                                                                        width: '100%',
                                                                        maxHeight: windowHeight - 200,
                                                                        overflow: 'hidden'
                                                                    }}
                                                                >
                                                                    {
                                                                        chats.map((chat: any, index) => {
                                                                            let fName = ''
                                                                            chat.userNames.map((u: any, i: any) => {
                                                                                console.log(u)
                                                                                if (u.fullName !== fullName) {
                                                                                    fName += (u.fullName + (i === chat.userNames.length - 2 ? '' : ', '))
                                                                                }
                                                                            })
                                                                            const { title } = htmlStringParser(chat.lastMessage)
                                                                            return (
                                                                                <TouchableOpacity
                                                                                    onPress={
                                                                                        () => {
                                                                                            if (chat.userNames.length > 2) {
                                                                                                loadGroupChat(chat.users, chat._id)
                                                                                            } else {
                                                                                                loadChat(
                                                                                                    chat.users[0] === userId ? chat.users[1] : chat.users[0]
                                                                                                    , chat._id)
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    style={{
                                                                                        backgroundColor: '#fff',
                                                                                        flexDirection: 'row',
                                                                                        borderColor: '#e8e8ea',
                                                                                        borderBottomWidth: index === chats.length - 1 ? 0 : 1,
                                                                                        // minWidth: 600, // flex: 1,
                                                                                        width: '100%'
                                                                                    }}>
                                                                                    <View style={{ backgroundColor: '#f7f7f7', padding: 10 }}>
                                                                                        {
                                                                                            chat.userNames.length > 2 ?
                                                                                                <Text style={{
                                                                                                    fontFamily: 'inter', marginTop: 5,
                                                                                                    textAlign: 'center',
                                                                                                    marginBottom: 5,
                                                                                                }} ellipsizeMode='tail'>
                                                                                                    <Ionicons name='people-circle-outline' size={40} />
                                                                                                </Text>
                                                                                                : <Image
                                                                                                    style={{
                                                                                                        height: 40,
                                                                                                        width: 40,
                                                                                                        marginTop: 5,
                                                                                                        marginBottom: 5,
                                                                                                        borderRadius: 75,
                                                                                                        // marginTop: 20,
                                                                                                        alignSelf: 'center'
                                                                                                    }}
                                                                                                    source={{ uri: (chat.users[0] === userId ? chat.users[1] : chat.users[0]).avatar ? (chat.users[0] === userId ? chat.users[1] : chat.users[0]).avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                                                                />
                                                                                        }
                                                                                    </View>
                                                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                                        <Text style={{ fontSize: 13, padding: 10 }} ellipsizeMode='tail'>
                                                                                            {fName}
                                                                                        </Text>
                                                                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                                                                            <Text style={{ flex: 1, flexDirection: 'row', fontSize: 16, padding: 10, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                                                                {title}
                                                                                            </Text>
                                                                                        </View>
                                                                                    </View>
                                                                                    <View style={{ backgroundColor: '#fff', padding: 0, flexDirection: 'row', alignSelf: 'center' }} >
                                                                                        <Text style={{ fontSize: 13, padding: 10, lineHeight: 13 }} ellipsizeMode='tail'>
                                                                                            {emailTimeDisplay(chat.lastMessageTime)}
                                                                                        </Text>
                                                                                        <Text style={{ fontSize: 13, padding: 10, lineHeight: 13 }} ellipsizeMode='tail'>
                                                                                            <Ionicons name='chevron-forward-outline' size={23} color='#007AFF' />
                                                                                        </Text>
                                                                                    </View>
                                                                                    {/* <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                                <Text style={{ fontSize: 15, padding: 10, color: '#007AFF', textAlign: 'center' }} ellipsizeMode='tail'>
                                                                                    <Ionicons name='chevron-forward-outline' size={20} />
                                                                                </Text>
                                                                            </View> */}
                                                                                </TouchableOpacity>
                                                                            )
                                                                            // <View style={{
                                                                            //     width: '100%',
                                                                            //     height: 70,
                                                                            //     marginBottom: 15,
                                                                            //     // flex: 1,
                                                                            //     backgroundColor: 'white'
                                                                            // }} key={index}>
                                                                            //     <SearchResultCard
                                                                            //         style={{
                                                                            //             height: '100%',
                                                                            //             borderRadius: 0,
                                                                            //             overflow: 'hidden',
                                                                            //             windowHeight: '100%'
                                                                            //         }}
                                                                            //         unreadMessages={chat.unreadMessages}
                                                                            //         title={fName}
                                                                            //         subtitle={title}
                                                                            //  onPress={
                                                                            //     () => {
                                                                            //         if (chat.userNames.length > 2) {
                                                                            //             loadGroupChat(chat.users, chat._id)
                                                                            //         } else {
                                                                            //             loadChat(
                                                                            //                 chat.users[0] === userId ? chat.users[1] : chat.users[0]
                                                                            //                 , chat._id)
                                                                            //         }
                                                                            //     }
                                                                            // }
                                                                            //     />
                                                                            // </View>
                                                                        })
                                                                    }
                                                                </ScrollView>
                                                            </View>)
                                            )
                                    }
                                </View>
                            </View>
                        </View>
                    </View>
            }
        </View >
    );
}

export default Inbox