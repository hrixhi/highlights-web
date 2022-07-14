// REACT
import React, { useState, useEffect, useCallback } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Dimensions,
    TextInput,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';
import { TextInput as CustomTextInput } from '../components/CustomTextInput';

// GRAPHQL

import {
    modifyAttendance,
    editPastMeeting,
    getCourseStudents,
    createChannelAttendance,
    editChannelAttendance,
    deleteChannelAttendance,
    getAttendanceBook,
    getAttendanceBookStudent,
    handleUpdateAttendanceBookEntry,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text } from './Themed';
import moment from 'moment';
import XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import Alert from './Alert';
import { Select, Datepicker, Popup } from '@mobiscroll/react';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const attendanceTypeOptions = [
    {
        value: 'present',
        text: 'Present',
    },
    {
        value: 'absent',
        text: 'Absent',
    },
];

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, user } = useAppContext();

    const [studentSearch, setStudentSearch] = useState('');

    const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
    const [editMeetingTopic, setEditMeetingTopic] = useState('');
    const [editMeetingRecordingLink, setEditMeetingRecordingLink] = useState('');
    const [editMeeting, setEditMeeting] = useState<any>({});
    const [updatingPastMeeting, setUpdatingPastMeeting] = useState(false);

    const [editEntryId, setEditEntryId] = useState('');
    const [editEntryType, setEditEntryType] = useState('');
    const [newAttendanceTitle, setNewAttendanceTitle] = useState('');
    const [newAttendanceDate, setNewAttendanceDate] = useState(new Date());
    const [newAttendanceRecordingLink, setNewAttendanceRecordingLink] = useState('');

    const [newStudentAttendances, setNewStudentAttendances] = useState<any[]>([]);

    // Title, Attendance
    const [sortByOption, setSortByOption] = useState('Date');
    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    const [instructorAttendanceBook, setInstructorAttendanceBook] = useState<any>(undefined);
    const [attendanceBookEntries, setAttendanceBookEntries] = useState([]);
    const [attendanceBookUsers, setAttendanceBookUsers] = useState<any[]>([]);
    const [isFetchingAttendanceBook, setIsFetchingAttendanceBook] = useState(false);

    const [studentAttendanceBook, setStudentAttendanceBook] = useState<any>(undefined);
    const [studentAttendanceBookEntries, setStudentAttendanceBookEntries] = useState([]);
    const [isFetchingStudentAttendanceBook, setIsFetchingStudentAttendanceBook] = useState(false);

    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [courseStudents, setCourseStudents] = useState<any[]>([]);
    const [isCreatingAttendance, setIsCreatingAttendance] = useState(false);
    const [isDeletingAttendance, setIsDeletingAttendance] = useState(false);

    // Edit ID
    const [activeModifyId, setActiveModifyId] = useState('');
    const [activeUserId, setActiveUserId] = useState('');
    const [activeModifyEntryType, setActiveModifyEntryType] = useState('');
    const [attendanceEntry, setAttendanceEntry] = useState<any>(undefined);

    //
    const [attendanceBookUsersDropdownOptions, setAttendanceBookUsersDropdownOptions] = useState<any[]>([]);
    const [attendanceBookAnalyticsSelectedUser, setAttendanceBookAnalyticsSelectedUser] = useState(undefined);

    const server = useApolloClient();

    useEffect(() => {
        if (sortByOption === 'Title') {
            const sortEntries = [...studentAttendanceBookEntries];

            sortEntries.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? 1 : -1;
                } else if (a.title > b.title) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setStudentAttendanceBookEntries(sortEntries);
        } else if (sortByOption === 'Attendance') {
            const sortEntries = [...studentAttendanceBookEntries];

            sortEntries.sort((a: any, b: any) => {
                if (a.attendanceType === 'present' && b.attendanceType === 'absent') {
                    return sortByOrder ? -1 : 1;
                } else if (a.attendanceType === 'absent' && b.attendanceType === 'present') {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStudentAttendanceBookEntries(sortEntries);
        } else if (sortByOption === 'Date') {
            const sortEntries = [...studentAttendanceBookEntries];

            sortEntries.sort((a: any, b: any) => {
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

            setStudentAttendanceBookEntries(sortEntries);
        }
    }, [sortByOption, sortByOrder]);

    // HOOKS

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (!instructorAttendanceBook || !instructorAttendanceBook.users) {
            return;
        }

        if (studentSearch === '') {
            setAttendanceBookUsers([...instructorAttendanceBook.users]);
        } else {
            const allStudents = [...instructorAttendanceBook.users];

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setAttendanceBookUsers(matches);
        }
    }, [studentSearch, instructorAttendanceBook]);

    useEffect(() => {
        if (props.isOwner && props.channelId) {
            fetchAttendancebookInstructor();
        } else {
            fetchAttendancebookStudent();
        }
    }, [props.isOwner, props.channelId]);

    const fetchAttendancebookInstructor = useCallback(() => {
        setIsFetchingAttendanceBook(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getAttendanceBook,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.attendance && res.data.attendance.getAttendanceBook) {
                        setInstructorAttendanceBook(res.data.attendance.getAttendanceBook);
                        setAttendanceBookEntries(res.data.attendance.getAttendanceBook.entries);
                        setAttendanceBookUsers(res.data.attendance.getAttendanceBook.users);

                        if (res.data.attendance.getAttendanceBook.users.length > 0) {
                            const userDropdowns: any[] = res.data.attendance.getAttendanceBook.users.map(
                                (user: any) => {
                                    return {
                                        value: user.userId,
                                        text: user.fullName,
                                    };
                                }
                            );
                            setAttendanceBookUsersDropdownOptions(userDropdowns);
                            setAttendanceBookAnalyticsSelectedUser(
                                res.data.attendance.getAttendanceBook.users[0].userId
                            );
                        }
                    } else {
                        setInstructorAttendanceBook(undefined);
                        setAttendanceBookEntries([]);
                        setAttendanceBookUsers([]);
                    }
                    setIsFetchingAttendanceBook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch attendance.');
                    setInstructorAttendanceBook(undefined);
                    setAttendanceBookEntries([]);
                    setAttendanceBookUsers([]);
                    setIsFetchingAttendanceBook(false);
                });
        }
    }, []);

    const fetchAttendancebookStudent = useCallback(() => {
        setIsFetchingStudentAttendanceBook(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getAttendanceBookStudent,
                    variables: {
                        channelId: props.channelId,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.attendance && res.data.attendance.getAttendanceBookStudent) {
                        setStudentAttendanceBook(res.data.attendance.getAttendanceBookStudent);
                        setStudentAttendanceBookEntries(res.data.attendance.getAttendanceBookStudent.entries);
                    } else {
                        setStudentAttendanceBook(undefined);
                        setStudentAttendanceBookEntries([]);
                    }
                    setIsFetchingStudentAttendanceBook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch attendance book.');
                    setStudentAttendanceBook(undefined);
                    setStudentAttendanceBookEntries([]);
                    setIsFetchingStudentAttendanceBook(false);
                });
        }
    }, []);

    // /**
    //  * @description Create Structure for exporting attendance data in Spreadsheet
    //  */
    // useEffect(() => {
    //     if (allChannelAttendances.length === 0 || pastMeetings.length === 0) {
    //         return;
    //     }

    //     // Calculate total for each student and add it to the end
    //     const studentTotalMap: any = {};

    //     allChannelAttendances.forEach((att) => {
    //         let count = 0;
    //         pastMeetings.forEach((meeting) => {
    //             const attendanceObject = att.attendances.find((s: any) => {
    //                 return s.dateId.toString().trim() === meeting.dateId.toString().trim();
    //             });

    //             if (attendanceObject) count++;
    //         });

    //         studentTotalMap[att.userId] = count;
    //     });

    //     setAttendanceTotalMap(studentTotalMap);

    //     const exportAoa = [];

    //     // Add row 1 with past meetings and total
    //     let row1 = [''];

    //     pastMeetings.forEach((meeting) => {
    //         row1.push(moment(new Date(meeting.start)).format('MMM Do, h:mm a'));
    //     });

    //     row1.push('Total');

    //     exportAoa.push(row1);

    //     allChannelAttendances.forEach((att) => {
    //         let userRow = [];

    //         userRow.push(att.fullName);

    //         pastMeetings.forEach((meeting) => {
    //             const attendanceObject = att.attendances.find((s: any) => {
    //                 return s.dateId.toString().trim() === meeting.dateId.toString().trim();
    //             });

    //             if (attendanceObject) {
    //                 userRow.push(`Joined at ${moment(new Date(attendanceObject.joinedAt)).format('MMM Do, h:mm a')}`);
    //             } else {
    //                 userRow.push('-');
    //             }
    //         });

    //         userRow.push(`${studentTotalMap[att.userId]} / ${pastMeetings.length}`);

    //         exportAoa.push(userRow);
    //     });

    //     setExportAoa(exportAoa);
    // }, [allChannelAttendances, pastMeetings]);

    useEffect(() => {
        if (props.isOwner && props.channelId) {
            loadCourseStudents();
        }
    }, [props.isOwner, props.channelId]);

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

    const updateAttendanceBookEntry = useCallback(() => {
        server
            .mutate({
                mutation: handleUpdateAttendanceBookEntry,
                variables: {
                    userId: activeUserId,
                    entryId: activeModifyId,
                    attendanceEntry: activeModifyEntryType === 'meeting' ? false : true,
                    attendanceType: attendanceEntry.attendanceType,
                    late: attendanceEntry.late,
                    excused: attendanceEntry.excused,
                    channelId: props.channelId,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.attendance.handleUpdateAttendanceBookEntry) {
                    Alert('Attendance Entry updated successfully.');
                    //
                    setActiveUserId('');
                    setActiveModifyId('');
                    setActiveModifyEntryType('');
                    setAttendanceEntry(undefined);
                    //
                    fetchAttendancebookInstructor();
                } else {
                    Alert('Failed to update Attendance Entry.');
                    //
                }
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to update Attendance Entry.');
            });
    }, [props.channelId, activeUserId, activeModifyId, activeModifyEntryType, attendanceEntry]);

    /**
     * @description Fetch all course students for creating new assignment and assigning scores
     */
    const loadCourseStudents = useCallback(() => {
        setIsFetchingStudents(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getCourseStudents,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.channel && res.data.channel.getCourseStudents) {
                        setCourseStudents(res.data.channel.getCourseStudents);
                    } else {
                        setCourseStudents([]);
                    }
                    setIsFetchingStudents(false);
                })
                .catch((e) => {
                    console.log('Error', e);
                    Alert('Failed to fetch students.');
                    setIsFetchingStudents(false);
                });
        }
    }, [props.channelId]);

    useEffect(() => {
        if (courseStudents) {
            // Attendances

            const studentAttendances: any[] = courseStudents.map((student: any) => {
                return {
                    _id: student._id,
                    fullName: student.fullName,
                    avatar: student.avatar,
                    attendanceType: 'present',
                    late: false,
                    excused: false,
                };
            });

            setNewStudentAttendances(studentAttendances);
        }
    }, [courseStudents]);

    const handleEditAttendanceBookEntry = useCallback(
        (attendanceBookEntryId: string) => {
            const { entries, users } = instructorAttendanceBook;

            const findEntry = entries.find(
                (entry: any) =>
                    entry.attendanceEntryId === attendanceBookEntryId || entry.dateId === attendanceBookEntryId
            );

            const { title, start, recordingLink, attendances } = findEntry;

            const attendanceBookEntries: any[] = [];

            users.map((user: any) => {
                const findAttendance = attendances.find((x: any) => x.userId === user.userId);

                attendanceBookEntries.push({
                    _id: user.userId,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    attendanceType: findAttendance.attendanceType,
                    late: findAttendance.late,
                    excused: findAttendance.excused,
                });
            });

            setEditEntryId(attendanceBookEntryId);
            setEditEntryType(findEntry.dateId ? 'meeting' : 'entry');
            setNewAttendanceTitle(title);
            setNewAttendanceDate(start);
            setNewAttendanceRecordingLink(recordingLink);
            setNewStudentAttendances(attendanceBookEntries);

            props.setShowNewAttendance(true);
        },
        [instructorAttendanceBook]
    );

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
                        disabled: user.email === disableEmailId,
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

    const renderStudentsMeetingsList = () => {
        return (
            <View
                style={{
                    width: '100%',
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
                    {studentAttendanceBookEntries.map((entry: any, ind: number) => {
                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: ind === studentAttendanceBookEntries.length - 1 ? 8 : 0,
                                    borderBottomRightRadius: ind === studentAttendanceBookEntries.length - 1 ? 8 : 0,
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
                                        {entry.title}
                                    </Text>
                                    {entry.recordingLink ? (
                                        <TouchableOpacity
                                            style={{
                                                paddingTop: 10,
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                            onPress={() => {
                                                window.open(entry.recordingLink, '_blank');
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
                                        {new Date(entry.start).toString().split(' ')[1] +
                                            ' ' +
                                            new Date(entry.start).toString().split(' ')[2]}{' '}
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
                                        <Text>
                                            <Ionicons
                                                name={
                                                    entry.attendanceType === 'present'
                                                        ? 'checkmark-outline'
                                                        : 'close-outline'
                                                }
                                                size={24}
                                                color={entry.attendanceType === 'present' ? '#35AC78' : '#F94144'}
                                            />
                                        </Text>

                                        {(entry.attendanceType === 'present' && entry.late) ||
                                        (entry.attendanceType === 'absent' && entry.excused) ? (
                                            <Text
                                                style={{
                                                    marginTop: 2,
                                                    fontSize: 10,
                                                    textAlign: 'center',
                                                    // backgroundColor: '#f3722c',
                                                    borderRadius: 12,
                                                    marginLeft: 5,
                                                    paddingHorizontal: 7,
                                                    paddingVertical: 4,
                                                    color: '#000',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {entry.attendanceType === 'present' && entry.late ? 'LATE' : 'EXCUSED'}
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

    console.log('Attendance book', attendanceBookEntries);

    const resetNewEntryForm = () => {
        setEditEntryId('');
        setEditEntryType('');
        setNewAttendanceTitle('');
        setNewAttendanceDate(new Date());
        setNewAttendanceRecordingLink('');

        // Standard Points scored
        const studentAttendances: any[] = courseStudents.map((student: any) => {
            return {
                _id: student._id,
                fullName: student.fullName,
                avatar: student.avatar,
                attendanceType: 'present',
                late: false,
                excused: false,
            };
        });

        setNewStudentAttendances(studentAttendances);
    };

    // /**
    //  * @description Export attendance data into spreadsheet
    //  */
    // const exportAttendance = () => {
    //     const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    //     const fileExtension = '.xlsx';
    //     const ws = XLSX.utils.aoa_to_sheet(exportAoa);
    //     const wb = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(wb, ws, 'Attendance ');
    //     /* generate XLSX file and send to client */
    //     const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    //     const data = new Blob([excelBuffer], { type: fileType });
    //     FileSaver.saveAs(data, 'attendances' + fileExtension);
    // };

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const handleCreateAttendance = useCallback(
        async (editing?: boolean) => {
            setIsCreatingAttendance(true);

            if (!newAttendanceTitle || newAttendanceTitle === '') {
                Alert('Attendance title is required.');
                return;
            }

            // Sanitize
            const sanitizeAttendances = newStudentAttendances.map((user: any) => {
                return {
                    userId: user._id,
                    attendanceType: user.attendanceType,
                    late: user.attendanceType === 'present' ? user.late : false,
                    excused: user.attendanceType === 'absent' ? user.excused : false,
                };
            });

            //
            const attendanceEntryInput = {
                title: newAttendanceTitle,
                date: newAttendanceDate,
                recordingLink: newAttendanceRecordingLink,
                channelId: props.channelId,
                attendances: sanitizeAttendances,
            };

            if (editing) {
                server
                    .mutate({
                        mutation: editChannelAttendance,
                        variables: {
                            attendanceEntryInput,
                            entryId: editEntryId,
                            attendanceBookEntry: editEntryType === 'entry',
                        },
                    })
                    .then((res) => {
                        if (res.data.attendance && res.data.attendance.editEntry) {
                            Alert('Updated Attendance entry successfully.');
                            resetNewEntryForm();
                            props.setShowNewAttendance(false);
                            // Reload attendance book
                            fetchAttendancebookInstructor();
                        } else {
                            Alert('Failed to update attendance entry.');
                        }
                        setIsCreatingAttendance(false);
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update attendance entry.');
                        setIsCreatingAttendance(false);
                    });
            } else {
                server
                    .mutate({
                        mutation: createChannelAttendance,
                        variables: {
                            attendanceEntryInput,
                        },
                    })
                    .then((res) => {
                        if (res.data.attendance && res.data.attendance.createEntry) {
                            Alert('Created Attendance entry successfully.');
                            resetNewEntryForm();
                            props.setShowNewAttendance(false);
                            // Reload attendance book
                            fetchAttendancebookInstructor();
                        } else {
                            Alert('Failed to create attendance entry.');
                        }
                        setIsCreatingAttendance(false);
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update attendance entry.');
                        setIsCreatingAttendance(false);
                    });
            }
        },
        [
            newAttendanceTitle,
            newAttendanceDate,
            newAttendanceRecordingLink,
            newStudentAttendances,
            editEntryId,
            editEntryType,
        ]
    );

    const handleDeleteAttendance = useCallback(async () => {
        setIsDeletingAttendance(true);

        server
            .mutate({
                mutation: deleteChannelAttendance,
                variables: {
                    entryId: editEntryId,
                    attendanceBookEntry: editEntryType === 'entry',
                },
            })
            .then((res) => {
                if (res.data.attendance && res.data.attendance.deleteEntry) {
                    Alert('Deleted Attendance entry successfully.');
                    resetNewEntryForm();
                    props.setShowNewAttendance(false);
                    // Reload attendance book
                    fetchAttendancebookInstructor();
                } else {
                    Alert('Failed to delete attendance entry.');
                }
                setIsDeletingAttendance(false);
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to delete attendance entry.');
                setIsDeletingAttendance(false);
            });
    }, [editEntryId, editEntryType]);

    if (props.showNewAttendance) {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    width: '100%',
                    height: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingHorizontal: paddingResponsive(),
                }}
            >
                <View
                    style={{
                        maxWidth: 1024,
                        width: '100%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {/* HEADER */}
                    <View style={{ width: '100%', backgroundColor: 'white', flexDirection: 'row', marginTop: 20 }}>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                            }}
                            onPress={() => {
                                resetNewEntryForm();
                                props.setShowNewAttendance(false);
                            }}
                        >
                            <Text
                                style={{
                                    borderRadius: 15,
                                    marginTop: 5,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="chevron-back-outline" color="#000" size={23} />
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Back
                                </Text>
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
                        {editEntryId ? 'Edit' : 'New'} Attendance Entry
                    </Text>
                </View>
                <View
                    style={{
                        width: '100%',
                    }}
                >
                    <View style={{ width: '100%' }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Title
                        </Text>
                        <CustomTextInput
                            value={newAttendanceTitle}
                            placeholder={''}
                            onChangeText={(val) => setNewAttendanceTitle(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                        />
                    </View>
                </View>
                <View style={{ width: '100%', flexDirection: 'row' }}>
                    <View
                        style={{
                            width: '50%',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Date
                        </Text>
                        <View
                            style={{
                                marginTop: 10,
                            }}
                        >
                            <Datepicker
                                controls={['date']}
                                touchUi={true}
                                theme="ios"
                                value={newAttendanceDate}
                                themeVariant="light"
                                inputProps={{
                                    placeholder: 'Select date...',
                                }}
                                onChange={(event: any) => {
                                    const date = new Date(event.value);
                                    const roundOffDate = roundSeconds(date);
                                    setNewAttendanceDate(roundOffDate);
                                }}
                                responsive={{
                                    xsmall: {
                                        controls: ['date'],
                                        display: 'bottom',
                                        touchUi: true,
                                    },
                                    medium: {
                                        controls: ['date'],
                                        display: 'anchored',
                                        touchUi: false,
                                    },
                                }}
                            />
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        width: '100%',
                        marginTop: 25,
                    }}
                >
                    <View style={{ width: '100%' }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Recording Link
                        </Text>
                        <CustomTextInput
                            value={newAttendanceRecordingLink}
                            placeholder={''}
                            onChangeText={(val) => setNewAttendanceRecordingLink(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                        />
                    </View>
                </View>

                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        maxWidth: 1024,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cccccc',
                        zIndex: 5000000,
                        maxHeight: 500,
                        position: 'relative',
                        overflow: 'scroll',
                        marginTop: 30,
                    }}
                >
                    <table className="stickyTable">
                        <thead>
                            <tr>
                                <th>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Student
                                    </Text>
                                </th>
                                <th>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Attendance
                                    </Text>
                                </th>
                                <th>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Option
                                    </Text>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {newStudentAttendances.map((student: any, studentIdx: number) => {
                                return (
                                    <tr key={studentIdx.toString()}>
                                        <th>
                                            <View>
                                                <Image
                                                    style={{
                                                        height: 37,
                                                        width: 37,
                                                        borderRadius: 75,
                                                        alignSelf: 'center',
                                                    }}
                                                    source={{
                                                        uri: student.avatar
                                                            ? student.avatar
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
                                                    {student.fullName}
                                                </Text>
                                            </View>
                                        </th>
                                        <td>
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <label style={{ width: '100%', maxWidth: 250 }}>
                                                    <Select
                                                        themeVariant="light"
                                                        selectMultiple={false}
                                                        groupLabel="&nbsp;"
                                                        inputClass="mobiscrollCustomMultiInput"
                                                        placeholder="Select..."
                                                        touchUi={true}
                                                        value={student.attendanceType}
                                                        data={attendanceTypeOptions}
                                                        onChange={(val: any) => {
                                                            const updateAttendances = [...newStudentAttendances];

                                                            updateAttendances[studentIdx].attendanceType = val.value;

                                                            setNewStudentAttendances(updateAttendances);
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
                                        </td>
                                        <td>
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {student.attendanceType === 'present' ? (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Switch
                                                            value={student.late}
                                                            onValueChange={() => {
                                                                const updateAttendances = [...newStudentAttendances];

                                                                updateAttendances[studentIdx].late = !student.late;

                                                                setNewStudentAttendances(updateAttendances);
                                                            }}
                                                            style={{ height: 20 }}
                                                            trackColor={{
                                                                false: '#f2f2f2',
                                                                true: '#000',
                                                            }}
                                                            activeThumbColor="white"
                                                        />
                                                        <Text
                                                            style={{
                                                                paddingLeft: 10,
                                                            }}
                                                        >
                                                            Late
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View
                                                        style={{
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Switch
                                                            value={student.excused}
                                                            onValueChange={() => {
                                                                const updateAttendances = [...newStudentAttendances];

                                                                updateAttendances[studentIdx].excused =
                                                                    !student.excused;

                                                                setNewStudentAttendances(updateAttendances);
                                                            }}
                                                            style={{ height: 20 }}
                                                            trackColor={{
                                                                false: '#f2f2f2',
                                                                true: '#000',
                                                            }}
                                                            activeThumbColor="white"
                                                        />
                                                        <Text
                                                            style={{
                                                                paddingLeft: 10,
                                                            }}
                                                        >
                                                            Excused
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </View>

                {/* Submit buttons */}
                <View
                    style={{
                        width: '100%',
                        alignItems: 'center',
                        marginVertical: 50,
                    }}
                >
                    {editEntryId ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    marginBottom: 20,
                                }}
                                onPress={() => handleCreateAttendance(true)}
                                disabled={isCreatingAttendance || user.email === disableEmailId}
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
                                        width: 120,
                                    }}
                                >
                                    {isCreatingAttendance ? 'SAVING...' : 'SAVE'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    marginBottom: 20,
                                }}
                                onPress={() => handleDeleteAttendance()}
                                disabled={isDeletingAttendance || user.email === disableEmailId}
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
                                        width: 120,
                                    }}
                                >
                                    {isDeletingAttendance ? 'DELETING...' : 'DELETE'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={{
                                marginBottom: 20,
                            }}
                            onPress={() => handleCreateAttendance(false)}
                            disabled={isCreatingAttendance || user.email === disableEmailId}
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
                                    width: 120,
                                }}
                            >
                                {isCreatingAttendance ? 'CREATING...' : 'CREATE'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }

    const renderInstructorView = () => {
        return (
            <table className="stickyTable">
                {/* First row  */}
                <thead>
                    <tr>
                        {/* First cell will contain search bar */}
                        <th>
                            <TextInput
                                value={studentSearch}
                                onChangeText={(val: string) => setStudentSearch(val)}
                                placeholder={'Search user'}
                                placeholderTextColor={'#1F1F1F'}
                                style={{
                                    width: '100%',
                                    maxWidth: 200,
                                    borderColor: '#f2f2f2',
                                    borderWidth: 1,
                                    backgroundColor: '#fff',
                                    borderRadius: 24,
                                    fontSize: 15,
                                    paddingVertical: 8,
                                    marginTop: 0,
                                    paddingHorizontal: 10,
                                }}
                            />
                        </th>
                        {/* Total column */}
                        <th>
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 14,
                                    color: '#000000',
                                    fontFamily: 'inter',
                                    marginBottom: 5,
                                }}
                            >
                                Total
                            </Text>
                        </th>
                        {/* All assignments */}
                        {attendanceBookEntries.map((entry: any, col: number) => {
                            return (
                                <th
                                    onClick={() => {
                                        handleEditAttendanceBookEntry(
                                            entry.dateId ? entry.dateId : entry.attendanceEntryId
                                        );
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 12,
                                            color: '#000000',
                                            marginBottom: 5,
                                        }}
                                    >
                                        {new Date(entry.start).toString().split(' ')[1] +
                                            ' ' +
                                            new Date(entry.start).toString().split(' ')[2]}{' '}
                                    </Text>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            marginTop: 3,
                                            // marginBottom: 5,
                                            // textAlignVertical: 'center',
                                        }}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                    >
                                        {entry.title}
                                    </Text>

                                    <View
                                        style={{
                                            marginTop: 3,
                                        }}
                                    >
                                        <Ionicons
                                            name={'create-outline'}
                                            size={15}
                                            color="#1f1f1f"
                                            style={{
                                                fontFamily: 'Inter',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    </View>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                {/* Main Body */}
                <tbody>
                    {instructorAttendanceBook.users.length === 0 ? (
                        <View
                            style={{
                                width: '100%',
                                padding: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 18,
                                    textAlign: 'center',
                                    fontFamily: 'Inter',
                                }}
                            >
                                No students.
                            </Text>
                        </View>
                    ) : null}
                    {/* Enter no students message if there is none */}
                    {attendanceBookUsers.map((user: any, row: number) => {
                        const userTotals = instructorAttendanceBook.totals.find((x: any) => x.userId === user.userId);

                        return (
                            <tr style={{}} key={user.userId}>
                                {/* Student info */}
                                <th>
                                    <View>
                                        <Image
                                            style={{
                                                height: 37,
                                                width: 37,
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
                                                marginTop: 7,
                                                textAlign: 'center',
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                            }}
                                        >
                                            {user.fullName}
                                        </Text>
                                    </View>
                                </th>
                                {/* Total */}
                                <td>
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 13,
                                                color: '#000000',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {userTotals.totalPresent + ' / ' + userTotals.totalAttendancesPossible}
                                        </Text>
                                    </View>
                                </td>
                                {/* Other scores */}
                                {attendanceBookEntries.map((entry: any, col: number) => {
                                    const userAttendance = entry.attendances.find((x: any) => x.userId === user.userId);

                                    if (
                                        (activeModifyId === entry.dateId ||
                                            activeModifyId === entry.attendanceEntryId) &&
                                        activeUserId === user.userId
                                    ) {
                                        return (
                                            <td key={col.toString()}>
                                                <View
                                                    style={{
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            flexDirection: 'row',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginTop: 10,
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                marginRight: 20,
                                                            }}
                                                        >
                                                            <label style={{ width: '100%', maxWidth: 120 }}>
                                                                <Select
                                                                    themeVariant="light"
                                                                    selectMultiple={false}
                                                                    groupLabel="&nbsp;"
                                                                    inputClass="mobiscrollCustomMultiInput"
                                                                    placeholder="Select..."
                                                                    touchUi={true}
                                                                    value={attendanceEntry.attendanceType}
                                                                    data={attendanceTypeOptions}
                                                                    onChange={(val: any) => {
                                                                        const updateEntry = {
                                                                            ...attendanceEntry,
                                                                            attendanceType: val.value,
                                                                        };

                                                                        updateEntry.attendanceType = val.value;

                                                                        setAttendanceEntry(updateEntry);
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
                                                            <View
                                                                style={{
                                                                    marginTop: 10,
                                                                }}
                                                            >
                                                                <View
                                                                    style={{
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                    }}
                                                                >
                                                                    <Switch
                                                                        value={
                                                                            attendanceEntry.attendanceType === 'present'
                                                                                ? attendanceEntry.late
                                                                                : attendanceEntry.excused
                                                                        }
                                                                        onValueChange={() => {
                                                                            const updateEntry = {
                                                                                ...attendanceEntry,
                                                                            };

                                                                            if (
                                                                                attendanceEntry.attendanceType ===
                                                                                'present'
                                                                            ) {
                                                                                updateEntry.late =
                                                                                    !attendanceEntry.late;
                                                                            } else {
                                                                                updateEntry.excused =
                                                                                    !attendanceEntry.excused;
                                                                            }

                                                                            setAttendanceEntry(updateEntry);
                                                                        }}
                                                                        style={{ height: 20 }}
                                                                        trackColor={{
                                                                            false: '#f2f2f2',
                                                                            true: '#000',
                                                                        }}
                                                                        activeThumbColor="white"
                                                                    />
                                                                    <Text
                                                                        style={{
                                                                            paddingLeft: 10,
                                                                        }}
                                                                    >
                                                                        {attendanceEntry.attendanceType === 'present'
                                                                            ? 'Late'
                                                                            : 'Excused'}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                updateAttendanceBookEntry();
                                                            }}
                                                            disabled={user.email === disableEmailId}
                                                        >
                                                            <Ionicons
                                                                name="checkmark-circle-outline"
                                                                size={20}
                                                                style={{ marginRight: 5 }}
                                                                color={'#8bc34a'}
                                                            />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setActiveModifyId('');
                                                                setActiveModifyEntryType('');
                                                                setActiveUserId('');
                                                                setAttendanceEntry(undefined);
                                                                // setActiveScore('');
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name="close-circle-outline"
                                                                size={20}
                                                                color={'#f94144'}
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td>
                                            <TouchableOpacity
                                                style={{
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                }}
                                                key={row.toString() + '-' + col.toString()}
                                                onPress={() => {
                                                    setActiveModifyId(
                                                        entry.dateId ? entry.dateId : entry.attendanceEntryId
                                                    );
                                                    setActiveModifyEntryType(
                                                        entry.dateId ? 'meeting' : 'attendanceBook'
                                                    );
                                                    setActiveUserId(user.userId);
                                                    setAttendanceEntry(
                                                        userAttendance
                                                            ? userAttendance
                                                            : {
                                                                  attendanceType: 'absent',
                                                                  late: false,
                                                                  excused: false,
                                                              }
                                                    );
                                                }}
                                            >
                                                <Text>
                                                    <Ionicons
                                                        name={
                                                            userAttendance.attendanceType === 'present'
                                                                ? 'checkmark-outline'
                                                                : 'close-outline'
                                                        }
                                                        size={24}
                                                        color={
                                                            userAttendance.attendanceType === 'present'
                                                                ? '#35AC78'
                                                                : '#F94144'
                                                        }
                                                    />
                                                </Text>

                                                {(userAttendance.attendanceType === 'present' && userAttendance.late) ||
                                                (userAttendance.attendanceType === 'absent' &&
                                                    userAttendance.excused) ? (
                                                    <Text
                                                        style={{
                                                            // marginTop: 2,
                                                            fontSize: 10,
                                                            textAlign: 'center',
                                                            // backgroundColor: '#f3722c',
                                                            borderRadius: 12,
                                                            marginLeft: 5,
                                                            paddingHorizontal: 7,
                                                            paddingVertical: 4,
                                                            color: '#000',
                                                            fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        {userAttendance.attendanceType === 'present' &&
                                                        userAttendance.late
                                                            ? 'LATE'
                                                            : 'EXCUSED'}
                                                    </Text>
                                                ) : null}
                                            </TouchableOpacity>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    const renderAttendanceAnalytics = () => {
        let totalAttendancesPossible;
        let totalPresent;
        let totalLate;
        let totalExcused;
        let last30AttendancesPossible;
        let last30Present;
        let last30Late;
        let last30TotalExcused;
        let last7AttendancesPossible;
        let last7Present;
        let last7Late;
        let last7TotalExcused;

        let totalAbsences;
        let totalInexcused;

        // LAST 30
        let last30Absences;
        let last30Inexcused;

        // Last 7
        let last7Absences;
        let last7Inexcused;

        if (props.isOwner) {
            const userTotals = instructorAttendanceBook.totals.find(
                (x: any) => x.userId === attendanceBookAnalyticsSelectedUser
            );

            totalAttendancesPossible = userTotals.totalAttendancesPossible;
            totalPresent = userTotals.totalPresent;
            totalLate = userTotals.totalLate;
            totalExcused = userTotals.totalExcused;
            last30AttendancesPossible = userTotals.last30AttendancesPossible;
            last30Present = userTotals.last30Present;
            last30Late = userTotals.last30Late;
            last30TotalExcused = userTotals.last30TotalExcused;
            last7AttendancesPossible = userTotals.last7AttendancesPossible;
            last7Present = userTotals.last7Present;
            last7Late = userTotals.last7Late;
            last7TotalExcused = userTotals.last7TotalExcused;

            //
            totalAbsences = totalAttendancesPossible - totalPresent;
            totalInexcused = totalAbsences - totalExcused;

            // LAST 30
            last30Absences = last30AttendancesPossible - last30Present;
            last30Inexcused = last30Absences - last30TotalExcused;

            // Last 7
            last7Absences = last7AttendancesPossible - last7Present;
            last7Inexcused = last7Absences - last7TotalExcused;
        } else {
            totalAttendancesPossible = studentAttendanceBook.total.totalAttendancesPossible;
            totalPresent = studentAttendanceBook.total.totalPresent;
            totalLate = studentAttendanceBook.total.totalLate;
            totalExcused = studentAttendanceBook.total.totalExcused;
            last30AttendancesPossible = studentAttendanceBook.total.last30AttendancesPossible;
            last30Present = studentAttendanceBook.total.last30Present;
            last30Late = studentAttendanceBook.total.last30Late;
            last30TotalExcused = studentAttendanceBook.total.last30TotalExcused;
            last7AttendancesPossible = studentAttendanceBook.total.last7AttendancesPossible;
            last7Present = studentAttendanceBook.total.last7Present;
            last7Late = studentAttendanceBook.total.last7Late;
            last7TotalExcused = studentAttendanceBook.total.last7TotalExcused;

            //
            totalAbsences = totalAttendancesPossible - totalPresent;
            totalInexcused = totalAbsences - totalExcused;

            // LAST 30
            last30Absences = last30AttendancesPossible - last30Present;
            last30Inexcused = last30Absences - last30TotalExcused;

            // Last 7
            last7Absences = last7AttendancesPossible - last7Present;
            last7Inexcused = last7Absences - last7TotalExcused;
        }

        return (
            <View>
                {props.isOwner ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 25,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <label style={{ width: '100%', maxWidth: 250 }}>
                            <Select
                                themeVariant="light"
                                selectMultiple={false}
                                groupLabel="&nbsp;"
                                inputClass="mobiscrollCustomMultiInput"
                                placeholder="Select..."
                                touchUi={true}
                                value={attendanceBookAnalyticsSelectedUser}
                                data={attendanceBookUsersDropdownOptions}
                                onChange={(val: any) => {
                                    setAttendanceBookAnalyticsSelectedUser(val.value);
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
                ) : null}

                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        marginTop: 30,
                    }}
                >
                    <View
                        style={{
                            width: '25%',
                        }}
                    >
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: '#ccc',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#DECA57',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Absences
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalAbsences}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="remove-circle-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Absences}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Absences}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: '25%',
                            paddingLeft: 20,
                        }}
                    >
                        <View
                            style={{
                                borderWidth: 1,
                                borderColor: '#ccc',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#f8961e',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Late
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalLate}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="time-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Late}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Late}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: '25%',
                            paddingLeft: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#ccc',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#f94144',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Inexcused
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalInexcused}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="warning-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Inexcused}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Inexcused}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: '25%',
                            paddingLeft: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#ccc',
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    backgroundColor: '#35ac78',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                            marginBottom: 5,
                                        }}
                                    >
                                        Present
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 28,
                                            fontFamily: 'Inter',
                                            color: '#fff',
                                        }}
                                    >
                                        {totalPresent}
                                    </Text>
                                </View>
                                <Text>
                                    <Ionicons name="checkmark-circle-outline" size={28} color="#fff" />
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    padding: 15,
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 30 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last30Present}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 14,
                                            marginBottom: 5,
                                        }}
                                    >
                                        Past 7 days
                                    </Text>
                                    <Text
                                        style={{
                                            color: '#000',
                                            fontFamily: 'overpass',
                                            fontSize: 20,
                                        }}
                                    >
                                        {last7Present}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderInstructorAttendances = () => {
        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 50,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                        }}
                    >
                        Attendances
                    </Text>

                    <TouchableOpacity
                        style={{}}
                        onPress={() => {
                            props.setShowNewAttendance(true);
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
                                fontSize: 12,
                                paddingHorizontal: 24,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                paddingVertical: 14,
                                textTransform: 'uppercase',
                                width: 100,
                            }}
                        >
                            New
                        </Text>
                    </TouchableOpacity>
                </View>

                {isFetchingAttendanceBook ? (
                    <View
                        style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0,
                            paddingVertical: 100,
                        }}
                    >
                        <ActivityIndicator color={'#1F1F1F'} />
                    </View>
                ) : !instructorAttendanceBook ? (
                    <View>
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
                            Could not fetch attendances.
                        </Text>
                    </View>
                ) : instructorAttendanceBook.entries.length === 0 || instructorAttendanceBook.users.length === 0 ? (
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
                            {instructorAttendanceBook.entries.length === 0
                                ? 'No attendances found.'
                                : 'No users in course.'}
                        </Text>
                    </View>
                ) : (
                    <View
                        style={{
                            flexDirection: 'column',
                        }}
                    >
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: 'white',
                                maxHeight: Dimensions.get('window').height - 64 - 45 - 120,
                                maxWidth: 1024,
                                borderRadius: 2,
                                borderWidth: 1,
                                marginTop: 20,
                                borderColor: '#cccccc',
                                zIndex: 5000000,
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                position: 'relative',
                                overflow: 'scroll',
                            }}
                        >
                            {renderInstructorView()}
                        </View>

                        {/*  */}
                        <View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Attendance Insights
                                </Text>
                            </View>

                            {/*  */}
                            <View>{renderAttendanceAnalytics()}</View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderStudentAttendances = () => {
        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 50,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                        }}
                    >
                        Attendances
                    </Text>
                </View>

                {isFetchingStudentAttendanceBook ? (
                    <View
                        style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#fff',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0,
                            paddingVertical: 100,
                        }}
                    >
                        <ActivityIndicator color={'#1F1F1F'} />
                    </View>
                ) : !studentAttendanceBook ? (
                    <View>
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
                            Could not fetch attendances.
                        </Text>
                    </View>
                ) : studentAttendanceBook.entries.length === 0 ? (
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
                            No attendances found.
                        </Text>
                    </View>
                ) : (
                    <View
                        style={{
                            flexDirection: 'column',
                        }}
                    >
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: 'white',
                                maxHeight: Dimensions.get('window').height - 64 - 45 - 120,
                                maxWidth: 1024,
                                borderRadius: 2,
                                borderWidth: 1,
                                marginTop: 20,
                                borderColor: '#cccccc',
                                zIndex: 5000000,
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                position: 'relative',
                                overflow: 'scroll',
                            }}
                        >
                            {renderStudentsMeetingsList()}
                        </View>

                        {/*  */}
                        <View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Attendance Insights
                                </Text>
                            </View>

                            {/*  */}
                            <View>{renderAttendanceAnalytics()}</View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    // MAIN RETURN
    return (
        <View
            style={{
                backgroundColor: '#fff',
                width: '100%',
                paddingHorizontal: paddingResponsive(),
                marginBottom: 50,
            }}
        >
            {props.isOwner ? renderInstructorAttendances() : renderStudentAttendances()}
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
