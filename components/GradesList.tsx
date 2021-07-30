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
import {TextInput as CustomTextInput} from "../components/CustomTextInput"

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores))
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const unparsedSubmissionStatistics: any[] = JSON.parse(JSON.stringify(props.submissionStatistics))
    const [scores, setScores] = useState<any[]>(unparsedScores)
    const [cues] = useState<any[]>(unparsedCues)
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

            const pointsToAdd = totalScore !== 0 ? (totalPoints / totalScore).toFixed(2) + "%" : '0'
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
        return (<View style={{ flexDirection: "row" }}>
            <TouchableOpacity
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
            </TouchableOpacity>
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
        const colors = ["#d91d56", "#ed7d22", "#f8d41f", "#b8d41f", "#53be6d", "#f95d6a", "#ff7c43", "#ffa600"]

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
                legendFontSize: 15,

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
            paddingLeft: Dimensions.get("window").width < 768 ? 0 : 50,
            paddingTop: 30
        }}
            key={JSON.stringify(props.scores)}
        >
            <Text style={{ textAlign: 'left', fontSize: 13, color: '#2F2F3C', fontFamily: 'inter', paddingBottom: 20, paddingLeft: Dimensions.get('window').width < 768 ? 0 : 150 }}>
                Grade Weightage
            </Text>
            <PieChart
                data={pieChartData}
                width={Dimensions.get('window').width < 768 ? 350 : 500}
                height={Dimensions.get('window').width < 768 ? 150 : 200}
                chartConfig={chartConfig}
                accessor={"gradeWeight"}
                backgroundColor={"transparent"}
                paddingLeft={Dimensions.get('window').width < 768 ? "10" : "50"}
                // center={[10, 50]}
                hasLegend={true}
            />

            {submissionStatistics.length > 0 ? <View style={{ width: '100%'}}>
                <Text style={{ textAlign: 'left', fontSize: 13, color: '#2F2F3C', fontFamily: 'inter', paddingTop: 50, paddingBottom: 20, paddingLeft: Dimensions.get('window').width < 768 ? 0 : 150 }}>
                    Submissions
                </Text>
                <Chart
                    width={Dimensions.get('window').width < 768 ? '350px' : '600px'}
                    height={Dimensions.get('window').width < 768 ? '300px' : '400px'}
                    chartType="Bar"
                    loader={<div>Loading Chart</div>}
                    data={data}
                    options={{
                        // Material design options
                        fontName: 'overpass'
                    }}
                />
            </View> : null}

            <View style={{ height: 20 }} />
        </View>)


    }

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
            <View style={{ backgroundColor: "white", flexDirection: "row", paddingBottom: 25 }}>
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
                    {PreferredLanguageText("grades")}
                </Text>
                {(scores.length === 0 || cues.length === 0 || !props.isOwner) ? null : <Text
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
                        exportGrades()
                    }}>
                    EXPORT
                </Text>}
            </View>

            {renderGradeStatsTabs()}

            {/* {scores.length === 0 || cues.length === 0 ?  null : 
                                    <View style={{ display: 'flex', flexDirection: 'row', marginVertical: 25 }}>
                                        <TouchableOpacity
                                                        onPress={async () => {
                                                            exportGrades()
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
                                } */}
            {
                props.scores.length === 0 || cues.length === 0 ?
                    <View style={{ backgroundColor: 'white' }}>
                        <Text style={{ width: '100%', color: '#a2a2ac', fontSize: 20, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                cues.length === 0 ? PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    (!showStatistics ? <View style={{
                        width: '100%',
                        backgroundColor: 'white',
                        flex: 1,
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
                            <View style={{ minHeight: 70, flexDirection: 'row', overflow: 'hidden', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'black'}} key={"-"}>
                                    <View style={styles.col} key={'0,0'}>
                                        {props.isOwner ? <CustomTextInput 
                                            value={studentSearch}
                                            onChangeText={(val: string) => setStudentSearch(val)}
                                            placeholder={"Search"}
                                            placeholderTextColor={'#a2a2ac'}
                                        /> : null}
                                    </View>
                                    {
                                        cues.map((cue: any, col: number) => {
                                            const { title } = htmlStringParser(cue.cue)
                                            // console.log("CUE", cue)
                                            return <TouchableOpacity style={styles.col} key={col.toString()}>
                                                <Text style={{ textAlign: 'center', fontSize: 10, color: '#2f2f3c', marginBottom: 5 }}>
                                                    {
                                                        (new Date(cue.deadline)).toString().split(' ')[1] +
                                                        ' ' +
                                                        (new Date(cue.deadline)).toString().split(' ')[2]
                                                    }
                                                </Text>
                                                <Text style={{ textAlign: 'center', fontSize: 13, color: '#2F2F3C', fontFamily: 'inter', marginBottom: 5, height: 30, textAlignVertical: 'center'}} numberOfLines={2}>
                                                    {title}
                                                </Text>
                                                <Text style={{ textAlign: 'center', fontSize: 10, color: '#2f2f3c' }}>
                                                    {cue.gradeWeight}%
                                                </Text>
                                            </TouchableOpacity>
                                        })
                                    }
                                    {
                                        cues.length === 0 ? null :
                                            <View style={styles.col} key={'total'}>
                                                <View style={{ height: 10, marginBottom: 5 }} />
                                                <Text style={{ textAlign: 'center', fontSize: 13, color: '#2F2F3C', fontFamily: 'inter', marginBottom: 5, height: 30,  }}>
                                                    {PreferredLanguageText('total')}
                                                </Text>
                                                <Text style={{ textAlign: 'center', fontSize: 10, color: '#2F2F3C' }}>
                                                    100%
                                                </Text>
                                            </View>
                                    }
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
                                        scores.map((score: any, row: number) => {

                                            let totalPoints = 0;
                                            let totalScore = 0;
                                            score.scores.map((s: any) => {
                                                if (s.graded) {
                                                    totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                                    totalScore += Number(s.gradeWeight)
                                                }
                                            })

                                            console.log(score);

                                            return <View style={styles.row} key={row}>
                                                <View style={styles.col} >
                                                    <Text style={{ textAlign: 'left', fontSize: 12, color: '#2F2F3C', fontFamily: 'inter' }}>
                                                        {score.fullName}
                                                    </Text>
                                                    {/* <Text style={{ textAlign: 'left', fontSize: 12, color: '#2F2F3C' }}>
                                                        {score.displayName}
                                                    </Text> */}
                                                </View>
                                                {
                                                    cues.map((cue: any, col: number) => {

                                                        const scoreObject = score.scores.find((s: any) => {
                                                            return s.cueId.toString().trim() === cue._id.toString().trim()
                                                        })

                                                        if (activeCueId === scoreObject.cueId && activeUserId === score.userId) {
                                                            return <View style={styles.col}>
                                                                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                    <TextInput 
                                                                        value={activeScore} 
                                                                        placeholder={' / 100'}
                                                                        onChangeText={val => {
                                                                            setActiveScore(val)
                                                                        }}
                                                                        style={{ width: '50%', marginRight: 5, padding: 8, borderBottomColor: "#cccccc", borderBottomWidth: 1, fontSize: 12 }}
                                                                        placeholderTextColor={'#a2a2ac'}
                                                                    />
                                                                    <TouchableOpacity onPress={() => {
                                                                        modifyGrade()
                                                                    }}>
                                                                        <Ionicons name='checkmark-circle-outline' size={20} style={{ marginRight: 5 }} color={'#8bc34a'}/>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity onPress={() => { 
                                                                        setActiveCueId('')
                                                                        setActiveUserId('')
                                                                        setActiveScore('')
                                                                    }}>
                                                                        <Ionicons name='close-circle-outline' size={20} color={'#d91d56'} />
                                                                    </TouchableOpacity>
                                                                </View>

                                                            </View>
                                                        }

                                                        return <TouchableOpacity disabled={!props.isOwner} style={styles.col} key={row.toString() + '-' + col.toString()} onPress={() => { 
                                                                setActiveCueId(scoreObject.cueId);
                                                                setActiveUserId(score.userId);
                                                                setActiveScore(scoreObject.score);
                                                            }}>
                                                            {!scoreObject.submittedAt ? <Text style={{ textAlign: 'center', fontSize: 11, color: '#D91D56',  }}>
                                                                { scoreObject && scoreObject.graded ? scoreObject.score : "Missing" }
                                                            </Text> 
                                                            : 
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: scoreObject && new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) ? '#ED7D22' : '#2f2f3c', }}>
                                                                {
                                                                    scoreObject && scoreObject.graded ? scoreObject.score : (scoreObject && new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) ? "Late" : '-')
                                                                }
                                                            </Text>}
                                                        </TouchableOpacity>
                                                    })
                                                }
                                                {
                                                    cues.length === 0 ? null :
                                                        <View style={styles.col} key={'total'}>
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                                                                {totalScore !== 0 ? (totalPoints / totalScore).toFixed(2) : '0'}%
                                                            </Text>
                                                        </View>
                                                }
                                            </View>
                                        })
                                    }
                                </View>
                            </ScrollView>
                        </ScrollView>
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


const styles = StyleSheet.create({
    row: { minHeight: 70, flexDirection: 'row', overflow: 'hidden', borderBottomColor: '#e0e0e0', borderBottomWidth: 1  },
    col: { width: 120, justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7,   },
    allGrayFill: {
        fontSize: 12,
        color: "#fff",
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "#a2a2ac",
        lineHeight: 20
    },
    allGrayOutline: {
        fontSize: 12,
        color: "#a2a2ac",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#a2a2ac",
        lineHeight: 20
    },
    all: {
        fontSize: 12,
        color: "#a2a2ac",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white",
        lineHeight: 20
    },
})
