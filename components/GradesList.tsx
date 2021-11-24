import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions, TextInput } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import XLSX from "xlsx"
import * as FileSaver from 'file-saver';
// import { PieChart } from 'react-native-svg-charts'
import { Chart } from "react-google-charts";

import {
    LineChart,
    BarChart,
    PieChart
} from "react-native-chart-kit";
import { Ionicons } from '@expo/vector-icons';
import { TextInput as CustomTextInput } from "../components/CustomTextInput"

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores))
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const unparsedSubmissionStatistics: any[] = JSON.parse(JSON.stringify(props.submissionStatistics))
    const [scores, setScores] = useState<any[]>(unparsedScores)
    const [cues] = useState<any[]>(unparsedCues.sort((a: any, b: any) => {
        return a.deadline < b.deadline ? -1 : 1
    }))
    const styles = stylesObject(props.isOwner)
    const [submissionStatistics, setSubmissionStatistics] = useState<any[]>(unparsedSubmissionStatistics)
    const [exportAoa, setExportAoa] = useState<any[]>()
    const [activeCueId, setActiveCueId] = useState("")
    const [activeUserId, setActiveUserId] = useState("")
    const [activeScore, setActiveScore] = useState("");
    const [studentSearch, setStudentSearch] = useState("");

    useEffect(() => {
        if (studentSearch === "") {
            setScores(JSON.parse(JSON.stringify(props.scores)))
        } else {

            const allStudents = JSON.parse(JSON.stringify(props.scores))

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase())
            })

            setScores(matches);

        }
    }, [studentSearch])

    useEffect(() => {

        const filterUnreleased = submissionStatistics.filter((stat: any) => {
            const { cueId } = stat;

            const findCue = cues.find((u: any) => {
                return u._id.toString() === cueId.toString();
            })

            const { cue, releaseSubmission } = findCue;

            if (!releaseSubmission) {
                return false;
            }

            return true

        })

        setSubmissionStatistics(filterUnreleased)

    }, [cues, props.submissionStatistics])

    // Statistics
    const [showStatistics, setShowStatistics] = useState(false);

    useEffect(() => {

        if (props.scores.length === 0 || cues.length === 0) {
            return;
        }

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [""];

        cues.forEach(cue => {

            const { title } = htmlStringParser(cue.cue)

            row1.push(`${title} (${cue.gradeWeight}%)`)
        })

        row1.push("Total")

        exportAoa.push(row1);

        scores.forEach((score: any) => {

            let totalPoints = 0;
            let totalScore = 0;
            score.scores.map((s: any) => {
                if (s.graded) {
                    totalPoints += (Number(s.gradeWeight) * Number(s.score))
                    totalScore += Number(s.gradeWeight)
                }
            })

            let userRow = [];

            userRow.push(score.fullName)

            cues.forEach(cue => {

                const scoreObject = score.scores.find((s: any) => {
                    return s.cueId.toString().trim() === cue._id.toString().trim()
                })

                if (scoreObject && scoreObject.graded) {
                    userRow.push(scoreObject.score)
                } else {
                    userRow.push('-')
                }

            })

            const pointsToAdd = totalScore !== 0 ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/,'') + "%" : '0'

            // Add Total here
            userRow.push(pointsToAdd)

            exportAoa.push(userRow)

        })

        setExportAoa(exportAoa)


    }, [scores, cues])

    const exportGrades = () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Grades ");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, "grades" + fileExtension);

    }

    const modifyGrade = () => {
        props.modifyGrade(activeCueId, activeUserId, activeScore);
        setActiveCueId('')
        setActiveUserId('')
        setActiveScore('')
    }

    const renderGradeStatsTabs = () => {
        return (<View style={{ flexDirection: "row", backgroundColor: '#efefef' }}>
            {/* <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    setShowStatistics(false);
                }}>
                <Text style={!showStatistics ? styles.allGrayFill : styles.all}>
                    Scores
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={{
                    justifyContent: "center",
                    flexDirection: "column"
                }}
                onPress={() => {
                    setShowStatistics(true);
                }}>
                <Text style={showStatistics ? styles.allGrayFill : styles.all}>Statistics</Text>
            </TouchableOpacity> */}
            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', width: '100%', backgroundColor: '#efefef', marginBottom: 20 }}>
                {(scores.length === 0 || cues.length === 0 || !props.isOwner) ? null :
                    <TouchableOpacity
                        onPress={() => {
                            exportGrades()
                        }}
                        style={{
                            backgroundColor: '#efefef',
                            overflow: 'hidden',
                            height: 35,
                            // marginTop: 15,
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 34,
                            color: '#006AFF',
                            fontSize: 12,
                            borderColor: '#006AFF',
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            height: 35,
                            borderWidth: 1,
                            // width: 100,
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            DOWNLOAD
                        </Text>
                    </TouchableOpacity>
                }
            </View>
        </View>)
    }

    const screenWidth = Dimensions.get("window").width;

    const renderStatistics = () => {


        const mapCuesData: any = {};

        const mapCuesCounts: any = {};

        const mapCuesStatistics: any = {};


        cues.map((cue: any) => {

            const filteredStatistic = submissionStatistics.filter((stat: any) => stat.cueId === cue._id)

            if (filteredStatistic.length === 0) return;

            const { min, max, mean, median, std, submissionCount } = filteredStatistic[0];

            mapCuesStatistics[cue._id] = filteredStatistic[0]
            mapCuesData[cue._id] = [max, min, mean, median, std]
            mapCuesCounts[cue._id] = submissionCount

        })


        const statisticsLabels = ["Max", "Min", "Mean", "Median", "Std Dev"]


        const randomColor = () => ('#' + ((Math.random() * 0xffffff) << 0).toString(16) + '000000').slice(0, 7)

        // PIE CHART FOR GRADE WEIGHTS

        // ADD MORE COLORS HERE LATER
        const colors = ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#35AC78", "#f95d6a", "#ff7c43", "#ffa600"]

        const nonZeroGradeWeight = cues.filter((cue: any) => cue.gradeWeight > 0)

        const pieChartData = nonZeroGradeWeight.map((cue: any, index: number) => {

            const { title } = htmlStringParser(cue.cue)

            let color = "";

            if (index < colors.length) {
                color = colors[index]
            } else {
                // Fallack
                color = randomColor()
            }

            return {
                gradeWeight: cue.gradeWeight,
                name: title,
                color,
                legendFontColor: "#7F7F7F",
                legendfontSize: 14,

            }
        })

        const data = [["", "Min", "Max", "Mean", "Median", "Standard Deviation"]];

        const chartData = submissionStatistics.map((stat: any) => {
            const { cueId, min, max, mean, median, std } = stat;

            const cue = cues.filter((cue: any) => {
                return cueId === cue._id
            })

            const { title } = htmlStringParser(cue[0].cue);

            let cueStats = [title, min, max, mean, median, std];

            data.push(cueStats)
        })

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


        return (<View style={{
            width: '100%',
            backgroundColor: 'white',
            flex: 1,
            paddingLeft: Dimensions.get("window").width < 1024 ? 0 : 50,
            paddingTop: 30
        }}
            key={JSON.stringify(props.scores)}
        >
            <ScrollView
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                contentContainerStyle={{
                    height: '100%',
                    flexDirection: 'column'
                }}
                nestedScrollEnabled={true}
            >
                <View style={{ width: '100%' }}>
                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#000000', fontFamily: 'inter', paddingBottom: 20, paddingLeft: Dimensions.get('window').width < 1024 ? 0 : 150 }}>
                        Grade Weightage
                    </Text>
                    <PieChart
                        data={pieChartData}
                        width={Dimensions.get('window').width < 1024 ? 350 : 500}
                        height={Dimensions.get('window').width < 1024 ? 150 : 200}
                        chartConfig={chartConfig}
                        accessor={"gradeWeight"}
                        backgroundColor={"transparent"}
                        paddingLeft={Dimensions.get('window').width < 1024 ? "10" : "50"}
                        // center={[10, 50]}
                        hasLegend={true}
                    />
                </View>

                {submissionStatistics.length > 0 ? <View style={{ width: '100%' }}>
                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#000000', fontFamily: 'inter', paddingTop: 50, paddingBottom: 20, paddingLeft: Dimensions.get('window').width < 1024 ? 0 : 150 }}>
                        Submissions
                    </Text>
                    <Chart
                        width={Dimensions.get('window').width < 1024 ? '350px' : '600px'}
                        height={Dimensions.get('window').width < 1024 ? '300px' : '400px'}
                        chartType="Bar"
                        loader={<div>Loading Chart</div>}
                        data={data}
                        options={{
                            // Material design options
                            fontName: 'overpass'
                        }}
                    />
                </View> : null}
            </ScrollView>

            <View style={{ height: 20 }} />
        </View>)


    }

    return (
        <View style={{
            backgroundColor: '#efefef',
            width: '100%',
            height: '100%',
            // paddingRight: 20,
            // paddingLeft: Dimensions.get('window').width < 1024 ? 20 : 0,
        }}>
            {renderGradeStatsTabs()}
            {
                props.scores.length === 0 || cues.length === 0 ?
                    <View style={{ backgroundColor: '#efefef' }}>
                        <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 20, paddingVertical: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                cues.length === 0 ? PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    (props.activeTab === "scores" ? <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        // flex: 1,
                        paddingTop: 10,
                        maxHeight: 650,
                        paddingHorizontal: 10,
                        borderRadius: 1,
                        borderLeftColor: props.channelColor,
                        borderLeftWidth: 3,
                        shadowOffset: {
                            width: 2,
                            height: 2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        zIndex: 5000000,
                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                        justifyContent: props.isOwner ? 'flex-start' : 'center',
                        overflow:  props.isOwner ? 'scroll' : 'visible',
                    }}
                        key={JSON.stringify(props.scores)}
                    >
                        {/* Performance report */}

                        {props.isOwner ? null : <View style={{ display: 'flex', flexDirection: 'column', maxWidth: 300, width: Dimensions.get('window').width < 768 ? '100%' : '50%', alignSelf: 'center', paddingTop: 0, paddingBottom: 25 }}>
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
                                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {props.attendance[props.channelId] ? props.attendance[props.channelId].length : 0} / {props.date[props.channelId] ? props.date[props.channelId].length : 0}
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
                                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {props.thread[props.channelId] ? props.thread[props.channelId].length : 0}
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
                                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {props.report[props.channelId] ? props.report[props.channelId].totalAssessments : 0}
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
                                        {props.report[props.channelId] ? props.report[props.channelId].lateAssessments : 0}
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
                                        {props.report[props.channelId] ? props.report[props.channelId].gradedAssessments : 0}
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
                                        {props.report[props.channelId] ? props.report[props.channelId].submittedAssessments : 0}
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
                                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {props.report[props.channelId] ? props.report[props.channelId].score : 0}%
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
                                    <Text style={{ fontSize: 18, lineHeight: 25, textAlign: 'right', fontFamily: 'inter' }} ellipsizeMode='tail'>
                                        {props.report[props.channelId] ? props.report[props.channelId].total : 0}%
                                    </Text>
                                </View>
                            </View>
                        </View>}

                        <View style={{ 
                            height: props.isOwner ? '100%' : 'auto' ,
                            maxHeight: 450,
                            marginLeft: props.isOwner || Dimensions.get('window').width < 768 ? 0 : 100,
                        }}>
                        <ScrollView
                            showsHorizontalScrollIndicator={false}
                            horizontal={props.isOwner || Dimensions.get('window').width < 768 ? true : false}
                            contentContainerStyle={{
                                flexDirection: props.isOwner || Dimensions.get('window').width < 768 ? 'column' : 'row'
                            }}
                            nestedScrollEnabled={true}
                        >
                            <View style={{ minHeight: 70, flexDirection: props.isOwner || Dimensions.get('window').width < 768 ? 'row' : 'column', overflow: 'hidden', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#efefef' }} key={"-"}>
                                {props.isOwner ? <View style={styles.col} key={'0,0'}>
                                    <CustomTextInput
                                        value={studentSearch}
                                        onChangeText={(val: string) => setStudentSearch(val)}
                                        placeholder={"Search"}
                                        placeholderTextColor={'#1F1F1F'}
                                    /> 
                                </View> : null}
                                {/* {props.isOwner ? <View style={styles.col} key={'0,0'} /> : null} */}
                                {
                                    cues.length === 0 ? null :
                                        <View style={styles.col} key={'total'}>
                                            <View style={{ height: 10, marginBottom: 5 }} />
                                            <Text style={{ textAlign: 'center', fontSize: 13, color: '#000000', fontFamily: 'inter', marginBottom: 5, height: props.isOwner || Dimensions.get('window').width < 768 ? 35 : 'auto', }}>
                                                {PreferredLanguageText('total')}
                                            </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 10, color: '#000000' }}>
                                                100%
                                            </Text>
                                        </View>
                                }
                                {
                                    cues.map((cue: any, col: number) => {
                                        const { title } = htmlStringParser(cue.cue)
                                        return <TouchableOpacity style={styles.col} key={col.toString()} onPress={() => props.openCueFromGrades(cue._id)}>
                                            <Text style={{ textAlign: 'center', fontSize: 10, color: '#000000', marginBottom: 5 }}>
                                                {
                                                    (new Date(cue.deadline)).toString().split(' ')[1] +
                                                    ' ' +
                                                    (new Date(cue.deadline)).toString().split(' ')[2]
                                                }
                                            </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 13, color: '#000000', fontFamily: 'inter', marginBottom: 5, height: props.isOwner || Dimensions.get('window').width < 768 ? 35 : 'auto', textAlignVertical: 'center' }} numberOfLines={2}>
                                                {title}
                                            </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 10, color: '#000000' }}>
                                                {cue.gradeWeight}%
                                            </Text>
                                        </TouchableOpacity>
                                    })
                                }
                                
                            </View>

                            {/* Search results empty */}
                            {
                                scores.length === 0 ? <View>
                                    <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 20, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter' }}>
                                        No Students.
                                    </Text>
                                </View> : null
                            }

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                horizontal={props.isOwner || Dimensions.get('window').width < 768 ? false : true}
                                contentContainerStyle={{
                                    height: '100%',
                                    width: '100%'
                                }}
                                nestedScrollEnabled={true}
                            >
                                <View>
                                    {
                                        scores.map((score: any, row: number) => {

                                            let totalPoints = 0;
                                            let totalScore = 0;
                                            score.scores.map((s: any) => {
                                                if (s.graded) {
                                                    totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                                    totalScore += Number(s.gradeWeight)
                                                }
                                            })

                                            return <View style={styles.row} key={row}>
                                                {props.isOwner ? <View style={styles.col} >
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#000000', fontFamily: 'inter' }}>
                                                        {score.fullName}
                                                    </Text>
                                                </View> : null}
                                                {
                                                    cues.length === 0 ? null :
                                                        <View style={styles.col} key={'total'}>
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#000000', textTransform: 'uppercase' }}>
                                                                {totalScore !== 0 ? (totalPoints / totalScore).toFixed(2) : '0'}%
                                                            </Text>
                                                        </View>
                                                }
                                                {
                                                    cues.map((cue: any, col: number) => {

                                                        const scoreObject = score.scores.find((s: any) => {
                                                            return s.cueId.toString().trim() === cue._id.toString().trim()
                                                        })

                                                        if (scoreObject && activeCueId === scoreObject.cueId && activeUserId === score.userId) {
                                                            return <View style={styles.col}>
                                                                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                    <TextInput
                                                                        value={activeScore}
                                                                        placeholder={' / 100'}
                                                                        onChangeText={val => {
                                                                            setActiveScore(val)
                                                                        }}
                                                                        style={{ width: '50%', marginRight: 5, padding: 8, borderBottomColor: "#efefef", borderBottomWidth: 1, fontSize: 12 }}
                                                                        placeholderTextColor={'#1F1F1F'}
                                                                    />
                                                                    <TouchableOpacity onPress={() => {
                                                                        modifyGrade()
                                                                    }}>
                                                                        <Ionicons name='checkmark-circle-outline' size={15} style={{ marginRight: 5 }} color={'#8bc34a'} />
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity onPress={() => {
                                                                        setActiveCueId('')
                                                                        setActiveUserId('')
                                                                        setActiveScore('')
                                                                    }}>
                                                                        <Ionicons name='close-circle-outline' size={15} color={'#f94144'} />
                                                                    </TouchableOpacity>
                                                                </View>

                                                            </View>
                                                        }

                                                        return <TouchableOpacity disabled={!props.isOwner} style={styles.col} key={row.toString() + '-' + col.toString()} onPress={() => {

                                                            if (!scoreObject) return;

                                                            setActiveCueId(scoreObject.cueId);
                                                            setActiveUserId(score.userId);
                                                            setActiveScore(scoreObject.score);
                                                        }}>
                                                            {!scoreObject || !scoreObject.submittedAt ? <Text style={{ textAlign: 'center', fontSize: 11, color: '#f94144', }}>
                                                                {scoreObject && scoreObject.graded ? scoreObject.score : (!scoreObject || !scoreObject.cueId ? "N/A" : "Missing")}
                                                            </Text>
                                                                :
                                                                <Text style={{ textAlign: 'center', fontSize: 11, color: scoreObject && new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) ? '#f3722c' : '#000000', }}>
                                                                    {
                                                                        scoreObject && scoreObject.graded ? scoreObject.score : (scoreObject && new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) ? "Late" : '-')
                                                                    }
                                                                </Text>}

                                                            {
                                                                scoreObject.score && scoreObject.graded && ((new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) || !scoreObject.submittedAt)) ? <Text style={{ textAlign: 'center', fontSize: 11, color: !scoreObject.submittedAt ? '#f94144' : '#f3722c', marginTop: 5, borderWidth: 0, borderColor: !scoreObject.submittedAt ? '#f94144' : '#f3722c', borderRadius: 10, width: 60, alignSelf: 'center' }}>
                                                                    {!scoreObject.submittedAt ? "Missing" : "Late"}
                                                                </Text> : null
                                                            }
                                                        </TouchableOpacity>
                                                    })
                                                }
                                                
                                            </View>
                                        })
                                    }
                                </View>
                            </ScrollView>
                        </ScrollView>
                        </View>
                    </View> :
                        renderStatistics()
                    )
            }
        </View >
    );
}

export default React.memo(GradesList, (prev, next) => {
    return _.isEqual(prev.grades, next.grades)
})


const stylesObject: any = (isOwner: any) => StyleSheet.create({
    row: { minHeight: 70, flexDirection: isOwner || Dimensions.get('window').width < 768 ? 'row' : 'column',  borderBottomColor: '#e0e0e0', borderBottomWidth: 1 },
    col: { height: isOwner || Dimensions.get('window').width < 768 ? 'auto' : 80, paddingBottom: isOwner ? 0 : 10, width: isOwner || Dimensions.get('window').width < 768 ? (Dimensions.get('window').width < 768 ? 90 : 120) : 180, justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, borderBottomColor: '#efefef', borderBottomWidth: isOwner || Dimensions.get('window').width < 768 ? 0 : 1,  },
    all: {
        fontSize: 14,
        color: '#006AFF',
        height: 22,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        lineHeight: 22,
        fontFamily: 'inter'
    },
    allGrayFill: {
        fontSize: 14,
        color: '#fff',
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#000000',
        lineHeight: 22,
        fontFamily: 'inter'
    },
    allGrayOutline: {
        fontSize: 12,
        color: "#1F1F1F",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white",
        borderRadius: 1,
        borderWidth: 1,
        borderColor: "#1F1F1F",
        lineHeight: 20
    }
})
