// REACT
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, Dimensions, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import lodash from 'lodash';
import moment from 'moment';

// API
import { fetchAPI } from '../graphql/FetchAPI';
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
    // findBySchoolId,
    getRole,
    getOrganisation
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Editor } from '@tinymce/tinymce-react';
import Alert from '../components/Alert';
import { Text, View, TouchableOpacity } from './Themed';
import FileUpload from './UploadFiles';
import { Collapse } from 'react-collapse';
import Quiz from './Quiz';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import TeXToSVG from 'tex-to-svg';
import ReactPlayer from 'react-player';
import QuizGrading from './QuizGrading';
// import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import WebViewer from '@pdftron/pdfjs-express';
import TextareaAutosize from 'react-textarea-autosize';
import parser from 'html-react-parser';
import Select from 'react-select';
import { Datepicker as MobiscrollDatePicker } from '@mobiscroll/react5';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import { Select as MobiscrollSelect } from '@mobiscroll/react';
import FormulaGuide from './FormulaGuide';
import { RichEditor } from 'react-native-pell-rich-editor';

// HELPERS
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { handleFileUploadEditor } from '../helpers/FileUpload';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { htmlStringParser } from '../helpers/HTMLParser';

// NEW EDITOR
// Require Editor JS files.
import 'froala-editor/js/froala_editor.pkgd.min.js';

// import 'froala-editor/css/froala_editor.pkgd.min.css';
// import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';

// Require Editor CSS files.
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// Require Font Awesome.
import 'font-awesome/css/font-awesome.css';

import FroalaEditor from 'react-froala-wysiwyg';

import Froalaeditor from 'froala-editor';

import { FULL_FLEDGED_TOOLBAR_BUTTONS, QUIZ_INSTRUCTIONS_TOOLBAR_BUTTONS } from '../constants/Froala';

import { renderMathjax } from '../helpers/FormulaHelpers';

const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const current = new Date();
    const [cue] = useState(props.cue.cue);
    const [initialSubmissionDraft, setInitialSubmissionDraft] = useState('');
    const [shuffle, setShuffle] = useState(props.cue.shuffle);
    const [starred, setStarred] = useState(props.cue.starred);
    const [color, setColor] = useState(props.cue.color);
    const [notify, setNotify] = useState(props.cue.frequency !== '0' ? true : false);
    const [frequency, setFrequency] = useState(props.cue.frequency);
    const [customCategory, setCustomCategory] = useState('None');
    const [customCategories, setCustomCategories] = useState<any[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [initializedCustomCategories, setInitializedCustomCategories] = useState(false);
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [markedAsRead, setMarkedAsRead] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const stopPlay =
        props.cue.endPlayAt && props.cue.endPlayAt !== ''
            ? props.cue.endPlayAt === 'Invalid Date'
                ? new Date(current.getTime() + 1000 * 60 * 60)
                : new Date(props.cue.endPlayAt)
            : new Date(current.getTime() + 1000 * 60 * 60);
    const [endPlayAt, setEndPlayAt] = useState<Date>(stopPlay);
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(
        props.cue.endPlayAt && props.cue.endPlayAt !== '' ? false : true
    );
    const RichText: any = useRef();
    const editorRef: any = useRef();
    const submissionViewerRef: any = useRef();
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse();
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false);
    const [limitedShares, setLimitedShares] = useState(props.cue.limitedShares ? props.cue.limitedShares : false);
    const dead =
        props.cue.deadline && props.cue.deadline !== ''
            ? props.cue.deadline === 'Invalid Date'
                ? new Date(current.getTime() + 1000 * 60 * 60 * 24)
                : new Date(props.cue.deadline)
            : new Date(current.getTime() + 1000 * 60 * 60 * 24);
    const initiate =
        props.cue.initiateAt && props.cue.initiateAt !== ''
            ? props.cue.initiateAt === 'Invalid Date'
                ? new Date()
                : new Date(props.cue.initiateAt)
            : new Date();
    const until =
        props.cue.availableUntil && props.cue.availableUntil !== ''
            ? props.cue.availableUntil === 'Invalid Date'
                ? new Date(current.getTime() + 1000 * 60 * 60 * 48)
                : new Date(props.cue.availableUntil)
            : new Date(current.getTime() + 1000 * 60 * 60 * 48);
    const [allowLateSubmission, setAllowLateSubmission] = useState(
        props.cue.availableUntil && props.cue.availableUntil !== ''
    );
    const [availableUntil, setAvailableUntil] = useState<Date>(until);
    const [deadline, setDeadline] = useState<Date>(dead);
    const [initiateAt, setInitiateAt] = useState<Date>(initiate);
    const [gradeWeight, setGradeWeight] = useState<any>(props.cue.gradeWeight ? props.cue.gradeWeight : 0);
    const [graded, setGraded] = useState(
        props.cue.gradeWeight
    );
    const currentDate = new Date();
    const [submitted, setSubmitted] = useState(false);
    const [imported, setImported] = useState(false);
    const [url, setUrl] = useState('');
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [submissionImported, setSubmissionImported] = useState(false);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [submissionType, setSubmissionType] = useState('');
    const [submissionTitle, setSubmissionTitle] = useState('');
    const [key, setKey] = useState(Math.random());
    const [showImportOptions, setShowImportOptions] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [shareWithChannelId, setShareWithChannelId] = useState('None');
    const [selected, setSelected] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [original, setOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original);
    const [initialOriginal, setInitialOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original);
    const [comment] = useState(props.cue.comment);
    const [unlimitedAttempts, setUnlimitedAttempts] = useState(!props.cue.allowedAttempts);
    const [allowedAttempts, setAllowedAttemps] = useState(
        !props.cue.allowedAttempts ? '' : props.cue.allowedAttempts.toString()
    );
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
    const [submissionDraft, setSubmissionDraft] = useState('');
    const [updatingCueContent, setUpdatingCueContent] = useState(false);
    const [updatingCueDetails, setUpdatingCueDetails] = useState(false);
    const [viewSubmission, setViewSubmission] = useState(
        (props.cue.submittedAt !== null && props.cue.submittedAt !== undefined) ||
            (props.cue.graded && props.cue.releaseSubmission)
    );
    const [viewSubmissionTab, setViewSubmissionTab] = useState('instructorAnnotations');
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [remainingAttempts, setRemainingAttempts] = useState<any>(null);
    const [isQuiz, setIsQuiz] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [unmodifiedProblems, setUnmodifiedProblems] = useState<any[]>([]);
    const [totalQuizPoints, setTotalQuizPoints] = useState(0);
    const [solutions, setSolutions] = useState<any[]>([]);
    const [quizId, setQuizId] = useState('');
    const [loading, setLoading] = useState(true);
    const [fetchingQuiz, setFetchingQuiz] = useState(false);
    const [initiatedAt, setInitiatedAt] = useState<any>(null);
    const [isQuizTimed, setIsQuizTimed] = useState(false);
    const [duration, setDuration] = useState(0);
    const [initDuration, setInitDuration] = useState(0);
    const [equation, setEquation] = useState('y = x + 1');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [headers, setHeaders] = useState({});
    const [cueGraded] = useState(props.cue.graded);
    const [quizSolutions, setQuizSolutions] = useState<any>({});
    const [loadingAfterModifyingQuiz, setLoadingAfterModifyingQuiz] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedChannelOwner, setSelectedChannelOwner] = useState<any>(undefined);
    const [userId, setUserId] = useState('');
    const width = Dimensions.get('window').width;
    // ALERTS
    const unableToStartQuizAlert = PreferredLanguageText('unableToStartQuiz');
    const cueDeletedAlert = PreferredLanguageText('cueDeleted');
    const submissionCompleteAlert = PreferredLanguageText('submissionComplete');
    const tryAgainLaterAlert = PreferredLanguageText('tryAgainLater');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const clearQuestionAlert = PreferredLanguageText('clearQuestion');
    const cannotUndoAlert = PreferredLanguageText('cannotUndo');
    const sharedAlert = PreferredLanguageText('sharedAlert');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const fillMissingProblemsAlert = PreferredLanguageText('fillMissingProblems');
    const enterNumericPointsAlert = PreferredLanguageText('enterNumericPoints');
    // const mustHaveOneOptionAlert = PreferredLanguageText('mustHaveOneOption')
    const fillMissingOptionsAlert = PreferredLanguageText('fillMissingOptions');
    const eachOptionOneCorrectAlert = PreferredLanguageText('eachOptionOneCorrect');

    Froalaeditor.DefineIcon('insertFormula', {
        NAME: 'formula',
        PATH:
            'M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z'
    });
    Froalaeditor.RegisterCommand('insertFormula', {
        title: 'Insert Formula',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function() {
            editorRef.current.editor.selection.save();
            setShowEquationEditor(true);
        }
    });

    // HOOKS

    /**
     * @description Load User on Init
     */
    useEffect(() => {
        loadUser();
    }, []);

    // SHARE WITH ANY OTHER CHANNEL IN INSTITUTE
    // useEffect(() => {
    //     if (role === 'instructor' && school) {
    //         const server = fetchAPI('');
    //         server
    //             .query({
    //                 query: findBySchoolId,
    //                 variables: {
    //                     schoolId: school._id
    //                 }
    //             })
    //             .then((res: any) => {
    //                 if (res.data && res.data.channel.findBySchoolId) {
    //                     res.data.channel.findBySchoolId.sort((a, b) => {
    //                         if (a.name < b.name) {
    //                             return -1;
    //                         }
    //                         if (a.name > b.name) {
    //                             return 1;
    //                         }
    //                         return 0;
    //                     });
    //                     const c = res.data.channel.findBySchoolId.filter((item: any) => {
    //                         return item.createdBy.toString().trim() !== userId.toString().trim();
    //                     });
    //                     setOtherChannels(c);
    //                     const otherChannelOwnersMap: any = {};
    //                     const otherChannelOwners: any[] = [];
    //                     c.map((channel: any) => {
    //                         if (!otherChannelOwnersMap[channel.createdBy]) {
    //                             otherChannelOwnersMap[channel.createdBy] = channel.createdByUsername;
    //                         }
    //                     });
    //                     Object.keys(otherChannelOwnersMap).map((key: any) => {
    //                         otherChannelOwners.push({
    //                             id: key,
    //                             name: otherChannelOwnersMap[key]
    //                         });
    //                     });
    //                     setChannelOwners(otherChannelOwners);
    //                 }
    //             });
    //     }
    // }, [role, school, userId]);

    /**
     * @description Load channels and share with
     */
    useEffect(() => {
        loadChannelsAndSharedWith();
    }, []);

    /**
     * @description Load categories for Update dropdown
     */
    useEffect(() => {
        let options = [
            {
                value: 'None',
                text: 'None'
            }
        ];

        customCategories.map((category: any) => {
            options.push({
                value: category,
                text: category
            });
        });

        setCategoryOptions(options);
    }, [customCategories]);

    /**
     * @description Set custom category on init
     */
    useEffect(() => {
        if (props.cue.customCategory === '') {
            setCustomCategory('None');
            return;
        }

        setCustomCategory(props.cue.customCategory);
    }, [props.cue]);

    /**
     * @description Load PDFTron Webviewer for submission
     */
    useEffect(() => {
        if (submissionAttempts && submissionAttempts.length > 0 && submissionViewerRef && submissionViewerRef.current) {
            const attempt = submissionAttempts[submissionAttempts.length - 1];

            let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: url
                },
                submissionViewerRef.current
            ).then(async instance => {
                const { documentViewer, annotationManager } = instance.Core;

                const u = await AsyncStorage.getItem('user');

                let user: any;

                if (u) {
                    user = JSON.parse(u);
                    annotationManager.setCurrentUser(user.fullName);
                }

                documentViewer.addEventListener('documentLoaded', async () => {
                    // perform document operations

                    const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                    const xfdfString = currAttempt.annotations;

                    if (xfdfString !== '') {
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

                annotationManager.addEventListener(
                    'annotationChanged',
                    async (annotations: any, action: any, { imported }) => {
                        // If the event is triggered by importing then it can be ignored
                        // This will happen when importing the initial annotations
                        // from the server or individual changes from other users
                        if (imported) return;

                        const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: true });

                        let subCues: any = {};
                        try {
                            const value = await AsyncStorage.getItem('cues');
                            if (value) {
                                subCues = JSON.parse(value);
                            }
                        } catch (e) {}

                        if (subCues[props.cueKey].length === 0) {
                            return;
                        }

                        const currCue = subCues[props.cueKey][props.cueIndex];

                        const currCueValue = currCue.cue;

                        const obj = JSON.parse(currCueValue);

                        const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                        currAttempt.annotations = xfdfString;

                        const allAttempts = [...obj.attempts];

                        allAttempts[allAttempts.length - 1] = currAttempt;

                        const updateCue = {
                            attempts: allAttempts,
                            submissionDraft: obj.submissionDraft
                        };

                        const saveCue = {
                            ...currCue,
                            cue: JSON.stringify(updateCue)
                        };

                        subCues[props.cueKey][props.cueIndex] = saveCue;

                        const stringifiedCues = JSON.stringify(subCues);
                        await AsyncStorage.setItem('cues', stringifiedCues);
                        // props.reloadCueListAfterUpdate();
                        
                    }
                );
            });
        }
    }, [
        viewSubmission,
        submissionViewerRef,
        submissionViewerRef.current,
        viewSubmissionTab,
        submissionAttempts,
        props.showOriginal
    ]);

    /**
     * @description Used to detect ongoing quiz and
     */
    useEffect(() => {
        if (!isQuizTimed || initiatedAt === null || initiatedAt === '' || isOwner) {
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

    /**
     * @description If cue contains a Quiz, then need to fetch the quiz and set State
     */
    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data1 = original;
            const data2 = props.cue.cue;

            if (!data2 || !data2[0] || data2[0] !== '{' || data2[data2.length - 1] !== '}') {
                setSubmissionImported(false);
                setSubmissionUrl('');
                setSubmissionType('');
                setSubmissionTitle('');
            }

            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1);
                if (obj.quizId) {
                    if (!loading) {
                        return;
                    }
                    setFetchingQuiz(true);

                    // load quiz here and set problems
                    const server = fetchAPI('');
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

                                if (solutionsObject.initiatedAt && solutionsObject.initiatedAt !== '') {
                                    const init = new Date(solutionsObject.initiatedAt);
                                    setInitiatedAt(init);
                                }

                                // NEW SCHEMA V1: QUIZ RESPONSES STORED AS quizResponses
                                if (
                                    solutionsObject.quizResponses !== undefined &&
                                    solutionsObject.quizResponses !== ''
                                ) {
                                    const parseQuizResponses = JSON.parse(solutionsObject.quizResponses);

                                    setSolutions(parseQuizResponses.solutions);

                                    if (
                                        parseQuizResponses.initiatedAt !== undefined &&
                                        parseQuizResponses.initiatedAt !== null
                                    ) {
                                        const init = new Date(parseQuizResponses.initiatedAt);
                                        setInitiatedAt(init);
                                    }
                                }

                                if (solutionsObject.attempts !== undefined) {
                                    setQuizAttempts(solutionsObject.attempts);

                                    // FInd the active one and set it to quizSolutions
                                    solutionsObject.attempts.map((attempt: any) => {
                                        if (attempt.isActive) {
                                            setQuizSolutions(attempt);
                                        }
                                    });
                                }

                                // Set remaining attempts
                                if (props.cue.allowedAttempts !== null) {
                                    setRemainingAttempts(
                                        solutionsObject.attempts
                                            ? props.cue.allowedAttempts - solutionsObject.attempts.length
                                            : props.cue.allowedAttempts
                                    );
                                }

                                setProblems(res.data.quiz.getQuiz.problems);

                                const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems);
                                setUnmodifiedProblems(deepCopy);

                                let totalPoints = 0;

                                res.data.quiz.getQuiz.problems.map((problem: any) => {
                                    totalPoints += Number(problem.points);
                                });

                                setTotalQuizPoints(totalPoints);

                                if (res.data.quiz.getQuiz.duration && res.data.quiz.getQuiz.duration !== 0) {
                                    setDuration(res.data.quiz.getQuiz.duration * 60);
                                    setIsQuizTimed(true);
                                }

                                setShuffleQuiz(res.data.quiz.getQuiz.shuffleQuiz ? true : false);
                                setTitle(obj.title);
                                setIsQuiz(true);
                                setInstructions(
                                    res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : ''
                                );
                                setHeaders(
                                    res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {}
                                );
                                setFetchingQuiz(false);
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
                setUrl('');
                setType('');
                setTitle('');
            }
        } else {
            const data = props.cue.cue;
            if (data && data[0] && data[0] === '{' && data[data.length - 1] === '}') {
                const obj = JSON.parse(data);
                setSubmissionImported(true);
                setSubmissionUrl(obj.url);
                setSubmissionType(obj.type);
                setSubmissionTitle(obj.title);
            } else {
                setSubmissionImported(false);
                setSubmissionUrl('');
                setSubmissionType('');
                setSubmissionTitle('');
            }
        }
        setLoading(false);
    }, [props.cue, cue, loading, original]);

    /**
     * @description Imports for local cues
     */
    useEffect(() => {
        if (!props.cue.channelId) {
            if (original && original[0] && original[0] === '{' && original[original.length - 1] === '}') {
                const obj = JSON.parse(original);
                setImported(true);
                setUrl(obj.url);
                setType(obj.type);
                setTitle(obj.title);
            }
        }
    }, [original]);

    /**
     * @description Initialize submission Draft + Submission import title, url, type for new SCHEMA
     */
    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
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
                            setSubmissionTitle(parse.title);
                        }

                        setSubmissionDraft(obj.submissionDraft);
                    } else {
                        setInitialSubmissionDraft(obj.submissionDraft);
                        setSubmissionDraft(obj.submissionDraft);
                    }

                    setSubmissionAttempts(obj.attempts);
                }
            }
        }
    }, [cue, props.cue.channelId]);

    /**
     * @description Update submissionDraft when the Submission title is updated
     */
    useEffect(() => {
        const existingSubmissionDraft: any = submissionDraft;

        if (existingSubmissionDraft !== '') {
            const parsedSubmissionDraft = JSON.parse(existingSubmissionDraft);

            parsedSubmissionDraft.title = submissionTitle;

            setSubmissionDraft(JSON.stringify(parsedSubmissionDraft));
        }
    }, [submissionTitle]);

    /**
     * @description Update cue status as Read on opening
     */
    useEffect(() => {
        updateStatusAsRead();
    }, [props.cue.status]);

    /**
     * @description Handle Save when props.save
     */
    useEffect(() => {
        if (props.save) {
            Alert('Save changes?', '', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    }
                },
                {
                    text: 'Yes',
                    onPress: () => {
                        if (props.showOriginal) {
                            handleUpdateContent();
                        } else {
                            handleUpdateDetails();
                        }
                    }
                }
            ]);
            props.setSave(false);
        }
    }, [props.save, props.channelOwner, props.showOriginal]);

    /**
     * @description Handle Delete when props.del
     */
    useEffect(() => {
        if (props.del) {
            handleDelete();
            // props.setDelete(false);
        }
    }, [props.del]);

    /**
     * @description Setup PDFTron Webviewer for Cue content
     */
    useEffect(() => {
        if (props.showOriginal) {
            if (url === '' || !url) {
                return;
            }

            if (
                type === 'mp4' ||
                type === 'oga' ||
                type === 'mov' ||
                type === 'wmv' ||
                type === 'mp3' ||
                type === 'mov' ||
                type === 'mpeg' ||
                type === 'mp2' ||
                type === 'wav'
            ) {
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
                    initialDoc: url
                },
                RichText.current
            ).then(async (instance: any) => {
                const { documentViewer, annotationManager } = instance.Core;
                const u = await AsyncStorage.getItem('user');

                let user: any;

                if (u) {
                    user = JSON.parse(u);
                    annotationManager.setCurrentUser(user.fullName);
                }

                // you can now call WebViewer APIs here...
                documentViewer.addEventListener('documentLoaded', async () => {
                    // perform document operations

                    // Need to modify the original property in the cue
                    let subCues: any = {};
                    try {
                        const value = await AsyncStorage.getItem('cues');
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) {}

                    if (subCues[props.cueKey].length === 0) {
                        return;
                    }

                    const currCue = subCues[props.cueKey][props.cueIndex];

                    if (currCue.annotations !== '') {
                        const xfdfString = currCue.annotations;

                        annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
                            annotations.forEach((annotation: any) => {
                                annotationManager.redrawAnnotation(annotation);
                            });
                        });
                    }
                });

                annotationManager.addEventListener(
                    'annotationChanged',
                    async (annotations: any, action: any, { imported }) => {
                        // If the event is triggered by importing then it can be ignored
                        // This will happen when importing the initial annotations
                        // from the server or individual changes from other users
                        if (imported) return;

                        const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: true });

                        let subCues: any = {};
                        try {
                            const value = await AsyncStorage.getItem('cues');
                            if (value) {
                                subCues = JSON.parse(value);
                            }
                        } catch (e) {}

                        if (subCues[props.cueKey].length === 0) {
                            return;
                        }

                        const currCue = subCues[props.cueKey][props.cueIndex];

                        const saveCue = {
                            ...currCue,
                            annotations: xfdfString
                        };

                        subCues[props.cueKey][props.cueIndex] = saveCue;

                        const stringifiedCues = JSON.stringify(subCues);
                        await AsyncStorage.setItem('cues', stringifiedCues);
                        props.reloadCueListAfterUpdate();
                    }
                );
            });
        } else {
            if (submissionUrl === '' || !submissionUrl) {
                return;
            }

            if (
                submissionType === 'mp4' ||
                submissionType === 'oga' ||
                submissionType === 'mov' ||
                submissionType === 'wmv' ||
                submissionType === 'mp3' ||
                submissionType === 'mov' ||
                submissionType === 'mpeg' ||
                submissionType === 'mp2' ||
                submissionType === 'wav'
            ) {
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
                    initialDoc: submissionUrl
                },
                RichText.current
            ).then(async (instance: any) => {
                const { documentViewer, annotationManager } = instance.Core;
                // you can now call WebViewer APIs here...

                const u = await AsyncStorage.getItem('user');

                let user: any;

                if (u) {
                    user = JSON.parse(u);
                    annotationManager.setCurrentUser(user.fullName);
                }

                documentViewer.addEventListener('documentLoaded', () => {
                    // perform document operations

                    if (
                        submissionDraft !== '' &&
                        submissionDraft[0] &&
                        submissionDraft[0] === '{' &&
                        submissionDraft[submissionDraft.length - 1] === '}'
                    ) {
                        const obj = JSON.parse(submissionDraft);

                        if (obj.annotations !== '') {
                            const xfdfString = obj.annotations;

                            annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
                                annotations.forEach((annotation: any) => {
                                    annotationManager.redrawAnnotation(annotation);
                                });
                            });
                        }
                    }
                });

                annotationManager.addEventListener(
                    'annotationChanged',
                    async (annotations: any, action: any, { imported }) => {
                        // If the event is triggered by importing then it can be ignored
                        // This will happen when importing the initial annotations
                        // from the server or individual changes from other users
                        if (imported) return;

                        const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: true });

                        const obj = JSON.parse(submissionDraft);

                        let updateSubmissionDraftWithAnnotation = {
                            ...obj,
                            annotations: xfdfString
                        };

                        setSubmissionDraft(JSON.stringify(updateSubmissionDraftWithAnnotation));
                    }
                );
            });
        }
    }, [
        url,
        RichText,
        imported,
        submissionImported,
        props.showOriginal,
        props.showOptions,
        submissionUrl,
        type,
        submissionType
    ]);

    /**
     * @description Set is owner based on Channel owner prop
     */
    useEffect(() => {
        setIsOwner(props.channelOwner);
    }, [props.channelOwner]);

    /**
     * @description Clear submission imported if submissionDraft is set to ""
     */
    useEffect(() => {
        if (submissionDraft === '' && submissionImported) {
            setSubmissionImported(false);
            setSubmissionUrl('');
            setSubmissionType('');
            setSubmissionTitle('');
        }
    }, [submissionDraft]);

    /**
     * @description Sync user submission responses to cloud (IMP since submissions should be saved in real time)
     */
    useEffect(() => {
        handleUpdateCue();
    }, [
        submitted,
        solutions,
        initiatedAt,
        submissionType,
        submissionUrl,
        submissionTitle,
        submissionImported,
        isQuiz,
        submissionDraft
    ]);

    /**
     * @description Handle bookmark (Not used right now)
     */
    useEffect(() => {
        handleUpdateStarred();
    }, [starred]);

    /**
     * @description Update submission response in Editor on Tab change
     */
    useEffect(() => {
        setInitialSubmissionDraft(submissionDraft);
    }, [props.showOriginal, props.showComments, props.showOptions]);

    /**
     * @description Update original value in Editor on Tab change
     */
    useEffect(() => {
        setInitialOriginal(original);
    }, [props.showOriginal, props.showComments, props.showOptions]);

    /**
     * @description Loads all the channel categories and list of people cue has been shared with
     */
    const loadChannelsAndSharedWith = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user');
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI('');

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
                            setInitializedCustomCategories(true);
                        }
                    })
                    .catch(err => {});
            } else {
                setCustomCategories(props.customCategories);
                setInitializedCustomCategories(true);
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
                .catch(err => {});
            if (props.channelOwner && props.cue.channelId && props.cue.channelId !== '') {
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
                                    text: sub.label,
                                    // isFixed: sub.isFixed,
                                    // visited: sub.isFixed
                                };
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
                                    text: sub.label,
                                    // isFixed: true,
                                    // visited: true
                                };
                            });

                            const withoutOwner: any = [];
                            formatSel.map((i: any) => {
                                if (user._id !== i.value) {
                                    withoutOwner.push(i.value);
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
            return { ...base, backgroundColor: '#0096Fb', borderRadius: 11 };
        },
        multiValueLabel: (base: any, state: any) => {
            return state.data.isFixed
                ? { ...base, fontWeight: 'bold', color: 'white', paddingRight: 6 }
                : { ...base, color: 'white' };
        },
        multiValueRemove: (base: any, state: any) => {
            return state.data.isFixed ? { ...base, display: 'none' } : base;
        }
    };

    /**
     * @description Update cue with URL and Filetype after upload
     */
    const updateAfterFileImport = useCallback(
        (u: any, t: any) => {
            if (props.showOriginal) {
                setOriginal(
                    JSON.stringify({
                        url: u,
                        type: t,
                        title
                    })
                );
            } else {
                setSubmissionDraft(
                    JSON.stringify({
                        url: u,
                        type: t,
                        title: submissionTitle,
                        annotations: ''
                    })
                );
                setSubmissionImported(true);
                setSubmissionType(t);
                setSubmissionUrl(u);
            }
            setShowImportOptions(false);
        },
        [title, submissionTitle, props.showOriginal]
    );

    /**
     * @description Used to insert equation into Editor HTML
     */
    const insertEquation = useCallback(() => {
        if (equation === '') {
            Alert('Equation cannot be empty.');
            return;
        }

        renderMathjax(equation).then((res: any) => {
            const random = Math.random();

            editorRef.current.editor.selection.restore();

            editorRef.current.editor.html.insert(
                '<img class="rendered-math-jax" id="' +
                    random +
                    '" data-eq="' +
                    encodeURIComponent(equation) +
                    '" src="' +
                    res.imgSrc +
                    '"></img>'
            );
            editorRef.current.editor.events.trigger('contentChanged');

            setShowEquationEditor(false);
            setEquation('');
        });
    }, [equation, editorRef, editorRef.current]);

    /**
     * @description Fetch user organization and role
     */
    const loadUser = useCallback(async () => {
        const u = await AsyncStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            setUserId(parsedUser._id);
        }
    }, []);

    /**
     * @description Initialize the quiz (Timed quiz)
     */
    const initQuiz = useCallback(async () => {
        // Need to update this for late submission

        // Late submission not allowed then no submission after deadline has passed
        if (
            (!allowLateSubmission && new Date() > deadline) ||
            // If late submission allowed, then available until should be the new deadline
            (allowLateSubmission && new Date() > availableUntil) ||
            // Once release Submission that means assignment should be locked
            props.cue.releaseSubmission
        ) {
            Alert(unableToStartQuizAlert, 'Submission period has ended.');
            return;
        }

        const u = await AsyncStorage.getItem('user');
        if (u) {
            const user = JSON.parse(u);
            const now = new Date();
            const server = fetchAPI('');
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

    const fileUploadEditor = useCallback(
        async (files: any, forSubmission: boolean) => {
            const res = await handleFileUploadEditor(false, files.item(0), userId);

            console.log('On upload', res);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type, forSubmission);
        },
        [userId]
    );

    const videoUploadEditor = useCallback(
        async (files: any, forSubmission: boolean) => {
            const res = await handleFileUploadEditor(true, files.item(0), userId);

            console.log('On upload', res);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type, forSubmission);
        },
        [userId]
    );

    const setUploadResult = useCallback(
        (uploadURL: string, uploadType: string, forSubmission: boolean) => {
            if (!forSubmission) {
                setImported(true);

                setOriginal(
                    JSON.stringify({
                        url: uploadURL,
                        type: uploadType,
                        title
                    })
                );
            } else {
                setSubmissionImported(true);
                setSubmissionType(uploadType);
                setSubmissionUrl(uploadURL);

                setSubmissionDraft(
                    JSON.stringify({
                        url: uploadURL,
                        type: uploadType,
                        title: submissionTitle,
                        annotations: ''
                    })
                );
            }
        },
        [title, submissionTitle]
    );

    /**
     * @description Handle cue content for Submissions and Quiz responses
     */
    const handleUpdateCue = useCallback(async () => {
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[props.cueKey] && subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex];

        const currCueValue: any = currCue.cue;

        // If there are no existing submissions then initiate cue obj
        let submissionObj = {
            submissionDraft: '',
            attempts: []
        };

        let quizObj = {
            quizResponses: {},
            attempts: []
        };

        let updatedCue = '';

        if (isQuiz) {
            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                quizObj = JSON.parse(currCueValue);
            }

            quizObj.quizResponses = JSON.stringify({
                solutions,
                initiatedAt
            });

            updatedCue = JSON.stringify(quizObj);
        } else if (submissionImported) {
            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                submissionObj = JSON.parse(currCueValue);
            }

            const updatedDraft = JSON.parse(submissionDraft);
            // Submission draft will also have annotations so preserve those

            const obj = {
                ...updatedDraft,
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle
            };

            submissionObj.submissionDraft = JSON.stringify(obj);

            updatedCue = JSON.stringify(submissionObj);
        } else {
            if (currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                submissionObj = JSON.parse(currCueValue);
            }

            submissionObj.submissionDraft = submissionDraft;

            updatedCue = JSON.stringify(submissionObj);
        }

        const submittedNow = new Date();

        const saveCue = {
            ...currCue,
            cue: updatedCue,
            submittedAt: submitted ? submittedNow.toISOString() : props.cue.submittedAt
        };

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);
        props.reloadCueListAfterUpdate();
    }, [
        submitted,
        solutions,
        initiatedAt,
        submissionType,
        submissionUrl,
        submissionTitle,
        submissionImported,
        isQuiz,
        submissionDraft
    ]);

    /**
     * @description Update bookmark
     */
    const handleUpdateStarred = useCallback(async () => {
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[props.cueKey] && subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex];

        const saveCue = {
            ...currCue,
            starred
        };

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);
        props.reloadCueListAfterUpdate();
    }, [starred]);

    /**
     * @description Handle update Cue content (Channel owner)
     */
    const handleUpdateContent = useCallback(async () => {
        setUpdatingCueContent(true);

        if (!props.cue.channelId) {
            let subCues: any = {};
            try {
                const value = await AsyncStorage.getItem('cues');
                if (value) {
                    subCues = JSON.parse(value);
                }
            } catch (e) {}
            if (subCues[props.cueKey].length === 0) {
                return;
            }

            let tempOriginal = '';
            if (imported) {
                if (title === '') {
                    Alert('Title cannot be empty');
                    setUpdatingCueContent(false);
                    return;
                }

                const obj = {
                    type,
                    url,
                    title
                };
                tempOriginal = JSON.stringify(obj);
            } else {
                tempOriginal = original;
            }

            const currCue = subCues[props.cueKey][props.cueIndex];

            const saveCue = {
                ...currCue,
                cue: tempOriginal
            };

            subCues[props.cueKey][props.cueIndex] = saveCue;

            const stringifiedCues = JSON.stringify(subCues);
            await AsyncStorage.setItem('cues', stringifiedCues);
            props.reloadCueListAfterUpdate();

            // Update initial Value for Editor
            setInitialOriginal(tempOriginal);
            setUpdatingCueContent(false);

            return;
        }

        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[props.cueKey].length === 0) {
            return;
        }

        let tempOriginal = '';
        if (imported) {
            if (title === '') {
                Alert('Title cannot be empty');
                setUpdatingCueContent(false);
                return;
            }

            const obj = {
                type,
                url,
                title
            };
            tempOriginal = JSON.stringify(obj);
        } else if (isQuiz) {
            if (title === '') {
                Alert('Title cannot be empty');
                setUpdatingCueContent(false);
                return;
            }

            const parse = JSON.parse(original);
            const obj = {
                quizId: parse.quizId,
                title
            };
            tempOriginal = JSON.stringify(obj);
        } else {
            tempOriginal = original;
        }

        const currCue = subCues[props.cueKey][props.cueIndex];

        const saveCue = {
            ...currCue,
            original: tempOriginal
        };

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);
        props.reloadCueListAfterUpdate();

        // Update initial Value for Editor
        setInitialOriginal(tempOriginal);
        setUpdatingCueContent(false);
    }, [title, original, imported, type, url, isQuiz]);

    /**
     * @description Handle update cue details
     */
    const handleUpdateDetails = useCallback(async () => {
        setUpdatingCueDetails(true);
        let subCues: any = {};
        try {
            const value = await AsyncStorage.getItem('cues');
            if (value) {
                subCues = JSON.parse(value);
            }
        } catch (e) {}
        if (subCues[props.cueKey].length === 0) {
            return;
        }

        const currCue = subCues[props.cueKey][props.cueIndex];

        // Perform validation for dates
        if (submission && isOwner) {
            if (initiateAt > deadline) {
                Alert('Deadline must be after available date');
                return;
            }

            if (allowLateSubmission && availableUntil < deadline) {
                Alert('Late Submission date must be after deadline');
                return;
            }
        }

        const saveCue = {
            ...currCue,
            color,
            shuffle,
            frequency,
            customCategory: customCategory === 'None' ? '' : customCategory,
            gradeWeight: graded ? gradeWeight : null,
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
            submission,
            deadline: submission ? deadline.toISOString() : '',
            initiateAt: submission ? initiateAt.toISOString() : '',
            allowedAttempts: unlimitedAttempts ? null : allowedAttempts,
            availableUntil: submission && allowLateSubmission ? availableUntil.toISOString() : ''
        };

        console.log("Save cue", saveCue)

        subCues[props.cueKey][props.cueIndex] = saveCue;

        const stringifiedCues = JSON.stringify(subCues);
        await AsyncStorage.setItem('cues', stringifiedCues);
        props.reloadCueListAfterUpdate();

        setUpdatingCueDetails(false);
    }, [
        submission,
        deadline,
        initiateAt,
        gradeWeight,
        customCategory,
        endPlayAt,
        color,
        frequency,
        notify,
        allowedAttempts,
        unlimitedAttempts,
        allowLateSubmission,
        availableUntil,
        isOwner,
        graded
    ]);

    /**
     * @description Handle delete cue
     */
    const handleDelete = useCallback(async () => {
        const { title } = htmlStringParser(original);

        Alert(`Delete '${title}'?`, '', [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    props.setDelete(false);
                    return;
                }
            },
            {
                text: 'Okay',
                onPress: async () => {
                    const server = fetchAPI('');
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
                                    Alert('Deleted successfully.');
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
                        const value = await AsyncStorage.getItem('cues');
                        if (value) {
                            subCues = JSON.parse(value);
                        }
                    } catch (e) {}
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
                    await AsyncStorage.setItem('cues', stringifiedCues);
                    props.closeModal();
                }
            }
        ]);
    }, [props.cueIndex, props.closeModal, props.cueKey, props.cue, isOwner, original]);

    /**
     * @description Submit quiz when time gets over
     */
    const submitQuizEndTime = useCallback(async () => {
        const u: any = await AsyncStorage.getItem('user');
        if (u) {
            const parsedUser = JSON.parse(u);
            if (!parsedUser.email || parsedUser.email === '') {
                // cannot submit
                return;
            }
            const saveCue = JSON.stringify({
                solutions,
                initiatedAt
            });

            const server = fetchAPI('');
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
                                text: 'Okay',
                                onPress: () => window.location.reload()
                            }
                        ]);
                    }
                })
                .catch(err => {
                    Alert(somethingWentWrongAlert, tryAgainLaterAlert);
                });
        }
    }, [cue, props.cue, isQuiz, quizId, initiatedAt, solutions]);

    const submitResponse = useCallback(() => {
        let now = new Date();
        // one minute of extra time to submit
        now.setMinutes(now.getMinutes() - 1);

        Alert(
            now >= deadline ? 'Submit Late?' : 'Submit?',
            now >= deadline ? 'The deadline for this submission has already passed' : '',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    }
                },
                {
                    text: 'Okay',
                    onPress: async () => {
                        setIsSubmitting(true);
                        const u: any = await AsyncStorage.getItem('user');
                        if (u) {
                            const parsedUser = JSON.parse(u);
                            if (!parsedUser.email || parsedUser.email === '') {
                                // cannot submit
                                return;
                            }
                            let saveCue = '';
                            if (isQuiz) {
                                saveCue = JSON.stringify({
                                    solutions,
                                    initiatedAt
                                });
                            } else {
                                saveCue = submissionDraft;
                            }

                            const server = fetchAPI('');
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
                                .then((res: any) => {
                                    if (res.data.cue.submitModification) {
                                        setIsSubmitting(false);
                                        Alert(submissionCompleteAlert, new Date().toString(), [
                                            {
                                                text: 'Okay',
                                                onPress: () => window.location.reload()
                                            }
                                        ]);
                                    } else {
                                        Alert('Submission failed. Try again. ');
                                        setIsSubmitting(false);
                                    }
                                })
                                .catch((err: any) => {
                                    setIsSubmitting(false);
                                    Alert(somethingWentWrongAlert, tryAgainLaterAlert);
                                });
                        }
                    }
                }
            ]
        );
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

    /**
     * @description Handle Submit for Submissions and Quizzes
     */
    const handleSubmit = useCallback(async () => {
        if (!isQuiz && submissionImported && submissionTitle === '') {
            Alert('Your submission has no title');
            return;
        }

        // Here check if required questions have been answered

        let requiredMissing = false;

        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            const solution = solutions[i];

            if (
                (!problem.questionType || problem.questionType === '' || problem.questionType === 'trueFalse') &&
                problem.required
            ) {
                // Check completeness for MCQs

                const { selected } = solution;

                let selectionMade = false;

                selected.forEach((selection: any) => {
                    if (selection.isSelected) selectionMade = true;
                });

                if (!selectionMade) {
                    requiredMissing = true;
                }
            } else if (problem.questionType === 'freeResponse' && problem.required) {
                // Check completeness for free response

                const { response } = solution;

                if (response === '') {
                    requiredMissing = true;
                }
            } else {
                // Optional
            }
        }

        if (requiredMissing) {
            Alert('A required question is missing a response.', 'Would you still like to submit?', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    }
                },
                {
                    text: 'Yes',
                    onPress: () => {
                        submitResponse();
                    }
                }
            ]);
        } else {
            submitResponse();
        }
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

    /**
     * @description update Cue status as read
     */
    const updateStatusAsRead = useCallback(async () => {
        if (props.cue.status && props.cue.status !== 'read' && !markedAsRead) {
            const u = await AsyncStorage.getItem('user');
            if (u) {
                const user = JSON.parse(u);
                const server = fetchAPI('');
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
                    .catch(err => {});
            }
        }
    }, [props.cue, markedAsRead]);

    /**
     * @description Clear all cue content and imports
     */
    const clearAll = useCallback(() => {
        Alert(clearQuestionAlert, cannotUndoAlert, [
            {
                text: 'Cancel',
                style: 'cancel'
            },
            {
                text: 'Clear',
                onPress: () => {
                    if (props.showOriginal) {
                        setOriginal('');
                        setInitialOriginal('');
                        setImported(false);
                        setUrl('');
                        setType('');
                        setTitle('');
                    } else {
                        setSubmissionImported(false);
                        setSubmissionDraft('');
                        setInitialSubmissionDraft('');
                        setSubmissionUrl('');
                        setSubmissionType('');
                        setSubmissionTitle('');
                    }
                }
            }
        ]);
    }, [props.showOriginal]);

    /**
     * @description Share cue
     */
    const shareCue = useCallback(async () => {
        let saveCue = '';
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

        let tempOriginal = '';
        if (imported) {
            const obj = {
                type,
                url,
                title
            };
            tempOriginal = JSON.stringify(obj);
        } else {
            tempOriginal = original;
        }

        const server = fetchAPI('');
        server
            .mutate({
                mutation: createCue,
                variables: {
                    cue: props.cue.channelId ? tempOriginal : saveCue,
                    starred,
                    color: color.toString(),
                    channelId: shareWithChannelId,
                    frequency,
                    customCategory: customCategory === 'None' ? '' : customCategory,
                    shuffle,
                    createdBy: selectedChannelOwner ? selectedChannelOwner.id : props.cue.createdBy,
                    gradeWeight: gradeWeight.toString(),
                    submission,
                    deadline: submission ? deadline.toISOString() : '',
                    endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ''
                }
            })
            .then(res => {
                if (res.data.cue.create) {
                    Alert(sharedAlert, 'Cue has been successfully shared.');
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
        url,
        type,
        imported,
        title,
        original,
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

    /**
     * @description Share cue with subscribers dropdown change
     */
    const onChange = useCallback(
        (value, { action, option, removedValue }) => {
            switch (action) {
                case 'remove-value':
                case 'pop-value':
                    if (removedValue.isFixed) {
                        return;
                    }
                    break;
                case 'select-option':
                    const server = fetchAPI('');
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

                case 'clear':
                    value = subscribers.filter(v => v.isFixed);
                    break;
            }
            setSelected(value);
        },
        [subscribers, props.cue]
    );

    // FUNCTIONS

    /**
     * @description Helper method to calculate difference between two times
     */
    const diff_seconds = (dt2: any, dt1: any) => {
        var diff = (dt2.getTime() - dt1.getTime()) / 1000;
        return Math.abs(Math.round(diff));
    };

    /**
     * @description Update quiz
     */
    const updateQuiz = (
        instructions: string,
        problems: any,
        headers: any,
        modifiedCorrectAnswerProblems: boolean[],
        regradeChoices: string[],
        timer: boolean,
        duration: any,
        shuffleQuiz: boolean
    ) => {
        Alert('Update Quiz?', '', [
            {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                    return;
                }
            },
            {
                text: 'Okay',
                onPress: async () => {
                    setLoadingAfterModifyingQuiz(true);
                    const server = fetchAPI('');

                    // Update title as well
                    handleUpdateContent();

                    // VALIDATION:
                    // Check if any question without a correct answer

                    let error = false;
                    problems.map((problem: any) => {
                        if (problem.question === '' || problem.question === 'formula:') {
                            Alert(fillMissingProblemsAlert);
                            error = true;
                        }

                        if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                            Alert(enterNumericPointsAlert);
                            error = true;
                        }

                        let optionFound = false;

                        // If MCQ, check if any options repeat:
                        if (!problem.questionType || problem.questionType === 'trueFalse') {
                            const keys: any = {};

                            problem.options.map((option: any) => {
                                if (option.option === '' || option.option === 'formula:') {
                                    Alert(fillMissingOptionsAlert);
                                    error = true;
                                }

                                if (option.option in keys) {
                                    Alert('Option repeated in a question');
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
                        if (prob && regradeChoices[index] === '') {
                            Alert('Select regrade option for any questions with modified correct answers.');
                            error = true;
                        }
                    });

                    if (error) {
                        setLoadingAfterModifyingQuiz(false);
                        return;
                    }

                    // Points should be a string not a number

                    const sanitizeProblems = problems.map((prob: any) => {
                        const { options } = prob;
                        const sanitizeOptions = options.map((option: any) => {
                            const clone = option;

                            delete clone.__typename;

                            return clone;
                        });

                        delete prob.__typename;
                        delete prob.problemIndex;
                        return {
                            ...prob,
                            points: prob.points.toString(),
                            options: sanitizeOptions
                        };
                    });

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
                                modifiedCorrectAnswers: modifiedCorrectAnswerProblems.map((o: any) =>
                                    o ? 'yes' : 'no'
                                ),
                                regradeChoices: regradeChoices.map((choice: string) =>
                                    choice === '' ? 'none' : choice
                                )
                            }
                        })
                        .then((res: any) => {
                            if (res.data && res.data.quiz.modifyQuiz) {
                                const server = fetchAPI('');
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
                                            const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems);
                                            setUnmodifiedProblems(deepCopy);
                                            setInstructions(
                                                res.data.quiz.getQuiz.instructions
                                                    ? res.data.quiz.getQuiz.instructions
                                                    : ''
                                            );
                                            setHeaders(
                                                res.data.quiz.getQuiz.headers
                                                    ? JSON.parse(res.data.quiz.getQuiz.headers)
                                                    : {}
                                            );
                                            setLoadingAfterModifyingQuiz(false);
                                            setDuration(res.data.quiz.getQuiz.duration * 60);
                                            setShuffleQuiz(
                                                res.data.quiz.getQuiz.shuffleQuiz
                                                    ? res.data.quiz.getQuiz.shuffleQuiz
                                                    : false
                                            );
                                            alert('Quiz updated successfully');
                                            // Refresh all subscriber scores since there could be regrades
                                            props.reloadStatuses();
                                        }
                                    });
                            }
                        })
                        .catch(err => console.log(err));
                }
            }
        ]);
    };

    if (loading || loadingAfterModifyingQuiz || fetchingQuiz) {
        return null;
    }

    /**
     * @description QUIZ TIMER OR DOWNLOAD/REFRESH IF UPLOADED
     */
    const renderQuizTimerOrUploadOptions = () => {
        return props.showOriginal && (imported || isQuiz) ? (
            <View style={{ flexDirection: 'column', marginRight: 0, marginLeft: 0 }}>
                <View
                    style={{
                        flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                        alignItems: Dimensions.get('window').width < 768 ? 'flex-start' : 'center',
                        marginBottom: 25
                    }}
                >
                    {isOwner || !props.cue.channelId ? (
                        <TextareaAutosize
                            value={title}
                            style={{
                                fontFamily: 'overpass',
                                fontSize: 14,
                                padding: 15,
                                paddingTop: 12,
                                paddingBottom: 12,
                                marginTop: 10,
                                marginBottom: 0,
                                maxWidth: 300,
                                borderBottom: '1px solid #f2f2f2',
                                borderRadius: 1,
                                width: '100%'
                            }}
                            placeholder={'Title'}
                            onChange={(e: any) => setTitle(e.target.value)}
                            minRows={1}
                        />
                    ) : (
                        <Text
                            style={{
                                fontSize: 18,
                                paddingRight: 15,
                                paddingTop: 20,
                                marginBottom: 10,
                                maxWidth: Dimensions.get('window').width < 768 ? '100%' : 300,
                                fontWeight: '600',
                                width: '100%',
                                fontFamily: 'Inter'
                            }}
                        >
                            {title}
                        </Text>
                    )}
                    {isQuiz ? renderQuizDetails() : null}
                </View>

                {isQuiz ? (
                    isQuizTimed ? (
                        initiatedAt && initDuration !== 0 ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end'
                                }}
                            >
                                <CountdownCircleTimer
                                    size={120}
                                    key={initDuration}
                                    children={({ remainingTime }: any) => {
                                        if (!remainingTime || remainingTime === 0) {
                                            submitQuizEndTime();
                                        }

                                        if (remainingTime === 120) {
                                            Alert('Two minutes left. Quiz will auto-submit when timer ends.');
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
                            marginTop: 20
                        }}
                    >
                        {isOwner || !props.cue.channelId ? (
                            <TouchableOpacity
                                onPress={() => clearAll()}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: 15, // marginLeft: 15,
                                    marginTop: 5
                                }}
                            >
                                <Text
                                    style={{
                                        lineHeight: 34,
                                        textTransform: 'uppercase',
                                        fontSize: 12,
                                        fontFamily: 'overpass',
                                        color: '#006AFF'
                                    }}
                                >
                                    Erase
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
            </View>
        ) : null;
    };

    /**
     * @description Renders message when quiz is done
     */
    const renderQuizEndedMessage = () => {
        return (
            <View style={{ backgroundColor: 'white', flex: 1 }}>
                <Text
                    style={{
                        width: '100%',
                        color: '#1F1F1F',
                        fontSize: 20,
                        paddingTop: 200,
                        paddingBottom: 100,
                        paddingHorizontal: 5,
                        fontFamily: 'inter',
                        flex: 1,
                        textAlign: 'center'
                    }}
                >
                    Quiz submission ended. {remainingAttempts === 0 ? 'No attempts left. ' : ''}{' '}
                    {props.cue.releaseSubmission ? 'Quiz grades released by instructor. ' : ''}
                </Text>
            </View>
        );
    };

    /**
     * @description Render quiz submission history
     */
    const renderQuizSubmissionHistory = () => {
        const quizAttempted = quizAttempts.length > 0;

        const latestSubmission = quizAttempts[quizAttempts.length - 1];

        return (
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                    {quizAttempted ? (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                            <Ionicons name="checkmark-outline" size={22} color={'#53BE68'} />
                            <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                                Submitted at {moment(new Date(latestSubmission.submittedAt)).format('MMMM Do, h:mm a')}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                            <Ionicons name="alert-circle-outline" size={22} color={'#D91D56'} />
                            <Text style={{ fontSize: 14, paddingLeft: 5 }}>Not Attempted</Text>
                        </View>
                    )}
                </View>

                {props.cue.graded && props.cue.releaseSubmission ? (
                    <View>
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                paddingTop: 40,
                                paddingBottom: 15
                            }}
                        >
                            {PreferredLanguageText('score')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                borderRadius: 15
                            }}
                        >
                            {props.cue.score}%
                        </Text>
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * @description Render submission history
     */
    const renderSubmissionHistory = () => {
        return (
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    maxWidth: 900,
                    alignSelf: 'center'
                }}
            >
                {props.cue.submittedAt && props.cue.submittedAt !== '' && viewSubmission ? (
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 0,
                            paddingTop: 10
                        }}
                    >
                        <Ionicons name="checkmark-outline" size={22} color={'#53BE68'} />
                        <Text style={{ fontSize: 14, paddingLeft: 5 }}>
                            {moment(new Date(props.cue.submittedAt)).format('MMMM Do, h:mm a')}
                        </Text>
                    </View>
                ) : null}

                {/* View Submission button here */}
                {props.cue.graded && props.cue.releaseSubmission && viewSubmission ? (
                    <View style={{ paddingLeft: 20 }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                paddingTop: 20,
                                paddingBottom: 15
                            }}
                        >
                            {PreferredLanguageText('score')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                borderRadius: 15
                            }}
                        >
                            {props.cue.score}%
                        </Text>
                    </View>
                ) : null}

                {props.cue.submittedAt && props.cue.submittedAt !== '' && !props.cue.graded ? (
                    <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        {viewSubmission ? (
                            props.cue.releaseSubmission ||
                            (!allowLateSubmission && new Date() > deadline) ||
                            (allowLateSubmission && new Date() > availableUntil) ? null : (
                                <TouchableOpacity
                                    onPress={async () => {
                                        setViewSubmission(false);
                                    }}
                                    style={{
                                        backgroundColor: 'white',
                                        overflow: 'hidden',
                                        height: 35,
                                        // marginTop: 15,
                                        justifyContent: 'center',
                                        flexDirection: 'row'
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 34,
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
                                        }}
                                    >
                                        {'NEW SUBMISSION'}
                                    </Text>
                                </TouchableOpacity>
                            )
                        ) : (
                            <TouchableOpacity
                                onPress={async () => {
                                    setViewSubmission(true);
                                }}
                                style={{
                                    backgroundColor: 'white',
                                    overflow: 'hidden',
                                    height: 35,
                                    justifyContent: 'center',
                                    flexDirection: 'row'
                                }}
                            >
                                <Text>
                                    <Ionicons name="chevron-back-outline" size={30} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}
            </View>
        );
    };

    /**
     * @description Render Quiz details
     */
    const renderQuizDetails = () => {
        let hours = Math.floor(duration / 3600);

        let minutes = Math.floor((duration - hours * 3600) / 60);

        return (
            <View
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    marginTop: 20,
                    marginBottom: 10,
                    marginLeft: Dimensions.get('window').width < 768 ? 'none' : 'auto'
                }}
            >
                <Text
                    style={{
                        marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                        fontFamily: 'Inter',
                        fontSize: 14
                    }}
                >
                    {problems.length} {problems.length === 1 ? 'Question' : 'Questions'}
                </Text>

                <Text
                    style={{
                        marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                        fontFamily: 'Inter',
                        fontSize: 14
                    }}
                >
                    {totalQuizPoints} Points
                </Text>

                {duration === 0 ? (
                    <Text
                        style={{
                            marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                            fontFamily: 'Inter',
                            fontSize: 14
                        }}
                    >
                        No Time Limit
                    </Text>
                ) : (
                    <Text
                        style={{
                            marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                            fontFamily: 'Inter',
                            fontSize: 14
                        }}
                    >
                        {hours} H {minutes} min
                    </Text>
                )}

                {!isOwner ? (
                    <Text style={{ fontFamily: 'Inter', fontSize: 14 }}>
                        {allowedAttempts && allowedAttempts !== null
                            ? 'Attempts left: ' + (remainingAttempts >= 0 ? remainingAttempts : '0')
                            : 'Unlimited Attempts'}
                    </Text>
                ) : null}
            </View>
        );
    };

    /**
     * @description Renders main cue content
     */
    const renderMainCueContent = () => {
        return (
            <View
                style={{
                    width: '100%',
                    maxWidth: 900,
                    alignSelf: 'center',
                    minHeight: 475,
                    paddingTop: 25,
                    backgroundColor: 'white'
                }}
            >
                {!props.showOriginal || loading ? null : isQuiz ? (
                    isQuizTimed && !isOwner ? (
                        initiatedAt ? (
                            <View style={{ width: '100%', flexDirection: 'column' }}>
                                <Quiz
                                    // disable quiz if graded or deadline has passed
                                    isOwner={isOwner}
                                    submitted={
                                        isQuiz && props.cue.submittedAt && props.cue.submittedAt !== '' ? true : false
                                    }
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
                                    userId={userId}
                                />
                                {renderFooter()}
                            </View>
                        ) : (
                            <View>
                                <View>
                                    <TouchableOpacity
                                        onPress={() => initQuiz()}
                                        style={{
                                            backgroundColor: 'white',
                                            overflow: 'hidden',
                                            height: 35,
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            marginVertical: 50
                                        }}
                                    >
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                lineHeight: 34,
                                                color: '#006AFF',
                                                borderColor: '#006AFF',
                                                borderWidth: 1,
                                                fontSize: 12,
                                                backgroundColor: '#fff',
                                                paddingHorizontal: 20,
                                                fontFamily: 'inter',
                                                height: 35,
                                                width: 200,
                                                borderRadius: 15,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {PreferredLanguageText('startQuiz')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )
                    ) : (
                        <View style={{ width: '100%', flexDirection: 'column' }}>
                            <Quiz
                                isOwner={isOwner}
                                submitted={
                                    isQuiz && props.cue.submittedAt && props.cue.submittedAt !== '' ? true : false
                                }
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
                                userId={userId}
                            />
                            {renderFooter()}
                        </View>
                    )
                ) : imported ? (
                    type === 'mp4' ||
                    type === 'oga' ||
                    type === 'mov' ||
                    type === 'wmv' ||
                    type === 'mp3' ||
                    type === 'mov' ||
                    type === 'mpeg' ||
                    type === 'mp2' ||
                    type === 'wav' ? (
                        <View style={{ width: '100%' }}>
                            <ReactPlayer
                                url={url}
                                controls={true}
                                onContextMenu={(e: any) => e.preventDefault()}
                                config={{
                                    file: { attributes: { controlsList: 'nodownload' } }
                                }}
                                width={'100%'}
                                height={'100%'}
                            />
                        </View>
                    ) : (
                        <View key={url + props.showOriginal.toString()} style={{}}>
                            <div
                                className="webviewer"
                                ref={RichText}
                                style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                                key={props.showOriginal + url + imported.toString()}
                            ></div>
                        </View>
                    )
                ) : (
                    renderRichEditorOriginalCue()
                )}
                {!props.showOriginal && submissionImported && !viewSubmission ? (
                    submissionType === 'mp4' ||
                    submissionType === 'oga' ||
                    submissionType === 'mov' ||
                    submissionType === 'wmv' ||
                    submissionType === 'mp3' ||
                    submissionType === 'mov' ||
                    submissionType === 'mpeg' ||
                    submissionType === 'mp2' ||
                    submissionType === 'wav' ? (
                        <View style={{ width: '100%' }}>
                            <ReactPlayer url={submissionUrl} controls={true} width={'100%'} height={'100%'} />
                            {renderFooter()}
                        </View>
                    ) : (
                        <View
                            style={{}}
                            key={
                                JSON.stringify(submissionImported) +
                                JSON.stringify(viewSubmission) +
                                JSON.stringify(viewSubmissionTab)
                            }
                        >
                            <div
                                className="webviewer"
                                ref={RichText}
                                style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                            ></div>
                            {renderFooter()}
                        </View>
                    )
                ) : null}

                {props.showOriginal ? null : (
                    <View style={{ width: '100%', paddingBottom: 50, display: 'flex', flexDirection: 'column' }}>
                        {!viewSubmission ? (
                            submissionImported ? null : (
                                <View>
                                    {props.cue.releaseSubmission ||
                                    (!allowLateSubmission && new Date() > deadline) ||
                                    (allowLateSubmission && new Date() > availableUntil)
                                        ? null
                                        : renderRichEditorModified()}
                                    {renderFooter()}
                                </View>
                            )
                        ) : (
                            <View
                                key={
                                    JSON.stringify(submissionImported) +
                                    JSON.stringify(viewSubmission) +
                                    JSON.stringify(props.showOriginal)
                                }
                            >
                                {renderViewSubmission()}
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    /**
     * @description Render cue content
     */
    const renderRichEditorOriginalCue = () => {
        if (fetchingQuiz || isQuiz) return null;

        if (!isOwner && props.cue.channelId && props.cue.channelId !== '') {
            return (
                <RichEditor
                    initialContentHTML={initialOriginal}
                    disabled={true}
                    style={{
                        width: '100%',
                        height: '100%'
                    }}
                />
            );
        }

        return (
            <View style={{ width: '100%' }}>
                <View key={userId.toString() + isOwner.toString()}>
                    <FroalaEditor
                        ref={editorRef}
                        model={original}
                        onModelChange={(model: any) => setOriginal(model)}
                        config={{
                            key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                            attribution: false,
                            placeholderText: 'Enter Title',
                            charCounterCount: true,
                            zIndex: 2003,
                            // immediateReactModelUpdate: true,
                            heightMin: 500,
                            // FILE UPLOAD
                            // fileUploadURL: 'https://api.learnwithcues.com/upload',
                            fileMaxSize: 25 * 1024 * 1024,
                            fileAllowedTypes: ['*'],
                            fileUploadParams: { userId },
                            // IMAGE UPLOAD
                            imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                            imageUploadParam: 'file',
                            imageUploadParams: { userId },
                            imageUploadMethod: 'POST',
                            imageMaxSize: 5 * 1024 * 1024,
                            imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                            // VIDEO UPLOAD
                            videoMaxSize: 50 * 1024 * 1024,
                            videoAllowedTypes: ['webm', 'ogg', 'mp3', 'mp4', 'mov'],
                            paragraphFormatSelection: true,
                            // Default Font Size
                            spellcheck: true,
                            tabSpaces: 4,

                            // TOOLBAR
                            toolbarButtons: FULL_FLEDGED_TOOLBAR_BUTTONS,
                            toolbarSticky: true,
                            events: {
                                'froalaEditor.initialized': function(e: any, editor: any) {
                                    if (!isOwner && props.cue.channelId && props.cue.channelId !== '') {
                                        editor.edit.off();
                                    }
                                },
                                'file.beforeUpload': function(files: any) {
                                    // Return false if you want to stop the file upload.
                                    console.log('Before upload');
                                    console.log('File', files.item(0));

                                    fileUploadEditor(files, false);

                                    return false;
                                },
                                'video.beforeUpload': function(videos: any) {
                                    videoUploadEditor(videos, false);

                                    return false;
                                }
                            }
                        }}
                    />
                </View>
                {/* <Editor
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    initialValue={initialOriginal}
                    disabled={!isOwner && props.cue.channelId && props.cue.channelId !== ''}
                    apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                    init={{
                        skin: 'snow',
                        // toolbar_sticky: true,
                        branding: false,
                        readonly: !isOwner && props.cue.channelId && props.cue.channelId !== '',
                        placeholder: 'Content...',
                        min_height: 500,
                        paste_data_images: true,
                        images_upload_url: 'https://api.learnwithcues.com/api/imageUploadEditor',
                        mobile: {
                            plugins:
                                !isOwner && props.cue.channelId && props.cue.channelId !== ''
                                    ? 'print preview'
                                    : 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                        },
                        plugins:
                            !isOwner && props.cue.channelId && props.cue.channelId !== ''
                                ? 'print preview'
                                : 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                        menu: {
                            // this is the complete default configuration
                            file: { title: 'File', items: 'newdocument' },
                            edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
                            insert: { title: 'Insert', items: 'link media | template hr' },
                            view: { title: 'View', items: 'visualaid' },
                            format: {
                                title: 'Format',
                                items:
                                    'bold italic underline strikethrough superscript subscript | formats | removeformat'
                            },
                            table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
                            tools: { title: 'Tools', items: 'spellchecker code' }
                        },
                        setup: (editor: any) => {
                            const equationIcon =
                                '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>';
                            editor.ui.registry.addIcon('formula', equationIcon);

                            editor.ui.registry.addButton('formula', {
                                icon: 'formula',
                                tooltip: 'Insert equation',
                                onAction: () => {
                                    setShowEquationEditor(!showEquationEditor);
                                }
                            });

                            editor.ui.registry.addButton('upload', {
                                icon: 'upload',
                                tooltip: 'Import File (pdf, docx, media, etc.)',
                                onAction: async () => {
                                    const res = await handleFile(false);

                                    if (!res || res.url === '' || res.type === '') {
                                        return;
                                    }

                                    updateAfterFileImport(res.url, res.type);
                                }
                            });
                        },
                        // menubar: 'file edit view insert format tools table tc help',
                        menubar: false,
                        toolbar:
                            !isOwner && props.cue.channelId && props.cue.channelId !== ''
                                ? false
                                : 'undo redo | bold italic underline strikethrough | table image upload link media | forecolor backcolor |  numlist bullist checklist | fontselect fontSizeselect formatselect | formula superscript subscript charmap emoticons | alignleft aligncenter alignright alignjustify | casechange permanentpen formatpainter removeformat pagebreak | preview print | outdent indent ltr rtl ',
                        importcss_append: true,
                        image_caption: true,
                        quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
                        noneditable_noneditable_class: 'mceNonEditable',
                        toolbar_mode: 'sliding',
                        // tinycomments_mode: 'embedded',
                        // content_style: '.mymention{ color: gray; }',
                        // contextmenu: 'link image table configurepermanentpen',
                        // a11y_advanced_options: true,
                        extended_valid_elements:
                            'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
                        // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                        // content_css: useDarkMode ? 'dark' : 'default',
                    }}
                    onChange={(e: any) => setOriginal(e.target.getContent())}
                /> */}
                {/* {renderSaveCueButton()} */}
            </View>
        );
    };

    /**
     * @description Renders submission
     * Make sure that when the deadline has passed that the viewSubmission is set to true by default and that (Re-Submit button is not there)
     */
    const renderViewSubmission = () => {
        const attempt = submissionAttempts[submissionAttempts.length - 1];

        return (
            <View style={{ width: '100%', marginTop: 20 }}>
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
                        <View style={{ width: '100%', marginTop: 25 }}>
                            {attempt.title !== '' ? (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        paddingRight: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 20,
                                        marginBottom: 5,
                                        maxWidth: '100%',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}
                                >
                                    {attempt.title}
                                </Text>
                            ) : null}
                            <ReactPlayer url={attempt.url} controls={true} width={'100%'} height={'100%'} />
                        </View>
                    ) : (
                        <View
                            style={{ width: '100%', marginTop: 25 }}
                            key={
                                JSON.stringify(viewSubmission) +
                                JSON.stringify(attempt) +
                                JSON.stringify(props.showOriginal) +
                                JSON.stringify(submissionAttempts)
                            }
                        >
                            {attempt.title !== '' ? (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        paddingRight: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 20,
                                        marginBottom: 5,
                                        maxWidth: '100%',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}
                                >
                                    {attempt.title}
                                </Text>
                            ) : null}
                            <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                key={
                                    JSON.stringify(viewSubmission) +
                                    JSON.stringify(attempt) +
                                    JSON.stringify(props.showOriginal) +
                                    JSON.stringify(submissionAttempts)
                                }
                                style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                            ></div>
                        </View>
                    )
                ) : (
                    <View style={{ width: '100%', marginTop: 25 }} key={JSON.stringify(attempt)}>
                        {viewSubmissionTab === 'mySubmission' ? (
                            <div className="mce-content-body htmlParser" style={{ width: '100%', color: 'black' }}>
                                {parser(attempt.html)}
                            </div>
                        ) : (
                            <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                style={{ height: Dimensions.get('window').width < 768 ? '50vh' : '70vh' }}
                                key={viewSubmissionTab}
                            ></div>
                        )}
                    </View>
                )}
            </View>
        );
    };

    /**
     * @description Rich editor for Submissions
     */
    const renderRichEditorModified = () => {
        return (
            // <Editor
            //     onInit={(evt, editor) => (editorRef.current = editor)}
            //     initialValue={initialSubmissionDraft}
            //     disabled={
            //         props.cue.releaseSubmission ||
            //         (!allowLateSubmission && new Date() > deadline) ||
            //         (allowLateSubmission && new Date() > availableUntil)
            //     }
            //     apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
            //     init={{
            //         skin: 'snow',
            //         branding: false,
            //         placeholder: 'Content...',
            //         readonly:
            //             props.cue.releaseSubmission ||
            //             (!allowLateSubmission && new Date() > deadline) ||
            //             (allowLateSubmission && new Date() > availableUntil),
            //         min_height: 500,
            //         paste_data_images: true,
            //         images_upload_url: 'https://api.learnwithcues.com/api/imageUploadEditor',
            //         mobile: {
            //             plugins:
            //                 'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
            //         },
            //         plugins:
            //             'print preview powerpaste casechange importcss tinydrive searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
            //         menu: {
            //             // this is the complete default configuration
            //             file: { title: 'File', items: 'newdocument' },
            //             edit: { title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall' },
            //             insert: { title: 'Insert', items: 'link media | template hr' },
            //             view: { title: 'View', items: 'visualaid' },
            //             format: {
            //                 title: 'Format',
            //                 items: 'bold italic underline strikethrough superscript subscript | formats | removeformat'
            //             },
            //             table: { title: 'Table', items: 'inserttable tableprops deletetable | cell row column' },
            //             tools: { title: 'Tools', items: 'spellchecker code' }
            //         },
            //         setup: (editor: any) => {
            //             const equationIcon =
            //                 '<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z"/></svg>';
            //             editor.ui.registry.addIcon('formula', equationIcon);

            //             editor.ui.registry.addButton('formula', {
            //                 icon: 'formula',
            //                 // text: "Upload File",
            //                 tooltip: 'Insert equation',
            //                 onAction: () => {
            //                     setShowEquationEditor(!showEquationEditor);
            //                 }
            //             });

            //             editor.ui.registry.addButton('upload', {
            //                 icon: 'upload',
            //                 tooltip: 'Import File (pdf, docx, media, etc.)',
            //                 onAction: async () => {
            //                     const res = await handleFile(false);

            //                     if (!res || res.url === '' || res.type === '') {
            //                         return;
            //                     }

            //                     updateAfterFileImport(res.url, res.type);
            //                 }
            //             });
            //         },
            //         // menubar: 'file edit view insert format tools table tc help',
            //         menubar: false,
            //         toolbar:
            //             props.cue.releaseSubmission ||
            //             (!allowLateSubmission && new Date() > deadline) ||
            //             (allowLateSubmission && new Date() > availableUntil)
            //                 ? false
            //                 : 'undo redo | bold italic underline strikethrough | table image upload link media | forecolor backcolor |  numlist bullist checklist | fontselect fontSizeselect formatselect | formula superscript subscript charmap emoticons | alignleft aligncenter alignright alignjustify | casechange permanentpen formatpainter removeformat pagebreak | preview print | outdent indent ltr rtl ',
            //         importcss_append: true,
            //         image_caption: true,
            //         quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
            //         noneditable_noneditable_class: 'mceNonEditable',
            //         toolbar_mode: 'sliding',
            //         tinycomments_mode: 'embedded',
            //         content_style: '.mymention{ color: gray; }',
            //         // contextmenu: 'link image imagetools table configurepermanentpen',
            //         a11y_advanced_options: true,
            //         extended_valid_elements:
            //             'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
            //         // skin: useDarkMode ? 'oxide-dark' : 'oxide',
            //         // content_css: useDarkMode ? 'dark' : 'default',
            //     }}
            //     onChange={(e: any) => setSubmissionDraft(e.target.getContent())}
            // />
            <View key={userId.toString() + isOwner.toString()}>
                <FroalaEditor
                    ref={editorRef}
                    model={submissionDraft}
                    onModelChange={(model: any) => setSubmissionDraft(model)}
                    config={{
                        key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                        attribution: false,
                        placeholderText: 'Submission',
                        charCounterCount: true,
                        zIndex: 2003,
                        // immediateReactModelUpdate: true,
                        heightMin: 500,
                        // FILE UPLOAD
                        // fileUploadURL: 'https://api.learnwithcues.com/upload',
                        fileMaxSize: 25 * 1024 * 1024,
                        fileAllowedTypes: ['*'],
                        fileUploadParams: { userId },
                        // IMAGE UPLOAD
                        imageUploadURL: 'https://api.learnwithcues.com/api/imageUploadEditor',
                        imageUploadParam: 'file',
                        imageUploadParams: { userId },
                        imageUploadMethod: 'POST',
                        imageMaxSize: 5 * 1024 * 1024,
                        imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                        // VIDEO UPLOAD
                        videoMaxSize: 50 * 1024 * 1024,
                        videoAllowedTypes: ['webm', 'ogg', 'mp3', 'mp4', 'mov'],
                        paragraphFormatSelection: true,
                        // Default Font Size
                        spellcheck: true,
                        tabSpaces: 4,

                        // TOOLBAR
                        toolbarButtons: FULL_FLEDGED_TOOLBAR_BUTTONS,
                        toolbarSticky: true,
                        events: {
                            'froalaEditor.initialized': function(e: any, editor: any) {
                                if (!isOwner && props.cue.channelId && props.cue.channelId !== '') {
                                    editor.edit.off();
                                }
                            },
                            'file.beforeUpload': function(files: any) {
                                // Return false if you want to stop the file upload.
                                console.log('Before upload');
                                console.log('File', files.item(0));

                                fileUploadEditor(files, true);

                                return false;
                            },
                            'video.beforeUpload': function(videos: any) {
                                videoUploadEditor(videos, true);

                                return false;
                            }
                        }
                    }}
                />
            </View>
        );
    };

    /**
     * @description Share with component
     */
    const renderShareWithOptions = () => {
        return props.cue.channelId !== '' && isOwner ? (
            <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        paddingBottom: 15,
                        backgroundColor: 'white',
                        flex: 1,
                        flexDirection: 'row'
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                            // textTransform: 'uppercase'
                        }}
                    >
                        {props.cue.channelId && props.cue.channelId !== '' ? 'Restrict Access' : 'Saved In'}
                    </Text>
                </View>
                <View>
                    {props.cue.channelId !== '' ? (
                        <View>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        height: 40,
                                        marginRight: 10
                                    }}
                                >
                                    <Switch
                                        value={limitedShares}
                                        onValueChange={() => {
                                            setLimitedShares(!limitedShares);
                                        }}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#F8F9FA',
                                            true: '#006AFF'
                                        }}
                                        activeThumbColor="white"
                                    />
                                </View>
                            </View>
                        </View>
                    ) : null}
                    {limitedShares && selected.length !== 0 && subscribers.length !== 0 ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                overflow: 'scroll',
                                maxWidth: 400,
                                height: 120
                            }}
                        >
                            <View
                                key={JSON.stringify(selected)}
                                style={{
                                    width: '90%',
                                    padding: 5,
                                    height: 'auto',
                                    minWidth: 300
                                }}
                            >
                                {/* <Select
                                    value={selected}
                                    isMulti
                                    styles={reactSelectStyles}
                                    isClearable={selected.some((v: any) => !v.isFixed)}
                                    name="Share With"
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    onChange={onChange}
                                    options={subscribers}
                                /> */}
                                <MobiscrollSelect
                                    inputProps={{
                                        className: 'noClearButtons'
                                    }}
                                    value={selected}
                                    rows={subscribers.length}
                                    data={subscribers}
                                    selectMultiple={true}
                                    theme="ios"
                                    themeVariant="light"
                                    touchUi={true}
                                    responsive={{
                                        small: {
                                            display: 'bubble'
                                        },
                                        medium: {
                                            touchUi: false
                                        }
                                    }}
                                    onChange={(val: any) => {
                                        // if (!initializedCustomCategories) return;
                                        // setCustomCategory(val.value);
                                        if (val.value.length < selected.length) {
                                            console.log("Remove")
                                            return;
                                        } else if (val.value.length > selected.length) {
                                            // New Sub added
                                            
                                            const addedUser = val.value.filter((sub: string) => !selected.includes(sub))[0];
                                            
                                            const server = fetchAPI('');
                                            server
                                                .mutate({
                                                    mutation: shareCueWithMoreIds,
                                                    variables: {
                                                        cueId: props.cue._id,
                                                        userId: addedUser
                                                    }
                                                })
                                                .then(res => {
                                                    if (res.data && res.data.cue.shareCueWithMoreIds) {
                                                        loadChannelsAndSharedWith();
                                                    }
                                                })
                                                .catch(err => console.log(err));

                                            setSelected(val.value)

                                        }
                                    }}
                                />
                            </View>
                        </View>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Submission required component
     */
    const renderSubmissionRequiredOptions = () => {
        return props.cue.channelId !== '' ? (
            <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        paddingBottom: 15,
                        backgroundColor: 'white'
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                        }}
                    >
                        {PreferredLanguageText('submissionRequired')}
                    </Text>
                </View>
                <View>
                    <View style={{ flexDirection: 'row', justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                        {isOwner ? (
                            isQuiz ? null : (
                                <View
                                    style={{
                                        backgroundColor: 'white',
                                        height: 40,
                                        marginRight: 10
                                    }}
                                >
                                    <Switch
                                        disabled={isQuiz}
                                        value={submission}
                                        onValueChange={() => {
                                            setSubmission(!submission);
                                        }}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#f2f2f2',
                                            true: '#006AFF'
                                        }}
                                        activeThumbColor="white"
                                    />
                                </View>
                            )
                        ) : (
                            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#000000',
                                        textTransform: 'uppercase',
                                        fontFamily: 'Inter'
                                    }}
                                >
                                    {!submission ? PreferredLanguageText('no') : null}
                                </Text>
                            </View>
                        )}
                    </View>
                    {submission ? (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#1F1F1F',
                                    textAlign: 'right',
                                    paddingRight: 10,
                                    fontFamily: 'Inter'
                                }}
                            >
                                Released
                            </Text>
                            {isOwner ? (
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
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false
                                        }
                                    }}
                                />
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#1F1F1F',
                                        textAlign: 'left',
                                        fontFamily: 'Inter'
                                    }}
                                >
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
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#1F1F1F',
                                    textAlign: 'right',
                                    paddingRight: 10,
                                    fontFamily: 'Inter'
                                }}
                            >
                                Due
                            </Text>
                            {isOwner ? (
                                <MobiscrollDatePicker
                                    controls={['date', 'time']}
                                    touchUi={true}
                                    theme="ios"
                                    value={deadline}
                                    themeVariant="light"
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
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false
                                        }
                                    }}
                                />
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: '#1F1F1F',
                                        textAlign: 'left',
                                        fontFamily: 'Inter'
                                    }}
                                >
                                    {moment(new Date(deadline)).format('MMMM Do, h:mm a')}
                                </Text>
                            )}
                        </View>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Grade weight component
     */
    const renderGradeOptions = () => {
        return submission ? (
            <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        paddingBottom: 15,
                        backgroundColor: 'white'
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                        }}
                    >
                        Grade Weight
                    </Text>
                </View>
                <View style={{}}>
                    {isOwner ? (
                        <View style={{ flexDirection: 'row', justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    marginRight: 10
                                }}
                            >
                                <Switch
                                    disabled={!isOwner}
                                    value={graded}
                                    onValueChange={() => setGraded(!graded)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#f2f2f2',
                                        true: '#006AFF'
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                        </View>
                    ) : null}
                    {graded ? (
                        <View
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                backgroundColor: 'white',
                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                alignItems: 'center'
                            }}
                        >
                            {isOwner ? (
                                <TextInput
                                    value={gradeWeight}
                                    style={{
                                        width: '25%',
                                        borderBottomColor: '#f2f2f2',
                                        borderBottomWidth: 1,
                                        fontSize: 14,
                                        padding: 15,
                                        paddingVertical: 12,
                                        marginTop: 0
                                    }}
                                    placeholder={'0-100'}
                                    onChangeText={val => setGradeWeight(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                />
                            ) : null}
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#1F1F1F',
                                    textAlign: 'left',
                                    paddingRight: 10,
                                    fontFamily: 'Inter'
                                }}
                            >
                                {!isOwner ? gradeWeight : null} {PreferredLanguageText('percentageOverall')}
                            </Text>
                        </View>
                    ) : !isOwner ? (
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#1F1F1F',
                                textAlign: 'left',
                                paddingRight: 10,
                                fontFamily: 'Inter'
                            }}
                        >
                            0%
                        </Text>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Late submission option
     */
    const renderLateSubmissionOptions = () => {
        return submission ? (
            <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        paddingBottom: 15,
                        backgroundColor: 'white'
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                        }}
                    >
                        Late Submission
                    </Text>
                </View>
                <View style={{}}>
                    {isOwner ? (
                        <View style={{ flexDirection: 'row', justifyContent: width < 768 ? 'flex-start' : 'flex-end' }}>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    marginRight: 10
                                }}
                            >
                                <Switch
                                    disabled={!isOwner}
                                    value={allowLateSubmission}
                                    onValueChange={() => setAllowLateSubmission(!allowLateSubmission)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#f2f2f2',
                                        true: '#006AFF'
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                        </View>
                    ) : null}
                    {allowLateSubmission ? (
                        <View
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                backgroundColor: 'white',
                                alignItems: 'center'
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#1F1F1F',
                                    textAlign: 'left',
                                    paddingRight: 10,
                                    fontFamily: 'Inter'
                                }}
                            >
                                {!isOwner
                                    ? allowLateSubmission
                                        ? 'Allowed until  ' + moment(new Date(availableUntil)).format('MMMM Do, h:mm a')
                                        : 'No'
                                    : 'Allowed Until'}
                            </Text>
                            {isOwner ? (
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
                                        }
                                    }}
                                />
                            ) : null}
                        </View>
                    ) : !isOwner ? (
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#1F1F1F',
                                textAlign: 'left',
                                paddingRight: 10,
                                fontFamily: 'Inter'
                            }}
                        >
                            No
                        </Text>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Number of attempts component
     */
    const renderAttemptsOptions = () => {
        return isQuiz ? (
            !isOwner ? (
                <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            paddingBottom: 15,
                            backgroundColor: 'white'
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
                            display: 'flex',
                            flexDirection: 'row',
                            backgroundColor: 'white',
                            justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end'
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#1F1F1F',
                                textAlign: 'right',
                                paddingRight: 10,
                                fontFamily: 'Inter'
                            }}
                        >
                            {unlimitedAttempts ? 'Unlimited' : allowedAttempts}
                        </Text>
                    </View>
                </View>
            ) : (
                <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            paddingBottom: 15,
                            backgroundColor: 'white'
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            Unlimited Attempts
                        </Text>
                    </View>
                    <View>
                        <View
                            style={{
                                backgroundColor: 'white',
                                height: 40,
                                marginRight: 10,
                                flexDirection: 'row',
                                justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                            }}
                        >
                            <Switch
                                value={unlimitedAttempts}
                                onValueChange={() => {
                                    if (!unlimitedAttempts) {
                                        setAllowedAttemps('');
                                    } else {
                                        setAllowedAttemps('1');
                                    }
                                    setUnlimitedAttempts(!unlimitedAttempts);
                                }}
                                style={{ height: 20 }}
                                trackColor={{
                                    false: '#f2f2f2',
                                    true: '#006AFF'
                                }}
                                activeThumbColor="white"
                            />
                        </View>

                        {!unlimitedAttempts ? (
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
                                    backgroundColor: 'white',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={styles.text}>Allowed attempts</Text>
                                <TextInput
                                    value={allowedAttempts}
                                    style={{
                                        width: '25%',
                                        borderBottomColor: '#F8F9FA',
                                        borderBottomWidth: 1,
                                        fontSize: 14,
                                        marginLeft: 10,
                                        padding: 15,
                                        paddingVertical: 12,
                                        marginTop: 0
                                    }}
                                    placeholder={''}
                                    onChangeText={val => {
                                        if (Number.isNaN(Number(val))) return;
                                        setAllowedAttemps(val);
                                    }}
                                    placeholderTextColor={'#1F1F1F'}
                                />
                            </View>
                        ) : null}
                    </View>
                </View>
            )
        ) : null;
    };

    /**
     * @description Category component
     */
    const renderCategoryOptions = () => {
        if (!initializedCustomCategories) return;

        return (props.cue.channelId && props.cue.channelId !== '' && isOwner) ||
            !props.channelId ||
            props.channelId === '' ? (
            <View
                style={{
                    width: '100%',
                    borderRightWidth: 0,
                    flexDirection: width < 768 ? 'column' : 'row',
                    alignItems: width < 768 ? 'flex-start' : 'center',
                    paddingTop: 40,
                    paddingBottom: 15,
                    borderColor: '#f2f2f2'
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        backgroundColor: 'white',
                        paddingBottom: width < 768 ? 15 : 0
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                        }}
                    >
                        {PreferredLanguageText('category')}
                    </Text>
                </View>
                <View style={{}}>
                    {props.cue.channelId && !props.channelOwner ? (
                        <View
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                backgroundColor: 'white'
                            }}
                        >
                            <View style={{ width: '85%', backgroundColor: 'white' }}>
                                <View style={styles.colorBar}>
                                    <TouchableOpacity style={styles.allGrayOutline} onPress={() => {}}>
                                        <Text
                                            style={{
                                                color: '#000000',
                                                lineHeight: 20,
                                                fontSize: 12
                                            }}
                                        >
                                            {props.cue.customCategory === ''
                                                ? PreferredLanguageText('none')
                                                : props.cue.customCategory}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'white'
                            }}
                        >
                            <View style={{ backgroundColor: 'white' }}>
                                {addCustomCategory ? (
                                    <View style={styles.colorBar}>
                                        <TextInput
                                            value={customCategory}
                                            style={{
                                                borderRadius: 0,
                                                borderColor: '#f2f2f2',
                                                borderBottomWidth: 1,
                                                fontSize: 14,
                                                height: '2.75em',
                                                padding: '1em'
                                            }}
                                            placeholder={'Enter Category'}
                                            onChangeText={val => {
                                                setCustomCategory(val);
                                            }}
                                            placeholderTextColor={'#1F1F1F'}
                                        />
                                    </View>
                                ) : (
                                    // <Menu
                                    //     onSelect={(cat: any) => setCustomCategory(cat)}>
                                    //     <MenuTrigger>
                                    //         <Text style={{
                                    //             fontSize: 12,
                                    //             color: "#1F1F1F",
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
                                    //             borderColor: '#f2f2f2',
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
                                                    touchUi: false
                                                }
                                            }}
                                            onChange={(val: any) => {
                                                if (!initializedCustomCategories) return;
                                                setCustomCategory(val.value);
                                            }}
                                        />
                                    </label>
                                )}
                            </View>
                            <View style={{ backgroundColor: 'white', paddingLeft: 20 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (addCustomCategory) {
                                            setCustomCategory('None');
                                            setAddCustomCategory(false);
                                        } else {
                                            setCustomCategory('');
                                            setAddCustomCategory(true);
                                        }
                                    }}
                                    style={{ backgroundColor: 'white' }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'right',
                                            lineHeight: 20,
                                            width: '100%'
                                        }}
                                    >
                                        <Ionicons
                                            name={addCustomCategory ? 'close' : 'create-outline'}
                                            size={18}
                                            color={'#000000'}
                                        />
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        ) : null;
    };

    /**
     * @description Priority component
     */
    const renderPriorityOptions = () => {
        return (
            <View
                style={{
                    width: '100%',
                    borderRightWidth: 0,
                    flexDirection: width < 768 ? 'column' : 'row',
                    alignItems: width < 768 ? 'flex-start' : 'center',
                    paddingTop: 40,
                    borderColor: '#f2f2f2'
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        backgroundColor: 'white',
                        paddingBottom: width < 768 ? 15 : 0
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                        }}
                    >
                        {PreferredLanguageText('priority')}
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: 'white'
                    }}
                >
                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                        <ScrollView
                            style={{ ...styles.colorBar, height: 20 }}
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                        >
                            {colorChoices.map((c: string, i: number) => {
                                return (
                                    <View
                                        style={color == i ? styles.colorContainerOutline : styles.colorContainer}
                                        key={Math.random()}
                                    >
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

    /**
     * @description Share component
     */
    const renderForwardOptions = () => {
        const filterChannelsWithoutCurrent = channels.filter((channel: any) => channel._id !== props.channelId);

        const channelOptions = [{ _id: 'None', name: 'None' }, ...filterChannelsWithoutCurrent];

        return channels.length === 0 || !isOwner ? null : (
            <View
                style={{
                    width: '100%',
                    flexDirection: width < 768 ? 'column' : 'row',
                    alignItems: width < 768 ? 'flex-start' : 'center',
                    borderRightWidth: 0,
                    borderColor: '#f2f2f2',
                    paddingTop: 40
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,
                        backgroundColor: 'white',
                        paddingBottom: width < 768 ? 15 : 0
                    }}
                >
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#000000',
                            fontFamily: 'Inter'
                        }}
                    >
                        Forward
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: 'white',
                        alignItems: 'center'
                    }}
                >
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
                                    touchUi: false
                                }
                            }}
                            data={channelOptions.map((channel: any) => {
                                return {
                                    value: channel._id,
                                    text: channel.name
                                };
                            })}
                        />
                    </label>

                    <View style={{ backgroundColor: 'white', paddingLeft: 20 }}>
                        <TouchableOpacity
                            disabled={shareWithChannelId === 'None'}
                            onPress={() => {
                                Alert('Forward cue?', '', [
                                    {
                                        text: 'Cancel',
                                        style: 'cancel',
                                        onPress: () => {
                                            return;
                                        }
                                    },
                                    {
                                        text: 'Yes',
                                        onPress: () => {
                                            shareCue();
                                        }
                                    }
                                ]);
                            }}
                            style={{ backgroundColor: 'white' }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 20,
                                    width: '100%'
                                }}
                            >
                                <Ionicons
                                    name={'share-outline'}
                                    size={18}
                                    color={shareWithChannelId === 'None' ? '#000000' : '#006aff'}
                                />
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    /**
     * @description Reminder component
     */
    const renderReminderOptions = () => {
        return (
            <View
                style={{
                    width: '100%',
                    paddingTop: 15,
                    flexDirection: 'column'
                }}
            >
                <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            paddingBottom: 15,
                            backgroundColor: 'white'
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 14,
                                color: '#000000',
                                fontFamily: 'Inter'
                            }}
                        >
                            Remind
                        </Text>
                    </View>
                    <View
                        style={{
                            backgroundColor: 'white',
                            // width: "100%",
                            height: 40
                        }}
                    >
                        <Switch
                            value={notify}
                            onValueChange={() => {
                                if (notify) {
                                    setFrequency('0');
                                } else {
                                    setFrequency('1-D');
                                }
                                setPlayChannelCueIndef(true);
                                setNotify(!notify);
                            }}
                            style={{ height: 20 }}
                            trackColor={{
                                false: '#f2f2f2',
                                true: '#006AFF'
                            }}
                            activeThumbColor="white"
                        />
                    </View>
                </View>
                {notify ? (
                    <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                        <View
                            style={{
                                // width: 300,
                                flex: 1,
                                flexDirection: 'row',
                                paddingBottom: 15,
                                backgroundColor: 'white'
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#000000',
                                    fontFamily: 'Inter'
                                }}
                            >
                                Repeat Reminder
                            </Text>
                        </View>
                        <View style={{}}>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    alignSelf: width < 768 ? 'flex-start' : 'flex-end'
                                }}
                            >
                                <Switch
                                    value={!shuffle}
                                    onValueChange={() => setShuffle(!shuffle)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#f2f2f2',
                                        true: '#006AFF'
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                            {!shuffle ? (
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: '#1F1F1F',
                                            textAlign: 'right',
                                            paddingRight: 10,
                                            fontFamily: 'Inter'
                                        }}
                                    >
                                        {PreferredLanguageText('remindEvery')}
                                    </Text>
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
                                                    touchUi: false
                                                }
                                            }}
                                            data={timedFrequencyOptions.map((freq: any) => {
                                                return {
                                                    value: freq.value,
                                                    text: freq.label
                                                };
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
                                                color: "#1F1F1F",
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
                                                borderColor: '#f2f2f2',
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
                                        width: '100%',
                                        flex: 1,
                                        flexDirection: 'row',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <View
                                            style={{
                                                height: 5
                                            }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: '#1F1F1F',
                                                textAlign: 'right',
                                                paddingRight: 10,
                                                marginTop: 5,
                                                fontFamily: 'Inter'
                                            }}
                                        >
                                            {PreferredLanguageText('remindOn')}
                                        </Text>
                                    </View>
                                    <View>
                                        <MobiscrollDatePicker
                                            controls={['date', 'time']}
                                            touchUi={true}
                                            theme="ios"
                                            value={endPlayAt}
                                            themeVariant="light"
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
                                                medium: {
                                                    controls: ['date', 'time'],
                                                    display: 'anchored',
                                                    touchUi: false
                                                }
                                            }}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                ) : null}
                {notify && !shuffle ? (
                    <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                flex: 1,
                                paddingBottom: 15,
                                backgroundColor: 'white'
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: '#000000',
                                    fontFamily: 'Inter'
                                }}
                            >
                                Remind Indefinitely
                            </Text>
                        </View>
                        <View>
                            <View
                                style={{
                                    backgroundColor: 'white',
                                    height: 40,
                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                    flexDirection: 'row'
                                }}
                            >
                                <Switch
                                    value={playChannelCueIndef}
                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#f2f2f2',
                                        true: '#006AFF'
                                    }}
                                    activeThumbColor="white"
                                />
                            </View>
                            {playChannelCueIndef ? null : (
                                <View
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    <Text style={styles.text}>{PreferredLanguageText('remindTill')}</Text>
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
                                            medium: {
                                                controls: ['date', 'time'],
                                                display: 'anchored',
                                                touchUi: false
                                            }
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

    /**
     * @description Buttons for Submission
     */
    const renderFooter = () => {
        return (
            <View
                key={
                    JSON.stringify(isQuiz) +
                    JSON.stringify(isQuizTimed) +
                    JSON.stringify(loading) +
                    JSON.stringify(submission) +
                    JSON.stringify(props.cue.channelId) +
                    JSON.stringify(initiatedAt)
                }
                style={styles.footer}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        // height: 50,
                        paddingTop: 10,
                        backfaceVisibility: 'hidden'
                    }}
                >
                    {!isOwner && props.cue.channelId && props.cue.channelId !== '' && submission ? (
                        <TouchableOpacity
                            disabled={
                                // Late submission not allowed then no submission after deadline has passed
                                (!allowLateSubmission && new Date() > deadline) ||
                                // If late submission allowed, then available until should be the new deadline
                                (allowLateSubmission && new Date() > availableUntil) ||
                                // Once release Submission that means assignment should be locked
                                props.cue.releaseSubmission ||
                                // if timed quiz not initiated
                                (isQuiz && isQuizTimed && !initiatedAt) ||
                                // If no more remaining attempts for quiz
                                (isQuiz && remainingAttempts === 0) ||
                                isSubmitting
                            }
                            onPress={() => handleSubmit()}
                            style={{ borderRadius: 15, backfaceVisibility: 'hidden' }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 34,
                                    color: 'white',
                                    fontSize: 12,
                                    backgroundColor: '#006AFF',
                                    borderRadius: 15,
                                    paddingHorizontal: 20,
                                    fontFamily: 'inter',
                                    overflow: 'hidden',
                                    height: 35,
                                    textTransform: 'uppercase',
                                    backfaceVisibility: 'hidden'
                                }}
                            >
                                {(!allowLateSubmission && new Date() > deadline) ||
                                (allowLateSubmission && new Date() > availableUntil) ||
                                (isQuiz && remainingAttempts === 0) ||
                                (props.cue.releaseSubmission && !props.cue.graded)
                                    ? 'Submission Ended'
                                    : props.cue.graded && !isQuiz
                                    ? PreferredLanguageText('graded')
                                    : isSubmitting
                                    ? 'Submitting...'
                                    : PreferredLanguageText('submit')}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        );
    };

    if (initiateAt > new Date() && !isOwner) {
        return (
            <View style={{ minHeight: Dimensions.get('window').height }}>
                <View style={{ backgroundColor: 'white', flex: 1 }}>
                    <Text
                        style={{
                            width: '100%',
                            color: '#1F1F1F',
                            fontSize: 20,
                            paddingTop: 200,
                            paddingBottom: 100,
                            paddingHorizontal: 5,
                            fontFamily: 'inter',
                            flex: 1,
                            textAlign: 'center'
                        }}
                    >
                        Available from {moment(initiateAt).format('MMMM Do YYYY, h:mm a')}
                    </Text>
                </View>
            </View>
        );
    }

    // MAIN RETURN
    return (
        <View
            style={{
                width: '100%',
                backgroundColor: 'white',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                paddingBottom: 50
            }}
        >
            {props.cue.channelId && props.cue.channelId !== '' ? (
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                        maxWidth: 900,
                        alignSelf: 'center'
                    }}
                >
                    {!isOwner &&
                    props.cue.graded &&
                    props.cue.score !== undefined &&
                    props.cue.score !== null &&
                    !isQuiz &&
                    props.cue.releaseSubmission &&
                    (props.showOriginal || props.showOptions) ? (
                        <Text
                            style={{
                                fontSize: 12,
                                color: 'white',
                                height: 22,
                                paddingHorizontal: 10,
                                borderRadius: 15,
                                backgroundColor: '#006AFF',
                                lineHeight: 20,
                                paddingTop: 1,
                                marginBottom: 5,
                                marginTop: 20
                            }}
                        >
                            {props.cue.score}%
                        </Text>
                    ) : null}
                    {!isOwner &&
                    props.cue.submittedAt !== '' &&
                    new Date(props.cue.submittedAt) >= deadline &&
                    props.showOriginal ? (
                        <View style={{ marginTop: 20, marginBottom: 5 }}>
                            <Text
                                style={{
                                    color: '#f94144',
                                    fontSize: 18,
                                    fontFamily: 'Inter',
                                    textAlign: 'center'
                                }}
                            >
                                LATE
                            </Text>
                        </View>
                    ) : null}
                    {/* <TouchableOpacity
                            onPress={() => setStarred(!starred)}
                            style={{
                                backgroundColor: "white",
                                flex: 1
                            }}>
                            <Text
                                style={{
                                    textAlign: "right",
                                    lineHeight: 34,
                                    marginTop: -31,
                                    // paddingRight: 25,
                                    width: "100%"
                                }}>
                                <Ionicons name="bookmark" size={40} color={starred ? "#f94144" : "#1F1F1F"} />
                            </Text>
                        </TouchableOpacity> */}
                </View>
            ) : null}
            {props.showOptions ||
            props.showComments ||
            isOwner ||
            props.showOriginal ||
            props.viewStatus ||
            !submission ||
            isQuiz
                ? null
                : renderSubmissionHistory()}
            {/* {props.showOptions || props.showComments || viewSubmission ? null : (
                <View
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: Dimensions.get('window').width < 768 ? 'column-reverse' : 'row',
                        marginBottom: 5,
                        backgroundColor: 'white',
                        borderBottomColor: '#f2f2f2'
                    }}
                    onTouchStart={() => Keyboard.dismiss()}
                >
                    <View
                        style={{
                            flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                            flex: 1
                        }}
                    >
                        {(!props.showOriginal && props.cue.submission && !submissionImported && showImportOptions) ||
                        (props.showOriginal && showImportOptions && (isOwner || !props.cue.channelId)) ? (
                            <FileUpload
                                back={() => setShowImportOptions(false)}
                                onUpload={(u: any, t: any) => {
                                    if (props.showOriginal) {
                                        setOriginal(
                                            JSON.stringify({
                                                url: u,
                                                type: t,
                                                title
                                            })
                                        );
                                    } else {
                                        setSubmissionDraft(
                                            JSON.stringify({
                                                url: u,
                                                type: t,
                                                title: submissionTitle,
                                                annotations: ''
                                            })
                                        );
                                        setSubmissionImported(true);
                                        setSubmissionType(t);
                                        setSubmissionUrl(u);
                                    }
                                    setShowImportOptions(false);
                                }}
                            />
                        ) : null}
                    </View>
                </View>
            )} */}
            {showEquationEditor ? (
                <FormulaGuide
                    value={equation}
                    onChange={setEquation}
                    show={showEquationEditor}
                    onClose={() => setShowEquationEditor(false)}
                    onInsertEquation={insertEquation}
                />
            ) : null}
            <ScrollView
                style={{
                    paddingBottom: 25,
                    height:
                        Dimensions.get('window').width < 1024
                            ? Dimensions.get('window').height - 104
                            : Dimensions.get('window').height - 52
                }}
                contentContainerStyle={{
                    maxWidth: 900,
                    width: '100%',
                    alignSelf: 'center'
                }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                scrollEventThrottle={1}
                keyboardDismissMode={'on-drag'}
                overScrollMode={'always'}
                nestedScrollEnabled={true}
            >
                {props.showOptions || props.showComments ? null : (
                    <View>
                        <View style={{ flexDirection: 'column', width: '100%' }}>
                            {renderQuizTimerOrUploadOptions()}
                        </View>
                        {!props.showOriginal && submissionImported && !isQuiz && !viewSubmission ? (
                            <View style={{ flexDirection: 'row' }}>
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignSelf: 'flex-start',
                                        marginLeft: 0,
                                        marginTop: 5
                                    }}
                                >
                                    <TextInput
                                        value={submissionTitle}
                                        style={styles.input}
                                        placeholder={'Title'}
                                        onChangeText={val => setSubmissionTitle(val)}
                                        placeholderTextColor={'#1F1F1F'}
                                    />
                                </View>
                                {props.cue.submittedAt && props.cue.submittedAt !== '' ? (
                                    <View
                                        style={{
                                            marginLeft: 15,
                                            marginTop: 20,
                                            alignSelf: 'flex-end'
                                        }}
                                    >
                                        {props.cue.graded || currentDate > deadline ? null : (
                                            <TouchableOpacity
                                                onPress={() => clearAll()}
                                                style={{
                                                    backgroundColor: 'white',
                                                    borderRadius: 15,
                                                    marginTop: 5
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        lineHeight: 34,
                                                        textTransform: 'uppercase',
                                                        fontSize: 12,
                                                        fontFamily: 'overpass',
                                                        color: '#006AFF'
                                                    }}
                                                >
                                                    Erase
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => clearAll()}
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: 15,
                                            marginLeft: 15,
                                            marginTop: 5
                                        }}
                                    >
                                        <Text
                                            style={{
                                                lineHeight: 34,
                                                textTransform: 'uppercase',
                                                fontSize: 12,
                                                fontFamily: 'overpass',
                                                color: '#006AFF'
                                            }}
                                        >
                                            Erase
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : null}
                        {isQuiz && !isOwner && !initiatedAt ? renderQuizSubmissionHistory() : null}
                        {isQuiz && cueGraded && props.cue.releaseSubmission && !isOwner ? (
                            <QuizGrading
                                problems={problems}
                                solutions={quizSolutions}
                                partiallyGraded={false}
                                comment={comment}
                                isOwner={false}
                                headers={headers}
                                attempts={quizAttempts}
                            />
                        ) : (remainingAttempts === 0 ||
                              props.cue.releaseSubmission ||
                              (!allowLateSubmission && new Date() > deadline) ||
                              (allowLateSubmission && new Date() > availableUntil)) &&
                          !isOwner &&
                          isQuiz ? (
                            renderQuizEndedMessage()
                        ) : (
                            renderMainCueContent()
                        )}
                    </View>
                )}
                <View
                    style={{
                        width: '100%',
                        maxWidth: 900,
                        alignSelf: 'center',
                        paddingLeft: Dimensions.get('window').width < 768 ? 12 : 15
                    }}
                >
                    <Collapse isOpened={props.showOptions}>
                        <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {props.cue.channelId ? (
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
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
                        {/* {renderReminderOptions()} */}
                    </Collapse>
                </View>
            </ScrollView>
        </View>
    );
};

export default UpdateControls;

const styles: any = StyleSheet.create({
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: Dimensions.get('window').width < 768 ? 40 : 80,
        marginBottom: Dimensions.get('window').width < 768 ? 40 : 80,
        lineHeight: 18
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white'
    },
    colorContainerOutline: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1F1F1F'
    },
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        // marginTop: 5,
        marginBottom: 20,
        maxWidth: 210
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
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
    allGrayOutline: {
        fontSize: 12,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
        lineHeight: 20
    }
});
