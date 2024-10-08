// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Dimensions, Keyboard, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// API
import {
    findChannelById,
    getSubscribers,
    getUserCount,
    subscribe,
    unsubscribe,
    updateChannel,
    duplicateChannel,
    resetAccessCode,
    deleteChannel,
    addUsersByEmail,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, TouchableOpacity, View } from './Themed';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { TextInput } from './CustomTextInput';
import { ScrollView } from 'react-native-gesture-handler';
import { CirclePicker } from 'react-color';
import { Select } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import Alert from './Alert';
import '@pathofdev/react-tag-input/build/index.css';
import InviteByEmailModal from './InviteByEmailModal';
import { disableEmailId } from '../constants/zoomCredentials';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const ChannelSettings: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user, userId, org, refreshSubscriptions } = useAppContext();

    const [loadingOrg, setLoadingOrg] = useState(true);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [name, setName] = useState('');
    const [originalName, setOriginalName] = useState('');
    const [password, setPassword] = useState('');
    const [temporary, setTemporary] = useState(false);
    const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
    const [accessCode, setAccessCode] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [tags, setTags] = useState('');
    const [copied, setCopied] = useState(false);
    const [originalSubs, setOriginalSubs] = useState<any[]>([]);
    const [options, setOptions] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [owners, setOwners] = useState<any[]>([]);
    const [channelCreator, setChannelCreator] = useState('');
    const [colorCode, setColorCode] = useState('');
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
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [showDuplicateChannel, setShowDuplicateChannel] = useState(false);
    const [duplicateChannelName, setDuplicateChannelName] = useState('');
    const [duplicateChannelPassword, setDuplicateChannelPassword] = useState('');
    const [duplicateChannelColor, setDuplicateChannelColor] = useState('');
    const [duplicateChannelTemporary, setDuplicateChannelTemporary] = useState(false);
    const [duplicateChannelSubscribers, setDuplicateChannelSubscribers] = useState(true);
    const [duplicateChannelModerators, setDuplicateChannelModerators] = useState(true);
    const moderatorOptions = selectedValues.map((value: any) => {
        const match = options.find((o: any) => {
            return o.value === value;
        });

        return match;
    });
    const [meetingUrl, setMeetingUrl] = useState('');
    const [showInviteByEmailsModal, setShowInviteByEmailsModal] = useState(false);

    //
    const [isDuplicatingChannel, setIsDuplicatingChannel] = useState(false);
    const [isDeletingChannel, setIsDeletingChannel] = useState(false);

    const server = useApolloClient();

    // HOOKS

    /**
     * @description Filter dropdown users based on Roles, Grades and Section
     */
    useEffect(() => {
        let filteredUsers = [...allUsers];

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

        if (activeSection !== 'All') {
            const filterSections = filteredUsers.filter((user: any) => {
                return user.section === activeSection || selectedValues.includes(user._id);
            });

            filteredUsers = filterSections;
        }

        if (channelCreator !== '') {
            const filterOutMainOwner = filteredUsers.filter((user: any) => {
                return user._id !== channelCreator;
            });

            filteredUsers = filterOutMainOwner;
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
    }, [activeRole, activeGrade, activeSection, channelCreator, allUsers]);

    const addViewersWithEmail = useCallback(
        async (emails: string[]) => {
            server
                .mutate({
                    mutation: addUsersByEmail,
                    variables: {
                        channelId: props.channelId,
                        userId,
                        emails,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.channel.addUsersByEmail) {
                        const { success, failed, error } = res.data.channel.addUsersByEmail;

                        if (error) {
                            Alert(error);
                            return;
                        } else {
                            const successCount = success.length;
                            const failedCount = failed.length;

                            let failedString = '';
                            if (failedCount > 0) {
                                failedString =
                                    'Failed to add ' +
                                    failed.join(', ') +
                                    '. Cannot add users with emails that are part of another org.';
                            }

                            Alert(
                                (successCount > 0 ? 'Successfully added ' + successCount + ' students. ' : '') +
                                    (failedCount > 0 ? failedString : '')
                            );

                            if (successCount > 0) {
                                setShowInviteByEmailsModal(false);
                                // Refresh subscribers for the channel
                                fetchChannelSettings();
                            }
                        }
                    }
                })
                .catch((e) => {
                    Alert('Something went wrong. Try again.');
                });
        },
        [props.channelId, userId]
    );

    /**
     * @description Filter out channel Creator from the Subscribers dropdown
     */
    useEffect(() => {
        if (channelCreator !== '') {
            const subscribers = [...selectedValues];

            const filterOutOwner = subscribers.filter((sub: any) => {
                return sub !== channelCreator;
            });

            setSelectedValues(filterOutOwner);
        }
    }, [channelCreator]);

    const fetchChannelSettings = useCallback(async () => {
        setLoadingOrg(true);
        setLoadingUsers(true);

        server
            .query({
                query: getUserCount,
                variables: {
                    schoolId: user.schoolId,
                },
            })
            .then((res) => {
                const users = [...res.data.user.getSchoolUsers];
                users.sort((a: any, b: any) => {
                    if (a.fullName < b.fullName) {
                        return -1;
                    }
                    if (a.fullName > b.fullName) {
                        return 1;
                    }
                    return 0;
                });

                setAllUsers(users);

                const tempUsers: any[] = [];
                users.map((item: any, index: any) => {
                    const x = { ...item, selected: false, index };
                    delete x.__typename;
                    tempUsers.push({
                        group: item.fullName[0].toUpperCase(),
                        text: item.fullName + ', ' + item.email,
                        value: item._id,
                    });
                    return x;
                });

                // get channel details
                server
                    .query({
                        query: findChannelById,
                        variables: {
                            channelId: props.channelId,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.channel.findById) {
                            setName(res.data.channel.findById.name);
                            setOriginalName(res.data.channel.findById.name);
                            setPassword(res.data.channel.findById.password ? res.data.channel.findById.password : '');
                            setTemporary(res.data.channel.findById.temporary ? true : false);
                            setChannelCreator(res.data.channel.findById.channelCreator);
                            setIsPublic(res.data.channel.findById.isPublic ? true : false);
                            setDescription(res.data.channel.findById.description);
                            setTags(res.data.channel.findById.tags ? res.data.channel.findById.tags : []);
                            setAccessCode(res.data.channel.findById.accessCode);
                            setMeetingUrl(
                                res.data.channel.findById.meetingUrl ? res.data.channel.findById.meetingUrl : ''
                            );

                            setColorCode(res.data.channel.findById.colorCode);

                            if (res.data.channel.findById.owners) {
                                const ownerOptions: any[] = [];
                                tempUsers.map((item: any) => {
                                    const u = res.data.channel.findById.owners.find((i: any) => {
                                        return i === item.value;
                                    });
                                    if (u) {
                                        ownerOptions.push(item);
                                    }
                                });

                                // Filter out the main channel creator from the moderators list

                                const filterOutMainOwner = ownerOptions.filter((user: any) => {
                                    return user.value !== res.data.channel.findById.channelCreator;
                                });

                                const mod = filterOutMainOwner.map((user: any) => user.value);

                                setOwners(filterOutMainOwner);

                                setSelectedModerators(mod);

                                setLoadingOrg(false);
                            }
                        }
                    })
                    .catch((e) => {
                        console.log('Error', e);
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

        // get subs
        server
            .query({
                query: getSubscribers,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data && res.data.user.findByChannelId) {
                    const tempUsers: any[] = [];
                    res.data.user.findByChannelId.map((item: any, index: any) => {
                        const x = { ...item, selected: false, index };

                        delete x.__typename;
                        tempUsers.push({
                            name: item.fullName,
                            id: item._id,
                        });
                    });

                    const tempSelectedValues: any[] = [];

                    res.data.user.findByChannelId.map((item: any, index: any) => {
                        tempSelectedValues.push(item._id);
                    });

                    setSelectedValues(tempSelectedValues);
                    setOriginalSubs(tempUsers);
                    setSelected(tempUsers);
                    setLoadingUsers(false);
                }
            })
            .catch((e) => {
                console.log('Error', e);
            });
    }, [props.channelId]);

    /**
     * @description Fetches all the data for the channel
     */
    useEffect(() => {
        fetchChannelSettings();
    }, [props.channelId]);

    /**
     * @description Handles duplicating channel
     */
    const handleDuplicate = useCallback(() => {
        if (duplicateChannelName.toString().trim() === '') {
            Alert('Enter duplicate course name.');
            return;
        }

        if (duplicateChannelColor === '') {
            Alert('Pick duplicate course color.');
            return;
        }

        setIsDuplicatingChannel(true);

        server
            .mutate({
                mutation: duplicateChannel,
                variables: {
                    channelId: props.channelId,
                    name: duplicateChannelName.trim(),
                    password: duplicateChannelPassword,
                    colorCode: duplicateChannelColor,
                    temporary: duplicateChannelTemporary,
                    duplicateSubscribers: duplicateChannelSubscribers,
                    duplicateOwners: duplicateChannelModerators,
                },
            })
            .then((res2) => {
                if (res2.data && res2.data.channel.duplicate === 'created') {
                    Alert('Course duplicated successfully.');
                    // Refresh Subscriptions for user
                    refreshSubscriptions();
                    setIsDuplicatingChannel(false);
                }
            })
            .catch((e) => {
                Alert('Something went wrong. Try again.');
                setIsDuplicatingChannel(false);
            });
    }, [
        duplicateChannel,
        duplicateChannelName,
        duplicateChannelPassword,
        props.channelId,
        duplicateChannelColor,
        duplicateChannelTemporary,
        duplicateChannelSubscribers,
        duplicateChannelModerators,
    ]);

    /**
     * @description Reset access code for channel
     */
    const handleResetCode = useCallback(() => {
        setCopied(false);

        server
            .mutate({
                mutation: resetAccessCode,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then(async (res) => {
                if (res.data && res.data.channel.resetAccessCode) {
                    setAccessCode(res.data.channel.resetAccessCode);
                } else {
                    Alert('Could not reset code.');
                }
            })
            .catch((e) => {
                console.log(e);
                Alert('Could not reset code.');
            });
    }, [props.channelId]);

    /**
     * @description Handle updating channel
     */
    const handleSubmit = useCallback(() => {
        if (name.toString().trim() === '') {
            Alert('Enter Course name.');
            return;
        }

        let moderatorsPresentAsSubscribers = true;

        selectedModerators.map((owner: any) => {
            const presentInSubscriber = selectedValues.find((sub: any) => {
                return owner === sub;
            });

            if (!presentInSubscriber) {
                moderatorsPresentAsSubscribers = false;
            }
        });

        if (!moderatorsPresentAsSubscribers) {
            Alert('An instructor must be added as a student');
            return;
        }

        setIsUpdatingChannel(true);

        server
            .mutate({
                mutation: updateChannel,
                variables: {
                    name: name.trim(),
                    password,
                    channelId: props.channelId,
                    temporary,
                    owners: selectedModerators,
                    colorCode,
                    meetingUrl,
                },
            })
            .then((res) => {
                if (res.data && res.data.channel.update) {
                    // added subs
                    selectedValues.map((sub: any) => {
                        const og = originalSubs.find((o: any) => {
                            return o.id === sub;
                        });
                        if (!og) {
                            server.mutate({
                                mutation: subscribe,
                                variables: {
                                    channelId: props.channelId,
                                    password: password,
                                    userId: sub,
                                },
                            });
                        }
                    });
                    // removed subs
                    originalSubs.map((o: any) => {
                        if (o.id === channelCreator) return;

                        const og = selectedValues.find((sub: any) => {
                            return o.id === sub;
                        });

                        if (!og) {
                            server.mutate({
                                mutation: unsubscribe,
                                variables: {
                                    channelId: props.channelId,
                                    keepContent: true,
                                    userId: o.id,
                                },
                            });
                        }
                    });
                    setIsUpdatingChannel(false);

                    Alert('Course updated successfully.');

                    const updatedOriginalSubs: any[] = [];

                    allUsers.map((item: any) => {
                        if (selectedValues.includes(item._id)) {
                            updatedOriginalSubs.push({
                                name: item.fullName,
                                id: item._id,
                            });
                        }
                    });

                    // Set updated subs as new subs
                    setOriginalSubs(updatedOriginalSubs);

                    props.handleUpdateChannel(name.trim(), colorCode);
                    refreshSubscriptions();
                } else {
                    setIsUpdatingChannel(false);
                    Alert('Something went wrong. Try again.');
                }
            })
            .catch((err) => {
                setIsUpdatingChannel(false);
                Alert('Something went wrong. Try again.');
            });
    }, [
        name,
        password,
        props.channelId,
        options,
        originalSubs,
        owners,
        temporary,
        selected,
        originalName,
        colorCode,
        selectedValues,
        selectedModerators,
        meetingUrl,
    ]);

    /**
     * @description Handle delete channel (Note: Only temporary channels can be deleted)
     */
    const handleDelete = useCallback(async () => {
        setIsDeletingChannel(true);
        server
            .mutate({
                mutation: deleteChannel,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res: any) => {
                Alert('Deleted Course successfully.');
                refreshSubscriptions();
                props.handleDeleteChannel();
                setIsDeletingChannel(false);
            })
            .catch((e: any) => {
                Alert('Failed to delete Course.');
                setIsDeletingChannel(false);
                console.log('Error', e);
            });
    }, [props.channelId]);

    // FUNCTIONS

    /**
     * @description Renders filters for Subscribers dropdown
     */
    const renderSubscriberFilters = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                    alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                    backgroundColor: 'white',
                    marginTop: 20,
                }}
            >
                <View style={{ backgroundColor: 'white', paddingRight: Dimensions.get('window').width < 768 ? 0 : 20 }}>
                    <View style={{ backgroundColor: 'white' }}>
                        <label style={{ width: 150 }}>
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

                <View style={{ flexDirection: 'row', marginTop: Dimensions.get('window').width < 768 ? 15 : 0 }}>
                    <View style={{ backgroundColor: 'white', paddingRight: 20 }}>
                        <View style={{ backgroundColor: 'white' }}>
                            <label style={{ width: 150 }}>
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
                            <label style={{ width: 150 }}>
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

    if (loadingOrg || loadingUsers) {
        return (
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
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    // RENDER VIEW FOR CHANNEL DUPLICATION

    if (showDuplicateChannel) {
        return (
            <View>
                <View style={styles.screen}>
                    <View
                        style={{
                            maxWidth: 600,
                            alignSelf: 'center',
                            minHeight: 100,
                            width: '100%',
                        }}
                    >
                        <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                            <TouchableOpacity
                                key={Math.random()}
                                style={{
                                    flex: 1,
                                    backgroundColor: 'white',
                                }}
                                onPress={() => {
                                    setShowDuplicateChannel(false);
                                }}
                            >
                                <Text
                                    style={{
                                        width: '100%',
                                        fontSize: 15,
                                        fontWeight: 'bold',
                                        color: '#1F1F1F',
                                    }}
                                >
                                    <Ionicons
                                        name="chevron-back-outline"
                                        size={30}
                                        color={'#000000'}
                                        style={{ marginRight: 10 }}
                                    />
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text
                            style={{
                                fontSize: 20,
                                paddingBottom: 20,
                                fontFamily: 'inter',
                                flex: 1,
                                lineHeight: 25,
                                textAlign: 'center',
                            }}
                        >
                            Duplicate Course
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
                                value={duplicateChannelName}
                                placeholder={''}
                                onChangeText={(val) => {
                                    setDuplicateChannelName(val);
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>

                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={duplicateChannelPassword}
                                placeholder={`(${PreferredLanguageText('optional')})`}
                                onChangeText={(val) => setDuplicateChannelPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                required={false}
                            />
                        </View>
                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Theme
                            </Text>
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    backgroundColor: 'white',
                                    marginTop: 20,
                                }}
                            >
                                <View style={{ width: '100%', backgroundColor: 'white' }}>
                                    <CirclePicker
                                        colors={colorChoices}
                                        color={duplicateChannelColor}
                                        onChangeComplete={(color: any) => setDuplicateChannelColor(color.hex)}
                                        width={'220px'}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Switch to copy Subscribers */}
                        {selected.length > 0 ? (
                            <View>
                                <View
                                    style={{
                                        width: '100%',
                                        paddingTop: 30,
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
                                        Duplicate Students
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            height: 40,
                                            marginRight: 10,
                                        }}
                                    >
                                        <Switch
                                            value={duplicateChannelSubscribers}
                                            onValueChange={() => {
                                                setDuplicateChannelSubscribers(!duplicateChannelSubscribers);
                                            }}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: '#efefef',
                                                true: '#000',
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                </View>
                            </View>
                        ) : null}

                        {/* Switch to copy Moderators */}
                        {owners.length > 0 ? (
                            <View>
                                <View
                                    style={{
                                        width: '100%',
                                        paddingTop: 15,
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
                                        Duplicate Instructors
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View
                                        style={{
                                            backgroundColor: 'white',
                                            height: 40,
                                            marginRight: 10,
                                        }}
                                    >
                                        <Switch
                                            value={duplicateChannelModerators}
                                            onValueChange={() => {
                                                setDuplicateChannelModerators(!duplicateChannelModerators);
                                            }}
                                            style={{ height: 20 }}
                                            trackColor={{
                                                false: '#efefef',
                                                true: '#000',
                                            }}
                                            activeThumbColor="white"
                                        />
                                    </View>
                                </View>
                            </View>
                        ) : null}

                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginTop: 50,
                                paddingBottom: 50,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => handleDuplicate()}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    // overflow: 'hidden',
                                    // height: 35,
                                }}
                                disabled={isDuplicatingChannel || user.email === disableEmailId}
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
                                    {isDuplicatingChannel ? 'SAVING...' : 'SAVE'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // MAIN RETURN
    return (
        <View>
            <View style={styles.screen}>
                <View
                    style={{
                        maxWidth: 600,
                        alignSelf: 'center',
                        minHeight: 100,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <View style={{ backgroundColor: 'white' }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#000000',
                                        fontFamily: 'Inter',
                                        marginRight: 8,
                                    }}
                                >
                                    Access Code
                                </Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert('Share this code so people can join your course directly.');
                                    }}
                                >
                                    <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                </TouchableOpacity>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent:
                                        Dimensions.get('window').width < 768 ? 'space-between' : 'flex-start',
                                    alignItems: 'center',
                                    marginTop: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: Dimensions.get('window').width < 768 ? 26 : 30,
                                        fontFamily: 'inter',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {accessCode}
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        paddingLeft: Dimensions.get('window').width < 768 ? 20 : 20,
                                        // marginLeft: 'auto',
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            marginRight: 10,
                                        }}
                                        onPress={() => {
                                            navigator.clipboard.writeText(accessCode);
                                            setCopied(true);
                                        }}
                                    >
                                        <Ionicons
                                            name={copied ? 'checkmark-circle-outline' : 'copy-outline'}
                                            size={20}
                                            color={copied ? '#35AC78' : '#000'}
                                        />
                                        {/* <Text
                                        style={{
                                            color: copied ? '#35AC78' : '#000',
                                            fontSize: 11,
                                            paddingTop: 3,
                                        }}
                                    >
                                        {' '}
                                        {copied ? 'Copied' : 'Copy'}{' '}
                                    </Text> */}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                        onPress={() => handleResetCode()}
                                    >
                                        <Ionicons name="refresh-outline" size={20} color={'#000'} />
                                        {/* <Text style={{ color: '#000', fontSize: 11, paddingTop: 3 }}> Reset </Text> */}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: 'white',
                                marginTop: 20,
                                width: Dimensions.get('window').width < 768 ? '100%' : 300,
                                paddingRight: Dimensions.get('window').width < 768 ? 0 : 20,
                            }}
                        >
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
                                autoCompleteType="off"
                                placeholder={''}
                                onChangeText={(val) => {
                                    setName(val);
                                }}
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                        <View
                            style={{
                                backgroundColor: 'white',
                                marginTop: 20,
                                width: Dimensions.get('window').width < 768 ? '100%' : 300,
                                paddingRight: Dimensions.get('window').width < 768 ? 0 : 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                {PreferredLanguageText('enrolmentPassword')}
                            </Text>
                            <TextInput
                                value={password}
                                autoCompleteType="off"
                                placeholder={`(${PreferredLanguageText('optional')})`}
                                onChangeText={(val) => setPassword(val)}
                                placeholderTextColor={'#1F1F1F'}
                                required={false}
                            />
                        </View>
                    </View>

                    {org.meetingProvider && org.meetingProvider !== '' ? (
                        <View style={{ backgroundColor: 'white' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Meeting link
                            </Text>
                            <TextInput
                                value={meetingUrl}
                                autoCompleteType="off"
                                placeholder={''}
                                onChangeText={(val) => setMeetingUrl(val)}
                                placeholderTextColor={'#1F1F1F'}
                                required={false}
                            />
                        </View>
                    ) : null}

                    <View style={{ backgroundColor: 'white' }}>
                        <Text
                            style={{
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Theme
                        </Text>
                        <View
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                backgroundColor: 'white',
                                marginTop: 20,
                            }}
                        >
                            <View style={{ backgroundColor: 'white' }}>
                                <CirclePicker
                                    colors={colorChoices}
                                    color={colorCode}
                                    onChangeComplete={(color: any) => setColorCode(color.hex)}
                                    width={'220px'}
                                />
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            display: 'flex',
                            width: '100%',
                            flexDirection: 'row',
                            paddingTop: 30,
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                    marginRight: 8,
                                }}
                            >
                                Students
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert(
                                        'Students are able to view content, provide submissions, post discussion threads and view their performance.'
                                    );
                                }}
                            >
                                <Ionicons name="help-circle-outline" size={18} color="#939699" />
                            </TouchableOpacity>
                        </View>
                        {user.userCreatedOrg ? (
                            <TouchableOpacity
                                onPress={() => setShowInviteByEmailsModal(true)}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginLeft: 'auto',
                                    paddingTop: 2,
                                }}
                            >
                                <Ionicons
                                    name="mail-outline"
                                    color="#000"
                                    style={{ marginRight: 7, paddingTop: 2 }}
                                    size={20}
                                />
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#000',
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Add Users
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {!user.userCreatedOrg ? renderSubscriberFilters() : null}
                    <View
                        style={{
                            flexDirection: 'column',
                            marginTop: 25,
                        }}
                    >
                        <View style={{ height: 'auto', width: '100%' }}>
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

                                        let filterRemovedModerators = selectedModerators.filter((mod: any) =>
                                            val.value.includes(mod)
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
                                />
                            </label>
                        </View>
                    </View>

                    {userId === channelCreator ? (
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
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                    marginRight: 8,
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
                    ) : null}

                    {userId === channelCreator ? (
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
                                // minWidth={[60, 320]}
                            />
                        </label>
                    ) : null}

                    <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 50, paddingBottom: 50 }}>
                        <TouchableOpacity
                            onPress={() => {
                                Alert('Update course?', '', [
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
                                            handleSubmit();
                                        },
                                    },
                                ]);
                            }}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 15,
                                // overflow: 'hidden',
                                // height: 35,
                            }}
                            disabled={isUpdatingChannel || user.email === disableEmailId}
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
                                {isUpdatingChannel ? 'UPDATING...' : 'UPDATE'}
                            </Text>
                        </TouchableOpacity>

                        {userId === channelCreator ? (
                            <TouchableOpacity
                                onPress={() => setShowDuplicateChannel(true)}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    // overflow: 'hidden',
                                    // height: 35,
                                    marginTop: 15,
                                }}
                            >
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        borderColor: '#000',
                                        borderWidth: 1,
                                        color: '#000',
                                        backgroundColor: '#fff',
                                        fontSize: 11,
                                        paddingHorizontal: 24,
                                        fontFamily: 'inter',
                                        overflow: 'hidden',
                                        paddingVertical: 14,
                                        textTransform: 'uppercase',
                                        width: 150,
                                    }}
                                >
                                    DUPLICATE
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                        {temporary ? (
                            <TouchableOpacity
                                onPress={() => {
                                    Alert('Delete course?', '', [
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
                                                handleDelete();
                                            },
                                        },
                                    ]);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15,
                                    // overflow: 'hidden',
                                    // height: 35,
                                    marginTop: 15,
                                }}
                                disabled={isDeletingChannel || user.email === disableEmailId}
                            >
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        borderColor: '#000',
                                        borderWidth: 1,
                                        color: '#000',
                                        backgroundColor: '#fff',
                                        fontSize: 11,
                                        paddingHorizontal: 24,
                                        fontFamily: 'inter',
                                        overflow: 'hidden',
                                        paddingVertical: 14,
                                        textTransform: 'uppercase',
                                        width: 150,
                                    }}
                                >
                                    {isDeletingChannel ? 'DELETING...' : 'DELETE'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </View>
            {showInviteByEmailsModal ? (
                <InviteByEmailModal
                    show={true}
                    onClose={() => setShowInviteByEmailsModal(false)}
                    onAddUsersWithEmails={(emails: string[]) => addViewersWithEmail(emails)}
                />
            ) : null}
        </View>
    );
};

export default ChannelSettings;

const styles = StyleSheet.create({
    screen: {
        paddingTop: 20,
        paddingBottom: 20,
        width: '100%',
        backgroundColor: 'white',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        paddingHorizontal: Dimensions.get('window').width < 768 ? 10 : 0,
    },
    outline: {
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    all: {
        fontSize: 15,
        fontFamily: 'inter',
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    allOutline: {
        fontSize: 15,
        fontFamily: 'inter',
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
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
        borderBottomColor: '#efefef',
        borderBottomWidth: 1,
        fontSize: 15,
        fontFamily: 'inter',
        paddingTop: 13,
        paddingBottom: 13,
        marginTop: 5,
        marginBottom: 20,
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
    },
    colorContainerOutline: {
        lineHeight: 22,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
});
