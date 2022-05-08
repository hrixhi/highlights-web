// REACT
import React, { useState, useEffect, useCallback } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    TextInput,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import _ from 'lodash';
import { TextInput as CustomTextInput } from '../components/CustomTextInput';

// GRAPHQL
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getAttendancesForChannel,
    getPastDates,
    modifyAttendance,
    editPastMeeting,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text } from './Themed';
import moment from 'moment';
import XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import Alert from './Alert';
import { Datepicker, Popup } from '@mobiscroll/react';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [fixedPastMeetings, setFixedPastMeetings] = useState<any[]>([]);
    const [pastMeetings, setPastMeetings] = useState<any[]>([]);
    const [allChannelAttendances, setAllChannelAttendances] = useState<any[]>([]);
    const [channelAttendances, setChannelAttendances] = useState<any[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [loadingAttendances, setLoadingAttendances] = useState(false);
    const [end, setEnd] = useState<any>(null);
    const [start, setStart] = useState<any>(null);
    const [attendanceTotalMap, setAttendanceTotalMap] = useState<any>({});
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [studentSearch, setStudentSearch] = useState('');

    const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
    const [editMeetingTopic, setEditMeetingTopic] = useState('');
    const [editMeetingRecordingLink, setEditMeetingRecordingLink] = useState('');
    const [editMeeting, setEditMeeting] = useState<any>({});
    const [updatingPastMeeting, setUpdatingPastMeeting] = useState(false);

    // Title, Attendance
    const [sortByOption, setSortByOption] = useState('Date');

    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    useEffect(() => {
        if (sortByOption === 'Title') {
            const sortMeetings = [...fixedPastMeetings];

            sortMeetings.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? 1 : -1;
                } else if (a.title > b.title) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setPastMeetings(sortMeetings);
        } else if (sortByOption === 'Attendance') {
            const sortMeetings = [...fixedPastMeetings];

            sortMeetings.sort((a: any, b: any) => {
                const attendanceObjectA = channelAttendances[0].attendances.find((s: any) => {
                    return s.dateId.toString().trim() === a.dateId.toString().trim();
                });

                const attendanceObjectB = channelAttendances[0].attendances.find((s: any) => {
                    return s.dateId.toString().trim() === b.dateId.toString().trim();
                });

                if (attendanceObjectA && !attendanceObjectB) {
                    return sortByOrder ? -1 : 1;
                } else if (!attendanceObjectA && attendanceObjectB) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setPastMeetings(sortMeetings);
        } else if (sortByOption === 'Date') {
            const sortMeetings = [...fixedPastMeetings];

            sortMeetings.sort((a: any, b: any) => {
                const aDate = new Date(a.start);
                const bDate = new Date(b.start);

                if (aDate < bDate) {
                    return sortByOrder ? -1 : 1;
                } else if (aDate > bDate) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setPastMeetings(sortMeetings);
        }
    }, [sortByOption, sortByOrder, fixedPastMeetings, channelAttendances]);

    // HOOKS

    /**
     * @description Load data on init
     */
    useEffect(() => {
        loadChannelAttendances(true);
        setPastMeetings([]);
        loadPastSchedule();
    }, [props.channelId]);

    console.log('channelAttendances', channelAttendances);

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (studentSearch === '') {
            setChannelAttendances(allChannelAttendances);
        } else {
            const allAttendances = [...allChannelAttendances];

            const matches = allAttendances.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setChannelAttendances(matches);
        }
    }, [studentSearch]);

    /**
     * @description Create Structure for exporting attendance data in Spreadsheet
     */
    useEffect(() => {
        if (allChannelAttendances.length === 0 || pastMeetings.length === 0) {
            return;
        }

        // Calculate total for each student and add it to the end
        const studentTotalMap: any = {};

        allChannelAttendances.forEach((att) => {
            let count = 0;
            pastMeetings.forEach((meeting) => {
                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                });

                if (attendanceObject) count++;
            });

            studentTotalMap[att.userId] = count;
        });

        setAttendanceTotalMap(studentTotalMap);

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [''];

        pastMeetings.forEach((meeting) => {
            row1.push(moment(new Date(meeting.start)).format('MMM Do, h:mm a'));
        });

        row1.push('Total');

        exportAoa.push(row1);

        allChannelAttendances.forEach((att) => {
            let userRow = [];

            userRow.push(att.fullName);

            pastMeetings.forEach((meeting) => {
                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                });

                if (attendanceObject) {
                    userRow.push(`Joined at ${moment(new Date(attendanceObject.joinedAt)).format('MMM Do, h:mm a')}`);
                } else {
                    userRow.push('-');
                }
            });

            userRow.push(`${studentTotalMap[att.userId]} / ${pastMeetings.length}`);

            exportAoa.push(userRow);
        });

        setExportAoa(exportAoa);
    }, [allChannelAttendances, pastMeetings]);

    /**
     * @description Filter meetings with start and end
     */
    useEffect(() => {
        if (start && end) {
            const filteredPastMeetings = fixedPastMeetings.filter((meeting) => {
                return new Date(meeting.start) > start && new Date(meeting.end) < end;
            });

            setPastMeetings(filteredPastMeetings);
        } else {
            setPastMeetings(fixedPastMeetings);
        }
    }, [start, end]);

    function isValidHttpUrl(link: string) {
        let url;

        try {
            url = new URL(link);
        } catch (_) {
            return false;
        }

        return url.protocol === 'http:' || url.protocol === 'https:';
    }

    const updatePastMeeting = useCallback(async () => {
        if (!editMeeting || updatingPastMeeting) return;

        if (editMeetingRecordingLink !== '' && !isValidHttpUrl(editMeetingRecordingLink)) {
            Alert('Recording link is not valid. A valid url must begin with http or https.');
            return;
        }

        setUpdatingPastMeeting(true);

        const server = fetchAPI(props.userId);

        server
            .mutate({
                mutation: editPastMeeting,
                variables: {
                    dateId: editMeeting.dateId,
                    title: editMeetingTopic,
                    recordingLink: editMeetingRecordingLink,
                },
            })
            .then((res) => {
                if (res.data && res.data.date.editPastMeeting) {
                    setEditMeeting(false);
                    setEditMeetingTopic('');
                    setEditMeetingRecordingLink('');
                    setShowEditMeetingModal(false);
                    loadPastSchedule();
                } else {
                    Alert('Failed to update meeting. Try again.');
                }
                setUpdatingPastMeeting(false);
            })
            .catch((e) => {
                Alert('Failed to update meeting. Try again.');
                setUpdatingPastMeeting(false);
            });
    }, [editMeeting, updatingPastMeeting, editMeetingTopic, editMeetingRecordingLink]);

    /**
     * @description API call to fetch user attendances
     */
    const loadChannelAttendances = useCallback(
        (setLoading?: boolean) => {
            if (setLoading) {
                setLoadingAttendances(true);
            }

            const server = fetchAPI('');
            server
                .query({
                    query: getAttendancesForChannel,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then(async (res) => {
                    if (res.data && res.data.attendance.getAttendancesForChannel) {
                        const u = await AsyncStorage.getItem('user');
                        if (u) {
                            const user = JSON.parse(u);
                            if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                                // all attendances
                                setAllChannelAttendances(res.data.attendance.getAttendancesForChannel);
                                setChannelAttendances(res.data.attendance.getAttendancesForChannel);
                            } else {
                                // only user's attendances
                                const attendances = res.data.attendance.getAttendancesForChannel.find((u: any) => {
                                    return u.userId.toString().trim() === user._id.toString().trim();
                                });
                                const userAttendances = [{ ...attendances }];
                                setAllChannelAttendances(userAttendances);
                                setChannelAttendances(userAttendances);
                            }
                            setLoadingAttendances(false);
                        }
                    }
                })
                .catch((e: any) => {
                    setLoadingAttendances(false);
                });
        },
        [props.channelId, props.isOwner]
    );

    /**
     * @description API call to fetch past meetings
     */
    const loadPastSchedule = useCallback(() => {
        setLoadingMeetings(true);
        const server = fetchAPI('');
        server
            .query({
                query: getPastDates,
                variables: {
                    channelId: props.channelId,
                },
            })
            .then((res) => {
                if (res.data && res.data.attendance.getPastDates) {
                    setFixedPastMeetings(res.data.attendance.getPastDates);
                    res.data.attendance.getPastDates.sort((a: any, b: any) => {
                        const aDate = new Date(a.start);
                        const bDate = new Date(b.start);

                        if (aDate < bDate) {
                            return 1;
                        } else if (aDate > bDate) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });
                    setPastMeetings(res.data.attendance.getPastDates);
                }
                setLoadingMeetings(false);
            })
            .catch((e: any) => {
                setLoadingMeetings(false);
            });
    }, [props.channelId]);

    // FUNCTIONS

    const renderEditDateModal = () => {
        return (
            <Popup
                isOpen={showEditMeetingModal}
                buttons={[
                    {
                        text: 'Update',
                        color: 'dark',
                        handler: function (event) {
                            // props.onSend(message, customCategory, isPrivate);
                            updatePastMeeting();
                        },
                        disabled: props.user.email === disableEmailId,
                    },
                    {
                        text: 'Cancel',
                        color: 'dark',
                        handler: function (event) {
                            setEditMeeting(false);
                            setEditMeetingTopic('');
                            setEditMeetingRecordingLink('');
                            setShowEditMeetingModal(false);
                        },
                    },
                ]}
                theme="ios"
                themeVariant="light"
                onClose={() => props.onClose()}
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
                        paddingHorizontal: 20,
                        marginVertical: 20,
                        minWidth: Dimensions.get('window').width >= 768 ? 400 : 300,
                        maxWidth: Dimensions.get('window').width >= 768 ? 400 : 300,
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'inter',
                        }}
                    >
                        Edit meeting
                    </Text>
                    <View style={{ width: '100%', maxWidth: 400, marginTop: 20, backgroundColor: '#f8f8f8' }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Topic
                        </Text>
                        <View style={{ marginTop: 10, marginBottom: 10 }}>
                            <TextInput
                                style={{
                                    padding: 10,
                                    fontSize: 15,
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    borderRadius: 2,
                                    backgroundColor: '#fff',
                                }}
                                value={editMeetingTopic}
                                placeholder={''}
                                onChangeText={(val) => setEditMeetingTopic(val)}
                                placeholderTextColor={'#1F1F1F'}
                                // required={true}
                            />
                        </View>
                    </View>
                    {/* Time */}

                    {/* <View style={{ width: '100%', maxWidth: 400, marginTop: 20, backgroundColor: '#f8f8f8' }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Time
                        </Text>

                        <Text
                            style={{
                                textAlign: 'center',
                                fontSize: 15,
                                color: '#000000',
                            }}
                        >
                            {moment(new Date(editMeeting.start)).format('MMM Do')}{' '}
                            {moment(new Date(editMeeting.start)).format('h:mm')} -{' '}
                            {moment(new Date(editMeeting.end)).format('h:mm')}
                        </Text>
                    </View> */}

                    {/* Recording Link */}
                    <View style={{ width: '100%', maxWidth: 400, marginTop: 20, backgroundColor: '#f8f8f8' }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Recording Link
                        </Text>
                        <View style={{ marginTop: 10, marginBottom: 10 }}>
                            <TextInput
                                style={{
                                    padding: 10,
                                    fontSize: 15,
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    borderRadius: 2,
                                    backgroundColor: '#fff',
                                }}
                                value={editMeetingRecordingLink}
                                placeholder={''}
                                onChangeText={(val) => setEditMeetingRecordingLink(val)}
                                placeholderTextColor={'#1F1F1F'}
                                // required={true}
                            />
                        </View>
                    </View>
                </View>
            </Popup>
        );
    };

    /**
     * @description Mark as present/absent
     */
    const onChangeAttendance = (dateId: String, userId: String, markPresent: Boolean) => {
        Alert(markPresent ? 'Mark Present?' : 'Mark Absent?', '', [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    return;
                },
            },
            {
                text: 'Yes',
                onPress: async () => {
                    const server = fetchAPI('');
                    server
                        .mutate({
                            mutation: modifyAttendance,
                            variables: {
                                dateId,
                                userId,
                                channelId: props.channelId,
                                markPresent,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.attendance.modifyAttendance) {
                                loadChannelAttendances(false);
                            }
                        });
                },
            },
        ]);
    };

    const renderMeetingsList = () => {
        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    maxHeight: 500,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                    zIndex: 5000000,
                }}
                key={JSON.stringify(allChannelAttendances)}
            >
                <ScrollView
                    showsHorizontalScrollIndicator={true}
                    horizontal={true}
                    contentContainerStyle={{
                        height: '100%',
                        maxHeight: 450,
                        flexDirection: 'column',
                        minWidth: '100%',
                    }}
                    nestedScrollEnabled={true}
                >
                    <View
                        style={{
                            backgroundColor: '#f8f8f8',
                            minWidth: '100%',
                        }}
                    >
                        <View
                            style={{
                                minHeight: 70,
                                flexDirection: 'row',
                                overflow: 'hidden',
                                borderBottomWidth: 1,
                                borderBottomColor: '#f2f2f2',
                            }}
                            key={'-'}
                        >
                            {props.isOwner ? (
                                <View
                                    style={{
                                        backgroundColor: '#f8f8f8',
                                        width: Dimensions.get('window').width < 768 ? 90 : 150,
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: 10,
                                    }}
                                    key={'0,0'}
                                >
                                    <TextInput
                                        value={studentSearch}
                                        onChangeText={(val: string) => setStudentSearch(val)}
                                        placeholder={'Search'}
                                        placeholderTextColor={'#1F1F1F'}
                                        style={{
                                            width: '100%',
                                            borderColor: '#f2f2f2',
                                            borderBottomWidth: 1,
                                            fontSize: 15,
                                            paddingVertical: 8,
                                            marginTop: 0,
                                            paddingHorizontal: 10,
                                        }}
                                    />
                                </View>
                            ) : null}
                            <View style={styles.colHeader} key={'0,0'}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        fontFamily: 'inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    Total
                                </Text>
                            </View>
                            {pastMeetings.map((meeting: any, col: number) => {
                                const { title, start, end, recordingLink } = meeting;
                                console.log('Meeting', meeting);

                                return (
                                    <TouchableOpacity
                                        style={styles.colHeader}
                                        key={col.toString()}
                                        onPress={() => {
                                            setEditMeeting(meeting);
                                            setShowEditMeetingModal(true);
                                            setEditMeetingTopic(meeting.title);
                                            setEditMeetingRecordingLink(
                                                meeting.recordingLink ? meeting.recordingLink : ''
                                            );
                                        }}
                                        disabled={!props.isOwner}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                                paddingBottom: 5,
                                            }}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {title}
                                        </Text>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 12,
                                                color: '#000000',
                                                marginBottom: 5,
                                            }}
                                        >
                                            {moment(new Date(start)).format('MMM Do YY')}
                                        </Text>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 12,
                                                color: '#000000',
                                            }}
                                        >
                                            {moment(new Date(start)).format('h:mm')} -{' '}
                                            {moment(new Date(end)).format('h:mm')}
                                        </Text>
                                        {recordingLink ? (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    paddingTop: 4,
                                                }}
                                            >
                                                <Ionicons name="videocam-outline" color={'#000'} size={15} />
                                            </Text>
                                        ) : null}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        contentContainerStyle={{
                            height: '100%',
                        }}
                        nestedScrollEnabled={true}
                    >
                        {channelAttendances.map((channelAttendance: any, row: number) => {
                            const studentCount = attendanceTotalMap[channelAttendance.userId];

                            return (
                                <View
                                    style={{
                                        minHeight: 70,
                                        flexDirection: 'row',
                                        overflow: 'hidden',
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: row === channelAttendances.length - 1 ? 0 : 1,
                                        borderBottomLeftRadius: row === channelAttendances.length - 1 ? 8 : 0,
                                        borderBottomRightRadius: row === channelAttendances.length - 1 ? 8 : 0,
                                    }}
                                    key={row}
                                >
                                    {props.isOwner ? (
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width < 768 ? 90 : 150,
                                                justifyContent: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                padding: 10,
                                            }}
                                        >
                                            <View>
                                                <Image
                                                    style={{
                                                        height: 37,
                                                        width: 37,
                                                        borderRadius: 75,
                                                        alignSelf: 'center',
                                                    }}
                                                    source={{
                                                        uri: channelAttendance.avatar
                                                            ? channelAttendance.avatar
                                                            : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                    }}
                                                />
                                                <Text
                                                    style={{
                                                        marginTop: 7,
                                                        textAlign: 'center',
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'inter',
                                                    }}
                                                >
                                                    {channelAttendance.fullName}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : null}
                                    <View style={styles.col}>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                            }}
                                        >
                                            {studentCount} / {pastMeetings.length}
                                        </Text>
                                    </View>
                                    {pastMeetings.map((meeting: any, col: number) => {
                                        const attendanceObject = channelAttendance.attendances.find((s: any) => {
                                            return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                                        });
                                        return (
                                            <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                <TouchableOpacity
                                                    disabled={!props.isOwner}
                                                    onPress={() =>
                                                        onChangeAttendance(
                                                            meeting.dateId,
                                                            channelAttendance.userId,
                                                            attendanceObject ? false : true
                                                        )
                                                    }
                                                    style={{
                                                        marginBottom: 5,
                                                        width: '100%',
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    {attendanceObject ? (
                                                        <Ionicons name="checkmark-outline" size={15} color={'#000'} />
                                                    ) : props.isOwner ? (
                                                        <Ionicons
                                                            name="checkmark-outline"
                                                            size={15}
                                                            color={'#e0e0e0'}
                                                        />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TouchableOpacity>
                                                {attendanceObject ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        {attendanceObject.joinedAt
                                                            ? moment(new Date(attendanceObject.joinedAt)).format(
                                                                  'h:mm a'
                                                              )
                                                            : ''}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })}
                    </ScrollView>
                </ScrollView>
            </View>
        );
    };

    const renderStudentsMeetingsList = () => {
        return (
            <View
                style={{
                    width: '100%',
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderBottomColor: '#f2f2f2',
                        borderBottomWidth: 1,
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            width: '33%',
                            padding: 15,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'none',
                            }}
                            onPress={() => {
                                if (sortByOption !== 'Title') {
                                    setSortByOption('Title');
                                    setSortByOrder(true);
                                } else {
                                    setSortByOrder(!sortByOrder);
                                }
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    textAlign: 'center',
                                    paddingRight: 5,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Title
                            </Text>
                            {sortByOption === 'Title' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            padding: 15,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'none',
                            }}
                            onPress={() => {
                                if (sortByOption !== 'Date') {
                                    setSortByOption('Date');
                                    setSortByOrder(true);
                                } else {
                                    setSortByOrder(!sortByOrder);
                                }
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    textAlign: 'center',
                                    paddingRight: 5,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Date
                            </Text>
                            {sortByOption === 'Date' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            padding: 15,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'none',
                            }}
                            onPress={() => {
                                if (sortByOption !== 'Attendance') {
                                    setSortByOption('Attendance');
                                    setSortByOrder(true);
                                } else {
                                    setSortByOrder(!sortByOrder);
                                }
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    textAlign: 'center',
                                    paddingRight: 5,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Attendance
                            </Text>
                            {sortByOption === 'Attendance' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                </View>
                <ScrollView
                    horizontal={false}
                    style={{
                        width: '100%',
                        maxHeight: 350,
                    }}
                    contentContainerStyle={{
                        flexDirection: 'column',

                        borderTopWidth: 0,
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8,
                    }}
                >
                    {pastMeetings.map((meeting: any, ind: number) => {
                        const attendanceObject = channelAttendances[0].attendances.find((s: any) => {
                            return s.dateId.toString().trim() === meeting.dateId.toString().trim();
                        });

                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: ind === pastMeetings.length - 1 ? 8 : 0,
                                    borderBottomRightRadius: ind === pastMeetings.length - 1 ? 8 : 0,
                                    borderTopColor: '#f2f2f2',
                                    borderTopWidth: ind === 0 ? 0 : 1,
                                }}
                            >
                                <View
                                    style={{
                                        width: '33%',
                                        padding: 15,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {meeting.title}
                                    </Text>
                                    {meeting.recordingLink ? (
                                        <TouchableOpacity
                                            style={{
                                                paddingTop: 10,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                            onPress={() => {
                                                window.open(meeting.recordingLink, '_blank');
                                            }}
                                        >
                                            <Ionicons name="videocam-outline" color={'#000'} size={15} />
                                            <Text
                                                style={{
                                                    paddingLeft: 4,
                                                    color: '#000',
                                                    fontSize: 12,
                                                }}
                                            >
                                                Recording
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                                <View
                                    style={{
                                        width: '33%',
                                        padding: 15,
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        {moment(new Date(meeting.start)).format('MMM Do YYYY')}{' '}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            paddingTop: 10,
                                        }}
                                    >
                                        {moment(new Date(meeting.start)).format('h:mma')} -{' '}
                                        {moment(new Date(meeting.end)).format('h:mma')}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: '33%',
                                        padding: 15,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {attendanceObject ? (
                                            <Ionicons name="checkmark-outline" size={15} color={'#000'} />
                                        ) : (
                                            '-'
                                        )}

                                        {attendanceObject ? (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    width: '100%',
                                                }}
                                            >
                                                {attendanceObject.joinedAt
                                                    ? moment(new Date(attendanceObject.joinedAt)).format('h:mm a')
                                                    : ''}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    /**
     * @description Export attendance data into spreadsheet
     */
    const exportAttendance = () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance ');
        /* generate XLSX file and send to client */
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'attendances' + fileExtension);
    };

    // MAIN RETURN
    return (
        <View
            style={{
                backgroundColor: '#fff',
                width: '100%',
                paddingHorizontal: paddingResponsive(),
            }}
        >
            {/* {channelAttendances.length === 0 ||
            fixedPastMeetings.length === 0 ||
            loadingAttendances ||
            loadingMeetings ? null : (
               
            )} */}

            {allChannelAttendances.length === 0 ||
            pastMeetings.length === 0 ||
            loadingAttendances ||
            loadingMeetings ? (
                loadingAttendances || loadingMeetings ? (
                    <View
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            alignSelf: 'center',
                            paddingVertical: 100,
                        }}
                    >
                        <ActivityIndicator color={'#1F1F1F'} />
                    </View>
                ) : (
                    <View style={{ backgroundColor: '#fff' }}>
                        <Text
                            style={{
                                width: '100%',
                                color: '#1F1F1F',
                                fontSize: 16,
                                paddingVertical: 100,
                                paddingHorizontal: 10,
                                fontFamily: 'inter',
                            }}
                        >
                            {pastMeetings.length === 0
                                ? 'Past meetings & attendances will be displayed here.'
                                : 'No Students.'}
                        </Text>
                    </View>
                )
            ) : (
                <View
                    style={{
                        paddingTop: 25,
                    }}
                >
                    <Text style={{ color: '#1f1f1f', fontSize: 15, fontFamily: 'inter', marginBottom: 20 }}>
                        Past meetings
                    </Text>
                    <View
                        style={{
                            backgroundColor: '#fff',
                            flexDirection: 'row',
                            paddingBottom: 30,
                            width: '100%',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                        }}
                    >
                        <View style={{ backgroundColor: '#fff' }}>
                            <View
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    flexDirection: 'row',
                                    backgroundColor: '#fff',
                                    alignItems: 'center',
                                }}
                            >
                                <Datepicker
                                    themeVariant="light"
                                    controls={['calendar']}
                                    select="range"
                                    touchUi={true}
                                    inputProps={{
                                        placeholder: 'Filter',
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble',
                                        },
                                        medium: {
                                            touchUi: false,
                                        },
                                    }}
                                    value={[start, end]}
                                    onChange={(val: any) => {
                                        setStart(val.value[0]);
                                        setEnd(val.value[1]);
                                    }}
                                />
                            </View>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#fff' }} />
                        {pastMeetings.length === 0 || allChannelAttendances.length === 0 || !props.isOwner ? null : (
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#fff',
                                    // overflow: 'hidden',
                                    // height: 35,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                }}
                                onPress={() => {
                                    exportAttendance();
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
                                        fontSize: 12,
                                        paddingHorizontal: 24,
                                        fontFamily: 'inter',
                                        overflow: 'hidden',
                                        paddingVertical: 14,
                                        textTransform: 'uppercase',
                                        width: 120,
                                    }}
                                >
                                    EXPORT
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {props.isOwner ? renderMeetingsList() : renderStudentsMeetingsList()}
                </View>
            )}
            {renderEditDateModal()}
        </View>
    );
};

export default AttendanceList;

const styles = StyleSheet.create({
    row: {
        minHeight: 70,
        flexDirection: 'row',
        overflow: 'hidden',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
    },
    col: {
        width: Dimensions.get('window').width < 768 ? 90 : 120,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        padding: 10,
    },
    colHeader: {
        backgroundColor: '#f8f8f8',
        width: Dimensions.get('window').width < 768 ? 90 : 120,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        padding: 10,
    },
});
