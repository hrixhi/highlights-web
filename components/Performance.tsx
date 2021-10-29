import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { Text, TouchableOpacity, View } from '../components/Themed';
import _ from 'lodash'
import { fetchAPI } from '../graphql/FetchAPI';
import { findThreadsByUserId, getAllPastDates, getAttendancesByUser, getPerformanceReport } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Grades from './Grades';
import AttendanceList from './AttendanceList';

import InsetShadow from 'react-native-inset-shadow'


const Performance: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [scores, setScores] = useState<any[]>([])
    const [score, setScore] = useState<any>({})
    const [loading, setLoading] = useState(true);
    const [attendances, setAttendances] = useState<any[]>([])
    const [dates, setDates] = useState<any[]>([])
    const [attendance, setAttendance] = useState<any>({})
    const [date, setDate] = useState<any>({})
    const [thread, setThread] = useState<any>({})
    const [threads, setThreads] = useState<any[]>([])

    const [collapseMap, setCollapseMap] = useState<any>({})
    const [activeTabMap, setActiveTabMap] = useState<any>({})
    const [ownersMap, setOwnersMap] = useState<any>({});

    useEffect(() => {
        console.log('Collapse Map', collapseMap);

    }, [collapseMap])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const parsedUser: any = JSON.parse(u)

                    // FILTERS PENDING

                    const temp: any = {}
                    const tabMap: any = {}
                    const ownMap: any = {}
                    props.subscriptions.map((item: any, ind: any) => {
                        temp[ind] = true
                        if (item.channelCreatedBy.toString() === parsedUser._id.toString()) {
                            tabMap[ind] = 'scores'
                            ownMap[ind] = true
                        } else {
                            tabMap[ind] = 'overview'
                            ownMap[ind] = false
                        }

                    })
                    setCollapseMap(temp)
                    setActiveTabMap(tabMap)
                    setOwnersMap(ownMap)

                    const tempSc: any = {}
                    scores.map((sc: any) => {
                        if (!tempSc[sc.channelId]) {
                            tempSc[sc.channelId] = sc
                        }
                    })
                    setScore(tempSc)

                    const tempAtt: any = {}
                    attendances.map((att: any) => {
                        if (tempAtt[att.channelId]) {
                            tempAtt[att.channelId].push(att)
                        } else {
                            tempAtt[att.channelId] = [att]
                        }
                    })
                    setAttendance(tempAtt)

                    const tempDate: any = {}
                    dates.map((dt: any) => {
                        if (tempDate[dt.channelId]) {
                            tempDate[dt.channelId].push(dt)
                        } else {
                            tempDate[dt.channelId] = [dt]
                        }
                    })
                    setDate(tempDate)

                    const tempThread: any = {}
                    threads.map((t: any) => {
                        if (tempThread[t.channelId]) {
                            tempThread[t.channelId].push(t)
                        } else {
                            tempThread[t.channelId] = [t]
                        }
                    })
                    setThread(tempThread)

                    setLoading(false)
                }
            }
        )()


    }, [attendances, dates, props.filterStart, props.filterEnd, threads, scores, props.subscriptions])

    useEffect(() => {
        setLoading(true);
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    const server = fetchAPI(user._id)
                    server.query({
                        query: getPerformanceReport,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.user.getPerformanceReport) {
                            setScores(res.data.user.getPerformanceReport)
                            // setLoading(false)
                        }
                    }).catch(err => {
                        setLoading(false)
                    })
                    server.query({
                        query: getAttendancesByUser,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.attendance.getAttendancesByUser) {
                            setAttendances(res.data.attendance.getAttendancesByUser)
                            // setLoading(false)
                        }
                    }).catch(err => {
                        setLoading(false)
                    })
                    server.query({
                        query: getAllPastDates,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.date.getPastDates) {
                            setDates(res.data.date.getPastDates)
                            // setLoading(false)
                        }
                    }).catch(err => {
                        setLoading(false)
                    })
                    server.query({
                        query: findThreadsByUserId,
                        variables: {
                            userId: user._id
                        }
                    }).then(res => {
                        if (res.data && res.data.thread.findByUserId) {
                            setThreads(res.data.thread.findByUserId)
                            // setLoading(false)
                        }
                    }).catch(err => {
                        setLoading(false)
                    })
                }
            }
        )()
    }, [])

    const width = Dimensions.get("window").width;
    const windowHeight =
        width < 1024 ? Dimensions.get("window").height - 0 : Dimensions.get("window").height;

    const data = [["Channel", "Score", "Total"]];
    scores.map((score: any) => {
        data.push([score.channelName, Number(score.score) / Number(score.total), Number(score.total) - Number(score.score) / Number(score.total)])
    })

    const renderTabs = (index: number) => {

        const activeTab = activeTabMap[index];
        const isOwner = ownersMap[index]


        return (<View style={{ flexDirection: "row", marginBottom: 20, paddingTop: 10, backgroundColor: '#efefef', }}>
            {isOwner ? null : <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column",
                    backgroundColor: '#efefef',
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(activeTabMap))
                    temp[index] = 'overview'
                    setActiveTabMap(temp)
                }}>
                <Text style={activeTab === 'overview' ? styles.allGrayFill : styles.all}>
                    <Ionicons name='clipboard-outline' size={18} />
                </Text>
                <Text style={activeTab === 'overview' ? styles.allGrayFill : styles.all}>
                    Overview
                </Text>
            </TouchableOpacity>}
            {/* <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(activeTabMap))
                    temp[index] = 'statistics'
                    setActiveTabMap(temp)
                }}>
                <Text style={activeTab === 'statistics' ? styles.allGrayFill : styles.all}>
                    <Ionicons name='analytics-outline' size={25} />
                </Text>
            </TouchableOpacity> */}
        </View>)
    }

    const chartConfig = {
        backgroundColor: '#000000',
        backgroundGradientFrom: '#1E2923',
        backgroundGradientTo: '#08130D',
        fontFamily: "inter",
        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForLabels: {
            fontFamily: 'overpass; Arial',
        },
    }

    if (loading) {
        return <View style={{
            width: '100%',
            height: '100%',
            flex: 1,
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            alignSelf: 'center',
            marginTop: 100,
        }}>
            <ActivityIndicator color={'#1F1F1F'} />
        </View>
    }

    return <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', backgroundColor: '#efefef', paddingBottom: 50 }}>
        {
            props.activeTab === "attendance" ? <AttendanceList
                channelId={props.channelId}
                channelCreatedBy={props.channelCreatedBy}
                channelColor={props.colorCode}
            /> : (
                props.isEditor ? null :
                    <View style={{
                        maxWidth: 500, alignSelf: 'center', width: '100%', backgroundColor: 'white', borderLeftWidth: 3, borderLeftColor: props.colorCode, paddingVertical: 20, paddingHorizontal: 40, borderRadius: 1, shadowOffset: {
                            width: 2,
                            height: 2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        zIndex: 5000000
                    }}>
                        <View style={{ flexDirection: 'row', flex: 1, paddingTop: 20, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 17, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Meetings
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                    {attendance[props.channelId] ? attendance[props.channelId].length : 0} / {date[props.channelId] ? date[props.channelId].length : 0}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 17, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Posts
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                    {thread[props.channelId] ? thread[props.channelId].length : 0}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1, marginTop: 10, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 17, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Assessments
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                    {score[props.channelId] ? score[props.channelId].totalAssessments : 0}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 25 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 14, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Late
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                    {score[props.channelId] ? score[props.channelId].lateAssessments : 0}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 25 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 14, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Graded
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                    {score[props.channelId] ? score[props.channelId].gradedAssessments : 0}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 25 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 14, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Submitted
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10, }}>
                                <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                    {score[props.channelId] ? score[props.channelId].submittedAssessments : 0}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 17, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Grade
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                    {score[props.channelId] ? score[props.channelId].score : 0}%
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10, paddingBottom: 20, backgroundColor: 'white', }}>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{
                                    flex: 1, flexDirection: 'row',
                                    color: '#1F1F1F',
                                    fontSize: 17, lineHeight: 25,
                                    fontFamily: 'inter'
                                }} ellipsizeMode='tail'>
                                    Progress
                                </Text>
                            </View>
                            <View style={{ flex: 1, backgroundColor: 'white', paddingLeft: 10 }}>
                                <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                    {score[props.channelId] ? score[props.channelId].total : 0}%
                                </Text>
                            </View>
                        </View>
                    </View>)
        }
        {
            props.activeTab === 'attendance' ? null :
                <Grades
                    closeModal={() => { }}
                    channelId={props.channelId}
                    channelCreatedBy={props.channelCreatedBy}
                    filterChoice={props.channelName}
                    openCueFromGrades={(cueId: string) => {
                        props.openCueFromGrades(props.channelId, cueId, props.channelCreatedBy)
                    }}
                    activeTab={props.activeTab}
                    channelColor={props.colorCode}
                />
        }
    </View>
}

export default Performance

const styles = StyleSheet.create({
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: 'white'
    },
    all: {
        fontSize: 10,
        color: '#000000',
        height: 20,
        paddingHorizontal: 7,
        backgroundColor: '#efefef',
        // fontWeight: 'bold',
        // textTransform: 'uppercase',
        lineHeight: 20,
        textAlign: 'center',
        fontFamily: 'inter'
    },
    allGrayFill: {
        fontSize: 10,
        color: '#006AFF',
        height: 20,
        // fontWeight: 'bold',
        paddingHorizontal: 7,
        backgroundColor: '#efefef',
        // textTransform: 'uppercase',
        lineHeight: 20,
        textAlign: 'center',
        fontFamily: 'inter'
    },
});
