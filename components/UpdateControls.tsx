// REACT
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { StyleSheet, Switch, TextInput, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import lodash from 'lodash';
import moment from 'moment';

// API

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
    unshareCueWithIds,
    shareWithAll,
    submit,
    modifyQuiz,
    duplicateQuiz,
    saveSubmissionDraft,
    startQuiz,
    getSubmissionAnnotations,
    updateAnnotation,
    getUsernamesForAnnotation,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import Alert from '../components/Alert';
import { Text, View, TouchableOpacity } from './Themed';
import { Collapse } from 'react-collapse';
import Quiz from './Quiz';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import ReactPlayer from 'react-player';
import QuizGrading from './QuizGrading';
import WebViewer from '@pdftron/pdfjs-express';
import TextareaAutosize from 'react-textarea-autosize';
import parser from 'html-react-parser';
import { Datepicker as MobiscrollDatePicker } from '@mobiscroll/react5';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import { Select as MobiscrollSelect } from '@mobiscroll/react';
import FormulaGuide from './FormulaGuide';
import InsertYoutubeModal from './InsertYoutubeModal';

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

import { FULL_FLEDGED_TOOLBAR_BUTTONS } from '../constants/Froala';

import { renderMathjax } from '../helpers/FormulaHelpers';
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';
import { omitTypename } from '../helpers/omitTypename';

const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const {
        user,
        userId,
        customCategories: localCustomCategories,
        handleUpdateCue,
        handleDeleteCue,
        handleSubmissionDraftUpdate,
        refreshCues,
    } = useAppContext();

    const current = new Date();
    const [initializedSubmissionDraft, setInitializedSubmissionDraft] = useState(false);
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
    const [gradeWeight, setGradeWeight] = useState<any>(props.cue.gradeWeight ? props.cue.gradeWeight.toString() : '');
    const [graded, setGraded] = useState(props.cue.gradeWeight ? true : false);
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
    const [originalSelected, setOriginalSelected] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [original, setOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original);
    const [initialOriginal, setInitialOriginal] = useState(!props.cue.channelId ? props.cue.cue : props.cue.original);
    const [comment] = useState(props.cue.comment);
    const [unlimitedAttempts, setUnlimitedAttempts] = useState(!props.cue.allowedAttempts);
    const [allowedAttempts, setAllowedAttemps] = useState(
        !props.cue.allowedAttempts ? '' : props.cue.allowedAttempts.toString()
    );
    const [totalPoints, setTotalPoints] = useState(!props.cue.totalPoints ? '' : props.cue.totalPoints.toString());
    const [submissionAttempts, setSubmissionAttempts] = useState<any[]>([]);
    const [submissionDraft, setSubmissionDraft] = useState('');
    const [updatingCueContent, setUpdatingCueContent] = useState(false);
    const [updatingCueDetails, setUpdatingCueDetails] = useState(false);
    const [viewSubmission, setViewSubmission] = useState(
        (props.cue.submittedAt !== null && props.cue.submittedAt !== undefined) ||
            (props.cue.graded && props.cue.releaseSubmission)
    );
    // const [viewSubmission, setViewSubmission] = useState(false);
    const [viewSubmissionTab, setViewSubmissionTab] = useState('instructorAnnotations');
    const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
    const [remainingAttempts, setRemainingAttempts] = useState<any>(null);
    const [isQuiz, setIsQuiz] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [unmodifiedProblems, setUnmodifiedProblems] = useState<any[]>([]);
    const [totalQuizPoints, setTotalQuizPoints] = useState(0);
    const [solutions, setSolutions] = useState<any[]>([]);
    const [shuffleQuizAttemptOrder, setShuffleQuizAttemptOrder] = useState<any[]>([]);
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
    const [submissionSavedAt, setSubmissionSavedAt] = useState(new Date());
    const [failedToSaveSubmission, setFailedToSaveSubmission] = useState(false);

    const [showInsertYoutubeVideosModal, setShowInsertYoutubeVideosModal] = useState(false);
    const [twoMinuteTimerShown, setTwoMinuteTimerShown] = useState(false);

    const [userFullName] = useState(user.fullName);
    const width = Dimensions.get('window').width;
    const [usernamesForAnnotation, setUsernamesForAnnotation] = useState<any>({});

    const server = useApolloClient();

    // ALERTS
    const unableToStartQuizAlert = PreferredLanguageText('unableToStartQuiz');
    const submissionCompleteAlert = PreferredLanguageText('submissionComplete');
    const tryAgainLaterAlert = PreferredLanguageText('tryAgainLater');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const clearQuestionAlert = PreferredLanguageText('clearQuestion');
    const cannotUndoAlert = PreferredLanguageText('cannotUndo');
    const sharedAlert = PreferredLanguageText('sharedAlert');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');

    Froalaeditor.DefineIcon('insertFormula', {
        NAME: 'formula',
        PATH: 'M12.4817 3.82717C11.3693 3.00322 9.78596 3.7358 9.69388 5.11699L9.53501 7.50001H12.25C12.6642 7.50001 13 7.8358 13 8.25001C13 8.66423 12.6642 9.00001 12.25 9.00001H9.43501L8.83462 18.0059C8.6556 20.6912 5.47707 22.0078 3.45168 20.2355L3.25613 20.0644C2.9444 19.7917 2.91282 19.3179 3.18558 19.0061C3.45834 18.6944 3.93216 18.6628 4.24389 18.9356L4.43943 19.1067C5.53003 20.061 7.24154 19.352 7.33794 17.9061L7.93168 9.00001H5.75001C5.3358 9.00001 5.00001 8.66423 5.00001 8.25001C5.00001 7.8358 5.3358 7.50001 5.75001 7.50001H8.03168L8.1972 5.01721C8.3682 2.45214 11.3087 1.09164 13.3745 2.62184L13.7464 2.89734C14.0793 3.1439 14.1492 3.61359 13.9027 3.94643C13.6561 4.27928 13.1864 4.34923 12.8536 4.10268L12.4817 3.82717Z"/><path d="M13.7121 12.7634C13.4879 12.3373 12.9259 12.2299 12.5604 12.5432L12.2381 12.8194C11.9236 13.089 11.4501 13.0526 11.1806 12.7381C10.911 12.4236 10.9474 11.9501 11.2619 11.6806L11.5842 11.4043C12.6809 10.4643 14.3668 10.7865 15.0395 12.0647L16.0171 13.9222L18.7197 11.2197C19.0126 10.9268 19.4874 10.9268 19.7803 11.2197C20.0732 11.5126 20.0732 11.9874 19.7803 12.2803L16.7486 15.312L18.2879 18.2366C18.5121 18.6627 19.0741 18.7701 19.4397 18.4568L19.7619 18.1806C20.0764 17.911 20.5499 17.9474 20.8195 18.2619C21.089 18.5764 21.0526 19.0499 20.7381 19.3194L20.4159 19.5957C19.3191 20.5357 17.6333 20.2135 16.9605 18.9353L15.6381 16.4226L12.2803 19.7803C11.9875 20.0732 11.5126 20.0732 11.2197 19.7803C10.9268 19.4874 10.9268 19.0126 11.2197 18.7197L14.9066 15.0328L13.7121 12.7634Z',
    });
    Froalaeditor.RegisterCommand('insertFormula', {
        title: 'Insert Formula',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {
            editorRef.current.editor.selection.save();
            setShowEquationEditor(true);
        },
    });

    Froalaeditor.DefineIcon('insertYoutube', {
        SRC: 'https://cues-files.s3.amazonaws.com/icons/youtubeLogo.png',
        ALT: 'Youtube icon',
        template: 'image',
    });

    Froalaeditor.RegisterCommand('insertYoutube', {
        title: 'Insert Youtube Videos',
        imageIcon: 'insertYoutube',
        focus: false,
        undo: true,
        refreshAfterCallback: false,
        callback: function () {
            editorRef.current.editor.selection.save();
            setShowInsertYoutubeVideosModal(true);
        },
    });

    // HOOKS

    // SHARE WITH ANY OTHER CHANNEL IN INSTITUTE
    // useEffect(() => {
    //     if (role === 'instructor' && school) {
    //
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
     * @description Load channels and share with
     */
    useEffect(() => {
        loadChannelsAndSharedWith();
    }, [props.channelOwner]);

    /**
     * @description Load categories for Update dropdown
     */
    useEffect(() => {
        let options = [
            {
                value: 'None',
                text: 'None',
            },
        ];

        customCategories.map((category: any) => {
            options.push({
                value: category,
                text: category,
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
        if (!userId || !userFullName) return;

        if (submissionAttempts && submissionAttempts.length > 0 && submissionViewerRef && submissionViewerRef.current) {
            const attempt = submissionAttempts[submissionAttempts.length - 1];

            let url = attempt.html !== undefined ? attempt.annotationPDF : attempt.url;

            if (url === '') return;

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: url,
                    annotationUser: userId,
                    enableReadOnlyMode: !props.cue.releaseSubmission,
                },
                submissionViewerRef.current
            ).then(async (instance) => {
                const { documentViewer, annotationManager } = instance.Core;

                if (!documentViewer || !annotationManager) return;

                // NEED TO ADD WEBSOCKETS FOR REAL-TIME INTERACTION

                documentViewer.addEventListener('documentLoaded', async () => {
                    // perform document operations

                    // Fetch annotations from server

                    server
                        .query({
                            query: getSubmissionAnnotations,
                            variables: {
                                userId,
                                cueId: props.cue._id,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.cue.getSubmissionAnnotations) {
                                const xfdfString = res.data.cue.getSubmissionAnnotations;

                                if (xfdfString !== '') {
                                    annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
                                        annotations.forEach((annotation: any) => {
                                            // Hide instructor annotations until grades are released
                                            if (!props.cue.releaseSubmission && annotation.Author !== userId) {
                                                annotationManager.hideAnnotation(annotation);
                                            } else {
                                                annotationManager.redrawAnnotation(annotation);
                                            }
                                        });
                                    });
                                }
                            }
                        })
                        .catch((e) => {
                            Alert('Failed to fetch document annotations. Check internet connection.');
                        });

                    // const currAttempt = submissionAttempts[submissionAttempts.length - 1];

                    // const xfdfString = currAttempt.annotations;

                    // if (xfdfString !== '') {
                    //     annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
                    //         annotations.forEach((annotation: any) => {
                    //             // Hide instructor annotations until grades are released
                    //             if (!props.cue.releaseSubmission && annotation.Author !== userId) {
                    //                 annotationManager.hideAnnotation(annotation);
                    //             } else {
                    //                 annotationManager.redrawAnnotation(annotation);
                    //             }
                    //         });
                    //     });
                    // }
                });

                annotationManager.setAnnotationDisplayAuthorMap((id: string) => {
                    if (userId === id) {
                        return userFullName;
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

                        if (!props.cue.releaseSubmission) return;

                        const xfdfString = await annotationManager.exportAnnotations({ useDisplayAuthor: false });

                        server
                            .mutate({
                                mutation: updateAnnotation,
                                variables: {
                                    userId,
                                    cueId: props.cue._id,
                                    annotations: xfdfString,
                                },
                            })
                            .then((res) => {
                                console.log('update annotation', res.data.cue.updateAnnotation);
                            })
                            .catch((e) => {
                                console.log(e);
                            });
                    }
                );
            });
        }
    }, [
        viewSubmission,
        viewSubmissionTab,
        submissionAttempts,
        props.showOriginal,
        props.showOptions,
        userId,
        userFullName,
        props.cue,
        usernamesForAnnotation,
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
    }, [
        initiatedAt,
        duration,
        deadline,
        isQuizTimed,
        isOwner,
        allowLateSubmission,
        availableUntil,
        props.showOriginal,
    ]);

    const showTwoMinutesAlert = useCallback(() => {
        if (twoMinuteTimerShown) return;

        Alert('Two minutes left. Quiz will auto-submit when timer ends.');

        setTwoMinuteTimerShown(true);
    }, [twoMinuteTimerShown]);

    /**
     * @description If cue contains a Quiz, then need to fetch the quiz and set State
     */
    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data1 = original;

            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1);
                if (obj.quizId) {
                    if (!loading) {
                        return;
                    }
                    setFetchingQuiz(true);

                    // load quiz here and set problems

                    server
                        .query({
                            query: getQuiz,
                            variables: {
                                quizId: obj.quizId,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.quiz.getQuiz) {
                                setQuizId(obj.quizId);

                                const solutionsObject = props.cue.cue ? JSON.parse(props.cue.cue) : {};
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

                                    setShuffleQuizAttemptOrder(
                                        parseQuizResponses.shuffleQuizAttemptOrder !== undefined &&
                                            res.data.quiz.getQuiz.shuffleQuiz
                                            ? parseQuizResponses.shuffleQuizAttemptOrder
                                            : []
                                    );

                                    if (
                                        parseQuizResponses.initiatedAt !== undefined &&
                                        parseQuizResponses.initiatedAt !== null
                                    ) {
                                        const init = new Date(parseQuizResponses.initiatedAt);
                                        setInitiatedAt(init);
                                    }
                                }

                                if (solutionsObject.attempts !== undefined) {
                                    setQuizAttempts(lodash.cloneDeep(solutionsObject.attempts));

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

                                const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems);

                                setProblems(deepCopy);

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
        }
        setLoading(false);
    }, [props.cue, loading, original]);

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
            const data = props.cue.cue;

            if (data && data[0] && data[0] === '{' && data[data.length - 1] === '}') {
                const obj = JSON.parse(data);

                if (obj.submissionDraft !== undefined) {
                    if (obj.submissionDraft[0] === '{' && obj.submissionDraft[obj.submissionDraft.length - 1] === '}') {
                        let parse = JSON.parse(obj.submissionDraft);

                        if (parse.url !== undefined && parse.title !== undefined && parse.type !== undefined) {
                            setSubmissionImported(true);
                            setSubmissionUrl(parse.url);
                            setSubmissionType(parse.type);
                            setSubmissionTitle(parse.title);
                        }
                    }
                    setSubmissionDraft(obj.submissionDraft);
                }

                setSubmissionAttempts(obj.attempts ? obj.attempts : []);
            }
            setInitializedSubmissionDraft(true);
        }
    }, [props.cue]);

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
            // Basic Validation for save content

            if (imported || isQuiz) {
                if (title === '') {
                    Alert('Title cannot be empty');
                    props.setSave(false);
                    return;
                }
            }

            if (!imported && !isQuiz) {
                const parse = htmlStringParser(original);

                if (parse.title === 'NO_CONTENT' && !parse.subtitle) {
                    Alert('Content cannot be empty.');
                    props.setSave(false);
                    return;
                }
            }

            // Basic Validation For save details
            if (submission && isOwner) {
                if (initiateAt > deadline) {
                    Alert('Deadline must be after available date');
                    props.setSave(false);
                    return;
                }

                if (allowLateSubmission && availableUntil < deadline) {
                    Alert('Late Submission date must be after deadline');
                    props.setSave(false);
                    return;
                }

                if (!isQuiz && Number.isNaN(Number(totalPoints))) {
                    Alert('Enter valid total points for assignment.');
                    return;
                }
            }

            props.setSave(false);
            updateCue();
            handleRestrictAccessUpdate();
        }
    }, [
        props.save,
        props.channelOwner,
        isQuiz,
        submission,
        isOwner,
        initiateAt,
        deadline,
        allowLateSubmission,
        availableUntil,
        imported,
        isQuiz,
        title,
        original,
        totalPoints,
    ]);

    /**
     * @description Handle Delete when props.del
     */
    useEffect(() => {
        if (props.del) {
            handleDelete();
            props.setDelete(false);
        }
    }, [props.del]);

    /**
     * @description Setup PDFTron Webviewer for Cue content
     */
    useEffect(() => {
        if (!userId || !userFullName) return;

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
                    initialDoc: url,
                    annotationUser: userId,
                },
                RichText.current
            ).then(async (instance: any) => {
                const { documentViewer, annotationManager } = instance.Core;

                if (!documentViewer || !annotationManager) return;

                // you can now call WebViewer APIs here...
                documentViewer.addEventListener('documentLoaded', async () => {
                    // perform document operations

                    // Need to modify the original property in the cue

                    const currCue = props.cue;

                    if (currCue.annotations !== '') {
                        const xfdfString = currCue.annotations;

                        annotationManager.importAnnotations(xfdfString).then((annotations: any) => {
                            annotations.forEach((annotation: any) => {
                                annotationManager.redrawAnnotation(annotation);
                            });
                        });
                    }
                });

                annotationManager.setAnnotationDisplayAuthorMap((id: string) => {
                    if (userId === id) {
                        return userFullName;
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

                        const currCue = props.cue;

                        const saveCue = {
                            ...currCue,
                            annotations: xfdfString,
                        };

                        handleUpdateCue(saveCue, false);
                    }
                );
            });
        } else {
            if (submissionUrl === '' || !submissionUrl) {
                return;
            }

            if (viewSubmission) return;

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

            WebViewer(
                {
                    licenseKey: 'xswED5JutJBccg0DZhBM',
                    initialDoc: submissionUrl,
                    annotationUser: userId,
                },
                RichText.current
            ).then(async (instance: any) => {
                const { documentViewer, annotationManager } = instance.Core;
                // you can now call WebViewer APIs here...

                if (!documentViewer || !annotationManager) return;

                documentViewer.addEventListener('documentLoaded', () => {
                    // perform document operations

                    if (
                        submissionDraft !== '' &&
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

                annotationManager.setAnnotationDisplayAuthorMap((id: string) => {
                    if (userId === id) {
                        return userFullName;
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

                        handleUpdateAnnotationsForSubmission(xfdfString);
                    }
                );
            });
        }
    }, [
        props.cue,
        url,
        RichText,
        imported,
        submissionImported,
        props.showOriginal,
        props.showOptions,
        submissionUrl,
        type,
        submissionType,
        userId,
        userFullName,
        viewSubmission,
    ]);

    const handleUpdateAnnotationsForSubmission = useCallback(
        (xfdfString: string) => {
            const obj = JSON.parse(submissionDraft);

            let updateSubmissionDraftWithAnnotation = {
                ...obj,
                annotations: xfdfString,
            };

            setSubmissionDraft(JSON.stringify(updateSubmissionDraftWithAnnotation));
        },
        [submissionDraft]
    );

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
        handleUpdateCueSubmission();
    }, [
        submitted,
        solutions,
        initiatedAt,
        submissionType,
        submissionUrl,
        submissionTitle,
        submissionImported,
        isQuiz,
        submissionDraft,
        shuffleQuizAttemptOrder,
    ]);

    /**
     * @description Handle bookmark (Not used right now)
     */
    // useEffect(() => {
    //     handleUpdateStarred();
    // }, [starred]);

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
        if (props.channelId) {
            server
                .query({
                    query: getChannelCategories,
                    variables: {
                        channelId: props.channelId,
                    },
                })
                .then((res) => {
                    if (res.data.channel && res.data.channel.getChannelCategories) {
                        setCustomCategories(res.data.channel.getChannelCategories);
                        setInitializedCustomCategories(true);
                    }
                })
                .catch((err) => {});
        } else {
            setCustomCategories(localCustomCategories);
            setInitializedCustomCategories(true);
        }

        server
            .query({
                query: getChannels,
                variables: {
                    userId,
                },
            })
            .then((res) => {
                if (res.data.channel.findByUserId) {
                    setChannels(res.data.channel.findByUserId);
                }
            })
            .catch((err) => {});
        if (props.channelOwner && props.cue.channelId && props.cue.channelId !== '') {
            // owner
            server
                .query({
                    query: getSharedWith,
                    variables: {
                        channelId: props.cue.channelId,
                        cueId: props.cue._id,
                    },
                })
                .then((res: any) => {
                    if (res.data && res.data.cue.getSharedWith) {
                        const format = res.data.cue.getSharedWith.map((sub: any) => {
                            return {
                                value: sub.value,
                                text: sub.label,
                            };
                        });

                        setSubscribers(format);

                        // clear selected
                        const sel = res.data.cue.getSharedWith.filter((item: any) => {
                            return item.sharedWith;
                        });

                        const formatSel = sel.map((sub: any) => {
                            return sub.value;
                        });

                        setSelected(formatSel);
                        setOriginalSelected(formatSel);
                    }
                })
                .catch((err: any) => console.log(err));
        }
    }, [props.cue, props.channelId, props.channelOwner]);

    const handleAddVideo = useCallback(
        (videoId: string) => {
            setShowInsertYoutubeVideosModal(false);

            editorRef.current.editor.selection.restore();

            editorRef.current.editor.html.insert(
                `<iframe width="640" height="360" src="https://youtube.com/embed/${videoId}" frameborder="0" allowfullscreen="" class="fr-draggable"></iframe>`
            );

            editorRef.current.editor.events.trigger('contentChanged');
        },
        [editorRef, editorRef.current]
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
                '<img class="rendered-math-jax" style="width:' +
                    res.intrinsicWidth +
                    'px; id="' +
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

        server
            .mutate({
                mutation: startQuiz,
                variables: {
                    cueId: props.cue._id,
                    userId,
                },
            })
            .then((res) => {
                if (res.data && res.data.quiz.start !== '') {
                    setInitiatedAt(new Date(res.data.quiz.start));
                }
            })
            .catch((err) => console.log(err));
        // save time to cloud first
        // after saving time in cloud, save it locally, set initiatedAt
        // quiz gets triggered
    }, [props.cue._id, deadline, availableUntil, allowLateSubmission, userId]);

    const fileUploadEditor = useCallback(
        async (files: any, forSubmission: boolean) => {
            const res = await handleFileUploadEditor(false, files.item(0), userId);

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
                        title,
                    })
                );
            } else {
                setSubmissionImported(true);
                setSubmissionDraft(
                    JSON.stringify({
                        url: uploadURL,
                        type: uploadType,
                        title: submissionTitle,
                        annotations: '',
                    })
                );
                setSubmissionType(uploadType);
                setSubmissionUrl(uploadURL);
            }
        },
        [title, submissionTitle]
    );

    /**
     * @description Handle cue content for Submissions and Quiz responses
     */
    const handleUpdateCueSubmission = useCallback(async () => {
        if (isSubmitting) return;

        const currCue = props.cue;

        const currCueValue: any = currCue.cue;

        // ONLY UPDATE IF FOLLOWING CONDITIONS MET
        if (!userId || !currCue.submission || !initializedSubmissionDraft) {
            return;
        }

        // If there are no existing submissions then initiate cue obj
        let submissionObj = {
            submissionDraft: '',
            attempts: [],
        };

        let quizObj = {
            quizResponses: {},
            attempts: [],
        };

        let updatedCue = '';

        if (isQuiz) {
            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                quizObj = JSON.parse(currCueValue);
            }

            quizObj.quizResponses = JSON.stringify({
                solutions,
                initiatedAt,
                shuffleQuizAttemptOrder,
            });

            updatedCue = JSON.stringify(quizObj);
        } else if (submissionImported) {
            if (currCueValue && currCueValue[0] === '{' && currCueValue[currCueValue.length - 1] === '}') {
                submissionObj = JSON.parse(currCueValue);
            }

            let updatedDraft = {};

            if (submissionDraft && submissionDraft[0] === '{' && submissionDraft[submissionDraft.length - 1] === '}') {
                updatedDraft = JSON.parse(submissionDraft);
            }

            // Submission draft will also have annotations so preserve those

            const obj = {
                ...updatedDraft,
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle,
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

        server
            .mutate({
                mutation: saveSubmissionDraft,
                variables: {
                    cueId: props.cue._id,
                    userId,
                    cue: updatedCue,
                },
            })
            .then((res) => {
                if (res.data && res.data.cue.saveSubmissionDraft) {
                    handleSubmissionDraftUpdate(props.cue._id, updatedCue);
                    setSubmissionSavedAt(new Date());
                    setFailedToSaveSubmission(false);
                } else {
                    setFailedToSaveSubmission(true);
                }
            })
            .catch((e) => {
                setFailedToSaveSubmission(true);
            });
    }, [
        initializedSubmissionDraft,
        submitted,
        solutions,
        initiatedAt,
        submissionType,
        submissionUrl,
        submissionTitle,
        submissionImported,
        isQuiz,
        submissionDraft,
        isSubmitting,
        props.cue,
        userId,
        shuffleQuizAttemptOrder,
    ]);

    /**
     * @description Handle update Cue content (Channel owner)
     */
    const handleUpdateContent = useCallback(async () => {
        setUpdatingCueContent(true);

        if (!props.cue.channelId) {
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
                    title,
                };
                tempOriginal = JSON.stringify(obj);
            } else {
                tempOriginal = original;
            }

            const currCue = props.cue;

            const saveCue = {
                ...currCue,
                cue: tempOriginal,
            };

            handleUpdateCue(saveCue, false);

            // Update initial Value for Editor
            setInitialOriginal(tempOriginal);
            setUpdatingCueContent(false);

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
                title,
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
                title,
            };
            tempOriginal = JSON.stringify(obj);
        } else {
            tempOriginal = original;
        }

        const currCue = props.cue;

        const saveCue = {
            ...currCue,
            original: tempOriginal,
        };

        handleUpdateCue(saveCue, false);

        setInitialOriginal(tempOriginal);
        setUpdatingCueContent(false);
    }, [title, original, imported, type, url, isQuiz, props.cue]);

    /**
     * @description Handle changes to restrict access
     */
    const handleRestrictAccessUpdate = useCallback(async () => {
        // If restrict access initially and it is now turned off

        if (props.cue.limitedShares && !limitedShares) {
            server
                .mutate({
                    mutation: shareWithAll,
                    variables: {
                        cueId: props.cue._id,
                    },
                })
                .then((res: any) => {
                    loadChannelsAndSharedWith();
                })
                .catch((e: any) => {
                    console.log('Error', e);
                });
        } else if (limitedShares) {
            const toAdd: string[] = [];
            const toRemove: string[] = [];

            originalSelected.map((userId: string) => {
                if (!selected.includes(userId)) {
                    toRemove.push(userId);
                }
            });

            selected.map((userId: string) => {
                if (!originalSelected.includes(userId)) {
                    toAdd.push(userId);
                }
            });

            if (toAdd.length > 0) {
                server
                    .mutate({
                        mutation: shareCueWithMoreIds,
                        variables: {
                            userIds: toAdd,
                            cueId: props.cue._id,
                        },
                    })
                    .then((res: any) => {
                        console.log('Res', res);
                    })
                    .catch((e: any) => {
                        console.log('Error', e);
                    });
            }

            if (toRemove.length > 0) {
                server
                    .mutate({
                        mutation: unshareCueWithIds,
                        variables: {
                            userIds: toRemove,
                            cueId: props.cue._id,
                        },
                    })
                    .then((res: any) => {
                        console.log('Res', res);
                    })
                    .catch((e: any) => {
                        console.log('Error', e);
                    });
            }

            setOriginalSelected(selected);
        }
    }, [props.cue, originalSelected, selected, limitedShares]);

    const updateCue = useCallback(async () => {
        console.log('Update Cue Called');
        if (submission && isOwner) {
            if (initiateAt > deadline) {
                Alert('Deadline must be after available date');
                return;
            }

            if (allowLateSubmission && availableUntil < deadline) {
                Alert('Late Submission date must be after deadline');
                return;
            }

            if (!isQuiz && Number.isNaN(Number(totalPoints))) {
                Alert('Enter valid total points for assignment.');
                return;
            }
        }

        let tempOriginal = '';

        let saveCue: any = undefined;

        if (!props.cue.channelId) {
            if (imported) {
                if (title === '') {
                    Alert('Title cannot be empty');
                    setUpdatingCueContent(false);
                    return;
                }

                const obj = {
                    type,
                    url,
                    title,
                };
                tempOriginal = JSON.stringify(obj);
            } else {
                tempOriginal = original;
            }

            const currCue = props.cue;

            saveCue = {
                ...currCue,
                _id: currCue._id.toString(),
                color: color.toString(),
                cue: tempOriginal,
                shuffle,
                frequency,
                customCategory: customCategory === 'None' ? '' : customCategory,
            };
        } else {
            if (imported) {
                if (title === '') {
                    Alert('Title cannot be empty');
                    setUpdatingCueContent(false);
                    return;
                }

                const obj = {
                    type,
                    url,
                    title,
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
                    title,
                };
                tempOriginal = JSON.stringify(obj);
            } else {
                tempOriginal = original;
            }

            const currCue = props.cue;

            saveCue = {
                ...currCue,
                original: tempOriginal,
                _id: currCue._id.toString(),
                date: new Date(currCue.date).toISOString(),
                color: color.toString(),
                shuffle,
                frequency,
                customCategory: customCategory === 'None' ? '' : customCategory,
                gradeWeight: graded ? gradeWeight.toString() : null,
                endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
                submission,
                deadline: submission ? deadline.toISOString() : '',
                initiateAt: submission ? initiateAt.toISOString() : '',
                allowedAttempts: unlimitedAttempts ? null : allowedAttempts.toString(),
                availableUntil: submission && allowLateSubmission ? availableUntil.toISOString() : '',
                limitedShares,
                totalPoints: submission && !isQuiz ? totalPoints : '',
            };
        }

        const success = await handleUpdateCue(saveCue, false);

        console.log('update response', success);

        if (!success) {
            Alert('Failed to update content. Try again.');
            return;
        } else {
            Alert('Changes saved successfully. Continue editing?', '', [
                {
                    text: 'No',
                    style: 'cancel',
                    onPress: () => {
                        props.closeModal();
                    },
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        setInitialOriginal(tempOriginal);
                    },
                },
            ]);
        }
    }, [
        // CONTENT
        title,
        original,
        imported,
        type,
        url,
        isQuiz,

        // DETAILS
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
        graded,
        limitedShares,
        isQuiz,
        totalPoints,
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
                },
            },
            {
                text: 'Okay',
                onPress: async () => {
                    if (props.cue.channelId && isOwner) {
                        server
                            .mutate({
                                mutation: deleteForEveryone,
                                variables: {
                                    cueId: props.cue._id,
                                },
                            })
                            .then((res) => {
                                if (res.data.cue.deleteForEveryone) {
                                    Alert('Deleted successfully.');
                                }
                            })
                            .catch((e) => {
                                Alert('Failed to delete. Try again.');
                                return;
                            });
                    }

                    if (!props.cue.channelId) {
                        server
                            .mutate({
                                mutation: deleteCue,
                                variables: {
                                    cueId: props.cue._id,
                                },
                            })
                            .then((res) => {
                                if (res.data.cue.deleteForEveryone) {
                                    Alert('Deleted successfully.');
                                }
                            })
                            .catch((e) => {
                                Alert('Failed to delete. Try again.');
                                return;
                            });
                    }

                    handleDeleteCue(props.cue._id);

                    props.closeModal();
                },
            },
        ]);
    }, [props.cueIndex, props.closeModal, props.cue, isOwner, original, props.cue.channelId]);

    /**
     * @description Submit quiz when time gets over
     */
    const submitQuizEndTime = useCallback(async () => {
        // Add additional check to ensure that quiz doesn't autosubmit twice
        if (isSubmitting) {
            return;
        }

        // This should disable submit button also
        setIsSubmitting(true);

        const saveCue = JSON.stringify({
            solutions,
            initiatedAt,
        });

        server
            .mutate({
                mutation: submit,
                variables: {
                    cue: saveCue,
                    cueId: props.cue._id,
                    userId,
                    quizId,
                },
            })
            .then((res) => {
                if (res.data.cue.submitModification) {
                    Alert(submissionCompleteAlert, moment(new Date()).format('MMMM Do, h:mm a'), [
                        {
                            text: 'Okay',
                            onPress: () => window.location.reload(),
                        },
                    ]);
                }
            })
            .catch((err) => {
                setIsSubmitting(false);
                Alert(somethingWentWrongAlert, tryAgainLaterAlert);
            });
    }, [props.cue, isQuiz, quizId, initiatedAt, solutions, userId, isSubmitting]);

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
                    },
                },
                {
                    text: 'Okay',
                    onPress: async () => {
                        setIsSubmitting(true);

                        let saveCue = '';
                        if (isQuiz) {
                            saveCue = JSON.stringify({
                                solutions,
                                initiatedAt,
                            });
                        } else {
                            saveCue = submissionDraft;
                        }

                        server
                            .mutate({
                                mutation: submit,
                                variables: {
                                    cue: saveCue,
                                    cueId: props.cue._id,
                                    userId,
                                    quizId: isQuiz ? quizId : null,
                                },
                            })
                            .then((res: any) => {
                                if (res.data.cue.submitModification) {
                                    setIsSubmitting(false);
                                    Alert(submissionCompleteAlert, moment(new Date()).format('MMMM Do, h:mm a'), [
                                        {
                                            text: 'Okay',
                                            onPress: () => window.location.reload(),
                                        },
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
                    },
                },
            ]
        );
    }, [
        props.cue,
        submissionTitle,
        submissionType,
        submissionUrl,
        submissionImported,
        isQuiz,
        quizId,
        initiatedAt,
        solutions,
        deadline,
        submissionDraft,
        userId,
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
        let requiredMissingQuestions = [];

        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            const solution = solutions[i];

            let currentAttemptIndex = i;

            if (shuffleQuiz) {
                currentAttemptIndex = shuffleQuizAttemptOrder.findIndex((val: number) => {
                    return val === i;
                });
            }

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
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'freeResponse' && problem.required) {
                // Check completeness for free response
                const { response } = solution;

                if (response === '') {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'dragdrop' && problem.required) {
                // Drag & Drop
                let atleaseOneResponse = false;

                const { dragDropChoices } = solution;

                dragDropChoices.map((group: any[]) => {
                    if (group.length > 0) {
                        atleaseOneResponse = true;
                    }
                });

                if (!atleaseOneResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'hotspot' && problem.required) {
                // Hotspot
                let atleaseOneResponse = false;

                const { hotspotSelection } = solution;

                hotspotSelection.map((selected: boolean) => {
                    if (selected) {
                        atleaseOneResponse = true;
                    }
                });

                if (!atleaseOneResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'highlightText' && problem.required) {
                // Hot text
                let atleaseOneResponse = false;

                const { highlightTextSelection } = solution;

                highlightTextSelection.map((selected: boolean) => {
                    if (selected) {
                        atleaseOneResponse = true;
                    }
                });

                if (!atleaseOneResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'inlineChoice' && problem.required) {
                // Inline choice
                let missing = false;

                const { inlineChoiceSelection } = solution;

                inlineChoiceSelection.map((selected: string) => {
                    if (selected === '') {
                        missing = true;
                    }
                });

                if (missing) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'textEntry' && problem.required) {
                // Text Entry
                let missing = false;

                const { textEntrySelection } = solution;

                textEntrySelection.map((selected: string) => {
                    if (selected === '') {
                        missing = true;
                    }
                });

                if (missing) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'equationEditor' && problem.required) {
                // Equation Editor
                const { equationResponse } = solution;

                if (equationResponse === '') {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'multipart' && problem.required) {
                // Multipart
                let missingResponse = false;

                const { multipartSelection } = solution;

                multipartSelection.map((part: any) => {
                    if (missingResponse) return;

                    let hasAnswer = false;

                    part.map((option: boolean) => {
                        if (option) {
                            hasAnswer = true;
                        }
                    });

                    if (!hasAnswer) {
                        missingResponse = true;
                    }
                });

                if (missingResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else if (problem.questionType === 'matchTableGrid' && problem.required) {
                // Match Table grid
                let missingResponse = false;

                const { matchTableSelection } = solution;

                matchTableSelection.map((row: any[]) => {
                    if (missingResponse) return;

                    let hasAnswer = false;

                    row.map((option: boolean) => {
                        if (option) {
                            hasAnswer = true;
                        }
                    });

                    if (!hasAnswer) {
                        missingResponse = true;
                    }
                });

                if (missingResponse) {
                    requiredMissing = true;
                    requiredMissingQuestions.push(currentAttemptIndex + 1);
                }
            } else {
                // Optional
            }
        }

        requiredMissingQuestions.sort((a: any, b: any) => {
            return a > b ? 1 : -1;
        });

        let missingString = '';

        if (requiredMissing && requiredMissingQuestions.length === 1) {
            missingString = 'Required question ' + requiredMissingQuestions[0] + ' is missing a response.';
        } else if (requiredMissing && requiredMissingQuestions.length > 1) {
            missingString = 'Required questions ' + requiredMissingQuestions.join(', ') + ' are missing responses.';
        }

        if (requiredMissing) {
            Alert(missingString, 'Would you still like to submit?', [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        return;
                    },
                },
                {
                    text: 'Yes',
                    onPress: () => {
                        submitResponse();
                    },
                },
            ]);
        } else {
            submitResponse();
        }
    }, [
        props.cue,
        submissionTitle,
        submissionType,
        submissionUrl,
        submissionImported,
        isQuiz,
        quizId,
        initiatedAt,
        solutions,
        deadline,
        submissionDraft,
        shuffleQuiz,
        shuffleQuizAttemptOrder,
    ]);

    /**
     * @description update Cue status as read
     */
    const updateStatusAsRead = useCallback(async () => {
        if (props.cue.status && props.cue.status !== 'read' && !markedAsRead) {
            server
                .mutate({
                    mutation: markAsRead,
                    variables: {
                        cueId: props.cue._id,
                        userId,
                    },
                })
                .then((res) => {
                    if (res.data.status.markAsRead) {
                        setMarkedAsRead(true);
                    }
                })
                .catch((err) => {});
        }
    }, [props.cue, markedAsRead]);

    /**
     * @description Clear all cue content and imports
     */
    const clearAll = useCallback(() => {
        Alert(clearQuestionAlert, cannotUndoAlert, [
            {
                text: 'Cancel',
                style: 'cancel',
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
                        setSubmissionUrl('');
                        setSubmissionType('');
                        setSubmissionTitle('');
                    }
                },
            },
        ]);
    }, [props.showOriginal]);

    /**
     * @description Share cue
     */
    const shareCue = useCallback(async () => {
        const variables = {
            cue: props.cue.channelId ? props.cue.original : props.cue.cue,
            starred: props.cue.starred,
            channelId: shareWithChannelId,
            createdBy: props.cue.createdBy,
            color: color.toString(),
            shuffle,
            frequency,
            customCategory: customCategory === 'None' ? '' : customCategory,
            gradeWeight: graded ? gradeWeight.toString() : '0',
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
            submission,
            deadline: submission ? deadline.toISOString() : '',
            initiateAt: submission ? initiateAt.toISOString() : '',
            allowedAttempts: unlimitedAttempts ? '' : allowedAttempts,
            availableUntil: submission && allowLateSubmission ? availableUntil.toISOString() : '',
            limitedShares,
            shareWithUserIds: limitedShares ? [props.cue.createdBy] : null,
        };

        if (
            props.cue.channelId &&
            props.cue.original &&
            props.cue.original[0] === '{' &&
            props.cue.original[props.cue.original.length - 1] === '}' &&
            props.cue.original.includes('quizId')
        ) {
            const parseCue = JSON.parse(props.cue.original);

            if (parseCue.quizId) {
                server
                    .mutate({
                        mutation: duplicateQuiz,
                        variables: {
                            quizId: parseCue.quizId,
                        },
                    })
                    .then((res) => {
                        if (res.data && res.data.cue.duplicateQuiz) {
                            if (!res.data.cue.duplicateQuiz) {
                                Alert('Something went wrong. Try again.');
                                return;
                            }

                            variables.cue = JSON.stringify({
                                quizId: res.data.cue.duplicateQuiz,
                                title: parseCue.title,
                            });
                            server
                                .mutate({
                                    mutation: createCue,
                                    variables,
                                })
                                .then((res1) => {
                                    if (res1.data.cue.create) {
                                        Alert(sharedAlert, 'Cue has been successfully shared.');
                                        refreshCues();
                                    }
                                })
                                .catch((err) => {
                                    console.log('Err', err);
                                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                                });
                        }
                    });
            }
        } else {
            server
                .mutate({
                    mutation: createCue,
                    variables,
                })
                .then((res1) => {
                    if (res1.data.cue.create) {
                        Alert(sharedAlert, 'Cue has been successfully shared.');
                        refreshCues();
                    }
                })
                .catch((err) => {
                    console.log('Err', err);
                    Alert(somethingWentWrongAlert, checkConnectionAlert);
                });
        }
    }, [
        starred,
        color,
        frequency,
        customCategory,
        shuffle,
        gradeWeight,
        submission,
        deadline,
        initiateAt,
        allowLateSubmission,
        availableUntil,
        notify,
        playChannelCueIndef,
        endPlayAt,
        shareWithChannelId,
        props.cue,
        unlimitedAttempts,
        limitedShares,
        allowedAttempts,
        graded,
    ]);

    // FUNCTIONS

    /**
     * @description Helper method to calculate difference between two times
     */
    const diff_seconds = (dt2: any, dt1: any) => {
        var diff = (dt2.getTime() - dt1.getTime()) / 1000;
        return Math.abs(Math.round(diff));
    };

    const omitDeep = (obj: any, key: string) => {
        const keys = Object.keys(obj);
        const newObj: any = {};
        keys.forEach((i) => {
            if (i !== key) {
                const val = obj[i];
                if (Array.isArray(val)) newObj[i] = omitDeepArrayWalk(val, key);
                else if (typeof val === 'object' && val !== null) newObj[i] = omitDeep(val, key);
                else newObj[i] = val;
            }
        });
        return newObj;
    };

    const omitDeepArrayWalk = (arr: any[], key: string) => {
        return arr.map((val) => {
            if (Array.isArray(val)) return omitDeepArrayWalk(val, key);
            else if (typeof val === 'object') return omitDeep(val, key);
            return val;
        });
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
        setLoadingAfterModifyingQuiz(true);

        // VALIDATION:
        // Check if any question without a correct answer

        let error = false;
        problems.map((problem: any, problemIndex: number) => {
            if (
                problem.question === '' &&
                problem.questionType !== 'textEntry' &&
                problem.questionType !== 'inlineChoice' &&
                problem.questionType !== 'highlightText'
            ) {
                Alert(`Question ${problemIndex + 1} has no content.`);
                error = true;
            }

            if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                Alert(`Enter numeric points for Question ${problemIndex + 1}.`);
                error = true;
            }
            let optionFound = false;

            // If MCQ then > 2 options
            if (!problem.questionType && problem.options.length < 2) {
                Alert(`Question ${problemIndex + 1} must have at least 2 options.`);
                setIsSubmitting(false);
                error = true;
            }

            // If MCQ, check if any options repeat:
            if (!problem.questionType || problem.questionType === 'trueFalse') {
                const keys: any = {};

                problem.options.map((option: any) => {
                    if (option.option === '' || option.option === 'formula:') {
                        Alert(`Fill out missing options in question ${problemIndex + 1}.`);
                        setIsSubmitting(false);
                        error = true;
                    }

                    if (option.option in keys) {
                        Alert(`Option repeated in question ${problemIndex + 1}.`);
                        setIsSubmitting(false);
                        error = true;
                    }

                    if (option.isCorrect) {
                        optionFound = true;
                    }

                    keys[option.option] = 1;
                });

                if (!optionFound) {
                    Alert(`Question ${problemIndex + 1} must have at least one correct answer.`);
                    setIsSubmitting(false);
                    error = true;
                }
            }

            // Drag and Drop
            if (problem.questionType === 'dragdrop') {
                let groupHeaderMissing = false;
                let labelMissing = false;
                let groupEmpty = false;

                problem.dragDropHeaders.map((header: string) => {
                    if (!header) {
                        groupHeaderMissing = true;
                    }
                });

                if (groupHeaderMissing) {
                    Alert(`Group header is missing in Question ${problemIndex + 1}.`);
                    return false;
                }

                problem.dragDropData.map((items: any[]) => {
                    if (items.length === 0) {
                        groupEmpty = true;
                    }

                    items.map((label: any) => {
                        if (label.content === '') {
                            labelMissing = true;
                        }
                    });
                });

                if (labelMissing) {
                    Alert(`Item missing in Question ${problemIndex + 1}.`);
                    return false;
                }

                if (groupEmpty) {
                    Alert(`Each group must have at least 1 item in Question ${problemIndex + 1}.`);
                    return false;
                }
            }

            // Hotspot
            if (problem.questionType === 'hotspot') {
                if (problem.imgUrl === '' || !problem.imgUrl) {
                    Alert(`Hotspot image is missing in Question ${problemIndex + 1}.`);
                    setIsSubmitting(false);
                    error = true;
                }
                if (!problem.hotspots || problem.hotspots.length === 0) {
                    Alert(`You must place at least two hotspot marker on the image in Question ${problemIndex + 1}.`);
                    setIsSubmitting(false);
                    error = true;
                }

                let hasCorrectAnswer = false;

                problem.hotspotOptions.map((option: any) => {
                    if (option.isCorrect) {
                        hasCorrectAnswer = true;
                    }
                });

                if (!hasCorrectAnswer) {
                    Alert(`Hotspot question ${problemIndex + 1} must have at least correct choice.`);
                    return;
                }
            }

            // Highlight Text
            if (problem.questionType === 'highlightText') {
                if (problem.highlightTextChoices.length < 2) {
                    Alert(
                        `You must set multiple highlight text choices and mark one as correct in Question ${
                            problemIndex + 1
                        }.`
                    );
                    return;
                }

                let atleastOneCorrect = false;

                problem.highlightTextChoices.map((choice: boolean) => {
                    if (choice) {
                        atleastOneCorrect = true;
                    }
                });

                if (!atleastOneCorrect) {
                    Alert(
                        `You must set at least one highlight text choice as correct in Question ${problemIndex + 1}.`
                    );
                    return;
                }
            }

            // Inline Choice
            if (problem.questionType === 'inlineChoice') {
                if (problem.inlineChoiceHtml === '') {
                    Alert(`Question ${problemIndex + 1} has no content.`);
                    return;
                }

                if (problem.inlineChoiceOptions.length === 0) {
                    Alert(`Question ${problemIndex + 1} must have at lease one dropdown.`);
                    return;
                }

                let lessThan2DropdownValues = false;
                let missingDropdownValue = false;
                let missingCorrectAnswer = false;

                if (problem.inlineChoiceOptions.length > 0) {
                    problem.inlineChoiceOptions.map((choices: any[]) => {
                        if (choices.length < 2) {
                            lessThan2DropdownValues = true;
                        }

                        let hasCorrect = false;
                        choices.map((choice: any) => {
                            if (choice.isCorrect) {
                                hasCorrect = true;
                            }

                            if (choice.option === '') {
                                missingDropdownValue = true;
                            }
                        });

                        if (!hasCorrect) {
                            missingCorrectAnswer = true;
                        }
                    });

                    if (lessThan2DropdownValues) {
                        Alert(`Each dropdown in question ${problemIndex + 1} must have at lease two options.`);
                        return;
                    }

                    if (missingDropdownValue) {
                        Alert(`Each dropdown option must have a value in question ${problemIndex + 1}.`);
                        return;
                    }

                    if (missingCorrectAnswer) {
                        Alert(`Each dropdown must have a correct answer in question ${problemIndex + 1}.`);
                        return;
                    }
                }
            }

            // Text Entry
            if (problem.questionType === 'textEntry') {
                if (problem.textEntryHtml === '') {
                    Alert(`Question ${problemIndex + 1} has no content.`);
                    return;
                }

                if (problem.textEntryOptions.length === 0) {
                    Alert(`Text entry question ${problemIndex + 1} must have at lease one entry.`);
                    return;
                }

                let missingEntryAnswer = false;
                let missingEntryPoints = false;
                let pointsNotANumber = false;

                problem.textEntryOptions.map((choice: any, problemIndex: number) => {
                    if (choice.option === '') {
                        missingEntryAnswer = true;
                    }

                    if (choice.points === '') {
                        missingEntryPoints = true;
                    }

                    if (Number.isNaN(Number(choice.points))) {
                        pointsNotANumber = true;
                    }
                });

                if (missingEntryAnswer) {
                    Alert(`Each Text entry option must have an answer in question ${problemIndex + 1}.`);
                    return;
                }

                if (missingEntryPoints) {
                    Alert(`Each Text entry must have points in question ${problemIndex + 1}.`);
                    return;
                }

                if (pointsNotANumber) {
                    Alert(`Each Text entry must have numeric points in question ${problemIndex + 1}.`);
                    return;
                }
            }

            // Multipart
            if (problem.questionType === 'multipart') {
                if (problem.multipartQuestions[0] === '' || problem.multipartQuestions[1] === '') {
                    Alert(`Part A and Part B questions cannot be empty in question ${problemIndex + 1}`);
                    return;
                }

                // Part A
                let hasOneCorrect = false;
                let hasMissingOption = false;

                // At least two choices
                if (problem.multipartOptions[0].length < 2) {
                    Alert(`Part A must have at least two choices in question ${problemIndex + 1}`);
                    return;
                }

                problem.multipartOptions[0].map((option: any) => {
                    if (option.isCorrect) {
                        hasOneCorrect = true;
                    }

                    if (option.option === '') {
                        hasMissingOption = true;
                    }
                });

                if (!hasOneCorrect) {
                    Alert(`Part A must have at least one correct choice in question ${problemIndex + 1}`);
                    return;
                }

                if (hasMissingOption) {
                    Alert(`Part A option is empty in question ${problemIndex + 1}`);
                    return;
                }

                if (problem.multipartOptions[0].length < 2) {
                    Alert(`Part A must have at least two choices in question ${problemIndex + 1}`);
                    return;
                }

                // Part B
                problem.multipartOptions[1].map((option: any) => {
                    if (option.isCorrect) {
                        hasOneCorrect = true;
                    }

                    if (option.option === '') {
                        hasMissingOption = true;
                    }
                });

                if (!hasOneCorrect) {
                    Alert(`Part B must have at least one correct choice in question ${problemIndex + 1}`);
                    return;
                }

                if (hasMissingOption) {
                    Alert(`Part B option is empty in question ${problemIndex + 1}`);
                    return;
                }
            }

            // Equation Editor
            if (problem.questionType === 'equationEditor') {
                if (problem.correctEquations[0] === '') {
                    Alert('Correct equation cannot be empty.');
                    return;
                }
            }

            // Match table grid
            if (problem.questionType === 'matchTableGrid') {
                let missingColHeader = false;
                let missingRowHeader = false;
                let missingCorrect = false;

                problem.matchTableHeaders.map((header: string) => {
                    if (header === '') {
                        missingColHeader = true;
                    }
                });

                if (missingColHeader) {
                    Alert(`Column header cannot be empty in question ${problemIndex + 1}.`);
                    return;
                }

                problem.matchTableOptions.map((rowHeader: string) => {
                    if (rowHeader === '') {
                        missingRowHeader = true;
                    }
                });

                if (missingRowHeader) {
                    Alert(`Row header cannot be empty in question ${problemIndex + 1}.`);
                    return;
                }

                problem.matchTableChoices.map((row: any) => {
                    let hasCorrect = false;

                    if (missingCorrect) {
                        return;
                    }

                    row.map((option: boolean) => {
                        if (option) {
                            hasCorrect = true;
                        }
                    });

                    if (!hasCorrect) {
                        missingCorrect = true;
                    }
                });

                if (missingCorrect) {
                    Alert(`Each row must have a correct response in question ${problemIndex + 1}.`);
                    return;
                }
            }

            // Check if any regrade choice has not been selected
            modifiedCorrectAnswerProblems.map((prob: boolean, index: number) => {
                if (prob && regradeChoices[index] === '') {
                    Alert('Select regrade option for any questions with modified correct answers.');
                    error = true;
                }
            });
        });

        if (error) {
            setLoadingAfterModifyingQuiz(false);
            return;
        }

        // Update title as well
        handleUpdateContent();

        // Points should be a string not a number

        const sanitizeProblems = problems.map((prob: any) => {
            const sanitizedProb = JSON.parse(JSON.stringify(prob), omitTypename);

            delete sanitizedProb.problemIndex;
            return {
                ...sanitizedProb,
                points: prob.points.toString(),
                maxCharCount: prob.questionType === 'freeResponse' ? Number(prob.maxCharCount) : null,
            };
        });

        const durationMinutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;

        let variables = {
            cueId: props.cue._id,
            quiz: {
                instructions,
                problems: sanitizeProblems,
                headers: JSON.stringify(headers),
                duration: timer ? durationMinutes.toString() : null,
                shuffleQuiz,
            },
            modifiedCorrectAnswers: modifiedCorrectAnswerProblems.map((o: any) => (o ? 'yes' : 'no')),
            regradeChoices: regradeChoices.map((choice: string) => (choice === '' ? 'none' : choice)),
        };

        const sanitizeWithoutTypename = omitDeep(variables, '__typename');

        server
            .mutate({
                mutation: modifyQuiz,
                variables: sanitizeWithoutTypename,
            })
            .then((res: any) => {
                if (res.data && res.data.quiz.modifyQuiz) {
                    server
                        .query({
                            query: getQuiz,
                            variables: {
                                quizId,
                            },
                        })
                        .then((res) => {
                            if (res.data && res.data.quiz.getQuiz) {
                                setProblems(lodash.cloneDeep(res.data.quiz.getQuiz.problems));
                                const deepCopy = lodash.cloneDeep(res.data.quiz.getQuiz.problems);
                                setUnmodifiedProblems(deepCopy);
                                setInstructions(
                                    res.data.quiz.getQuiz.instructions ? res.data.quiz.getQuiz.instructions : ''
                                );
                                setHeaders(
                                    res.data.quiz.getQuiz.headers ? JSON.parse(res.data.quiz.getQuiz.headers) : {}
                                );
                                setLoadingAfterModifyingQuiz(false);
                                setDuration(res.data.quiz.getQuiz.duration * 60);
                                setShuffleQuiz(
                                    res.data.quiz.getQuiz.shuffleQuiz ? res.data.quiz.getQuiz.shuffleQuiz : false
                                );
                                Alert('Quiz updated successfully');
                                // Refresh all subscriber scores since there could be regrades
                                props.reloadStatuses();
                            }
                        });
                }
            })
            .catch((err) => console.log(err));
    };

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
                        marginBottom: 25,
                    }}
                >
                    {isOwner || !props.cue.channelId ? (
                        <TextareaAutosize
                            value={title}
                            style={{
                                fontFamily: 'overpass',
                                fontSize: 15,
                                padding: 10,
                                marginTop: 25,
                                marginBottom: 0,
                                maxWidth: Dimensions.get('window').width < 768 ? '100%' : 400,
                                minWidth: Dimensions.get('window').width < 768 ? '100%' : 400,
                                border: '1px solid #cccccc',
                                borderRadius: 2,
                                width: '100%',
                            }}
                            placeholder={'Title'}
                            onChange={(e: any) => setTitle(e.target.value)}
                            minRows={1}
                        />
                    ) : (
                        <Text
                            style={{
                                fontSize: 20,
                                paddingRight: 15,
                                paddingTop: 20,
                                marginBottom: 10,
                                maxWidth: Dimensions.get('window').width < 768 ? '100%' : 300,
                                fontWeight: '600',
                                width: '100%',
                                fontFamily: 'Inter',
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
                                    justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
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
                                            showTwoMinutesAlert();
                                        }

                                        const hours = Math.floor(remainingTime / 3600);
                                        const minutes = Math.floor((remainingTime % 3600) / 60);
                                        const seconds = remainingTime % 60;
                                        return `${hours}h ${minutes}m ${seconds}s`;
                                    }}
                                    isPlaying={true}
                                    duration={duration}
                                    initialRemainingTime={initDuration}
                                    colors="#007AFF"
                                />
                            </View>
                        ) : null
                    ) : null
                ) : props.cue.graded ? null : (
                    <View
                        style={{
                            marginLeft: 15,
                            marginTop: 20,
                        }}
                    >
                        {isOwner || !props.cue.channelId ? (
                            <TouchableOpacity
                                onPress={() => clearAll()}
                                style={{
                                    borderRadius: 15, // marginLeft: 15,
                                    marginTop: 5,
                                }}
                            >
                                <Text
                                    style={{
                                        lineHeight: 34,
                                        textTransform: 'capitalize',
                                        fontSize: 15,
                                        fontFamily: 'Inter',
                                        color: '#000',
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
            <View style={{ flex: 1 }}>
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
                        textAlign: 'center',
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
            <View
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}
            >
                <View style={{}}>
                    {quizAttempted ? (
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 20,
                            }}
                        >
                            <Ionicons name="checkmark-outline" size={22} color={'#53BE68'} />
                            <Text style={{ fontSize: 15, paddingLeft: 5 }}>
                                Submitted at {moment(new Date(latestSubmission.submittedAt)).format('MMMM Do, h:mm a')}
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 20,
                            }}
                        >
                            <Ionicons name="Alert-circle-outline" size={22} color={'#D91D56'} />
                            <Text style={{ fontSize: 15, paddingLeft: 5 }}>Not Attempted</Text>
                        </View>
                    )}
                </View>

                {props.cue.graded && props.cue.releaseSubmission ? (
                    <View style={{}}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                paddingTop: 40,
                                paddingBottom: 15,
                            }}
                        >
                            {PreferredLanguageText('score')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                borderRadius: 15,
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
                    alignItems: 'center',
                    paddingTop: Dimensions.get('window').width < 768 ? 10 : 30,
                    paddingBottom: 20,
                    justifyContent: 'space-between',
                    maxWidth: 1024,
                    alignSelf: 'center',
                }}
            >
                {props.cue.submittedAt && props.cue.submittedAt !== '' && viewSubmission ? (
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 0,
                        }}
                    >
                        <Ionicons name="checkmark-outline" size={22} color={'#53BE68'} />
                        <Text style={{ fontSize: 15, paddingLeft: 5 }}>
                            {moment(new Date(props.cue.submittedAt)).format('MMMM Do, h:mm a')}
                        </Text>
                    </View>
                ) : null}

                {/* View Submission button here */}
                {props.cue.graded && props.cue.releaseSubmission && viewSubmission ? (
                    <View style={{ paddingLeft: 20 }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                            }}
                        >
                            {PreferredLanguageText('score')}
                        </Text>
                        <Text
                            style={{
                                fontSize: 25,
                                fontFamily: 'inter',
                                color: '#2f2f3c',
                                borderRadius: 15,
                            }}
                        >
                            {props.cue.score}%
                        </Text>
                    </View>
                ) : null}

                {props.cue.submittedAt && props.cue.submittedAt !== '' && !props.cue.releaseSubmission ? (
                    <View style={{ flexDirection: 'row' }}>
                        {viewSubmission ? (
                            props.cue.releaseSubmission ||
                            (!allowLateSubmission && new Date() > deadline) ||
                            (allowLateSubmission && new Date() > availableUntil) ? null : (
                                <TouchableOpacity
                                    onPress={async () => {
                                        setViewSubmission(false);
                                    }}
                                    style={{
                                        // overflow: 'hidden',
                                        // height: 35,
                                        // marginTop: 15,
                                        justifyContent: 'center',
                                        flexDirection: 'row',
                                    }}
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
                                    overflow: 'hidden',
                                    height: 35,
                                    justifyContent: 'center',
                                    flexDirection: 'row',
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
                    marginLeft: Dimensions.get('window').width < 768 ? 'none' : 'auto',
                }}
            >
                <Text
                    style={{
                        marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                        fontFamily: 'Inter',
                        fontSize: 15,
                    }}
                >
                    {problems.length} {problems.length === 1 ? 'Question' : 'Questions'}
                </Text>

                <Text
                    style={{
                        marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                        fontFamily: 'Inter',
                        fontSize: 15,
                    }}
                >
                    {totalQuizPoints} Points
                </Text>

                {duration === 0 ? (
                    <Text
                        style={{
                            marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                            fontFamily: 'Inter',
                            fontSize: 15,
                        }}
                    >
                        No Time Limit
                    </Text>
                ) : (
                    <Text
                        style={{
                            marginRight: Dimensions.get('window').width < 768 ? 10 : 30,
                            fontFamily: 'Inter',
                            fontSize: 15,
                        }}
                    >
                        {hours} H {minutes} min
                    </Text>
                )}

                {!isOwner ? (
                    <Text style={{ fontFamily: 'Inter', fontSize: 15 }}>
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
                    maxWidth: 1024,
                    alignSelf: 'center',
                    minHeight: 475,
                    paddingTop: 0,
                }}
            >
                {!props.showOriginal || loading ? null : isQuiz ? (
                    isQuizTimed && !isOwner ? (
                        initiatedAt ? (
                            <View
                                style={{
                                    width: '100%',
                                    flexDirection: 'column',
                                    paddingTop: Dimensions.get('window').width < 768 ? 0 : 25,
                                }}
                            >
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
                                    shuffleQuizAttemptOrder={shuffleQuizAttemptOrder}
                                    setShuffleQuizAttemptOrder={(order: any[]) => setShuffleQuizAttemptOrder(order)}
                                />
                                {renderSubmissionDraftStatus()}
                                {renderFooter()}
                            </View>
                        ) : (
                            <View style={{}}>
                                <View style={{}}>
                                    <TouchableOpacity
                                        onPress={() => initQuiz()}
                                        style={{
                                            // overflow: 'hidden',
                                            // height: 35,
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                            marginVertical: 50,
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
                                            {PreferredLanguageText('startQuiz')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )
                    ) : (
                        <View
                            style={{
                                width: '100%',
                                flexDirection: 'column',
                                paddingTop: Dimensions.get('window').width < 768 ? 0 : 25,
                            }}
                        >
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
                                shuffleQuizAttemptOrder={shuffleQuizAttemptOrder}
                                setShuffleQuizAttemptOrder={(order: any[]) => setShuffleQuizAttemptOrder(order)}
                            />
                            {renderSubmissionDraftStatus()}
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
                                    file: { attributes: { controlsList: 'nodownload' } },
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
                                style={{ height: '70vh' }}
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
                            {renderSubmissionDraftStatus()}
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
                            <div className="webviewer" ref={RichText} style={{ height: '70vh' }}></div>
                            {renderSubmissionDraftStatus()}
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
                                    {renderSubmissionDraftStatus()}
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
                <div
                    className="htmlParser fr-view"
                    style={{ width: '100%', color: 'black', marginTop: Dimensions.get('window').width < 768 ? 0 : 25 }}
                >
                    {parser(initialOriginal)}
                </div>
            );
        }

        return (
            <View style={{ width: '100%', marginTop: Dimensions.get('window').width < 768 ? 15 : 25 }}>
                <View
                    key={userId.toString() + isOwner.toString()}
                    style={{
                        borderColor: '#cccccc',
                        borderWidth: 1,
                        borderRadius: 2,
                    }}
                >
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
                            scrollableContainer: '#scroll_container',
                            toolbarStickyOffset: 0,
                            // TOOLBAR
                            toolbarButtons: FULL_FLEDGED_TOOLBAR_BUTTONS(Dimensions.get('window').width),
                            toolbarSticky: true,
                            events: {
                                'froalaEditor.initialized': function (e: any, editor: any) {
                                    if (!isOwner && props.cue.channelId && props.cue.channelId !== '') {
                                        editor.edit.off();
                                    }
                                },
                                'file.beforeUpload': function (files: any) {
                                    // Return false if you want to stop the file upload.
                                    fileUploadEditor(files, false);

                                    return false;
                                },
                                'video.beforeUpload': function (videos: any) {
                                    videoUploadEditor(videos, false);

                                    return false;
                                },
                                'image.beforeUpload': function (images: any) {
                                    if (images[0].size > 5 * 1024 * 1024) {
                                        Alert('Image size must be less than 5mb.');
                                        return false;
                                    }

                                    return true;
                                },
                            },
                        }}
                    />
                </View>
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
                                        fontSize: 15,
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
                        <View
                            style={{ width: '100%' }}
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
                                        fontSize: 15,
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
                                key={
                                    JSON.stringify(viewSubmission) +
                                    JSON.stringify(attempt) +
                                    JSON.stringify(props.showOriginal) +
                                    JSON.stringify(submissionAttempts)
                                }
                                style={{ height: '70vh' }}
                            ></div>
                        </View>
                    )
                ) : (
                    <View style={{ width: '100%' }} key={JSON.stringify(attempt)}>
                        {viewSubmissionTab === 'mySubmission' ? (
                            <div className="htmlParser fr-view" style={{ width: '100%', color: 'black' }}>
                                {parser(attempt.html)}
                            </div>
                        ) : (
                            <div
                                className="webviewer"
                                ref={submissionViewerRef}
                                style={{ height: '70vh' }}
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
        if (submissionImported) return null;

        return (
            <View
                key={userId.toString() + isOwner.toString()}
                style={{
                    marginTop: Dimensions.get('window').width < 768 ? 15 : 0,
                    borderColor: '#cccccc',
                    borderWidth: 1,
                    borderRadius: 2,
                }}
            >
                <FroalaEditor
                    ref={editorRef}
                    model={submissionDraft}
                    onModelChange={(model: any) => {
                        if (submissionImported || submissionUrl) return;

                        setSubmissionDraft(model);
                    }}
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
                        scrollableContainer: '#scroll_container',
                        // TOOLBAR
                        toolbarButtons: FULL_FLEDGED_TOOLBAR_BUTTONS(Dimensions.get('window').width),
                        toolbarSticky: true,
                        events: {
                            'froalaEditor.initialized': function (e: any, editor: any) {
                                if (!isOwner && props.cue.channelId && props.cue.channelId !== '') {
                                    editor.edit.off();
                                }
                            },
                            'file.beforeUpload': function (files: any) {
                                // Return false if you want to stop the file upload.

                                fileUploadEditor(files, true);

                                return false;
                            },
                            'video.beforeUpload': function (videos: any) {
                                videoUploadEditor(videos, true);

                                return false;
                            },
                            'image.beforeUpload': function (images: any) {
                                if (images[0].size > 5 * 1024 * 1024) {
                                    Alert('Image size must be less than 5mb.');
                                    return false;
                                }

                                return true;
                            },
                        },
                    }}
                />
            </View>
        );
    };

    console.log('Subscribers', subscribers);
    console.log('LimitedShare', limitedShares);

    /**
     * @description Share with component
     */
    const renderShareWithOptions = () => {
        return props.cue.channelId !== '' && isOwner ? (
            <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        paddingBottom: 15,

                        flex: 1,
                        flexDirection: 'row',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
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
                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                }}
                            >
                                <View
                                    style={{
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
                                            false: '#fff',
                                            true: '#000',
                                        }}
                                        activeThumbColor="white"
                                    />
                                </View>
                            </View>
                        </View>
                    ) : null}
                    {limitedShares && subscribers.length !== 0 ? (
                        <View
                            style={{
                                flexDirection: 'column',
                                maxWidth: 400,
                            }}
                        >
                            <View
                                style={{
                                    padding: 5,
                                    height: 'auto',
                                    minWidth: 300,
                                }}
                            >
                                <MobiscrollSelect
                                    value={selected}
                                    rows={subscribers.length}
                                    data={subscribers}
                                    selectMultiple={true}
                                    theme="ios"
                                    themeVariant="light"
                                    touchUi={true}
                                    responsive={{
                                        small: {
                                            display: 'bubble',
                                        },
                                        medium: {
                                            touchUi: false,
                                        },
                                    }}
                                    onChange={(val: any) => {
                                        setSelected(val.value);
                                    }}
                                    placeholder="Select..."
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
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
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
                                        height: 40,
                                        marginRight: 10,
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
                                            false: '#fff',
                                            true: '#000',
                                        }}
                                        activeThumbColor="white"
                                    />
                                </View>
                            )
                        ) : (
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#000000',
                                        textTransform: 'uppercase',
                                        fontFamily: 'Inter',
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
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#1F1F1F',
                                    textAlign: 'right',
                                    paddingRight: 10,
                                    fontFamily: 'Inter',
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
                                        placeholder: 'Please Select...',
                                    }}
                                    onChange={(event: any) => {
                                        const date = new Date(event.value);
                                        setInitiateAt(date);
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
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#1F1F1F',
                                        textAlign: 'left',
                                        fontFamily: 'Inter',
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
                                marginLeft: width < 768 ? 0 : 'auto',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#1F1F1F',
                                    textAlign: 'right',
                                    paddingRight: 10,
                                    fontFamily: 'Inter',
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
                                        placeholder: 'Please Select...',
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
                                            touchUi: true,
                                        },
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false,
                                        },
                                    }}
                                />
                            ) : (
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: '#1F1F1F',
                                        textAlign: 'left',
                                        fontFamily: 'Inter',
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
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
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
                                    height: 40,
                                    marginRight: 10,
                                }}
                            >
                                <Switch
                                    disabled={!isOwner}
                                    value={graded}
                                    onValueChange={() => setGraded(!graded)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#fff',
                                        true: '#000',
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

                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                alignItems: 'center',
                            }}
                        >
                            {isOwner ? (
                                <TextInput
                                    value={gradeWeight}
                                    style={{
                                        width: '25%',
                                        borderColor: '#cccccc',
                                        borderWidth: 1,
                                        borderRadius: 2,
                                        fontSize: 15,
                                        padding: 15,
                                        paddingVertical: 10,
                                        marginTop: 0,
                                        backgroundColor: '#fff',
                                    }}
                                    placeholder={'0-100'}
                                    onChangeText={(val) => setGradeWeight(val)}
                                    placeholderTextColor={'#1F1F1F'}
                                />
                            ) : null}
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#1F1F1F',
                                    textAlign: 'left',
                                    paddingRight: 10,
                                    fontFamily: 'Inter',
                                }}
                            >
                                {!isOwner ? gradeWeight : null} {PreferredLanguageText('percentageOverall')}
                            </Text>
                        </View>
                    ) : !isOwner ? (
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#1F1F1F',
                                textAlign: 'left',
                                paddingRight: 10,
                                fontFamily: 'Inter',
                            }}
                        >
                            0%
                        </Text>
                    ) : null}
                </View>
            </View>
        ) : null;
    };

    const renderTotalPointsInput = () => {
        return submission && !isQuiz ? (
            <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        paddingBottom: 15,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        Total points
                    </Text>
                </View>
                <View>
                    <View
                        style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
                            alignItems: 'center',
                        }}
                    >
                        {isOwner ? (
                            <TextInput
                                value={totalPoints}
                                style={{
                                    width: 120,
                                    borderColor: '#ccc',
                                    borderWidth: 1,
                                    borderRadius: 2,
                                    fontSize: 15,
                                    padding: 15,
                                    paddingVertical: 10,
                                    marginTop: 0,
                                    backgroundColor: '#fff',
                                }}
                                placeholder={''}
                                onChangeText={(val) => {
                                    if (Number.isNaN(Number(val))) return;
                                    setTotalPoints(val);
                                }}
                                placeholderTextColor={'#1F1F1F'}
                            />
                        ) : (
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#1F1F1F',
                                    textAlign: 'left',
                                    paddingRight: 10,
                                    fontFamily: 'Inter',
                                }}
                            >
                                {totalPoints ? totalPoints : '100'}
                            </Text>
                        )}
                    </View>
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
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
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
                                    height: 40,
                                    marginRight: 10,
                                }}
                            >
                                <Switch
                                    disabled={!isOwner}
                                    value={allowLateSubmission}
                                    onValueChange={() => setAllowLateSubmission(!allowLateSubmission)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#fff',
                                        true: '#000',
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

                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#1F1F1F',
                                    textAlign: 'left',
                                    paddingRight: 10,
                                    fontFamily: 'Inter',
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
                                        placeholder: 'Please Select...',
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
                                            touchUi: true,
                                        },
                                        // small: {
                                        //     controls: ['date', 'time'],
                                        //     display: 'anchored',
                                        //     touchUi: true
                                        // },
                                        medium: {
                                            controls: ['date', 'time'],
                                            display: 'anchored',
                                            touchUi: false,
                                        },
                                    }}
                                />
                            ) : null}
                        </View>
                    ) : !isOwner ? (
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#1F1F1F',
                                textAlign: 'left',
                                paddingRight: 10,
                                fontFamily: 'Inter',
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
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Allowed Attempts
                        </Text>
                    </View>

                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',

                            justifyContent: Dimensions.get('window').width < 768 ? 'flex-start' : 'flex-end',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#1F1F1F',
                                textAlign: 'right',
                                paddingRight: 10,
                                fontFamily: 'Inter',
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
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Unlimited Attempts
                        </Text>
                    </View>
                    <View>
                        <View
                            style={{
                                height: 40,
                                marginRight: 10,
                                flexDirection: 'row',
                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
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
                                    false: '#fff',
                                    true: '#000',
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

                                    alignItems: 'center',
                                }}
                            >
                                <Text style={styles.text}>Allowed attempts</Text>
                                <TextInput
                                    value={allowedAttempts}
                                    style={{
                                        width: '25%',
                                        borderColor: '#ccc',
                                        borderWidth: 1,
                                        borderRadius: 2,
                                        fontSize: 15,
                                        marginLeft: 10,
                                        padding: 15,
                                        paddingVertical: 10,
                                        marginTop: 0,
                                        backgroundColor: '#fff',
                                    }}
                                    placeholder={''}
                                    onChangeText={(val) => {
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
                    borderColor: '#f2f2f2',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,

                        paddingBottom: width < 768 ? 15 : 0,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
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
                            }}
                        >
                            <View style={{ width: '85%' }}>
                                <View style={styles.colorBar}>
                                    <TouchableOpacity style={styles.allGrayOutline} onPress={() => {}}>
                                        <Text
                                            style={{
                                                color: '#000000',
                                                lineHeight: 20,
                                                fontSize: 13,
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
                            }}
                        >
                            <View style={{}}>
                                {addCustomCategory ? (
                                    <View style={styles.colorBar}>
                                        <TextInput
                                            value={customCategory}
                                            style={{
                                                borderColor: '#cccccc',
                                                borderWidth: 1,
                                                borderRadius: 2,
                                                fontSize: 15,
                                                padding: 10,
                                                backgroundColor: '#fff',
                                            }}
                                            placeholder={'Enter Category'}
                                            onChangeText={(val) => {
                                                setCustomCategory(val);
                                            }}
                                            placeholderTextColor={'#1F1F1F'}
                                        />
                                    </View>
                                ) : (
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
                                                    display: 'bubble',
                                                },
                                                medium: {
                                                    touchUi: false,
                                                },
                                            }}
                                            onChange={(val: any) => {
                                                if (!initializedCustomCategories) return;
                                                setCustomCategory(val.value);
                                            }}
                                        />
                                    </label>
                                )}
                            </View>
                            <View style={{ paddingLeft: 20 }}>
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
                                    style={{}}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'right',
                                            lineHeight: 20,
                                            width: '100%',
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
                    borderColor: '#f2f2f2',
                    marginBottom: 40,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,

                        paddingBottom: width < 768 ? 15 : 0,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        {PreferredLanguageText('priority')}
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                    }}
                >
                    <View style={{ width: '100%' }}>
                        <ScrollView
                            style={{ ...styles.colorBar, height: 20 }}
                            horizontal={true}
                            showsHorizontalScrollIndicator={false}
                        >
                            {colorChoices.map((c: string, i: number) => {
                                return (
                                    <View
                                        style={color == i ? styles.colorContainerOutline : styles.colorContainer}
                                        key={i.toString()}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                backgroundColor: colorChoices[i],
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
                    paddingTop: 40,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flex: 1,

                        paddingBottom: width < 768 ? 15 : 0,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: '#000000',
                            fontFamily: 'Inter',
                        }}
                    >
                        Forward
                    </Text>
                </View>
                <View
                    style={{
                        flexDirection: 'row',

                        alignItems: 'center',
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
                                    display: 'bubble',
                                },
                                medium: {
                                    touchUi: false,
                                },
                            }}
                            data={channelOptions.map((channel: any) => {
                                return {
                                    value: channel._id,
                                    text: channel.name,
                                };
                            })}
                        />
                    </label>

                    <View style={{ paddingLeft: 20 }}>
                        <TouchableOpacity
                            disabled={shareWithChannelId === 'None'}
                            onPress={() => {
                                Alert(
                                    'Forward cue?',
                                    'All unsaved changes in Details will also reflect in the forwarded cue.',
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
                                            onPress: () => {
                                                shareCue();
                                            },
                                        },
                                    ]
                                );
                            }}
                            style={{}}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    lineHeight: 20,
                                    width: '100%',
                                }}
                            >
                                <Ionicons
                                    name={'share-outline'}
                                    size={18}
                                    color={shareWithChannelId === 'None' ? '#797979' : '#000'}
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
                    flexDirection: 'column',
                }}
            >
                <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingTop: 40 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            flex: 1,
                            paddingBottom: 15,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 15,
                                color: '#000000',
                                fontFamily: 'Inter',
                            }}
                        >
                            Remind
                        </Text>
                    </View>
                    <View
                        style={{
                            // width: "100%",
                            height: 40,
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
                                false: '#fff',
                                true: '#000',
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
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Repeat Reminder
                            </Text>
                        </View>
                        <View style={{}}>
                            <View
                                style={{
                                    height: 40,
                                    alignSelf: width < 768 ? 'flex-start' : 'flex-end',
                                }}
                            >
                                <Switch
                                    value={!shuffle}
                                    onValueChange={() => setShuffle(!shuffle)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#fff',
                                        true: '#000',
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
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            color: '#1F1F1F',
                                            textAlign: 'right',
                                            paddingRight: 10,
                                            fontFamily: 'Inter',
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
                                                    display: 'bubble',
                                                },
                                                medium: {
                                                    touchUi: false,
                                                },
                                            }}
                                            data={timedFrequencyOptions.map((freq: any) => {
                                                return {
                                                    value: freq.value,
                                                    text: freq.label,
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
                                                fontSize: 13,
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
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <View
                                            style={{
                                                height: 5,
                                            }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                color: '#1F1F1F',
                                                textAlign: 'right',
                                                paddingRight: 10,
                                                marginTop: 5,
                                                fontFamily: 'Inter',
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
                                                placeholder: 'Please Select...',
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
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: '#000000',
                                    fontFamily: 'Inter',
                                }}
                            >
                                Remind Indefinitely
                            </Text>
                        </View>
                        <View>
                            <View
                                style={{
                                    height: 40,
                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                    flexDirection: 'row',
                                }}
                            >
                                <Switch
                                    value={playChannelCueIndef}
                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                    style={{ height: 20 }}
                                    trackColor={{
                                        false: '#fff',
                                        true: '#000',
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
                                            placeholder: 'Please Select...',
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
                            )}
                        </View>
                    </View>
                ) : null}
            </View>
        );
    };

    const renderSubmissionDraftStatus = () => {
        if (isOwner) {
            return null;
        }

        const format = moment(submissionSavedAt).format('h:mm a');

        if (failedToSaveSubmission) {
            return (
                <View
                    style={{
                        paddingVertical: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="close-outline" color={'#F94144'} size={22} />
                    <Text
                        style={{
                            fontFamily: 'overpass',
                            paddingLeft: 5,
                            paddingTop: 4,
                            fontSize: 15,
                        }}
                    >
                        Failed to save. Last saved at {format}. Check Internet connection.
                    </Text>
                </View>
            );
        } else {
            return (
                <View
                    style={{
                        paddingVertical: 20,
                        flexDirection: 'row',
                    }}
                >
                    <Ionicons name="checkmark-outline" color={'#35AC78'} size={22} />
                    <Text
                        style={{
                            fontFamily: 'overpass',
                            paddingLeft: 5,
                            paddingTop: 4,
                            fontSize: 15,
                        }}
                    >
                        Saved at {format}
                    </Text>
                </View>
            );
        }
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

                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        // height: 50,
                        paddingTop: 10,
                        backfaceVisibility: 'hidden',
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
                                isSubmitting ||
                                user.email === disableEmailId
                            }
                            onPress={() => handleSubmit()}
                            style={{ borderRadius: 15, backfaceVisibility: 'hidden' }}
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
                                {(!allowLateSubmission && new Date() > deadline) ||
                                (allowLateSubmission && new Date() > availableUntil) ||
                                (isQuiz && remainingAttempts === 0) ||
                                (props.cue.releaseSubmission && !props.cue.graded)
                                    ? 'Submission Ended'
                                    : props.cue.graded && props.cue.releaseSubmission
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

    if (loading || loadingAfterModifyingQuiz || fetchingQuiz || updatingCueContent || updatingCueDetails) {
        return (
            <View
                style={{
                    width: '100%',
                    backgroundColor: 'white',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    flex: 1,
                }}
            >
                <View
                    style={{
                        flexDirection: 'column',
                        alignSelf: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            marginTop: 10,
                        }}
                    >
                        <ActivityIndicator size={20} color={'#1F1F1F'} />
                        <Text
                            style={{
                                fontSize: 16,
                                fontFamily: 'Inter',
                                marginTop: 10,
                            }}
                        >
                            Loading...
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    if (initiateAt > new Date() && !isOwner) {
        return (
            <View style={{ minHeight: Dimensions.get('window').height }}>
                <View style={{ flex: 1 }}>
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
                            textAlign: 'center',
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

                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                // paddingBottom: 50
            }}
        >
            {/* <ScrollView
                style={{
                    paddingBottom: 25,
                    height:
                        Dimensions.get('window').width < 1024
                            ? Dimensions.get('window').height - 104
                            : Dimensions.get('window').height - 52,
                }}
                contentContainerStyle={{
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                scrollEnabled={true}
                scrollEventThrottle={1}
                keyboardDismissMode={'on-drag'}
                overScrollMode={'always'}
                nestedScrollEnabled={true}
            > */}
            <div
                style={{
                    top: 0,
                    position: 'absolute',
                    overflow: 'auto',
                    width: '100%',
                    height:
                        width < 768
                            ? Dimensions.get('window').height - (64 + 60)
                            : // : width < 1024
                              // ? Dimensions.get('window').height - (64 + 68)
                              Dimensions.get('window').height - 64,
                    maxHeight:
                        width < 768
                            ? Dimensions.get('window').height - (64 + 60)
                            : // : width < 1024
                              // ? Dimensions.get('window').height - (64 + 68)
                              Dimensions.get('window').height - 64,

                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
                id="scroll_container"
            >
                {props.cue.channelId && props.cue.channelId !== '' ? (
                    <View
                        style={{
                            width: '100%',
                            flexDirection: 'row',
                            maxWidth: 1024,
                            alignSelf: 'center',
                            paddingHorizontal: paddingResponsive(),
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
                                    fontSize: 20,
                                    color: '#000',
                                    lineHeight: 20,
                                    paddingTop: 1,
                                    marginBottom: 5,
                                    marginTop: 20,
                                    fontFamily: 'Inter',
                                    marginRight: 20,
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
                                        fontSize: 20,
                                        fontFamily: 'Inter',
                                        textAlign: 'center',
                                    }}
                                >
                                    LATE
                                </Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}
                <View
                    style={{
                        width: '100%',
                        maxWidth: 1024,
                        alignSelf: 'center',
                        paddingHorizontal: paddingResponsive(),
                    }}
                >
                    {props.showOptions ||
                    props.showComments ||
                    isOwner ||
                    props.showOriginal ||
                    props.viewStatus ||
                    !submission ||
                    isQuiz
                        ? null
                        : renderSubmissionHistory()}
                    {props.showOptions || props.showComments ? null : (
                        <View>
                            <View style={{ flexDirection: 'column', width: '100%' }}>
                                {renderQuizTimerOrUploadOptions()}
                            </View>
                            {!props.showOriginal && submissionImported && !isQuiz && !viewSubmission ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            alignSelf: 'flex-start',
                                            marginLeft: 0,
                                            marginTop: 10,
                                            marginBottom: 10,
                                        }}
                                    >
                                        <TextareaAutosize
                                            value={submissionTitle}
                                            style={{
                                                fontFamily: 'overpass',
                                                fontSize: 15,
                                                padding: 10,
                                                marginBottom: 0,
                                                maxWidth: 300,
                                                minWidth: 300,
                                                border: '1px solid #cccccc',
                                                borderRadius: 2,
                                                width: '100%',
                                            }}
                                            placeholder={'Submission Title'}
                                            onChange={(e: any) => setSubmissionTitle(e.target.value)}
                                            minRows={1}
                                        />
                                    </View>
                                    {props.cue.submittedAt && props.cue.submittedAt !== '' ? (
                                        <View
                                            style={{
                                                marginLeft: 15,
                                                marginTop: 20,
                                                alignSelf: 'flex-end',
                                            }}
                                        >
                                            {props.cue.releaseSubmission ? null : (
                                                <TouchableOpacity
                                                    onPress={() => clearAll()}
                                                    style={{
                                                        borderRadius: 15,
                                                        marginTop: 5,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            lineHeight: 34,
                                                            textTransform: 'capitalize',
                                                            fontSize: 15,
                                                            fontFamily: 'Inter',
                                                            color: '#000',
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
                                                borderRadius: 15,
                                                marginLeft: 15,
                                                marginTop: 5,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    lineHeight: 34,
                                                    textTransform: 'capitalize',
                                                    fontSize: 15,
                                                    fontFamily: 'Inter',
                                                    color: '#000',
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
                            maxWidth: 1024,
                            alignSelf: 'center',
                            paddingLeft: Dimensions.get('window').width < 768 ? 12 : 15,
                        }}
                    >
                        <Collapse isOpened={props.showOptions}>
                            <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {props.cue.channelId ? (
                                    <View
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        {renderShareWithOptions()}
                                        {renderSubmissionRequiredOptions()}
                                        {renderGradeOptions()}
                                        {renderLateSubmissionOptions()}
                                        {renderTotalPointsInput()}
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
                </View>
            </div>
            {showEquationEditor ? (
                <FormulaGuide
                    value={equation}
                    onChange={setEquation}
                    show={showEquationEditor}
                    onClose={() => setShowEquationEditor(false)}
                    onInsertEquation={insertEquation}
                />
            ) : null}
            {showInsertYoutubeVideosModal ? (
                <InsertYoutubeModal
                    show={showInsertYoutubeVideosModal}
                    onClose={() => setShowInsertYoutubeVideosModal(false)}
                    insertVideo={handleAddVideo}
                />
            ) : null}
        </View>
    );
};

export default UpdateControls;

const styles: any = StyleSheet.create({
    footer: {
        width: '100%',

        display: 'flex',
        flexDirection: 'row',
        marginTop: Dimensions.get('window').width < 768 ? 40 : 80,
        marginBottom: Dimensions.get('window').width < 768 ? 40 : 80,
        lineHeight: 18,
    },
    colorContainer: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
    },
    colorContainerOutline: {
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,

        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1F1F1F',
    },
    input: {
        width: '100%',
        borderBottomColor: '#f2f2f2',
        borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        // marginTop: 5,
        marginBottom: 20,
        maxWidth: 210,
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',

        lineHeight: 20,
    },
    all: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
        color: '#000000',
        fontWeight: 'bold',
        height: 25,
        paddingHorizontal: Dimensions.get('window').width < 768 ? 12 : 15,

        lineHeight: 25,
        fontFamily: 'overpass',
        textTransform: 'uppercase',
    },
    allGrayFill: {
        fontSize: Dimensions.get('window').width < 768 ? 12 : 14,
        color: '#fff',
        paddingHorizontal: Dimensions.get('window').width < 768 ? 12 : 15,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        lineHeight: 25,
        height: 25,
        fontFamily: 'inter',
        textTransform: 'uppercase',
    },
    allGrayOutline: {
        fontSize: 13,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,

        borderRadius: 1,
        borderWidth: 1,
        borderColor: '#1F1F1F',
        lineHeight: 20,
    },
});
