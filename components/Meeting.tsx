import React, { useState, useEffect, useCallback } from "react";
import { Animated, Dimensions, StyleSheet, Linking, Image, Platform } from "react-native";
import { Text, TouchableOpacity, View } from "./Themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Jutsu } from 'react-jutsu'
import { fetchAPI } from "../graphql/FetchAPI";
import {
    markAttendance,
    getAttendancesForChannel,
    getPastDates,
    getRecordings,
    deleteRecording,
    getSharableLink,
    meetingRequest,
    modifyAttendance
} from "../graphql/QueriesAndMutations";
import { Ionicons } from "@expo/vector-icons";
import SubscriberCard from "./SubscriberCard";
import { ScrollView } from "react-native-gesture-handler";
import Alert from "../components/Alert";
import AttendanceList from "./AttendanceList";
import moment from "moment";
import { PreferredLanguageText } from "../helpers/LanguageContext";
import Discussion from "./Discussion";

const Meeting: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const [modalAnimation] = useState(new Animated.Value(0));
    const [name, setName] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [userId, setUserId] = useState()
    // const [meetingOn, setMeetingOn] = useState(false);
    const [pastAttendances, setPastAttendances] = useState<any[]>([]);
    const [pastMeetings, setPastMeetings] = useState<any[]>([]);
    const [showAttendances, setShowAttendances] = useState(false);
    const [attendances, setAttendances] = useState<any[]>([]);
    const [meetingLink, setMeetingLink] = useState("");
    const [channelAttendances, setChannelAttendances] = useState<any[]>([]);
    const [viewChannelAttendance, setViewChannelAttendance] = useState(false);
    const [showPastMeetings] = useState(true);
    const [reloadKey, setReloadKey] = useState(Math.random())

    const [showMeeting, setShowMeeting] = useState(true)

    const classroomNotInSession = PreferredLanguageText("classroomNotInSession");
    const [guestLink, setGuestLink] = useState('')
    const [instructorLink, setInstructorLink] = useState('')

    const loadChannelAttendances = useCallback(() => {
        const server = fetchAPI("");
        server
            .query({
                query: getAttendancesForChannel,
                variables: {
                    channelId: props.channelId
                }
            })
            .then(async res => {
                if (res.data && res.data.attendance.getAttendancesForChannel) {
                    const u = await AsyncStorage.getItem("user");
                    if (u) {
                        const user = JSON.parse(u);
                        if (user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                            // all attendances
                            setChannelAttendances(res.data.attendance.getAttendancesForChannel);
                        } else {
                            // only user's attendances
                            const attendances = res.data.attendance.getAttendancesForChannel.find((u: any) => {
                                return u.userId.toString().trim() === user._id.toString().trim();
                            });
                            const userAttendances = [{ ...attendances }];
                            setChannelAttendances(userAttendances);
                        }
                    }
                }
            });
    }, [props.channelId]);

    useEffect(() => {
        const server = fetchAPI('')
        server.query({
            query: getSharableLink,
            variables: {
                channelId: props.channelId,
                moderator: true
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.getSharableLink) {
                setInstructorLink(res.data.channel.getSharableLink)
            }
        })
        server.query({
            query: getSharableLink,
            variables: {
                channelId: props.channelId,
                moderator: false
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.getSharableLink) {
                setGuestLink(res.data.channel.getSharableLink)
            }
        })
    }, [isOwner, props.channelId])

    useEffect(() => {
        const server = fetchAPI('')
        server.query({
            query: getRecordings,
            variables: {
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data && res.data.channel.getRecordings) {
                setPastMeetings(res.data.channel.getRecordings)
            }
        })
    }, [props.channelId, reloadKey])

    useEffect(() => {
        loadChannelAttendances();
        setPastAttendances([]);
        loadPastSchedule();
        setPastMeetings([]);
        setShowAttendances(false);
        setIsOwner(false);
        setViewChannelAttendance(false);
    }, [props.channelId]);

    const loadPastSchedule = useCallback(() => {
        const server = fetchAPI("");
        server
            .query({
                query: getPastDates,
                variables: {
                    channelId: props.channelId
                }
            })
            .then(res => {
                if (res.data && res.data.attendance.getPastDates) {
                    setPastAttendances(res.data.attendance.getPastDates);
                }
            });
    }, [props.channelId]);

    const onChangeAttendance = (dateId: String, userId: String, markPresent: Boolean) => {

        Alert(markPresent ? "Mark Present?" : "Mark Absent?", "", [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    return;
                }
            },
            {
                text: "Yes",
                onPress: async () => {
                    const server = fetchAPI("");
                    server
                        .mutate({
                            mutation: modifyAttendance,
                            variables: {
                                dateId,
                                userId,
                                channelId: props.channelId,
                                markPresent
                            }
                        })
                        .then(res => {
                            if (res.data && res.data.attendance.modifyAttendance) {
                                loadChannelAttendances()
                            }
                        });
                }
            }
        ]);


    }


    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem("user");
            if (u) {
                const user = JSON.parse(u);
                setName(user.displayName);
                setUserId(user._id)
                if (user._id.toString().trim() === props.channelCreatedBy) {
                    setIsOwner(true);
                }
            }
        })();
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [props.channelCreatedBy, props.channelId]);

    const handleEnterClassroom = useCallback(() => {

        const server = fetchAPI('')
        server.mutate({
            mutation: meetingRequest,
            variables: {
                userId,
                channelId: props.channelId,
                isOwner: isOwner
            }
        }).then(res => {
            console.log(res)
            if (res.data && res.data.channel.meetingRequest !== 'error') {
                server
                    .mutate({
                        mutation: markAttendance,
                        variables: {
                            userId: userId,
                            channelId: props.channelId
                        }
                    })
                window.open(res.data.channel.meetingRequest, "_blank");
            } else {
                Alert("Classroom not in session. Waiting for instructor.")
            }
        }).catch(err => {
            Alert("Something went wrong.")
        })
    }, [isOwner, userId, props.channelId])

    const windowHeight =
        Dimensions.get("window").width < 1024 ? Dimensions.get("window").height - 30 : Dimensions.get("window").height;

    if (name === "") {
        return null;
    }

    const toolbarButtons = [
        "microphone",
        "camera",
        "closedcaptions",
        "desktop",
        "fullscreen",
        "fodeviceselection",
        "hangup",
        "profile",
        "chat",
        "recording",
        "etherpad",
        "sharedvideo",
        "raisehand",
        "videoquality",
        "filmstrip",
        "tileview",
        "download",
        "security"
    ];
    if (isOwner) {
        toolbarButtons.push("mute-everyone", "mute-video-everyone", "stats", "settings", "livestreaming");
    }

    const renderPastMeetings = () => {
        return (pastMeetings.length === 0 ?
            <View style={{ backgroundColor: 'white', flex: 1 }}>
                <Text style={{ width: '100%', color: '#818385', fontSize: 20, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                    {PreferredLanguageText('noPastMeetings')}
                </Text>
            </View>
            :
            <ScrollView
                contentContainerStyle={{
                    borderWidth: 1,
                    borderColor: '#f0f0f2',
                    borderRadius: 0,
                    width: '100%',
                    maxHeight: windowHeight - 200,
                    overflow: 'hidden'
                }}
            >
                {
                    pastMeetings.map((date: any, index: any) => {
                        return <TouchableOpacity
                            onPress={() => {
                                if (Platform.OS == 'web') {
                                    window.open(date.url, '_blank');
                                } else {
                                    Linking.openURL(date.url)
                                }
                            }}
                            style={{
                                backgroundColor: '#f8f8fa',
                                flexDirection: 'row',
                                borderColor: '#f0f0f2',
                                borderBottomWidth: index === pastMeetings.length - 1 ? 0 : 1,
                                // minWidth: 600, // flex: 1,
                                width: '100%',
                            }}>
                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10, padding: 10 }}>
                                <Image
                                    height={45}
                                    width={75}
                                    style={{ height: 45, width: 75, borderRadius: 5 }}
                                    source={{ uri: date.thumbnail }}
                                    resizeMode={'contain'}
                                />
                            </View>
                            <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 13, padding: 10 }} ellipsizeMode='tail'>
                                    {moment(new Date(date.startTime)).format('MMMM Do YYYY, h:mm a')}
                                </Text>
                            </View>
                            {
                                isOwner ?
                                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}
                                        onPress={() => {
                                            Alert("Delete past lecture ?", "", [
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
                                                                mutation: deleteRecording,
                                                                variables: {
                                                                    recordID: date.recordID
                                                                }
                                                            })
                                                            .then(res => {
                                                                if (res.data && res.data.channel.deleteRecording) {
                                                                    console.log(res.data)
                                                                    Alert("Recording Deleted!");
                                                                    setReloadKey(Math.random())
                                                                }
                                                            });
                                                    }
                                                }
                                            ]);
                                        }}
                                    >
                                        <Text style={{ width: '100%', color: '#818385', fontSize: 15, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                            <Ionicons name='trash-outline' size={17} color="#f94144" />
                                        </Text>
                                    </TouchableOpacity>
                                    : null
                            }
                        </TouchableOpacity>
                    })
                }
            </ScrollView>)
    }

    const mainClassroomView = (
        <ScrollView
            style={{
                width: "100%",
                maxHeight: windowHeight,
                backgroundColor: "#fff",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0
            }}>
            <Animated.View
                style={{
                    width: "100%",
                    backgroundColor: "white",
                    paddingRight: 20,
                    paddingTop: 20,
                    paddingBottom: 50,
                    paddingLeft: Dimensions.get('window').width < 1024 ? 20 : 0,
                    opacity: modalAnimation,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    alignSelf: "center"
                }}>
                <View style={{ backgroundColor: "white", flexDirection: "row", paddingBottom: 20, flex: 1 }}>
                    {
                        isOwner ? (
                            <View
                                style={{
                                    backgroundColor: "white"
                                }}>
                                <View>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff',
                                            width: Dimensions.get('window').width < 1024 ? 'auto' : '100%',
                                            paddingBottom: 20
                                        }}
                                        onPress={() => {
                                            navigator.clipboard.writeText(instructorLink)
                                            Alert("Link copied! Users will only be able to join after you initiate the classroom.")
                                        }}>
                                        <Text style={{
                                            lineHeight: 21,
                                            textAlign: 'center'
                                        }}>
                                            <Ionicons name='copy-outline' size={19} color={'#1D1D20'} />
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#1D1D20', textAlign: 'center', width: '100%', }}>
                                            Host Link
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null
                    }
                    {
                        isOwner ? (
                            <View
                                style={{
                                    backgroundColor: "white"
                                }}>
                                <View>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: '#fff',
                                            width: Dimensions.get('window').width < 1024 ? 'auto' : '100%',
                                            paddingBottom: 20,
                                            marginLeft: 10,
                                            marginRight: 25
                                        }}
                                        onPress={() => {
                                            navigator.clipboard.writeText(guestLink)
                                            Alert("Link copied! Users will only be able to join after you initiate the classroom.")
                                        }}>
                                        <Text style={{
                                            lineHeight: 21,
                                            textAlign: 'center'
                                        }}>
                                            <Ionicons name='copy-outline' size={19} color={'#1D1D20'} />
                                        </Text>
                                        <Text style={{ fontSize: 10, color: '#1D1D20', textAlign: 'center', width: '100%', }}>
                                            Guest Link
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null
                    }
                    <View
                        style={{
                            backgroundColor: "white",
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'flex-end'
                        }}>
                        <TouchableOpacity
                            onPress={handleEnterClassroom}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginLeft: 15,
                                // marginTop: 15,
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 30,
                                color: '#fff',
                                fontSize: 12,
                                backgroundColor: '#35AC78',
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                height: 30,
                                // width: 100,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                {PreferredLanguageText("enterClassroom")} <Ionicons name='videocam-outline' />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {
                    <View style={{ marginTop: 25 }}>
                        {

                            showAttendances ?
                                <View>
                                    {
                                        attendances.length === 0 ?
                                            <View style={{ backgroundColor: 'white', flex: 1 }}>
                                                <Text style={{ width: '100%', color: '#818385', fontSize: 20, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                    {PreferredLanguageText('noAttendances')}
                                                </Text>
                                            </View>
                                            :
                                            attendances.map((att: any, index: any) => {
                                                return <View style={styles.col} key={index}>
                                                    <SubscriberCard
                                                        hideChevron={true}
                                                        fadeAnimation={props.fadeAnimation}
                                                        subscriber={{
                                                            displayName: att.displayName,
                                                            fullName: PreferredLanguageText('joinedAt') + ' ' + moment(new Date(att.joinedAt)).format('MMMM Do YYYY, h:mm a')
                                                        }}
                                                        onPress={() => { }}
                                                        status={!props.cueId ? false : true}
                                                    />
                                                </View>
                                            })
                                    }
                                </View>
                                : (showPastMeetings ? renderPastMeetings() : null)
                        }
                    </View>
                }
            </Animated.View>
        </ScrollView>
    );

    const attendanceListView = (
        <AttendanceList
            key={JSON.stringify(channelAttendances)}
            channelAttendances={channelAttendances}
            isOwner={isOwner}
            pastMeetings={pastAttendances}
            channelName={props.filterChoice}
            channelId={props.channelId}
            closeModal={() => {
                Animated.timing(modalAnimation, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true
                }).start(() => props.closeModal());
            }}
            hideChannelAttendance={() => {
                setViewChannelAttendance(false);
            }}
            reload={() => loadChannelAttendances()}
            modifyAttendance={onChangeAttendance}
        />
    );

    const width = Dimensions.get('window').width

    return <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
            height: Dimensions.get('window').height - 100,
            maxWidth: 800,
            width: '100%',
            alignSelf: 'center'
        }}>
        <View style={{ flexDirection: "row", width: '100%', justifyContent: 'center', paddingVertical: 30 }}>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    setShowMeeting(true);
                }}>
                <Text style={showMeeting ? styles.allGrayFill : styles.all}>
                    MEET
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    setShowMeeting(false);
                }}>
                <Text style={!showMeeting ? styles.allGrayFill : styles.all}>
                    DISCUSS
                </Text>
            </TouchableOpacity>
        </View>
        {
            showMeeting ? <View style={{
                backgroundColor: 'white',
                width: '100%',
            }}>
                {mainClassroomView}
            </View>
                : <View style={{
                    backgroundColor: '#fff', width: '100%',
                    paddingLeft: width < 1024 ? 0 : 20,
                    marginTop: 20,
                    marginBottom: 20,
                }}>
                    <Discussion
                        channelId={props.channelId}
                        filterChoice={props.filterChoice}
                        channelCreatedBy={props.channelCreatedBy}
                        refreshUnreadDiscussionCount={() => props.refreshUnreadDiscussionCount()}
                    />
                </View>
        }
    </ScrollView>
};

export default Meeting;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: "white",
        height: "100%",
        width: Dimensions.get("window").width < 1024 ? "100%" : "60%",
        paddingHorizontal: Dimensions.get("window").width < 1024 ? 20 : 0,
        alignSelf: "center",
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0
    },
    text: {
        fontSize: 12,
        color: "#818385",
        textAlign: "left",
        paddingHorizontal: 10,
        paddingTop: 5
    },
    col: {
        width: "100%",
        height: 70,
        marginBottom: 15,
        backgroundColor: "white"
    },
    swiper: {
        height: '100%',
        width: 350,
        maxWidth: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    card: {
        height: '100%',
        width: 350,
        maxWidth: '100%',
        borderRadius: 15,
        padding: 13,
        backgroundColor: '#f8f8fa',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    meetingText: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#f8f8fa',
    },
    title: {
        fontFamily: 'inter',
        fontSize: 13,
        width: '100%',
        paddingTop: 5,
        color: '#1D1D20'
    },
    description: {
        fontSize: 13,
        color: '#818385',
    },
    all: {
        fontSize: 11,
        color: '#2f2f3c',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        lineHeight: 22,
        fontFamily: 'inter'
    },
    allGrayFill: {
        fontSize: 11,
        color: '#fff',
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: '#2f2f3c',
        lineHeight: 22,
        fontFamily: 'inter'
    },

});
