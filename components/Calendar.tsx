import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Switch, StyleSheet, ScrollView, View as DefaultView } from "react-native";
import { TextInput } from "./CustomTextInput";
import Alert from "./Alert";
import { Text, View, TouchableOpacity } from "./Themed";
import { fetchAPI } from "../graphql/FetchAPI";
import { createDate, deleteDate, getChannels, getEvents, createDateV1, editDateV1, deleteDateV1, meetingRequest, markAttendance, getActivity, getOrganisation, markActivityAsRead } from "../graphql/QueriesAndMutations";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar, momentLocalizer } from "react-big-calendar";
import Datetime from "react-datetime";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { htmlStringParser } from "../helpers/HTMLParser";
import { Ionicons } from "@expo/vector-icons";
import { PreferredLanguageText } from "../helpers/LanguageContext";
import { eventFrequencyOptions } from "../helpers/FrequencyOptions";
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import ActivityCard from "./ActivityCard";
import { Eventcalendar, Datepicker } from "@mobiscroll/react";
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
// import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
// import '@mobiscroll/react5/dist/css/mobiscroll.min.css';
import Swiper from "react-native-web-swiper";

// Try New Calendar
// import Scheduler, {SchedulerData, ViewTypes, DATE_FORMAT} from 'react-big-scheduler'
// import 'react-big-scheduler/lib/css/style.css';
import { Select } from '@mobiscroll/react'


const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [tab, setTab] = useState(props.tab)

    useEffect(() => {
        props.setTab(tab)
    }, [tab])

    const [modalAnimation] = useState(new Animated.Value(1));
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<any[]>([]);

    const [title, setTitle] = useState("");
    const [start, setStart] = useState(new Date());
    const [end, setEnd] = useState(new Date(start.getTime() + 1000 * 60 * 60));
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
    const [channels, setChannels] = useState<any[]>([]);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [channelId, setChannelId] = useState("");
    const [selectedChannel, setSelectedChannel] = useState("My Events");
    const [calendarChoice, setCalendarChoice] = useState('Agenda')
    // v1
    const current = new Date();
    const [description, setDescription] = useState("");
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState("1-W");
    const [repeatTill, setRepeatTill] = useState(new Date());
    const [isMeeting, setIsMeeting] = useState(false);
    const [recordMeeting, setRecordMeeting] = useState(false);
    const [isCreatingEvents, setIsCreatingEvents] = useState(false);
    const [editEvent, setEditEvent] = useState<any>(null);
    // Stores channel name of event being modified
    const [editChannelName, setEditChannelName] = useState("")
    const [isEditingEvents, setIsEditingEvents] = useState(false);
    const [isDeletingEvents, setIsDeletingEvents] = useState(false);

    // Used for filtering by channels
    const [eventChannels, setEventChannels] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);

    const [userId, setUserId] = useState('');
    const [allActivity, setAllActivity] = useState<any[]>([]);

    const viewAgenda: any = React.useMemo(() => {
        return {
            agenda: { type: 'week' },
        };
    }, []);
    const viewSchedule: any = React.useMemo(() => {
        return {
            schedule: { type: 'week' },
        };
    }, []);
    const viewCalendar: any = React.useMemo(() => {
        return {
            calendar: { type: 'month' },
        };
    }, []);

    // const [viewModel, setViewModel] = useState<any>(new SchedulerData(new moment().format(DATE_FORMAT), ViewTypes.Week))

    const [school, setSchool] = useState<any>({})

    const tabs = ['Agenda', 'Schedule', 'Calendar', 'Activity', 'Add']
    const tabOptions = ['Agenda', 'Schedule', 'Calendar', 'Activity']

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    const server = fetchAPI('')
                    server.query({
                        query: getOrganisation,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.school.findByUserId) {
                            setSchool(res.data.school.findByUserId)
                        }
                    })
                }
            }
        )()

    }, [])

    const localizer = momentLocalizer(moment);

    const EventComponent = (eventProps: any) => {

        const { event } = eventProps;

        let colorCode = "#202025";

        const matchSubscription = props.subscriptions.find((sub: any) => {
            return sub.channelName === event.channelName
        })

        if (matchSubscription && matchSubscription !== undefined) {
            colorCode = matchSubscription.colorCode
        }

        return <span style={{ color: colorCode, backgroundColor: '#E7EBEE', borderRadius: 1, padding: 20, overflow: 'hidden' }}>{event.title}</span>

    }

    const [activity, setActivity] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState<any>(0)

    useEffect(() => {
        (
            async () => {

                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)

                    setUserId(user._id);
                    const server = fetchAPI(user._id)
                    server.query({
                        query: getActivity,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.activity.getActivity) {
                            const tempActivity = res.data.activity.getActivity.reverse()
                            let unread = 0
                            tempActivity.map((act: any) => {
                                if (act.status === 'unread') {
                                    unread++
                                }
                            })
                            setUnreadCount(unread)
                            setActivity(tempActivity)
                            setAllActivity(tempActivity)
                        }
                    })
                }
            }
        )()

    }, [])


    const loadChannels = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem("user");
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI("");
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
                .catch(err => { });
        }
    }, []);

    useEffect(() => {
        if (title !== "" && end > start) {
            setIsSubmitDisabled(false);
            return;
        }
        setIsSubmitDisabled(true);
    }, [title, start, end]);

    let resources = [
        {
            id: 'lectures',
            name: 'Lectures',
        },
        {
            id: 'submissions',
            name: 'Submissions'
        },
        {
            id: 'others',
            name: 'Others',
        },
    ];

    useEffect(() => {

        let total = [...allEvents];

        // Filter the meetings first 
        if (props.filterEventsType === "Lectures") {
            total = total.filter((e: any) => e.meeting)
        } else if (props.filterEventsType === "Submissions") {
            total = total.filter((e: any) => e.cueId !== "");
        } else if (props.filterEventsType === "Events") {
            total = total.filter((e: any) => e.cueId === "" && !e.meeting);
        }

        if (props.filterEnd && props.filterStart) {
            const end = new Date(props.filterEnd)
            total = total.filter((e: any) => {
                if (!e.end) {
                    const date = new Date(e.start)
                    return date < end
                }
                const date = new Date(e.end)
                return date < end
            })
            const start = new Date(props.filterStart)
            total = total.filter((e: any) => {
                const date = new Date(e.start)
                return date > start
            })
        }

        if (props.filterByChannel === "All") {
            setEvents(total);
        } else {
            const all = [...total];
            const filter = all.filter((e: any) => props.filterByChannel === (e.channelName));
            setEvents(filter)
        }

    }, [props.filterByChannel, props.filterEventsType, props.filterStart, props.filterEnd])

    useEffect(() => {

        console.log("Filter by channel", props.filterByChannel);

        const all = [...allActivity];
        if (props.filterByChannel === "All") {
            setActivity(all);
        } else {
            const filter = all.filter((e: any) => props.filterByChannel === e.channelName);
            setActivity(filter);
        }
    }, [props.filterByChannel])



    const renderFilterEvents = () => {

        const channels = props.subscriptions.map((subscription: any) => {

            return {
                value: subscription.channelName,
                text: subscription.channelName
            }
        })

        const channelFilterData = [{ text: 'All', value: 'All' }, { text: 'My Events', value: 'My Events' }, ...channels]


        return (<View style={{
            marginTop: 0,
            flexDirection: 'row',
            // paddingTop: width < 1024 ? 20 : 0
            // borderWidth: 1,
            // alignSelf: 'flex-start',
            // flex: 1
        }} key={JSON.stringify(eventChannels)}>
            <View>
                <View style={{ backgroundColor: '#e7ebee' }}>
                    {/* <View style={{}}>
                        <Menu
                            onSelect={(choice: any) => {
                                setFilterEventsType(choice);
                            }}>
                            <MenuTrigger>
                                <Text style={{ fontSize: 14, color: '#16181C' }}>
                                    {filterEventsType}<Ionicons name='chevron-down-outline' size={15} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#E7EBEE',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}>
                                <MenuOption
                                    value={"All"}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <Text style={{ marginLeft: 5 }}>
                                            All
                                        </Text>
                                    </View>
                                </MenuOption>
                                <MenuOption
                                    value={"Lectures"}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <Text style={{ marginLeft: 5 }}>
                                            Lectures
                                        </Text>
                                    </View>
                                </MenuOption>
                                <MenuOption
                                    value={"Submissions"}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <Text style={{ marginLeft: 5 }}>
                                            Submissions
                                        </Text>
                                    </View>
                                </MenuOption>
                                <MenuOption
                                    value={"Events"}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <Text style={{ marginLeft: 5 }}>
                                            Events
                                        </Text>
                                    </View>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                        <Text style={{ fontSize: 10, color: '#16181C', paddingTop: 7 }}>
                            Type
                        </Text>
                    </View> */}
                </View>
            </View>
        </View>
        )
    }


    // use effect for edit events
    useEffect(() => {
        if (editEvent) {
            setTitle(editEvent.originalTitle);
            setDescription(editEvent.description)
            setStart(new Date(editEvent.start))
            setEnd(new Date(editEvent.end))
            setEditChannelName(editEvent.channelName)

            if (editEvent.dateId !== "channel" && editEvent.createdBy) {
                setIsMeeting(true)
                if (editEvent.recordMeeting) {
                    setRecordMeeting(true)
                }
            }

        } else {

            setTitle("");
            setDescription("")
            const current = new Date()
            setStart(new Date())
            setEnd(new Date(current.getTime() + 1000 * 60 * 60))
            setEditChannelName("")
        }
    }, [editEvent])

    const yesterday = moment().subtract(1, "day");
    const disablePastDt = (current: any) => {
        return current.isAfter(yesterday);
    };
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0)
        return time
    }

    const handleCreate = useCallback(async () => {

        if (title === "") {
            Alert("A title must be set for the event. ");
            return;
        } else if (start < new Date()) {
            Alert("Event must be set in the future.");
            return;
        } else if (start > end) {
            Alert("End time must be after than start time.");
            return
        }
        if (recurring) {
            if (start > repeatTill) {
                Alert("Repeat until must be set in the future.");
                return
            }
        }

        setIsCreatingEvents(true);

        const meeting = channelId && channelId !== "" ? isMeeting : false;

        const freq = recurring ? frequency : ""

        const repeat = recurring ? repeatTill.toUTCString() : ""

        const u = await AsyncStorage.getItem("user");
        if (u) {
            const user = JSON.parse(u);
            const server = fetchAPI("");
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
                        repeatTill: repeat
                    }
                })
                .then(res => {

                    const updated = new Date();

                    loadEvents();
                    setTitle("");
                    setRepeatTill(new Date())
                    setIsMeeting(false);
                    setDescription("");
                    setFrequency("1-W");
                    setRecurring(false);
                    setRecordMeeting(false);
                    setIsCreatingEvents(false);
                    setShowAddEvent(false)
                })
                .catch(err => {
                    setIsCreatingEvents(false);
                    console.log(err)
                });
        }
    }, [title, start, end, channelId, recordMeeting, isMeeting, repeatTill, frequency, recurring, isSubmitDisabled, isCreatingEvents]);

    const handleEdit = useCallback(async () => {

        setIsEditingEvents(true);

        const server = fetchAPI("");
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
                }
            })
            .then((res) => {

                if (res.data.date.editV1) {

                    loadEvents();
                    Alert('Updated event successully.')
                } else {
                    Alert('Failed to edit event. Try again.')
                }

                setIsEditingEvents(false);

            })
            .catch(err => {
                Alert('Failed to edit event. Try again.')
                setIsEditingEvents(false);
                console.log(err)
            });

    }, [editEvent, title, start, end, description, isMeeting, recordMeeting]);

    const handleDelete = useCallback(async (deleteAll: boolean) => {

        const { eventId, recurringId } = editEvent;

        setIsDeletingEvents(true);

        const server = fetchAPI("");
        server
            .mutate({
                mutation: deleteDateV1,
                variables: {
                    id: !deleteAll ? eventId : recurringId,
                    deleteAll
                }
            })
            .then(res => {
                if (res.data.date.deleteV1) {
                    loadEvents();
                    setTitle("");
                    setRepeatTill(new Date())
                    setIsMeeting(false);
                    setDescription("");
                    setFrequency("1-W");
                    setRecurring(false);
                    setRecordMeeting(false);
                    setEditEvent(null)
                    setShowAddEvent(false)

                    Alert(!deleteAll ? 'Deleted event successfully.' : 'Deleted events successfully.')

                } else {

                    Alert(!deleteAll ? 'Failed to delete events. Try again.' : 'Failed to delete events. Try again.')

                }
                setIsDeletingEvents(false);

            })
            .catch(err => {
                setIsDeletingEvents(false);
                Alert(!deleteAll ? 'Failed to delete events. Try again.' : 'Failed to delete events. Try again.')
                console.log(err)
            });

    }, [title, start, end, description, isMeeting, recordMeeting]);

    const loadEvents = useCallback(async () => {
        const u = await AsyncStorage.getItem("user");
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

                        let colorCode = "#202025";

                        const matchSubscription = props.subscriptions.find((sub: any) => {
                            return sub.channelName === e.channelName
                        })

                        if (matchSubscription && matchSubscription !== undefined) {
                            colorCode = matchSubscription.colorCode
                        }

                        parsedEvents.push({
                            eventId: e.eventId ? e.eventId : "",
                            originalTitle: title,
                            title: e.channelName ? (title + ' - ' + e.channelName) : title,
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
                            submitted: e.submitted
                        });


                    });
                    setEventChannels(Array.from(channelsSet))
                    setAllEvents(parsedEvents)
                    setEvents(parsedEvents);
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
                Alert("Unable to load calendar.", "Check connection.");
                setLoading(false);
                modalAnimation.setValue(0);
                Animated.timing(modalAnimation, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                }).start();
            });
    }, [props.subscriptions, modalAnimation]);

    useEffect(() => {
        loadEvents();
        loadChannels();
    }, [props.cues]);

    const datesEqual = (date1: string, date2: string) => {
        const one = new Date(date1);
        const two = new Date(date2);

        if (one > two) return false;
        else if (one < two) return false;
        else return true
    }

    console.log('Edit event', editEvent);
    console.log('Add event', showAddEvent);


    const onSelectEvent = async (data: any) => {

        const { event } = data;

        const uString: any = await AsyncStorage.getItem("user");
        // Only allow edit if event is not past
        if (uString) {

            const user = JSON.parse(uString);

            const timeString = datesEqual(event.start, event.end) ? moment(new Date(event.start)).format("MMMM Do YYYY, h:mm a") : moment(new Date(event.start)).format("MMMM Do YYYY, h:mm a") + " to " + moment(new Date(event.end)).format("MMMM Do YYYY, h:mm a")

            const descriptionString = event.description ? event.description + "- " + timeString : "" + timeString

            if (user._id === event.createdBy && new Date(event.end) > new Date() && event.eventId) {

                setEditEvent(event)
                props.setTab('Add')
                // setShowAddEvent(true)

            } else if (user._id === event.createdBy && new Date(event.end) < new Date() && event.eventId) {
                Alert("Delete " + event.title + "?", descriptionString, [
                    {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => {
                            return;
                        }
                    },
                    {
                        text: "Delete",
                        onPress: async () => {
                            const server = fetchAPI("");
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
                                        Alert("Event Deleted!");
                                        loadEvents();
                                    }
                                });
                        }
                    }
                ]);

            } else {

                const date = new Date();

                if (date > new Date(event.start) && date < new Date(event.end) && event.meeting) {
                    Alert(
                        event.title,
                        "Enter classroom?",
                        [
                            {
                                text: "No",
                                style: "cancel",
                                onPress: () => {
                                    return;
                                }
                            },
                            {
                                text: "Yes",
                                onPress: async () => {
                                    const uString: any = await AsyncStorage.getItem("user");

                                    const user = JSON.parse(uString)

                                    const server = fetchAPI('')
                                    server.mutate({
                                        mutation: meetingRequest,
                                        variables: {
                                            userId: user._id,
                                            channelId: event.channelId,
                                            isOwner: false
                                        }
                                    }).then(res => {
                                        if (res.data && res.data.channel.meetingRequest !== 'error') {
                                            server
                                                .mutate({
                                                    mutation: markAttendance,
                                                    variables: {
                                                        userId: user._id,
                                                        channelId: event.channelId
                                                    }
                                                })
                                            window.open(res.data.channel.meetingRequest, "_blank");
                                        } else {
                                            Alert("Classroom not in session. Waiting for instructor.")
                                        }
                                    }).catch(err => {
                                        Alert("Something went wrong.")
                                    })
                                }
                            }
                        ]
                    );
                } else if (event.cueId !== "") {
                    props.openCueFromCalendar(event.channelId, event.cueId, event.createdBy)
                } else {
                    Alert(
                        event.title,
                        descriptionString
                    );
                }

            }

        }


    }

    const width = Dimensions.get("window").width;
    const windowHeight =
        width < 1024 ? Dimensions.get("window").height - 0 : Dimensions.get("window").height;

    const f: any = eventFrequencyOptions.find((item) => {
        return item.value === frequency
    })
    const freq = f.label

    const renderRecurringOptions = () => (
        <View style={{}}>
            <View style={{ width: '100%', maxWidth: 400, display: "flex", paddingTop: 40, paddingBottom: 5 }}>
                <View style={{ width: "100%", backgroundColor: "#e7ebee" }}>
                    <Text style={styles.text}>Repeat</Text>
                </View>
                <View
                    style={{
                        backgroundColor: "#e7ebee",
                        height: 40,
                        marginRight: 10,
                        paddingLeft: 5,
                        marginTop: 10
                    }}>
                    <Switch
                        value={recurring}
                        onValueChange={() => setRecurring(!recurring)}
                        style={{ height: 20 }}
                        trackColor={{
                            false: "#E7EBEE",
                            true: "#3289d0"
                        }}
                        activeThumbColor="white"
                    />
                </View>
            </View>

            {recurring ? <View style={{ width: '100%', maxWidth: 400, display: "flex", paddingVertical: 15, }}>
                <View style={{ width: "100%", backgroundColor: "#e7ebee" }}>
                    <Text
                        style={styles.text}>
                        Interval
                    </Text>
                </View>
                <View
                    style={{
                        width: "100%",
                        flexDirection: "row",
                        marginLeft: 0
                    }}>

                    <label style={{ width: '100%', maxWidth: 400 }}>
                        <Select
                            themeVariant="light"
                            touchUi={true}
                            value={frequency}
                            onChange={(val: any) => {
                                setFrequency(val.value)
                            }}
                            rows={eventFrequencyOptions.length}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                }
                            }}
                            data={eventFrequencyOptions.map((item: any, index: number) => {
                                return {
                                    value: item.value,
                                    text: item.label
                                }
                            })}
                        />
                    </label>
                </View>
            </View> : null}

            {recurring ? <View style={{ width: '100%', maxWidth: 400, display: "flex" }}>
                <View style={{ width: "100%", backgroundColor: "#e7ebee", paddingVertical: 15 }}>
                    <Text style={styles.text}>End</Text>
                    {/* <DatePicker
                        format="YYYY-MM-DD HH:mm"
                        preventOverflow={true}
                        appearance={'subtle'}
                        value={repeatTill}
                        onChange={(event: any) => {
                            const date = new Date(event);
                            if (date < new Date()) return;
                            const roundOffDate = roundSeconds(date)
                            setRepeatTill(roundOffDate);
                        }}
                        size={'xs'}
                    // isValidDate={disablePastDt}
                    /> */}
                    <Datepicker
                        controls={['date', 'time']}
                        touchUi={true}
                        theme="ios"
                        value={repeatTill}
                        themeVariant="light"
                        // inputComponent="input"
                        inputProps={{
                            placeholder: 'Repeat till...'
                        }}
                        onChange={(event: any) => {
                            const date = new Date(event.value);
                            const roundOffDate = roundSeconds(date)
                            setRepeatTill(roundOffDate);
                        }}
                        responsive={{
                            xsmall: {
                                controls: ['date', 'time'],
                                display: 'bottom',
                                touchUi: true
                            },
                            // small: {
                            //     controls: ['date', 'time'],
                            //     display: 'anchored',
                            //     touchUi: true
                            // },
                            medium: {
                                controls: ['date', 'time'],
                                display: 'anchored',
                                touchUi: false
                            },
                        }}
                    />
                </View>
                {/* <View
                    style={{
                        width: "100%",
                        flexDirection: "row",
                        marginLeft: 0
                    }}>
                    
                </View> */}
                {/* <View
                    style={{
                        backgroundColor: "#e7ebee",
                        height: 40,
                        marginRight: 10
                    }}>
                    <Datetime
                            value={repeatTill}
                            onChange={(event: any) => {
                                const date = new Date(event);
                                if (date < new Date()) return;

                                setRepeatTill(date);
                            }}
                            isValidDate={disablePastDt}
                    />
                </View> */}
            </View> : null}


        </View>
    )

    const renderMeetingOptions = () => {
        return channelId !== "" || editChannelName !== "" ? (
            <DefaultView style={{ width: "100%", flexDirection: width < 1024 ? "column" : "row", paddingBottom: 15 }}>
                {!editEvent ? <View
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: width < 1024 ? "100%" : "33.33%"
                    }}>
                    <View style={{ width: "100%", paddingTop: width < 1024 ? 40 : 25, paddingBottom: 15, backgroundColor: "#e7ebee" }}>
                        <Text style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#16181C'
                        }}>Lecture</Text>
                    </View>
                    <View
                        style={{
                            height: 40,
                            marginRight: 10
                        }}>
                        <Switch
                            value={isMeeting}
                            onValueChange={() => {
                                setIsMeeting(!isMeeting);
                            }}
                            style={{ height: 20 }}
                            trackColor={{
                                false: "#E7EBEE",
                                true: "#3289d0"
                            }}
                            disabled={editEvent}
                            activeThumbColor="white"
                        />
                    </View>
                </View> : null}
                {/* {isMeeting ? (
                    <View
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            width: width < 1024 ? "100%" : "33.33%"
                        }}>
                        <View style={{ width: "100%", paddingTop: width < 1024 ? 20 : 30, paddingBottom: 15, backgroundColor: "#e7ebee" }}>
                            <Text style={{ fontSize: 11, color: '#343A40', textTransform: 'uppercase', marginBottom: 5 }}>Record Lecture</Text>
                        </View>
                        <Switch
                            value={recordMeeting}
                            onValueChange={() => {
                                setRecordMeeting(!recordMeeting);
                            }}
                            style={{ height: 20 }}
                            trackColor={{
                                false: "#E7EBEE",
                                true: "#343A40"
                            }}
                            activeThumbColor="white"
                        />
                    </View>
                ) : null} */}
            </DefaultView>
        ) : null;
    };

    const renderEditChannelName = () => {

        return editChannelName && (
            <View style={{}}>
                <TouchableOpacity
                    key={Math.random()}
                    disabled={true}
                    // style={styles.allOutline}
                    onPress={() => {
                        return;
                    }}>
                    <Text
                        style={{
                            fontSize: 14,
                            // fontFamily: 'inter',
                            color: '#16181C'
                        }}>
                        Shared with {editChannelName}
                    </Text>
                </TouchableOpacity>
            </View>

        );
    }

    const renderEditEventOptions = () => {

        const { recurringId, start, end, channelId } = editEvent;

        const date = new Date();

        return (<View
            style={{
                flex: 1,
                backgroundColor: "#e7ebee",
                justifyContent: "center",
                display: "flex",
                paddingTop: 30
            }}
        >
            {
                (date > new Date(start) && date < new Date(end)) ?
                    <TouchableOpacity
                        style={{
                            backgroundColor: "#e7ebee",
                            overflow: "hidden",
                            height: 35,
                            marginTop: 15,
                            width: "100%",
                            justifyContent: "center",
                            flexDirection: "row"
                        }}
                        onPress={async () => {

                            const uString: any = await AsyncStorage.getItem("user");

                            const user = JSON.parse(uString)

                            const server = fetchAPI('')
                            server.mutate({
                                mutation: meetingRequest,
                                variables: {
                                    userId: user._id,
                                    channelId,
                                    isOwner: true
                                }
                            }).then(res => {
                                if (res.data && res.data.channel.meetingRequest !== 'error') {
                                    window.open(res.data.channel.meetingRequest, "_blank");
                                } else {
                                    Alert("Classroom not in session. Waiting for instructor.")
                                }
                            }).catch(err => {
                                Alert("Something went wrong.")
                            })
                        }}>
                        <Text
                            style={{
                                textAlign: "center",
                                lineHeight: 35,
                                color: 'white',
                                fontSize: 12,
                                backgroundColor: '#3289d0',
                                paddingHorizontal: 20,
                                fontFamily: "inter",
                                height: 35,
                                width: 200,
                                borderRadius: 15,
                                textTransform: "uppercase"
                            }}>
                            Enter Classroom
                        </Text>
                    </TouchableOpacity>
                    : null
            }
            <TouchableOpacity
                style={{
                    backgroundColor: "#e7ebee",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 15,
                    width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                }}
                onPress={() => {
                    Alert("Update event?", "", [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                return;
                            }
                        },
                        {
                            text: "Yes",
                            onPress: () => {
                                handleEdit()
                            }
                        }
                    ])
                }}
                disabled={isSubmitDisabled || isEditingEvents || isDeletingEvents}>
                <Text
                    style={{
                        textAlign: "center",
                        lineHeight: 35,
                        color: 'white',
                        fontSize: 12,
                        backgroundColor: '#3289d0',
                        paddingHorizontal: 20,
                        fontFamily: "inter",
                        height: 35,
                        borderRadius: 15,
                        textTransform: "uppercase"
                    }}>
                    {isEditingEvents ? "EDITING..." : "EDIT"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    backgroundColor: "#e7ebee",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 15,
                    width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                }}
                onPress={() => {
                    Alert("Delete event?", "", [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                return;
                            }
                        },
                        {
                            text: "Yes",
                            onPress: () => {
                                handleDelete(false)
                            }
                        }
                    ])
                }}
                disabled={isEditingEvents || isDeletingEvents}>
                <Text
                    style={{
                        textAlign: "center",
                        lineHeight: 35,
                        color: "#16181C",
                        fontSize: 12,
                        backgroundColor: "#E7EBEE",
                        paddingHorizontal: 20,
                        fontFamily: "inter",
                        height: 35,
                        borderRadius: 15,
                        textTransform: "uppercase"
                    }}>
                    {isDeletingEvents ? "DELETING..." : "DELETE"}
                </Text>
            </TouchableOpacity>

            {recurringId && recurringId !== "" ? <TouchableOpacity
                style={{
                    backgroundColor: "#e7ebee",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 15,
                    width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                }}
                onPress={() => {
                    Alert("Delete events?", "", [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                return;
                            }
                        },
                        {
                            text: "Yes",
                            onPress: () => {
                                handleDelete(true)
                            }
                        }
                    ])
                }}
                disabled={isEditingEvents || isDeletingEvents}>
                <Text
                    style={{
                        textAlign: "center",
                        lineHeight: 35,
                        color: "#16181C",
                        fontSize: 12,
                        backgroundColor: "#E7EBEE",
                        paddingHorizontal: 20,
                        fontFamily: "inter",
                        height: 35,
                        borderRadius: 15,
                        textTransform: "uppercase"
                    }}>
                    {isDeletingEvents ? "DELETING..." : "DELETE ALL"}
                </Text>
            </TouchableOpacity> : null
            }
        </View>)
    }

    const onChangeVal = useCallback((val: any) => {
        switch (val.value) {
            case tabs[0]:
                setEditEvent(null)
                setTab(tabs[0])
                break;
            case tabs[1]:
                setEditEvent(null)
                setTab(tabs[1])
                break;
            case tabs[2]:
                setEditEvent(null)
                setTab(tabs[2])
                break;
            case tabs[3]:
                setEditEvent(null)
                setTab(tabs[3])
                break;
            default:
                setEditEvent(null)
                setTab(tabs[4])
                break;
        }
    }, [tabs])

    const renderEventContent = ((data: any) => {

        // Add buttons to view event, edit event, join meeting, etc

        const assingmentDue = new Date() > new Date(data.original.start)


        return <React.Fragment>
            <div>{data.title}</div>
            <div className="md-custom-event-cont">
                <div style={{ color: '#343A40', fontSize: 14 }}>{data.original.description}</div>
                {data.original.submitted !== null && userId !== "" && userId !== data.original.createdBy ? (<div><div style={{
                    color: data.original.submitted ? '#35AC78' : (!assingmentDue ? '#3289d0' : '#F94144'),
                    borderRadius: 12,
                    padding: 4,
                    fontSize: 12,
                    borderWidth: 1,
                }}>
                    {data.original.submitted ? "SUBMITTED" : (assingmentDue ? "MISSING" : "PENDING")}
                </div></div>) : null}
                {/* <Button className="md-custom-event-btn" color="secondary" variant="outline" onClick={(domEvent) => add(domEvent, data.original)}>Add participant</Button> */}
            </div>
        </React.Fragment>;
    });

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


    console.log("Tab", tab);

    const renderTabs = (activeTab: any) => {
        return (<View style={{ flexDirection: "column", flex: 1, marginBottom: 20, marginTop: 10, paddingVertical: 10, backgroundColor: '#E7EBEE' }}>
            {
                tab !== 'Add' && tab !== 'Activity' ? null : (
                    tab === 'Activity' ? null :
                        <TouchableOpacity
                            onPress={() => {
                                setEditEvent(null)
                                props.setTab(tabs[0])
                            }}
                            style={{
                                paddingRight: 20,
                                // paddingTop: 5,
                                backgroundColor: '#E7EBEE',
                                alignSelf: 'flex-start'
                            }}
                        >
                            <Text style={{ lineHeight: 27, width: '100%', textAlign: 'center' }}>
                                <Ionicons name='chevron-back-outline' size={30} color={'#343A40'} />
                            </Text>
                        </TouchableOpacity>
                )
            }
            {
                tab !== 'Add' ? <View style={{
                    flexDirection: "row",
                    // marginBottom: 15,
                    paddingTop: 10,
                    backgroundColor: '#E7EBEE',
                    flex: 1, justifyContent: 'center'
                    //paddingVertical: 20 
                }}>
                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            flexDirection: "column",
                            backgroundColor: '#E7EBEE'
                        }}
                        onPress={() => {
                            setTab('Agenda')
                            // const temp = JSON.parse(JSON.stringify(indexMap))
                            // temp[key] = 0
                            // setIndexMap(temp)
                        }}>
                        <Text style={tab === 'Agenda' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name='list-outline' size={18} style={{ marginBottom: 5 }} />
                        </Text>
                        <Text style={tab === 'Agenda' ? styles.allGrayFill1 : styles.all1}>
                            To-do
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            flexDirection: "column",
                            backgroundColor: '#E7EBEE'
                        }}
                        onPress={() => {
                            setTab('Schedule')
                        }}>
                        <Text style={tab === 'Schedule' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name='map-outline' size={18} />
                        </Text>
                        <Text style={tab === 'Schedule' ? styles.allGrayFill1 : styles.all1}>
                            Schedule
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            flexDirection: "column",
                            backgroundColor: '#E7EBEE'
                        }}
                        onPress={() => {
                            setTab('Calendar')
                            // const temp = JSON.parse(JSON.stringify(indexMap))
                            // temp[key] = 2
                            // setIndexMap(temp)
                        }}>
                        <Text style={tab === 'Calendar' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name="calendar-sharp" size={18} />
                        </Text>
                        <Text style={tab === 'Calendar' ? styles.allGrayFill1 : styles.all1}>
                            Planner
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            flexDirection: "column",
                            backgroundColor: '#E7EBEE'
                        }}
                        onPress={() => {
                            setTab('Activity')
                            // const temp = JSON.parse(JSON.stringify(indexMap))
                            // temp[key] = 3
                            // setIndexMap(temp)
                        }}>
                        <Text style={tab === 'Activity' ? styles.allGrayFill1 : styles.all1}>
                            <Ionicons name='notifications-outline' size={18} />
                        </Text>
                        <Text style={tab === 'Activity' ? styles.allGrayFill1 : styles.all1}>
                            Alerts
                        </Text>
                    </TouchableOpacity>
                </View> : null
            }
            {/* {
                tab !== 'Add' ? <label style={{ width: 150, backgroundColor: '#E7EBEE' }}>
                    <Select
                        touchUi={true}
                        themeVariant="light"
                        value={tab}
                        onChange={(val: any) => onChangeVal(val)}
                        responsive={{
                            small: {
                                display: 'bubble'
                            },
                            medium: {
                                touchUi: false,
                            }
                        }}
                        data={tabOptions.map((t: any) => {
                            return {
                                value: t,
                                text: t === 'Agenda' ? 'To-do' : (
                                    t === 'Calendar' ? 'Planner' : t
                                )
                            }
                        })}
                    />

                </label> : null
            } */}
            {/* <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#E7EBEE' }} /> */}
            {/* {
                tab !== 'Add' && tab !== 'Activity' ? <TouchableOpacity
                    onPress={() => {
                        props.setTab(tabs[4])
                    }}
                    disabled={isCreatingEvents}
                    style={{
                        backgroundColor: "#e7ebee",
                        overflow: "hidden",
                        height: 35,
                        marginTop: 5
                        // marginBottom: 20
                    }}>
                    <Text
                        style={{
                            textAlign: "center",
                            lineHeight: 35,
                            color: '#3289d0',
                            fontSize: 12,
                            borderWidth: 1,
                            borderColor: '#3289d0',
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            height: 35,
                            // paddingTop: 2
                            // width: 125,
                            borderRadius: 15,
                            textTransform: "uppercase"
                        }}>
                        ADD
                    </Text>
                </TouchableOpacity> : null
            } */}
            {
                tab === tabs[3] && unreadCount !== 0 ?
                    <TouchableOpacity
                        onPress={async () => {
                            const uString: any = await AsyncStorage.getItem("user");
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
                                            // setChannels(res.data.channel.findByUserId);
                                            console.log("Mark as read", res.data.activity.markActivityAsRead);

                                            server.query({
                                                query: getActivity,
                                                variables: {
                                                    userId: user._id
                                                }
                                            }).then(res => {
                                                if (res.data && res.data.activity.getActivity) {
                                                    const tempActivity = res.data.activity.getActivity.reverse()
                                                    let unread = 0
                                                    tempActivity.map((act: any) => {
                                                        if (act.status === 'unread') {
                                                            unread++
                                                        }
                                                    })
                                                    setUnreadCount(unread)
                                                    setActivity(tempActivity)
                                                }
                                            })

                                        }
                                    })
                                    .catch(err => { });
                            }
                        }}
                        style={{
                            backgroundColor: "#e7ebee",
                            overflow: "hidden",
                            height: 35,
                            marginTop: 20,
                            alignSelf: 'center'
                        }}>
                        <Text
                            style={{
                                textAlign: "center",
                                lineHeight: 35,
                                color: '#3289d0',
                                fontSize: 12,
                                borderWidth: 1,
                                borderColor: '#3289d0',
                                paddingHorizontal: 20,
                                fontFamily: "inter",
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                                textTransform: "uppercase"
                            }}>
                            Mark as Read
                        </Text>
                    </TouchableOpacity>
                    : null
            }
        </View>)
    }

    const channelOptions = [{
        value: 'My Events',
        text: 'My Events'
    }]

    channels.map((channel: any) => {
        channelOptions.push({
            value: channel._id,
            text: channel.name
        })
    })

    return (
        <Animated.View
            style={{
                opacity: modalAnimation,
                width: "100%",
                height: width < 1024 ? Dimensions.get("window").height - 104 : Dimensions.get("window").height - 52,
                backgroundColor: "#e7ebee",
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
                overflow: tab === 'Add' ? 'hidden' : 'scroll',
                maxWidth: 900,
                alignSelf: 'center'
            }}>
            <View style={{
                width: '100%', flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row',
                backgroundColor: '#E7EBEE',
                // paddingTop: 20
            }}>
                <View style={{
                    width: Dimensions.get('window').width < 1024 ? '100%' : '100%',
                    // paddingRight: Dimensions.get('window').width < 1024 ? 0 : 30,
                    borderColor: '#E7EBEE'
                }}>
                    <View
                        style={{
                            width: "100%",
                            // height: 620,
                            // paddingBottom: 20,
                            backgroundColor: "#e7ebee",
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0
                        }}
                    >
                        {loading ? (
                            <View
                                style={{
                                    width: "100%",
                                    flex: 1,
                                    justifyContent: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "#e7ebee",
                                    marginTop: 50,
                                    marginBottom: 50
                                }}>
                                <ActivityIndicator color={"#343A40"} />
                            </View>
                        ) : (
                            <View
                                style={{
                                    backgroundColor: "#e7ebee",
                                    width: "100%",
                                    // height: "100%",
                                    // paddingHorizontal: 20,
                                    borderTopRightRadius: 0,
                                    borderTopLeftRadius: 0
                                }}>

                                {/* {!showAddEvent ? <Calendar
                                    onSelectEvent={(e: any) => onSelectEvent(e)}
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: 550, fontFamily: "overpass", color: "#16181C" }}
                                    components={{
                                        event: EventComponent
                                    }}
                                /> : null} */}
                                {renderTabs(tab)}
                                {
                                    !showAddEvent ?
                                        <View
                                            style={{
                                                borderRadius: 1,
                                                // height: 'auto',
                                                // overflow: 'hidden',
                                                // marginTop: 20,
                                                // borderBottomRightRadius: tab !== 'Add' && tab !== 'Activity' ? 8 : 1,
                                                // borderBottomLeftRadius: tab !== 'Add' && tab !== 'Activity' ? 8 : 1,
                                                marginBottom: Dimensions.get('window').width < 1024 ? 0 : 0,
                                                // borderBottomWidth: tab === 'Add' || tab === 'Activity' ? 0 : 1,
                                                borderWidth: tab !== 'Add' && tab !== 'Activity' ? 1 : 0,
                                                // borderRightWidth: tab === 'Activity' ? 0 : 1,
                                                // borderLeftWidth: tab === 'Activity' ? 0 : 1,
                                                borderColor: '#E7EBEE',
                                                overflow: 'hidden',
                                                // maxHeight: 550,
                                                // height: '100%',
                                                backgroundColor: '#e7ebee',
                                            }}
                                        >
                                            {
                                                tab === tabs[0] ?
                                                    <Eventcalendar
                                                        key={Math.random()}
                                                        view={viewAgenda}
                                                        data={events}
                                                        themeVariant="light"
                                                        // height={}

                                                        onEventClick={onSelectEvent}
                                                        renderEventContent={renderEventContent}
                                                    /> : (
                                                        tab === tabs[1] ?
                                                            <Eventcalendar
                                                                key={Math.random()}
                                                                view={viewSchedule}
                                                                data={events}
                                                                themeVariant="light"
                                                                // height={}
                                                                onEventClick={onSelectEvent}
                                                                renderEventContent={renderEventContent}
                                                            /> : (
                                                                tab === tabs[2] ?
                                                                    <Eventcalendar
                                                                        key={Math.random()}
                                                                        view={viewCalendar}
                                                                        data={events}
                                                                        themeVariant="light"
                                                                        // height={}
                                                                        onEventClick={onSelectEvent}
                                                                        renderEventContent={renderEventContent}
                                                                    /> : (
                                                                        tab === tabs[3] ?
                                                                            <View style={{
                                                                                width: Dimensions.get('window').width < 1024 ? '100%' : '100%',
                                                                                paddingLeft: Dimensions.get('window').width < 1024 ? 0 : 0,
                                                                                paddingTop: Dimensions.get('window').width < 1024 ? 0 : 0,
                                                                            }}>
                                                                                <View>
                                                                                    {
                                                                                        activity.map((act: any, index) => {

                                                                                            const { cueId, channelId, createdBy, target, threadId } = act;

                                                                                            if (props.activityChannelId !== '') {
                                                                                                if (props.activityChannelId !== act.channelId) {
                                                                                                    return
                                                                                                }
                                                                                            }

                                                                                            const date = new Date(act.date)

                                                                                            if (props.filterStart && props.filterEnd) {
                                                                                                const start = new Date(props.filterStart)
                                                                                                if (date < start) {
                                                                                                    return
                                                                                                }
                                                                                                const end = new Date(props.filterEnd)
                                                                                                if (date > end) {
                                                                                                    return
                                                                                                }
                                                                                            }


                                                                                            return <TouchableOpacity
                                                                                                onPress={async () => {
                                                                                                    const uString: any = await AsyncStorage.getItem("user");
                                                                                                    if (uString) {
                                                                                                        const user = JSON.parse(uString);
                                                                                                        const server = fetchAPI("");
                                                                                                        server
                                                                                                            .mutate({
                                                                                                                mutation: markActivityAsRead,
                                                                                                                variables: {
                                                                                                                    activityId: act._id,
                                                                                                                    userId: user._id,
                                                                                                                    markAllRead: false
                                                                                                                }
                                                                                                            })
                                                                                                            .then(res => {
                                                                                                                if (res.data.activity.markActivityAsRead) {
                                                                                                                    // setChannels(res.data.channel.findByUserId);
                                                                                                                    console.log("Mark as read", res.data.activity.markActivityAsRead);
                                                                                                                }
                                                                                                            })
                                                                                                            .catch(err => { });
                                                                                                    }

                                                                                                    // Opens the cue from the activity
                                                                                                    if (cueId !== null && cueId !== "" && channelId !== "" && createdBy !== "" && (target === "CUE")) {
                                                                                                        props.openCueFromCalendar(channelId, cueId, createdBy)
                                                                                                    }

                                                                                                    if (target === "DISCUSSION") {

                                                                                                        if (threadId && threadId !== "") {
                                                                                                            await AsyncStorage.setItem("openThread", threadId)
                                                                                                        }


                                                                                                        props.openDiscussion(channelId)


                                                                                                    }

                                                                                                    if (target === "CHANNEL_SUBSCRIBED" || target === "CHANNEL_MODERATOR_ADDED" || target === "CHANNEL_MODERATOR_REMOVED") {
                                                                                                        props.openChannel(channelId)

                                                                                                    }

                                                                                                    if (target === "Q&A") {

                                                                                                        if (threadId && threadId !== "") {
                                                                                                            await AsyncStorage.setItem("openThread", threadId)
                                                                                                        }

                                                                                                        props.openQA(channelId, cueId, createdBy)
                                                                                                    }

                                                                                                }}
                                                                                                style={{
                                                                                                    backgroundColor: '#fff',
                                                                                                    flexDirection: 'row',
                                                                                                    borderColor: '#c4c4c4',
                                                                                                    // borderRightWidth: 1,
                                                                                                    borderBottomWidth: index === activity.length - 1 ? 0 : 1,
                                                                                                    // minWidth: 600, // flex: 1,
                                                                                                    width: '100%',
                                                                                                    paddingVertical: 5
                                                                                                }}>
                                                                                                <View style={{
                                                                                                    backgroundColor: '#fff',
                                                                                                    padding: 20,
                                                                                                    flexDirection: 'row',
                                                                                                    // width: 125
                                                                                                }}>
                                                                                                    <View style={{
                                                                                                        width: 14,
                                                                                                        height: 14,
                                                                                                        borderRadius: 12,
                                                                                                        // marginRight: 5,
                                                                                                        backgroundColor: act.colorCode
                                                                                                    }} />
                                                                                                </View>
                                                                                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                                                    <Text style={{ fontSize: 15, padding: 5, fontFamily: 'inter', marginTop: 5 }} ellipsizeMode='tail'>
                                                                                                        {act.channelName}
                                                                                                    </Text>
                                                                                                    <Text style={{ fontSize: 12, padding: 5, fontWeight: 'bold' }} ellipsizeMode='tail'>
                                                                                                        {act.title} - {act.subtitle}
                                                                                                    </Text>
                                                                                                </View>
                                                                                                <View style={{ backgroundColor: '#fff', padding: 0, flexDirection: 'row', alignSelf: 'center', paddingRight: 10 }} >
                                                                                                    <Text style={{ fontSize: 13, padding: 5, lineHeight: 13 }} ellipsizeMode='tail'>
                                                                                                        {act.status === 'unread' ?
                                                                                                            <Ionicons name='alert-circle-outline' color='#f94144' size={18} /> : null}
                                                                                                    </Text>
                                                                                                    <Text style={{ fontSize: 12, padding: 5, lineHeight: 13, fontWeight: 'bold' }} ellipsizeMode='tail'>
                                                                                                        {emailTimeDisplay(act.date)}
                                                                                                    </Text>
                                                                                                    <Text style={{ fontSize: 13, padding: 5, lineHeight: 13 }} ellipsizeMode='tail'>
                                                                                                        <Ionicons name='chevron-forward-outline' size={18} color='#3289d0' />
                                                                                                    </Text>
                                                                                                </View>
                                                                                            </TouchableOpacity>
                                                                                        })
                                                                                    }
                                                                                </View>
                                                                            </View> : (
                                                                                <ScrollView
                                                                                    contentContainerStyle={{
                                                                                        maxHeight: width < 1024 ? windowHeight - 104 - 80 : windowHeight - 52 - 80,
                                                                                        alignItems: 'center',
                                                                                    }}
                                                                                >
                                                                                    <View
                                                                                        style={{
                                                                                            width: '100%', maxWidth: 400, alignSelf: 'center'
                                                                                        }}>
                                                                                        <View style={{ width: '100%', maxWidth: 400 }}>
                                                                                            <Text
                                                                                                style={{
                                                                                                    fontSize: 14,
                                                                                                    // fontFamily: 'inter',
                                                                                                    color: '#16181C'
                                                                                                }}>
                                                                                                Name
                                                                                            </Text>
                                                                                            <TextInput
                                                                                                value={title}
                                                                                                placeholder={
                                                                                                    ''
                                                                                                }
                                                                                                onChangeText={val => setTitle(val)}
                                                                                                placeholderTextColor={"#343A40"}
                                                                                                required={true}
                                                                                            />
                                                                                        </View>
                                                                                        <View style={{ width: '100%', maxWidth: 400 }}>
                                                                                            <Text
                                                                                                style={{
                                                                                                    fontSize: 14,
                                                                                                    // fontFamily: 'inter',
                                                                                                    color: '#16181C'
                                                                                                }}>
                                                                                                Description
                                                                                            </Text>
                                                                                            <TextInput
                                                                                                value={description}
                                                                                                placeholder=""
                                                                                                onChangeText={val => setDescription(val)}
                                                                                                placeholderTextColor={"#343A40"}
                                                                                            />
                                                                                        </View>
                                                                                    </View>
                                                                                    {/* Put time here */}
                                                                                    <View style={{ display: 'flex', width: '100%', maxWidth: 400 }} >
                                                                                        <View
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                maxWidth: 400,
                                                                                                paddingVertical: 15
                                                                                            }}>
                                                                                            <Text style={styles.text}>{PreferredLanguageText("start")}</Text>
                                                                                            {/* <DatePicker
                                                                                                appearance={'subtle'}
                                                                                                format="YYYY-MM-DD HH:mm"
                                                                                                preventOverflow={true}
                                                                                                value={start}
                                                                                                onChange={(event: any) => {
                                                                                                    const date = new Date(event);
                                                                                                    const roundOffDate = roundSeconds(date)
                                                                                                    setStart(roundOffDate);
                                                                                                }}
                                                                                                size={'xs'}
                                                                                            /> */}
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
                                                                                                    const roundOffDate = roundSeconds(date)
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
                                                                                                    },
                                                                                                }}
                                                                                            />
                                                                                        </View>
                                                                                        <View
                                                                                            style={{
                                                                                                width: '100%', maxWidth: 400,
                                                                                                paddingVertical: 15
                                                                                            }}>
                                                                                            <Text style={styles.text}>{PreferredLanguageText("end")}</Text>
                                                                                            {/* <DatePicker
                                                                                                format="YYYY-MM-DD HH:mm"
                                                                                                preventOverflow={true}
                                                                                                value={end}
                                                                                                appearance={'subtle'}
                                                                                                onChange={(event: any) => {
                                                                                                    const date = new Date(event);
                                                                                                    const roundOffDate = roundSeconds(date)
                                                                                                    setEnd(roundOffDate);
                                                                                                }}
                                                                                                size={'xs'}
                                                                                            /> */}
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
                                                                                                    const roundOffDate = roundSeconds(date)
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
                                                                                                    },
                                                                                                }}
                                                                                            />
                                                                                        </View>
                                                                                    </View>
                                                                                    <View
                                                                                        style={{
                                                                                            borderColor: "#E7EBEE",
                                                                                            // borderBottomWidth: 1,
                                                                                            paddingTop: 20,
                                                                                            width: '100%', maxWidth: 400
                                                                                        }}>
                                                                                        {channels.length > 0 && !editEvent ? (
                                                                                            <View>
                                                                                                <View
                                                                                                    style={{ width: "100%", paddingBottom: 10, backgroundColor: "#e7ebee" }}>
                                                                                                    <Text
                                                                                                        style={{
                                                                                                            fontSize: 14,
                                                                                                            // fontFamily: 'inter',
                                                                                                            color: '#16181C'
                                                                                                        }}>
                                                                                                        Workspace
                                                                                                    </Text>
                                                                                                </View>
                                                                                                <View style={{ flexDirection: 'row', display: 'flex', backgroundColor: '#e7ebee' }}>
                                                                                                    {/* <Menu
                                                                                                        onSelect={(channelId: any) => {
                                                                                                            setChannelId(channelId)
                                                                                                        }}>
                                                                                                        <MenuTrigger>
                                                                                                            <Text style={{ fontSize: 14, color: '#16181C' }}>
                                                                                                                {eventForChannelName}<Ionicons name='chevron-down-outline' size={15} />
                                                                                                            </Text>
                                                                                                        </MenuTrigger>
                                                                                                        <MenuOptions customStyles={{
                                                                                                            optionsContainer: {
                                                                                                                padding: 10,
                                                                                                                borderRadius: 15,
                                                                                                                shadowOpacity: 0,
                                                                                                                borderWidth: 1,
                                                                                                                borderColor: '#E7EBEE'
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
                                                                                                    <label style={{
                                                                                                        width: '100%', maxWidth: 400, backgroundColor: props.option === 'To Do' ? '#e7ebee' : '#fff',
                                                                                                    }}>
                                                                                                        <Select
                                                                                                            touchUi={true}
                                                                                                            themeVariant="light"
                                                                                                            value={selectedChannel}
                                                                                                            onChange={(val: any) => {

                                                                                                                setSelectedChannel(val.value);

                                                                                                                if (val.value === "My Events") {
                                                                                                                    setChannelId('')
                                                                                                                } else {
                                                                                                                    setChannelId(val.value)
                                                                                                                }
                                                                                                            }}
                                                                                                            responsive={{
                                                                                                                small: {
                                                                                                                    display: 'bubble'
                                                                                                                },
                                                                                                                medium: {
                                                                                                                    touchUi: false,
                                                                                                                }
                                                                                                            }}
                                                                                                            style={{
                                                                                                                backgroundColor: '#e7ebee',
                                                                                                            }}
                                                                                                            data={channelOptions}
                                                                                                        />
                                                                                                    </label>
                                                                                                </View>
                                                                                            </View>
                                                                                        ) : null}
                                                                                        {renderEditChannelName()}
                                                                                        {!editEvent && renderRecurringOptions()}
                                                                                        {renderMeetingOptions()}
                                                                                        {channelId !== "" && <Text style={{ fontSize: 11, color: '#16181C', textTransform: 'uppercase', lineHeight: 20 }}>
                                                                                            Attendances will only be captured for scheduled lectures.
                                                                                        </Text>}
                                                                                        {tab === 'Add' && !editEvent ? <View
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                flexDirection: "row",
                                                                                                display: "flex",
                                                                                                marginBottom: 10,
                                                                                                paddingBottom: 25,
                                                                                                // paddingLeft: 7
                                                                                                justifyContent: 'center'
                                                                                            }}>
                                                                                            <TouchableOpacity
                                                                                                style={{
                                                                                                    backgroundColor: "#e7ebee",
                                                                                                    overflow: "hidden",
                                                                                                    height: 35,
                                                                                                    marginTop: 35
                                                                                                    // marginBottom: 20
                                                                                                }}
                                                                                                onPress={() => handleCreate()}
                                                                                                disabled={isCreatingEvents}>
                                                                                                <Text
                                                                                                    style={{
                                                                                                        textAlign: "center",
                                                                                                        lineHeight: 35,
                                                                                                        color: 'white',
                                                                                                        fontSize: 12,
                                                                                                        backgroundColor: '#3289d0',
                                                                                                        paddingHorizontal: 20,
                                                                                                        fontFamily: "inter",
                                                                                                        height: 35,
                                                                                                        // width: 125,
                                                                                                        borderRadius: 15,
                                                                                                        textTransform: "uppercase"
                                                                                                    }}>
                                                                                                    {isCreatingEvents ? "..." : "ADD"}
                                                                                                </Text>
                                                                                            </TouchableOpacity>
                                                                                        </View> : null}
                                                                                        {editEvent ? renderEditEventOptions() : null}
                                                                                        {/* {editEvent ? renderDeleteEventOptions() : null} */}
                                                                                    </View>
                                                                                </ScrollView>
                                                                            )
                                                                    )
                                                            )
                                                    )
                                            }
                                        </View>
                                        : null
                                }
                            </View>
                        )}
                        {/* TEMPORARILY HIDDEN */}
                        <View style={{ backgroundColor: "#e7ebee", display: 'none' }}>
                            <View style={{ flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', flex: 1, paddingTop: 40 }}>
                                <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        marginRight: 10,
                                        color: '#16181C',
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
                                    borderColor: '#E7EBEE',
                                    marginBottom: 25,
                                }}
                                height="450"
                                src="https://www.youtube.com/embed/live_stream?channel=UC-Tkz11V97prOm8hJTSRMHw"
                                frameBorder="0"
                                allowFullScreen={true}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View >
    );
};

export default (CalendarX)

const styles: any = StyleSheet.create({
    input: {
        width: "100%",
        borderBottomColor: "#E7EBEE",
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20
    },
    text: {
        fontSize: 14,
        // fontFamily: 'inter',
        color: '#16181C',
        marginBottom: 10
    },
    allBlack: {
        fontSize: 12,
        color: "#16181C",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "#e7ebee"
    },
    all1: {
        fontSize: 10,
        color: '#343A40',
        height: 20,
        // fontWeight: 'bold',
        paddingHorizontal: 7,
        backgroundColor: '#E7EBEE',
        // textTransform: 'uppercase',
        lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center'
    },
    allGrayFill1: {
        fontSize: 10,
        color: '#3289d0',
        height: 20,
        // borderRadius: 15,
        // fontWeight: 'bold',
        paddingHorizontal: 7,
        // backgroundColor: '#3289d0',
        // textTransform: 'uppercase',
        lineHeight: 20,
        fontFamily: 'inter',
        textAlign: 'center'
    },
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: '#e7ebee'
    },
    allOutline: {
        fontSize: 12,
        color: "#FFF",
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 1,
        backgroundColor: "#16181C"
    },
    picker: {
        display: "flex",
        justifyContent: "flex-start",
        backgroundColor: "#e7ebee",
        overflow: "hidden",
        fontSize: 12,
        textAlign: "center",
        borderWidth: 1,
        width: 150,
        height: 20,
        alignSelf: "center",
        marginTop: 0,
        borderRadius: 3
    }
});
