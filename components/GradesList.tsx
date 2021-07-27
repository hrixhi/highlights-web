import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions } from 'react-native';
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

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores))
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const unparsedSubmissionStatistics: any[] = JSON.parse(JSON.stringify(props.submissionStatistics))
    const [scores] = useState<any[]>(unparsedScores)
    const [cues] = useState<any[]>(unparsedCues)
    const [submissionStatistics, setSubmissionStatistics] = useState<any[]>(unparsedSubmissionStatistics)
    const [exportAoa, setExportAoa] = useState<any[]>()

    useEffect(() => {

        const filterUnreleased = submissionStatistics.filter((stat: any) => {
            const { cueId } = stat;

            const findCue = cues.find((u: any) => {
                return u._id.toString() === cueId.toString();
            })

            const { cue, releaseSubmission } = findCue; 

            if (cue[0] === '{' && cue[cue.length - 1] === '}') {
                const parse = JSON.parse(cue);

                if (parse.quizId) {
                    if (!releaseSubmission) {
                        return false;
                    }
                }

            }

            return true

        })

        setSubmissionStatistics(filterUnreleased)

    }, [cues, props.submissionStatistics])

    // Statistics
    const [showStatistics, setShowStatistics] = useState(false);

    useEffect(() => {

        if (scores.length === 0 || cues.length === 0) {
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
            key={JSON.stringify(scores)}
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


            <Text style={{ textAlign: 'left', fontSize: 13, color: '#2F2F3C', fontFamily: 'inter', paddingTop: 50, paddingBottom: 20, paddingLeft: Dimensions.get('window').width < 768 ? 0 : 150 }}>
                Submissions
            </Text>

            {/* <ScrollView
                            showsHorizontalScrollIndicator={false}
                            horizontal={true}
                            contentContainerStyle={{
                                height: '100%'
                            }}
                            nestedScrollEnabled={true}
                        > */}
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
            {/* </ScrollView> */}

            <View style={{ height: 20 }} />
            {/* {Object.keys(mapCuesData).map((cueId: any) => {
            
                // Get name of cue from id

                
                const filteredCue = cues.filter((cue: any) => cue._id === cueId); 

                const { title } = htmlStringParser(filteredCue[0].cue)

                const data = {
                    labels: statisticsLabels,
                    datasets: [
                      {
                        data: mapCuesData[cueId],
                        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
                        strokeWidth: 2 // optional
                      }
                    ],
                    // legend: ["Rainy Days"] // optional
                  };

                  const chartConfig = {
                    backgroundGradientFrom: '#Ffffff',
                    backgroundGradientTo: '#ffffff',
                    barPercentage: 1.3,
                    decimalPlaces: 0, // optional, defaults to 2dp
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, 1)`,
                    propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: "#fff",
                    },
                    style: {
                      borderRadius: 16,
                      fontFamily: 'Bogle-Regular',
                    },
                    propsForBackgroundLines: {
                      strokeWidth: '0',
                      stroke: '#fff',
                      strokeDasharray: '0',
                    },
                    propsForLabels: {
                      fontFamily: 'Bogle-Regular',
                    },
                  };

                return (<View style={{ flexDirection: 'column', alignItems: 'center', paddingTop :30, width: Dimensions.get("window").width < 768 ? "100%" : 400}}>
                    <Text style={{ textAlign: 'left', fontSize: 13, color: '#2F2F3C', fontFamily: 'inter', paddingBottom: 20,}}>
                        {title}
                    </Text>

                    <View style={{ flexDirection: 'row',  paddingBottom: 20}}>
                    <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Max: {mapCuesStatistics[cueId].max}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Min: {mapCuesStatistics[cueId].min}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Mean: {mapCuesStatistics[cueId].mean}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Median: {mapCuesStatistics[cueId].median}%
                        </Text>
                        <Text style={{ textAlign: 'left', fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase', fontFamily: 'inter', marginRight: 10 }}>
                            Std Dev: {mapCuesStatistics[cueId].std}%
                        </Text>
                    </View>
                    

                    <LineChart 
                        data={data}
                        width={Dimensions.get("window").width < 768 ? 300 : 400 }
                        height={300}
                        // chartConfig={chartConfig}
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
                </View>)
            })
        }         */}
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
                scores.length === 0 || cues.length === 0 ?
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
                        key={JSON.stringify(scores)}
                    >
                        <ScrollView
                            showsHorizontalScrollIndicator={false}
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
                                            cues.map((cue: any, col: number) => {
                                                const { title } = htmlStringParser(cue.cue)
                                                return <TouchableOpacity style={styles.col} key={col.toString()}>
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#2F2F3C', fontFamily: 'inter' }}>
                                                        {title}
                                                    </Text>
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#2F2F3C' }}>
                                                        {cue.gradeWeight}%
                                                    </Text>
                                                </TouchableOpacity>
                                            })
                                        }
                                        {
                                            cues.length === 0 ? null :
                                                <View style={styles.col} key={'total'}>
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#2F2F3C', fontFamily: 'inter' }}>
                                                        {PreferredLanguageText('total')}
                                                    </Text>
                                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#2F2F3C' }}>
                                                        100%
                                                    </Text>
                                                </View>
                                        }
                                    </View>
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
                                                        return <View style={styles.col} key={row.toString() + '-' + col.toString()}>
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                                                {
                                                                    scoreObject && scoreObject.graded ? scoreObject.score : '-'
                                                                }
                                                            </Text>
                                                        </View>
                                                    })
                                                }
                                                {
                                                    cues.length === 0 ? null :
                                                        <View style={styles.col} key={'total'}>
                                                            <Text style={{ textAlign: 'center', fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
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
    row: { height: 70, borderRadius: 15, marginBottom: 15, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#f4f4f6', },
    col: { width: 100, justifyContent: 'center', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f4f6', padding: 7 },
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
