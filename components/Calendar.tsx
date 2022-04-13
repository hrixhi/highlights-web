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
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    getChannels,
    getEvents,
    createDateV1,
    editDateV1,
    deleteDateV1,
    getActivity,
    markActivityAsRead,
    regenZoomMeeting
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
import { Eventcalendar, Datepicker } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import _ from 'lodash';
import { Select } from '@mobiscroll/react';
import { zoomClientId, zoomRedirectUri } from '../constants/zoomCredentials';

const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
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
    const [copiedMeetingLink, setCopiedMeetingLink] = useState(false);
    const [userId, setUserId] = useState('');
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
        '7': 'Sat'
    };
    const [selectedStartDay, setSelectedStartDay] = useState<any>(`${start.getDay() + 1}`);
    const [selectedDays, setSelectedDays] = useState<any[]>([selectedStartDay]);
    const channelOptions = [
        {
            value: 'My Events',
            text: 'My Events'
        }
    ];

    channels.map((channel: any) => {
        channelOptions.push({
            value: channel._id,
            text: channel.name
        });
    });
    const [userZoomInfo, setUserZoomInfo] = useState<any>('');
    const [meetingProvider, setMeetingProvider] = useState('');

    // HOOKS

    /**
     * @description Configure Mobiscroll calendar
     */
    const viewAgenda: any = React.useMemo(() => {
        return {
            agenda: { type: 'week' }
        };
    }, []);
    const viewSchedule: any = React.useMemo(() => {
        return {
            schedule: { type: 'week', startDay: 1, endDay: 0 }
        };
    }, []);
    const viewCalendar: any = React.useMemo(() => {
        return {
            calendar: { type: 'month' }
        };
    }, []);

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
     * @description Fetch data on Init
     */
    useEffect(() => {
        loadEvents();
        loadChannels();
    }, [props.subscriptions]);

    /**
     * @description Fetch user activity
     */
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);

                setUserId(user._id);
                if (user.zoomInfo) {
                    setUserZoomInfo(user.zoomInfo);
                }
                const server = fetchAPI(user._id);
                server
                    .query({
                        query: getActivity,
                        variables: {
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.activity.getActivity) {
                            const tempActivity = res.data.activity.getActivity;
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
            }
        })();
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
        const all = [...allActivity];
        if (props.filterByChannel === 'All') {
            setActivity(all);
        } else {
            const filter = all.filter((e: any) => props.filterByChannel === e.channelId);
            setActivity(filter);
        }

        let total = [...allEvents];

        if (props.filterEventsType !== 'All') {
            if (props.filterEventsType === 'Meetings') {
                total = total.filter((e: any) => e.meeting);
            } else if (props.filterEventsType === 'Submissions') {
                total = total.filter((e: any) => e.cueId !== '');
            } else if (props.filterEventsType === 'Events') {
                total = total.filter((e: any) => e.cueId === '' && !e.meeting);
            }
        }

        if (props.filterByChannel !== 'All') {
            total = total.filter((e: any) => {
                if (props.filterByChannel === 'My Events') {
                    return e.channelId === '';
                } else {
                    return props.filterByChannel === e.channelId;
                }
            });
        }

        if (props.filterStart && props.filterEnd) {
            total = total.filter(
                (e: any) =>
                    new Date(e.start) > new Date(props.filterStart) && new Date(e.end) < new Date(props.filterEnd)
            );
        }

        setEvents(total);
    }, [props.filterByChannel, props.filterEventsType, props.filterStart, props.filterEnd]);

    /**
     * @description When an event is selected to edit, update state variables
     */
    useEffect(() => {
        if (editEvent) {
            setTitle(editEvent.originalTitle);
            setDescription(editEvent.description);
            setStart(new Date(editEvent.start));
            setEnd(new Date(editEvent.end));
            setEditChannelName(editEvent.channelName);

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
            setCopiedMeetingLink(false);
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
        const uString: any = await AsyncStorage.getItem('user');
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI('');
            server
                .query({
                    query: getChannels,
                    variables: {
                        userId: user._id
                    }
                })
                .then(res => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId);
                    }
                })
                .catch(err => {});
        }
    }, []);

    /**
     * @description Handle Create event
     */
    const handleCreate = useCallback(async () => {
        if (title === '') {
            Alert('A title must be set for the event. ');
            return;
        } else if (start < new Date()) {
            Alert('Event must be set in the future.');
            return;
        } else if (start > end) {
            Alert('End time must be after than start time.');
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

        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);
            const server = fetchAPI('');
            server
                .mutate({
                    mutation: createDateV1,
                    variables: {
                        title,
                        userId: user._id,
                        start: start.toUTCString(),
                        end: end.toUTCString(),
                        channelId,
                        meeting,
                        description,
                        recordMeeting,
                        frequency: freq,
                        repeatTill: repeat,
                        repeatDays
                    }
                })
                .then(res => {
                    if (res.data && res.data.date.createV1 === 'SUCCESS') {
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
                .catch(err => {
                    setIsCreatingEvents(false);
                    console.log(err);
                });
        }
    }, [
        title,
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
        selectedDays
    ]);

    /**
     * @description Handle Edit event
     */
    const handleEdit = useCallback(async () => {
        setIsEditingEvents(true);

        const server = fetchAPI('');
        server
            .mutate({
                mutation: editDateV1,
                variables: {
                    id: editEvent.eventId,
                    title,
                    start: start.toUTCString(),
                    end: end.toUTCString(),
                    description,
                    recordMeeting
                }
            })
            .then(res => {
                if (res.data.date.editV1) {
                    loadEvents();
                    props.setTab('Agenda');
                    Alert('Updated event successully.');
                } else {
                    Alert('Failed to edit event. Try again.');
                }

                setIsEditingEvents(false);
            })
            .catch(err => {
                Alert('Failed to edit event. Try again.');
                setIsEditingEvents(false);
                console.log(err);
            });
    }, [editEvent, title, start, end, description, isMeeting, recordMeeting]);

    /**
     * @description Handle Delete event
     */
    const handleDelete = useCallback(
        async (deleteAll: boolean) => {
            const { eventId, recurringId } = editEvent;

            setIsDeletingEvents(true);

            const server = fetchAPI('');
            server
                .mutate({
                    mutation: deleteDateV1,
                    variables: {
                        id: !deleteAll ? eventId : recurringId,
                        deleteAll
                    }
                })
                .then(res => {
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
                        Alert(!deleteAll ? 'Deleted event successfully.' : 'Deleted events successfully.');
                    } else if (res.data && res.data.date.deleteV1 === 'ZOOM_MEETING_DELETE_FAILED') {
                        Alert('Event deleted successfully. Failed to delete Zoom meeting.');
                    } else {
                        Alert(
                            !deleteAll ? 'Failed to delete event. Try again.' : 'Failed to delete events. Try again.'
                        );
                    }
                    setIsDeletingEvents(false);
                })
                .catch(err => {
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
        const u = await AsyncStorage.getItem('user');
        let parsedUser: any = {};
        if (u) {
            parsedUser = JSON.parse(u);
        } else {
            setLoading(false);
            return;
        }

        setLoading(true);
        const server = fetchAPI(parsedUser._id);
        server
            .query({
                query: getEvents,
                variables: {
                    userId: parsedUser._id
                }
            })
            .then(res => {
                if (res.data.date && res.data.date.getCalendar) {
                    const parsedEvents: any[] = [];

                    const channelsSet = new Set();

                    res.data.date.getCalendar.map((e: any) => {
                        const { title } = htmlStringParser(e.title);

                        channelsSet.add(e.channelName);

                        let colorCode = '#202025';

                        const matchSubscription = props.subscriptions.find((sub: any) => {
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
                            groupUsername: e.groupUsername
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
                    useNativeDriver: true
                }).start();
            })
            .catch(err => {
                console.log(err);
                Alert('Unable to load calendar.', 'Check connection.');
                setLoading(false);
                modalAnimation.setValue(0);
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            });
    }, [props.subscriptions, modalAnimation]);

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
    const onSelectEvent = async (data: any) => {
        const { event } = data;

        const uString: any = await AsyncStorage.getItem('user');
        // Only allow edit if event is not past
        if (uString) {
            const user = JSON.parse(uString);

            const timeString = datesEqual(event.start, event.end)
                ? moment(new Date(event.start)).format('MMMM Do YYYY, h:mm a')
                : moment(new Date(event.start)).format('MMMM Do YYYY, h:mm a') +
                  ' to ' +
                  moment(new Date(event.end)).format('MMMM Do YYYY, h:mm a');

            const descriptionString = event.description ? event.description + '- ' + timeString : '' + timeString;

            if (user._id === event.createdBy && new Date(event.end) > new Date() && event.eventId) {
                setEditEvent(event);
                setTab('Add');
            } else if (
                user._id === event.createdBy &&
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
                        }
                    },
                    {
                        text: 'Delete',
                        onPress: async () => {
                            const server = fetchAPI('');
                            server
                                .mutate({
                                    mutation: deleteDateV1,
                                    variables: {
                                        id: event.eventId,
                                        deleteAll: false
                                    }
                                })
                                .then(res => {
                                    if (res.data && res.data.date.deleteV1) {
                                        Alert('Event Deleted!');
                                        loadEvents();
                                    }
                                });
                        }
                    }
                ]);
            } else {
                const date = new Date();

                if (date > new Date(event.start) && date < new Date(event.end) && event.meeting) {
                    const meetingLink = !meetingProvider ? (event.zoomRegistrationJoinUrl ? event.zoomRegistrationJoinUrl : event.zoomJoinUrl) : event.meetingLink;

                    if (!meetingLink) {
                        Alert('No meeting link set. Contact your instructor.');
                        return;
                    }

                    Alert(
                        'Join meeting?',
                        '',
                        [
                            {
                                text: 'No',
                                style: 'cancel',
                                onPress: () => {
                                    return;
                                }
                            },
                            {
                                text: 'Yes',
                                onPress: async () => {
                                    if (Platform.OS === 'web' || Platform.OS === 'macos' || Platform.OS === 'windows') {
                                        window.open(meetingLink, '_blank');
                                    } else {
                                        Linking.openURL(meetingLink);
                                    }
                                }
                            }
                        ]
                    );
                } else if (event.cueId !== '') {
                    props.openCueFromCalendar(event.channelId, event.cueId, event.createdBy);
                } else {
                    Alert(event.title, descriptionString);
                }
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
                    paddingBottom: 5
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
                        marginTop: 10
                    }}
                >
                    <Switch
                        value={recurring}
                        onValueChange={() => setRecurring(!recurring)}
                        style={{ height: 20 }}
                        trackColor={{
                            false: '#f2f2f2',
                            true: '#006AFF'
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
                            marginLeft: 0
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
                                        display: 'bubble'
                                    },
                                    medium: {
                                        touchUi: false
                                    }
                                }}
                                data={eventFrequencyOptions.map((item: any, index: number) => {
                                    return {
                                        value: item.value,
                                        text: item.label
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
                                                padding: 5
                                            }}
                                            key={ind.toString()}
                                        >
                                            <input
                                                disabled={day === selectedStartDay}
                                                style={{ marginRight: 5 }}
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
                                            <Text>{label}</Text>
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
                                placeholder: 'Repeat till...'
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
                                    touchUi: true
                                },
                                medium: {
                                    controls: ['date', 'time'],
                                    display: 'anchored',
                                    touchUi: false
                                }
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

        let meetingSwitchMessage = 'Students will be able to join the meeting directly from the Agenda or Meetings tab in your Course.';

        let meetingSwitchSubtitle = 'The meeting link will be same as the one in the Course Settings. Ensure you have a working link set at all times.'

        if ((!userZoomInfo || !userZoomInfo.accountId || userZoomInfo.accountId === '') && !meetingProvider) {
            meetingSwitchMessage = 'To generate Zoom meetings directly from Cues, connect to Zoom under Account > Profile.'
            meetingSwitchSubtitle = ''
        } else if (userZoomInfo && userZoomInfo.accountId && userZoomInfo.accountId !== '' && !meetingProvider) {
            meetingSwitchMessage = 'Cues will automatically generate a Zoom meeting.'
            meetingSwitchSubtitle = 'Students will be able to join the meeting directly from the Agenda or Meetings tab in your Course.'
        }

        return channelId !== '' || editChannelName !== '' ? (
            <DefaultView style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingBottom: 5 }}>
                {!editEvent ? (
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: width < 768 ? '100%' : '33.33%'
                        }}
                    >
                        <View style={{ width: '100%', paddingTop: width < 768 ? 40 : 25, paddingBottom: 15 }}>
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                            }}>
                                <Text style={{
                                    fontSize: 14,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                    marginRight: 8,
                                }}>
                                    Meeting
                                </Text>
                                {editEvent ? null : <TouchableOpacity
                                    onPress={() => {
                                        Alert(meetingSwitchMessage, meetingSwitchSubtitle)
                                    }}
                                >
                                    <Ionicons name='help-circle-outline' size={18} color="#939699" />
                                </TouchableOpacity>}
                            </View>
                        </View>
                        <View
                            style={{
                                height: 40,
                                marginRight: 10
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
                                    true: '#006AFF'
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
                <View style={{ marginBottom: 15 }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontFamily: 'Inter',
                            color: '#000000'
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
                        marginBottom: 20
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            marginRight: 5,
                            color: '#000000'
                        }}
                    >
                        Zoom Meeting ID
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            color: '#000000'
                        }}
                    >
                        {editEvent.zoomMeetingId}
                    </Text>
                </View>

                <View style={{ width: '100%', maxWidth: 400, marginBottom: 10 }}>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            marginRight: 10,
                            color: '#000000',
                            marginBottom: 5
                        }}
                    >
                        Invite Link
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            color: '#000000'
                        }}
                    >
                        {editEvent.zoomJoinUrl}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
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
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#006AFF'
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
                            // setCopiedMeetingLink(true);
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#006AFF'
                            }}
                        >
                            Copy Invite
                        </Text>
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={{}}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    fontFamily: 'inter',
                                    color: '#F94144'
                                }}>
                                Delete Meeting
                            </Text>
                        </TouchableOpacity> */}
                </View>
            </View>
        ) : editEvent && userZoomInfo && userZoomInfo.accountId ? (
            <View
                style={{
                    marginVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 10,
                    backgroundColor: '#f3f3f3',
                    borderRadius: 1
                }}
            >
                <Ionicons name="warning-outline" size={22} color={'#f3722c'} />
                <Text style={{ paddingLeft: 20 }}>Zoom meeting has been deleted or has expired</Text>
                <TouchableOpacity
                    onPress={() => {
                        const server = fetchAPI('');
                        server
                            .mutate({
                                mutation: regenZoomMeeting,
                                variables: {
                                    userId,
                                    dateId: editEvent.eventId
                                }
                            })
                            .then(res => {
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
                                        meetingLink: e.meetingLink ? e.meetingLink : null
                                    });
                                } else {
                                    Alert('Failed to create zoom meeting.');
                                }
                            })
                            .catch(err => {
                                Alert('Something went wrong.');
                            });
                    }}
                    style={{
                        backgroundColor: '#f3f3f3',
                        paddingHorizontal: 10
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            fontFamily: 'inter',
                            color: '#006AFF',
                            backgroundColor: '#f3f3f3'
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
                    paddingBottom: 30
                }}
            >
                {/* {date > new Date(start) && date < new Date(end) ? (
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 15,
                            width: '100%',
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}
                        onPress={async () => {
                            const uString: any = await AsyncStorage.getItem('user');

                            const user = JSON.parse(uString);

                            const server = fetchAPI('');
                            server
                                .mutate({
                                    mutation: meetingRequest,
                                    variables: {
                                        userId: user._id,
                                        channelId,
                                        isOwner: true
                                    }
                                })
                                .then(res => {
                                    if (res.data && res.data.channel.meetingRequest !== 'error') {
                                        window.open(res.data.channel.meetingRequest, '_blank');
                                    } else {
                                        Alert('Classroom not in session. Waiting for instructor.');
                                    }
                                })
                                .catch(err => {
                                    Alert('Something went wrong.');
                                });
                        }}>
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
                                width: 200,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                            Enter Classroom
                        </Text>
                    </TouchableOpacity>
                ) : null} */}
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginTop: 15,
                        width: '100%',
                        justifyContent: 'center',
                        flexDirection: 'row'
                    }}
                    onPress={() => {
                        Alert('Update event?', '', [
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => {
                                    return;
                                }
                            },
                            {
                                text: 'Yes',
                                onPress: () => {
                                    handleEdit();
                                }
                            }
                        ]);
                    }}
                    disabled={isSubmitDisabled || isEditingEvents || isDeletingEvents}
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
                            borderRadius: 15,
                            width: 120,
                            textTransform: 'uppercase'
                        }}
                    >
                        {isEditingEvents ? 'EDITING...' : 'EDIT'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        height: 35,
                        marginTop: 15,
                        width: '100%',
                        justifyContent: 'center',
                        flexDirection: 'row'
                    }}
                    onPress={() => {
                        Alert('Delete event?', '', [
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => {
                                    return;
                                }
                            },
                            {
                                text: 'Yes',
                                onPress: () => {
                                    handleDelete(false);
                                }
                            }
                        ]);
                    }}
                    disabled={isEditingEvents || isDeletingEvents}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            lineHeight: 34,
                            color: '#006AFF',
                            borderWidth: 1,
                            borderColor: '#006AFF',
                            borderRadius: 15,
                            fontSize: 12,
                            width: 120,
                            backgroundColor: 'white',
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            height: 35,
                            textTransform: 'uppercase'
                        }}
                    >
                        {isDeletingEvents ? 'DELETING...' : 'DELETE'}
                    </Text>
                </TouchableOpacity>

                {recurringId && recurringId !== '' ? (
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 15,
                            width: '100%',
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}
                        onPress={() => {
                            Alert('Delete events?', '', [
                                {
                                    text: 'Cancel',
                                    style: 'cancel',
                                    onPress: () => {
                                        return;
                                    }
                                },
                                {
                                    text: 'Yes',
                                    onPress: () => {
                                        handleDelete(true);
                                    }
                                }
                            ]);
                        }}
                        disabled={isEditingEvents || isDeletingEvents}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: '#006AFF',
                                borderWidth: 1,
                                borderColor: '#006AFF',
                                borderRadius: 15,
                                fontSize: 12,
                                backgroundColor: 'white',
                                paddingHorizontal: 20,
                                width: 120,
                                fontFamily: 'inter',
                                height: 35,
                                textTransform: 'uppercase'
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

        const isNonChannelMeeting = data.original.isNonChannelMeeting

        const groupUsername = data.original.groupUsername

        const startTime = new Date(data.original.start);
        const endTime = new Date(data.original.end);

        return (
            <React.Fragment>
                <div>{data.title} {isNonChannelMeeting ? ' · ' + groupUsername : ''} </div>
                <div className="md-custom-event-cont">
                    <div
                        style={{
                            color: '#1F1F1F',
                            fontSize: 14,
                            paddingTop: isMeeting && new Date() > startTime && new Date() < endTime ? 5 : 0
                        }}
                    >
                        {data.original.description}
                    </div>
                    {data.original.submitted !== null && userId !== '' && userId !== data.original.createdBy ? (
                        <div>
                            <div
                                style={{
                                    color: data.original.submitted ? '#35AC78' : !assingmentDue ? '#006AFF' : '#F94144',
                                    borderRadius: 12,
                                    padding: 4,
                                    fontSize: 12,
                                    borderWidth: 1
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
                                    color: '#006AFF',
                                    borderRadius: 12,
                                    padding: 4,
                                    fontSize: 12,
                                    borderWidth: 1
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
     * @description Renders tabs for Agenda
     */
    const renderTabs = (activeTab: any) => {
        return (
            <View
                style={{
                    flexDirection: 'column',
                    flex: 1,
                    marginBottom: 20,
                    marginTop: 10,
                    paddingVertical: 10,
                    backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2'
                }}
            >
                {tab !== 'Add' ? null : (
                    <TouchableOpacity
                        onPress={() => {
                            setEditEvent(null);
                            props.setTab(tabs[0]);
                            setTab(tabs[0]);
                        }}
                        style={{
                            paddingHorizontal: 10,
                            // paddingTop: 5,
                            backgroundColor: 'white',
                            alignSelf: 'flex-start'
                        }}
                    >
                        <Text style={{ lineHeight: 27, width: '100%', textAlign: 'center' }}>
                            <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                        </Text>
                    </TouchableOpacity>
                )}
                {tab !== 'Add' ? (
                    <View
                        style={{
                            flexDirection: 'row',
                            paddingTop: 10,
                            backgroundColor: '#f2f2f2',
                            flex: 1,
                            justifyContent: 'center'
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#f2f2f2'
                            }}
                            onPress={() => {
                                setTab('Agenda');
                            }}
                        >
                            <Text style={tab === 'Agenda' ? styles.allGrayFill1 : styles.all1}>
                                <Ionicons name="list-outline" size={18} style={{ marginBottom: 5 }} />
                            </Text>
                            <Text style={tab === 'Agenda' ? styles.allGrayFill1 : styles.all1}>{'To-do'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#f2f2f2'
                            }}
                            onPress={() => {
                                setTab('Schedule');
                            }}
                        >
                            <Text style={tab === 'Schedule' ? styles.allGrayFill1 : styles.all1}>
                                <Ionicons name="map-outline" size={18} />
                            </Text>
                            <Text style={tab === 'Schedule' ? styles.allGrayFill1 : styles.all1}>Schedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                justifyContent: 'center',
                                flexDirection: 'column',
                                backgroundColor: '#f2f2f2'
                            }}
                            onPress={() => {
                                setTab('Calendar');
                            }}
                        >
                            <Text style={tab === 'Calendar' ? styles.allGrayFill1 : styles.all1}>
                                <Ionicons name="calendar-sharp" size={18} />
                            </Text>
                            <Text style={tab === 'Calendar' ? styles.allGrayFill1 : styles.all1}>Planner</Text>
                        </TouchableOpacity>
                        {props.version === 'read' ? null : (
                            <TouchableOpacity
                                style={{
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    backgroundColor: '#f2f2f2'
                                }}
                                onPress={() => {
                                    setTab('Activity');
                                }}
                            >
                                {/* Alert  */}
                                <View
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: '100%',
                                        backgroundColor: '#f94144',
                                        position: 'absolute',
                                        top: -3,
                                        right: 5
                                    }}
                                />
                                <Text style={tab === 'Activity' ? styles.allGrayFill1 : styles.all1}>
                                    <Ionicons name="notifications-outline" size={18} />
                                </Text>
                                <Text style={tab === 'Activity' ? styles.allGrayFill1 : styles.all1}>Alerts</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}

                {tab === tabs[3] && unreadCount !== 0 ? (
                    <TouchableOpacity
                        onPress={async () => {
                            const uString: any = await AsyncStorage.getItem('user');
                            if (uString) {
                                const user = JSON.parse(uString);
                                const server = fetchAPI(user._id);
                                server
                                    .mutate({
                                        mutation: markActivityAsRead,
                                        variables: {
                                            userId: user._id,
                                            markAllRead: true
                                        }
                                    })
                                    .then(res => {
                                        if (res.data.activity.markActivityAsRead) {
                                            server
                                                .query({
                                                    query: getActivity,
                                                    variables: {
                                                        userId: user._id
                                                    }
                                                })
                                                .then(res => {
                                                    if (res.data && res.data.activity.getActivity) {
                                                        const tempActivity = res.data.activity.getActivity;
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
                                    .catch(err => {});
                            }
                        }}
                        style={{
                            backgroundColor: '#f2f2f2',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 20,
                            alignSelf: 'center'
                        }}
                    >
                        <Text
                            style={{
                                textAlign: 'center',
                                lineHeight: 34,
                                color: '#006AFF',
                                fontSize: 12,
                                borderWidth: 1,
                                borderColor: '#006AFF',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}
                        >
                            Mark as Read
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };

    // MAIN RETURN
    return (
        <Animated.View
            style={{
                opacity: modalAnimation,
                width: '100%',
                height: width < 768 ? Dimensions.get('window').height - 104 : Dimensions.get('window').height - 52,
                backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2',
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
                overflow: 'scroll'
            }}
        >
            <View
                style={{
                    width: '100%',
                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                    backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2',
                    maxWidth: 900,
                    alignSelf: 'center'
                }}
            >
                <View
                    style={{
                        width: Dimensions.get('window').width < 768 ? '100%' : '100%',
                        backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2'
                    }}
                >
                    <View
                        style={{
                            width: '100%',
                            backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0
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
                                    backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2',
                                    marginTop: 50,
                                    marginBottom: 50
                                }}
                            >
                                <ActivityIndicator color={'#1F1F1F'} />
                            </View>
                        ) : (
                            <View
                                style={{
                                    backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2',
                                    width: '100%',
                                    borderTopRightRadius: 0,
                                    borderTopLeftRadius: 0
                                }}
                            >
                                {renderTabs(tab)}
                                {!showAddEvent ? (
                                    <View
                                        style={{
                                            borderRadius: 1,
                                            marginBottom: Dimensions.get('window').width < 768 ? 0 : 0,
                                            borderWidth: tab !== 'Add' && tab !== 'Activity' ? 1 : 0,
                                            borderColor: '#f2f2f2',
                                            backgroundColor: tab === 'Add' ? 'white' : '#f2f2f2',
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: tab === 'Add' ? 0 : 2,
                                                height: tab === 'Add' ? 0 : 2
                                            },
                                            shadowOpacity: 0.05,
                                            shadowRadius: tab === 'Add' ? 0 : 10,
                                            zIndex: 500000
                                        }}
                                    >
                                        {tab === tabs[0] ? (
                                            <Eventcalendar
                                                key={Math.random()}
                                                view={viewAgenda}
                                                data={events}
                                                themeVariant="light"
                                                onEventClick={onSelectEvent}
                                                renderEventContent={renderEventContent}
                                                noEventsText="Click + to schedule a new event or meeting."
                                            />
                                        ) : tab === tabs[1] ? (
                                            <Eventcalendar
                                                key={Math.random()}
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
                                                key={Math.random()}
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
                                                    paddingLeft: Dimensions.get('window').width < 768 ? 0 : 0,
                                                    paddingTop: Dimensions.get('window').width < 768 ? 0 : 0,
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <View>
                                                    {activity.map((act: any, index: number) => {
                                                        const { cueId, channelId, createdBy, target, threadId } = act;

                                                        // if (props.filterByChannel !== 'All') {
                                                        //     if (props.filterByChannel !== act.channelId) {
                                                        //         return;
                                                        //     }
                                                        // }

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

                                                        return (
                                                            <TouchableOpacity
                                                                key={index.toString()}
                                                                onPress={async () => {
                                                                    const uString: any = await AsyncStorage.getItem(
                                                                        'user'
                                                                    );
                                                                    if (uString) {
                                                                        const user = JSON.parse(uString);
                                                                        const server = fetchAPI('');
                                                                        server.mutate({
                                                                            mutation: markActivityAsRead,
                                                                            variables: {
                                                                                activityId: act._id,
                                                                                userId: user._id,
                                                                                markAllRead: false
                                                                            }
                                                                        });
                                                                    }

                                                                    // Opens the cue from the activity
                                                                    if (
                                                                        cueId !== null &&
                                                                        cueId !== '' &&
                                                                        channelId !== '' &&
                                                                        createdBy !== '' &&
                                                                        target === 'CUE'
                                                                    ) {
                                                                        props.openCueFromCalendar(
                                                                            channelId,
                                                                            cueId,
                                                                            createdBy
                                                                        );
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
                                                                        target === 'CHANNEL_MODERATOR_REMOVED'
                                                                    ) {
                                                                        props.openChannel(channelId);
                                                                    }

                                                                    if (target === 'Q&A') {
                                                                        if (threadId && threadId !== '') {
                                                                            await AsyncStorage.setItem(
                                                                                'openThread',
                                                                                threadId
                                                                            );
                                                                        }

                                                                        props.openQA(channelId, cueId, createdBy);
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
                                                                    borderLeftWidth: 3,
                                                                    borderLeftColor: act.colorCode
                                                                }}
                                                                disabled={target === 'CHANNEL_UNSUBSCRIBED'}
                                                            >
                                                                <View
                                                                    style={{
                                                                        flex: 1,
                                                                        backgroundColor: 'white',
                                                                        paddingLeft: 20
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 15,
                                                                            padding: 5,
                                                                            fontFamily: 'inter',
                                                                            marginTop: 5
                                                                        }}
                                                                        ellipsizeMode="tail"
                                                                    >
                                                                        {act.channelName}
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 12,
                                                                            padding: 5,
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                        ellipsizeMode="tail"
                                                                    >
                                                                        {act.title} - {act.subtitle}
                                                                    </Text>
                                                                </View>
                                                                <View
                                                                    style={{
                                                                        backgroundColor: 'white',
                                                                        padding: 0,
                                                                        flexDirection: 'row',
                                                                        alignSelf: 'center',
                                                                        paddingRight: 10,
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 13,
                                                                            padding: 5,
                                                                            lineHeight: 13
                                                                        }}
                                                                        ellipsizeMode="tail"
                                                                    >
                                                                        {act.status === 'unread' ? (
                                                                            <Ionicons
                                                                                name="alert-circle-outline"
                                                                                color="#f94144"
                                                                                size={18}
                                                                            />
                                                                        ) : null}
                                                                    </Text>
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 12,
                                                                            padding: 5,
                                                                            lineHeight: 13,
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                        ellipsizeMode="tail"
                                                                    >
                                                                        {emailTimeDisplay(act.date)}
                                                                    </Text>
                                                                    {target !== 'CHANNEL_UNSUBSCRIBED' ? (
                                                                        <Text
                                                                            style={{
                                                                                fontSize: 13,
                                                                                padding: 5,
                                                                                lineHeight: 13
                                                                            }}
                                                                            ellipsizeMode="tail"
                                                                        >
                                                                            <Ionicons
                                                                                name="chevron-forward-outline"
                                                                                size={18}
                                                                                color="#006AFF"
                                                                            />
                                                                        </Text>
                                                                    ) : null}
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
                                                    paddingHorizontal: width < 768 ? 20 : 0
                                                }}
                                            >
                                                {renderEditChannelName()}
                                                {!editChannelName ? (
                                                    <View style={{ marginBottom: 15 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 18,
                                                                fontFamily: 'Inter',
                                                                color: '#000000'
                                                            }}
                                                        >
                                                            New event
                                                        </Text>
                                                    </View>
                                                ) : null}
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: 400,
                                                        alignSelf: 'center'
                                                    }}
                                                >
                                                    <View style={{ width: '100%', maxWidth: 400 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                fontFamily: 'inter',
                                                                color: '#000000'
                                                            }}
                                                        >
                                                            Topic
                                                        </Text>
                                                        <TextInput
                                                            value={title}
                                                            placeholder={''}
                                                            onChangeText={val => setTitle(val)}
                                                            placeholderTextColor={'#1F1F1F'}
                                                            required={true}
                                                        />
                                                    </View>
                                                    <View style={{ width: '100%', maxWidth: 400 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                fontFamily: 'inter',
                                                                color: '#000000'
                                                            }}
                                                        >
                                                            Description
                                                        </Text>
                                                        <TextInput
                                                            value={description}
                                                            placeholder=""
                                                            onChangeText={val => setDescription(val)}
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
                                                            paddingVertical: 15
                                                        }}
                                                    >
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('start')}
                                                        </Text>
                                                        <Datepicker
                                                            controls={['date', 'time']}
                                                            touchUi={true}
                                                            theme="ios"
                                                            value={start}
                                                            themeVariant="light"
                                                            // inputComponent="input"
                                                            inputProps={{
                                                                placeholder: 'Select start...'
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
                                                                    touchUi: true
                                                                },
                                                                medium: {
                                                                    controls: ['date', 'time'],
                                                                    display: 'anchored',
                                                                    touchUi: false
                                                                }
                                                            }}
                                                        />
                                                    </View>
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            maxWidth: 400,
                                                            paddingVertical: 15
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
                                                                placeholder: 'Select end...'
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
                                                                    touchUi: true
                                                                },
                                                                medium: {
                                                                    controls: ['date', 'time'],
                                                                    display: 'anchored',
                                                                    touchUi: false
                                                                }
                                                            }}
                                                        />
                                                    </View>
                                                </View>
                                                <View
                                                    style={{
                                                        paddingTop: 20,
                                                        width: '100%',
                                                        maxWidth: 400
                                                    }}
                                                >
                                                    {channels.length > 0 && !editEvent ? (
                                                        <View>
                                                            <View style={{ width: '100%', paddingBottom: 10 }}>
                                                                <Text
                                                                    style={{
                                                                        fontSize: 14,
                                                                        fontFamily: 'inter',
                                                                        color: '#000000'
                                                                    }}
                                                                >
                                                                    For
                                                                </Text>
                                                            </View>
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    display: 'flex',
                                                                    backgroundColor: '#f2f2f2'
                                                                }}
                                                            >
                                                                {/* <Menu
                                                                                                        onSelect={(channelId: any) => {
                                                                                                            setChannelId(channelId)
                                                                                                        }}>
                                                                                                        <MenuTrigger>
                                                                                                            <Text style={{ fontSize: 14, color: '#000000' }}>
                                                                                                                {eventForChannelName}<Ionicons name='chevron-down-outline' size={15} />
                                                                                                            </Text>
                                                                                                        </MenuTrigger>
                                                                                                        <MenuOptions customStyles={{
                                                                                                            optionsContainer: {
                                                                                                                padding: 10,
                                                                                                                borderRadius: 15,
                                                                                                                shadowOpacity: 0,
                                                                                                                borderWidth: 1,
                                                                                                                borderColor: '#f2f2f2'
                                                                                                            }
                                                                                                        }}>
                                                                                                            <MenuOption
                                                                                                                value={''}>
                                                                                                                <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                                                                    <Text style={{ marginLeft: 5 }}>
                                                                                                                        My Cues
                                                                                                                    </Text>
                                                                                                                </View>
                                                                                                            </MenuOption>
                                                                                                            {
                                                                                                                channels.map((channel: any) => {
                                                                                                                    return <MenuOption
                                                                                                                        value={channel._id}>
                                                                                                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                                                                                            <Text style={{ marginLeft: 5 }}>
                                                                                                                                {channel.name}
                                                                                                                            </Text>
                                                                                                                        </View>
                                                                                                                    </MenuOption>
                                                                                                                })
                                                                                                            }
                                                                                                        </MenuOptions>
                                                                                                    </Menu> */}
                                                                <label
                                                                    style={{
                                                                        width: '100%',
                                                                        maxWidth: 400,
                                                                        backgroundColor: 'white'
                                                                    }}
                                                                >
                                                                    <Select
                                                                        touchUi={true}
                                                                        themeVariant="light"
                                                                        value={selectedChannel}
                                                                        onChange={(val: any) => {
                                                                            setSelectedChannel(val.value);

                                                                            if (val.value === 'Home') {
                                                                                setChannelId('');
                                                                            } else {
                                                                                setChannelId(val.value);
                                                                            }
                                                                        }}
                                                                        responsive={{
                                                                            small: {
                                                                                display: 'bubble'
                                                                            },
                                                                            medium: {
                                                                                touchUi: false
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            backgroundColor: '#f2f2f2'
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
                                                                paddingBottom: 15
                                                            }}
                                                        >
                                                            The meeting link will be same as the one in the Course
                                                            Settings. Ensure you have a working link set at all times.
                                                        </Text>
                                                    ) : null}
                                                    {channelId !== '' &&
                                                        userZoomInfo &&
                                                        userZoomInfo.accountId &&
                                                        !meetingProvider && isMeeting ? (
                                                            <Text
                                                                style={{
                                                                    fontSize: 11,
                                                                    color: '#000000',
                                                                    // textTransform: 'uppercase',
                                                                    lineHeight: 20,
                                                                    fontFamily: 'Inter',
                                                                    paddingBottom: 15
                                                                }}
                                                            >
                                                                Note: You need to be a licensed Zoom user for student attendances to be automatically captured and visible under your Course past meetings. 
                                                            </Text>
                                                        ) : null}

                                                    {(channelId !== '' &&
                                                        (!userZoomInfo || !userZoomInfo.accountId) &&
                                                        !meetingProvider) ||
                                                    (editEvent &&
                                                        !meetingProvider &&
                                                        !editEvent.zoomMeetingId &&
                                                        (!userZoomInfo || !userZoomInfo.accountId)) ? (
                                                        <View
                                                            style={{
                                                                marginVertical: 10,
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                padding: 10,
                                                                backgroundColor: '#f3f3f3',
                                                                borderRadius: 1
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name="warning-outline"
                                                                size={22}
                                                                color={'#f3722c'}
                                                            />
                                                            <Text style={{ paddingLeft: 20 }}>
                                                                {editEvent
                                                                    ? 'To schedule online meeting connect your Zoom account'
                                                                    : 'To schedule online meetings connect your account to Zoom'}
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
                                                                    backgroundColor: '#f3f3f3',
                                                                    paddingHorizontal: 10
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        fontSize: 14,
                                                                        fontFamily: 'inter',
                                                                        color: '#006AFF',
                                                                        backgroundColor: '#f3f3f3'
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
                                                                // paddingLeft: 7
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <TouchableOpacity
                                                                style={{
                                                                    backgroundColor: 'white',
                                                                    overflow: 'hidden',
                                                                    height: 35,
                                                                    // marginTop: 15,
                                                                    justifyContent: 'center',
                                                                    flexDirection: 'row'
                                                                }}
                                                                onPress={() => handleCreate()}
                                                                disabled={isCreatingEvents}
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
                                                                        borderRadius: 15,
                                                                        width: 120,
                                                                        textTransform: 'uppercase'
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
                        {/* TEMPORARILY HIDDEN */}
                        {/* <View style={{ backgroundColor: '#f2f2f2', display: 'none' }}>
                            <View
                                style={{
                                    flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                    flex: 1,
                                    paddingTop: 40
                                }}>
                                <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        marginRight: 10,
                                        color: '#000000',
                                        fontSize: 20,
                                        paddingBottom: 20,
                                        fontFamily: 'inter',
                                        flex: 1,
                                        flexDirection: 'row',
                                        lineHeight: 25,
                                        height: 65
                                    }}>
                                    Live
                                </Text>
                            </View>
                            <iframe
                                width="700"
                                style={{
                                    maxWidth: '100%',
                                    width: '100%',
                                    // borderWidth: 1,
                                    borderRadius: 1,
                                    borderColor: '#f2f2f2',
                                    marginBottom: 25
                                }}
                                height="450"
                                src="https://www.youtube.com/embed/live_stream?channel=UC-Tkz11V97prOm8hJTSRMHw"
                                frameBorder="0"
                                allowFullScreen={true}
                            />
                        </View> */}
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

export default CalendarX;

const styles: any = StyleSheet.create({
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20
    },
    text: {
        fontSize: 14,
        color: '#000000',
        marginBottom: 10,
        fontFamily: 'Inter'
    },
    allBlack: {
        fontSize: 12,
        color: '#000000',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#f2f2f2'
    },
    all1: {
        fontSize: 11,
        height: 20,
        lineHeight: 20,
        color: '#1F1F1F',
        // height: 20,
        paddingHorizontal: 8,
        backgroundColor: '#f2f2f2',
        // lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center',
        marginBottom: 1
    },
    allGrayFill1: {
        color: '#006AFF',
        fontSize: 11,
        height: 20,
        lineHeight: 20,
        // height: 20,
        paddingHorizontal: 8,
        // lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center',
        marginBottom: 1
    },
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: '#f2f2f2'
    },
    allOutline: {
        fontSize: 12,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 1,
        backgroundColor: '#000000'
    },
    picker: {
        display: 'flex',
        justifyContent: 'flex-start',
        backgroundColor: '#f2f2f2',
        overflow: 'hidden',
        fontSize: 12,
        textAlign: 'center',
        borderWidth: 1,
        width: 150,
        height: 20,
        alignSelf: 'center',
        marginTop: 0,
        borderRadius: 3
    }
});
