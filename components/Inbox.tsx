// REACT
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    Linking,
    ScrollView,
    TextInput as DefaultTextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getAllUsers,
    getChats,
    getMessages,
    markMessagesAsRead,
    sendMessage,
    updateGroup,
    getGroup,
    startInstantMeetingInbox,
    searchMessages,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { Text, TouchableOpacity, View } from './Themed';
import alert from '../components/Alert';
import FileUpload from './UploadFiles';
import { Select } from '@mobiscroll/react';
import { TextInput } from './CustomTextInput';
import ReactPlayer from 'react-player';
import { GiftedChat, Bubble, MessageText, Message, Send } from 'react-native-gifted-chat';
import { Popup, Datepicker } from '@mobiscroll/react5';
import { disableEmailId, zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';
import Highlighter from 'react-highlight-words';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';

const Inbox: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [loadingChats, setLoadingChats] = useState(true);
    const [chats, setChats] = useState<any[]>([]);
    const [userId, setUserId] = useState(props.userId);
    const [avatar, setAvatar] = useState('');
    const [chat, setChat] = useState<any[]>([]);
    const [showChat, setShowChat] = useState(false);
    const [users, setUsers] = useState<any>([]);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [chatUsers, setChatUsers] = useState<any[]>([]);
    const [groupId, setGroupId] = useState('');
    const [chatName, setChatName] = useState('');
    const [chatImg, setChatImg] = useState('');
    const [isChatGroup, setIsChatGroup] = useState(false);
    const [viewGroup, setViewGroup] = useState(false);
    const [groupUsers, setGroupUsers] = useState<any[]>([]);
    const [groupCreatedBy, setGroupCreatedBy] = useState('');
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupImage, setEditGroupImage] = useState('');
    const [filterChannelId, setFilterChannelId] = useState('All');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupImage, setNewGroupImage] = useState(undefined);
    const [creatingMessage, setCreatingMessage] = useState(false);
    const [selected, setSelected] = useState<any[]>([]);
    const [showInstantMeeting, setShowInstantMeeting] = useState(false);
    const [instantMeetingTitle, setInstantMeetingTitle] = useState<any>('');
    const [userZoomInfo, setUserZoomInfo] = useState<any>('');
    const [meetingProvider, setMeetingProvider] = useState('');
    const [instantMeetingEnd, setInstantMeetingEnd] = useState<any>('');
    const [instantMeetingNewChat, setInstantMeetingNewChat] = useState(false);
    const [instantMeetingNewUserId, setInstantMeetingNewUserId] = useState('');
    const [instantMeetingNewChatGroupId, setInstantMeetingNewChatGroupId] = useState('');
    const [instantMeetingNewChatUsername, setInstantMeetingNewChatUsername] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const width = Dimensions.get('window').width;
    let options = users.map((sub: any) => {
        return {
            value: sub._id,
            text: sub.fullName,
            group: sub.fullName[0].toUpperCase(),
        };
    });
    options = options.sort((a: any, b: any) => {
        if (a.group < b.group) {
            return -1;
        }
        if (a.group > b.group) {
            return 1;
        }
        return 0;
    });
    let channelOptions = [{ value: 'All', text: 'All' }];
    props.subscriptions.map((subscription: any) => {
        channelOptions.push({
            value: subscription.channelId,
            text: subscription.channelName,
        });
    });
    const sortChatsByLastMessage = chats.sort((a: any, b: any) => {
        return new Date(a.lastMessageTime) > new Date(b.lastMessageTime) ? -1 : 1;
    });
    const windowHeight =
        Dimensions.get('window').width < 768 ? Dimensions.get('window').height : Dimensions.get('window').height;

    // ALERTS
    const unableToPostAlert = PreferredLanguageText('unableToPost');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    // HOOKS

    /**
     * @description Loads Users and Chats on Init
     */
    useEffect(() => {
        loadUsers();
        loadChats();
    }, []);

    useEffect(() => {
        if (searchTerm === '') {
            setSearchResults([]);
            return;
        }
        (async () => {
            setIsSearching(true);
            const server = fetchAPI('');
            server
                .query({
                    query: searchMessages,
                    variables: {
                        term: searchTerm,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.message.searchMessages) {
                        const data = JSON.parse(res.data.message.searchMessages);
                        const results = data['messages'];
                        setSearchResults(results);
                        setIsSearching(false);
                    }
                })
                .catch((err) => {
                    console.log('Error', err);
                    setSearchResults([]);
                    setIsSearching(false);
                });
        })();
    }, [searchTerm, userId]);

    /**
     * @description Opens a chat if "openChat" value set in AsyncStorage. Used to open a specific message from Search
     */
    useEffect(() => {
        (async () => {
            const openChat = await AsyncStorage.getItem('openChat');

            if (openChat && chats.length !== 0) {
                const parseChat: any = JSON.parse(openChat);

                await AsyncStorage.removeItem('openChat');

                if (parseChat.users && parseChat.users.length > 2) {
                    loadGroupChat(parseChat.users, parseChat._id);
                } else {
                    loadChat(parseChat.users[0] === userId ? parseChat.users[1] : parseChat.users[0], parseChat._id);
                }
            } else if (Dimensions.get('window').width >= 768 && chats.length !== 0 && !props.showDirectory) {
                // Set the first chat as default if not mobile view and not view directory
                const firstChat = chats[0];

                if (firstChat.users && firstChat.users.length > 2) {
                    loadGroupChat(firstChat.users, firstChat._id);
                } else {
                    loadChat(firstChat.users[0] === userId ? firstChat.users[1] : firstChat.users[0], firstChat._id);
                }
            }
        })();
    }, [chats, props.showDirectory]);

    /**
     * @description Fetch meeting provider for org
     */
    useEffect(() => {
        (async () => {
            const org = await AsyncStorage.getItem('school');

            if (org) {
                const school = JSON.parse(org);

                setMeetingProvider(school.meetingProvider ? school.meetingProvider : '');
            }
        })();
    }, []);

    /**
     * @description Loads all the users to show in Directory
     */
    const loadUsers = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        let server: any = null;
        let user: any = {};
        if (u) {
            user = JSON.parse(u);
            server = fetchAPI(user._id);
            setUserId(user._id);
            if (user.avatar) {
                setAvatar(user.avatar);
            } else {
                setAvatar('https://cues-files.s3.amazonaws.com/images/default.png');
            }

            if (user.zoomInfo) {
                setUserZoomInfo(user.zoomInfo);
            }
        } else {
            return;
        }
        setLoadingSubs(true);
        server
            .query({
                query: getAllUsers,
                variables: {
                    userId: user._id,
                },
            })
            .then((res: any) => {
                if (res.data.user && res.data.user.getAllUsers) {
                    const sortedUsers = res.data.user.getAllUsers.sort((a: any, b: any) => {
                        if (a.fullName < b.fullName) {
                            return -1;
                        }
                        if (a.fullName > b.fullName) {
                            return 1;
                        }
                        return 0;
                    });
                    setUsers(sortedUsers);
                }
                setLoadingSubs(false);
            })
            .catch((err: any) => {
                Alert('Unable to load subscribers.', 'Check connection.');
                setLoadingSubs(false);
            });
    }, []);

    /**
     * @description Loads all the chat threads for user
     */
    const loadChats = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');

        let server: any = null;
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
            server = fetchAPI(parsedUser._id);
        } else {
            return;
        }
        setLoadingChats(true);
        server
            .query({
                query: getChats,
                variables: {
                    userId: parsedUser._id,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.group.getChats) {
                    setChats(res.data.group.getChats.reverse());
                    props.hideNewChatButton(false);
                    setShowNewGroup(false);
                    setLoadingChats(false);

                    // Load default chat if not opening from search or not loading directory or not Mobile view
                    // if (!init || Dimensions.get('window').width < 768) {
                    //     setShowChat(false);
                    //     return;
                    // }

                    // if (!openChatAsyncStorage && res.data.group.getChats.length > 0) {
                    //     const chat = res.data.group.getChats[0];

                    //     console.log('First Chat', chat);

                    //     if (chat.userNames.length > 2) {
                    //         loadGroupChat(chat.users, chat._id);
                    //         setGroupCreatedBy(chat.createdBy);
                    //         setGroupUsers(chat.userNames);
                    //         setEditGroupName(chat.name);
                    //         setEditGroupImage(chat.image ? chat.image : undefined);
                    //         setChatName(chat.name);
                    //         setChatImg(
                    //             chat.image ? chat.image : 'https://cues-files.s3.amazonaws.com/images/default.png'
                    //         );
                    //     } else {
                    //         chat.userNames.map((user: any) => {
                    //             if (user._id !== parsedUser._id) {
                    //                 setChatName(user.fullName);
                    //                 const chatImg =
                    //                     user.avatar && user.avatar !== ''
                    //                         ? user.avatar
                    //                         : 'https://cues-files.s3.amazonaws.com/images/default.png';
                    //                 setChatImg(chatImg);
                    //                 return;
                    //             }
                    //         });

                    //         loadChat(chat.users[0] === parsedUser._id ? chat.users[1] : chat.users[0], chat._id);
                    //     }
                    // }
                }
            })
            .catch((err: any) => {
                console.log(err);
                setLoadingChats(false);
            });
    }, [userId]);

    /**
     * @description Used to open a group chat on Select
     */
    const loadGroupChat = useCallback(
        async (groupUsers, groupId) => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const parsedUser = JSON.parse(u);
                setChatUsers(groupUsers);
                setGroupId(groupId);
                setIsChatGroup(true);
                setShowNewGroup(false);
                setViewGroup(false);

                // Set current chat name and image
                chats.map((c: any) => {
                    if (c._id === groupId) {
                        setGroupCreatedBy(c.createdBy);
                        setGroupUsers(c.userNames);
                        setEditGroupName(c.name);
                        setEditGroupImage(c.image ? c.image : undefined);
                        setChatName(c.name);
                        setChatImg(c.image ? c.image : 'https://cues-files.s3.amazonaws.com/images/default.png');
                    }
                });

                loadMessagesForChat(groupId, parsedUser._id);

                const server = fetchAPI(parsedUser._id);
                // mark as read here
                server
                    .mutate({
                        mutation: markMessagesAsRead,
                        variables: {
                            userId: parsedUser._id,
                            groupId,
                        },
                    })
                    .then((res) => console.log(res))
                    .catch((e) => console.log(e));
            }
        },
        [chats, userId]
    );

    /**
     * @description Used to create a group
     */
    const createGroup = useCallback(async () => {
        if (selected.length === 0) {
            alert('Select users.');
            return;
        }

        const server = fetchAPI('');
        server
            .mutate({
                mutation: sendMessage,
                variables: {
                    users: [userId, ...selected],
                    message: 'New Group Created',
                    userId,
                    groupName: newGroupName,
                    groupImage: newGroupImage,
                },
            })
            .then((res) => {
                setSelected([]);
                setNewGroupName('');
                setNewGroupImage(undefined);

                if (res.data.message.createDirect) {
                    loadChats();
                    setShowNewGroup(false);
                    props.setShowDirectory(false);
                } else {
                    Alert(unableToPostAlert, checkConnectionAlert);
                }
            })
            .catch((err) => {
                Alert(somethingWentWrongAlert, checkConnectionAlert);
            });
    }, [selected, userId, newGroupName, newGroupImage]);

    /**
     * @description Used to update Group Chat info and users in Inbox
     */
    const handleUpdateGroup = useCallback(async () => {
        if (chatUsers.length < 2) {
            Alert('Group must have at least 2 users');
        }

        if (editGroupName === '') {
            Alert('Enter group name');
            return;
        }

        const server = fetchAPI('');

        server
            .mutate({
                mutation: updateGroup,
                variables: {
                    groupId,
                    users: [userId, ...chatUsers],
                    groupName: editGroupName,
                    groupImage: editGroupImage,
                },
            })
            .then((res) => {
                setNewGroupName('');
                setNewGroupImage(undefined);
                setViewGroup(false);

                if (res.data.message.updateGroup) {
                    Alert('Updated group successfully.');
                    loadChats();
                } else {
                    Alert('Could not update group. Try again.');
                }
            })
            .catch((err) => {
                // setSendingThread(false)
                Alert('Could not update group. Try again.');
            });
    }, [groupId, editGroupName, editGroupImage, chatUsers]);

    /**
     * @description Handles sending of a message
     */
    const onSend = useCallback(
        async (messages = []) => {
            if (creatingMessage) return;

            const message =
                messages[0].file || messages[0].image || messages[0].audio || messages[0].video
                    ? messages[0].saveCue
                    : messages[0].text;
            const u: any = await AsyncStorage.getItem('user');
            if (!message || message === '' || !u) {
                return;
            }
            if (message.replace(/\&nbsp;/g, '').replace(/\s/g, '') === '<div></div>') {
                return;
            }
            const user = JSON.parse(u);

            messages[0] = {
                ...messages[0],
                user: {
                    _id: userId,
                },
            };

            setCreatingMessage(true);

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: sendMessage,
                    variables: {
                        users: chatUsers,
                        message,
                        userId,
                        groupId,
                    },
                })
                .then(async (res) => {
                    if (res.data.message.createDirect) {
                        // Add a dummy _id to the message for now
                        messages[0] = {
                            ...messages[0],
                            _id: Math.random().toString(),
                        };

                        setChat((previousMessages) => GiftedChat.append(previousMessages, messages));

                        if (!groupId || groupId === '') {
                            const res = await server.query({
                                query: getGroup,
                                variables: {
                                    users: chatUsers,
                                },
                            });

                            console.log('New group id', res.data.message.getGroupId);

                            if (res && res.data.message.getGroupId && res.data.message.getGroupId !== '') {
                                setGroupId(res.data.message.getGroupId);
                            }
                        }

                        setCreatingMessage(false);
                    } else {
                        Alert(unableToPostAlert, checkConnectionAlert);
                        setCreatingMessage(false);
                    }
                })
                .catch((err) => {
                    // setSendingThread(false)
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                    setCreatingMessage(false);
                });
        },
        [chatUsers, userId, groupId, creatingMessage]
    );

    /**
     * @description Loads chat on Select
     */
    const loadChat = useCallback(
        async (uId, groupId) => {
            setChat([]);
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const parsedUser = JSON.parse(u);
                setChatUsers([parsedUser._id, uId]);
                setGroupId(groupId);
                setIsChatGroup(false);
                setShowNewGroup(false);
                setViewGroup(false);
                // Set current chat name and image
                chats.map((chat: any) => {
                    if (chat._id === groupId) {
                        // Group name or individual user name
                        let fName = '';

                        chat.userNames.map((user: any) => {
                            if (user._id !== parsedUser._id) {
                                fName = user.fullName;
                                return;
                            }
                        });

                        setChatName(fName);

                        // Find the chat avatar
                        const otherUser = chat.userNames.find((user: any) => {
                            return user._id !== parsedUser._id;
                        });

                        const chatImg =
                            chat.name && chat.name !== ''
                                ? chat.image
                                    ? chat.image
                                    : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                : otherUser.avatar && otherUser.avatar !== ''
                                ? otherUser.avatar
                                : 'https://cues-files.s3.amazonaws.com/images/default.png';

                        setChatImg(chatImg);
                    }
                });

                loadMessagesForChat(groupId, parsedUser._id);

                const server = fetchAPI(parsedUser._id);
                // mark chat as read here
                server
                    .mutate({
                        mutation: markMessagesAsRead,
                        variables: {
                            userId: parsedUser._id,
                            groupId,
                        },
                    })
                    .then((res) => {
                        // props.refreshUnreadMessagesCount()
                    })
                    .catch((e) => console.log(e));
            }
        },
        [chats, userId]
    );

    /**
     * @description Loads a new chat with a user when selected from Directory
     */
    const loadNewChat = useCallback(
        async (uId) => {
            setChat([]);
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const parsedUser = JSON.parse(u);
                setChatUsers([parsedUser._id, uId]);
                setIsChatGroup(false);
                setShowNewGroup(false);
                setViewGroup(false);
                // Set chat name and image

                // Group name or individual user name
                let fName = '';
                let img = 'https://cues-files.s3.amazonaws.com/images/default.png';

                users.map((user: any) => {
                    if (user._id === uId) {
                        fName = user.fullName;
                        if (user.avatar) {
                            img = user.avatar;
                        }
                        return;
                    }
                });

                setChatName(fName);
                setChatImg(img);
                setGroupId('');

                const server = fetchAPI('');

                // First load the group if there is one

                const res = await server.query({
                    query: getGroup,
                    variables: {
                        users: [parsedUser._id, uId],
                    },
                });

                // Completely new chat so no need to fetch messages
                if (!res || !res.data.message.getGroupId || res.data.message.getGroupId === '') {
                    setShowChat(true);
                    props.hideNewChatButton(true);
                    return;
                }

                setGroupId(res.data.message.getGroupId);

                loadMessagesForChat(res.data.message.getGroupId, parsedUser._id);
            }
        },
        [users, userId]
    );

    const loadMessagesForChat = useCallback((groupId: string, userId: string) => {
        const server = fetchAPI(userId);

        server
            .query({
                query: getMessages,
                variables: {
                    groupId,
                },
            })
            .then((res) => {
                const tempChat: any[] = [];
                res.data.message.getMessagesThread.map((msg: any) => {
                    let text: any = '';
                    let img: any = '';
                    let audio: any = '';
                    let video: any = '';
                    if (msg.message[0] === '{' && msg.message[msg.message.length - 1] === '}') {
                        const obj = JSON.parse(msg.message);
                        const { type, url } = obj;
                        if (type === 'png' || type === 'jpeg' || type === 'jpg' || type === 'gif') {
                            img = url;
                        } else if (type === 'mp3' || type === 'wav' || type === 'mp2') {
                            audio = url;
                        } else if (type === 'mp4' || type === 'oga' || type === 'mov' || type === 'wmv') {
                            video = url;
                        } else if (type === 'meeting_link') {
                            text = (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textDecorationLine: 'underline',
                                            backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                            color: msg.sentBy !== userId ? '#000' : '#fff',
                                        }}
                                        onPress={() => {
                                            if (
                                                Platform.OS === 'web' ||
                                                Platform.OS === 'macos' ||
                                                Platform.OS === 'windows'
                                            ) {
                                                window.open(url, '_blank');
                                            } else {
                                                Linking.openURL(url);
                                            }
                                        }}
                                    >
                                        {obj.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        } else {
                            text = (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textDecorationLine: 'underline',
                                            backgroundColor: msg.sentBy !== userId ? '#f2f2f2' : '#007AFF',
                                            color: msg.sentBy !== userId ? '#000' : '#fff',
                                        }}
                                        onPress={() => {
                                            if (
                                                Platform.OS === 'web' ||
                                                Platform.OS === 'macos' ||
                                                Platform.OS === 'windows'
                                            ) {
                                                window.open(url, '_blank');
                                            } else {
                                                Linking.openURL(url);
                                            }
                                        }}
                                    >
                                        {obj.title + '.' + obj.type}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }
                    } else {
                        const { title: t, subtitle: s } = htmlStringParser(msg.message);
                        text = t;
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
                    });
                });
                tempChat.reverse();
                setChat(tempChat);
                setShowChat(true);
                props.hideNewChatButton(true);
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    // FUNCTIONS

    /**
     * @description Customize message bubble background color
     */
    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#007AFF',
                    },
                }}
            />
        );
    };

    const renderActions = () => {
        return (
            <View
                style={{
                    marginTop: -10,
                    paddingLeft: 10,
                }}
                key={groupId + userId + chatUsers.toString() + creatingMessage.toString()}
            >
                <FileUpload
                    chat={true}
                    onUpload={(u: any, t: any) => {
                        const title = prompt('Enter title and click on OK to share.');
                        if (!title || title === '') return;

                        let text: any = '';
                        let img: any = '';
                        let audio: any = '';
                        let video: any = '';
                        let file: any = '';

                        if (t === 'png' || t === 'jpeg' || t === 'jpg' || t === 'gif') {
                            img = u;
                        } else if (t === 'mp3' || t === 'wav' || t === 'mp2') {
                            audio = u;
                        } else if (t === 'mp4' || t === 'oga' || t === 'mov' || t === 'wmv') {
                            video = u;
                        } else {
                            file = u;
                            text = (
                                <TouchableOpacity
                                    onPress={() => {
                                        if (
                                            Platform.OS === 'web' ||
                                            Platform.OS === 'macos' ||
                                            Platform.OS === 'windows'
                                        ) {
                                            window.open(u, '_blank');
                                        } else {
                                            Linking.openURL(u);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#000',
                                        borderRadius: 15,
                                        marginLeft: 15,
                                        marginTop: 6,
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: 'white',
                                            fontSize: 13,
                                            borderWidth: 1,
                                            borderColor: '#000',
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 36,
                                            borderRadius: 15,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }

                        const obj = { title, type: t, url: u };

                        onSend([
                            {
                                title,
                                text,
                                image: img,
                                audio,
                                video,
                                file,
                                saveCue: JSON.stringify(obj),
                            },
                        ]);
                    }}
                />
            </View>
        );
    };

    /**
     * @description render custom font size
     */
    const renderMessageText = (props: any) => {
        return (
            <MessageText
                {...props}
                customTextStyle={{ fontSize: 15, lineHeight: 14, paddingHorizontal: 0, marginHorizontal: 10 }}
            />
        );
    };

    /**
     * @description Customize how Audio message appears
     */
    const renderMessageAudio = (props: any) => {
        if (props.currentMessage.audio && props.currentMessage.audio !== '') {
            return (
                <View>
                    <ReactPlayer
                        url={props.currentMessage.audio}
                        controls={true}
                        onContextMenu={(e: any) => e.preventDefault()}
                        config={{
                            file: { attributes: { controlsList: 'nodownload' } },
                        }}
                        width={250}
                        height={60}
                    />
                </View>
            );
        }

        return null;
    };

    /**
     * @description Customize how Video Message appears
     */
    const renderMessageVideo = (props: any) => {
        if (props.currentMessage.video && props.currentMessage.video !== '') {
            return (
                <View>
                    <ReactPlayer
                        url={props.currentMessage.video}
                        controls={true}
                        onContextMenu={(e: any) => e.preventDefault()}
                        config={{
                            file: { attributes: { controlsList: 'nodownload' } },
                        }}
                        width={250}
                        height={200}
                    />
                </View>
            );
        }

        return null;
    };

    /**
     * @description Displays time in email format similar to GMAIL
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

    const startInstantMeeting = useCallback(() => {
        if (userZoomInfo || (meetingProvider && meetingProvider !== '')) {
            const current = new Date();
            setInstantMeetingEnd(new Date(current.getTime() + 1000 * 40 * 60));
            setShowInstantMeeting(true);
        } else {
            Alert(
                'You must connect your account with Zoom to start a meeting.',
                'Would you like to proceed to setup?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            return;
                        },
                    },
                    {
                        text: 'Yes',
                        onPress: () => {
                            // ZOOM OATH

                            const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                                zoomRedirectUri
                            )}&state=${userId}`;

                            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                Linking.openURL(url);
                            } else {
                                window.open(url, '_blank');
                            }
                        },
                    },
                ]
            );
        }
    }, [userZoomInfo, meetingProvider]);

    const startInstantMeetingNewChat = useCallback(
        async (newUserId: string, newUsername: string) => {
            if (userZoomInfo) {
                const current = new Date();
                setInstantMeetingEnd(new Date(current.getTime() + 1000 * 40 * 60));
                setShowInstantMeeting(true);
                setInstantMeetingNewChat(true);
                setInstantMeetingNewUserId(newUserId);
                setInstantMeetingNewChatUsername(newUsername);

                const server = fetchAPI('');

                // First load the group if there is one
                const res = await server.query({
                    query: getGroup,
                    variables: {
                        users: [newUserId, userId],
                    },
                });

                if (res && res.data.message.getGroupId && res.data.message.getGroupId === '') {
                    setInstantMeetingNewChatGroupId(res.data.message.getGroupId);
                }
            } else {
                Alert(
                    'You must connect your account with Zoom to start a meeting.',
                    'Would you like to proceed to setup?',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => {
                                return;
                            },
                        },
                        {
                            text: 'Yes',
                            onPress: () => {
                                // ZOOM OATH

                                const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                                    zoomRedirectUri
                                )}&state=${userId}`;

                                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                                    Linking.openURL(url);
                                } else {
                                    window.open(url, '_blank');
                                }
                            },
                        },
                    ]
                );
            }
        },
        [userZoomInfo, meetingProvider, userId]
    );

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const createInstantMeetingNewChat = useCallback(async () => {
        const startDate = new Date();

        const server = fetchAPI('');
        server
            .mutate({
                mutation: startInstantMeetingInbox,
                variables: {
                    userId,
                    topic: instantMeetingTitle,
                    start: startDate.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    groupId: instantMeetingNewChatGroupId,
                    users: [userId, instantMeetingNewUserId],
                },
            })
            .then((res) => {
                if (res.data && res.data.message.startInstantMeetingInbox !== 'error') {
                    loadNewChat(instantMeetingNewUserId);

                    setShowInstantMeeting(false);
                    setInstantMeetingTitle('');
                    setInstantMeetingEnd('');
                    setInstantMeetingNewChat(false);
                    setInstantMeetingNewUserId('');
                    setInstantMeetingNewChatGroupId('');
                    setInstantMeetingNewChatUsername('');

                    window.open(res.data.message.startInstantMeetingInbox, '_blank');
                } else {
                    Alert('Something went wrong. Try again.');
                }
            })
            .catch((err) => {
                Alert('Something went wrong.');
            });
    }, [instantMeetingNewUserId, userId, instantMeetingNewChatGroupId, instantMeetingTitle, instantMeetingEnd]);

    const createInstantMeeting = useCallback(() => {
        const startDate = new Date();

        const server = fetchAPI('');
        server
            .mutate({
                mutation: startInstantMeetingInbox,
                variables: {
                    userId,
                    topic: instantMeetingTitle,
                    start: startDate.toUTCString(),
                    end: instantMeetingEnd.toUTCString(),
                    groupId,
                    users: chatUsers,
                },
            })
            .then((res) => {
                if (res.data && res.data.message.startInstantMeetingInbox !== 'error') {
                    setShowInstantMeeting(false);
                    setInstantMeetingTitle('');
                    setInstantMeetingEnd('');

                    window.open(res.data.message.startInstantMeetingInbox, '_blank');
                } else {
                    Alert('Something went wrong. Try again.');
                }
            })
            .catch((err) => {
                Alert('Something went wrong.');
            });
    }, [chatUsers, userId, groupId, instantMeetingTitle, instantMeetingEnd]);

    const renderInstantMeetingPopup = () => {
        return (
            <Popup
                isOpen={showInstantMeeting}
                buttons={[
                    {
                        text: 'Start',
                        color: 'dark',
                        handler: function (event) {
                            if (instantMeetingNewChat) {
                                createInstantMeetingNewChat();
                            } else {
                                createInstantMeeting();
                            }
                        },
                        disabled: props.user.email === disableEmailId,
                    },
                    {
                        text: 'Cancel',
                        color: 'dark',
                        handler: function (event) {
                            setShowInstantMeeting(false);
                            setInstantMeetingTitle('');
                            setInstantMeetingEnd('');
                            setInstantMeetingNewChat(false);
                            setInstantMeetingNewChatGroupId('');
                            setInstantMeetingNewUserId('');
                            setInstantMeetingNewChatUsername('');
                        },
                    },
                ]}
                theme="ios"
                themeVariant="light"
                onClose={() => {
                    setShowInstantMeeting(false);
                }}
                responsive={{
                    small: {
                        display: 'bottom',
                    },
                    medium: {
                        // Custom breakpoint
                        display: 'center',
                    },
                }}
            >
                <View
                    style={{
                        flexDirection: 'column',
                        paddingHorizontal: Dimensions.get('window').width >= 768 ? 25 : 0,
                        backgroundColor: '#f8f8f8',
                    }}
                    className="mbsc-align-center mbsc-padding"
                >
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        indicatorStyle="black"
                        horizontal={false}
                        contentContainerStyle={{
                            width: '100%',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                paddingHorizontal: 20,
                                marginVertical: 20,
                                minWidth: Dimensions.get('window').width >= 768 ? 400 : 200,
                                maxWidth: Dimensions.get('window').width >= 768 ? 400 : 300,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'inter',
                                    marginBottom: 20,
                                }}
                            >
                                Start meeting with {instantMeetingNewChat ? instantMeetingNewChatUsername : chatName}
                            </Text>

                            <View style={{ width: '100%', maxWidth: 400, marginTop: 20, backgroundColor: '#f8f8f8' }}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    Topic
                                </Text>
                                <View
                                    style={{
                                        marginTop: 10,
                                        marginBottom: 10,
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <TextInput
                                        style={{
                                            padding: 10,
                                            fontSize: 15,
                                            backgroundColor: '#ffffff',
                                            borderColor: '#cccccc',
                                            borderWidth: 1,
                                            borderRadius: 2,
                                        }}
                                        value={instantMeetingTitle}
                                        placeholder={''}
                                        onChangeText={(val) => setInstantMeetingTitle(val)}
                                        placeholderTextColor={'#1F1F1F'}
                                        // required={true}
                                    />
                                </View>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    maxWidth: 400,
                                    // paddingVertical: 15,
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    {PreferredLanguageText('end')}
                                </Text>
                                <View style={{ marginTop: 10, marginBottom: 10 }}>
                                    <Datepicker
                                        controls={['date', 'time']}
                                        touchUi={true}
                                        theme="ios"
                                        value={instantMeetingEnd}
                                        themeVariant="light"
                                        // inputComponent="input"
                                        inputProps={{
                                            placeholder: 'Select end...',
                                            backgroundColor: 'white',
                                        }}
                                        onChange={(event: any) => {
                                            const date = new Date(event.value);
                                            const roundOffDate = roundSeconds(date);
                                            setInstantMeetingEnd(roundOffDate);
                                        }}
                                        responsive={{
                                            xsmall: {
                                                controls: ['date', 'time'],
                                                display: 'bottom',
                                                touchUi: true,
                                            },
                                            medium: {
                                                controls: ['date', 'time'],
                                                display: 'anchored',
                                                touchUi: false,
                                            },
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Popup>
        );
    };

    const renderChat = () => {
        return (
            <View
                style={{
                    width: '100%',
                    height:
                        Dimensions.get('window').width < 768
                            ? windowHeight - (64 + 60) - 50
                            : // : Dimensions.get('window').width < 1024
                              // ? windowHeight - (64 + 68) - 50
                              windowHeight - 64 - 70,
                    borderColor: '#f2f2f2',
                }}
            >
                <GiftedChat
                    renderMessageAudio={renderMessageAudio}
                    renderMessageVideo={renderMessageVideo}
                    renderUsernameOnMessage={isChatGroup}
                    messages={chat}
                    onSend={(messages) => onSend(messages)}
                    renderSend={({ text, ...chatProps }) => {
                        return (
                            <Send
                                {...chatProps}
                                text={text}
                                disabled={text.trim() === '' || props.user.email === disableEmailId}
                            />
                        );
                    }}
                    user={{
                        _id: userId,
                        avatar,
                    }}
                    // showAvatarForEveryMessage={!isChatGroup}
                    // showUserAvatar={isChatGroup}
                    // renderMessage={renderMessage}
                    alwaysShowSend={true}
                    renderMessageText={renderMessageText}
                    renderBubble={renderBubble}
                    renderActions={renderActions}
                />
            </View>
        );
    };

    const renderCreateGroup = () => {
        return (
            <View>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode={'on-drag'}
                    style={{ flex: 1, paddingTop: 12 }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            marginTop: Dimensions.get('window').width < 768 ? 0 : 25,
                            // overflow: 'scroll',
                            marginBottom: 25,
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                paddingBottom: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                }}
                            >
                                New Group
                            </Text>
                        </View>
                        <View
                            style={{
                                width: '90%',
                                padding: 5,
                                maxWidth: 500,
                                minHeight: 200,
                                marginBottom: 15,
                            }}
                        >
                            <Image
                                style={{
                                    height: 100,
                                    width: 100,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{
                                    uri: newGroupImage
                                        ? newGroupImage
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                }}
                            />
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    paddingTop: 15,
                                }}
                            >
                                {newGroupImage ? (
                                    <TouchableOpacity
                                        onPress={() => setNewGroupImage(undefined)}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 36,
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                        }}
                                    >
                                        <Text>
                                            <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <FileUpload
                                        onUpload={(u: any, t: any) => {
                                            setNewGroupImage(u);
                                        }}
                                    />
                                )}
                            </View>

                            {/* Add group name here */}
                            <View style={{ backgroundColor: 'white' }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#000000',
                                    }}
                                >
                                    {PreferredLanguageText('name')}
                                </Text>
                                <TextInput
                                    value={newGroupName}
                                    placeholder={''}
                                    onChangeText={(val) => {
                                        setNewGroupName(val);
                                    }}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={true}
                                />
                            </View>

                            {/* Add group avatar here */}
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    marginBottom: 15,
                                }}
                            >
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
                                value={selected}
                                data={options}
                                onChange={(val: any) => {
                                    setSelected(val.value);
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble',
                                    },
                                    medium: {
                                        touchUi: false,
                                    },
                                }}
                                minWidth={[60, 320]}
                            />
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => createGroup()}
                        style={{
                            backgroundColor: 'white',
                            // overflow: 'hidden',
                            // height: 36,
                            justifyContent: 'center',
                            flexDirection: 'row',
                        }}
                        disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            CREATE
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    };

    const renderDirectory = () => {
        let filterSubscribedUsers = users;

        if (filterChannelId !== 'All') {
            filterSubscribedUsers = users.filter((user: any) => {
                const found = user.channelIds.find((id: any) => {
                    return id === filterChannelId;
                });

                if (found) return true;

                return false;
            });
        }

        return (
            <View
                style={{
                    flex: 1,
                    width: '100%',
                    borderRadius: 1,
                    borderColor: '#f2f2f2',
                    overflow: 'hidden',
                }}
            >
                <ScrollView
                    contentContainerStyle={{
                        maxHeight: width < 768 ? windowHeight - 180 : windowHeight - 64 - 60,
                        width: '100%',
                        borderRadius: 1,
                        marginTop: 10,
                        paddingHorizontal: 10,
                    }}
                >
                    {filterSubscribedUsers.length === 0 ? (
                        <View
                            style={{
                                padding: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontFamily: 'Inter',
                                    textAlign: 'center',
                                }}
                            >
                                No Users
                            </Text>
                        </View>
                    ) : null}
                    {filterSubscribedUsers.map((user: any, ind: any) => {
                        return (
                            <View
                                style={{
                                    width: '100%',
                                    borderBottomWidth: ind === users.length - 1 ? 0 : 1,
                                    paddingVertical: 5,
                                    backgroundColor: '#fff',
                                    borderColor: '#f2f2f2',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                                key={ind.toString()}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        loadNewChat(user._id);
                                    }}
                                    style={{
                                        backgroundColor: '#fff',
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                        <Image
                                            style={{
                                                height: 36,
                                                width: 36,
                                                marginTop: 5,
                                                marginLeft: 5,
                                                marginBottom: 5,
                                                borderRadius: 75,
                                                alignSelf: 'center',
                                            }}
                                            source={{
                                                uri: user.avatar
                                                    ? user.avatar
                                                    : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                            }}
                                        />
                                    </View>
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: '#fff',
                                            paddingLeft: 10,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                padding: 5,
                                                fontFamily: 'inter',
                                                marginTop: 5,
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {user.fullName}
                                        </Text>
                                        <Text style={{ fontSize: 14, padding: 5 }} ellipsizeMode="tail">
                                            {user.email}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        loadNewChat(user._id);
                                    }}
                                    style={{
                                        backgroundColor: '#fff',
                                    }}
                                >
                                    <View
                                        style={{
                                            backgroundColor: '#fff',
                                            padding: 0,
                                            flexDirection: 'row',
                                            alignSelf: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text
                                            style={{ fontSize: 14, padding: 10, lineHeight: 13 }}
                                            ellipsizeMode="tail"
                                        >
                                            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#000" />
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {meetingProvider && meetingProvider !== '' ? null : (
                                    <TouchableOpacity
                                        onPress={() => {
                                            // loadNewChat(user._id);
                                            startInstantMeetingNewChat(user._id, user.fullName);
                                        }}
                                        style={{
                                            backgroundColor: '#fff',
                                            marginRight: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                padding: 0,
                                                flexDirection: 'row',
                                                alignSelf: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{ fontSize: 14, padding: 10, lineHeight: 13 }}
                                                ellipsizeMode="tail"
                                            >
                                                <Ionicons name="videocam-outline" size={18} color="#000" />
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderChatsMobile = () => {
        return (
            <View style={{ backgroundColor: '#fff' }}>
                <View
                    style={{
                        paddingHorizontal: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <DefaultTextInput
                            value={searchTerm}
                            style={{
                                color: '#000',
                                backgroundColor: '#f2f2f2',
                                borderRadius: 15,
                                fontSize: 13,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                marginRight: 2,
                                width: '100%',
                            }}
                            autoCompleteType={'xyz'}
                            placeholder={'Search'}
                            onChangeText={(val) => setSearchTerm(val)}
                            placeholderTextColor={'#000'}
                        />
                    </View>
                    {searchTerm === '' ? null : (
                        <View
                            style={{
                                marginLeft: Dimensions.get('window').width < 768 ? 10 : 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchTerm('');
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    marginLeft: 'auto',
                                }}
                            >
                                <Ionicons name={'close-outline'} size={20} color={'#1f1f1f'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                <ScrollView
                    showsVerticalScrollIndicator={true}
                    indicatorStyle={'black'}
                    horizontal={false}
                    contentContainerStyle={{
                        borderColor: '#f2f2f2',
                        paddingHorizontal: 10,
                        borderRadius: 1,
                        width: '100%',
                        maxHeight: width < 768 ? windowHeight - (64 + 60 + 60) : windowHeight - 64,
                    }}
                >
                    {sortChatsByLastMessage.length === 0 ? (
                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#000',
                                    fontSize: 20,
                                    paddingVertical: 100,
                                    paddingHorizontal: 5,
                                    fontFamily: 'inter',
                                }}
                            >
                                Click on + to initiate a new chat.
                            </Text>
                        </View>
                    ) : null}
                    {isSearching ? null : searchTerm !== '' ? (
                        <View style={{}}>
                            {searchResults.length === 0 ? (
                                <View
                                    style={{
                                        padding: 20,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 20,
                                            fontFamily: 'Inter',
                                            textAlign: 'center',
                                        }}
                                    >
                                        No Results
                                    </Text>
                                </View>
                            ) : null}
                            {searchResults.map((obj: any, ind: number) => {
                                let t = '';
                                let s = '';
                                let messageSenderName = '';
                                let messageSenderAvatar = '';
                                let createdAt = '';

                                const users = obj.groupId.users;

                                const sender = users.filter((user: any) => user._id === obj.sentBy)[0];

                                if (obj.groupId && obj.groupId.name) {
                                    messageSenderName = obj.groupId.name + ' > ' + sender.fullName;
                                    messageSenderAvatar = obj.groupId.image
                                        ? obj.groupId.image
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                } else if (sender) {
                                    messageSenderName = sender.fullName;
                                    messageSenderAvatar = sender.avatar
                                        ? sender.avatar
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                }

                                if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                    const o = JSON.parse(obj.message);
                                    t = o.title;
                                    s = o.type;
                                } else {
                                    const { title, subtitle } = htmlStringParser(obj.message);
                                    t = title;
                                    s = subtitle;
                                }

                                createdAt = obj.sentAt;

                                return (
                                    <TouchableOpacity
                                        key={ind.toString()}
                                        onPress={() => {
                                            if (obj.groupId.users.length > 2) {
                                                loadGroupChat(obj.groupId.users, obj.groupId._id);
                                            } else {
                                                loadChat(
                                                    obj.groupId.users[0] === userId
                                                        ? obj.groupId.users[1]
                                                        : obj.groupId.users[0],
                                                    obj.groupId._id
                                                );
                                            }
                                        }}
                                        style={{
                                            backgroundColor: groupId === obj.groupId._id ? '#f8f8f8' : '#fff',
                                            flexDirection: 'row',
                                            width: '100%',
                                            borderRadius: 5,
                                            borderColor: '#f2f2f2',
                                            paddingVertical: 5,
                                            borderBottomWidth: ind === searchResults.length - 1 ? 0 : 1,
                                        }}
                                    >
                                        <View style={{ backgroundColor: 'none', padding: 5 }}>
                                            <Image
                                                style={{
                                                    height: 45,
                                                    width: 45,
                                                    marginTop: 5,
                                                    marginLeft: 5,
                                                    marginBottom: 5,
                                                    borderRadius: 75,
                                                    alignSelf: 'center',
                                                }}
                                                source={{ uri: messageSenderAvatar }}
                                            />
                                        </View>
                                        <View
                                            style={{
                                                flex: 1,
                                                backgroundColor: 'none',
                                                paddingLeft: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    padding: 5,
                                                    fontFamily: 'inter',
                                                    marginTop: 5,
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {messageSenderName}
                                            </Text>
                                            <Highlighter
                                                searchWords={[searchTerm]}
                                                autoEscape={true}
                                                textToHighlight={t}
                                                highlightStyle={{
                                                    backgroundColor: '#ffd54f',
                                                    fontFamily: 'overpass',
                                                    fontSize: 14,
                                                    color: '#1f1f1f',
                                                }}
                                                unhighlightStyle={{
                                                    fontFamily: 'overpass',
                                                    fontSize: 14,
                                                    color: '#1f1f1f',
                                                }}
                                            />
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                padding: 0,
                                                flexDirection: 'row',
                                                alignSelf: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    padding: 5,
                                                    lineHeight: 13,
                                                    color: '#000000',
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {fromNow(new Date(createdAt))}
                                            </Text>
                                            <Text
                                                style={{ fontSize: 14, padding: 5, lineHeight: 13 }}
                                                ellipsizeMode="tail"
                                            >
                                                <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        sortChatsByLastMessage.map((chat: any, index: number) => {
                            // Group name or individual user name
                            let fName = '';

                            if (chat.name && chat.name !== '') {
                                fName = chat.name;
                            } else {
                                chat.userNames.map((user: any) => {
                                    if (user._id !== userId) {
                                        fName = user.fullName;
                                        return;
                                    }
                                });
                            }

                            const otherUser = chat.userNames.find((user: any) => {
                                return user._id !== userId;
                            });

                            const chatImg =
                                chat.name && chat.name !== ''
                                    ? chat.image
                                        ? chat.image
                                        : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                    : otherUser && otherUser.avatar && otherUser.avatar !== ''
                                    ? otherUser.avatar
                                    : 'https://cues-files.s3.amazonaws.com/images/default.png';

                            const { title } = htmlStringParser(chat.lastMessage);
                            return (
                                <TouchableOpacity
                                    key={index.toString()}
                                    onPress={() => {
                                        if (chat.userNames.length > 2) {
                                            loadGroupChat(chat.users, chat._id);
                                        } else {
                                            loadChat(
                                                chat.users[0] === userId ? chat.users[1] : chat.users[0],
                                                chat._id
                                            );
                                        }
                                    }}
                                    style={{
                                        backgroundColor: '#fff',
                                        flexDirection: 'row',
                                        borderColor: '#f2f2f2',
                                        paddingVertical: 5,
                                        borderBottomWidth: index === chats.length - 1 ? 0 : 1,
                                        width: '100%',
                                    }}
                                >
                                    <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                        <Image
                                            style={{
                                                height: 45,
                                                width: 45,
                                                marginTop: 5,
                                                marginLeft: 5,
                                                marginBottom: 5,
                                                borderRadius: 75,
                                                alignSelf: 'center',
                                            }}
                                            source={{ uri: chatImg }}
                                        />
                                    </View>
                                    <View
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'none',
                                            paddingLeft: 5,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                padding: 5,
                                                fontFamily: 'inter',
                                                marginTop: 5,
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {fName}
                                        </Text>
                                        <Text
                                            style={{ fontSize: 14, margin: 5 }}
                                            ellipsizeMode="tail"
                                            numberOfLines={2}
                                        >
                                            {title}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: '#fff',
                                            padding: 0,
                                            flexDirection: 'row',
                                            alignSelf: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {/* Unread notification badge */}
                                        {chat.unreadMessages > 0 ? (
                                            <View
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 8,
                                                    marginRight: 5,
                                                    backgroundColor: '#007AFF',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Text style={{ color: 'white', fontSize: 12 }}>
                                                    {chat.unreadMessages}
                                                </Text>
                                            </View>
                                        ) : null}

                                        <Text
                                            style={{
                                                fontSize: 13,
                                                padding: 5,
                                                lineHeight: 13,
                                                color: '#000000',
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {fromNow(new Date(chat.lastMessageTime))}
                                        </Text>
                                        <Text style={{ fontSize: 14, padding: 5, lineHeight: 13 }} ellipsizeMode="tail">
                                            <Ionicons name="chevron-forward-outline" size={18} color="#000" />
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        );
    };

    /**
     * Human readable elapsed or remaining time (example: 3 minutes ago)
     * @param  {Date|Number|String} date A Date object, timestamp or string parsable with Date.parse()
     * @param  {Date|Number|String} [nowDate] A Date object, timestamp or string parsable with Date.parse()
     * @param  {Intl.RelativeTimeFormat} [trf] A Intl formater
     * @return {string} Human readable elapsed or remaining time
     */
    function fromNow(
        date: Date,
        nowDate = Date.now(),
        rft = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    ) {
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const MONTH = 30 * DAY;
        const YEAR = 365 * DAY;
        const intervals = [
            { ge: YEAR, divisor: YEAR, unit: 'year' },
            { ge: MONTH, divisor: MONTH, unit: 'month' },
            { ge: WEEK, divisor: WEEK, unit: 'week' },
            { ge: DAY, divisor: DAY, unit: 'day' },
            { ge: HOUR, divisor: HOUR, unit: 'hour' },
            { ge: MINUTE, divisor: MINUTE, unit: 'minute' },
            { ge: 30 * SECOND, divisor: SECOND, unit: 'seconds' },
            { ge: 0, divisor: 1, text: 'just now' },
        ];
        const now = typeof nowDate === 'object' ? nowDate.getTime() : new Date(nowDate).getTime();
        const diff = now - (typeof date === 'object' ? date : new Date(date)).getTime();
        const diffAbs = Math.abs(diff);
        for (const interval of intervals) {
            if (diffAbs >= interval.ge) {
                const x = Math.round(Math.abs(diff) / interval.divisor);
                const isFuture = diff < 0;
                const outputTime = interval.unit ? rft.format(isFuture ? x : -x, interval.unit) : interval.text;
                return outputTime
                    .replace(' ago', '')
                    .replace(' minutes', 'min')
                    .replace(' months', 'mth')
                    .replace(' days', 'd')
                    .replace(' weeks', 'wks')
                    .replace(' hours', 'h')
                    .replace(' seconds', 's');
            }
        }
    }

    const renderDirectoryFilter = () => {
        return props.showDirectory ? (
            <View style={{ backgroundColor: '#fff', paddingTop: Dimensions.get('window').width < 768 ? 10 : 0 }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                    <label style={{ width: 150, backgroundColor: '#fff' }}>
                        <Select
                            touchUi={true}
                            themeVariant="light"
                            value={filterChannelId}
                            onChange={(val: any) => {
                                setFilterChannelId(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                            data={channelOptions}
                        />
                    </label>
                </View>
            </View>
        ) : null;
    };

    const renderChatsLarge = () => {
        let filterSubscribedUsers = users;

        if (filterChannelId !== 'All') {
            filterSubscribedUsers = users.filter((user: any) => {
                const found = user.channelIds.find((id: any) => {
                    return id === filterChannelId;
                });

                if (found) return true;

                return false;
            });
        }

        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    height: '100%',
                }}
            >
                {/* Left pane will be for rendering active chats */}
                <View
                    style={{
                        width: '30%',
                        borderRightWidth: 1,
                        borderRightColor: '#f2f2f2',
                        height: '100%',
                    }}
                >
                    {props.showDirectory ? (
                        <View
                            style={{
                                paddingRight: 20,
                                paddingVertical: 9,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        props.setShowDirectory(false);
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Ionicons name="arrow-back-outline" size={32} color="#000" />
                                </TouchableOpacity>
                            </View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginLeft: 'auto',
                                }}
                            >
                                <View>{renderDirectoryFilter()}</View>
                                <View
                                    style={{
                                        paddingLeft: 10,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowNewGroup(true);
                                            setShowChat(false);
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 36,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: '#000',
                                                fontSize: 13,
                                                paddingLeft: 20,
                                                fontFamily: 'inter',
                                                borderRadius: 15,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            NEW GROUP
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                paddingRight: 20,
                                paddingVertical: 13,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <DefaultTextInput
                                    value={searchTerm}
                                    style={{
                                        color: '#000',
                                        backgroundColor: '#f2f2f2',
                                        borderRadius: 15,
                                        fontSize: 13,
                                        paddingVertical: 8,
                                        paddingHorizontal: 16,
                                        marginRight: 2,
                                        width: '100%',
                                    }}
                                    autoCompleteType={'xyz'}
                                    placeholder={'Search'}
                                    onChangeText={(val) => setSearchTerm(val)}
                                    placeholderTextColor={'#000'}
                                />
                            </View>
                            <View
                                style={{
                                    marginLeft: 20,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        if (searchTerm !== '') {
                                            setSearchTerm('');
                                        } else {
                                            props.setShowDirectory(true);
                                            setShowChat(false);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    <Ionicons
                                        name={searchTerm !== '' ? 'close-outline' : 'person-add-outline'}
                                        size={20}
                                        color={searchTerm !== '' ? '#1f1f1f' : '#000'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <ScrollView
                        style={{
                            width: '100%',
                        }}
                        contentContainerStyle={{
                            paddingRight: 10,
                            paddingVertical: 10,
                        }}
                        horizontal={false}
                        showsVerticalScrollIndicator={true}
                        indicatorStyle={'black'}
                    >
                        {isSearching ? (
                            <View
                                style={{
                                    width: '100%',
                                    flex: 1,
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'white',
                                    marginVertical: 25,
                                }}
                            >
                                <ActivityIndicator color={'#1F1F1F'} />
                            </View>
                        ) : null}
                        {!isSearching && searchTerm === '' && sortChatsByLastMessage.length === 0 ? (
                            <View
                                style={{
                                    padding: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: 'Inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    No Messages.
                                </Text>
                            </View>
                        ) : null}

                        {isSearching ? null : searchTerm !== '' ? (
                            <View style={{}}>
                                {searchResults.length === 0 ? (
                                    <View
                                        style={{
                                            padding: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 20,
                                                fontFamily: 'Inter',
                                                textAlign: 'center',
                                            }}
                                        >
                                            No Results
                                        </Text>
                                    </View>
                                ) : null}
                                {searchResults.map((obj: any, ind: number) => {
                                    let t = '';
                                    let s = '';
                                    let messageSenderName = '';
                                    let messageSenderAvatar = '';
                                    let createdAt = '';

                                    const users = obj.groupId.users;

                                    const sender = users.filter((user: any) => user._id === obj.sentBy)[0];

                                    if (obj.groupId && obj.groupId.name) {
                                        messageSenderName = obj.groupId.name + ' > ' + sender.fullName;
                                        messageSenderAvatar = obj.groupId.image
                                            ? obj.groupId.image
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                    } else if (sender) {
                                        messageSenderName = sender.fullName;
                                        messageSenderAvatar = sender.avatar
                                            ? sender.avatar
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';
                                    }

                                    if (obj.message[0] === '{' && obj.message[obj.message.length - 1] === '}') {
                                        const o = JSON.parse(obj.message);
                                        t = o.title;
                                        s = o.type;
                                    } else {
                                        const { title, subtitle } = htmlStringParser(obj.message);
                                        t = title;
                                        s = subtitle;
                                    }

                                    createdAt = obj.sentAt;

                                    return (
                                        <TouchableOpacity
                                            key={ind.toString()}
                                            onPress={() => {
                                                if (obj.groupId.users.length > 2) {
                                                    loadGroupChat(obj.groupId.users, obj.groupId._id);
                                                } else {
                                                    loadChat(
                                                        obj.groupId.users[0] === userId
                                                            ? obj.groupId.users[1]
                                                            : obj.groupId.users[0],
                                                        obj.groupId._id
                                                    );
                                                }
                                            }}
                                            style={{
                                                backgroundColor: groupId === obj.groupId._id ? '#f8f8f8' : '#fff',
                                                flexDirection: 'row',
                                                borderColor: '#f8f8f8',
                                                width: '100%',
                                                borderRadius: 5,
                                            }}
                                        >
                                            <View style={{ backgroundColor: 'none', padding: 5 }}>
                                                <Image
                                                    style={{
                                                        height: 45,
                                                        width: 45,
                                                        marginTop: 5,
                                                        marginLeft: 5,
                                                        marginBottom: 5,
                                                        borderRadius: 75,
                                                        alignSelf: 'center',
                                                    }}
                                                    source={{ uri: messageSenderAvatar }}
                                                />
                                            </View>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'none',
                                                    paddingLeft: 5,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: 'none',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginTop: 5,
                                                        padding: 5,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '90%',
                                                            backgroundColor: 'none',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                fontFamily: 'inter',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {messageSenderName}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        alignItems: 'center',
                                                        backgroundColor: 'none',
                                                    }}
                                                >
                                                    <View style={{ width: '75%', backgroundColor: 'none' }}>
                                                        {/* <Text
                                                    style={{ fontSize: 13, margin: 5, color: '#1f1f1f' }}
                                                    ellipsizeMode="tail"
                                                    numberOfLines={1}>
                                                    {t}
                                                </Text> */}
                                                        <Highlighter
                                                            searchWords={[searchTerm]}
                                                            autoEscape={true}
                                                            textToHighlight={t}
                                                            highlightStyle={{
                                                                backgroundColor: '#ffd54f',
                                                                fontFamily: 'overpass',
                                                                fontSize: 13,
                                                                color: '#1f1f1f',
                                                            }}
                                                            unhighlightStyle={{
                                                                fontFamily: 'overpass',
                                                                fontSize: 13,
                                                                color: '#1f1f1f',
                                                            }}
                                                        />
                                                    </View>
                                                    <View style={{ width: '25%', backgroundColor: 'none' }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                padding: 5,
                                                                lineHeight: 13,
                                                                color: '#1f1f1f',
                                                                textAlign: 'right',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {fromNow(new Date(createdAt))}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : props.showDirectory ? (
                            <View
                                style={{
                                    width: '100%',
                                }}
                            >
                                {filterSubscribedUsers.length === 0 ? (
                                    <View
                                        style={{
                                            padding: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 20,
                                                fontFamily: 'Inter',
                                                textAlign: 'center',
                                            }}
                                        >
                                            No Users
                                        </Text>
                                    </View>
                                ) : null}
                                {filterSubscribedUsers.map((user: any, ind: any) => {
                                    return (
                                        <View
                                            style={{
                                                width: '100%',
                                                borderBottomWidth: ind === users.length - 1 ? 0 : 1,
                                                paddingVertical: 5,
                                                backgroundColor: '#fff',
                                                borderColor: '#f2f2f2',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}
                                            key={ind.toString()}
                                        >
                                            <TouchableOpacity
                                                onPress={() => {
                                                    loadNewChat(user._id);
                                                }}
                                                style={{
                                                    backgroundColor: '#fff',
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <View style={{ backgroundColor: '#fff', padding: 5 }}>
                                                    <Image
                                                        style={{
                                                            height: 36,
                                                            width: 36,
                                                            marginTop: 5,
                                                            marginLeft: 5,
                                                            marginBottom: 5,
                                                            borderRadius: 75,
                                                            alignSelf: 'center',
                                                        }}
                                                        source={{
                                                            uri: user.avatar
                                                                ? user.avatar
                                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                        }}
                                                    />
                                                </View>
                                                <View
                                                    style={{
                                                        flex: 1,
                                                        backgroundColor: '#fff',
                                                        paddingLeft: 10,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 15,
                                                            padding: 5,
                                                            fontFamily: 'inter',
                                                            marginTop: 5,
                                                        }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {user.fullName}
                                                    </Text>
                                                    <Text style={{ fontSize: 14, padding: 5 }} ellipsizeMode="tail">
                                                        {user.email}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                            {/* <TouchableOpacity
                                        onPress={() => {
                                            loadNewChat(user._id);
                                        }}
                                        style={{
                                            backgroundColor: '#fff',
                                        }}>

                                        <View
                                            style={{
                                                backgroundColor: '#fff',
                                                padding: 0,
                                                flexDirection: 'row',
                                                alignSelf: 'center',
                                                alignItems: 'center'
                                            }}>
                                            <Text
                                                style={{ fontSize: 14, padding: 10, lineHeight: 13 }}
                                                ellipsizeMode="tail">
                                                <Ionicons
                                                    name="chatbubble-ellipses-outline"
                                                    size={18}
                                                    color="#007AFF"
                                                />
                                            </Text>
                                        </View>
                                    </TouchableOpacity> */}
                                            {meetingProvider && meetingProvider !== '' ? null : (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        // loadNewChat(user._id);
                                                        startInstantMeetingNewChat(user._id, user.fullName);
                                                    }}
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        marginRight: 10,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            backgroundColor: '#fff',
                                                            padding: 0,
                                                            flexDirection: 'row',
                                                            alignSelf: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{ fontSize: 14, padding: 10, lineHeight: 13 }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            <Ionicons name="videocam-outline" size={18} color="#000" />
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View
                                style={{
                                    width: '100%',
                                }}
                            >
                                {sortChatsByLastMessage.map((chat: any, index: number) => {
                                    // Group name or individual user name
                                    let fName = '';

                                    if (chat.name && chat.name !== '') {
                                        fName = chat.name;
                                    } else {
                                        chat.userNames.map((user: any) => {
                                            if (user._id !== userId) {
                                                fName = user.fullName;
                                                return;
                                            }
                                        });
                                    }

                                    const otherUser = chat.userNames.find((user: any) => {
                                        return user._id !== userId;
                                    });

                                    const chatImg =
                                        chat.name && chat.name !== ''
                                            ? chat.image
                                                ? chat.image
                                                : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                            : otherUser && otherUser.avatar && otherUser.avatar !== ''
                                            ? otherUser.avatar
                                            : 'https://cues-files.s3.amazonaws.com/images/default.png';

                                    const { title } = htmlStringParser(chat.lastMessage);

                                    return (
                                        <TouchableOpacity
                                            key={index.toString()}
                                            onPress={() => {
                                                if (chat.userNames.length > 2) {
                                                    loadGroupChat(chat.users, chat._id);
                                                } else {
                                                    loadChat(
                                                        chat.users[0] === userId ? chat.users[1] : chat.users[0],
                                                        chat._id
                                                    );
                                                }
                                            }}
                                            style={{
                                                backgroundColor: groupId === chat._id ? '#f8f8f8' : '#fff',
                                                flexDirection: 'row',
                                                borderColor: '#f8f8f8',
                                                width: '100%',
                                                borderRadius: 5,
                                            }}
                                        >
                                            <View style={{ backgroundColor: 'none', padding: 5 }}>
                                                <Image
                                                    style={{
                                                        height: 45,
                                                        width: 45,
                                                        marginTop: 5,
                                                        marginLeft: 5,
                                                        marginBottom: 5,
                                                        borderRadius: 75,
                                                        alignSelf: 'center',
                                                    }}
                                                    source={{ uri: chatImg }}
                                                />
                                            </View>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'none',
                                                    paddingLeft: 5,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        backgroundColor: 'none',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        marginTop: 5,
                                                        padding: 5,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '90%',
                                                            backgroundColor: 'none',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                fontFamily: 'inter',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {fName}
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={{
                                                            width: '10%',
                                                            backgroundColor: 'none',
                                                        }}
                                                    >
                                                        {chat.unreadMessages > 0 ? (
                                                            <View
                                                                style={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: 8,
                                                                    backgroundColor: '#007AFF',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <Text style={{ color: 'white', fontSize: 12 }}>
                                                                    {chat.unreadMessages}
                                                                </Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                </View>

                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        alignItems: 'center',
                                                        backgroundColor: 'none',
                                                    }}
                                                >
                                                    <View style={{ width: '75%', backgroundColor: 'none' }}>
                                                        <Text
                                                            style={{ fontSize: 13, margin: 5, color: '#1f1f1f' }}
                                                            ellipsizeMode="tail"
                                                            numberOfLines={1}
                                                        >
                                                            {title}
                                                        </Text>
                                                    </View>
                                                    <View style={{ width: '25%', backgroundColor: 'none' }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                padding: 5,
                                                                lineHeight: 13,
                                                                color: '#1f1f1f',
                                                                textAlign: 'right',
                                                            }}
                                                            ellipsizeMode="tail"
                                                        >
                                                            {fromNow(new Date(chat.lastMessageTime))}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Right pane is to view chat */}
                <View
                    style={{
                        width: '70%',
                        flexDirection: 'column',
                    }}
                >
                    {/* {showChat  && !showNewGroup && !viewGroup ? <View style={{
                    width: '100%',
                    height: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <View style={{
                        flexDirection: 'column',
                    }}>
                        <Text style={{
                            marginBottom: 10,
                            textAlign: 'center'
                        }}>
                            <Ionicons name='chatbubbles-outline' size={28} color='#1f1f1f' />
                        </Text>
                        <Text style={{
                            fontSize: 20,
                            textAlign: 'center',
                        }}>
                            {props.showDirectory ? 'Select user to chat' : 'Select Chat to view'}
                        </Text>
                    </View>
                    
                </View> : null} */}
                    {showChat ? renderHeader() : null}
                    {showChat && !viewGroup && !showNewGroup ? renderChat() : null}
                    {showNewGroup ? renderCreateGroup() : null}
                    {viewGroup ? renderEditGroup() : null}
                </View>
            </View>
        );
    };

    const renderHeader = () => {
        return (
            <View style={{ flexDirection: 'row', width: '100%' }}>
                {(showNewGroup && Dimensions.get('window').width < 768) ||
                viewGroup ||
                (showChat && Dimensions.get('window').width < 768) ||
                (props.showDirectory && Dimensions.get('window').width < 768) ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (viewGroup) {
                                setViewGroup(false);
                                return;
                            } else {
                                if (!showChat) {
                                    props.setShowDirectory(false);
                                }
                                setShowChat(false);
                                props.hideNewChatButton(false);
                            }
                            setGroupId('');
                            setChatName('');
                            setChatImg('');
                            loadChats();
                            setIsChatGroup(false);

                            props.refreshUnreadInbox();
                        }}
                        style={{
                            paddingRight: 15,
                            paddingTop: 5,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <Text
                            style={{
                                lineHeight: 34,
                                width: '100%',
                                textAlign: 'center',
                                paddingTop: 5,
                            }}
                        >
                            <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                        </Text>
                    </TouchableOpacity>
                ) : null}
                {Dimensions.get('window').width < 768 && !showChat && !showNewGroup ? renderDirectoryFilter() : null}
                {/* Show user / group name if you open the chat */}
                {showChat ? (
                    <View
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderBottomWidth: 1,
                            borderBottomColor: '#f2f2f2',
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                        }}
                    >
                        <TouchableOpacity
                            disabled={!isChatGroup}
                            onPress={() => setViewGroup(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 1,
                                width: '100%',
                            }}
                        >
                            <Image
                                style={{
                                    height: 36,
                                    width: 36,
                                    borderRadius: 75,
                                    alignSelf: 'center',
                                }}
                                source={{ uri: chatImg }}
                            />
                            <Text
                                style={{
                                    fontFamily: 'inter',
                                    fontSize: 16,
                                    paddingLeft: 20,
                                    flex: 1,
                                }}
                            >
                                {chatName}
                            </Text>
                        </TouchableOpacity>

                        {meetingProvider && meetingProvider !== '' ? null : (
                            <TouchableOpacity
                                onPress={() => startInstantMeeting()}
                                style={{
                                    marginLeft: 'auto',
                                }}
                            >
                                <Ionicons name="videocam-outline" size={21} color="#000" />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}
                {showNewGroup || showChat || !props.showDirectory ? null : (
                    <View style={{ flexDirection: 'row', flex: 1 }} />
                )}
                {showNewGroup || showChat || !props.showDirectory ? null : (
                    <TouchableOpacity
                        onPress={() => {
                            setShowNewGroup(true);
                            setShowChat(false);
                        }}
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 36,
                            marginTop: 10,
                            marginRight: 10,
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: '#000',
                                fontSize: 15,
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                textTransform: 'capitalize',
                            }}
                        >
                            New Group
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderEditGroup = () => {
        return (
            <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
                {/*  */}
                {userId === groupCreatedBy ? (
                    <View>
                        <Image
                            style={{
                                height: 100,
                                width: 100,
                                borderRadius: 75,
                                alignSelf: 'center',
                            }}
                            source={{
                                uri: editGroupImage
                                    ? editGroupImage
                                    : 'https://cues-files.s3.amazonaws.com/images/default.png',
                            }}
                        />
                        <View
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                paddingTop: 15,
                            }}
                        >
                            {editGroupImage ? (
                                <TouchableOpacity
                                    onPress={() => setEditGroupImage(undefined)}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 36,
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <Text>
                                        <Ionicons name={'close-circle-outline'} size={18} color={'#1F1F1F'} />
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <FileUpload
                                    onUpload={(u: any, t: any) => {
                                        setEditGroupImage(u);
                                    }}
                                />
                            )}
                        </View>

                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                }}
                            >
                                {PreferredLanguageText('name')}
                            </Text>
                            <TextInput
                                value={editGroupName}
                                placeholder={''}
                                onChangeText={(val) => {
                                    setEditGroupName(val);
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                    </View>
                ) : null}

                <Text
                    style={{
                        fontSize: 15,
                        color: '#000000',
                        marginBottom: groupCreatedBy === userId ? 15 : 0,
                    }}
                >
                    Users
                </Text>

                {groupCreatedBy === userId ? (
                    <Select
                        themeVariant="light"
                        selectMultiple={true}
                        group={true}
                        groupLabel="&nbsp;"
                        inputClass="mobiscrollCustomMultiInput"
                        placeholder="Select"
                        touchUi={true}
                        value={chatUsers}
                        data={options}
                        onChange={(val: any) => {
                            setChatUsers(val.value);
                        }}
                        responsive={{
                            small: {
                                display: 'bubble',
                            },
                            medium: {
                                touchUi: false,
                            },
                        }}
                        minWidth={[60, 320]}
                    />
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode={'on-drag'}
                        style={{ flex: 1, paddingTop: 12 }}
                    >
                        {groupUsers.map((user: any, ind: any) => {
                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        flex: 1,
                                        width: '100%',
                                        paddingVertical: 7,
                                        borderBottomWidth: ind === Object.keys(groupUsers).length - 1 ? 0 : 1,
                                        borderBottomColor: '#f2f2f2',
                                        paddingHorizontal: 10,
                                    }}
                                    key={ind.toString()}
                                >
                                    <Image
                                        style={{
                                            height: 36,
                                            width: 36,
                                            borderRadius: 75,
                                            alignSelf: 'center',
                                        }}
                                        source={{
                                            uri: user.avatar
                                                ? user.avatar
                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                        }}
                                    />
                                    <Text
                                        style={{
                                            fontFamily: 'inter',
                                            fontSize: 16,
                                            paddingLeft: 20,
                                        }}
                                    >
                                        {user.fullName}
                                    </Text>
                                    {groupCreatedBy === user._id ? (
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                paddingRight: 20,
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            Admin
                                        </Text>
                                    ) : null}
                                </View>
                            );
                        })}
                    </ScrollView>
                )}

                {groupCreatedBy === userId ? (
                    <TouchableOpacity
                        onPress={() => handleUpdateGroup()}
                        style={{
                            backgroundColor: 'white',
                            // overflow: 'hidden',
                            marginTop: 50,
                            // height: 36,
                            justifyContent: 'center',
                            flexDirection: 'row',
                        }}
                        disabled={props.user.email === disableEmailId}
                    >
                        <Text
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderColor: '#000',
                                borderWidth: 1,
                                color: '#fff',
                                backgroundColor: '#000',
                                fontSize: 11,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 150,
                            }}
                        >
                            UPDATE
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    // MAIN RETURN
    return (
        <View>
            {(loadingSubs && Dimensions.get('window').width < 768) || loadingChats ? (
                <View
                    style={{
                        width: '100%',
                        flex: 1,
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        marginTop: 50,
                    }}
                >
                    <ActivityIndicator color={'#1F1F1F'} />
                </View>
            ) : (
                <View
                    style={{
                        // paddingVertical: 15,
                        paddingTop: 0,
                        width: '100%',
                        height:
                            width < 768
                                ? Dimensions.get('window').height - (64 + 60)
                                : // : width < 1024
                                  // ? Dimensions.get('window').height - (64 + 68)
                                  Dimensions.get('window').height - 64,
                        backgroundColor: 'white',
                    }}
                    key={1}
                >
                    <View style={{ width: '100%', backgroundColor: 'white', height: '100%' }}>
                        <View style={{ width: '100%', maxWidth: 1024, alignSelf: 'center', height: '100%' }}>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                    width: '100%',
                                    marginBottom: width < 768 ? 20 : 0,
                                    height: '100%',
                                }}
                                nativeID="inbox-wrapper"
                            >
                                {Dimensions.get('window').width < 768 ? renderHeader() : null}
                                {viewGroup && Dimensions.get('window').width < 768 ? renderEditGroup() : null}
                                {viewGroup && Dimensions.get('window').width < 768
                                    ? null
                                    : showChat && Dimensions.get('window').width < 768
                                    ? renderChat()
                                    : showNewGroup && Dimensions.get('window').width < 768
                                    ? renderCreateGroup()
                                    : props.showDirectory && Dimensions.get('window').width < 768
                                    ? renderDirectory()
                                    : Dimensions.get('window').width < 768
                                    ? renderChatsMobile()
                                    : renderChatsLarge()}
                            </View>
                        </View>
                    </View>
                </View>
            )}
            {showInstantMeeting ? renderInstantMeetingPopup() : null}
        </View>
    );
};

export default Inbox;
