import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { Text, TouchableOpacity, View } from '../components/Themed';
import _ from 'lodash'
import { fetchAPI } from '../graphql/FetchAPI';
import { findThreadsByUserId, getAllPastDates, getAttendancesByUser, getPerformanceReport } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScoreCard from './ScoreCard';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import Chart from 'react-google-charts';
import { Ionicons } from '@expo/vector-icons';
import Grades from './Grades';
import AttendanceList from './AttendanceList';

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

    const [collapseMap, setCollpaseMap] = useState<any>({})
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
                    setCollpaseMap(temp)
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
        width < 1024 ? Dimensions.get("window").height - 30 : Dimensions.get("window").height;

    const data = [["Channel", "Score", "Total"]];
    scores.map((score: any) => {
        data.push([score.channelName, Number(score.score) / Number(score.total), Number(score.total) - Number(score.score) / Number(score.total)])
    })

    const renderTabs = (index: number) => {

        const activeTab = activeTabMap[index];
        const isOwner = ownersMap[index]


        return (<View style={{ flexDirection: "row", marginBottom: 20, paddingTop: 5 }}>
            {isOwner ? null : <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(activeTabMap))
                    temp[index] = 'overview'
                    setActiveTabMap(temp)
                }}>
                <Text style={activeTab === 'overview' ? styles.allGrayFill : styles.all}>
                    <Ionicons name='clipboard-outline' size={15} />
                </Text>
                <Text style={activeTab === 'overview' ? styles.allGrayFill : styles.all}>
                    Overview
                </Text>
            </TouchableOpacity>}
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(activeTabMap))
                    temp[index] = 'scores'
                    setActiveTabMap(temp)
                }}>
                <Text style={activeTab === 'scores' ? styles.allGrayFill : styles.all}>
                    <Ionicons name='stats-chart-outline' size={15} />
                </Text>
                <Text style={activeTab === 'scores' ? styles.allGrayFill : styles.all}>
                    Scores
                </Text>
            </TouchableOpacity>
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
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    const temp = JSON.parse(JSON.stringify(activeTabMap))
                    temp[index] = 'attendance'
                    setActiveTabMap(temp)
                }}>
                <Text style={activeTab === 'attendance' ? styles.allGrayFill : styles.all}>
                    <Ionicons name='hand-left-outline' size={15} />
                </Text>
                <Text style={activeTab === 'attendance' ? styles.allGrayFill : styles.all}>
                    Attendance
                </Text>
            </TouchableOpacity>
        </View>)
    }

    const chartConfig = {
        backgroundColor: '#1A2036',
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
            <ActivityIndicator color={'#50566B'} />
        </View>
    }

    return <View style={{
        width: "100%",
        // height: windowHeight - ,
        backgroundColor: "white",
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        flexDirection: width < 1024 ? 'column' : 'row',
    }}>
        <View style={{ width: '100%', }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    maxHeight: width < 1024 ? Dimensions.get("window").height - 115 : Dimensions.get("window").height - 52,
                }}
            >
                {
                    props.subscriptions.map((sub: any, ind: any) => {
                        return <View style={{
                            backgroundColor: '#fff',
                            borderColor: '#E3E8EE',
                            borderBottomWidth: 1,
                            marginTop: 10,
                            // paddingBottom: 5,
                            width: '100%'
                        }}>
                            <View style={{ flexDirection: 'row', paddingBottom: collapseMap[ind] ? 0 : 0, maxWidth: 1000, alignSelf: 'center', width: '100%' }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row'
                                    }}
                                    onPress={() => {
                                        const temp = JSON.parse(JSON.stringify(collapseMap))
                                        temp[ind] = !temp[ind]
                                        setCollpaseMap(temp)
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 16,
                                        paddingBottom: 15,
                                        paddingTop: 10,
                                        fontFamily: 'inter',
                                        // flex: 1,
                                        flexDirection: 'row',
                                        lineHeight: 16,
                                    }}>
                                        <View style={{
                                            width: 14,
                                            marginRight: 5,
                                            height: 14,
                                            borderRadius: 9,
                                            // marginTop: 1,
                                            backgroundColor: sub.colorCode
                                        }} /> {sub.channelName}
                                    </Text>
                                </TouchableOpacity>
                                {!collapseMap[ind] ? renderTabs(ind) : null}
                                <TouchableOpacity
                                    onPress={() => {
                                        const temp = JSON.parse(JSON.stringify(collapseMap))
                                        temp[ind] = !temp[ind]
                                        setCollpaseMap(temp)
                                    }}
                                >
                                    <Text style={{
                                        textAlign: 'center',
                                        lineHeight: 30,
                                        paddingTop: 5,
                                        paddingLeft: 5
                                    }}>
                                        <Ionicons name={!collapseMap[ind] ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={!collapseMap[ind] ? '#50566B' : '#5469D4'} />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {
                                !collapseMap[ind] ? <View style={{ width: '100%', maxWidth: 1000, alignSelf: 'center' }}>
                                    {/* Render Tabs to switch between Grades, Stats and Attendance */}
                                    {activeTabMap[ind] === "scores" || activeTabMap[ind] === "statistics" ? <Grades
                                        closeModal={() => { }}
                                        channelId={sub.channelId}
                                        channelCreatedBy={sub.channelCreatedBy}
                                        filterChoice={sub.channelName}
                                        openCueFromGrades={(cueId: string) => {
                                            props.openCueFromGrades(sub.channelId, cueId, sub.channelCreatedBy)
                                        }}
                                        activeTab={activeTabMap[ind]}
                                    /> :
                                        (
                                            activeTabMap[ind] === "attendance" ? <AttendanceList
                                                channelId={sub.channelId}
                                                channelCreatedBy={sub.channelCreatedBy}
                                            /> : <View style={{ maxWidth: 1000, alignSelf: 'center', width: '100%' }}>
                                                <View style={{ flexDirection: 'row', flex: 1, paddingTop: 20 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 17, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Attendance
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                            {attendance[sub.channelId] ? attendance[sub.channelId].length : 0} / {date[sub.channelId] ? date[sub.channelId].length : 0}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 17, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Posts
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                            {thread[sub.channelId] ? thread[sub.channelId].length : 0}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', flex: 1, marginTop: 10 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 17, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Assessments
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                            {score[sub.channelId] ? score[sub.channelId].totalAssessments : 0}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 25 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 14, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Late
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                                            {score[sub.channelId] ? score[sub.channelId].lateAssessments : 0}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 25 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 14, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Graded
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                                            {score[sub.channelId] ? score[sub.channelId].gradedAssessments : 0}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 25 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 14, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Submitted
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                                            {score[sub.channelId] ? score[sub.channelId].submittedAssessments : 0}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 17, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Grade
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                            {score[sub.channelId] ? score[sub.channelId].score : 0}%
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', flex: 1, paddingTop: 10, paddingBottom: 20 }}>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{
                                                            flex: 1, flexDirection: 'row',
                                                            color: '#50566B',
                                                            fontSize: 17, lineHeight: 25,
                                                            fontFamily: 'inter'
                                                        }} ellipsizeMode='tail'>
                                                            Progress
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                        <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                                            {score[sub.channelId] ? score[sub.channelId].total : 0}%
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                </View> : null
                            }
                        </View>
                    })
                }
            </ScrollView>
        </View>
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
        color: '#50566B',
        height: 20,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        // textTransform: 'uppercase',
        lineHeight: 20,
        textAlign: 'center'
        // fontFamily: 'inter'
    },
    allGrayFill: {
        fontSize: 10,
        color: '#5469D4',
        height: 20,
        paddingHorizontal: 5,
        backgroundColor: '#fff',
        // textTransform: 'uppercase',
        lineHeight: 20,
        textAlign: 'center'
        // fontFamily: 'inter'
    },
});
