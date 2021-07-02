import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Switch, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from './Themed';
import _ from 'lodash'
import moment from 'moment'
import { PreferredLanguageText } from '../helpers/LanguageContext';
import Datetime from "react-datetime";
import XLSX from "xlsx";

const AttendanceList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedPastMeetings: any[] = JSON.parse(JSON.stringify(props.pastMeetings))
    const unparsedChannelAttendances: any[] = JSON.parse(JSON.stringify(props.channelAttendances))
    const [pastMeetings, setPastMeetings] = useState<any[]>(unparsedPastMeetings)
    const [channelAttendances, setChannelAttendances] = useState<any[]>(unparsedChannelAttendances)   
    
    const [enableFilter, setEnableFilter] = useState(false);
    const [end, setEnd] = useState(new Date());
    const [start, setStart] = useState(new Date(end.getTime() - (2630000 * 60 * 10)));
    
    const [attendanceTotalMap, setAttendanceTotalMap] = useState<any>({});

    const [exportAoa, setExportAoa] = useState<any[]>()

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

        // console.log(studentTotalMap)
        setAttendanceTotalMap(studentTotalMap)
        
        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [""];

        pastMeetings.forEach(meeting => {
            row1.push(moment(new Date(meeting.start)).format('MMMM Do YYYY, h:mm a'))
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
                    userRow.push(`Joined at ${moment(new Date(attendanceObject.joinedAt)).format('MMMM Do YYYY, h:mm a')}`)
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
        if (enableFilter) {

            const filteredPastMeetings = unparsedPastMeetings.filter(meeting => {
                return (new Date(meeting.start) > start && new Date(meeting.end) < end) 
            })

            setPastMeetings(filteredPastMeetings);
            
        } else {

            setPastMeetings(unparsedPastMeetings)
        }

    }, [enableFilter, start, end])

    const exportAttendance = () => {
        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Attendance ");
		/* generate XLSX file and send to client */
		XLSX.writeFile(wb, "attendance.xlsx")
    }

    const width = Dimensions.get("window").width;


    return (
        <View style={{
            backgroundColor: 'white',
            width: '100%',
            height: '100%',
            paddingHorizontal: 20,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
            </Text>
            <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25 }}>
                <TouchableOpacity
                    key={Math.random()}
                    style={{
                        flex: 1,
                        backgroundColor: 'white'
                    }}
                    onPress={() => {
                        props.hideChannelAttendance()                  
                    }}>
                        <Text style={{
                            width: '100%',
                            fontSize: 15,
                            color: '#a2a2aa'
                        }}>
                            <Ionicons name='chevron-back-outline' size={17} color={'#202025'} style={{ marginRight: 10 }} /> {PreferredLanguageText('attendance')}
                        </Text>
                </TouchableOpacity>
            </View>

            {/* Export Buttons */}
            
            {pastMeetings.length === 0 || channelAttendances.length === 0 ?  null : 
            <View style={{ display: 'flex', flexDirection: 'row', marginVertical: 25 }}>
            <TouchableOpacity
                                onPress={async () => {
                                    exportAttendance()
                                }}
                                style={{
                                    borderRadius: 15,
                                    backgroundColor: 'white'
                                }}>
                                {
                                  
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#3B64F8',
                                            borderRadius: 15,
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            EXPORT
                                    </Text> 
                                }
                </TouchableOpacity>
            </View>
            }
            {/* Filters */}

            {unparsedPastMeetings.length === 0 || channelAttendances.length === 0 ?  null : <View>

            <View style={{ display: 'flex', width: "100%", flexDirection: width < 768 ? "column" : "row", marginBottom: 30, }} >


            <View style={{ width: width < 768 ? "100%" : "33.33%", display: "flex" }}>
                <View style={{ width: "100%", paddingTop: width < 768 ? 40 : 0, paddingBottom: 15, backgroundColor: "white" }}>
                    <Text style={{ fontSize: 12, color: "#a2a2aa" }}>Filter</Text>
                </View>
                <View
                    style={{
                        backgroundColor: "white",
                        height: 40,
                        marginRight: 10
                    }}>
                    <Switch
                        value={enableFilter}
                        onValueChange={() => setEnableFilter(!enableFilter)}
                        style={{ height: 20 }}
                        trackColor={{
                            false: "#f4f4f6",
                            true: "#3B64F8"
                        }}
                        activeThumbColor="white"
                    />
                </View>
            </View>


                                    {!enableFilter ? null : <View
                                        style={{
                                            width: width < 768 ? "100%" : "30%",
                                            flexDirection: "row",
                                            marginTop: 12,
                                            marginLeft: 0
                                        }}>
                                        <Text style={styles.text}>{PreferredLanguageText("start")} Date</Text>
                                        <Datetime
                                            value={start}
                                            onChange={(event: any) => {
                                                const date = new Date(event);
                                                setStart(date);
                                            }}
                                        />
                                    </View>}
                                    {!enableFilter ? null : <View
                                        style={{
                                            width: width < 768 ? "100%" : "30%",
                                            flexDirection: "row",
                                            marginTop: 12,
                                            marginLeft: width < 768 ? 0 : 10
                                        }}>
                                        <Text style={styles.text}>{PreferredLanguageText("end")} Date</Text>
                                        <Datetime
                                            value={end}
                                            onChange={(event: any) => {
                                                const date = new Date(event);
                                                setEnd(date);
                                            }}
                                        />
                                    </View>}
                                </View>

            </View>}
           
            {
                channelAttendances.length === 0 || pastMeetings.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a2a2aa', fontSize: 22, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                pastMeetings.length === 0  ? "No past meetings" : "No Students"
                                // PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    <View style={{
                        width: '80%',
                        backgroundColor: 'white',
                        flex: 1,
                        flexDirection: 'row'
                    }}
                        key={JSON.stringify(channelAttendances)}
                    >
                        
                        <ScrollView
                            showsHorizontalScrollIndicator={true}
                            horizontal={true}
                            contentContainerStyle={{
                                height: '100%'
                            }}
                            nestedScrollEnabled={true}
                        >
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={false}
                                contentContainerStyle={{
                                    height: '100%'
                                }}
                                nestedScrollEnabled={true}
                            >
                                <View>
                                    <View style={styles.row} key={"-"}>
                                        <View style={styles.col} key={'0,0'} />
                                        {
                                            pastMeetings.map((meeting: any, col: number) => {
                                                const { title, start } = meeting
                                                return <View style={styles.col} key={col.toString()}>
                                                    <Text style={{ textAlign: 'center', fontSize: 13, color: '#202025', fontFamily: 'inter' }}>
                                                        {title}
                                                    </Text>
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025' }}>
                                                        {moment(new Date(start)).format('MMMM Do YYYY, h:mm a')}
                                                    </Text>
                                                </View>
                                            })
                                        }

                                    </View>
                                    {
                                        channelAttendances.map((channelAttendance: any, row: number) => {

                                            return <View style={styles.row} key={row}>
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#202025', fontFamily: 'inter' }}>
                                                        {channelAttendance.fullName}
                                                    </Text>
                                                    <Text style={{ textAlign: 'left', fontSize: 12, color: '#202025' }}>
                                                        {channelAttendance.displayName}
                                                    </Text>
                                                </View>
                                                {
                                                    pastMeetings.map((meeting: any, col: number) => {
                                                        const attendanceObject = channelAttendance.attendances.find((s: any) => {
                                                            return s.dateId.toString().trim() === meeting.dateId.toString().trim()
                                                        })
                                                        return <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                            <Text style={{ textAlign: 'center', fontSize: 12, color: '#a2a2aa' }}>
                                                                {
                                                                    attendanceObject ? "Present" : '-'
                                                                }
                                                            </Text>
                                                            {attendanceObject ? <Text style={{ textAlign: 'left', fontSize: 12, color: '#202025' }}>
                                                                {PreferredLanguageText('joinedAt') + ' ' + moment(new Date(attendanceObject.joinedAt)).format('h:mm a')}
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
                        {channelAttendances.length === 0 || pastMeetings.length === 0  ? 
                            null : 
                            (<View 
                                style={{ display: 'flex', flexDirection: 'column', paddingLeft: 20 }}
                            >
                                
                                <View style={styles.row} >
                                   <View style={styles.col} >
                                        <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025' }}>
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
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#202025' }}>
                                                        {studentCount} / {pastMeetings.length}
                                                    </Text>                    
                                                </View>
                                            </View>)
                                        })
                                    }
                            </View>)}
                    </View>
            }
        </View >
    );
}

export default AttendanceList

const styles = StyleSheet.create({
    row: { height: 70, borderRadius: 15, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#f4f4f6', },
    col: { width: 100, justifyContent: 'center', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f4f6', padding: 5 },
    text: {
        fontSize: 12,
        color: "#a2a2aa",
        textAlign: "left",
        paddingHorizontal: 10
    },
})

