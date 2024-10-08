// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// API
import {
    checkChannelStatus,
    checkChannelStatusForCode,
    createChannel,
    findBySchoolId,
    subscribe,
    getUserCount,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { TextInput } from './CustomTextInput';
import { Text, View, TouchableOpacity } from './Themed';
import Alert from '../components/Alert';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import { CirclePicker } from 'react-color';
import '@pathofdev/react-tag-input/build/index.css';
import { Select } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const ChannelControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, user, subscriptions, refreshSubscriptions } = useAppContext();

    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [displayName, setDisplayName] = useState(user.displayName);
    const [fullName, setFullName] = useState(user.fullName);
    const [temporary, setTemporary] = useState(false);
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [tags, setTags] = useState<string[]>([]);
    const [role] = useState(user.role);
    const [userCreatedOrg] = useState(user.userCreatedOrg);
    const [colorCode, setColorCode] = useState('');
    const [channels, setChannels] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [options, setOptions] = useState<any[]>([]);
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joinWithCode, setJoinWithCode] = useState('');
    const [joinWithCodeDisabled, setJoinWithCodeDisabled] = useState(true);

    const [sortChannels, setSortChannels] = useState<any[]>([]);
    const [subIds, setSubIds] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('create');

    const colorChoices = [
        '#0450b4',
        '#046dc8',
        '#1184a7',
        '#15a2a2',
        '#6fb1a0',
        '#b4418e',
        '#d94a8c',
        '#ea515f',
        '#fe7434',
        '#f48c06',
    ];

    const grades = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const sections = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
    ];
    const filterRoleOptions = [
        {
            value: 'All',
            text: 'All Users',
        },
        {
            value: 'student',
            text: 'Student',
        },
        {
            value: 'instructor',
            text: 'Instructor',
        },
    ];
    const gradeOptions = grades.map((g: any) => {
        return {
            value: g,
            text: g,
        };
    });
    const filterGradeOptions = [
        {
            value: 'All',
            text: 'All Grades',
        },
        ...gradeOptions,
    ];
    const sectionOptions = sections.map((s: any) => {
        return {
            value: s,
            text: s,
        };
    });
    const filterSectionOptions = [
        {
            value: 'All',
            text: 'All Sections',
        },
        ...sectionOptions,
    ];
    const [activeRole, setActiveRole] = useState('All');
    const [activeGrade, setActiveGrade] = useState('All');
    const [activeSection, setActiveSection] = useState('All');
    const [selectedValues, setSelectedValues] = useState<any[]>([]);
    const [selectedModerators, setSelectedModerators] = useState<any[]>([]);
    const incorrectPasswordAlert = PreferredLanguageText('incorrectPassword');
    const alreadySubscribedAlert = PreferredLanguageText('alreadySubscribed');
    const somethingWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const doesNotExistAlert = PreferredLanguageText('doesNotExists');
    const invalidChannelNameAlert = PreferredLanguageText('invalidChannelName');
    const nameAlreadyInUseAlert = PreferredLanguageText('nameAlreadyInUse');
    const moderatorOptions = selectedValues.map((value: any) => {
        const match = options.find((o: any) => {
            return o.value === value;
        });

        return match;
    });

    const server = useApolloClient();

    // HOOKS

    useEffect(() => {
        fetchSchoolUsers(user.schoolId);
    }, [user]);

    /**
     * @description Filter dropdown users based on Roles, Grades and Section
     */
    useEffect(() => {
        let filteredUsers = [...allUsers];

        // First filter by role

        if (activeRole !== 'All') {
            const filterRoles = filteredUsers.filter((user: any) => {
                return user.role === activeRole || selectedValues.includes(user._id);
            });

            filteredUsers = filterRoles;
        }

        if (activeGrade !== 'All') {
            const filterGrades = filteredUsers.filter((user: any) => {
                return user.grade === activeGrade || selectedValues.includes(user._id);
            });

            filteredUsers = filterGrades;
        }

        if (userId !== '') {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== userId;
            });

            filteredUsers = filterOutMainOwner;
        }

        if (activeSection !== 'All') {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection || selectedValues.includes(user._id);
            });

            filteredUsers = filterSections;
        }

        let filteredOptions = filteredUsers.map((user: any) => {
            return {
                group: user.fullName[0].toUpperCase(),
                text: user.fullName + ', ' + user.email,
                value: user._id,
            };
        });

        const sort = filteredOptions.sort((a, b) => {
            if (a.group < b.group) {
                return -1;
            }
            if (a.group > b.group) {
                return 1;
            }
            return 0;
        });

        setOptions(sort);
    }, [activeRole, activeGrade, activeSection, userId, allUsers]);

    /**
     * @description Validate submit for new channel
     */
    useEffect(() => {
        if (name !== '') {
            setIsSubmitDisabled(false);
            return;
        }

        setIsSubmitDisabled(true);
    }, [name, password, passwordRequired, props.showCreate, colorCode]);

    useEffect(() => {
        const subSet = new Set();
        subscriptions.map((sub: any) => {
            subSet.add(sub.channelId);
        });
        setSubIds(Array.from(subSet.values()));
    }, [subscriptions]);

    useEffect(() => {
        const sort = channels.sort((a: any, b: any) => {
            const aSubscribed = subscriptions.find((sub: any) => sub.channelId === a._id);

            const bSubscribed = subscriptions.find((sub: any) => sub.channelId === b._id);

            if (aSubscribed && !bSubscribed) {
                return -1;
            } else if (!aSubscribed && bSubscribed) {
                return 1;
            } else {
                return 0;
            }
        });

        setSortChannels(sort);
    }, [channels, subscriptions]);

    /**
     * @description Validate submit for join channel with code
     */
    useEffect(() => {
        if (joinWithCode !== '' && joinWithCode.length === 9) {
            setJoinWithCodeDisabled(false);
        } else {
            setJoinWithCodeDisabled(true);
        }
    }, [joinWithCode]);

    /**
     * @description Fetches channels for users
     */
    useEffect(() => {
        server
            .query({
                query: findBySchoolId,
                variables: {
                    schoolId: user.schoolId,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.channel.findBySchoolId) {
                    const fetchChannels = [...res.data.channel.findBySchoolId];

                    const sortedChannels = fetchChannels.sort((a: any, b: any) => {
                        if (a.name < b.name) {
                            return -1;
                        }
                        if (a.name > b.name) {
                            return 1;
                        }
                        return 0;
                    });
                    setChannels(sortedChannels);
                    setLoading(false);
                }
            })
            .catch((err) => {
                setLoading(false);
            });
    }, [user]);

    /**
     * @description Fetch all users to allow selection for Users to create channel
     */
    const fetchSchoolUsers = useCallback((schoolId) => {
        server
            .query({
                query: getUserCount,
                variables: {
                    schoolId,
                },
            })
            .then((res) => {
                const schoolUsers = [...res.data.user.getSchoolUsers];

                schoolUsers.sort((a: any, b: any) => {
                    if (a.fullName < b.fullName) {
                        return -1;
                    }
                    if (a.fullName > b.fullName) {
                        return 1;
                    }
                    return 0;
                });

                setAllUsers(schoolUsers);

                const tempUsers: any[] = [];
                schoolUsers.map((item: any, index: any) => {
                    const x = { ...item, selected: false, index };
                    delete x.__typename;
                    tempUsers.push({
                        group: item.fullName[0].toUpperCase(),
                        text: item.fullName + ', ' + item.email,
                        value: item._id,
                    });
                    return x;
                });

                const sort = tempUsers.sort((a, b) => {
                    if (a.text < b.text) {
                        return -1;
                    }
                    if (a.text > b.text) {
                        return 1;
                    }
                    return 0;
                });

                setOptions(sort);
            });
    }, []);

    /**
     * @description Subscribes user to a channel
     */
    const handleSubscribe = useCallback((channelId, pass) => {
        server
            .mutate({
                mutation: subscribe,
                variables: {
                    userId,
                    channelId,
                    password: pass,
                },
            })
            .then((res) => {
                if (res.data.subscription && res.data.subscription.subscribe) {
                    const subscriptionStatus = res.data.subscription.subscribe;
                    switch (subscriptionStatus) {
                        case 'subscribed':
                            Alert('Subscribed successfully!');
                            // Refresh subscriptions
                            refreshSubscriptions();
                            break;
                        case 'incorrect-password':
                            Alert(incorrectPasswordAlert);
                            break;
                        case 'already-subbed':
                            Alert(alreadySubscribedAlert);
                            break;
                        case 'error':
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                    }
                }
            })
            .catch((err) => {
                Alert(somethingWrongAlert, checkConnectionAlert);
            });
    }, []);

    /**
     * @description Fetches status of channel and depending on that handles subscription to channel
     */
    const handleSub = useCallback(
        async (channelId) => {
            server
                .query({
                    query: checkChannelStatus,
                    variables: {
                        channelId,
                    },
                })
                .then(async (res) => {
                    if (res.data.channel && res.data.channel.getChannelStatus) {
                        const channelStatus = res.data.channel.getChannelStatus;
                        switch (channelStatus) {
                            case 'password-not-required':
                                handleSubscribe(channelId, '');
                                break;
                            case 'password-required':
                                let pass: any = await prompt('Enter Password');
                                if (!pass || pass === '') {
                                    Alert('Enter a valid password.');
                                    return;
                                }
                                handleSubscribe(channelId, pass);
                                break;
                            case 'non-existant':
                                Alert(doesNotExistAlert);
                                break;
                            default:
                                Alert(somethingWrongAlert, checkConnectionAlert);
                                break;
                        }
                    }
                })
                .catch((err) => {
                    console.log(err);
                    Alert(somethingWrongAlert, checkConnectionAlert);
                });
        },
        [passwordRequired, displayName, fullName, temporary]
    );

    /**
     * @description Fetches status of channel using code and then handles subscription
     */
    const handleSubmitCode = useCallback(async () => {
        server
            .query({
                query: checkChannelStatusForCode,
                variables: {
                    accessCode: joinWithCode,
                },
            })
            .then((res) => {
                if (res.data.channel && res.data.channel.getChannelStatusForCode) {
                    const channelStatus = res.data.channel.getChannelStatusForCode.split(':');

                    switch (channelStatus[0]) {
                        case 'password-not-required':
                            handleSubscribe(channelStatus[1], '');
                            break;
                        case 'password-required':
                            let pass: any = prompt('Enter Password');
                            if (!pass) {
                                pass = '';
                            }
                            handleSubscribe(channelStatus[1], pass);
                            break;
                        case 'non-existant':
                            Alert(doesNotExistAlert);
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                Alert(somethingWrongAlert, checkConnectionAlert);
            });
    }, [joinWithCode]);

    /**
     * @description Handle create new channel
     */
    const handleSubmit = useCallback(async () => {
        if (colorCode === '') {
            Alert('Select color theme for channel.');
            return;
        }

        setIsSubmitting(true);

        if (name.toString().trim() === '') {
            return;
        }

        server
            .mutate({
                mutation: createChannel,
                variables: {
                    name,
                    password,
                    createdBy: userId,
                    temporary,
                    colorCode,
                    description,
                    tags,
                    isPublic,
                    moderators: selectedModerators,
                    subscribers: selectedValues,
                },
            })
            .then((res) => {
                if (res.data.channel.create) {
                    const channelCreateStatus = res.data.channel.create;
                    setIsSubmitting(false);
                    switch (channelCreateStatus) {
                        case 'created':
                            Alert('Course created successfully');
                            props.setShowCreate(false);
                            // Refresh subs
                            refreshSubscriptions();
                            break;
                        case 'invalid-name':
                            Alert(invalidChannelNameAlert);
                            break;
                        case 'exists':
                            Alert(nameAlreadyInUseAlert);
                            break;
                        case 'error':
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                        default:
                            Alert(somethingWrongAlert, checkConnectionAlert);
                            break;
                    }
                }
            })
            .catch((err) => {
                setIsSubmitting(false);
                Alert(somethingWrongAlert, checkConnectionAlert);
            });
    }, [
        name,
        password,
        passwordRequired,
        displayName,
        fullName,
        temporary,
        colorCode,
        description,
        isPublic,
        tags,
        selectedModerators,
        selectedValues,
    ]);

    // FUNCTIONS

    /**
     * @description Renders filters for Subscribers dropdown
     */
    const renderSubscriberFilters = () => {
        return (
            <View style={{ width: '100%', flexDirection: 'column', backgroundColor: 'white', marginTop: 20 }}>
                <View style={{ backgroundColor: 'white' }}>
                    <View style={{ backgroundColor: 'white' }}>
                        <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                            <Select
                                touchUi={true}
                                value={activeRole}
                                rows={3}
                                themeVariant="light"
                                onChange={(val: any) => {
                                    setActiveRole(val.value);
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble',
                                    },
                                    medium: {
                                        touchUi: false,
                                    },
                                }}
                                data={filterRoleOptions}
                            />
                        </label>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 15 }}>
                    <View style={{ backgroundColor: 'white', paddingRight: 20 }}>
                        <View style={{ backgroundColor: 'white' }}>
                            <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                                <Select
                                    touchUi={true}
                                    value={activeGrade}
                                    themeVariant="light"
                                    onChange={(val: any) => {
                                        setActiveGrade(val.value);
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble',
                                        },
                                        medium: {
                                            touchUi: false,
                                        },
                                    }}
                                    data={filterGradeOptions}
                                />
                            </label>
                        </View>
                    </View>
                    <View style={{ backgroundColor: 'white' }}>
                        <View style={{ backgroundColor: 'white' }}>
                            <label style={{ width: Dimensions.get('window').width < 768 ? 120 : 150 }}>
                                <Select
                                    touchUi={true}
                                    value={activeSection}
                                    themeVariant="light"
                                    onChange={(val: any) => {
                                        setActiveSection(val.value);
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble',
                                        },
                                        medium: {
                                            touchUi: false,
                                        },
                                    }}
                                    data={filterSectionOptions}
                                />
                            </label>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderTabs = () => {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingTop: 5 }}>
                <TouchableOpacity
                    style={activeTab === 'create' ? styles.selectedButton : styles.unselectedButton}
                    onPress={() => {
                        setActiveTab('create');
                    }}
                >
                    <Text style={activeTab === 'create' ? styles.selectedText : styles.unselectedText}>
                        {' '}
                        {activeTab === 'create' ? 'Create Course' : 'Create'}{' '}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={activeTab !== 'create' ? styles.selectedButton : styles.unselectedButton}
                    onPress={() => {
                        setActiveTab('join');
                    }}
                >
                    <Text style={activeTab !== 'create' ? styles.selectedText : styles.unselectedText}>
                        {activeTab === 'join' ? 'Join a Course' : 'Join'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View
                style={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    justifyContent: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    alignSelf: 'center',
                    marginTop: 100,
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    return (
        <View
            style={{
                width: '100%',
                maxHeight:
                    Dimensions.get('window').width < 768
                        ? Dimensions.get('window').height - (54 + 60)
                        : // : Dimensions.get('window').width < 1024
                          // ? Dimensions.get('window').height - (64 + 68 + 54)
                          Dimensions.get('window').height - (64 + 54),
                // backgroundColor: props.showCreate ? "#fff" : '#f2f2f2',
                justifyContent: 'center',
                flexDirection: 'row',
            }}
            key={1}
        >
            <View style={{ width: '100%', maxWidth: 1024, backgroundColor: props.showCreate ? '#fff' : '#f2f2f2' }}>
                {/* Back Button */}
                {props.showCreate ? (
                    <View
                        style={{ flexDirection: 'row', width: '100%', height: 50, marginBottom: 10, paddingLeft: 10 }}
                    >
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    props.setShowCreate(false);
                                }}
                                style={{
                                    paddingRight: 20,
                                    paddingTop: 10,
                                    alignSelf: 'flex-start',
                                    paddingBottom: 10,
                                }}
                            >
                                <Text style={{ lineHeight: 34, width: '100%', textAlign: 'center' }}>
                                    <Ionicons name="arrow-back-outline" size={32} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}
                {/* Main Content */}
                {!props.showCreate ? (
                    <View
                        style={{
                            backgroundColor: '#fff',
                            width: '100%',
                            // minHeight: Dimensions.get("window").height - 52
                        }}
                        key={sortChannels.length + subIds.length}
                    >
                        {sortChannels.length === 0 ? (
                            <View
                                style={{
                                    width: '100%',
                                    flex: 1,
                                    justifyContent: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: '#fff',
                                    paddingVertical: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    No courses found. Click on + to {role === 'instructor' ? 'create ' : 'join '} a
                                    course.
                                </Text>
                            </View>
                        ) : (
                            <View
                                style={{
                                    borderColor: '#f2f2f2',
                                    backgroundColor: '#f8f8f8',
                                    overflow: 'hidden',
                                    borderRadius: 1,
                                    // shadowColor: "#000",
                                    // shadowOffset: {
                                    //     width: 4,
                                    //     height: 4,
                                    // },
                                    // shadowOpacity: 0.12,
                                    // shadowRadius: 10,
                                }}
                            >
                                <ScrollView
                                    contentContainerStyle={{
                                        maxHeight:
                                            Dimensions.get('window').width < 768
                                                ? Dimensions.get('window').height - (54 + 60)
                                                : // : Dimensions.get('window').width < 1024
                                                  // ? Dimensions.get('window').height - (64 + 68)
                                                  Dimensions.get('window').height - (64 + 54),
                                        width: '100%',
                                    }}
                                    showsVerticalScrollIndicator={true}
                                >
                                    {sortChannels.map((channel: any, ind: number) => {
                                        const subscribed = subIds.includes(channel._id);

                                        let role = 'Viewer';

                                        // Check if user is a moderator or the owner
                                        if (subscribed && userId !== '') {
                                            const isModerator = channel.owners.includes(userId);

                                            if (channel.channelCreator === userId) {
                                                role = 'Instructor';
                                            } else if (isModerator) {
                                                role = 'Instructor';
                                            }
                                        }

                                        return (
                                            <View
                                                key={ind.toString()}
                                                style={{
                                                    backgroundColor: '#fff',
                                                    flexDirection: 'row',
                                                    borderColor: '#f2f2f2',
                                                    borderBottomWidth: ind === channels.length - 1 ? 0 : 1,
                                                    width: '100%',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        padding: 5,
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                    }}
                                                >
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
                                                        source={{
                                                            uri: channel.createdByAvatar
                                                                ? channel.createdByAvatar
                                                                : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                        }}
                                                    />
                                                </View>
                                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 5 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: Dimensions.get('window').width < 768 ? 15 : 16,
                                                            padding: 5,
                                                            fontFamily: 'inter',
                                                            marginTop: 5,
                                                        }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {channel.name}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: Dimensions.get('window').width < 768 ? 13 : 14,
                                                            padding: 5,
                                                        }}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {channel.createdByUsername}
                                                    </Text>
                                                </View>
                                                <View style={{ padding: 20 }}>
                                                    {!subscribed ? (
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                paddingLeft: 10,
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    Alert('Subscribe to ' + channel.name + '?', '', [
                                                                        {
                                                                            text: 'Cancel',
                                                                            style: 'cancel',
                                                                            onPress: () => {
                                                                                return;
                                                                            },
                                                                        },
                                                                        {
                                                                            text: 'Yes',
                                                                            onPress: () => handleSub(channel._id),
                                                                        },
                                                                    ]);
                                                                }}
                                                                disabled={user.email === disableEmailId}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        textAlign: 'center',
                                                                        fontSize: 14,
                                                                        color: '#000',
                                                                        marginRight: 10,
                                                                    }}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    <Ionicons
                                                                        name="enter-outline"
                                                                        size={
                                                                            Dimensions.get('window').width < 768
                                                                                ? 18
                                                                                : 20
                                                                        }
                                                                    />
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                                paddingLeft: 10,
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    textAlign: 'center',
                                                                    fontSize:
                                                                        Dimensions.get('window').width < 768 ? 14 : 15,
                                                                    fontFamily: 'inter',
                                                                    color:
                                                                        channel.channelCreator === userId ||
                                                                        channel.owners.includes(userId)
                                                                            ? '#000'
                                                                            : '#1F1F1F',
                                                                }}
                                                            >
                                                                {role}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                ) : (
                    <View
                        style={{
                            backgroundColor: 'white',
                            width: '100%',
                            maxWidth: 500,
                            alignSelf: 'center',
                            paddingTop: Dimensions.get('window').width < 768 ? (props.isOwner ? 20 : 0) : 0,
                            paddingHorizontal: Dimensions.get('window').width < 768 ? 20 : 0,
                            flexDirection: 'column',
                        }}
                    >
                        {/* {role !== 'instructor' ? null : renderTabs()} */}

                        {/* Join channel with code */}

                        <View
                            style={{
                                padding: 15,
                                width: '100%',
                                marginBottom: 30,
                                // marginTop: Dimensions.get('window').width < 768 ? 0 : 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontFamily: 'Inter',
                                    color: '#000000',
                                    textAlign: 'center',
                                    marginBottom: 10,
                                }}
                            >
                                Join a course
                            </Text>

                            <TextInput
                                value={joinWithCode}
                                placeholder={'Access Code'}
                                textContentType={'none'}
                                autoCompleteType={'off'}
                                onChangeText={(val) => {
                                    setJoinWithCode(val);
                                }}
                                placeholderTextColor={'#7d7f7c'}
                            />
                            <TouchableOpacity
                                onPress={() => handleSubmitCode()}
                                disabled={joinWithCodeDisabled || user.email === disableEmailId}
                                style={{
                                    marginTop: 10,
                                    backgroundColor: 'white',
                                    // overflow: 'hidden',
                                    // height: 35,
                                    width: '100%',
                                    justifyContent: 'center',
                                    flexDirection: 'row',
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
                                        paddingHorizontal: 24,
                                        fontFamily: 'inter',
                                        overflow: 'hidden',
                                        paddingVertical: 14,
                                        textTransform: 'uppercase',
                                        width: 150,
                                    }}
                                >
                                    Join
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {role === 'instructor' ? (
                            <View
                                style={{ width: '100%', paddingTop: 30, borderTopColor: '#cccccc', borderTopWidth: 1 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: 'Inter',
                                        color: '#000000',
                                        textAlign: 'center',
                                        marginBottom: 10,
                                    }}
                                >
                                    Create a course
                                </Text>

                                <View style={{ backgroundColor: 'white' }}>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        {PreferredLanguageText('name')}
                                    </Text>
                                    <TextInput
                                        value={name}
                                        placeholder={''}
                                        id={'channel-name'}
                                        name={'channel-name'}
                                        textContentType={'none'}
                                        autoCompleteType={'xyz'}
                                        onChangeText={(val) => {
                                            setName(val);
                                            setPasswordRequired(false);
                                        }}
                                        placeholderTextColor={'#1F1F1F'}
                                        required={true}
                                        // footerMessage={'case sensitive'}
                                    />
                                </View>

                                {/* {!school ? <View style={{ backgroundColor: 'white' }}>
                                <Text style={{
                                    fontSize: 15,
                                    color: '#000000'
                                }}>
                                    Description
                                </Text>
                                <TextareaAutosize
                                value={description}
                                style={{
                                    fontFamily: 'overpass',
                                    width: "100%",
                                    maxWidth: 500,
                                    borderBottom: '1px solid #f2f2f2',
                                    fontSize: 15,
                                    paddingTop: 13,
                                    paddingBottom: 13,
                                    marginTop: 12,
                                    marginBottom: 20,
                                    borderRadius: 1,
                                    // height: 80
                                }}
                                minRows={2}
                                placeholder={""}
                                onChange={(e: any) => setDescription(e.target.value)}
                                />
                            </View> : null} */}

                                <View style={{ backgroundColor: 'white' }}>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                            color: '#000000',
                                        }}
                                    >
                                        {PreferredLanguageText('enrolmentPassword')}
                                    </Text>
                                    <TextInput
                                        value={password}
                                        textContentType={'none'}
                                        id={'channel-password'}
                                        name={'channel-password'}
                                        autoCompleteType={'xyz'}
                                        placeholder={PreferredLanguageText('optional')}
                                        onChangeText={(val) => setPassword(val)}
                                        placeholderTextColor={'#1F1F1F'}
                                        required={false}
                                    />
                                </View>

                                <View
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    {/* <View
                                            style={{
                                                width: "100%",
                                                paddingBottom: 15,
                                                backgroundColor: "white"
                                            }}>
                                            <Text style={{
                                                fontSize: 15,
                                                color: '#000000'
                                            }}>Temporary</Text>
                                        </View> */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 15,
                                            marginBottom: 20,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                marginRight: 8,
                                                color: '#000000',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Temporary
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                Alert(
                                                    'Courses that are not temporary can only be deleted by the school administrator.'
                                                );
                                            }}
                                        >
                                            <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                        </TouchableOpacity>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            width: '100%',
                                            height: 30,
                                        }}
                                    >
                                        <Switch
                                            value={temporary}
                                            onValueChange={() => setTemporary(!temporary)}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: '#f2f2f2',
                                                true: '#000',
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                    {/* <Text style={{ color: '#1F1F1F', fontSize: 13 }}>
                                            Courses that are not temporary can only be deleted by the school administrator.
                                        </Text> */}
                                </View>

                                <View
                                    style={{
                                        width: '100%',
                                        paddingVertical: 15,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '100%',
                                            paddingTop: 20,
                                            paddingBottom: 15,
                                            backgroundColor: 'white',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                color: '#000000',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Theme
                                        </Text>
                                    </View>
                                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                                        <CirclePicker
                                            colors={colorChoices}
                                            color={colorCode}
                                            onChangeComplete={(color: any) => setColorCode(color.hex)}
                                            width={'220px'}
                                        />
                                    </View>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 15,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            marginRight: 8,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Students
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert(
                                                'Students are able to view content, provide submissions, post discussion threads and view their performance.',
                                                userCreatedOrg
                                                    ? 'After creating the course, you can add new users using their emails from the settings tab.'
                                                    : ''
                                            );
                                        }}
                                    >
                                        <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                    </TouchableOpacity>
                                </View>

                                {!userCreatedOrg ? renderSubscriberFilters() : null}
                                <View
                                    style={{
                                        flexDirection: 'column',
                                        marginTop: 25,
                                    }}
                                >
                                    <View style={{ height: 'auto', width: '100%' }}>
                                        <div style={{ width: '100%' }}>
                                            <label style={{ width: '100%' }}>
                                                <Select
                                                    themeVariant="light"
                                                    selectMultiple={true}
                                                    group={true}
                                                    groupLabel="&nbsp;"
                                                    inputClass="mobiscrollCustomMultiInput"
                                                    placeholder="Select..."
                                                    touchUi={true}
                                                    value={selectedValues}
                                                    data={options}
                                                    onChange={(val: any) => {
                                                        setSelectedValues(val.value);
                                                        // Filter out any moderator if not part of the selected values

                                                        let filterRemovedModerators = selectedModerators.filter(
                                                            (mod: any) => val.value.includes(mod)
                                                        );

                                                        setSelectedModerators(filterRemovedModerators);
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
                                            </label>
                                        </div>
                                    </View>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 25,
                                        marginBottom: 20,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            marginRight: 8,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Instructors
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert(
                                                'Instructors can share content, score and view submissions for all users, initiate meetings and edit course settings, in addition to the student permissions.'
                                            );
                                        }}
                                    >
                                        <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                    </TouchableOpacity>
                                </View>

                                <label style={{ width: '100%' }}>
                                    <Select
                                        themeVariant="light"
                                        select="multiple"
                                        selectMultiple={true}
                                        placeholder="Select..."
                                        inputClass="mobiscrollCustomMultiInput"
                                        value={selectedModerators}
                                        data={moderatorOptions}
                                        onChange={(val: any) => {
                                            setSelectedModerators(val.value);
                                        }}
                                        touchUi={true}
                                        responsive={{
                                            small: {
                                                display: 'bubble',
                                            },
                                            medium: {
                                                touchUi: false,
                                            },
                                        }}
                                    />
                                </label>

                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        height: 50,
                                        paddingTop: 25,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleSubmit()}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            // overflow: 'hidden',
                                            // height: 35,
                                            marginTop: 15,
                                            marginBottom: 50,
                                        }}
                                        disabled={isSubmitDisabled || isSubmitting || user.email === disableEmailId}
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
                                            {isSubmitting ? 'Creating' : PreferredLanguageText('create')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        </View>
    );
};

export default ChannelControls;

const styles = StyleSheet.create({
    outline: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    all: {
        fontSize: 15,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    allOutline: {
        fontSize: 15,
        color: '#fff',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#000000',
        borderRadius: 12,
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginBottom: '15%',
        lineHeight: 18,
        paddingTop: 20,
    },
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20,
    },
    selectedText: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 12,
        color: '#fff',
        backgroundColor: '#000',
        lineHeight: Dimensions.get('window').width < 768 ? 25 : 25,
        height: Dimensions.get('window').width < 768 ? 25 : 25,
        fontFamily: 'inter',
        textTransform: 'uppercase',
    },
    unselectedText: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 12,
        color: '#000',
        height: Dimensions.get('window').width < 768 ? 25 : 25,
        // backgroundColor: '#000',
        lineHeight: Dimensions.get('window').width < 768 ? 25 : 25,
        fontFamily: 'overpass',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    selectedButton: {
        backgroundColor: '#000',
        borderRadius: 20,
        height: Dimensions.get('window').width < 768 ? 25 : 25,
        maxHeight: Dimensions.get('window').width < 768 ? 25 : 25,
        lineHeight: Dimensions.get('window').width < 768 ? 25 : 25,
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        marginHorizontal: Dimensions.get('window').width < 768 ? 2 : 4,
    },
    unselectedButton: {
        // backgroundColor: '#000',
        height: Dimensions.get('window').width < 768 ? 25 : 25,
        maxHeight: Dimensions.get('window').width < 768 ? 25 : 25,
        lineHeight: Dimensions.get('window').width < 768 ? 25 : 25,
        borderRadius: 20,
        color: '#000000',
        paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
        marginHorizontal: Dimensions.get('window').width < 768 ? 2 : 4,
    },
});
