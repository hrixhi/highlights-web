import React, { useCallback, useEffect, useState, useRef } from "react";
import { Keyboard, StyleSheet, Switch, TextInput, Dimensions, ScrollView, Animated } from "react-native";
import Alert from "../components/Alert";
import { Text, View, TouchableOpacity } from "./Themed";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Datetime from "react-datetime";
import { timedFrequencyOptions } from "../helpers/FrequencyOptions";
import { fetchAPI } from "../graphql/FetchAPI";
import Annotation from 'react-image-annotation'
import {
    createCue,
    deleteCue,
    deleteForEveryone,
    getChannelCategories,
    getChannels,
    getQuiz,
    getSharedWith,
    markAsRead,
    shareCueWithMoreIds,
    start,
    submit,
    modifyQuiz,
    findBySchoolId,
    getRole,
    getOrganisation
} from "../graphql/QueriesAndMutations";
import * as ImagePicker from "expo-image-picker";
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import FileUpload from "./UploadFiles";
import { Collapse } from "react-collapse";
import Quiz from "./Quiz";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import TeXToSVG from "tex-to-svg";
import EquationEditor from "equation-editor-react";
// import WebView from "react-native-webview";
import { PreferredLanguageText } from "../helpers/LanguageContext";
import moment from "moment";
import ReactPlayer from "react-player";
import Webview from './Webview'
import QuizGrading from './QuizGrading';
import { DatePicker } from 'rsuite';
import Multiselect from 'multiselect-react-dropdown';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

import WebViewer from '@pdftron/pdfjs-express';
import TextareaAutosize from 'react-textarea-autosize';
import lodash from 'lodash';
import { Editor } from '@tinymce/tinymce-react';
import parser from 'html-react-parser';
import Select from 'react-select';
import { Datepicker as MobiscrollDatePicker } from "@mobiscroll/react5";
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
// import '@mobiscroll/react5/dist/css/mobiscroll.min.css';
import mobiscroll, { Form as MobiscrollForm, FormGroup, Button as MobiscrollButton, Select as MobiscrollSelect, Input, FormGroupTitle } from '@mobiscroll/react'
import FormulaGuide from './FormulaGuide';
import { handleFile } from '../helpers/FileUpload';


const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const current = new Date();
    const [cue, setCue] = useState(props.cue.cue);
    const [initialSubmissionDraft, setInitialSubmissionDraft] = useState('');
    const [shuffle, setShuffle] = useState(props.cue.shuffle);
    const [starred, setStarred] = useState(props.cue.starred);
    const [color, setColor] = useState(props.cue.color);
    const [notify, setNotify] = useState(props.cue.frequency !== "0" ? true : false);
    const [frequency, setFrequency] = useState(props.cue.frequency);
    const [customCategory, setCustomCategory] = useState("None");
    const [customCategories, setCustomCategories] = useState<any[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([])
    const [initializedCustomCategories, setInitializedCustomCategories] = useState(false);
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [markedAsRead, setMarkedAsRead] = useState(false);
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [isOwner, setIsOwner] = useState(false);
    const [annotation, setAnnotation] = useState<any>({})
    const [annotations, setAnnotations] = useState<any[]>([])
    const stopPlay =
        props.cue.endPlayAt && props.cue.endPlayAt !== ""
            ? props.cue.endPlayAt === "Invalid Date"
                ? new Date(current.getTime() + 1000 * 60 * 60)
                : new Date(props.cue.endPlayAt)
            : new Date(current.getTime() + 1000 * 60 * 60);
    const [endPlayAt, setEndPlayAt] = useState<Date>(stopPlay);
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(
        props.cue.endPlayAt && props.cue.endPlayAt !== "" ? false : true
    );
    const now = new Date(props.cue.date);
    const RichText: any = useRef();
    const editorRef: any = useRef();
    const submissionViewerRef: any = useRef();

    const [height, setHeight] = useState(100);
    const colorChoices: any[] = ["#f94144", "#f3722c", "#f8961e", "#f9c74f", "#35AC78"].reverse();
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false);
    const [limitedShares, setLimitedShares] = useState(props.cue.limitedShares ? props.cue.limitedShares : false)
    const [frequencyName, setFrequencyName] = useState('Day')
    const dead =
        props.cue.deadline && props.cue.deadline !== ""
            ? props.cue.deadline === "Invalid Date"
                ? new Date(current.getTime() + 1000 * 60 * 60 * 24)
                : new Date(props.cue.deadline)
            : new Date(current.getTime() + 1000 * 60 * 60 * 24);

    const initiate =
        props.cue.initiateAt && props.cue.initiateAt !== ""
            ? props.cue.initiateAt === "Invalid Date"
                ? new Date()
                : new Date(props.cue.initiateAt)
            : new Date();

    const until =
        props.cue.availableUntil && props.cue.availableUntil !== ""
            ? props.cue.availableUntil === "Invalid Date"
                ? new Date(current.getTime() + 1000 * 60 * 60 * 48)
                : new Date(props.cue.availableUntil)
            : new Date(current.getTime() + 1000 * 60 * 60 * 48)

    const [allowLateSubmission, setAllowLateSubmission] = useState(props.cue.availableUntil && props.cue.availableUntil !== "");
    // By default one day after deadline
    const [availableUntil, setAvailableUntil] = useState<Date>(until);

    const [deadline, setDeadline] = useState<Date>(dead);
    const [initiateAt, setInitiateAt] = useState<Date>(initiate)
    const [gradeWeight, setGradeWeight] = useState<any>(props.cue.gradeWeight ? props.cue.gradeWeight : 0);
    const [score] = useState<any>(props.cue.score ? props.cue.score : 0);
    const [graded, setGraded] = useState(props.cue.gradeWeight && props.cue.gradeWeight !== 0 ? true : false);
    const currentDate = new Date();
    const [submitted, setSubmitted] = useState(false);
    const [userSetupComplete, setUserSetupComplete] = useState(false);
    const [imported, setImported] = useState(false);
    const [url, setUrl] = useState("");
    const [type, setType] = useState("");
    const [title, setTitle] = useState("");
    const [submissionImported, setSubmissionImported] = useState(false);
    const [submissionUrl, setSubmissionUrl] = useState("");
    const [submissionType, setSubmissionType] = useState("");
    const [submissionTitle, setSubmissionTitle] = useState("");
    const [key, setKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [shareWithChannelId, setShareWithChannelId] = useState("None");
    const [selected, setSelected] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [expandMenu] = useState(false);
    const [original, setOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original)
    const [initialOriginal, setInitialOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original)
    const [comment] = useState(props.cue.comment)
    const [shareWithChannelName, setShareWithChannelName] = useState('')
    const [unlimitedAttempts, setUnlimitedAttempts] = useState(!props.cue.allowedAttempts)
    const [allowedAttempts, setAllowedAttemps] = useState(!props.cue.allowedAttempts ? "" : props.cue.allowedAttempts.toString())
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([])
    const [submissionDraft, setSubmissionDraft] = useState('')
    const [updatingCueContent, setUpdatingCueContent] = useState(false);
    const [updatingCueDetails, setUpdatingCueDetails] = useState(false);
    // const [viewSubmission, setViewSubmission] = useState(props.cue.graded && props.cue.releaseSubmission);
    const [viewSubmission, setViewSubmission] = useState(true);
    const [viewSubmissionTab, setViewSubmissionTab] = useState('instructorAnnotations');
    const [quizAttempts, setQuizAttempts] = useState<any[]>([])
    const [remainingAttempts, setRemainingAttempts] = useState<any>(null)

    // QUIZ OPTIONS
    const [isQuiz, setIsQuiz] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [unmodifiedProblems, setUnmodifiedProblems] = useState<any[]>([]);
    const [totalQuizPoints, setTotalQuizPoints] = useState(0);
    const [solutions, setSolutions] = useState<any[]>([]);
    const [quizId, setQuizId] = useState("");
    const [loading, setLoading] = useState(true);
    const [fetchingQuiz, setFetchingQuiz] = useState(false);
    const [initiatedAt, setInitiatedAt] = useState<any>(null);
    const [isQuizTimed, setIsQuizTimed] = useState(false);
    const [duration, setDuration] = useState(0);
    const [initDuration, setInitDuration] = useState(0);
    const [equation, setEquation] = useState("y = x + 1");
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [headers, setHeaders] = useState({})
    const [cueGraded] = useState(props.cue.graded);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [isV0Quiz, setIsV0Quiz] = useState(false);
    const [loadingAfterModifyingQuiz, setLoadingAfterModifyingQuiz] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showFormulaGuide, setShowFormulaGuide] = useState(false);


    const insertEquation = useCallback(() => {
        let currentContent = editorRef.current.getContent();

        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        currentContent += '<div contenteditable="false" style="display: inline-block">' + SVGEquation + "<br/></div>";

        editorRef.current.setContent(currentContent)
        setShowEquationEditor(false);
        setEquation("");

        // setReloadEditorKey(Math.random())
    }, [equation, RichText, RichText.current, cue]);

    const diff_seconds = (dt2: any, dt1: any) => {
        var diff = (dt2.getTime() - dt1.getTime()) / 1000;
        return Math.abs(Math.round(diff));
    };
    // ALERTS
    const unableToStartQuizAlert = PreferredLanguageText("unableToStartQuiz");
    const deadlineHasPassedAlert = PreferredLanguageText("deadlineHasPassed");
    const enterTitleAlert = PreferredLanguageText("enterTitle");
    const cueDeletedAlert = PreferredLanguageText("cueDeleted");
    const submissionFailedAlert = PreferredLanguageText("submissionFailed");
    const ifYouStartTimedQuizAlert = PreferredLanguageText("ifYouStartTimedQuiz");
    const submissionCompleteAlert = PreferredLanguageText("submissionComplete");
    const tryAgainLaterAlert = PreferredLanguageText("tryAgainLater");
    const somethingWentWrongAlert = PreferredLanguageText("somethingWentWrong");
    const clearQuestionAlert = PreferredLanguageText("clearQuestion");
    const cannotUndoAlert = PreferredLanguageText("cannotUndo");
    const sharedAlert = PreferredLanguageText("sharedAlert");
    const checkConnectionAlert = PreferredLanguageText("checkConnection");

    const [role, setRole] = useState('')
    const [school, setSchool] = useState<any>(null)
    const [otherChannels, setOtherChannels] = useState<any[]>([])
    const [channelOwners, setChannelOwners] = useState<any[]>([])
    const [selectedChannelOwner, setSelectedChannelOwner] = useState<any>(undefined)
    const [userId, setUserId] = useState('')

    const fillMissingProblemsAlert = PreferredLanguageText("fillMissingProblems");
    const enterNumericPointsAlert = PreferredLanguageText("enterNumericPoints");
    // const mustHaveOneOptionAlert = PreferredLanguageText('mustHaveOneOption')
    const fillMissingOptionsAlert = PreferredLanguageText("fillMissingOptions");
    const eachOptionOneCorrectAlert = PreferredLanguageText(
        "eachOptionOneCorrect"
    );

    const loadUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            setUserId(parsedUser._id)
            const server = fetchAPI('')
            server.query({
                query: getOrganisation,
                variables: {
                    userId: parsedUser._id
                }
            }).then(res => {
                if (res.data && res.data.school.findByUserId) {
                    setSchool(res.data.school.findByUserId)
                }
            })
            server.query({
                query: getRole,
                variables: {
                    userId: parsedUser._id
                }
            }).then(res => {
                if (res.data && res.data.user.getRole) {
                    setRole(res.data.user.getRole)
                }
            })
        }
    }, [])

    useEffect(() => {
        loadUser()
    }, [])

    useEffect(() => {
        if (role === 'instructor' && school) {
            const server = fetchAPI('')
            server.query({
                query: findBySchoolId,
                variables: {
                    schoolId: school._id
                }
            }).then((res: any) => {
                if (res.data && res.data.channel.findBySchoolId) {
                    res.data.channel.findBySchoolId.sort((a, b) => {
                        if (a.name < b.name) { return -1; }
                        if (a.name > b.name) { return 1; }
                        return 0;
                    })
                    const c = res.data.channel.findBySchoolId.filter((item: any) => {
                        return item.createdBy.toString().trim() !== userId.toString().trim()
                    })
                    setOtherChannels(c)
                    const otherChannelOwnersMap: any = {}
                    const otherChannelOwners: any[] = []
                    c.map((channel: any) => {
                        if (!otherChannelOwnersMap[channel.createdBy]) {
                            otherChannelOwnersMap[channel.createdBy] = channel.createdByUsername
                        }
                    })
                    Object.keys(otherChannelOwnersMap).map((key: any) => {
                        otherChannelOwners.push({
                            id: key,
                            name: otherChannelOwnersMap[key]
                        })
                    })
                    setChannelOwners(otherChannelOwners)
                }
            })
        }
    }, [role, school, userId])

    // ON INIT = LOAD CHANNEL RELATED CONTENT
    useEffect(() => {
        loadChannelsAndSharedWith();
    }, []);

    const onSubmit = useCallback((ann: any) => {
    }, [annotations])

    useEffect(() => {
        try {
            const comm = JSON.parse(props.cue.comment)
            setAnnotation(comm.annotation)
            setAnnotations(comm.annotations)
        } catch (e) {
            console.log(e)
        }
    }, [])

    // Loading categories like this due to Mobiscroll Select bug
    useEffect(() => {
        let options = [{
            value: 'None', text: 'None'
        }];

        customCategories.map((category: any) => {
            options.push({
                value: category,
                text: category
            })
        })

        setCategoryOptions(options)
    }, [customCategories])

    useEffect(() => {
        if (props.cue.customCategory === "") {
            setCustomCategory("None")
            return;
        }

        setCustomCategory(props.cue.customCategory)

    }, [props.cue])

    useEffect(() => {


        if (submissionAttempts && submissionAttempts.length > 0 && submissionViewerRef && submissionViewerRef.current) {
            const attempt = submissionAttempts[submissionAttempts.length - 1];

            let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: decodeURIComponent(url),
                },
                submissionViewerRef.current,
            ).then(async (instance) => {
                const { documentViewer, annotationManager } = instance.Core;

                const u = await AsyncStorage.getItem("user");

                let user: any;

                if (u) {
                    user = JSON.parse(u);
                    annotationManager.setCurrentUser(user.fullName)
                }

                documentViewer.addEventListener('documentLoaded', async () => {
                    // perform document operations

                    const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                    const xfdfString = currAttempt.annotations;

                    if (xfdfString !== "") {
                        annotationManager.importAnnotations(xfdfString).then((annotations: any) => {

                            annotations.forEach((annotation: any) => {

                                // Hide instructor annotations until grades are released
                                if (!props.cue.releaseSubmission && annotation.Author !== user.fullName) {
                                    annotationManager.hideAnnotation(annotation);
                                } else {
                                    annotationManager.redrawAnnotation(annotation);
                                }


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

                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem("cues");
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) { }

                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }

                    const currCue = subCues[props.cueKey][props.cueIndex]

                    const currCueValue = currCue.cue;

                    const obj = JSON.parse(currCueValue);

                    const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                    currAttempt.annotations = xfdfString;

                    const allAttempts = [...obj.attempts];

                    allAttempts[allAttempts.length - 1] = currAttempt;

                    const updateCue = {
                        attempts: allAttempts,
                        submissionDraft: obj.submissionDraft
                    }

                    const saveCue = {
                        ...currCue,
                        cue: JSON.stringify(updateCue),
                    }

                    subCues[props.cueKey][props.cueIndex] = saveCue;

                    const stringifiedCues = JSON.stringify(subCues);
                    await AsyncStorage.setItem("cues", stringifiedCues);
                    props.reloadCueListAfterUpdate();

                });

                // you can now call WebViewer APIs here...
                // documentViewer.addEventListener('documentLoaded', () => {
                //     // perform document operations
                // });
            });
        }

    }, [viewSubmission, submissionViewerRef, submissionViewerRef.current, viewSubmissionTab, submissionAttempts, props.showOriginal])

    // Used to detect ongoing quiz and
    useEffect(() => {
        if (!isQuizTimed || initiatedAt === null || initiatedAt === "" || isOwner) {
            // not a timed quiz or its not been initiated
            return;
        }
        let now = new Date();
        now.setMinutes(now.getMinutes() - 1);
        let current = new Date();
        if ((!allowLateSubmission && now >= deadline) || (allowLateSubmission && now >= availableUntil)) {
            // deadline crossed or late submission over
            return;
        }
        if (duration === 0) {
            return;
        }
        const remainingTime = duration - diff_seconds(initiatedAt, current);
        if (remainingTime <= 0) {
            // Submit quiz when time runs out 
            submitQuizEndTime();
        } else {
            setInitDuration(remainingTime); // set remaining duration in seconds
        }
    }, [initiatedAt, duration, deadline, isQuizTimed, isOwner, allowLateSubmission, availableUntil]);

    // Loads all the channel categories and list of people cue has been shared with
    const loadChannelsAndSharedWith = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem("user");
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI("");

            if (props.channelId) {
                server
                    .query({
                        query: getChannelCategories,
                        variables: {
                            channelId: props.channelId
                        }
                    })
                    .then(res => {
                        if (res.data.channel && res.data.channel.getChannelCategories) {
                            setCustomCategories(res.data.channel.getChannelCategories);
                            setInitializedCustomCategories(true)
                        }
                    })
                    .catch(err => { });
            } else {
                setCustomCategories(props.customCategories)
                setInitializedCustomCategories(true)
            }


            server
                .query({
                    query: getChannels,
                    variables: {
                        userId: user._id
                    }
                })
                .then(res => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId);
                    }
                })
                .catch(err => { });
            if (props.channelOwner && props.cue.channelId && props.cue.channelId !== "") {
                // owner
                server
                    .query({
                        query: getSharedWith,
                        variables: {
                            channelId: props.cue.channelId,
                            cueId: props.cue._id
                        }
                    })
                    .then((res: any) => {
                        if (res.data && res.data.cue.getSharedWith) {

                            const format = res.data.cue.getSharedWith.map((sub: any) => {
                                return {
                                    value: sub.value,
                                    label: sub.label,
                                    isFixed: sub.isFixed,
                                    visited: sub.isFixed,
                                }
                            });

                            const subscriberwithoutOwner: any = [];
                            format.map((i: any) => {
                                if (user._id !== i.value) {
                                    subscriberwithoutOwner.push(i);
                                }
                            });

                            setSubscribers(subscriberwithoutOwner);
                            // clear selected
                            const sel = res.data.cue.getSharedWith.filter((item: any) => {
                                return item.isFixed;
                            });

                            const formatSel = sel.map((sub: any) => {
                                return {
                                    value: sub.value,
                                    label: sub.label,
                                    isFixed: true,
                                    visited: true,
                                }
                            })

                            const withoutOwner: any = [];
                            formatSel.map((i: any) => {
                                if (user._id !== i.value) {
                                    withoutOwner.push(i);
                                }
                            });
                            setSelected(withoutOwner);
                        }
                    })
                    .catch((err: any) => console.log(err));
            }
        }
    }, [props.cue, props.channelId]);


    const reactSelectStyles = {
        multiValue: (base: any, state: any) => {
            return { ...base, backgroundColor: '#0096Fb', borderRadius: 11 }
        },
        multiValueLabel: (base: any, state: any) => {
            return state.data.isFixed
                ? { ...base, fontWeight: 'bold', color: 'white', paddingRight: 6 }
                : { ...base, color: 'white' };
        },
        multiValueRemove: (base: any, state: any) => {
            return state.data.isFixed ? { ...base, display: 'none' } : base;
        },
    };

    // If cue contains a Quiz, then need to fetch the quiz and set State
    useEffect(() => {

        if (props.cue.channelId && props.cue.channelId !== "") {
            const data1 = original;
            const data2 = props.cue.cue;
            if (data2 && data2[0] && data2[0] === "{" && data2[data2.length - 1] === "}") {
                const obj = JSON.parse(data2);

                // V1: Modified with addition of multiple submission attempts
                // This is old schema
                if (obj.url !== undefined && obj.title !== undefined && obj.type !== undefined) {
                    setSubmissionImported(true);
                    setSubmissionUrl(obj.url);
                    setSubmissionType(obj.type);
                    if (loading) {
                        setSubmissionTitle(obj.title);
                    }
                }

            } else {
                setSubmissionImported(false);
                setSubmissionUrl("");
                setSubmissionType("");
                setSubmissionTitle("");
            }
            if (data1 && data1[0] && data1[0] === "{" && data1[data1.length - 1] === "}") {
                const obj = JSON.parse(data1);
                if (obj.quizId) {
                    if (!loading) {
                        return;
                    }
                    setFetchingQuiz(true)
                    // if (isQuiz) {
                    //     return;
                    // }
                    // setShowOptions(true);
                    // load quiz here and set problems
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

                                setQuizId(obj.quizId);

                                const solutionsObject = cue ? JSON.parse(cue) : {};
                                if (solutionsObject.solutions) {
                                    setSolutions(solutionsObject.solutions);
                                    setQuizSolutions(solutionsObject);
                                }

                                if (solutionsObject.initiatedAt && solutionsObject.initiatedAt !== "") {
                                    const init = new Date(solutionsObject.initiatedAt);
                                    setInitiatedAt(init);
                                }

                                // NEW SCHEMA V1: QUIZ RESPONSES STORED AS quizResponses 
                                if (solutionsObject.quizResponses !== undefined && solutionsObject.quizResponses !== "") {
                                    const parseQuizResponses = JSON.parse(solutionsObject.quizResponses);

                                    setSolutions(parseQuizResponses.solutions)

                                    if (parseQuizResponses.initiatedAt !== undefined && parseQuizResponses.initiatedAt !== null) {
                                        const init = new Date(parseQuizResponses.initiatedAt);
                                        setInitiatedAt(init);
                                    }
                                }

                                if (solutionsObject.attempts !== undefined) {
                                    setQuizAttempts(solutionsObject.attempts)

                                    // FInd the active one and set it to quizSolutions
                                    solutionsObject.attempts.map((attempt: any) => {
                                        if (attempt.isActive) {
                                            setQuizSolutions(attempt)
                                        }
                                    })

                                }

                                // Set remaining attempts 
                                if (props.cue.allowedAttempts !== null) {
                                    setRemainingAttempts(solutionsObject.attempts ? (props.cue.allowedAttempts - solutionsObject.attempts.length) : props.cue.allowedAttempts)
                                }

                                setProblems(res.data.quiz.getQuiz.problems);

                                const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems)
                                setUnmodifiedProblems(deepCopy);

                                let totalPoints = 0;

                                res.data.quiz.getQuiz.problems.map((problem: any) => {
                                    totalPoints += Number(problem.points)
                                })

                                setTotalQuizPoints(totalPoints);

                                if (res.data.quiz.getQuiz.duration && res.data.quiz.getQuiz.duration !== 0) {
                                    setDuration(res.data.quiz.getQuiz.duration * 60);
                                    setIsQuizTimed(true);
                                }


                                setShuffleQuiz(res.data.quiz.getQuiz.shuffleQuiz ? true : false)
                                setTitle(obj.title);
                                setIsQuiz(true);
                                setInstructions(res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : '')
                                setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {})
                                setFetchingQuiz(false)
                                setLoading(false);
                            }
                        });
                } else {
                    setImported(true);
                    setType(obj.type);
                    if (loading) {
                        setTitle(obj.title);
                    }
                    setUrl(obj.url);
                    setKey(Math.random());
                }
            } else {
                setImported(false);
                setUrl("");
                setType("");
                setTitle("");
            }
        } else {
            const data = props.cue.cue;
            if (data && data[0] && data[0] === "{" && data[data.length - 1] === "}") {
                const obj = JSON.parse(data);
                setSubmissionImported(true);
                setSubmissionUrl(obj.url);
                setSubmissionType(obj.type);
                setSubmissionTitle(obj.title);
            } else {
                setSubmissionImported(false);
                setSubmissionUrl("");
                setSubmissionType("");
                setSubmissionTitle("");
            }
        }
        setLoading(false);
    }, [props.cue, cue, loading, original]);


    // Imports for local cues
    useEffect(() => {
        if (!props.cue.channelId) {
            if (original && original[0] && original[0] === "{" && original[original.length - 1] === "}") {
                const obj = JSON.parse(original);
                setImported(true);
                setUrl(obj.url);
                setType(obj.type);
                setTitle(obj.title);
            }
        }
    }, [original])

    // Initialize submission Draft + Submission import title, url, type for new SCHEMA
    useEffect(() => {

        if (props.cue.channelId && props.cue.channelId !== "") {
            const data = cue;

            if (data && data[0] && data[0] === '{' && data[data.length - 1] === '}') {
                const obj = JSON.parse(data);

                // New Schema
                if (obj.submissionDraft !== undefined) {
                    if (obj.submissionDraft[0] === '{' && obj.submissionDraft[obj.submissionDraft.length - 1] === '}') {
                        let parse = JSON.parse(obj.submissionDraft);

                        if (parse.url !== undefined && parse.title !== undefined && parse.type !== undefined) {
                            setSubmissionImported(true);
                            setSubmissionUrl(parse.url);
                            setSubmissionType(parse.type);
                            setSubmissionTitle(parse.title)
                        }

                        setSubmissionDraft(obj.submissionDraft)

                    } else {

                        setInitialSubmissionDraft(obj.submissionDraft)
                        setSubmissionDraft(obj.submissionDraft)

                    }

                    setSubmissionAttempts(obj.attempts)

                }
            }
        }

    }, [cue, props.cue.channelId])

    // Important for new Quiz version with problemScores and comments
    useEffect(() => {
        if (quizSolutions) {
            if (quizSolutions.problemScores) {
                setIsV0Quiz(false)
            } else {
                setIsV0Quiz(true)
            }
        }
    }, [quizSolutions])

    // useEffect(() => {
    //     handleUpdate();
    // }, [
    //     cue,
    //     shuffle,
    //     frequency,
    //     gradeWeight,
    //     starred,
    //     color,
    //     props.cueIndex,
    //     submitted,
    //     markedAsRead,
    //     submission,
    //     deadline,
    //     initiateAt,
    //     submissionTitle,
    //     submissionImported,
    //     submissionType,
    //     submissionUrl,
    //     isQuiz,
    //     solutions,
    //     initiatedAt,
    //     customCategory,
    //     props.cueKey,
    //     endPlayAt,
    //     playChannelCueIndef,
    //     notify,
    //     url, original, type, title, imported
    // ]);

    const updateAfterFileImport = useCallback((u: any, t: any) => {
        if (props.showOriginal) {
            setOriginal(JSON.stringify({
                url: u, type: t, title
            }))
        } else {
            setSubmissionDraft(JSON.stringify({
                url: u, type: t, title: submissionTitle, annotations: ''
            }))
            setSubmissionImported(true);
            setSubmissionType(t);
            setSubmissionUrl(u);
        }
        setShowImportOptions(false);
    }, [title, submissionTitle])

    const handleHeightChange = useCallback((h: any) => {
        setHeight(h);
    }, []);

    // Camera for Toolbar
    const cameraCallback = useCallback(async () => {
        const cameraSettings = await ImagePicker.getCameraPermissionsAsync();
        if (!cameraSettings.granted) {
            await ImagePicker.requestCameraPermissionsAsync();
            const updatedCameraSettings = await ImagePicker.getCameraPermissionsAsync();
            if (!updatedCameraSettings.granted) {
                return;
            }
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        });
        if (!result.cancelled) {
            RichText.current.insertImage(result.uri, "border-radius: 8px");
        }
    }, [RichText, RichText.current]);

    // Gallery for Toolbar
    const galleryCallback = useCallback(async () => {
        const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (!gallerySettings.granted) {
            await ImagePicker.requestMediaLibraryPermissionsAsync();
            const updatedGallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync();
            if (!updatedGallerySettings.granted) {
                return;
            }
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            base64: true
        });
        if (!result.cancelled) {
            RichText.current.insertImage(result.uri, "border-radius: 8px");
        }
    }, [RichText, RichText.current]);

    const initQuiz = useCallback(async () => {

        // Need to update this for late submission

        // Late submission not allowed then no submission after deadline has passed
        if ((!allowLateSubmission && new Date() > deadline) ||
            // If late submission allowed, then available until should be the new deadline
            (allowLateSubmission && new Date() > availableUntil) ||
            // Once release Submission that means assignment should be locked
            (props.cue.releaseSubmission)) {
            Alert(unableToStartQuizAlert, "Submission period has ended.");
            return;
        }

        const u = await AsyncStorage.getItem("user");
        if (u) {
            const user = JSON.parse(u);
            const now = new Date();
            const server = fetchAPI("");
            const saveCue = JSON.stringify({
                solutions,
                initiatedAt: now
            });
            server
                .mutate({
                    mutation: start,
                    variables: {
                        cueId: props.cue._id,
                        userId: user._id,
                        cue: saveCue
                    }
                })
                .then(res => {
                    if (res.data.quiz.start) {
                        setInitiatedAt(now);
                    }
                })
                .catch(err => console.log(err));
            // save time to cloud first
            // after saving time in cloud, save it locally, set initiatedAt
            // quiz gets triggered
        }
    }, [props.cue._id, solutions, deadline, availableUntil, allowLateSubmission]);

    // Handle Update for CUES. Called everytime there is a cue modification
    // Overrides local cues in AsyncStorage and then calls reloadCuesAfterList to sync with the cloud
    // const handleUpdate = useCallback(async () => {

    //     // If available From set after Deadline or Dealine set before Available then 
    //     // we need to throw an Alert and return without updating

    //     let subCues: any = {};
    //     try {
    //         const value = await AsyncStorage.getItem("cues");
    //         if (value) {
    //             subCues = JSON.parse(value);
    //         }
    //     } catch (e) { }
    //     if (subCues[props.cueKey].length === 0) {
    //         return;
    //     }
    //     let saveCue = "";
    //     if (isQuiz) {
    //         saveCue = JSON.stringify({
    //             solutions,
    //             initiatedAt
    //         });
    //     } else if (submissionImported) {
    //         const obj = {
    //             type: submissionType,
    //             url: submissionUrl,
    //             title: submissionTitle
    //         };
    //         saveCue = JSON.stringify(obj);
    //     } else {
    //         saveCue = cue;
    //     }
    //     const submittedNow = new Date();

    //     let tempOriginal = ''
    //     if (imported) {
    //         const obj = {
    //             type,
    //             url,
    //             title
    //         }
    //         tempOriginal = JSON.stringify(obj)
    //     } else if (isQuiz) {
    //         const parse = JSON.parse(original)
    //         const obj = {
    //             quizId: parse.quizId,
    //             title
    //         }
    //         tempOriginal = JSON.stringify(obj)
    //     } else {
    //         tempOriginal = original
    //     }

    //     subCues[props.cueKey][props.cueIndex] = {
    //         _id: props.cue._id,
    //         cue: props.cue.submittedAt ? props.cue.cue : saveCue,
    //         date: props.cue.date,
    //         color,
    //         shuffle,
    //         frequency,
    //         starred,
    //         customCategory,
    //         // Channel controls
    //         channelId: props.cue.channelId,
    //         createdBy: props.cue.createdBy,
    //         endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : "",
    //         channelName: props.cue.channelName,
    //         original: tempOriginal,
    //         status: "read",
    //         graded: props.cue.graded,
    //         gradeWeight,
    //         submission,
    //         unreadThreads: props.cue.unreadThreads,
    //         score,
    //         comment: props.cue.comment,
    //         submittedAt: submitted ? submittedNow.toISOString() : props.cue.submittedAt,
    //         deadline: submission ? deadline.toISOString() : "",
    //         initiateAt: submission ? initiateAt.toISOString() : "",
    //         releaseSubmission: props.cue.releaseSubmission ? props.cue.releaseSubmission : false
    //     };
    //     const stringifiedCues = JSON.stringify(subCues);
    //     await AsyncStorage.setItem("cues", stringifiedCues);
    //     props.reloadCueListAfterUpdate();
    // }, [
    //     cue,
    //     customCategory,
    //     shuffle,
    //     frequency,
    //     starred,
    //     color,
    //     playChannelCueIndef,
    //     notify,
    //     submissionImported,
    //     submission,
    //     deadline,
    //     gradeWeight,
    //     submitted,
    //     submissionTitle,
    //     submissionType,
    //     submissionUrl,
    //     isQuiz,
    //     props.closeModal,
    //     props.cueIndex,
    //     props.cueKey,
    //     props.cue,
    //     endPlayAt,
    //     props,
    //     solutions,
    //     initiatedAt,
    //     // submission,
    //     // deadline,
    //     initiateAt,
    //     title, original, imported, type, url
    // ]);

    // Clear submission imported if submissionDraft is set to ""
    useEffect(() => {
        if (submissionDraft === "" && submissionImported) {
            setSubmissionImported(false);
            setSubmissionUrl("");
            setSubmissionType("");
            setSubmissionTitle("");
        }
    }, [submissionDraft])

    useEffect(() => {
        handleUpdateCue()
    }, [submitted, solutions, initiatedAt, submissionType, submissionUrl, submissionTitle, submissionImported, isQuiz, submissionDraft])

    const handleUpdateCue = useCallback(async () => {
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem("cues");
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) { }
        if (subCues[props.cueKey] && subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex]

        const currCueValue: any = currCue.cue;

        // If there are no existing submissions then initiate cue obj
        let submissionObj = {
            submissionDraft: '',
            attempts: []
        };

        let quizObj = {
            quizResponses: {},
            attempts: []
        }

        let updatedCue = '';

        if (isQuiz) {

            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                quizObj = JSON.parse(currCueValue);
            }

            quizObj.quizResponses = JSON.stringify({
                solutions,
                initiatedAt
            })

            updatedCue = JSON.stringify(quizObj);

        } else if (submissionImported) {

            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                submissionObj = JSON.parse(currCueValue);
            }

            const updatedDraft = JSON.parse(submissionDraft)
            // Submission draft will also have annotations so preserve those

            const obj = {
                ...updatedDraft,
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle,
            };

            submissionObj.submissionDraft = JSON.stringify(obj)

            updatedCue = JSON.stringify(submissionObj);

        } else {

            if (currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                submissionObj = JSON.parse(currCueValue);
            }

            submissionObj.submissionDraft = submissionDraft

            updatedCue = JSON.stringify(submissionObj);
        }

        const submittedNow = new Date();

        const saveCue = {
            ...currCue,
            cue: updatedCue,
            submittedAt: submitted ? submittedNow.toISOString() : props.cue.submittedAt,
        }

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);
        props.reloadCueListAfterUpdate();

    }, [submitted, solutions, initiatedAt, submissionType, submissionUrl, submissionTitle, submissionImported, isQuiz, submissionDraft])

    useEffect(() => {
        handleUpdateStarred()
    }, [starred])

    const handleUpdateStarred = useCallback(async () => {
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem("cues");
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) { }
        if (subCues[props.cueKey] && subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex]

        const saveCue = {
            ...currCue,
            starred,
        }

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);
        props.reloadCueListAfterUpdate();

    }, [starred])

    const handleUpdateContent = useCallback(async () => {

        setUpdatingCueContent(true)

        if (!props.cue.channelId) {

            let subCues: any = {};
            try {
                const value = await AsyncStorage.getItem("cues");
                if (value) {
                    subCues = JSON.parse(value);
                }
            } catch (e) { }
            if (subCues[props.cueKey].length === 0) {
                return;
            }

            let tempOriginal = ''
            if (imported) {

                if (title === "") {
                    Alert('Title cannot be empty');
                    setUpdatingCueContent(false);
                    return;
                }

                const obj = {
                    type,
                    url,
                    title
                }
                tempOriginal = JSON.stringify(obj)
            } else {
                tempOriginal = original
            }

            const currCue = subCues[props.cueKey][props.cueIndex]

            const saveCue = {
                ...currCue,
                cue: tempOriginal,
            }

            subCues[props.cueKey][props.cueIndex] = saveCue;

            const stringifiedCues = JSON.stringify(subCues);
            await AsyncStorage.setItem("cues", stringifiedCues);
            props.reloadCueListAfterUpdate();

            // Update initial Value for Editor 
            setInitialOriginal(tempOriginal);
            setUpdatingCueContent(false);

            return;
        }

        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem("cues");
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) { }
        if (subCues[props.cueKey].length === 0) {
            return;
        }

        let tempOriginal = ''
        if (imported) {

            if (title === "") {
                Alert('Title cannot be empty');
                setUpdatingCueContent(false);
                return;
            }

            const obj = {
                type,
                url,
                title
            }
            tempOriginal = JSON.stringify(obj)
        } else if (isQuiz) {

            if (title === "") {
                Alert('Title cannot be empty');
                setUpdatingCueContent(false);
                return;
            }

            const parse = JSON.parse(original)
            const obj = {
                quizId: parse.quizId,
                title
            }
            tempOriginal = JSON.stringify(obj)
        } else {
            tempOriginal = original
        }

        const currCue = subCues[props.cueKey][props.cueIndex]

        const saveCue = {
            ...currCue,
            original: tempOriginal,
        }

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);
        props.reloadCueListAfterUpdate();

        // Update initial Value for Editor 
        setInitialOriginal(tempOriginal);
        setUpdatingCueContent(false);
    }, [title, original, imported, type, url, isQuiz])

    const handleUpdateDetails = useCallback(async () => {
        setUpdatingCueDetails(true)
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem("cues");
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) { }
        if (subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex]

        // Perform validation for dates
        if (submission && isOwner) {
            if (initiateAt > deadline) {
                Alert('Deadline must be after available date')
                return;
            }

            if (allowLateSubmission && (availableUntil < deadline)) {
                Alert('Late Submission date must be after deadline')
                return;
            }
        }


        const saveCue = {
            ...currCue,
            color,
            shuffle,
            frequency,
            customCategory: customCategory === "None" ? "" : customCategory,
            gradeWeight,
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : "",
            submission,
            deadline: submission ? deadline.toISOString() : "",
            initiateAt: submission ? initiateAt.toISOString() : "",
            allowedAttempts: unlimitedAttempts ? null : allowedAttempts,
            availableUntil: submission && allowLateSubmission ? availableUntil.toISOString() : "",
        }

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);
        props.reloadCueListAfterUpdate();

        setUpdatingCueDetails(false)

    }, [submission, deadline, initiateAt, gradeWeight, customCategory, endPlayAt, color, frequency, notify, allowedAttempts, unlimitedAttempts, allowLateSubmission, availableUntil, isOwner])

    // Handle Delete Cue
    const handleDelete = useCallback(async () => {
        Alert("Delete cue?", "", [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    return;
                }
            },
            {
                text: "Okay",
                onPress: async () => {
                    const server = fetchAPI("");
                    if (props.cue.channelId && isOwner) {
                        server
                            .mutate({
                                mutation: deleteForEveryone,
                                variables: {
                                    cueId: props.cue._id
                                }
                            })
                            .then(res => {
                                if (res.data.cue.deleteForEveryone) {
                                    Alert(cueDeletedAlert);
                                }
                            });
                    }

                    if (!props.cue.channelId) {
                        server.mutate({
                            mutation: deleteCue,
                            variables: {
                                cueId: props.cue._id
                            }
                        });
                    }

                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem("cues");
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) { }
                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }
                    const updatedCues: any[] = [];
                    subCues[props.cueKey].map((i: any, j: any) => {
                        if (j !== props.cueIndex) {
                            updatedCues.push({ ...i });
                        }
                    });
                    subCues[props.cueKey] = updatedCues;
                    const stringifiedCues = JSON.stringify(subCues);
                    await AsyncStorage.setItem("cues", stringifiedCues);
                    props.closeModal();
                }
            }
        ]);
    }, [props.cueIndex, props.closeModal, props.cueKey, props.cue, isOwner]);

    const submitQuizEndTime = useCallback(async () => {
        const u: any = await AsyncStorage.getItem("user");
        if (u) {
            const parsedUser = JSON.parse(u);
            if (!parsedUser.email || parsedUser.email === "") {
                // cannot submit
                return;
            }
            const saveCue = JSON.stringify({
                solutions,
                initiatedAt
            });


            const server = fetchAPI("");
            server
                .mutate({
                    mutation: submit,
                    variables: {
                        cue: saveCue,
                        cueId: props.cue._id,
                        userId: parsedUser._id,
                        quizId
                    }
                })
                .then(res => {
                    if (res.data.cue.submitModification) {
                        Alert(submissionCompleteAlert, new Date().toString(), [
                            {
                                text: "Okay",
                                onPress: () => window.location.reload()
                            }
                        ]);
                    }
                })
                .catch(err => {
                    Alert(somethingWentWrongAlert, tryAgainLaterAlert);
                });
        }
    }, [
        cue,
        props.cue,
        isQuiz,
        quizId,
        initiatedAt,
        solutions,])

    // Handle Submit for Submissions and Quizzes
    const handleSubmit = useCallback(async () => {
        if (!isQuiz && submissionImported && submissionTitle === "") {
            Alert("Your submission has no title");
            return;
        }

        // Here check if required questions have been answered

        let requiredMissing = false;

        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            const solution = solutions[i];

            if ((!problem.questionType || problem.questionType === "" || problem.questionType === "trueFalse") && problem.required) {
                // Check completeness for MCQs


                const { selected } = solution;

                let selectionMade = false;

                selected.forEach((selection: any) => {
                    if (selection.isSelected) selectionMade = true;
                })

                if (!selectionMade) {
                    requiredMissing = true;
                }

            } else if (problem.questionType === "freeResponse" && problem.required) {
                // Check completeness for free response

                const { response } = solution;

                if (response === "") {
                    requiredMissing = true;
                }

            } else {
                // Optional
            }
        }

        if (requiredMissing) {
            Alert("A required question is missing a response.");
            return;
        }

        let now = new Date();
        // one minute of extra time to submit            
        now.setMinutes(now.getMinutes() - 1)

        Alert(now >= deadline ? "Submit Late?" : "Submit?", now >= deadline ? "The deadline for this submission has already passed" : "", [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    return;
                }
            },
            {
                text: "Okay",
                onPress: async () => {

                    setIsSubmitting(true)
                    const u: any = await AsyncStorage.getItem("user");
                    if (u) {
                        const parsedUser = JSON.parse(u);
                        if (!parsedUser.email || parsedUser.email === "") {
                            // cannot submit
                            return;
                        }
                        let saveCue = "";
                        if (isQuiz) {
                            saveCue = JSON.stringify({
                                solutions,
                                initiatedAt
                            });
                        } else {
                            saveCue = submissionDraft;
                        }

                        const server = fetchAPI("");
                        server
                            .mutate({
                                mutation: submit,
                                variables: {
                                    cue: saveCue,
                                    cueId: props.cue._id,
                                    userId: parsedUser._id,
                                    quizId: isQuiz ? quizId : null
                                }
                            })
                            .then(res => {
                                if (res.data.cue.submitModification) {
                                    setIsSubmitting(false)
                                    Alert(submissionCompleteAlert, new Date().toString(), [
                                        {
                                            text: "Okay",
                                            onPress: () => window.location.reload()
                                        }
                                    ]);
                                } else {
                                    Alert("Submission failed. Try again. ")
                                    setIsSubmitting(false)
                                }
                            })
                            .catch(err => {
                                setIsSubmitting(false)
                                Alert(somethingWentWrongAlert, tryAgainLaterAlert);
                            });
                    }
                }
            }
        ]);
    }, [
        props.cue,
        cue,
        submissionTitle,
        submissionType,
        submissionUrl,
        submissionImported,
        isQuiz,
        quizId,
        initiatedAt,
        solutions,
        deadline,
        submissionDraft
    ]);

    // SET IS OWNER AND SETUP COMPLETE
    useEffect(() => {
        (async () => {
            const u = await AsyncStorage.getItem("user");
            if (u && props.cue.createdBy) {
                const parsedUser = JSON.parse(u);
                if (parsedUser.email && parsedUser.email !== "") {
                    setUserSetupComplete(true);
                }
            }
        })();
    }, [props.cue]);

    useEffect(() => {
        setIsOwner(props.channelOwner)
    }, [props.channelOwner])

    const updateStatusAsRead = useCallback(async () => {
        if (props.cue.status && props.cue.status !== "read" && !markedAsRead) {
            const u = await AsyncStorage.getItem("user");
            if (u) {
                const user = JSON.parse(u);
                const server = fetchAPI("");
                server
                    .mutate({
                        mutation: markAsRead,
                        variables: {
                            cueId: props.cue._id,
                            userId: user._id
                        }
                    })
                    .then(res => {
                        if (res.data.status.markAsRead) {
                            setMarkedAsRead(true);
                        }
                    })
                    .catch(err => { });
            }
        }
    }, [props.cue, markedAsRead]);

    const clearAll = useCallback(() => {
        Alert(clearQuestionAlert, cannotUndoAlert, [
            {
                text: "Cancel",
                style: "cancel"
            },
            {
                text: "Clear",
                onPress: () => {
                    if (props.showOriginal) {
                        setOriginal('')
                        setInitialOriginal('')
                        setImported(false)
                        setUrl('')
                        setType('')
                        setTitle('')
                    } else {
                        setSubmissionImported(false)
                        setSubmissionDraft('')
                        setInitialSubmissionDraft('')
                        setSubmissionUrl('')
                        setSubmissionType('')
                        setSubmissionTitle('')
                    }
                    setReloadEditorKey(Math.random());
                }
            }
        ]);
    }, [props.showOriginal]);

    const shareCue = useCallback(async () => {
        let saveCue = "";
        if (submissionImported) {
            const obj = {
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle
            };
            saveCue = JSON.stringify(obj);
        } else {
            saveCue = cue;
        }

        let tempOriginal = ''
        if (imported) {
            const obj = {
                type,
                url,
                title
            }
            tempOriginal = JSON.stringify(obj)
        } else {
            tempOriginal = original
        }

        const server = fetchAPI("");
        server
            .mutate({
                mutation: createCue,
                variables: {
                    cue: props.cue.channelId ? tempOriginal : saveCue,
                    starred,
                    color: color.toString(),
                    channelId: shareWithChannelId,
                    frequency,
                    customCategory: customCategory === "None" ? "" : customCategory,
                    shuffle,
                    createdBy: selectedChannelOwner ? selectedChannelOwner.id : props.cue.createdBy,
                    gradeWeight: gradeWeight.toString(),
                    submission,
                    deadline: submission ? deadline.toISOString() : "",
                    endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ""
                }
            })
            .then(res => {
                if (res.data.cue.create) {
                    Alert(sharedAlert, "Cue has been successfully shared.");
                }
            })
            .catch(err => {
                Alert(somethingWentWrongAlert, checkConnectionAlert);
            });
    }, [
        submissionImported,
        submissionTitle,
        submissionType,
        submissionUrl,
        selectedChannelOwner,
        url, type, imported, title, original,
        cue,
        starred,
        color,
        frequency,
        customCategory,
        shuffle,
        gradeWeight,
        submission,
        deadline,
        notify,
        playChannelCueIndef,
        endPlayAt,
        shareWithChannelId,
        props.cue
    ]);

    const updateQuiz = (instructions: string, problems: any, headers: any, modifiedCorrectAnswerProblems: boolean[], regradeChoices: string[], timer: boolean, duration: any, shuffleQuiz: boolean) => {
        Alert("Update Quiz?", "", [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                    return;
                }
            },
            {
                text: "Okay",
                onPress: async () => {
                    setLoadingAfterModifyingQuiz(true)
                    const server = fetchAPI("");

                    // Update title as well
                    handleUpdateContent()

                    // VALIDATION:
                    // Check if any question without a correct answer

                    let error = false;
                    problems.map((problem: any) => {
                        if (problem.question === "" || problem.question === "formula:") {
                            Alert(fillMissingProblemsAlert);
                            error = true;
                        }

                        if (problem.points === "" || Number.isNaN(Number(problem.points))) {
                            Alert(enterNumericPointsAlert);
                            error = true;
                        }

                        let optionFound = false;
                        // if (problem.options.length === 0) {
                        //     Alert(mustHaveOneOptionAlert)
                        //     error = true;
                        // }

                        // If MCQ, check if any options repeat:
                        if (!problem.questionType || problem.questionType === "trueFalse") {
                            const keys: any = {};

                            problem.options.map((option: any) => {
                                if (option.option === "" || option.option === "formula:") {
                                    Alert(fillMissingOptionsAlert);
                                    error = true;
                                }

                                if (option.option in keys) {
                                    Alert("Option repeated in a question");
                                    error = true;
                                }

                                if (option.isCorrect) {
                                    optionFound = true;
                                }

                                keys[option.option] = 1;
                            });

                            if (!optionFound) {
                                Alert(eachOptionOneCorrectAlert);
                                error = true;
                            }
                        }
                    });

                    // Check if any regrade choice has not been selected
                    modifiedCorrectAnswerProblems.map((prob: boolean, index: number) => {
                        if (prob && regradeChoices[index] === "") {
                            Alert('Select regrade option for any questions with modified correct answers.')
                            error = true;
                        }
                    })

                    if (error) {
                        setLoadingAfterModifyingQuiz(false);
                        return;
                    }

                    // Points should be a string not a number

                    const sanitizeProblems = problems.map((prob: any) => {
                        const { options } = prob;
                        const sanitizeOptions = options.map((option: any) => {
                            const clone = option;

                            delete (clone.__typename)

                            return clone;
                        })

                        delete (prob.__typename)
                        delete (prob.problemIndex)
                        return {
                            ...prob,
                            points: prob.points.toString(),
                            options: sanitizeOptions
                        }
                    })

                    const durationMinutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;

                    server
                        .mutate({
                            mutation: modifyQuiz,
                            variables: {
                                cueId: props.cue._id,
                                quiz: {
                                    instructions,
                                    problems: sanitizeProblems,
                                    headers: JSON.stringify(headers),
                                    duration: timer ? durationMinutes.toString() : null,
                                    shuffleQuiz
                                },
                                modifiedCorrectAnswers: modifiedCorrectAnswerProblems.map((o: any) => o ? "yes" : "no"),
                                regradeChoices: regradeChoices.map((choice: string) => choice === "" ? "none" : choice)
                            }
                        })
                        .then((res: any) => {
                            if (res.data && res.data.quiz.modifyQuiz) {
                                const server = fetchAPI("");
                                server
                                    .query({
                                        query: getQuiz,
                                        variables: {
                                            quizId
                                        }
                                    })
                                    .then(res => {
                                        if (res.data && res.data.quiz.getQuiz) {
                                            setProblems(res.data.quiz.getQuiz.problems);
                                            const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems)
                                            setUnmodifiedProblems(deepCopy);
                                            setInstructions(res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : '')
                                            setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {})
                                            setLoadingAfterModifyingQuiz(false);
                                            setDuration(res.data.quiz.getQuiz.duration * 60);
                                            setShuffleQuiz(res.data.quiz.getQuiz.shuffleQuiz ? res.data.quiz.getQuiz.shuffleQuiz : false)
                                            alert('Quiz updated successfully')
                                            // Refresh all subscriber scores since there could be regrades
                                            props.reloadStatuses()

                                        }
                                    });

                            }
                        })
                        .catch(err => console.log(err));
                }
            }
        ]);
    }

    const onChange = useCallback(
        (value, { action, option, removedValue }) => {
            switch (action) {
                case "remove-value":
                case "pop-value":
                    if (removedValue.isFixed) {
                        return;
                    }
                    break;
                case "select-option":
                    const server = fetchAPI("");
                    server
                        .mutate({
                            mutation: shareCueWithMoreIds,
                            variables: {
                                cueId: props.cue._id,
                                userId: option.value
                            }
                        })
                        .then(res => {
                            if (res.data && res.data.cue.shareCueWithMoreIds) {
                                loadChannelsAndSharedWith();
                            }
                        })
                        .catch(err => console.log(err));
                    return;

                case "clear":
                    value = subscribers.filter(v => v.isFixed);
                    break;
            }
            setSelected(value);
        },
        [subscribers, props.cue]
    );

    useEffect(() => {
        updateStatusAsRead();
    }, [props.cue.status]);

    const yesterday = moment().subtract(1, "day");
    const disablePastDt = (current: any) => {
        return current.isAfter(yesterday);
    };

    const width = Dimensions.get("window").width;

    useEffect(() => {
        if (props.save) {
            Alert("Save changes?", "", [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => {
                        return;
                    }
                },
                {
                    text: "Yes",
                    onPress: () => {
                        if (props.channelOwner) {
                            handleUpdateContent()
                        }
                        handleUpdateDetails()
                    }
                }
            ])
        }
    }, [props.save, handleUpdateContent, handleUpdateDetails, props.channelOwner])

    useEffect(() => {
        if (props.del) {
            Alert("Delete?", "", [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => {
                        return;
                    }
                },
                {
                    text: "Yes",
                    onPress: () => {
                        handleDelete()
                    }
                }
            ])
        }
    }, [props.del, handleDelete])

    useEffect(() => {
        if (props.showOriginal) {
            if (url === '' || !url) {
                return
            }

            if (type === "mp4" ||
                type === "oga" ||
                type === "mov" ||
                type === "wmv" ||
                type === "mp3" ||
                type === "mov" ||
                type === "mpeg" ||
                type === "mp2" ||
                type === "wav") {
                return;
            }


            if (imported) {
                if (!RichText.current) {
                    return;
                }
            }

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: decodeURIComponent(url),
                },
                RichText.current,
            ).then(async (instance: any) => {
                const { documentViewer, annotationManager } = instance.Core;
                const u = await AsyncStorage.getItem("user");

                let user: any;

                if (u) {
                    user = JSON.parse(u);
                    annotationManager.setCurrentUser(user.fullName)
                }

                // you can now call WebViewer APIs here...
                documentViewer.addEventListener('documentLoaded', async () => {
                    // perform document operations

                    // Need to modify the original property in the cue
                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem("cues");
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) { }

                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }

                    const currCue = subCues[props.cueKey][props.cueIndex]

                    if (currCue.annotations !== "") {
                        const xfdfString = currCue.annotations;

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

                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem("cues");
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) { }

                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }

                    const currCue = subCues[props.cueKey][props.cueIndex]



                    const saveCue = {
                        ...currCue,
                        annotations: xfdfString,
                    }

                    subCues[props.cueKey][props.cueIndex] = saveCue;

                    const stringifiedCues = JSON.stringify(subCues);
                    await AsyncStorage.setItem("cues", stringifiedCues);
                    props.reloadCueListAfterUpdate();

                });
            });
        } else {
            if (submissionUrl === '' || !submissionUrl) {
                return
            }

            if (submissionType === "mp4" ||
                submissionType === "oga" ||
                submissionType === "mov" ||
                submissionType === "wmv" ||
                submissionType === "mp3" ||
                submissionType === "mov" ||
                submissionType === "mpeg" ||
                submissionType === "mp2" ||
                submissionType === "wav") {
                return;
            }


            if (submissionImported) {
                if (!RichText.current) {
                    return;
                }
            }

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: decodeURIComponent(submissionUrl),
                },
                RichText.current,
            ).then(async (instance: any) => {
                const { documentViewer, annotationManager } = instance.Core;
                // you can now call WebViewer APIs here...

                const u = await AsyncStorage.getItem("user");

                let user: any;

                if (u) {
                    user = JSON.parse(u);
                    annotationManager.setCurrentUser(user.fullName)
                }

                documentViewer.addEventListener('documentLoaded', () => {
                    // perform document operations

                    if (submissionDraft !== "" && submissionDraft[0] && submissionDraft[0] === "{" && submissionDraft[submissionDraft.length - 1] === "}") {
                        const obj = JSON.parse(submissionDraft);

                        if (obj.annotations !== "") {
                            const xfdfString = obj.annotations;

                            annotationManager.importAnnotations(xfdfString).then((annotations: any) => {

                                annotations.forEach((annotation: any) => {
                                    annotationManager.redrawAnnotation(annotation);
                                });
                            });
                        }
                    }
                });


                annotationManager.addEventListener('annotationChanged', async (annotations: any, action: any, { imported }) => {
                    // If the event is triggered by importing then it can be ignored
                    // This will happen when importing the initial annotations
                    // from the server or individual changes from other users
                    if (imported) return;

                    const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: true });

                    const obj = JSON.parse(submissionDraft);

                    let updateSubmissionDraftWithAnnotation = {
                        ...obj,
                        annotations: xfdfString
                    }

                    setSubmissionDraft(JSON.stringify(updateSubmissionDraftWithAnnotation))

                });
            });
        }
    }, [url, RichText, imported,
        submissionImported, props.showOriginal,
        props.showOptions,
        submissionUrl, type, submissionType]);


    if (loading || loadingAfterModifyingQuiz || fetchingQuiz) {
        return null;
    }

    const renderEquationEditor = () => {
        return showEquationEditor ? (
            <View
                style={{
                    width: "100%",
                    flexDirection: width < 768 ? "column" : "row",
                    paddingBottom: 20
                }}>
                <View
                    style={{
                        borderColor: "#efefef",
                        borderWidth: 1,
                        borderRadius: 15,
                        padding: 10,
                        minWidth: 200,
                        maxWidth: "50%"
                    }}>
                    <EquationEditor
                        value={equation}
                        onChange={setEquation}
                        autoCommands="bar overline sqrt sum prod int alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Aelta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omikron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega"
                        autoOperatorNames="sin cos tan arccos arcsin arctan"
                    />
                </View>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        paddingLeft: 20,
                        maxWidth: "10%"
                    }}
                    onPress={() => insertEquation()}>
                    <Ionicons name="add-circle-outline" color="#000000" size={15} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        paddingLeft: 10,
                        maxWidth: "10%",
                    }}
                    onPress={() => setShowFormulaGuide(true)}
                >
                    <Ionicons name="help-circle-outline" color="#000000" size={18} />
                </TouchableOpacity>
            </View>
        ) : null;
    };

    // QUIZ TIMER OR DOWNLOAD/REFRESH IF UPLOADED
    const renderQuizTimerOrUploadOptions = () => {
        return props.showOriginal && (imported || isQuiz) ? (
            <View style={{ flexDirection: "row", marginRight: 0, marginLeft: 0, flex: 1 }}>
                <View style={{ flexDirection: 'row', flex: 1 }}>
                    {(isOwner || !props.cue.channelId) ? <TextareaAutosize
                        value={title}
                        // style={styles.input}
                        style={{
                            fontSize: 14,
                            padding: 15,
                            paddingTop: 12,
                            paddingBottom: 12,
                            marginTop: 5,
                            marginBottom: 20,
                            maxWidth: 210,
                            borderBottom: '1px solid #efefef',
                            borderRadius: 1,
                            // fontWeight: "600",
                            width: '100%'
                        }}
                        placeholder={"Title"}
                        onChange={(e: any) => setTitle(e.target.value)}
                        minRows={1}
                    /> :
                        <Text
                            style={{
                                fontSize: 18,
                                paddingRight: 15,
                                paddingTop: 12,
                                paddingBottom: 12,
                                marginTop: 20,
                                marginBottom: 5,
                                maxWidth: "100%",
                                fontWeight: "600",
                                width: '100%',
                                fontFamily: 'Inter'
                            }}
                        >
                            {title}
                        </Text>}
                </View>
                {isQuiz ? (
                    isQuizTimed ? (
                        initiatedAt && initDuration !== 0 ? (
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    justifyContent: "flex-end"
                                }}>
                                <CountdownCircleTimer
                                    size={120}
                                    key={initDuration}
                                    children={({ remainingTime }: any) => {
                                        if (!remainingTime || remainingTime === 0) {
                                            submitQuizEndTime();
                                        }

                                        if (remainingTime === 120) {
                                            Alert("Two minutes left. Quiz will auto-submit when timer ends.")
                                        }

                                        const hours = Math.floor(remainingTime / 3600);
                                        const minutes = Math.floor((remainingTime % 3600) / 60);
                                        const seconds = remainingTime % 60;
                                        return `${hours}h ${minutes}m ${seconds}s`;
                                    }}
                                    isPlaying={true}
                                    duration={duration}
                                    initialRemainingTime={initDuration}
                                    colors="#006AFF"
                                />
                            </View>
                        ) : null
                    ) : null
                ) : props.cue.graded ? null : (
                    <View
                        style={{
                            marginLeft: 15,
                            marginTop: 20,
                            // alignSelf: "flex-start",
                            // display: "flex",
                            // flexDirection: "row"
                        }}>
                        {/* <View style={{ marginRight: 25 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    flex: 1
                                }}>
                                <Ionicons
                                    name="reload-outline"
                                    color="#393939"
                                    size={15}
                                    onPress={() => setWebviewKey(Math.random())}
                                />
                            </View>
                            <Text
                                style={{
                                    fontSize: 10,
                                    color: "#393939",
                                    textAlign: "center"
                                }}>
                                Reload
                            </Text>
                        </View> */}
                        {/* <a download={true} href={url} style={{ textDecoration: "none", textAlign: "center" }}>
                            <View>
                                <Ionicons name="cloud-download-outline" color="#393939" size={15} />
                                <Text
                                    style={{
                                        fontSize: 10,
                                        color: "#393939",
                                        textAlign: "center"
                                    }}>
                                    Download
                                </Text>
                            </View>
                        </a> */}
                        {
                            (isOwner || !props.cue.channelId) ?
                                <TouchableOpacity
                                    onPress={() => clearAll()}
                                    style={{
                                        backgroundColor: "white", borderRadius: 15, // marginLeft: 15,
                                        marginTop: 5,
                                    }}>
                                    <Text
                                        style={{
                                            lineHeight: 35,
                                            // textAlign: "right",
                                            // paddingRight: 20,
                                            textTransform: "uppercase",
                                            fontSize: 12,
                                            fontFamily: 'overpass',
                                            color: '#006AFF',
                                        }}
                                    >
                                        Erase
                                    </Text>
                                </TouchableOpacity> : null
                        }
                    </View>
                )}
            </View>
        ) : null;
    };

    const renderCueRemarks = () => {
        return !props.showOriginal && props.cue.graded && props.cue.comment ? (
            <View>
                <Text
                    style={{
                        color: "#000000",
                        fontSize: 14,
                        fontFamily: 'inter',
                        paddingBottom: 25,
                        marginLeft: "5%"
                    }}>
                    {PreferredLanguageText("gradersRemarks")}
                </Text>
                <TextInput
                    value={props.cue.comment}
                    style={{
                        height: 200,
                        backgroundColor: "#efefef",
                        borderRadius: 1,
                        fontSize: 14,
                        padding: 15,
                        paddingTop: 13,
                        paddingBottom: 13,
                        marginTop: 5,
                        marginBottom: 20
                    }}
                    editable={false}
                    placeholder={"Optional"}
                    placeholderTextColor={"#393939"}
                    multiline={true}
                />
            </View>
        ) : null;
    };

    const renderQuizEndedMessage = () => {
        return (<View style={{ backgroundColor: 'white', flex: 1, }}>
            <Text style={{ width: '100%', color: '#393939', fontSize: 20, paddingTop: 200, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1, textAlign: 'center' }}>
                Quiz submission ended. {remainingAttempts === 0 ? "No attempts left. " : ""} {props.cue.releaseSubmission ? "Quiz grades released by instructor. " : ""}
            </Text>
        </View>)

    }

    const renderQuizSubmissionHistory = () => {

        const quizAttempted = quizAttempts.length > 0;

        const latestSubmission = quizAttempts[quizAttempts.length - 1];

        return (<View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
                {/* <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 14,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>Submission History</Text>
                </View> */}
                {quizAttempted
                    ?
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                        <Ionicons name='checkmark-outline' size={22} color={"#53BE68"} />
                        <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                            Submitted at {moment(new Date(latestSubmission.submittedAt)).format('MMMM Do, h:mm a')}
                        </Text>
                    </View>
                    :
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                        <Ionicons name='alert-circle-outline' size={22} color={"#D91D56"} />
                        <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                            Not Attempted
                        </Text>
                    </View>}
                {/* Add remaining attempts here */}
                {/* <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                        {!allowedAttempts ? "" : "Remaining Attempts: " + (allowedAttempts - usedAttempts)}
                    </Text>
                </View> */}

                {/* View Submission button here */}

                {/* {
                    props.cue.submittedAt && props.cue.submittedAt !== "" 
                    ?
                    <View style={{ flexDirection: 'row', marginTop: 10, }}>
                        {viewSubmission ? 
                        <TouchableOpacity
                            disabled={props.cue.graded && props.cue.releaseSubmission}
                            onPress={async () => {
                                setViewSubmission(false)
                            }}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                // marginTop: 15,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#fff',
                                fontSize: 12,
                                backgroundColor: '#53BE6D',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                // width: 100,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                {(props.cue.graded && props.cue.releaseSubmission) ? "GRADED" : "Re-Submit"}
                            </Text>
                        </TouchableOpacity>
                        :
                        <TouchableOpacity
                            onPress={async () => {
                                setViewSubmission(true)
                            }}
                            style={{
                                backgroundColor: 'white',
                                overflow: 'hidden',
                                height: 35,
                                // marginTop: 15,
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: '#fff',
                                fontSize: 12,
                                backgroundColor: '#53BE6D',
                                paddingHorizontal: 20,
                                fontFamily: 'inter',
                                height: 35,
                                // width: 100,
                                borderRadius: 15,
                                textTransform: 'uppercase'
                            }}>
                                View Submission
                            </Text>
                        </TouchableOpacity>}
                    </View>
                    :
                    null
                } */}
            </View>

            {props.cue.graded && props.cue.releaseSubmission ? (<View>
                <Text style={{
                    fontSize: 14,
                    fontFamily: 'inter',
                    color: '#2f2f3c',
                    paddingTop: 40,
                    paddingBottom: 15,
                }}>
                    {PreferredLanguageText('score')}
                </Text>
                <Text style={{
                    fontSize: 25,
                    fontFamily: 'inter',
                    color: '#2f2f3c',
                    borderRadius: 15
                }}>
                    {props.cue.score}%
                </Text>

            </View>) : null}

        </View>)
    }

    const renderSubmissionHistory = () => {

        const usedAttempts = submissionAttempts.length;

        return (<View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 14,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>Submission History</Text>
                </View> */}
            {props.cue.submittedAt && props.cue.submittedAt !== "" && viewSubmission
                ?
                <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 0 }}>
                    <Ionicons name='checkmark-outline' size={22} color={"#53BE68"} />
                    <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                        {moment(new Date(props.cue.submittedAt)).format('MMMM Do, h:mm a')}
                    </Text>
                </View>
                : null
                // <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                //     <Ionicons name='alert-circle-outline' size={22} color={"#D91D56"} />
                //     <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                //         Not Turned In
                //     </Text>
                // </View>
            }
            {/* Add remaining attempts here */}
            {/* <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                        {!allowedAttempts ? "" : "Remaining Attempts: " + (allowedAttempts - usedAttempts)}
                    </Text>
                </View> */}

            {/* View Submission button here */}
            {props.cue.graded && props.cue.releaseSubmission && viewSubmission ? (
                <View style={{ paddingLeft: 20 }}>
                    <Text style={{
                        fontSize: 14,
                        fontFamily: 'inter',
                        color: '#2f2f3c',
                        paddingTop: 20,
                        paddingBottom: 15,
                    }}>
                        {PreferredLanguageText('score')}
                    </Text>
                    <Text style={{
                        fontSize: 25,
                        fontFamily: 'inter',
                        color: '#2f2f3c',
                        borderRadius: 15
                    }}>
                        {props.cue.score}%
                    </Text>

                </View>) : null}

            {
                props.cue.submittedAt && props.cue.submittedAt !== ""
                    ?
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        {viewSubmission ?
                            (props.cue.releaseSubmission || (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil) ? null : <TouchableOpacity
                                onPress={async () => {
                                    setViewSubmission(false)
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    // marginTop: 15,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                }}>
                                <Text style={{
                                    textAlign: 'center',
                                    lineHeight: 35,
                                    color: '#006AFF',
                                    borderWidth: 1,
                                    fontSize: 12,
                                    borderColor: '#006AFF',
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    height: 35,
                                    // width: 100,
                                    borderRadius: 15,
                                    textTransform: 'uppercase'
                                }}>
                                    {"NEW SUBMISSION"}
                                </Text>
                            </TouchableOpacity>)
                            :
                            <TouchableOpacity
                                onPress={async () => {
                                    setViewSubmission(true)
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    // marginTop: 15,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
                                }}>
                                <Text>
                                    <Ionicons name='chevron-back-outline' size={30} color={'#393939'} />
                                </Text>
                            </TouchableOpacity>}
                    </View>
                    :
                    null
            }
        </View>)
    }

    const renderQuizDetails = () => {

        let hours = Math.floor(duration / 3600);

        let minutes = Math.floor((duration - hours * 3600) / 60);

        return (<View style={{ display: 'flex', flexDirection: 'row', marginTop: 20, marginBottom: 10 }}>
            <Text style={{ marginRight: 30, fontFamily: 'Inter', fontSize: 14 }}>
                {problems.length} {problems.length === 1 ? "Question" : "Questions"}
            </Text>
            {/* <Text style={{ marginRight: 10 }}>
                |
            </Text> */}
            <Text style={{ marginRight: 30, fontFamily: 'Inter', fontSize: 14 }}>
                {totalQuizPoints} Points
            </Text>
            {/* <Text style={{ marginRight: 10 }}>
                |
            </Text> */}
            {duration === 0 ?
                <Text style={{ marginRight: 30, fontFamily: 'Inter', fontSize: 14 }}>No Time Limit</Text> :
                <Text style={{ marginRight: 30, fontFamily: 'Inter', fontSize: 14 }}>
                    {hours} H {minutes} min
                </Text>}
            {/* {!isOwner ? <Text style={{ marginRight: 10, fontSize: 14 }}>
                |
            </Text> : null} */}
            {!isOwner ? <Text style={{ marginRight: 30, fontFamily: 'Inter', fontSize: 14 }}>
                {allowedAttempts && allowedAttempts !== null ? 'Remaining Attempts: ' + (remainingAttempts >= 0 ? remainingAttempts : '0') : "Unlimited Attempts"}
            </Text> : null}
        </View>)

    }

    const renderMainCueContent = () => {

        return (<View
            style={{
                width: "100%",
                minHeight: 475,
                backgroundColor: "white"
            }}>
            {!props.showOriginal || loading ? null : isQuiz ? (
                isQuizTimed && !isOwner ? (
                    initiatedAt ? (
                        <View style={{ width: '100%', paddingBottom: 50 }}>
                            <Quiz
                                // disable quiz if graded or deadline has passed
                                isOwner={isOwner}
                                submitted={isQuiz && props.cue.submittedAt && props.cue.submittedAt !== "" ? true : false}
                                graded={props.cue.graded}
                                hasEnded={currentDate >= deadline}
                                solutions={solutions}
                                problems={problems}
                                setSolutions={(s: any) => setSolutions(s)}
                                shuffleQuiz={shuffleQuiz}
                                instructions={instructions}
                                headers={headers}
                                modifyQuiz={updateQuiz}
                                unmodifiedProblems={unmodifiedProblems}
                                duration={duration}
                                remainingAttempts={remainingAttempts}
                                quizAttempts={quizAttempts}
                            />
                            {renderFooter()}
                        </View>
                    ) : (
                        <View>
                            <View>
                                <TouchableOpacity
                                    onPress={() => initQuiz()}
                                    style={{
                                        backgroundColor: "white",
                                        overflow: "hidden",
                                        height: 35,
                                        marginTop: 15,
                                        justifyContent: "center",
                                        flexDirection: "row",
                                        marginBottom: 50
                                    }}>
                                    <Text
                                        style={{
                                            textAlign: "center",
                                            lineHeight: 35,
                                            color: "#000000",
                                            fontSize: 12,
                                            backgroundColor: "#efefef",
                                            paddingHorizontal: 20,
                                            fontFamily: "inter",
                                            height: 35,
                                            width: 200,
                                            borderRadius: 15,
                                            textTransform: "uppercase"
                                        }}>
                                        {PreferredLanguageText("startQuiz")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )
                ) : (
                    <View style={{ width: '100%', paddingBottom: 50 }}>
                        <Quiz
                            isOwner={isOwner}
                            submitted={isQuiz && props.cue.submittedAt && props.cue.submittedAt !== "" ? true : false}
                            graded={props.cue.graded || currentDate >= deadline}
                            solutions={solutions}
                            problems={problems}
                            setSolutions={(s: any) => setSolutions(s)}
                            shuffleQuiz={shuffleQuiz}
                            instructions={instructions}
                            headers={headers}
                            modifyQuiz={updateQuiz}
                            unmodifiedProblems={unmodifiedProblems}
                            duration={duration}
                            remainingAttempts={remainingAttempts}
                            quizAttempts={quizAttempts}
                        />
                        {renderFooter()}
                    </View>
                )
            ) : imported ? (
                type === "mp4" ||
                    type === "oga" ||
                    type === "mov" ||
                    type === "wmv" ||
                    type === "mp3" ||
                    type === "mov" ||
                    type === "mpeg" ||
                    type === "mp2" ||
                    type === "wav" ? (
                    <View style={{ width: '100%' }}>
                        <ReactPlayer
                            url={url}
                            controls={true}
                            onContextMenu={(e: any) => e.preventDefault()}
                            config={{
                                file: { attributes: { controlsList: "nodownload" } }
                            }}
                            width={"100%"}
                            height={"100%"}
                        />
                        {/* {renderSaveCueButton()} */}
                    </View>
                ) : (
                    <View key={url + props.showOriginal.toString()} style={{}}>
                        <div className="webviewer" ref={RichText} style={{ height: Dimensions.get('window').width < 768 ? "50vh" : "70vh" }} key={props.showOriginal + url + imported.toString()}></div>
                        {/* {renderSaveCueButton()} */}
                    </View>
                )
            ) : (
                renderRichEditorOriginalCue()
            )}
            {!props.showOriginal && submissionImported && !viewSubmission ? (
                submissionType === "mp4" ||
                    submissionType === "oga" ||
                    submissionType === "mov" ||
                    submissionType === "wmv" ||
                    submissionType === "mp3" ||
                    submissionType === "mov" ||
                    submissionType === "mpeg" ||
                    submissionType === "mp2" ||
                    submissionType === "wav" ? (
                    <View style={{ width: '100%' }}>
                        <ReactPlayer url={submissionUrl} controls={true} width={"100%"} height={"100%"} />
                        {renderFooter()}
                    </View>
                ) : (
                    <View style={{}} key={JSON.stringify(submissionImported) + JSON.stringify(viewSubmission) + JSON.stringify(viewSubmissionTab)}>
                        <div className="webviewer" ref={RichText} style={{ height: Dimensions.get('window').width < 768 ? "50vh" : "70vh" }}></div>
                        {renderFooter()}
                    </View>
                )
            ) : null}

            {
                props.showOriginal ? null : <View style={{ width: '100%', paddingBottom: 50, display: 'flex', flexDirection: 'column', }}>
                    {!viewSubmission ? (submissionImported ? null : <View>
                        {props.cue.releaseSubmission || (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil) ? null : renderRichEditorModified()}
                        {renderFooter()}
                    </View>) : <View key={JSON.stringify(submissionImported) + JSON.stringify(viewSubmission) + JSON.stringify(props.showOriginal)}>
                        {renderViewSubmission()}
                    </View>}
                </View>
            }
        </View>
        );
    }

    console.log("Loading", loading)
    console.log("Is Quiz", isQuiz)
    console.log("Fetching Quiz", fetchingQuiz)


    const renderRichEditorOriginalCue = () => {

        if (fetchingQuiz || isQuiz) return null;

        if (!isOwner && props.cue.channelId && props.cue.channelId !== "") {
            return <div className="mce-content-body htmlParser" style={{ width: '100%', color: 'black' }}>
                {parser(initialOriginal)}
            </div>
        }

        return (<View style={{ width: '100%' }}>
            <Editor
                onInit={(evt, editor) => editorRef.current = editor}
                initialValue={initialOriginal}
                disabled={(!isOwner && props.cue.channelId && props.cue.channelId !== "")}
                apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                init={{
                    skin: "snow",
                    // toolbar_sticky: true,
                    branding: false,
                    readonly: (!isOwner && props.cue.channelId && props.cue.channelId !== ""),
                    placeholder: 'Content...',
                    min_height: 500,
                    paste_data_images: true,
                    images_upload_url: 'https://api.cuesapp.co/api/imageUploadEditor',
                    mobile: {
                        plugins: (!isOwner && props.cue.channelId && props.cue.channelId !== "") ? 'print preview' : 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                    },
                    plugins: (!isOwner && props.cue.channelId && props.cue.channelId !== "") ? 'print preview' : 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                    menu: { // this is the complete default configuration
                        file: { title: 'File', items: 'newdocument' },
                        edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                        insert: { title: 'Insert', items: 'link media | template hr' },
                        view: { title: 'View', items: 'visualaid' },
                        format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat' },
                        table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                        tools: { title: 'Tools', items: 'spellchecker code' }
                    },
                    setup: (editor: any) => {

                        const equationIcon = '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>'
                        editor.ui.registry.addIcon('formula', equationIcon)
                        
                        editor.ui.registry.addButton("formula", {
                          icon: 'formula',
                          // text: "Upload File",
                          tooltip: 'Insert equation',
                          onAction: () => {
                            setShowEquationEditor(!showEquationEditor)
                          }
                        });

                        editor.ui.registry.addButton("upload", {
                          icon: 'upload',
                          tooltip: 'Import File (pdf, docx, media, etc.)',
                          onAction: async () => {
                            const res = await handleFile(false);

                            console.log("File upload result", res);

                            if (!res || res.url === "" || res.type === "") {
                              return;
                            }

                            updateAfterFileImport(res.url, res.type);
                            
                          }
                        })
                    },
                    // menubar: 'file edit view insert format tools table tc help',
                    menubar: false,
                    toolbar: (!isOwner && props.cue.channelId && props.cue.channelId !== "") ? false : 'undo redo | bold italic underline strikethrough | formula superscript subscript | fontselect fontSizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat  pagebreak | table image upload link media | preview print | charmap emoticons |  ltr rtl | showcomments addcomment',
                    importcss_append: true,
                    image_caption: true,
                    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
                    noneditable_noneditable_class: 'mceNonEditable',
                    toolbar_mode: 'sliding',
                    // tinycomments_mode: 'embedded',
                    // content_style: '.mymention{ color: gray; }',
                    // contextmenu: 'link image table configurepermanentpen',
                    // a11y_advanced_options: true,
                    extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                    // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                    // content_css: useDarkMode ? 'dark' : 'default',
                }}
                onChange={(e: any) => setOriginal(e.target.getContent())}
            />
            {/* {renderSaveCueButton()} */}
        </View>)

    }

    const renderSaveCueButton = () => {

        return (isOwner || !props.cue.channelId) ?
            <View
                style={{
                    backgroundColor: "white",
                    flexDirection: "row",
                }}
            >
                <TouchableOpacity
                    onPress={() => {

                        Alert("Update content?", "", [
                            {
                                text: "Cancel",
                                style: "cancel",
                                onPress: () => {
                                    return;
                                }
                            },
                            {
                                text: "Yes",
                                onPress: () => {
                                    handleUpdateContent()
                                }
                            }
                        ])

                    }}

                    disabled={updatingCueContent}
                    style={{
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
                            color: '#fff',
                            fontSize: 12,
                            // borderWidth: 1,
                            backgroundColor: '#006AFF',
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            height: 35,
                            // paddingTop: 2
                            // width: 125,
                            borderRadius: 15,
                            textTransform: "uppercase"
                        }}>
                        {updatingCueContent ? 'SAVING...' : 'SAVE'}
                        {/* <Ionicons name={updatingCueContent ? 'ellipsis-horizontal-outline' : 'cloud-upload-outline'} size={18} color={'#006AFF'} /> */}
                    </Text>
                </TouchableOpacity>
            </View > : null
    }
    // Make sure that when the deadline has passed that the viewSubmission is set to true by default and that (Re-Submit button is not there)

    const renderViewSubmission = () => {
        const attempt = submissionAttempts[submissionAttempts.length - 1];

        return (<View style={{ width: '100%', marginTop: 20 }}>
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
                                    fontSize: 14,
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
                            <ReactPlayer url={attempt.url} controls={true} width={"100%"} height={"100%"} />
                        </View>

                        :
                        <View style={{ width: '100%', marginTop: 25 }} key={JSON.stringify(viewSubmission) + JSON.stringify(attempt) + JSON.stringify(props.showOriginal) + JSON.stringify(submissionAttempts)} >
                            {attempt.title !== "" ? <Text
                                style={{
                                    fontSize: 14,
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
                            <div className="webviewer" ref={submissionViewerRef} key={JSON.stringify(viewSubmission) + JSON.stringify(attempt) + JSON.stringify(props.showOriginal) + JSON.stringify(submissionAttempts)} style={{ height: Dimensions.get('window').width < 768 ? "50vh" : "70vh" }}></div>
                        </View>)
                    :
                    <View style={{ width: '100%', marginTop: 25 }} key={JSON.stringify(attempt)}>
                        {viewSubmissionTab === "mySubmission" ?
                            <div className="mce-content-body htmlParser" style={{ width: '100%', color: 'black' }}>
                                {parser(attempt.html)}
                            </div> :
                            <div className="webviewer" ref={submissionViewerRef} style={{ height: Dimensions.get('window').width < 768 ? "50vh" : "70vh" }} key={viewSubmissionTab}></div>
                        }
                    </View>

            }
        </View>)

    }

    const renderRichEditorModified = () => {

        return <Editor
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={initialSubmissionDraft}
            disabled={props.cue.releaseSubmission || (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil)}
            apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
            init={{
                skin: "snow",
                branding: false,
                placeholder: 'Content...',
                readonly: props.cue.releaseSubmission || (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil),
                min_height: 500,
                paste_data_images: true,
                images_upload_url: 'https://api.cuesapp.co/api/imageUploadEditor',
                mobile: {
                    plugins: 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                },
                plugins: 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                menu: { // this is the complete default configuration
                    file: { title: 'File', items: 'newdocument' },
                    edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                    insert: { title: 'Insert', items: 'link media | template hr' },
                    view: { title: 'View', items: 'visualaid' },
                    format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat' },
                    table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                    tools: { title: 'Tools', items: 'spellchecker code' }
                },
                setup: (editor: any) => {

                    const equationIcon = '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>'
                    editor.ui.registry.addIcon('formula', equationIcon)
                    
                    editor.ui.registry.addButton("formula", {
                      icon: 'formula',
                      // text: "Upload File",
                      tooltip: 'Insert equation',
                      onAction: () => {
                        setShowEquationEditor(!showEquationEditor)
                      }
                    });

                    editor.ui.registry.addButton("upload", {
                      icon: 'upload',
                      tooltip: 'Import File (pdf, docx, media, etc.)',
                      onAction: async () => {
                        const res = await handleFile(false);

                        console.log("File upload result", res);

                        if (!res || res.url === "" || res.type === "") {
                          return;
                        }

                        updateAfterFileImport(res.url, res.type);
                        
                      }
                    })
                },
                // menubar: 'file edit view insert format tools table tc help',
                menubar: false,
                toolbar: props.cue.releaseSubmission || (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil) ? false : 'undo redo | bold italic underline strikethrough | formula superscript subscript | fontselect fontSizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | forecolor backcolor casechange permanentpen formatpainter removeformat  pagebreak | table image upload link media | preview print | charmap emoticons |  ltr rtl | showcomments addcomment',
                importcss_append: true,
                image_caption: true,
                quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
                noneditable_noneditable_class: 'mceNonEditable',
                toolbar_mode: 'sliding',
                tinycomments_mode: 'embedded',
                content_style: '.mymention{ color: gray; }',
                // contextmenu: 'link image imagetools table configurepermanentpen',
                a11y_advanced_options: true,
                extended_valid_elements: "svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]"
                // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                // content_css: useDarkMode ? 'dark' : 'default',
            }}
            onChange={(e: any) => setSubmissionDraft(e.target.getContent())}
        />
    };

    const renderShareWithOptions = () => {
        return props.cue.channelId !== "" && isOwner ? (
            <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row' }}>
                <View
                    style={{
                        paddingBottom: 15,
                        backgroundColor: "white",
                        flex: 1, flexDirection: 'row',
                    }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Inter'
                        // textTransform: 'uppercase'
                    }}>
                        {props.cue.channelId && props.cue.channelId !== "" ? "Restrict Access" : "Saved In"}
                    </Text>
                </View>
                <View>
                    {
                        props.cue.channelId !== "" ? (<View>
                            <View style={{ flexDirection: "row", justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                                <View
                                    style={{
                                        backgroundColor: "white",
                                        height: 40,
                                        marginRight: 10,
                                    }}
                                >
                                    <Switch
                                        value={limitedShares}
                                        onValueChange={() => {
                                            setLimitedShares(!limitedShares);
                                        }}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: "#F8F9FA",
                                            true: "#006AFF",
                                        }}
                                        activeThumbColor="white"
                                    />
                                </View>
                            </View>
                        </View>) : null
                    }
                    {limitedShares ? <View
                        style={{
                            flexDirection: "column",
                            overflow: "scroll",
                            maxWidth: 400,
                        }}>
                        <View
                            key={JSON.stringify(selected)}
                            style={{
                                width: "90%",
                                padding: 5,
                                height: "auto",
                                minWidth: 300
                            }}>
                            <Select
                                value={selected}
                                isMulti
                                styles={reactSelectStyles}
                                isClearable={selected.some((v: any) => !v.isFixed)}
                                name="Share With"
                                className="basic-multi-select"
                                classNamePrefix="select"
                                onChange={onChange}
                                options={subscribers}
                            />

                            {/* <Multiselect
                                placeholder='Share with...'
                                displayValue='name'
                                // key={userDropdownOptions.toString()}
                                // style={{ width: '100%', color: '#000000', 
                                //     optionContainer: { // To change css for option container 
                                //         zIndex: 9999
                                //     }
                                // }}
                                options={subscribers} // Options to display in the dropdown
                                selectedValues={selected} // Preselected value to persist in dropdown
                                disabledPreselected={true}
                                onSelect={(e, f) => {
                                    console.log("Add back", f)
                                    const server = fetchAPI("");
                                    server
                                        .mutate({
                                            mutation: shareCueWithMoreIds,
                                            variables: {
                                                cueId: props.cue._id,
                                                userId: f.id
                                            }
                                        })
                                        .then(res => {
                                            if (res.data && res.data.cue.shareCueWithMoreIds) {

                                                loadChannelsAndSharedWith();
                                            }
                                        })
                                        .catch(err => console.log(err));

                                    setSelected(e);
                                    return true
                                }} // Function will trigger on select event
                                onRemove={(e, f) => {
                                    const addBack = [...e];
                                    addBack.push(f)
                                    console.log("Add back", addBack)
                                    setSelected([...addBack])

                                    Alert('Cannot un-share cue')
                                    return;
                                }}
                            /> */}
                        </View>
                    </View> : null}
                </View>
            </View>
        ) : null;
    };

    const renderSubmissionRequiredOptions = () => {
        return props.cue.channelId !== "" ? (
            <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        flexDirection: 'row', flex: 1,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Inter'
                    }}>{PreferredLanguageText("submissionRequired")}</Text>
                </View>
                <View>
                    <View style={{ flexDirection: "row", justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                        {isOwner ? (
                            (isQuiz ? null : <View
                                style={{
                                    backgroundColor: "white",
                                    height: 40,
                                    marginRight: 10
                                }}>
                                <Switch
                                    disabled={isQuiz}
                                    value={submission}
                                    onValueChange={() => {
                                        setSubmission(!submission);
                                    }}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: "#efefef",
                                        true: "#006AFF"
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>)
                        ) : (
                            <View style={{ flex: 1, backgroundColor: "#fff" }}>
                                <Text style={{ fontSize: 14, color: '#000000', textTransform: 'uppercase', fontFamily: 'Inter' }}>{!submission ? PreferredLanguageText("no") : null}</Text>
                            </View>
                        )}
                    </View>
                    {submission ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "#393939",
                                    textAlign: "right",
                                    paddingRight: 10,
                                    fontFamily: 'Inter'
                                }}>
                                Released
                            </Text>
                            {isOwner ? (
                                // <DatePicker
                                //     format="YYYY-MM-DD HH:mm"
                                //     size={'xs'}
                                //     value={initiateAt}
                                //     appearance={'subtle'}
                                //     preventOverflow={true}
                                //     onChange={(event: any) => {
                                //         const date = new Date(event);
                                //         setInitiateAt(date);
                                //     }}
                                // // isValidDate={disablePastDt}
                                // />
                                <MobiscrollDatePicker
                                    controls={['date', 'time']}
                                    touchUi={true}
                                    theme="ios"
                                    value={initiateAt}
                                    themeVariant="light"
                                    // inputComponent="input"
                                    inputProps={{
                                        placeholder: 'Please Select...'
                                    }}
                                    onChange={(event: any) => {
                                        const date = new Date(event.value);
                                        setInitiateAt(date);
                                    }}
                                    responsive={{
                                        xsmall: {
                                            controls: ['date', 'time'],
                                            display: 'bottom',
                                            touchUi: true
                                        },
                                        // small: {
                                        //     controls: ['date', 'time'],
                                        //     display: 'anchored',
                                        //     touchUi: true
                                        // },
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false
                                        },
                                    }}

                                />
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: "#393939",
                                        textAlign: "left",
                                        fontFamily: 'Inter'
                                    }}>
                                    {moment(new Date(initiateAt)).format('MMMM Do, h:mm a')}
                                </Text>
                            )}
                        </View>
                    ) : null}
                    {submission ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 10,
                                marginLeft: width < 768 ? 0 : 'auto'
                            }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "#393939",
                                    textAlign: "right",
                                    paddingRight: 10,
                                    fontFamily: 'Inter'
                                }}>
                                Due
                            </Text>
                            {isOwner ? (
                                // <DatePicker
                                //     preventOverflow={true}
                                //     value={deadline}
                                //     appearance={'subtle'}
                                //     format="YYYY-MM-DD HH:mm"
                                //     onChange={(event: any) => {
                                //         const date = new Date(event);

                                //         if (date < initiateAt) return;
                                //         setDeadline(date);
                                //     }}
                                //     size={'xs'}
                                // // isValidDate={disablePastDt}
                                // />
                                <MobiscrollDatePicker
                                    controls={['date', 'time']}
                                    touchUi={true}
                                    theme="ios"
                                    value={deadline}
                                    themeVariant="light"
                                    // inputComponent="input"
                                    inputProps={{
                                        placeholder: 'Please Select...'
                                    }}
                                    onChange={(event: any) => {
                                        const date = new Date(event.value);

                                        if (date < initiateAt) return;
                                        setDeadline(date);
                                    }}
                                    responsive={{
                                        xsmall: {
                                            controls: ['date', 'time'],
                                            display: 'bottom',
                                            touchUi: true
                                        },
                                        // small: {
                                        //     controls: ['date', 'time'],
                                        //     display: 'anchored',
                                        //     touchUi: true
                                        // },
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false
                                        },
                                    }}

                                />
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: "#393939",
                                        textAlign: "left",
                                        fontFamily: 'Inter'
                                    }}>
                                    {moment(new Date(deadline)).format('MMMM Do, h:mm a')}
                                </Text>
                            )}
                        </View>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    const renderGradeOptions = () => {
        return submission ? (
            <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        flexDirection: 'row', flex: 1,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Inter'
                    }}>Grade Weight</Text>
                </View>
                <View style={{}}>
                    {isOwner ? <View style={{ flexDirection: "row", justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                        <View
                            style={{
                                backgroundColor: "white",
                                height: 40,
                                marginRight: 10
                            }}>
                            <Switch
                                disabled={!isOwner}
                                value={graded}
                                onValueChange={() => setGraded(!graded)}
                                style={{ height: 20 }}
                                trackColor={{
                                    false: "#efefef",
                                    true: "#006AFF",
                                }}
                                activeThumbColor="white"
                            />
                        </View>
                    </View> : null}
                    {graded ? (
                        <View
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                                backgroundColor: "white",
                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                alignItems: 'center'
                            }}>
                            {isOwner ? (
                                <TextInput
                                    value={gradeWeight}
                                    style={{
                                        width: "25%",
                                        borderBottomColor: "#efefef",
                                        borderBottomWidth: 1,
                                        fontSize: 14,
                                        padding: 15,
                                        paddingVertical: 12,
                                        marginTop: 0,
                                    }}
                                    placeholder={"0-100"}
                                    onChangeText={val => setGradeWeight(val)}
                                    placeholderTextColor={"#393939"}
                                />
                            ) : null}
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "#393939",
                                    textAlign: "left",
                                    paddingRight: 10,
                                    // marginTop: isOwner ? 20 : 0,
                                    fontFamily: 'Inter'
                                }}>
                                {!isOwner ? gradeWeight : null} {PreferredLanguageText("percentageOverall")}
                            </Text>
                        </View>
                    ) :
                        (!isOwner ? <Text style={{
                            fontSize: 14,
                            color: "#393939",
                            textAlign: "left",
                            paddingRight: 10,
                            fontFamily: 'Inter'
                        }}>
                            0%
                        </Text> : null)}
                </View>
            </View>
        ) : null;
    };

    const renderLateSubmissionOptions = () => {
        return submission ? (
            <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        // width: 300,
                        flex: 1, flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Inter'
                    }}>Late Submission</Text>
                </View>
                <View style={{}}>
                    {isOwner ? <View style={{ flexDirection: "row", justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                        <View
                            style={{
                                backgroundColor: "white",
                                height: 40,
                                marginRight: 10
                            }}>
                            <Switch
                                disabled={!isOwner}
                                value={allowLateSubmission}
                                onValueChange={() => setAllowLateSubmission(!allowLateSubmission)}
                                style={{ height: 20 }}
                                trackColor={{
                                    false: "#efefef",
                                    true: "#006AFF",
                                }}
                                activeThumbColor="white"
                            />
                        </View>
                    </View> : null}
                    {allowLateSubmission ? (
                        <View
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                                backgroundColor: "white",
                                alignItems: 'center'
                            }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "#393939",
                                    textAlign: "left",
                                    paddingRight: 10,
                                    fontFamily: 'Inter'
                                }}>
                                {!isOwner ? (allowLateSubmission ? "Allowed until  " + moment(new Date(availableUntil)).format('MMMM Do, h:mm a') : "No") : "Allowed Until"}
                            </Text>
                            {isOwner ? (
                                // <DatePicker
                                //     preventOverflow={true}
                                //     value={availableUntil}
                                //     appearance={'subtle'}
                                //     format="YYYY-MM-DD HH:mm"
                                //     onChange={(event: any) => {
                                //         const date = new Date(event);

                                //         if (date < deadline) return;
                                //         setAvailableUntil(date);
                                //     }}
                                //     size={'xs'}
                                // // isValidDate={disablePastDt}
                                // />
                                <MobiscrollDatePicker
                                    controls={['date', 'time']}
                                    touchUi={true}
                                    theme="ios"
                                    value={availableUntil}
                                    themeVariant="light"
                                    // inputComponent="input"
                                    inputProps={{
                                        placeholder: 'Please Select...'
                                    }}
                                    onChange={(event: any) => {
                                        const date = new Date(event.value);

                                        if (date < deadline) return;
                                        setAvailableUntil(date);
                                    }}
                                    responsive={{
                                        xsmall: {
                                            controls: ['date', 'time'],
                                            display: 'bottom',
                                            touchUi: true
                                        },
                                        // small: {
                                        //     controls: ['date', 'time'],
                                        //     display: 'anchored',
                                        //     touchUi: true
                                        // },
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false
                                        },
                                    }}

                                />

                            ) : null}
                        </View>
                    ) :
                        (!isOwner ? <Text
                            style={{
                                fontSize: 14,
                                color: "#393939",
                                textAlign: "left",
                                paddingRight: 10,
                                fontFamily: 'Inter'
                            }}>
                            No
                        </Text> : null)}
                </View>
            </View>
        ) : null;
    }

    const renderAttemptsOptions = () => {
        return isQuiz ? (
            (!isOwner ?
                <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40, }}>
                    <View
                        style={{
                            flexDirection: 'row', flex: 1,
                            paddingBottom: 15,
                            backgroundColor: "white",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            Allowed Attempts
                        </Text>
                    </View>

                    <View
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            backgroundColor: "white",
                            justifyContent: 'flex-end'
                        }}
                    >
                        <Text style={{
                            fontSize: 14,
                            color: "#393939",
                            textAlign: "right",
                            paddingRight: 10,
                            fontFamily: 'Inter'
                        }}>
                            {unlimitedAttempts ? "Unlimited" : allowedAttempts}
                        </Text>
                    </View>
                </View>
                :
                <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40, }}>
                    <View
                        style={{
                            flexDirection: 'row', flex: 1,
                            paddingBottom: 15,
                            backgroundColor: "white",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            Multiple Attempts
                        </Text>
                    </View>
                    <View >
                        <View
                            style={{
                                backgroundColor: "white",
                                height: 40,
                                marginRight: 10,
                                flexDirection: 'row', justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                            }}
                        >
                            <Switch
                                value={unlimitedAttempts}
                                onValueChange={() => {
                                    if (!unlimitedAttempts) {
                                        setAllowedAttemps("")
                                    } else {
                                        setAllowedAttemps('1')
                                    }
                                    setUnlimitedAttempts(!unlimitedAttempts)
                                }}
                                style={{ height: 20 }}
                                trackColor={{
                                    false: "#efefef",
                                    true: "#006AFF",
                                }}
                                activeThumbColor="white"
                            />
                        </View>

                        {!unlimitedAttempts ? (
                            <View
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: 'flex-end',
                                    backgroundColor: "white",
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={styles.text}>
                                    Allowed attempts
                                </Text>
                                <TextInput
                                    value={allowedAttempts}
                                    style={{
                                        width: "25%",
                                        borderBottomColor: "#F8F9FA",
                                        borderBottomWidth: 1,
                                        fontSize: 14,
                                        padding: 15,
                                        paddingVertical: 12,
                                        marginTop: 0,
                                    }}
                                    placeholder={""}
                                    onChangeText={(val) => {
                                        if (Number.isNaN(Number(val))) return;
                                        setAllowedAttemps(val)
                                    }}
                                    placeholderTextColor={"#393939"}
                                />
                            </View>
                        ) : null}
                    </View>
                </View>)
        ) : null
    }


    const renderCategoryOptions = () => {

        if (!initializedCustomCategories) return;

        return (props.cue.channelId && props.cue.channelId !== "" && isOwner) ||
            !props.channelId ||
            props.channelId === "" ? (
            <View
                style={{
                    width: "100%",
                    borderRightWidth: 0,
                    flexDirection: width < 768 ? 'column' : 'row',
                    alignItems: width < 768 ? 'flex-start' : 'center',
                    paddingTop: 40,
                    paddingBottom: 15,
                    borderColor: "#efefef",
                }}>
                <View
                    style={{
                        flexDirection: 'row', 
                        flex: 1,
                        backgroundColor: "white",
                        paddingBottom: width < 768 ? 15 : 0
                    }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Inter'
                    }}>{PreferredLanguageText("category")}</Text>
                </View>
                <View style={{}}>
                    {props.cue.channelId && !props.channelOwner ? (
                        <View
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "row",
                                backgroundColor: "white"
                            }}>
                            <View style={{ width: "85%", backgroundColor: "white" }}>
                                <View style={styles.colorBar}>
                                    <TouchableOpacity style={styles.allGrayOutline} onPress={() => { }}>
                                        <Text
                                            style={{
                                                color: "#000000",
                                                lineHeight: 20,
                                                fontSize: 12
                                            }}>
                                            {props.cue.customCategory === "" ? PreferredLanguageText("none") : props.cue.customCategory}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                // width: "100%",
                                // display: "flex",
                                flexDirection: "row",
                                alignItems: 'center',
                                backgroundColor: "white"
                            }}>
                            <View style={{ backgroundColor: "white" }}>
                                {addCustomCategory ? (
                                    <View style={styles.colorBar}>
                                        <TextInput
                                            value={customCategory}
                                            style={{
                                                borderRadius: 0,
                                                borderColor: '#efefef',
                                                borderBottomWidth: 1,
                                                fontSize: 14,
                                                height: '2.75em',
                                                padding: '1em'
                                            }}
                                            placeholder={"Enter Category"}
                                            onChangeText={val => {
                                                setCustomCategory(val);
                                            }}
                                            placeholderTextColor={"#393939"}
                                        />
                                    </View>
                                ) : (
                                    // <Menu
                                    //     onSelect={(cat: any) => setCustomCategory(cat)}>
                                    //     <MenuTrigger>
                                    //         <Text style={{
                                    //             fontSize: 12,
                                    //             color: "#393939",
                                    //             textAlign: "right",
                                    //             paddingRight: 10,
                                    //             // paddingTop: 5
                                    //         }}>
                                    //             {customCategory === '' ? 'None' : customCategory}<Ionicons name='chevron-down-outline' size={15} />
                                    //         </Text>
                                    //     </MenuTrigger>
                                    //     <MenuOptions customStyles={{
                                    //         optionsContainer: {
                                    //             padding: 10,
                                    //             borderRadius: 15,
                                    //             shadowOpacity: 0,
                                    //             borderWidth: 1,
                                    //             borderColor: '#efefef',
                                    //             overflow: 'scroll',
                                    //             maxHeight: '100%'
                                    //         }
                                    //     }}>
                                    //         <MenuOption
                                    //             value={''}>
                                    //             <Text>
                                    //                 None
                                    //             </Text>
                                    //         </MenuOption>
                                    //         {
                                    //             customCategories.map((category: any) => {
                                    //                 return <MenuOption
                                    //                     value={category}>
                                    //                     <Text>
                                    //                         {category}
                                    //                     </Text>
                                    //                 </MenuOption>
                                    //             })
                                    //         }
                                    //     </MenuOptions>
                                    // </Menu>
                                    <label style={{ width: 180 }}>
                                        <MobiscrollSelect
                                            value={customCategory}
                                            rows={customCategories.length + 1}
                                            data={categoryOptions}
                                            theme="ios"
                                            themeVariant="light"
                                            touchUi={true}
                                            responsive={{
                                                small: {
                                                    display: 'bubble'
                                                },
                                                medium: {
                                                    touchUi: false,
                                                }
                                            }}
                                            onChange={(val: any) => {
                                                if (!initializedCustomCategories) return;
                                                setCustomCategory(val.value)
                                            }}
                                        />

                                    </label>
                                )}
                            </View>
                            <View style={{ backgroundColor: "white", paddingLeft: 20 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (addCustomCategory) {
                                            setCustomCategory("None");
                                            setAddCustomCategory(false);
                                        } else {
                                            setCustomCategory("");
                                            setAddCustomCategory(true);
                                        }
                                    }}
                                    style={{ backgroundColor: "white" }}>
                                    <Text
                                        style={{
                                            textAlign: "right",
                                            lineHeight: 20,
                                            width: "100%"
                                        }}>
                                        <Ionicons name={addCustomCategory ? "close" : "create-outline"} size={18} color={"#000000"} />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        ) : null;
    };

    const renderPriorityOptions = () => {
        return (
            <View
                style={{
                    width: "100%",
                    borderRightWidth: 0,
                    flexDirection: width < 768 ? 'column' : 'row',
                    alignItems: width < 768 ? 'flex-start' : 'center',
                    paddingTop: 40,
                    borderColor: "#efefef",
                    paddingBottom: 15
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        backgroundColor: "white",
                        paddingBottom: width < 768 ? 15 : 0
                    }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Inter'
                    }}>{PreferredLanguageText("priority")}</Text>
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        backgroundColor: "white",
                    }}
                >
                    <View style={{ width: "100%", backgroundColor: "white" }}>
                        <ScrollView
                            style={{ ...styles.colorBar, height: 20 }}
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}>
                            {colorChoices.map((c: string, i: number) => {
                                return (
                                    <View style={color == i ? styles.colorContainerOutline : styles.colorContainer} key={Math.random()}>
                                        <TouchableOpacity
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                backgroundColor: colorChoices[i]
                                            }}
                                            onPress={() => {
                                                setColor(i);
                                            }}
                                        />
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </View>
        );
    };

    const renderForwardOptions = () => {

        const filterChannelsWithoutCurrent = channels.filter((channel: any) => channel._id !== props.channelId)

        const channelOptions = [{ _id: 'None', name: 'None' }, ...filterChannelsWithoutCurrent]

        return channels.length === 0 || !isOwner ? null : (
            <View
                style={{
                    width: "100%",
                    flexDirection: width < 768 ? 'column' : 'row',
                    alignItems: width < 768 ? 'flex-start' : 'center',
                    borderRightWidth: 0,
                    borderColor: "#efefef",
                    paddingTop: 40,
                    paddingBottom: 15
                }}>
                <View
                    style={{
                        flexDirection: 'row', flex: 1,
                        // paddingTop: 40,
                        backgroundColor: "white",
                        paddingBottom: width < 768 ? 15 : 0
                    }}>
                    <Text style={{
                        fontSize: 14,
                        color: '#000000',
                        fontFamily: 'Inter',
                    }}>Forward</Text>
                </View>
                <View
                    style={{
                        //width: "100%",
                        // display: "flex",
                        // paddingTop: 40,
                        flexDirection: "row",
                        backgroundColor: "white",
                        alignItems: 'center'
                    }}>
                    <label style={{ width: 180 }}>
                        <MobiscrollSelect
                            theme="ios"
                            themeVariant="light"
                            touchUi={true}
                            value={shareWithChannelId}
                            onChange={(val: any) => {
                                setShareWithChannelId(val.value);
                            }}
                            responsive={{
                                small: {
                                    display: 'bubble'
                                },
                                medium: {
                                    touchUi: false,
                                }
                            }}
                            data={channelOptions.map((channel: any) => {
                                return {
                                    value: channel._id,
                                    text: channel.name
                                }
                            })}
                        />
                    </label>



                    <View style={{ backgroundColor: "white", paddingLeft: 20 }}>
                        <TouchableOpacity
                            disabled={shareWithChannelId === "None"}
                            onPress={() => {
                                Alert("Forward cue?", "", [
                                    {
                                        text: "Cancel",
                                        style: "cancel",
                                        onPress: () => {
                                            return;
                                        }
                                    },
                                    {
                                        text: "Yes",
                                        onPress: () => {
                                            shareCue()
                                        }
                                    }]
                                )
                            }}
                            style={{ backgroundColor: "white" }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 20,
                                    width: "100%"
                                }}>
                                <Ionicons
                                    name={"arrow-redo-outline"}
                                    size={18}
                                    color={shareWithChannelId === "None" ? "#a0a0a0" : "#000000"}
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderReminderOptions = () => {
        return (
            <View
                style={{
                    width: "100%",
                    paddingTop: 15,
                    flexDirection: "column"
                }}>
                <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40, }}>
                    <View
                        style={{
                            // width: 300,
                            flexDirection: 'row', flex: 1,
                            paddingBottom: 15,
                            backgroundColor: "white"
                        }}>
                        <Text style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                        }}>Remind</Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: "white",
                            // width: "100%",
                            height: 40,
                        }}>
                        <Switch
                            value={notify}
                            onValueChange={() => {
                                if (notify) {
                                    // setShuffle(false)
                                    setFrequency("0");
                                } else {
                                    // setShuffle(true)
                                    setFrequency("1-D");
                                }
                                setPlayChannelCueIndef(true);
                                setNotify(!notify);
                            }}
                            style={{ height: 20 }}
                            trackColor={{
                                false: "#efefef",
                                true: "#006AFF"
                            }}
                            activeThumbColor="white"
                        />
                    </View>
                </View>
                {notify ? (
                    <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                        <View
                            style={{
                                // width: 300,
                                flex: 1, flexDirection: 'row',
                                paddingBottom: 15,
                                backgroundColor: "white"
                            }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}>Repeat</Text>
                        </View>
                        <View style={{}}>
                            <View
                                style={{
                                    backgroundColor: "white",
                                    height: 40,
                                    alignSelf: width < 768 ? 'flex-start' : 'flex-end'
                                }}>
                                <Switch
                                    value={!shuffle}
                                    onValueChange={() => setShuffle(!shuffle)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: "#efefef",
                                        true: "#006AFF",
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                            {!shuffle ? (
                                <View
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: 'center',
                                        backgroundColor: "white"
                                    }}>
                                    <Text style={{
                                        fontSize: 14,
                                        color: "#393939",
                                        textAlign: "right",
                                        paddingRight: 10,
                                        fontFamily: 'Inter'
                                    }}>{PreferredLanguageText("remindEvery")}</Text>
                                    <label style={{ width: 140 }}>
                                        <MobiscrollSelect
                                            theme="ios"
                                            themeVariant="light"
                                            touchUi={true}
                                            value={frequency}
                                            rows={timedFrequencyOptions.length}
                                            onChange={(val: any) => {
                                                setFrequency(val.value);
                                            }}
                                            responsive={{
                                                small: {
                                                    display: 'bubble'
                                                },
                                                medium: {
                                                    touchUi: false,
                                                }
                                            }}
                                            data={timedFrequencyOptions.map((freq: any) => {
                                                return {
                                                    value: freq.value,
                                                    text: freq.label
                                                }
                                            })}
                                        />
                                    </label>
                                    {/* <Menu
                                        onSelect={(cat: any) => {
                                            setFrequency(cat.value)
                                            setFrequencyName(cat.label)
                                        }}>
                                        <MenuTrigger>
                                            <Text style={{
                                                fontSize: 12,
                                                color: "#393939",
                                                textAlign: "right",
                                                paddingRight: 10,
                                                paddingTop: 3
                                            }}>
                                                {frequencyName}<Ionicons name='chevron-down-outline' size={15} />
                                            </Text>
                                        </MenuTrigger>
                                        <MenuOptions customStyles={{
                                            optionsContainer: {
                                                padding: 10,
                                                borderRadius: 15,
                                                shadowOpacity: 0,
                                                borderWidth: 1,
                                                borderColor: '#efefef',
                                                overflow: 'scroll',
                                                maxHeight: '100%'
                                            }
                                        }}>
                                            {
                                                timedFrequencyOptions.map((item: any) => {
                                                    return <MenuOption
                                                        value={item}>
                                                        <Text>
                                                            {item.value === '0' && props.channelId !== '' ? 'Once' : item.label}
                                                        </Text>
                                                    </MenuOption>
                                                })
                                            }
                                        </MenuOptions>
                                    </Menu> */}
                                </View>
                            ) : (
                                <View
                                    style={{
                                        width: "100%",
                                        flex: 1,
                                        flexDirection: "row",
                                        backgroundColor: "white"
                                    }}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{
                                            height: 5
                                        }} />
                                        <Text style={{
                                            fontSize: 12,
                                            color: "#393939",
                                            textAlign: "right",
                                            paddingRight: 10,
                                            marginTop: 5,
                                            fontFamily: 'Inter'
                                            // paddingTop: 5,
                                            // lineHeight: 35,
                                            // height: 35
                                        }}>{PreferredLanguageText("remindOn")}
                                        </Text>
                                    </View>
                                    <View>
                                        {/* <DatePicker
                                            style={{}}
                                            preventOverflow={true}
                                            value={endPlayAt}
                                            appearance={'subtle'}
                                            format="YYYY-MM-DD HH:mm"
                                            onChange={(event: any) => {
                                                const date = new Date(event);
                                                if (date < new Date()) return;

                                                setEndPlayAt(date);
                                            }}
                                            // isValidDate={disablePastDt}
                                            size={'xs'}
                                        /> */}

                                        <MobiscrollDatePicker
                                            controls={['date', 'time']}
                                            touchUi={true}
                                            theme="ios"
                                            value={endPlayAt}
                                            themeVariant="light"
                                            // inputComponent="input"
                                            inputProps={{
                                                placeholder: 'Please Select...'
                                            }}
                                            onChange={(event: any) => {
                                                const date = new Date(event.value);
                                                if (date < new Date()) return;

                                                setEndPlayAt(date);
                                            }}
                                            responsive={{
                                                xsmall: {
                                                    controls: ['date', 'time'],
                                                    display: 'bottom',
                                                    touchUi: true
                                                },
                                                // small: {
                                                //     controls: ['date', 'time'],
                                                //     display: 'anchored',
                                                //     touchUi: true
                                                // },
                                                medium: {
                                                    controls: ['date', 'time'],
                                                    display: 'anchored',
                                                    touchUi: false
                                                },
                                            }}

                                        />

                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}
                {notify && !shuffle ? (
                    <View style={{ width: "100%", flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40, }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                flex: 1,
                                paddingBottom: 15,
                                backgroundColor: "white"
                            }}>
                            <Text style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}>Indefinitely</Text>
                        </View>
                        <View>
                            <View
                                style={{
                                    backgroundColor: "white",
                                    height: 40,
                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                    flexDirection: 'row'
                                }}>
                                <Switch
                                    value={playChannelCueIndef}
                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: "#efefef",
                                        true: "#006AFF",
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                            {playChannelCueIndef ? null : (
                                <View
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "row",
                                        backgroundColor: "white",
                                    }}>
                                    <Text style={styles.text}>{PreferredLanguageText("remindTill")}</Text>
                                    {/* <DatePicker
                                        preventOverflow={true}
                                        format="YYYY-MM-DD HH:mm"
                                        appearance={'subtle'}
                                        onChange={(event: any) => {
                                            const date = new Date(event);
                                            if (date < new Date()) return;

                                            setEndPlayAt(date);
                                        }}
                                        value={endPlayAt}
                                        size={'xs'}
                                    /> */}

                                    <MobiscrollDatePicker
                                        controls={['date', 'time']}
                                        touchUi={true}
                                        theme="ios"
                                        value={endPlayAt}
                                        themeVariant="light"
                                        // inputComponent="input"
                                        inputProps={{
                                            placeholder: 'Please Select...'
                                        }}
                                        onChange={(event: any) => {
                                            const date = new Date(event.value);
                                            if (date < new Date()) return;

                                            setEndPlayAt(date);
                                        }}
                                        responsive={{
                                            xsmall: {
                                                controls: ['date', 'time'],
                                                display: 'bottom',
                                                touchUi: true
                                            },
                                            // small: {
                                            //     controls: ['date', 'time'],
                                            //     display: 'anchored',
                                            //     touchUi: true
                                            // },
                                            medium: {
                                                controls: ['date', 'time'],
                                                display: 'anchored',
                                                touchUi: false
                                            },
                                        }}

                                    />

                                </View>
                            )}
                        </View>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderFooter = () => {

        return (
            <View style={styles.footer}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "white",
                        justifyContent: "center",
                        display: "flex",
                        flexDirection: "row",
                        height: 50,
                        paddingTop: 10
                    }}>
                    {!isOwner && props.cue.channelId && props.cue.channelId !== "" && submission ? (
                        <TouchableOpacity
                            disabled={
                                // Late submission not allowed then no submission after deadline has passed
                                (!allowLateSubmission && new Date() > deadline) ||
                                // If late submission allowed, then available until should be the new deadline
                                (allowLateSubmission && new Date() > availableUntil) ||
                                // Once release Submission that means assignment should be locked
                                (props.cue.releaseSubmission) ||
                                // if timed quiz not initiated
                                (isQuiz && isQuizTimed && !initiatedAt) ||
                                // If no more remaining attempts for quiz
                                (isQuiz && remainingAttempts === 0) || isSubmitting
                            }
                            onPress={() => handleSubmit()}
                            style={{ backgroundColor: "white", borderRadius: 15 }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    color: "white",
                                    fontSize: 12,
                                    backgroundColor: "#006AFF",
                                    borderRadius: 15,
                                    paddingHorizontal: 20,
                                    fontFamily: "inter",
                                    overflow: "hidden",
                                    height: 35,
                                    textTransform: 'uppercase'
                                }}>
                                {
                                    (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil) || (isQuiz && remainingAttempts === 0) || (props.cue.releaseSubmission && !props.cue.graded)
                                        ? "Submission Ended" : ((props.cue.graded && !isQuiz) ? PreferredLanguageText("graded") : (isSubmitting ? "Submitting..." : PreferredLanguageText("submit")))
                                }
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    const renderDeleteButtons = () => {
        return (
            <View
                style={{
                    // flex: 1,
                    backgroundColor: "white",
                    // alignItems: "center",
                    flexDirection: "row",
                    // height: 50,
                    // paddingTop: 10
                }}>
                <TouchableOpacity disabled={updatingCueDetails} onPress={() => {
                    Alert("Update options?", "", [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                return;
                            }
                        },
                        {
                            text: "Yes",
                            onPress: () => {
                                handleUpdateDetails()
                            }
                        }
                    ])
                }} style={{
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
                            backgroundColor: '#006AFF',
                            fontSize: 12,
                            color: '#fff',
                            // borderWidth: 1,
                            // borderColor: '#006AFF',
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            height: 35,
                            // paddingTop: 2
                            // width: 125,
                            borderRadius: 15,
                            textTransform: "uppercase"
                        }}>
                        {updatingCueContent ? '...' : 'SAVE'}
                        {/* <Ionicons name={updatingCueContent ? 'ellipsis-horizontal-outline' : 'cloud-upload-outline'} size={18} color={'#006AFF'} /> */}
                    </Text>
                </TouchableOpacity>

                {isOwner || !props.cue.channelId || props.cue.channelId === "" ? (
                    <TouchableOpacity onPress={() => handleDelete()} style={{
                        backgroundColor: "white", borderRadius: 15, marginLeft: 15,
                        marginTop: 6,
                    }}>
                        <Text style={{
                            textAlign: "center",
                            lineHeight: 35,
                            color: '#006AFF',
                            fontSize: 12,
                            borderWidth: 1,
                            borderColor: '#006AFF',
                            paddingHorizontal: 20,
                            fontFamily: "inter",
                            height: 35,
                            // paddingTop: 2
                            // width: 125,
                            borderRadius: 15,
                            textTransform: "uppercase"
                        }}>
                            Delete
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        );
    };


    if (initiateAt > new Date() && !isOwner) {
        return (<View style={{ minHeight: Dimensions.get('window').height }}>
            <View style={{ backgroundColor: 'white', flex: 1, }}>
                <Text style={{ width: '100%', color: '#393939', fontSize: 20, paddingTop: 200, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1, textAlign: 'center' }}>
                    Available from {moment(initiateAt).format('MMMM Do YYYY, h:mm a')}
                </Text>
            </View>
        </View>)
    }

    // if (isQuiz && props.cue.submission && props.cue.submittedAt !== null && !props.cue.releaseSubmission && !isOwner) {
    //     return (<View style={{ minHeight: Dimensions.get('window').height }}>
    //         <View style={{ backgroundColor: 'white', flex: 1, }}>
    //             <Text style={{ width: '100%', color: '#393939', fontSize: 20, paddingTop: 200, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1, textAlign: 'center' }}>
    //                 Quiz submitted. You will be notified when scores are released.
    //             </Text>
    //         </View>
    //     </View>)
    // }

    // MAIN RETURN
    return (
        <View
            style={{
                width: "100%",
                // height: Dimensions.get('window').height ,
                backgroundColor: "white",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                // paddingHorizontal: 20
                paddingBottom: 50
                // overflow: 'hidden'
            }}>
            <Animated.View
                style={{
                    width: "100%",
                    backgroundColor: "white",
                    opacity: 1,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    height: '100%',
                    paddingTop: 10
                }}>
                {/* <Text
                    style={{
                        width: "100%",
                        textAlign: "center",
                        height: 15,
                        paddingBottom: 30
                    }}>
                    {/* <Ionicons name='chevron-down' size={15} color={'#e0e0e0'} /> 
                </Text> */}

                {props.cue.channelId && props.cue.channelId !== "" ? (
                    <View
                        style={{
                            width: "100%",
                            flexDirection: "row",
                            marginBottom: 5
                        }}>
                        {/* {renderCueTabs()} */}
                        {!isOwner && props.cue.graded && props.cue.score !== undefined && props.cue.score !== null && !isQuiz && props.cue.releaseSubmission && (props.showOriginal || props.showOptions) ? (
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: "white",
                                    height: 22,
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 15,
                                    backgroundColor: "#006AFF",
                                    lineHeight: 20,
                                    paddingTop: 1
                                }}>
                                {props.cue.score}%
                            </Text>
                        ) : null}
                        {
                            !isOwner && props.cue.submittedAt !== "" && (new Date(props.cue.submittedAt) >= deadline) ?
                                <View style={{ borderRadius: 1, padding: 5, borderWidth: 1, borderColor: '#f94144', marginLeft: 15, }}>
                                    <Text style={{ color: '#f94144', fontSize: 12, textAlign: 'center' }}>
                                        LATE
                                    </Text>
                                </View>
                                :
                                null
                        }
                        {/* <TouchableOpacity
                            onPress={() => setStarred(!starred)}
                            style={{
                                backgroundColor: "white",
                                flex: 1
                            }}>
                            <Text
                                style={{
                                    textAlign: "right",
                                    lineHeight: 35,
                                    marginTop: -31,
                                    // paddingRight: 25,
                                    width: "100%"
                                }}>
                                <Ionicons name="bookmark" size={40} color={starred ? "#f94144" : "#393939"} />
                            </Text>
                        </TouchableOpacity> */}
                    </View>
                ) : (
                    null
                    // <View style={{ flexDirection: "row", }}>
                    //     {/* <View style={{}}>
                    //         <TouchableOpacity
                    //             style={{
                    //                 justifyContent: 'center',
                    //                 flexDirection: 'column',
                    //                 marginRight: 10,
                    //                 paddingTop: 2
                    //             }}
                    //             onPress={() => {
                    //                 props.closeModal()
                    //             }}>
                    //             <Text>
                    //                 <Ionicons name='chevron-back-outline' size={30} color={'#393939'} />
                    //             </Text>
                    //         </TouchableOpacity>
                    //     </View> */}
                    //     <TouchableOpacity
                    //         style={{
                    //             justifyContent: "center",
                    //             flexDirection: "column"
                    //         }}
                    //         onPress={() => {
                    //             props.setShowOptions(false)
                    //         }}
                    //     >
                    //         <Text style={!props.showOptions ? styles.allGrayFill : styles.all}>
                    //             Content
                    //         </Text>
                    //     </TouchableOpacity>
                    //     <TouchableOpacity
                    //         style={{
                    //             justifyContent: "center",
                    //             flexDirection: "column"
                    //         }}
                    //         onPress={() => {
                    //             props.setShowOptions(true)
                    //         }}>
                    //         <Text style={props.showOptions ? styles.allGrayFill : styles.all}>
                    //             Details
                    //         </Text>
                    //     </TouchableOpacity>
                    // </View>
                )}
                {(props.showOptions || props.showComments || isOwner || props.showOriginal || props.viewStatus || !submission || isQuiz) ? null : renderSubmissionHistory()}
                {
                    props.showOptions || props.showComments || viewSubmission ?
                        <View
                            style={{
                                // borderBottomWidth: ((props.cue.channelId && props.cue.channelId !== '' && !isOwner && props.showOriginal) || (props.showOriginal && showImportOptions) || isQuiz)
                                //     || (((props.cue.graded && submission && !isOwner) && !props.showOriginal) || (!props.showOriginal && showImportOptions))
                                //     || (!props.showOriginal && submissionImported) || (imported && props.showOriginal) || props.showOptions || props.showComments || viewSubmission
                                //     ? 0 : 1,
                                marginTop: 20,
                                borderBottomColor: '#efefef'
                            }}
                        />
                        :
                        <View
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: Dimensions.get("window").width < 768 ? "column-reverse" : "row",
                                marginBottom: 5,
                                backgroundColor: "white",
                                // marginTop: 20,
                                // borderBottomWidth: ((props.cue.channelId && props.cue.channelId !== '' && !isOwner && props.showOriginal) || (props.showOriginal && showImportOptions) || isQuiz)
                                //     || (((props.cue.graded && submission && !isOwner) && !props.showOriginal) || (!props.showOriginal && showImportOptions))
                                //     || (!props.showOriginal && submissionImported) || (imported && props.showOriginal) || props.showOptions || props.showComments || viewSubmission
                                //     ? 0 : 1,
                                borderBottomColor: '#efefef'
                            }}
                            onTouchStart={() => Keyboard.dismiss()}>
                            <View
                                style={{
                                    flexDirection: Dimensions.get("window").width < 768 ? "column" : "row",
                                    flex: 1,
                                }}>
                                {/* {renderRichToolbar()} */}
                                {(!props.showOriginal && props.cue.submission && !submissionImported && showImportOptions)
                                    || (props.showOriginal && showImportOptions && (isOwner || !props.cue.channelId)) ? (
                                    <FileUpload
                                        back={() => setShowImportOptions(false)}
                                        onUpload={(u: any, t: any) => {
                                            if (props.showOriginal) {
                                                setOriginal(JSON.stringify({
                                                    url: u, type: t, title
                                                }))
                                            } else {
                                                setSubmissionDraft(JSON.stringify({
                                                    url: u, type: t, title: submissionTitle, annotations: ''
                                                }))
                                                setSubmissionImported(true);
                                                setSubmissionType(t);
                                                setSubmissionUrl(u);
                                            }
                                            setShowImportOptions(false);
                                        }}
                                    />
                                ) : null}
                            </View>
                            <View style={{ backgroundColor: '#fff', flexDirection: 'row', marginBottom: 5 }}>
                                {(!props.showOriginal && !submissionImported && !props.cue.graded && !props.cue.releaseSubmission && !(!allowLateSubmission && new Date() > deadline) && !(allowLateSubmission && new Date() > availableUntil))
                                    || (props.showOriginal && (isOwner || !props.cue.channelId) && !imported && !isQuiz)
                                    ? (
                                        <Text
                                            style={{
                                                lineHeight: 35,
                                                textAlign: "right",
                                                paddingRight: 20,
                                                textTransform: "uppercase",
                                                fontSize: 12,
                                                fontFamily: 'overpass',
                                                color: '#006AFF',
                                            }}
                                            onPress={() => setShowEquationEditor(!showEquationEditor)}>
                                            {PreferredLanguageText("formula")}
                                        </Text>
                                    ) : null}
                                {!props.showOriginal &&
                                    props.cue.submission &&
                                    currentDate < deadline &&
                                    !submissionImported &&
                                    !showImportOptions &&
                                    !props.cue.graded && !isQuiz && !props.cue.releaseSubmission && !(!allowLateSubmission && new Date() > deadline) && !(allowLateSubmission && new Date() > availableUntil) ? (
                                    <FileUpload
                                        back={() => setShowImportOptions(false)}
                                        onUpload={(u: any, t: any) => {
                                            if (props.showOriginal) {
                                                setOriginal(JSON.stringify({
                                                    url: u, type: t, title
                                                }))
                                            } else {
                                                setSubmissionDraft(JSON.stringify({
                                                    url: u, type: t, title: submissionTitle, annotations: ''
                                                }))
                                                setSubmissionImported(true);
                                                setSubmissionType(t);
                                                setSubmissionUrl(u);
                                            }
                                            setShowImportOptions(false);
                                        }}
                                    />
                                ) : (
                                    (props.showOriginal && !isOwner && props.cue.channelId && props.cue.channelId !== "") || // viewing import as non import (Channel cues)
                                        (props.showOriginal && (isOwner && props.cue.channelId && props.cue.channelId !== "") && imported) ||  // viewing import as owner (Channel cues)
                                        (props.showOriginal && !props.cue.channelId && imported) || // Local Cues
                                        (!props.showOriginal && isOwner && (props.cue.channelId && props.cue.channelId !== '')) || // no submission as owner
                                        (!props.showOriginal && submissionImported && !isOwner) ||  // submitted as non owner
                                        (!props.showOriginal && !submission && (props.cue.channelId && props.cue.channelId !== '')) ||  // Home
                                        isQuiz
                                        || (!props.showOriginal && (props.cue.releaseSubmission || (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil)))
                                        ? null :
                                        (
                                            <FileUpload
                                                back={() => setShowImportOptions(false)}
                                                onUpload={(u: any, t: any) => {
                                                    if (props.showOriginal) {
                                                        setOriginal(JSON.stringify({
                                                            url: u, type: t, title
                                                        }))
                                                    } else {
                                                        setSubmissionDraft(JSON.stringify({
                                                            url: u, type: t, title: submissionTitle, annotations: ''
                                                        }))
                                                        setSubmissionImported(true);
                                                        setSubmissionType(t);
                                                        setSubmissionUrl(u);
                                                    }
                                                    setShowImportOptions(false);
                                                }}
                                            />
                                        )
                                )}
                            </View>
                        </View>
                }
                {/* {renderEquationEditor()} */}
                <FormulaGuide value={equation} onChange={setEquation} show={showEquationEditor} onClose={() => setShowEquationEditor(false)} onInsertEquation={insertEquation} />
                <ScrollView
                    style={{
                        paddingBottom: 25,
                        height: "100%",
                        // borderBottomColor: "#efefef",
                        // borderBottomWidth: 1
                    }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    scrollEventThrottle={1}
                    keyboardDismissMode={"on-drag"}
                    overScrollMode={"always"}
                    nestedScrollEnabled={true}>
                    {/* <View> */}
                    {
                        props.showOptions || props.showComments ? null :
                            <View>
                                <View style={{ flexDirection: 'column', width: '100%' }}>
                                    {renderQuizTimerOrUploadOptions()}
                                    {
                                        isQuiz ? renderQuizDetails() : null
                                    }
                                </View>
                                {/* {renderCueRemarks()} */}
                                {!props.showOriginal && submissionImported && !isQuiz && !viewSubmission ? (
                                    <View style={{ flexDirection: "row" }}>
                                        <View
                                            style={{
                                                // width: "40%",
                                                flex: 1, flexDirection: 'row',
                                                alignSelf: "flex-start",
                                                marginLeft: 0
                                            }}>
                                            <TextInput
                                                value={submissionTitle}
                                                style={styles.input}
                                                placeholder={"Title"}
                                                onChangeText={val => setSubmissionTitle(val)}
                                                placeholderTextColor={"#393939"}
                                            />
                                        </View>
                                        {props.cue.submittedAt && props.cue.submittedAt !== "" ? (
                                            <View
                                                style={{
                                                    marginLeft: 15,
                                                    marginTop: 20,
                                                    alignSelf: "flex-end",
                                                    // display: "flex",
                                                    // flexDirection: "row"
                                                }}>
                                                {
                                                    props.cue.graded || (currentDate > deadline) ? null :
                                                        <TouchableOpacity
                                                            onPress={() => clearAll()}
                                                            style={{
                                                                backgroundColor: "white", borderRadius: 15,
                                                                // marginLeft: 15,
                                                                marginTop: 5,
                                                            }}>
                                                            <Text
                                                                style={{
                                                                    lineHeight: 35,
                                                                    // textAlign: "right",
                                                                    // paddingRight: 20,
                                                                    textTransform: "uppercase",
                                                                    fontSize: 12,
                                                                    fontFamily: 'overpass',
                                                                    color: '#006AFF',
                                                                }}
                                                            >
                                                                Erase
                                                            </Text>
                                                        </TouchableOpacity>
                                                }
                                            </View>
                                        ) : <TouchableOpacity
                                            onPress={() => clearAll()}
                                            style={{
                                                backgroundColor: "white", borderRadius: 15, marginLeft: 15,
                                                marginTop: 5,
                                            }}>
                                            <Text
                                                style={{
                                                    lineHeight: 35,
                                                    // textAlign: "right",
                                                    // paddingRight: 20,
                                                    textTransform: "uppercase",
                                                    fontSize: 12,
                                                    fontFamily: 'overpass',
                                                    color: '#006AFF',
                                                }}
                                            >
                                                Erase
                                            </Text>
                                        </TouchableOpacity>}
                                    </View>
                                ) : null}
                                {submissionImported || imported ? (
                                    // This is because the toolbar wont have an editor to connect with if the file is imported
                                    <RichEditor
                                        key={props.showOriginal.toString() + reloadEditorKey.toString()}
                                        disabled={true}
                                        containerStyle={{
                                            display: "none"
                                        }}
                                        ref={RichText}
                                        style={{
                                            display: "none"
                                        }}
                                    />
                                ) : null}
                                {
                                    isQuiz && !isOwner ? renderQuizSubmissionHistory() : null
                                }
                                {isQuiz && cueGraded && props.cue.releaseSubmission ? <QuizGrading
                                    problems={problems}
                                    solutions={quizSolutions}
                                    partiallyGraded={false}
                                    //  onGradeQuiz={onGradeQuiz}
                                    comment={comment}
                                    isOwner={false}
                                    headers={headers}

                                    attempts={quizAttempts}
                                /> : ((remainingAttempts === 0 || props.cue.releaseSubmission || (!allowLateSubmission && new Date() > deadline) || (allowLateSubmission && new Date() > availableUntil)) && !isOwner && isQuiz
                                    ? renderQuizEndedMessage()
                                    :
                                    renderMainCueContent())}
                            </View>}
                    <View style={{
                        width: '100%',
                        maxWidth: 900,
                        alignSelf: 'center',
                        paddingLeft: Dimensions.get('window').width < 768 ? 12 : 15
                    }}>
                        <Collapse isOpened={props.showOptions}>
                            <View style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                {props.cue.channelId ? (
                                    <View
                                        style={{
                                            display: "flex",
                                            flexDirection: "column"
                                        }}>
                                        {renderShareWithOptions()}
                                        {renderSubmissionRequiredOptions()}
                                        {renderGradeOptions()}
                                        {renderLateSubmissionOptions()}
                                        {renderAttemptsOptions()}
                                    </View>
                                ) : null}
                            </View>
                            {renderForwardOptions()}
                            {renderCategoryOptions()}
                            {renderPriorityOptions()}
                            {renderReminderOptions()}
                        </Collapse>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
};

export default UpdateControls;

const styles: any = StyleSheet.create({
    timePicker: {
        width: 125,
        fontSize: 14,
        height: 45,
        color: "#000000",
        borderRadius: 1,
        marginLeft: 10
    },
    cuesInput: {
        width: "100%",
        backgroundColor: "#efefef",
        borderRadius: 15,
        fontSize: 20,
        padding: 20,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: "4%"
    },
    footer: {
        width: "100%",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "row",
        marginTop: 80,
        marginBottom: 80,
        lineHeight: 18
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: "white",
    },
    colorContainerOutline: {
        lineHeight: 20,
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: "white",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#393939"
    },
    input: {
        width: "100%",
        borderBottomColor: "#efefef",
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        // marginTop: 5,
        marginBottom: 20,
        maxWidth: 210
    },
    date: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        paddingBottom: 4,
        backgroundColor: "white"
    },
    colorBar: {
        width: "100%",
        flexDirection: "row",
        backgroundColor: "white",
        lineHeight: 20
    },
    shuffleContainer: {
        display: "flex",
        flexDirection: "row",
        width: "100%",
        alignItems: "flex-end",
        backgroundColor: "white",
        paddingTop: 40
    },
    col1: {
        width: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "white",
        paddingRight: 7.5
    },
    col2: {
        width: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "white",
        paddingLeft: 7.5
    },
    picker: {
        display: "flex",
        justifyContent: "center",
        backgroundColor: "white",
        overflow: "hidden",
        fontSize: 12,
        textAlign: "center",
        borderWidth: 1,
        width: 100,
        height: 20,
        alignSelf: "center",
        marginTop: -20,
        borderRadius: 3
    },
    text: {
        fontSize: 14,
        color: "#393939",
        textAlign: "left",
        paddingHorizontal: 10,
        fontFamily: 'Inter'
    },
    all: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
        color: '#000000',
        fontWeight: 'bold',
        height: 25,
        paddingHorizontal: Dimensions.get('window').width < 768 ? 12 : 15,
        backgroundColor: '#fff',
        lineHeight: 25,
        fontFamily: 'overpass',
        textTransform: 'uppercase'
    },
    allGrayFill: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
        color: '#fff',
        paddingHorizontal: Dimensions.get('window').width < 768 ? 12 : 15,
        borderRadius: 12,
        backgroundColor: '#006AFF',
        lineHeight: 25,
        height: 25,
        fontFamily: 'inter',
        textTransform: 'uppercase'
    },
    allOutline: {
        fontSize: 12,
        backgroundColor: "#000000",
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 1
    },
    allBlack: {
        fontSize: 12,
        color: "#000000",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white"
    },
    allGrayOutline: {
        fontSize: 12,
        color: "#393939",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white",
        borderRadius: 1,
        borderWidth: 1,
        borderColor: "#393939",
        lineHeight: 20
    },
    color1: {
        backgroundColor: "#f94144"
    },
    color2: {
        backgroundColor: "#f3722c"
    },
    color3: {
        backgroundColor: "#f8961e"
    },
    color4: {
        backgroundColor: "#f9c74f"
    },
    color5: {
        backgroundColor: "#35AC78"
    },
    outline: {
        borderRadius: 1,
        borderWidth: 1,
        borderColor: "#393939"
    },
    badge: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginRight: -2,
        marginTop: 0,
        borderRadius: 15,
        backgroundColor: '#f94144',
        textAlign: 'center',
        zIndex: 50
    },
});