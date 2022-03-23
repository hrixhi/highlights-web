// REACT
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash'
import * as FileSaver from 'file-saver';
import XLSX from "xlsx"

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { TextInput as CustomTextInput } from "../components/CustomTextInput"

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';


const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores))
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues))
    const [scores, setScores] = useState<any[]>(unparsedScores)
    const [cues] = useState<any[]>(unparsedCues.sort((a: any, b: any) => {
        return a.deadline < b.deadline ? -1 : 1
    }))
    const styles = stylesObject(props.isOwner)
    const [exportAoa, setExportAoa] = useState<any[]>()
    const [activeCueId, setActiveCueId] = useState("")
    const [activeUserId, setActiveUserId] = useState("")
    const [activeScore, setActiveScore] = useState("");
    const [studentSearch, setStudentSearch] = useState("");

    // HOOKS 

    /**
     * @description Filter users by search
     */
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

    /**
     * @description Prepare export data for Grades
     */
    useEffect(() => {

        if (props.scores.length === 0 || cues.length === 0) {
            return;
        }

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [""];

        cues.forEach(cue => {

            const { title } = htmlStringParser(cue.cue)

            row1.push(`${title} (${cue.gradeWeight ? cue.gradeWeight : '0'}%)`)
        })

        row1.push("Total")

        exportAoa.push(row1);

        scores.forEach((score: any) => {

            let totalPoints = 0;
            let totalScore = 0;
            score.scores.map((s: any) => {
                if (s.releaseSubmission) {
                    if (!s.submittedAt || !s.graded) {
                        // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                        totalScore += Number(s.gradeWeight)
                    } else {
                        totalPoints += (Number(s.gradeWeight) * Number(s.score))
                        totalScore += Number(s.gradeWeight)
                    }
                   
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

    /**
     * @description Handles exporting of grades into Spreadsheet
     */
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

    /**
     * @description Handles modifying grade
     */
    const modifyGrade = () => {
        props.modifyGrade(activeCueId, activeUserId, activeScore);
        setActiveCueId('')
        setActiveUserId('')
        setActiveScore('')
    }

    /**
     * @description Renders export button
     */
    const renderExportButton = () => {
        return (<View style={{ flexDirection: "row", backgroundColor: '#f2f2f2' }}>
            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', width: '100%', backgroundColor: '#f2f2f2', marginBottom: 20 }}>
                {(scores.length === 0 || cues.length === 0 || !props.isOwner) ? null :
                    <TouchableOpacity
                        onPress={() => {
                            exportGrades()
                        }}
                        style={{
                            backgroundColor: '#f2f2f2',
                            overflow: 'hidden',
                            height: 35,
                            justifyContent: 'center',
                            flexDirection: 'row'
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 34,
                            color: '#4794ff',
                            fontSize: 12,
                            borderColor: '#4794ff',
                            paddingHorizontal: 20,
                            fontFamily: 'inter',
                            height: 35,
                            borderWidth: 1,
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            EXPORT
                        </Text>
                    </TouchableOpacity>
                }
            </View>
        </View>)
    }

    // MAIN RETURN
    return (
        <View style={{
            backgroundColor: '#f2f2f2',
            width: '100%',
            height: '100%',
        }}>
            {renderExportButton()}
            {
                props.scores.length === 0 || cues.length === 0 ?
                    <View style={{ backgroundColor: '#f2f2f2' }}>
                        <Text style={{ width: '100%', color: '#1F1F1F', fontSize: 20, paddingVertical: 50, paddingHorizontal: 5, fontFamily: 'inter' }}>
                            {
                                cues.length === 0 ? PreferredLanguageText('noGraded') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View>
                    :
                    (props.activeTab === "scores" ? <View style={{
                        width: '100%',
                        backgroundColor: 'white',
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
                            showsHorizontalScrollIndicator={props.isOwner || Dimensions.get('window').width < 768 ? true : false}
                            horizontal={props.isOwner || Dimensions.get('window').width < 768 ? true : false}
                            showsVerticalScrollIndicator={props.isOwner || Dimensions.get('window').width < 768 ? false : true}
                            contentContainerStyle={{
                                flexDirection: props.isOwner || Dimensions.get('window').width < 768 ? 'column' : 'row'
                            }}
                            nestedScrollEnabled={true}
                        >
                            <View style={{ minHeight: 70, flexDirection: props.isOwner || Dimensions.get('window').width < 768 ? 'row' : 'column', overflow: 'hidden', paddingBottom: 10, borderBottomWidth: (!props.isOwner && Dimensions.get('window').width) || props.isOwner < 768 ? 1 : 0, borderBottomColor: '#f2f2f2' }} key={"-"}>
                                {props.isOwner ? <View style={styles.col} key={'0,0'}>
                                    <CustomTextInput
                                        value={studentSearch}
                                        onChangeText={(val: string) => setStudentSearch(val)}
                                        placeholder={"Search"}
                                        placeholderTextColor={'#1F1F1F'}
                                    /> 
                                </View> : null}
                                {
                                    cues.length === 0 ? null :
                                        <View style={styles.col} key={'total'}>
                                            <View style={{ height: 10, marginBottom: 5 }} />
                                            <Text style={{ textAlign: 'center', fontSize: 13, color: '#000000', fontFamily: 'inter', marginBottom: 5,  }}>
                                                {PreferredLanguageText('total')}
                                            </Text>
                                            {/* <Text style={{ textAlign: 'center', fontSize: 10, color: '#000000' }}>
                                                100%
                                            </Text> */}
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
                                            <Text style={{ textAlign: 'center', fontSize: 13, color: '#000000', fontFamily: 'inter', marginBottom: 5, textAlignVertical: 'center' }} numberOfLines={2} ellipsizeMode="tail">
                                                {title}
                                            </Text>
                                            <Text style={{ textAlign: 'center', fontSize: 10, color: '#000000' }}>
                                                {cue.gradeWeight ? cue.gradeWeight : '0'}%
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
                                showsVerticalScrollIndicator={true}
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
                                                if (s.releaseSubmission) {
                                                    if (!s.submittedAt || !s.graded) {
                                                        // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                                        totalScore += Number(s.gradeWeight)
                                                    } else {
                                                        totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                                        totalScore += Number(s.gradeWeight)
                                                    }
                                                   
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
                                                                {totalScore !== 0 ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/, '') : '0'}%
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
                                                                        style={{ width: '50%', marginRight: 5, padding: 8, borderBottomColor: "#f2f2f2", borderBottomWidth: 1, fontSize: 12 }}
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
                                                                {scoreObject && scoreObject !== undefined && scoreObject.graded && scoreObject.score.replace(/\.0+$/, '') ? scoreObject.score : (!scoreObject || !scoreObject.cueId ? "N/A" : "Missing")}
                                                            </Text>
                                                                :
                                                                <Text style={{ textAlign: 'center', fontSize: 11, color: scoreObject && new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) ? '#f3722c' : '#000000', }}>
                                                                    {
                                                                        scoreObject && scoreObject !== undefined && scoreObject.graded && scoreObject.score ? scoreObject.score.replace(/\.0+$/, '') : (scoreObject && (new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline))) ? "Late" : 'Submitted')
                                                                    }
                                                                </Text>}

                                                            {
                                                                scoreObject && scoreObject !== undefined && scoreObject.score && scoreObject.graded && ((new Date(parseInt(scoreObject.submittedAt)) >= (new Date(cue.deadline)) || !scoreObject.submittedAt)) ? <Text style={{ textAlign: 'center', fontSize: 10, color: !scoreObject.submittedAt ? '#f94144' : '#f3722c', marginTop: 5, borderWidth: 0, borderColor: !scoreObject.submittedAt ? '#f94144' : '#f3722c', borderRadius: 10, width: 60, alignSelf: 'center' }}>
                                                                    {!scoreObject.submittedAt ? "(Missing)" : "(Late)"}
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
                    </View> : null
                	)
            }
        </View >
    );
}

export default React.memo(GradesList, (prev, next) => {
    return _.isEqual(prev.grades, next.grades)
})


const stylesObject: any = (isOwner: any) => StyleSheet.create({
    row: { minHeight: 70, flexDirection: isOwner || Dimensions.get('window').width < 768 ? 'row' : 'column',  borderBottomColor: '#f2f2f2', borderBottomWidth: (!isOwner && Dimensions.get('window').width < 768) || isOwner ? 1 : 0 },
    col: { height: isOwner || Dimensions.get('window').width < 768 ? 'auto' : 90, paddingBottom: isOwner ? 0 : 10, width: isOwner || Dimensions.get('window').width < 768 ? (Dimensions.get('window').width < 768 ? 90 : 120) : 180, justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, borderBottomColor: '#f2f2f2', borderBottomWidth: isOwner || (Dimensions.get('window').width < 768) ? 0 : 1,  },
})
