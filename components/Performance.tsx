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

const Performance: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [scores, setScores] = useState<any[]>([])
    const [score, setScore] = useState<any>({})
    const styleObject = styles();
    const [loading, setLoading] = useState(true);
    const [attendances, setAttendances] = useState<any[]>([])
    const [dates, setDates] = useState<any[]>([])
    const [attendance, setAttendance] = useState<any>({})
    const [date, setDate] = useState<any>({})
    const [thread, setThread] = useState<any>({})
    const [threads, setThreads] = useState<any[]>([])

    const [collapseMap, setCollpaseMap] = useState<any>({})

    useEffect(() => {

        // FILTERS PENDING

        const temp: any = {}
        props.subscriptions.map((item: any, ind: any) => {
            temp[ind] = true
        })
        setCollpaseMap(temp)

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

    console.log(score)

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
            <ActivityIndicator color={'#818385'} />
        </View>
    }

    return <View style={{
        width: "100%",
        height: windowHeight - 85,
        backgroundColor: "white",
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        flexDirection: width < 768 ? 'column' : 'row',
        paddingTop: 30
    }}>
        <View style={{ width: width < 768 ? '100%' : '50%', paddingRight: 30, borderRightWidth: width < 768 ? 0 : 1, borderColor: '#eeeeee' }}>
            <Text style={{
                marginRight: 10,
                color: '#43434f',
                fontSize: 23,
                marginBottom: 40,
                fontFamily: 'inter',
                // flex: 1,
                lineHeight: 25,
                height: width < 768 ? 30 : 65,
            }}>
                Report
            </Text>
            <ScrollView
            // horizontal={true}
            >
                {
                    props.subscriptions.map((sub: any, ind: any) => {
                        return <View style={{
                            backgroundColor: '#fff',
                            borderColor: '#eeeeee',
                            borderBottomWidth: 1,
                            paddingBottom: 20,
                            marginBottom: 20,
                            // minWidth: 300, // flex: 1,
                            width: '100%'
                        }}>
                            <View style={{ flexDirection: 'row', flex: 1, marginBottom: 20 }}>
                                <Text style={{
                                    fontSize: 23,
                                    paddingBottom: 30,
                                    paddingTop: 10,
                                    fontFamily: 'inter',
                                    flex: 1,
                                    flexDirection: 'row',
                                    lineHeight: 23
                                }}>
                                    <View style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        marginTop: 1,
                                        backgroundColor: sub.colorCode
                                    }} /> {sub.channelName}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, paddingTop: 20 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 20, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Attendance
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 23, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {attendance[sub.channelId] ? attendance[sub.channelId].length : 0} / {date[sub.channelId] ? date[sub.channelId].length : 0}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, paddingTop: 20 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 20, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Posts
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 23, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {thread[sub.channelId] ? thread[sub.channelId].length : 0}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, marginTop: 20 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 20, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Assessments
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 23, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {score[sub.channelId] ? score[sub.channelId].totalAssessments : 0}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, paddingTop: 15 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 25 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 15, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Late
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                        {score[sub.channelId] ? score[sub.channelId].lateAssessments : 0}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, paddingTop: 15 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 25 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 15, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Graded
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                        {score[sub.channelId] ? score[sub.channelId].gradedAssessments : 0}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, paddingTop: 15 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 25 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 15, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Submitted
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 20, lineHeight: 25, textAlign: 'right' }} ellipsizeMode='tail'>
                                        {score[sub.channelId] ? score[sub.channelId].submittedAssessments : 0}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, paddingTop: 20 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 20, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Grade
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 23, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {score[sub.channelId] ? score[sub.channelId].score : 0}%
                                    </Text>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', flex: 1, paddingTop: 20 }}>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{
                                        flex: 1, flexDirection: 'row',
                                        color: '#818385',
                                        fontSize: 20, lineHeight: 25,
                                        fontFamily: 'inter'
                                    }} ellipsizeMode='tail'>
                                        Weight
                                    </Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                    <Text style={{ fontSize: 23, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {score[sub.channelId] ? score[sub.channelId].total : 0}%
                                    </Text>
                                </View>
                            </View>
                            {
                                !collapseMap[ind] ? <View>
                                    <Grades
                                        closeModal={() => { }}
                                        channelId={sub.channelId}
                                        channelCreatedBy={sub.channelCreatedBy}
                                        filterChoice={sub.channelName}
                                        openCueFromGrades={(cueId: string) => {
                                            // openCueFromCalendar(channelId, cueId, channelCreatedBy)
                                        }}
                                    />
                                </View> : null
                            }
                            <TouchableOpacity
                                onPress={() => {
                                    const temp = JSON.parse(JSON.stringify(collapseMap))
                                    temp[ind] = !temp[ind]
                                    setCollpaseMap(temp)
                                }}
                                style={{ width: '100%' }}
                            >
                                <Text style={{ width: '100%', textAlign: 'center' }}>
                                    <Ionicons name={collapseMap[ind] ? 'chevron-down-outline' : 'chevron-up-outline'} size={30} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    })
                }
            </ScrollView>
        </View>
        <View style={{ width: width < 768 ? '100%' : '50%', paddingLeft: width < 768 ? 0 : 30 }}>
            <Text style={{
                marginRight: 10,
                color: '#43434f',
                fontSize: 23,
                paddingBottom: 20,
                fontFamily: 'inter',
                // flex: 1,
                lineHeight: 25,
                // height: 65
            }}>
                Progress
            </Text>
            <ScrollView
                showsVerticalScrollIndicator={false}
                horizontal={false}
                nestedScrollEnabled={true}
                // style={{ height: '100%' }}
                contentContainerStyle={{
                    // borderWidth: 2,
                    width: '100%',
                }}
            >
                {
                    scores.length > 0 ?
                        <ScrollView
                            horizontal={true}
                        >
                            <Chart
                                style={{ minHeight: 550, minWidth: 700 }}
                                chartType="BarChart"
                                loader={<div>Loading Chart</div>}
                                data={data}
                                options={{
                                    // Material design options
                                    fontName: 'overpass',
                                    chartArea: { width: '70%' },
                                    isStacked: true,
                                    hAxis: {
                                        title: 'Score',
                                        minValue: 0,
                                        maxValue: 100
                                    },
                                    // vAxis: {
                                    //     title: 'Channel',
                                    // },
                                    legend: 'top'
                                }}
                            />
                        </ScrollView> : (loading ? null :
                            <Text style={{ fontSize: 15, color: '#818385', textAlign: 'center', fontFamily: 'inter', backgroundColor: '#fff' }}>
                                {PreferredLanguageText('noCuesCreated')}
                            </Text>)
                }
                {/* {
                    scores.map((sc: any, index) => {
                        return <View style={styleObject.col} key={index}>
                            <ScoreCard
                                score={sc}
                                onPress={props.onPress}
                            />
                        </View>
                    })
                } */}
            </ScrollView>
        </View>
    </View >
}

export default Performance

const styles: any = () => StyleSheet.create({
    col: {
        width: '100%',
        height: 80,
        marginBottom: 15,
        backgroundColor: 'white'
    },
});
