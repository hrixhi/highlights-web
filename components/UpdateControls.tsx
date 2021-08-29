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
import WebViewer from '@pdftron/webviewer';


const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const current = new Date();
    const [cue, setCue] = useState(props.cue.cue);
    const [shuffle, setShuffle] = useState(props.cue.shuffle);
    const [starred, setStarred] = useState(props.cue.starred);
    const [color, setColor] = useState(props.cue.color);
    const [notify, setNotify] = useState(props.cue.frequency !== "0" ? true : false);
    const [frequency, setFrequency] = useState(props.cue.frequency);
    const [customCategory, setCustomCategory] = useState(props.cue.customCategory);
    const [customCategories, setCustomCategories] = useState(props.customCategories);
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
    const [height, setHeight] = useState(100);
    const colorChoices: any[] = ["#d91d56", "#ED7D22", "#FFBA10", "#B8D41F", "#53BE6D"].reverse();
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false);
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
    const [shareWithChannelId, setShareWithChannelId] = useState("");
    const [selected, setSelected] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [expandMenu] = useState(false);
    const [original, setOriginal] = useState(props.cue.original)
    const [comment] = useState(props.cue.comment)
    const [shareWithChannelName, setShareWithChannelName] = useState('')

    // QUIZ OPTIONS
    const [isQuiz, setIsQuiz] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [solutions, setSolutions] = useState<any[]>([]);
    const [quizId, setQuizId] = useState("");
    const [loading, setLoading] = useState(true);
    const [initiatedAt, setInitiatedAt] = useState<any>(null);
    const [isQuizTimed, setIsQuizTimed] = useState(false);
    const [duration, setDuration] = useState(0);
    const [initDuration, setInitDuration] = useState(0);
    const [equation, setEquation] = useState("y = x + 1");
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [headers, setHeaders] = useState({})
    const [cueGraded, setCueGraded] = useState(props.cue.graded);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [isV0Quiz, setIsV0Quiz] = useState(false);
    const [loadingAfterModifyingQuiz, setLoadingAfterModifyingQuiz] = useState(false);

    const insertEquation = useCallback(() => {
        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        RichText.current.insertHTML("<div><br/>" + SVGEquation + "<br/></div>");
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

    // Used to detect ongoing quiz and
    useEffect(() => {
        console.log(duration)
        if (!isQuizTimed || initiatedAt === null || initiatedAt === "" || isOwner) {
            // not a timed quiz or its not been initiated
            return;
        }
        let now = new Date();
        now.setMinutes(now.getMinutes() - 1);
        let current = new Date();
        if (now >= deadline) {
            // deadline crossed
            return;
        }
        if (duration === 0) {
            return;
        }
        const remainingTime = duration - diff_seconds(initiatedAt, current);
        if (remainingTime <= 0) {
            // duration has been set correctly yet no time remaining
            if (!props.cue.submittedAt || props.cue.submittedAt === "") {
                handleSubmit();
            }
        } else {
            setInitDuration(remainingTime); // set remaining duration in seconds
        }
    }, [initiatedAt, duration, deadline, isQuizTimed, props.cue.submittedAt, isOwner]);

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
                        }
                    })
                    .catch(err => { });
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
                                    id: sub.value,
                                    name: sub.label
                                }
                            });

                            const subscriberwithoutOwner: any = [];
                            subscriberwithoutOwner.map((i: any) => {
                                if (user._id !== i.id) {
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
                                    id: sub.value,
                                    name: sub.label
                                }
                            })

                            const withoutOwner: any = [];
                            formatSel.map((i: any) => {
                                if (user._id !== i.id) {
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

    // If cue contains a Quiz, then need to fetch the quiz and set State
    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== "") {
            const data1 = original;
            const data2 = cue;
            if (data2 && data2[0] && data2[0] === "{" && data2[data2.length - 1] === "}") {
                const obj = JSON.parse(data2);
                setSubmissionImported(true);
                setSubmissionUrl(obj.url);
                setSubmissionType(obj.type);
                if (loading) {
                    setSubmissionTitle(obj.title);
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
                                setProblems(res.data.quiz.getQuiz.problems);
                                if (res.data.quiz.getQuiz.duration && res.data.quiz.getQuiz.duration !== 0) {
                                    setDuration(res.data.quiz.getQuiz.duration * 60);
                                    setIsQuizTimed(true);
                                }
                                if (solutionsObject.initiatedAt && solutionsObject.initiatedAt !== "") {
                                    const init = new Date(solutionsObject.initiatedAt);
                                    setInitiatedAt(init);
                                }
                                setShuffleQuiz(res.data.quiz.getQuiz.shuffleQuiz ? true : false)
                                setTitle(obj.title);
                                setIsQuiz(true);
                                setInstructions(res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : '')
                                setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {})
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
            const data = cue;
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

    useEffect(() => {
        handleUpdate();
    }, [
        cue,
        shuffle,
        frequency,
        gradeWeight,
        starred,
        color,
        props.cueIndex,
        submitted,
        markedAsRead,
        submission,
        deadline,
        initiateAt,
        submissionTitle,
        submissionImported,
        submissionType,
        submissionUrl,
        isQuiz,
        solutions,
        initiatedAt,
        customCategory,
        props.cueKey,
        endPlayAt,
        playChannelCueIndef,
        notify,
        url, original, type, title, imported
    ]);

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
        let now = new Date();
        if (now >= deadline) {
            Alert(unableToStartQuizAlert, deadlineHasPassedAlert);
            return;
        }

        if (now < initiateAt) {
            Alert("Quiz not available")
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
    }, [props.cue._id, solutions, deadline, initiateAt]);

    // Handle Update for CUES. Called everytime there is a cue modification
    // Overrides local cues in AsyncStorage and then calls reloadCuesAfterList to sync with the cloud
    const handleUpdate = useCallback(async () => {

        // If available From set after Deadline or Dealine set before Available then 
        // we need to throw an Alert and return without updating

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
        let saveCue = "";
        if (isQuiz) {
            saveCue = JSON.stringify({
                solutions,
                initiatedAt
            });
        } else if (submissionImported) {
            const obj = {
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle
            };
            saveCue = JSON.stringify(obj);
        } else {
            saveCue = cue;
        }
        const submittedNow = new Date();

        let tempOriginal = ''
        if (imported) {
            const obj = {
                type,
                url,
                title
            }
            tempOriginal = JSON.stringify(obj)
        } else if (isQuiz) {
            const parse = JSON.parse(original)
            const obj = {
                quizId: parse.quizId,
                title
            }
            tempOriginal = JSON.stringify(obj)
        } else {
            tempOriginal = original
        }

        subCues[props.cueKey][props.cueIndex] = {
            _id: props.cue._id,
            cue: props.cue.submittedAt ? props.cue.cue : saveCue,
            date: props.cue.date,
            color,
            shuffle,
            frequency,
            starred,
            customCategory,
            // Channel controls
            channelId: props.cue.channelId,
            createdBy: props.cue.createdBy,
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : "",
            channelName: props.cue.channelName,
            original: tempOriginal,
            status: "read",
            graded: props.cue.graded,
            gradeWeight,
            submission,
            unreadThreads: props.cue.unreadThreads,
            score,
            comment: props.cue.comment,
            submittedAt: submitted ? submittedNow.toISOString() : props.cue.submittedAt,
            deadline: submission ? deadline.toISOString() : "",
            initiateAt: submission ? initiateAt.toISOString() : "",
            releaseSubmission: props.cue.releaseSubmission ? props.cue.releaseSubmission : false
        };
        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem("cues", stringifiedCues);
        props.reloadCueListAfterUpdate();
    }, [
        cue,
        customCategory,
        shuffle,
        frequency,
        starred,
        color,
        playChannelCueIndef,
        notify,
        submissionImported,
        submission,
        deadline,
        gradeWeight,
        submitted,
        submissionTitle,
        submissionType,
        submissionUrl,
        isQuiz,
        props.closeModal,
        props.cueIndex,
        props.cueKey,
        props.cue,
        endPlayAt,
        props,
        solutions,
        initiatedAt,
        // submission,
        // deadline,
        initiateAt,
        title, original, imported, type, url
    ]);

    console.log(isQuizTimed)
    console.log(initDuration)
    console.log(initiateAt)

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
                        } else if (submissionImported) {
                            const obj = {
                                type: submissionType,
                                url: submissionUrl,
                                title: submissionTitle
                            };
                            saveCue = JSON.stringify(obj);
                        } else {
                            if (cue === "") {
                                // submission cannot be empty
                                return;
                            }
                            saveCue = cue;
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
                                    Alert(submissionCompleteAlert, new Date().toString(), [
                                        {
                                            text: "Cancel",
                                            style: "cancel",
                                            onPress: () => window.location.reload()
                                        },
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
        deadline
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
                        setImported(false)
                        setOriginal('')
                        setUrl('')
                        setType('')
                        setTitle('')
                    } else {
                        setSubmissionImported(false)
                        setCue('')
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
                    customCategory,
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

    const updateQuiz = (instructions: string, problems: any, headers: any) => {
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
                    server
                        .mutate({
                            mutation: modifyQuiz,
                            variables: {
                                cueId: props.cue._id,
                                quiz: {
                                    instructions,
                                    problems: sanitizeProblems,
                                    headers: JSON.stringify(headers)
                                }
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
                                            setInstructions(res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : '')
                                            setHeaders(res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {})
                                            setLoadingAfterModifyingQuiz(false);
                                            alert('Quiz updated successfully')
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
                case "pop-value":
                    if (removedValue.isFixed) {
                        return;
                    }
                    break;
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
        if (props.showOriginal) {
            if (url === '' || !url) {
                return
            }
            console.log(url)
            WebViewer(
                {
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
        } else {
            if (submissionUrl === '' || !submissionUrl) {
                return
            }
            console.log(submissionUrl)
            WebViewer(
                {
                    initialDoc: decodeURIComponent(submissionUrl),
                },
                RichText.current,
            ).then((instance) => {
                const { documentViewer } = instance.Core;
                // you can now call WebViewer APIs here...
                documentViewer.addEventListener('documentLoaded', () => {
                    // perform document operations
                });
            });
        }
    }, [url, RichText, imported, submissionImported, props.showOriginal]);


    if (loading || loadingAfterModifyingQuiz) {
        return null;
    }

    // RENDER METHODS
    const renderRichToolbar = () => {
        return (props.cue.channelId && props.cue.channelId !== '' && !isOwner && props.showOriginal) || (props.showOriginal && showImportOptions) || isQuiz ? (
            <View style={{ height: 0, backgroundColor: "#fff" }} />
        ) : ((props.cue.graded && submission && !isOwner) && !props.showOriginal) || (!props.showOriginal && showImportOptions) ? (
            <View style={{ height: 0, backgroundColor: "#fff" }} />
        ) : (
            <RichToolbar
                key={reloadEditorKey.toString() + props.showOriginal.toString()}
                style={{
                    flexWrap: "wrap",
                    backgroundColor: "white",
                    height: 28,
                    overflow: "visible"
                }}
                iconSize={12}
                editor={RichText}
                disabled={false}
                iconTint={"#2f2f3c"}
                selectedIconTint={"#2f2f3c"}
                disabledIconTint={"#2f2f3c"}
                actions={
                    (!props.showOriginal && submissionImported) || (imported && props.showOriginal)
                        ? ['']
                        : [
                            actions.setBold,
                            actions.setItalic,
                            actions.setUnderline,
                            actions.insertBulletsList,
                            actions.insertOrderedList,
                            actions.checkboxList,
                            actions.insertLink,
                            actions.insertImage,
                            "insertCamera",
                            actions.undo,
                            actions.redo,
                            "clear"
                        ]
                }
                iconMap={{
                    ["insertCamera"]: ({ tintColor }) => <Ionicons name="camera-outline" size={15} color={tintColor} />,
                    ["clear"]: ({ tintColor }) => (
                        <Ionicons name="trash-outline" size={13} color={tintColor} onPress={() => clearAll()} />
                    )
                }}
                onPressAddImage={galleryCallback}
                insertCamera={cameraCallback}
            />
        )
    };

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
                        borderColor: "#F8F9FA",
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
                        paddingHorizontal: 20,
                        maxWidth: "10%"
                    }}
                    onPress={() => insertEquation()}>
                    <Ionicons name="add-circle-outline" color="#2f2f3c" size={20} />
                </TouchableOpacity>
                <View
                    style={{
                        minWidth: "40%",
                        flex: 1,
                        paddingVertical: 5,
                        justifyContent: "center"
                    }}>
                    <Text style={{ flex: 1, fontSize: 12, color: "#2f2f3c", lineHeight: "1.5" }}>
                        ^ → Superscript,  _ → Subscript,  int → Integral,  sum → Summation,  prod → Product,  sqrt → Square root,  bar → Bar over letter;  alpha, beta, ... omega → Small Greek letter;  Alpha, Beta, ... Omega → Capital Greek letter
                    </Text>
                </View>
            </View>
        ) : null;
    };

    const renderCueTabs = () => {
        return (
            <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column"
                    }}
                    onPress={() => {
                        props.setShowOriginal(true);
                        props.setShowOptions(false)
                        props.setShowComments(false)
                    }}>
                    <Text style={!props.showOptions && props.showOriginal && !props.showComments ? styles.allGrayFill : styles.all}>
                        {PreferredLanguageText("viewShared")}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column"
                    }}
                    onPress={() => {
                        props.setShowOptions(true)
                        props.setShowOriginal(true);
                        props.setShowComments(false)
                    }}>
                    <Text style={props.showOptions ? styles.allGrayFill : styles.all}>
                        Details
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        justifyContent: "center",
                        flexDirection: "column"
                    }}
                    onPress={() => {
                        props.setShowComments(true)
                        props.setShowOriginal(true);
                        props.setShowOptions(false)
                    }}>
                    <Text style={props.showComments ? styles.allGrayFill : styles.all}>
                        Q&A
                        {props.cue.unreadThreads > 0 ? <View style={styles.badge} /> : null}
                    </Text>
                </TouchableOpacity>
                {(isOwner && submission) || isQuiz ? null : (
                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            flexDirection: "column"
                        }}
                        onPress={() => {
                            props.setShowOriginal(false);
                            props.setShowOptions(false)
                            props.setShowComments(false)
                        }}>
                        <Text style={!props.showOriginal && !props.viewStatus ? styles.allGrayFill : styles.all}>
                            {submission ? PreferredLanguageText("mySubmission") : PreferredLanguageText("myNotes")}
                        </Text>
                    </TouchableOpacity>
                )}
                {/* Add Status button here */}
                {!isOwner || !props.channelOwner ? null : (
                    <TouchableOpacity
                        style={{
                            justifyContent: "center",
                            flexDirection: "column"
                        }}
                        onPress={() => {
                            props.setShowOriginal(false);
                            setIsQuiz(false);
                            props.setShowOptions(false)
                            props.setShowComments(true)
                            props.changeViewStatus();
                        }}>
                        <Text style={props.viewStatus ? styles.allGrayFill : styles.all}>Responses</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // QUIZ TIMER OR DOWNLOAD/REFRESH IF UPLOADED
    const renderQuizTimerOrUploadOptions = () => {
        console.log(props.cue.graded)
        console.log(props.cue.submittedAt)
        return props.showOriginal && (imported || isQuiz) ? (
            <View style={{ flexDirection: "row", marginRight: 0, marginLeft: 0 }}>
                <View style={{ width: "40%", alignSelf: "flex-start" }}>
                    <TextInput
                        editable={isOwner}
                        value={title}
                        style={styles.input}
                        placeholder={"Title"}
                        onChangeText={val => setTitle(val)}
                        placeholderTextColor={"#818385"}
                    />
                </View>
                {isQuiz && !props.cue.graded ? (
                    isQuizTimed && (!props.cue.submittedAt || props.cue.submittedAt === "") ? (
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
                                            handleSubmit();
                                        }
                                        const hours = Math.floor(remainingTime / 3600);
                                        const minutes = Math.floor((remainingTime % 3600) / 60);
                                        const seconds = remainingTime % 60;
                                        return `${hours}h ${minutes}m ${seconds}s`;
                                    }}
                                    isPlaying={true}
                                    duration={duration}
                                    initialRemainingTime={initDuration}
                                    colors="#3B64F8"
                                />
                            </View>
                        ) : null
                    ) : null
                ) : (imported &&
                    (type === "mp4" ||
                        type === "mp3" ||
                        type === "mov" ||
                        type === "mpeg" ||
                        type === "mp2" ||
                        type === "wav")) ||
                    props.cue.graded ? null : (
                    <View
                        style={{
                            marginLeft: 25,
                            marginTop: 20,
                            alignSelf: "flex-start",
                            display: "flex",
                            flexDirection: "row"
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
                                    color="#818385"
                                    size={20}
                                    onPress={() => setWebviewKey(Math.random())}
                                />
                            </View>
                            <Text
                                style={{
                                    fontSize: 9,
                                    color: "#818385",
                                    textAlign: "center"
                                }}>
                                Reload
                            </Text>
                        </View> */}
                        <a download={true} href={url} style={{ textDecoration: "none", textAlign: "center" }}>
                            <View>
                                <Ionicons name="cloud-download-outline" color="#818385" size={20} />
                                <Text
                                    style={{
                                        fontSize: 9,
                                        color: "#818385",
                                        textAlign: "center"
                                    }}>
                                    Download
                                </Text>
                            </View>
                        </a>
                        {
                            isOwner ?
                                <TouchableOpacity
                                    style={{
                                        marginLeft: 15
                                    }}
                                    onPress={() => clearAll()}
                                >
                                    <Ionicons name="trash-outline" color="#818385" size={20} style={{ alignSelf: 'center' }} />
                                    <Text
                                        style={{
                                            fontSize: 9,
                                            color: "#818385",
                                            textAlign: "center"
                                        }}>
                                        Remove
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
                        color: "#2f2f3c",
                        fontSize: 14,
                        paddingBottom: 25,
                        marginLeft: "5%"
                    }}>
                    {PreferredLanguageText("gradersRemarks")}
                </Text>
                <TextInput
                    value={props.cue.comment}
                    style={{
                        height: 200,
                        backgroundColor: "#F8F9FA",
                        borderRadius: 10,
                        fontSize: 15,
                        padding: 15,
                        paddingTop: 13,
                        paddingBottom: 13,
                        marginTop: 5,
                        marginBottom: 20
                    }}
                    editable={false}
                    placeholder={"Optional"}
                    placeholderTextColor={"#818385"}
                    multiline={true}
                />
            </View>
        ) : null;
    };

    const renderMainCueContent = () => (
        <View
            style={{
                width: "100%",
                minHeight: 475,
                backgroundColor: "white"
            }}>
            {!props.showOriginal ? null : isQuiz ? (
                isQuizTimed && !isOwner ? (
                    initiatedAt ? (
                        <View style={{ width: '100%', paddingBottom: 50 }}>
                            <Quiz
                                // disable quiz if graded or deadline has passed
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
                                            color: "#2f2f3c",
                                            fontSize: 12,
                                            backgroundColor: "#F8F9FA",
                                            paddingHorizontal: 25,
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
                        />
                        {renderFooter()}
                    </View>
                )
            ) : imported ? (
                type === "mp4" || type === "mp3" || type === "mov" || type === "mpeg" || type === "mp2" || type === "wav" ? (
                    <ReactPlayer
                        url={url}
                        controls={true}
                        onContextMenu={(e: any) => e.preventDefault()}
                        config={{
                            file: { attributes: { controlsList: "nodownload" } }
                        }}
                    />
                ) : (
                    <View key={url} style={{ zIndex: 1, height: 50000 }}>
                        <div className="webviewer" ref={RichText} style={{ height: "100vh" }}></div>
                        {/* 
                        <Webview
                            fullScreen={true}
                            url={url}
                            key={url}
                        /> */}
                    </View>
                )
            ) : (
                renderRichEditorOriginalCue()
            )}
            {props.showOriginal ? null : submissionImported ? (
                submissionType === "mp4" ||
                    submissionType === "mp3" ||
                    submissionType === "mov" ||
                    submissionType === "mpeg" ||
                    submissionType === "mp2" ||
                    submissionType === "wav" ? (
                    <ReactPlayer url={submissionUrl} controls={true} />
                ) : (

                    props.cue.graded && props.cue.comment ?
                        <View style={{ position: 'relative', flex: 1 }}>
                            <View style={{ position: 'absolute', zIndex: 1, width: 800, height: 50000 }}>
                                {/* <Webview
                                    key={submissionUrl}
                                    url={submissionUrl}
                                    fullScreen={true}
                                /> */}
                                <div className="webviewer" ref={RichText} style={{ height: "100vh" }}></div>
                            </View>
                            <View style={{ position: 'absolute', zIndex: 1, flex: 1, width: 800, height: 50000, backgroundColor: 'rgb(0,0,0,0)' }}>
                                <Annotation
                                    disableAnnotation={true}
                                    style={{ resizeMode: 'cover', width: '100%', height: '100%', backgroundColor: 'rgb(0,0,0,0)', background: 'none', border: 'none' }}
                                    src={require('./default-images/transparent.png')}
                                    annotations={annotations}
                                    // type={this.state.type}
                                    value={annotation}
                                    onChange={(e: any) => setAnnotation(e)}
                                    onSubmit={onSubmit}
                                />
                            </View>
                        </View>
                        : <View style={{ width: 800, height: 50000 }}>
                            {/* <Webview
                                key={submissionUrl}
                                url={submissionUrl}
                                fullScreen={true}
                            /> */}
                            <div className="webviewer" ref={RichText} style={{ height: "100vh" }}></div>
                        </View>

                )
            ) : (
                props.cue.graded && props.cue.comment ?
                    <View style={{ width: '100%', paddingBottom: 50, display: 'flex', flexDirection: 'column' }}>
                        <View style={{ position: 'relative', flex: 1, width: '100%' }}>
                            <View style={{ position: 'absolute', zIndex: 1, width: 800, height: 50000 }}>
                                {renderRichEditorModified()}
                                {renderFooter()}
                            </View>
                            <View style={{ position: 'absolute', zIndex: 1, flex: 1, width: 800, height: 50000, backgroundColor: 'rgb(0,0,0,0)' }}>
                                <Annotation
                                    disableAnnotation={true}
                                    style={{ resizeMode: 'cover', width: '100%', height: '100%', backgroundColor: 'rgb(0,0,0,0)', background: 'none', border: 'none' }}
                                    src={require('./default-images/transparent.png')}
                                    annotations={annotations}
                                    // type={this.state.type}
                                    value={annotation}
                                    onChange={(e: any) => setAnnotation(e)}
                                    onSubmit={onSubmit}
                                />
                            </View>
                        </View>
                    </View>
                    : (
                        <View style={{ width: '100%', paddingBottom: 50, display: 'flex', flexDirection: 'column', height: 50000 }}>
                            <View style={{ width: 800, height: 50000 }}>
                                {renderRichEditorModified()}
                                {renderFooter()}
                            </View>
                        </View>
                    )
            )}
        </View>
    );

    const renderRichEditorOriginalCue = () => (
        <RichEditor
            key={props.showOriginal.toString() + reloadEditorKey.toString()}
            disabled={!isOwner}
            containerStyle={{
                height: height,
                backgroundColor: "#fff",
                padding: 3,
                paddingTop: 5,
                paddingBottom: 10,
                borderRadius: 15
            }}
            ref={RichText}
            style={{
                width: '100%',
                backgroundColor: '#fff',
                // borderRadius: 15,
                minHeight: 650,
                display: (isQuiz || imported) ? "none" : "flex",
                // borderTopWidth: 1,
                borderColor: '#818385'
            }}
            editorStyle={{
                backgroundColor: "#fff",
                placeholderColor: "#818385",
                color: "#2f2f3c",
                contentCSSText: "font-size: 13px;"
            }}
            initialContentHTML={original}
            onScroll={() => Keyboard.dismiss()}
            placeholder={"Title"}
            onChange={text => {
                const modifedText = text.split("&amp;").join("&");
                setOriginal(modifedText);
            }}
            onHeightChange={handleHeightChange}
            onBlur={() => Keyboard.dismiss()}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            allowsLinkPreview={true}
            allowsBackForwardNavigationGestures={true}
        />
    );

    const renderRichEditorModified = () => (
        <RichEditor
            key={props.showOriginal.toString() + reloadEditorKey.toString()}
            containerStyle={{
                height: height,
                backgroundColor: "#fff",
                padding: 3,
                paddingTop: 5,
                paddingBottom: 10,
            }}
            disabled={(props.cue.graded && submission)}
            ref={RichText}
            style={{
                width: '100%',
                backgroundColor: '#fff',
                minHeight: 650,
                display: (isQuiz || submissionImported) ? "none" : "flex",
                // borderTopWidth: 1,
                borderColor: '#818385'
            }}
            editorStyle={{
                backgroundColor: "#fff",
                placeholderColor: "#818385",
                color: "#2f2f3c",
                contentCSSText: "font-size: 13px;"
            }}
            initialContentHTML={cue}
            onScroll={() => Keyboard.dismiss()}
            placeholder={props.cue.channelId && props.cue.channelId !== '' ? (submission ? "Submission" : "Notes") : "Title"}
            onChange={text => {
                const modifedText = text.split("&amp;").join("&");
                setCue(modifedText);
            }}
            onHeightChange={handleHeightChange}
            onBlur={() => Keyboard.dismiss()}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
            allowsLinkPreview={true}
            allowsBackForwardNavigationGestures={true}
        />
    );

    const renderShareWithOptions = () => {
        return props.cue.channelId !== "" && isOwner ? (
            <View style={{ width: "100%" }}>
                <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 25,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>
                        {props.cue.channelId && props.cue.channelId !== "" ? "Shared with" : "Saved in"}
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: "column",
                        overflow: "scroll"
                    }}>
                    <View
                        style={{
                            width: "90%",
                            padding: 5,
                            height: "auto"
                        }}>
                        <Multiselect
                            placeholder='Share with...'
                            displayValue='name'
                            // key={userDropdownOptions.toString()}
                            // style={{ width: '100%', color: '#2f2f3c', 
                            //     optionContainer: { // To change css for option container 
                            //         zIndex: 9999
                            //     }
                            // }}
                            options={subscribers} // Options to display in the dropdown
                            selectedValues={selected} // Preselected value to persist in dropdown
                            disabledPreselected={true}
                            onSelect={(e, f) => {

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
                                setSelected(addBack)

                                Alert('Cannot un-share cue')
                                return;
                            }}
                        />
                    </View>
                </View>
            </View>
        ) : null;
    };

    const renderSubmissionRequiredOptions = () => {
        return props.cue.channelId !== "" ? (
            <View style={{ width: "100%" }}>
                <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 25,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>{PreferredLanguageText("submissionRequired")}</Text>
                </View>
                <View style={{ flexDirection: "row", width: '100%' }}>
                    {isOwner ? (
                        <View
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
                                    false: "#F8F9FA",
                                    true: "#818385"
                                }}
                                activeThumbColor="white"
                            />
                        </View>
                    ) : (
                        <View style={{ flex: 1, backgroundColor: "#fff" }}>
                            <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>{!submission ? PreferredLanguageText("no") : null}</Text>
                        </View>
                    )}
                </View>
                {submission ? (
                    <View
                        style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "row",
                            backgroundColor: "white",
                            marginBottom: 10,
                            alignItems: 'center'
                        }}>
                        <Text
                            style={{
                                fontSize: 12,
                                color: "#818385",
                                textAlign: "left",
                                paddingRight: 10
                            }}>
                            Available
                        </Text>
                        {isOwner ? (
                            <DatePicker
                                format="YYYY-MM-DD HH:mm"
                                size={'xs'}
                                value={initiateAt}
                                preventOverflow={true}
                                onChange={(event: any) => {

                                    const date = new Date(event);

                                    if (date < new Date()) return;
                                    setInitiateAt(date);
                                }}
                            // isValidDate={disablePastDt}
                            />
                        ) : (
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: "#818385",
                                    textAlign: "left"
                                }}>
                                {moment(new Date(initiateAt)).format('MMMM Do, h:mm a')}
                            </Text>
                        )}
                    </View>
                ) : null}
                {submission ? (
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
                                fontSize: 12,
                                color: "#818385",
                                textAlign: "left",
                                paddingRight: 10
                            }}>
                            Deadline
                        </Text>
                        {isOwner ? (
                            <DatePicker
                                preventOverflow={true}
                                value={deadline}
                                format="YYYY-MM-DD HH:mm"
                                onChange={(event: any) => {
                                    const date = new Date(event);

                                    if (date < new Date()) return;
                                    setDeadline(date);
                                }}
                                size={'xs'}
                            // isValidDate={disablePastDt}
                            />
                        ) : (
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: "#818385",
                                    textAlign: "left"
                                }}>
                                {moment(new Date(deadline)).format('MMMM Do, h:mm a')}
                            </Text>
                        )}
                    </View>
                ) : null}
            </View>
        ) : null;
    };

    const renderGradeOptions = () => {
        return submission ? (
            <View style={{ width: "100%" }}>
                <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 25,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>Grade Weight</Text>
                </View>
                {isOwner ? <View style={{ flexDirection: "row" }}>
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
                                false: "#F8F9FA",
                                true: "#818385"
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
                            alignItems: 'center'
                        }}>
                        <Text
                            style={{
                                fontSize: 12,
                                color: "#818385",
                                textAlign: "left",
                                paddingRight: 10,
                            }}>
                            {!isOwner ? gradeWeight : null} {PreferredLanguageText("percentageOverall")}
                        </Text>
                        {isOwner ? (
                            <TextInput
                                value={gradeWeight}
                                style={{
                                    width: "25%",
                                    borderBottomColor: "#F8F9FA",
                                    borderBottomWidth: 1,
                                    fontSize: 15,
                                    padding: 15,
                                    paddingVertical: 12,
                                    marginTop: 0,
                                }}
                                placeholder={"0-100"}
                                onChangeText={val => setGradeWeight(val)}
                                placeholderTextColor={"#818385"}
                            />
                        ) : null}
                    </View>
                ) : null}
            </View>
        ) : null;
    };

    const renderCategoryOptions = () => {
        return (props.cue.channelId && props.cue.channelId !== "" && isOwner) ||
            !props.channelId ||
            props.channelId === "" ? (
            <View
                style={{
                    width: "100%",
                    borderRightWidth: 0,
                    borderColor: "#F8F9FA"
                }}>
                <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 25,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>{PreferredLanguageText("category")}</Text>
                </View>
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
                                            color: "#2f2f3c",
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
                            width: "100%",
                            display: "flex",
                            flexDirection: "row",
                            backgroundColor: "white"
                        }}>
                        <View style={{ width: "85%", backgroundColor: "white" }}>
                            {addCustomCategory ? (
                                <View style={styles.colorBar}>
                                    <TextInput
                                        value={customCategory}
                                        style={styles.allGrayOutline}
                                        placeholder={"Enter Category"}
                                        onChangeText={val => {
                                            setCustomCategory(val);
                                        }}
                                        placeholderTextColor={"#818385"}
                                    />
                                </View>
                            ) : (
                                <Menu
                                    onSelect={(cat: any) => setCustomCategory(cat)}>
                                    <MenuTrigger>
                                        <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c' }}>
                                            {customCategory === '' ? 'None' : customCategory}<Ionicons name='caret-down' size={14} />
                                        </Text>
                                    </MenuTrigger>
                                    <MenuOptions customStyles={{
                                        optionsContainer: {
                                            padding: 10,
                                            borderRadius: 15,
                                            shadowOpacity: 0,
                                            borderWidth: 1,
                                            borderColor: '#F8F9FA',
                                            overflow: 'scroll',
                                            maxHeight: '100%'
                                        }
                                    }}>
                                        <MenuOption
                                            value={''}>
                                            <Text>
                                                None
                                            </Text>
                                        </MenuOption>
                                        {
                                            customCategories.map((category: any) => {
                                                return <MenuOption
                                                    value={category}>
                                                    <Text>
                                                        {category}
                                                    </Text>
                                                </MenuOption>
                                            })
                                        }
                                    </MenuOptions>
                                </Menu>
                            )}
                        </View>
                        <View style={{ width: "15%", backgroundColor: "white" }}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (addCustomCategory) {
                                        setCustomCategory("");
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
                                    <Ionicons name={addCustomCategory ? "close" : "add"} size={20} color={"#2f2f3c"} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        ) : null;
    };

    const renderPriorityOptions = () => {
        return (
            <View
                style={{
                    width: "100%",
                    borderRightWidth: 0,
                    borderColor: "#F8F9FA"
                }}>
                <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 25,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>{PreferredLanguageText("priority")}</Text>
                </View>
                <View
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        backgroundColor: "white"
                    }}>
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
        return channels.length === 0 || !isOwner ? null : (
            <View
                style={{
                    width: "100%",
                    borderRightWidth: 0,
                    borderColor: "#F8F9FA"
                }}>
                <View
                    style={{
                        width: "100%",
                        paddingTop: 40,
                        paddingBottom: 15,
                        backgroundColor: "white"
                    }}>
                    <Text style={{
                        fontSize: 25,
                        fontFamily: 'inter',
                        color: '#2f2f3c'
                    }}>Forward</Text>
                </View>
                <View
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        backgroundColor: "white"
                    }}>
                    <View style={{ width: "42.5%", backgroundColor: "white" }}>
                        <Menu
                            onSelect={(own: any) => {
                                setSelectedChannelOwner(own)
                                setShareWithChannelId('')
                                setShareWithChannelName('')
                            }}>
                            <MenuTrigger>
                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c' }}>
                                    {
                                        selectedChannelOwner === undefined ? 'All' :
                                            (selectedChannelOwner !== null ? (selectedChannelOwner.name)
                                                : 'Your Channels')
                                    }< Ionicons name='caret-down' size={14} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#F8F9FA',
                                    overflow: 'scroll',
                                    maxHeight: '100%',
                                }
                            }}>
                                {
                                    role === 'instructor' ? <MenuOption
                                        value={undefined}
                                    >
                                        <Text>
                                            All channels
                                        </Text>
                                    </MenuOption> : null
                                }
                                <MenuOption
                                    value={null}
                                >
                                    <Text>
                                        Your channels
                                    </Text>
                                </MenuOption>
                                {
                                    channelOwners.map((own: any) => {
                                        return <MenuOption
                                            value={own}>
                                            <Text>
                                                {own.name}
                                            </Text>
                                        </MenuOption>
                                    })
                                }
                            </MenuOptions>
                        </Menu>
                    </View>
                    <View style={{ width: "42.5%", backgroundColor: "white" }}>
                        <Menu
                            onSelect={(channel: any) => {
                                if (channel === '') {
                                    setShareWithChannelId('')
                                    setShareWithChannelName('')
                                } else {
                                    setShareWithChannelId(channel._id)
                                    setShareWithChannelName(channel.name)
                                }
                                if (selectedChannelOwner === undefined) {
                                    if (userId.toString().trim() !== channel.createdBy.toString().trim()) {
                                        setSelectedChannelOwner({
                                            id: channel.createdBy,
                                            name: channel.createdByUsername
                                        })
                                    } else {
                                        setSelectedChannelOwner(null)
                                    }
                                }
                            }}>
                            <MenuTrigger>
                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c' }}>
                                    {shareWithChannelName === '' ? 'None' : shareWithChannelName}<Ionicons name='caret-down' size={14} />
                                </Text>
                            </MenuTrigger>
                            <MenuOptions customStyles={{
                                optionsContainer: {
                                    padding: 10,
                                    borderRadius: 15,
                                    shadowOpacity: 0,
                                    borderWidth: 1,
                                    borderColor: '#F8F9FA',
                                    overflow: 'scroll',
                                    maxHeight: '100%',
                                }
                            }}>
                                <MenuOption
                                    value={''}>
                                    <Text>
                                        None
                                    </Text>
                                </MenuOption>
                                {
                                    selectedChannelOwner !== null ?
                                        otherChannels.map((channel: any) => {
                                            if (selectedChannelOwner === undefined || channel.createdBy === selectedChannelOwner.id) {
                                                return <MenuOption
                                                    value={channel}>
                                                    <Text>
                                                        {channel.name}
                                                    </Text>
                                                </MenuOption>
                                            }
                                        })
                                        : channels.map((channel: any) => {
                                            return <MenuOption
                                                value={channel}>
                                                <Text>
                                                    {channel.name}
                                                </Text>
                                            </MenuOption>
                                        })
                                }
                            </MenuOptions>
                        </Menu>
                    </View>
                    <View style={{ width: "15%", backgroundColor: "white" }}>
                        <TouchableOpacity
                            disabled={shareWithChannelId === ""}
                            onPress={() => shareCue()}
                            style={{ backgroundColor: "white" }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 20,
                                    width: "100%"
                                }}>
                                <Ionicons
                                    name={"arrow-redo-outline"}
                                    size={20}
                                    color={shareWithChannelId === "" ? "#818385" : "#2f2f3c"}
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
                <View style={{ width: "100%" }}>
                    <View
                        style={{
                            width: "100%",
                            paddingTop: 40,
                            paddingBottom: 15,
                            backgroundColor: "white"
                        }}>
                        <Text style={{
                            fontSize: 25,
                            fontFamily: 'inter',
                            color: '#2f2f3c'
                        }}>Reminder</Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: "white",
                            width: "100%",
                            height: 40,
                            marginHorizontal: 10
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
                                false: "#F8F9FA",
                                true: "#3B64F8"
                            }}
                            activeThumbColor="white"
                        />
                    </View>
                </View>
                {notify ? (
                    <View style={{ width: "100%" }}>
                        <View
                            style={{
                                width: "100%",
                                paddingTop: 40,
                                paddingBottom: 15,
                                backgroundColor: "white"
                            }}>
                            <Text style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c'
                            }}>Recurring</Text>
                        </View>
                        <View style={{ flexDirection: "row" }}>
                            <View
                                style={{
                                    backgroundColor: "white",
                                    height: 40,
                                    marginHorizontal: 10
                                }}>
                                <Switch
                                    value={!shuffle}
                                    onValueChange={() => setShuffle(!shuffle)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: "#F8F9FA",
                                        true: "#818385"
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                            {!shuffle ? (
                                <View
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        backgroundColor: "white"
                                    }}>
                                    <Text style={styles.text}>{PreferredLanguageText("remindEvery")}</Text>
                                    <Menu
                                        onSelect={(cat: any) => {
                                            setFrequency(cat.value)
                                            setFrequencyName(cat.label)
                                        }}>
                                        <MenuTrigger>
                                            <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2f2f3c' }}>
                                                {frequencyName}<Ionicons name='caret-down' size={14} />
                                            </Text>
                                        </MenuTrigger>
                                        <MenuOptions customStyles={{
                                            optionsContainer: {
                                                padding: 10,
                                                borderRadius: 15,
                                                shadowOpacity: 0,
                                                borderWidth: 1,
                                                borderColor: '#F8F9FA',
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
                                    </Menu>
                                </View>
                            ) : (
                                <View
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "row",
                                        backgroundColor: "white"
                                    }}>
                                    <Text style={styles.text}>{PreferredLanguageText("remindOn")}</Text>
                                    <DatePicker
                                        preventOverflow={true}
                                        value={endPlayAt}
                                        format="YYYY-MM-DD HH:mm"
                                        onChange={(event: any) => {
                                            const date = new Date(event);
                                            if (date < new Date()) return;

                                            setEndPlayAt(date);
                                        }}
                                        // isValidDate={disablePastDt}
                                        size={'xs'}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}
                {notify && !shuffle ? (
                    <View style={{ width: "100%" }}>
                        <View
                            style={{
                                width: "100%",
                                paddingTop: 40,
                                paddingBottom: 15,
                                backgroundColor: "white"
                            }}>
                            <Text style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c'
                            }}>Indefinite</Text>
                        </View>
                        <View style={{ flexDirection: "row" }}>
                            <View
                                style={{
                                    backgroundColor: "white",
                                    height: 40,
                                    marginHorizontal: 10
                                }}>
                                <Switch
                                    value={playChannelCueIndef}
                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: "#F8F9FA",
                                        true: "#818385"
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
                                        backgroundColor: "white"
                                    }}>
                                    <Text style={styles.text}>{PreferredLanguageText("remindTill")}</Text>
                                    <DatePicker
                                        preventOverflow={true}
                                        format="YYYY-MM-DD HH:mm"
                                        onChange={(event: any) => {
                                            const date = new Date(event);
                                            if (date < new Date()) return;

                                            setEndPlayAt(date);
                                        }}
                                        value={endPlayAt}
                                        size={'xs'}
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
                                // if user has not signed up
                                !userSetupComplete ||
                                // deadline has passed & its not an initiated timed quiz
                                // (currentDate >= deadline && !(isQuiz && isQuizTimed && initiatedAt)) ||
                                // graded
                                props.cue.graded ||
                                // if timed quiz not initiated
                                (isQuiz && isQuizTimed && !initiatedAt) ||
                                // if quiz submitted already
                                (isQuiz && props.cue.submittedAt && props.cue.submittedAt !== "")
                            }
                            onPress={() => handleSubmit()}
                            style={{ backgroundColor: "white", borderRadius: 15 }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    color: "white",
                                    fontSize: 12,
                                    backgroundColor: "#3B64F8",
                                    borderRadius: 15,
                                    paddingHorizontal: 25,
                                    fontFamily: "inter",
                                    overflow: "hidden",
                                    height: 35,
                                    textTransform: 'uppercase'
                                }}>
                                {userSetupComplete
                                    ? (props.cue.submittedAt && props.cue.submittedAt !== "") || submitted
                                        ? props.cue.graded
                                            ? PreferredLanguageText("graded")
                                            : isQuiz
                                                ? PreferredLanguageText("submitted")
                                                : PreferredLanguageText("submit")
                                        : PreferredLanguageText("submit")
                                    : PreferredLanguageText("signupToSubmit")}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    const renderDeleteButtons = () => {
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
                    {isOwner || !props.cue.channelId || props.cue.channelId === "" ? (
                        <TouchableOpacity onPress={() => handleDelete()} style={{ backgroundColor: "white", borderRadius: 15 }}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    lineHeight: 35,
                                    color: "white",
                                    fontSize: 12,
                                    backgroundColor: "#3B64F8",
                                    borderRadius: 15,
                                    paddingHorizontal: 25,
                                    fontFamily: "inter",
                                    overflow: "hidden",
                                    height: 35,
                                    textTransform: "uppercase"
                                }}>
                                {isOwner
                                    ? props.cue.channelId && props.cue.channelId !== ""
                                        ? PreferredLanguageText("deleteForEveryone")
                                        : PreferredLanguageText("delete")
                                    : PreferredLanguageText("delete")}
                            </Text>
                        </TouchableOpacity>
                    ) : null}

                </View>
            </View>
        );
    };


    if (initiateAt > new Date() && !isOwner) {
        return (<View style={{ minHeight: Dimensions.get('window').height }}>
            <View style={{ backgroundColor: 'white', flex: 1, }}>
                <Text style={{ width: '100%', color: '#818385', fontSize: 20, paddingTop: 200, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1, textAlign: 'center' }}>
                    Available from {moment(initiateAt).format('MMMM Do YYYY, h:mm a')}
                </Text>
            </View>
        </View>)
    }

    if (isQuiz && props.cue.submission && props.cue.submittedAt !== null && !props.cue.releaseSubmission && !isOwner) {
        return (<View style={{ minHeight: Dimensions.get('window').height }}>
            <View style={{ backgroundColor: 'white', flex: 1, }}>
                <Text style={{ width: '100%', color: '#818385', fontSize: 20, paddingTop: 200, paddingBottom: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1, textAlign: 'center' }}>
                    Quiz submitted. You will be notified when scores are released.
                </Text>
            </View>
        </View>)
    }

    // MAIN RETURN
    return (
        <View
            style={{
                width: "100%",
                // height: Dimensions.get('window').height - 30,
                backgroundColor: "white",
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                paddingHorizontal: 20,
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
                    height: '100%'
                }}>
                <Text
                    style={{
                        width: "100%",
                        textAlign: "center",
                        height: 15,
                        paddingBottom: 30
                    }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>

                {props.cue.channelId && props.cue.channelId !== "" ? (
                    <View
                        style={{
                            width: "100%",
                            flexDirection: "row",
                            marginBottom: 5
                        }}>
                        {renderCueTabs()}
                        {!isOwner && props.cue.graded && props.cue.score !== undefined && props.cue.score !== null && !isQuiz && props.cue.releaseSubmission ? (
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: "white",
                                    height: 22,
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 10,
                                    backgroundColor: "#3B64F8",
                                    lineHeight: 20,
                                    paddingTop: 1
                                }}>
                                {props.cue.score}%
                            </Text>
                        ) : null}
                        {
                            !isOwner && props.cue.submittedAt !== "" && (new Date(props.cue.submittedAt) >= deadline) ?
                                <View style={{ borderRadius: 10, padding: 5, borderWidth: 1, borderColor: '#D91D56', marginLeft: 15, }}>
                                    <Text style={{ color: '#D91D56', fontSize: 12, textAlign: 'center' }}>
                                        LATE
                                    </Text>
                                </View>
                                :
                                null
                        }
                        <TouchableOpacity
                            onPress={() => setStarred(!starred)}
                            style={{
                                backgroundColor: "white",
                                flex: 1
                            }}>
                            <Text
                                style={{
                                    textAlign: "right",
                                    lineHeight: 30,
                                    marginTop: -31,
                                    // paddingRight: 25,
                                    width: "100%"
                                }}>
                                <Ionicons name="bookmark" size={34} color={starred ? "#d91d56" : "#818385"} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ flexDirection: "row" }}>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                            onPress={() => {
                                props.setShowOptions(false)
                                // props.setShowOptions(false)
                            }}
                        >
                            <Text style={!props.showOptions ? styles.allGrayFill : styles.all}>
                                {PreferredLanguageText("viewShared")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                justifyContent: "center",
                                flexDirection: "column"
                            }}
                            onPress={() => {
                                props.setShowOptions(true)
                            }}>
                            <Text style={props.showOptions ? styles.allGrayFill : styles.all}>
                                Details
                            </Text>
                        </TouchableOpacity>
                        {/* <View style={{ backgroundColor: "white", flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 11,
                                    paddingBottom: 20,
                                    textTransform: "uppercase",
                                    // paddingLeft: 10
                                }}>
                                {PreferredLanguageText("update")}
                            </Text>
                        </View> */}
                        <TouchableOpacity
                            onPress={() => setStarred(!starred)}
                            style={{
                                backgroundColor: "white",
                                flex: 1
                            }}>
                            <Text
                                style={{
                                    textAlign: "right",
                                    lineHeight: 30,
                                    marginTop: -31,
                                    // paddingRight: 25,
                                    width: "100%"
                                }}>
                                <Ionicons name="bookmark" size={34} color={starred ? "#d91d56" : "#818385"} />
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                {
                    props.showOptions || props.showComments ? null :
                        <View
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: Dimensions.get("window").width < 768 ? "column-reverse" : "row",
                                paddingBottom: 4,
                                backgroundColor: "white",
                                marginTop: 20
                            }}
                            onTouchStart={() => Keyboard.dismiss()}>
                            <View
                                style={{
                                    flexDirection: Dimensions.get("window").width < 768 ? "column" : "row",
                                    flex: 1,
                                    borderBottomWidth: ((props.cue.channelId && props.cue.channelId !== '' && !isOwner && props.showOriginal) || (props.showOriginal && showImportOptions) || isQuiz)
                                        || (((props.cue.graded && submission && !isOwner) && !props.showOriginal) || (!props.showOriginal && showImportOptions))
                                        || (!props.showOriginal && submissionImported) || (imported && props.showOriginal)
                                        ? 0 : 1,
                                    borderBottomColor: '#dddddd'
                                }}>
                                {renderRichToolbar()}
                                {(!props.showOriginal && props.cue.submission && !submissionImported && showImportOptions)
                                    || (props.showOriginal && showImportOptions && isOwner) ? (
                                    <FileUpload
                                        back={() => setShowImportOptions(false)}
                                        onUpload={(u: any, t: any) => {
                                            const obj = { url: u, type: t, title: props.showOriginal ? title : submissionTitle };
                                            if (props.showOriginal) {
                                                setOriginal(JSON.stringify(obj))
                                            } else {
                                                setCue(JSON.stringify(obj))
                                            }
                                            setShowImportOptions(false);
                                        }}
                                    />
                                ) : null}
                            </View>
                            <View style={{ backgroundColor: '#fff', flexDirection: 'row' }}>
                                {(!props.showOriginal && !submissionImported && !props.cue.graded)
                                    || (props.showOriginal && isOwner && !imported && !isQuiz)
                                    ? (
                                        <Text
                                            style={{
                                                color: "#2f2f3c",
                                                fontSize: 11,
                                                lineHeight: 30,
                                                textAlign: "right",
                                                paddingRight: 20,
                                                textTransform: "uppercase"
                                            }}
                                            onPress={() => setShowEquationEditor(!showEquationEditor)}>
                                            {showEquationEditor ? PreferredLanguageText("hide") : PreferredLanguageText("formula")}
                                        </Text>
                                    ) : null}
                                {!props.showOriginal &&
                                    props.cue.submission &&
                                    currentDate < deadline &&
                                    !submissionImported &&
                                    !showImportOptions &&
                                    !props.cue.graded && !isQuiz ? (
                                    <Text
                                        style={{
                                            color: "#2f2f3c",
                                            fontSize: 11,
                                            lineHeight: 30,
                                            textAlign: "right",
                                            // paddingRight: 10,
                                            textTransform: "uppercase"
                                        }}
                                        onPress={() => setShowImportOptions(true)}>
                                        {PreferredLanguageText("import")} {Dimensions.get("window").width < 768 ? "" : "   "}
                                    </Text>
                                ) : (
                                    (props.showOriginal && !isOwner) || // viewing import as non import
                                        (props.showOriginal && isOwner && imported) ||  // viewing import as owner
                                        (!props.showOriginal && isOwner && (props.cue.channelId && props.cue.channelId !== '')) || // no submission as owner
                                        (!props.showOriginal && submissionImported && !isOwner) ||  // submitted as non owner
                                        (!props.showOriginal && !submission && (props.cue.channelId && props.cue.channelId !== '')) ||  // my notes
                                        isQuiz
                                        ? null :
                                        (
                                            <Text style={{
                                                color: '#2f2f3c',
                                                fontSize: 11,
                                                lineHeight: 30,
                                                textAlign: 'right',
                                                // paddingRight: 10,
                                                textTransform: 'uppercase'
                                            }}
                                                onPress={() => setShowImportOptions(true)}
                                            >
                                                {PreferredLanguageText('import')} {Dimensions.get('window').width < 768 ? '' : '   '}
                                            </Text>
                                        )
                                )}
                            </View>
                        </View>
                }
                {renderEquationEditor()}
                {/* <ScrollView
                    style={{
                        paddingBottom: 25,
                        height: "100%",
                        // borderBottomColor: "#F8F9FA",
                        // borderBottomWidth: 1
                    }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    scrollEventThrottle={1}
                    keyboardDismissMode={"on-drag"}
                    overScrollMode={"always"}
                    nestedScrollEnabled={true}> */}
                <View>
                    {
                        props.showOptions || props.showComments ? null :
                            <View>
                                {renderQuizTimerOrUploadOptions()}
                                {/* {renderCueRemarks()} */}
                                {!props.showOriginal && submissionImported && !isQuiz ? (
                                    <View style={{ flexDirection: "row" }}>
                                        <View
                                            style={{
                                                width: "40%",
                                                alignSelf: "flex-start",
                                                marginLeft: 0
                                            }}>
                                            <TextInput
                                                value={submissionTitle}
                                                style={styles.input}
                                                placeholder={"Title"}
                                                onChangeText={val => setSubmissionTitle(val)}
                                                placeholderTextColor={"#818385"}
                                            />
                                        </View>
                                        {props.cue.submittedAt && props.cue.submittedAt !== "" ? (
                                            <View
                                                style={{
                                                    marginLeft: 25,
                                                    marginTop: 20,
                                                    alignSelf: "flex-start",
                                                    display: "flex",
                                                    flexDirection: "row"
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
                                                color="#818385"
                                                size={20}
                                                onPress={() => setWebviewKey(Math.random())}
                                            />
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                color: "#818385",
                                                textAlign: "center"
                                            }}>
                                            Reload
                                        </Text>
                                    </View> */}
                                                <a download={true} href={submissionUrl} style={{ textDecoration: "none", textAlign: "center" }}>
                                                    <View>
                                                        <Ionicons name="cloud-download-outline" color="#818385" size={20} style={{ alignSelf: 'center' }} />
                                                        <Text
                                                            style={{
                                                                fontSize: 9,
                                                                color: "#818385",
                                                                textAlign: "center"
                                                            }}>
                                                            Download
                                                        </Text>
                                                    </View>
                                                </a>
                                                {
                                                    props.cue.graded || (currentDate > deadline) ? null :
                                                        <TouchableOpacity
                                                            onPress={() => clearAll()}
                                                            style={{ marginLeft: 15, alignContent: 'center' }}
                                                        >
                                                            <Ionicons name="trash-outline" color="#818385" size={20} />
                                                            <Text
                                                                style={{
                                                                    fontSize: 9,
                                                                    color: "#818385",
                                                                    textAlign: "center"
                                                                }}>
                                                                Remove
                                                            </Text>
                                                        </TouchableOpacity>
                                                }
                                            </View>
                                        ) : <TouchableOpacity
                                            style={{
                                                marginLeft: 15
                                            }}
                                            onPress={() => clearAll()}
                                        >
                                            <Ionicons name="trash-outline" color="#818385" size={20} style={{ alignSelf: 'center' }} />
                                            <Text
                                                style={{
                                                    fontSize: 9,
                                                    color: "#818385",
                                                    textAlign: "center"
                                                }}>
                                                Remove
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
                                {isQuiz && cueGraded && !isV0Quiz ? <QuizGrading
                                    problems={problems}
                                    solutions={quizSolutions}
                                    partiallyGraded={false}
                                    //  onGradeQuiz={onGradeQuiz}
                                    comment={comment}
                                    isOwner={false}
                                    headers={headers}
                                /> : renderMainCueContent()}
                                {/* <TouchableOpacity
                        onPress={() => setShowOptions(!showOptions)}
                        style={{
                            width: "100%",
                            flexDirection: "row",
                            // marginTop: 20,
                            // borderTopColor: "#F8F9FA",
                            // borderTopWidth: 1,
                            paddingTop: 40,
                            paddingBottom: 20
                        }}>
                        <Text style={{
                            lineHeight: 23,
                            marginRight: 10,
                            color: '#2f2f3c',
                            fontSize: 11,
                            textTransform: 'uppercase'
                        }}>
                            {PreferredLanguageText('options')}
                        </Text>
                        <Text style={{ lineHeight: 21 }}>
                            <Ionicons size={14} name={showOptions ? 'caret-down-outline' : 'caret-forward-outline'} color='#2f2f3c' />
                        </Text>
                    </TouchableOpacity> */}
                            </View>}
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
                                </View>
                            ) : null}
                            <View
                                style={{
                                    display: "flex",
                                    flexDirection: "column"
                                }}>
                                {renderCategoryOptions()}
                                {renderPriorityOptions()}
                                {renderForwardOptions()}
                            </View>
                        </View>
                        {renderReminderOptions()}
                        {isQuiz && isOwner ? <View style={{ width: "100%" }}>
                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                <Text style={{ fontSize: 11, color: '#2f2f3c', textTransform: 'uppercase' }}>
                                    Shuffle Questions
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    marginRight: 10
                                }}>
                                    <Switch
                                        value={shuffleQuiz}
                                        disabled={true}
                                        onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#F8F9FA',
                                            true: '#818385'
                                        }}
                                        activeThumbColor='white'
                                    />
                                </View>
                            </View>
                        </View> : null}
                        {renderDeleteButtons()}
                    </Collapse>
                </View>
            </Animated.View>
        </View>
    );
};

export default UpdateControls;

const styles: any = StyleSheet.create({
    timePicker: {
        width: 125,
        fontSize: 15,
        height: 45,
        color: "#2f2f3c",
        borderRadius: 10,
        marginLeft: 10
    },
    cuesInput: {
        width: "100%",
        backgroundColor: "#F8F9FA",
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
        lineHeight: 18
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: "white"
    },
    colorContainerOutline: {
        lineHeight: 22,
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: "white",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#818385"
    },
    input: {
        width: "100%",
        borderBottomColor: "#F8F9FA",
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        // marginTop: 5,
        marginBottom: 20
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
        fontSize: 12,
        color: "#818385",
        textAlign: "left",
        paddingHorizontal: 10
    },
    all: {
        fontSize: 12,
        color: "#2f2f3c",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white",
        lineHeight: 20
    },
    allOutline: {
        fontSize: 12,
        backgroundColor: "#2f2f3c",
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10
    },
    allBlack: {
        fontSize: 12,
        color: "#2f2f3c",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white"
    },
    allGrayFill: {
        fontSize: 12,
        color: "#fff",
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "#2f2f3c",
        lineHeight: 20
    },
    allGrayOutline: {
        fontSize: 12,
        color: "#818385",
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: "white",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#818385",
        lineHeight: 20
    },
    color1: {
        backgroundColor: "#d91d56"
    },
    color2: {
        backgroundColor: "#ED7D22"
    },
    color3: {
        backgroundColor: "#FFBA10"
    },
    color4: {
        backgroundColor: "#B8D41F"
    },
    color5: {
        backgroundColor: "#53BE6D"
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#818385"
    },
    badge: {
        position: 'absolute',
        alignSelf: 'flex-end',
        width: 7,
        height: 7,
        marginRight: -2,
        marginTop: 0,
        borderRadius: 15,
        backgroundColor: '#d91d56',
        textAlign: 'center',
        zIndex: 50
    },
});