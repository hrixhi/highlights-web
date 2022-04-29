// REACT
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Dimensions, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _, { at, has } from 'lodash';
import * as FileSaver from 'file-saver';
import XLSX from 'xlsx';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { TextInput as CustomTextInput } from '../components/CustomTextInput';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import moment from 'moment';
import ProgressBar from '@ramonak/react-progress-bar';
import Alert from './Alert';
import { disableEmailId } from '../constants/zoomCredentials';

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores));
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues));
    const [scores, setScores] = useState<any[]>([...unparsedScores]);
    const [cues, setCues] = useState<any[]>(
        unparsedCues.sort((a: any, b: any) => {
            return a.deadline < b.deadline ? -1 : 1;
        })
    );
    const styles = stylesObject(props.isOwner);
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [activeCueId, setActiveCueId] = useState('');
    const [activeUserId, setActiveUserId] = useState('');
    const [activeScore, setActiveScore] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    // Deadline, Name, Status
    const [sortByOption, setSortByOption] = useState('Deadline');

    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    // HOOKS
    useEffect(() => {
        if (props.exportScores) {
            exportGrades();
            props.setExportScores(false);
        }
    }, [props.exportScores]);

    useEffect(() => {
        if (sortByOption === 'Name') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const { title: aTitle } = htmlStringParser(a.cue);
                const { title: bTitle } = htmlStringParser(b.cue);

                console.log('aTitle', aTitle);
                console.log('bTitle', bTitle);

                if (aTitle < bTitle) {
                    return sortByOrder ? -1 : 1;
                } else if (aTitle > bTitle) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        } else if (sortByOption === 'Weight') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const aGradeWeight = Number(a.gradeWeight);
                const bGradeWeight = Number(b.gradeWeight);

                if (aGradeWeight < bGradeWeight) {
                    return sortByOrder ? 1 : -1;
                } else if (aGradeWeight > bGradeWeight) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        } else if (sortByOption === 'Status') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const aId = a._id;
                const bId = b._id;

                const scoreObjectA = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === aId.toString().trim();
                });

                const scoreObjectB = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === bId.toString().trim();
                });

                if (
                    scoreObjectA &&
                    scoreObjectA.score &&
                    scoreObjectA.graded &&
                    scoreObjectB &&
                    (!scoreObjectB.score || !scoreObjectB.graded)
                ) {
                    return sortByOrder ? -1 : 1;
                } else if (
                    scoreObjectA &&
                    (!scoreObjectA.score || !scoreObjectA.graded) &&
                    scoreObjectB &&
                    scoreObjectB.score &&
                    scoreObjectB.graded
                ) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            sortCues.sort((a: any, b: any) => {
                const aId = a._id;
                const bId = b._id;

                const scoreObjectA = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === aId.toString().trim();
                });

                const scoreObjectB = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === bId.toString().trim();
                });

                if (scoreObjectA && scoreObjectA.submittedAt && scoreObjectB && !scoreObjectB.submittedAt) {
                    return sortByOrder ? -1 : 1;
                } else if (scoreObjectA && !scoreObjectA.submittedAt && scoreObjectB && scoreObjectB.submittedAt) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        } else if (sortByOption === 'Deadline') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const aDate = new Date(a.deadline);
                const bDate = new Date(b.deadline);

                if (aDate < bDate) {
                    return sortByOrder ? -1 : 1;
                } else if (aDate > bDate) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setCues(sortCues);
        }
    }, [sortByOption, sortByOrder, props.cues]);

    /**
     * @description Filter users by search
     */
    useEffect(() => {
        if (studentSearch === '') {
            setScores([...props.scores]);
        } else {
            const allStudents = [...props.scores];

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setScores(matches);
        }
    }, [studentSearch]);

    /**
     * @description Prepare export data for Grades
     */
    useEffect(() => {
        if (props.scores.length === 0 || cues.length === 0) {
            return;
        }

        const exportAoa = [];

        // Add row 1 with past meetings and total
        let row1 = [''];

        cues.forEach((cue) => {
            const { title } = htmlStringParser(cue.cue);

            row1.push(`${title} (${cue.gradeWeight ? cue.gradeWeight : '0'}%)`);
        });

        row1.push('Total');

        exportAoa.push(row1);

        scores.forEach((score: any) => {
            let totalPoints = 0;
            let totalScore = 0;
            score.scores.map((s: any) => {
                if (s.releaseSubmission) {
                    if (!s.submittedAt || !s.graded) {
                        // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                        totalScore += Number(s.gradeWeight);
                    } else {
                        totalPoints += Number(s.gradeWeight) * Number(s.score);
                        totalScore += Number(s.gradeWeight);
                    }
                }
            });

            let userRow = [];

            userRow.push(score.fullName);

            cues.forEach((cue) => {
                const scoreObject = score.scores.find((s: any) => {
                    return s.cueId.toString().trim() === cue._id.toString().trim();
                });

                if (scoreObject && scoreObject.graded) {
                    userRow.push(scoreObject.score);
                } else {
                    userRow.push('-');
                }
            });

            const pointsToAdd =
                totalScore !== 0 ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/, '') + '%' : '0';

            // Add Total here
            userRow.push(pointsToAdd);

            exportAoa.push(userRow);
        });

        setExportAoa(exportAoa);
    }, [scores, cues]);

    function getTimeRemaining(endtime: string) {
        const total = Date.parse(endtime) - Date.parse(new Date());
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        if (days > 0) {
            return (
                days + ' day' + (days === 1 ? '' : 's') + ', ' + hours + ' hour' + (hours === 1 ? '' : 's') + ' left'
            );
        } else if (hours > 0) {
            return (
                hours +
                ' hour' +
                (hours === 1 ? '' : 's') +
                ', ' +
                minutes +
                ' minute' +
                (minutes === 1 ? '' : 's') +
                ' left'
            );
        } else {
            return minutes + ' minutes left';
        }
    }

    /**
     * @description Handles exporting of grades into Spreadsheet
     */
    const exportGrades = () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        if (!exportAoa) {
            Alert('Processing scores. Try again.');
            return;
        }

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Grades ');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'grades' + fileExtension);
    };

    /**
     * @description Handles modifying grade
     */
    const modifyGrade = () => {
        props.modifyGrade(activeCueId, activeUserId, activeScore);
        setActiveCueId('');
        setActiveUserId('');
        setActiveScore('');
    };

    // /**
    //  * @description Renders export button
    //  */
    // const renderExportButton = () => {
    //     return (
    //         <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
    //             <View
    //                 style={{
    //                     flexDirection: 'row',
    //                     flex: 1,
    //                     justifyContent: 'flex-end',
    //                     width: '100%',
    //                     backgroundColor: '#fff',
    //                     marginBottom: 30,
    //                 }}
    //             >
    //                 {scores.length === 0 || cues.length === 0 || !props.isOwner ? null : (
    //                     <TouchableOpacity
    //                         onPress={() => {
    //                             exportGrades();
    //                         }}
    //                         style={{
    //                             backgroundColor: '#fff',
    //                             overflow: 'hidden',
    //                             height: 35,
    //                             justifyContent: 'center',
    //                             flexDirection: 'row',
    //                         }}
    //                     >
    //                         <Text
    //                             style={{
    //                                 textAlign: 'center',
    //                                 lineHeight: 34,
    //                                 color: '#007AFF',
    //                                 fontSize: 13,
    //                                 borderColor: '#007AFF',
    //                                 paddingHorizontal: 20,
    //                                 fontFamily: 'inter',
    //                                 height: 35,
    //                                 borderWidth: 1,
    //                                 borderRadius: 15,
    //                                 textTransform: 'uppercase',
    //                             }}
    //                         >
    //                             EXPORT
    //                         </Text>
    //                     </TouchableOpacity>
    //                 )}
    //             </View>
    //         </View>
    //     );
    // };

    const renderPerformanceOverview = () => {
        const grade = props.report[props.channelId] ? props.report[props.channelId].score : 0;
        const progress = props.report[props.channelId] ? Number(props.report[props.channelId].total) : 0;
        const totalAssessments = props.report[props.channelId] ? props.report[props.channelId].totalAssessments : 0;
        const submitted = props.report[props.channelId] ? props.report[props.channelId].submittedAssessments : 0;
        const notSubmitted = totalAssessments - submitted;
        const late = props.report[props.channelId] ? props.report[props.channelId].lateAssessments : 0;
        const graded = props.report[props.channelId] ? props.report[props.channelId].gradedAssessments : 0;
        const attended = props.attendance[props.channelId] ? props.attendance[props.channelId].length : 0;
        const totalMeetings = props.date[props.channelId] ? props.date[props.channelId].length : 0;
        const totalPosts = props.thread[props.channelId] ? props.thread[props.channelId].length : 0;
        const upcomingDeadline =
            props.report[props.channelId] && props.report[props.channelId].upcomingAssessmentDate !== ''
                ? moment(new Date(props.report[props.channelId].upcomingAssessmentDate)).format('MMM Do, h:mma')
                : '';

        return (
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    padding: 20,
                    marginVertical: 30,
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#cccccc',
                }}
            >
                <View
                    style={{
                        width: '33%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                            }}
                        >
                            Grade
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 18,
                                paddingTop: 7,
                            }}
                        >
                            {grade}%
                        </Text>
                    </View>

                    <View
                        style={{
                            maxWidth: 200,
                            paddingTop: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Progress
                            </Text>
                            <View
                                style={{
                                    paddingTop: 7,
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: 200,
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 18,
                                        paddingBottom: 5,
                                    }}
                                >
                                    {progress}%
                                </Text>

                                {progress > 0 ? (
                                    <ProgressBar
                                        completed={progress}
                                        maxCompleted={100}
                                        height={'10px'}
                                        width={'200px'}
                                        isLabelVisible={false}
                                        bgColor={progress >= 100 ? '#35AC78' : '#007AFF'}
                                    />
                                ) : null}
                            </View>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        width: '33%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                            }}
                        >
                            Next submission
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 18,
                                paddingTop: 7,
                            }}
                        >
                            {upcomingDeadline !== '' ? upcomingDeadline : 'N/A'}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                            }}
                        >
                            Total Assessments
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 18,
                                paddingTop: 7,
                            }}
                        >
                            {totalAssessments}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                            }}
                        >
                            Not Submitted{' '}
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 18,
                                paddingTop: 7,
                            }}
                        >
                            {notSubmitted}
                        </Text>
                    </View>
                </View>

                <View
                    style={{
                        width: '33%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'column',
                            width: 200,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                // paddingTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                }}
                            >
                                Submitted{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 18,
                                    paddingTop: 7,
                                }}
                            >
                                {submitted}
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                paddingTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                }}
                            >
                                Late{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 18,
                                    paddingTop: 7,
                                }}
                            >
                                {late}
                            </Text>
                        </View>

                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                paddingTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                }}
                            >
                                Graded{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 18,
                                    paddingTop: 7,
                                }}
                            >
                                {graded}
                            </Text>
                        </View>
                    </View>
                    {/* <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'Inter',
                            width: 200,
                        }}
                    >
                        Meetings: {attended} / {totalMeetings}
                    </Text>

                    <Text
                        style={{
                            fontSize: 15,
                            fontFamily: 'Inter',
                            width: 200,
                            paddingTop: 20,
                        }}
                    >
                        Posts: {totalPosts}
                    </Text> */}

                    {/* {upcomingDeadline !== '' ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                width: 200,
                                paddingTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Upcoming Deadline:{' '}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    paddingTop: 10,
                                }}
                            >
                                {upcomingDeadline}
                            </Text>
                        </View>
                    ) : null} */}
                </View>
            </View>
        );
    };

    const renderStudentScoresTable = () => {
        return (
            <View
                style={{
                    width: '100%',
                }}
            >
                {renderPerformanceOverview()}
                <View
                    style={{
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cccccc',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <View
                            style={{
                                width: '25%',
                                padding: 15,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'none',
                                }}
                                onPress={() => {
                                    if (sortByOption !== 'Name') {
                                        setSortByOption('Name');
                                        setSortByOrder(true);
                                    } else {
                                        setSortByOrder(!sortByOrder);
                                    }
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        textAlign: 'center',
                                        paddingRight: 5,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Assessment
                                </Text>
                                {sortByOption === 'Name' ? (
                                    <Ionicons
                                        name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                        size={16}
                                        color={'#1f1f1f'}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        </View>
                        <View
                            style={{
                                width: '25%',
                                padding: 15,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'none',
                                }}
                                onPress={() => {
                                    if (sortByOption !== 'Weight') {
                                        setSortByOption('Weight');
                                        setSortByOrder(true);
                                    } else {
                                        setSortByOrder(!sortByOrder);
                                    }
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        textAlign: 'center',
                                        paddingRight: 5,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Weightage
                                </Text>
                                {sortByOption === 'Weight' ? (
                                    <Ionicons
                                        name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                        size={16}
                                        color={'#1f1f1f'}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        </View>
                        <View
                            style={{
                                width: '25%',
                                padding: 15,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'none',
                                }}
                                onPress={() => {
                                    if (sortByOption !== 'Status') {
                                        setSortByOption('Status');
                                        setSortByOrder(true);
                                    } else {
                                        setSortByOrder(!sortByOrder);
                                    }
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        textAlign: 'center',
                                        paddingRight: 5,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Status
                                </Text>
                                {sortByOption === 'Status' ? (
                                    <Ionicons
                                        name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                        size={16}
                                        color={'#1f1f1f'}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        </View>
                        <View
                            style={{
                                width: '25%',
                                padding: 15,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'none',
                                }}
                                onPress={() => {
                                    if (sortByOption !== 'Deadline') {
                                        setSortByOption('Deadline');
                                        setSortByOrder(true);
                                    } else {
                                        setSortByOrder(!sortByOrder);
                                    }
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        textAlign: 'center',
                                        paddingRight: 5,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Deadline
                                </Text>
                                {sortByOption === 'Deadline' ? (
                                    <Ionicons
                                        name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                        size={16}
                                        color={'#1f1f1f'}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        </View>
                    </View>
                    <ScrollView
                        horizontal={false}
                        style={{
                            width: '100%',
                            maxHeight: 350,
                        }}
                        contentContainerStyle={{
                            flexDirection: 'column',
                            borderLeftWidth: 1,
                            borderRightWidth: 1,
                            borderBottomWidth: 1,
                            borderColor: '#f2f2f2',
                            borderTopWidth: 0,
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                        }}
                    >
                        {cues.map((cue: any, ind: number) => {
                            const { title } = htmlStringParser(cue.cue);

                            const scoreObject = scores[0].scores.find((s: any) => {
                                return s.cueId.toString().trim() === cue._id.toString().trim();
                            });

                            const hasDeadlinePassed = new Date(cue.deadline) < new Date() || cue.releaseSubmission;
                            const hasLateSubmissionPassed =
                                (cue.availableUntil && new Date(cue.availableUntil) < new Date()) ||
                                cue.releaseSubmission;

                            console.log('Has late deadline passed ' + (ind + 1), hasLateSubmissionPassed);

                            let remaining;

                            if (!hasDeadlinePassed) {
                                let start = new Date(cue.initiateAt);
                                let end = new Date(cue.deadline);
                                const current = new Date();

                                const currentElapsed = current.valueOf() - start.valueOf();
                                const totalDifference = end.valueOf() - start.valueOf();

                                remaining = 100 - (currentElapsed / totalDifference) * 100;
                            } else if (hasDeadlinePassed && cue.availableUntil && !hasLateSubmissionPassed) {
                                let start = new Date(cue.deadline);
                                let end = new Date(cue.availableUntil);
                                const current = new Date();

                                const currentElapsed = current.getTime() - start.getTime();
                                const totalDifference = end.getTime() - start.getTime();

                                remaining = 100 - (currentElapsed / totalDifference) * 100;
                            }

                            return (
                                <View
                                    key={ind.toString()}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderBottomLeftRadius: ind === cues.length - 1 ? 8 : 0,
                                        borderBottomRightRadius: ind === cues.length - 1 ? 8 : 0,
                                        borderTopColor: '#f2f2f2',
                                        borderTopWidth: ind === 0 ? 0 : 1,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '25%',
                                            padding: 15,
                                        }}
                                    >
                                        <TouchableOpacity onPress={() => props.openCueFromGrades(cue._id)}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    textAlign: 'center',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {title}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View
                                        style={{
                                            width: '25%',
                                            padding: 15,
                                        }}
                                    >
                                        <View>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    textAlign: 'center',
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                {cue.gradeWeight ? cue.gradeWeight : '0'}%
                                            </Text>
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            width: '25%',
                                            padding: 15,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {!scoreObject || !scoreObject.submittedAt ? (
                                            <View
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 10,
                                                    marginRight: 7,
                                                    backgroundColor: '#f94144',
                                                }}
                                            />
                                        ) : (
                                            <View
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 10,
                                                    marginRight: 7,
                                                    backgroundColor:
                                                        scoreObject &&
                                                        scoreObject !== undefined &&
                                                        scoreObject.graded &&
                                                        scoreObject.score
                                                            ? '#000'
                                                            : scoreObject &&
                                                              new Date(parseInt(scoreObject.submittedAt)) >=
                                                                  new Date(cue.deadline)
                                                            ? '#FFC107'
                                                            : '#35AC78',
                                                }}
                                            />
                                        )}
                                        {!scoreObject || !scoreObject.submittedAt ? (
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {scoreObject &&
                                                scoreObject !== undefined &&
                                                scoreObject.graded &&
                                                scoreObject.score &&
                                                scoreObject.score.replace(/\.0+$/, '')
                                                    ? scoreObject.score + '%'
                                                    : !scoreObject || !scoreObject.cueId
                                                    ? 'N/A'
                                                    : 'Not Submitted'}
                                            </Text>
                                        ) : (
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    textAlign: 'center',
                                                    color:
                                                        scoreObject &&
                                                        new Date(parseInt(scoreObject.submittedAt)) >=
                                                            new Date(cue.deadline)
                                                            ? '#f3722c'
                                                            : '#000000',
                                                }}
                                            >
                                                {scoreObject &&
                                                scoreObject !== undefined &&
                                                scoreObject.graded &&
                                                scoreObject.score
                                                    ? scoreObject.score.replace(/\.0+$/, '') + '%'
                                                    : scoreObject &&
                                                      new Date(parseInt(scoreObject.submittedAt)) >=
                                                          new Date(cue.deadline)
                                                    ? 'Late'
                                                    : 'Submitted'}
                                            </Text>
                                        )}
                                    </View>
                                    <View
                                        style={{
                                            width: '25%',
                                            padding: 15,
                                        }}
                                    >
                                        {hasDeadlinePassed && (!cue.availableUntil || hasLateSubmissionPassed) ? (
                                            <View>
                                                {cue.availableUntil ? (
                                                    <View
                                                        style={{
                                                            flexDirection: 'column',
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 14,
                                                                    textAlign: 'center',
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                {moment(new Date(cue.deadline)).format(
                                                                    'MMM Do, h:mm a'
                                                                )}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                paddingTop: 10,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 14,
                                                                    textAlign: 'center',
                                                                    width: '100%',
                                                                    fontFamily: 'Inter',
                                                                }}
                                                            >
                                                                Late:{' '}
                                                                <Text
                                                                    style={{
                                                                        fontFamily: 'overpass',
                                                                    }}
                                                                >
                                                                    {moment(new Date(cue.availableUntil)).format(
                                                                        'MMM Do, h:mm a'
                                                                    )}
                                                                </Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ) : (
                                                    <Text
                                                        style={{
                                                            fontSize: 14,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.deadline)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                )}
                                            </View>
                                        ) : !hasDeadlinePassed ? (
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 20,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        width: '100%',
                                                        fontSize: 14,
                                                        // textAlign: 'center',
                                                        paddingBottom: 10,
                                                    }}
                                                >
                                                    {getTimeRemaining(cue.deadline)}
                                                </Text>
                                                <View
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                >
                                                    <ProgressBar
                                                        completed={remaining ? remaining : 0}
                                                        maxCompleted={100}
                                                        height={'10px'}
                                                        isLabelVisible={false}
                                                        bgColor={'#007AFF'}
                                                        dir="rtl"
                                                    />
                                                </View>
                                                {/*  */}
                                                <View
                                                    style={{
                                                        marginTop: 10,
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.initiateAt)).format('MMM Do')}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.deadline)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : cue.availableUntil && !hasLateSubmissionPassed ? (
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 20,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        width: '100%',
                                                        fontSize: 14,
                                                        // textAlign: 'center',
                                                        paddingBottom: 10,
                                                    }}
                                                >
                                                    Late submission available. {getTimeRemaining(cue.availableUntil)}
                                                </Text>
                                                <View
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                >
                                                    <ProgressBar
                                                        completed={remaining ? remaining : 0}
                                                        maxCompleted={100}
                                                        height={'10px'}
                                                        isLabelVisible={false}
                                                        bgColor={'#FFC107'}
                                                        dir="rtl"
                                                    />
                                                </View>
                                                {/*  */}
                                                <View
                                                    style={{
                                                        marginTop: 10,
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.deadline)).format('MMM Do')}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(cue.availableUntil)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        );
    };

    const renderScoresList = () => {
        return (
            <View
                style={{
                    height: props.isOwner ? '100%' : 'auto',
                    maxHeight: Dimensions.get('window').height - 52 - 45 - 50, // Navbar - 50 padding
                    marginLeft: props.isOwner || Dimensions.get('window').width < 768 ? 0 : 100,
                }}
            >
                <ScrollView
                    showsHorizontalScrollIndicator={true}
                    horizontal={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexDirection: 'column',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                    }}
                    nestedScrollEnabled={true}
                >
                    <View
                        style={{
                            minHeight: 70,
                            flexDirection: 'row',
                            overflow: 'hidden',
                            borderBottomWidth: 1,
                            borderBottomColor: '#f2f2f2',
                        }}
                        key={'-'}
                    >
                        {props.isOwner ? (
                            <View style={styles.colHeader} key={'0,0'}>
                                <TextInput
                                    value={studentSearch}
                                    onChangeText={(val: string) => setStudentSearch(val)}
                                    placeholder={'Search'}
                                    placeholderTextColor={'#1F1F1F'}
                                    style={{
                                        width: '100%',
                                        borderColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                        fontSize: 15,
                                        paddingVertical: 8,
                                        marginTop: 0,
                                        paddingHorizontal: 10,
                                    }}
                                />
                            </View>
                        ) : null}
                        {cues.length === 0 ? null : (
                            <View style={styles.colHeader} key={'total'}>
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        color: '#000000',
                                        fontFamily: 'inter',
                                        marginBottom: 5,
                                    }}
                                >
                                    {PreferredLanguageText('total')}
                                </Text>
                            </View>
                        )}
                        {cues.map((cue: any, col: number) => {
                            const { title } = htmlStringParser(cue.cue);
                            return (
                                <TouchableOpacity
                                    style={styles.colHeader}
                                    key={col.toString()}
                                    onPress={() => props.openCueFromGrades(cue._id)}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 11,
                                            color: '#000000',
                                            marginBottom: 5,
                                        }}
                                    >
                                        {new Date(cue.deadline).toString().split(' ')[1] +
                                            ' ' +
                                            new Date(cue.deadline).toString().split(' ')[2]}
                                    </Text>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 13,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            marginBottom: 5,
                                            textAlignVertical: 'center',
                                        }}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                    >
                                        {title}
                                    </Text>
                                    <Text style={{ textAlign: 'center', fontSize: 11, color: '#000000' }}>
                                        {cue.gradeWeight ? cue.gradeWeight : '0'}%
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Search results empty */}
                    {scores.length === 0 ? (
                        <View>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#1F1F1F',
                                    fontSize: 18,
                                    paddingVertical: 50,
                                    paddingHorizontal: 5,
                                    fontFamily: 'inter',
                                }}
                            >
                                No Students.
                            </Text>
                        </View>
                    ) : null}

                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        horizontal={false}
                        contentContainerStyle={{
                            height: '100%',
                            width: '100%',
                        }}
                        nestedScrollEnabled={true}
                    >
                        <View>
                            {scores.map((score: any, row: number) => {
                                let totalPoints = 0;
                                let totalScore = 0;
                                score.scores.map((s: any) => {
                                    if (s.releaseSubmission) {
                                        if (!s.submittedAt || !s.graded) {
                                            // totalPoints += (Number(s.gradeWeight) * Number(s.score))
                                            totalScore += Number(s.gradeWeight);
                                        } else {
                                            totalPoints += Number(s.gradeWeight) * Number(s.score);
                                            totalScore += Number(s.gradeWeight);
                                        }
                                    }
                                });

                                return (
                                    <View
                                        style={{
                                            minHeight: 70,
                                            flexDirection: 'row',
                                            overflow: 'hidden',
                                            borderBottomColor: '#f2f2f2',
                                            borderBottomWidth: row === score.scores.length - 1 ? 0 : 1,
                                            borderBottomLeftRadius: row === score.scores.length - 1 ? 8 : 0,
                                            borderBottomRightRadius: row === score.scores.length - 1 ? 8 : 0,
                                        }}
                                        key={row}
                                    >
                                        {props.isOwner ? (
                                            <View style={styles.col}>
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 13,
                                                        color: '#000000',
                                                        fontFamily: 'inter',
                                                    }}
                                                >
                                                    {score.fullName}
                                                </Text>
                                            </View>
                                        ) : null}
                                        {cues.length === 0 ? null : (
                                            <View style={styles.col} key={'total'}>
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 11,
                                                        color: '#000000',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {totalScore !== 0
                                                        ? (totalPoints / totalScore).toFixed(2).replace(/\.0+$/, '')
                                                        : '0'}
                                                    %
                                                </Text>
                                            </View>
                                        )}
                                        {cues.map((cue: any, col: number) => {
                                            const scoreObject = score.scores.find((s: any) => {
                                                return s.cueId.toString().trim() === cue._id.toString().trim();
                                            });

                                            if (
                                                scoreObject &&
                                                activeCueId === scoreObject.cueId &&
                                                activeUserId === score.userId
                                            ) {
                                                return (
                                                    <View style={styles.col} key={col.toString()}>
                                                        <View
                                                            style={{
                                                                width: '100%',
                                                                flexDirection: 'row',
                                                                justifyContent: 'flex-end',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <TextInput
                                                                value={activeScore}
                                                                placeholder={' / 100'}
                                                                onChangeText={(val) => {
                                                                    setActiveScore(val);
                                                                }}
                                                                style={{
                                                                    width: '50%',
                                                                    marginRight: 5,
                                                                    padding: 8,
                                                                    borderBottomColor: '#f2f2f2',
                                                                    borderBottomWidth: 1,
                                                                    fontSize: 13,
                                                                }}
                                                                placeholderTextColor={'#1F1F1F'}
                                                            />
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    modifyGrade();
                                                                }}
                                                                disabled={props.user.email === disableEmailId}
                                                            >
                                                                <Ionicons
                                                                    name="checkmark-circle-outline"
                                                                    size={15}
                                                                    style={{ marginRight: 5 }}
                                                                    color={'#8bc34a'}
                                                                />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setActiveCueId('');
                                                                    setActiveUserId('');
                                                                    setActiveScore('');
                                                                }}
                                                            >
                                                                <Ionicons
                                                                    name="close-circle-outline"
                                                                    size={15}
                                                                    color={'#f94144'}
                                                                />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                );
                                            }

                                            return (
                                                <TouchableOpacity
                                                    disabled={!props.isOwner}
                                                    style={styles.col}
                                                    key={row.toString() + '-' + col.toString()}
                                                    onPress={() => {
                                                        if (!scoreObject) return;

                                                        setActiveCueId(scoreObject.cueId);
                                                        setActiveUserId(score.userId);
                                                        setActiveScore(scoreObject.score);
                                                    }}
                                                >
                                                    {!scoreObject || !scoreObject.submittedAt ? (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 11,
                                                                color: '#f94144',
                                                            }}
                                                        >
                                                            {scoreObject &&
                                                            scoreObject !== undefined &&
                                                            scoreObject.graded &&
                                                            scoreObject.score.replace(/\.0+$/, '') + '%'
                                                                ? scoreObject.score
                                                                : !scoreObject || !scoreObject.cueId
                                                                ? 'N/A'
                                                                : 'Not Submitted'}
                                                        </Text>
                                                    ) : (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 11,
                                                                color:
                                                                    scoreObject &&
                                                                    new Date(parseInt(scoreObject.submittedAt)) >=
                                                                        new Date(cue.deadline)
                                                                        ? '#f3722c'
                                                                        : '#000000',
                                                            }}
                                                        >
                                                            {scoreObject &&
                                                            scoreObject !== undefined &&
                                                            scoreObject.graded &&
                                                            scoreObject.score
                                                                ? scoreObject.score.replace(/\.0+$/, '') + '%'
                                                                : scoreObject &&
                                                                  new Date(parseInt(scoreObject.submittedAt)) >=
                                                                      new Date(cue.deadline)
                                                                ? 'Late'
                                                                : 'Submitted'}
                                                        </Text>
                                                    )}

                                                    {scoreObject &&
                                                    scoreObject !== undefined &&
                                                    scoreObject.score &&
                                                    scoreObject.graded &&
                                                    (new Date(parseInt(scoreObject.submittedAt)) >=
                                                        new Date(cue.deadline) ||
                                                        !scoreObject.submittedAt) ? (
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                fontSize: 11,
                                                                color: !scoreObject.submittedAt ? '#f94144' : '#f3722c',
                                                                marginTop: 5,
                                                                borderWidth: 0,
                                                                borderColor: !scoreObject.submittedAt
                                                                    ? '#f94144'
                                                                    : '#f3722c',
                                                                borderRadius: 10,
                                                                width: 60,
                                                                alignSelf: 'center',
                                                            }}
                                                        >
                                                            {!scoreObject.submittedAt ? '(Missing)' : '(Late)'}
                                                        </Text>
                                                    ) : null}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </ScrollView>
            </View>
        );
    };

    // MAIN RETURN
    return (
        <View
            style={{
                backgroundColor: '#fff',
                width: '100%',
                height: '100%',
            }}
        >
            {/* {renderExportButton()} */}
            {props.scores.length === 0 || cues.length === 0 ? (
                <View style={{ backgroundColor: '#fff' }}>
                    <Text
                        style={{
                            width: '100%',
                            color: '#1F1F1F',
                            fontSize: 16,
                            paddingVertical: 100,
                            paddingHorizontal: 5,
                            fontFamily: 'inter',
                        }}
                    >
                        {cues.length === 0
                            ? props.isOwner
                                ? PreferredLanguageText('noGraded')
                                : PreferredLanguageText('noGradedStudents')
                            : PreferredLanguageText('noStudents')}
                    </Text>
                </View>
            ) : props.isOwner ? (
                <View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        maxHeight: Dimensions.get('window').height - 52 - 45 - 120,
                        borderRadius: 2,
                        borderWidth: 1,
                        marginTop: 25,
                        borderColor: '#cccccc',
                        zIndex: 5000000,
                        flexDirection: 'column',
                        justifyContent: props.isOwner ? 'flex-start' : 'center',
                        overflow: props.isOwner ? 'scroll' : 'visible',
                        alignItems: props.isOwner ? 'flex-start' : 'center',
                    }}
                    key={JSON.stringify(props.scores)}
                >
                    {props.isOwner ? renderScoresList() : null}
                </View>
            ) : (
                renderStudentScoresTable()
            )}
        </View>
    );
};

export default GradesList;

const stylesObject: any = (isOwner: any) =>
    StyleSheet.create({
        row: {
            minHeight: 70,
            flexDirection: isOwner || Dimensions.get('window').width < 768 ? 'row' : 'column',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: (!isOwner && Dimensions.get('window').width < 768) || isOwner ? 1 : 0,
        },
        col: {
            width: Dimensions.get('window').width < 768 ? 90 : 120,
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: 7,
        },
        colHeader: {
            backgroundColor: '#f8f8f8',
            width: Dimensions.get('window').width < 768 ? 90 : 120,
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: 7,
        },
        selectedButton: {
            backgroundColor: '#000',
            borderRadius: 20,
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            maxHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
            marginHorizontal: Dimensions.get('window').width < 768 ? 2 : 4,
        },
        unselectedButton: {
            // backgroundColor: '#000',
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            maxHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            borderRadius: 20,
            color: '#000000',
            paddingHorizontal: Dimensions.get('window').width < 1024 ? 12 : 15,
            marginHorizontal: Dimensions.get('window').width < 768 ? 2 : 4,
        },
        selectedText: {
            fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
            color: '#fff',
            backgroundColor: '#000',
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            fontFamily: 'inter',
            textTransform: 'uppercase',
        },
        unselectedText: {
            fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
            color: '#000',
            height: Dimensions.get('window').width < 768 ? 25 : 30,
            // backgroundColor: '#000',
            lineHeight: Dimensions.get('window').width < 768 ? 25 : 30,
            fontFamily: 'overpass',
            textTransform: 'uppercase',
            fontWeight: 'bold',
        },
    });
