// REACT
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, Dimensions, Image, TextInput as DefaultTextInput } from 'react-native';
import _ from 'lodash';
import { Ionicons } from '@expo/vector-icons';
import XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import moment from 'moment';

// API

import {
    submitGrade,
    getQuiz,
    gradeQuiz,
    editReleaseSubmission,
    updateAnnotation,
    modifyActiveAttemptQuiz,
    getSubmissionAnnotations,
    getUsernamesForAnnotation,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { View, Text, TouchableOpacity } from './Themed';
import Alert from './Alert';
import ReactPlayer from 'react-player';
import alert from './Alert';
import QuizGrading from './QuizGrading';
import WebViewer from '@pdftron/pdfjs-express';
import { htmlStringParser } from '../helpers/HTMLParser';
import parser from 'html-react-parser';
import { Select } from '@mobiscroll/react';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { user } = useAppContext();

    const [filterChoice, setFilterChoice] = useState('All');
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers));
    const [subscribers] = useState<any[]>(unparsedSubs.reverse());
    const categories = ['All', 'Delivered', 'Read'];
    const [showSubmission, setShowSubmission] = useState(false);
    const [submission, setSubmission] = useState<any>('');
    const [pointsScored, setPointsScored] = useState('');
    const [graded, setGraded] = useState(false);
    const [userId, setUserId] = useState('');
    const [subscriberName, setSubscriberName] = useState('');
    const RichText: any = useRef();
    const submissionViewerRef: any = useRef();
    const [comment, setComment] = useState('');
    const [isQuiz, setIsQuiz] = useState(false);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [initiatedAt, setInitiatedAt] = useState<any>({});
    const [imported, setImported] = useState(false);
    const [url, setUrl] = useState('');
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [releaseSubmission, setReleaseSubmission] = useState(false);
    const [isGraded, setIsGraded] = useState(false);
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
    const [viewSubmissionTab, setViewSubmissionTab] = useState('instructorAnnotations');
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [activeQuizAttempt, setActiveQuizAttempt] = useState(0);
    const [currentQuizAttempt, setCurrentQuizAttempt] = useState(0);
    const [problems, setProblems] = useState<any[]>([]);
    const [submittedAt, setSubmittedAt] = useState('');
    const [deadline, setDeadline] = useState('');
    const [totalPoints, setTotalPoints] = useState('');
    const [headers, setHeaders] = useState({});
    const [exportAoa, setExportAoa] = useState<any[]>();
    const [showQuizGrading, setShowQuizGrading] = useState(false);
    const [usernamesForAnnotation, setUsernamesForAnnotation] = useState<any>({});

    const server = useApolloClient();

    if (props.cue && props.cue.submission) {
        categories.push('Submitted');
        categories.push('Graded');
    }
    const styles = styleObject();
    let filteredSubscribers: any = [];
    switch (filterChoice) {
        case 'All':
            filteredSubscribers = subscribers;
            break;
        case 'Read':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'read';
            });
            break;
        case 'Delivered':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'not-delivered' || item.fullName === 'delivered';
            });
            break;
        case 'Graded':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'graded';
            });
            break;
        case 'Submitted':
            filteredSubscribers = subscribers.filter((item) => {
                return item.fullName === 'submitted';
            });
            break;
        default:
            filteredSubscribers = subscribers;
            break;
    }
    const windowHeight =
        Dimensions.get('window').width < 1024 ? Dimensions.get('window').height : Dimensions.get('window').height;
    const key = JSON.stringify(filteredSubscribers);

    const questionTypeLabel: any = {
        '': 'MCQ/Multiselect',
        freeResponse: 'Free response',
        trueFalse: 'True & False',
        dragdrop: 'Drag & Drop',
        hotspot: 'Hotspot',
        highlightText: 'Hot Text',
        inlineChoice: 'Inline Choice',
        textEntry: 'Text Entry',
        multipart: 'Multipart',
        equationEditor: 'Equation Editor',
        matchTableGrid: 'Match Table Grid',
    };

    // HOOKS

    // useEffect(() => {
    //     if (props.cue.original[0] === '{' && props.cue.original[props.cue.original.length - 1] === '}') {
    //         const obj = JSON.parse(props.cue.original);

    //         if (obj.quizId) {
    //             setIsQuiz(true);
    //         }
    //     }
    // }, [props.cue]);
    // useEffect(() => {
    //     setIsQuiz(props.isQuiz)
    // }, [props.isQuiz])

    /**
     * @description prepares export data for Assignment grades
     */
    useEffect(() => {
        if (problems.length === 0 || subscribers.length === 0) {
            return;
        }

        const exportAoa: any[] = [];

        // Add row 1 with Overall, problem Score, problem Comments,
        let row1 = [''];

        // Add Graded
        row1.push('Status');

        // Add total
        row1.push('Total score');

        problems.forEach((prob: any, index: number) => {
            row1.push(`Question ${index + 1} (${prob.points} point${prob.points !== 1 ? 's' : ''})`);
            row1.push('Remark');
        });

        row1.push('Submission Date');

        row1.push('Feedback');

        exportAoa.push(row1);

        // Row 2 should be correct answers
        const row2 = ['', '', ''];

        problems.forEach((prob: any, i: number) => {
            const { questionType, required } = prob;

            let type = questionTypeLabel[questionType];

            let require = required ? 'Required' : 'Optional';

            row2.push(`${type} (${require})`);
            row2.push(``);
        });

        exportAoa.push(row2);

        // Subscribers
        subscribers.forEach((sub: any) => {
            const subscriberRow: any[] = [];

            const { displayName, submission, submittedAt, comment, graded, score } = sub;

            subscriberRow.push(displayName);
            subscriberRow.push(graded ? 'Graded' : submittedAt !== null ? 'Submitted' : 'Not Submitted');

            if (!graded && !submittedAt) {
                exportAoa.push(subscriberRow);
                return;
            }

            subscriberRow.push(`${score}`);

            const obj = JSON.parse(submission);

            const { attempts } = obj;

            if (attempts.length === 0) return;

            let activeAttempt: any = {};

            attempts.map((attempt: any) => {
                if (attempt.isActive) {
                    activeAttempt = attempt;
                }
            });

            if (!activeAttempt) {
                return;
            }

            const { solutions = [], problemScores, problemComments } = activeAttempt;

            solutions.forEach((sol: any, i: number) => {
                if (problemScores && problemScores[i] !== '') {
                    subscriberRow.push(problemScores[i]);
                } else {
                    subscriberRow.push('Score not assigned');
                }

                if (problemComments && problemComments[i] !== '') {
                    subscriberRow.push(problemComments[i]);
                } else {
                    subscriberRow.push('');
                }
            });

            subscriberRow.push(moment(new Date(Number(submittedAt))).format('MMMM Do YYYY, h:mm a'));

            subscriberRow.push(comment);

            exportAoa.push(subscriberRow);
        });

        setExportAoa(exportAoa);
    }, [problems, subscribers]);

    /**
     * @description Set if submission released from props
     */
    useEffect(() => {
        if (!props.cue) {
            return;
        }
        if (props.cue.releaseSubmission !== null && props.cue.releaseSubmission !== undefined) {
            setReleaseSubmission(props.cue.releaseSubmission);
        } else {
            setReleaseSubmission(false);
        }

        if (props.cue.gradeWeight && props.cue.gradeWeight > 0) {
            setIsGraded(true);
        } else {
            setIsGraded(false);
        }
    }, [props.cue]);

    /**
     * @description Sets whether submission is a quiz and if submission is imported
     */
    useEffect(() => {
        if (submission[0] === '{' && submission[submission.length - 1] === '}') {
            const obj = JSON.parse(submission);
            if (obj.url !== undefined && obj.title !== undefined && obj.type !== undefined) {
                setImported(true);
                setUrl(obj.url);
                setType(obj.type);
                setTitle(obj.title);
            } else if (obj.attempts !== undefined && !props.isQuiz) {
                obj.attempts.map((attempt: any, index: number) => {
                    if (attempt.isActive) {
                        setImported(true);
                        setUrl(attempt.url);
                        setType(attempt.type);
                        setTitle(attempt.title);
                    }
                });

                setSubmissionAttempts(obj.attempts);
            } else if (obj.attempts !== undefined && props.isQuiz) {
                // setIsQuiz(true);
                setQuizAttempts(obj.attempts);

                // Set solutions to the active quiz attempt
                obj.attempts.map((attempt: any, index: number) => {
                    if (attempt.isActive) {
                        setActiveQuizAttempt(index);
                        setCurrentQuizAttempt(index);
                        setQuizSolutions(attempt);
                        setInitiatedAt(attempt.initiatedAt);
                        setSubmittedAt(attempt.submittedAt);
                        setGraded(attempt.isFullyGraded);
                        setShowQuizGrading(true);
                    }
                });
            }

            if (obj.initiatedAt) {
                setInitiatedAt(obj.initiatedAt);
            }
        } else {
            setImported(false);
            setUrl('');
            setType('');
            setTitle('');
        }
    }, [submission, props.isQuiz]);

    useEffect(() => {
        if (props.cue && props.cue.channelId && props.cue.channelId !== '') {
            fetchUsersForAnnotations();
        }
    }, [props.cue]);

    const fetchUsersForAnnotations = useCallback(() => {
        server
            .query({
                query: getUsernamesForAnnotation,
                variables: {
                    cueId: props.cue._id,
                },
            })
            .then((res) => {
                if (res.data && res.data.user.getUsernamesForAnnotation) {
                    const userIdToNameMap = JSON.parse(res.data.user.getUsernamesForAnnotation);
                    setUsernamesForAnnotation(userIdToNameMap);
                }
            })
            .catch((e) => {});
    }, [props.cue]);

    /**
     * @description Setup PDFTRON Webviewer with Submission
     */
    useEffect(() => {
        if (!user || !user._id || !subscriberName) return;

        if (submissionAttempts && submissionAttempts.length > 0 && submissionViewerRef && submissionViewerRef.current) {
            const attempt = submissionAttempts[submissionAttempts.length - 1];

            let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;

            if (!url) {
                return;
            }

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: url,
                    annotationUser: user._id,
                },
                submissionViewerRef.current
            ).then(async (instance) => {
                const { documentViewer, annotationManager } = instance.Core;

                if (!documentViewer || !annotationManager) return;

                documentViewer.addEventListener('documentLoaded', () => {
                    // perform document operations

                    // Fetch annotations from server

                    server
                        .query({
                            query: getSubmissionAnnotations,
                            variables: {
                                userId,
                                cueId: props.cueId,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.cue.getSubmissionAnnotations) {
                                const xfdfString = res.data.cue.getSubmissionAnnotations;

                                if (xfdfString !== '') {
                                    annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
                                        annotations.forEach((annotation: any) => {
                                            annotationManager.redrawAnnotation(annotation);
                                        });
                                    });
                                }
                            }
                        })
                        .catch((e) => {
                            Alert('Failed to fetch document annotations. Check internet connection.');
                        });
                });

                annotationManager.setAnnotationDisplayAuthorMap((id: string) => {
                    if (user._id === id) {
                        return user.fullName;
                    } else if (userId === id) {
                        return subscriberName;
                    } else if (usernamesForAnnotation[id] && usernamesForAnnotation[id] !== undefined) {
                        return usernamesForAnnotation[id];
                    } else {
                        // Fetch username from server and add it to the Map
                        return 'no name';
                    }
                });

                annotationManager.addEventListener(
                    'annotationChanged',
                    async (annotations: any, action: any, { imported }) => {
                        // If the event is triggered by importing then it can be ignored
                        // This will happen when importing the initial annotations
                        // from the server or individual changes from other users
                        if (imported) return;

                        const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: false });

                        server
                            .mutate({
                                mutation: updateAnnotation,
                                variables: {
                                    userId,
                                    cueId: props.cueId,
                                    annotations: xfdfString,
                                },
                            })
                            .then((res) => {
                                console.log('update annotation', res.data.cue.updateAnnotation);
                            })
                            .catch((e) => {
                                console.log(e);
                            });

                        // const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                        // currAttempt.annotations = xfdfString;

                        // const allAttempts = [...submissionAttempts];

                        // allAttempts[allAttempts.length - 1] = currAttempt;

                        // await handleAnnotationsUpdate(allAttempts);
                    }
                );
            });
        }
    }, [submissionAttempts, viewSubmissionTab, user, subscriberName, props.cueId, userId]);

    /**
     * @description if submission is a quiz then fetch Quiz
     */
    useEffect(() => {
        if (props.isQuiz) {
            const obj = JSON.parse(props.cue.original);

            setLoading(true);

            if (obj.quizId) {
                server
                    .query({
                        query: getQuiz,
                        variables: {
                            quizId: obj.quizId,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.quiz.getQuiz) {
                            setProblems(res.data.quiz.getQuiz.problems);
                            setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {});
                            setLoading(false);
                        }
                    });
            }
        }
    }, [props.isQuiz]);

    /**
     * @description Called when instructor saves grade
     */
    const handleGradeSubmit = useCallback(() => {
        if (pointsScored === '') {
            Alert('Enter a valid score for grading this assingment.');
            return;
        }

        if (Number.isNaN(Number(pointsScored))) {
            Alert('Points entered must be a valid number');
            return;
        }

        if (Number(pointsScored) > Number(totalPoints)) {
            Alert('Warning- Points assigned are greater than the total points.');
        }

        const availableUntil =
            props.cue && props.cue.availableUntil && props.cue.availableUntil !== ''
                ? new Date(props.cue.availableUntil)
                : null;

        const deadline =
            props.cue && props.cue.deadline && props.cue.deadline !== '' ? new Date(props.cue.deadline) : null;

        let warning = '';

        if (deadline && new Date() < deadline) {
            warning = 'Deadline has not passed. Students can still re-submit and may override current grading.';
        } else if (availableUntil && new Date() < availableUntil) {
            warning =
                'Late submission deadline has not passed. Students will be unable to submit after releasing scores.';
        }

        Alert('Save grade?', warning, [
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
                    server
                        .mutate({
                            mutation: submitGrade,
                            variables: {
                                cueId: props.cueId,
                                userId,
                                pointsScored,
                                comment,
                            },
                        })
                        .then((res) => {
                            if (res.data.cue.submitGrade) {
                                props.reloadStatuses();
                            }
                        });
                },
            },
        ]);
    }, [pointsScored, userId, props.cueId, comment]);

    // FUNCTIONS

    /**
     * @description Modify which attempt is active for Student
     */
    const modifyActiveQuizAttempt = () => {
        server
            .mutate({
                mutation: modifyActiveAttemptQuiz,
                variables: {
                    cueId: props.cueId,
                    userId,
                    quizAttempt: currentQuizAttempt,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.modifyActiveAttemptQuiz) {
                    props.reloadStatuses();
                }
            });
    };

    /**
     * @description On Save quiz scores
     */
    const onGradeQuiz = (problemScores: string[], problemComments: string[], score: number, comment: string) => {
        server
            .mutate({
                mutation: gradeQuiz,
                variables: {
                    cueId: props.cueId,
                    userId,
                    problemScores,
                    problemComments,
                    score,
                    comment,
                    quizAttempt: currentQuizAttempt,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.gradeQuiz) {
                    props.reloadStatuses();
                    setShowSubmission(false);
                }
            });
    };

    /**
     * @description Handles export of data to spreadsheet
     */
    const exportScores = () => {
        const { title } = htmlStringParser(props.cue.original);

        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        if (!exportAoa) {
            Alert('Export document being processed. Try again.');
            return;
        }

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scores ');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, `${title} scores` + fileExtension);
    };

    /**
     * @description Handle release/hide grades
     */
    const updateReleaseSubmission = useCallback(() => {
        const availableUntil =
            props.cue && props.cue.availableUntil && props.cue.availableUntil !== ''
                ? new Date(props.cue.availableUntil)
                : null;

        const deadline =
            props.cue && props.cue.deadline && props.cue.deadline !== '' ? new Date(props.cue.deadline) : null;

        let warning = '';

        if (deadline && new Date() < deadline) {
            warning = 'Deadline has not passed. Students will be unable to submit after releasing scores.';
        } else if (availableUntil && new Date() < availableUntil) {
            warning =
                'Late submission deadline has not passed. Students will be unable to submit after releasing scores.';
        }

        const keyword = isGraded ? 'Grades' : 'Feedback';

        Alert(
            releaseSubmission
                ? `Hide ${keyword.toLowerCase()}? ${keyword} will be temporarily hidden from viewers.`
                : `Share ${keyword.toLowerCase()}? ${keyword} will be privately visible to viewers`,
            releaseSubmission ? '' : warning,
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
                        // server
                        //     .mutate({
                        //         mutation: editReleaseSubmission,
                        //         variables: {
                        //             cueId: props.cueId,
                        //             releaseSubmission: !releaseSubmission,
                        //         },
                        //     })
                        //     .then((res: any) => {
                        //         if (res.data && res.data.cue.editReleaseSubmission) {
                        //             props.updateCueWithReleaseSubmission(!releaseSubmission);
                        //             setReleaseSubmission(!releaseSubmission);
                        //         } else {
                        //             alert('Something went wrong');
                        //         }
                        //     })
                        //     .catch((err) => {
                        //         console.log(err);
                        //         alert('Something went wrong');
                        //     });
                        props.updateCueWithReleaseSubmission(!releaseSubmission);
                    },
                },
            ]
        );
    }, [releaseSubmission, props.cueId, props, isGraded]);

    /**
     * @description Renders submission
     */
    const renderViewSubmission = () => {
        const attempt = submissionAttempts[submissionAttempts.length - 1];

        return (
            <View style={{ width: '100%' }}>
                {/* Render Tabs to switch between original submission and Annotations only if submission was HTML and not a file upload */}
                {/* {attempt.url !== undefined ? null : <View style={{ flexDirection: "row", width: '100%', justifyContent: 'center' }}>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column"
                    }}
                    onPress={() => {
                        setViewSubmissionTab("mySubmission");
                    }}>
                    <Text style={viewSubmissionTab === "mySubmission" ? styles.allGrayFill : styles.all}>
                        Submission
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column"
                    }}
                    onPress={() => {
                        setViewSubmissionTab("instructorAnnotations");
                    }}>
                    <Text style={viewSubmissionTab === "instructorAnnotations" ? styles.allGrayFill : styles.all}>
                        Feedback
                    </Text>
                </TouchableOpacity>
            </View>} */}
                {attempt.url !== undefined ? (
                    attempt.type === 'mp4' ||
                    attempt.type === 'oga' ||
                    attempt.type === 'mov' ||
                    attempt.type === 'wmv' ||
                    attempt.type === 'mp3' ||
                    attempt.type === 'mov' ||
                    attempt.type === 'mpeg' ||
                    attempt.type === 'mp2' ||
                    attempt.type === 'wav' ? (
                        <View style={{ width: '100%' }}>
                            {attempt.title !== '' ? (
                                <Text
                                    style={{
                                        fontSize: 20,
                                        paddingRight: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 20,
                                        marginBottom: 5,
                                        maxWidth: '100%',
                                        fontWeight: '600',
                                        width: '100%',
                                    }}
                                >
                                    {attempt.title}
                                </Text>
                            ) : null}
                            <ReactPlayer url={attempt.url} controls={true} width={'100%'} height={'100%'} />
                        </View>
                    ) : (
                        <View style={{ width: '100%' }}>
                            {attempt.title !== '' ? (
                                <Text
                                    style={{
                                        fontSize: 20,
                                        paddingRight: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 20,
                                        marginBottom: 5,
                                        maxWidth: '100%',
                                        fontWeight: '600',
                                        width: '100%',
                                    }}
                                >
                                    {attempt.title}
                                </Text>
                            ) : null}
                            <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                style={{
                                    height: Dimensions.get('window').width < 1024 ? '50vh' : '70vh',
                                    marginTop: attempt.title !== '' ? 0 : 20,
                                }}
                            ></div>
                        </View>
                    )
                ) : (
                    <View style={{ width: '100%', marginTop: 20 }} key={viewSubmissionTab}>
                        {viewSubmissionTab === 'mySubmission' ? (
                            <div className="mce-content-body htmlParser" style={{ width: '100%' }}>
                                {parser(attempt.html)}
                            </div>
                        ) : (
                            <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                style={{ height: Dimensions.get('window').width < 1024 ? '50vh' : '70vh' }}
                            ></div>
                        )}
                    </View>
                )}
            </View>
        );
    };

    // MAIN RETURN

    return (
        <View
            style={{
                width: '100%',
                minHeight: windowHeight - 200,
                borderTopRightRadius: 0,
                borderTopLeftRadius: 0,
            }}
        >
            {subscribers.length === 0 ? (
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            width: '100%',
                            color: '#1F1F1F',
                            fontSize: 20,
                            paddingTop: 50,
                            paddingHorizontal: 5,
                            fontFamily: 'inter',
                            flex: 1,
                            textAlign: 'center',
                        }}
                    >
                        {props.cueId ? PreferredLanguageText('noStatuses') : PreferredLanguageText('noStudents')}
                    </Text>
                </View>
            ) : (
                <View
                    style={{
                        width: '100%',
                        maxWidth: 1024,

                        flex: 1,
                    }}
                    key={key}
                >
                    {!props.cueId || showSubmission ? null : (
                        <View
                            style={{
                                width: '100%',

                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 20,
                                paddingTop: 30,
                                paddingHorizontal: 10,
                            }}
                        >
                            <label style={{ width: Dimensions.get('window').width < 768 ? 140 : 160 }}>
                                <Select
                                    touchUi={true}
                                    themeVariant="light"
                                    value={filterChoice}
                                    onChange={(val: any) => {
                                        setFilterChoice(val.value);
                                    }}
                                    responsive={{
                                        small: {
                                            display: 'bubble',
                                        },
                                        medium: {
                                            touchUi: false,
                                        },
                                    }}
                                    data={categories.map((category: any) => {
                                        return {
                                            value: category,
                                            text: category,
                                        };
                                    })}
                                />
                            </label>
                            {props.cue && props.cue.submission ? (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent:
                                            Dimensions.get('window').width < 768 ? 'space-between' : 'flex-end',
                                        marginLeft: Dimensions.get('window').width < 768 ? 'none' : 'auto',
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                        }}
                                    >
                                        {releaseSubmission ? (
                                            <TouchableOpacity
                                                onPress={() => updateReleaseSubmission()}
                                                style={{
                                                    borderRadius: 15,
                                                }}
                                                disabled={user.email === disableEmailId}
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
                                                        width: 150,
                                                    }}
                                                >
                                                    Hide {isGraded ? 'Grades' : 'Feedback'}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => updateReleaseSubmission()}
                                                style={{
                                                    borderRadius: 15,
                                                }}
                                                disabled={user.email === disableEmailId}
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
                                                        width: 150,
                                                    }}
                                                >
                                                    Share {isGraded ? 'Grades' : 'Feedback'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {props.isQuiz ? (
                                        <TouchableOpacity
                                            style={{
                                                marginLeft: 20,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    borderColor: '#000',
                                                    borderWidth: 1,
                                                    color: '#000',

                                                    fontSize: 11,
                                                    paddingHorizontal: 24,
                                                    fontFamily: 'inter',
                                                    overflow: 'hidden',
                                                    paddingVertical: 14,
                                                    textTransform: 'uppercase',
                                                    width: 120,
                                                }}
                                                onPress={() => {
                                                    exportScores();
                                                }}
                                            >
                                                EXPORT
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    )}
                    {!showSubmission ? (
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            horizontal={false}
                            key={filterChoice + key}
                            contentContainerStyle={{
                                width: '100%',
                                borderRadius: 1,
                                borderWidth: 0,
                                borderColor: '#f2f2f2',
                                maxWidth: 1024,
                                marginBottom: 50,
                                paddingHorizontal: 10,
                            }}
                        >
                            {filteredSubscribers.map((subscriber: any, index: any) => {
                                return (
                                    <TouchableOpacity
                                        disabled={
                                            subscriber.fullName !== 'submitted' && subscriber.fullName !== 'graded'
                                        }
                                        onPress={() => {
                                            if (
                                                subscriber.fullName === 'submitted' ||
                                                subscriber.fullName === 'graded'
                                            ) {
                                                setSubmission(subscriber.submission);
                                                setSubmittedAt(subscriber.submittedAt);
                                                setDeadline(subscriber.deadline);
                                                setShowSubmission(true);
                                                setPointsScored(
                                                    subscriber.pointsScored ? subscriber.pointsScored.toString() : ''
                                                );
                                                setGraded(subscriber.graded);
                                                setComment(subscriber.comment);
                                                setUserId(subscriber.userId);
                                                setSubscriberName(subscriber.displayName);
                                                setTotalPoints(subscriber.totalPoints);
                                            }
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            borderColor: '#f2f2f2',
                                            paddingVertical: 5,
                                            borderBottomWidth: index === filteredSubscribers.length - 1 ? 0 : 1,
                                            width: '100%',
                                        }}
                                    >
                                        <View
                                            style={{
                                                padding: 5,
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Image
                                                style={{
                                                    height: 45,
                                                    width: 45,
                                                    marginTop: 5,
                                                    marginLeft: 5,
                                                    marginBottom: 5,
                                                    borderRadius: 75,
                                                    alignSelf: 'center',
                                                }}
                                                source={{
                                                    uri: subscriber.avatar
                                                        ? subscriber.avatar
                                                        : 'https://cues-files.s3.amazonaws.com/images/default.png',
                                                }}
                                            />
                                        </View>
                                        <View style={{ flex: 1, paddingLeft: 10 }}>
                                            <Text
                                                style={{
                                                    fontSize: Dimensions.get('window').width < 768 ? 15 : 16,
                                                    padding: 5,
                                                    fontFamily: 'inter',
                                                    marginTop: 5,
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {subscriber.displayName ? subscriber.displayName : ''}
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: Dimensions.get('window').width < 768 ? 14 : 14,
                                                    padding: 5,
                                                    fontWeight: 'bold',
                                                }}
                                                ellipsizeMode="tail"
                                            >
                                                {subscriber.fullName === 'delivered' ||
                                                subscriber.fullName === 'not-delivered'
                                                    ? 'delivered'
                                                    : subscriber.fullName}
                                            </Text>
                                        </View>
                                        <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                            <View
                                                style={{
                                                    flexDirection: 'row',

                                                    paddingLeft: 10,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {subscriber.submittedAt &&
                                                subscriber.submittedAt !== '' &&
                                                subscriber.deadline &&
                                                subscriber.deadline !== '' &&
                                                subscriber.submittedAt >= subscriber.deadline ? (
                                                    <Text
                                                        style={{
                                                            color: '#f94144',
                                                            fontSize: 15,
                                                            marginRight: 10,
                                                            fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        LATE
                                                    </Text>
                                                ) : null}{' '}
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        padding: 5,
                                                        color: '#000',
                                                        textAlign: 'center',
                                                    }}
                                                    ellipsizeMode="tail"
                                                >
                                                    {subscriber.fullName === 'submitted' ||
                                                    subscriber.fullName === 'graded' ? (
                                                        <Ionicons
                                                            name="chevron-forward-outline"
                                                            size={Dimensions.get('window').width < 768 ? 18 : 20}
                                                        />
                                                    ) : null}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    ) : // is Quiz then show the Quiz Grading Component and new version with problemScores
                    props.isQuiz && showQuizGrading ? (
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            keyboardDismissMode={'on-drag'}
                            contentContainerStyle={{
                                paddingHorizontal: paddingResponsive(),
                            }}
                            style={{ flex: 1, paddingTop: 12 }}
                        >
                            {submittedAt !== '' &&
                            deadline !== '' &&
                            new Date(submittedAt) >= new Date(parseInt(deadline)) ? (
                                <View style={{ width: '100%' }}>
                                    <View
                                        style={{
                                            borderRadius: 1,
                                            padding: 5,
                                            borderWidth: 1,
                                            borderColor: '#f94144',
                                            marginVertical: 10,
                                            width: 150,
                                            marginLeft: 'auto',
                                        }}
                                    >
                                        <Text style={{ color: '#f94144', fontSize: 14, textAlign: 'center' }}>
                                            LATE SUBMISSION
                                        </Text>
                                    </View>
                                </View>
                            ) : null}
                            {
                                <View style={{ width: 140, marginBottom: 20 }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (showSubmission) {
                                                props.reloadStatuses();
                                            }
                                            setShowSubmission(false);
                                            setPointsScored('');
                                            setUserId('');
                                            setSubscriberName('');
                                        }}
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
                                                paddingHorizontal: 4,
                                                fontFamily: 'inter',
                                                textTransform: 'capitalize',
                                            }}
                                        >
                                            Back
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            }
                            <QuizGrading
                                loading={loading}
                                problems={problems}
                                solutions={quizSolutions}
                                partiallyGraded={!graded}
                                onGradeQuiz={onGradeQuiz}
                                comment={comment}
                                headers={headers}
                                isOwner={true}
                                initiatedAt={initiatedAt}
                                submittedAt={submittedAt}
                                attempts={quizAttempts}
                                activeQuizAttempt={activeQuizAttempt}
                                currentQuizAttempt={currentQuizAttempt}
                                modifyActiveQuizAttempt={modifyActiveQuizAttempt}
                                onChangeQuizAttempt={(attempt: number) => {
                                    setCurrentQuizAttempt(attempt);

                                    quizAttempts.map((att: any, index: number) => {
                                        if (index === attempt) {
                                            setQuizSolutions(att);
                                            setGraded(att.isFullyGraded);
                                            setInitiatedAt(att.initiatedAt);
                                        }
                                    });
                                }}
                            />
                        </ScrollView>
                    ) : (
                        <View>
                            <ScrollView
                                showsVerticalScrollIndicator={true}
                                keyboardDismissMode={'on-drag'}
                                contentContainerStyle={{
                                    paddingHorizontal: paddingResponsive(),
                                }}
                                style={{ flex: 1, paddingTop: 12 }}
                            >
                                <View
                                    style={{
                                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                                        flex: 1,
                                        marginTop: 20,
                                    }}
                                >
                                    <View
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                            marginBottom: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (showSubmission) {
                                                    props.reloadStatuses();
                                                }
                                                setShowSubmission(false);
                                                setPointsScored('');
                                                setUserId('');
                                                setSubscriberName('');
                                            }}
                                            style={{
                                                borderRadius: 15,
                                                marginRight: 15,
                                            }}
                                        >
                                            <Text>
                                                <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                                            </Text>
                                        </TouchableOpacity>
                                        <View style={{ flexDirection: 'row', marginRight: 15 }}>
                                            <Text style={{ fontSize: 15, lineHeight: 34 }}>
                                                {moment(new Date(parseInt(submittedAt))).format('MMMM Do, h:mm a')}
                                            </Text>
                                        </View>
                                        {submittedAt !== '' && deadline !== '' && submittedAt >= deadline ? (
                                            <View
                                                style={{
                                                    marginLeft: Dimensions.get('window').width < 768 ? 'auto' : 0,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        borderColor: '#f94144',
                                                        marginLeft: 'auto',
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: '#f94144',
                                                            fontSize: 20,
                                                            textAlign: 'center',
                                                            fontFamily: 'Inter',
                                                        }}
                                                    >
                                                        LATE
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: Dimensions.get('window').width < 768 ? 20 : 0,
                                            width: Dimensions.get('window').width < 768 ? '100%' : 'auto',
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                marginRight: 25,
                                            }}
                                        >
                                            <DefaultTextInput
                                                value={pointsScored}
                                                numberOfLines={1}
                                                style={{
                                                    width: 70,
                                                    borderColor: '#cccccc',
                                                    borderWidth: 1,
                                                    fontSize: 15,
                                                    backgroundColor: '#fff',
                                                    // paddingTop: 13,
                                                    marginLeft: 10,
                                                    padding: 10,
                                                }}
                                                placeholder={'Enter points'}
                                                onChangeText={(val) => setPointsScored(val)}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 18,
                                                    paddingLeft: 7,
                                                    fontFamily: 'Inter',
                                                }}
                                            >
                                                / {totalPoints} points
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => handleGradeSubmit()}
                                            style={{
                                                marginLeft: Dimensions.get('window').width < 768 ? 20 : 10,
                                            }}
                                            disabled={user.email === disableEmailId}
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
                                                    width: 150,
                                                }}
                                            >
                                                UPDATE
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* <View style={{ flexDirection: 'row' }}>
                                    {imported && !isQuiz ? (
                                        <View style={{ flex: 1 }}>
                                            <TextInput
                                                editable={false}
                                                value={title}
                                                style={styles.input}
                                                placeholder={'Title'}
                                                onChangeText={val => setTitle(val)}
                                                placeholderTextColor={'#1F1F1F'}
                                            />
                                        </View>
                                    ) : null}
                                </View> */}

                                {submissionAttempts.length > 0 && !props.isQuiz ? renderViewSubmission() : null}
                            </ScrollView>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

export default React.memo(SubscribersList);

const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1,
        },
        margin: {
            height: 20,
        },
        marginSmall: {
            height: 10,
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            // flex: 1,
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden',
        },
        input: {
            width: '100%',
            borderBottomColor: '#f2f2f2',
            borderBottomWidth: 1,
            fontSize: 15,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20,
        },
        outline: {
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        cusCategory: {
            fontSize: 15,

            paddingHorizontal: 10,
            height: 22,
        },
        cusCategoryOutline: {
            fontSize: 15,

            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#1F1F1F',
            color: 'white',
        },
        all: {
            fontSize: 15,
            color: '#000000',
            height: 24,
            paddingHorizontal: 15,

            lineHeight: 24,
            fontFamily: 'inter',
            // textTransform: 'uppercase'
        },
        allGrayFill: {
            fontSize: 15,
            color: '#fff',
            paddingHorizontal: 15,
            borderRadius: 12,
            backgroundColor: '#000000',
            lineHeight: 24,
            height: 24,
            fontFamily: 'inter',
            // textTransform: 'uppercase'
        },
    });
};
