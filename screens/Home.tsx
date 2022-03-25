// REACT
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, Animated, ActivityIndicator, Dimensions, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getSubscriptions,
    getCues,
    saveCuesToCloud,
    login,
    getCuesFromCloud,
    findUserById,
    resetPassword,
    totalInboxUnread,
    signup,
    authWithProvider,
    getOrganisation
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { TextInput } from '../components/CustomTextInput';
import Alert from '../components/Alert';
import { Text, TouchableOpacity, View } from '../components/Themed';
import Update from '../components/Update';
import logo from '../components/default-images/cues-logo-black-exclamation-hidden.jpg';
import SocialMediaButton from '../components/SocialMediaButton';
import Dashboard from '../components/Dashboard';

// HELPERS
import { validateEmail } from '../helpers/emailCheck';
import { PreferredLanguageText, LanguageSelect } from '../helpers/LanguageContext';
import { defaultCues } from '../helpers/DefaultData';
import { origin } from '../constants/zoomCredentials';
import { Popup } from '@mobiscroll/react5';
// Web Notification
import OneSignal, { useOneSignalSetup } from 'react-onesignal';

const Home: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // read/learn
    const version = 'learn';

    // Dev/Prod
    const env = 'DEV';

    const win = Dimensions.get('window');
    const screen = Dimensions.get('screen');

    // Categories for Home
    const [customCategories, setCustomCategories] = useState<any[]>([]);
    // All channels
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    // All cues
    const [cues, setCues] = useState<any>({});

    const [fadeAnimation] = useState(new Animated.Value(0));

    // Open an existing Cue
    const [updateModalIndex, setUpdateModalIndex] = useState(0);
    const [updateModalKey, setUpdateModalKey] = useState('local');

    const [modalType, setModalType] = useState('');
    const [pageNumber, setPageNumber] = useState(0);
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
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [isSignupSubmitDisabled, setIsSignupSubmitDisabled] = useState(true);
    const [signingUp, setSigningUp] = useState(false);
    const [saveDataInProgress, setSaveDataInProgress] = useState(false);
    const [dimensions, setDimensions] = useState({ window: win, screen });
    const [target, setTarget] = useState('');
    const [loadDiscussionForChannelId, setLoadDiscussionForChannelId] = useState('');
    const [openChannelId, setOpenChannelId] = useState('');
    const [passwordValidError, setPasswordValidError] = useState('');
    const [user, setUser] = useState<any>(null);

    const [tab, setTab] = useState('Agenda');
    const [showDirectory, setShowDirectory] = useState<any>(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const [unreadMessages, setUnreadMessages] = useState(0);
    const [emailValidError, setEmailValidError] = useState('');

    const enterValidEmailError = PreferredLanguageText('enterValidEmail');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const weHaveEmailedPasswordAlert = PreferredLanguageText('weHaveEmailedPassword');
    const invalidCredentialsAlert = PreferredLanguageText('invalidCredentials');
    const unableToRefreshCuesAlert = PreferredLanguageText('unableToRefreshCues');
    const passwordInvalidError = PreferredLanguageText('atleast8char');
    const [filterStart, setFilterStart] = useState<any>(new Date());
    const [filterEnd, setFilterEnd] = useState<any>(null);
    const [showOnboardModal, setShowOnboardModal] = useState(false);

    const [option, setOption] = useState('To Do');
    const [options] = useState(
        version === 'read'
            ? ['To Do', 'Classroom', 'Browse', 'Channels', 'Settings']
            : ['To Do', 'Classroom', 'Inbox', 'Channels', 'Settings']
    );

    const [showHome, setShowHome] = useState(true);
    const [hideNewChatButton, setHideNewChatButton] = useState(false);

    const [loadingCues, setLoadingCues] = useState(true);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingOrg, setLoadingOrg] = useState(true);


    useEffect(() => {
        if (email && !validateEmail(email.toString().toLowerCase())) {
            setEmailValidError(enterValidEmailError);
            return;
        }

        setEmailValidError('');
    }, [email]);

    //   Validate Submit on Login state change
    useEffect(() => {
        // Login
        if (!showForgotPassword && email && password && !emailValidError) {
            setIsSubmitDisabled(false);
            return;
        }

        //
        if (showForgotPassword && email && !emailValidError) {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [showForgotPassword, email, password, emailValidError]);

    useEffect(() => {
        if (
            fullName === '' ||
            email === '' ||
            password === '' ||
            confirmPassword === '' ||
            signingUp ||
            passwordValidError
        ) {
            setIsSignupSubmitDisabled(true);
        } else {
            setIsSignupSubmitDisabled(false);
        }
    }, [fullName, email, password, confirmPassword, signingUp]);

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        // window.location.reload()
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
        (async () => {
            const u = await AsyncStorage.getItem('user');
            const showOnboarding = await AsyncStorage.getItem('show_onboard_modal');

            if (u) {
                const parsedUser: any = JSON.parse(u);
                if (showOnboarding === "true") {
                    setShowOnboardModal(true)
                    AsyncStorage.setItem("show_onboard_modal", "false")
                }

                if (parsedUser._id && parsedUser._id !== '') {
                    await loadDataFromCloud();        
                } else {
                    // setShowLoginWindow(true);
                    window.location.href = `${origin}/login`;
                }
            } else {
                // setShowLoginWindow(true);
                window.location.href = `${origin}/login`;
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');

            if (u) {
                const user = JSON.parse(u);

                const server = fetchAPI('');

                server
                    .query({
                        query: totalInboxUnread,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data.messageStatus.totalInboxUnread) {
                            setUnreadMessages(res.data.messageStatus.totalInboxUnread);
                        }
                    });
            }
        })();
    }, []);

    const refreshUnreadInbox = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);
            updateInboxCount(user._id);
        }
    }, []);

    const updateInboxCount = useCallback(userId => {
        const server = fetchAPI('');
        server
            .query({
                query: totalInboxUnread,
                variables: {
                    userId,
                    channelId
                }
            })
            .then(res => {
                if (
                    res.data.messageStatus.totalInboxUnread !== undefined &&
                    res.data.messageStatus.totalInboxUnread !== null
                ) {
                    setUnreadMessages(res.data.messageStatus.totalInboxUnread);
                }
            })
            .catch(err => console.log(err));
    }, []);

    // imp
    const refreshChannelCues = useCallback(async () => {
        let user = await AsyncStorage.getItem('user');
        const unparsedCues = await AsyncStorage.getItem('cues');
        if (user && unparsedCues) {
            const allCues = JSON.parse(unparsedCues);
            const parsedUser = JSON.parse(user);
            const server = fetchAPI(parsedUser._id);

            try {
                const res = await server.query({
                    query: getCues,
                    variables: {
                        userId: parsedUser._id
                    }
                });

                if (res.data.cue.findByUserId) {
                    // Here we load all new Cues
                    // we update statuses for the cues that are already stored and add new cues to the list
                    // (cant directly replace the store because channel cues could be modified by the user)
                    const receivedCues = res.data.cue.findByUserId;
                    receivedCues.map((item: any) => {
                        const channelId = item.channelId.toString().trim();
                        let index = -1;
                        if (allCues[channelId]) {
                            index = allCues[channelId].findIndex((cue: any) => {
                                return cue._id.toString().trim() === item._id.toString().trim();
                            });
                        }
                        if (index === -1) {
                            let cue: any = {};
                            cue = {
                                ...item
                            };
                            delete cue.__typename;
                            if (allCues[cue.channelId]) {
                                allCues[cue.channelId].push(cue);
                            } else {
                                allCues[cue.channelId] = [cue];
                            }
                        } else {
                            allCues[item.channelId][index].unreadThreads = item.unreadThreads ? item.unreadThreads : 0;
                            allCues[item.channelId][index].status = item.status;
                            allCues[item.channelId][index].folderId = item.folderId;
                            if (!allCues[item.channelId][index].original) {
                                allCues[item.channelId][index].original = item.cue;
                            }
                        }
                    });
                    const custom: any = {};
                    setCues(allCues);
                    if (allCues['local']) {
                        allCues['local'].map((item: any) => {
                            if (item.customCategory !== '') {
                                if (!custom[item.customCategory]) {
                                    custom[item.customCategory] = 0;
                                }
                            }
                        });
                        const customC: any[] = [];
                        Object.keys(custom).map(item => {
                            customC.push(item);
                        });
                        customC.sort();
                        setCustomCategories(customC);
                    }
                    const stringCues = JSON.stringify(allCues);
                    await AsyncStorage.setItem('cues', stringCues);
                    Animated.timing(fadeAnimation, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true
                    }).start();
                }
            } catch (err) {
                Alert(unableToRefreshCuesAlert, checkConnectionAlert);
                const custom: any = {};
                setCues(allCues);
                if (allCues['local']) {
                    allCues['local'].map((item: any) => {
                        if (item.customCategory !== '') {
                            if (!custom[item.customCategory]) {
                                custom[item.customCategory] = 0;
                            }
                        }
                    });
                    const customC: any[] = [];
                    Object.keys(custom).map(item => {
                        customC.push(item);
                    });
                    customC.sort();
                    setCustomCategories(customC);
                }
                Animated.timing(fadeAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            }
        } else if (unparsedCues) {
            const custom: any = {};
            const allCues = JSON.parse(unparsedCues);
            setCues(allCues);
            if (allCues['local']) {
                allCues['local'].map((item: any) => {
                    if (item.customCategory !== '') {
                        if (!custom[item.customCategory]) {
                            custom[item.customCategory] = 0;
                        }
                    }
                });
                const customC: any[] = [];
                Object.keys(custom).map(item => {
                    customC.push(item);
                });
                customC.sort();
                setCustomCategories(customC);
            }
            Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    }, []);

    useOneSignalSetup(async () => {
        // Check current permission state
        const currentState = await OneSignal.getNotificationPermission();

        if (currentState !== 'granted') {
            OneSignal.registerForPushNotifications();
        } else {
            // If permission granted and logged in then ensure user external id is added

            const externalUserId = await OneSignal.getExternalUserId();

            if (!externalUserId) {
                let user = await AsyncStorage.getItem('user');

                if (user) {
                    const parsedUser = JSON.parse(user);
                    if (parsedUser.email) {
                        await OneSignal.setExternalUserId(parsedUser._id);
                    }
                }
            }
        }
    });

    // FETCH NEW DATA
    const loadData = useCallback(
        async (saveData?: boolean) => {
            try {
                // const version = 'v0.9';
                // const fO = await AsyncStorage.getItem(version);

                // LOAD FIRST OPENED
                // if (fO === undefined || fO === null) {
                //     try {
                //         await AsyncStorage.clear();
                //         await AsyncStorage.setItem(version, 'SET');
                //     } catch (e) {}
                // }

                let u = await AsyncStorage.getItem('user');
                const sC = await AsyncStorage.getItem('cues');

                // if (sC) {
                // await refreshChannelCues();
                // }
                // HANDLE PROFILE
                if (u) {
                    const parsedUser = JSON.parse(u);
                    if (parsedUser.email) {
                        if (saveData) {
                            // Used for local cues since they are stored in Async Storage first and then saved to cloud // ALLOW OFFLINE
                            await saveDataInCloud();
                        } else {
                            // REFRESH LOCAL STORAGE (USED FOR EXISTING CUES)
                            await loadDataFromCloud();
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        },
        [fadeAnimation]
    );

    const handleSocialAuth = (user: any) => {
        const profile = user._profile;

        const { name, email, profilePicURL } = profile;

        const server = fetchAPI('');
        server
            .mutate({
                mutation: authWithProvider,
                variables: {
                    email: email.toLowerCase(),
                    fullName: name,
                    provider: user._provider,
                    avatar: profilePicURL
                }
            })
            .then(async (r: any) => {
                if (
                    r.data.user.authWithProvider.user &&
                    r.data.user.authWithProvider.token &&
                    !r.data.user.authWithProvider.error
                ) {
                    const u = r.data.user.authWithProvider.user;
                    const token = r.data.user.authWithProvider.token;
                    if (u.__typename) {
                        delete u.__typename;
                    }

                    const userId = u._id;

                    OneSignal.setExternalUserId(userId);

                    const sU = JSON.stringify(u);
                    await AsyncStorage.setItem('jwt_token', token);
                    await AsyncStorage.setItem('user', sU);
                    setShowLoginWindow(false);
                    loadDataFromCloud();
                } else {
                    const { error } = r.data.user.authWithProvider;
                    Alert(error);
                }
            })
            .catch(e => {
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

    const handleSignup = useCallback(() => {
        if (password !== confirmPassword) {
            Alert("Passwords don't match");
            return;
        }

        setSigningUp(true);
        const server = fetchAPI('');
        server
            .mutate({
                mutation: signup,
                variables: {
                    email: email.toLowerCase(),
                    fullName,
                    password
                }
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
            .catch(e => {
                setSigningUp(false);
                console.log(e);
            });
    }, [fullName, email, password, confirmPassword]);

    // Move to profile page
    const handleLogin = useCallback(() => {
        const server = fetchAPI('');
        server
            .query({
                query: login,
                variables: {
                    email: email.toLowerCase(),
                    password
                }
            })
            .then(async (r: any) => {
                if (r.data.user.login.user && r.data.user.login.token && !r.data.user.login.error) {
                    const u = r.data.user.login.user;
                    const token = r.data.user.login.token;
                    if (u.__typename) {
                        delete u.__typename;
                    }

                    const userId = u._id;

                    OneSignal.setExternalUserId(userId);

                    const sU = JSON.stringify(u);
                    await AsyncStorage.setItem('jwt_token', token);
                    await AsyncStorage.setItem('user', sU);
                    setShowLoginWindow(false);
                    loadDataFromCloud();
                } else {
                    const { error } = r.data.user.login;
                    Alert(error);
                }
            })
            .catch(e => {
                console.log(e);
                Alert('Something went wrong. Try again.');
            });
    }, [email, password]);

    useEffect(() => {

        // if (user && user.email) {
        //     window.pendo.initialize({
        //         visitor: {
        //             id: user._id,   // Required if user is logged in
        //             email:  user.email,      // Recommended if using Pendo Feedback, or NPS Email
        //             full_name: user.fullName,    // Recommended if using Pendo Feedback
        //             role: user.role,        // Optional
        //             // You can add any additional visitor level key-values here,
        //             // as long as it's not one of the above reserved names.
        //         },
        
        //         account: {
        //             id: user.schoolId,
        //             name: user.orgName    // Required if using Pendo Feedback
        //             // name:         // Optional
        //             // is_paying:    // Recommended if using Pendo Feedback
        //             // monthly_value:// Recommended if using Pendo Feedback
        //             // planLevel:    // Optional
        //             // planPrice:    // Optional
        //             // creationDate: // Optional
        
        //             // You can add any additional account level key-values here,
        //             // as long as it's not one of the above reserved names.
        //         }
        //     });
        // }
        
    }, [user])

    // imp
    const loadDataFromCloud = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');

        if (u) {
            setLoadingCues(true);
            setLoadingSubs(true);
            setLoadingUser(true);
            setLoadingOrg(true);

            const user = JSON.parse(u);
            const server = fetchAPI(user._id);
            // Get User info
            server
                .query({
                    query: findUserById,
                    variables: {
                        id: user._id
                    }
                })
                .then(async res => {
                    const u = res.data.user.findById;

                    console.log("Fetched User", u)
                    if (u) {
                        // await AsyncStorage.setItem('cueDraft', u.currentDraft);
                        delete u.currentDraft;
                        delete u.__typename;
                        const sU = JSON.stringify(u);
                        await AsyncStorage.setItem('user', sU);

                        setUser(u);
                        setLoadingUser(false);

                    }
                })
                .catch(err => console.log(err));
            // Get user cues
            server
                .query({
                    query: getCuesFromCloud,
                    variables: {
                        userId: user._id
                    }
                })
                .then(async res => {
                    if (res.data.cue.getCuesFromCloud) {
                        const allCues: any = {};
                        res.data.cue.getCuesFromCloud.map((cue: any) => {
                            const channelId = cue.channelId && cue.channelId !== '' ? cue.channelId : 'local';
                            delete cue.__typename;
                            if (allCues[channelId]) {
                                allCues[channelId].push({ ...cue });
                            } else {
                                allCues[channelId] = [{ ...cue }];
                            }
                        });
                        const custom: any = {};
                        if (allCues['local']) {
                            allCues['local'].map((item: any) => {
                                if (item.customCategory !== '') {
                                    if (!custom[item.customCategory]) {
                                        custom[item.customCategory] = 0;
                                    }
                                }
                            });
                        } else {
                            allCues['local'] = [];
                        }
                        const customC: any[] = [];
                        Object.keys(custom).map(item => {
                            customC.push(item);
                        });
                        customC.sort();
                        setCues(allCues);
                        setCustomCategories(customC);
                        const stringCues = JSON.stringify(allCues);
                        await AsyncStorage.setItem('cues', stringCues);
                        setLoadingCues(false);
                    }
                })
                .catch(err => console.log(err));
            // Get subscription information
            server
                .query({
                    query: getSubscriptions,
                    variables: {
                        userId: user._id
                    }
                })
                .then(async res => {
                    if (res.data.subscription.findByUserId) {
                        const sortedSubs = res.data.subscription.findByUserId.sort((a: any, b: any) => {
                            if (a.channelName < b.channelName) {
                                return -1;
                            }
                            if (a.channelName > b.channelName) {
                                return 1;
                            }
                            return 0;
                        });
                        setSubscriptions(sortedSubs);
                        const stringSub = JSON.stringify(sortedSubs);
                        await AsyncStorage.setItem('subscriptions', stringSub);
                        setLoadingSubs(false);
                    }
                })
                .catch(err => console.log(err));
            server
                .query({
                    query: getOrganisation,
                    variables: {
                        userId: user._id
                    }
                })
                .then(async res => {
                    if (res.data && res.data.school.findByUserId) {
                        const stringOrg = JSON.stringify(res.data.school.findByUserId);
                        await AsyncStorage.setItem('school', stringOrg);
                        setLoadingOrg(false);
                    } else {
                        setLoadingOrg(false);
                    }
                })
                .catch(err => console.log(err));
        }
    }, []);

    // imp
    const saveDataInCloud = useCallback(async () => {
        if (saveDataInProgress) return;

        const u: any = await AsyncStorage.getItem('user');
        const parsedUser = JSON.parse(u);
        const sC: any = await AsyncStorage.getItem('cues');
        const parsedCues = JSON.parse(sC);

        const allCuesToSave: any[] = [];
        const allCues: any[] = [];

        if (parsedCues !== {}) {
            Object.keys(parsedCues).map(key => {
                parsedCues[key].map((cue: any) => {
                    const cueInput = {
                        ...cue,
                        _id: cue._id.toString(),
                        color: cue.color.toString(),
                        date: new Date(cue.date).toISOString(),
                        gradeWeight: cue.submission && cue.gradeWeight ? cue.gradeWeight.toString() : undefined,
                        endPlayAt: cue.endPlayAt && cue.endPlayAt !== '' ? new Date(cue.endPlayAt).toISOString() : '',
                        allowedAttempts:
                            cue.allowedAttempts && cue.allowedAttempts !== null ? cue.allowedAttempts.toString() : null
                    };
                    allCuesToSave.push({ ...cueInput });
                    // Deleting these because they should not be changed ...
                    // but dont delete if it is the person who has made the cue
                    // -> because those channel Cue changes are going to be propagated
                    delete cueInput.score;
                    // delete cueInput.deadline;
                    delete cueInput.graded;
                    delete cueInput.submittedAt;
                    // delete cueInput.gradeWeight;
                    // delete cueInput.submission;
                    delete cueInput.comment;

                    // this change is propagated only when the user actively changes folder structure...
                    delete cueInput.folderId;

                    delete cueInput.unreadThreads;
                    // delete cueInput.createdBy;
                    // delete cueInput.original;
                    delete cueInput.status;
                    delete cueInput.channelName;
                    delete cueInput.__typename;
                    allCues.push(cueInput);
                });
            });
        }
        
        const server = fetchAPI('');

        // UPDATE CUES
        server
            .mutate({
                mutation: saveCuesToCloud,
                variables: {
                    userId: parsedUser._id,
                    cues: allCues
                }
            })
            .then(async res => {
                if (res.data.cue.saveCuesToCloud) {
                    const newIds: any = res.data.cue.saveCuesToCloud;
                    const updatedCuesArray: any[] = [];
                    allCuesToSave.map((c: any) => {
                        const id = c._id;
                        const updatedItem = newIds.find((i: any) => {
                            return id.toString().trim() === i.oldId.toString().trim();
                        });
                        if (updatedItem) {
                            updatedCuesArray.push({
                                ...c,
                                _id: updatedItem.newId
                            });
                        } else {
                            updatedCuesArray.push(c);
                        }
                    });
                    const updatedCuesObj: any = {};
                    updatedCuesArray.map((c: any) => {
                        if (c.channelId && c.channelId !== '') {
                            if (updatedCuesObj[c.channelId]) {
                                updatedCuesObj[c.channelId].push(c);
                            } else {
                                updatedCuesObj[c.channelId] = [c];
                            }
                        } else {
                            if (updatedCuesObj['local']) {
                                updatedCuesObj['local'].push(c);
                            } else {
                                updatedCuesObj['local'] = [c];
                            }
                        }
                    });
                    const updatedCues = JSON.stringify(updatedCuesObj);
                    await AsyncStorage.setItem('cues', updatedCues);
                    if (newIds.length !== 0) {
                        setCues(updatedCuesObj);
                    }
                }

            })
            .catch(err => console.log(err));
    }, [cues]);

    const openModal = useCallback(
        type => {
            setModalType(type);
            AsyncStorage.setItem('lastopened', type);
        },
        [cues]
    );

    const openCueFromCalendar = useCallback(
        (channelId, _id, by) => {
            let cueKey = '';
            let cueIndex = 0;

            if (cues !== {}) {
                Object.keys(cues).map(key => {
                    cues[key].map((cue: any, index: number) => {
                        if (cue._id === _id) {
                            cueKey = key;
                            cueIndex = index;
                        }
                    });
                });
            }

            setUpdateModalKey(cueKey);
            setUpdateModalIndex(cueIndex);
            setPageNumber(pageNumber);
            setChannelId(channelId);
            if (channelId !== '') {
                const sub = subscriptions.find((item: any) => {
                    return item.channelId === channelId;
                });
                if (sub) {
                    setChannelCreatedBy(sub.channelCreatedBy);
                }
            }
            setCreatedBy(by);
            setCueId(_id);
            openModal('Update');
            setShowHome(false);
        },
        [subscriptions, cues]
    );

    const openUpdate = useCallback(
        (key, index, pageNumber, _id, by, channId) => {
            setUpdateModalKey(key);
            setUpdateModalIndex(index);
            setPageNumber(pageNumber);
            setChannelId(channId);
            if (channId !== '') {
                const sub = subscriptions.find((item: any) => {
                    return item.channelId === channId;
                });
                if (sub) {
                    setChannelCreatedBy(sub.channelCreatedBy);
                }
            }
            setCreatedBy(by);
            setCueId(_id);
            openModal('Update');
            setShowHome(false);
        },
        [subscriptions]
    );

    const reloadCueListAfterUpdate = useCallback(async () => {
        const unparsedCues = await AsyncStorage.getItem('cues');
        const u = await AsyncStorage.getItem('user');
        if (unparsedCues) {
            const allCues = JSON.parse(unparsedCues);
            const custom: any = {};
            setCues(allCues);
            if (allCues['local']) {
                allCues['local'].map((item: any) => {
                    if (item.customCategory !== '') {
                        if (!custom[item.customCategory]) {
                            custom[item.customCategory] = 0;
                        }
                    }
                });
                const customC: any[] = [];
                Object.keys(custom).map(item => {
                    customC.push(item);
                });
                customC.sort();
                setCustomCategories(customC);
            }
            Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
        if (u) {
            const user = JSON.parse(u);
            if (user.email) {
                await saveDataInCloud();
            }
        }
    }, []);

    const forgotPassword = useCallback(() => {
        const server = fetchAPI('');
        server
            .mutate({
                mutation: resetPassword,
                variables: {
                    email
                }
            })
            .then(res => {
                if (res.data && res.data.user.resetPassword) {
                    Alert(weHaveEmailedPasswordAlert);
                    setShowForgotPassword(false);
                } else {
                    Alert(invalidCredentialsAlert);
                }
            });
    }, [email]);

    const refreshSubscriptions = async () => {
        const u = await AsyncStorage.getItem('user');

        if (u) {
            const parsedUser = JSON.parse(u);
            const server = fetchAPI(parsedUser._id);
            server
                .query({
                    query: getSubscriptions,
                    variables: {
                        userId: parsedUser._id
                    }
                })
                .then(async res => {
                    if (res.data.subscription.findByUserId) {
                        const sortedSubs = res.data.subscription.findByUserId.sort((a: any, b: any) => {
                            if (a.channelName < b.channelName) {
                                return -1;
                            }
                            if (a.channelName > b.channelName) {
                                return 1;
                            }
                            return 0;
                        });
                        setSubscriptions(sortedSubs);
                        const stringSub = JSON.stringify(sortedSubs);
                        await AsyncStorage.setItem('subscriptions', stringSub);
                    }
                })
                .catch(e => {
                    alert('Could not refresh Subscriptions');
                });
        }
    };

    const markCueAsRead = useCallback(async () => {
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[updateModalKey].length === 0) {
            return;
        }

        const unmodified = subCues ? subCues[updateModalKey][updateModalIndex] : {};

        if (!unmodified) return;

        const modified = {
            ...unmodified,
            status: 'read'
        };

        subCues[updateModalKey][updateModalIndex] = modified;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);
        reloadCueListAfterUpdate();
    }, [cues, updateModalKey, updateModalIndex]);

    const closeModal = useCallback(async () => {
        setModalType('');

        // Mark as read
        if (modalType === 'Update') {
            await markCueAsRead();
        }

        setCueId('');
        setShowHome(true);
        setCreatedBy('');

        if (modalType === 'Update') {
            setChannelId('');
        }

        await loadData();
    }, [fadeAnimation, modalType]);

    const cuesArray: any[] = [];

    if (cues !== {}) {
        Object.keys(cues).map(key => {
            cues[key].map((cue: any, index: number) => {
                cuesArray.push({
                    ...cue,
                    key,
                    index
                });
            });
        });
    }

    const renderTimeMessage = () => {
        const currentTime = new Date()

        if (currentTime.getHours() < 12 && currentTime.getHours() > 0) {
            return 'Good Morning'
        } else if (currentTime.getHours() >= 12 && currentTime.getHours() < 17) {
            return 'Good Afternoon' 
        } else {
            return 'Good Evening'
        }
    }

    const cuesCopy = cuesArray.sort((a: any, b: any) => {
        if (a.color < b.color) {
            return -1;
        }
        if (a.color > b.color) {
            return 1;
        }
        return 0;
    });

    let dateFilteredCues: any[] = [];
    if (filterStart && filterEnd) {
        dateFilteredCues = cuesArray.filter(item => {
            const date = new Date(item.date);
            return date >= filterStart && date <= filterEnd;
        });
    } else {
        dateFilteredCues = cuesArray;
    }

    return (
        <View style={styles(channelId).container} key={showHome.toString() + option.toString() + tab.toString()}>
            {showLoginWindow && showSignupWindow ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        flex: 1,
                        position: 'absolute',
                        zIndex: 50,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(16,16,16, 0.7)'
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
                            paddingHorizontal: 40
                        }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            horizontal={false}
                            contentContainerStyle={{
                                height: '100%',
                                paddingVertical: 40,
                                justifyContent: 'center'
                            }}
                            nestedScrollEnabled={true}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    paddingBottom: 20
                                }}
                            >
                                <Image
                                    source={logo}
                                    style={{
                                        width: dimensions.window.height * 0.16 * 0.53456,
                                        height: dimensions.window.height * 0.16 * 0.2
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
                                    textAlign: 'center'
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
                                    alignSelf: 'center'
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
                                        flexDirection: 'row'
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#006AFF',
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 35,
                                            // width: 180,
                                            width: 175,
                                            borderRadius: 15,
                                            textTransform: 'uppercase'
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
                                        flexDirection: 'row'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: '#006AFF'
                                        }}
                                    >
                                        Back to Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            ) : null}

            {showLoginWindow && !showSignupWindow ? (
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        flex: 1,
                        position: 'absolute',
                        zIndex: 50,
                        backgroundColor: 'rgba(16,16,16, 0.7)',
                        overflow: 'hidden'
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
                            paddingHorizontal: 40
                        }}
                    >
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            horizontal={false}
                            contentContainerStyle={{
                                height: '100%',
                                paddingVertical: 40,
                                justifyContent: 'center'
                            }}
                            nestedScrollEnabled={true}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    display: 'flex',
                                    paddingBottom: 30
                                }}
                            >
                                <Image
                                    source={logo}
                                    style={{
                                        width: dimensions.window.height * 0.16 * 0.53456,
                                        height: dimensions.window.height * 0.16 * 0.2
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
                                    textAlign: 'center'
                                }}
                            >
                                {showForgotPassword
                                    ? PreferredLanguageText('temporaryPassword')
                                    : PreferredLanguageText('continueLeftOff')}
                            </Text>

                            <View
                                style={{
                                    maxWidth: 400,
                                    width: '100%',
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignSelf: 'center'
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
                                    errorText={emailValidError}
                                />
                                {showForgotPassword ? null : (
                                    <View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Text style={{ color: '#000000', fontSize: 14, paddingBottom: 5 }}>
                                                {PreferredLanguageText('password')}
                                            </Text>
                                            {showForgotPassword ? null : (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setShowForgotPassword(true);
                                                    }}
                                                    style={{
                                                        backgroundColor: 'white',
                                                        flexDirection: 'row',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 13,
                                                            color: '#006AFF'
                                                        }}
                                                    >
                                                        Forgot Password?
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <TextInput
                                            autoCompleteType="password"
                                            textContentType="password"
                                            secureTextEntry={true}
                                            value={password}
                                            placeholder={''}
                                            onChangeText={(val: any) => setPassword(val)}
                                            placeholderTextColor={'#1F1F1F'}
                                        />
                                    </View>
                                )}
                                <View
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        paddingBottom: 10
                                    }}
                                >
                                    <TouchableOpacity
                                        disabled={isSubmitDisabled}
                                        onPress={() => {
                                            if (showForgotPassword) {
                                                forgotPassword();
                                            } else {
                                                handleLogin();
                                            }
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 35,
                                            marginTop: 15,
                                            width: '100%',
                                            justifyContent: 'center',
                                            flexDirection: 'row'
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: 'white',
                                                fontSize: 12,
                                                backgroundColor: '#006AFF',
                                                paddingHorizontal: 20,
                                                fontFamily: 'inter',
                                                height: 35,
                                                // width: 180,
                                                width: 175,
                                                borderRadius: 15,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {showForgotPassword
                                                ? PreferredLanguageText('reset')
                                                : PreferredLanguageText('login')}
                                        </Text>
                                    </TouchableOpacity>
                                    {/* Sign up button */}
                                    {/* {showForgotPassword ? null : (
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                width: '100%',
                                                marginTop: 20,
                                                flexDirection: 'row',
                                                justifyContent: 'center'
                                            }}>
                                            <Text>Not a member?</Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setShowSignupWindow(true);
                                                }}
                                                style={{ marginLeft: 5 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#006AFF'
                                                    }}>
                                                    Sign up now
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )} */}

                                    {/* {showForgotPassword ? null : (
                                        <View
                                            style={{
                                                maxWidth: 400,
                                                width: '100%',
                                                backgroundColor: 'white',
                                                justifyContent: 'space-between',
                                                alignSelf: 'center',
                                                flexDirection: 'row',
                                                marginTop: 20
                                            }}>
                                            <SocialMediaButton
                                                provider="facebook"
                                                appId={env === 'DEV' ? '922882341942535' : '746023139417168'}
                                                onLoginSuccess={handleSocialAuth}
                                                onLoginFailure={handleSocialAuthFailure}
                                                scope="public_profile,email">
                                                Sign in with Facebook
                                            </SocialMediaButton>

                                            <SocialMediaButton
                                                provider="google"
                                                appId="39948716442-erculsknud84na14b7mbd94f1is97477.apps.googleusercontent.com"
                                                onLoginSuccess={handleSocialAuth}
                                                onLoginFailure={handleSocialAuthFailure}
                                                key={'google'}
                                                scope={
                                                    'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
                                                }>
                                                Sign in with Google
                                            </SocialMediaButton>
                                        </View>
                                    )} */}

                                    {showForgotPassword ? (
                                        <TouchableOpacity
                                            onPress={() => setShowForgotPassword(false)}
                                            style={{
                                                backgroundColor: 'white',
                                                overflow: 'hidden',
                                                height: 35,
                                                marginTop: 15,
                                                marginBottom: 30,
                                                width: '100%',
                                                justifyContent: 'center',
                                                flexDirection: 'row'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#006AFF'
                                                }}
                                            >
                                                Back to Sign In
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                            <View
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    paddingLeft: 5,
                                    paddingBottom: 5,
                                    marginTop: 20
                                }}
                            >
                                {/* <LanguageSelect /> */}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            ) : null}
            {showHome &&
                !loadingCues &&
                !loadingUser &&
                !loadingSubs &&
                !loadingOrg &&
                !saveDataInProgress &&
                ((option === 'Classroom' && modalType !== 'Create') ||
                (option === 'To Do' && tab !== 'Add') ||
                (option === 'Inbox' && !showDirectory && !hideNewChatButton) ||
                (option === 'Channels' && !showCreate) ||
                (option === 'Settings' && !showHelp) ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (option === 'Classroom') {
                                setCueId('');
                                setModalType('');
                                setCreatedBy('');
                                // setChannelFilterChoice('All')
                                if (modalType === 'Update') {
                                    fadeAnimation.setValue(0);
                                    if (modalType === 'Update') {
                                        setChannelId('');
                                    }
                                    loadData(true);
                                }
                                openModal('Create');
                                // setShowHome(false)
                                // setMenuCollapsed(true)
                            } else if (option === 'To Do') {
                                setTab('Add');
                            } else if (option === 'Channels') {
                                setShowCreate(true);
                            } else if (option === 'Settings') {
                                window.open('https://www.learnwithcues.com/help', '_blank');
                            } else {
                                setShowDirectory(true);
                            }
                        }}
                        style={{
                            position: 'absolute',
                            marginRight:
                                Dimensions.get('window').width >= 1100
                                    ? (Dimensions.get('window').width - 1100) / 2 - 25
                                    : 20,
                            marginBottom: Dimensions.get('window').width < 768 ? 77 : 25,
                            right: 0,
                            justifyContent: 'center',
                            bottom: 0,
                            width: 58,
                            height: 58,
                            borderRadius: 29,
                            backgroundColor: '#006AFF',
                            borderColor: '#f2f2f2',
                            borderWidth: 0,
                            shadowColor: '#000',
                            shadowOffset: {
                                width: 4,
                                height: 4
                            },
                            shadowOpacity: 0.12,
                            shadowRadius: 10,
                            zIndex: showLoginWindow ? 40 : 500000
                        }}
                    >
                        <Text style={{ color: '#fff', width: '100%', textAlign: 'center' }}>
                            {option === 'Classroom' ? (
                                <Ionicons name="pencil-outline" size={25} />
                            ) : option === 'To Do' ? (
                                <Ionicons name="add-outline" size={35} />
                            ) : option === 'Channels' ? (
                                <Ionicons name="add-outline" size={35} />
                            ) : option === 'Inbox' ? (
                                <Ionicons name="person-add-outline" size={21} />
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
                        overflow: 'hidden'
                    }}
                >
                    <View
                        key={option}
                        style={{
                            position: 'absolute',
                            zIndex: 525,
                            display: 'flex',
                            backgroundColor: 'white',
                            width: '100%',
                            height: '100%',
                            borderRadius: 0,
                            marginTop: 0
                        }}
                    >
                        {loadingCues || loadingUser || loadingSubs || loadingOrg || saveDataInProgress ? (
                            <View style={[styles(channelId).activityContainer, styles(channelId).horizontal]}>
                                <ActivityIndicator color={'#1F1F1F'} />
                            </View>
                        ) : (
                            <Dashboard
                                version={version}
                                setTab={(val: any) => setTab(val)}
                                tab={tab}
                                setShowCreate={(val: any) => setShowCreate(val)}
                                showCreate={showCreate}
                                setShowHelp={(val: any) => setShowHelp(val)}
                                showHelp={showHelp}
                                showDirectory={showDirectory}
                                setShowDirectory={(val: any) => setShowDirectory(val)}
                                setOption={(op: any) => setOption(op)}
                                option={option}
                                options={options}
                                refreshSubscriptions={refreshSubscriptions}
                                hideHome={() => {
                                    setShowHome(false);
                                    loadData();
                                }}
                                closeModal={() => {
                                    setShowHome(true);
                                    closeModal();
                                }}
                                saveDataInCloud={async () => await saveDataInCloud()}
                                reOpenProfile={() => {
                                    setModalType('');
                                    openModal('Profile');
                                }}
                                reloadData={() => {
                                    loadDataFromCloud();
                                }}
                                openCreate={() => {
                                    setCueId('');
                                    setModalType('');
                                    setCreatedBy('');
                                    if (modalType === 'Update') {
                                        fadeAnimation.setValue(0);
                                        if (modalType === 'Update') {
                                            setChannelId('');
                                        }
                                        loadData(true);
                                    }
                                    openModal('Create');
                                }}
                                cues={dateFilteredCues}
                                setChannelId={(id: string) => setChannelId(id)}
                                setChannelCreatedBy={(id: any) => setChannelCreatedBy(id)}
                                subscriptions={subscriptions}
                                openDiscussion={() => openModal('Discussion')}
                                openSubscribers={() => openModal('Subscribers')}
                                openGrades={() => openModal('Grades')}
                                openMeeting={() => openModal('Meeting')}
                                openChannelSettings={() => openModal('ChannelSettings')}
                                openUpdate={(index: any, key: any, pageNumber: any, _id: any, by: any, cId: any) =>
                                    openUpdate(index, key, pageNumber, _id, by, cId)
                                }
                                calendarCues={cues}
                                openCueFromCalendar={openCueFromCalendar}
                                key={
                                    option.toString() +
                                    showHome.toString() +
                                    tab.toString() +
                                    showDirectory.toString() +
                                    showCreate.toString() +
                                    showHelp.toString() +
                                    subscriptions.toString()
                                }
                                openDiscussionFromActivity={(channelId: string) => {
                                    setOption('Classroom');
                                    setLoadDiscussionForChannelId(channelId);
                                }}
                                openChannelFromActivity={(channelId: string) => {
                                    setOption('Classroom');
                                    setOpenChannelId(channelId);
                                }}
                                openQAFromSearch={(channelId: any, cueId: string) => {
                                    const subscription = subscriptions.find((sub: any) => {
                                        return sub.channelId === channelId;
                                    });

                                    if (subscription) {
                                        openCueFromCalendar(channelId, cueId, subscription.channelCreatedBy);
                                        setTarget('Q&A');
                                    }
                                }}
                                openQAFromActivity={(channelId: any, cueId: string, by: string) => {
                                    openCueFromCalendar(channelId, cueId, by);
                                    setTarget('Q&A');
                                }}
                                openDiscussionFromSearch={(channelId: any) => {
                                    // Find channel Created By from subscriptions
                                    setOption('Classroom');
                                }}
                                openClassroom={(channelId: any) => {
                                    // Find channel Created By from subscriptions
                                    const match = subscriptions.filter((sub: any) => {
                                        return sub.channelId === channelId;
                                    });
                                    if (match && match.length !== 0) {
                                        const createdBy = match[0].channelCreatedBy;
                                        setChannelId(channelId);
                                        setChannelCreatedBy(createdBy);
                                        setCreatedBy(createdBy);
                                        openModal('Meeting');
                                        setShowHome(false);
                                    }
                                }}
                                loadDiscussionForChannelId={loadDiscussionForChannelId}
                                setLoadDiscussionForChannelId={setLoadDiscussionForChannelId}
                                openChannelId={openChannelId}
                                setOpenChannelId={setOpenChannelId}
                                modalType={modalType}
                                customCategories={customCategories}
                                closeCreateModal={() => {
                                    setModalType('');
                                    setPageNumber(0);
                                }}
                                closeOnCreate={async () => {
                                    setModalType('');
                                    setPageNumber(0);
                                    await loadData(true);
                                    await loadData();
                                }}
                                unreadMessages={unreadMessages}
                                refreshUnreadInbox={refreshUnreadInbox}
                                hideNewChatButton={(hide: boolean) => setHideNewChatButton(hide)}
                                openHelpModal={(show: boolean) => setShowOnboardModal(true)}
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
                    overflow: 'hidden'
                }}
            >
                {modalType === 'Update' ? (
                    <Update
                        version={version}
                        key={cueId.toString()}
                        customCategories={customCategories}
                        cue={cues[updateModalKey][updateModalIndex]}
                        cueIndex={updateModalIndex}
                        cueKey={updateModalKey}
                        closeModal={() => closeModal()}
                        cueId={cueId}
                        createdBy={createdBy}
                        channelId={channelId}
                        channelCreatedBy={channelCreatedBy}
                        channelCues={cues[channelId]}
                        reloadCueListAfterUpdate={() => reloadCueListAfterUpdate()}
                        target={target}
                        openCue={(cueId: string) => openCueFromCalendar(channelId, cueId, channelCreatedBy)}
                        refreshCues={refreshChannelCues}
                    />
                ) : null}
            </View>

            {Dimensions.get('window').width < 768 && showHome ? (
                <View
                    style={{
                        position: 'absolute',
                        backgroundColor: '#000000',
                        alignSelf: 'flex-end',
                        width: '100%',
                        paddingTop: 14,
                        paddingBottom: Dimensions.get('window').width < 768 ? 10 : 20,
                        paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 40,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        height: Dimensions.get('window').width < 768 ? 54 : 68,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: -7
                        },
                        shadowOpacity: 0.12,
                        shadowRadius: 10,
                        zIndex: showLoginWindow ? 40 : 500000
                    }}
                >
                    {options.map((op: any) => {
                        if (op === 'Settings' || op === 'Channels') {
                            return;
                        }
                        return (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#000000'
                                }}
                                onPress={() => {
                                    setOption(op);
                                    if (op === 'Browse') {
                                        // open create
                                        setCueId('');
                                        setModalType('');
                                        setCreatedBy('');
                                        if (modalType === 'Update') {
                                            fadeAnimation.setValue(0);
                                            if (modalType === 'Update') {
                                                setChannelId('');
                                            }
                                            loadData(true);
                                        }
                                        openModal('Create');
                                    }
                                    if (op === 'Classroom') {
                                        setModalType('');
                                        setPageNumber(0);
                                    }
                                }}
                            >
                                <Text style={op === option ? styles('').allGrayFill : styles('').all}>
                                    {op === 'Classroom'
                                        ? version === 'read'
                                            ? 'Library'
                                            : 'Workspace'
                                        : op === 'Performance'
                                        ? 'Performance'
                                        : op === 'To Do'
                                        ? 'Agenda'
                                        : op}
                                </Text>
                                {op === 'Inbox' && unreadMessages > 0 ? (
                                    <View
                                        style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: 7,
                                            backgroundColor: '#f94144',
                                            position: 'absolute',
                                            top: -3,
                                            right: 5
                                        }}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : null}
            {
                <Popup
                    isOpen={showOnboardModal}
                    buttons={[
                        // {
                        //     text: 'BEGIN USE',
                        //     handler: function(event) {
                        //         setShowOnboardModal(false)
                        //     }
                        // },
                        // {
                        //     text: 'HELP',
                        //     handler: function(event) {
                        //         setShowOnboardModal(false)
                        //     }
                        // },
                    ]}
                    themeVariant="light"
                    theme="ios"
                    onClose={() => setShowOnboardModal(false)}
                    responsive={{
                        small: {
                            display: 'center'
                        },
                        medium: {
                            display: 'center'
                        }
                    }}
                >
                    {/* Show all the settings here */}
                    <View
                        style={{ flexDirection: 'column', backgroundColor: 'none', width: Dimensions.get('window').width < 768 ? '100%' : 480 , marginHorizontal: Dimensions.get('window').width < 768 ? 0 : 25 }}
                        className="mbsc-align-center mbsc-padding"
                    >
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#f2f2f7',
                            paddingVertical: 20
                        }}>
                            <Text 
                                style={{
                                    fontSize: Dimensions.get('window').width < 768 ? 24 : 28,
                                    color: '#000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                {renderTimeMessage()}
                            </Text>
                            
                            <View 
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#f2f2f7',
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
                                        backgroundColor: '#f2f2f7',
                                        
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 30,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#006AFF',
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 30,
                                            borderRadius: 15,
                                            width: 90,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        HELP
                                    </Text>
                                </TouchableOpacity>

                                {/* <TouchableOpacity
                                    onPress={() => {
                                       setShowOnboardModal(false)
                                    }}
                                    style={{
                                        backgroundColor: '#f2f2f7',
                                        marginLeft: 15
                                    }}
                                >
                                    <Ionicons name="close-outline" size={22} />
                                </TouchableOpacity> */}
                            </View>
                        </View>

                        <div style={{
                            marginTop: 20,
                            marginBottom: 20,
                            display: "flex", 
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}>
                            <iframe
                            width={Dimensions.get('window').width < 768 ? '300' : "480"}
                            height={Dimensions.get('window').width < 768 ? '230' : "300"}
                            src={`https://www.youtube.com/embed/64GhiDvem4o`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Embedded youtube"
                            />
                        </div>

                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#f2f2f7',
                            paddingVertical: 20
                        }}>
                            {/* <Text 
                                style={{
                                    fontSize: 22,
                                    color: '#000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Download Apps
                            </Text> */}

                            {/* <View 
                                style={{ 
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#f2f2f7',
                                    // paddingRight: 50 
                                }}
                            >

                                <Text style={{ paddingRight: 15, fontSize: 16 }}>
                                    DESKTOP
                                </Text> */}

                                <TouchableOpacity
                                    onPress={() => {
                                        window.open('https://cues-files.s3.amazonaws.com/builds/Cues-setup.dmg', '_blank');
                                    }}
                                    style={{
                                        overflow: 'hidden',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        backgroundColor: '#f2f2f7',
                                        paddingRight: 35
                                    }}
                                >
                                    <Ionicons name='logo-apple' size={ Dimensions.get('window').width < 768 ? 30 : 35} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        window.open('https://cues-files.s3.amazonaws.com/builds/Cues-setup.exe', '_blank');
                                    }}
                                    style={{
                                        overflow: 'hidden',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        backgroundColor: '#f2f2f7',
                                        paddingRight: 35
                                    }}
                                >
                                    <Ionicons name='logo-windows' size={ Dimensions.get('window').width < 768 ? 30 : 35} />
                                </TouchableOpacity>

                            {/* </View>

                            <View 
                                style={{ 
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#f2f2f7',
                                    paddingRight: 35 
                                }}
                            >

                                <Text style={{ paddingRight: 15, fontSize: 16 }}>
                                    MOBILE
                                </Text> */}

                                <TouchableOpacity
                                    onPress={() => {
                                        Alert("Available soon!")
                                        // window.open('https://www.learnwithcues.com/help', '_blank');
                                    }}
                                    style={{
                                        overflow: 'hidden',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        backgroundColor: '#f2f2f7',
                                        paddingRight: 35
                                    }}
                                >
                                    <Ionicons name='logo-apple-appstore' size={ Dimensions.get('window').width < 768 ? 30 : 35}/>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        Alert("Available soon!")
                                        // window.open('https://www.learnwithcues.com/help', '_blank');
                                    }}
                                    style={{
                                        overflow: 'hidden',
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                        backgroundColor: '#f2f2f7'
                                    }}
                                >
                                    <Ionicons name='logo-android' size={ Dimensions.get('window').width < 768 ? 30 : 35} />
                                </TouchableOpacity>

                            {/* </View> */}
                        </View>

                        
                    </View>
                </Popup>
            }
        </View>
    );
};

export default Home;

const styles = (channelId: string) =>
    StyleSheet.create({
        container: {
            flex: 1,
            flexDirection: 'row',
            height: '100%'
        },
        all: {
            fontSize: 12,
            color: '#fff',
            fontWeight: 'bold',
            height: 25,
            paddingHorizontal: 12,
            backgroundColor: '#000000',
            lineHeight: 25,
            fontFamily: 'overpass',
            textTransform: 'uppercase'
        },
        allGrayFill: {
            fontSize: 12,
            color: '#fff',
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#006AFF',
            lineHeight: 25,
            height: 25,
            fontFamily: 'inter',
            textTransform: 'uppercase'
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
            backgroundColor: '#f2f2f2'
        },
        horizontal: {
            flexDirection: 'row',
            justifyContent: 'space-around'
        },
        input: {
            width: '100%',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: 1,
            fontSize: 14,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20
        }
    });
