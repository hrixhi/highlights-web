import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Dimensions, Switch, Image } from 'react-native';
import { View, Text, TouchableOpacity } from './Themed';
import _ from 'lodash'
import { Ionicons } from '@expo/vector-icons';
import SubscriberCard from './SubscriberCard';
import {
    RichEditor
} from "react-native-pell-rich-editor";
import { fetchAPI } from '../graphql/FetchAPI';
import { editPersonalMeeting, findUserById, getMessages, getPersonalMeetingLink, getPersonalMeetingLinkStatus, inviteByEmail, isSubInactive, makeSubActive, makeSubInactive, markMessagesAsRead, submitGrade, unsubscribe, getQuiz, gradeQuiz, editReleaseSubmission, personalMeetingRequest, updateAnnotation, modifyActiveAttemptQuiz } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alert from './Alert';
import NewMessage from './NewMessage';
import MessageCard from './MessageCard';
import { validateEmail } from '../helpers/emailCheck';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import ReactPlayer from 'react-player'
import moment from "moment"
import alert from './Alert';
import Webview from './Webview'
import QuizGrading from './QuizGrading';
import Annotation from 'react-image-annotation'
import WebViewer from '@pdftron/pdfjs-express';
import XLSX from "xlsx"
import * as FileSaver from 'file-saver';
import { htmlStringParser } from '../helpers/HTMLParser'
import Multiselect from 'multiselect-react-dropdown';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import parser from 'html-react-parser';
import { Select } from '@mobiscroll/react'



const SubscribersList: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [filterChoice, setFilterChoice] = useState('All')
    const unparsedSubs: any[] = JSON.parse(JSON.stringify(props.subscribers))
    const [subscribers] = useState<any[]>(unparsedSubs.reverse())
    const categories = ['All', 'Delivered', 'Read']
    const categoriesLanguageMap: { [label: string]: string } = {
        All: 'all',
        Read: 'read',
        Delivered: 'delivered',
        "Not Delivered": 'notDelivered',
        "Submitted": 'submitted',
        "Graded": "graded"
    }
    const [showSubmission, setShowSubmission] = useState(false)
    const [showAddUsers, setShowAddUsers] = useState(false)
    const [isOwner, setIsOwner] = useState(false)
    const [submission, setSubmission] = useState<any>('')
    const [score, setScore] = useState("0")
    const [graded, setGraded] = useState(false)
    const [status, setStatus] = useState("")
    const [userId, setUserId] = useState("")
    const [messages, setMessages] = useState<any[]>([])
    const [showChat, setShowChat] = useState(false)
    const [users, setUsers] = useState<any>([])
    const [emails, setEmails] = useState('')
    const [showNewGroup, setShowNewGroup] = useState(false)
    const RichText: any = useRef()
    const submissionViewerRef: any = useRef();
    const [selected, setSelected] = useState<any[]>([])
    const [expandMenu, setExpandMenu] = useState(false)
    const [comment, setComment] = useState('')
    const [isQuiz, setIsQuiz] = useState(false);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [initiatedAt, setInitiatedAt] = useState<any>({});
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [loadedChatWithUser, setLoadedChatWithUser] = useState<any>({})
    const [isLoadedUserInactive, setIsLoadedUserInactive] = useState(false)
    const [user, setUser] = useState<any>({})
    const [meetingOn, setMeetingOn] = useState(false)
    const [meetingLink, setMeetingLink] = useState('')
    const [loading, setLoading] = useState(false);
    const [releaseSubmission, setReleaseSubmission] = useState(false);
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
    const [viewSubmissionTab, setViewSubmissionTab] = useState('mySubmission');
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [activeQuizAttempt, setActiveQuizAttempt] = useState(0);
    const [currentQuizAttempt, setCurrentQuizAttempt] = useState(0);

    // Quiz 
    const [problems, setProblems] = useState<any[]>([]);
    const [submittedAt, setSubmittedAt] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isV0Quiz, setIsV0Quiz] = useState(false)
    const [isV1Quiz, setIsV1Quiz] = useState(false);
    const [headers, setHeaders] = useState({})
    const [exportAoa, setExportAoa] = useState<any[]>()

    // Alerts
    const usersAddedAlert = PreferredLanguageText('usersAdded')
    const emailInviteSentAlert = PreferredLanguageText('emailInviteSent')
    const unableToLoadMessagesAlert = PreferredLanguageText('unableToLoadMessages')
    const checkConnectionAlert = PreferredLanguageText('checkConnection')
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const userSubscriptionActivatedAlert = PreferredLanguageText('userSubscriptionActivated')
    const userSubscriptionInactivatedAlert = PreferredLanguageText('userSubscriptionInactivated')
    const userRemovedAlert = PreferredLanguageText('userRemoved');
    const alreadyUnsubscribedAlert = PreferredLanguageText('alreadyUnsubscribed')

    const [annotation, setAnnotation] = useState<any>({})
    const [annotations, setAnnotations] = useState<any[]>([])

    const onSubmit = useCallback((ann: any) => {
        const { geometry, data }: any = ann
        const updatedAnnot = annotations.concat({
            geometry,
            data: {
                ...data,
                id: Math.random()
            }
        })
        setAnnotations(updatedAnnot)
    }, [annotations])

    useEffect(() => {
        const comm = {
            annotation,
            annotations
        }
        setComment(JSON.stringify(comm))
    }, [annotation, annotations])

    if (props.cue && props.cue.submission) {
        categories.push('Submitted')
        categories.push('Graded')
    }
    const styles = styleObject()
    let filteredSubscribers: any = []
    switch (filterChoice) {
        case 'All':
            filteredSubscribers = subscribers
            break;
        case 'Read':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'read'
            })
            break;
        case 'Delivered':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'not-delivered' || item.fullName === 'delivered'
            })
            break;
        case 'Graded':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'graded'
            })
            break;
        case 'Submitted':
            filteredSubscribers = subscribers.filter(item => {
                return item.fullName === 'submitted'
            })
            break;
        default:
            filteredSubscribers = subscribers
            break;
    }
    const windowHeight = Dimensions.get('window').width < 1024 ? Dimensions.get('window').height : Dimensions.get('window').height;
    const key = JSON.stringify(filteredSubscribers)
    let options = filteredSubscribers.map((sub: any) => {
        return {
            value: sub._id, text: sub.displayName, group: sub.displayName[0]
        }
    })

    options = options.sort((a: any, b: any) => {
        if (a > b) return -1;
        if (a < b) return 1;
        return 0;
    })

    const group = selected.map(s => {
        return s.value
    })

    // PREPARE EXPORT DATA 
    useEffect(() => {

        if (problems.length === 0 || subscribers.length === 0) {
            return;
        }

        const exportAoa = [];

        // Add row 1 with Overall, problem Score, problem Comments,
        let row1 = [""];

        // Add Graded 
        row1.push("Status")

        // Add total
        row1.push("Total score")

        problems.forEach((prob: any, index: number) => {
            row1.push(`Question ${index + 1}: ${prob.points} points`)
            row1.push("Score + Remark")
        })

        row1.push("Submission Date")

        row1.push("Feedback")

        exportAoa.push(row1);

        // Row 2 should be correct answers
        const row2 = ["", "", ""];

        problems.forEach((prob: any, i: number) => {
            const { questionType, required, options = [], } = prob;
            let type = questionType === "" ? "MCQ" : "Free Response";

            let require = required ? "Required" : "Optional";

            let answer = "";

            if (questionType === "") {
                answer += "Ans: "
                options.forEach((opt: any, index: number) => {
                    if (opt.isCorrect) {
                        answer += ((index + 1) + ", ");
                    }
                })
            }

            row2.push(`${type} ${answer}`)
            row2.push(`(${require})`)
        })

        exportAoa.push(row2)

        // Subscribers
        subscribers.forEach((sub: any) => {

            const subscriberRow: any[] = [];

            const { displayName, submission, submittedAt, comment, graded, score } = sub;

            subscriberRow.push(displayName);
            subscriberRow.push(graded ? "Graded" : (submittedAt !== null ? "Submitted" : "Not Submitted"))

            if (!graded && !submittedAt) {
                exportAoa.push(subscriberRow);
                return;
            }

            subscriberRow.push(`${score}`)

            const obj = JSON.parse(submission);

            const { attempts } = obj;

            if (attempts.length === 0) return;

            let activeAttempt: any = {};

            attempts.map((attempt: any) => {
                if (attempt.isActive) {
                    activeAttempt = attempt
                }
            })

            console.log("Active attempt", activeAttempt)

            if (!activeAttempt) {
                return;
            }

            const { solutions = [], problemScores, problemComments } = activeAttempt;

            console.log("Solutions", solutions)

            solutions.forEach((sol: any, i: number) => {
                let response = ''
                if ("selected" in sol) {
                    const options = sol["selected"];

                    options.forEach((opt: any, index: number) => {
                        if (opt.isSelected) response += ((index + 1) + " ")
                    })
                }

                subscriberRow.push(response);

                if (problemScores && problemScores[i] !== "") {
                    subscriberRow.push(`${problemScores[i]} ${problemComments && problemComments[i] !== "" ? "- Remark:" + problemComments[i] : ''}`)
                } else {
                    subscriberRow.push("Score not assigned")
                }


            })

            subscriberRow.push(moment(new Date(Number(submittedAt))).format("MMMM Do YYYY, h:mm a"))

            subscriberRow.push(comment)

            exportAoa.push(subscriberRow);

        })

        setExportAoa(exportAoa)


    }, [problems, subscribers])

    useEffect(() => {

        if (!props.cue) {
            return
        }
        if (props.cue.releaseSubmission !== null && props.cue.releaseSubmission !== undefined) {
            setReleaseSubmission(props.cue.releaseSubmission)
        } else {
            setReleaseSubmission(false)
        }

        // Set if quiz when cue loaded
        if (props.cue && props.cue.original && props.cue.original[0] === '{' && props.cue.original[props.cue.original.length - 1] === '}') {
            const obj = JSON.parse(props.cue.original);

            if (obj.quizId) {
                setIsQuiz(true);
            }
        }



    }, [props.cue])

    useEffect(() => {
        if (submission[0] === '{' && submission[submission.length - 1] === '}') {
            const obj = JSON.parse(submission)
            if (obj.solutions) {
                setIsQuiz(true)
                setQuizSolutions(obj)

                // This is old schema for submission
            } else if (obj.url !== undefined && obj.title !== undefined && obj.type !== undefined) {

                setImported(true)
                setUrl(obj.url)
                setType(obj.type)
                setTitle(obj.title)
            } else if (obj.attempts !== undefined && obj.submissionDraft !== undefined && obj.quizResponses === undefined) {

                // Check if submission draft contains imported document
                if (obj.submissionDraft[0] === '{' && obj.submissionDraft[obj.submissionDraft.length - 1] === '}') {
                    let parse = JSON.parse(obj.submissionDraft);

                    if (parse.url !== undefined && parse.title !== undefined && parse.type !== undefined) {
                        setImported(true);
                        setUrl(parse.url);
                        setType(parse.type);
                        setTitle(parse.title)
                    }

                }

                setSubmissionAttempts(obj.attempts)
            } else if (obj.attempts !== undefined && obj.quizResponses !== undefined) {

                setIsQuiz(true)
                setIsV1Quiz(true)
                setQuizAttempts(obj.attempts);

                // Set solutions to the active quiz attempt
                obj.attempts.map((attempt: any, index: number) => {

                    if (attempt.isActive) {
                        setActiveQuizAttempt(index)
                        setCurrentQuizAttempt(index);
                        setQuizSolutions(attempt)
                        setInitiatedAt(attempt.initiatedAt)
                        setSubmittedAt(attempt.submittedAt)
                        setGraded(attempt.isFullyGraded)

                    }
                })

            }

            if (obj.initiatedAt) {
                setInitiatedAt(obj.initiatedAt)
            }

        } else {
            setImported(false)
            setUrl('')
            setType('')
            setTitle('')
        }
    }, [submission])

    useEffect(() => {

        if (submissionAttempts && submissionAttempts.length > 0 && submissionViewerRef && submissionViewerRef.current) {
            const attempt = submissionAttempts[submissionAttempts.length - 1];

            let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;

            if (!url) {
                return;
            }

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: decodeURIComponent(url),
                },
                submissionViewerRef.current,
            ).then(async (instance) => {
                const { documentViewer, annotationManager } = instance.Core;

                const u = await AsyncStorage.getItem("user");
                if (u) {
                    const user = JSON.parse(u);
                    annotationManager.setCurrentUser(user.fullName)
                }

                documentViewer.addEventListener('documentLoaded', () => {
                    // perform document operations

                    const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                    const xfdfString = currAttempt.annotations;

                    if (xfdfString !== "") {
                        annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
                            annotations.forEach((annotation: any) => {
                                annotationManager.redrawAnnotation(annotation);
                            });
                        });
                    }
                });



                annotationManager.addEventListener('annotationChanged', async (annotations: any, action: any, { imported }) => {
                    // If the event is triggered by importing then it can be ignored
                    // This will happen when importing the initial annotations
                    // from the server or individual changes from other users
                    if (imported) return;

                    const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: true });

                    const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                    currAttempt.annotations = xfdfString;

                    const allAttempts = [...submissionAttempts];

                    allAttempts[allAttempts.length - 1] = currAttempt;

                    await handleAnnotationsUpdate(allAttempts);

                });

            });
        }

    }, [submissionAttempts, submissionViewerRef, submissionViewerRef.current, viewSubmissionTab])

    useEffect(() => {
        if (quizSolutions) {
            if (quizSolutions.problemScores) {
                setIsV0Quiz(false)
            } else {
                setIsV0Quiz(true)
            }
        }
    }, [quizSolutions])


    useEffect(() => {
        if (isQuiz) {
            const obj = JSON.parse(props.cue.original);

            setLoading(true)

            if (obj.quizId) {
                const server = fetchAPI("");
                server
                    .query({
                        query: getQuiz,
                        variables: {
                            quizId: obj.quizId
                        }
                    })
                    .then(res => {
                        if (res.data && res.data.quiz.getQuiz) {
                            setProblems(res.data.quiz.getQuiz.problems);
                            setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {})
                            setLoading(false);
                        }
                    });

            }
        }
    }, [isQuiz])

    const onChange = useCallback((value) => {
        setSelected(value)
    }, [subscribers])

    const handleAnnotationsUpdate = useCallback((attempts: any) => {

        const server = fetchAPI('')
        server.mutate({
            mutation: updateAnnotation,
            variables: {
                cueId: props.cueId,
                userId,
                attempts: JSON.stringify(attempts)
            }
        }).then(res => {
            if (res.data.cue.updateAnnotation) {
                // props.reload()
                // setShowSubmission(false)
            }
        })

    }, [userId, props.cueId])

    const handleGradeSubmit = useCallback(() => {

        if (Number.isNaN(Number(score))) {
            Alert("Score must be a number")
            return
        }

        const availableUntil = props.cue && props.cue.availableUntil && props.cue.availableUntil !== "" ? new Date(props.cue.availableUntil) : null;

        const deadline = props.cue && props.cue.deadline && props.cue.deadline !== "" ? new Date(props.cue.deadline) : null;

        let warning = "";

        if (deadline && new Date() < deadline) {
            warning = "Deadline has not passed. Students can still re-submit and may override current grading."
        } else if (availableUntil && new Date() < availableUntil) {
            warning = "Late submission deadline has not passed. Students will be unable to submit after releasing scores."
        }

        Alert("Save grade?", warning, [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    return;
                }
            },
            {
                text: "Yes",
                onPress: async () => {

                    const server = fetchAPI('')
                    server.mutate({
                        mutation: submitGrade,
                        variables: {
                            cueId: props.cueId,
                            userId,
                            score,
                            comment
                        }
                    }).then(res => {
                        if (res.data.cue.submitGrade) {
                            props.reloadStatuses()
                        }
                    })
                }
            }
        ])

    }, [score, userId, props.cueId, comment, props])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u) {
                    const user = JSON.parse(u)
                    setUser(user)
                    if (user._id && props.channelCreatedBy && user._id.toString().trim() === props.channelCreatedBy.toString().trim()) {
                        setIsOwner(true)
                    }
                }
            }
        )()
    }, [props.channelCreatedBy])

    useEffect(() => {
        // get meeting status & set the meeting link accordingly
        if (users && users.length > 0) {
            const server = fetchAPI('')
            server.query({
                query: getPersonalMeetingLinkStatus,
                variables: {
                    users
                }
            }).then((res: any) => {
                if (res.data && res.data.channel.getPersonalMeetingLinkStatus) {
                    setMeetingOn(true)
                    getMeetingLink()
                }
            })
        }
    }, [users])

    const getMeetingLink = useCallback(() => {
        const server = fetchAPI('')
        server.query({
            query: getPersonalMeetingLink,
            variables: {
                userId: user._id,
                users: users
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.getPersonalMeetingLink && res.data.channel.getPersonalMeetingLink !== 'error') {
                setMeetingLink(res.data.channel.getPersonalMeetingLink)
            }
        }).catch(err => {
            console.log(err)
            alert('Something went wrong')
        })
    }, [users, user])

    const updateMeetingStatus = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: editPersonalMeeting,
            variables: {
                users,
                channelId: props.channelId,
                meetingOn: !meetingOn
            }
        }).then((res: any) => {
            if (res.data && res.data.channel.editPersonalMeeting) {
                if (!meetingOn) {
                    // meeting turned on
                    getMeetingLink()
                }
                setMeetingOn(!meetingOn)
            } else {
                console.log(res)
                alert('Something went wrong')
            }
        }).catch(err => {
            console.log(err)
            alert('Something went wrong')
        })
    }, [users, props.channelId, meetingOn, getMeetingLink])

    const showError = useCallback(() => {
        alert('Meeting is inactive.')
    }, [])

    const submitEmails = useCallback(async () => {
        const lowerCaseEmails = emails.toLowerCase()
        const parsedEmails: any[] = []
        const unparsedEmails = lowerCaseEmails.split('\n')
        unparsedEmails.map((email) => {
            if (validateEmail(email)) {
                parsedEmails.push(email)
            }
        })

        if (parsedEmails.length === 0) return;
        const server = fetchAPI('')
        server.mutate({
            mutation: inviteByEmail,
            variables: {
                emails: parsedEmails,
                channelId: props.channelId
            }
        }).then(res => {
            if (res.data.user.inviteByEmail) {
                setEmails('')
                Alert(usersAddedAlert, emailInviteSentAlert)
                props.reload()
            }
        }).catch(err => {
            console.log(err)
        })
    }, [emails, props.channelId])

    const loadChat = useCallback(async (userId, groupId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUsers([parsedUser._id, userId])
            setMeetingOn(false)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: [parsedUser._id, userId]
                }
            })
                .then(res => {
                    setMessages(res.data.message.getMessagesThread)
                    setShowChat(true)
                })
                .catch(err => {
                    Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark chat as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => {
                props.refreshUnreadMessagesCount()
            })
                .catch(e => console.log(e))
            // load the user
            server.query({
                query: findUserById,
                variables: {
                    id: userId
                }
            }).then(res => {
                if (res.data && res.data.user.findById) {
                    setLoadedChatWithUser(res.data.user.findById)
                    server.query({
                        query: isSubInactive,
                        variables: {
                            userId: res.data.user.findById._id,
                            channelId: props.channelId
                        }
                    }).then((res2: any) => {
                        if (res2.data && res2.data.subscription.isSubInactive) {
                            setIsLoadedUserInactive(true)
                        }
                    }).catch((err) => console.log(err))
                }
            })
        }
    }, [props.channelId])

    const loadGroupChat = useCallback(async (groupUsers, groupId) => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUsers(groupUsers)
            setMeetingOn(false)
            const server = fetchAPI('')
            server.query({
                query: getMessages,
                variables: {
                    users: groupUsers
                }
            })
                .then(res => {
                    setMessages(res.data.message.getMessagesThread)
                    setShowChat(true)
                })
                .catch(err => {
                    Alert(unableToLoadMessagesAlert, checkConnectionAlert)
                })
            // mark as read here
            server.mutate({
                mutation: markMessagesAsRead,
                variables: {
                    userId: parsedUser._id,
                    groupId
                }
            }).then(res => console.log(res))
                .catch(e => console.log(e))
        }
    }, [])

    const handleDelete = useCallback(() => {

        Alert("Remove user from channel?", "",
            [
                {
                    text: "Cancel", style: "cancel", onPress: () => { return; }
                },
                {
                    text: "Okay", onPress: async () => {
                        const server = fetchAPI('')
                        server.mutate({
                            mutation: unsubscribe,
                            variables: {
                                userId: loadedChatWithUser._id,
                                channelId: props.channelId,
                                keepContent: false
                            }
                        }).then(async res => {
                            if (res.data.subscription && res.data.subscription.unsubscribe) {
                                Alert(userRemovedAlert)
                                props.reload()
                                setShowChat(false)
                                setIsLoadedUserInactive(false)
                                setLoadedChatWithUser({})
                            } else {
                                Alert(alreadyUnsubscribedAlert)
                            }
                        }).catch(err => {
                            Alert(somethingWentWrongAlert, checkConnectionAlert)
                        })
                    }
                }
            ]
        )

    }, [loadedChatWithUser, props.channelId, props.reload])

    const handleSubStatusChange = useCallback(() => {

        const alertMessage = isLoadedUserInactive ? "Make user active?" : "Make user inactive?"

        Alert(alertMessage, "",
            [
                {
                    text: "Cancel", style: "cancel", onPress: () => { return; }
                },
                {
                    text: "Okay", onPress: async () => {
                        const server = fetchAPI('')
                        server.mutate({
                            mutation: isLoadedUserInactive ? makeSubActive : makeSubInactive,
                            variables: {
                                userId: loadedChatWithUser._id,
                                channelId: props.channelId
                            }
                        }).then(res => {
                            if (isLoadedUserInactive) {
                                // changed to active
                                if (res.data && res.data.subscription.makeActive) {
                                    Alert(userSubscriptionActivatedAlert)
                                    props.reload()
                                    setShowChat(false)
                                    setIsLoadedUserInactive(false)
                                    setLoadedChatWithUser({})
                                }
                            } else {
                                // changed to inactive
                                if (res.data && res.data.subscription.makeInactive) {
                                    Alert(userSubscriptionInactivatedAlert)
                                    props.reload()
                                    setShowChat(false)
                                    setIsLoadedUserInactive(false)
                                    setLoadedChatWithUser({})
                                }
                            }
                        })
                    }
                }
            ]
        )


    }, [isLoadedUserInactive, loadedChatWithUser, props.channelId])

    const handleEnterMeeting = useCallback(() => {
        const server = fetchAPI('')
        server.mutate({
            mutation: personalMeetingRequest,
            variables: {
                userId: user._id,
                channelId: props.channelId,
                users
            }
        }).then(res => {
            console.log(res)
            if (res.data && res.data.channel.personalMeetingRequest !== 'error') {
                window.open(res.data.channel.personalMeetingRequest, "_blank");
            } else {
                Alert("Classroom not in session. Waiting for instructor.")
            }
        }).catch(err => {
            Alert("Something went wrong.")
        })
    }, [users, userId, props.channelId, user])

    const modifyActiveQuizAttempt = () => {
        const server = fetchAPI("");
        server
            .mutate({
                mutation: modifyActiveAttemptQuiz,
                variables: {
                    cueId: props.cueId,
                    userId,
                    quizAttempt: currentQuizAttempt
                }
            })
            .then(res => {
                if (res.data && res.data.cue.modifyActiveAttemptQuiz) {
                    props.reload()
                }
            });

    }

    const onGradeQuiz = (problemScores: string[], problemComments: string[], score: number, comment: string) => {
        const server = fetchAPI("");
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
                    quizAttempt: isV1Quiz ? currentQuizAttempt : null
                }
            })
            .then(res => {
                if (res.data && res.data.cue.gradeQuiz) {
                    props.reload()
                    setShowSubmission(false)
                }
            });
    }

    const exportScores = () => {

        const { title } = htmlStringParser(props.cue.original)

        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';

        if (!exportAoa) {
            Alert("Export document being processed. Try again.")
            return;
        }

        const ws = XLSX.utils.aoa_to_sheet(exportAoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Scores ");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, `${title} scores` + fileExtension);

    }


    const updateReleaseSubmission = useCallback(() => {


        const availableUntil = props.cue && props.cue.availableUntil && props.cue.availableUntil !== "" ? new Date(props.cue.availableUntil) : null;

        const deadline = props.cue && props.cue.deadline && props.cue.deadline !== "" ? new Date(props.cue.deadline) : null;

        let warning = "";

        if (deadline && new Date() < deadline) {
            warning = "Deadline has not passed. Students will be unable to submit after releasing scores."
        } else if (availableUntil && new Date() < availableUntil) {
            warning = "Late submission deadline has not passed. Students will be unable to submit after releasing scores."
        }

        Alert(releaseSubmission ? "Hide scores?" : "Release Scores?", releaseSubmission ? "" : warning, [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    return;
                }
            },
            {
                text: "Yes",
                onPress: async () => {
                    const server = fetchAPI("");
                    server.mutate({
                        mutation: editReleaseSubmission,
                        variables: {
                            cueId: props.cueId,
                            releaseSubmission: !releaseSubmission,
                        }
                    }).then((res: any) => {
                        if (res.data && res.data.cue.editReleaseSubmission) {
                            props.updateCueWithReleaseSubmission(!releaseSubmission)
                            setReleaseSubmission(!releaseSubmission)
                        } else {
                            alert('Something went wrong')
                        }
                    }).catch(err => {
                        console.log(err)
                        alert('Something went wrong')
                    })
                }
            }
        ])


    }, [releaseSubmission, props.cueId, props])

    useEffect(() => {
        if (url === '' || !url) {
            return
        }
        console.log(url)
        WebViewer(
            {
                licenseKey: 'xswED5JutJBccg0DZhBM',
                initialDoc: decodeURIComponent(url),
            },
            RichText.current,
        ).then((instance) => {
            const { documentViewer } = instance.Core;
            // you can now call WebViewer APIs here...
            documentViewer.addEventListener('documentLoaded', () => {
                // perform document operations
            });
        });
    }, [url, RichText, imported, type, submissionAttempts, viewSubmissionTab]);


    const renderViewSubmission = () => {
        const attempt = submissionAttempts[submissionAttempts.length - 1];

        return (<View style={{ width: '100%', marginTop: 20 }}>
            {/* Render Tabs to switch between original submission and Annotations only if submission was HTML and not a file upload */}
            {attempt.url !== undefined ? null : <View style={{ flexDirection: "row", width: '100%', justifyContent: 'center' }}>
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
            </View>}
            {
                attempt.url !== undefined ?
                    (attempt.type === "mp4" ||
                        attempt.type === "oga" ||
                        attempt.type === "mov" ||
                        attempt.type === "wmv" ||
                        attempt.type === "mp3" ||
                        attempt.type === "mov" ||
                        attempt.type === "mpeg" ||
                        attempt.type === "mp2" ||
                        attempt.type === "wav" ?
                        <View style={{ width: '100%', marginTop: 25 }}>
                            {attempt.title !== "" ? <Text
                                style={{
                                    fontSize: 18,
                                    paddingRight: 15,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    marginTop: 20,
                                    marginBottom: 5,
                                    maxWidth: "100%",
                                    fontWeight: "600",
                                    width: '100%'
                                }}
                            >
                                {attempt.title}
                            </Text> : null}
                            <ReactPlayer url={url} controls={true} />
                        </View>
                        :
                        <View style={{ width: '100%', marginTop: 25 }}>
                            {attempt.title !== "" ? <Text
                                style={{
                                    fontSize: 18,
                                    paddingRight: 15,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    marginTop: 20,
                                    marginBottom: 5,
                                    maxWidth: "100%",
                                    fontWeight: "600",
                                    width: '100%'
                                }}
                            >
                                {attempt.title}
                            </Text> : null}
                            <div className="webviewer" ref={submissionViewerRef} style={{ height: Dimensions.get('window').width < 1024 ? "50vh" : "70vh" }}></div>
                        </View>)
                    :
                    <View style={{ width: '100%', marginTop: 25 }} key={viewSubmissionTab}>
                        {viewSubmissionTab === "mySubmission" ?
                            <div className="mce-content-body htmlParser" style={{ width: '100%' }}>
                                {parser(attempt.html)}
                            </div> :
                            <div className="webviewer" ref={submissionViewerRef} style={{ height: Dimensions.get('window').width < 1024 ? "50vh" : "70vh" }}></div>
                        }
                    </View>
            }
        </View>)


    }

    const renderQuizSubmissions = () => {

        const { initiatedAt, solutions } = quizSolutions;

        return (<View style={{ width: '100%', marginLeft: '5%', display: 'flex', flexDirection: 'column' }}>
            {initiatedAt ? <Text style={{ width: '100%', height: 15, paddingBottom: 25 }}>
                Quiz initiated at {moment(new Date(initiatedAt)).format('MMMM Do YYYY, h:mm a')}
            </Text> :
                null
            }
            <Text style={{ width: '100%', height: 15, marginTop: '20px', paddingBottom: 25, fontWeight: 'bold' }}>
                Selected Answers:
            </Text>
            <View style={{ marginTop: '20px', display: 'flex', flexDirection: "column" }}>
                {solutions.map((solution: any, index: number) => {

                    if (solution.selected) {
                        const answers: any[] = solution.selected;

                        const selectedAnswers = answers.filter(ans => ans.isSelected);

                        let selectedAnswersString: any[] = []

                        selectedAnswers.forEach((ans: any) => {
                            selectedAnswersString.push(ans.options)
                        })

                        return (<Text style={{ width: '100%', height: 15, marginTop: '10px', paddingBottom: 25 }}>
                            Problem {index + 1} : {selectedAnswersString.join(", ")}
                        </Text>)
                    } else {
                        return (<Text style={{ width: '100%', height: 15, marginTop: '10px', paddingBottom: 25 }}>
                            Problem {index + 1} : {solution.response}
                        </Text>)
                    }

                })}
            </View>
        </View>)

    }

    return (
        <View style={{
            // borderWidth: 2,
            backgroundColor: 'white',
            width: '100%',
            minHeight: windowHeight - 200,
            // paddingHorizontal: 20,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0
        }}>
            {
                props.cueId ? null : <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 25 }}>
                    {/* <Ionicons name='chevron-down' size={15} color={'#e0e0e0'} /> */}
                </Text>
            }
            {
                showSubmission || showChat || showAddUsers || showNewGroup ?
                    <View style={{ backgroundColor: 'white', paddingBottom: 15, width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', width: '100%', maxWidth: 1000 }}>
                            {/* <TouchableOpacity
                                key={Math.random()}
                                style={{
                                    backgroundColor: 'white'
                                }}
                                onPress={() => {
                                    if (showChat) {
                                        setShowChat(false)
                                        setIsLoadedUserInactive(false)
                                        setLoadedChatWithUser({})
                                        setUsers([])
                                        props.reload()
                                    } else {
                                        if (showSubmission) {
                                            props.reloadStatuses()
                                        }
                                        setShowSubmission(false)
                                        setStatus("")
                                        setScore("0")
                                        setUserId("")
                                    }
                                    setShowAddUsers(false)
                                    setShowNewGroup(false)
                                }}>
                                <Text style={{
                                    width: '100%',
                                    lineHeight: 23,
                                }}>
                                    <Ionicons name='arrow-back-outline' size={30} color={'#343A40'} />
                                </Text>
                            </TouchableOpacity> */}
                            {
                                loadedChatWithUser && loadedChatWithUser !== {} && !showNewGroup && !showAddUsers && users.length < 3 && !showSubmission ?
                                    <View style={{ marginHorizontal: 20, paddingTop: 5 }}>
                                        <Text>
                                            {loadedChatWithUser.fullName} {loadedChatWithUser.email ? ("(" + loadedChatWithUser.email + ")") : ''}
                                        </Text>
                                    </View> : null
                            }
                        </View>
                        {
                            showChat ? <View style={{ flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', flex: 1 }}>
                                <View style={{ backgroundColor: 'white' }}>
                                    <TouchableOpacity
                                        onPress={handleEnterMeeting}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 35,
                                            marginTop: 15,
                                            marginBottom: 20
                                        }}>
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: '#fff',
                                            fontSize: 12,
                                            backgroundColor: '#3289D0',
                                            paddingHorizontal: 20,
                                            fontFamily: 'inter',
                                            height: 35,
                                            width: 175,
                                            borderRadius: 15,
                                            textTransform: 'uppercase'
                                        }}>
                                            Join
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                                : null
                        }
                    </View>
                    :
                    <View style={{ backgroundColor: 'white', flexDirection: 'row', paddingBottom: 25, maxWidth: 500 }}>
                        {
                            props.cueId ?
                                null :
                                <Text
                                    ellipsizeMode="tail"
                                    style={{
                                        fontSize: 14,
                                        paddingBottom: 20,
                                        fontFamily: 'inter',
                                        // textTransform: "uppercase",
                                        // paddingLeft: 10,
                                        flex: 1,
                                        lineHeight: 25
                                    }}>
                                    {PreferredLanguageText('inbox')}
                                </Text>
                        }
                        {
                            !props.cueId && isOwner ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowNewGroup(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        marginRight: 20,
                                        color: '#3289D0',
                                        fontSize: 11,
                                    }}>
                                        NEW GROUP
                                    </Text>
                                </TouchableOpacity> : null
                        }
                        {/* {
                            isOwner && !props.cueId ?
                                <TouchableOpacity
                                    key={Math.random()}
                                    style={{
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowAddUsers(true)}>
                                    <Text style={{
                                        width: '100%',
                                        textAlign: 'right',
                                        lineHeight: 23,
                                        marginRight: 20,
                                        color: '#343A40',
                                        fontSize: 11,
                                    }}>
                                        ADD USERS
                                    </Text>
                                </TouchableOpacity> : null
                        } */}
                    </View>
            }
            {
                !showAddUsers ? (subscribers.length === 0 ?
                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                        <Text style={{ width: '100%', color: '#343A40', fontSize: 20, paddingTop: 50, paddingHorizontal: 5, fontFamily: 'inter', flex: 1, textAlign: 'center' }}>
                            {
                                props.cueId ? PreferredLanguageText('noStatuses') : PreferredLanguageText('noStudents')
                            }
                        </Text>
                    </View> :
                    <View style={{
                        width: '100%',
                        maxWidth: 1000,
                        // alignSelf: 'center',
                        backgroundColor: 'white',
                        flex: 1
                    }}
                        key={key}
                    >
                        {
                            !props.cueId || showSubmission ? null :
                                <View style={{
                                    width: '100%',
                                    height: 70,
                                    backgroundColor: 'white',
                                    // display: 'flex',
                                    // justifyContent: 'flex-start',
                                    // flex: 1,
                                    flexDirection: 'row',
                                    // maxWidth: 500,
                                    marginBottom: 0
                                }}>
                                    <label style={{ width: 150 }}>
                                        <Select
                                            touchUi={true}
                                            themeVariant="light"
                                            value={filterChoice}
                                            onChange={(val: any) => {
                                                setFilterChoice(val.value)
                                            }}
                                            responsive={{
                                                small: {
                                                    display: 'bubble'
                                                },
                                                medium: {
                                                    touchUi: false,
                                                }
                                            }}
                                            data={categories.map((category: any) => {
                                                return {
                                                    value: category,
                                                    text: category
                                                }
                                            })}
                                        />
                                    </label>
                                    {
                                        !showAddUsers && props.cue && props.cue.submission ?
                                            <View style={{ backgroundColor: 'white', flexDirection: 'row', height: 40, flex: 1, justifyContent: 'flex-end' }}>
                                                <View style={{
                                                    backgroundColor: 'white',
                                                    flexDirection: 'row'
                                                }}>
                                                    {
                                                        releaseSubmission ?
                                                            <TouchableOpacity
                                                                // value={releaseSubmission}
                                                                onPress={() => updateReleaseSubmission()}
                                                                style={{
                                                                    borderRadius: 15,
                                                                    backgroundColor: "white",
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        textAlign: "center",
                                                                        lineHeight: 35,
                                                                        color: "#3289D0",
                                                                        fontSize: 12,
                                                                        borderColor: "#3289D0",
                                                                        borderWidth: 1,
                                                                        borderRadius: 15,
                                                                        paddingHorizontal: 20,
                                                                        fontFamily: "inter",
                                                                        overflow: "hidden",
                                                                        height: 35,
                                                                        textTransform: "uppercase",
                                                                    }}
                                                                >
                                                                    Hide Grades
                                                                </Text>
                                                            </TouchableOpacity> :
                                                            <TouchableOpacity
                                                                // value={releaseSubmission}
                                                                onPress={() => updateReleaseSubmission()}
                                                                style={{
                                                                    borderRadius: 15,
                                                                    backgroundColor: "white",
                                                                }}
                                                            >
                                                                <Text
                                                                    style={{
                                                                        textAlign: "center",
                                                                        lineHeight: 35,
                                                                        color: "#3289D0",
                                                                        fontSize: 12,
                                                                        borderColor: "#3289D0",
                                                                        borderRadius: 15,
                                                                        backgroundColor: '#fff',
                                                                        borderWidth: 1,
                                                                        paddingHorizontal: 20,
                                                                        fontFamily: "inter",
                                                                        overflow: "hidden",
                                                                        height: 35,
                                                                        textTransform: "uppercase",
                                                                    }}
                                                                >
                                                                    Release Grades
                                                                </Text>
                                                            </TouchableOpacity>
                                                    }
                                                </View>
                                                {isQuiz ? <Text
                                                    style={{
                                                        textAlign: "center",
                                                        lineHeight: 35,
                                                        color: "#3289D0",
                                                        fontSize: 12,
                                                        borderColor: "#3289D0",
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        paddingHorizontal: 20,
                                                        fontFamily: "inter",
                                                        overflow: "hidden",
                                                        height: 35,
                                                        textTransform: "uppercase",
                                                        marginLeft: 20
                                                    }}
                                                    onPress={() => {
                                                        exportScores()
                                                    }}>
                                                    EXPORT
                                                </Text> : null}
                                            </View>
                                            : null
                                    }
                                </View>
                        }
                        {
                            !showSubmission ?
                                (
                                    showChat ?
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            keyboardDismissMode={'on-drag'}
                                            style={{ flex: 1, paddingTop: 12 }}>
                                            {
                                                messages.length === 0 ?
                                                    <Text style={{ width: '100%', color: '#343A40', fontSize: 20, paddingVertical: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                        {PreferredLanguageText('noMessages')}
                                                    </Text>
                                                    : null
                                            }
                                            {
                                                messages.map((message) => {
                                                    return <View style={{ width: '100%', maxWidth: 500, paddingBottom: 15, backgroundColor: 'white' }} key={Math.random()}>
                                                        <MessageCard
                                                            user={user}
                                                            message={message} />
                                                    </View>
                                                })
                                            }
                                            <View style={{ backgroundColor: 'white' }}>
                                                <NewMessage
                                                    cueId={props.cueId}
                                                    channelId={props.channelId}
                                                    parentId={null}
                                                    users={users}
                                                    back={() => {
                                                        props.reload()
                                                        setShowChat(false)
                                                        setIsLoadedUserInactive(false)
                                                        setLoadedChatWithUser({})
                                                    }}
                                                    placeholder={`${PreferredLanguageText('message')}...`}
                                                />
                                            </View>
                                        </ScrollView>
                                        :
                                        (
                                            showNewGroup ?
                                                <ScrollView
                                                    showsVerticalScrollIndicator={false}
                                                    keyboardDismissMode={'on-drag'}
                                                    style={{ flex: 1, paddingTop: 12 }}>
                                                    {/* <Text
                                                        ellipsizeMode="tail"
                                                        style={{ fontSize: 11, color: '#343A40', textTransform: 'uppercase' }}>
                                                        {PreferredLanguageText('newGroup')}
                                                    </Text> */}
                                                    <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll', marginBottom: 25 }}>
                                                        <View style={{ width: '90%', padding: 5, maxWidth: 500, minHeight: 200 }}>
                                                            {/* <Multiselect
                                                                placeholder='Select users'
                                                                displayValue='label'
                                                                // key={userDropdownOptions.toString()}
                                                                // style={{ width: '100%', color: '#16181C', 
                                                                //     optionContainer: { // To change css for option container 
                                                                //         zIndex: 9999
                                                                //     }
                                                                // }}
                                                                options={options} // Options to display in the dropdown
                                                                selectedValues={selected} // Preselected value to persist in dropdown
                                                                onSelect={(e, f) => {
                                                                    setSelected(e);
                                                                    return true
                                                                }} // Function will trigger on select event
                                                                onRemove={(e, f) => {
                                                                    setSelected(e);
                                                                    return true
                                                                }}
                                                            /> */}
                                                            <Select
                                                                themeVariant="light"
                                                                selectMultiple={true}
                                                                group={true}
                                                                groupLabel="&nbsp;"
                                                                inputClass="mobiscrollCustomMultiInput"
                                                                placeholder="Select..."
                                                                touchUi={true}
                                                                // minWidth={[60, 320]}
                                                                value={selected}
                                                                data={options}
                                                                onChange={(val: any) => {
                                                                    setSelected(val.value)
                                                                }}
                                                                responsive={{
                                                                    small: {
                                                                        display: 'bubble'
                                                                    },
                                                                    medium: {
                                                                        touchUi: false,
                                                                    }
                                                                }}
                                                                minWidth={[60, 320]}
                                                            // minWidth={[60, 320]}
                                                            />
                                                        </View>
                                                    </View>
                                                    <View style={{ backgroundColor: 'white' }}>
                                                        <NewMessage
                                                            cueId={props.cueId}
                                                            channelId={props.channelId}
                                                            parentId={null}
                                                            users={group}
                                                            addUserId={true}
                                                            back={() => {
                                                                props.reload()
                                                                setShowChat(false)
                                                                setIsLoadedUserInactive(false)
                                                                setLoadedChatWithUser({})
                                                                setShowNewGroup(false)
                                                            }}
                                                            placeholder={`${PreferredLanguageText('message')}...`}
                                                        />
                                                    </View>
                                                </ScrollView>
                                                : <ScrollView
                                                    showsVerticalScrollIndicator={false}
                                                    horizontal={false}
                                                    key={filterChoice + key}
                                                    contentContainerStyle={{
                                                        width: '100%',
                                                        borderRadius: 1,
                                                        borderWidth: 0,
                                                        borderColor: '#E7EBEE',
                                                        // maxHeight: props.cueId ? windowHeight - 00 : '100%',
                                                        // marginBottom: props.cueId ? 20 : 0,
                                                        maxWidth: 1000,
                                                        marginBottom: 50,
                                                        // alignSelf: 'center'
                                                    }}
                                                >
                                                    {
                                                        !props.cueId || props.cueId === '' ?
                                                            <View style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E7EBEE', marginBottom: 20 }}>
                                                                {
                                                                    props.groups.length > 0 ? (props.groups.map((group: any, index: any) => {
                                                                        let displayName = ''
                                                                        group.userNames.map((u: any) => { displayName += (u.displayName + ', ') })
                                                                        return <View style={styles.col} key={filterChoice + key + index}>
                                                                            <SubscriberCard
                                                                                chat={!props.cueId || props.cueId === '' ? true : false}
                                                                                fadeAnimation={props.fadeAnimation}
                                                                                subscriber={{
                                                                                    displayName,
                                                                                    fullName: 'Team',
                                                                                    unreadMessages: group.unreadMessages
                                                                                }}
                                                                                onPress={() => {
                                                                                    loadGroupChat(group.users, group._id)
                                                                                }}
                                                                                status={!props.cueId ? false : true}
                                                                            />
                                                                        </View>
                                                                    })) : <View style={{ backgroundColor: 'white', flex: 1 }}>
                                                                        <Text style={{ width: '100%', color: '#343A40', fontSize: 20, paddingHorizontal: 50, paddingBottom: 100, paddingTop: 50, fontFamily: 'inter', flex: 1 }}>
                                                                            {PreferredLanguageText('noGroups')}
                                                                        </Text>
                                                                    </View>
                                                                }
                                                            </View>
                                                            : null
                                                    }
                                                    {
                                                        filteredSubscribers.map((subscriber: any, index: any) => {
                                                            // if (subscr subscriber.fullName !== 'submitted' && subscriber.fullName !== 'read' && subscriber.fullName !== 'graded') {
                                                            //     return null
                                                            // }
                                                            console.log("Subscriber", subscriber)
                                                            return <TouchableOpacity
                                                                disabled={subscriber.fullName !== 'submitted' && subscriber.fullName !== 'graded'}
                                                                onPress={() => {
                                                                    if (props.cueId && props.cueId !== null) {
                                                                        if (subscriber.fullName === 'submitted' || subscriber.fullName === 'graded') {
                                                                            setSubmission(subscriber.submission)
                                                                            setSubmittedAt(subscriber.submittedAt)
                                                                            setDeadline(subscriber.deadline)
                                                                            setShowSubmission(true)
                                                                            setStatus(subscriber.fullName)
                                                                            setScore(subscriber.score ? subscriber.score.toString() : '0')
                                                                            setGraded(subscriber.graded)
                                                                            setComment(subscriber.comment)
                                                                            console.log(subscriber.comment)
                                                                            try {
                                                                                const comm = JSON.parse(subscriber.comment)
                                                                                setAnnotation(comm.annotation)
                                                                                setAnnotations(comm.annotations)
                                                                            } catch (e) {
                                                                                console.log('')
                                                                            }
                                                                            setUserId(subscriber.userId)
                                                                        }
                                                                    } else {
                                                                        loadChat(subscriber._id, subscriber.groupId)
                                                                    }
                                                                }}
                                                                style={{
                                                                    backgroundColor: '#fff',
                                                                    flexDirection: 'row',
                                                                    borderColor: '#E7EBEE',
                                                                    paddingVertical: 5,
                                                                    borderBottomWidth: index === filteredSubscribers.length - 1 ? 0 : 1,
                                                                    // minWidth: 600, // flex: 1,
                                                                    width: '100%',
                                                                }}>
                                                                <View style={{ backgroundColor: '#fff', padding: 5, }}>
                                                                    <Image
                                                                        style={{
                                                                            height: 35,
                                                                            width: 35,
                                                                            marginTop: 5,
                                                                            marginLeft: 5,
                                                                            marginBottom: 5,
                                                                            borderRadius: 75,
                                                                            // marginTop: 20,
                                                                            alignSelf: 'center'
                                                                        }}
                                                                        source={{ uri: subscriber.avatar ? subscriber.avatar : 'https://cues-files.s3.amazonaws.com/images/default.png' }}
                                                                    />
                                                                </View>
                                                                <View style={{ flex: 1, backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                    <Text style={{ fontSize: 15, padding: 5, fontFamily: 'inter', marginTop: 5 }} ellipsizeMode='tail'>
                                                                        {subscriber.displayName ? subscriber.displayName : ''}
                                                                    </Text>
                                                                    <Text style={{ fontSize: 12, padding: 5 }} ellipsizeMode='tail'>
                                                                        {subscriber.fullName === "delivered" || subscriber.fullName === "not-delivered" ? "delivered" : subscriber.fullName}
                                                                    </Text>
                                                                </View>
                                                                <View style={{ justifyContent: 'center', flexDirection: 'column' }}>
                                                                    <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingLeft: 10 }}>
                                                                        <Text style={{ fontSize: 11, padding: 5, color: '#3289D0', textAlign: 'center' }} ellipsizeMode='tail'>
                                                                            {
                                                                                subscriber.submittedAt && subscriber.submittedAt !== "" && subscriber.deadline && subscriber.deadline !== "" && subscriber.submittedAt >= subscriber.deadline ?
                                                                                    <Text style={{ color: '#f94144', fontSize: 12 }}>
                                                                                        LATE
                                                                                    </Text>
                                                                                    :
                                                                                    null
                                                                            } {subscriber.fullName === 'submitted' || subscriber.fullName === 'graded' ? <Ionicons name='chevron-forward-outline' size={15} /> : null}
                                                                        </Text>
                                                                    </View>
                                                                </View>

                                                            </TouchableOpacity>
                                                        })
                                                    }
                                                </ScrollView>)
                                ) :
                                // is Quiz then show the Quiz Grading Component and new version with problemScores
                                isQuiz && !isV0Quiz ?
                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        keyboardDismissMode={'on-drag'}
                                        contentContainerStyle={{
                                            // height: windowHeight - 132
                                        }}
                                        style={{ flex: 1, paddingTop: 12 }}>
                                        {
                                            submittedAt !== "" && deadline !== "" && new Date(submittedAt) >= new Date(parseInt(deadline)) ?
                                                <View style={{ width: '100%', }}>
                                                    <View style={{ borderRadius: 1, padding: 5, borderWidth: 1, borderColor: '#f94144', marginVertical: 10, width: 150, marginLeft: 'auto' }}>
                                                        <Text style={{ color: '#f94144', fontSize: 13, textAlign: 'center' }}>
                                                            LATE SUBMISSION
                                                        </Text>
                                                    </View>
                                                </View>
                                                :
                                                null
                                        }
                                        {
                                            <View style={{ width: 140, marginVertical: 20, marginLeft: 'auto' }}>
                                                <TouchableOpacity onPress={() => {
                                                    if (showSubmission) {
                                                        props.reloadStatuses()
                                                    }
                                                    setShowSubmission(false)
                                                    setStatus("")
                                                    setScore("0")
                                                    setUserId("")
                                                }
                                                }
                                                    style={{
                                                        backgroundColor: "white", borderRadius: 15, marginLeft: 15,
                                                        marginTop: 5,
                                                    }}>
                                                    <Text style={{
                                                        textAlign: "center",
                                                        lineHeight: 35,
                                                        color: '#3289D0',
                                                        fontSize: 12,
                                                        borderWidth: 1,
                                                        borderColor: '#3289D0',
                                                        paddingHorizontal: 20,
                                                        fontFamily: "inter",
                                                        height: 35,
                                                        // paddingTop: 2
                                                        // width: 125,
                                                        borderRadius: 15,
                                                        textTransform: "uppercase"
                                                    }}>
                                                        CANCEL
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
                                            isV1Quiz={isV1Quiz}
                                            onChangeQuizAttempt={(attempt: number) => {

                                                setCurrentQuizAttempt(attempt);

                                                quizAttempts.map((att: any, index: number) => {
                                                    if (index === attempt) {
                                                        setQuizSolutions(att)
                                                        setGraded(att.isFullyGraded)
                                                        setInitiatedAt(att.initiatedAt)
                                                    }
                                                })
                                            }}
                                        />
                                    </ScrollView>
                                    :
                                    <View>
                                        <ScrollView
                                            showsVerticalScrollIndicator={false}
                                            keyboardDismissMode={'on-drag'}
                                            contentContainerStyle={{
                                                // height: windowHeight - 132
                                            }}
                                            style={{ flex: 1, paddingTop: 12 }}>
                                            {
                                                submittedAt !== "" && deadline !== "" && submittedAt >= deadline ?
                                                    <View style={{ width: '100%', marginBottom: 30 }}>
                                                        <View style={{ borderRadius: 1, padding: 5, borderWidth: 1, borderColor: '#f94144', marginVertical: 10, width: 150, marginLeft: 'auto' }}>
                                                            <Text style={{ color: '#f94144', fontSize: 13, textAlign: 'center' }}>
                                                                LATE SUBMISSION
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    :
                                                    null
                                            }
                                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                                <View style={{
                                                    flex: 1
                                                }}>
                                                    <TextInput
                                                        value={score}
                                                        style={{
                                                            width: 120,
                                                            borderBottomColor: '#E7EBEE',
                                                            borderBottomWidth: 1,
                                                            fontSize: 14,
                                                            // paddingTop: 13,
                                                            paddingBottom: 13,
                                                            marginTop: 0,
                                                            marginBottom: 20
                                                        }}
                                                        placeholder={'Score (0-100)'}
                                                        onChangeText={val => setScore(val)}
                                                        placeholderTextColor={'#343A40'}
                                                    />
                                                </View>
                                                <View
                                                    style={{
                                                        backgroundColor: "white",
                                                        flexDirection: "row",
                                                    }}>
                                                    <TouchableOpacity
                                                        onPress={() => handleGradeSubmit()} style={{
                                                            backgroundColor: "white",
                                                            overflow: "hidden",
                                                            height: 35,
                                                            marginTop: 5
                                                            // marginBottom: 20
                                                        }}>
                                                        <Text
                                                            style={{
                                                                textAlign: "center",
                                                                lineHeight: 35,
                                                                backgroundColor: '#3289D0',
                                                                fontSize: 12,
                                                                color: '#fff',
                                                                // borderWidth: 1,
                                                                // borderColor: '#3289D0',
                                                                paddingHorizontal: 20,
                                                                fontFamily: "inter",
                                                                height: 35,
                                                                // paddingTop: 2
                                                                // width: 125,
                                                                borderRadius: 15,
                                                                textTransform: "uppercase"
                                                            }}>
                                                            SAVE
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity onPress={() => {
                                                        if (showChat) {
                                                            setShowChat(false)
                                                            setIsLoadedUserInactive(false)
                                                            setLoadedChatWithUser({})
                                                            setUsers([])
                                                            props.reload()
                                                        } else {
                                                            if (showSubmission) {
                                                                props.reloadStatuses()
                                                            }
                                                            setShowSubmission(false)
                                                            setStatus("")
                                                            setScore("0")
                                                            setUserId("")
                                                        }
                                                        setShowAddUsers(false)
                                                        setShowNewGroup(false)
                                                    }} style={{
                                                        backgroundColor: "white", borderRadius: 15, marginLeft: 15,
                                                        marginTop: 5,
                                                    }}>
                                                        <Text style={{
                                                            textAlign: "center",
                                                            lineHeight: 35,
                                                            color: '#3289D0',
                                                            fontSize: 12,
                                                            borderWidth: 1,
                                                            borderColor: '#3289D0',
                                                            paddingHorizontal: 20,
                                                            fontFamily: "inter",
                                                            height: 35,
                                                            // paddingTop: 2
                                                            // width: 125,
                                                            borderRadius: 15,
                                                            textTransform: "uppercase"
                                                        }}>
                                                            CANCEL
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <View style={{ flexDirection: 'row' }}>
                                                {
                                                    imported && !isQuiz ?
                                                        <View style={{ flex: 1 }}>
                                                            <TextInput
                                                                editable={false}
                                                                value={title}
                                                                style={styles.input}
                                                                placeholder={'Title'}
                                                                onChangeText={val => setTitle(val)}
                                                                placeholderTextColor={'#343A40'}
                                                            />
                                                        </View> : null
                                                }
                                                <View style={{ flexDirection: 'row', paddingTop: 20 }}>
                                                    <Ionicons name='checkmark-outline' size={22} color={"#53BE68"} />
                                                    <Text style={{ fontSize: 14, paddingLeft: 5, lineHeight: 35 }}>
                                                        Turned In at {moment(new Date(parseInt(submittedAt))).format('MMMM Do, h:mm a')}
                                                    </Text>
                                                </View>
                                            </View>
                                            {
                                                isQuiz && Object.keys(quizSolutions).length > 0 ?
                                                    renderQuizSubmissions() : null
                                            }
                                            {submissionAttempts.length > 0 && !isQuiz ? renderViewSubmission() : null}
                                            {/* Old Schema */}
                                            {
                                                submissionAttempts.length > 0 ? null : !imported && !isQuiz ?
                                                    <View style={{ position: 'relative', flex: 1, overflow: 'scroll', height: 20000 }}>
                                                        <View style={{ position: 'absolute', zIndex: 1, width: 800, height: 20000 }}>
                                                            <RichEditor
                                                                disabled={true}
                                                                key={Math.random()}
                                                                containerStyle={{
                                                                    backgroundColor: '#E7EBEE',
                                                                    padding: 3,
                                                                    paddingTop: 5,
                                                                    paddingBottom: 10,
                                                                    borderRadius: 15,
                                                                }}
                                                                ref={RichText}
                                                                style={{
                                                                    width: '100%',
                                                                    backgroundColor: '#E7EBEE',
                                                                    borderRadius: 15,
                                                                    height: 20000
                                                                }}
                                                                editorStyle={{
                                                                    backgroundColor: '#E7EBEE',
                                                                    placeholderColor: '#343A40',
                                                                    color: '#16181C',
                                                                    contentCSSText: 'font-size: 13px;'
                                                                }}
                                                                initialContentHTML={submission}
                                                                placeholder={"Title"}
                                                                onChange={(text) => { }}
                                                                allowFileAccess={true}
                                                                allowFileAccessFromFileURLs={true}
                                                                allowUniversalAccessFromFileURLs={true}
                                                                allowsFullscreenVideo={true}
                                                                allowsInlineMediaPlayback={true}
                                                                allowsLinkPreview={true}
                                                                allowsBackForwardNavigationGestures={true}
                                                            />
                                                        </View>
                                                        <View style={{ position: 'absolute', zIndex: 1, flex: 1, width: 800, height: 20000, backgroundColor: 'rgb(0,0,0,0)' }}>
                                                            <Annotation
                                                                style={{ resizeMode: 'cover', width: '100%', height: '100%', backgroundColor: 'rgb(0,0,0,0)', background: 'none' }}
                                                                src={require('./default-images/transparent.png')}
                                                                annotations={annotations}
                                                                // type={this.state.type}
                                                                value={annotation}
                                                                onChange={(e: any) => setAnnotation(e)}
                                                                onSubmit={onSubmit}
                                                            />
                                                        </View>
                                                    </View>
                                                    : (
                                                        <View style={{
                                                            width: '100%',
                                                            minHeight: 500,
                                                            backgroundColor: 'white'
                                                        }}
                                                        >
                                                            {
                                                                (
                                                                    type === "mp4" ||
                                                                        type === "oga" ||
                                                                        type === "mov" ||
                                                                        type === "wmv" ||
                                                                        type === "mp3" ||
                                                                        type === "mov" ||
                                                                        type === "mpeg" ||
                                                                        type === "mp2" ||
                                                                        type === "wav" ?
                                                                        <ReactPlayer url={url} controls={true} />
                                                                        :
                                                                        (!isQuiz ? <View
                                                                            key={url}
                                                                            style={{ flex: 1 }}
                                                                        >
                                                                            <View style={{ position: 'relative', flex: 1, height: 800 }}>
                                                                                <View style={{ position: 'absolute', zIndex: 1, width: '100%' }}>
                                                                                    {/* <Webview
                                                                                        key={url}
                                                                                        url={url}
                                                                                        fullScreen={true}
                                                                                    /> */}
                                                                                    <div className="webviewer" ref={RichText} style={{ height: Dimensions.get('window').width < 1024 ? "50vh" : "70vh", borderWidth: 1, borderColor: '#E7EBEE', borderRadius: 1 }}></div>
                                                                                </View>
                                                                                {/* <View style={{ position: 'absolute', zIndex: 1, flex: 1, width: 800, height: 20000, backgroundColor: 'rgb(0,0,0,0)' }}>
                                                                                    <Annotation
                                                                                        style={{ resizeMode: 'cover', width: '100%', height: '100%', backgroundColor: 'rgb(0,0,0,0)', background: 'none' }}
                                                                                        src={require('./default-images/transparent.png')}
                                                                                        annotations={annotations}
                                                                                        // type={this.state.type}
                                                                                        value={annotation}
                                                                                        onChange={(e: any) => setAnnotation(e)}
                                                                                        onSubmit={onSubmit}
                                                                                    />
                                                                                </View> */}
                                                                            </View>
                                                                        </View> : null)
                                                                )
                                                            }
                                                        </View>
                                                    )
                                            }
                                        </ScrollView>
                                    </View>
                        }
                    </View>) :
                    <View style={{ width: 500, maxWidth: '100%' }}>
                        <Text style={{ color: '#16181C', fontSize: 14, paddingBottom: 10 }}>
                            {PreferredLanguageText('inviteByEmail')}
                        </Text>
                        <TextInput
                            value={emails}
                            style={{
                                height: 200,
                                backgroundColor: '#E7EBEE',
                                borderRadius: 1,
                                fontSize: 14,
                                padding: 15,
                                paddingTop: 13,
                                paddingBottom: 13,
                                marginTop: 5,
                                marginBottom: 20
                            }}
                            placeholder={'Enter one email per line.'}
                            onChangeText={val => setEmails(val)}
                            placeholderTextColor={'#343A40'}
                            multiline={true}
                        />
                        <TouchableOpacity
                            onPress={() => submitEmails()}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                marginTop: 15,
                                width: '100%',
                                justifyContent: 'center', flexDirection: 'row',
                                marginBottom: 50
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#16181C',
                                fontSize: 12,
                                backgroundColor: '#E7EBEE',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                width: 150,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                {PreferredLanguageText("addUsers")}
                            </Text>
                        </TouchableOpacity>

                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: '#16181C',
                            fontSize: 12,
                            paddingHorizontal: 20,
                            width: "100%",
                            fontFamily: 'inter',
                            borderRadius: 15,
                            textTransform: 'uppercase'
                        }}>
                            {filteredSubscribers.length !== 0 ? PreferredLanguageText('existingUsers') : PreferredLanguageText('noExistingUsers')}
                        </Text>
                        <View style={{ display: "flex", flexDirection: 'column', alignItems: 'center' }}>
                            {
                                filteredSubscribers.map((sub: any) => {
                                    return (<View style={{
                                        backgroundColor: '#E7EBEE',
                                        width: '100%',
                                        padding: 10,
                                        borderRadius: 8,
                                        marginBottom: 10
                                    }}>
                                        <Text>
                                            {sub.fullName}
                                        </Text>
                                        <Text>
                                            {sub.email}
                                        </Text>
                                    </View>)
                                })
                            }
                        </View>

                    </View>
            }
        </View >
    );
}

export default React.memo(SubscribersList, (prev, next) => {
    return _.isEqual(prev.threads, next.threads)
})


const styleObject = () => {
    return StyleSheet.create({
        screen: {
            flex: 1
        },
        margin: {
            height: 20,
            backgroundColor: 'white'
        },
        marginSmall: {
            height: 10,
            backgroundColor: 'white'
        },
        row: {
            flexDirection: 'row',
            display: 'flex',
            width: '100%',
            backgroundColor: 'white'
        },
        col: {
            width: '100%',
            height: 70,
            marginBottom: 15,
            // flex: 1,
            backgroundColor: 'white'
        },
        channelText: {
            textAlign: 'center',
            overflow: 'hidden'
        },
        input: {
            width: '100%',
            borderBottomColor: '#E7EBEE',
            borderBottomWidth: 1,
            fontSize: 14,
            paddingTop: 13,
            paddingBottom: 13,
            marginTop: 5,
            marginBottom: 20
        },
        outline: {
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#343A40',
            color: 'white'
        },
        cusCategory: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22
        },
        cusCategoryOutline: {
            fontSize: 14,
            backgroundColor: 'white',
            paddingHorizontal: 10,
            height: 22,
            borderRadius: 1,
            borderWidth: 1,
            borderColor: '#343A40',
            color: 'white'
        },
        all: {
            fontSize: 14,
            color: '#16181C',
            height: 24,
            paddingHorizontal: 15,
            backgroundColor: '#E7EBEE',
            lineHeight: 24,
            fontFamily: 'inter',
            // textTransform: 'uppercase'
        },
        allGrayFill: {
            fontSize: 14,
            color: '#fff',
            paddingHorizontal: 15,
            borderRadius: 12,
            backgroundColor: '#16181C',
            lineHeight: 24,
            height: 24,
            fontFamily: 'inter',
            // textTransform: 'uppercase'
        },
    })
}
