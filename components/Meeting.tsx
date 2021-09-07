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
            pastMeetings.map((date: any, index: any) => {
                return <View style={styles.col} key={index}>
                    <View style={styles.swiper}>
                        <View
                            key={'textPage'}
                            style={styles.card}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (Platform.OS == 'web') {
                                        window.open(date.url, '_blank');
                                    } else {
                                        Linking.openURL(date.url)
                                    }
                                }}
                                style={{ flexDirection: 'row', backgroundColor: '#f8f9fa', width: '90%' }}>
                                <Image
                                    height={45}
                                    width={75}
                                    style={{ height: 45, width: 75, borderRadius: 5 }}
                                    source={{ uri: date.thumbnail }}
                                    resizeMode={'contain'}
                                />
                                <View style={{ backgroundColor: '#f8f9fa', width: '100%', flexDirection: 'row', display: 'flex', marginLeft: 20 }}>
                                    <Text ellipsizeMode={'tail'}
                                        numberOfLines={1}
                                        style={styles.title}>
                                        {moment(new Date(date.startTime)).format('MMMM Do YYYY, h:mm a')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {
                                isOwner ?
                                    <TouchableOpacity style={{ backgroundColor: '#f8f9fa', width: '10%', }}
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
                                            <Ionicons name='trash-outline' size={17} color="#d91d56" />
                                        </Text>
                                    </TouchableOpacity>
                                    : null
                            }
                        </View>
                    </View>
                </View >
            }))
    }

    const mainClassroomView = (
        <ScrollView
            style={{
                width: "100%",
                height: windowHeight,
                backgroundColor: "#fff",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0
            }}>
            <Animated.View
                style={{
                    width: "100%",
                    backgroundColor: "white",
                    paddingRight: 20,
                    paddingTop: 30,
                    paddingLeft: Dimensions.get('window').width < 1024 ? 20 : 0,
                    opacity: modalAnimation,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    alignSelf: "center"
                }}>
                <Text style={{ width: "100%", textAlign: "center", paddingTop: 5 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={{ backgroundColor: "white", flexDirection: "row", paddingBottom: 25 }}>
                    <Text
                        ellipsizeMode="tail"
                        style={{
                            fontSize: 23,
                            paddingBottom: 20,
                            fontFamily: 'inter',
                            // textTransform: "uppercase",
                            // paddingLeft: 10,
                            paddingTop: 2,
                            flex: 1,
                            lineHeight: 25
                        }}>
                        Meet
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            setViewChannelAttendance(true);
                        }}
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            // marginTop: 15,
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 30,
                            color: viewChannelAttendance ? '#43434F' : '#fff',
                            fontSize: 12,
                            backgroundColor: viewChannelAttendance ? '#f8f9fa' : '#53BE6D',
                            paddingHorizontal: 25,
                            fontFamily: 'inter',
                            height: 30,
                            // width: 100,
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            ATTENDANCE <Ionicons name='list-outline' size={12} />
                        </Text>

                    </TouchableOpacity>
                </View>
                <View style={{ backgroundColor: "white", flex: 1 }}>
                    <View
                        style={{
                            width: "100%",
                            backgroundColor: "white",
                            flexDirection: Dimensions.get("window").width < 768 ? "column" : "row"
                        }}>
                        <View
                            style={{
                                backgroundColor: "white"
                            }}>
                            <TouchableOpacity
                                onPress={handleEnterClassroom}
                                style={{
                                    backgroundColor: "white",
                                    overflow: "hidden",
                                    height: 35,
                                    marginTop: 15,
                                    marginBottom: 20
                                }}>
                                <Text
                                    style={{
                                        textAlign: "center",
                                        lineHeight: 35,
                                        color: "#fff",
                                        fontSize: 12,
                                        backgroundColor: "#3B64F8",
                                        paddingHorizontal: 25,
                                        fontFamily: "inter",
                                        height: 35,
                                        width: 150,
                                        borderRadius: 15,
                                        textTransform: "uppercase"
                                    }}>
                                    {PreferredLanguageText("enterClassroom")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {
                            isOwner ? (
                                <View
                                    style={{
                                        paddingLeft: Dimensions.get('window').width < 768 ? 0 : 30,
                                        // marginBottom: 25,
                                        backgroundColor: "white"
                                    }}>
                                    <View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                navigator.clipboard.writeText(instructorLink)
                                                Alert("Link copied! Users will only be able to join after you initiate the classroom.")
                                            }}
                                            style={{
                                                backgroundColor: "white",
                                                overflow: "hidden",
                                                height: 35,
                                                marginTop: 15,
                                                marginBottom: 20
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: "center",
                                                    lineHeight: 35,
                                                    color: "#43434F",
                                                    fontSize: 12,
                                                    backgroundColor: "#f8f9fa",
                                                    paddingHorizontal: 25,
                                                    fontFamily: "inter",
                                                    height: 35,
                                                    width: 150,
                                                    borderRadius: 15,
                                                    textTransform: "uppercase"
                                                }}>
                                                Host Link <Ionicons name='copy-outline' size={12} />
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
                                        paddingLeft: Dimensions.get('window').width < 768 ? 0 : 30,
                                        // marginBottom: 25,
                                        backgroundColor: "white"
                                    }}>
                                    <View>
                                        <TouchableOpacity
                                            onPress={() => {
                                                navigator.clipboard.writeText(guestLink)
                                                Alert("Link copied! Users will only be able to join after you initiate the classroom.")
                                            }}
                                            style={{
                                                backgroundColor: "white",
                                                overflow: "hidden",
                                                height: 35,
                                                marginTop: 15,
                                                marginBottom: 20
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: "center",
                                                    lineHeight: 35,
                                                    color: "#43434F",
                                                    fontSize: 12,
                                                    backgroundColor: "#f8f9fa",
                                                    paddingHorizontal: 25,
                                                    fontFamily: "inter",
                                                    height: 35,
                                                    width: 150,
                                                    borderRadius: 15,
                                                    textTransform: "uppercase"
                                                }}>
                                                Guest Link <Ionicons name='copy-outline' size={12} />
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : null
                        }
                    </View>
                    {
                        <View style={{ borderTopColor: '#f8f9fa', borderTopWidth: 1, marginTop: 25 }}>
                            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                            </Text>
                            <Text style={{
                                fontSize: 23,
                                paddingBottom: 20,
                                fontFamily: 'inter',
                                // textTransform: "uppercase",
                                // paddingLeft: 10,
                                paddingTop: 2,
                                flex: 1,
                                lineHeight: 25
                            }}>
                                Past Lectures
                            </Text>
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
                </View>
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

    return <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row' }}>
        <View style={{
            backgroundColor: 'white',
            width: width < 768 ? '100%' : '40%',
            paddingRight: width < 768 ? 0 : 20,
        }}>
            {!viewChannelAttendance ? mainClassroomView : attendanceListView}
        </View>
        <View style={{
            backgroundColor: '#fff', width: width < 768 ? '100%' : '60%',
            paddingLeft: width < 768 ? 0 : 20,
            borderLeftWidth: width < 768 ? 0 : 1, borderLeftColor: '#eeeeee',
        }}>
            <Discussion
                channelId={props.channelId}
                filterChoice={props.filterChoice}
                channelCreatedBy={props.channelCreatedBy}
                refreshUnreadDiscussionCount={() => props.refreshUnreadDiscussionCount()}
            />
        </View>
    </View>;
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
        backgroundColor: '#f8f9fa',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    meetingText: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontFamily: 'inter',
        fontSize: 13,
        width: '100%',
        paddingTop: 5,
        color: '#43434F'
    },
    description: {
        fontSize: 13,
        color: '#818385',
    }

});
