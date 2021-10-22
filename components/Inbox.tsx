import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, Platform, Linking } from 'react-native';
import Alert from '../components/Alert'
import { Text, TouchableOpacity, View } from './Themed';
import { ScrollView } from 'react-native'
import { fetchAPI } from '../graphql/FetchAPI';
import { getAllUsers, getChats, getGroups, getMessages, getSubscribers, markMessagesAsRead, sendDirectMessage, sendMessage, updateGroup, getGroup } from '../graphql/QueriesAndMutations';
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
import { Select } from '@mobiscroll/react'
import { TextInput } from './CustomTextInput';
import ReactPlayer from "react-player";


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
    const [groupId, setGroupId] = useState('')
    const [chatName, setChatName] = useState('')
    const [chatImg, setChatImg] = useState('')
    const [isChatGroup, setIsChatGroup] = useState(false);
    const [viewGroup, setViewGroup] = useState(false);
    const [groupUsers, setGroupUsers] = useState<any[]>([])
    const [groupCreatedBy, setGroupCreatedBy] = useState('');
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupImage, setEditGroupImage] = useState('');

    const [roleFilter, setRoleFilter] = useState('')
    const [gradeFilter, setGradeFilter] = useState('')
    const [sectionFilter, setSectionFilter] = useState('')

    const [channelFilter, setChannelFilter] = useState('')
    const [filterChannelName, setFilterChannelName] = useState('')
    const [filterChannelId, setFilterChannelId] = useState('All')
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupImage, setNewGroupImage] = useState(undefined);

    const [creatingMessage, setCreatingMessage] = useState(false);

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
                const sortedUsers = res.data.user.getAllUsers.sort((a: any, b: any) => {
                    if (a.fullName < b.fullName) { return -1; }
                    if (a.fullName > b.fullName) { return 1; }
                    return 0;
                })
                setUsers(sortedUsers)
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
                setChats(res.data.group.getChats.reverse())
                setShowChat(false)
                setShowNewGroup(false)
                // props.setShowDirectory(false)
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
            setGroupId(groupId)
            setIsChatGroup(true)

            // Set current chat name and image
            chats.map((c: any) => {
                if (c._id === groupId) {
                    setGroupCreatedBy(c.createdBy)
                    setGroupUsers(c.userNames)
                    setEditGroupName(c.name)
                    setEditGroupImage(c.image ? c.image : undefined)
                    setChatName(c.name);
                    setChatImg(c.image ? c.image : "https://cues-files.s3.amazonaws.com/images/default.png")
                }
            })

            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    groupId
                }
            })
                .then(res => {
                    const tempChat: any[] = []
                    res.data.message.getMessagesThread.map((msg: any) => {

                        let text: any = ''
                        let img: any = ''
                        let audio: any = ''
                        let video: any = ''
                        if (msg.message[0] === '{' && msg.message[msg.message.length - 1] === '}') {
                            const obj = JSON.parse(msg.message)
                            const { type, url } = obj;
                            if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
                                img = url
                            } else if (type === "mp3" || type === "wav" || type === "mp2") {
                                audio = url
                            } else if (type === "mp4" || type === "oga" || type === "mov" || type === "wmv") {
                                video = url
                            } else {
                                text = <TouchableOpacity style={{  }}>
                                    <Text style={{
                                        textDecorationLine: 'underline',
                                        // backgroundColor: '#3289D0',
                                        color: '#fff'
                                    }}
                                        onPress={() => {
                                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                                window.open(url, '_blank')
                                            } else {
                                                Linking.openURL(url)
                                            }
                                        }}
                                    >
                                        {obj.title + '.' + obj.type}
                                    </Text>
                                </TouchableOpacity>
                            }


                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(msg.message)
                            text = t
                        }
                        tempChat.push({
                            _id: msg._id,
                            text,
                            image: img,
                            audio,
                            video,
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.fullName,
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
    }, [chats])

    const width = Dimensions.get('window').width

    const createGroup = useCallback(async () => {

        if (selected.length === 0) {
            alert('Select users.')
            return
        }

        const server = fetchAPI('')
        server.mutate({
            mutation: sendMessage,
            variables: {
                users: [userId, ...selected],
                message: 'New Group Created',
                userId,
                groupName: newGroupName,
                groupImage: newGroupImage
            }
        }).then(res => {
            // setSendingThread(false)
            setSelected([]);
            setNewGroupName('');
            setNewGroupImage(undefined);

            if (res.data.message.createDirect) {
                loadChats()
            } else {
                Alert(unableToPostAlert, checkConnectionAlert)
            }
        }).catch(err => {
            // setSendingThread(false)
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })
    }, [selected, userId, newGroupName, newGroupImage])

    const handleUpdateGroup = useCallback(async () => {

        if (chatUsers.length < 2) {
            Alert("Group must have at least 2 users")
        }

        if (editGroupName === "") {
            Alert("Enter group name");
            return;
        }

        const server = fetchAPI('');

        server.mutate({
            mutation: updateGroup,
            variables: {
                groupId,
                users: [userId, ...chatUsers],
                groupName: editGroupName,
                groupImage: editGroupImage,
            }
        }).then(res => {
            // setSendingThread(false)

            setNewGroupName('');
            setNewGroupImage(undefined);
            setViewGroup(false)

            if (res.data.message.updateGroup) {
                Alert("Updated group successfully.")
                loadChats()
            } else {
                Alert("Could not update group. Try again.")
            }
        }).catch(err => {
            // setSendingThread(false)
            Alert("Could not update group. Try again.")
        })
    }, [groupId, editGroupName, editGroupImage, chatUsers])

    const unableToPostAlert = PreferredLanguageText('unableToPost');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');


    const onSend = useCallback(async (messages = []) => {

        if (creatingMessage) return;

        const message = messages[0].file || messages[0].image || messages[0].audio || messages[0].video ? messages[0].saveCue : messages[0].text
        const u: any = await AsyncStorage.getItem('user')
        if (!message || message === '' || !u) {
            // setSendingThread(false)
            return
        }
        if (message.replace(/\&nbsp;/g, '').replace(/\s/g, '') === '<div></div>') {
            // setSendingThread(false)
            return
        }
        const user = JSON.parse(u)

        messages[0] = {
            ...messages[0],
            user: {
                _id: userId
            }
        }

        setCreatingMessage(true)

        const server = fetchAPI('')
        server.mutate({
            mutation: sendMessage,
            variables: {
                users: chatUsers,
                message,
                userId,
                groupId
            }
        }).then(async res => {
            // setSendingThread(false)
            if (res.data.message.createDirect) {

                setChat(previousMessages => GiftedChat.append(previousMessages, messages))

                if (!groupId || groupId === "") {

                    // Refresh and get the groupId

                    const res = await server.query({
                        query: getGroup,
                        variables: {
                            users: chatUsers
                        }
                    })

                    if (res && res.data.message.getGroupId && res.data.message.getGroupId !== "") {
                        setGroupId(res.data.message.getGroupId)
                    }

                }

                setCreatingMessage(false)

            } else {
                Alert(unableToPostAlert, checkConnectionAlert)
                setCreatingMessage(false)
            }
        }).catch(err => {
            // setSendingThread(false)
            Alert(somethingWentWrongAlert, checkConnectionAlert)
            setCreatingMessage(false)
        })
    }, [chatUsers, userId, groupId, creatingMessage])

    const loadChat = useCallback(async (uId, groupId) => {
        setChat([])
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setChatUsers([parsedUser._id, uId])
            setGroupId(groupId)
            // Set current chat name and image
            chats.map((chat: any) => {
                if (chat._id === groupId) {

                    // Find the chat user 

                    // Group name or individual user name
                    let fName = ''

                    chat.userNames.map((user: any) => {
                        if (user._id !== userId) {
                            fName = user.fullName
                            return;
                        }
                    })


                    setChatName(fName);

                    // Find the chat avatar
                    const chatImg = (chat.users[0] === userId ? chat.userNames[1] : chat.userNames[0]).avatar ? (chat.users[0] === userId ? chat.userNames[1] : chat.userNames[0]).avatar : 'https://cues-files.s3.amazonaws.com/images/default.png'

                    setChatImg(chatImg)
                }
            })

            // setMeetingOn(false)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    groupId
                }
            })
                .then(res => {
                    const tempChat: any[] = []
                    res.data.message.getMessagesThread.map((msg: any) => {

                        let text: any = ''
                        let img: any = ''
                        let audio: any = ''
                        let video: any = ''
                        if (msg.message[0] === '{' && msg.message[msg.message.length - 1] === '}') {
                            const obj = JSON.parse(msg.message)
                            const { type, url } = obj;
                            if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
                                img = url
                            } else if (type === "mp3" || type === "wav" || type === "mp2") {
                                audio = url
                            } else if (type === "mp4" || type === "oga" || type === "mov" || type === "wmv") {
                                video = url
                            } else {
                                text = <TouchableOpacity style={{ backgroundColor: '#3289D0' }}>
                                    <Text style={{
                                        textDecorationLine: 'underline',
                                        backgroundColor: '#3289D0',
                                        color: '#fff'
                                    }}
                                        onPress={() => {
                                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                                window.open(url, '_blank')
                                            } else {
                                                Linking.openURL(url)
                                            }
                                        }}
                                    >
                                        {obj.title + '.' + obj.type}
                                    </Text>
                                </TouchableOpacity>
                            }


                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(msg.message)
                            text = t
                        }
                        tempChat.push({
                            _id: msg._id,
                            text,
                            image: img,
                            audio,
                            video,
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.fullName,
                                avatar: msg.avatar ? msg.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png'
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
    }, [chats])

    const loadNewChat = useCallback(async (uId) => {
        setChat([])
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setChatUsers([parsedUser._id, uId])

            // Set chat name and image


            // Group name or individual user name
            let fName = ''
            let img = "https://cues-files.s3.amazonaws.com/images/default.png"

            users.map((user: any) => {
                if (user._id === uId) {
                    fName = user.fullName
                    if (user.avatar) {
                        img = user.avatar
                    }
                    return;
                }
            })

            setChatName(fName)

            setChatImg(img)

            setGroupId('')
            const server = fetchAPI('')

            // First load the group if there is one

            const res = await server.query({
                query: getGroup,
                variables: {
                    users: [parsedUser._id, uId]
                }
            })

            if (!res || !res.data.message.getGroupId || res.data.message.getGroupId === "") {
                setShowChat(true)
                return;
            }

            setGroupId(res.data.message.getGroupId)

            server.query({
                query: getMessages,
                variables: {
                    groupId: res.data.message.getGroupId
                }
            })
                .then(res => {
                    const tempChat: any[] = []
                    res.data.message.getMessagesThread.map((msg: any) => {
                        let text: any = ''
                        let img: any = ''
                        let audio: any = ''
                        let video: any = ''
                        if (msg.message[0] === '{' && msg.message[msg.message.length - 1] === '}') {
                            const obj = JSON.parse(msg.message)
                            const { type, url } = obj;
                            if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
                                img = url
                            } else if (type === "mp3" || type === "wav" || type === "mp2") {
                                audio = url
                            } else if (type === "mp4" || type === "oga" || type === "mov" || type === "wmv") {
                                video = url
                            } else {
                                text = <TouchableOpacity style={{ backgroundColor: '#3289D0' }}>
                                    <Text style={{
                                        textDecorationLine: 'underline',
                                        backgroundColor: '#3289D0',
                                        color: '#fff'
                                    }}
                                        onPress={() => {
                                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                                window.open(url, '_blank')
                                            } else {
                                                Linking.openURL(url)
                                            }
                                        }}
                                    >
                                        {obj.title + '.' + obj.type}
                                    </Text>
                                </TouchableOpacity>
                            }


                        } else {
                            const { title: t, subtitle: s } = htmlStringParser(msg.message)
                            text = t
                        }
                        tempChat.push({
                            _id: msg._id,
                            text,
                            image: img,
                            audio,
                            video,
                            createdAt: msg.sentAt,
                            user: {
                                _id: msg.sentBy,
                                name: msg.fullName,
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
    }, [users])

    useEffect(() => {
        reload()
    }, [])


    let options = users.map((sub: any) => {
        return {
            value: sub._id, text: sub.fullName, group: sub.fullName[0].toUpperCase()
        }
    })

    options = options.sort((a: any, b: any) => {
        if (a.group < b.group) { return -1; }
        if (a.group > b.group) { return 1; }
        return 0;
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

    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height : Dimensions.get('window').height;

    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#3289D0'
                    }
                }}
            />
        )
    }

    const renderMessageAudio = (props: any) => {

        if (props.currentMessage.audio && props.currentMessage.audio !== "") {
            return <View>
                <ReactPlayer
                    url={props.currentMessage.audio}
                    controls={true}
                    onContextMenu={(e: any) => e.preventDefault()}
                    config={{
                        file: { attributes: { controlsList: "nodownload" } },
                    }}
                    width={250}
                    height={60}
                />
            </View>
        }

        return null;

    }

    const renderMessageVideo = (props: any) => {

        if (props.currentMessage.video && props.currentMessage.video !== "") {
            return <View>
                <ReactPlayer
                    url={props.currentMessage.video}
                    controls={true}
                    onContextMenu={(e: any) => e.preventDefault()}
                    config={{
                        file: { attributes: { controlsList: "nodownload" } },
                    }}
                    width={250}
                    height={200}
                />
            </View>
        }

        return null;

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

    const sortChatsByLastMessage = chats.sort((a: any, b: any) => {
        return new Date(a.lastMessageTime) > new Date(b.lastMessageTime) ? -1 : 1
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
                        <ActivityIndicator color={'#343A40'} />
                    </View>
                    :
                    <View style={{
                        paddingVertical: 15,
                        paddingTop: 0,
                        // paddingHorizontal: width < 1024 ? 0 : 20,
                        width: '100%',
                        // marginTop: 10,
                        height: width < 1024 ? Dimensions.get('window').height - 104 : Dimensions.get('window').height - 52,
                        backgroundColor: 'white',
                        overflow: 'scroll'
                    }} key={1}>
                        <View style={{ width: '100%', backgroundColor: 'white' }}>
                            <View style={{ width: '100%', maxWidth: 1000, alignSelf: 'center' }}>
                                <View style={{
                                    backgroundColor: '#fff', width: '100%',
                                    marginBottom: width < 1024 ? 20 : 0
                                }}>
                                    <View style={{ flexDirection: 'row', width: '100%' }}>
                                        {
                                            showNewGroup || showChat || props.showDirectory ?
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (viewGroup) {
                                                            setViewGroup(false)
                                                            return;
                                                        } else {
                                                            if (!showChat) {
                                                                props.setShowDirectory(false)
                                                            }
                                                            setShowChat(false)
                                                        }
                                                        setGroupId("")
                                                        setChatName("")
                                                        setChatImg("")
                                                        loadChats()
                                                        setIsChatGroup(false);
                                                    }}
                                                    style={{
                                                        paddingRight: 15,
                                                        paddingTop: 5,
                                                        alignSelf: 'flex-start'
                                                    }}
                                                >
                                                    <Text style={{ lineHeight: 35, width: '100%', textAlign: 'center', paddingTop: 5 }}>
                                                        <Ionicons name='arrow-back-outline' size={30} color={'#343A40'} />
                                                    </Text>
                                                </TouchableOpacity>
                                                : null
                                            // <TouchableOpacity
                                            //     onPress={() => reload()}
                                            //     style={{
                                            //         paddingRight: 20,
                                            //         paddingTop: 9,
                                            //         alignSelf: 'flex-start'
                                            //     }}
                                            // >
                                            //     <Text
                                            //         style={{
                                            //             textAlign: 'center',
                                            //             lineHeight: 35,
                                            //             // color: '#16181C',
                                            //             fontSize: 10,
                                            //             // backgroundColor: '#E7EBEE',
                                            //             // paddingHorizontal: 20,
                                            //             // marginRight: 15,
                                            //             // fontFamily: 'inter',
                                            //             height: 35,
                                            //             // width: 100,
                                            //             borderRadius: 15,
                                            //             textTransform: 'uppercase'
                                            //         }}
                                            //     >
                                            //         <Ionicons name='reload-outline' size={22} color={'#3289D0'} />
                                            //     </Text>
                                            // </TouchableOpacity>
                                        }
                                        {
                                            props.showDirectory && !showChat && !showNewGroup ?
                                                <View style={{ backgroundColor: '#fff', paddingTop: 10 }}>
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
                                                    {/* <Text style={{ fontSize: 10, color: '#16181C', paddingLeft: 5, paddingTop: 10 }}>
                                                        Channel
                                                    </Text> */}
                                                </View> : null
                                        }
                                        {/* Show user / group name if you open the chat */}
                                        {showChat ?
                                            <TouchableOpacity disabled={!isChatGroup} onPress={() => setViewGroup(true)}
                                                style={{
                                                    flexDirection: 'row', alignItems: 'center', flex: 1,
                                                    width: '100%', paddingVertical: 10, borderBottomWidth: 1,
                                                    borderBottomColor: '#E7EBEE', paddingHorizontal: 10
                                                }} >
                                                <Image
                                                    style={{
                                                        height: 35,
                                                        width: 35,
                                                        borderRadius: 75,
                                                        // marginTop: 20,
                                                        alignSelf: 'center'
                                                    }}
                                                    source={{ uri: chatImg }}
                                                />
                                                <Text style={{
                                                    fontFamily: 'inter', fontSize: 16, paddingLeft: 20, flex: 1
                                                }}>
                                                    {chatName}
                                                </Text>
                                            </TouchableOpacity>
                                            : null}
                                        {showNewGroup || showChat || !props.showDirectory ? null : <View style={{ flexDirection: 'row', flex: 1 }} />}
                                        {
                                            showNewGroup || showChat || !props.showDirectory ? null :
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setShowNewGroup(!showNewGroup)
                                                    }}
                                                    style={{
                                                        backgroundColor: "white",
                                                        overflow: "hidden",
                                                        height: 35,
                                                        marginTop: width < 1024 ? 10 : 20
                                                        // marginBottom: 20
                                                    }}>
                                                    <Text
                                                        style={{
                                                            textAlign: "center",
                                                            lineHeight: 35,
                                                            color: '#3289D0',
                                                            fontSize: 12,
                                                            borderWidth: 1,
                                                            borderColor: '#3289D0',
                                                            paddingHorizontal: 20,
                                                            fontFamily: "inter",
                                                            height: 35,
                                                            // paddingTop: 2
                                                            // width: 125,
                                                            borderRadius: 15,
                                                            textTransform: "uppercase"
                                                        }}>
                                                        NEW GROUP
                                                    </Text>
                                                </TouchableOpacity>
                                        }
                                        {/* {
                                            showNewGroup || showChat || props.showDirectory ? null :
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        props.setShowDirectory(!props.showDirectory)
                                                    }}
                                                    style={{
                                                        backgroundColor: "white",
                                                        overflow: "hidden",
                                                        height: 35,
                                                        marginTop: 5
                                                        // marginBottom: 20
                                                    }}>
                                                    <Text
                                                        style={{
                                                            textAlign: "center",
                                                            lineHeight: 35,
                                                            color: '#3289D0',
                                                            fontSize: 12,
                                                            borderWidth: 1,
                                                            borderColor: '#3289D0',
                                                            paddingHorizontal: 20,
                                                            fontFamily: "inter",
                                                            height: 35,
                                                            // paddingTop: 2
                                                            // width: 125,
                                                            borderRadius: 15,
                                                            textTransform: "uppercase"
                                                        }}>
                                                        CONTACTS
                                                    </Text>
                                                </TouchableOpacity>
                                        } */}
                                    </View>
                                    {
                                        viewGroup ?
                                            <View style={{ marginTop: 20 }}>
                                                {/*  */}
                                                {
                                                    userId === groupCreatedBy ?
                                                        <View>
                                                            <Image
                                                                style={{
                                                                    height: 100,
                                                                    width: 100,
                                                                    borderRadius: 75,
                                                                    // marginTop: 20,
                                                                    alignSelf: 'center'
                                                                }}
                                                                source={{ uri: editGroupImage ? editGroupImage : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                            />
                                                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', paddingTop: 15, }}>
                                                                {
                                                                    editGroupImage ?
                                                                        <TouchableOpacity
                                                                            onPress={() => setEditGroupImage(undefined)}
                                                                            style={{
                                                                                backgroundColor: 'white',
                                                                                overflow: 'hidden',
                                                                                height: 35,
                                                                                // marginLeft: 20,
                                                                                // marginTop: 15,
                                                                                justifyContent: 'center',
                                                                                flexDirection: 'row'
                                                                            }}>
                                                                            <Text style={{
                                                                                textAlign: 'center',
                                                                                lineHeight: 35,
                                                                                color: '#16181C',
                                                                                fontSize: 12,
                                                                                backgroundColor: '#E7EBEE',
                                                                                paddingHorizontal: 20,
                                                                                fontFamily: 'inter',
                                                                                height: 35,
                                                                                // width: 100,
                                                                                borderRadius: 15,
                                                                                textTransform: 'uppercase'
                                                                            }}>
                                                                                REMOVE
                                                                            </Text>
                                                                        </TouchableOpacity> : <FileUpload
                                                                            onUpload={(u: any, t: any) => {
                                                                                setEditGroupImage(u)
                                                                            }}
                                                                        />
                                                                }
                                                            </View>

                                                            <View style={{ backgroundColor: 'white' }}>
                                                                <Text style={{
                                                                    fontSize: 14,
                                                                    // fontFamily: 'inter',
                                                                    color: '#16181C'
                                                                }}>
                                                                    {PreferredLanguageText('name')}
                                                                </Text>
                                                                <TextInput
                                                                    value={editGroupName}
                                                                    placeholder={''}
                                                                    onChangeText={val => {
                                                                        setEditGroupName(val)
                                                                    }}
                                                                    placeholderTextColor={'#343A40'}
                                                                    required={true}
                                                                />
                                                            </View>
                                                        </View>
                                                        :
                                                        null
                                                }

                                                <Text style={{
                                                    fontSize: 14,
                                                    // fontFamily: 'inter',
                                                    color: '#16181C'
                                                }}>
                                                    Users
                                                </Text>

                                                {groupCreatedBy === userId ?
                                                    <Select
                                                        themeVariant="light"
                                                        selectMultiple={true}
                                                        group={true}
                                                        groupLabel="&nbsp;"
                                                        inputClass="mobiscrollCustomMultiInput"
                                                        placeholder="Select"
                                                        touchUi={true}
                                                        // minWidth={[60, 320]}
                                                        value={chatUsers}
                                                        data={options}
                                                        onChange={(val: any) => {
                                                            setChatUsers(val.value)
                                                        }}
                                                        responsive={{
                                                            small: {
                                                                display: 'bubble'
                                                            },
                                                            medium: {
                                                                touchUi: false,
                                                            }
                                                        }}
                                                        minWidth={[60, 320]}
                                                    // minWidth={[60, 320]}
                                                    />
                                                    :
                                                    <ScrollView
                                                        showsVerticalScrollIndicator={false}
                                                        keyboardDismissMode={'on-drag'}
                                                        style={{ flex: 1, paddingTop: 12 }}>
                                                        {
                                                            groupUsers.map((user: any, ind: any) => {
                                                                return <View style={{
                                                                    flexDirection: 'row', alignItems: 'center', flex: 1,
                                                                    width: '100%', paddingVertical: 7,
                                                                    borderBottomWidth: ind === Object.keys(groupUsers).length - 1 ? 0 : 1,
                                                                    borderBottomColor: '#E7EBEE',
                                                                    paddingHorizontal: 10
                                                                }} >
                                                                    <Image
                                                                        style={{
                                                                            height: 35,
                                                                            width: 30,
                                                                            borderRadius: 75,

                                                                            // marginTop: 20,
                                                                            alignSelf: 'center'
                                                                        }}
                                                                        source={{ uri: user.avatar ? user.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                                    />
                                                                    <Text style={{
                                                                        fontFamily: 'inter', fontSize: 16, paddingLeft: 20
                                                                    }}>
                                                                        {user.fullName}
                                                                    </Text>
                                                                    {
                                                                        groupCreatedBy === user._id ? <Text style={{
                                                                            fontSize: 12, paddingRight: 20, marginLeft: 'auto'
                                                                        }}>
                                                                            Admin
                                                                        </Text> : null
                                                                    }
                                                                </View>
                                                            })
                                                        }
                                                    </ScrollView>}

                                                {groupCreatedBy === userId ? <TouchableOpacity
                                                    onPress={() => handleUpdateGroup()}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        overflow: 'hidden',
                                                        marginTop: 50,
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
                                                        backgroundColor: '#3289D0',
                                                        paddingHorizontal: 20,
                                                        fontFamily: 'inter',
                                                        height: 35,
                                                        // width: 100,
                                                        borderRadius: 15,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        UPDATE
                                                    </Text>
                                                </TouchableOpacity> : null}
                                            </View>
                                            : null
                                    }
                                    {
                                        viewGroup ? null : showChat ?
                                            <View style={{
                                                width: '100%',
                                                // height: '100%',
                                                height: Dimensions.get('window').width < 1024 ? windowHeight - 104 - 80 : windowHeight - 52 - 80,
                                                // borderWidth: 1,
                                                zIndex: 5000,
                                                borderColor: '#E7EBEE'
                                            }}>
                                                <GiftedChat
                                                    // showUserAvatar={isChatGroup}
                                                    renderMessageAudio={renderMessageAudio}
                                                    renderMessageVideo={renderMessageVideo}
                                                    renderUsernameOnMessage={isChatGroup}
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
                                                                chat={true}
                                                                onUpload={(u: any, t: any) => {
                                                                    const title = prompt('Enter title and click on OK to share.')
                                                                    if (!title || title === "") return;

                                                                    let text: any = ''
                                                                    let img: any = ''
                                                                    let audio: any = ''
                                                                    let video: any = ''
                                                                    let file: any = ''

                                                                    if (t === 'png' || t === 'jpeg' || t === 'jpg' || t === 'gif') {
                                                                        img = u
                                                                    } else if (t === "mp3" || t === "wav" || t === "mp2") {
                                                                        audio = u
                                                                    } else if (t === "mp4" || t === "oga" || t === "mov" || t === "wmv") {
                                                                        video = u
                                                                    } else {
                                                                        file = u
                                                                        text = <TouchableOpacity
                                                                            onPress={() => {
                                                                                if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                                                                    window.open(u, '_blank')
                                                                                } else {
                                                                                    Linking.openURL(u)
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                backgroundColor: "white", borderRadius: 15, marginLeft: 15,
                                                                                marginTop: 6,
                                                                            }}>
                                                                            <Text style={{
                                                                                textAlign: "center",
                                                                                lineHeight: 35,
                                                                                color: '#3289D0',
                                                                                fontSize: 12,
                                                                                borderWidth: 1,
                                                                                borderColor: '#3289D0',
                                                                                paddingHorizontal: 20,
                                                                                fontFamily: "inter",
                                                                                height: 35,
                                                                                // paddingTop: 2
                                                                                // width: 125,
                                                                                borderRadius: 15,
                                                                                textTransform: "uppercase"
                                                                            }}>
                                                                                {title}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    }

                                                                    const obj = { title, type: t, url: u }

                                                                    onSend([{
                                                                        title,
                                                                        text,
                                                                        image: img,
                                                                        audio,
                                                                        video,
                                                                        file,
                                                                        saveCue: JSON.stringify(obj)
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
                                                        <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll', marginBottom: 25, alignItems: 'center' }}>
                                                            <View style={{ width: '90%', padding: 5, maxWidth: 500, minHeight: 200, marginBottom: 15 }}>
                                                                {/* Add group avatar here */}

                                                                <Image
                                                                    style={{
                                                                        height: 100,
                                                                        width: 100,
                                                                        borderRadius: 75,
                                                                        // marginTop: 20,
                                                                        alignSelf: 'center'
                                                                    }}
                                                                    source={{ uri: newGroupImage ? newGroupImage : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                                />
                                                                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', paddingTop: 15, }}>
                                                                    {
                                                                        newGroupImage ? <TouchableOpacity
                                                                            onPress={() => setNewGroupImage(undefined)}
                                                                            style={{
                                                                                backgroundColor: 'white',
                                                                                overflow: 'hidden',
                                                                                height: 35,
                                                                                // marginLeft: 20,
                                                                                // marginTop: 15,
                                                                                justifyContent: 'center',
                                                                                flexDirection: 'row'
                                                                            }}>
                                                                            <Text>
                                                                                <Ionicons name={'close-circle-outline'} size={19} color={'#343A40'} />
                                                                            </Text>
                                                                        </TouchableOpacity> : <FileUpload
                                                                            onUpload={(u: any, t: any) => {
                                                                                setNewGroupImage(u)
                                                                            }}
                                                                        />
                                                                    }
                                                                </View>

                                                                {/* Add group name here */}
                                                                <View style={{ backgroundColor: 'white' }}>
                                                                    <Text style={{
                                                                        fontSize: 14,
                                                                        // fontFamily: 'inter',
                                                                        color: '#16181C'
                                                                    }}>
                                                                        {PreferredLanguageText('name')}
                                                                    </Text>
                                                                    <TextInput
                                                                        value={newGroupName}
                                                                        placeholder={''}
                                                                        onChangeText={val => {
                                                                            setNewGroupName(val)
                                                                        }}
                                                                        placeholderTextColor={'#343A40'}
                                                                        required={true}
                                                                    />
                                                                </View>

                                                                {/* Add group avatar here */}

                                                                <Text style={{
                                                                    fontSize: 14,
                                                                    // fontFamily: 'inter',
                                                                    color: '#16181C',
                                                                    marginBottom: 15
                                                                }}>
                                                                    Users
                                                                </Text>
                                                                <Select
                                                                    themeVariant="light"
                                                                    selectMultiple={true}
                                                                    group={true}
                                                                    groupLabel="&nbsp;"
                                                                    inputClass="mobiscrollCustomMultiInput"
                                                                    placeholder="Select"
                                                                    touchUi={true}
                                                                    // minWidth={[60, 320]}
                                                                    value={selected}
                                                                    data={options}
                                                                    onChange={(val: any) => {
                                                                        setSelected(val.value)
                                                                    }}
                                                                    responsive={{
                                                                        small: {
                                                                            display: 'bubble'
                                                                        },
                                                                        medium: {
                                                                            touchUi: false,
                                                                        }
                                                                    }}
                                                                    minWidth={[60, 320]}
                                                                // minWidth={[60, 320]}
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
                                                                backgroundColor: '#3289D0',
                                                                paddingHorizontal: 20,
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
                                                        props.showDirectory ?
                                                            <View style={{
                                                                flex: 1, width: '100%',
                                                                // borderWidth: 2,
                                                                // borderRightWidth: 0,
                                                                // borderLeftWidth: 0,
                                                                borderRadius: 1,
                                                                borderColor: '#E7EBEE',
                                                                overflow: 'hidden',
                                                                // marginTop: 20
                                                            }}>
                                                                <ScrollView contentContainerStyle={{
                                                                    maxHeight: width < 1024 ? windowHeight - 104 - 110 : windowHeight - 52 - 110,
                                                                    width: '100%',
                                                                    borderRadius: 1,
                                                                    marginTop: 10
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
                                                                                    backgroundColor: '#fff',
                                                                                    flexDirection: 'row',
                                                                                    borderColor: '#E7EBEE',
                                                                                    paddingVertical: 5,
                                                                                    borderBottomWidth: ind === sectionFiltered.length - 1 ? 0 : 1,
                                                                                    width: '100%'
                                                                                }}>
                                                                                <View style={{ backgroundColor: '#fff', padding: 5, }}>
                                                                                    <Image
                                                                                        style={{
                                                                                            height: 35,
                                                                                            width: 35,
                                                                                            marginTop: 5,
                                                                                            marginLeft: 5,
                                                                                            marginBottom: 5,
                                                                                            borderRadius: 75,
                                                                                            // marginTop: 20,
                                                                                            alignSelf: 'center'
                                                                                        }}
                                                                                        source={{ uri: user.avatar ? user.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                                                    />
                                                                                </View>
                                                                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                                    <Text style={{ fontSize: 15, padding: 5, fontFamily: 'inter', marginTop: 5 }} ellipsizeMode='tail'>
                                                                                        {user.fullName}
                                                                                    </Text>
                                                                                    <Text style={{ fontSize: 12, padding: 5 }} ellipsizeMode='tail'>
                                                                                        {user.email}
                                                                                    </Text>
                                                                                </View>
                                                                                <View style={{ backgroundColor: '#fff', padding: 0, flexDirection: 'row', alignSelf: 'center', alignItems: 'center' }} >
                                                                                    <Text style={{ fontSize: 13, padding: 5, lineHeight: 13 }} ellipsizeMode='tail'>
                                                                                        <Ionicons name='chatbubble-ellipses-outline' size={19} color='#3289D0' />
                                                                                    </Text>
                                                                                </View>
                                                                            </TouchableOpacity>
                                                                        })
                                                                    }
                                                                </ScrollView>
                                                            </View>
                                                            :
                                                            <View style={{ backgroundColor: '#fff' }}>
                                                                <ScrollView
                                                                    showsVerticalScrollIndicator={false}
                                                                    horizontal={false}
                                                                    // style={{ height: '100%' }}
                                                                    contentContainerStyle={{
                                                                        // borderWidth: 2,
                                                                        // borderRightWidth: 0,
                                                                        // borderLeftWidth: 0,
                                                                        borderColor: '#E7EBEE',
                                                                        borderRadius: 1,
                                                                        width: '100%',
                                                                        maxHeight: width < 1024 ? windowHeight - 104 : windowHeight - 52,
                                                                        // overflow: 'hidden'
                                                                    }}
                                                                >
                                                                    {
                                                                        sortChatsByLastMessage.map((chat: any, index) => {

                                                                            console.log("Chat", chat);

                                                                            // Group name or individual user name
                                                                            let fName = ''

                                                                            if (chat.name && chat.name !== '') {
                                                                                fName = chat.name
                                                                            } else {
                                                                                chat.userNames.map((user: any) => {

                                                                                    if (user._id !== userId) {
                                                                                        fName = user.fullName
                                                                                        return;
                                                                                    }
                                                                                })
                                                                            }

                                                                            const chatImg = chat.name && chat.name !== "" ? (chat.image ? chat.image : "https://cues-files.s3.amazonaws.com/images/default.png") : (chat.users[0] === userId ? chat.userNames[1] : chat.userNames[0]).avatar ? (chat.users[0] === userId ? chat.userNames[1] : chat.userNames[0]).avatar : 'https://cues-files.s3.amazonaws.com/images/default.png'

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
                                                                                        borderColor: '#E7EBEE',
                                                                                        paddingVertical: 5,
                                                                                        borderBottomWidth: index === chats.length - 1 ? 0 : 1,
                                                                                        // minWidth: 600, // flex: 1,
                                                                                        width: '100%'
                                                                                    }}>
                                                                                    <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                                                                        <Image
                                                                                            style={{
                                                                                                height: 35,
                                                                                                width: 35,
                                                                                                marginTop: 5,
                                                                                                marginLeft: 5,
                                                                                                marginBottom: 5,
                                                                                                borderRadius: 75,
                                                                                                // marginTop: 20,
                                                                                                alignSelf: 'center'
                                                                                            }}
                                                                                            source={{ uri: chatImg }}
                                                                                        />
                                                                                    </View>
                                                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                                        <Text style={{ fontSize: 15, padding: 5, fontFamily: 'inter', marginTop: 5 }} ellipsizeMode='tail'>
                                                                                            {fName}
                                                                                        </Text>
                                                                                        <Text style={{ fontSize: 12, padding: 5 }} ellipsizeMode='tail'>
                                                                                            {title}
                                                                                        </Text>
                                                                                    </View>
                                                                                    <View style={{ backgroundColor: '#fff', padding: 0, flexDirection: 'row', alignSelf: 'center', alignItems: 'center' }} >
                                                                                        {/* Unread notification badge */}
                                                                                        {chat.unreadMessages > 0 ? <View style={{
                                                                                            width: 16,
                                                                                            height: 16,
                                                                                            borderRadius: 8,
                                                                                            marginRight: 5,
                                                                                            backgroundColor: "#3289D0",
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center'
                                                                                        }}>
                                                                                            <Text style={{ color: 'white', fontSize: 10 }}>
                                                                                                {chat.unreadMessages}
                                                                                            </Text>
                                                                                        </View> : null}

                                                                                        <Text style={{ fontSize: 12, padding: 5, lineHeight: 13, color: chat.unreadMessages > 0 ? "#3289D0" : '#16181C' }} ellipsizeMode='tail'>
                                                                                            {emailTimeDisplay(chat.lastMessageTime)}
                                                                                        </Text>
                                                                                        <Text style={{ fontSize: 13, padding: 5, lineHeight: 13 }} ellipsizeMode='tail'>
                                                                                            <Ionicons name='chevron-forward-outline' size={19} color='#3289D0' />
                                                                                        </Text>
                                                                                    </View>
                                                                                </TouchableOpacity>
                                                                            )
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