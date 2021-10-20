import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Switch, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from './Themed';
import _ from 'lodash'
import moment from 'moment'
import { PreferredLanguageText } from '../helpers/LanguageContext';
import Datetime from "react-datetime";
import XLSX from "xlsx";
import {
    LineChart,
} from "react-native-chart-kit";
import * as FileSaver from 'file-saver';
import { DatePicker, DateRangePicker } from 'rsuite';
import { fetchAPI } from "../graphql/FetchAPI";

import {
    getAttendancesForChannel,
    getPastDates,
    modifyAttendance
} from "../graphql/QueriesAndMutations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Alert from './Alert';

import { Datepicker, Select } from '@mobiscroll/react'


const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    // Modify Attendance List to show in 

    // const unparsedPastMeetings: any[] = JSON.parse(JSON.stringify(props.pastMeetings))
    // const unparsedChannelAttendances: any[] = JSON.parse(JSON.stringify(props.channelAttendances))
    const [fixedPastMeetings, setFixedPastMeetings] = useState<any[]>([]);
    const [pastMeetings, setPastMeetings] = useState<any[]>([]);
    const [channelAttendances, setChannelAttendances] = useState<any[]>([]);
    // const [pastAttendances, setPastMeetings] = useState<any[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [loadingAttendances, setLoadingAttendances] = useState(false);

    const [isOwner, setIsOwner] = useState(false);


    const [enableFilter, setEnableFilter] = useState(false);
    const [end, setEnd] = useState<any>(null);
    const [start, setStart] = useState<any>(null);

    const [attendanceTotalMap, setAttendanceTotalMap] = useState<any>({});

    const [showAttendanceStats, setShowAttendanceStats] = useState(false);

    const [exportAoa, setExportAoa] = useState<any[]>()


    useEffect(() => {
        loadChannelAttendances();
        setPastMeetings([]);
        loadPastSchedule();
    }, [props.channelId]);


    const loadChannelAttendances = useCallback(() => {
        setLoadingAttendances(true)
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
                        setLoadingAttendances(false)
                    }
                }
            }).catch((e: any) => {
                setLoadingAttendances(false)
            })
    }, [props.channelId]);

    const loadPastSchedule = useCallback(() => {
        setLoadingMeetings(true)
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
                    setFixedPastMeetings(res.data.attendance.getPastDates)
                    setPastMeetings(res.data.attendance.getPastDates);
                }
                setLoadingMeetings(false)
            }).catch((e: any) => {
                setLoadingMeetings(false)
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
                if (user._id.toString().trim() === props.channelCreatedBy) {
                    setIsOwner(true);
                }
            }
        })();
    }, [props.channelCreatedBy, props.channelId]);

    useEffect(() => {

        if (channelAttendances.length === 0 || pastMeetings.length === 0) {
            return;
        }

        // Calculate total for each student and add it to the end
        const studentTotalMap: any = {};

        channelAttendances.forEach(att => {

            let count = 0
            pastMeetings.forEach(meeting => {

                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                })

                if (attendanceObject) count++;

            })

            studentTotalMap[att.userId] = count;

        })

        setAttendanceTotalMap(studentTotalMap)

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [""];

        pastMeetings.forEach(meeting => {
            row1.push(moment(new Date(meeting.start)).format('MMMM Do, h:mm a'))
        })

        row1.push("Total")

        exportAoa.push(row1);

        channelAttendances.forEach(att => {

            let userRow = [];

            userRow.push(att.fullName)

            pastMeetings.forEach(meeting => {

                const attendanceObject = att.attendances.find((s: any) => {
                    return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                })

                if (attendanceObject) {
                    userRow.push(`Joined at ${moment(new Date(attendanceObject.joinedAt)).format('MMMM Do, h:mm a')}`)
                } else {
                    userRow.push('-')
                }

            })

            userRow.push(`${studentTotalMap[att.userId]} / ${pastMeetings.length}`)

            exportAoa.push(userRow)

        })

        setExportAoa(exportAoa)


    }, [channelAttendances, pastMeetings])

    // Update past meetings to consider
    useEffect(() => {
        if (start && end) {

            const filteredPastMeetings = fixedPastMeetings.filter(meeting => {
                return (new Date(meeting.start) > start && new Date(meeting.end) < end)
            })

            setPastMeetings(filteredPastMeetings);

        } else {

            setPastMeetings(fixedPastMeetings)

        }

    }, [start, end])

    const exportAttendance = () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance ");
        /* generate XLSX file and send to client */
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, "attendances" + fileExtension);
    }

    const width = Dimensions.get("window").width;

    const renderAttendanceChart = () => {

        const studentCount = channelAttendances.length;

        const meetingLabels: any[] = [];

        const attendanceCounts: any[] = [];

        pastMeetings.map((meeting: any) => {

            const { title, start, dateId } = meeting

            meetingLabels.push(`${moment(new Date(start)).format('MMMM Do, h:mm a')}`)

            let count = 0;

            // Total count map
            channelAttendances.forEach((att: any) => {
                const filteredDateId = att.attendances.filter((x: any) => x.dateId === dateId)
                if (filteredDateId.length > 0) count++;
            })

            let percentage = (count / studentCount) * 100

            attendanceCounts.push(percentage)

        })

        const data = {
            labels: meetingLabels,
            datasets: [
                {
                    data: attendanceCounts,
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
                    strokeWidth: 2 // optional
                }
            ],
            // legend: ["Rainy Days"] // optional
        };



        return (<View style={{
            width: '100%',
            backgroundColor: 'white',
            flex: 1
        }}
            key={JSON.stringify(pastMeetings)}
        >
            {/* <Text style={{ textAlign: 'left', fontSize: 13, color: '#1A2036', fontFamily: 'inter', paddingBottom: 20 }}>
                        Attendance By Lectures
            </Text> */}
            <ScrollView
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                contentContainerStyle={{
                    height: '100%'
                }}
                nestedScrollEnabled={true}
            >
                <LineChart
                    data={data}
                    width={width - 100}
                    height={500}
                    // chartConfig={chartConfig}
                    // xAxisLabel="Lectures"
                    chartConfig={{
                        backgroundGradientFrom: "#fff",
                        backgroundGradientFromOpacity: 0,
                        backgroundGradientTo: "#fff",
                        backgroundGradientToOpacity: 0,
                        color: (opacity = 1) => `rgba(1, 122, 205, 1)`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, 1)`,
                        strokeWidth: 2, // optional, default 3
                        barPercentage: 0.5,
                        useShadowColorFromDataset: false, // optional
                        propsForBackgroundLines: {
                            strokeWidth: 1,
                            stroke: '#efefef',
                            strokeDasharray: '0',
                        },
                    }}
                />
            </ScrollView>
        </View>)
    }

    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            // height: '100%',
            // paddingHorizontal: 20,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            <Text style={{ width: '100%', textAlign: 'center' }}>
                {/* <Ionicons name='chevron-down' size={15} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 20, width: '100%', justifyContent: 'flex-start' }}>
                {(pastMeetings.length === 0 || channelAttendances.length === 0 || !isOwner) ? null :
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'white',
                            overflow: 'hidden',
                            height: 35,
                            marginTop: 10,
                            // marginTop: 15,
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}
                        onPress={() => {
                            exportAttendance()
                        }}
                    >
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: '#5469D4',
                            fontSize: 12,
                            borderColor: '#5469D4',
                            borderWidth: 1,
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            height: 35,
                            // width: 100,
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            DOWNLOAD
                        </Text>
                    </TouchableOpacity>
                }
                <View style={{ flex: 1, flexDirection: 'row' }} />
                {pastMeetings.length === 0 || channelAttendances.length === 0 ? null : <View>
                    <View style={{ display: 'flex', width: "100%", flexDirection: "row" }}>
                        <Datepicker
                            themeVariant="light"
                            controls={['calendar']}
                            select="range"
                            touchUi={true}
                            inputProps={{
                                placeholder: 'Filter'
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble'
                                },
                                medium: {
                                    touchUi: false,
                                }
                            }}
                            value={[start, end]}
                            onChange={(val: any) => {
                                console.log("Selected", val)
                                setStart(val.value[0])
                                setEnd(val.value[1])
                            }}
                        />
                    </View>
                </View>
                }
            </View>

            {
                channelAttendances.length === 0 || pastMeetings.length === 0 || loadingAttendances || loadingMeetings ?
                    ((loadingAttendances || loadingMeetings) ?
                        <View style={{
                            width: '100%',
                            flex: 1,
                            justifyContent: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: 'white',
                            borderTopRightRadius: 0,
                            borderTopLeftRadius: 0,
                            paddingVertical: 100
                        }}>
                            <ActivityIndicator color={'#50566B'} />
                        </View>
                        : <View style={{ backgroundColor: 'white' }}>
                            <Text style={{ width: '100%', color: '#50566B', fontSize: 20, paddingVertical: 100, paddingHorizontal: 5, fontFamily: 'inter', }}>
                                {
                                    pastMeetings.length === 0 ? "No past meetings" : "No Students"
                                    // PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                                }
                            </Text>
                        </View>)
                    :
                    (!showAttendanceStats ? <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flex: 1,
                        maxHeight: 500,
                        flexDirection: 'row'
                    }}
                        key={JSON.stringify(channelAttendances)}
                    >

                        <ScrollView
                            showsHorizontalScrollIndicator={true}
                            horizontal={true}
                            contentContainerStyle={{
                                height: '100%',
                                flexDirection: 'column'
                            }}
                            nestedScrollEnabled={true}
                        >
                            <View>
                                <View style={{ minHeight: 70, flexDirection: 'row', overflow: 'hidden', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#C4C4C4' }} key={"-"}>
                                    <View style={styles.col} key={'0,0'} />
                                    <View style={styles.col} key={'0,0'} >
                                        <Text style={{ fontSize: 13, color: '#1A2036', fontFamily: 'inter' }}>
                                            Total
                                        </Text>
                                    </View>
                                    {
                                        pastMeetings.map((meeting: any, col: number) => {
                                            const { title, start, end } = meeting
                                            return <View style={styles.col} key={col.toString()}>
                                                <Text style={{ textAlign: 'center', fontSize: 13, color: '#1A2036', fontFamily: 'inter' }}>
                                                    {title}
                                                </Text>
                                                <Text style={{ textAlign: 'center', fontSize: 12, color: '#1A2036', marginBottom: 5 }}>
                                                    {moment(new Date(start)).format('MMMM Do')}
                                                </Text>
                                                <Text style={{ textAlign: 'center', fontSize: 12, color: '#1A2036', marginBottom: 5 }}>
                                                    {moment(new Date(start)).format('h:mm')} - {moment(new Date(end)).format('h:mm')}
                                                </Text>
                                            </View>
                                        })
                                    }
                                </View>
                            </View>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={false}
                                contentContainerStyle={{
                                    height: '100%'
                                }}
                                nestedScrollEnabled={true}
                            >
                                <View>
                                    {
                                        channelAttendances.map((channelAttendance: any, row: number) => {

                                            const studentCount = attendanceTotalMap[channelAttendance.userId];

                                            return <View style={styles.row} key={row}>
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#1A2036', fontFamily: 'inter' }}>
                                                        {channelAttendance.fullName}
                                                    </Text>
                                                </View>
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#1A2036', fontFamily: 'inter' }}>
                                                        {studentCount} / {pastMeetings.length}
                                                    </Text>
                                                </View>
                                                {
                                                    pastMeetings.map((meeting: any, col: number) => {
                                                        const attendanceObject = channelAttendance.attendances.find((s: any) => {
                                                            return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                                                        })
                                                        return <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                            <TouchableOpacity disabled={!isOwner} onPress={() => onChangeAttendance(meeting.dateId, channelAttendance.userId, attendanceObject ? false : true)} style={{ marginBottom: 5, width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                                                                {
                                                                    attendanceObject ?
                                                                        <Ionicons name='checkmark-outline' size={15} color={'#5469D4'} />
                                                                        :
                                                                        isOwner ? <Ionicons name='checkmark-outline' size={15} color={'#e0e0e0'} /> : '-'
                                                                }
                                                            </TouchableOpacity>
                                                            {attendanceObject ? <Text style={{ textAlign: 'center', fontSize: 12, color: '#1A2036', width: '100%', }}>
                                                                {attendanceObject.joinedAt ? moment(new Date(attendanceObject.joinedAt)).format('h:mm a') : ""}
                                                            </Text> : null}
                                                        </View>
                                                    })
                                                }

                                            </View>
                                        })
                                    }
                                </View>
                            </ScrollView>
                        </ScrollView>
                        {/* {channelAttendances.length === 0 || pastMeetings.length === 0  ? 
                            null : 
                            (<View 
                                style={{ display: 'flex', flexDirection: 'column', paddingLeft: 20 }}
                            >
                                
                                <View style={styles.row} >
                                   <View style={styles.col} >
                                        <Text style={{ textAlign: 'center', fontSize: 12, color: '#1A2036' }}>
                                            Total
                                        </Text>                    
                                    </View>
                                </View>
                                    {
                                        channelAttendances.map(att => {
                                            const studentCount = attendanceTotalMap[att.userId];

                                            return (
                                            <View style={styles.row} >
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#1A2036' }}>
                                                        {studentCount} / {pastMeetings.length}
                                                    </Text>                    
                                                </View>
                                            </View>)
                                        })
                                    }
                            </View>)} */}
                    </View> : renderAttendanceChart())
            }
        </View >
    );
}

export default AttendanceList

const styles = StyleSheet.create({
    row: { minHeight: 70, flexDirection: 'row', overflow: 'hidden', borderBottomColor: '#e0e0e0', borderBottomWidth: 1 },
    col: { width: 120, justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, },
    text: {
        fontSize: 12,
        color: "#50566B",
        textAlign: "left",
        paddingHorizontal: 10
    },
    all: {
        fontSize: 14,
        color: '#1A2036',
        height: 22,
        paddingHorizontal: 20,
        backgroundColor: '#f7fafc',
        lineHeight: 22,
        fontFamily: 'inter'
    },
    allGrayFill: {
        fontSize: 14,
        color: '#fff',
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#1A2036',
        lineHeight: 22,
        fontFamily: 'inter'
    },
    allGrayOutline: {
        fontSize: 12,
        color: "#50566B",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white",
        borderRadius: 0,
        borderWidth: 1,
        borderColor: "#50566B",
        lineHeight: 20
    },
})

