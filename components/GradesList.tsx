// REACT
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Dimensions, TextInput, Image, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import _, { find } from 'lodash';
import * as FileSaver from 'file-saver';
import XLSX from 'xlsx';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import { TextInput as CustomTextInput } from './CustomTextInput';
import { Select, Datepicker, Popup } from '@mobiscroll/react';
import { RadioButton } from './RadioButton';
import ReactTagInput from '@pathofdev/react-tag-input';
import '@pathofdev/react-tag-input/build/index.css';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import moment from 'moment';
import ProgressBar from '@ramonak/react-progress-bar';
import Alert from './Alert';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';

import {
    createGradebookEntry,
    editGradebookEntry,
    getStudentAnalytics,
    getGradebookInstructor,
    getAssignmentAnalytics,
    getCourseStudents,
    deleteGradebookEntry,
    getStandardsBasedGradingScale,
    createStandards,
    getStandardsGradebook,
    updateStandardsScore,
    revertOverriddenStandardScore,
    getStandardsInsights,
    handleUpdateGradebookScore,
    getCourseGradingScale,
    handleReleaseSubmission,
    getGradebookStudent,
    getStandardsGradebookStudent,
    getStandardsCategories,
    handleEditStandard,
    handleDeleteStandard,
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
    VictoryLine,
    VictoryVoronoiContainer,
} from 'victory';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

class CustomLabel extends React.Component {
    render() {
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

const masteryColors = {
    '': '#f94144',
    '0': '#f9c74f',
    '1': '#f3722c',
    '2': '#f8961e',
    '3': '#35ac78',
    '4': '#0098f7',
    '5': '#006aff',
};

const GradesList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, user } = useAppContext();

    const [exportAoa, setExportAoa] = useState<any[]>([]);
    const [exportError, setExportError] = useState('');
    const [activeModifyId, setActiveModifyId] = useState('');
    const [activeUserId, setActiveUserId] = useState('');
    const [activeModifyEntryType, setActiveModifyEntryType] = useState('');

    const [standardModifyEntry, setStandardModifyEntry] = useState<any>(undefined);
    const [standardUserScore, setStandardUserScore] = useState<any>(undefined);
    const [modifyStandardOption, setModifyStandardOption] = useState('newEntry');
    const [selectedModifyStandard, setSelectedModifyStandard] = useState<any>('');

    const [activeScore, setActiveScore] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentSearchStandard, setStudentSearchStandard] = useState('');

    // Deadline, Name, Status
    const [sortByOption, setSortByOption] = useState('Deadline');
    // Ascending = true, descending = false
    const [sortByOrder, setSortByOrder] = useState(false);

    // STANDARDS SORT BY OPTIONS
    const [sortByOptionStandard, setSortByOptionStandard] = useState('Standard');

    const [gradebookEntryType, setGradebookEntryType] = useState('assignment');

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
    const [editStandardTitle, setEditStandardTitle] = useState('');
    const [editStandardDescription, setEditStandardDescription] = useState('');
    const [editStandardCategory, setEditStandardCategory] = useState('');

    // STANDARDS BASED ENTRY
    const [newCategories, setNewCategories] = useState<string[]>([]);
    const [newStandards, setNewStandards] = useState<any[]>([
        {
            title: '',
            description: '',
            category: '',
        },
    ]);
    const [categoryDropdownOptions, setCategoryDropdownOption] = useState<any[]>([]);
    const [gradeStudentsStandards, setGradeStudentsStandards] = useState<boolean>(false);

    const [assignPointsStandardDropdownOptions, setAssignPointsStandardDropdownOptions] = useState([
        {
            value: '0',
            text: 'Standard 1',
        },
    ]);
    const [assignPointsStandardSelected, setAssignPointsStandardSelected] = useState('0');

    const [newStandardsPointsScored, setNewStandardsPointsScored] = useState<any[][]>([]);
    const [masteryDropdownOptions, setMasteryDropdownOptions] = useState<any[]>([]);
    const [masteryMap, setMasteryMap] = useState(undefined);
    const [masteryPercentageMap, setMasteryPercentageMap] = useState(undefined);
    const [masteryHighest, setMasteryHighest] = useState(-1);

    // GRADEBOOK
    const [selectedGradebookMode, setSelectedGradebookMode] = useState('assignments');
    const [isFetchingGradebook, setIsFetchingGradebook] = useState(false);
    const [isFetchingStudents, setIsFetchingStudents] = useState(false);
    const [instructorGradebook, setIntructorGradebook] = useState<any>(undefined);
    const [gradebookEntries, setGradebookEntries] = useState<any[]>([]);
    const [gradebookUsers, setGradebookUsers] = useState<any[]>([]);
    const [courseStudents, setCourseStudents] = useState<any[]>([]);

    // STANDARDS GRADEBOOK
    const [isFetchingStandardsGradebook, setIsFetchingStandardsGradebook] = useState(false);
    const [instructorStandardsGradebook, setIntructorStandardsGradebook] = useState<any>(undefined);
    const [standardsGradebookEntries, setStandardsGradebookEntries] = useState<any[]>([]);
    const [standardsGradebookCategories, setStandardsGradebookCategories] = useState<any>(undefined);
    const [standardsGradebookUsers, setStandardsGradebookUsers] = useState<any[]>([]);

    // USER STANDARDS GRADEBOOK
    const [isFetchingStandardsGradebookStudent, setIsFetchingStandardsGradebookStudent] = useState(false);
    const [studentStandardsGradebook, setStudentStandardsGradebook] = useState<any>(undefined);
    const [standardsGradebookEntriesStudent, setStandardsGradebookEntriesStudent] = useState<any[]>([]);

    // SWITCH % and PTS
    const [viewGradebookTabs] = useState(['Pts', '%']);
    const [gradebookViewPoints, setGradebookViewPoints] = useState(true);

    // INSTRUCTOR ANALYTICS
    const [assignmentAnalytics, setAssignmentAnalytics] = useState<any>(undefined);
    const [isFetchingAssignmentAnalytics, setIsFetchingAssignmentAnalytics] = useState(false);
    const [assignmentAnalyticsOptions, setAssignmentAnalyticsOptions] = useState<any[]>([]);
    const [assignmentAnalyticsSelected, setAssignmentAnalyticsSelected] = useState<any>(undefined);
    const [studentAnalytics, setStudentAnalytics] = useState<any>(undefined);
    const [userAnalyticsOptions, setUserAnalyticsOptions] = useState<any[]>([]);
    const [userAnalyticsSelected, setUserAnalyticsSelected] = useState(undefined);
    const [isFetchingStudentAnalytics, setIsFetchingStudentAnalytics] = useState(false);
    const [isFetchingStandardsBasedGrading, setIsFetchingStandardsBasedGrading] = useState(false);
    const [standardsBasedScale, setStandardsBasedScale] = useState(undefined);
    const [courseGradingScale, setCourseGradingScale] = useState(undefined);
    const [standardsCategories, setStandardsCategories] = useState([]);
    const [isFetchingStandardsCategories, setIsFetchingStandardsCategories] = useState(false);

    // STANDARDS INSIGHTS
    const [isFetchingStandardsAnalytics, setIsFetchingStandardsAnalytics] = useState(false);
    const [standardAnalyticsSelectedUser, setStandardAnalyticsSelectedUser] = useState('');
    const [standardAnalyticsSelected, setStandardAnalyticsSelected] = useState('');
    const [standardsAnalytics, setStandardsAnalytics] = useState(undefined);
    const [standardsAnalyticsDropdownOptions, setStandardsAnalyticsDropdownOptions] = useState<any[]>([]);
    const [standardsAnalyticsUsersDropdownOptions, setStandardsAnalyticsUsersDropdownOptions] = useState<any[]>([]);

    // STUDENT GRADEBOOK
    const [isFetchingStudentGradebook, setIsFetchingStudentGradebook] = useState(false);
    const [studentGradebook, setStudentGradebook] = useState<any>(undefined);
    const [gradebookStudentEntries, setGradebookStudentEntries] = useState<any[]>([]);

    const server = useApolloClient();

    const newEntryTabs = [
        {
            value: 'assignment',
            label: 'Assignment',
        },
        {
            value: 'standards',
            label: 'Standards',
        },
    ];

    const modifyStandardOptions = [
        {
            value: 'newEntry',
            label: 'New entry',
        },
        {
            value: 'override',
            label: 'Override',
        },
    ];

    const tabs = [
        {
            value: 'assignments',
            label: 'Assignments',
        },
        {
            value: 'standards',
            label: 'Standards',
        },
    ];

    // Update Categories for standards
    useEffect(() => {
        // Add categories from the database here directly REMEMBER
        let categoryOptions: any[] = [...standardsCategories];

        newCategories.map((category: string) => categoryOptions.push(category));

        let removedList: string[] = [];

        categoryDropdownOptions.map((option: any) => {
            const findCategory = categoryOptions.find((category) => category === option.value);

            if (!findCategory) {
                removedList.push(option.value);
            }
        });

        categoryOptions = categoryOptions.map((option) => {
            return {
                value: option,
                text: option,
            };
        });

        let updateStandards: any[] = [...newStandards];

        newStandards.map((standard: any) => {
            if (removedList.includes(standard.category)) {
                return {
                    ...standard,
                    category: '',
                };
            }

            return standard;
        });

        setNewStandards(updateStandards);

        // Update new Standards to remove categories that are not present in the dropdown
        setCategoryDropdownOption(categoryOptions);
    }, [newCategories, standardsCategories]);

    useEffect(() => {
        const updateStandardsDropdown: any[] = newStandards.map((standard: any, ind: number) => {
            return {
                value: ind.toString(),
                text: `Standard ${ind + 1}`,
            };
        });

        setAssignPointsStandardDropdownOptions(updateStandardsDropdown);
    }, [newStandards]);

    useEffect(() => {
        if (props.isOwner && props.channelId) {
            fetchGradebookInstructor();
            fetchCourseAssignmentsAnalytics();
            loadCourseStudents();
            fetchStandardsBasedGradingScale();
            fetchCourseGradingScale();
        } else if (props.channelId) {
            fetchGradebookStudent();
            fetchStandardsBasedGradingScale();
            fetchCourseGradingScale();
        }
    }, [props.isOwner, props.channelId]);

    useEffect(() => {
        if (standardsBasedScale && props.isOwner && props.channelId) {
            fetchStandardsBasedGradebookInstructor();
            fetchStandardsCategories();
        } else if (standardsBasedScale && props.channelId) {
            fetchStandardsBasedGradebookStudent();
            fetchStandardsCategories();
        }
    }, [standardsBasedScale, props.isOwner, props.channelId]);

    useEffect(() => {
        if (userAnalyticsSelected && props.isOwner) {
            fetchStudentAnalytics();
        }
    }, [userAnalyticsSelected, props.isOwner]);

    useEffect(() => {
        if (props.channelId && standardAnalyticsSelected && standardAnalyticsSelectedUser) {
            fetchStandardsAnalytics();
        }
    }, [standardAnalyticsSelected, standardAnalyticsSelectedUser, props.isOwner, props.channelId]);

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

            // Standard based

            const standardsPointsScores: any[] = courseStudents.map((student: any) => {
                return {
                    _id: student._id,
                    fullName: student.fullName,
                    avatar: student.avatar,
                    points: '',
                };
            });

            setNewStandardsPointsScored([standardsPointsScores]);
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

        setNewAssignmentPointsScored(filterRemoved);
    }, [newAssignmentShareWithSelected, courseStudents]);

    const fetchStandardsBasedGradingScale = useCallback(() => {
        setIsFetchingStandardsBasedGrading(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsBasedGradingScale,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.channel && res.data.channel.getStandardsBasedGradingScale) {
                        setStandardsBasedScale(res.data.channel.getStandardsBasedGradingScale);

                        let highest = -1;
                        let map: any = {
                            '': 'Not Assigned',
                        };

                        let percentageMap: any = {
                            '': 0,
                        };

                        let points: number[] = [];

                        //
                        const scaleOptions = res.data.channel.getStandardsBasedGradingScale.range.map((level: any) => {
                            if (level.points > highest) {
                                highest = level.points;
                            }

                            map[level.points.toString()] = level.name.toString();

                            points.push(level.points);

                            return {
                                text: level.name.toString() + ' (' + level.points.toString() + ')',
                                value: level.points.toString(),
                            };
                        });

                        points.sort((a: number, b: number) => (a < b ? 1 : -1));

                        points.map((point: number) => {
                            const percentage = (point / points.length) * 100;
                            percentageMap[point.toString()] = percentage;
                        });

                        setMasteryHighest(highest);
                        setMasteryMap(map);
                        setMasteryPercentageMap(percentageMap);
                        setMasteryDropdownOptions(scaleOptions);
                    } else {
                        // setIntructorGradebook(undefined);
                        setStandardsBasedScale(undefined);
                    }
                    setIsFetchingStandardsBasedGrading(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    // Alert('Failed to fetch ');
                    // setIntructorGradebook(undefined);
                    setIsFetchingStandardsBasedGrading(false);
                });
        }
    }, [props.channelId]);

    const fetchCourseGradingScale = useCallback(async () => {
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getCourseGradingScale,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data && res.data.channel.getCourseGradingScale) {
                        setCourseGradingScale(res.data.channel.getCourseGradingScale);
                    } else {
                        setCourseGradingScale(undefined);
                    }
                })
                .catch((e) => {
                    setCourseGradingScale(undefined);
                });
        }
    }, [props.channelId]);

    const fetchGradebookInstructor = useCallback(() => {
        setIsFetchingGradebook(true);
        if (props.channelId && props.channelId !== '') {
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

    const fetchGradebookStudent = useCallback(() => {
        setIsFetchingStudentGradebook(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getGradebookStudent,
                    variables: {
                        channelId: props.channelId,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.gradebook && res.data.gradebook.getGradebookStudent) {
                        setStudentGradebook(res.data.gradebook.getGradebookStudent);
                        setGradebookStudentEntries(res.data.gradebook.getGradebookStudent.entries);
                    } else {
                        setStudentGradebook(undefined);
                        setGradebookStudentEntries([]);
                    }
                    setIsFetchingStudentGradebook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setStudentGradebook(undefined);
                    setGradebookStudentEntries([]);
                    setIsFetchingStudentGradebook(false);
                });
        }
    }, [props.channelId, userId]);

    const fetchStandardsBasedGradebookInstructor = useCallback(() => {
        setIsFetchingStandardsGradebook(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsGradebook,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.standards && res.data.standards.getStandardsGradebook) {
                        setIntructorStandardsGradebook(res.data.standards.getStandardsGradebook);

                        // Category Map
                        const categoryMap: any = {};

                        res.data.standards.getStandardsGradebook.entries.map((entry: any) => {
                            if (categoryMap[entry.category ? entry.category : '']) {
                                const updateEntries = [...categoryMap[entry.category ? entry.category : '']];
                                updateEntries.push(entry);
                                categoryMap[entry.category ? entry.category : ''] = updateEntries;
                            } else {
                                categoryMap[entry.category ? entry.category : ''] = [entry];
                            }
                        });

                        const categories = Object.keys(categoryMap);

                        categories.sort((a: any, b: any) => {
                            return a > b ? 1 : -1;
                        });

                        // Sort categories
                        const entries: any[] = [];

                        const categoryCountMap: any = {};

                        // Sort standards within each
                        categories.map((category: string) => {
                            const categoryEntries: any[] = categoryMap[category];

                            categoryEntries.sort((a: any, b: any) => {
                                return a.title > b.title ? 1 : -1;
                            });

                            entries.push(...categoryEntries);

                            categoryCountMap[category] = categoryMap[category].length;
                        });

                        if (entries.length > 0) {
                            const entryDropdowns: any[] = entries.map((entry: any) => {
                                return {
                                    value: entry._id,
                                    text: entry.title,
                                    group: entry.title.toUpperCase()[0],
                                };
                            });

                            setStandardsAnalyticsDropdownOptions(entryDropdowns);
                            setStandardAnalyticsSelected(entries[0]._id);
                        }

                        if (res.data.standards.getStandardsGradebook.users.length > 0) {
                            const userDropdowns: any[] = res.data.standards.getStandardsGradebook.users.map(
                                (user: any) => {
                                    return {
                                        value: user.userId,
                                        text: user.fullName,
                                        group: user.fullName.toUpperCase()[0],
                                    };
                                }
                            );
                            setStandardsAnalyticsUsersDropdownOptions(userDropdowns);
                            setStandardAnalyticsSelectedUser(res.data.standards.getStandardsGradebook.users[0].userId);
                        }

                        setStandardsGradebookEntries(entries);
                        setStandardsGradebookCategories(categoryCountMap);
                        setStandardsGradebookUsers(res.data.standards.getStandardsGradebook.users);
                    } else {
                        setIntructorStandardsGradebook(undefined);
                        setStandardsGradebookCategories(undefined);
                        setStandardsGradebookEntries([]);
                        setStandardsGradebookUsers([]);
                    }
                    setIsFetchingStandardsGradebook(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setIntructorStandardsGradebook(undefined);
                    setStandardsGradebookEntries([]);
                    setStandardsGradebookCategories(undefined);
                    setStandardsGradebookUsers([]);
                    setIsFetchingStandardsGradebook(false);
                });
        }
    }, [props.channelId]);

    const fetchStandardsBasedGradebookStudent = useCallback(() => {
        setIsFetchingStandardsGradebookStudent(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsGradebookStudent,
                    variables: {
                        channelId: props.channelId,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.standards && res.data.standards.getStandardsGradebookStudent) {
                        setStudentStandardsGradebook(res.data.standards.getStandardsGradebookStudent);

                        // Category Map
                        const categoryMap: any = {};

                        res.data.standards.getStandardsGradebookStudent.entries.map((entry: any) => {
                            if (categoryMap[entry.category ? entry.category : '']) {
                                const updateEntries = [...categoryMap[entry.category ? entry.category : '']];
                                updateEntries.push(entry);
                                categoryMap[entry.category ? entry.category : ''] = updateEntries;
                            } else {
                                categoryMap[entry.category ? entry.category : ''] = [entry];
                            }
                        });

                        const categories = Object.keys(categoryMap);

                        categories.sort((a: any, b: any) => {
                            return a > b ? 1 : -1;
                        });

                        // Sort categories
                        const entries: any[] = [];

                        const categoryCountMap: any = {};

                        // Sort standards within each
                        categories.map((category: string) => {
                            const categoryEntries: any[] = categoryMap[category];

                            categoryEntries.sort((a: any, b: any) => {
                                return a.title > b.title ? 1 : -1;
                            });

                            entries.push(...categoryEntries);

                            categoryCountMap[category] = categoryMap[category].length;
                        });

                        if (entries.length > 0) {
                            const entryDropdowns: any[] = entries.map((entry: any) => {
                                return {
                                    value: entry._id,
                                    text: entry.title,
                                    group: entry.title.toUpperCase()[0],
                                };
                            });

                            setStandardsAnalyticsDropdownOptions(entryDropdowns);
                            setStandardAnalyticsSelected(entries[0]._id);
                        }

                        setStandardAnalyticsSelectedUser(userId);

                        setStandardsGradebookEntriesStudent(entries);
                        setStandardsGradebookCategories(categoryCountMap);
                    } else {
                        setStudentStandardsGradebook(undefined);
                        setStandardsGradebookCategories(undefined);
                        setStandardsGradebookEntriesStudent([]);
                    }
                    setIsFetchingStandardsGradebookStudent(false);
                })
                .catch((e) => {
                    console.log('error', e);
                    Alert('Failed to fetch gradebook');
                    setStudentStandardsGradebook(undefined);
                    setStandardsGradebookEntriesStudent([]);
                    setStandardsGradebookCategories(undefined);
                    setIsFetchingStandardsGradebookStudent(false);
                });
        }
    }, [props.channelId, userId]);

    const fetchStandardsCategories = useCallback(() => {
        setIsFetchingStandardsCategories(true);
        if (props.channelId && props.channelId !== '') {
            server
                .query({
                    query: getStandardsCategories,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.standards && res.data.standards.getStandardsCategories) {
                        setStandardsCategories(res.data.standards.getStandardsCategories);
                    } else {
                        setStandardsCategories([]);
                    }
                    setIsFetchingStandardsCategories(false);
                })
                .catch((e) => {
                    setStandardsCategories([]);
                    setIsFetchingStandardsCategories(false);
                });
        }
    }, []);

    const fetchCourseAssignmentsAnalytics = useCallback(() => {
        setIsFetchingAssignmentAnalytics(true);
        if (props.channelId && props.channelId !== '') {
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

    const fetchStandardsAnalytics = useCallback(() => {
        setIsFetchingStandardsAnalytics(true);

        server
            .query({
                query: getStandardsInsights,
                variables: {
                    channelId: props.channelId,
                    standardId: standardAnalyticsSelected,
                    userId: standardAnalyticsSelectedUser,
                },
            })
            .then((res) => {
                if (res.data && res.data.standards.getStandardsInsights) {
                    setStandardsAnalytics(res.data.standards.getStandardsInsights);
                } else {
                    setStandardsAnalytics(undefined);
                }
                setIsFetchingStandardsAnalytics(false);
            })
            .catch((e) => {
                console.log('Error', e);
                setStandardsAnalytics(undefined);
                setIsFetchingStandardsAnalytics(false);
            });
    }, [standardAnalyticsSelected, standardAnalyticsSelectedUser, props.isOwner, props.channelId]);

    /**
     * @description Fetch all course students for creating new assignment and assigning scores
     */
    const loadCourseStudents = useCallback(() => {
        setIsFetchingStudents(true);
        if (props.channelId && props.channelId !== '') {
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

    const handleEditStandardEntry = useCallback(
        (standardId: string) => {
            const { entries } = instructorStandardsGradebook;

            const findEntry = entries.find((entry: any) => entry._id === standardId);

            setGradebookEntryType('standards');
            setEditStandardTitle(findEntry.title);
            setEditStandardDescription(findEntry.description);
            setEditStandardCategory(findEntry.category ? findEntry.category : '');
            setEditEntryId(standardId);

            props.setShowNewAssignment(true);
        },
        [instructorStandardsGradebook]
    );

    const handleEditGradebookEntry = useCallback(
        (gradebookEntryId: string) => {
            const { entries, users } = instructorGradebook;

            const findEntry = entries.find((entry: any) => entry.gradebookEntryId === gradebookEntryId);

            const { scores } = findEntry;

            if (!findEntry) return;

            let shareWithAll = false;
            let storeSubmissionDate = false;
            let storeFeedback = false;

            let shareWithSelected: string[] = [];

            let gradebookPointsScored: any[] = [];

            users.map((user: any) => {
                const findScore = scores.find((x: any) => x.userId === user.userId);

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

    const handleUpdateStandardsScore = useCallback(async () => {
        if (!selectedModifyStandard) {
            Alert('Select a mastery level to assign to student.');
            return;
        }

        server
            .mutate({
                mutation: updateStandardsScore,
                variables: {
                    standardId: standardModifyEntry._id,
                    userId: standardUserScore.userId,
                    points: Number(selectedModifyStandard),
                    override: modifyStandardOption === 'newEntry' ? false : true,
                },
            })
            .then((res) => {
                if (res.data && res.data.standards.updateStandardScore) {
                    Alert('Successfully updated mastery level for student.');
                    setStandardUserScore(undefined);
                    setStandardModifyEntry(undefined);
                    // Refresh standards gradebook
                    fetchStandardsBasedGradebookInstructor();
                } else {
                    Alert('Failed to update mastery level for student.');
                }
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to update mastery level for student.');
            });
    }, [standardUserScore, standardModifyEntry, selectedModifyStandard, modifyStandardOption]);

    const handleRevertOverride = useCallback(async () => {
        //

        server
            .mutate({
                mutation: revertOverriddenStandardScore,
                variables: {
                    standardId: standardModifyEntry._id,
                    userId: standardUserScore.userId,
                },
            })
            .then((res) => {
                if (res.data && res.data.standards.revertOverriddenStandardScore) {
                    Alert('Successfully reverted overridden mastery level for student.');
                    setStandardUserScore(undefined);
                    setStandardModifyEntry(undefined);
                    // Refresh standards gradebook
                    fetchStandardsBasedGradebookInstructor();
                } else {
                    Alert('Failed to revert overridden mastery level for student.');
                }
            })
            .catch((e) => {
                console.log('Error', e);
                Alert('Failed to revert overridden mastery level for student.');
            });
    }, [standardUserScore, standardModifyEntry]);

    /**
     * @description Round time to nearest seconds
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    useEffect(() => {
        if (!studentGradebook) return;

        if (sortByOption === 'Name') {
            const sortCues = [...studentGradebook.entries];

            sortCues.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? -1 : 1;
                } else if (a.title > b.title) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setGradebookStudentEntries(sortCues);
        } else if (sortByOption === 'Weight') {
            const sortCues = [...studentGradebook.entries];

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

            setGradebookStudentEntries(sortCues);
        } else if (sortByOption === 'Status') {
            const sortCues = [...studentGradebook.entries];

            sortCues.sort((a: any, b: any) => {
                if (a.score && !b.score) {
                    return sortByOrder ? 1 : -1;
                } else if (!a.score && b.score) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            sortCues.sort((a: any, b: any) => {
                if (a.submitted && !b.submitted) {
                    return sortByOrder ? -1 : 1;
                } else if (!a.submitted && b.submitted) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            // sortCues.sort((a: any, b: any) => {

            //     if (scoreObjectA && !scoreObjectB) {
            //         return -1;
            //     } else if (scoreObjectB && !scoreObjectA) {
            //         return 1;
            //     } else {
            //         return 0;
            //     }
            // });

            setGradebookStudentEntries(sortCues);
        } else if (sortByOption === 'Deadline') {
            const sortCues = [...studentGradebook.entries];

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

            setGradebookStudentEntries(sortCues);
        }
    }, [sortByOption, sortByOrder, studentGradebook]);

    useEffect(() => {
        if (!studentStandardsGradebook) return;

        if (sortByOptionStandard === 'Standard') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.title < b.title) {
                    return sortByOrder ? -1 : 1;
                } else if (a.title > b.title) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        } else if (sortByOptionStandard === 'Category') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.category < b.category) {
                    return sortByOrder ? -1 : 1;
                } else if (a.category > b.category) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        } else if (sortByOptionStandard === 'Description') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.description < b.description) {
                    return sortByOrder ? -1 : 1;
                } else if (a.description > b.description) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        } else if (sortByOptionStandard === 'Mastery') {
            const sortStandardsEntries = [...studentStandardsGradebook.entries];

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.masteryPoints && !b.masteryPoints) {
                    return sortByOrder ? -1 : 1;
                } else if (!a.masteryPoints && b.masteryPoints) {
                    return sortByOrder ? 1 : -1;
                } else {
                    return 0;
                }
            });

            sortStandardsEntries.sort((a: any, b: any) => {
                if (a.masteryPoints && b.masteryPoints && a.masteryPoints > b.masteryPoints) {
                    return sortByOrder ? -1 : 1;
                } else {
                    return 0;
                }
            });

            setStandardsGradebookEntriesStudent(sortStandardsEntries);
        }
    }, [sortByOption, sortByOrder, studentStandardsGradebook]);

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
     * @description Filter users by search
     */
    useEffect(() => {
        if (!instructorStandardsGradebook || !instructorStandardsGradebook.users) {
            return;
        }

        if (studentSearchStandard === '') {
            setStandardsGradebookUsers([...instructorStandardsGradebook.users]);
        } else {
            const allStudents = [...instructorStandardsGradebook.users];

            const matches = allStudents.filter((student: any) => {
                return student.fullName.toLowerCase().includes(studentSearchStandard.toLowerCase());
            });

            setStandardsGradebookUsers(matches);
        }
    }, [studentSearchStandard, instructorStandardsGradebook]);

    /**
     * @description Prepare export data for Grades
     */
    useEffect(() => {
        if (!instructorGradebook || !instructorGradebook.entries || !instructorGradebook.users) {
            return;
        }

        if (instructorGradebook.entries.length === 0) {
            setExportError('No gradebook entries found.');
            return;
        }

        if (instructorGradebook.users.length === 0) {
            setExportError('No students in course.');
            return;
        }

        const exportAoa = [];

        let row1 = ['Student', 'Total'];
        let row2 = ['', ''];

        instructorGradebook.entries.forEach((entry: any) => {
            const { title, deadline, gradeWeight } = entry;

            row1.push(title);

            let formattedDeadline =
                new Date(deadline).toString().split(' ')[1] + ' ' + new Date(deadline).toString().split(' ')[2];

            row2.push(`${formattedDeadline} (${gradeWeight}%)`);
        });

        exportAoa.push(row1);
        exportAoa.push(row2);

        instructorGradebook.users.map((user: any, index: number) => {
            let studentRow = [];

            const userTotals = instructorGradebook.totals.find((x: any) => x.userId === user.userId);

            studentRow.push(user.fullName);

            studentRow.push(
                gradebookViewPoints
                    ? userTotals.pointsScored + ' / ' + userTotals.totalPointsPossible
                    : userTotals.score + '%'
            );

            instructorGradebook.entries.map((entry: any, col: number) => {
                const userScore = entry.scores.find((x: any) => x.userId === user.userId);

                console.log('Entry', entry);
                if (!userScore || !userScore.submitted) {
                    studentRow.push(!userScore ? 'N/A' : 'Not Submitted');
                } else {
                    studentRow.push(
                        `${
                            userScore.score
                                ? gradebookViewPoints
                                    ? userScore.pointsScored + ' / ' + entry.totalPoints
                                    : userScore.score + '%'
                                : userScore.lateSubmission
                                ? 'Late'
                                : 'Submitted'
                        } ${
                            userScore && userScore.submitted && userScore.score && userScore.lateSubmission
                                ? '(Late)'
                                : ''
                        }`
                    );
                }
            });

            console.log('Student Row', studentRow);

            exportAoa.push(studentRow);
        });

        console.log('Export AOA', exportAoa);

        setExportAoa(exportAoa);
    }, [instructorGradebook, gradebookViewPoints]);

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
    const exportGrades = useCallback(() => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        console.log('Export AoA', exportAoa);
        if (exportError) {
            Alert(exportError);
            return;
        }

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Grades ');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'grades' + fileExtension);
    }, [exportAoa, exportError]);

    const handleUpdateAssignmentScore = useCallback(
        async (totalPoints: number) => {
            async function updateScore() {
                server
                    .mutate({
                        mutation: handleUpdateGradebookScore,
                        variables: {
                            userId: activeUserId,
                            entryId: activeModifyId,
                            gradebookEntry: activeModifyEntryType !== 'cue',
                            score: Number(activeScore),
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.gradebook.handleUpdateGradebookScore) {
                            Alert('Updated user score successfully.');
                            // Reload gradebook
                            fetchGradebookInstructor();
                            fetchCourseAssignmentsAnalytics();
                            fetchStudentAnalytics();

                            setActiveUserId('');
                            setActiveModifyId('');
                            setActiveScore('');
                            setActiveModifyEntryType('');
                        } else {
                            Alert('Failed to update user score. Try again.');
                        }
                    })
                    .catch((e) => {
                        console.log('Error', e);
                        Alert('Failed to update user score. Try again.');
                    });
            }

            if (activeScore === '' || Number.isNaN(Number(activeScore))) {
                Alert('Enter a valid score for student.');
                return;
            }

            if (Number(activeScore) > totalPoints) {
                //
                Alert(
                    'New score is greater than the total points for the assignment.',
                    'Would you still like to proceed?',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => {
                                return;
                            },
                        },
                        {
                            text: 'Yes',
                            onPress: async () => {
                                updateScore();
                            },
                        },
                    ]
                );
            } else {
                updateScore();
            }
        },
        [activeUserId, activeModifyId, activeScore, activeModifyEntryType]
    );

    const resetNewEntryForm = () => {
        // Assignment
        setNewAssignmentTitle('');
        setNewAssignmentGradeWeight('');
        setNewAssignmentTotalPoints('');
        setNewAssignmentDeadline(new Date());
        setNewAssignmentPointsScored([]);
        setNewAssignmentFormErrors([]);
        setNewAssignmentStoreFeedback(false);
        setNewAssignmentStoreSubmittedDate(false);
        setNewAssignmentShareWithAll(true);
        setNewAssignmentStep(0);
        setEditEntryId('');
        setGradebookEntryType('assignment');
        setEditStandardTitle('');
        setEditStandardDescription('');
        setEditStandardCategory('');

        // Reset assignment points scored
        let selected: string[] = [];

        courseStudents.map((student: any) => {
            selected.push(student._id);
        });

        setNewAssignmentShareWithSelected(selected);

        // Standards
        setNewStandards([
            {
                title: '',
                description: '',
                category: '',
            },
        ]);

        // Standard Points scored
        const standardsPointsScores: any[] = courseStudents.map((student: any) => {
            return {
                _id: student._id,
                fullName: student.fullName,
                avatar: student.avatar,
                points: '',
            };
        });

        setNewStandardsPointsScored([standardsPointsScores]);

        // Refetch Categories
    };

    const handleDeleteAssignment = useCallback(async () => {
        setIsDeletingAssignment(true);

        if (gradebookEntryType === 'assignment') {
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
        } else {
            server
                .mutate({
                    mutation: handleDeleteStandard,
                    variables: {
                        standardId: editEntryId,
                    },
                })
                .then((res) => {
                    if (res.data.standard && res.data.standard.deleteStandard) {
                        Alert('Deleted Standard successfully.');
                        resetNewEntryForm();
                        props.setShowNewAssignment(false);
                        // Reload gradebook
                        fetchStandardsBasedGradebookInstructor();
                        fetchStandardsAnalytics();
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
        }
    }, [editEntryId]);

    const handleCreateAssignment = useCallback(
        async (editing?: boolean) => {
            setIsCreatingAssignment(true);

            let errors = [];

            if (gradebookEntryType === 'assignment') {
                if (!newAssignmentTitle || newAssignmentTitle === '') {
                    errors.push('Title is required for the assignment.');
                }

                if (
                    newAssignmentTotalPoints === '' ||
                    Number.isNaN(Number(newAssignmentTotalPoints)) ||
                    Number(newAssignmentTotalPoints) <= 0
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

                // return;

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
            } else {
                if (editing) {
                    if (editStandardTitle === '') {
                        errors.push('Title is required for standard');
                    }

                    if (errors.length > 0) {
                        setNewAssignmentFormErrors(errors);
                        setIsCreatingAssignment(false);
                        return;
                    }

                    server
                        .mutate({
                            mutation: handleEditStandard,
                            variables: {
                                standardId: editEntryId,
                                title: editStandardTitle,
                                description: editStandardDescription,
                                category: editStandardCategory,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.standards.editStandard) {
                                Alert('Updated Standard successfully.');
                                props.setShowNewAssignment(false);
                                resetNewEntryForm();
                                fetchStandardsBasedGradebookInstructor();
                                fetchStandardsAnalytics();
                            } else {
                                Alert('Failed to edit Standard.');
                            }
                            setIsCreatingAssignment(false);
                        })
                        .catch((e) => {
                            Alert('Failed to edit Standard.');
                        });
                } else {
                    newStandards.map((standard: any, ind: number) => {
                        if (standard.title === '' || !standard.title) {
                            errors.push(`Enter title for standard ${ind + 1}`);
                        }
                    });

                    let sanitizeStandardsScores: any[] = [];

                    // Sanitize
                    if (gradeStudentsStandards) {
                        sanitizeStandardsScores = newStandardsPointsScored.map((standard: any) => {
                            let scoresWithNumbers: any[] = [];

                            standard.map((user: any) => {
                                if (user.points && user.points !== '') {
                                    scoresWithNumbers.push({
                                        userId: user._id,
                                        points: Number(user.points),
                                    });
                                }
                            });

                            return scoresWithNumbers;
                        });
                    }

                    server
                        .mutate({
                            mutation: createStandards,
                            variables: {
                                standardsInput: {
                                    standards: newStandards,
                                    standardsScores: gradeStudentsStandards ? sanitizeStandardsScores : undefined,
                                    channelId: props.channelId,
                                },
                            },
                        })
                        .then((res) => {
                            if (res.data.standards && res.data.standards.create) {
                                Alert('Created Gradebook entry successfully.');
                                props.setShowNewAssignment(false);
                                resetNewEntryForm();
                                fetchStandardsBasedGradebookInstructor();
                                fetchStandardsAnalytics();
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
            }
        },
        [
            gradebookEntryType,
            newAssignmentTitle,
            newAssignmentTotalPoints,
            newAssignmentGradeWeight,
            newAssignmentDeadline,
            newAssignmentPointsScored,
            newAssignmentStoreFeedback,
            newAssignmentStoreSubmittedDate,
            newStandards,
            newStandardsPointsScored,
            editStandardTitle,
            editStandardDescription,
            editStandardCategory,
        ]
    );

    // /**
    //  * @description Renders export button
    //  */
    const renderExportButton = () => {
        return (
            <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        justifyContent: 'flex-end',
                        width: '100%',
                        backgroundColor: '#fff',
                        marginRight: 20,
                    }}
                >
                    {!props.isOwner ? null : (
                        <TouchableOpacity
                            onPress={() => {
                                exportGrades();
                            }}
                            style={{
                                backgroundColor: '#f8f8f8',
                                paddingHorizontal: 14,
                                paddingVertical: 7,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderRadius: 15,
                            }}
                        >
                            <Ionicons
                                name="download-outline"
                                color={'#000'}
                                style={{
                                    marginRight: 8,
                                }}
                            />
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 12,
                                    color: '#000',
                                    fontFamily: 'inter',
                                }}
                            >
                                Export
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderPerformanceOverview = () => {
        const grade = gradebookViewPoints
            ? studentGradebook.total.pointsScored.toFixed(2).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1') +
              '/' +
              studentGradebook.total.totalPointsPossible
            : studentGradebook.total.score.toFixed(2).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1') + '%';
        const gradingScaleOutcome = studentGradebook.total.gradingScaleOutcome
            ? '(' + studentGradebook.total.gradingScaleOutcome + ')'
            : '';
        const progress = studentGradebook.total.courseProgress;
        const totalAssessments = studentGradebook.total.totalAssessments;
        const submitted = studentGradebook.total.submitted;
        const notSubmitted = studentGradebook.total.notSubmitted;
        const late = studentGradebook.total.lateSubmissions;
        const graded = studentGradebook.total.graded;
        const upcomingDeadline = studentGradebook.total.nextAssignmentDue
            ? moment(new Date(studentGradebook.total.nextAssignmentDue)).format('MMM Do, h:mma')
            : 'N/A';

        return (
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    padding: 20,
                    marginTop: 20,
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
                            Total
                        </Text>
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                fontSize: 20,
                                paddingTop: 7,
                            }}
                        >
                            {grade} {gradingScaleOutcome}
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
                    marginTop: 20,
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
                    {gradebookStudentEntries.map((entry: any, ind: number) => {
                        const hasDeadlinePassed = new Date(entry.deadline) < new Date() || entry.releaseSubmission;
                        const hasLateSubmissionPassed =
                            (entry.availableUntil && new Date(entry.availableUntil) < new Date()) ||
                            entry.releaseSubmission;

                        let remaining;

                        if (!hasDeadlinePassed && entry.cueId) {
                            let start = new Date(entry.initiateAt);
                            let end = new Date(entry.deadline);
                            const current = new Date();

                            const currentElapsed = current.valueOf() - start.valueOf();
                            const totalDifference = end.valueOf() - start.valueOf();

                            remaining = 100 - (currentElapsed / totalDifference) * 100;
                        } else if (
                            hasDeadlinePassed &&
                            entry.availableUntil &&
                            !hasLateSubmissionPassed &&
                            entry.cueId
                        ) {
                            let start = new Date(entry.deadline);
                            let end = new Date(entry.availableUntil);
                            const current = new Date();

                            const currentElapsed = current.getTime() - start.getTime();
                            const totalDifference = end.getTime() - start.getTime();

                            remaining = 100 - (currentElapsed / totalDifference) * 100;
                        }

                        const displayStatus =
                            !entry.submitted && entry.score !== undefined && entry.score !== null
                                ? 'Missing'
                                : entry.submitted && entry.lateSubmission
                                ? 'Late'
                                : undefined;

                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: ind === gradebookStudentEntries.length - 1 ? 8 : 0,
                                    borderBottomRightRadius: ind === gradebookStudentEntries.length - 1 ? 8 : 0,
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
                                            if (!entry || !entry.cueId) return;

                                            props.openCueFromGrades(
                                                props.channelId,
                                                entry.cueId,
                                                props.channelCreatedBy
                                            );
                                        }}
                                        disabled={!entry.cueId}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                textAlign: 'center',
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            {entry.title}
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
                                                }}
                                            >
                                                {entry.gradeWeight ? entry.gradeWeight : '0'}%
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
                                    {!entry.submitted ? (
                                        <View
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 10,
                                                marginRight: 7,
                                                backgroundColor: '#f94144',
                                            }}
                                        />
                                    ) : !entry.score ? (
                                        <View
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: 10,
                                                marginRight: 7,
                                                backgroundColor: entry.lateSubmission ? '#f3722c' : '#35AC78',
                                            }}
                                        />
                                    ) : null}
                                    {!entry.submitted ? (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                            }}
                                        >
                                            {entry.score !== undefined && entry.score !== null
                                                ? gradebookViewPoints
                                                    ? entry.pointsScored
                                                    : entry.score + '%'
                                                : 'Not Submitted'}
                                        </Text>
                                    ) : (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                                color: entry.lateSubmission ? '#f3722c' : '#000000',
                                            }}
                                        >
                                            {entry.score
                                                ? gradebookViewPoints
                                                    ? entry.pointsScored + '/' + entry.totalPoints
                                                    : entry.score + '%'
                                                : entry.lateSubmission
                                                ? 'Late'
                                                : 'Submitted'}
                                        </Text>
                                    )}
                                    {displayStatus ? (
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                textAlign: 'center',
                                                color: displayStatus === 'Late' ? '#f3722c' : '#f94144',
                                                marginLeft: 5,
                                            }}
                                        >
                                            ({displayStatus})
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
                                    {hasDeadlinePassed && (!entry.availableUntil || hasLateSubmissionPassed) ? (
                                        <View>
                                            {entry.availableUntil ? (
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
                                                            {moment(new Date(entry.deadline)).format('MMM Do, h:mm a')}
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
                                                                {moment(new Date(entry.availableUntil)).format(
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
                                                    {moment(new Date(entry.deadline)).format('MMM Do, h:mm a')}
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
                                                {getTimeRemaining(entry.deadline)}
                                            </Text>
                                            {entry.cueId && remaining ? (
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
                                            ) : null}
                                            {/*  */}
                                            {entry.cueId && remaining ? (
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
                                                        {moment(new Date(entry.initiateAt)).format('MMM Do')}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(entry.deadline)).format('MMM Do, h:mm a')}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    ) : entry.availableUntil && !hasLateSubmissionPassed ? (
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
                                                Late submission available. {getTimeRemaining(entry.availableUntil)}
                                            </Text>
                                            {entry.cueId && remaining ? (
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
                                            ) : null}
                                            {/*  */}
                                            {entry.cueId && remaining ? (
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
                                                        {moment(new Date(entry.deadline)).format('MMM Do')}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        {moment(new Date(entry.availableUntil)).format(
                                                            'MMM Do, h:mm a'
                                                        )}
                                                    </Text>
                                                </View>
                                            ) : null}
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
                <View>
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 50,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontFamily: 'Inter',
                            }}
                        >
                            Overview
                        </Text>
                        {renderSwitchGradebookViewpoints()}
                    </View>

                    {renderPerformanceOverview()}
                </View>
                <View>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 100,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 16,
                                fontFamily: 'Inter',
                            }}
                        >
                            Scores
                        </Text>
                    </View>

                    {renderScoresTableStudent()}
                </View>
            </View>
        );
    };

    const modifyReleaseSubmission = useCallback(
        async (entryId: string, entryType: string, releaseSubmission: boolean, deadlinePassed: boolean) => {
            async function updateReleaseSubmission() {
                setIsFetchingAssignmentAnalytics(true);

                server
                    .mutate({
                        mutation: handleReleaseSubmission,
                        variables: {
                            entryId,
                            gradebookEntry: entryType !== 'cue',
                            releaseSubmission,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.gradebook.handleReleaseSubmission) {
                            Alert(
                                releaseSubmission
                                    ? 'Grades are now visible to students.'
                                    : 'Grades are now hidden from students.'
                            );
                            fetchGradebookInstructor();
                            fetchCourseAssignmentsAnalytics();
                        } else {
                            Alert('Failed to modify status. Try again.');
                        }
                        setIsFetchingAssignmentAnalytics(false);
                    })
                    .catch((e) => {
                        Alert('Failed to modify status. Try again.');
                        setIsFetchingAssignmentAnalytics(false);
                    });
            }

            if (!deadlinePassed && releaseSubmission) {
                Alert('Deadline has not passed.', 'Would you still like to make scores visible?', [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            return;
                        },
                    },
                    {
                        text: 'Yes',
                        onPress: async () => {
                            updateReleaseSubmission();
                        },
                    },
                ]);
            } else {
                updateReleaseSubmission();
            }
        },
        []
    );

    const renderAssignmentAnalytics = () => {
        if (isFetchingAssignmentAnalytics) {
            return (
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
            );
        }

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
                y: gradebookViewPoints ? user.pointsScored : user.score,
            };
        });

        const bottomPerformersData = selectedAssignment.bottomPerformers.map((user: any) => {
            return {
                x: user.fullName,
                y: gradebookViewPoints ? user.pointsScored : user.score,
            };
        });

        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 25,
                        alignItems: 'center',
                        justifyContent: 'space-between',
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
                            alignItems: 'center',
                            paddingTop: 20,
                        }}
                    >
                        <Switch
                            value={selectedAssignment.releaseSubmission}
                            onValueChange={() => {
                                modifyReleaseSubmission(
                                    assignmentAnalyticsSelected,
                                    selectedAssignment.cueId ? 'cue' : 'gradebook',
                                    !selectedAssignment.releaseSubmission,
                                    new Date(selectedAssignment.deadline) < new Date()
                                );
                            }}
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
                            Scores visible to students
                        </Text>
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
                                    textAlign: 'center',
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
                                    Grade Weight
                                </Text>

                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 20,
                                        paddingTop: 7,
                                        textAlign: 'center',
                                    }}
                                >
                                    {selectedAssignment.gradeWeight + '%'}
                                </Text>
                            </View>
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
                                    Standard Deviation
                                </Text>
                                <Text
                                    style={{
                                        fontFamily: 'Inter',
                                        fontSize: 20,
                                        paddingTop: 7,
                                        textAlign: 'center',
                                    }}
                                >
                                    {gradebookViewPoints ? selectedAssignment.stdPts : selectedAssignment.std + '%'}
                                </Text>
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
                                Mean
                            </Text>

                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingBottom: 5,
                                }}
                            >
                                {gradebookViewPoints ? selectedAssignment.meanPts : selectedAssignment.mean + '%'}
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
                                {gradebookViewPoints ? selectedAssignment.maxPts : selectedAssignment.max + '%'}
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
                                Median
                            </Text>
                            <Text
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: 20,
                                    paddingTop: 7,
                                }}
                            >
                                {gradebookViewPoints ? selectedAssignment.medianPts : selectedAssignment.median + '%'}
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
                                {gradebookViewPoints ? selectedAssignment.minPts : selectedAssignment.min + '%'}
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
                                    labels={({ datum }) => {
                                        return datum.y + (gradebookViewPoints ? '' : '%');
                                    }}
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
                                    labels={({ datum }) => {
                                        return datum.y + (gradebookViewPoints ? '' : '%');
                                    }}
                                />
                            </VictoryChart>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderStandardScale = () => {
        if (!standardsBasedScale) return null;

        return (
            <View
                style={{
                    marginTop: 30,
                    flexDirection: 'column',
                    borderWidth: 1,
                    borderColor: '#ccc',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            width: '30%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Mastery
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '50%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Description
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '20%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Points
                        </Text>
                    </View>
                </View>
                {standardsBasedScale.range.map((level: any) => {
                    return (
                        <View
                            style={{
                                flexDirection: 'row',
                                marginVertical: 12,
                            }}
                        >
                            <View
                                style={{
                                    width: '30%',
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                    maxHeight: 60,
                                    overflow: 'scroll',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {level.name}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '50%',
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                    maxHeight: 60,
                                    overflow: 'scroll',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                    }}
                                >
                                    {level.description}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '20%',
                                    paddingHorizontal: 12,
                                    paddingVertical: 16,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {level.points}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderCourseGradingScale = () => {
        if (!courseGradingScale) return;

        return (
            <View
                style={{
                    marginTop: 30,
                    flexDirection: 'column',
                    borderWidth: 1,
                    borderColor: '#ccc',
                    width: '50%',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: '#f8f8f8',
                    }}
                >
                    <View
                        style={{
                            width: '33%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            Grade
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            From
                        </Text>
                    </View>
                    <View
                        style={{
                            width: '33%',
                            backgroundColor: '#f8f8f8',
                            paddingHorizontal: 12,
                            paddingVertical: 16,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'Inter',
                                textAlign: 'center',
                            }}
                        >
                            To
                        </Text>
                    </View>
                </View>
                {courseGradingScale.range.map((level: any) => {
                    return (
                        <View
                            style={{
                                flexDirection: 'row',
                                paddingVertical: 15,
                                borderBottomColor: '#f8f8f8',
                                borderBottomWidth: 1,
                            }}
                        >
                            <View
                                style={{
                                    width: '33%',
                                    paddingHorizontal: 12,
                                    maxHeight: 60,
                                    overflow: 'scroll',
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    {level.name}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '33%',
                                    paddingHorizontal: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                    }}
                                >
                                    {level.start}
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: '33%',
                                    paddingHorizontal: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        textAlign: 'center',
                                        fontSize: 14,
                                    }}
                                >
                                    {level.end === 100 ? '100' : '<' + level.end}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderStandardAnalytics = () => {
        // Line Chart

        let data;

        let xTickValues;

        let yTickValues;

        if (standardsAnalytics) {
            data = standardsAnalytics.scores.map((score: any) => {
                return {
                    x: score.createdAt,
                    y: score.points,
                    // label: masteryMap[score.points.toString()] + ` (${score.points.toString()})`,
                };
            });

            xTickValues = standardsAnalytics.scores.map((score: any) => {
                return score.createdAt;
            });

            yTickValues = standardsBasedScale.range.map((scale: any) => {
                return scale.points;
            });
        }

        return (
            <View>
                <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 25,
                        alignItems: 'center',
                    }}
                >
                    {props.isOwner ? (
                        <label style={{ width: '100%', maxWidth: 250 }}>
                            <Select
                                themeVariant="light"
                                selectMultiple={false}
                                group={true}
                                groupLabel="&nbsp;"
                                inputClass="mobiscrollCustomMultiInput"
                                placeholder="Select..."
                                touchUi={true}
                                value={standardAnalyticsSelectedUser}
                                data={standardsAnalyticsUsersDropdownOptions}
                                onChange={(val: any) => {
                                    setStandardAnalyticsSelectedUser(val.value);
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
                    ) : null}

                    <label style={{ width: '100%', maxWidth: 250, marginLeft: props.isOwner ? 25 : 0 }}>
                        <Select
                            themeVariant="light"
                            selectMultiple={false}
                            group={true}
                            groupLabel="&nbsp;"
                            inputClass="mobiscrollCustomMultiInput"
                            placeholder="Select..."
                            touchUi={true}
                            value={standardAnalyticsSelected}
                            data={standardsAnalyticsDropdownOptions}
                            onChange={(val: any) => {
                                setStandardAnalyticsSelected(val.value);
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
                {!standardsAnalytics ? (
                    <View
                        style={{
                            marginTop: 100,
                        }}
                    >
                        <Text style={{ fontSize: 14, fontFamily: 'Inter' }}>Mastery not Assigned</Text>
                    </View>
                ) : (
                    <View
                        style={{
                            marginTop: 25,
                            flexDirection: 'row',
                        }}
                    >
                        {data.length > 1 ? (
                            <View
                                style={{
                                    width: '50%',
                                }}
                            >
                                <VictoryChart
                                    //   theme={VictoryTheme.material}
                                    containerComponent={
                                        <VictoryVoronoiContainer
                                            labels={(d) => {
                                                console.log('D', d);
                                                // return '(x=' + d.x + ';y=' + d.y + ')';
                                                return masteryMap[d.datum.y.toString()];
                                            }}
                                        />
                                    }
                                >
                                    <VictoryAxis
                                        tickValues={xTickValues}
                                        tickFormat={(t) => moment(new Date(parseInt(t))).format('MMM Do, YY')}
                                        //   tickFormat={t => new Date(t).getHours()}
                                    />
                                    <VictoryAxis dependentAxis tickValues={yTickValues} />
                                    <VictoryLine
                                        // style={{
                                        //     data: { stroke: '#c43a31' },
                                        //     parent: { border: '1px solid #ccc' },
                                        // }}
                                        data={data}
                                    />
                                </VictoryChart>
                            </View>
                        ) : null}
                        <View
                            style={{
                                width: '50%',
                                paddingLeft: data.length > 1 ? 50 : 0,
                            }}
                        >
                            <View
                                style={{
                                    width: '100%',
                                    padding: 20,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                }}
                            >
                                <View style={{}}>
                                    <Text
                                        style={{
                                            fontFamily: 'Inter',
                                            fontSize: 16,
                                        }}
                                    >
                                        {standardsAnalytics.masteryPoints
                                            ? masteryMap[standardsAnalytics.masteryPoints.toString()]
                                            : 'Not Assigned'}
                                        {standardsAnalytics.overridden}
                                    </Text>
                                </View>
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 18,
                                            fontFamily: 'Inter',
                                            color: masteryColors[standardsAnalytics.masteryPoints.toString()],
                                        }}
                                    >
                                        {standardsAnalytics.total}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={{
                                    marginTop: 30,
                                    flexDirection: 'column',
                                    borderWidth: 1,
                                    borderColor: '#ccc',
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        backgroundColor: '#f8f8f8',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: props.isOwner ? '40%' : '50%',
                                            backgroundColor: '#f8f8f8',
                                            paddingHorizontal: 12,
                                            paddingVertical: 16,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Date
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            width: props.isOwner ? '40%' : '50%',
                                            backgroundColor: '#f8f8f8',
                                            paddingHorizontal: 12,
                                            paddingVertical: 16,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Mastery
                                        </Text>
                                    </View>
                                    {props.isOwner ? (
                                        <View
                                            style={{
                                                width: '20%',
                                                backgroundColor: '#f8f8f8',
                                                paddingHorizontal: 12,
                                                paddingVertical: 16,
                                            }}
                                        ></View>
                                    ) : null}
                                </View>
                                {standardsAnalytics.scores.map((score: any) => {
                                    return (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: props.isOwner ? '40%' : '50%',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 16,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        fontFamily: 'Inter',
                                                    }}
                                                >
                                                    {moment(new Date(parseInt(score.createdAt))).format('MMM Do, YY')}
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    width: props.isOwner ? '40%' : '50%',
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 16,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                    }}
                                                >
                                                    {masteryMap[score.points.toString()]}
                                                </Text>
                                            </View>
                                            {props.isOwner ? (
                                                <View
                                                    style={{
                                                        width: '20%',
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 16,
                                                    }}
                                                >
                                                    <Ionicons name="trash-outline" size={18} />
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderStudentAnalytics = () => {
        if (isFetchingStudentAnalytics) {
            return (
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
            );
        }

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

        studentAnalytics.scores.map((score: any) => {
            const id = score.cueId ? score.cueId : score.gradebookEntryId;

            const findAssignment = assignmentAnalytics.find((x: any) => x.cueId === id || x.gradebookEntryId === id);

            if (!findAssignment) return;

            avgScoreData.push({
                title: findAssignment.title,
                avgScore: gradebookViewPoints ? findAssignment.meanPts : findAssignment.mean + '%',
                studentScore: gradebookViewPoints ? score.pointsScored : score.score + '%',
            });
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
                                                const color = datum.y > 30 ? '#0450b4' : 'red';
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
                                    style={{ labels: { fill: 'black', fontSize: 20 }, parent: { overflow: 'visible' } }}
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
                                    labelComponent={<VictoryLabel renderInPortal />}
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

                            <View
                                style={{
                                    marginTop: 20,
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    maxHeight: 350,
                                    overflow: 'scroll',
                                }}
                            >
                                <table className="courseAvgTable">
                                    <thead>
                                        <tr>
                                            <th>
                                                <View
                                                    style={{
                                                        padding: 3,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'inter',
                                                            marginBottom: 5,
                                                            width: '100%',
                                                        }}
                                                    >
                                                        Assignment
                                                    </Text>
                                                </View>
                                            </th>

                                            <th>
                                                <View
                                                    style={{
                                                        padding: 3,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'inter',
                                                            marginBottom: 5,
                                                            width: '100%',
                                                        }}
                                                    >
                                                        Course Average
                                                    </Text>
                                                </View>
                                            </th>

                                            <th>
                                                <View
                                                    style={{
                                                        padding: 3,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 14,
                                                            color: '#000000',
                                                            fontFamily: 'inter',
                                                            marginBottom: 5,
                                                            width: '100%',
                                                        }}
                                                    >
                                                        Student Score
                                                    </Text>
                                                </View>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {avgScoreData.map((data: any) => {
                                            return (
                                                <tr>
                                                    <td>
                                                        <View
                                                            style={{
                                                                padding: 3,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    textAlign: 'center',
                                                                    fontSize: 14,
                                                                    color: '#000000',
                                                                    fontFamily: 'Inter',
                                                                    marginBottom: 5,
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                {data.title}
                                                            </Text>
                                                        </View>
                                                    </td>
                                                    <td>
                                                        <View
                                                            style={{
                                                                padding: 3,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    textAlign: 'center',
                                                                    fontSize: 14,
                                                                    color: '#000000',
                                                                    fontFamily: 'overpass',
                                                                    marginBottom: 5,
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                {data.avgScore}
                                                            </Text>
                                                        </View>
                                                    </td>
                                                    <td>
                                                        <View
                                                            style={{
                                                                padding: 3,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    textAlign: 'center',
                                                                    fontSize: 14,
                                                                    color: '#000000',
                                                                    fontFamily: 'overpass',
                                                                    marginBottom: 5,
                                                                    width: '100%',
                                                                }}
                                                            >
                                                                {data.studentScore}
                                                            </Text>
                                                        </View>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderStandardsStudentView = () => {
        return (
            <View
                style={{
                    width: '100%',
                    position: 'relative',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: '100%',
                        position: 'sticky',
                        top: 0,
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
                                if (sortByOptionStandard !== 'Standard') {
                                    setSortByOptionStandard('Standard');
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
                                Standard
                            </Text>
                            {sortByOptionStandard === 'Standard' ? (
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
                                    if (sortByOptionStandard !== 'Category') {
                                        setSortByOptionStandard('Category');
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
                                    Category
                                </Text>
                                {sortByOptionStandard === 'Category' ? (
                                    <Ionicons
                                        name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                        size={16}
                                        color={'#1f1f1f'}
                                    />
                                ) : null}
                            </TouchableOpacity>
                        </View>
                    )}
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
                                    if (sortByOptionStandard !== 'Description') {
                                        setSortByOptionStandard('Description');
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
                                    Description
                                </Text>
                                {sortByOptionStandard === 'Description' ? (
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
                                if (sortByOptionStandard !== 'Mastery') {
                                    setSortByOptionStandard('Mastery');
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
                                Points
                            </Text>
                            {sortByOptionStandard === 'Mastery' ? (
                                <Ionicons
                                    name={sortByOrder ? 'caret-up-outline' : 'caret-down-outline'}
                                    size={16}
                                    color={'#1f1f1f'}
                                />
                            ) : null}
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Table */}
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
                    {standardsGradebookEntriesStudent.map((entry: any, ind: number) => {
                        if (!masteryPercentageMap || !masteryColors) return null;

                        let percentage;
                        let color;

                        if (entry.masteryPoints) {
                            percentage = masteryPercentageMap[entry.masteryPoints.toString()];
                            color = masteryColors[entry.masteryPoints.toString()];
                        }

                        return (
                            <View
                                key={ind.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomLeftRadius: ind === standardsGradebookEntriesStudent.length - 1 ? 8 : 0,
                                    borderBottomRightRadius:
                                        ind === standardsGradebookEntriesStudent.length - 1 ? 8 : 0,
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
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontFamily: 'Inter',
                                            fontSize: 14,
                                        }}
                                    >
                                        {entry.title}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                        }}
                                    >
                                        {entry.category ? entry.category : 'None'}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 0,
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 14,
                                        }}
                                    >
                                        {entry.description}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: '25%',
                                        padding: Dimensions.get('window').width < 768 ? 7 : 15,
                                        paddingHorizontal: Dimensions.get('window').width < 768 ? 7 : 15,
                                        flexDirection: 'column',
                                    }}
                                >
                                    {entry.masteryPoints ? (
                                        <View style={{ flexDirection: 'column' }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 7,
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
                                                            color: '#1f1f1f',
                                                            fontSize: 14,
                                                            // fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        {masteryMap[entry.masteryPoints.toString()]}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text
                                                        style={{
                                                            color,
                                                            fontSize: 16,
                                                            fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        {entry.points}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View>
                                                <ProgressBar
                                                    maxCompleted={100}
                                                    completed={percentage}
                                                    bgColor={color}
                                                    isLabelVisible={false}
                                                    height={'5px'}
                                                />
                                            </View>
                                        </View>
                                    ) : (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#1f1f1f',
                                                    fontSize: 14,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                Not Assigned
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    const renderStandardsInstructorView = () => {
        return (
            <table className="standardsTable">
                {/* Header  */}
                <thead>
                    <tr>
                        {/* First cell will contain search bar */}
                        <th rowSpan={2}>
                            <TextInput
                                value={studentSearchStandard}
                                onChangeText={(val: string) => setStudentSearchStandard(val)}
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
                        {Object.keys(standardsGradebookCategories).map((category: string) => {
                            return (
                                <th
                                    style={{
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                    }}
                                    colSpan={standardsGradebookCategories[category]}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',

                                            marginTop: 5,
                                            marginBottom: 5,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                                paddingRight: 8,
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {category ? category : 'None'}
                                        </Text>
                                    </View>
                                </th>
                            );
                        })}
                    </tr>
                    <tr>
                        {/* All stanedards */}
                        {standardsGradebookEntries.map((entry: any, col: number) => {
                            return (
                                <th
                                    onClick={() => {
                                        // handleEditGradebookEntry(entry.gradebookEntryId);
                                        handleEditStandardEntry(entry._id);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                fontSize: 14,
                                                color: '#000000',
                                                fontFamily: 'inter',
                                                paddingRight: 8,

                                                // marginBottom: 5,
                                                // textAlignVertical: 'center',
                                            }}
                                            ellipsizeMode="tail"
                                        >
                                            {entry.title}
                                        </Text>
                                        <Ionicons
                                            name={'create-outline'}
                                            size={15}
                                            color="#1f1f1f"
                                            style={{
                                                fontFamily: 'Inter',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    </View>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                {/* Footer */}
                <tfoot>
                    <tr>
                        <th></th>
                        {/* All stanedards */}
                        {standardsGradebookEntries.map((entry: any, col: number) => {
                            const pointsTally: any = {};

                            entry.scores.map((score: any) => {
                                if (score.masteryPoints) {
                                    if (pointsTally[score.masteryPoints.toString()]) {
                                        pointsTally[score.masteryPoints.toString()] += 1;
                                    } else {
                                        pointsTally[score.masteryPoints.toString()] = 1;
                                    }
                                } else {
                                    if (pointsTally['']) {
                                        pointsTally[''] += 1;
                                    } else {
                                        pointsTally[''] = 1;
                                    }
                                }
                            });

                            const colorScale: string[] = [];

                            Object.keys(pointsTally).map((masteryPoints: string) => {
                                colorScale.push(masteryColors[masteryPoints]);
                            });

                            return (
                                <th>
                                    <VictoryStack width={250} height={70} horizontal={true} colorScale={colorScale}>
                                        {Object.keys(pointsTally).map((masteryPoints: string) => {
                                            return (
                                                <VictoryBar
                                                    barWidth={20}
                                                    data={[
                                                        {
                                                            x: 'a',
                                                            y: pointsTally[masteryPoints],
                                                            label:
                                                                masteryMap[masteryPoints] +
                                                                ' : ' +
                                                                pointsTally[masteryPoints],
                                                        },
                                                    ]}
                                                    labelComponent={
                                                        <VictoryTooltip
                                                            orientation={'top'}
                                                            horizontal={true}
                                                            flyoutPadding={14}
                                                            style={{
                                                                fontFamily: 'Inter',
                                                            }}
                                                        />
                                                    }
                                                />
                                            );
                                        })}
                                    </VictoryStack>
                                </th>
                            );
                        })}
                    </tr>
                </tfoot>

                {/* Entries */}
                <tbody>
                    {instructorStandardsGradebook.users.length === 0 ? (
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
                    {standardsGradebookUsers.map((user: any, row: number) => {
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
                                {standardsGradebookEntries.map((entry: any, col: number) => {
                                    const userScore = entry.scores.find((x: any) => x.userId === user.userId);

                                    if (userScore.points && masteryPercentageMap) {
                                        const percentage = masteryPercentageMap[userScore.masteryPoints.toString()];
                                        const color = masteryColors[userScore.masteryPoints.toString()];

                                        return (
                                            <td
                                                key={col.toString()}
                                                style={{
                                                    borderBottom: '1px solid #f2f2f2',
                                                    borderRight: '1px solid #f2f2f2',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        paddingHorizontal: 15,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {/* Left hand side */}
                                                    <View style={{ flex: 1, flexDirection: 'column' }}>
                                                        <View
                                                            style={{
                                                                flexDirection: 'row',
                                                                justifyContent: 'space-between',
                                                                marginBottom: 7,
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
                                                                        color: '#1f1f1f',
                                                                        fontSize: 14,
                                                                        // fontFamily: 'Inter',
                                                                    }}
                                                                >
                                                                    {masteryMap[userScore.masteryPoints.toString()]}
                                                                    {userScore.overridden ? '*' : ''}
                                                                </Text>
                                                            </View>
                                                            <View>
                                                                <Text
                                                                    style={{
                                                                        color,
                                                                        fontSize: 16,
                                                                        fontFamily: 'Inter',
                                                                    }}
                                                                >
                                                                    {userScore.points}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View>
                                                            <ProgressBar
                                                                maxCompleted={100}
                                                                completed={percentage}
                                                                bgColor={color}
                                                                isLabelVisible={false}
                                                                height={'5px'}
                                                            />
                                                        </View>
                                                    </View>
                                                    {/* Right hand side */}
                                                    <View>
                                                        <TouchableOpacity
                                                            style={{
                                                                padding: 7,
                                                                backgroundColor: '#fff',
                                                                marginLeft: 15,
                                                            }}
                                                            onPress={() => {
                                                                setStandardModifyEntry(entry);
                                                                setStandardUserScore({
                                                                    ...userScore,
                                                                    fullName: user.fullName,
                                                                });
                                                            }}
                                                        >
                                                            <Ionicons name="create-outline" size={13} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </td>
                                        );
                                    } else {
                                        return (
                                            <td
                                                key={col.toString()}
                                                style={{
                                                    borderBottom: '1px solid #f2f2f2',
                                                    borderRight: '1px solid #f2f2f2',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#1f1f1f',
                                                            fontSize: 14,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        Not Assigned
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={{
                                                            paddingLeft: 8,
                                                        }}
                                                        onPress={() => {
                                                            setStandardModifyEntry(entry);
                                                            setStandardUserScore({
                                                                ...userScore,
                                                                fullName: user.fullName,
                                                            });
                                                        }}
                                                    >
                                                        <Ionicons name="create-outline" size={12} />
                                                    </TouchableOpacity>
                                                </View>
                                            </td>
                                        );
                                    }
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    const renderInstructorView = () => {
        return (
            <table className="gradebookTable">
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
                                <th>
                                    <View
                                        style={{
                                            flexDirection: 'column',
                                            width: '100%',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: '100%',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'inter',
                                                    paddingVertical: 4,
                                                    flex: 1,
                                                }}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {entry.title}
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 12,
                                                    color: '#000000',
                                                    marginRight: 5,
                                                }}
                                            >
                                                {new Date(entry.deadline).toString().split(' ')[1] +
                                                    ' ' +
                                                    new Date(entry.deadline).toString().split(' ')[2]}{' '}
                                            </Text>
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 12,
                                                    color: '#000000',
                                                    marginRight: 5,
                                                }}
                                            >
                                                {'•'}
                                            </Text>

                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    fontSize: 12,
                                                    color: '#000000',
                                                }}
                                            >
                                                {entry.gradeWeight}
                                                {'%'}
                                            </Text>
                                        </View>
                                        {/* <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginTop: 3,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    marginRight: 5,
                                                }}
                                            >
                                                <Ionicons
                                                    name={entry.cueId ? 'open-outline' : 'create-outline'}
                                                    size={15}
                                                    color="#1f1f1f"
                                                />
                                            </View>

                                            {entry.releaseSubmission ? (
                                                <Tooltip
                                                    // backgroundColor={'#f8f8f8'}
                                                    popover={
                                                        <Text
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        >
                                                            Visible to students
                                                        </Text>
                                                    }
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Ionicons name={'eye-outline'} size={15} color="#1f1f1f" />
                                                    </Text>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip
                                                    // backgroundColor={'#f8f8f8'}
                                                    popover={
                                                        <Text
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        >
                                                            Hidden from students
                                                        </Text>
                                                    }
                                                >
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Ionicons name={'eye-off-outline'} size={15} color="#1f1f1f" />
                                                    </Text>
                                                </Tooltip>
                                            )}
                                        </View> */}
                                    </View>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                {/* Footer */}
                <tfoot>
                    <tr>
                        {/* First cell will contain search bar */}
                        <th></th>
                        {/* Total column */}
                        <th></th>
                        {/* All assignments */}
                        {gradebookEntries.map((entry: any, col: number) => {
                            return (
                                <th
                                // onClick={() => {
                                //     if (entry.cueId) {
                                //         props.openCueFromGrades(
                                //             props.channelId,
                                //             entry.cueId,
                                //             props.channelCreatedBy
                                //         );
                                //     } else {
                                //         handleEditGradebookEntry(entry.gradebookEntryId);
                                //     }
                                // }}
                                // style={{
                                //     cursor: 'pointer',
                                // }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (entry.cueId) {
                                                    props.openCueFromGrades(
                                                        props.channelId,
                                                        entry.cueId,
                                                        props.channelCreatedBy
                                                    );
                                                } else {
                                                    handleEditGradebookEntry(entry.gradebookEntryId);
                                                }
                                            }}
                                            style={{
                                                // backgroundColor: '#fff',
                                                borderRadius: 12,
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                            }}
                                        >
                                            <Ionicons
                                                name={entry.cueId ? 'open-outline' : 'create-outline'}
                                                size={12}
                                                color="#000"
                                            />
                                            <Text
                                                style={{
                                                    marginLeft: 5,
                                                    color: '#000',
                                                    fontSize: 12,
                                                }}
                                            >
                                                Open
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => {
                                                modifyReleaseSubmission(
                                                    entry.cueId ? entry.cueId : entry.gradebookEntryId,
                                                    entry.cueId ? 'cue' : 'gradebook',
                                                    !entry.releaseSubmission,
                                                    new Date(entry.deadline) < new Date()
                                                );
                                            }}
                                            style={{
                                                borderRadius: 12,
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                marginLeft: 10,
                                            }}
                                        >
                                            <Ionicons
                                                name={!entry.releaseSubmission ? 'eye-outline' : 'eye-off-outline'}
                                                size={12}
                                                color="#000"
                                            />
                                            <Text
                                                style={{
                                                    marginLeft: 5,
                                                    color: '#000',
                                                    fontSize: 12,
                                                }}
                                            >
                                                {entry.releaseSubmission ? 'Hide' : 'Share'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </th>
                            );
                        })}
                    </tr>
                </tfoot>
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
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
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
                                                ? userTotals.pointsScored
                                                      .toFixed(2)
                                                      .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1') +
                                                  ' / ' +
                                                  userTotals.totalPointsPossible
                                                : userTotals.score
                                                      .toFixed(2)
                                                      .replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1') + '%'}
                                        </Text>
                                        <Text
                                            style={{
                                                marginLeft: 5,
                                            }}
                                        >
                                            {userTotals.gradingScaleOutcome
                                                ? '(' + userTotals.gradingScaleOutcome + ')'
                                                : null}
                                        </Text>
                                    </View>
                                </td>
                                {/* Other scores */}
                                {gradebookEntries.map((entry: any, col: number) => {
                                    const userScore = entry.scores.find((x: any) => x.userId === user.userId);

                                    console.log('User Score', userScore);

                                    const displayStatus =
                                        !userScore.submitted &&
                                        userScore.score !== undefined &&
                                        userScore.score !== null
                                            ? 'Missing'
                                            : userScore.submitted && userScore.lateSubmission
                                            ? 'Late'
                                            : undefined;

                                    if (
                                        (activeModifyId === entry.cueId || activeModifyId === entry.gradebookEntryId) &&
                                        activeUserId === user.userId
                                    ) {
                                        return (
                                            <td key={col.toString()}>
                                                <View
                                                    style={{
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 11,
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        Points out of {entry.totalPoints}
                                                    </Text>

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
                                                            placeholder={` / ${entry.totalPoints}`}
                                                            onChangeText={(val) => {
                                                                setActiveScore(val);
                                                            }}
                                                            keyboardType="numeric"
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
                                                                handleUpdateAssignmentScore(entry.totalPoints);
                                                            }}
                                                            disabled={user.email === disableEmailId}
                                                        >
                                                            <Ionicons
                                                                name="checkmark-circle-outline"
                                                                size={20}
                                                                style={{ marginRight: 5 }}
                                                                color={'#8bc34a'}
                                                            />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setActiveModifyId('');
                                                                setActiveModifyEntryType('');
                                                                setActiveUserId('');
                                                                setActiveScore('');
                                                            }}
                                                        >
                                                            <Ionicons
                                                                name="close-circle-outline"
                                                                size={20}
                                                                color={'#f94144'}
                                                            />
                                                        </TouchableOpacity>
                                                    </View>
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
                                                disabled={!userScore}
                                                onPress={() => {
                                                    setActiveModifyId(
                                                        entry.cueId ? entry.cueId : entry.gradebookEntryId
                                                    );
                                                    setActiveModifyEntryType(entry.cueId ? 'cue' : 'gradebook');
                                                    setActiveUserId(user.userId);
                                                    setActiveScore(
                                                        userScore && userScore.pointsScored
                                                            ? userScore.pointsScored.toString()
                                                            : ''
                                                    );
                                                }}
                                            >
                                                {!userScore || !userScore.submitted || !userScore.graded ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color: '#f94144',
                                                        }}
                                                    >
                                                        {!userScore
                                                            ? 'N/A'
                                                            : userScore.score !== undefined && userScore.score !== null
                                                            ? gradebookViewPoints
                                                                ? userScore.pointsScored
                                                                : userScore.score + '%'
                                                            : 'Not Submitted'}
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

                                                {displayStatus ? (
                                                    <Text
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 11,
                                                            color: displayStatus === 'Late' ? '#f3722c' : '#f94144',
                                                            marginTop: 5,
                                                            borderWidth: 0,
                                                            borderRadius: 10,
                                                            alignSelf: 'center',
                                                        }}
                                                    >
                                                        ({displayStatus})
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
                        {editEntryId ? 'Edit' : 'New '} Gradebook Entry
                    </Text>

                    {standardsBasedScale && !editEntryId ? (
                        <View
                            style={{
                                width: '100%',
                                marginTop: 20,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#000000',
                                }}
                            >
                                Entry type
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 15,
                                    marginBottom: 30,
                                }}
                            >
                                {newEntryTabs.map((tab: any, ind: number) => {
                                    return (
                                        <TouchableOpacity
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginRight: 20,
                                            }}
                                            onPress={() => setGradebookEntryType(tab.value)}
                                        >
                                            <RadioButton selected={gradebookEntryType === tab.value} />
                                            <Text
                                                style={{
                                                    marginLeft: 10,
                                                }}
                                            >
                                                {tab.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ) : null}

                    {gradebookEntryType === 'assignment' ? (
                        <View
                            style={{
                                width: '100%',
                            }}
                        >
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
                                                                            updatePointsScored[
                                                                                studentIdx
                                                                            ].lateSubmission = false;

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

                                                                                updatePointsScored[studentIdx].points =
                                                                                    val;

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
                                                                                    const roundOffDate =
                                                                                        roundSeconds(date);

                                                                                    const updatePointsScored = [
                                                                                        ...newAssignmentPointsScored,
                                                                                    ];

                                                                                    updatePointsScored[
                                                                                        studentIdx
                                                                                    ].submittedAt = roundOffDate;

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

                                                                                updatePointsScored[
                                                                                    studentIdx
                                                                                ].lateSubmission =
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

                                                                                updatePointsScored[
                                                                                    studentIdx
                                                                                ].feedback = val;

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
                                                onValueChange={() =>
                                                    setNewAssignmentShareWithAll(!newAssignmentShareWithAll)
                                                }
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
                        </View>
                    ) : gradebookEntryType === 'standards' && !editEntryId ? (
                        <View
                            style={{
                                width: '100%',
                            }}
                        >
                            <View style={{ width: '100%' }}>
                                {/* Lists of standards */}
                                <View
                                    style={{
                                        width: '100%',
                                        paddingBottom: 15,
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        New Categories
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        width: '100%',
                                    }}
                                >
                                    <ReactTagInput
                                        tags={newCategories}
                                        placeholder=""
                                        removeOnBackspace={true}
                                        onChange={(newTags: string[]) => setNewCategories(newTags)}
                                    />
                                </View>
                            </View>

                            <View style={{ width: '100%', marginTop: 25 }}>
                                <View
                                    style={{
                                        width: '100%',
                                        paddingBottom: 15,
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Standards
                                    </Text>
                                </View>
                                {/*  */}
                                <View
                                    style={{
                                        flexDirection: 'column',
                                    }}
                                >
                                    {newStandards.map((standard: any, ind: number) => {
                                        return (
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingVertical: 20,
                                                    borderBottomColor: '#f2f2f2',
                                                    borderBottomWidth: 1,
                                                }}
                                            >
                                                {/* Number */}
                                                <Text
                                                    style={{
                                                        fontSize: 21,
                                                        fontFamily: 'Inter',
                                                    }}
                                                >
                                                    {ind + 1}.
                                                </Text>
                                                {/* Title */}
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        flex: 1,
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '40%',
                                                            paddingLeft: 20,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                marginBottom: 10,
                                                            }}
                                                        >
                                                            Title
                                                        </Text>

                                                        <TextInput
                                                            value={standard.points}
                                                            placeholder={''}
                                                            onChangeText={(val) => {
                                                                const updateStandards = [...newStandards];

                                                                updateStandards[ind].title = val;

                                                                setNewStandards(updateStandards);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                marginRight: 5,
                                                                padding: 8,
                                                                borderColor: '#ccc',
                                                                borderWidth: 1,
                                                                fontSize: 14,
                                                                height: 40,
                                                            }}
                                                            placeholderTextColor={'#1F1F1F'}
                                                        />
                                                    </View>
                                                    {/* Description */}
                                                    <View
                                                        style={{
                                                            width: '40%',
                                                            paddingLeft: 20,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                marginBottom: 10,
                                                            }}
                                                        >
                                                            Description
                                                        </Text>
                                                        <TextInput
                                                            value={standard.description}
                                                            placeholder={''}
                                                            onChangeText={(val) => {
                                                                const updateStandards = [...newStandards];

                                                                updateStandards[ind].description = val;

                                                                setNewStandards(updateStandards);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                marginRight: 5,
                                                                padding: 8,
                                                                borderColor: '#ccc',
                                                                borderWidth: 1,
                                                                fontSize: 14,
                                                                minHeight: 40,
                                                            }}
                                                            multiline={true}
                                                            // numberOfLines={2}
                                                            placeholderTextColor={'#1F1F1F'}
                                                        />
                                                    </View>
                                                    {/* Dropdown */}
                                                    <View
                                                        style={{
                                                            width: '20%',
                                                            paddingLeft: 20,
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                marginBottom: 10,
                                                            }}
                                                        >
                                                            Category
                                                        </Text>
                                                        <label style={{ width: '100%', maxWidth: 250 }}>
                                                            <Select
                                                                themeVariant="light"
                                                                selectMultiple={false}
                                                                groupLabel="&nbsp;"
                                                                inputClass="mobiscrollCustomMultiInput"
                                                                placeholder="Select..."
                                                                touchUi={true}
                                                                value={standard.category}
                                                                data={categoryDropdownOptions}
                                                                onChange={(val: any) => {
                                                                    const updateStandards = [...newStandards];

                                                                    updateStandards[ind].category = val.value;

                                                                    setNewStandards(updateStandards);
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
                                                {newStandards.length > 1 ? (
                                                    <TouchableOpacity
                                                        style={{
                                                            paddingLeft: 20,
                                                        }}
                                                        onPress={() => {
                                                            const updateStandards = [...newStandards];
                                                            updateStandards.splice(ind, 1);
                                                            setNewStandards(updateStandards);

                                                            const updateStandardsPointsScored = [
                                                                ...newStandardsPointsScored,
                                                            ];
                                                            updateStandardsPointsScored.splice(ind, 1);
                                                            setNewStandardsPointsScored(updateStandardsPointsScored);

                                                            //
                                                            if (
                                                                Number(assignPointsStandardSelected) <
                                                                updateStandards.length
                                                            ) {
                                                                setAssignPointsStandardSelected('0');
                                                            }
                                                        }}
                                                    >
                                                        <Ionicons name="trash-outline" size={20} color="#000" />
                                                    </TouchableOpacity>
                                                ) : null}
                                            </View>
                                        );
                                    })}

                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            marginTop: 20,
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 15,
                                            }}
                                            onPress={() => {
                                                const updateStandards: any[] = [...newStandards];
                                                updateStandards.push({
                                                    title: '',
                                                    description: '',
                                                    category: '',
                                                });
                                                setNewStandards(updateStandards);

                                                //
                                                const updateStandardsPointsScored = [...newStandardsPointsScored];

                                                const standardsPointsScores = courseStudents.map((student: any) => {
                                                    return {
                                                        _id: student._id,
                                                        fullName: student.fullName,
                                                        avatar: student.avatar,
                                                        points: '',
                                                    };
                                                });

                                                updateStandardsPointsScored.push(standardsPointsScores);

                                                setNewStandardsPointsScored(updateStandardsPointsScored);
                                            }}
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
                                                Add Row
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                            {/*  */}

                            <View style={{ width: '100%', marginTop: 25 }}>
                                <View
                                    style={{
                                        width: '100%',
                                        paddingBottom: 15,
                                        backgroundColor: 'white',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#000000',
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Options
                                    </Text>
                                </View>

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
                                            checked={gradeStudentsStandards}
                                            onChange={(e: any) => {
                                                setGradeStudentsStandards(!gradeStudentsStandards);
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
                                            Grade Students
                                        </Text>
                                        <Text style={{ marginTop: 10 }}>
                                            Check if you wish to assign points for each student before creating
                                            standards
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {gradeStudentsStandards ? (
                                <View
                                    style={{
                                        width: '100%',
                                        marginTop: 20,
                                    }}
                                >
                                    {newStandards.length > 1 ? (
                                        <View style={{}}>
                                            {/*  */}
                                            <label style={{ width: '100%', maxWidth: 250 }}>
                                                <Select
                                                    themeVariant="light"
                                                    selectMultiple={false}
                                                    groupLabel="&nbsp;"
                                                    inputClass="mobiscrollCustomMultiInput"
                                                    placeholder="Select..."
                                                    touchUi={true}
                                                    value={assignPointsStandardSelected}
                                                    data={assignPointsStandardDropdownOptions}
                                                    onChange={(val: any) => {
                                                        setAssignPointsStandardSelected(val.value);
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
                                    ) : null}

                                    <View
                                        style={{
                                            marginTop: 20,
                                            borderColor: '#ccc',
                                            borderWidth: 1,
                                            maxHeight: 500,
                                            overflow: 'scroll',
                                            width: '100%',
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
                                                            Mastery
                                                        </Text>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {newStandardsPointsScored[Number(assignPointsStandardSelected)].map(
                                                    (student: any, studentIdx: number) => {
                                                        return (
                                                            <tr key={studentIdx.toString()}>
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
                                                                        <label style={{ width: '100%', maxWidth: 250 }}>
                                                                            <Select
                                                                                themeVariant="light"
                                                                                selectMultiple={false}
                                                                                groupLabel="&nbsp;"
                                                                                inputClass="mobiscrollCustomMultiInput"
                                                                                placeholder="Select..."
                                                                                touchUi={true}
                                                                                value={student.points}
                                                                                data={masteryDropdownOptions}
                                                                                onChange={(val: any) => {
                                                                                    const updateStandardsPointsScored =
                                                                                        [...newStandardsPointsScored];

                                                                                    updateStandardsPointsScored[
                                                                                        Number(
                                                                                            assignPointsStandardSelected
                                                                                        )
                                                                                    ][studentIdx].points = val.value;

                                                                                    setNewStandardsPointsScored(
                                                                                        updateStandardsPointsScored
                                                                                    );
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
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </View>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <View style={{ width: '100%' }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flex: 1,
                                    width: '100%',
                                }}
                            >
                                <View
                                    style={{
                                        width: '40%',
                                        paddingLeft: 20,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            marginBottom: 10,
                                        }}
                                    >
                                        Title
                                    </Text>

                                    <TextInput
                                        value={editStandardTitle}
                                        placeholder={''}
                                        onChangeText={(val) => {
                                            setEditStandardTitle(val);
                                        }}
                                        style={{
                                            width: '100%',
                                            marginRight: 5,
                                            padding: 8,
                                            borderColor: '#ccc',
                                            borderWidth: 1,
                                            fontSize: 14,
                                            height: 40,
                                        }}
                                        placeholderTextColor={'#1F1F1F'}
                                    />
                                </View>
                                {/* Description */}
                                <View
                                    style={{
                                        width: '40%',
                                        paddingLeft: 20,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            marginBottom: 10,
                                        }}
                                    >
                                        Description
                                    </Text>
                                    <TextInput
                                        value={editStandardDescription}
                                        placeholder={''}
                                        onChangeText={(val) => {
                                            setEditStandardDescription(val);
                                        }}
                                        style={{
                                            width: '100%',
                                            marginRight: 5,
                                            padding: 8,
                                            borderColor: '#ccc',
                                            borderWidth: 1,
                                            fontSize: 14,
                                            minHeight: 40,
                                        }}
                                        multiline={true}
                                        // numberOfLines={2}
                                        placeholderTextColor={'#1F1F1F'}
                                    />
                                </View>
                                {/* Dropdown */}
                                <View
                                    style={{
                                        width: '20%',
                                        paddingLeft: 20,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            marginBottom: 10,
                                        }}
                                    >
                                        Category
                                    </Text>
                                    <label style={{ width: '100%', maxWidth: 250 }}>
                                        <Select
                                            themeVariant="light"
                                            selectMultiple={false}
                                            groupLabel="&nbsp;"
                                            inputClass="mobiscrollCustomMultiInput"
                                            placeholder="Select..."
                                            touchUi={true}
                                            value={editStandardCategory}
                                            data={categoryDropdownOptions}
                                            onChange={(val: any) => {
                                                setEditStandardCategory(val.value);
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
                        </View>
                    )}
                    {/* End */}

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
                                    disabled={isCreatingAssignment || user.email === disableEmailId}
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
                                    disabled={isDeletingAssignment || user.email === disableEmailId}
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
                                disabled={isCreatingAssignment || user.email === disableEmailId}
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

    const renderAssignmentsGradebook = () => {
        return (
            <View>
                {props.isOwner ? (
                    <View
                        style={{
                            flexDirection: 'column',
                            marginBottom: 50,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: 50,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Scores
                            </Text>

                            {standardsBasedScale ? null : renderSwitchGradebookViewpoints()}
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
                        ) : instructorGradebook.entries.length === 0 || instructorGradebook.users.length === 0 ? (
                            <View style={{ backgroundColor: '#fff' }}>
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
                                    {instructorGradebook.entries.length === 0
                                        ? 'No assignments created.'
                                        : 'No users in course.'}
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
                            >
                                {renderInstructorView()}
                            </View>
                        )}

                        {/* Render analytics section */}

                        {assignmentAnalytics && assignmentAnalytics.length > 0 ? (
                            <View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 100,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Assignment Insights
                                    </Text>
                                </View>

                                {/*  */}
                                <View>{renderAssignmentAnalytics()}</View>
                            </View>
                        ) : null}

                        {/* Student Insights */}

                        {studentAnalytics && assignmentAnalytics && assignmentAnalytics.length > 0 ? (
                            <View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 100,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Student Insights
                                    </Text>
                                </View>

                                <View>{renderStudentAnalytics()}</View>
                            </View>
                        ) : null}

                        {courseGradingScale && !isFetchingGradebook && instructorGradebook ? (
                            <View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 100,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Scale
                                    </Text>
                                </View>

                                <View>{renderCourseGradingScale()}</View>
                            </View>
                        ) : null}
                    </View>
                ) : (
                    <View
                        style={{
                            flexDirection: 'column',
                            marginBottom: 50,
                        }}
                    >
                        {isFetchingStudentGradebook ? (
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
                        ) : !studentGradebook ? (
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
                                    Could not fetch student gradebook.
                                </Text>
                            </View>
                        ) : studentGradebook.entries.length === 0 ? (
                            <View style={{ backgroundColor: '#fff' }}>
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
                                    No assignments created.
                                </Text>
                            </View>
                        ) : (
                            <View>{renderStudentView()}</View>
                        )}
                        {courseGradingScale && !isFetchingStudentGradebook && studentGradebook ? (
                            <View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 100,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Scale
                                    </Text>
                                </View>

                                <View>{renderCourseGradingScale()}</View>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        );
    };

    const renderStandardsGradebook = () => {
        return (
            <View>
                {props.isOwner ? (
                    <View
                        style={{
                            flexDirection: 'column',
                            marginBottom: 50,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 50,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 16,
                                    fontFamily: 'Inter',
                                }}
                            >
                                Mastery
                            </Text>
                        </View>
                        {isFetchingStandardsGradebook ? (
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
                        ) : !instructorStandardsGradebook ? (
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
                                    Could not fetch standards gradebook.
                                </Text>
                            </View>
                        ) : instructorStandardsGradebook.entries.length === 0 ||
                          instructorStandardsGradebook.users.length === 0 ? (
                            <View style={{ backgroundColor: '#fff' }}>
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
                                    {instructorStandardsGradebook.entries.length === 0
                                        ? 'No standards created.'
                                        : 'No users in course.'}
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
                            >
                                {renderStandardsInstructorView()}
                            </View>
                        )}

                        <View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 100,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Scale
                                </Text>
                            </View>
                            <View>{renderStandardScale()}</View>
                        </View>

                        {/* Analytics */}
                        {standardAnalyticsSelected && standardAnalyticsSelectedUser ? (
                            <View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 100,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontFamily: 'Inter',
                                        }}
                                    >
                                        Standards Insights
                                    </Text>
                                </View>

                                {isFetchingStandardsAnalytics ? (
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
                                ) : (
                                    <View>{renderStandardAnalytics()}</View>
                                )}
                            </View>
                        ) : null}
                    </View>
                ) : (
                    <View>
                        <View
                            style={{
                                flexDirection: 'column',
                                marginBottom: 50,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 50,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontFamily: 'Inter',
                                    }}
                                >
                                    Mastery
                                </Text>
                            </View>
                            {isFetchingStandardsGradebookStudent ? (
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
                            ) : !studentStandardsGradebook ? (
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
                                        Could not fetch standards gradebook.
                                    </Text>
                                </View>
                            ) : studentStandardsGradebook.entries.length === 0 ? (
                                <View style={{ backgroundColor: '#fff' }}>
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
                                        No standards created.
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
                                >
                                    {renderStandardsStudentView()}
                                </View>
                            )}
                            {standardsBasedScale ? (
                                <View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 100,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Scale
                                        </Text>
                                    </View>
                                    <View>{renderStandardScale()}</View>
                                </View>
                            ) : null}
                            {standardAnalyticsSelected && standardAnalyticsSelectedUser ? (
                                <View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 100,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                fontFamily: 'Inter',
                                            }}
                                        >
                                            Standards Insights
                                        </Text>
                                    </View>

                                    {isFetchingStandardsAnalytics ? (
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
                                    ) : (
                                        <View>{renderStandardAnalytics()}</View>
                                    )}
                                </View>
                            ) : null}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderSwitchGradebookViewpoints = () => {
        return (
            <View
                style={{
                    marginLeft: 'auto',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                {renderExportButton()}
                {selectedGradebookMode === 'assignments' ? (
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
                ) : null}
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
                paddingHorizontal: paddingResponsive(),
            }}
        >
            {standardsBasedScale ? (
                Dimensions.get('window').width < 768 ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            marginTop: 25,
                        }}
                    >
                        {tabs.map((tab: any, ind: number) => {
                            return (
                                <View nativeID={tab.value} key={ind.toString()}>
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: tab.value === selectedGradebookMode ? '#000' : '#f2f2f2',
                                            borderRadius: 20,
                                            paddingHorizontal: 14,
                                            marginRight: 10,
                                            paddingVertical: 7,
                                        }}
                                        onPress={() => {
                                            setSelectedGradebookMode(tab.value);
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: tab.value === selectedGradebookMode ? '#fff' : '#000',
                                                fontSize: 14,
                                            }}
                                        >
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginTop: 25,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            {tabs.map((tab: any, ind: number) => {
                                return (
                                    <View
                                        nativeID={tab.value}
                                        style={{
                                            marginRight: 38,
                                        }}
                                        key={ind.toString()}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                paddingVertical: 3,
                                                backgroundColor: 'none',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                borderBottomColor: '#000',
                                                borderBottomWidth: tab.value === selectedGradebookMode ? 1 : 0,
                                            }}
                                            onPress={() => {
                                                setSelectedGradebookMode(tab.value);
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: '#000',
                                                    fontSize: 14,
                                                    fontFamily:
                                                        tab.value === selectedGradebookMode ? 'inter' : 'overpass',
                                                    textTransform: 'uppercase',
                                                    // paddingLeft: 5,
                                                }}
                                            >
                                                {tab.label}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                        {renderSwitchGradebookViewpoints()}
                    </View>
                )
            ) : null}

            {selectedGradebookMode === 'assignments' ? renderAssignmentsGradebook() : renderStandardsGradebook()}

            {standardModifyEntry && standardUserScore ? (
                <Popup
                    isOpen={true}
                    buttons={
                        standardUserScore.overridden
                            ? [
                                  {
                                      text: 'Update',
                                      color: 'dark',
                                      handler: function (event) {
                                          handleUpdateStandardsScore();
                                      },
                                      disabled: user.email === disableEmailId,
                                  },
                                  {
                                      text: 'Revert override',
                                      color: 'danger',
                                      handler: function (event) {
                                          handleRevertOverride();
                                      },
                                      disabled: user.email === disableEmailId,
                                  },
                                  {
                                      text: 'Cancel',
                                      color: 'dark',
                                      handler: function (event) {
                                          setStandardModifyEntry(undefined);
                                          setStandardUserScore(undefined);
                                      },
                                  },
                              ]
                            : [
                                  {
                                      text: 'Update',
                                      color: 'dark',
                                      handler: function (event) {
                                          // props.onSend(message, customCategory, isPrivate);
                                          handleUpdateStandardsScore();
                                      },
                                      disabled: user.email === disableEmailId,
                                  },
                                  {
                                      text: 'Cancel',
                                      color: 'dark',
                                      handler: function (event) {
                                          setStandardModifyEntry(undefined);
                                          setStandardUserScore(undefined);
                                      },
                                  },
                              ]
                    }
                    theme="ios"
                    themeVariant="light"
                    onClose={() => {
                        setStandardModifyEntry(undefined);
                        setStandardUserScore(undefined);
                    }}
                    responsive={{
                        small: {
                            display: 'bottom',
                        },
                        medium: {
                            // Custom breakpoint
                            display: 'center',
                        },
                    }}
                >
                    <View
                        style={{
                            width: 500,
                            padding: 20,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 18,
                                fontFamily: 'inter',
                                marginBottom: 20,
                            }}
                        >
                            Modify {standardModifyEntry.title} for {standardUserScore.fullName}
                        </Text>
                        {/* Options to update current score or override score completely */}
                        {!standardUserScore.overridden ? (
                            <View
                                style={{
                                    width: '100%',
                                    marginTop: 20,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontFamily: 'inter',
                                        color: '#000000',
                                    }}
                                >
                                    Entry type
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 15,
                                    }}
                                >
                                    {modifyStandardOptions.map((tab: any, ind: number) => {
                                        return (
                                            <TouchableOpacity
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    marginRight: 20,
                                                }}
                                                onPress={() => setModifyStandardOption(tab.value)}
                                            >
                                                <RadioButton selected={modifyStandardOption === tab.value} />
                                                <Text
                                                    style={{
                                                        marginLeft: 10,
                                                    }}
                                                >
                                                    {tab.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        ) : null}
                        <View
                            style={{
                                width: '100%',
                                marginTop: 30,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'inter',
                                    color: '#000000',
                                }}
                            >
                                Mastery
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    marginTop: 15,
                                }}
                            >
                                <label style={{ width: '100%' }}>
                                    <Select
                                        themeVariant="light"
                                        selectMultiple={false}
                                        groupLabel="&nbsp;"
                                        inputClass="mobiscrollCustomMultiInput"
                                        placeholder="Select..."
                                        touchUi={true}
                                        value={selectedModifyStandard}
                                        data={masteryDropdownOptions}
                                        onChange={(val: any) => {
                                            setSelectedModifyStandard(val.value);
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
                    </View>
                </Popup>
            ) : null}
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
