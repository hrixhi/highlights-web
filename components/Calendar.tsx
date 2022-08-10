// REACT
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Switch,
    Linking,
    StyleSheet,
    View as DefaultView,
    Platform,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API
import {
    getChannels,
    getEvents,
    createDateV1,
    editDateV1,
    deleteDateV1,
    getActivity,
    markActivityAsRead,
    regenZoomMeeting,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { TextInput } from './CustomTextInput';
import Alert from './Alert';
import { Text, View, TouchableOpacity } from './Themed';
import moment from 'moment';
import { htmlStringParser } from '../helpers/HTMLParser';
import { Ionicons } from '@expo/vector-icons';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { eventFrequencyOptions } from '../helpers/FrequencyOptions';
import { Eventcalendar, Datepicker, Popup } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import _ from 'lodash';
import { Select } from '@mobiscroll/react';
import { zoomClientId, zoomRedirectUri, disableEmailId } from '../constants/zoomCredentials';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

import { paddingResponsive } from '../helpers/paddingHelper';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';
import parser from 'html-react-parser';

const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, org, user, subscriptions } = useAppContext();
    const [tab, setTab] = useState(props.tab);
    const [modalAnimation] = useState(new Animated.Value(1));
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date(start.getTime() + 1000 * 60 * 60));
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [channels, setChannels] = useState<any[]>([]);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [channelId, setChannelId] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('My Events');
    const [description, setDescription] = useState('');
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState('1-W');
    const [repeatTill, setRepeatTill] = useState(new Date());
    const [isMeeting, setIsMeeting] = useState(false);
    const [recordMeeting, setRecordMeeting] = useState(false);
    const [isCreatingEvents, setIsCreatingEvents] = useState(false);
    const [editEvent, setEditEvent] = useState<any>(null);
    const [editChannelName, setEditChannelName] = useState('');
    const [isEditingEvents, setIsEditingEvents] = useState(false);
    const [isDeletingEvents, setIsDeletingEvents] = useState(false);
    const [allActivity, setAllActivity] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState<any>(0);
    const tabs = ['Agenda', 'Schedule', 'Calendar', 'Activity', 'Add'];
    const width = Dimensions.get('window').width;
    const weekDays = {
        '1': 'Sun',
        '2': 'Mon',
        '3': 'Tue',
        '4': 'Wed',
        '5': 'Thu',
        '6': 'Fri',
        '7': 'Sat',
    };
    const [selectedStartDay, setSelectedStartDay] = useState<any>(`${start.getDay() + 1}`);
    const [selectedDays, setSelectedDays] = useState<any[]>([selectedStartDay]);
    const channelOptions = [
        {
            value: 'My Events',
            text: 'My Events',
        },
        {
            value: 'School Events',
            text: 'School Events',
        },
    ];

    channels.map((channel: any) => {
        channelOptions.push({
            value: channel._id,
            text: channel.name,
        });
    });
    const [userZoomInfo] = useState<any>(user.zoomInfo);
    const [meetingProvider] = useState(org.meetingProvider ? org.meetingProvider : '');
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [filterStart, setFilterStart] = useState<any>(null);
    const [filterEnd, setFilterEnd] = useState<any>(null);
    const [filterByChannel, setFilterByChannel] = useState('All');
    const [filterEventsType, setFilterEventsType] = useState('All');
    const [viewAnnouncement, setViewAnnouncement] = useState<any>(undefined);

    // HOOKS

    /**
     * @description Configure Mobiscroll calendar
     */
    const viewAgenda: any = React.useMemo(() => {
        return {
            agenda: { type: 'week' },
        };
    }, []);
    const viewSchedule: any = React.useMemo(() => {
        return {
            schedule: { type: 'week', startDay: 1, endDay: 0 },
        };
    }, []);
    const viewCalendar: any = React.useMemo(() => {
        return {
            calendar: { type: 'month' },
        };
    }, []);

    const server = useApolloClient();

    /**
     * @description Fetch data on Init
     */
    useEffect(() => {
        loadEvents();
        loadChannels();
    }, []);

    /**
     * @description Fetch user activity
     */
    useEffect(() => {
        server
            .query({
                query: getActivity,
                variables: {
                    userId,
                },
            })
            .then((res) => {
                if (res.data && res.data.activity.getActivity) {
                    const tempActivity = [...res.data.activity.getActivity];
                    let unread = 0;
                    tempActivity.map((act: any) => {
                        if (act.status === 'unread') {
                            unread++;
                        }
                    });
                    setUnreadCount(unread);
                    setActivity(tempActivity);
                    setAllActivity(tempActivity);
                }
            });
    }, []);

    /**
     * @description Validate submit for creating events
     */
    useEffect(() => {
        if (title !== '' && end > start) {
            setIsSubmitDisabled(false);
            return;
        }
        setIsSubmitDisabled(true);
    }, [title, start, end]);

    /**
     * @description Filter events and activity
     */
    useEffect(() => {
        let all = [...allActivity];
        if (filterByChannel === 'All') {
        } else if (filterByChannel === 'schoolwide') {
            all = all.filter((e: any) => e.target === 'ANNOUNCEMENT');
        } else {
            all = all.filter((e: any) => filterByChannel === e.channelId);
        }

        if (filterStart && filterEnd) {
            all = all.filter(
                (e: any) => new Date(e.date) > new Date(filterStart) && new Date(e.date) < new Date(filterEnd)
            );
        }

        setActivity(all);

        let total = [...allEvents];

        if (filterEventsType !== 'All') {
            if (filterEventsType === 'Meetings') {
                total = total.filter((e: any) => e.meeting);
            } else if (filterEventsType === 'Submissions') {
                total = total.filter((e: any) => e.cueId !== '');
            } else if (filterEventsType === 'Events') {
                total = total.filter((e: any) => e.cueId === '' && !e.meeting);
            }
        }

        if (filterByChannel !== 'All') {
            total = total.filter((e: any) => {
                if (filterByChannel === 'My Events') {
                    return e.channelId === '' && !e.schoolwide;
                } else if (filterByChannel === 'schoolwide') {
                    return e.schoolwide;
                } else {
                    return filterByChannel === e.channelId;
                }
            });
        }

        if (filterStart && filterEnd) {
            total = total.filter(
                (e: any) => new Date(e.start) > new Date(filterStart) && new Date(e.end) < new Date(filterEnd)
            );
        }

        setEvents(total);
    }, [filterByChannel, filterEventsType, filterStart, filterEnd]);

    /**
     * @description When an event is selected to edit, update state variables
     */
    useEffect(() => {
        if (editEvent) {
            setTitle(editEvent.originalTitle);
            setDescription(editEvent.description);
            setStart(new Date(editEvent.start));
            setEnd(new Date(editEvent.end));
            setEditChannelName(editEvent.channelName !== '' ? editEvent.channelName : 'My Events');

            if (editEvent.dateId !== 'channel' && editEvent.createdBy) {
                setIsMeeting(true);
                if (editEvent.recordMeeting) {
                    setRecordMeeting(true);
                }
            }
        } else {
            setTitle('');
            setDescription('');
            const current = new Date();
            setStart(new Date());
            setEnd(new Date(current.getTime() + 1000 * 60 * 60));
            setEditChannelName('');
        }
    }, [editEvent]);

    /**
     * @description Updated selected start day for recurring days selection (start day is disabled by default)
     */
    useEffect(() => {
        const startDay = start.getDay() + 1;

        setSelectedStartDay(startDay.toString());
        setSelectedDays([startDay.toString()]);

        // }
    }, [start]);

    /**
     * @description Load all channels to filter data in Activity
     */
    const loadChannels = useCallback(async () => {
        server
            .query({
                query: getChannels,
                variables: {
                    userId,
                },
            })
            .then((res) => {
                if (res.data.channel.findByUserId) {
                    setChannels(res.data.channel.findByUserId);
                }
            })
            .catch((err) => {});
    }, [userId]);

    /**
     * @description Handle Create event
     */
    const handleCreate = useCallback(async () => {
        if (title === '') {
            Alert('A title must be set for the event. ');
            return;
        } else if (end < new Date()) {
            Alert('Event end time must be set in the future.');
            return;
        } else if (start > end) {
            Alert('Event end time must be set after the start time.');
            return;
        }
        if (recurring) {
            if (start > repeatTill) {
                Alert('Repeat until date must be set in the future.');
                return;
            }
        }

        setIsCreatingEvents(true);

        const meeting = channelId && channelId !== '' ? isMeeting : false;

        const freq = recurring ? frequency : '';

        const repeat = recurring ? repeatTill.toUTCString() : '';

        const repeatDays = recurring && frequency === '1-W' ? selectedDays : '';

        server
            .mutate({
                mutation: createDateV1,
                variables: {
                    title,
                    userId,
                    start: start.toUTCString(),
                    end: end.toUTCString(),
                    channelId,
                    meeting,
                    description,
                    recordMeeting,
                    frequency: freq,
                    repeatTill: repeat,
                    repeatDays,
                },
            })
            .then((res) => {
                if (res.data && res.data.date.createV1 === 'SUCCESS') {
                    Alert('Event created successfully.');
                    loadEvents();
                    setTitle('');
                    setRepeatTill(new Date());
                    setIsMeeting(false);
                    setDescription('');
                    setFrequency('1-W');
                    setRecurring(false);
                    setRecordMeeting(false);
                    setIsCreatingEvents(false);
                    setShowAddEvent(false);
                    setSelectedDays([]);
                    setSelectedStartDay('');
                    props.setTab('Agenda');
                } else if (res.data && res.data.date.createV1 === 'ZOOM_MEETING_CREATE_FAILED') {
                    Alert('Event scheduled but Zoom meeting could not be created.');
                    loadEvents();
                    setTitle('');
                    setRepeatTill(new Date());
                    setIsMeeting(false);
                    setDescription('');
                    setFrequency('1-W');
                    setRecurring(false);
                    setRecordMeeting(false);
                    setIsCreatingEvents(false);
                    setShowAddEvent(false);
                    setSelectedDays([]);
                    setSelectedStartDay('');
                } else {
                    Alert('Failed to create event. Try again.');
                }
            })
            .catch((err) => {
                setIsCreatingEvents(false);
                console.log(err);
            });
    }, [
        title,
        description,
        start,
        end,
        channelId,
        recordMeeting,
        isMeeting,
        repeatTill,
        frequency,
        recurring,
        isSubmitDisabled,
        isCreatingEvents,
        selectedDays,
        userId,
    ]);

    const markAlertsRead = useCallback(async () => {
        server
            .mutate({
                mutation: markActivityAsRead,
                variables: {
                    userId,
                    markAllRead: true,
                },
            })
            .then((res) => {
                if (res.data.activity.markActivityAsRead) {
                    server
                        .query({
                            query: getActivity,
                            variables: {
                                userId,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.activity.getActivity) {
                                const tempActivity = [...res.data.activity.getActivity];
                                let unread = 0;
                                tempActivity.map((act: any) => {
                                    if (act.status === 'unread') {
                                        unread++;
                                    }
                                });
                                setUnreadCount(unread);
                                setActivity(tempActivity);
                            }
                        });
                }
            })
            .catch((err) => {});
    }, [userId]);

    /**
     * @description Handle Edit event
     */
    const handleEdit = useCallback(async () => {
        if (title === '') {
            Alert('A title must be set for the event. ');
            return;
        } else if (end < new Date()) {
            Alert('Event end time must be set in the future.');
            return;
        } else if (start > end) {
            Alert('Event end time must be set after the start time.');
            return;
        }

        Alert('Update event?', '', [
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
                    setIsEditingEvents(true);

                    server
                        .mutate({
                            mutation: editDateV1,
                            variables: {
                                id: editEvent.eventId,
                                title,
                                start: start.toUTCString(),
                                end: end.toUTCString(),
                                description,
                                recordMeeting,
                            },
                        })
                        .then((res) => {
                            if (res.data.date.editV1) {
                                loadEvents();
                                props.setTab('Agenda');
                                setEditEvent(null);
                                setTab('Agenda');
                                // Alert('Updated event successfully.');
                            } else {
                                Alert('Failed to edit event. Try again.');
                            }

                            setIsEditingEvents(false);
                        })
                        .catch((err) => {
                            Alert('Failed to edit event. Try again.');
                            setIsEditingEvents(false);
                            console.log(err);
                        });
                },
            },
        ]);
    }, [editEvent, title, start, end, description, isMeeting, recordMeeting]);

    /**
     * @description Handle Delete event
     */
    const handleDelete = useCallback(
        async (deleteAll: boolean) => {
            const { eventId, recurringId } = editEvent;

            setIsDeletingEvents(true);

            server
                .mutate({
                    mutation: deleteDateV1,
                    variables: {
                        id: !deleteAll ? eventId : recurringId,
                        deleteAll,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.date.deleteV1 === 'SUCCESS') {
                        loadEvents();
                        setTitle('');
                        setRepeatTill(new Date());
                        setIsMeeting(false);
                        setDescription('');
                        setFrequency('1-W');
                        setRecurring(false);
                        setRecordMeeting(false);
                        setEditEvent(null);
                        setShowAddEvent(false);
                        props.setTab('Agenda');
                        setTab('Agenda');

                        // Alert(!deleteAll ? 'Deleted event successfully.' : 'Deleted events successfully.');
                    } else if (res.data && res.data.date.deleteV1 === 'ZOOM_MEETING_DELETE_FAILED') {
                        Alert('Event deleted successfully. Failed to delete Zoom meeting.');
                    } else {
                        Alert(
                            !deleteAll ? 'Failed to delete event. Try again.' : 'Failed to delete events. Try again.'
                        );
                    }
                    setIsDeletingEvents(false);
                })
                .catch((err) => {
                    setIsDeletingEvents(false);
                    Alert(!deleteAll ? 'Failed to delete event. Try again.' : 'Failed to delete events. Try again.');
                    console.log(err);
                });
        },
        [title, start, end, description, isMeeting, recordMeeting]
    );

    /**
     * @description Load all events for Agenda
     */
    const loadEvents = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        server
            .query({
                query: getEvents,
                variables: {
                    userId,
                },
            })
            .then((res) => {
                if (res.data.date && res.data.date.getCalendar) {
                    const parsedEvents: any[] = [];

                    const channelsSet = new Set();

                    res.data.date.getCalendar.map((e: any) => {
                        const { title } = htmlStringParser(e.title);

                        channelsSet.add(e.channelName);

                        let colorCode = '#202025';

                        const matchSubscription = subscriptions.find((sub: any) => {
                            return sub.channelName === e.channelName;
                        });

                        if (matchSubscription && matchSubscription !== undefined) {
                            colorCode = matchSubscription.colorCode;
                        }

                        parsedEvents.push({
                            eventId: e.eventId ? e.eventId : '',
                            originalTitle: title,
                            title: e.channelName ? title + ' - ' + e.channelName : title,
                            start: new Date(e.start),
                            end: datesEqual(e.start, e.end) ? null : new Date(e.end),
                            dateId: e.dateId,
                            description: e.description,
                            createdBy: e.createdBy,
                            channelName: e.channelName,
                            recurringId: e.recurringId,
                            recordMeeting: e.recordMeeting ? true : false,
                            meeting: e.meeting,
                            channelId: e.channelId,
                            cueId: e.cueId,
                            color: colorCode,
                            submitted: e.submitted,
                            zoomMeetingId: e.zoomMeetingId,
                            zoomStartUrl: e.zoomStartUrl,
                            zoomJoinUrl: e.zoomJoinUrl,
                            zoomRegistrationJoinUrl: e.zoomRegistrationJoinUrl,
                            zoomMeetingScheduledBy: e.zoomMeetingScheduledBy,
                            zoomMeetingCreatorProfile: e.zoomMeetingCreatorProfile,
                            meetingLink: e.meetingLink ? e.meetingLink : null,
                            isNonChannelMeeting: e.isNonChannelMeeting,
                            nonChannelGroupId: e.nonChannelGroupId,
                            groupUsername: e.groupUsername,
                            schoolwide: e.schoolwide,
                        });
                    });
                    setEvents(parsedEvents);
                    setAllEvents(parsedEvents);
                } else {
                    setLoading(false);
                }
                setLoading(false);
                modalAnimation.setValue(0);
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start();
            })
            .catch((err) => {
                console.log(err);
                Alert('Unable to load calendar.', 'Check connection.');
                setLoading(false);
                modalAnimation.setValue(0);
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start();
            });
    }, [subscriptions, modalAnimation, userId]);

    // FUNCTIONS

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    /**
     * @description Check if two dates are equal for Agenda (e.g. for Assignments)
     */
    const datesEqual = (date1: string, date2: string) => {
        const one = new Date(date1);
        const two = new Date(date2);

        if (one > two) return false;
        else if (one < two) return false;
        else return true;
    };

    /**
     * @description On Select event in Agenda
     */
    const onSelectEvent = (data: any) => {
        const { event } = data;

        const timeString = datesEqual(event.start, event.end)
            ? moment(new Date(event.start)).format('MMMM Do YYYY, h:mm a')
            : moment(new Date(event.start)).format('MMMM Do YYYY, h:mm a') +
              ' to ' +
              moment(new Date(event.end)).format('MMMM Do YYYY, h:mm a');

        const descriptionString = event.description ? event.description + '- ' + timeString : '' + timeString;

        if (userId === event.createdBy && new Date(event.end) > new Date() && event.eventId) {
            setEditEvent(event);
            setTab('Add');
        } else if (
            userId === event.createdBy &&
            event.cueId === '' &&
            new Date(event.end) < new Date() &&
            event.eventId
        ) {
            Alert('Delete ' + event.title + '?', descriptionString, [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    },
                },
                {
                    text: 'Delete',
                    onPress: async () => {
                        server
                            .mutate({
                                mutation: deleteDateV1,
                                variables: {
                                    id: event.eventId,
                                    deleteAll: false,
                                },
                            })
                            .then((res) => {
                                if (res.data && res.data.date.deleteV1) {
                                    Alert('Event Deleted!');
                                    loadEvents();
                                }
                            });
                    },
                },
            ]);
        } else {
            const date = new Date();

            if (date > new Date(event.start) && date < new Date(event.end) && event.meeting) {
                const meetingLink = !meetingProvider
                    ? event.zoomRegistrationJoinUrl
                        ? event.zoomRegistrationJoinUrl
                        : event.zoomJoinUrl
                    : event.meetingLink;

                if (!meetingLink) {
                    Alert('No meeting link set. Contact your instructor.');
                    return;
                }

                Alert('Join meeting?', '', [
                    {
                        text: 'No',
                        style: 'cancel',
                        onPress: () => {
                            return;
                        },
                    },
                    {
                        text: 'Yes',
                        onPress: async () => {
                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                window.open(meetingLink, '_blank');
                            } else {
                                Linking.openURL(meetingLink);
                            }
                        },
                    },
                ]);
            } else if (event.cueId !== '') {
                props.openCue(event.channelId, event.cueId, event.createdBy);
            } else {
                Alert(event.title, descriptionString);
            }
        }
    };

    /**
     * @description Allows selection of recurring option for creating events
     */
    const renderRecurringOptions = () => (
        <View style={{}}>
            <View
                style={{
                    width: '100%',
                    maxWidth: 400,
                    display: 'flex',
                    paddingTop: channels.length > 0 ? 40 : 20,
                    paddingBottom: 5,
                }}
            >
                <View style={{ width: '100%' }}>
                    <Text style={styles.text}>Recurring</Text>
                </View>
                <View
                    style={{
                        height: 40,
                        marginRight: 10,
                        paddingLeft: 5,
                        marginTop: 10,
                    }}
                >
                    <Switch
                        value={recurring}
                        onValueChange={() => setRecurring(!recurring)}
                        style={{ height: 20 }}
                        trackColor={{
                            false: '#f2f2f2',
                            true: '#000',
                        }}
                        activeThumbColor="white"
                    />
                </View>
            </View>

            {recurring ? (
                <View style={{ width: '100%', maxWidth: 400, display: 'flex', paddingVertical: 15 }}>
                    <View style={{ width: '100%' }}>
                        <Text style={styles.text}>Interval</Text>
                    </View>
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginLeft: 0,
                        }}
                    >
                        <label style={{ width: '100%', maxWidth: 400, backgroundColor: 'white' }}>
                            <Select
                                themeVariant="light"
                                touchUi={true}
                                value={frequency}
                                onChange={(val: any) => {
                                    setFrequency(val.value);
                                }}
                                rows={eventFrequencyOptions.length}
                                responsive={{
                                    small: {
                                        display: 'bubble',
                                    },
                                    medium: {
                                        touchUi: false,
                                    },
                                }}
                                data={eventFrequencyOptions.map((item: any, index: number) => {
                                    return {
                                        value: item.value,
                                        text: item.label,
                                    };
                                })}
                            />
                        </label>
                    </View>
                </View>
            ) : null}

            {recurring && frequency === '1-W' ? (
                <View style={{ width: '100%', maxWidth: 400, display: 'flex' }}>
                    <View style={{ width: '100%', backgroundColor: 'white', paddingVertical: 15 }}>
                        <Text style={styles.text}>Occurs on</Text>
                        {
                            <View style={{ flexDirection: 'row', width: '100%', flexWrap: 'wrap' }}>
                                {Object.keys(weekDays).map((day: any, ind: number) => {
                                    const label = weekDays[day];

                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginRight: 10,
                                                padding: 5,
                                            }}
                                            key={ind.toString()}
                                        >
                                            <input
                                                disabled={day === selectedStartDay}
                                                type="checkbox"
                                                checked={selectedDays.includes(day)}
                                                onChange={(e: any) => {
                                                    if (selectedDays.includes(day)) {
                                                        const filterDays = selectedDays.filter(
                                                            (sel: any) => sel !== day
                                                        );
                                                        setSelectedDays(filterDays);
                                                    } else {
                                                        const updatedSelectDays = [...selectedDays, day];
                                                        setSelectedDays(updatedSelectDays);
                                                    }
                                                }}
                                            />
                                            <Text style={{ marginLeft: 5 }}>{label}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        }
                    </View>
                </View>
            ) : null}

            {recurring ? (
                <View style={{ width: '100%', maxWidth: 400, display: 'flex' }}>
                    <View style={{ width: '100%', backgroundColor: 'white', paddingVertical: 15 }}>
                        <Text style={styles.text}>End date</Text>
                        <Datepicker
                            controls={['date', 'time']}
                            touchUi={true}
                            theme="ios"
                            value={repeatTill}
                            themeVariant="light"
                            inputProps={{
                                placeholder: 'Repeat till...',
                            }}
                            onChange={(event: any) => {
                                const date = new Date(event.value);
                                const roundOffDate = roundSeconds(date);
                                setRepeatTill(roundOffDate);
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
            ) : null}
        </View>
    );

    /**
     * @description Allows selection of whether event is a lecture
     */
    const renderMeetingOptions = () => {
        let meetingSwitchMessage =
            'Students will be able to join the meeting directly from the Agenda or Meetings tab in your Course.';

        let meetingSwitchSubtitle =
            'The meeting link will be same as the one in the Course Settings. Ensure you have a working link set at all times.';

        if ((!userZoomInfo || !userZoomInfo.accountId || userZoomInfo.accountId === '') && !meetingProvider) {
            meetingSwitchMessage =
                'To generate Zoom meetings directly from Cues, connect to Zoom under Account > Profile.';
            meetingSwitchSubtitle = '';
        } else if (userZoomInfo && userZoomInfo.accountId && userZoomInfo.accountId !== '' && !meetingProvider) {
            meetingSwitchMessage = 'Cues will automatically generate a Zoom meeting.';
            meetingSwitchSubtitle =
                'Students will be able to join the meeting directly from the Agenda or Meetings tab in your Course.';
        }

        return channelId !== '' || editChannelName !== '' ? (
            <DefaultView style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingBottom: 5 }}>
                {!editEvent ? (
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: width < 768 ? '100%' : '33.33%',
                        }}
                    >
                        <View style={{ width: '100%', paddingTop: width < 768 ? 40 : 25, paddingBottom: 15 }}>
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
                                    Meeting
                                </Text>
                                {editEvent ? null : (
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert(meetingSwitchMessage, meetingSwitchSubtitle);
                                        }}
                                    >
                                        <Ionicons name="help-circle-outline" size={18} color="#939699" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <View
                            style={{
                                height: 40,
                                marginRight: 10,
                            }}
                        >
                            <Switch
                                value={isMeeting}
                                disabled={
                                    editEvent ||
                                    ((!userZoomInfo || !userZoomInfo.accountId || userZoomInfo.accountId === '') &&
                                        !meetingProvider)
                                }
                                onValueChange={() => {
                                    setIsMeeting(!isMeeting);
                                }}
                                style={{ height: 20 }}
                                trackColor={{
                                    false: '#f2f2f2',
                                    true: '#000',
                                }}
                                activeThumbColor="white"
                            />
                        </View>
                    </View>
                ) : null}
            </DefaultView>
        ) : null;
    };

    /**
     * @description When editing event, shows the name of channel
     */
    const renderEditChannelName = () => {
        return (
            editChannelName && (
                <View style={{ backgroundColor: 'none' }}>
                    <Text
                        style={{
                            fontSize: 20,
                            fontFamily: 'Inter',
                            color: '#000000',
                        }}
                    >
                        {editEvent && editEvent.meeting ? 'Meeting' : 'Event'} for {editChannelName}
                    </Text>
                </View>
            )
        );
    };

    /**
     * @description Display zoom meeting info
     */
    const renderEditMeetingInfo = () => {
        return editEvent && editEvent.zoomMeetingId && editEvent.zoomMeetingId !== '' ? (
            <View style={{}}>
                <View
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            marginRight: 5,
                            color: '#000000',
                        }}
                    >
                        Zoom Meeting ID
                    </Text>
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'overpass',
                            color: '#797979',
                        }}
                    >
                        {editEvent.zoomMeetingId}
                    </Text>
                </View>

                <View style={{ width: '100%', maxWidth: 400, marginBottom: 10 }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            marginRight: 10,
                            color: '#000000',
                            marginBottom: 5,
                        }}
                    >
                        Invite Link
                    </Text>
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'overpass',
                            color: '#797979',
                        }}
                    >
                        {editEvent.zoomJoinUrl}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                        disabled={user.email === disableEmailId}
                        style={{ marginRight: 15 }}
                        onPress={() => {
                            if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                window.open(editEvent.zoomStartUrl, '_blank');
                            } else {
                                Linking.openURL(editEvent.zoomStartUrl);
                            }
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000',
                            }}
                        >
                            Start meeting
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ marginRight: 15 }}
                        onPress={async () => {
                            await navigator.clipboard.writeText(editEvent.zoomJoinUrl);
                            Alert('Invite link copied!');
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000',
                            }}
                        >
                            Copy Invite
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={{}}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#F94144'
                                }}>
                                Delete Meeting
                            </Text>
                        </TouchableOpacity> */}
                </View>
            </View>
        ) : editEvent && editEvent.meeting && userZoomInfo && userZoomInfo.accountId ? (
            <View
                style={{
                    marginVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    backgroundColor: '#f2f2f2',
                    borderRadius: 1,
                }}
            >
                <Ionicons name="warning-outline" size={22} color={'#f3722c'} />
                <Text style={{ paddingLeft: 20 }}>Zoom meeting has been deleted or has expired</Text>
                <TouchableOpacity
                    onPress={() => {
                        server
                            .mutate({
                                mutation: regenZoomMeeting,
                                variables: {
                                    userId,
                                    dateId: editEvent.eventId,
                                },
                            })
                            .then((res) => {
                                if (res.data && res.data.date.regenZoomMeeting) {
                                    const e = res.data.date.regenZoomMeeting;
                                    setEditEvent({
                                        eventId: e.eventId ? e.eventId : '',
                                        originalTitle: title,
                                        title: e.channelName ? title + ' - ' + e.channelName : title,
                                        start: new Date(e.start),
                                        end: datesEqual(e.start, e.end) ? null : new Date(e.end),
                                        dateId: e.dateId,
                                        description: e.description,
                                        createdBy: e.createdBy,
                                        channelName: e.channelName,
                                        recurringId: e.recurringId,
                                        recordMeeting: e.recordMeeting ? true : false,
                                        meeting: e.meeting,
                                        channelId: e.channelId,
                                        cueId: e.cueId,
                                        submitted: e.submitted,
                                        zoomMeetingId: e.zoomMeetingId,
                                        zoomStartUrl: e.zoomStartUrl,
                                        zoomJoinUrl: e.zoomJoinUrl,
                                        zoomRegistrationJoinUrl: e.zoomRegistrationJoinUrl,
                                        zoomMeetingScheduledBy: e.zoomMeetingScheduledBy,
                                        zoomMeetingCreatorProfile: e.zoomMeetingCreatorProfile,
                                        meetingLink: e.meetingLink ? e.meetingLink : null,
                                    });
                                } else {
                                    Alert('Failed to create zoom meeting.');
                                }
                            })
                            .catch((err) => {
                                Alert('Something went wrong.');
                            });
                    }}
                    style={{
                        backgroundColor: '#f2f2f2',
                        paddingHorizontal: 10,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            color: '#000',
                            backgroundColor: '#f2f2f2',
                        }}
                    >
                        Create New
                    </Text>
                </TouchableOpacity>
            </View>
        ) : null;
    };

    /**
     * @description Renders edit event buttons
     */
    const renderEditEventOptions = () => {
        const { recurringId, start, end, channelId } = editEvent;

        // const date = new Date();

        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    display: 'flex',
                    paddingTop: 30,
                    paddingBottom: 30,
                    alignSelf: 'center',
                    marginBottom: 30,
                }}
            >
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        marginTop: 15,
                    }}
                    onPress={() => {
                        handleEdit();
                    }}
                    disabled={isEditingEvents || isDeletingEvents || user.email === disableEmailId}
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
                        {isEditingEvents ? 'EDITING...' : 'EDIT'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        // overflow: 'hidden',
                        marginTop: 15,
                    }}
                    onPress={() => {
                        Alert('Delete event?', '', [
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
                                    handleDelete(false);
                                },
                            },
                        ]);
                    }}
                    disabled={isEditingEvents || isDeletingEvents || user.email === disableEmailId}
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
                        {isDeletingEvents ? 'DELETING...' : 'DELETE'}
                    </Text>
                </TouchableOpacity>

                {recurringId && recurringId !== '' ? (
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            // overflow: 'hidden',
                            // height: 35,
                            marginTop: 15,
                            // width: '100%',
                            // justifyContent: 'center',
                            // flexDirection: 'row',
                        }}
                        onPress={() => {
                            Alert('Delete events?', '', [
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
                                        handleDelete(true);
                                    },
                                },
                            ]);
                        }}
                        disabled={isEditingEvents || isDeletingEvents || user.email === disableEmailId}
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
                            {isDeletingEvents ? 'DELETING...' : 'DELETE ALL'}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    /**
     * @description Custom content for Mobiscroll Agenda
     */
    const renderEventContent = (data: any) => {
        const assingmentDue = new Date() > new Date(data.original.start);

        const isMeeting = data.original.meeting;

        const isNonChannelMeeting = data.original.isNonChannelMeeting;

        const groupUsername = data.original.groupUsername;

        const startTime = new Date(data.original.start);
        const endTime = new Date(data.original.end);

        return (
            <React.Fragment>
                <div>
                    {data.title} {isNonChannelMeeting ? ' · ' + groupUsername : ''}{' '}
                </div>
                <div className="md-custom-event-cont">
                    <div
                        style={{
                            color: '#1F1F1F',
                            fontSize: 15,
                            paddingTop: isMeeting && new Date() > startTime && new Date() < endTime ? 5 : 0,
                            maxHeight: 40,
                        }}
                    >
                        {data.original.description}
                    </div>
                    {data.original.submitted !== null && userId !== '' && userId !== data.original.createdBy ? (
                        <div>
                            <div
                                style={{
                                    color: data.original.submitted ? '#35AC78' : !assingmentDue ? '#007AFF' : '#F94144',
                                    borderRadius: 12,
                                    padding: 4,
                                    fontSize: 13,
                                    borderWidth: 1,
                                }}
                            >
                                {data.original.submitted ? 'SUBMITTED' : assingmentDue ? 'MISSING' : 'PENDING'}
                            </div>
                        </div>
                    ) : null}
                    {isMeeting && new Date() > startTime && new Date() < endTime ? (
                        <div>
                            <div
                                style={{
                                    color: '#007AFF',
                                    borderRadius: 12,
                                    padding: 4,
                                    fontSize: 13,
                                    borderWidth: 1,
                                }}
                            >
                                {'IN PROGRESS'}
                            </div>
                        </div>
                    ) : null}
                </div>
            </React.Fragment>
        );
    };

    /**
     * @description Formats time in email format
     */
    function emailTimeDisplay(dbDate: string) {
        let date = moment(dbDate);
        var currentDate = moment();
        if (currentDate.isSame(date, 'day')) return date.format('h:mm a');
        else if (currentDate.isSame(date, 'year')) return date.format('MMM DD');
        else return date.format('MM/DD/YYYY');
    }

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

    /**
     * @description Renders filter for Agenda
     */
    const renderEventFilters = () => {
        const channelOptions = [
            { value: 'All', text: 'All' },
            { value: 'My Events', text: 'My Events' },
            { value: 'schoolwide', text: 'Schoolwide' },
        ];

        subscriptions.map((sub: any) => {
            channelOptions.push({
                value: sub.channelId,
                text: sub.channelName,
            });
        });

        const typeOptions = [
            { value: 'All', text: 'All' },
            { value: 'Meetings', text: 'Meetings' },
            { value: 'Submissions', text: 'Submissions' },
            { value: 'Events', text: 'Events' },
        ];

        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            fontFamily: 'Inter',
                            color: '#000000',
                            paddingLeft: 5,
                            paddingBottom: 10,
                        }}
                    >
                        Workspace
                    </Text>
                    <label style={{ width: 200, backgroundColor: 'white' }}>
                        <Select
                            touchUi={true}
                            theme="ios"
                            themeVariant="light"
                            value={filterByChannel}
                            onChange={(val: any) => {
                                setFilterByChannel(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                            dropdown={false}
                            data={channelOptions}
                        />
                    </label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                    <Text
                        style={{
                            fontSize: 13,
                            fontFamily: 'Inter',
                            color: '#000000',
                            paddingLeft: 5,
                            paddingBottom: 10,
                        }}
                    >
                        Type
                    </Text>

                    <label style={{ width: 200, backgroundColor: 'white' }}>
                        <Select
                            touchUi={true}
                            theme="ios"
                            themeVariant="light"
                            value={filterEventsType}
                            onChange={(val: any) => {
                                setFilterEventsType(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                            dropdown={false}
                            data={typeOptions}
                        />
                    </label>
                </div>
            </div>
        );
    };

    const getAgendaNavbarIconName = (op: string) => {
        switch (op) {
            case 'Agenda':
                return op === tab ? 'list' : 'list-outline';
            case 'Schedule':
                return op === tab ? 'map' : 'map-outline';
            case 'Calendar':
                return op === tab ? 'calendar' : 'calendar-sharp';
            case 'Activity':
                return op === tab ? 'notifications' : 'notifications-outline';
            default:
                return '';
        }
    };

    const getAgendaIconColor = (op: string) => {
        if (op === tab) {
            return '#000';
        }
        return '#000';
    };

    const renderAgendaTabs = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    paddingVertical: 15,
                    backgroundColor: Dimensions.get('window').width < 768 ? '#fff' : '#f8f8f8',
                    height: 54,
                    paddingHorizontal: paddingResponsive(),
                }}
            >
                {/* Arrow back */}
                <View
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 1024,
                        alignSelf: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: Dimensions.get('window').width < 768 && tab !== 'Add' ? 'flex-start' : 'center',
                        backgroundColor: 'none',
                    }}
                >
                    {tab !== 'Add' ? null : (
                        <View
                            style={{
                                position: 'absolute',
                                left: 0,
                                backgroundColor: 'none',
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    setEditEvent(null);
                                    props.setTab(tabs[0]);
                                    setTab(tabs[0]);
                                }}
                                style={{
                                    width: 30,
                                    backgroundColor: 'none',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 15,
                                }}
                            >
                                <Ionicons size={32} name="arrow-back-outline" color="#1f1f1f" />
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* For mobile render the tabs as a Menu */}
                    {tab !== 'Add' && Dimensions.get('window').width < 768 ? (
                        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                            <ScrollView
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{
                                    flexDirection: 'row',
                                    // paddingHorizontal: 12,
                                }}
                            >
                                {tabs.map((option: string, ind: number) => {
                                    if (option === 'Add') return null;
                                    return (
                                        <View nativeID={option}>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: option === tab ? '#000' : '#f2f2f2',
                                                    borderRadius: 20,
                                                    paddingHorizontal: 14,
                                                    marginRight: 10,
                                                    paddingVertical: 7,
                                                }}
                                                onPress={() => {
                                                    setTab(option);
                                                }}
                                                key={ind.toString()}
                                            >
                                                {option === 'Activity' && unreadCount !== 0 ? (
                                                    <View
                                                        style={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: '100%',
                                                            backgroundColor: '#f94144',
                                                            position: 'absolute',
                                                            top: 4,
                                                            right: 7,
                                                        }}
                                                    />
                                                ) : null}
                                                <Text
                                                    style={{
                                                        color: option === tab ? '#fff' : '#000',
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {option === 'Agenda'
                                                        ? 'To-Do'
                                                        : option === 'Activity'
                                                        ? 'Alerts'
                                                        : option}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                            <View>
                                {tab === 'Add' ? null : tab === 'Activity' ? (
                                    <Menu
                                        onSelect={(val: any) => {
                                            if (val === 'filter') {
                                                setShowFilterPopup(true);
                                            } else {
                                                markAlertsRead();
                                            }
                                        }}
                                    >
                                        <MenuTrigger>
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    color: '#1f1f1f',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                <Ionicons name="ellipsis-vertical-outline" size={20} />
                                            </Text>
                                        </MenuTrigger>
                                        <MenuOptions
                                            optionsContainerStyle={{
                                                shadowOffset: {
                                                    width: 2,
                                                    height: 2,
                                                },
                                                shadowColor: '#000',
                                                // overflow: 'hidden',
                                                shadowOpacity: 0.07,
                                                shadowRadius: 7,
                                                padding: 7,
                                                borderWidth: 1,
                                                borderColor: '#CCC',
                                            }}
                                        >
                                            <MenuOption value={'filter'}>
                                                <View
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Ionicons name="filter-outline" size={16} />
                                                    <Text style={{ marginLeft: 7 }}>Filter</Text>
                                                </View>
                                            </MenuOption>
                                            <MenuOption value={'markAsRead'}>
                                                <View
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Ionicons name="checkmark-done-outline" size={16} />
                                                    <Text style={{ marginLeft: 7 }}>Mark as Read</Text>
                                                </View>
                                            </MenuOption>
                                        </MenuOptions>
                                    </Menu>
                                ) : (
                                    <TouchableOpacity
                                        style={{ backgroundColor: 'none', marginLeft: 15 }}
                                        onPress={() => {
                                            setShowFilterPopup(true);
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                color: '#1f1f1f',
                                                textAlign: 'right',
                                            }}
                                        >
                                            <Ionicons name="filter-outline" size={20} />
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ) : null}
                    {tab !== 'Add' && Dimensions.get('window').width >= 768 ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'none',
                            }}
                        >
                            {tabs.map((option: string, ind: number) => {
                                if (option === 'Add') return null;

                                return (
                                    <View
                                        nativeID={option}
                                        style={{
                                            marginRight: 38,
                                        }}
                                    >
                                        <TouchableOpacity
                                            key={ind.toString()}
                                            style={{
                                                paddingVertical: 3,
                                                backgroundColor: 'none',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                borderBottomColor: '#000',
                                                borderBottomWidth: option === tab ? 1 : 0,
                                            }}
                                            onPress={() => {
                                                setTab(option);
                                            }}
                                        >
                                            {option === 'Activity' && unreadCount !== 0 ? (
                                                <View
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '100%',
                                                        backgroundColor: '#f94144',
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: -8,
                                                    }}
                                                />
                                            ) : null}

                                            <Text
                                                style={{
                                                    color: getAgendaIconColor(option),
                                                    fontSize: 14,
                                                    fontFamily: option === tab ? 'inter' : 'overpass',
                                                    textTransform: 'uppercase',
                                                    // paddingLeft: 5,
                                                }}
                                            >
                                                {option === 'Agenda'
                                                    ? 'To-Do'
                                                    : option === 'Activity'
                                                    ? 'Alerts'
                                                    : option}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}
                    {tab === 'Add' ? (
                        <View
                            style={{
                                backgroundColor: 'none',
                            }}
                        >
                            {renderEditChannelName()}
                            {!editChannelName ? (
                                <View style={{ backgroundColor: '#none' }}>
                                    <Text
                                        style={{
                                            fontSize: 20,
                                            fontFamily: 'Inter',
                                            color: '#000000',
                                        }}
                                    >
                                        New event
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    ) : null}
                    {/* Mark as read button */}

                    {Dimensions.get('window').width < 768 ? null : (
                        <View
                            style={{
                                right: 0,
                                position: 'absolute',
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'none',
                            }}
                        >
                            {tab === 'Activity' && unreadCount !== 0 ? (
                                <TouchableOpacity
                                    onPress={async () => {
                                        markAlertsRead();
                                    }}
                                    style={{
                                        backgroundColor: '#f8f8f8',
                                        overflow: 'hidden',
                                        height: 35,
                                        alignSelf: 'center',
                                        paddingHorizontal: Dimensions.get('window').width < 1024 ? 10 : 20,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                    disabled={user.email === disableEmailId}
                                >
                                    <Ionicons name="checkmark-done-outline" size={18} color="#000" />
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
                                            color: '#000',
                                            fontSize: 15,
                                            // borderWidth: 1,
                                            // borderColor: '#007AFF',
                                            paddingLeft: 5,
                                            fontFamily: 'inter',
                                            // height: 35,
                                            // width: 150,
                                            // borderRadius: 15,
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        Mark as Read
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {tab !== 'Add' ? (
                                <TouchableOpacity
                                    style={{ backgroundColor: 'none', marginLeft: 15 }}
                                    onPress={() => {
                                        setShowFilterPopup(true);
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            color: '#1f1f1f',
                                            textAlign: 'right',
                                        }}
                                    >
                                        <Ionicons name="filter-outline" size={20} />
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderAnnouncementModal = () => {
        if (!viewAnnouncement) return null;

        const { title, subtitle, creatorAvatar, creatorProfile, createdAt } = viewAnnouncement;

        const splitProfile = creatorProfile.split(',');
        const email = splitProfile[splitProfile.length - 1];
        splitProfile.pop();
        const name = splitProfile.join(',');

        console.log('Subtitle', subtitle);

        return (
            <Popup
                isOpen={viewAnnouncement !== undefined}
                buttons={[
                    {
                        text: 'Close',
                        color: 'dark',
                        handler: function (event) {
                            setViewAnnouncement(undefined);
                        },
                    },
                ]}
                themeVariant="light"
                theme="ios"
                onClose={() => setShowFilterPopup(false)}
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
                    style={{ flexDirection: 'column', padding: 15, backgroundColor: 'none', minWidth: 500 }}
                    className="mbsc-align-center mbsc-padding"
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingBottom: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 18,
                            }}
                        >
                            Announcement - {title}
                        </Text>
                    </View>

                    {/* Share by */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 10,
                        }}
                    >
                        <img
                            style={{
                                display: 'block',
                                height: 45,
                                width: 45,
                                borderRadius: '100%',
                            }}
                            src={
                                creatorAvatar ? creatorAvatar : 'https://cues-files.s3.amazonaws.com/images/default.png'
                            }
                            alt="Profile Pic"
                        />

                        <View
                            style={{
                                marginLeft: 8,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                }}
                            >
                                {name}
                            </Text>
                            <a
                                target="_blank"
                                href={`mailto:${email}`}
                                style={{
                                    fontSize: 15,
                                    flex: 1,
                                    textDecoration: 'underline',
                                    textDecorationColor: 'black',
                                }}
                            >
                                <Text>{email}</Text>
                            </a>
                        </View>
                        <View
                            style={{
                                marginLeft: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {createdAt ? (
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 14,
                                        marginRight: 10,
                                    }}
                                >
                                    {moment(new Date(createdAt)).format('MMMM Do, h:mm a')}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <div className="mt-6">
                        <div
                            className="htmlParser fr-view"
                            style={{
                                width: '100%',
                                color: 'black',
                                marginTop: Dimensions.get('window').width < 768 ? 0 : 25,
                            }}
                        >
                            {parser(subtitle)}
                        </div>
                    </div>
                </View>
            </Popup>
        );
    };

    function extractContent(s: string) {
        var span = document.createElement('span');
        span.innerHTML = s;
        return span.textContent || span.innerText;
    }

    // MAIN RETURN
    return (
        <View
            style={{
                flexDirection: 'column',
                width: '100%',
                backgroundColor: '#fff',
            }}
        >
            {/* Render New Tabs */}
            {renderAgendaTabs()}
            <ScrollView
                contentContainerStyle={{
                    width: '100%',
                    height:
                        width < 768
                            ? Dimensions.get('window').height - 54 - 60
                            : Dimensions.get('window').height - 64 - 54,
                    backgroundColor: '#fff',
                }}
            >
                <View
                    style={{
                        width: '100%',
                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                        backgroundColor: '#fff',
                        maxWidth: 1024,
                        alignSelf: 'center',
                    }}
                >
                    {loading ? (
                        <View
                            style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                marginTop: 50,
                                marginBottom: 50,
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : (
                        <View
                            style={{
                                backgroundColor: '#fff',
                                width: '100%',
                            }}
                        >
                            {!showAddEvent ? (
                                <View
                                    style={{
                                        backgroundColor: 'none',
                                    }}
                                    nativeID={'planner-wrapper'}
                                >
                                    {tab === tabs[0] ? (
                                        <Eventcalendar
                                            view={viewAgenda}
                                            data={events}
                                            themeVariant="light"
                                            onEventClick={onSelectEvent}
                                            renderEventContent={renderEventContent}
                                            noEventsText="Click + to schedule a new event or meeting."
                                        />
                                    ) : tab === tabs[1] ? (
                                        <Eventcalendar
                                            view={viewSchedule}
                                            data={events}
                                            themeVariant="light"
                                            onEventClick={onSelectEvent}
                                            renderEventContent={renderEventContent}
                                            star
                                            noEventsText="Click + to schedule a new event or meeting."
                                        />
                                    ) : tab === tabs[2] ? (
                                        <Eventcalendar
                                            view={viewCalendar}
                                            data={events}
                                            themeVariant="light"
                                            onEventClick={onSelectEvent}
                                            renderEventContent={renderEventContent}
                                        />
                                    ) : tab === tabs[3] ? (
                                        <View
                                            style={{
                                                width: Dimensions.get('window').width < 768 ? '100%' : '100%',
                                                backgroundColor: 'white',
                                            }}
                                        >
                                            {activity.length === 0 ? (
                                                <View
                                                    style={{
                                                        paddingVertical: 100,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 20,
                                                            fontFamily: 'Inter',
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        No Alerts
                                                    </Text>
                                                </View>
                                            ) : null}
                                            <View>
                                                {activity.map((act: any, index: number) => {
                                                    const { cueId, channelId, createdBy, target, threadId } = act;

                                                    console.log('Activity', act);

                                                    const date = new Date(act.date);

                                                    if (props.filterStart && props.filterEnd) {
                                                        const start = new Date(props.filterStart);
                                                        if (date < start) {
                                                            return;
                                                        }
                                                        const end = new Date(props.filterEnd);
                                                        if (date > end) {
                                                            return;
                                                        }
                                                    }

                                                    let announcementDescription = '';

                                                    if (target === 'ANNOUNCEMENT') {
                                                        announcementDescription = extractContent(act.subtitle);
                                                    }

                                                    return (
                                                        <TouchableOpacity
                                                            key={index.toString()}
                                                            onPress={async () => {
                                                                server.mutate({
                                                                    mutation: markActivityAsRead,
                                                                    variables: {
                                                                        activityId: act._id,
                                                                        userId,
                                                                        markAllRead: false,
                                                                    },
                                                                });

                                                                // Opens the cue from the activity
                                                                if (
                                                                    cueId !== null &&
                                                                    cueId !== '' &&
                                                                    channelId !== '' &&
                                                                    createdBy !== '' &&
                                                                    target === 'CUE'
                                                                ) {
                                                                    props.openCue(channelId, cueId, createdBy);
                                                                }

                                                                if (target === 'DISCUSSION') {
                                                                    if (threadId && threadId !== '') {
                                                                        await AsyncStorage.setItem(
                                                                            'openThread',
                                                                            threadId
                                                                        );
                                                                    }

                                                                    props.openDiscussion(channelId);
                                                                }

                                                                if (
                                                                    target === 'CHANNEL_SUBSCRIBED' ||
                                                                    target === 'CHANNEL_MODERATOR_ADDED' ||
                                                                    target === 'CHANNEL_MODERATOR_REMOVED' ||
                                                                    target === 'CHANNEL_OWNER_ADDED'
                                                                ) {
                                                                    props.openChannel(channelId);
                                                                }

                                                                if (target === 'ANNOUNCEMENT') {
                                                                    setViewAnnouncement(act);
                                                                }
                                                            }}
                                                            style={{
                                                                flexDirection: 'row',
                                                                borderColor: '#f2f2f2',
                                                                borderBottomWidth:
                                                                    index === activity.length - 1 ? 0 : 1,
                                                                width: '100%',
                                                                paddingVertical: 5,
                                                                backgroundColor: 'white',
                                                                paddingHorizontal: paddingResponsive(),
                                                            }}
                                                            disabled={
                                                                target === 'CHANNEL_UNSUBSCRIBED' ||
                                                                target === 'CHANNEL_OWNER_REMOVED'
                                                            }
                                                        >
                                                            <View
                                                                style={{
                                                                    flex: 1,
                                                                    backgroundColor: 'white',
                                                                }}
                                                            >
                                                                <View
                                                                    style={{
                                                                        flexDirection: 'row',
                                                                        alignItems: 'center',
                                                                        marginTop:
                                                                            Dimensions.get('window').width < 768
                                                                                ? 0
                                                                                : 5,
                                                                    }}
                                                                >
                                                                    <View
                                                                        style={{
                                                                            width: 8,
                                                                            height: 8,
                                                                            borderRadius: 8,
                                                                            backgroundColor:
                                                                                target === 'ANNOUNCEMENT'
                                                                                    ? '#000'
                                                                                    : act.colorCode,
                                                                            marginRight: 2,
                                                                        }}
                                                                    />
                                                                    <Text
                                                                        style={{
                                                                            fontSize:
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 15
                                                                                    : 16,
                                                                            padding: 5,
                                                                            fontFamily: 'inter',
                                                                        }}
                                                                        ellipsizeMode="tail"
                                                                    >
                                                                        {target === 'ANNOUNCEMENT'
                                                                            ? 'Announcement - ' + act.title
                                                                            : act.channelName}
                                                                    </Text>
                                                                </View>
                                                                <Text
                                                                    style={{
                                                                        fontSize:
                                                                            Dimensions.get('window').width < 768
                                                                                ? 13
                                                                                : 14,
                                                                        lineHeight: 16,
                                                                        paddingHorizontal: 5,
                                                                        marginVertical: 5,
                                                                        paddingLeft: 0,
                                                                    }}
                                                                    ellipsizeMode="tail"
                                                                    numberOfLines={2}
                                                                >
                                                                    {target === 'ANNOUNCEMENT'
                                                                        ? announcementDescription
                                                                        : `${act.title} - ${act.subtitle}`}
                                                                </Text>
                                                            </View>
                                                            <View
                                                                style={{
                                                                    backgroundColor: 'white',
                                                                    padding: 0,
                                                                    flexDirection: 'row',
                                                                    alignSelf: 'center',
                                                                    // paddingRight: 10,
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontSize: 13,
                                                                        padding: 5,
                                                                    }}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {act.status === 'unread' ? (
                                                                        <Ionicons
                                                                            name="alert-circle-outline"
                                                                            color="#f94144"
                                                                            size={
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 18
                                                                                    : 20
                                                                            }
                                                                        />
                                                                    ) : null}
                                                                </Text>
                                                                <Text
                                                                    style={{
                                                                        fontSize:
                                                                            Dimensions.get('window').width < 768
                                                                                ? 13
                                                                                : 14,
                                                                        padding: 5,
                                                                        lineHeight: 13,
                                                                        // fontWeight: 'bold',
                                                                    }}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {emailTimeDisplay(act.date)}
                                                                </Text>

                                                                <Text
                                                                    style={{
                                                                        fontSize: 14,
                                                                        padding: 5,
                                                                        paddingRight: 0,
                                                                        lineHeight: 13,
                                                                        width:
                                                                            Dimensions.get('window').width < 768
                                                                                ? 20
                                                                                : 30,
                                                                    }}
                                                                    ellipsizeMode="tail"
                                                                >
                                                                    {target !== 'CHANNEL_UNSUBSCRIBED' ? (
                                                                        <Ionicons
                                                                            name="chevron-forward-outline"
                                                                            size={
                                                                                Dimensions.get('window').width < 768
                                                                                    ? 18
                                                                                    : 20
                                                                            }
                                                                            color="#007AFF"
                                                                        />
                                                                    ) : null}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ) : (
                                        <View
                                            style={{
                                                alignItems: 'center',
                                                backgroundColor: 'white',
                                                paddingHorizontal: width < 768 ? 20 : 0,
                                                paddingTop: 20,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '100%',
                                                    maxWidth: 400,
                                                    alignSelf: 'center',
                                                }}
                                            >
                                                <View style={{ width: '100%', maxWidth: 400 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 15,
                                                            fontFamily: 'inter',
                                                            color: '#000000',
                                                        }}
                                                    >
                                                        Topic
                                                    </Text>
                                                    <TextInput
                                                        value={title}
                                                        placeholder={''}
                                                        onChangeText={(val) => setTitle(val)}
                                                        placeholderTextColor={'#1F1F1F'}
                                                        required={true}
                                                    />
                                                </View>
                                                <View style={{ width: '100%', maxWidth: 400 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 15,
                                                            fontFamily: 'inter',
                                                            color: '#000000',
                                                        }}
                                                    >
                                                        Description
                                                    </Text>
                                                    <TextInput
                                                        value={description}
                                                        placeholder=""
                                                        onChangeText={(val) => setDescription(val)}
                                                        placeholderTextColor={'#1F1F1F'}
                                                    />
                                                </View>
                                            </View>
                                            {/* Put time here */}
                                            <View style={{ display: 'flex', width: '100%', maxWidth: 400 }}>
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: 400,
                                                        paddingVertical: 15,
                                                    }}
                                                >
                                                    <Text style={styles.text}>{PreferredLanguageText('start')}</Text>
                                                    <Datepicker
                                                        controls={['date', 'time']}
                                                        touchUi={true}
                                                        theme="ios"
                                                        value={start}
                                                        themeVariant="light"
                                                        // inputComponent="input"
                                                        inputProps={{
                                                            placeholder: 'Select start...',
                                                        }}
                                                        onChange={(event: any) => {
                                                            const date = new Date(event.value);
                                                            const roundOffDate = roundSeconds(date);
                                                            setStart(roundOffDate);
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
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: 400,
                                                        paddingVertical: 15,
                                                    }}
                                                >
                                                    <Text style={styles.text}>{PreferredLanguageText('end')}</Text>
                                                    <Datepicker
                                                        controls={['date', 'time']}
                                                        touchUi={true}
                                                        theme="ios"
                                                        value={end}
                                                        themeVariant="light"
                                                        // inputComponent="input"
                                                        inputProps={{
                                                            placeholder: 'Select end...',
                                                        }}
                                                        onChange={(event: any) => {
                                                            const date = new Date(event.value);
                                                            const roundOffDate = roundSeconds(date);
                                                            setEnd(roundOffDate);
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
                                            <View
                                                style={{
                                                    paddingTop: 20,
                                                    width: '100%',
                                                    maxWidth: 400,
                                                }}
                                            >
                                                {channels.length > 0 && !editEvent ? (
                                                    <View>
                                                        <View style={{ width: '100%', paddingBottom: 10 }}>
                                                            <Text
                                                                style={{
                                                                    fontSize: 15,
                                                                    fontFamily: 'inter',
                                                                    color: '#000000',
                                                                }}
                                                            >
                                                                For
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                display: 'flex',
                                                                backgroundColor: '#f8f8f8',
                                                            }}
                                                        >
                                                            <label
                                                                style={{
                                                                    width: '100%',
                                                                    maxWidth: 400,
                                                                    backgroundColor: 'white',
                                                                }}
                                                            >
                                                                <Select
                                                                    touchUi={true}
                                                                    themeVariant="light"
                                                                    value={selectedChannel}
                                                                    onChange={(val: any) => {
                                                                        setSelectedChannel(val.value);

                                                                        if (val.value === 'My Events') {
                                                                            setChannelId('');
                                                                        } else {
                                                                            setChannelId(val.value);
                                                                        }
                                                                    }}
                                                                    responsive={{
                                                                        small: {
                                                                            display: 'bubble',
                                                                        },
                                                                        medium: {
                                                                            touchUi: false,
                                                                        },
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: '#f8f8f8',
                                                                    }}
                                                                    data={channelOptions}
                                                                />
                                                            </label>
                                                        </View>
                                                    </View>
                                                ) : null}

                                                {renderEditMeetingInfo()}
                                                {!editEvent && renderRecurringOptions()}
                                                {renderMeetingOptions()}
                                                {channelId !== '' && meetingProvider !== '' && isMeeting ? (
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#000000',
                                                            // textTransform: 'uppercase',
                                                            lineHeight: 20,
                                                            fontFamily: 'Inter',
                                                            paddingBottom: 15,
                                                        }}
                                                    >
                                                        The meeting link will be same as the one in the Course Settings.
                                                        Ensure you have a working link set at all times.
                                                    </Text>
                                                ) : null}
                                                {channelId !== '' &&
                                                userZoomInfo &&
                                                userZoomInfo.accountId &&
                                                !meetingProvider &&
                                                isMeeting ? (
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            color: '#000000',
                                                            // textTransform: 'uppercase',
                                                            lineHeight: 20,
                                                            fontFamily: 'Inter',
                                                            paddingBottom: 15,
                                                        }}
                                                    >
                                                        Note: You need to be a licensed Zoom user for student
                                                        attendances to be automatically captured and visible under your
                                                        Course past meetings.
                                                    </Text>
                                                ) : null}

                                                {channelId !== '' &&
                                                (!userZoomInfo || !userZoomInfo.accountId) &&
                                                !meetingProvider ? (
                                                    <View
                                                        style={{
                                                            marginVertical: 10,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            padding: 10,
                                                            backgroundColor: '#f2f2f2',
                                                            borderRadius: 1,
                                                        }}
                                                    >
                                                        <Ionicons name="warning-outline" size={22} color={'#f3722c'} />
                                                        <Text style={{ paddingLeft: 20 }}>
                                                            To schedule online meetings connect your account to Zoom
                                                        </Text>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                // ZOOM OAUTH

                                                                const url = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoomClientId}&redirect_uri=${encodeURIComponent(
                                                                    zoomRedirectUri
                                                                )}&state=${userId}`;

                                                                if (
                                                                    Platform.OS === 'ios' ||
                                                                    Platform.OS === 'android'
                                                                ) {
                                                                    Linking.openURL(url);
                                                                } else {
                                                                    window.open(url, '_blank');
                                                                }
                                                            }}
                                                            style={{
                                                                backgroundColor: '#f2f2f2',
                                                                paddingHorizontal: 10,
                                                            }}
                                                            disabled={user.email === disableEmailId}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 15,
                                                                    fontFamily: 'inter',
                                                                    color: '#000',
                                                                    backgroundColor: '#f2f2f2',
                                                                }}
                                                            >
                                                                Connect
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : null}

                                                {tab === 'Add' && !editEvent ? (
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            flexDirection: 'row',
                                                            display: 'flex',
                                                            marginBottom: 10,
                                                            paddingVertical: 25,
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <TouchableOpacity
                                                            style={{
                                                                marginBottom: 20,
                                                            }}
                                                            onPress={() => handleCreate()}
                                                            disabled={isCreatingEvents || user.email === disableEmailId}
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
                                                                {isCreatingEvents ? '...' : 'CREATE'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : null}
                                                {editEvent ? renderEditEventOptions() : null}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ) : null}
                        </View>
                    )}
                </View>
            </ScrollView>
            <Popup
                isOpen={showFilterPopup}
                buttons={[
                    {
                        text: 'Ok',
                        color: 'dark',
                        handler: function (event) {
                            setShowFilterPopup(false);
                        },
                    },
                    {
                        text: 'Reset',
                        color: 'dark',
                        handler: function (event) {
                            setFilterStart(null);
                            setFilterEnd(null);
                            setFilterByChannel('All');
                            setFilterEventsType('All');
                            setShowFilterPopup(false);
                        },
                    },
                ]}
                themeVariant="light"
                theme="ios"
                onClose={() => setShowFilterPopup(false)}
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
                    style={{ flexDirection: 'column', padding: 25, backgroundColor: 'none' }}
                    className="mbsc-align-center mbsc-padding"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 30 }}>
                        <Text
                            style={{
                                fontSize: 13,
                                fontFamily: 'Inter',
                                color: '#000000',
                                paddingLeft: 5,
                                paddingBottom: 10,
                            }}
                        >
                            Filter
                        </Text>

                        <label style={{ width: 200, backgroundColor: 'white' }}>
                            <Datepicker
                                theme="ios"
                                themeVariant="light"
                                controls={['calendar']}
                                select="range"
                                touchUi={true}
                                inputProps={{
                                    placeholder: 'Select',
                                }}
                                responsive={{
                                    small: {
                                        display: 'bubble',
                                    },
                                    medium: {
                                        touchUi: false,
                                    },
                                }}
                                value={[filterStart, filterEnd]}
                                onChange={(val: any) => {
                                    setFilterStart(val.value[0]);
                                    setFilterEnd(val.value[1]);
                                }}
                            />
                        </label>
                    </div>

                    {renderEventFilters()}
                </View>
            </Popup>
            {renderAnnouncementModal()}
        </View>
    );
};

export default CalendarX;

const styles: any = StyleSheet.create({
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20,
    },
    text: {
        fontSize: 15,
        color: '#000000',
        marginBottom: 10,
        fontFamily: 'Inter',
    },
    allBlack: {
        fontSize: 13,
        color: '#000000',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#f8f8f8',
    },
    all1: {
        fontSize: 11,
        height: 20,
        lineHeight: 20,
        color: '#1F1F1F',
        // height: 20,
        paddingHorizontal: 8,
        backgroundColor: '#f8f8f8',
        // lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center',
        marginBottom: 1,
    },
    allGrayFill1: {
        color: '#007AFF',
        fontSize: 11,
        height: 20,
        lineHeight: 20,
        // height: 20,
        paddingHorizontal: 8,
        // lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center',
        marginBottom: 1,
    },
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: '#f8f8f8',
    },
    allOutline: {
        fontSize: 13,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 1,
        backgroundColor: '#000000',
    },
    picker: {
        display: 'flex',
        justifyContent: 'flex-start',
        backgroundColor: '#f8f8f8',
        overflow: 'hidden',
        fontSize: 13,
        textAlign: 'center',
        borderWidth: 1,
        width: 150,
        height: 20,
        alignSelf: 'center',
        marginTop: 0,
        borderRadius: 3,
    },
});
