// REACT
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { StyleSheet, Switch, TextInput, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API
import { fetchAPI } from '../graphql/FetchAPI';
import {
    createCue,
    createQuiz,
    getChannelCategories,
    getChannels,
    getSharedWith
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';
import Alert from '../components/Alert';
import QuizCreate from './QuizCreate';
import TeXToSVG from 'tex-to-svg';
import moment from 'moment';
import ReactPlayer from 'react-player';
import WebViewer from '@pdftron/pdfjs-express';
import { Select, Datepicker as MobiscrollDatePicker } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import TextareaAutosize from 'react-textarea-autosize';
import { Editor } from '@tinymce/tinymce-react';
import FormulaGuide from './FormulaGuide';
import Books from './Books';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { handleFileUploadEditor } from '../helpers/FileUpload';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';

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
// Include special components if required.
// import FroalaEditorView from 'react-froala-wysiwyg/FroalaEditorView';

const Create: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const current = new Date();
    const [cue, setCue] = useState('<h2>Title</h2>');
    const [cueDraft, setCueDraft] = useState('');
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [shuffle, setShuffle] = useState(false);
    const [starred] = useState(false);
    const [notify, setNotify] = useState(false);
    const [color, setColor] = useState(0);
    const [frequency, setFrequency] = useState('0');
    const [customCategory, setCustomCategory] = useState('None');
    const [localCustomCategories] = useState(props.customCategories);
    const [customCategories, setCustomCategories] = useState(props.customCategories);
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [channelOptions, setChannelOptions] = useState<any[]>([]);
    const [showOptions, setShowOptions] = useState(false);
    const [channelId, setChannelId] = useState<any>('');
    const [selectedChannel, setSelectedChannel] = useState<any>('My Notes');
    const [endPlayAt, setEndPlayAt] = useState(new Date(current.getTime() + 1000 * 60 * 60));
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true);
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse();
    const [modalAnimation] = useState(new Animated.Value(0));
    let RichText: any = useRef();
    let editorRef: any = useRef();
    const [init, setInit] = useState(false);
    const [role, setRole] = useState('');
    const [allowQuizCreation, setAllowQuizCreation] = useState(false);
    const [submission, setSubmission] = useState(false);
    const [deadline, setDeadline] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 24));
    const [initiateAt, setInitiateAt] = useState(new Date(current.getTime()));
    const [allowLateSubmission, setAllowLateSubmission] = useState(false);
    const [availableUntil, setAvailableUntil] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 48));
    const [showBooks, setShowBooks] = useState(props.option === 'Browse' ? true : false);
    const [gradeWeight, setGradeWeight] = useState<any>(0);
    const [graded, setGraded] = useState(false);
    const [imported, setImported] = useState(false);
    const [url, setUrl] = useState('');
    const [type, setType] = useState('');
    const [title, setTitle] = useState('');
    const [selected, setSelected] = useState<any[]>([]);
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [isQuiz, setIsQuiz] = useState(false);
    const [problems, setProblems] = useState<any[]>([]);
    const [headers, setHeaders] = useState<any>({});
    const [creatingQuiz, setCreatingQuiz] = useState(false);
    const [timer, setTimer] = useState(false);
    const [duration, setDuration] = useState({
        hours: 1,
        minutes: 0,
        seconds: 0
    });
    const [equation, setEquation] = useState('y = x + 1');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [quizInstructions, setQuizInstructions] = useState('');
    const [initialQuizInstructions, setInitialQuizInstructions] = useState('');
    const [initialDuration, setInitialDuration] = useState(null);
    const [limitedShare, setLimitedShare] = useState(false);
    const [unlimitedAttempts, setUnlimitedAttempts] = useState(false);
    const [attempts, setAttempts] = useState('1');
    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');
    const [dimensions, setDimensions] = useState({ window, screen });
    const [userId, setUserId] = useState('');
    const width = dimensions.window.width;
    const hours: any[] = [0, 1, 2, 3, 4, 5, 6];
    const minutes: any[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    let categoriesOptions = [
        {
            value: 'None',
            text: 'None'
        }
    ];
    customCategories.map((category: any) => {
        categoriesOptions.push({
            value: category,
            text: category
        });
    });
    // Alerts
    const enterOneProblemAlert = PreferredLanguageText('enterOneProblem');
    const invalidDurationAlert = PreferredLanguageText('invalidDuration');
    const fillMissingProblemsAlert = PreferredLanguageText('fillMissingProblems');
    const enterNumericPointsAlert = PreferredLanguageText('enterNumericPoints');
    const fillMissingOptionsAlert = PreferredLanguageText('fillMissingOptions');
    const eachOptionOneCorrectAlert = PreferredLanguageText('eachOptionOneCorrect');
    const clearQuestionAlert = PreferredLanguageText('clearQuestion');
    const cannotUndoAlert = PreferredLanguageText('cannotUndo');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const enterContentAlert = PreferredLanguageText('enterContent');
    const enterTitleAlert = PreferredLanguageText('enterTitle');
    const noItemsAlert = 'Create one or more items for Drag & Drop problems.'
    const noImageAlert = 'Upload image for Hotspot problems.'
    const noHotspotsAlert = 'Create one or more markers for Hotspot problems.'
    // new alert 

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
        callback: function () {
            RichText.current.editor.selection.save();
            setShowEquationEditor(true);
        }
    });

    // HOOKS

    /**
     * @description Event listener for dimensions change
     */
    useEffect(() => {
        Dimensions.addEventListener('change', onDimensionsChange);
        return () => {
            Dimensions.removeEventListener('change', onDimensionsChange);
        };
    }, []);

    /**
     * @description Sets import options based on Cue content if JSON object
     */
    useEffect(() => {
        if (isQuiz) {
            return;
        }

        if (cue[0] === '{' && cue[cue.length - 1] === '}') {
            const obj = JSON.parse(cue);
            setImported(true);
            setUrl(obj.url);
            setType(obj.type);
            setTitle(obj.title);
        } else {
            setImported(false);
            setUrl('');
            setType('');
            setTitle('');
        }
    }, [cue, isQuiz]);

    /**
     * @description Loads webviewer for Imports
     */
    useEffect(() => {
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

        WebViewer(
            {
                licenseKey: 'xswED5JutJBccg0DZhBM',
                initialDoc: url,
                enableReadOnlyMode: true
            },
            RichText.current
        ).then(instance => {
            const { documentViewer } = instance.Core;

            if (!documentViewer) return;
            // you can now call WebViewer APIs here...
            documentViewer.addEventListener('documentLoaded', () => {
                // perform document operations
            });
        });
    }, [url, RichText, imported, type, showOptions]);

    /**
     * @description Sets user role
     */
    useEffect(() => {
        (async () => {
            const uString: any = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(uString);
            if (parsedUser._id) {
                setUserId(parsedUser._id);
            }
            if (parsedUser.role) {
                setRole(parsedUser.role);
            }
            if (parsedUser.allowQuizCreation) {
                setAllowQuizCreation(parsedUser.allowQuizCreation)
            }
        })();
    });

    /**
     * @description Loads channel categories and subscribers for Create
     */
    useEffect(() => {
        loadChannelCategoriesAndSubscribers();
    }, [channelId]);

    /**
     * @description Loads Channels for user
     */
    useEffect(() => {
        loadChannels();
    }, []);

    /**
     * @description Store draft of Cue and Quiz in Async Storage
     */
    useEffect(() => {
        if (!init) {
            return;
        }
        let saveCue = '';
        if (imported) {
            const obj = {
                type,
                url,
                title
            };
            saveCue = JSON.stringify(obj);
        } else if (isQuiz) {
            // Loop over entire quiz and save only the questions which are valid
            const validProblems = problems.filter((prob: any) => isCurrentQuestionValid(prob));

            const quiz = {
                title,
                problems: validProblems,
                timer,
                duration,
                headers,
                quizInstructions
            };

            const saveQuiz = JSON.stringify(quiz);

            storeDraft('quizDraft', saveQuiz);
        } else {
            saveCue = cue;
        }
        if (saveCue && saveCue !== '') {
            storeDraft('cueDraft', saveCue);
        } else {
            storeDraft('cueDraft', '');
        }
    }, [cue, init, type, imported, url, title, problems, timer, duration, headers, quizInstructions]);

    /**
     * @description Loads Drafts on Init
     */
    useEffect(() => {
        const getData = async () => {
            try {
                const h = await AsyncStorage.getItem('cueDraft');
                if (h && h !== '') {
                    if (h[0] === '{' && h[h.length - 1] === '}') {
                        // const obj = JSON.parse(h);
                        setImported(true);
                        // setUrl(obj.url);
                        // setType(obj.type);
                        // setTitle(obj.title);
                    } else {
                        setImported(false);
                        setUrl('');
                        setType('');
                        setTitle('');
                    }
                    setCue(h);
                    setCueDraft(h);
                    setReloadEditorKey(Math.random());
                }
                const quizDraft = await AsyncStorage.getItem('quizDraft');
                if (quizDraft !== null) {
                    const { duration, timer, problems, title, headers, quizInstructions } = JSON.parse(quizDraft);
                    setDuration(duration);
                    setInitialDuration(duration);
                    setTimer(timer);
                    setProblems(problems);
                    setTitle(title);
                    setHeaders(headers);
                    setQuizInstructions(quizInstructions);
                    setInitialQuizInstructions(quizInstructions);
                }
            } catch (e) {
                console.log(e);
            }
        };
        getData();
    }, []);

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, []);

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        setDimensions({ window, screen });
    }, []);

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

            RichText.current.editor.selection.restore();

            RichText.current.editor.html.insert(
                '<img class="rendered-math-jax" id="' +
                random +
                '" data-eq="' +
                encodeURIComponent(equation) +
                '" src="' +
                res.imgSrc +
                '"></img>'
            );
            RichText.current.editor.events.trigger('contentChanged');

            setShowEquationEditor(false);
            setEquation('');
        });
    }, [equation, RichText, RichText.current]);

    /**
     * @description Validates Quiz for Creation
     */
    const isQuizValid = useCallback(() => {
        let error = false;
        if (problems.length === 0) {
            Alert(enterOneProblemAlert);
            return;
        }
        if (timer) {
            if (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0) {
                Alert(invalidDurationAlert);
                return;
            }
        }
        problems.map(problem => {
            if (problem.question === '' || problem.question === 'formula:') {
                Alert(fillMissingProblemsAlert);
                error = true;
            }
            if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                Alert(enterNumericPointsAlert);
                error = true;
            }
            let optionFound = false;

            // If MCQ then > 2 options
            if (!problem.questionType && problem.options.length < 2) {
                Alert('Problem must have at least 2 options');
                error = true;
            }

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
        if (error) {
            // Alert
            return false;
        } else {
            return true;
        }
    }, [duration, problems]);

    /**
     * @description Handles creating new Quiz
     */
    const createNewQuiz = useCallback(() => {
        setIsSubmitting(true);
        setCreatingQuiz(true);
        let error = false;
        if (problems.length === 0) {
            Alert(enterOneProblemAlert);
            return;
        }
        if (timer) {
            if (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0) {
                Alert(invalidDurationAlert);
                return;
            }
        }
        problems.map(problem => {
            if (problem.question === '' || problem.question === 'formula:') {
                Alert(fillMissingProblemsAlert);
                error = true;
            }
            if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                Alert(enterNumericPointsAlert);
                error = true;
            }
            let optionFound = false;

            // If MCQ then > 2 options
            if (!problem.questionType && problem.options.length < 2) {
                Alert('Problem must have at least 2 options');
                setIsSubmitting(false);
                error = true;
            }

            // If MCQ, check if any options repeat:
            if (!problem.questionType || problem.questionType === 'trueFalse') {
                const keys: any = {};

                problem.options.map((option: any) => {
                    if (option.option === '' || option.option === 'formula:') {
                        Alert(fillMissingOptionsAlert);
                        setIsSubmitting(false);
                        error = true;
                    }

                    if (option.option in keys) {
                        Alert('Option repeated in a question');
                        setIsSubmitting(false);
                        error = true;
                    }

                    if (option.isCorrect) {
                        optionFound = true;
                    }

                    keys[option.option] = 1;
                });

                if (!optionFound) {
                    Alert(eachOptionOneCorrectAlert);
                    setIsSubmitting(false);
                    error = true;
                }
            }

            if (problem.questionType === 'dragdrop') {
                problem.data.filter((col: any) => {
                    // if(col.length === 0) {
                    return col.length
                    //     Alert(eachOptionOneCorrectAlert);
                    //     setIsSubmitting(false);
                    //     error = true;
                    // }
                })
                if (problem.data.length === 0) {
                    Alert(noItemsAlert);
                    setIsSubmitting(false);
                    error = true;
                }
            }

            if (problem.questionType === 'hotspot') {
                if(problem.imgUrl === '' || !problem.imgUrl) {
                    Alert(noImageAlert);
                    setIsSubmitting(false);
                    error = true;
                }
                if(!problem.hotspots || problem.hotspots.length === 0) {
                    Alert(noHotspotsAlert);
                    setIsSubmitting(false);
                    error = true;
                }
            }

        });
        if (error) {
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        // Same validation as handle create

        if ((imported || isQuiz) && title === '') {
            Alert(enterTitleAlert);
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        if ((submission || isQuiz) && deadline < new Date()) {
            Alert('Submission deadline must be in future');
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        if ((submission || isQuiz) && allowLateSubmission && availableUntil < deadline) {
            Alert('Late submission date must be set after deadline.');
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        if ((submission || isQuiz) && deadline < initiateAt) {
            Alert('Available from time must be set before deadline', '');
            setIsSubmitting(false);
            setCreatingQuiz(false);
            return;
        }

        const server = fetchAPI('');
        const durationMinutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;
        server
            .mutate({
                mutation: createQuiz,
                variables: {
                    quiz: {
                        problems,
                        duration: timer ? durationMinutes.toString() : null,
                        shuffleQuiz,
                        instructions: quizInstructions,
                        headers: JSON.stringify(headers)
                    }
                }
            })
            .then(res => {
                setCreatingQuiz(false);
                setIsSubmitting(false);
                if (res.data && res.data.quiz.createQuiz !== 'error') {
                    setCreatingQuiz(false);
                    storeDraft('quizDraft', '');
                    handleCreate(res.data.quiz.createQuiz);
                }
            })
            .catch(e => {
                console.log('Error', e);
                setCreatingQuiz(false);
            });
    }, [
        problems,
        cue,
        modalAnimation,
        customCategory,
        props.saveDataInCloud,
        isQuiz,
        gradeWeight,
        deadline,
        initiateAt,
        submission,
        imported,
        selected,
        subscribers,
        shuffle,
        frequency,
        starred,
        color,
        notify,
        title,
        type,
        url,
        timer,
        duration,
        props.closeModal,
        channelId,
        endPlayAt,
        playChannelCueIndef,
        shuffleQuiz,
        quizInstructions,
        headers,
        availableUntil,
        allowLateSubmission,
    ]);

    /**
     * @description Loads channel Categories and subscribers for Create optins
     */
    const loadChannelCategoriesAndSubscribers = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user');

        const userId = JSON.parse(uString);
        if (userId.role) {
            setRole(userId.role);
        }
        if (channelId === '') {
            setCustomCategories(localCustomCategories);
            return;
        }
        const server = fetchAPI('');
        // get categories
        server
            .query({
                query: getChannelCategories,
                variables: {
                    channelId
                }
            })
            .then(res => {
                if (res.data.channel && res.data.channel.getChannelCategories) {
                    if (role === 'instructor') {
                        const categories = new Set();

                        res.data.channel.getChannelCategories.map((category: any) => {
                            categories.add(category);
                        });

                        categories.add('Assignments');
                        categories.add('Homeworks');
                        categories.add('Quizzes');
                        categories.add('Syllabus');
                        categories.add('Textbook');
                        categories.add('Videos');

                        const withDefaultCategories = Array.from(categories);

                        setCustomCategories(withDefaultCategories);
                    } else {
                        setCustomCategories(res.data.channel.getChannelCategories);
                    }
                }
            })
            .catch(err => { });
        // get subscribers
        server
            .query({
                query: getSharedWith,
                variables: {
                    channelId,
                    cueId: null
                }
            })
            .then((res: any) => {
                if (res.data && res.data.cue.getSharedWith) {
                    const subscribers: any[] = res.data.cue.getSharedWith;

                    const format = subscribers.map((sub: any) => {
                        return {
                            value: sub.value,
                            text: sub.label
                        };
                    });

                    const withoutOwner: any = [];
                    const withoutOwnerIds: any = [];

                    format.map((i: any) => {
                        if (userId._id !== i.value) {
                            withoutOwner.push(i);
                            withoutOwnerIds.push(i.value);
                        }
                    });
                    setSubscribers(withoutOwner);
                    // clear selected
                    setSelected(withoutOwnerIds);
                }
            })
            .catch((err: any) => console.log(err));
    }, [channelId, localCustomCategories, role]);

    /**
     * @description Loads all the channels for user to create for
     */
    const loadChannels = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user');
        if (uString) {
            const user = JSON.parse(uString);
            const server = fetchAPI('');
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
                        const options = [
                            {
                                value: 'My Notes',
                                text: 'My Notes'
                            }
                        ];

                        res.data.channel.findByUserId.map((channel: any) => {
                            options.push({
                                value: channel._id,
                                text: channel.name
                            });
                        });

                        setChannelOptions(options);
                    }
                })
                .catch(err => { });
        }
        setInit(true);
    }, []);

    // Don't save question if no question entered
    const isCurrentQuestionValid = (problem: any) => {
        if (problem.question === '') {
            return false;
        }

        return true;
    };

    /**
     * @description Helper to set content in draft
     */
    const storeDraft = useCallback(async (type, value) => {
        await AsyncStorage.setItem(type, value);
    }, []);

    const setUploadResult = useCallback((uploadURL: string, uploadType: string) => {
        const obj = { url: uploadURL, type: uploadType, title };

        setImported(true);
        setCue(JSON.stringify(obj));
    }, []);

    const fileUploadEditor = useCallback(
        async (files: any) => {
            const res = await handleFileUploadEditor(false, files.item(0), userId);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type);
        },
        [userId]
    );

    const videoUploadEditor = useCallback(
        async (files: any) => {
            const res = await handleFileUploadEditor(true, files.item(0), userId);

            if (!res || res.url === '' || res.type === '') {
                return false;
            }
            setUploadResult(res.url, res.type);
        },
        [userId]
    );

    /**
     * @description Handles creation of Cue
     */
    const handleCreate = useCallback(
        async (quizId?: string) => {
            setIsSubmitting(true);

            if (isSubmitting) return;

            if (!quizId && (cue === null || cue.toString().trim() === '')) {
                Alert(enterContentAlert);
                setIsSubmitting(false);
                return;
            }

            if ((imported || isQuiz) && title === '') {
                Alert(enterTitleAlert);
                setIsSubmitting(false);
                return;
            }

            if ((submission || isQuiz) && deadline < new Date()) {
                Alert('Submission deadline must be in future');
                setIsSubmitting(false);
                return;
            }

            if ((submission || isQuiz) && deadline < initiateAt) {
                Alert('Available from time must be set before deadline', '');
                setIsSubmitting(false);
                return;
            }

            if ((submission || isQuiz) && allowLateSubmission && availableUntil < deadline) {
                Alert('Late submission date must be set after deadline.')
                setIsSubmitting(false);
                return;
            }

            let saveCue = '';
            if (quizId) {
                const obj: any = {
                    quizId,
                    title
                };
                if (timer) {
                    obj.initiatedAt = null;
                }
                saveCue = JSON.stringify(obj);
            } else if (imported) {
                const obj = {
                    type,
                    url,
                    title
                };
                saveCue = JSON.stringify(obj);
            } else {
                saveCue = cue;
            }

            // LOCAL CUE
            if (channelId === '') {
                let subCues: any = {};
                try {
                    const value = await AsyncStorage.getItem('cues');
                    if (value) {
                        subCues = JSON.parse(value);
                    }
                } catch (e) { }
                let _id = subCues['local'].length;
                while (true) {
                    const duplicateId = subCues['local'].findIndex((item: any) => {
                        return item._id === _id;
                    });
                    if (duplicateId === -1) {
                        break;
                    } else {
                        _id++;
                    }
                }
                subCues['local'].push({
                    _id,
                    cue: saveCue,
                    date: new Date(),
                    color,
                    shuffle,
                    frequency,
                    starred,
                    customCategory: customCategory === 'None' ? '' : customCategory,
                    endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ''
                });
                const stringifiedCues = JSON.stringify(subCues);
                await AsyncStorage.setItem('cues', stringifiedCues);
                storeDraft('cueDraft', '');
                props.closeOnCreate();
            } else {
                // CHANNEL CUE
                const uString = await AsyncStorage.getItem('user');
                if (!uString) {
                    return;
                }

                const userName = await JSON.parse(uString);
                let ownerarray: any = selected;
                const userSubscriptions = await AsyncStorage.getItem('subscriptions');
                if (userSubscriptions) {
                    const list = JSON.parse(userSubscriptions);
                    list.map((i: any) => {
                        if (i.channelId === channelId) {
                            ownerarray.push(i.channelCreatedBy);
                        }
                    });
                    setSelected(ownerarray);
                }


                const user = JSON.parse(uString);
                const server = fetchAPI('');

                const variables = {
                    cue: saveCue,
                    starred,
                    color: color.toString(),
                    channelId,
                    frequency,
                    customCategory: customCategory === 'None' ? '' : customCategory,
                    shuffle,
                    createdBy: user._id,
                    gradeWeight: gradeWeight.toString(),
                    submission: submission || isQuiz,
                    deadline: submission || isQuiz ? deadline.toISOString() : '',
                    initiateAt: submission || isQuiz ? initiateAt.toISOString() : '',
                    endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
                    shareWithUserIds: !limitedShare ? null : selected,
                    limitedShares: limitedShare,
                    allowedAttempts: attempts,
                    availableUntil: (submission || isQuiz) && allowLateSubmission ? availableUntil.toISOString() : ''
                };

                server
                    .mutate({
                        mutation: createCue,
                        variables
                    })
                    .then(res => {
                        if (res.data.cue.create) {
                            Animated.timing(modalAnimation, {
                                toValue: 0,
                                duration: 150,
                                useNativeDriver: true
                            }).start(() => {
                                storeDraft('cueDraft', '');
                                setIsSubmitting(false);
                                props.closeModal();
                            });
                        }
                    })
                    .catch(err => {
                        setIsSubmitting(false);
                        Alert(somethingWentWrongAlert, checkConnectionAlert);
                    });
            }
        },
        [
            cue,
            modalAnimation,
            customCategory,
            props.saveDataInCloud,
            isQuiz,
            timer,
            duration,
            gradeWeight,
            deadline,
            initiateAt,
            submission,
            imported,
            selected,
            subscribers,
            shuffle,
            frequency,
            starred,
            color,
            notify,
            title,
            type,
            url,
            props.closeModal,
            channelId,
            endPlayAt,
            playChannelCueIndef,
            allowLateSubmission,
            availableUntil,
            attempts
        ]
    );

    /**
     * @description Clears cue content and imports
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
                    setCue('');
                    setCueDraft('');
                    setImported(false);
                    setUrl('');
                    setType('');
                    setTitle('');
                    setProblems([]);
                    setIsQuiz(false);
                    setTimer(false);
                    setShowEquationEditor(false);
                    setEquation('');
                }
            }
        ]);
    }, []);

    /**
     * @description Renders time to nearest minute
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    return (
        <ScrollView
            style={{
                width: '100%',
                height: dimensions.window.width < 1024 ? dimensions.window.height - 104 : dimensions.window.height - 52,
                backgroundColor: 'white',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                overflow: 'scroll'
            }}
            showsVerticalScrollIndicator={true}
        >
            <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'center' }}>
                <Animated.View
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        opacity: modalAnimation,
                        height: '100%',
                        maxWidth: 900,
                        paddingTop: 10,
                        paddingHorizontal: dimensions.window.width < 1024 ? 10 : 0
                    }}
                >
                    <View
                        style={{
                            flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row',
                            paddingBottom: 30
                        }}
                    >
                        {props.option === 'Browse' && !showOptions ? null : (
                            <TouchableOpacity
                                style={{
                                    paddingTop: 10,
                                    marginRight: 20
                                }}
                                onPress={() => {
                                    if (showOptions) {
                                        setShowOptions(false);
                                    } else if (showBooks) {
                                        setShowBooks(false);
                                    } else {
                                        props.closeModal();
                                    }
                                }}
                            >
                                <Text>
                                    <Ionicons name="arrow-back-outline" size={30} color={'#1F1F1F'} />
                                </Text>
                            </TouchableOpacity>
                        )}
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', flex: 1, paddingTop: 10 }}>
                            {/* QUIZ BUTTON FOR INSTRUCTORS */}
                            {!imported && !showOptions && !isQuiz && !showBooks && props.version !== 'read' ? (
                                <TouchableOpacity
                                    style={{
                                        borderRadius: 15,
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => {
                                        setShowBooks(!showBooks);
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 28,
                                            color: '#4794ff',
                                            borderColor: '#4794ff',
                                            borderWidth: 1,
                                            marginTop: 2,
                                            fontSize: 12,
                                            borderRadius: 15,
                                            paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 20,
                                            marginRight: Dimensions.get('window').width < 768 ? 15 : 20,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 30,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        Browse Books
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {allowQuizCreation &&
                                !imported &&
                                !showOptions &&
                                !showBooks &&
                                props.version !== 'read' ? (
                                <TouchableOpacity
                                    style={{
                                        borderRadius: 15,
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => {
                                        if (isQuiz) {
                                            clearAll();
                                            return;
                                        }
                                        setIsQuiz(true);
                                        setSubmission(true);
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 28,
                                            color: '#4794ff',
                                            borderColor: '#4794ff',
                                            borderWidth: 1,
                                            marginTop: 2,
                                            fontSize: 12,
                                            borderRadius: 15,
                                            paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 20,
                                            marginRight: Dimensions.get('window').width < 768 ? 15 : 20,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 30,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {isQuiz ? 'Clear' : 'Create Quiz'}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            {showOptions || showBooks ? null : (
                                <TouchableOpacity
                                    onPress={async () => {
                                        // Validation for quiz before next
                                        if (isQuiz) {
                                            const validateQuiz = isQuizValid();

                                            if (!validateQuiz) return false;
                                        }

                                        // Update editor initial value
                                        const h = await AsyncStorage.getItem('cueDraft');
                                        if (h !== null) {
                                            setCueDraft(h);
                                            setCue(h);
                                        }

                                        setShowOptions(true);
                                    }}
                                    disabled={isSubmitting}
                                    style={{
                                        borderRadius: 15,
                                        backgroundColor: 'white'
                                        // marginLeft: 15
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            lineHeight: 28,
                                            color: '#fff',
                                            backgroundColor: '#4794ff',
                                            marginTop: 2,
                                            fontSize: 12,
                                            borderRadius: 15,
                                            paddingHorizontal: Dimensions.get('window').width < 768 ? 15 : 20,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 30,
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        NEXT
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    {!showOptions ? (
                        <FormulaGuide
                            value={equation}
                            onChange={setEquation}
                            show={showEquationEditor}
                            onClose={() => setShowEquationEditor(false)}
                            onInsertEquation={insertEquation}
                        />
                    ) : null}
                    <View style={{ paddingBottom: 100 }}>
                        {showOptions ? (
                            <View
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    marginHorizontal: 10,
                                    maxWidth: 900,
                                    alignSelf: 'center'
                                }}
                            >
                                {channels.length !== 0 ? (
                                    <View
                                        style={{
                                            display: 'flex',
                                            overflow: 'visible'
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                borderRightWidth: 0,
                                                borderColor: '#f2f2f2',
                                                paddingTop: width < 768 ? 0 : 40
                                            }}
                                        >
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
                                                    For
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        backgroundColor: 'white',
                                                        display: 'flex'
                                                    }}
                                                >
                                                    <label style={{ width: 180 }}>
                                                        <Select
                                                            touchUi={true}
                                                            value={selectedChannel}
                                                            themeVariant="light"
                                                            onChange={val => {
                                                                const channel = val.value;

                                                                if (channel === 'My Notes') {
                                                                    setSelectedChannel('My Notes');
                                                                    setChannelId('');
                                                                    setCustomCategories(localCustomCategories);
                                                                    setCustomCategory('None');
                                                                    setAddCustomCategory(false);
                                                                    setSubmission(false);
                                                                    setGradeWeight(0);
                                                                    setGraded(false);
                                                                    setSelected([]);
                                                                    setSubscribers([]);
                                                                    setProblems([]);
                                                                    setIsQuiz(false);
                                                                    setTimer(false);
                                                                } else {
                                                                    const match = channels.find((c: any) => {
                                                                        return c._id === channel;
                                                                    });
                                                                    setSelectedChannel(match._id);
                                                                    setChannelId(match._id);
                                                                    setAddCustomCategory(false);
                                                                    setCustomCategory('None');
                                                                    setSubmission(isQuiz ? true : false);
                                                                    setGradeWeight(0);
                                                                    setGraded(false);
                                                                }
                                                            }}
                                                            responsive={{
                                                                small: {
                                                                    display: 'bubble'
                                                                },
                                                                medium: {
                                                                    touchUi: false
                                                                }
                                                            }}
                                                            data={channelOptions}
                                                        />
                                                    </label>
                                                </View>
                                            </View>
                                        </View>

                                        {channelId !== '' ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
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
                                                        Restrict Access
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
                                                            value={limitedShare}
                                                            onValueChange={() => {
                                                                setLimitedShare(!limitedShare);
                                                            }}
                                                            style={{ height: 20 }}
                                                            trackColor={{
                                                                false: '#f2f2f2',
                                                                true: '#4794ff'
                                                            }}
                                                            activeThumbColor="white"
                                                        />
                                                    </View>
                                                    {channelId !== '' && limitedShare ? (
                                                        <View
                                                            style={{
                                                                flexDirection: 'column',
                                                                overflow: 'scroll'
                                                            }}
                                                        >
                                                            <View
                                                                style={{
                                                                    width: '100%',
                                                                    padding: 5,
                                                                    height: 'auto',
                                                                    maxWidth: 350
                                                                }}
                                                            >
                                                                <label>
                                                                    <Select
                                                                        touchUi={true}
                                                                        placeholder="Select..."
                                                                        themeVariant="light"
                                                                        value={selected}
                                                                        data={subscribers}
                                                                        selectMultiple={true}
                                                                        onChange={(val: any) => {
                                                                            setSelected(val.value);
                                                                        }}
                                                                        responsive={{
                                                                            small: {
                                                                                display: 'bubble'
                                                                            },
                                                                            medium: {
                                                                                touchUi: false
                                                                            }
                                                                        }}
                                                                        minWidth={[60, 320]}
                                                                    />
                                                                </label>
                                                            </View>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </View>
                                        ) : null}

                                        {channelId !== '' ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
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
                                                        {PreferredLanguageText('submissionRequired')}
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
                                                            disabled={isQuiz}
                                                            value={submission}
                                                            onValueChange={() => {
                                                                setSubmission(!submission);
                                                            }}
                                                            style={{ height: 20 }}
                                                            trackColor={{
                                                                false: '#f2f2f2',
                                                                true: '#4794ff'
                                                            }}
                                                            activeThumbColor="white"
                                                        />
                                                    </View>
                                                    <View style={{ width: '100%', marginBottom: 15 }}>
                                                        <View style={{}}>
                                                            {submission ? (
                                                                <View
                                                                    style={{
                                                                        width: '100%',
                                                                        display: 'flex',
                                                                        flexDirection: 'row',
                                                                        backgroundColor: 'white',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <Text style={styles.text}>Available</Text>
                                                                    <MobiscrollDatePicker
                                                                        controls={['date', 'time']}
                                                                        touchUi={true}
                                                                        value={initiateAt}
                                                                        themeVariant="light"
                                                                        // inputComponent="input"
                                                                        inputProps={{
                                                                            placeholder: 'Please Select...'
                                                                        }}
                                                                        onChange={(event: any) => {
                                                                            const date = new Date(event.value);
                                                                            const roundValue = roundSeconds(date);
                                                                            if (date < new Date()) {
                                                                                Alert('Available date must be set in the future.');
                                                                                return
                                                                            };
                                                                            setInitiateAt(roundValue);
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
                                                            ) : null}
                                                        </View>
                                                    </View>

                                                    {/* Add it here */}

                                                    <View style={{ width: '100%' }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            {submission ? (
                                                                <View
                                                                    style={{
                                                                        width: '100%',
                                                                        display: 'flex',
                                                                        flexDirection: 'row',
                                                                        backgroundColor: 'white',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <Text style={styles.text}>
                                                                        {PreferredLanguageText('deadline')}
                                                                    </Text>
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
                                                                            if (date < new Date()) {
                                                                                Alert('Deadline must be set in the future.')
                                                                                return;
                                                                            }
                                                                            const roundValue = roundSeconds(date);
                                                                            setDeadline(roundValue);
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
                                                            ) : null}
                                                        </View>

                                                        {/* Add it here */}
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}
                                        {submission ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
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
                                                        Grade Weight
                                                    </Text>
                                                </View>
                                                <View>
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
                                                                value={graded}
                                                                onValueChange={() => setGraded(!graded)}
                                                                style={{ height: 20 }}
                                                                trackColor={{
                                                                    false: '#f2f2f2',
                                                                    true: '#4794ff'
                                                                }}
                                                                activeThumbColor="white"
                                                            />
                                                        </View>
                                                    </View>
                                                    <View>
                                                        {graded ? (
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                    justifyContent:
                                                                        width < 768 ? 'flex-start' : 'flex-end',
                                                                    backgroundColor: 'white',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
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
                                                                <Text
                                                                    style={{
                                                                        fontSize: 14,
                                                                        color: '#1F1F1F',
                                                                        textAlign: 'left',
                                                                        paddingHorizontal: 10,
                                                                        fontFamily: 'Inter'
                                                                    }}
                                                                >
                                                                    {PreferredLanguageText('percentageOverall')}
                                                                </Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}
                                        {/* Late Submissions */}
                                        {submission ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
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
                                                <View>
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
                                                                value={allowLateSubmission}
                                                                onValueChange={() =>
                                                                    setAllowLateSubmission(!allowLateSubmission)
                                                                }
                                                                style={{ height: 20 }}
                                                                trackColor={{
                                                                    false: '#f2f2f2',
                                                                    true: '#4794ff'
                                                                }}
                                                                activeThumbColor="white"
                                                            />
                                                        </View>
                                                    </View>
                                                    <View>
                                                        {allowLateSubmission ? (
                                                            <View
                                                                style={{
                                                                    width: '100%',
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    backgroundColor: 'white',
                                                                    alignItems: 'center'
                                                                    // marginLeft: 50,
                                                                }}
                                                            >
                                                                <Text style={styles.text}>Allowed Until</Text>
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
                                                                        if (date < deadline) {
                                                                            Alert('Late submission date must be set after deadline.')
                                                                            return
                                                                        };
                                                                        const roundValue = roundSeconds(date);
                                                                        setAvailableUntil(roundValue);
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
                                                        ) : null}
                                                    </View>
                                                </View>
                                            </View>
                                        ) : null}

                                        {/* Allowed attempts */}

                                        {submission && isQuiz ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: 40
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flex: 1,
                                                        flexDirection: 'row',
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
                                                                    setAttempts('');
                                                                } else {
                                                                    setAttempts('1');
                                                                }
                                                                setUnlimitedAttempts(!unlimitedAttempts);
                                                            }}
                                                            style={{ height: 20 }}
                                                            trackColor={{
                                                                false: '#f2f2f2',
                                                                true: '#4794ff'
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
                                                                backgroundColor: 'white',
                                                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Text style={styles.text}>Allowed attempts</Text>
                                                            <TextInput
                                                                value={attempts}
                                                                style={{
                                                                    width: '25%',
                                                                    borderBottomColor: '#F8F9FA',
                                                                    borderBottomWidth: 1,
                                                                    fontSize: 14,
                                                                    padding: 15,
                                                                    paddingVertical: 12,
                                                                    marginTop: 0
                                                                }}
                                                                placeholder={''}
                                                                onChangeText={val => {
                                                                    if (Number.isNaN(Number(val))) return;
                                                                    setAttempts(val);
                                                                }}
                                                                placeholderTextColor={'#1F1F1F'}
                                                            />
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                ) : null}

                                <View
                                    style={{
                                        display: 'flex'
                                    }}
                                >
                                    <View
                                        style={{
                                            width: '100%',
                                            borderRightWidth: 0,
                                            borderColor: '#f2f2f2'
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: '100%',
                                                backgroundColor: 'white',
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                paddingTop: channels.length === 0 && width < 768 ? 0 : 40
                                            }}
                                        >
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
                                                    {PreferredLanguageText('category')}
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    backgroundColor: 'white',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <View style={{ width: '85%', backgroundColor: 'white' }}>
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
                                                        <label style={{ width: 180 }}>
                                                            <Select
                                                                touchUi={true}
                                                                cssClass="customDropdown"
                                                                value={customCategory}
                                                                rows={customCategories.length + 1}
                                                                data={categoriesOptions}
                                                                themeVariant="light"
                                                                onChange={(val: any) => {
                                                                    setCustomCategory(val.value);
                                                                }}
                                                                responsive={{
                                                                    small: {
                                                                        display: 'bubble'
                                                                    },
                                                                    medium: {
                                                                        touchUi: false
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </View>
                                                <View
                                                    style={{ width: '15%', backgroundColor: 'white', paddingLeft: 20 }}
                                                >
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
                                                                textAlign: 'center',
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
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            width: '100%',
                                            borderRightWidth: 0,
                                            borderColor: '#f2f2f2',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40,
                                            alignItems: width < 1024 ? 'flex-start' : 'center',
                                            paddingBottom: 15
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                backgroundColor: 'white'
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'Inter',
                                                    paddingBottom: 15
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
                                                                style={
                                                                    color === i
                                                                        ? styles.colorContainerOutline
                                                                        : styles.colorContainer
                                                                }
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
                                </View>
                                {/* <View
                                    style={{
                                        width: '100%',
                                        flexDirection: 'column'
                                    }}>
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40
                                        }}>
                                        <View
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                paddingBottom: 15,
                                                backgroundColor: 'white'
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 14,
                                                    color: '#000000',
                                                    fontFamily: 'Inter'
                                                }}>
                                                Remind
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10
                                            }}>
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
                                                    true: '#4794ff'
                                                }}
                                                activeThumbColor="white"
                                            />
                                        </View>
                                    </View>
                                    {notify ? (
                                        <View
                                            style={{
                                                width: '100%',
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                paddingTop: 40
                                            }}>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    flexDirection: 'row',
                                                    paddingBottom: 15,
                                                    backgroundColor: 'white'
                                                }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}>
                                                    Repeat Reminder
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        backgroundColor: 'white',
                                                        height: 40,
                                                        marginRight: 10,
                                                        flexDirection: 'row',
                                                        justifyContent: width < 768 ? 'flex-start' : 'flex-end'
                                                    }}>
                                                    <Switch
                                                        value={!shuffle}
                                                        onValueChange={() => setShuffle(!shuffle)}
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#f2f2f2',
                                                            true: '#4794ff'
                                                        }}
                                                        activeThumbColor="white"
                                                    />
                                                </View>
                                                {!shuffle ? (
                                                    <View
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white',
                                                            alignItems: 'center'
                                                        }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 14,
                                                                color: '#1F1F1F',
                                                                textAlign: 'right',
                                                                paddingRight: 10,
                                                                fontFamily: 'Inter'
                                                            }}>
                                                            {PreferredLanguageText('remindEvery')}
                                                        </Text>
                                                        <label style={{ width: 140 }}>
                                                            <Select
                                                                touchUi={true}
                                                                themeVariant="light"
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
                                                    </View>
                                                ) : (
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white'
                                                        }}>
                                                        <View>
                                                            <Text
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: '#1F1F1F',
                                                                    textAlign: 'right',
                                                                    paddingRight: 10,
                                                                    marginTop: 5
                                                                }}>
                                                                {PreferredLanguageText('RemindOn')}
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
                                        <View
                                            style={{
                                                width: '100%',
                                                flexDirection: width < 768 ? 'column' : 'row',
                                                paddingTop: 40
                                            }}>
                                            <View
                                                style={{
                                                    flex: 1,
                                                    flexDirection: 'row',
                                                    paddingBottom: 15,
                                                    backgroundColor: 'white'
                                                }}>
                                                <Text
                                                    style={{
                                                        fontSize: 14,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}>
                                                    Remind Indefinitely
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        backgroundColor: 'white',
                                                        height: 40,
                                                        flexDirection: 'row',
                                                        justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                        marginRight: 10
                                                    }}>
                                                    <Switch
                                                        value={playChannelCueIndef}
                                                        onValueChange={() =>
                                                            setPlayChannelCueIndef(!playChannelCueIndef)
                                                        }
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#f2f2f2',
                                                            true: '#4794ff'
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
                                                        }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('remindTill')}
                                                        </Text>
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
                                                )}
                                            </View>
                                        </View>
                                    ) : null}
                                </View> */}
                                {/* Timed Quiz */}
                                {isQuiz ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40
                                        }}
                                    >
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
                                                Timed
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
                                                    value={timer}
                                                    onValueChange={() => {
                                                        if (timer) {
                                                            setDuration({
                                                                hours: 1,
                                                                minutes: 0,
                                                                seconds: 0
                                                            });
                                                        }
                                                        setTimer(!timer);
                                                    }}
                                                    style={{ height: 20 }}
                                                    trackColor={{
                                                        false: '#f2f2f2',
                                                        true: '#4794ff'
                                                    }}
                                                    activeThumbColor="white"
                                                />
                                            </View>
                                            {timer ? (
                                                <View
                                                    style={{
                                                        borderRightWidth: 0,
                                                        paddingTop: 0,
                                                        borderColor: '#f2f2f2',
                                                        flexDirection: 'row'
                                                    }}
                                                >
                                                    <View>
                                                        <Menu
                                                            onSelect={(hour: any) =>
                                                                setDuration({
                                                                    ...duration,
                                                                    hours: hour
                                                                })
                                                            }
                                                        >
                                                            <MenuTrigger>
                                                                <Text
                                                                    style={{
                                                                        // fontFamily: "inter",
                                                                        fontSize: 15,
                                                                        color: '#000000'
                                                                    }}
                                                                >
                                                                    {duration.hours} H{' '}
                                                                    <Ionicons name="chevron-down-outline" size={15} />{' '}
                                                                    &nbsp; &nbsp;: &nbsp; &nbsp;
                                                                </Text>
                                                            </MenuTrigger>
                                                            <MenuOptions
                                                                customStyles={{
                                                                    optionsContainer: {
                                                                        padding: 10,
                                                                        borderRadius: 15,
                                                                        shadowOpacity: 0,
                                                                        borderWidth: 1,
                                                                        borderColor: '#f2f2f2',
                                                                        overflow: 'scroll',
                                                                        maxHeight: '100%'
                                                                    }
                                                                }}
                                                            >
                                                                {hours.map((hour: any) => {
                                                                    return (
                                                                        <MenuOption value={hour}>
                                                                            <Text>{hour}</Text>
                                                                        </MenuOption>
                                                                    );
                                                                })}
                                                            </MenuOptions>
                                                        </Menu>
                                                    </View>
                                                    <View>
                                                        <Menu
                                                            onSelect={(min: any) =>
                                                                setDuration({
                                                                    ...duration,
                                                                    minutes: min
                                                                })
                                                            }
                                                        >
                                                            <MenuTrigger>
                                                                <Text
                                                                    style={{
                                                                        // fontFamily: "inter",
                                                                        fontSize: 15,
                                                                        color: '#000000'
                                                                    }}
                                                                >
                                                                    {duration.minutes} m{' '}
                                                                    <Ionicons name="chevron-down-outline" size={15} />
                                                                </Text>
                                                            </MenuTrigger>
                                                            <MenuOptions
                                                                customStyles={{
                                                                    optionsContainer: {
                                                                        padding: 10,
                                                                        borderRadius: 15,
                                                                        shadowOpacity: 0,
                                                                        borderWidth: 1,
                                                                        borderColor: '#f2f2f2',
                                                                        overflow: 'scroll',
                                                                        maxHeight: '100%'
                                                                    }
                                                                }}
                                                            >
                                                                {minutes.map((min: any) => {
                                                                    return (
                                                                        <MenuOption value={min}>
                                                                            <Text>{min}</Text>
                                                                        </MenuOption>
                                                                    );
                                                                })}
                                                            </MenuOptions>
                                                        </Menu>
                                                    </View>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                ) : null}

                                {/* if Quiz then ask Shuffle */}
                                {isQuiz ? (
                                    <View
                                        style={{
                                            width: '100%',
                                            flexDirection: width < 768 ? 'column' : 'row',
                                            paddingTop: 40
                                        }}
                                    >
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
                                                Random Order
                                            </Text>
                                        </View>
                                        <View>
                                            <View
                                                style={{
                                                    backgroundColor: 'white',
                                                    height: 40,
                                                    flexDirection: 'row',
                                                    justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                    marginRight: 10
                                                }}
                                            >
                                                <Switch
                                                    value={shuffleQuiz}
                                                    onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
                                                    style={{ height: 20 }}
                                                    trackColor={{
                                                        false: '#f2f2f2',
                                                        true: '#4794ff'
                                                    }}
                                                    activeThumbColor="white"
                                                />
                                            </View>
                                        </View>
                                    </View>
                                ) : null}
                            </View>
                        ) : (
                            <>
                                {imported || isQuiz ? (
                                    <View
                                        style={{
                                            flexDirection: width < 768 ? 'column' : 'row'
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: '100%',
                                                borderRightWidth: 0,
                                                borderColor: '#f2f2f2',
                                                flexDirection: 'row',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <TextareaAutosize
                                                value={title}
                                                style={{
                                                    fontFamily: 'overpass',
                                                    width: '100%',
                                                    maxWidth: 400,
                                                    borderBottom: '1px solid #f2f2f2',
                                                    fontSize: 14,
                                                    paddingTop: 13,
                                                    paddingBottom: 13,
                                                    marginTop: 12,
                                                    marginBottom: 15,
                                                    borderRadius: 1,
                                                    height: 35
                                                }}
                                                minRows={1}
                                                placeholder={PreferredLanguageText('title')}
                                                onChange={(e: any) => setTitle(e.target.value)}
                                            />
                                            {!isQuiz ? (
                                                <TouchableOpacity
                                                    style={{
                                                        marginLeft: Dimensions.get('window').width < 768 ? 20 : 'auto',
                                                        paddingTop: 15
                                                    }}
                                                    onPress={() => clearAll()}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            lineHeight: 34,
                                                            fontFamily: 'inter',
                                                            color: '#4794ff'
                                                        }}
                                                    >
                                                        Clear
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    </View>
                                ) : null}
                                <View
                                    style={{
                                        width: '100%',
                                        minHeight: isQuiz ? 0 : 500,
                                        backgroundColor: 'white'
                                    }}
                                    key={imported.toString()}
                                >
                                    {isQuiz ? (
                                        <View
                                            style={{
                                                width: '100%',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <View
                                                style={{
                                                    backgroundColor: '#fff',
                                                    flexDirection: 'row',
                                                    width: '100%'
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: 600,
                                                        paddingTop: 15
                                                    }}
                                                >
                                                    <View key={userId.toString()}>
                                                        <FroalaEditor
                                                            ref={RichText}
                                                            model={quizInstructions}
                                                            onModelChange={(model: any) => setQuizInstructions(model)}
                                                            config={{
                                                                key:
                                                                    'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                                                attribution: false,
                                                                placeholderText: 'Quiz Instructions',
                                                                charCounterCount: false,
                                                                zIndex: 2003,
                                                                // immediateReactModelUpdate: true,
                                                                heightMin: 200,
                                                                fileUpload: false,
                                                                videoUpload: false,
                                                                imageUploadURL:
                                                                    'https://api.learnwithcues.com/api/imageUploadEditor',
                                                                imageUploadParam: 'file',
                                                                imageUploadParams: { userId },
                                                                imageUploadMethod: 'POST',
                                                                imageMaxSize: 5 * 1024 * 1024,
                                                                imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                                                                paragraphFormatSelection: true,
                                                                // Default Font Size
                                                                fontSizeDefaultSelection: '24',
                                                                spellcheck: true,
                                                                tabSpaces: 4,
                                                                // TOOLBAR
                                                                toolbarButtons: QUIZ_INSTRUCTIONS_TOOLBAR_BUTTONS,
                                                                toolbarSticky: false,
                                                                quickInsertEnabled: false,
                                                                id: 'XYZ'
                                                            }}
                                                        />
                                                    </View>
                                                    {/* <Editor
                                                        initialValue={initialQuizInstructions}
                                                        apiKey="ip4jckmpx73lbu6jgyw9oj53g0loqddalyopidpjl23fx7tl"
                                                        init={{
                                                            skin: 'snow',
                                                            // toolbar_sticky: true,
                                                            indent: false,
                                                            branding: false,
                                                            placeholder: 'Instructions',
                                                            autoresize_on_init: false,
                                                            autoresize_min_height: 200,
                                                            height: 200,
                                                            min_height: 200,
                                                            paste_data_images: true,
                                                            images_upload_url:
                                                                'https://api.learnwithcues.com/api/imageUploadEditor',
                                                            mobile: {
                                                                plugins:
                                                                    'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize'
                                                            },
                                                            plugins:
                                                                'print preview powerpaste casechange importcss searchreplace autolink save directionality advcode visualblocks visualchars fullscreen image link media mediaembed template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists checklist wordcount textpattern noneditable help formatpainter pageembed charmap emoticons advtable autoresize',
                                                            menu: {
                                                                // this is the complete default configuration
                                                                file: { title: 'File', items: 'newdocument' },
                                                                edit: {
                                                                    title: 'Edit',
                                                                    items:
                                                                        'undo redo | cut copy paste pastetext | selectall'
                                                                },
                                                                insert: {
                                                                    title: 'Insert',
                                                                    items: 'link media | template hr'
                                                                },
                                                                view: { title: 'View', items: 'visualaid' },
                                                                format: {
                                                                    title: 'Format',
                                                                    items:
                                                                        'bold italic underline strikethrough superscript subscript | formats | removeformat'
                                                                },
                                                                table: {
                                                                    title: 'Table',
                                                                    items:
                                                                        'inserttable tableprops deletetable | cell row column'
                                                                },
                                                                tools: { title: 'Tools', items: 'spellchecker code' }
                                                            },
                                                            statusbar: false,
                                                            // menubar: 'file edit view insert format tools table tc help',
                                                            menubar: false,
                                                            toolbar:
                                                                'undo redo | bold italic underline strikethrough |  numlist bullist checklist | forecolor backcolor permanentpen removeformat | table image media pageembed link | charmap emoticons superscript subscript',
                                                            importcss_append: true,
                                                            image_caption: true,
                                                            quickbars_selection_toolbar:
                                                                'bold italic underline | quicklink h2 h3 quickimage quicktable',
                                                            noneditable_noneditable_class: 'mceNonEditable',
                                                            toolbar_mode: 'sliding',
                                                            // tinycomments_mode: 'embedded',
                                                            content_style:
                                                                '.mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before{color: #1F1F1F;}',
                                                            // contextmenu: 'link image table configurepermanentpen',
                                                            // a11y_advanced_options: true,
                                                            extended_valid_elements:
                                                                'svg[*],defs[*],pattern[*],desc[*],metadata[*],g[*],mask[*],path[*],line[*],marker[*],rect[*],circle[*],ellipse[*],polygon[*],polyline[*],linearGradient[*],radialGradient[*],stop[*],image[*],view[*],text[*],textPath[*],title[*],tspan[*],glyph[*],symbol[*],switch[*],use[*]'
                                                            // skin: useDarkMode ? 'oxide-dark' : 'oxide',
                                                            // content_css: useDarkMode ? 'dark' : 'default',
                                                        }}
                                                        onChange={(e: any) => {
                                                            setQuizInstructions(e.target.getContent());
                                                        }}
                                                    /> */}
                                                </View>
                                            </View>
                                            <QuizCreate
                                                problems={problems}
                                                headers={headers}
                                                setProblems={(p: any) => setProblems(p)}
                                                setHeaders={(h: any) => setHeaders(h)}
                                                userId={userId}
                                            />
                                        </View>
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
                                        ) : (
                                            <View
                                                key={url + JSON.stringify(showOptions)}
                                                style={{ flex: 1, maxHeight: 800 }}
                                            >
                                                <div
                                                    className="webviewer"
                                                    ref={RichText}
                                                    style={{
                                                        height: Dimensions.get('window').width < 1024 ? '50vh' : '70vh',
                                                        borderWidth: 1,
                                                        borderColor: '#f2f2f2',
                                                        borderRadius: 1
                                                    }}
                                                ></div>
                                            </View>
                                        )
                                    ) : null}
                                    {showBooks ? (
                                        <Books
                                            onUpload={(obj: any) => {
                                                setCue(JSON.stringify(obj));
                                                setShowBooks(false);
                                            }}
                                        />
                                    ) : null}
                                    {isQuiz || imported || showBooks ? null : (
                                        <View key={userId.toString() + reloadEditorKey.toString()}>
                                            <FroalaEditor
                                                ref={RichText}
                                                model={cue}
                                                onModelChange={(model: any) => setCue(model)}
                                                config={{
                                                    key:
                                                        'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
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
                                                    imageUploadURL:
                                                        'https://api.learnwithcues.com/api/imageUploadEditor',
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
                                                    htmlAllowedEmptyTags: [
                                                        'textarea',
                                                        'a',
                                                        'iframe',
                                                        'object',
                                                        'video',
                                                        'style',
                                                        'script',
                                                        '.fa',
                                                        'span',
                                                        'p',
                                                        'path',
                                                        'line'
                                                    ],
                                                    htmlAllowedTags: ['.*'],
                                                    htmlAllowedAttrs: ['.*'],
                                                    htmlRemoveTags: ['script'],

                                                    events: {
                                                        'file.beforeUpload': function (files: any) {
                                                            // Return false if you want to stop the file upload.
                                                            fileUploadEditor(files);

                                                            return false;
                                                        },
                                                        'video.beforeUpload': function (videos: any) {
                                                            videoUploadEditor(videos);

                                                            return false;
                                                        },
                                                        'image.beforeUpload': function (images: any) {

                                                            if (images[0].size > (5 * 1024 * 1024)) {
                                                                alert('Image size must be less than 5mb.')
                                                                return false;
                                                            }

                                                            return true;
                                                        },
                                                    }
                                                }}
                                            />
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                        {!showOptions ? null : (
                            <View style={styles.footer}>
                                <View
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        height: 50,
                                        paddingTop: 10
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={async () => {
                                            if (isQuiz) {
                                                if (channelId === '') {
                                                    Alert('Select a channel to share quiz.');
                                                    return;
                                                }
                                                createNewQuiz();
                                            } else {
                                                await handleCreate();
                                            }
                                        }}
                                        disabled={isSubmitting || creatingQuiz}
                                        style={{
                                            borderRadius: 15,
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        {channelId === '' ? (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    lineHeight: 34,
                                                    color: 'white',
                                                    fontSize: 12,
                                                    backgroundColor: '#4794ff',
                                                    borderRadius: 15,
                                                    paddingHorizontal: 20,
                                                    fontFamily: 'inter',
                                                    overflow: 'hidden',
                                                    height: 35,
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {isSubmitting ? 'Creating...' : 'Create'}
                                            </Text>
                                        ) : (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    lineHeight: 34,
                                                    color: 'white',
                                                    fontSize: 12,
                                                    backgroundColor: '#4794ff',
                                                    borderRadius: 15,
                                                    paddingHorizontal: 20,
                                                    fontFamily: 'inter',
                                                    overflow: 'hidden',
                                                    height: 35,
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                {isSubmitting ? 'Creating...' : 'CREATE'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        {/* Collapsible ends here */}
                    </View>
                </Animated.View>
            </View>
        </ScrollView>
    );
};

export default Create;

const styles: any = StyleSheet.create({
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: 80,
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
        marginTop: 0,
        marginBottom: 20
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
    },
    text: {
        fontSize: 14,
        color: '#1F1F1F',
        textAlign: 'left',
        paddingHorizontal: 10,
        fontFamily: 'Inter'
    },
    all: {
        fontSize: 12,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    }
});
