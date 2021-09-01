import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image } from 'react-native';
import Alert from '../components/Alert'
import { Text, TouchableOpacity, View } from './Themed';
import { ScrollView } from 'react-native'
import { fetchAPI } from '../graphql/FetchAPI';
import { getAllUsers, getChats, getGroups, getMessages, getSubscribers, markMessagesAsRead, sendDirectMessage, sendMessage } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchResultCard from './SearchResultCard';
import { htmlStringParser } from '../helpers/HTMLParser';
import { GiftedChat } from 'react-native-gifted-chat'
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

const Inbox: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [loadingSubs, setLoadingSubs] = useState(true)
    const [loadingChats, setLoadingChats] = useState(true)
    const [chats, setChats] = useState<any[]>([])
    const [userId, setUserId] = useState('')
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
            }
        }).catch((err: any) => {
            console.log(err)
        })
    }, [])

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
                        const { title } = htmlStringParser(msg.message)
                        tempChat.push({
                            _id: msg._id,
                            text: title,
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.displayName,
                                avatar: msg.avatar,
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
                        const { title } = htmlStringParser(msg.message)
                        tempChat.push({
                            _id: msg._id,
                            text: title,
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.displayName,
                                avatar: 'https://placeimg.com/140/140/any',
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
            // load the user
            // server.query({
            //     query: findUserById,
            //     variables: {
            //         id: userId
            //     }
            // }).then(res => {
            //     if (res.data && res.data.user.findById) {
            //         setLoadedChatWithUser(res.data.user.findById)
            //         server.query({
            //             query: isSubInactive,
            //             variables: {
            //                 userId: res.data.user.findById._id,
            //                 channelId: props.channelId
            //             }
            //         }).then((res2: any) => {
            //             if (res2.data && res2.data.subscription.isSubInactive) {
            //                 setIsLoadedUserInactive(true)
            //             }
            //         }).catch((err) => console.log(err))
            //     }
            // })
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
                        const { title } = htmlStringParser(msg.message)
                        tempChat.push({
                            _id: msg._id,
                            text: title,
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.displayName,
                                avatar: 'https://placeimg.com/140/140/any',
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
        loadUsers()
        loadChats()
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
                        backgroundColor: 'white'
                    }}>
                        <ActivityIndicator color={'#818385'} />
                    </View>
                    :
                    <View style={{
                        padding: 15,
                        paddingHorizontal: width < 768 ? 0 : 20,
                        width: '100%',
                        height: Dimensions.get('window').height - 230,
                        backgroundColor: 'white',
                        // overflow: 'scroll'
                    }} key={1}>
                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                            <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row' }}>
                                <View style={{
                                    backgroundColor: 'white',
                                    width: width < 768 ? '100%' : '40%',
                                    paddingRight: width < 768 ? 0 : 20,
                                }} key={showChat.toString()}>
                                    <View style={{
                                        flex: 1,
                                        flexDirection: 'row'
                                    }}>
                                        <Text style={{
                                            fontSize: 25,
                                            paddingBottom: width < 768 ? 20 : 40,
                                            paddingTop: 10,
                                            fontFamily: 'inter',
                                            flex: 1,
                                            flexDirection: 'row',
                                            lineHeight: 23,
                                            color: '#2f2f3c'
                                        }}>
                                            <Ionicons name='chatbubble-outline' size={25} color='#3b64f8' /> Chats
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (showChat || showNewGroup) {
                                                    loadChats()
                                                } else {
                                                    setShowNewGroup(!showNewGroup)
                                                }
                                            }}
                                            style={{
                                                backgroundColor: 'white',
                                                overflow: 'hidden',
                                                height: 35,
                                                marginTop: 5,
                                                justifyContent: 'center',
                                                flexDirection: 'row'
                                            }}>
                                            <Text style={{
                                                textAlign: 'center',
                                                lineHeight: 30,
                                                color: showNewGroup || showChat ? '#2f2f3c' : '#fff',
                                                fontSize: 12,
                                                backgroundColor: showNewGroup || showChat ? '#F8F9FA' : '#53BE6D',
                                                paddingHorizontal: 25,
                                                fontFamily: 'inter',
                                                height: 30,
                                                // width: 100,
                                                borderRadius: 15,
                                                textTransform: 'uppercase'
                                            }}>
                                                {showNewGroup || showChat ? <Ionicons name='arrow-back-outline' size={12} /> : null} {
                                                    showNewGroup || showChat ? 'Back' : 'New group'
                                                } {showNewGroup || showChat ? null : <Ionicons name='people-outline' size={12} />}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {
                                        showChat ?
                                            <View style={{
                                                width: '100%',
                                                height: Dimensions.get('window').height - 230,
                                            }}>
                                                <GiftedChat
                                                    // showUserAvatar={false}
                                                    messages={chat}
                                                    onSend={messages => onSend(messages)}
                                                    user={{
                                                        _id: userId,
                                                    }}
                                                />
                                            </View> :
                                            (
                                                showNewGroup ? <View>
                                                    <ScrollView
                                                        showsVerticalScrollIndicator={false}
                                                        keyboardDismissMode={'on-drag'}
                                                        style={{ flex: 1, paddingTop: 12 }}>
                                                        {/* <Text
                                                        ellipsizeMode="tail"
                                                        style={{ fontSize: 11, color: '#818385', textTransform: 'uppercase' }}>
                                                        {PreferredLanguageText('newGroup')}
                                                    </Text> */}
                                                        <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll', marginBottom: 25 }}>
                                                            <View style={{ width: '90%', padding: 5, maxWidth: 500, minHeight: 200 }}>
                                                                <Multiselect
                                                                    placeholder='Select users'
                                                                    displayValue='label'
                                                                    // key={userDropdownOptions.toString()}
                                                                    // style={{ width: '100%', color: '#2f2f3c', 
                                                                    //     optionContainer: { // To change css for option container 
                                                                    //         zIndex: 9999
                                                                    //     }
                                                                    // }}
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
                                                                backgroundColor: '#3b64f8',
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
                                                        {/* <View style={{ backgroundColor: 'white' }}>
                                                            <NewMessage
                                                                cueId={props.cueId}
                                                                channelId={props.channelId}
                                                                parentId={null}
                                                                users={group}
                                                                addUserId={true}
                                                                back={() => {
                                                                    props.reload()
                                                                    setShowChat(false)
                                                                    setIsLoadedUserInactive(false)
                                                                    setLoadedChatWithUser({})
                                                                    setShowNewGroup(false)
                                                                }}
                                                                placeholder={`${PreferredLanguageText('message')}...`}
                                                            />
                                                        </View> */}
                                                    </ScrollView>
                                                </View> :
                                                    <View style={{ backgroundColor: '#fff', paddingTop: 20 }}>
                                                        <ScrollView
                                                            showsVerticalScrollIndicator={false}
                                                            horizontal={false}
                                                            // style={{ height: '100%' }}
                                                            contentContainerStyle={{
                                                                // borderWidth: 2,
                                                                width: '100%',
                                                                maxHeight: windowHeight - 200,
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
                                                                    return <View style={{
                                                                        width: '100%',
                                                                        height: 70,
                                                                        marginBottom: 15,
                                                                        // flex: 1,
                                                                        backgroundColor: 'white'
                                                                    }} key={index}>
                                                                        <SearchResultCard
                                                                            style={{
                                                                                height: '100%',
                                                                                borderRadius: 15,
                                                                                overflow: 'hidden',
                                                                                windowHeight: '100%'
                                                                            }}
                                                                            unreadMessages={chat.unreadMessages}
                                                                            title={fName}
                                                                            subtitle={title}
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
                                                                        />
                                                                    </View>
                                                                })
                                                            }
                                                        </ScrollView>
                                                    </View>
                                            )
                                    }
                                </View>
                                <View style={{
                                    backgroundColor: '#fff', width: width < 768 ? '100%' : '60%',
                                    paddingLeft: width < 768 ? 0 : 20,
                                    borderLeftWidth: width < 768 ? 0 : 1, borderLeftColor: '#dddddd'
                                }}>
                                    <View style={{
                                        flexDirection: width < 768 ? 'column' : 'row',
                                        paddingBottom: width < 768 ? 75 : 0, flex: 1
                                    }}>
                                        <Text style={{
                                            fontSize: 25,
                                            paddingBottom: width < 768 ? 20 : 40,
                                            paddingTop: width < 768 ? 30 : 10,
                                            fontFamily: 'inter',
                                            flex: 1,
                                            flexDirection: 'row',
                                            lineHeight: 23,
                                            color: '#2f2f3c'
                                        }}>
                                            <Ionicons name='folder-outline' size={25} color='#3b64f8' /> Directory
                                        </Text>
                                        <View style={{ flexDirection: 'row', flex: 1, justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                                            <View style={{ backgroundColor: '#fff', paddingLeft: width < 768 ? 0 : 20 }}>
                                                <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                                    <Menu
                                                        onSelect={(channel: any) => {

                                                        }}>
                                                        <MenuTrigger>
                                                            <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c' }}>
                                                                Channel <Ionicons name='caret-down' size={14} />
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
                                                                value={''}>
                                                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                    <View style={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: 10,
                                                                        marginTop: 1,
                                                                        backgroundColor: "#fff"
                                                                    }} />
                                                                    <Text style={{ marginLeft: 5 }}>
                                                                        All
                                                                    </Text>
                                                                </View>
                                                            </MenuOption>
                                                            {
                                                                props.subscriptions.map((subscription: any) => {
                                                                    return <MenuOption
                                                                        value={subscription}>
                                                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                            <View style={{
                                                                                width: 8,
                                                                                height: 8,
                                                                                borderRadius: 10,
                                                                                marginTop: 1,
                                                                                backgroundColor: subscription.colorCode
                                                                            }} />
                                                                            <Text style={{ marginLeft: 5 }}>
                                                                                {subscription.channelName}
                                                                            </Text>
                                                                        </View>
                                                                    </MenuOption>
                                                                })
                                                            }
                                                        </MenuOptions>
                                                    </Menu>
                                                </View>
                                                <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7 }}>
                                                    Channel
                                                </Text>
                                            </View>
                                            {/* <View style={{ backgroundColor: 'white', paddingLeft: 25 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', display: 'flex', backgroundColor: 'white', paddingLeft: 10 }}>
                                                    <Menu
                                                        onSelect={(role: any) => {
                                                            setRoleFilter(role)
                                                        }}>
                                                        <MenuTrigger>
                                                            <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                                                {roleFilter === '' ? 'All' : roleFilter}<Ionicons name='caret-down' size={15} />
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
                                                                value={''}>
                                                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                    <Text style={{ marginLeft: 5 }}>
                                                                        All
                                                                    </Text>
                                                                </View>
                                                            </MenuOption>
                                                            {
                                                                roles.map((role: any) => {
                                                                    return <MenuOption
                                                                        value={role}>
                                                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                            <Text style={{ marginLeft: 5 }}>
                                                                                {role}
                                                                            </Text>
                                                                        </View>
                                                                    </MenuOption>
                                                                })
                                                            }
                                                        </MenuOptions>
                                                    </Menu>
                                                </View>
                                                <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, backgroundColor: 'white' }}>
                                                    Roles
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: 'white', paddingLeft: 20 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'center', display: 'flex', backgroundColor: 'white', paddingLeft: 30 }}>
                                                    <Menu
                                                        onSelect={(grade: any) => {
                                                            setGradeFilter(grade)
                                                        }}>
                                                        <MenuTrigger>
                                                            <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                                                {gradeFilter === '' ? 'All' : gradeFilter}<Ionicons name='caret-down' size={15} />
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
                                                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                    <Text style={{ marginLeft: 5 }}>
                                                                        All
                                                                    </Text>
                                                                </View>
                                                            </MenuOption>
                                                            {
                                                                grades.map((role: any) => {
                                                                    return <MenuOption
                                                                        value={role}>
                                                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                            <Text style={{ marginLeft: 5 }}>
                                                                                {role}
                                                                            </Text>
                                                                        </View>
                                                                    </MenuOption>
                                                                })
                                                            }
                                                        </MenuOptions>
                                                    </Menu>
                                                </View>
                                                <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, backgroundColor: 'white', paddingLeft: 20 }}>
                                                    Grades
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: 'white', paddingLeft: 20 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', display: 'flex', backgroundColor: 'white', paddingLeft: 30 }}>
                                                    <Menu
                                                        onSelect={(grade: any) => {
                                                            setSectionFilter(grade)
                                                        }}>
                                                        <MenuTrigger>
                                                            <Text style={{ fontFamily: 'inter', fontSize: 15, color: '#2f2f3c' }}>
                                                                {sectionFilter === '' ? 'All' : sectionFilter}<Ionicons name='caret-down' size={15} />
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
                                                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                    <Text style={{ marginLeft: 5 }}>
                                                                        All
                                                                    </Text>
                                                                </View>
                                                            </MenuOption>
                                                            {
                                                                sections.map((section: any) => {
                                                                    return <MenuOption
                                                                        value={section}>
                                                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                            <Text style={{ marginLeft: 5 }}>
                                                                                {section}
                                                                            </Text>
                                                                        </View>
                                                                    </MenuOption>
                                                                })
                                                            }
                                                        </MenuOptions>
                                                    </Menu>
                                                </View>
                                                <Text style={{ fontSize: 10, color: '#2f2f3c', paddingTop: 7, paddingLeft: 20 }}>
                                                    Sections
                                                </Text>
                                            </View>
                                             */}
                                        </View>
                                    </View>
                                    <ScrollView
                                        horizontal={true}
                                    // style={{ width: '100%' }}
                                    >
                                        <View style={{
                                            flex: 1, width: '100%', borderWidth: 1,
                                            borderRadius: 5,
                                            borderColor: '#eeeeee'
                                        }}>
                                            <View style={{ backgroundColor: '#fff', flexDirection: 'row', width: '100%', flex: 1, minWidth: 600 }}>
                                                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F8F9FA', paddingLeft: 10 }}>
                                                </View>
                                                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F8F9FA', paddingLeft: 10 }}>
                                                    <Text style={{
                                                        flex: 1, flexDirection: 'row',
                                                        fontSize: 20, lineHeight: 25, fontFamily: 'inter', paddingHorizontal: 20, paddingVertical: 5
                                                    }} ellipsizeMode='tail'>
                                                        Name
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F8F9FA', paddingLeft: 10 }}>
                                                    <Text style={{
                                                        flex: 1, flexDirection: 'row',
                                                        fontSize: 20, lineHeight: 25, fontFamily: 'inter', paddingHorizontal: 20, paddingVertical: 5
                                                    }} ellipsizeMode='tail'>
                                                        Email
                                                    </Text>
                                                </View>
                                            </View>
                                            <ScrollView contentContainerStyle={{
                                                maxHeight: 500,
                                                width: '100%',
                                                flex: 1
                                            }}>
                                                {
                                                    sectionFiltered.map((user: any) => {
                                                        return <TouchableOpacity
                                                            onPress={() => {
                                                                loadNewChat(user._id)
                                                            }}
                                                            style={{
                                                                backgroundColor: '#fff',
                                                                flexDirection: 'row',
                                                                borderColor: '#eeeeee',
                                                                borderBottomWidth: 1,
                                                                minWidth: 600, // flex: 1,
                                                                width: '100%'
                                                            }}>
                                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
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
                                                                <Text style={{ fontSize: 12, lineHeight: 25, paddingHorizontal: 20, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                                    {user.fullName}
                                                                </Text>
                                                            </View>
                                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 12, lineHeight: 25, paddingHorizontal: 20 }} ellipsizeMode='tail'>
                                                                    {user.email}
                                                                </Text>
                                                            </View>
                                                            {/* <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 12, lineHeight: 25, paddingHorizontal: 20 }} ellipsizeMode='tail'>
                                                                    {user.role}
                                                                </Text>
                                                            </View>
                                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 12, lineHeight: 25, paddingHorizontal: 20 }} ellipsizeMode='tail'>
                                                                    {user.grade}
                                                                </Text>
                                                            </View>
                                                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                <Text style={{ fontSize: 12, lineHeight: 25, paddingHorizontal: 20 }} ellipsizeMode='tail'>
                                                                    {user.section}
                                                                </Text>
                                                            </View> */}
                                                        </TouchableOpacity>
                                                    })
                                                }
                                            </ScrollView>
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                        </View>
                    </View>
            }
        </View >
    );
}

export default Inbox