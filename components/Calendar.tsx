import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Switch, StyleSheet, ScrollView, View as DefaultView } from "react-native";
import { TextInput } from "./CustomTextInput";
import Alert from "./Alert";
import { Text, View, TouchableOpacity } from "./Themed";
import { fetchAPI } from "../graphql/FetchAPI";
import { createDate, deleteDate, getChannels, getEvents, createDateV1, editDateV1, deleteDateV1 } from "../graphql/QueriesAndMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar, momentLocalizer } from "react-big-calendar";
import Datetime from "react-datetime";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { htmlStringParser } from "../helpers/HTMLParser";
import { Ionicons } from "@expo/vector-icons";
import { PreferredLanguageText } from "../helpers/LanguageContext";
import { Picker } from "@react-native-picker/picker";
import { eventFrequencyOptions } from "../helpers/FrequencyOptions";
import { DatePicker, DateRangePicker } from 'rsuite';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

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
    const [filterByChannel, setFilterByChannel] = useState("All");

    // const [viewModel, setViewModel] = useState<any>(new SchedulerData(new moment().format(DATE_FORMAT), ViewTypes.Week))

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

        return <span style={{ color: colorCode }}>{event.title}</span>

    }


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
        if (filterByLectures) {
            total = total.filter((e: any) => e.meeting)
        }

        if (filterByChannel === "All") {
            setEvents(total);
        } else {
            const all = [...total];
            const filter = all.filter((e: any) => filterByChannel === (e.channelName));
            setEvents(filter)
        }

    }, [filterByChannel, filterByLectures])

    const renderFilterEvents = () => {

        return (eventChannels.length > 0 ? (
            <View style={{ marginTop: 20, flexDirection: 'row' }} key={JSON.stringify(eventChannels)}>
                <View style={{ width: width < 768 ? "100%" : "33.33%" }}>
                    <View
                        style={{ width: "100%", paddingBottom: 20, backgroundColor: "white" }}>
                        <Text
                            style={{
                                fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase',
                                paddingTop: width < 768 ? 15 : 5
                            }}>
                            Filter
                        </Text>
                    </View>
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
                                    <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c' }}>
                                        {filterByChannel}<Ionicons name='caret-down' size={14} />
                                    </Text>
                                </MenuTrigger>
                                <MenuOptions customStyles={{
                                    optionsContainer: {
                                        padding: 10,
                                        borderRadius: 15,
                                        shadowOpacity: 0,
                                        borderWidth: 1,
                                        borderColor: '#f4f4f6',
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
                                                borderRadius: 10,
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
                                                borderRadius: 10,
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
                                                        borderRadius: 10,
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
                    </View>
                </View>
                <View style={{ width: width < 768 ? "100%" : "33.33%" }}>
                    <View style={{ width: "100%", paddingTop: width < 768 ? 15 : 5, paddingBottom: 15, backgroundColor: "white" }}>
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Lectures Only</Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: "white",
                            height: 40,
                            marginRight: 10
                        }}>
                        <Switch
                            value={filterByLectures}
                            onValueChange={() => setFilterByLectures(!filterByLectures)}
                            style={{ height: 20 }}
                            trackColor={{
                                false: "#f4f4f6",
                                true: "#3B64F8"
                            }}
                            activeThumbColor="white"
                        />
                    </View>
                </View>
                {/* {filterChannels.length === 0 && !filterByLectures ? null : <Text style={{
                    // width: '50%',
                    color: '#a2a2ac',
                    fontSize: 11,
                    paddingTop: 5,
                    paddingRight: 25,
                    textTransform: 'uppercase'
                }}
                    onPress={() => {
                        setFilterChannels([]);
                        setFilterByLectures(false)
                    }}
                >
                    RESET
                </Text>} */}
            </View>
        ) : null)
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
        console.log('creating event')
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
                            meeting: e.meeting
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
    }, [, modalAnimation]);

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

    const onSelectEvent = async (event: any) => {

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


                Alert(
                    event.title,
                    descriptionString
                );
            }

        }


    }

    const width = Dimensions.get("window").width;

    const windowHeight =
        width < 1024 ? Dimensions.get("window").height - 30 : Dimensions.get("window").height;

    const renderRecurringOptions = () => (
        <View style={{ flexDirection: width < 768 ? "column" : "row" }}>
            <View style={{ width: width < 768 ? "100%" : "33.33%", display: "flex" }}>
                <View style={{ width: "100%", paddingTop: width < 768 ? 40 : 40, paddingBottom: 15, backgroundColor: "white" }}>
                    <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Recurring</Text>
                </View>
                <View
                    style={{
                        backgroundColor: "white",
                        height: 40,
                        marginRight: 10
                    }}>
                    <Switch
                        value={recurring}
                        onValueChange={() => setRecurring(!recurring)}
                        style={{ height: 20 }}
                        trackColor={{
                            false: "#f4f4f6",
                            true: "#3B64F8"
                        }}
                        activeThumbColor="white"
                    />
                </View>
            </View>

            {recurring ? <View style={{ width: width < 768 ? "100%" : "33.33%", display: "flex" }}>
                <View style={{ width: "100%", paddingTop: width < 768 ? 20 : 40, paddingBottom: 15, backgroundColor: "white" }}>
                    <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Repeat every</Text>
                </View>
                <View
                    style={{
                        width: "100%",
                        flexDirection: "row",
                        marginLeft: 0
                    }}>

                    <Picker
                        style={styles.picker}
                        itemStyle={{
                            fontSize: 15
                        }}
                        selectedValue={frequency}
                        onValueChange={(itemValue: any) => {
                            setFrequency(itemValue)
                        }}>
                        {eventFrequencyOptions.map((item: any, index: number) => {
                            return (
                                <Picker.Item
                                    color={frequency === item.value ? "#3B64F8" : "#2F2F3C"}
                                    label={item.value === "" ? "Once" : item.label}
                                    value={item.value}
                                    key={index}
                                />
                            );
                        })}
                    </Picker>
                </View>
            </View> : null}

            {recurring ? <View style={{ width: width < 768 ? "100%" : "33.33%", display: "flex" }}>
                <View style={{ width: "100%", paddingTop: width < 768 ? 20 : 40, paddingBottom: 15, backgroundColor: "white" }}>
                    <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>Repeat until</Text>
                </View>
                <View
                    style={{
                        width: width < 768 ? "100%" : "30%",
                        flexDirection: "row",
                        marginLeft: 0
                    }}>
                    <DatePicker
                        format="YYYY-MM-DD HH:mm"
                        preventOverflow={true}
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
                        <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', marginBottom: 5 }}>Lecture</Text>
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
                                false: "#f4f4f6",
                                true: "#3B64F8"
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
                            <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase', marginBottom: 5 }}>Record Lecture</Text>
                        </View>
                        <Switch
                            value={recordMeeting}
                            onValueChange={() => {
                                setRecordMeeting(!recordMeeting);
                            }}
                            style={{ height: 20 }}
                            trackColor={{
                                false: "#f4f4f6",
                                true: "#a2a2ac"
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
                            lineHeight: 20,
                            fontSize: 12,
                            color: "#a2a2ac"
                        }}>
                        Shared with {editChannelName}
                    </Text>
                </TouchableOpacity>
            </View>

        );
    }

    const renderEditEventOptions = () => {

        const { recurringId } = editEvent;
        return (<View
            style={{
                flex: 1,
                backgroundColor: "white",
                justifyContent: "center",
                display: "flex",
                paddingTop: 30
            }}
        >
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
                        backgroundColor: '#3B64F8',
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
                        color: "#2F2F3C",
                        fontSize: 12,
                        backgroundColor: "#f4f4f6",
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
                        color: "#2F2F3C",
                        fontSize: 12,
                        backgroundColor: "#f4f4f6",
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
                height: windowHeight,
                backgroundColor: "white",
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
                paddingHorizontal: 20
            }}>
            <Text style={{ width: "100%", textAlign: "center", height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: "white", flexDirection: "row", paddingBottom: 35 }}>
                <Text
                    ellipsizeMode="tail"
                    style={{
                        fontSize: 20,
                        paddingBottom: 20,
                        fontFamily: 'inter',
                        // textTransform: "uppercase",
                        // paddingLeft: 10,
                        flex: 1,
                        lineHeight: 25
                    }}>
                    {PreferredLanguageText("planner")}
                </Text>
                <Text
                    style={{
                        color: "#3B64F8",
                        fontSize: 11,
                        lineHeight: 25,
                        // paddingTop: 5,
                        textAlign: "right",
                        // paddingRight: 20,
                        textTransform: "uppercase"
                    }}
                    onPress={() => {
                        setShowAddEvent(!showAddEvent)
                        setEditEvent(null)
                    }}>
                    {showAddEvent ? PreferredLanguageText("hide") : PreferredLanguageText("add")}
                </Text>
            </View>
            <ScrollView
                style={{
                    width: "100%",
                    height: windowHeight,
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
                {loading ? (
                    <View
                        style={{
                            width: "100%",
                            flex: 1,
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "white"
                        }}>
                        <ActivityIndicator color={"#a2a2ac"} />
                    </View>
                ) : (
                    <View
                        style={{
                            backgroundColor: "white",
                            width: "100%",
                            height: "100%",
                            // paddingHorizontal: 20,
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0
                        }}>
                        {showAddEvent ? (
                            <View>
                                <View
                                    style={{
                                        flexDirection: width < 768 ? "column" : "row"
                                    }}>
                                    <View style={{ width: width < 768 ? "100%" : "30%" }}>
                                        <TextInput
                                            value={title}
                                            placeholder={
                                                'Event'
                                            }
                                            onChangeText={val => setTitle(val)}
                                            placeholderTextColor={"#a2a2ac"}
                                            required={true}
                                        />
                                    </View>

                                    <View style={{ width: width < 768 ? "100%" : "30%", marginLeft: width < 768 ? 0 : 30 }}>
                                        <TextInput
                                            value={description}
                                            placeholder="Description"
                                            onChangeText={val => setDescription(val)}
                                            placeholderTextColor={"#a2a2ac"}
                                        />
                                    </View>
                                </View>
                                {/* Put time here */}
                                <View style={{ display: 'flex', width: "100%", flexDirection: width < 768 ? "column" : "row", marginBottom: 30, paddingVertical: 10, }} >
                                    <View
                                        style={{
                                            width: width < 768 ? "100%" : "30%",
                                            flexDirection: "row",
                                            marginTop: 12,
                                            alignItems: 'center'
                                        }}>
                                        <Text style={styles.text}>{PreferredLanguageText("start")}</Text>
                                        <DatePicker
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
                                            width: width < 768 ? "100%" : "30%",
                                            flexDirection: "row",
                                            marginTop: 12,
                                            alignItems: 'center',
                                            marginLeft: width < 768 ? 0 : 30
                                        }}>
                                        <Text style={styles.text}>{PreferredLanguageText("end")}</Text>
                                        <DatePicker
                                            format="YYYY-MM-DD HH:mm"
                                            preventOverflow={true}
                                            value={end}
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
                                        borderColor: "#f4f4f6",
                                        // borderBottomWidth: 1,
                                        paddingBottom: 20
                                    }}>
                                    {channels.length > 0 && !editEvent ? (
                                        <View>
                                            <View
                                                style={{ width: "100%", paddingBottom: 20, backgroundColor: "white" }}>
                                                <Text
                                                    style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                                                    Event For
                                                </Text>
                                            </View>

                                            <View style={{ flexDirection: 'row', display: 'flex', backgroundColor: '#fff' }}>
                                                <Menu
                                                    onSelect={(channelId: any) => {
                                                        setChannelId(channelId)

                                                    }}>
                                                    <MenuTrigger>
                                                        <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c' }}>
                                                            {eventForChannelName}<Ionicons name='caret-down' size={14} />
                                                        </Text>
                                                    </MenuTrigger>
                                                    <MenuOptions customStyles={{
                                                        optionsContainer: {
                                                            padding: 10,
                                                            borderRadius: 15,
                                                            shadowOpacity: 0,
                                                            borderWidth: 1,
                                                            borderColor: '#f4f4f6'
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
                                    {channelId !== "" && <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase', paddingTop: 10 }}>
                                        Attendances will only be captured for scheduled lectures.
                                    </Text>}
                                    {!editEvent ? <View
                                        style={{
                                            width: width < 768 ? "100%" : "10%",
                                            flexDirection: "row",
                                            display: "flex",
                                            marginBottom: 10
                                            // paddingLeft: 7
                                            // justifyContent: 'center'
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
                                                    backgroundColor: '#3B64F8',
                                                    paddingHorizontal: 25,
                                                    fontFamily: "inter",
                                                    height: 35,
                                                    // width: 125,
                                                    borderRadius: 15,
                                                    textTransform: "uppercase"
                                                }}>
                                                {isCreatingEvents ? "ADDING..." : "ADD"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View> : null}
                                    {editEvent ? renderEditEventOptions() : null}
                                    {/* {editEvent ? renderDeleteEventOptions() : null} */}
                                </View>
                            </View>
                        ) : null}
                        {!showAddEvent ? <Calendar
                            onSelectEvent={(e: any) => onSelectEvent(e)}
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 525, fontFamily: "overpass", color: "#2F2F3C" }}
                            components={{
                                event: EventComponent
                            }}
                        /> : null}

                        {!showAddEvent ? renderFilterEvents() : null}

                    </View>
                )}
            </ScrollView>
        </Animated.View>
    );
};

export default (CalendarX)

const styles: any = StyleSheet.create({
    input: {
        width: "100%",
        borderBottomColor: "#f4f4f6",
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 20
    },
    text: {
        fontSize: 12,
        color: "#a2a2ac",
        textAlign: "left",
        paddingRight: 10
    },
    allBlack: {
        fontSize: 12,
        color: "#2F2F3C",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white"
    },
    allOutline: {
        fontSize: 12,
        color: "#FFF",
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "#2F2F3C"
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
