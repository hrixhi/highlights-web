// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Dimensions, TextInput, Image, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _, { at, drop, has } from 'lodash';
import * as FileSaver from 'file-saver';
import XLSX from 'xlsx';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';

import { TextInput as CustomTextInput } from './CustomTextInput';

import { Select, Datepicker } from '@mobiscroll/react';

// HELPERS
import { htmlStringParser } from '../helpers/HTMLParser';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import moment from 'moment';
import ProgressBar from '@ramonak/react-progress-bar';
import Alert from './Alert';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';
import { fetchAPI } from '../graphql/FetchAPI';
import {
    createGradebookEntry,
    editGradebookEntry,
    getStudentAnalytics,
    getGradebookInstructor,
    getAssignmentAnalytics,
    getCourseStudents,
    deleteGradebookEntry,
} from '../graphql/QueriesAndMutations';
import {
    VictoryPie,
    VictoryLabel,
    VictoryTooltip,
    VictoryChart,
    VictoryBar,
    Bar,
    VictoryStack,
    VictoryAxis,
} from 'victory';

class CustomLabel extends React.Component {
    render() {
        console.log('Props', this.props);
        return (
            <g>
                <VictoryLabel {...this.props} />
                <VictoryTooltip
                    {...this.props}
                    x={200}
                    y={250}
                    orientation="top"
                    pointerLength={0}
                    cornerRadius={50}
                    flyoutWidth={100}
                    flyoutHeight={100}
                    flyoutStyle={{ fill: 'white', border: 'none', fontSize: 25, borderWidth: 0 }}
                />
            </g>
        );
    }
}

CustomLabel.defaultEvents = VictoryTooltip.defaultEvents;

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const unparsedScores: any[] = JSON.parse(JSON.stringify(props.scores));
    const unparsedCues: any[] = JSON.parse(JSON.stringify(props.cues));
    const [scores, setScores] = useState<any[]>([...unparsedScores]);
    const [cues, setCues] = useState<any[]>(
        unparsedCues.sort((a: any, b: any) => {
            return a.deadline < b.deadline ? -1 : 1;
        })
    );
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [activeModifyId, setActiveModifyId] = useState('');
    const [activeUserId, setActiveUserId] = useState('');
    const [activeScore, setActiveScore] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    // Deadline, Name, Status
    const [sortByOption, setSortByOption] = useState('Deadline');
    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    // ADD AN OUTSIDE ASSIGNMENT
    const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
    const [newAssignmentGradeWeight, setNewAssignmentGradeWeight] = useState('');
    const [newAssignmentTotalPoints, setNewAssignmentTotalPoints] = useState('');
    const [newAssignmentDeadline, setNewAssignmentDeadline] = useState(new Date());
    const [newAssignmentStoreSubmittedDate, setNewAssignmentStoreSubmittedDate] = useState(false);
    const [newAssignmentStoreFeedback, setNewAssignmentStoreFeedback] = useState(false);
    const [newAssignmentShareWithOptions, setNewAssignmentShareWithOptions] = useState<any[]>([]);
    const [newAssignmentShareWithSelected, setNewAssignmentShareWithSelected] = useState<string[]>([]);
    const [newAssignmentShareWithAll, setNewAssignmentShareWithAll] = useState(true);
    const [newAssignmentPointsScored, setNewAssignmentPointsScored] = useState<any[]>([]);
    const [newAssignmentStep, setNewAssignmentStep] = useState(0);
    const [newAssignmentFormErrors, setNewAssignmentFormErrors] = useState<string[]>([]);
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

    const [editEntryId, setEditEntryId] = useState('');

    // GRADEBOOK
    const [isFetchingGradebook, setIsFetchingGradebook] = useState(false);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [instructorGradebook, setIntructorGradebook] = useState<any>(undefined);
    const [gradebookEntries, setGradebookEntries] = useState<any[]>([]);
    const [gradebookUsers, setGradebookUsers] = useState<any[]>([]);
    const [courseStudents, setCourseStudents] = useState<any[]>([]);

    // SWITCH % and PTS
    const [viewGradebookTabs] = useState(['Pts', '%']);
    const [gradebookViewPoints, setGradebookViewPoints] = useState(true);
    const [assignmentsViewPoints, setAssignmentsViewPoints] = useState(true);
    const [studentsViewPoints, setStudentsViewPoints] = useState(true);

    // INSTRUCTOR ANALYTICS
    const [assignmentAnalytics, setAssignmentAnalytics] = useState<any>(undefined);
    const [isFetchingAssignmentAnalytics, setIsFetchingAssignmentAnalytics] = useState(false);
    const [assignmentAnalyticsOptions, setAssignmentAnalyticsOptions] = useState<any[]>([]);
    const [assignmentAnalyticsSelected, setAssignmentAnalyticsSelected] = useState<any>(undefined);
    const [studentAnalytics, setStudentAnalytics] = useState<any>(undefined);
    const [userAnalyticsOptions, setUserAnalyticsOptions] = useState<any[]>([]);
    const [userAnalyticsSelected, setUserAnalyticsSelected] = useState(undefined);
    const [isFetchingStudentAnalytics, setIsFetchingStudentAnalytics] = useState(false);

    //
    useEffect(() => {
        if (props.isOwner && props.channelId) {
            fetchGradebookInstructor();
            fetchCourseAssignmentsAnalytics();
            loadCourseStudents();
        }
    }, [props.isOwner, props.channelId]);

    useEffect(() => {
        if (userAnalyticsSelected && props.isOwner) {
            fetchStudentAnalytics();
        }
    }, [userAnalyticsSelected, props.isOwner]);

    console.log('Course Students', courseStudents);

    useEffect(() => {
        if (courseStudents) {
            const dropdownOptions = courseStudents.map((student: any) => {
                return {
                    value: student._id,
                    text: student.fullName,
                    group: student.fullName[0].toUpperCase(),
                };
            });

            const dropdownSelected = courseStudents.map((student: any) => student._id);

            if (dropdownSelected.length > 0) {
                setUserAnalyticsSelected(dropdownSelected[0]);
            }

            setUserAnalyticsOptions(dropdownOptions);

            setNewAssignmentShareWithOptions(dropdownOptions);
            setNewAssignmentShareWithSelected(dropdownSelected);
        }
    }, [courseStudents]);

    useEffect(() => {
        if (assignmentAnalytics) {
            const assignments = [...assignmentAnalytics];

            assignments.sort((a: any, b: any) => {
                return a.title < b.title ? 1 : -1;
            });

            const dropdownOptions = assignments.map((x: any) => {
                return {
                    value: x.cueId ? x.cueId : x.gradebookEntryId,
                    text: x.title,
                };
            });

            setAssignmentAnalyticsOptions(dropdownOptions);

            setAssignmentAnalyticsSelected(dropdownOptions.length > 0 ? dropdownOptions[0].value : undefined);
        }
    }, [assignmentAnalytics]);

    useEffect(() => {
        if (newAssignmentShareWithAll) {
            let selected: string[] = [];

            courseStudents.map((student: any) => {
                selected.push(student._id);
            });

            setNewAssignmentShareWithSelected(selected);
        }
    }, [newAssignmentShareWithAll, courseStudents]);

    useEffect(() => {
        let updatePointsScored = [...newAssignmentPointsScored];

        // Add selected
        newAssignmentShareWithSelected.map((studentId: string) => {
            const alreadyAdded = updatePointsScored.find((x: any) => x._id === studentId);

            if (!alreadyAdded) {
                const findStudent = courseStudents.find((x: any) => x._id === studentId);

                updatePointsScored.push({
                    _id: findStudent._id,
                    fullName: findStudent.fullName,
                    avatar: findStudent.avatar,
                    submitted: false,
                    points: '',
                    lateSubmission: false,
                    feedback: '',
                    submittedAt: new Date(),
                });
            }
        });

        // Remove unselected
        const filterRemoved = updatePointsScored.filter((x: any) => newAssignmentShareWithSelected.includes(x._id));

        console.log('Update New assignment points scored', filterRemoved);

        setNewAssignmentPointsScored(filterRemoved);
    }, [newAssignmentShareWithSelected, courseStudents]);

    const fetchGradebookInstructor = useCallback(() => {
        setIsFetchingGradebook(true);
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getGradebookInstructor,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.gradebook && res.data.gradebook.getGradebook) {
                        setIntructorGradebook(res.data.gradebook.getGradebook);
                        setGradebookEntries(res.data.gradebook.getGradebook.entries);
                        setGradebookUsers(res.data.gradebook.getGradebook.users);
                    } else {
                        setIntructorGradebook(undefined);
                        setGradebookEntries([]);
                        setGradebookUsers([]);
                    }
                    setIsFetchingGradebook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setIntructorGradebook(undefined);
                    setGradebookEntries([]);
                    setGradebookUsers([]);
                    setIsFetchingGradebook(false);
                });
        }
    }, []);

    const fetchCourseAssignmentsAnalytics = useCallback(() => {
        setIsFetchingAssignmentAnalytics(true);
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getAssignmentAnalytics,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.gradebook && res.data.gradebook.getAssignmentAnalytics) {
                        setAssignmentAnalytics(res.data.gradebook.getAssignmentAnalytics);
                    } else {
                        setAssignmentAnalytics(undefined);
                    }
                    setIsFetchingAssignmentAnalytics(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch assignment analytics');
                    setAssignmentAnalytics(undefined);
                    setIsFetchingAssignmentAnalytics(false);
                });
        }
    }, []);

    const fetchStudentAnalytics = useCallback(() => {
        setIsFetchingStudentAnalytics(true);
        const server = fetchAPI('');
        server
            .query({
                query: getStudentAnalytics,
                variables: {
                    channelId: props.channelId,
                    userId: userAnalyticsSelected,
                },
            })
            .then((res) => {
                if (res.data.gradebook && res.data.gradebook.getStudentScores) {
                    setStudentAnalytics(res.data.gradebook.getStudentScores);
                } else {
                    setStudentAnalytics(undefined);
                }
                setIsFetchingStudentAnalytics(false);
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to fetch students.');
                setStudentAnalytics(undefined);
                setIsFetchingStudentAnalytics(false);
            });
    }, [userAnalyticsSelected]);

    /**
     * @description Fetch all course students for creating new assignment and assigning scores
     */
    const loadCourseStudents = useCallback(() => {
        setIsFetchingStudents(true);
        if (props.channelId && props.channelId !== '') {
            const server = fetchAPI('');
            server
                .query({
                    query: getCourseStudents,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.channel && res.data.channel.getCourseStudents) {
                        setCourseStudents(res.data.channel.getCourseStudents);
                    } else {
                        setCourseStudents([]);
                    }
                    setIsFetchingStudents(false);
                })
                .catch((e) => {
                    console.log('Error', e);
                    Alert('Failed to fetch students.');
                    setIsFetchingStudents(false);
                });
        }
    }, [props.channelId]);

    const handleEditGradebookEntry = useCallback(
        (gradebookEntryId: string) => {
            const { entries, users } = instructorGradebook;

            const findEntry = entries.find((entry: any) => entry.gradebookEntryId === gradebookEntryId);

            const { scores } = findEntry;

            console.log('Entry scores', scores);

            if (!findEntry) return;

            let shareWithAll = false;
            let storeSubmissionDate = false;
            let storeFeedback = false;

            let shareWithSelected: string[] = [];

            let gradebookPointsScored: any[] = [];

            users.map((user: any) => {
                const findScore = scores.find((x: any) => x.userId === user.userId);

                console.log('FindScore', findScore);

                if (!findScore) {
                    shareWithAll = false;
                } else {
                    shareWithSelected.push(user.userId);

                    if (findScore.submittedAt) {
                        storeSubmissionDate = true;
                    }

                    if (findScore.feedback) {
                        storeFeedback = true;
                    }

                    gradebookPointsScored.push({
                        _id: user.userId,
                        fullName: user.fullName,
                        avatar: user.avatar,
                        submitted: findScore.submitted,
                        points: findScore.pointsScored ? findScore.pointsScored : '',
                        lateSubmission: findScore.lateSubmission,
                        feedback: findScore.feedback ? findScore.feedback : '',
                        submittedAt: findScore.submittedAt,
                    });
                }
            });

            setEditEntryId(gradebookEntryId);
            setNewAssignmentTitle(findEntry.title);
            setNewAssignmentDeadline(findEntry.deadline);
            setNewAssignmentGradeWeight(findEntry.gradeWeight);
            setNewAssignmentTotalPoints(findEntry.totalPoints);
            setNewAssignmentPointsScored(gradebookPointsScored);
            setNewAssignmentStep(1);
            setNewAssignmentShareWithAll(shareWithAll);
            setNewAssignmentStoreFeedback(storeFeedback);
            setNewAssignmentStoreSubmittedDate(storeSubmissionDate);
            setNewAssignmentShareWithSelected(shareWithSelected);

            props.setShowNewAssignment(true);
        },
        [instructorGradebook]
    );

    console.log('Gradebook points scored', newAssignmentPointsScored);

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    useEffect(() => {
        if (sortByOption === 'Name') {
            const sortCues = [...props.cues];

            sortCues.sort((a: any, b: any) => {
                const { title: aTitle } = htmlStringParser(a.cue);
                const { title: bTitle } = htmlStringParser(b.cue);

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
                    return sortByOrder ? 1 : -1;
                } else if (
                    scoreObjectA &&
                    (!scoreObjectA.score || !scoreObjectA.graded) &&
                    scoreObjectB &&
                    scoreObjectB.score &&
                    scoreObjectB.graded
                ) {
                    return sortByOrder ? -1 : 1;
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

            sortCues.sort((a: any, b: any) => {
                const aId = a._id;
                const bId = b._id;

                const scoreObjectA = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === aId.toString().trim();
                });

                const scoreObjectB = scores[0].scores.find((s: any) => {
                    return s.cueId.toString().trim() === bId.toString().trim();
                });

                if (scoreObjectA && !scoreObjectB) {
                    return -1;
                } else if (scoreObjectB && !scoreObjectA) {
                    return 1;
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
        if (!instructorGradebook || !instructorGradebook.users) {
            return;
        }

        if (studentSearch === '') {
            setGradebookUsers([...instructorGradebook.users]);
        } else {
            const allStudents = [...instructorGradebook.users];

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
            });

            setGradebookUsers(matches);
        }
    }, [studentSearch, instructorGradebook]);

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

                if (!scoreObject || !scoreObject.submittedAt) {
                    if (!scoreObject || !scoreObject.cueId) {
                        userRow.push('N/A');
                    } else {
                        userRow.push('Not Submitted');
                    }
                } else {
                    if (scoreObject && scoreObject !== undefined && scoreObject.graded && scoreObject.score) {
                        userRow.push(
                            scoreObject.score.replace(/\.0+$/, '') +
                                '%' +
                                ' ' +
                                (new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline) ? '(LATE)' : '')
                        );
                    } else if (scoreObject && new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline)) {
                        userRow.push('Late');
                    } else {
                        userRow.push('Submitted');
                    }
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
        props.modifyGrade(activeModifyId, activeUserId, activeScore);
        setActiveModifyId('');
        setActiveUserId('');
        setActiveScore('');
    };

    const resetNewEntryForm = () => {
        setNewAssignmentTitle('');
        setNewAssignmentGradeWeight('');
        setNewAssignmentTotalPoints('');
        setNewAssignmentDeadline(new Date());
        setNewAssignmentPointsScored([]);
        setNewAssignmentFormErrors([]);
        setNewAssignmentStoreFeedback(false);
        setNewAssignmentStoreSubmittedDate(false);
        setNewAssignmentStep(0);
        setEditEntryId('');
    };

    const handleDeleteAssignment = useCallback(async () => {
        setIsDeletingAssignment(true);

        const server = fetchAPI('');

        server
            .mutate({
                mutation: deleteGradebookEntry,
                variables: {
                    entryId: editEntryId,
                },
            })
            .then((res) => {
                if (res.data.gradebook && res.data.gradebook.delete) {
                    Alert('Deleted Gradebook entry successfully.');
                    resetNewEntryForm();
                    props.setShowNewAssignment(false);
                    // Reload gradebook
                    fetchGradebookInstructor();
                    fetchCourseAssignmentsAnalytics();
                    fetchStudentAnalytics();
                } else {
                    Alert('Failed to delete gradebook entry.');
                }
                setIsDeletingAssignment(false);
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to delete gradebook entry.');
                setIsDeletingAssignment(false);
            });
    }, []);

    const handleCreateAssignment = useCallback(
        async (editing?: boolean) => {
            setIsCreatingAssignment(true);

            let errors = [];

            if (!newAssignmentTitle || newAssignmentTitle === '') {
                errors.push('Title is required for the assignment.');
            }

            if (
                newAssignmentTotalPoints === '' ||
                Number.isNaN(Number(newAssignmentTotalPoints)) ||
                Number(newAssignmentTotalPoints) < 0
            ) {
                errors.push('Enter valid total points for the assignment.');
            }

            if (
                newAssignmentGradeWeight === '' ||
                Number.isNaN(Number(newAssignmentGradeWeight)) ||
                Number(newAssignmentGradeWeight) < 0
            ) {
                errors.push('Enter valid grade weight for the assignment.');
            }

            // Validate each user entry
            newAssignmentPointsScored.map((user) => {
                //
                if (user.submitted) {
                    if (!user.points || Number.isNaN(Number(user.points))) {
                        errors.push(`Enter valid points for student ${user.fullName}.`);
                    }
                }
            });

            if (errors.length > 0) {
                setNewAssignmentFormErrors(errors);
                setIsCreatingAssignment(false);
                return;
            }

            // Sanitize
            const sanitizeScores = newAssignmentPointsScored.map((user: any) => {
                return {
                    userId: user._id,
                    submitted: user.submitted,
                    points: user.submitted ? Number(user.points) : undefined,
                    lateSubmission:
                        user.submitted && !newAssignmentStoreSubmittedDate ? user.lateSubmission : undefined,
                    submittedAt: user.submitted && newAssignmentStoreSubmittedDate ? user.submittedAt : undefined,
                    feedback: user.submitted && newAssignmentStoreFeedback ? user.feedback : undefined,
                };
            });

            //
            const gradebookEntryInput = {
                title: newAssignmentTitle,
                totalPoints: Number(newAssignmentTotalPoints),
                gradeWeight: Number(newAssignmentGradeWeight),
                deadline: newAssignmentDeadline,
                channelId: props.channelId,
                scores: sanitizeScores,
            };

            console.log('New Assignment Input', gradebookEntryInput);

            // return;
            const server = fetchAPI('');

            if (editing) {
                server
                    .mutate({
                        mutation: editGradebookEntry,
                        variables: {
                            gradebookEntryInput,
                            entryId: editEntryId,
                        },
                    })
                    .then((res) => {
                        if (res.data.gradebook && res.data.gradebook.edit) {
                            Alert('Updated Gradebook entry successfully.');
                            resetNewEntryForm();
                            props.setShowNewAssignment(false);
                            // Reload gradebook
                            fetchGradebookInstructor();
                            fetchCourseAssignmentsAnalytics();
                            fetchStudentAnalytics();
                        } else {
                            Alert('Failed to update gradebook entry.');
                        }
                        setIsCreatingAssignment(false);
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update gradebook entry.');
                        setIsCreatingAssignment(false);
                    });
            } else {
                server
                    .mutate({
                        mutation: createGradebookEntry,
                        variables: {
                            gradebookEntryInput,
                        },
                    })
                    .then((res) => {
                        if (res.data.gradebook && res.data.gradebook.create) {
                            Alert('Created Gradebook entry successfully.');
                            resetNewEntryForm();
                            props.setShowNewAssignment(false);
                            fetchGradebookInstructor();
                            fetchCourseAssignmentsAnalytics();
                            fetchStudentAnalytics();
                        } else {
                            Alert('Failed to create gradebook entry.');
                        }
                        setIsCreatingAssignment(false);
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update gradebook entry.');
                        setIsCreatingAssignment(false);
                    });
            }
        },
        [
            newAssignmentTitle,
            newAssignmentTotalPoints,
            newAssignmentGradeWeight,
            newAssignmentDeadline,
            newAssignmentPointsScored,
            newAssignmentStoreFeedback,
            newAssignmentStoreSubmittedDate,
        ]
    );

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
    //                                 fontSize: 14,
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
                                fontSize: 14,
                            }}
                        >
                            Grade
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
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
                                    fontSize: 14,
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
                                        fontSize: 20,
                                        paddingBottom: 5,
                                    }}
                                >
                                    {progress}%
                                </Text>

                                {progress > 0 && Dimensions.get('window').width >= 768 ? (
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
                                fontSize: 14,
                            }}
                        >
                            Next submission
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 7,
                                textAlign: 'center',
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
                                fontSize: 14,
                            }}
                        >
                            Total Assessments
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
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
                                fontSize: 14,
                            }}
                        >
                            Not Submitted{' '}
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
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
                                    fontSize: 14,
                                }}
                            >
                                Submitted{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
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
                                    fontSize: 14,
                                }}
                            >
                                Late{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
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
                                    fontSize: 14,
                                }}
                            >
                                Graded{' '}
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
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

    const renderScoresTableStudent = () => {
        return (
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
                    {Dimensions.get('window').width < 768 ? null : (
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
                    )}
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
                            width: Dimensions.get('window').width < 768 ? '50%' : '25%',
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
                            (cue.availableUntil && new Date(cue.availableUntil) < new Date()) || cue.releaseSubmission;

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
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
                                        flexDirection: 'column',
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!scoreObject || !scoreObject.cueId) return;

                                            props.openCueFromGrades(cue._id);
                                        }}
                                        disabled={!scoreObject || !scoreObject.cueId}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                textAlign: 'center',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            {title}
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                                paddingTop: 7,
                                            }}
                                        >
                                            {cue.gradeWeight ? cue.gradeWeight : '0'}%
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {Dimensions.get('window').width < 768 ? null : (
                                    <View
                                        style={{
                                            width: '25%',
                                            padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                            paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
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
                                )}
                                <View
                                    style={{
                                        width: '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {scoreObject && !scoreObject.submittedAt ? (
                                        <View
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 10,
                                                marginRight: 7,
                                                backgroundColor: '#f94144',
                                            }}
                                        />
                                    ) : scoreObject && scoreObject !== undefined ? (
                                        <View
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 10,
                                                marginRight: 7,
                                                backgroundColor:
                                                    scoreObject.graded &&
                                                    scoreObject.score &&
                                                    new Date(parseInt(scoreObject.submittedAt)) >=
                                                        new Date(cue.deadline)
                                                        ? '#f3722c'
                                                        : '#35AC78',
                                            }}
                                        />
                                    ) : null}
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
                                                  new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline)
                                                ? 'Late'
                                                : 'Submitted'}
                                        </Text>
                                    )}
                                    {scoreObject &&
                                    scoreObject.submittedAt &&
                                    scoreObject.graded &&
                                    scoreObject.score &&
                                    new Date(parseInt(scoreObject.submittedAt)) >= new Date(cue.deadline) ? (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                                color: '#f3722c',
                                                marginLeft: 5,
                                            }}
                                        >
                                            (Late)
                                        </Text>
                                    ) : null}
                                </View>

                                <View
                                    style={{
                                        width: Dimensions.get('window').width < 768 ? '50%' : '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
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
                                                            {moment(new Date(cue.deadline)).format('MMM Do, h:mm a')}
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
                                                        fontSize: 12,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {moment(new Date(cue.initiateAt)).format('MMM Do')}
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
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
                                                        fontSize: 12,
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {moment(new Date(cue.deadline)).format('MMM Do')}
                                                </Text>
                                                <Text
                                                    style={{
                                                        fontSize: 12,
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
        );
    };

    const renderStudentView = () => {
        return (
            <View
                style={{
                    width: '100%',
                    marginBottom: Dimensions.get('window').width < 768 ? 75 : 0,
                }}
            >
                {renderPerformanceOverview()}
                {renderScoresTableStudent()}
            </View>
        );
    };

    const renderAssignmentAnalytics = () => {
        if (!assignmentAnalytics) return;

        const selectedAssignment = assignmentAnalytics.find(
            (assignment: any) =>
                assignment.cueId === assignmentAnalyticsSelected ||
                assignment.gradebookEntryId === assignmentAnalyticsSelected
        );

        if (!selectedAssignment) return null;

        const topPerformersData = selectedAssignment.topPerformers.map((user: any) => {
            return {
                x: user.fullName,
                y: assignmentsViewPoints ? user.pointsScored : user.score,
            };
        });

        console.log('Top performers data', topPerformersData);

        const bottomPerformersData = selectedAssignment.bottomPerformers.map((user: any) => {
            return {
                x: user.fullName,
                y: assignmentsViewPoints ? user.pointsScored : user.score,
            };
        });

        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 25,
                        alignItems: 'center',
                    }}
                >
                    <label style={{ width: '100%', maxWidth: 250 }}>
                        <Select
                            themeVariant="light"
                            selectMultiple={false}
                            groupLabel="&nbsp;"
                            inputClass="mobiscrollCustomMultiInput"
                            placeholder="Select..."
                            touchUi={true}
                            value={assignmentAnalyticsSelected}
                            data={assignmentAnalyticsOptions}
                            onChange={(val: any) => {
                                setAssignmentAnalyticsSelected(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                        />
                    </label>

                    <View
                        style={{
                            flexDirection: 'row',
                            marginLeft: 'auto',
                            alignItems: 'center',
                            borderRadius: 20,
                            backgroundColor: '#f8f8f8',
                        }}
                    >
                        {viewGradebookTabs.map((tab: string, ind: number) => {
                            return (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor:
                                            (tab === 'Pts' && assignmentsViewPoints) ||
                                            (tab !== 'Pts' && !assignmentsViewPoints)
                                                ? '#000'
                                                : '#f8f8f8',
                                        borderRadius: 20,
                                        paddingHorizontal: 14,
                                        paddingVertical: 7,
                                        minWidth: 60,
                                    }}
                                    onPress={() => {
                                        if (tab === 'Pts') {
                                            setAssignmentsViewPoints(true);
                                        } else {
                                            setAssignmentsViewPoints(false);
                                        }
                                    }}
                                    key={ind.toString()}
                                >
                                    <Text
                                        style={{
                                            color:
                                                (tab === 'Pts' && assignmentsViewPoints) ||
                                                (tab !== 'Pts' && !assignmentsViewPoints)
                                                    ? '#fff'
                                                    : '#000',
                                            fontSize: 12,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        padding: 20,
                        marginTop: 30,
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
                                    fontSize: 14,
                                }}
                            >
                                Deadline
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {moment(selectedAssignment.deadline).format('MMM Do, h:mma')}
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
                                        fontSize: 14,
                                    }}
                                >
                                    Mean
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
                                            fontSize: 20,
                                            paddingBottom: 5,
                                        }}
                                    >
                                        {assignmentsViewPoints
                                            ? selectedAssignment.meanPts
                                            : selectedAssignment.mean + '%'}
                                    </Text>
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
                                    fontSize: 14,
                                }}
                            >
                                Total Points
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                    textAlign: 'center',
                                }}
                            >
                                {selectedAssignment.totalPoints}
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
                                    fontSize: 14,
                                }}
                            >
                                Median
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {assignmentsViewPoints ? selectedAssignment.medianPts : selectedAssignment.median + '%'}
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
                                    fontSize: 14,
                                }}
                            >
                                Max
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {assignmentsViewPoints ? selectedAssignment.maxPts : selectedAssignment.max + '%'}
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
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                Shared With
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {selectedAssignment.sharedWith} students
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
                                    fontSize: 14,
                                }}
                            >
                                Standard Deviation
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {assignmentsViewPoints ? selectedAssignment.stdPts : selectedAssignment.std + '%'}
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
                                    fontSize: 14,
                                }}
                            >
                                Min
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {assignmentsViewPoints ? selectedAssignment.minPts : selectedAssignment.min + '%'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        padding: 20,
                        marginTop: 30,
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
                                    fontSize: 14,
                                }}
                            >
                                Status
                            </Text>
                            <View
                                style={{
                                    width: 250,
                                }}
                            >
                                <VictoryPie
                                    colorScale={['tomato', 'orange', 'green']}
                                    data={[
                                        {
                                            x: 1,
                                            y:
                                                selectedAssignment.sharedWith -
                                                selectedAssignment.graded -
                                                selectedAssignment.submitted,
                                        },
                                        {
                                            x: 2,
                                            y: selectedAssignment.submitted,
                                        },
                                        {
                                            x: 3,
                                            y: selectedAssignment.graded,
                                        },
                                    ]}
                                    style={{ labels: { fill: 'black', fontSize: 20 } }}
                                    innerRadius={120}
                                    labels={({ datum }) => {
                                        if (datum.y > 0) {
                                            if (datum.x === 1) {
                                                return datum.y + ' Not submitted';
                                            } else if (datum.x === 2) {
                                                return datum.y + ' Submitted';
                                            } else {
                                                return datum.y + ' Graded';
                                            }
                                        }
                                        return '';
                                    }}
                                    // labelComponent={<CustomLabel />}
                                />
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
                                    fontSize: 14,
                                }}
                            >
                                Highest scores
                            </Text>
                            <VictoryChart domainPadding={{ x: 50, y: [0, 20] }}>
                                <VictoryBar
                                    style={{ data: { fill: '#c43a31' } }}
                                    dataComponent={<Bar />}
                                    data={topPerformersData}
                                />
                            </VictoryChart>
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
                                    fontSize: 14,
                                }}
                            >
                                Lowest scores
                            </Text>
                            <VictoryChart domainPadding={{ x: 50, y: [0, 20] }}>
                                <VictoryBar
                                    style={{ data: { fill: '#c43a31' } }}
                                    dataComponent={<Bar />}
                                    data={bottomPerformersData}
                                />
                            </VictoryChart>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderStudentAnalytics = () => {
        if (!studentAnalytics || !assignmentAnalytics) return;

        const data = [
            {
                x: 1,
                y: studentAnalytics.progress,
            },
            {
                x: 2,
                y: 100 - studentAnalytics.progress,
            },
        ];

        const avgScoreData: any[] = [];

        const studentScoresData: any[] = [];

        console.log('Student analytics', studentAnalytics);

        console.log('assignmentAnalytics', assignmentAnalytics);

        studentAnalytics.scores.map((score: any) => {
            const id = score.cueId ? score.cueId : score.gradebookEntryId;

            const findAssignment = assignmentAnalytics.find((x: any) => x.cueId === id || x.gradebookEntryId === id);

            if (!findAssignment) return;

            avgScoreData.push({
                x: findAssignment.title,
                y: studentsViewPoints ? findAssignment.meanPts : findAssignment.mean,
            });

            studentScoresData.push({
                x: findAssignment.title,
                y: studentsViewPoints ? score.pointsScored : score.score,
            });
        });

        console.log('avgScoreData', avgScoreData);
        console.log('studentScoresData', studentScoresData);

        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 25,
                        alignItems: 'center',
                    }}
                >
                    <label style={{ width: '100%', maxWidth: 250 }}>
                        <Select
                            themeVariant="light"
                            selectMultiple={false}
                            group={true}
                            groupLabel="&nbsp;"
                            inputClass="mobiscrollCustomMultiInput"
                            placeholder="Select..."
                            touchUi={true}
                            value={userAnalyticsSelected}
                            data={userAnalyticsOptions}
                            onChange={(val: any) => {
                                setUserAnalyticsSelected(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                        />
                    </label>

                    <View
                        style={{
                            flexDirection: 'row',
                            marginLeft: 'auto',
                            alignItems: 'center',
                            borderRadius: 20,
                            backgroundColor: '#f8f8f8',
                            height: 27,
                        }}
                    >
                        {viewGradebookTabs.map((tab: string, ind: number) => {
                            return (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor:
                                            (tab === 'Pts' && studentsViewPoints) ||
                                            (tab !== 'Pts' && !studentsViewPoints)
                                                ? '#000'
                                                : '#f8f8f8',
                                        borderRadius: 20,
                                        paddingHorizontal: 14,
                                        paddingVertical: 7,
                                        minWidth: 60,
                                    }}
                                    onPress={() => {
                                        if (tab === 'Pts') {
                                            setStudentsViewPoints(true);
                                        } else {
                                            setStudentsViewPoints(false);
                                        }
                                    }}
                                    key={ind.toString()}
                                >
                                    <Text
                                        style={{
                                            color:
                                                (tab === 'Pts' && studentsViewPoints) ||
                                                (tab !== 'Pts' && !studentsViewPoints)
                                                    ? '#fff'
                                                    : '#000',
                                            fontSize: 12,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        padding: 20,
                        marginTop: 30,
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cccccc',
                    }}
                >
                    <View
                        style={{
                            width: '50%',
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
                                    fontSize: 14,
                                }}
                            >
                                Course Progress
                            </Text>
                            <View
                                style={{
                                    width: 250,
                                }}
                            >
                                <VictoryPie
                                    data={data}
                                    innerRadius={120}
                                    cornerRadius={25}
                                    labels={() => null}
                                    style={{
                                        data: {
                                            fill: ({ datum }) => {
                                                const color = datum.y > 30 ? 'green' : 'red';
                                                return datum.x === 1 ? color : 'transparent';
                                            },
                                        },
                                    }}
                                    labelComponent={
                                        <VictoryLabel
                                            textAnchor="middle"
                                            verticalAnchor="middle"
                                            x={200}
                                            y={200}
                                            text={`${Math.round(studentAnalytics.progress)}%`}
                                            style={{ fontSize: 45 }}
                                        />
                                    }
                                />
                            </View>
                        </View>

                        {/*  */}

                        <View
                            style={{
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginTop: 30,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                }}
                            >
                                Submissions
                            </Text>
                            <View
                                style={{
                                    width: 250,
                                }}
                            >
                                <VictoryPie
                                    colorScale={['tomato', 'orange', 'green']}
                                    data={[
                                        {
                                            x: 1,
                                            y:
                                                studentAnalytics.sharedWith -
                                                studentAnalytics.graded -
                                                studentAnalytics.submitted,
                                        },
                                        {
                                            x: 2,
                                            y: studentAnalytics.submitted,
                                        },
                                        {
                                            x: 3,
                                            y: studentAnalytics.graded,
                                        },
                                    ]}
                                    style={{ labels: { fill: 'black', fontSize: 20 } }}
                                    innerRadius={120}
                                    labels={({ datum }) => {
                                        if (datum.y > 0) {
                                            if (datum.x === 1) {
                                                return datum.y + ' Not submitted';
                                            } else if (datum.x === 2) {
                                                return datum.y + ' Submitted';
                                            } else {
                                                return datum.y + ' Graded';
                                            }
                                        }
                                        return '';
                                    }}
                                    // labelComponent={
                                    //     <VictoryLabel
                                    //         textAnchor="middle"
                                    //         verticalAnchor="middle"
                                    //         x={200}
                                    //         y={200}
                                    //         text={`${Math.round(
                                    //             (studentAnalytics.graded / studentAnalytics.sharedWith) * 100
                                    //         )}%`}
                                    //         style={{ fontSize: 45 }}
                                    //     />
                                    // }
                                    // labelComponent={<CustomLabel />}
                                />
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            width: '50%',
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
                                    fontSize: 14,
                                }}
                            >
                                Student score vs Course Average
                            </Text>

                            <VictoryChart horizontal height={400} width={400} padding={40}>
                                <VictoryStack style={{ data: { width: 25 }, labels: { fontSize: 15 } }}>
                                    <VictoryBar
                                        style={{ data: { fill: 'tomato' } }}
                                        data={studentScoresData}
                                        y={(data) => -Math.abs(data.y)}
                                        labels={({ datum }) => `${Math.abs(datum.y)}${studentsViewPoints ? '' : '%'}`}
                                    />
                                    <VictoryBar
                                        style={{ data: { fill: 'orange' } }}
                                        data={avgScoreData}
                                        labels={({ datum }) => `${Math.abs(datum.y)}${studentsViewPoints ? '' : '%'}`}
                                    />
                                </VictoryStack>

                                <VictoryAxis
                                    style={{
                                        axis: { stroke: 'transparent' },
                                        ticks: { stroke: 'transparent' },
                                        tickLabels: { fontSize: 15, fill: 'black' },
                                    }}
                                    tickLabelComponent={<VictoryLabel x={400 / 2} textAnchor="middle" />}
                                    tickValues={studentScoresData.map((point) => point.x).reverse()}
                                />
                            </VictoryChart>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderInstructorView = () => {
        return (
            <table className="stickyTable">
                {/* First row  */}
                <thead>
                    <tr>
                        {/* First cell will contain search bar */}
                        <th>
                            <TextInput
                                value={studentSearch}
                                onChangeText={(val: string) => setStudentSearch(val)}
                                placeholder={'Search user'}
                                placeholderTextColor={'#1F1F1F'}
                                style={{
                                    width: '100%',
                                    maxWidth: 200,
                                    borderColor: '#f2f2f2',
                                    borderWidth: 1,
                                    backgroundColor: '#fff',
                                    borderRadius: 24,
                                    fontSize: 15,
                                    paddingVertical: 8,
                                    marginTop: 0,
                                    paddingHorizontal: 10,
                                }}
                            />
                        </th>
                        {/* Total column */}
                        <th>
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
                        </th>
                        {/* All assignments */}
                        {gradebookEntries.map((entry: any, col: number) => {
                            return (
                                <th
                                    onClick={() => {
                                        if (entry.cueId) {
                                            props.openCueFromGrades(entry.cueId);
                                        } else {
                                            handleEditGradebookEntry(entry.gradebookEntryId);
                                        }
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 12,
                                            color: '#000000',
                                            marginBottom: 5,
                                        }}
                                    >
                                        {new Date(entry.deadline).toString().split(' ')[1] +
                                            ' ' +
                                            new Date(entry.deadline).toString().split(' ')[2]}
                                    </Text>
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                            color: '#000000',
                                            fontFamily: 'inter',
                                            marginTop: 3,
                                            // marginBottom: 5,
                                            // textAlignVertical: 'center',
                                        }}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                    >
                                        {entry.title}
                                    </Text>
                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#000000' }}>
                                        {entry.gradeWeight}%
                                    </Text>
                                    <View
                                        style={{
                                            marginTop: 3,
                                        }}
                                    >
                                        <Ionicons
                                            name={entry.cueId ? 'open-outline' : 'pencil-outline'}
                                            size={15}
                                            color="#1f1f1f"
                                        />
                                    </View>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                {/* Main Body */}
                <tbody>
                    {instructorGradebook.users.length === 0 ? (
                        <View
                            style={{
                                width: '100%',
                                padding: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 18,
                                    textAlign: 'center',
                                    fontFamily: 'Inter',
                                }}
                            >
                                No students.
                            </Text>
                        </View>
                    ) : null}
                    {/* Enter no students message if there is none */}
                    {gradebookUsers.map((user: any, row: number) => {
                        const userTotals = instructorGradebook.totals.find((x: any) => x.userId === user.userId);

                        return (
                            <tr style={{}} key={user.userId}>
                                {/* Student info */}
                                <th>
                                    <View>
                                        <Image
                                            style={{
                                                height: 37,
                                                width: 37,
                                                borderRadius: 75,
                                                alignSelf: 'center',
                                            }}
                                            source={{
                                                uri: user.avatar
                                                    ? user.avatar
                                                    : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                            }}
                                        />
                                        <Text
                                            style={{
                                                marginTop: 7,
                                                textAlign: 'center',
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                            }}
                                        >
                                            {user.fullName}
                                        </Text>
                                    </View>
                                </th>
                                {/* Total */}
                                <td>
                                    <View
                                        style={{
                                            width: '100%',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 13,
                                                color: '#000000',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {gradebookViewPoints
                                                ? userTotals.pointsScored + ' / ' + userTotals.totalPointsPossible
                                                : userTotals.score + '%'}
                                        </Text>
                                    </View>
                                </td>
                                {/* Other scores */}
                                {gradebookEntries.map((entry: any, col: number) => {
                                    const userScore = entry.scores.find((x: any) => x.userId === user.userId);

                                    if (
                                        userScore &&
                                        userScore.submitted &&
                                        (activeModifyId === entry.cueId || activeModifyId === entry.gradebookEntryId) &&
                                        activeUserId === user.userId
                                    ) {
                                        return (
                                            <td key={col.toString()}>
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
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
                                                            fontSize: 14,
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
                                                            setActiveModifyId('');
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
                                            </td>
                                        );
                                    }

                                    return (
                                        <td>
                                            <TouchableOpacity
                                                style={{
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                }}
                                                key={row.toString() + '-' + col.toString()}
                                                disabled={!gradebookViewPoints}
                                                onPress={() => {
                                                    if (!userScore) return;

                                                    setActiveModifyId(
                                                        entry.cueId ? entry.cueId : entry.gradebookEntryId
                                                    );
                                                    setActiveUserId(user.userId);
                                                    setActiveScore(userScore.pointsScored);
                                                }}
                                            >
                                                {!userScore || !userScore.submitted ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color: '#f94144',
                                                        }}
                                                    >
                                                        {!userScore ? 'N/A' : 'Not Submitted'}
                                                    </Text>
                                                ) : (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color:
                                                                userScore && userScore.lateSubmission
                                                                    ? '#f3722c'
                                                                    : '#000000',
                                                        }}
                                                    >
                                                        {userScore.score
                                                            ? gradebookViewPoints
                                                                ? userScore.pointsScored + ' / ' + entry.totalPoints
                                                                : userScore.score + '%'
                                                            : userScore.lateSubmission
                                                            ? 'Late'
                                                            : 'Submitted'}
                                                    </Text>
                                                )}

                                                {userScore &&
                                                userScore.submitted &&
                                                userScore.score &&
                                                userScore.lateSubmission ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color: '#f3722c',
                                                            marginTop: 5,
                                                            borderWidth: 0,
                                                            borderColor: '#f3722c',
                                                            borderRadius: 10,
                                                            width: 60,
                                                            alignSelf: 'center',
                                                        }}
                                                    >
                                                        (Late)
                                                    </Text>
                                                ) : null}
                                            </TouchableOpacity>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    if (props.showNewAssignment) {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    width: '100%',
                    height: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingHorizontal: paddingResponsive(),
                }}
            >
                <View
                    style={{
                        maxWidth: 1024,
                        width: '100%',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {/* HEADER */}
                    <View style={{ width: '100%', backgroundColor: 'white', flexDirection: 'row', marginTop: 20 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                flex: 1,
                                backgroundColor: 'white',
                            }}
                            onPress={() => {
                                props.setShowNewAssignment(false);
                                resetNewEntryForm();
                            }}
                        >
                            <Text
                                style={{
                                    borderRadius: 15,
                                    marginTop: 5,
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="chevron-back-outline" color="#000" size={23} />
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        color: '#000',
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    Back
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text
                        style={{
                            fontSize: 20,
                            paddingBottom: 20,
                            fontFamily: 'inter',
                            flex: 1,
                            lineHeight: 25,
                            textAlign: 'center',
                        }}
                    >
                        New Gradebook Entry
                    </Text>

                    <View style={{ width: '100%' }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Title
                        </Text>
                        <CustomTextInput
                            value={newAssignmentTitle}
                            placeholder={''}
                            onChangeText={(val) => setNewAssignmentTitle(val)}
                            placeholderTextColor={'#1F1F1F'}
                            required={true}
                        />
                    </View>

                    <View style={{ width: '100%', flexDirection: 'row' }}>
                        <View
                            style={{
                                width: '33%',
                                paddingRight: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#000000',
                                }}
                            >
                                Total Points
                            </Text>
                            <CustomTextInput
                                value={newAssignmentTotalPoints}
                                placeholder={''}
                                onChangeText={(val) => setNewAssignmentTotalPoints(val)}
                                keyboardType="numeric"
                                placeholderTextColor={'#1F1F1F'}
                                required={true}
                            />
                        </View>
                        <View
                            style={{
                                width: '33%',
                                paddingRight: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#000000',
                                }}
                            >
                                Grade Weight
                            </Text>
                            <CustomTextInput
                                value={newAssignmentGradeWeight}
                                placeholder={''}
                                onChangeText={(val) => setNewAssignmentGradeWeight(val)}
                                placeholderTextColor={'#1F1F1F'}
                                keyboardType="numeric"
                                required={true}
                            />
                        </View>
                        <View
                            style={{
                                width: '33%',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#000000',
                                }}
                            >
                                Deadline
                            </Text>
                            <View
                                style={{
                                    marginTop: 10,
                                }}
                            >
                                <Datepicker
                                    controls={['date', 'time']}
                                    touchUi={true}
                                    theme="ios"
                                    value={newAssignmentDeadline}
                                    themeVariant="light"
                                    inputProps={{
                                        placeholder: 'Select date...',
                                    }}
                                    onChange={(event: any) => {
                                        const date = new Date(event.value);
                                        const roundOffDate = roundSeconds(date);
                                        setNewAssignmentDeadline(roundOffDate);
                                    }}
                                    responsive={{
                                        xsmall: {
                                            controls: ['date', 'time'],
                                            display: 'bottom',
                                            touchUi: true,
                                        },
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false,
                                        },
                                    }}
                                />
                            </View>
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: 'column',
                            width: '100%',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Options
                        </Text>
                        {/* Store submission date */}
                        <View
                            style={{
                                flexDirection: 'row',
                                width: '100%',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                                padding: 10,
                                marginTop: 10,
                            }}
                        >
                            {/* Checkbox */}
                            <View>
                                <input
                                    type="checkbox"
                                    checked={newAssignmentStoreSubmittedDate}
                                    onChange={(e: any) => {
                                        setNewAssignmentStoreSubmittedDate(!newAssignmentStoreSubmittedDate);
                                    }}
                                />
                            </View>
                            {/* Option */}
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    paddingLeft: 15,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                    }}
                                >
                                    Record submission date
                                </Text>
                                <Text style={{ marginTop: 10 }}>
                                    Check if you wish to store when the student submitted the assignment
                                </Text>
                            </View>
                        </View>

                        {/* Store feedback */}
                        <View
                            style={{
                                flexDirection: 'row',
                                width: '100%',
                                borderBottomColor: '#f2f2f2',
                                borderBottomWidth: 1,
                                padding: 10,
                            }}
                        >
                            {/* Checkbox */}
                            <View>
                                <input
                                    type="checkbox"
                                    checked={newAssignmentStoreFeedback}
                                    onChange={(e: any) => {
                                        setNewAssignmentStoreFeedback(!newAssignmentStoreFeedback);
                                    }}
                                />
                            </View>
                            {/* Option */}
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    paddingLeft: 15,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                    }}
                                >
                                    Give feedback
                                </Text>
                                <Text style={{ marginTop: 10 }}>
                                    Check if you wish to give feedback for each student
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ width: '100%', marginTop: 30 }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#000000',
                            }}
                        >
                            Assign scores
                        </Text>

                        {newAssignmentStep === 1 ? (
                            <View
                                style={{
                                    marginTop: 20,
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    maxHeight: 500,
                                    overflow: 'scroll',
                                }}
                            >
                                <table className="stickyTable">
                                    <thead>
                                        <tr>
                                            <th>
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'inter',
                                                        marginBottom: 5,
                                                    }}
                                                >
                                                    Student
                                                </Text>
                                            </th>

                                            <th>
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'inter',
                                                        marginBottom: 5,
                                                    }}
                                                >
                                                    Submitted
                                                </Text>
                                            </th>

                                            <th>
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'inter',
                                                        marginBottom: 5,
                                                    }}
                                                >
                                                    Score
                                                </Text>
                                            </th>

                                            <th>
                                                <Text
                                                    style={{
                                                        textAlign: 'center',
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'inter',
                                                        marginBottom: 5,
                                                    }}
                                                >
                                                    {newAssignmentStoreSubmittedDate ? 'Date' : 'Late'}
                                                </Text>
                                            </th>
                                            {newAssignmentStoreFeedback ? (
                                                <th>
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'inter',
                                                            marginBottom: 5,
                                                        }}
                                                    >
                                                        Feedback
                                                    </Text>
                                                </th>
                                            ) : null}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newAssignmentPointsScored.map((student, studentIdx) => {
                                            return (
                                                <tr>
                                                    <th>
                                                        <View>
                                                            <Image
                                                                style={{
                                                                    height: 37,
                                                                    width: 37,
                                                                    borderRadius: 75,
                                                                    alignSelf: 'center',
                                                                }}
                                                                source={{
                                                                    uri: student.avatar
                                                                        ? student.avatar
                                                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                                }}
                                                            />
                                                            <Text
                                                                style={{
                                                                    marginTop: 7,
                                                                    textAlign: 'center',
                                                                    fontSize: 14,
                                                                    color: '#000000',
                                                                    fontFamily: 'inter',
                                                                }}
                                                            >
                                                                {student.fullName}
                                                            </Text>
                                                        </View>
                                                    </th>
                                                    <td>
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Switch
                                                                value={student.submitted}
                                                                onValueChange={() => {
                                                                    const updatePointsScored = [
                                                                        ...newAssignmentPointsScored,
                                                                    ];

                                                                    updatePointsScored[studentIdx].submitted =
                                                                        !student.submitted;
                                                                    updatePointsScored[studentIdx].points = '';
                                                                    updatePointsScored[studentIdx].lateSubmission =
                                                                        false;

                                                                    setNewAssignmentPointsScored(updatePointsScored);
                                                                }}
                                                                style={{ height: 20 }}
                                                                trackColor={{
                                                                    false: '#f2f2f2',
                                                                    true: '#000',
                                                                }}
                                                                activeThumbColor="white"
                                                            />
                                                        </View>
                                                    </td>
                                                    <td>
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {!student.submitted ? (
                                                                <Text
                                                                    style={{
                                                                        width: 80,
                                                                    }}
                                                                >
                                                                    -
                                                                </Text>
                                                            ) : (
                                                                <TextInput
                                                                    value={student.points}
                                                                    placeholder={''}
                                                                    onChangeText={(val) => {
                                                                        const updatePointsScored = [
                                                                            ...newAssignmentPointsScored,
                                                                        ];

                                                                        updatePointsScored[studentIdx].points = val;

                                                                        setNewAssignmentPointsScored(
                                                                            updatePointsScored
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        width: 80,
                                                                        marginRight: 5,
                                                                        padding: 8,
                                                                        borderColor: '#ccc',
                                                                        borderWidth: 1,
                                                                        fontSize: 14,
                                                                    }}
                                                                    placeholderTextColor={'#1F1F1F'}
                                                                />
                                                            )}
                                                        </View>
                                                    </td>
                                                    <td>
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {!student.submitted ? (
                                                                <Text>-</Text>
                                                            ) : newAssignmentStoreSubmittedDate ? (
                                                                <View
                                                                    style={{
                                                                        marginTop: 10,
                                                                    }}
                                                                >
                                                                    <Datepicker
                                                                        controls={['date']}
                                                                        touchUi={true}
                                                                        theme="ios"
                                                                        value={student.submittedAt}
                                                                        themeVariant="light"
                                                                        inputProps={{
                                                                            placeholder: 'Repeat till...',
                                                                        }}
                                                                        onChange={(event: any) => {
                                                                            const date = new Date(event.value);
                                                                            const roundOffDate = roundSeconds(date);

                                                                            const updatePointsScored = [
                                                                                ...newAssignmentPointsScored,
                                                                            ];

                                                                            updatePointsScored[studentIdx].submittedAt =
                                                                                roundOffDate;

                                                                            setNewAssignmentPointsScored(
                                                                                updatePointsScored
                                                                            );
                                                                        }}
                                                                        responsive={{
                                                                            xsmall: {
                                                                                controls: ['date'],
                                                                                display: 'bottom',
                                                                                touchUi: true,
                                                                            },
                                                                            medium: {
                                                                                controls: ['date'],
                                                                                display: 'anchored',
                                                                                touchUi: false,
                                                                            },
                                                                        }}
                                                                    />
                                                                </View>
                                                            ) : (
                                                                <Switch
                                                                    value={student.lateSubmission}
                                                                    onValueChange={() => {
                                                                        const updatePointsScored = [
                                                                            ...newAssignmentPointsScored,
                                                                        ];

                                                                        updatePointsScored[studentIdx].lateSubmission =
                                                                            !student.lateSubmission;

                                                                        setNewAssignmentPointsScored(
                                                                            updatePointsScored
                                                                        );
                                                                    }}
                                                                    style={{ height: 20 }}
                                                                    trackColor={{
                                                                        false: '#f2f2f2',
                                                                        true: '#000',
                                                                    }}
                                                                    activeThumbColor="white"
                                                                />
                                                            )}
                                                        </View>
                                                    </td>
                                                    {newAssignmentStoreFeedback ? (
                                                        <td>
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    justifyContent: 'center',
                                                                    paddingVertical: 10,
                                                                }}
                                                            >
                                                                <TextInput
                                                                    multiline={true}
                                                                    numberOfLines={2}
                                                                    style={{
                                                                        padding: 8,
                                                                        borderColor: '#ccc',
                                                                        borderWidth: 1,
                                                                        fontSize: 14,
                                                                    }}
                                                                    value={student.feedback}
                                                                    onChangeText={(val) => {
                                                                        const updatePointsScored = [
                                                                            ...newAssignmentPointsScored,
                                                                        ];

                                                                        updatePointsScored[studentIdx].feedback = val;

                                                                        setNewAssignmentPointsScored(
                                                                            updatePointsScored
                                                                        );
                                                                    }}
                                                                />
                                                            </View>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </View>
                        ) : (
                            <View
                                style={{
                                    flexDirection: 'column',
                                    width: '100%',
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingTop: 20,
                                    }}
                                >
                                    <Switch
                                        value={newAssignmentShareWithAll}
                                        onValueChange={() => setNewAssignmentShareWithAll(!newAssignmentShareWithAll)}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#f2f2f2',
                                            true: '#000',
                                        }}
                                        activeThumbColor="white"
                                    />
                                    <Text
                                        style={{
                                            paddingLeft: 10,
                                        }}
                                    >
                                        All Students
                                    </Text>
                                </View>

                                <View style={{ marginTop: 15 }}>
                                    <label style={{ width: '100%' }}>
                                        <Select
                                            themeVariant="light"
                                            selectMultiple={true}
                                            group={true}
                                            groupLabel="&nbsp;"
                                            inputClass="mobiscrollCustomMultiInput"
                                            disabled={newAssignmentShareWithAll}
                                            placeholder="Select..."
                                            touchUi={true}
                                            value={newAssignmentShareWithSelected}
                                            data={newAssignmentShareWithOptions}
                                            onChange={(val: any) => {
                                                setNewAssignmentShareWithSelected(val.value);
                                            }}
                                            responsive={{
                                                small: {
                                                    display: 'bubble',
                                                },
                                                medium: {
                                                    touchUi: false,
                                                },
                                            }}
                                        />
                                    </label>
                                </View>
                            </View>
                        )}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                marginTop: 20,
                            }}
                        >
                            <Text>Step {newAssignmentStep + 1} / 2</Text>

                            <TouchableOpacity
                                disabled={newAssignmentShareWithSelected.length === 0}
                                style={{
                                    backgroundColor: 'black',
                                    paddingVertical: 12,
                                    paddingHorizontal: 18,
                                }}
                                onPress={() => {
                                    if (newAssignmentStep === 0) {
                                        setNewAssignmentStep(1);
                                    } else {
                                        setNewAssignmentStep(0);
                                    }
                                }}
                            >
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        color: '#fff',
                                    }}
                                >
                                    {newAssignmentStep === 0
                                        ? newAssignmentShareWithSelected.length === 0
                                            ? 'No Selections'
                                            : 'Next'
                                        : 'Back'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form errors */}
                    {newAssignmentFormErrors.length > 0 ? (
                        <View
                            style={{
                                borderRadius: 12,
                                padding: 20,
                                backgroundColor: '#FEF2FE',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                marginTop: 30,
                            }}
                        >
                            <View style={{}}>
                                <Ionicons name={'close-circle'} size={16} color={'#F8719D'} />
                            </View>
                            <View
                                style={{
                                    paddingLeft: 10,
                                }}
                            >
                                <View style={{}}>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#991B1B',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        There were {newAssignmentFormErrors.length} errors with your submission
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        paddingLeft: 10,
                                        marginTop: 10,
                                    }}
                                >
                                    {newAssignmentFormErrors.map((error) => {
                                        return (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingBottom: 7,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        color: '#B91C1C',
                                                    }}
                                                >
                                                    -
                                                </Text>
                                                <View
                                                    style={{
                                                        paddingLeft: 10,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#B91C1C',
                                                        }}
                                                    >
                                                        {error}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {/* Submit buttons */}
                    <View
                        style={{
                            width: '100%',
                            alignItems: 'center',
                            marginVertical: 50,
                        }}
                    >
                        {editEntryId ? (
                            <View
                                style={{
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}
                            >
                                <TouchableOpacity
                                    style={{
                                        marginBottom: 20,
                                    }}
                                    onPress={() => handleCreateAssignment(true)}
                                    disabled={isCreatingAssignment || props.user.email === disableEmailId}
                                >
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            borderColor: '#000',
                                            borderWidth: 1,
                                            color: '#fff',
                                            backgroundColor: '#000',
                                            fontSize: 11,
                                            paddingHorizontal: 24,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'uppercase',
                                            width: 120,
                                        }}
                                    >
                                        {isCreatingAssignment ? '...' : 'EDIT'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        marginBottom: 20,
                                    }}
                                    onPress={() => handleDeleteAssignment()}
                                    disabled={isDeletingAssignment || props.user.email === disableEmailId}
                                >
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            borderColor: '#000',
                                            borderWidth: 1,
                                            color: '#000',
                                            backgroundColor: '#fff',
                                            fontSize: 11,
                                            paddingHorizontal: 24,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'uppercase',
                                            width: 120,
                                        }}
                                    >
                                        {isDeletingAssignment ? '...' : 'DELETE'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={{
                                    marginBottom: 20,
                                }}
                                onPress={() => handleCreateAssignment(false)}
                                disabled={isCreatingAssignment || props.user.email === disableEmailId}
                            >
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        borderColor: '#000',
                                        borderWidth: 1,
                                        color: '#fff',
                                        backgroundColor: '#000',
                                        fontSize: 11,
                                        paddingHorizontal: 24,
                                        fontFamily: 'inter',
                                        overflow: 'hidden',
                                        paddingVertical: 14,
                                        textTransform: 'uppercase',
                                        width: 120,
                                    }}
                                >
                                    {isCreatingAssignment ? '...' : 'CREATE'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    // MAIN RETURN
    return (
        <View
            style={{
                backgroundColor: '#fff',
                width: '100%',
                height: '100%',
                paddingHorizontal: paddingResponsive(),
            }}
        >
            {/* {renderExportButton()} */}
            {props.isOwner ? (
                <View
                    style={{
                        flexDirection: 'column',
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 50,
                        }}
                    >
                        <View>
                            <Text
                                style={{
                                    fontSize: 20,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Scores
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                marginLeft: 'auto',
                                alignItems: 'center',
                                borderRadius: 20,
                                backgroundColor: '#f8f8f8',
                            }}
                        >
                            {viewGradebookTabs.map((tab: string, ind: number) => {
                                return (
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor:
                                                (tab === 'Pts' && gradebookViewPoints) ||
                                                (tab !== 'Pts' && !gradebookViewPoints)
                                                    ? '#000'
                                                    : '#f8f8f8',
                                            borderRadius: 20,
                                            paddingHorizontal: 14,
                                            paddingVertical: 7,
                                            minWidth: 60,
                                        }}
                                        onPress={() => {
                                            if (tab === 'Pts') {
                                                setGradebookViewPoints(true);
                                            } else {
                                                setGradebookViewPoints(false);
                                            }
                                        }}
                                        key={ind.toString()}
                                    >
                                        <Text
                                            style={{
                                                color:
                                                    (tab === 'Pts' && gradebookViewPoints) ||
                                                    (tab !== 'Pts' && !gradebookViewPoints)
                                                        ? '#fff'
                                                        : '#000',
                                                fontSize: 12,
                                                textAlign: 'center',
                                            }}
                                        >
                                            {tab}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                    {isFetchingGradebook ? (
                        <View
                            style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                borderTopRightRadius: 0,
                                borderTopLeftRadius: 0,
                                paddingVertical: 100,
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : !instructorGradebook ? (
                        <View>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#1F1F1F',
                                    fontSize: 16,
                                    paddingVertical: 100,
                                    paddingHorizontal: 10,
                                    fontFamily: 'inter',
                                }}
                            >
                                Could not fetch instructor gradebook.
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={{
                                width: '100%',
                                backgroundColor: 'white',
                                maxHeight: Dimensions.get('window').height - 64 - 45 - 120,
                                maxWidth: 1024,
                                borderRadius: 2,
                                borderWidth: 1,
                                marginTop: 20,
                                borderColor: '#cccccc',
                                zIndex: 5000000,
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                position: 'relative',
                                overflow: 'scroll',
                            }}
                            // key={JSON.stringify(props.scores)}
                        >
                            {renderInstructorView()}
                        </View>
                    )}

                    {/* Render analytics section */}

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 100,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                fontFamily: 'Inter',
                            }}
                        >
                            Assignment Insights
                        </Text>
                    </View>

                    {/*  */}
                    {isFetchingAssignmentAnalytics ? (
                        <View
                            style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: '#fff',
                                borderTopRightRadius: 0,
                                borderTopLeftRadius: 0,
                                paddingVertical: 100,
                            }}
                        >
                            <ActivityIndicator color={'#1F1F1F'} />
                        </View>
                    ) : !assignmentAnalytics ? (
                        <View>
                            <Text
                                style={{
                                    width: '100%',
                                    color: '#1F1F1F',
                                    fontSize: 16,
                                    paddingVertical: 100,
                                    paddingHorizontal: 10,
                                    fontFamily: 'inter',
                                }}
                            >
                                Could not fetch assingment analytics.
                            </Text>
                        </View>
                    ) : (
                        <View>{renderAssignmentAnalytics()}</View>
                    )}

                    {/*  */}

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 100,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                fontFamily: 'Inter',
                            }}
                        >
                            Student Insights
                        </Text>
                    </View>

                    <View>{renderStudentAnalytics()}</View>
                </View>
            ) : (
                renderStudentView()
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
            borderBottomWidth: 1,
        },
        col: {
            width: Dimensions.get('window').width < 768 ? 90 : 120,
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: 10,
        },
        colHeader: {
            backgroundColor: '#f8f8f8',
            width: Dimensions.get('window').width < 768 ? 90 : 120,
            justifyContent: 'center',
            display: 'flex',
            flexDirection: 'column',
            padding: 10,
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
