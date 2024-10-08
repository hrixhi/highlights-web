// REACT
import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Dimensions, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import {
    getSubscriptions,
    getCuesFromCloud,
    findUserById,
    signup,
    authWithProvider,
    getOrganisation,
    // CHAT
    getStreamChatUserToken,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { TextInput } from '../components/CustomTextInput';
import Alert from '../components/Alert';
import { Text, TouchableOpacity, View } from '../components/Themed';
import Update from '../components/Update';
import logo from '../components/default-images/cues-logo-black-exclamation-hidden.jpg';
import SocialMediaButton from '../components/SocialMediaButton';
import Dashboard from '../components/Dashboard';

import Swiper from 'react-native-web-swiper';

import agenda from '../assets/images/agenda.jpeg';
import workspace from '../assets/images/workspace.jpeg';
import inbox from '../assets/images/inbox.jpeg';

// HELPERS
import { validateEmail } from '../helpers/emailCheck';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { disableEmailId, origin, STREAM_CHAT_API_KEY } from '../constants/zoomCredentials';
import { Popup } from '@mobiscroll/react5';
// Web Notification
import OneSignal from 'react-onesignal';
import userflow from 'userflow.js';

// CHAT
import { StreamChat } from 'stream-chat';
import { StreamChatGenerics } from '../components/ChatComponents/types';
import useSound from 'use-sound';
import alertSound from '../assets/sounds/alertSound.mp3';
import { useApolloClient, useLazyQuery, useQuery } from '@apollo/client';

import { omitTypename } from '../helpers/omitTypename';
import { useAppContext } from '../contexts/AppContext';
import { StackScreenProps } from '@react-navigation/stack';

function Home({ navigation, route }: StackScreenProps<any, ''>) {
    const win = Dimensions.get('window');
    const screen = Dimensions.get('screen');

    // Open an existing Cue

    const [activeCue, setActiveCue] = useState<any>(undefined);
    const [channelCues, setChannelCues] = useState<any[]>([]);
    const [activeChannelColor, setActiveChannelColor] = useState('#000');

    const [modalType, setModalType] = useState('');
    const [channelId, setChannelId] = useState('');
    const [cueId, setCueId] = useState('');
    const [createdBy, setCreatedBy] = useState('');
    const [channelCreatedBy, setChannelCreatedBy] = useState('');
    const [showLoginWindow, setShowLoginWindow] = useState(false);
    const [showSignupWindow, setShowSignupWindow] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullname] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSignupSubmitDisabled, setIsSignupSubmitDisabled] = useState(true);
    const [signingUp, setSigningUp] = useState(false);
    const [dimensions, setDimensions] = useState({ window: win, screen });
    const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState('');
    const [openChannelId, setOpenChannelId] = useState('');
    const [passwordValidError, setPasswordValidError] = useState('');

    const [tab, setTab] = useState('Agenda');
    const [showCreate, setShowCreate] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const [unreadMessages, setUnreadMessages] = useState(0);
    const [emailValidError, setEmailValidError] = useState('');

    const enterValidEmailError = PreferredLanguageText('enterValidEmail');
    const passwordInvalidError = PreferredLanguageText('atleast8char');
    const [showOnboardModal, setShowOnboardModal] = useState(false);

    const [option, setOption] = useState('To Do');
    const [options] = useState(['To Do', 'Classroom', 'Inbox', 'Account']);
    const [mobileOptions] = useState(['To Do', 'Classroom', 'Search', 'Inbox', 'Account']);

    const [showHome, setShowHome] = useState(true);

    const [accountTabs] = useState(['profile', 'courses', 'integrations']);
    const [activeAccountTab, setActiveAccountTab] = useState('profile');

    const [workspaceOptions] = useState(['Content', 'Discuss', 'Meet', 'Scores', 'Settings']);

    const [workspaceActiveTab, setWorkspaceActiveTab] = useState('Content');

    const [selectedWorkspace, setSelectedWorkspace] = useState('');

    const [createOptions] = useState(['Content', 'Import', 'Videos', 'Books', 'Quiz']);
    const [createActiveTab, setCreateActiveTab] = useState('Content');
    const [disableCreateNavbar, setDisableCreateNavbar] = useState(false);
    const [showImportCreate, setShowImportCreate] = useState(false);
    const [showVideosCreate, setShowVideosCreate] = useState(false);

    const [initUserFlow, setInitUserFlow] = useState(false);
    const [streamUserToken, setStreamUserToken] = useState('');
    const [chatClient, setChatClient] = useState<any>(undefined);
    const [alertNotifSound] = useSound(alertSound, { volume: 0.2 });

    const server = useApolloClient();
    const {
        userId,
        user,
        org,
        handleSetOrg,
        subscriptions,
        handleSetUser,
        handleSetCues,
        handleSetSubscriptions,
        allCues,
        customCategories,
        handleReadCue,
    } = useAppContext();

    // QUERIES

    const [fetchUser, { loading: loadingUser, error: userError, data: userData }] = useLazyQuery(findUserById, {
        variables: { id: userId },
    });

    const [fetchOrg, { loading: loadingOrg, error: orgError, data: orgData }] = useLazyQuery(getOrganisation, {
        variables: { userId },
    });

    const [fetchCues, { loading: loadingCues, error: cuesError, data: cuesData }] = useLazyQuery(getCuesFromCloud, {
        variables: { userId },
    });

    const [fetchSubs, { loading: loadingSubs, error: subsError, data: subsData }] = useLazyQuery(getSubscriptions, {
        variables: { userId },
    });

    // INIT
    useEffect(() => {
        if (userId) {
            fetchSubs();
            fetchUser();
            fetchOrg();
            fetchCues();
            fetchStreamUserToken(userId);
        }
    }, [userId]);

    useEffect(() => {
        if (userData) {
            handleSetUser(userData.user.findById);
        }
    }, [userData]);

    useEffect(() => {
        if (subsData) {
            handleSetSubscriptions(subsData.subscription.findByUserId);
        }
    }, [subsData]);

    useEffect(() => {
        if (orgData) {
            handleSetOrg(orgData.school.findByUserId);
        }
    }, [orgData]);

    useEffect(() => {
        if (cuesData) {
            handleSetCues(cuesData.cue.getCuesFromCloud);
        }
    }, [cuesData]);

    useEffect(() => {
        if (email && !validateEmail(email.toString().toLowerCase())) {
            setEmailValidError(enterValidEmailError);
            return;
        }

        setEmailValidError('');
    }, [email]);

    // FOR NATIVE AND DESKTOP APPS WE WILL SHOW LOGIN SCREEN
    useEffect(() => {
        if (!userId || userId === '') {
            window.location.replace(`${origin}/login`);
        }
    }, [userId]);

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        setDimensions({ window, screen });
    }, []);

    useEffect(() => {
        Dimensions.addEventListener('change', onDimensionsChange);
        return () => {
            Dimensions.removeEventListener('change', onDimensionsChange);
        };
    }, []);

    useEffect(() => {
        if (option === 'Classroom') return;

        setLoadDiscussionForChannelId('');
        setOpenChannelId('');
    }, [option]);

    useEffect(() => {
        setSelectedWorkspace('');
    }, [option]);

    useEffect(() => {
        OneSignal.init({ appId: '996f32a4-1ff8-4c0b-bacc-814b8ce0504c', allowLocalhostAsSecureOrigin: true }).then(
            () => {
                console.log('One Signal initialized');
                OneSignal.showSlidedownPrompt().then(() => {
                    // do other stuff
                });
            }
        );
    }, []);

    // CHAT
    // INITIALIZE CHAT
    useEffect(() => {
        if (!streamUserToken && chatClient) {
            setChatClient(undefined);
            // Refetch user token
            return;
        }

        if (!streamUserToken || !user) {
            return;
        }

        const initChat = async (userObj: any, userToken: string) => {
            try {
                const client = StreamChat.getInstance<StreamChatGenerics>(STREAM_CHAT_API_KEY);
                // open the WebSocket connection to start receiving events
                // Updates the user in the application (will add/modify existing fields but will not overwrite/delete previously set fields unless the key is used)
                const res = await client.connectUser(
                    {
                        id: userObj._id,
                        name: userObj.fullName,
                        avatar: userObj.avatar,
                    },
                    userToken
                );

                console.log('Res', res);

                setUnreadMessages(res.me.total_unread_count);

                setChatClient(client);
            } catch (error: any) {
                console.log('Error', error);
                console.log('Status code', JSON.parse(error.message).StatusCode);
            }
        };

        if (streamUserToken && !chatClient) {
            initChat(user, streamUserToken);
        }

        return () => {
            if (chatClient) {
                chatClient.disconnectUser();
            }
        };
    }, [streamUserToken, user]);

    useEffect(() => {
        if (!initUserFlow) {
            initializeUserFlow();
        }
    }, [user, initUserFlow]);

    const initializeUserFlow = useCallback(() => {
        if (!initUserFlow && user && user.email && user.createdAt) {
            const signed_up_at = new Date(parseInt(user.createdAt));

            userflow.init('ct_pgwxzraltrarhdz3sfas2rgkoi');
            userflow.identify(user._id, {
                name: user.fullName,
                email: user.email,
                role: user.role,
                signed_up_at: signed_up_at.toISOString(),
                zoomId: user.zoomInfo && user.zoomInfo.accountId !== '' ? user.zoomInfo.accountId : '',
            });

            if (user.email === disableEmailId) {
                userflow.start('084a9bd0-4ce0-4056-b802-48c5d3efb7d4');
            }
            setInitUserFlow(true);
        }
    }, [initUserFlow, user]);

    useEffect(() => {
        if (!chatClient) return;

        const getUnreadCount = (event) => {
            console.log('Get Unread count Alert');

            if (event.total_unread_count !== undefined) {
                setUnreadMessages(event.total_unread_count);
            }
        };

        const newMessageAlert = (event) => {
            console.log('New Message Alert', event);

            alertNotifSound();

            if (event.total_unread_count !== undefined) {
                // PLAY SOUND

                setUnreadMessages(event.total_unread_count);
            }
        };

        chatClient.on('notification.message_new', newMessageAlert);
        chatClient.on('notification.mark_read', getUnreadCount);

        return () => {
            chatClient.off('notification.message_new', newMessageAlert);
            chatClient.off('notification.mark_read', getUnreadCount);
        };
    }, [chatClient]);

    const handleSocialAuth = (user: any) => {
        const profile = user._profile;

        const { name, email, profilePicURL } = profile;

        server
            .mutate({
                mutation: authWithProvider,
                variables: {
                    email: email.toLowerCase(),
                    fullName: name,
                    provider: user._provider,
                    avatar: profilePicURL,
                },
            })
            .then(async (r: any) => {
                if (
                    r.data.user.authWithProvider.user &&
                    r.data.user.authWithProvider.token &&
                    !r.data.user.authWithProvider.error
                ) {
                    const u = JSON.parse(JSON.stringify(r.data.user.authWithProvider.user), omitTypename);
                    const token = r.data.user.authWithProvider.token;

                    const userId = u._id;

                    OneSignal.setExternalUserId(userId);

                    const sU = JSON.stringify(u);
                    await AsyncStorage.setItem('jwt_token', token);
                    await AsyncStorage.setItem('user', sU);
                    setShowLoginWindow(false);
                } else {
                    const { error } = r.data.user.authWithProvider;
                    Alert(error);
                }
            })
            .catch((e) => {
                console.log(e);
                Alert('Something went wrong. Try again.');
            });
    };

    const handleSocialAuthFailure = (err: any) => {
        console.error(err);
        Alert('Something went wrong. Try again.');
    };

    useEffect(() => {
        const validPasswrdRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

        if (password && !validPasswrdRegex.test(password)) {
            setPasswordValidError(passwordInvalidError);
            return;
        }

        setPasswordValidError('');
    }, [password]);

    const fetchStreamUserToken = useCallback(async (userId: string) => {
        server
            .mutate({
                mutation: getStreamChatUserToken,
                variables: {
                    userId,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.streamChat.getUserToken !== '') {
                    setStreamUserToken(res.data.streamChat.getUserToken);
                }
            })
            .catch((e) => {
                setStreamUserToken('');
                console.log('Error', e);
            });
    }, []);

    const handleSignup = useCallback(() => {
        if (password !== confirmPassword) {
            Alert("Passwords don't match");
            return;
        }

        setSigningUp(true);

        server
            .mutate({
                mutation: signup,
                variables: {
                    email: email.toLowerCase(),
                    fullName,
                    password,
                },
            })
            .then(async (r: any) => {
                if (r.data.user.signup && r.data.user.signup === 'SUCCESS') {
                    Alert('Your account was created successfully. Sign in to begin use.');
                    setFullname('');
                    setEmail('');
                    setPassword('');
                    setShowSignupWindow(false);
                } else {
                    Alert(r.data.user.signup !== '' ? r.data.user.signup : 'Error signing up. Try again.');
                }
                setSigningUp(false);
            })
            .catch((e) => {
                setSigningUp(false);
                console.log(e);
            });
    }, [fullName, email, password, confirmPassword]);

    // imp

    const openCue = useCallback(
        (channelId, cueId, createdBy) => {
            const findCue = allCues.find((cue: any) => cue._id === cueId);

            if (!findCue) {
                return;
            }

            if (channelId !== '') {
                const sub = subscriptions.find((item: any) => {
                    return item.channelId === channelId;
                });
                if (sub) {
                    setChannelCreatedBy(sub.channelCreatedBy);
                    setActiveChannelColor(sub.colorCode ? sub.colorCode : '#000');
                }

                const channelCues = allCues.filter((cue: any) => cue.channelId === channelId);

                setChannelCues(channelCues);
            }
            setChannelId(channelId);
            setActiveCue(findCue);
            setCreatedBy(createdBy);
            setCueId(cueId);
            setModalType('Update');
            setShowHome(false);
        },
        [subscriptions, allCues]
    );

    const closeModal = useCallback(async () => {
        setModalType('');
        setCreateActiveTab('Content');

        // Mark as read
        if (modalType === 'Update') {
            handleReadCue(cueId);
        }

        setChannelCues([]);
        setActiveCue(undefined);
        setActiveChannelColor('#000');
        setCueId('');
        setCreatedBy('');
        setShowHome(true);
        setChannelId('');
    }, [modalType]);

    /**
     * @description Helpter for icon to use in navbar
     */
    const getNavbarIconName = (op: string) => {
        switch (op) {
            case 'To Do':
                return option === op ? 'calendar' : 'calendar-outline';
            case 'Classroom':
                return option === op ? 'library' : 'library-outline';
            case 'Search':
                return option === op ? 'search' : 'search-outline';
            case 'Inbox':
                return option === op ? 'chatbubble' : 'chatbubble-outline';
            default:
                return option === op ? 'person' : 'person-outline';
        }
    };

    const getWorkspaceNavbarIconName = (op: string) => {
        switch (op) {
            case 'Content':
                return workspaceActiveTab === op ? 'library' : 'library-outline';
            case 'Discuss':
                return workspaceActiveTab === op ? 'chatbubbles' : 'chatbubbles-outline';
            case 'Meet':
                return workspaceActiveTab === op ? 'videocam' : 'videocam-outline';
            case 'Scores':
                return workspaceActiveTab === op ? 'bar-chart' : 'bar-chart-outline';
            default:
                return workspaceActiveTab === op ? 'build' : 'build-outline';
        }
    };

    const getCreateNavbarIconName = (op: string) => {
        console.log('Create navbar op', op);
        switch (op) {
            case 'Content':
                return createActiveTab === op ? 'create' : 'create-outline';
            case 'Import':
                return createActiveTab === op ? 'share' : 'share-outline';
            case 'Quiz':
                return createActiveTab === op ? 'checkbox' : 'checkbox-outline';
            case 'Books':
                return createActiveTab === op ? 'book' : 'book-outline';
            case 'Videos':
                return createActiveTab === op ? 'videocam' : 'videocam-outline';
            default:
                return createActiveTab === op ? 'build' : 'build-outline';
        }
    };

    const getNavbarIconColor = (op: string) => {
        if (op === option) {
            return '#000';
        }
        return '#797979';
    };

    const getWorkspaceNavbarIconColor = (op: string) => {
        if (op === workspaceActiveTab) {
            return '#fff';
        }
        return '#fff';
    };

    const getCreateNavbarIconColor = (op: string) => {
        if (op === createActiveTab) {
            return '#fff';
        }
        return '#fff';
    };

    const getNavbarText = (op: string) => {
        switch (op) {
            case 'To Do':
                return 'Plan';
            case 'Classroom':
                return 'Workspace';
            case 'Search':
                return 'Search';
            case 'Inbox':
                return 'Inbox';
            default:
                return 'Account';
        }
    };

    const getWorkspaceNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return 'Coursework';
            case 'Discuss':
                return 'Discussion';
            case 'Meet':
                return 'Meetings';
            case 'Scores':
                return 'Scores';
            default:
                return 'Settings';
        }
    };

    const getCreateNavbarText = (op: string) => {
        switch (op) {
            case 'Content':
                return 'Content';
            case 'Import':
                return 'Import';
            case 'Quiz':
                return 'Quiz';
            case 'Books':
                return 'Books';
            case 'Videos':
                return 'Videos';
            default:
                return 'Settings';
        }
    };

    return (
        <View
            style={{
                flex: 1,
                flexDirection: 'row',
                height: '100%',
            }}
        >
            {/* {showLoginWindow && showSignupWindow ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        flex: 1,
                        position: 'absolute',
                        zIndex: 50,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(16,16,16, 0.7)',
                    }}
                >
                    <View
                        style={{
                            position: 'absolute',
                            zIndex: 525,
                            display: 'flex',
                            alignSelf: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            width: dimensions.window.width < 768 ? '100%' : '100%',
                            height: dimensions.window.width < 768 ? '100%' : '100%',
                            borderRadius: dimensions.window.width < 768 ? 0 : 0,
                            marginTop: dimensions.window.width < 768 ? 0 : 0,
                            paddingHorizontal: 40,
                        }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            horizontal={false}
                            contentContainerStyle={{
                                height: '100%',
                                paddingVertical: 40,
                                justifyContent: 'center',
                            }}
                            nestedScrollEnabled={true}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    paddingBottom: 20,
                                }}
                            >
                                <Image
                                    source={logo}
                                    style={{
                                        width: dimensions.window.height * 0.16 * 0.53456,
                                        height: dimensions.window.height * 0.16 * 0.2,
                                    }}
                                    resizeMode={'contain'}
                                />
                            </View>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#1F1F1F',
                                    fontFamily: 'overpass',
                                    paddingBottom: 20,
                                    textAlign: 'center',
                                }}
                            >
                                Get started for free.
                            </Text>

                            <View
                                style={{
                                    maxWidth: 400,
                                    width: '100%',
                                    marginTop: 30,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignSelf: 'center',
                                }}
                            >
                                <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5, paddingTop: 10 }}>
                                    {PreferredLanguageText('email')}
                                </Text>
                                <TextInput
                                    autoCompleteType="email"
                                    textContentType="emailAddress"
                                    value={email}
                                    placeholder={''}
                                    onChangeText={(val: any) => setEmail(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                    required={true}
                                    errorText={emailValidError}
                                />
                                <View>
                                    <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>Full Name</Text>
                                    <TextInput
                                        autoCompleteType="name"
                                        textContentType="name"
                                        value={fullName}
                                        placeholder={''}
                                        onChangeText={(val: any) => setFullname(val)}
                                        required={true}
                                        placeholderTextColor={'#1F1F1F'}
                                    />
                                </View>
                                <View>
                                    <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                        {PreferredLanguageText('password')}
                                    </Text>
                                    <TextInput
                                        secureTextEntry={true}
                                        autoCompleteType={'password'}
                                        textContentType="newPassword"
                                        value={password}
                                        placeholder={''}
                                        onChangeText={(val: any) => setPassword(val)}
                                        required={true}
                                        placeholderTextColor={'#1F1F1F'}
                                        errorText={passwordValidError}
                                        footerMessage={PreferredLanguageText('atleast8char')}
                                    />
                                </View>
                                <View>
                                    <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                        Confirm Password
                                    </Text>
                                    <TextInput
                                        secureTextEntry={true}
                                        autoCompleteType={'off'}
                                        value={confirmPassword}
                                        placeholder={''}
                                        onChangeText={(val: any) => setConfirmPassword(val)}
                                        required={true}
                                        placeholderTextColor={'#1F1F1F'}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleSignup()}
                                    disabled={isSignupSubmitDisabled || signingUp}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        marginTop: 15,
                                        width: '100%',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#007AFF',
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 35,
                                            // width: 180,
                                            width: 175,
                                            borderRadius: 15,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Sign Up
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setShowSignupWindow(false)}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        marginTop: 15,
                                        marginBottom: 30,
                                        width: '100%',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: '#007AFF',
                                        }}
                                    >
                                        Back to Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            ) : null} */}

            {showHome &&
                !loadingCues &&
                !loadingUser &&
                !loadingSubs &&
                !loadingOrg &&
                option !== 'Inbox' &&
                (!selectedWorkspace || option !== 'Classroom') &&
                ((option === 'To Do' && tab !== 'Add') ||
                (option === 'Account' && !showCreate) ||
                (option === 'Settings' && !showHelp) ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (option === 'To Do') {
                                setTab('Add');
                            } else if (option === 'Account' && activeAccountTab === 'courses') {
                                setShowCreate(true);
                            } else if (option === 'Account' && activeAccountTab === 'profile') {
                                window.open('https://www.learnwithcues.com/help', '_blank');
                            }
                        }}
                        style={{
                            position: 'absolute',
                            marginRight:
                                Dimensions.get('window').width >= 1200
                                    ? (Dimensions.get('window').width - 1200) / 2
                                    : Dimensions.get('window').width >= 1024
                                    ? (Dimensions.get('window').width - 1024) / 2 - 20
                                    : Dimensions.get('window').width >= 768
                                    ? 30
                                    : 20,
                            marginBottom: Dimensions.get('window').width < 768 ? 77 : 25,
                            right: 0,
                            justifyContent: 'center',
                            bottom: 0,
                            width: 58,
                            height: 58,
                            borderRadius: 29,
                            backgroundColor: '#000',
                            borderColor: '#000',
                            borderWidth: 0,
                            zIndex: showLoginWindow ? 40 : 500000,
                        }}
                    >
                        <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                            {option === 'To Do' ? (
                                <Ionicons name="add-outline" size={35} />
                            ) : option === 'Account' && activeAccountTab === 'courses' ? (
                                <Ionicons name="add-outline" size={35} />
                            ) : (
                                <Ionicons name="help-outline" size={21} />
                            )}
                        </Text>
                    </TouchableOpacity>
                ) : null)}
            {showHome && !showLoginWindow ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        flex: 1,
                        position: 'absolute',
                        // overflow: 'scroll',
                        zIndex: 50,
                        backgroundColor: '#fff',
                        overflow: 'hidden',
                    }}
                >
                    <View
                        style={{
                            position: 'absolute',
                            zIndex: 525,
                            display: 'flex',
                            backgroundColor: 'white',
                            width: '100%',
                            height: '100%',
                            borderRadius: 0,
                            marginTop: 0,
                        }}
                    >
                        {!user ||
                        !org ||
                        !allCues ||
                        !subscriptions ||
                        loadingUser ||
                        loadingSubs ||
                        loadingCues ||
                        loadingOrg ? (
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: 'white',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    flex: 1,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        alignSelf: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <View
                                        style={{
                                            marginTop: 10,
                                        }}
                                    >
                                        <ActivityIndicator size={20} color={'#1F1F1F'} />
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter',
                                                marginTop: 10,
                                            }}
                                        >
                                            Loading...
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <Dashboard
                                setTab={(val: any) => setTab(val)}
                                tab={tab}
                                setShowCreate={(val: any) => setShowCreate(val)}
                                showCreate={showCreate}
                                setShowHelp={(val: any) => setShowHelp(val)}
                                showHelp={showHelp}
                                setOption={(op: any) => setOption(op)}
                                option={option}
                                options={options}
                                closeModal={closeModal}
                                openCreate={() => {
                                    setModalType('Create');
                                }}
                                openCue={openCue}
                                key={
                                    option.toString() +
                                    showHome.toString() +
                                    tab.toString() +
                                    showCreate.toString() +
                                    showHelp.toString() +
                                    subscriptions.toString() +
                                    selectedWorkspace.toString()
                                }
                                openDiscussionFromActivity={(channelId: string) => {
                                    setOption('Classroom');
                                    setLoadDiscussionForChannelId(channelId);
                                }}
                                openChannelFromActivity={(channelId: string) => {
                                    setOption('Classroom');
                                    setOpenChannelId(channelId);
                                }}
                                openDiscussionFromSearch={(channelId: any) => {
                                    setOption('Classroom');
                                }}
                                loadDiscussionForChannelId={loadDiscussionForChannelId}
                                setLoadDiscussionForChannelId={setLoadDiscussionForChannelId}
                                openChannelId={openChannelId}
                                setOpenChannelId={setOpenChannelId}
                                modalType={modalType}
                                closeCreateModal={() => {
                                    setModalType('');
                                }}
                                unreadMessages={unreadMessages}
                                openHelpModal={(show: boolean) => setShowOnboardModal(true)}
                                accountTabs={accountTabs}
                                activeAccountTab={activeAccountTab}
                                setActiveAccountTab={(tab: string) => setActiveAccountTab(tab)}
                                workspaceOptions={workspaceOptions}
                                activeWorkspaceTab={workspaceActiveTab}
                                setWorkspaceActiveTab={setWorkspaceActiveTab}
                                selectedWorkspace={selectedWorkspace}
                                setSelectedWorkspace={(val: any) => {
                                    setSelectedWorkspace(val);
                                }}
                                setShowImportCreate={(showImport: boolean) => setShowImportCreate(showImport)}
                                showImportCreate={showImportCreate}
                                showVideosCreate={showVideosCreate}
                                setShowVideosCreate={(showVideos: boolean) => setShowVideosCreate(showVideos)}
                                setCreateActiveTab={(tab: any) => setCreateActiveTab(tab)}
                                createActiveTab={createActiveTab}
                                setDisableCreateNavbar={(disable: boolean) => setDisableCreateNavbar(disable)}
                                chatClient={chatClient}
                            />
                        )}
                    </View>
                </View>
            ) : null}

            <View
                style={{
                    height: dimensions.window.height,
                    backgroundColor: 'white',
                    width: '100%',
                    alignSelf: 'center',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    maxWidth: dimensions.window.width,
                    overflow: 'hidden',
                }}
            >
                {modalType === 'Update' ? (
                    <Update
                        key={cueId.toString()}
                        customCategories={customCategories}
                        cue={activeCue}
                        activeChannelColor={activeChannelColor}
                        closeModal={() => closeModal()}
                        cueId={cueId}
                        createdBy={createdBy}
                        channelId={channelId}
                        channelCreatedBy={channelCreatedBy}
                        channelCues={channelCues}
                        openCue={(cueId: string) => openCue(channelId, cueId, channelCreatedBy)}
                    />
                ) : null}
            </View>

            {/* Create navbar bottom mobile */}
            {Dimensions.get('window').width < 768 && modalType === 'Create' ? (
                <View
                    style={{
                        position: 'absolute',
                        alignSelf: 'flex-end',
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: Dimensions.get('window').width < 768 ? 10 : 20,
                        paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        height: Dimensions.get('window').width < 768 ? 60 : 68,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -10,
                        },
                        bottom: 0,
                        right: 0,
                        shadowOpacity: 0.03,
                        shadowRadius: 12,
                        zIndex: showLoginWindow ? 40 : 100,
                        elevation: showLoginWindow ? 40 : 120,
                        borderTopColor: selectedWorkspace.split('-SPLIT-')[3],
                        borderTopWidth: 1,
                        backgroundColor:
                            selectedWorkspace.split('-SPLIT-')[0] === 'My Notes'
                                ? '#000'
                                : selectedWorkspace.split('-SPLIT-')[3],
                    }}
                >
                    {createOptions.map((op: any, ind: number) => {
                        if (user.role !== 'instructor' && op === 'Quiz') {
                            return null;
                        }

                        if (disableCreateNavbar) {
                            return null;
                        }

                        return (
                            <TouchableOpacity
                                style={{
                                    backgroundColor:
                                        selectedWorkspace.split('-SPLIT-')[0] === 'My Notes'
                                            ? '#000'
                                            : selectedWorkspace.split('-SPLIT-')[3],
                                    width: user.role === 'instructor' ? '20%' : '25%',
                                    flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                key={ind.toString()}
                                onPress={() => {
                                    if (op === 'Import') {
                                        setShowImportCreate(true);
                                    } else if (op === 'Videos') {
                                        setShowVideosCreate(true);
                                    } else {
                                        setCreateActiveTab(op);
                                    }
                                }}
                            >
                                <Ionicons
                                    name={getCreateNavbarIconName(op)}
                                    style={{
                                        color: getCreateNavbarIconColor(op),
                                        marginBottom: Dimensions.get('window').width < 800 ? 3 : 6,
                                    }}
                                    size={23}
                                />
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 800 ? 11 : 16,
                                        lineHeight: Dimensions.get('window').width < 800 ? 11 : 23,
                                        color: getCreateNavbarIconColor(op),
                                        fontFamily: op === createActiveTab ? 'Inter' : 'overpass',
                                        marginBottom: Dimensions.get('window').width < 800 ? 0 : 6,
                                        paddingLeft: Dimensions.get('window').width < 800 ? 0 : 5,
                                    }}
                                >
                                    {getCreateNavbarText(op)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : null}

            {Dimensions.get('window').width < 768 &&
            showHome &&
            selectedWorkspace &&
            selectedWorkspace !== 'My Notes' &&
            modalType !== 'Create' ? (
                <View
                    style={{
                        position: 'absolute',
                        alignSelf: 'flex-end',
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: Dimensions.get('window').width < 768 ? 10 : 20,
                        paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        height: Dimensions.get('window').width < 768 ? 60 : 68,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -10,
                        },
                        bottom: 0,
                        right: 0,
                        shadowOpacity: 0.03,
                        shadowRadius: 12,
                        zIndex: showLoginWindow ? 40 : 100,
                        elevation: showLoginWindow ? 40 : 120,
                        borderTopColor: selectedWorkspace.split('-SPLIT-')[3],
                        borderTopWidth: 1,
                        backgroundColor:
                            selectedWorkspace.split('-SPLIT-')[0] === 'My Notes'
                                ? '#000'
                                : selectedWorkspace.split('-SPLIT-')[3],
                    }}
                >
                    {workspaceOptions.map((op: any) => {
                        if (selectedWorkspace.split('-SPLIT-')[0] === 'My Notes') return null;

                        if (op === 'Settings' && selectedWorkspace.split('-SPLIT-')[2] !== user._id) return null;

                        return (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'none',
                                    width: selectedWorkspace.split('-SPLIT-')[2] === user._id ? '20%' : '25%',
                                    paddingBottom: 2,
                                }}
                                onPress={() => {
                                    setWorkspaceActiveTab(op);
                                }}
                            >
                                <View
                                    nativeID={op}
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name={getWorkspaceNavbarIconName(op)}
                                        style={{
                                            color: getWorkspaceNavbarIconColor(op),
                                            marginBottom: Dimensions.get('window').width < 800 ? 3 : 6,
                                        }}
                                        size={23}
                                    />
                                    <Text
                                        style={{
                                            fontSize: Dimensions.get('window').width < 800 ? 11 : 16,
                                            lineHeight: Dimensions.get('window').width < 800 ? 11 : 23,
                                            color: getWorkspaceNavbarIconColor(op),
                                            fontWeight: 'bold',
                                            fontFamily: op === workspaceActiveTab ? 'Inter' : 'overpass',
                                            marginBottom: Dimensions.get('window').width < 800 ? 0 : 6,
                                            paddingLeft: Dimensions.get('window').width < 800 ? 0 : 5,
                                        }}
                                    >
                                        {getWorkspaceNavbarText(op)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : null}

            {Dimensions.get('window').width < 768 && showHome && !selectedWorkspace ? (
                <View
                    style={{
                        position: 'absolute',
                        alignSelf: 'flex-end',
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: Dimensions.get('window').width < 768 ? 10 : 20,
                        paddingHorizontal: Dimensions.get('window').width < 1024 ? 5 : 40,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        height: Dimensions.get('window').width < 768 ? 60 : 68,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -10,
                        },
                        bottom: 0,
                        right: 0,
                        shadowOpacity: 0.03,
                        shadowRadius: 12,
                        zIndex: showLoginWindow ? 40 : 100,
                        elevation: showLoginWindow ? 40 : 120,
                        borderTopColor: '#e8e8e8',
                        borderTopWidth: 1,
                        backgroundColor: '#fff',
                    }}
                >
                    {mobileOptions.map((op: any) => {
                        if (op === 'Settings' || op === 'Channels') {
                            return;
                        }
                        return (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'none',
                                    width: '20%',
                                    paddingBottom: 2,
                                }}
                                onPress={() => {
                                    setOption(op);
                                }}
                            >
                                <View
                                    nativeID={op.split(' ').join('-')}
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 800 ? 'column' : 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Ionicons
                                        name={getNavbarIconName(op)}
                                        style={{
                                            color: getNavbarIconColor(op),
                                            marginBottom: Dimensions.get('window').width < 800 ? 3 : 6,
                                        }}
                                        size={21}
                                    />
                                    <Text
                                        style={{
                                            fontSize: Dimensions.get('window').width < 800 ? 11 : 16,
                                            lineHeight: Dimensions.get('window').width < 800 ? 11 : 23,
                                            color: getNavbarIconColor(op),
                                            fontFamily: op === option ? 'inter' : 'overpass',
                                            marginBottom: Dimensions.get('window').width < 800 ? 0 : 6,
                                            paddingLeft: Dimensions.get('window').width < 800 ? 0 : 5,
                                        }}
                                    >
                                        {getNavbarText(op)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : null}
            {
                <Popup
                    isOpen={showOnboardModal}
                    buttons={[]}
                    themeVariant="light"
                    theme="ios"
                    onClose={() => setShowOnboardModal(false)}
                    responsive={{
                        small: {
                            display: 'center',
                        },
                        medium: {
                            display: 'center',
                        },
                    }}
                >
                    {/* Show all the settings here */}
                    <View
                        style={{
                            flexDirection: 'column',
                            backgroundColor: 'none',
                            width: Dimensions.get('window').width < 768 ? '100%' : 480,
                            marginHorizontal: Dimensions.get('window').width < 768 ? 0 : 25,
                        }}
                        className="mbsc-align-center mbsc-padding"
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#f8f8f8',
                                paddingBottom: 20,
                                paddingTop: 10,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 24 : 28,
                                    color: '#000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Overview
                            </Text>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => {
                                        window.open('https://www.learnwithcues.com/help', '_blank');
                                    }}
                                    style={{
                                        overflow: 'hidden',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        backgroundColor: '#f8f8f8',
                                    }}
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
                                            paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 24,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'uppercase',
                                            width: 150,
                                        }}
                                    >
                                        MORE HELP
                                    </Text>
                                </TouchableOpacity>

                                {/* <TouchableOpacity
                                    onPress={() => {
                                       setShowOnboardModal(false)
                                    }}
                                    style={{
                                        backgroundColor: '#f8f8f8',
                                        marginLeft: 15
                                    }}
                                >
                                    <Ionicons name="close-outline" size={22} />
                                </TouchableOpacity> */}
                            </View>
                        </View>

                        {/* <div style={{
                            marginTop: 20,
                            marginBottom: 20,
                            display: "flex",
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}> */}
                        {/* <iframe
                            width={Dimensions.get('window').width < 768 ? '300' : "480"}
                            height={Dimensions.get('window').width < 768 ? '230' : "300"}
                            src={`https://www.youtube.com/embed/64GhiDvem4o`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Embedded youtube"
                            /> */}
                        <View>
                            <Swiper
                                containerStyle={{
                                    width: Dimensions.get('window').width < 768 ? '300' : '480',
                                    height: Dimensions.get('window').width < 768 ? '430' : 500,
                                }}
                                innerContainerStyle={{
                                    width: Dimensions.get('window').width < 768 ? '300' : '480',
                                    height: Dimensions.get('window').width < 768 ? '430' : 500,
                                    backgroundColor: '#f8f8f8',
                                    paddingTop: 20,
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontFamily: 'Inter',
                                            paddingTop: 10,
                                        }}
                                    >
                                        Agenda
                                    </Text>
                                    <Image
                                        source={agenda}
                                        style={{
                                            width: '100%',
                                            height: 350,
                                        }}
                                        resizeMode={'contain'}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Overpass',
                                        }}
                                    >
                                        {'\n'}
                                        Cues compiles your daily, weekly and monthly plan.{'\n'}
                                        Click + to schedule a new event or meeting. {'\n'}
                                        Submission tasks will be listed automatically.{'\n'}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontFamily: 'Inter',
                                            paddingTop: 10,
                                        }}
                                    >
                                        Workspace
                                    </Text>
                                    <Image
                                        source={workspace}
                                        style={{
                                            width: '100%',
                                            height: 350,
                                        }}
                                        resizeMode={'contain'}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Overpass',
                                        }}
                                    >
                                        {'\n'}
                                        One place for all your books, notes, tests and discussions.{'\n'}
                                        Click + to create, import or share content. {'\n'}
                                        Click on any content or discussion thread to view it.{'\n'}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontFamily: 'Inter',
                                            paddingTop: 10,
                                        }}
                                    >
                                        Inbox
                                    </Text>
                                    <Image
                                        source={inbox}
                                        style={{
                                            width: '100%',
                                            height: 350,
                                        }}
                                        resizeMode={'contain'}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Overpass',
                                        }}
                                    >
                                        {'\n'}
                                        Chat or meet with your peers, instantly. {'\n'}
                                        Click + to create a new message or launch a private meeting. {'\n'}
                                        Click on a chat to view it.{'\n'}
                                    </Text>
                                </View>
                            </Swiper>
                        </View>
                        {/* </div> */}

                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#f8f8f8',
                                paddingVertical: 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    window.open('https://cues-files.s3.amazonaws.com/builds/Cues-setup.dmg', '_blank');
                                }}
                                style={{
                                    overflow: 'hidden',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    backgroundColor: '#f8f8f8',
                                    paddingRight: 35,
                                }}
                            >
                                <Ionicons name="logo-apple" size={Dimensions.get('window').width < 768 ? 30 : 35} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    window.open('https://cues-files.s3.amazonaws.com/builds/Cues-setup.exe', '_blank');
                                }}
                                style={{
                                    overflow: 'hidden',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    backgroundColor: '#f8f8f8',
                                    paddingRight: 35,
                                }}
                            >
                                <Ionicons name="logo-windows" size={Dimensions.get('window').width < 768 ? 30 : 35} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    window.open('https://apps.apple.com/us/app/cues-learn/id1614537827', '_blank');
                                }}
                                style={{
                                    overflow: 'hidden',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    backgroundColor: '#f8f8f8',
                                    paddingRight: 35,
                                }}
                            >
                                <Ionicons
                                    name="logo-apple-appstore"
                                    size={Dimensions.get('window').width < 768 ? 30 : 35}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    Alert('Available soon!');
                                    // window.open('https://www.learnwithcues.com/help', '_blank');
                                }}
                                style={{
                                    overflow: 'hidden',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    backgroundColor: '#f8f8f8',
                                }}
                            >
                                <Ionicons name="logo-android" size={Dimensions.get('window').width < 768 ? 30 : 35} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Popup>
            }
        </View>
    );
}

export default Home;

const styles = (channelId: string) =>
    StyleSheet.create({
        all: {
            fontSize: 12,
            color: '#fff',
            fontWeight: 'bold',
            height: 25,
            paddingHorizontal: 12,
            backgroundColor: '#000000',
            lineHeight: 25,
            fontFamily: 'overpass',
            textTransform: 'uppercase',
        },
        allGrayFill: {
            fontSize: 12,
            color: '#fff',
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#007AFF',
            lineHeight: 25,
            height: 25,
            fontFamily: 'inter',
            textTransform: 'uppercase',
        },
        activityContainer: {
            borderTopWidth: 0,
            borderBottomWidth: 0,
            borderColor: '#eeeeef',
            borderTopRightRadius: 15,
            borderTopLeftRadius: 15,
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            backgroundColor: '#f8f8f8',
        },
        horizontal: {
            flexDirection: 'row',
            justifyContent: 'space-around',
        },
        input: {
            width: '100%',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: 1,
            fontSize: 14,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20,
        },
    });
