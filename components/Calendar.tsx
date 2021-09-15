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
import { DatePicker } from 'rsuite';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import ActivityCard from "./ActivityCard";
import { Eventcalendar } from "@mobiscroll/react";
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
// Try New Calendar
// import Scheduler, {SchedulerData, ViewTypes, DATE_FORMAT} from 'react-big-scheduler'
// import 'react-big-scheduler/lib/css/style.css';

const CalendarX: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
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
    const [filterByLectures, setFilterByLectures] = useState(false);
    const [filterEventsType, setFilterEventsType] = useState('All');
    const [filterByChannel, setFilterByChannel] = useState("All");
    const [filterActivityByChannel, setFilterActivityByChannel] = useState("All");
    const [activityChannelId, setActivityChannelId] = useState<any>('')

    const [timeChoice, setTimeChoice] = useState('week')

    const view: any = React.useMemo(() => {
        if (calendarChoice === 'Calendar') {
            return {
                calendar: { type: 'month' },
            };
        }
        if (calendarChoice === 'Schedule') {
            return {
                schedule: { type: 'week' },
            };
        }
        if (calendarChoice === 'Agenda') {
            return {
                agenda: { type: 'week' },
            };
        }
    }, [calendarChoice]);

    // const [viewModel, setViewModel] = useState<any>(new SchedulerData(new moment().format(DATE_FORMAT), ViewTypes.Week))

    const [school, setSchool] = useState<any>({})

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

        return <span style={{ color: colorCode, backgroundColor: '#f5f5f7', borderRadius: 1, padding: 20, overflow: 'hidden' }}>{event.title}</span>

    }

    const [activity, setActivity] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState<any>(0)

    useEffect(() => {
        (
            async () => {

                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
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
        if (filterEventsType === "Lectures") {
            total = total.filter((e: any) => e.meeting)
        } else if (filterEventsType === "Submissions") {
            total = total.filter((e: any) => e.cueId !== "");
        } else if (filterEventsType === "Events") {
            total = total.filter((e: any) => e.cueId === "" && !e.meeting);
        }

        if (props.filterEnd && props.filterStart) {
            const end = new Date(props.filterEnd)
            total = total.filter((e: any) => {
                const date = new Date(e.end)
                return date < end
            })
            const start = new Date(props.filterStart)
            total = total.filter((e: any) => {
                const date = new Date(e.start)
                return date > start
            })
        }

        if (filterByChannel === "All") {
            setEvents(total);
        } else {
            const all = [...total];
            const filter = all.filter((e: any) => filterByChannel === (e.channelName));
            setEvents(filter)
        }

    }, [filterByChannel, filterEventsType, props.filterStart, props.filterEnd])

    const renderFilterEvents = () => {

        return (<View style={{
            marginTop: 0,
            flexDirection: 'row',
            // paddingTop: width < 768 ? 20 : 0
            // borderWidth: 1,
            // alignSelf: 'flex-start',
            // flex: 1
        }} key={JSON.stringify(eventChannels)}>
            <View style={{ paddingRight: 40 }}>
                <View style={{ backgroundColor: '#fff' }}>
                    <View style={{}}>
                        <Menu
                            onSelect={(choice: any) => {
                                setCalendarChoice(choice)
                            }}>
                            <MenuTrigger>
                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#1D1D20' }}>
                                    {calendarChoice}<Ionicons name='caret-down' size={14} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#f5f5f7',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}>

                                <MenuOption
                                    value={'Agenda'}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <Text style={{ marginLeft: 5 }}>
                                            Agenda
                                        </Text>
                                    </View>
                                </MenuOption>
                                <MenuOption
                                    value={'Schedule'}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <Text style={{ marginLeft: 5 }}>
                                            Schedule
                                        </Text>
                                    </View>
                                </MenuOption>
                                <MenuOption
                                    value={'Calendar'}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <Text style={{ marginLeft: 5 }}>
                                            Calendar
                                        </Text>
                                    </View>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                        <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7 }}>
                            View
                        </Text>
                    </View>
                </View>
            </View>
            <View style={{ paddingRight: 40 }}>
                <View style={{ backgroundColor: '#fff' }}>
                    <View style={{ flexDirection: 'row', display: 'flex', backgroundColor: '#fff' }}>
                        <Menu
                            onSelect={(channel: any) => {
                                if (channel === "All") {
                                    setFilterByChannel("All")
                                } else if (channel === "My Cues") {
                                    setFilterByChannel("My Cues")
                                } else {
                                    setFilterByChannel(channel.channelName);
                                }
                            }}>
                            <MenuTrigger>
                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#1D1D20' }}>
                                    {filterByChannel}<Ionicons name='caret-down' size={14} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#f5f5f7',
                                    overflow: 'scroll',
                                    maxHeight: '100%'
                                }
                            }}>
                                <MenuOption
                                    value={'All'}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <View style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 1,
                                            marginTop: 1,
                                            backgroundColor: "#fff"
                                        }} />
                                        <Text style={{ marginLeft: 5 }}>
                                            All
                                        </Text>
                                    </View>
                                </MenuOption>
                                <MenuOption
                                    value={'My Cues'}>
                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                        <View style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 1,
                                            marginTop: 1,
                                            backgroundColor: "#000"
                                        }} />
                                        <Text style={{ marginLeft: 5 }}>
                                            My Cues
                                        </Text>
                                    </View>
                                </MenuOption>
                                {
                                    props.subscriptions.map((subscription: any) => {
                                        return <MenuOption
                                            value={subscription}>
                                            <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 1,
                                                    marginTop: 1,
                                                    backgroundColor: subscription.colorCode
                                                }} />
                                                <Text style={{ marginLeft: 5 }}>
                                                    {subscription.channelName}
                                                </Text>
                                            </View>
                                        </MenuOption>
                                    })
                                }
                            </MenuOptions>
                        </Menu>
                    </View>
                    <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7 }}>
                        Channel
                    </Text>
                </View>
            </View>
            <View>
                <View style={{ backgroundColor: '#fff' }}>
                    <View style={{}}>
                        <Menu
                            onSelect={(choice: any) => {
                                setFilterEventsType(choice);
                            }}>
                            <MenuTrigger>
                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#1D1D20' }}>
                                    {filterEventsType}<Ionicons name='caret-down' size={14} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#f5f5f7',
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
                        <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7 }}>
                            Type
                        </Text>
                    </View>
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

    console.log("Is meeting", isMeeting)

    const handleCreate = useCallback(async () => {
        if (start < new Date()) {
            Alert("Event must be set in the future.");
            return;
        } else if (title === "") {
            Alert("New Event/Lecture cannot be empty.");
            return;
        } else if (start > end) {
            Alert("End time must be greater than start time.");
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
                setIsEditingEvents(false);
                setEditEvent(null)
                setShowAddEvent(false)

            })
            .catch(err => {
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
                const updated = new Date();
                loadEvents();
                setTitle("");
                setRepeatTill(new Date())
                setIsMeeting(false);
                setDescription("");
                setFrequency("1-W");
                setRecurring(false);
                setRecordMeeting(false);
                setIsDeletingEvents(false);
                setEditEvent(null)
                setShowAddEvent(false)
            })
            .catch(err => {
                setIsDeletingEvents(false);
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
                            end: new Date(e.end),
                            dateId: e.dateId,
                            description: e.description,
                            createdBy: e.createdBy,
                            channelName: e.channelName,
                            recurringId: e.recurringId,
                            recordMeeting: e.recordMeeting ? true : false,
                            meeting: e.meeting,
                            channelId: e.channelId,
                            cueId: e.cueId,
                            color: colorCode
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
                setShowAddEvent(true)

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
        width < 1024 ? Dimensions.get("window").height - 30 : Dimensions.get("window").height;

    const f: any = eventFrequencyOptions.find((item) => {
        return item.value === frequency
    })
    const freq = f.label

    const renderRecurringOptions = () => (
        <View style={{}}>
            <View style={{ width: 300, display: "flex" }}>
                <View style={{ width: "100%", paddingTop: width < 768 ? 40 : 40, paddingBottom: 15, backgroundColor: "white" }}>
                    <Text style={{
                        fontSize: 15,
                        fontFamily: 'inter',
                        color: '#1D1D20'
                    }}>Recurring</Text>
                </View>
                <View
                    style={{
                        backgroundColor: "white",
                        height: 40,
                        marginRight: 10,
                        paddingLeft: 5
                    }}>
                    <Switch
                        value={recurring}
                        onValueChange={() => setRecurring(!recurring)}
                        style={{ height: 20 }}
                        trackColor={{
                            false: "#f5f5f7",
                            true: "#661CB0"
                        }}
                        activeThumbColor="white"
                    />
                </View>
            </View>

            {recurring ? <View style={{ width: 300, display: "flex" }}>
                <View style={{ width: "100%", paddingTop: width < 768 ? 20 : 40, paddingBottom: 15, backgroundColor: "white" }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            color: '#1D1D20'
                        }}>
                        Repeat every
                    </Text>
                </View>
                <View
                    style={{
                        width: "100%",
                        flexDirection: "row",
                        marginLeft: 0
                    }}>
                    <Menu
                        onSelect={(itemValue: any) => {
                            setFrequency(itemValue)
                        }}>
                        <MenuTrigger>
                            <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#1D1D20' }}>
                                {freq}<Ionicons name='caret-down' size={14} />
                            </Text>
                        </MenuTrigger>
                        <MenuOptions customStyles={{
                            optionsContainer: {
                                padding: 10,
                                borderRadius: 15,
                                shadowOpacity: 0,
                                borderWidth: 1,
                                borderColor: '#f5f5f7'
                            }
                        }}>
                            {eventFrequencyOptions.map((item: any, index: number) => {
                                return (
                                    <MenuOption
                                        value={item.value}>
                                        <View style={{ display: 'flex', flexDirection: 'row', }}>
                                            <Text style={{ marginLeft: 5 }}>
                                                {item.label}
                                            </Text>
                                        </View>
                                    </MenuOption>
                                );
                            })}
                        </MenuOptions>
                    </Menu>
                </View>
            </View> : null}

            {recurring ? <View style={{ width: 300, display: "flex" }}>
                <View style={{ width: "100%", paddingTop: width < 768 ? 20 : 40, paddingBottom: 15, backgroundColor: "white" }}>
                    <Text style={{
                        fontSize: 15,
                        fontFamily: 'inter',
                        color: '#1D1D20'
                    }}>Repeat until</Text>
                </View>
                <View
                    style={{
                        width: "100%",
                        flexDirection: "row",
                        marginLeft: 0
                    }}>
                    <DatePicker
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
                    />
                </View>
                {/* <View
                    style={{
                        backgroundColor: "white",
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
            <DefaultView style={{ width: "100%", flexDirection: width < 768 ? "column" : "row", paddingBottom: 15 }}>
                {!editEvent ? <View
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: width < 768 ? "100%" : "33.33%"
                    }}>
                    <View style={{ width: "100%", paddingTop: width < 768 ? 40 : 30, paddingBottom: 15, backgroundColor: "white" }}>
                        <Text style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            color: '#1D1D20'
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
                                false: "#f5f5f7",
                                true: "#661CB0"
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
                            width: width < 768 ? "100%" : "33.33%"
                        }}>
                        <View style={{ width: "100%", paddingTop: width < 768 ? 20 : 30, paddingBottom: 15, backgroundColor: "white" }}>
                            <Text style={{ fontSize: 11, color: '#818385', textTransform: 'uppercase', marginBottom: 5 }}>Record Lecture</Text>
                        </View>
                        <Switch
                            value={recordMeeting}
                            onValueChange={() => {
                                setRecordMeeting(!recordMeeting);
                            }}
                            style={{ height: 20 }}
                            trackColor={{
                                false: "#f5f5f7",
                                true: "#818385"
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
            <View style={{ maxWidth: width < 768 ? "100%" : "33%" }}>
                <TouchableOpacity
                    key={Math.random()}
                    disabled={true}
                    // style={styles.allOutline}
                    onPress={() => {
                        return;
                    }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'inter',
                            color: '#1D1D20'
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
                backgroundColor: "white",
                justifyContent: "center",
                display: "flex",
                paddingTop: 30
            }}
        >
            {
                (date > new Date(start) && date < new Date(end)) ?
                    <TouchableOpacity
                        style={{
                            backgroundColor: "white",
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
                                backgroundColor: '#661CB0',
                                paddingHorizontal: 25,
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
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 15,
                    width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                }}
                onPress={() => handleEdit()}
                disabled={isSubmitDisabled || isEditingEvents || isDeletingEvents}>
                <Text
                    style={{
                        textAlign: "center",
                        lineHeight: 35,
                        color: 'white',
                        fontSize: 12,
                        backgroundColor: '#661CB0',
                        paddingHorizontal: 25,
                        fontFamily: "inter",
                        height: 35,
                        width: 200,
                        borderRadius: 15,
                        textTransform: "uppercase"
                    }}>
                    {isEditingEvents ? "EDITING..." : "EDIT"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 15,
                    width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                }}
                onPress={() => handleDelete(false)}
                disabled={isEditingEvents || isDeletingEvents}>
                <Text
                    style={{
                        textAlign: "center",
                        lineHeight: 35,
                        color: "#1D1D20",
                        fontSize: 12,
                        backgroundColor: "#f5f5f7",
                        paddingHorizontal: 25,
                        fontFamily: "inter",
                        height: 35,
                        width: 200,
                        borderRadius: 15,
                        textTransform: "uppercase"
                    }}>
                    {isDeletingEvents ? "DELETING..." : "DELETE"}
                </Text>
            </TouchableOpacity>

            {recurringId && recurringId !== "" ? <TouchableOpacity
                style={{
                    backgroundColor: "white",
                    overflow: "hidden",
                    height: 35,
                    marginTop: 15,
                    width: "100%",
                    justifyContent: "center",
                    flexDirection: "row"
                }}
                onPress={() => handleDelete(true)}
                disabled={isEditingEvents || isDeletingEvents}>
                <Text
                    style={{
                        textAlign: "center",
                        lineHeight: 35,
                        color: "#1D1D20",
                        fontSize: 12,
                        backgroundColor: "#f5f5f7",
                        paddingHorizontal: 25,
                        fontFamily: "inter",
                        height: 35,
                        width: 200,
                        borderRadius: 15,
                        textTransform: "uppercase"
                    }}>
                    {isDeletingEvents ? "DELETING..." : "DELETE ALL"}
                </Text>
            </TouchableOpacity> : null
            }
        </View>)
    }

    const renderEventContent = ((data: any) => {

        // Add buttons to view event, edit event, join meeting, etc

        console.log("Event", data);

        return <React.Fragment>
            <div>{data.title}</div>
            <div className="md-custom-event-cont">
                <div style={{ color: '#818385', fontSize: 14 }}>{data.original.description}</div>
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


    let eventForChannelName = ''

    if (channelId === "") {
        eventForChannelName = "My Cues"
    } else {
        const filter = channels.filter((channel: any) => {
            return channel._id === channelId
        })

        eventForChannelName = filter[0].name
    }

    return (
        <Animated.View
            style={{
                opacity: modalAnimation,
                width: "100%",
                // height: windowHeight - 85,
                backgroundColor: "white",
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
                overflow: 'hidden'
            }}>
            <View style={{
                width: '100%', flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                paddingTop: 30
            }}>
                <View style={{
                    width: Dimensions.get('window').width < 768 ? '100%' : '50%',
                    paddingRight: Dimensions.get('window').width < 768 ? 0 : 30,
                    borderRightWidth: Dimensions.get('window').width < 768 ? 0 : 1,
                    borderColor: '#f5f5f7'
                }}>
                    <ScrollView
                        style={{
                            width: "100%",
                            height: windowHeight - (Dimensions.get('window').width < 768 ? 225 : 125),
                            backgroundColor: "white",
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0
                        }}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={true}
                        scrollEventThrottle={1}
                        keyboardDismissMode={"on-drag"}
                        overScrollMode={"never"}
                        nestedScrollEnabled={true}>
                        <View style={{ backgroundColor: "white", flexDirection: "row" }}>
                            <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1 }}>
                                <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        marginRight: 10,
                                        color: '#1D1D20',
                                        fontSize: 24,
                                        paddingBottom: 20,
                                        fontFamily: 'inter',
                                        flex: 1,
                                        flexDirection: 'row',
                                        lineHeight: 25,
                                        height: 65
                                    }}>
                                    {PreferredLanguageText("planner")}
                                </Text>
                                {/* {!showAddEvent && width >= 768 ? renderFilterEvents() : null} */}
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                {!showAddEvent ? renderFilterEvents() : null}
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    setEditEvent(null)
                                    setShowAddEvent(!showAddEvent)
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    marginLeft: 20,
                                    // marginTop: 15,
                                    justifyContent: 'center',
                                    flexDirection: 'row'
                                }}>
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 30,
                                    color: showAddEvent ? '#1D1D20' : '#fff',
                                    fontSize: 12,
                                    backgroundColor: showAddEvent ? '#f5f5f7' : '#4b956b',
                                    paddingHorizontal: 25,
                                    fontFamily: 'inter',
                                    height: 30,
                                    // width: 100,
                                    borderRadius: 15,
                                    textTransform: 'uppercase'
                                }}>
                                    {!showAddEvent ? null : <Ionicons name='arrow-back-outline' size={12} />} {showAddEvent ? PreferredLanguageText("back") : PreferredLanguageText("add")} {showAddEvent ? null : <Ionicons name='add-outline' size={12} />}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {loading ? (
                            <View
                                style={{
                                    width: "100%",
                                    flex: 1,
                                    justifyContent: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "white",
                                    marginTop: 50,
                                    marginBottom: 50
                                }}>
                                <ActivityIndicator color={"#818385"} />
                            </View>
                        ) : (
                            <View
                                style={{
                                    backgroundColor: "white",
                                    width: "100%",
                                    // height: "100%",
                                    // paddingHorizontal: 20,
                                    borderTopRightRadius: 0,
                                    borderTopLeftRadius: 0
                                }}>
                                {showAddEvent ? (
                                    <View>
                                        <View
                                            style={{
                                                flexDirection: "column"
                                            }}>
                                            <View style={{ width: 300 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        fontFamily: 'inter',
                                                        color: '#1D1D20'
                                                    }}>
                                                    Event
                                                </Text>
                                                <TextInput
                                                    value={title}
                                                    placeholder={
                                                        ''
                                                    }
                                                    onChangeText={val => setTitle(val)}
                                                    placeholderTextColor={"#818385"}
                                                    required={true}
                                                />
                                            </View>
                                            <View style={{ width: 300 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        fontFamily: 'inter',
                                                        color: '#1D1D20'
                                                    }}>
                                                    Description
                                                </Text>
                                                <TextInput
                                                    value={description}
                                                    placeholder=""
                                                    onChangeText={val => setDescription(val)}
                                                    placeholderTextColor={"#818385"}
                                                />
                                            </View>
                                        </View>
                                        {/* Put time here */}
                                        <View style={{ display: 'flex', width: "100%", }} >
                                            <View
                                                style={{
                                                    width: 200,
                                                    // flexDirection: "row",
                                                    // marginTop: 12,
                                                    paddingVertical: 15
                                                    // alignItems: 'center'
                                                }}>
                                                <Text style={styles.text}>{PreferredLanguageText("start")}</Text>
                                                <DatePicker
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
                                                />
                                            </View>
                                            <View
                                                style={{
                                                    width: 200,
                                                    // marginTop: 12,
                                                    paddingVertical: 15
                                                    // alignItems: 'center',
                                                    // marginLeft: width < 768 ? 0 : 30
                                                }}>
                                                <Text style={styles.text}>{PreferredLanguageText("end")}</Text>
                                                <DatePicker
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
                                                />
                                            </View>
                                        </View>
                                        <View
                                            style={{
                                                marginBottom: 20,
                                                borderColor: "#f5f5f7",
                                                // borderBottomWidth: 1,
                                                paddingTop: 20
                                            }}>
                                            {channels.length > 0 && !editEvent ? (
                                                <View>
                                                    <View
                                                        style={{ width: "100%", paddingBottom: 20, backgroundColor: "white" }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                fontFamily: 'inter',
                                                                color: '#1D1D20'
                                                            }}>
                                                            Channel
                                                        </Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', display: 'flex', backgroundColor: '#fff' }}>
                                                        <Menu
                                                            onSelect={(channelId: any) => {
                                                                setChannelId(channelId)
                                                            }}>
                                                            <MenuTrigger>
                                                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#1D1D20' }}>
                                                                    {eventForChannelName}<Ionicons name='caret-down' size={14} />
                                                                </Text>
                                                            </MenuTrigger>
                                                            <MenuOptions customStyles={{
                                                                optionsContainer: {
                                                                    padding: 10,
                                                                    borderRadius: 15,
                                                                    shadowOpacity: 0,
                                                                    borderWidth: 1,
                                                                    borderColor: '#f5f5f7'
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
                                                        </Menu>
                                                    </View>
                                                </View>
                                            ) : null}
                                            {renderEditChannelName()}
                                            {!editEvent && renderRecurringOptions()}
                                            {renderMeetingOptions()}
                                            {channelId !== "" && <Text style={{ fontSize: 11, color: '#1D1D20', textTransform: 'uppercase', paddingTop: 10 }}>
                                                Attendances will only be captured for scheduled lectures.
                                            </Text>}
                                            {!editEvent ? <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: "row",
                                                    display: "flex",
                                                    marginBottom: 10,
                                                    // paddingLeft: 7
                                                    justifyContent: 'center'
                                                }}>
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: "white",
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
                                                            backgroundColor: '#661CB0',
                                                            paddingHorizontal: 25,
                                                            fontFamily: "inter",
                                                            height: 35,
                                                            // width: 125,
                                                            borderRadius: 15,
                                                            textTransform: "uppercase"
                                                        }}>
                                                        {isCreatingEvents ? "ADDING..." : "ADD"} <Ionicons name='add-outline' size={12} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View> : null}
                                            {editEvent ? renderEditEventOptions() : null}
                                            {/* {editEvent ? renderDeleteEventOptions() : null} */}
                                        </View>
                                    </View>
                                ) : null}
                                {/* {!showAddEvent ? <Calendar
                                    onSelectEvent={(e: any) => onSelectEvent(e)}
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: 500, fontFamily: "overpass", color: "#1D1D20" }}
                                    components={{
                                        event: EventComponent
                                    }}
                                /> : null} */}
                                {
                                    !showAddEvent ?
                                        <View
                                            style={{
                                                borderRadius: 1,
                                                height: 'auto',
                                                overflow: 'hidden',
                                                marginTop: 20,
                                                marginBottom: Dimensions.get('window').width < 768 ? 20 : 0,
                                                borderWidth: 1,
                                                borderColor: '#f5f5f7'
                                            }}
                                        >
                                            <Eventcalendar
                                                key={Math.random()}
                                                view={view}
                                                data={events}
                                                themeVariant="light"
                                                height={425}
                                                onEventClick={onSelectEvent}
                                                renderEventContent={renderEventContent}
                                            />
                                        </View>
                                        : null
                                }
                            </View>
                        )}
                        {/* TEMPORARILY HIDDEN */}
                        <View style={{ backgroundColor: "white", display: 'none' }}>
                            <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1, paddingTop: 40 }}>
                                <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        marginRight: 10,
                                        color: '#1D1D20',
                                        fontSize: 24,
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
                                    borderColor: '#f5f5f7',
                                    marginBottom: 25,
                                }}
                                height="450"
                                src="https://www.youtube.com/embed/live_stream?channel=UC-Tkz11V97prOm8hJTSRMHw"
                                frameBorder="0"
                                allowFullScreen={true}
                            />
                        </View>
                    </ScrollView>
                </View>
                <View style={{
                    width: Dimensions.get('window').width < 768 ? '100%' : '50%',
                    paddingLeft: Dimensions.get('window').width < 768 ? 0 : 30,
                    paddingTop: Dimensions.get('window').width < 768 ? 30 : 0
                }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{
                            marginRight: 10,
                            color: '#1D1D20',
                            fontSize: 24,
                            paddingBottom: 20,
                            fontFamily: 'inter',
                            // flex: 1,
                            flexDirection: 'row',
                            lineHeight: 25,
                            height: 50
                        }}>
                            Activity
                        </Text>
                        {/* <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
                            {
                                unreadCount !== 0 ?
                                    <Text style={{
                                        width: 32,
                                        height: 32,
                                        // flex: 1,
                                        borderRadius: 25,
                                        backgroundColor: '#f94144',
                                        textAlign: 'center',
                                        zIndex: 150,
                                        marginLeft: 10,
                                        fontFamily: 'inter',
                                        // marginTop: -4,
                                        color: 'white', lineHeight: 32, fontSize: 10
                                    }}>
                                        {unreadCount}
                                    </Text> : null
                            }
                        </View> */}
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 35, marginTop: 15, flex: 1 }}>
                        <View style={{ backgroundColor: '#fff' }}>
                            <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                                <Menu
                                    onSelect={(channel: any) => {
                                        if (channel === "All") {
                                            setFilterActivityByChannel("All")
                                            setActivityChannelId('')
                                        } else {
                                            setFilterActivityByChannel(channel.channelName);
                                            setActivityChannelId(channel.channelId)
                                        }
                                    }}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#1D1D20', textAlign: 'center' }}>
                                            {filterActivityByChannel}<Ionicons name='caret-down' size={14} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#f5f5f7',
                                            overflow: 'scroll',
                                            maxHeight: '100%'
                                        }
                                    }}>
                                        <MenuOption
                                            value={'All'}>
                                            <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                <View style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 1,
                                                    marginTop: 1,
                                                    backgroundColor: "#fff"
                                                }} />
                                                <Text style={{ marginLeft: 5 }}>
                                                    All
                                                </Text>
                                            </View>
                                        </MenuOption>
                                        {
                                            props.subscriptions.map((subscription: any) => {
                                                return <MenuOption
                                                    value={subscription}>
                                                    <View style={{ display: 'flex', flexDirection: 'row', }}>
                                                        <View style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 12,
                                                            marginTop: 1,
                                                            backgroundColor: subscription.colorCode
                                                        }} />
                                                        <Text style={{ marginLeft: 5 }}>
                                                            {subscription.channelName}
                                                        </Text>
                                                    </View>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            </View>
                            <Text style={{ fontSize: 10, color: '#1D1D20', paddingTop: 7 }}>
                                Channel
                            </Text>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                            {unreadCount !== 0 ?
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
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        // marginTop: 15,
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}>
                                    <Text style={{
                                        textAlign: 'center',
                                        lineHeight: 30,
                                        color: unreadCount === 0 ? '#1D1D20' : '#fff',
                                        fontSize: 12,
                                        backgroundColor: unreadCount === 0 ? '#f5f5f7' : '#4b956b',
                                        paddingHorizontal: 20,
                                        fontFamily: 'inter',
                                        height: 30,
                                        // width: 100,
                                        borderRadius: 15,
                                        textTransform: 'uppercase'
                                    }}>
                                        Read all {<Ionicons name='checkmark-done-outline' size={12} />}
                                    </Text>
                                </TouchableOpacity>
                                : null}
                        </View>
                    </View>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        horizontal={false}
                        // style={{ height: '100%' }}
                        contentContainerStyle={{
                            borderWidth: activity.length === 0 ? 0 : 1,
                            width: '100%',
                            // height: windowHeight - 100,
                            borderRadius: 1,
                            overflow: 'hidden',
                            borderColor: '#f5f5f7'
                        }}
                    >
                        {
                            activity.map((act: any, index) => {

                                const { cueId, channelId, createdBy, target } = act;

                                if (activityChannelId !== '') {
                                    if (activityChannelId !== act.channelId) {
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
                                            props.openDiscussion(channelId, createdBy)
                                        }

                                        if (target === "CHANNEL_SUBSCRIBED" || target === "CHANNEL_MODERATOR_ADDED" || target === "CHANNEL_MODERATOR_REMOVED") {
                                            props.openChannel(channelId, createdBy)
                                        }

                                        if (target === "Q&A") {
                                            props.openQA(channelId, cueId, createdBy)
                                        }

                                    }}
                                    style={{
                                        backgroundColor: '#f5f5f7',
                                        flexDirection: 'row',
                                        borderColor: '#f5f5f7',
                                        borderBottomWidth: index === activity.length - 1 ? 0 : 1,
                                        minWidth: 600, // flex: 1,
                                        width: '100%'
                                    }}>
                                    <View style={{ flex: 1, backgroundColor: '#f5f5f7', padding: 0, flexDirection: 'column', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 12, padding: 10, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                            <View style={{
                                                width: 9,
                                                height: 9,
                                                borderRadius: 12,
                                                marginRight: 5,
                                                // marginTop: 1,
                                                backgroundColor: act.colorCode
                                            }} /> {act.channelName}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 0, flexDirection: 'column', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 13, padding: 10, fontFamily: 'inter' }} ellipsizeMode='tail'>
                                            {act.title}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 0, flexDirection: 'column', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 13, padding: 10, lineHeight: 20 }} ellipsizeMode='tail'>
                                            {act.subtitle}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 0, flexDirection: 'column', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 13, padding: 10 }} ellipsizeMode='tail'>
                                            {emailTimeDisplay(act.date)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, backgroundColor: '#fff', padding: 0, flexDirection: 'column', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 18, padding: 10, color: '#661CB0' }} ellipsizeMode='tail'>
                                            <Ionicons name='chevron-forward-outline' size={20} /> {act.status === 'unread' ?
                                                <Ionicons name='alert-circle-outline' color='#f94144' size={20} /> : null}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            })
                        }
                    </ScrollView>
                </View>
            </View>
        </Animated.View>
    );
};

export default (CalendarX)

const styles: any = StyleSheet.create({
    input: {
        width: "100%",
        borderBottomColor: "#f5f5f7",
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20
    },
    text: {
        fontSize: 15,
        fontFamily: 'inter',
        color: '#1D1D20'
    },
    allBlack: {
        fontSize: 12,
        color: "#1D1D20",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white"
    },
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 12,
        color: "#FFF",
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 1,
        backgroundColor: "#1D1D20"
    },
    picker: {
        display: "flex",
        justifyContent: "flex-start",
        backgroundColor: "white",
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
