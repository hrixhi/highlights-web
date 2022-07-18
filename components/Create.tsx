// REACT
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { StyleSheet, Switch, TextInput, ScrollView, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API

import {
    createCue,
    createQuiz,
    getChannelCategories,
    getChannels,
    getSharedWith,
} from '../graphql/QueriesAndMutations';

// COMPONENTS
import { Text, View, TouchableOpacity } from '../components/Themed';
import Alert from '../components/Alert';
import QuizCreate from './QuizCreate';
import ReactPlayer from 'react-player';
import WebViewer from '@pdftron/pdfjs-express';
import { Select, Datepicker as MobiscrollDatePicker } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.react.min.css';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import TextareaAutosize from 'react-textarea-autosize';
import FormulaGuide from './FormulaGuide';
import InsertYoutubeModal from './InsertYoutubeModal';
import Books from './Books';

// HELPERS
import { PreferredLanguageText } from '../helpers/LanguageContext';
import { handleFileUploadEditor, handleFile } from '../helpers/FileUpload';

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
import { disableEmailId } from '../constants/zoomCredentials';
import { paddingResponsive } from '../helpers/paddingHelper';
import { htmlStringParser } from '../helpers/HTMLParser';
import { useApolloClient } from '@apollo/client';
import { useAppContext } from '../contexts/AppContext';

const Create: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, user, customCategories: localCustomCategories, handleUpdateCue, handleAddCue } = useAppContext();

    const current = new Date();
    const [cue, setCue] = useState('<h2>Title</h2>');
    const [init, setInit] = useState(false);
    const [cueDraft, setCueDraft] = useState('');
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random());
    const [shuffle, setShuffle] = useState(false);
    const [starred] = useState(false);
    const [notify, setNotify] = useState(false);
    const [color, setColor] = useState(0);
    const [frequency, setFrequency] = useState('0');
    const [customCategory, setCustomCategory] = useState('None');
    const [customCategories, setCustomCategories] = useState(localCustomCategories);
    const [addCustomCategory, setAddCustomCategory] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [channelOptions, setChannelOptions] = useState<any[]>([]);
    const [showOptions, setShowOptions] = useState(false);
    const [channelId, setChannelId] = useState<any>(props.channelId);
    const [selectedChannel, setSelectedChannel] = useState<any>(
        props.channelId && props.channelId !== '' ? props.channelId : 'My Notes'
    );
    const [endPlayAt, setEndPlayAt] = useState(new Date(current.getTime() + 1000 * 60 * 60));
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true);
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#35AC78'].reverse();
    const [modalAnimation] = useState(new Animated.Value(0));
    let RichText: any = useRef();
    const [role] = useState(user.role);
    const [allowQuizCreation] = useState(user.allowQuizCreation ? true : false);
    const [submission, setSubmission] = useState(false);
    const [deadline, setDeadline] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 24));
    const [initiateAt, setInitiateAt] = useState(new Date(current.getTime()));
    const [allowLateSubmission, setAllowLateSubmission] = useState(false);
    const [availableUntil, setAvailableUntil] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 48));
    const [showBooks, setShowBooks] = useState(false);
    const [gradeWeight, setGradeWeight] = useState<any>('');
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
        seconds: 0,
    });
    const [equation, setEquation] = useState('y = x + 1');
    const [showEquationEditor, setShowEquationEditor] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [quizInstructions, setQuizInstructions] = useState('');
    const [limitedShare, setLimitedShare] = useState(false);
    const [unlimitedAttempts, setUnlimitedAttempts] = useState(false);
    const [attempts, setAttempts] = useState('1');
    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');
    const [dimensions, setDimensions] = useState({ window, screen });
    const [totalPoints, setTotalPoints] = useState('');

    const width = dimensions.window.width;
    const hours: any[] = [0, 1, 2, 3, 4, 5, 6];
    const minutes: any[] = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    let categoriesOptions = [
        {
            value: 'None',
            text: 'None',
        },
    ];
    customCategories.map((category: any) => {
        categoriesOptions.push({
            value: category,
            text: category,
        });
    });
    const [reloadQuizKey, setReloadQuizKey] = useState(Math.random());
    const [showInsertYoutubeVideosModal, setShowInsertYoutubeVideosModal] = useState(false);

    // Alerts
    const enterOneProblemAlert = PreferredLanguageText('enterOneProblem');
    const invalidDurationAlert = PreferredLanguageText('invalidDuration');
    const clearQuestionAlert = PreferredLanguageText('clearQuestion');
    const cannotUndoAlert = PreferredLanguageText('cannotUndo');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const enterContentAlert = PreferredLanguageText('enterContent');
    const enterTitleAlert = PreferredLanguageText('enterTitle');
    // new alert

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
            RichText.current.editor.selection.save();
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
            RichText.current.editor.selection.save();
            setShowInsertYoutubeVideosModal(true);
        },
    });

    const server = useApolloClient();

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
     * @description Show import file directly from the navbar
     */
    useEffect(() => {
        if (props.showImportCreate) {
            handleFileUpload();
            props.setShowImportCreate(false);
        }
    }, [props.showImportCreate]);

    /**
     * @description Show import file directly from the navbar
     */
    useEffect(() => {
        if (props.showVideosCreate) {
            if (imported) {
                Alert('Cannot add videos to imported content.');
            } else {
                setShowInsertYoutubeVideosModal(true);
            }

            props.setShowVideosCreate(false);
        }
    }, [props.showVideosCreate, imported]);

    // For landscape mode table, we must also update the potrait mode navbar
    useEffect(() => {
        if (isQuiz) {
            props.setCreateActiveTab('Quiz');
        } else if (showBooks) {
            props.setCreateActiveTab('Books');
        } else {
            props.setCreateActiveTab('Content');
        }
    }, [showBooks, isQuiz]);

    console.log('Show Books', showBooks);
    console.log('Props.createActiveTab', props.createActiveTab);

    /**
     * @description
     */
    useEffect(() => {
        (async () => {
            setIsQuiz(false);
            setSubmission(false);
            setShowBooks(false);

            if (props.createActiveTab === 'Quiz') {
                setIsQuiz(true);
                setSubmission(true);
                const quizDraft = await AsyncStorage.getItem('quizDraft');
                if (quizDraft) {
                    const { title } = JSON.parse(quizDraft);
                    setTitle(title);
                }
            } else if (props.createActiveTab === 'Books') {
                setShowBooks(true);
            } else if (props.createActiveTab === 'Content') {
                // Set title if uploaded content
                if (cue[0] === '{' && cue[cue.length - 1] === '}') {
                    const obj = JSON.parse(cue);
                    setTitle(obj.title);
                }
            }
        })();
    }, [props.createActiveTab, cue]);

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
        if (showBooks || showOptions || !RichText.current || !url || isQuiz) return;

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
                enableReadOnlyMode: true,
            },
            RichText.current
        ).then((instance) => {
            const { documentViewer } = instance.Core;

            if (!documentViewer) return;
            // you can now call WebViewer APIs here...
            // documentViewer.addEventListener('documentLoaded', () => {
            //     // perform document operations
            // });
        });
    }, [url, RichText, imported, type, showOptions, showBooks, isQuiz]);

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
                title,
            };
            saveCue = JSON.stringify(obj);
        } else if (isQuiz) {
            // Loop over entire quiz and save only the questions which are valid
            // const validProblems = problems.filter((prob: any) => isCurrentQuestionValid(prob));

            const quiz = {
                title,
                problems,
                timer,
                duration,
                headers,
                quizInstructions,
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
                        setImported(true);
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

                if (quizDraft && quizDraft !== null) {
                    const { duration, timer, problems, title, headers, quizInstructions } = JSON.parse(quizDraft);
                    setDuration(duration);
                    setTimer(timer);
                    setProblems(problems);
                    setTitle(title);
                    setHeaders(headers);
                    setQuizInstructions(quizInstructions);
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
            useNativeDriver: true,
        }).start();
    }, []);

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        setDimensions({ window, screen });
    }, []);

    const handleAddVideo = useCallback(
        (videoId: string) => {
            setShowInsertYoutubeVideosModal(false);

            RichText.current.editor.selection.restore();

            RichText.current.editor.html.insert(
                `<iframe width="640" height="360" src="https://youtube.com/embed/${videoId}" frameborder="0" allowfullscreen="" class="fr-draggable"></iframe>`
            );

            RichText.current.editor.events.trigger('contentChanged');
        },
        [RichText, RichText.current]
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

            RichText.current.editor.selection.restore();

            RichText.current.editor.html.insert(
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
        problems.map((problem: any, problemIndex: number) => {
            if (
                problem.question === '' &&
                problem.questionType !== 'textEntry' &&
                problem.questionType !== 'inlineChoice' &&
                problem.questionType !== 'highlightText'
            ) {
                alert(`Question ${problemIndex + 1} has no content.`);
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
                // At least 2 groups
                if (problem.dragDropHeaders.length < 2) {
                    alert(`Question ${problemIndex + 1} must have at least 2 Drag & Drop groups.`);
                    return false;
                }

                let groupHeaderMissing = false;
                let labelMissing = false;
                let groupEmpty = false;

                problem.dragDropHeaders.map((header: string) => {
                    if (!header) {
                        groupHeaderMissing = true;
                    }
                });

                if (groupHeaderMissing) {
                    alert(`Group header is missing in Question ${problemIndex + 1}.`);
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
                    alert(`Item missing in Question ${problemIndex + 1}.`);
                    return false;
                }

                if (groupEmpty) {
                    alert(`Each group must have at least 1 item in Question ${problemIndex + 1}.`);
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
                const el = document.createElement('html');
                el.innerHTML = problem.highlightTextHtml;
                const spans: HTMLCollection = el.getElementsByTagName('span');

                let spanIdCounter = 0;
                let correctAnswers = 0;

                for (let i = 0; i < spans.length; i++) {
                    const span = spans.item(i);

                    if (span.style.backgroundColor === 'rgb(97, 189, 109)') {
                        spanIdCounter += 1;
                        correctAnswers += 1;
                    } else if (span.style.backgroundColor === 'rgb(247, 218, 100)') {
                        spanIdCounter += 1;
                    }
                }

                if (spanIdCounter < 2) {
                    Alert(`You must set at least two Hot text choices in Question ${index + 1}.`);
                    return;
                }

                if (correctAnswers === 0) {
                    Alert(`You must set at least one Hot text choice as correct in Question ${index + 1}.`);
                    return;
                }
            }

            // Inline Choice
            if (problem.questionType === 'inlineChoice') {
                if (problem.inlineChoiceHtml === '') {
                    alert(`Question ${problemIndex + 1} has no content.`);
                    return;
                }

                if (problem.inlineChoiceOptions.length === 0) {
                    alert(`Question ${problemIndex + 1} must have at lease one dropdown.`);
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
                        alert(`Each dropdown in question ${problemIndex + 1} must have at lease two options.`);
                        return;
                    }

                    if (missingDropdownValue) {
                        alert(`Each dropdown option must have a value in question ${problemIndex + 1}.`);
                        return;
                    }

                    if (missingCorrectAnswer) {
                        alert(`Each dropdown must have a correct answer in question ${problemIndex + 1}.`);
                        return;
                    }
                }
            }

            // Text Entry
            if (problem.questionType === 'textEntry') {
                if (problem.textEntryHtml === '') {
                    alert(`Question ${problemIndex + 1} has no content.`);
                    return;
                }

                if (problem.textEntryOptions.length === 0) {
                    alert(`Text entry question ${problemIndex + 1} must have at lease one entry.`);
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
                    alert(`Each Text entry option must have an answer in question ${problemIndex + 1}.`);
                    return;
                }

                if (missingEntryPoints) {
                    alert(`Each Text entry must have points in question ${problemIndex + 1}.`);
                    return;
                }

                if (pointsNotANumber) {
                    alert(`Each Text entry must have numeric points in question ${problemIndex + 1}.`);
                    return;
                }
            }

            // Multipart
            if (problem.questionType === 'multipart') {
                if (problem.multipartQuestions[0] === '' || problem.multipartQuestions[1] === '') {
                    alert(`Part A and Part B questions cannot be empty in question ${problemIndex + 1}`);
                    return;
                }

                // Part A
                let hasOneCorrect = false;
                let hasMissingOption = false;

                // At least two choices
                if (problem.multipartOptions[0].length < 2) {
                    alert(`Part A must have at least two choices in question ${problemIndex + 1}`);
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
                    alert(`Part A must have at least one correct choice in question ${problemIndex + 1}`);
                    return;
                }

                if (hasMissingOption) {
                    alert(`Part A option is empty in question ${problemIndex + 1}`);
                }

                if (problem.multipartOptions[0].length < 2) {
                    alert(`Part A must have at least two choices in question ${problemIndex + 1}`);
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
                    alert(`Part A must have at least one correct choice in question ${problemIndex + 1}`);
                    return;
                }

                if (hasMissingOption) {
                    alert(`Part A option is empty in question ${problemIndex + 1}`);
                }
            }

            // Equation Editor
            if (problem.questionType === 'equationEditor') {
                if (problem.correctEquations[0] === '') {
                    alert('Correct equation cannot be empty.');
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
                    alert(`Column header cannot be empty in question ${problemIndex + 1}.`);
                    return;
                }

                problem.matchTableOptions.map((rowHeader: string) => {
                    if (rowHeader === '') {
                        missingRowHeader = true;
                    }
                });

                if (missingRowHeader) {
                    alert(`Row header cannot be empty in question ${problemIndex + 1}.`);
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
                    alert(`Each row must have a correct response in question ${problemIndex + 1}.`);
                    return;
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

        const isValid = isQuizValid();

        if (!isValid) {
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

        // Sanitize problems

        const sanitizeProblems = problems.map((problem: any) => {
            if (problem.questionType === 'textEntry') {
                let updateProblem = {
                    ...problem,
                };

                const updatedTextEntryOptions = problem.textEntryOptions.map((option: any) => {
                    return {
                        ...option,
                        points: Number(option.points),
                    };
                });

                updateProblem.textEntryOptions = updatedTextEntryOptions;

                updateProblem.maxCharCount = null;

                return updateProblem;
            }

            // For Highlight Text, manipulate the HTML String to add IDs to the <span> tags

            if (problem.questionType === 'highlightText') {
                let updateProblem = {
                    ...problem,
                };

                const highlightTextHtml = problem.highlightTextHtml;

                // Extract SPAN Tags from HTML and update Span IDS
                var el = document.createElement('html');
                el.innerHTML = highlightTextHtml;
                const spans: HTMLCollection = el.getElementsByTagName('span');

                // const highlightTextChoices: boolean[] = [];

                let spanIdCounter = 0;

                const updateHighlightTextChoices: boolean[] = [];

                for (let i = 0; i < spans.length; i++) {
                    const span = spans.item(i);

                    if (span.style.backgroundColor === 'rgb(97, 189, 109)') {
                        span.setAttribute('id', `${spanIdCounter}`);
                        spanIdCounter += 1;
                        updateHighlightTextChoices.push(true);
                    } else if (span.style.backgroundColor === 'rgb(247, 218, 100)') {
                        span.setAttribute('id', `${spanIdCounter}`);
                        spanIdCounter += 1;
                        updateHighlightTextChoices.push(false);
                    }
                }

                const pTag = el.getElementsByTagName('body')[0].innerHTML;

                updateProblem.highlightTextHtml = pTag;

                updateProblem.highlightTextChoices = updateHighlightTextChoices;

                updateProblem.maxCharCount = null;

                return updateProblem;
            }

            if (problem.questionType === 'freeResponse') {
                let updateProblem = {
                    ...problem,
                };

                updateProblem.maxCharCount = Number(problem.maxCharCount);

                return updateProblem;
            } else {
                // Make max Char count null since it is expected as a float
                let updateProblem = {
                    ...problem,
                };

                updateProblem.maxCharCount = null;

                return updateProblem;
            }
        });

        const durationMinutes = duration.hours * 60 + duration.minutes + duration.seconds / 60;
        server
            .mutate({
                mutation: createQuiz,
                variables: {
                    quiz: {
                        problems: sanitizeProblems,
                        duration: timer ? durationMinutes.toString() : null,
                        shuffleQuiz,
                        instructions: quizInstructions,
                        headers: JSON.stringify(headers),
                    },
                },
            })
            .then((res) => {
                setCreatingQuiz(false);
                setIsSubmitting(false);
                if (res.data && res.data.quiz.createQuiz !== 'error') {
                    setCreatingQuiz(false);
                    storeDraft('quizDraft', '');
                    handleCreate(res.data.quiz.createQuiz);
                }
            })
            .catch((e) => {
                console.log('Error', e);
                setCreatingQuiz(false);
            });
    }, [
        problems,
        cue,
        modalAnimation,
        customCategory,
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
    const loadChannelCategoriesAndSubscribers = useCallback(() => {
        if (channelId === '') {
            setCustomCategories(localCustomCategories);
            return;
        }

        // get categories
        server
            .query({
                query: getChannelCategories,
                variables: {
                    channelId,
                },
            })
            .then((res) => {
                if (res.data.channel && res.data.channel.getChannelCategories) {
                    const fetchedCategories = [...res.data.channel.getChannelCategories];

                    const categories = new Set();

                    fetchedCategories.map((category: any) => {
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
                }
            })
            .catch((err) => {});
        // get subscribers
        server
            .query({
                query: getSharedWith,
                variables: {
                    channelId,
                    cueId: null,
                },
            })
            .then((res: any) => {
                if (res.data && res.data.cue.getSharedWith) {
                    const subscribers: any[] = res.data.cue.getSharedWith;

                    const format = subscribers.map((sub: any) => {
                        return {
                            value: sub.value,
                            text: sub.label,
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
                    const options = [
                        {
                            value: 'My Notes',
                            text: 'My Notes',
                        },
                    ];

                    res.data.channel.findByUserId.map((channel: any) => {
                        options.push({
                            value: channel._id,
                            text: channel.name,
                        });
                    });

                    setChannelOptions(options);
                }
            })
            .catch((err) => {});
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

    const handleFileUpload = useCallback(async () => {
        const res = await handleFile(false, userId);

        if (!res || res.url === '' || res.type === '') {
            return false;
        }
        setUploadResult(res.url, res.type);
    }, [userId]);

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

            // Check if Cue is not empty
            if (!quizId && !imported) {
                const { title, subtitle } = htmlStringParser(cue);

                if (title === 'NO_CONTENT' && !subtitle) {
                    Alert(enterContentAlert);
                    setIsSubmitting(false);
                    return;
                }
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
                Alert('Late submission date must be set after deadline.');
                setIsSubmitting(false);
                return;
            }

            if (submission && !isQuiz && Number.isNaN(Number(totalPoints))) {
                Alert('Enter total points for assignment.');
                setIsSubmitting(false);
                return;
            }

            let saveCue = '';
            if (quizId) {
                const obj: any = {
                    quizId,
                    title,
                };
                if (timer) {
                    obj.initiatedAt = null;
                }
                saveCue = JSON.stringify(obj);
            } else if (imported) {
                const obj = {
                    type,
                    url,
                    title,
                };
                saveCue = JSON.stringify(obj);
            } else {
                saveCue = cue;
            }

            // LOCAL CUE
            if (channelId === '') {
                const cueInput = {
                    _id: Math.random().toString(),
                    cue: saveCue,
                    date: new Date(),
                    color: color.toString(),
                    shuffle,
                    frequency,
                    starred,
                    customCategory: customCategory === 'None' ? '' : customCategory,
                    endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
                    createdBy: userId,
                };

                const success = await handleUpdateCue(cueInput, true);

                if (!success) {
                    Alert('Failed to create content. Try again.');
                    setIsSubmitting(false);
                    return;
                }
                storeDraft('cueDraft', '');
                props.closeModal();
            } else {
                // CHANNEL CUE

                const variables = {
                    cue: saveCue,
                    starred,
                    color: color.toString(),
                    channelId,
                    frequency,
                    customCategory: customCategory === 'None' ? '' : customCategory,
                    shuffle,
                    createdBy: userId,
                    gradeWeight: gradeWeight.toString(),
                    submission: submission || isQuiz,
                    deadline: submission || isQuiz ? deadline.toISOString() : '',
                    initiateAt: submission || isQuiz ? initiateAt.toISOString() : '',
                    endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
                    shareWithUserIds: !limitedShare ? null : selected,
                    limitedShares: limitedShare,
                    allowedAttempts: attempts,
                    availableUntil: (submission || isQuiz) && allowLateSubmission ? availableUntil.toISOString() : '',
                    totalPoints: submission && !isQuiz ? totalPoints.toString() : '',
                };

                server
                    .mutate({
                        mutation: createCue,
                        variables,
                    })
                    .then((res) => {
                        if (res.data.cue.create) {
                            Animated.timing(modalAnimation, {
                                toValue: 0,
                                duration: 150,
                                useNativeDriver: true,
                            }).start(() => {
                                storeDraft('cueDraft', '');
                                setIsSubmitting(false);
                                handleAddCue(res.data.cue.create);
                                props.closeModal();
                            });
                        }
                    })
                    .catch((err) => {
                        setIsSubmitting(false);
                        Alert(somethingWentWrongAlert, checkConnectionAlert);
                    });
            }
        },
        [
            cue,
            modalAnimation,
            customCategory,
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
            attempts,
            totalPoints,
            userId,
        ]
    );

    /**
     * @description Clears cue content and imports
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
                    if (isQuiz) {
                        setProblems([]);
                        setHeaders([]);
                        setQuizInstructions('');
                        setTimer(false);
                        setTitle('');

                        if (Dimensions.get('window').width >= 768) {
                            setIsQuiz(false);
                        }

                        const quiz = {
                            title: '',
                            problems: [],
                            timer: false,
                            duration: {
                                hours: 1,
                                minutes: 0,
                                seconds: 0,
                            },
                            headers: [],
                            quizInstructions: '',
                        };

                        const saveQuiz = JSON.stringify(quiz);

                        setReloadQuizKey(Math.random());

                        storeDraft('quizDraft', saveQuiz);
                    } else {
                        setCue('');
                        setCueDraft('');
                        setImported(false);
                        setUrl('');
                        setType('');
                        setTitle('');
                    }
                },
            },
        ]);
    }, [isQuiz]);

    /**
     * @description Renders time to nearest minute
     */
    const roundSeconds = (time: Date) => {
        time.setMinutes(time.getMinutes() + Math.round(time.getSeconds() / 60));
        time.setSeconds(0, 0);
        return time;
    };

    const renderQuizButton = () => {
        if (
            (Dimensions.get('window').width >= 768 && allowQuizCreation && !showBooks && !showOptions) ||
            (Dimensions.get('window').width < 768 && isQuiz)
        ) {
            return (
                <TouchableOpacity
                    style={{
                        backgroundColor: 'none',
                    }}
                    onPress={async () => {
                        if (isQuiz) {
                            clearAll();
                            return;
                        }
                        setIsQuiz(true);
                        setSubmission(true);
                        const quizDraft = await AsyncStorage.getItem('quizDraft');
                        if (quizDraft) {
                            const { title } = JSON.parse(quizDraft);
                            setTitle(title);
                        }
                    }}
                >
                    <Text
                        style={{
                            textAlign: 'center',
                            color: '#fff',
                            fontSize: 15,
                            paddingHorizontal: 10,
                            marginRight: 20,
                            fontFamily: 'inter',
                            overflow: 'hidden',
                            paddingVertical: 14,
                            textTransform: 'capitalize',
                            backgroundColor: 'none',
                        }}
                    >
                        {isQuiz ? 'Clear' : 'Quiz'}
                    </Text>
                </TouchableOpacity>
            );
        }
    };

    const renderCreateNavbar = () => {
        return (
            <View
                style={{ width: '100%', backgroundColor: props.courseColor, flexDirection: 'column', zIndex: 500000 }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 64,
                        backgroundColor: 'none',
                        zIndex: 500000,
                        maxWidth: 1024,
                        width: '100%',
                        alignSelf: 'center',
                        paddingHorizontal: paddingResponsive(),
                    }}
                >
                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => {
                            if (showBooks && Dimensions.get('window').width >= 768) {
                                setShowBooks(false);
                            } else if (showOptions) {
                                setShowOptions(false);
                            } else {
                                props.closeModal();
                            }
                        }}
                        style={{
                            width: 30,
                            backgroundColor: 'none',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 15,
                        }}
                    >
                        <Ionicons size={32} name="arrow-back-outline" color="#fff" />
                    </TouchableOpacity>

                    <Text
                        style={{
                            fontSize: 20,
                            fontFamily: 'Inter',
                            marginRight: Dimensions.get('window').width < 768 ? 0 : 75,
                            color: '#fff',
                            // textTransform: 'uppercase',
                        }}
                    >
                        {props.courseName}
                    </Text>

                    {/* Buttons */}
                    <View
                        style={{
                            marginLeft: 'auto',
                            backgroundColor: 'none',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
                                flex: 1,
                                backgroundColor: 'none',
                            }}
                        >
                            {!imported &&
                            !showOptions &&
                            !isQuiz &&
                            !showBooks &&
                            Dimensions.get('window').width >= 768 ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        handleFileUpload();
                                    }}
                                    style={{
                                        backgroundColor: 'none',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            color: '#fff',
                                            fontSize: 15,
                                            paddingHorizontal: 10,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'capitalize',
                                            backgroundColor: 'none',
                                        }}
                                    >
                                        Import
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {/* QUIZ BUTTON FOR INSTRUCTORS */}

                            {/* QUIZ BUTTON FOR INSTRUCTORS */}
                            {!imported &&
                            !showOptions &&
                            !isQuiz &&
                            !showBooks &&
                            Dimensions.get('window').width >= 768 ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowBooks(!showBooks);
                                    }}
                                    style={{
                                        backgroundColor: 'none',
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            color: '#fff',
                                            fontSize: 15,
                                            paddingHorizontal: 10,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'capitalize',
                                            backgroundColor: 'none',
                                        }}
                                    >
                                        Books
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {!imported &&
                            !showOptions &&
                            !isQuiz &&
                            !showBooks &&
                            Dimensions.get('window').width >= 768 ? (
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: 'none',
                                    }}
                                    onPress={() => {
                                        setShowInsertYoutubeVideosModal(true);
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            color: '#fff',
                                            fontSize: 15,
                                            paddingHorizontal: 10,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'capitalize',
                                            backgroundColor: 'none',
                                        }}
                                    >
                                        Videos
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            {renderQuizButton()}

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
                                        backgroundColor: 'none',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            borderColor: '#fff',
                                            borderWidth: 1,
                                            color: '#000',
                                            backgroundColor: '#fff',
                                            fontSize: 11,
                                            paddingHorizontal: 24,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            paddingVertical: 14,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        NEXT
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (!init) {
        return (
            <View
                style={{
                    width: '100%',
                    paddingVertical: 100,
                    justifyContent: 'center',
                    flex: 1,
                    flexDirection: 'column',
                }}
            >
                <ActivityIndicator color={'#1F1F1F'} />
            </View>
        );
    }

    return (
        <View
            style={{
                height: Dimensions.get('window').height,
                backgroundColor: '#f8f8f8',
            }}
        >
            {renderCreateNavbar()}
            {/* <ScrollView
                style={{
                    width: '100%',
                    height:
                        dimensions.window.width < 1024 ? dimensions.window.height - 104 : dimensions.window.height - 64,
                    maxHeight:
                        dimensions.window.width < 1024 ? dimensions.window.height - 104 : dimensions.window.height - 64,
                    
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    overflow: 'scroll',
                }}
                showsVerticalScrollIndicator={true}
            > */}
            {/* For Sticky toolbar in froala */}
            <div
                style={{
                    top: 64,
                    position: 'absolute',
                    overflow: 'auto',
                    width: '100%',
                    height:
                        Dimensions.get('window').width < 768
                            ? dimensions.window.height - (64 + 60)
                            : // : dimensions.window.width < 1024
                              // ? dimensions.window.height - (64 + 68)
                              dimensions.window.height - 64,
                    maxHeight:
                        Dimensions.get('window').width < 768
                            ? dimensions.window.height - (64 + 60)
                            : // : dimensions.window.width < 1024
                              // ? dimensions.window.height - (64 + 68)
                              dimensions.window.height - 64,
                }}
                id="scroll_container"
            >
                <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'center' }}>
                    <Animated.View
                        style={{
                            width: '100%',

                            opacity: modalAnimation,
                            height:
                                Dimensions.get('window').width < 768
                                    ? dimensions.window.height - (64 + 60)
                                    : // : dimensions.window.width < 1024
                                      // ? dimensions.window.height - (64 + 68)
                                      dimensions.window.height - 64,
                            maxWidth: 1024,
                            marginTop: 30,
                            paddingHorizontal: paddingResponsive(),
                        }}
                    >
                        {!showOptions ? (
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
                        <View style={{ paddingBottom: 100 }}>
                            {showOptions ? (
                                <View
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        marginHorizontal: 10,
                                        maxWidth: 1024,
                                        alignSelf: 'center',
                                    }}
                                >
                                    {channels.length !== 0 ? (
                                        <View
                                            style={{
                                                display: 'flex',
                                                overflow: 'visible',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    borderRightWidth: 0,
                                                    borderColor: '#f2f2f2',
                                                    paddingTop: width < 768 ? 0 : 40,
                                                }}
                                            >
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
                                                        For
                                                    </Text>
                                                </View>
                                                <View style={{}}>
                                                    <View
                                                        style={{
                                                            display: 'flex',
                                                        }}
                                                    >
                                                        <label style={{ width: 180 }}>
                                                            <Select
                                                                touchUi={true}
                                                                value={selectedChannel}
                                                                themeVariant="light"
                                                                onChange={(val) => {
                                                                    const channel = val.value;

                                                                    if (channel === 'My Notes') {
                                                                        setSelectedChannel('My Notes');
                                                                        setChannelId('');
                                                                        setCustomCategories(localCustomCategories);
                                                                        setCustomCategory('None');
                                                                        setAddCustomCategory(false);
                                                                        setSubmission(false);
                                                                        setGradeWeight('');
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
                                                                        setGradeWeight('');
                                                                        setGraded(false);
                                                                    }
                                                                }}
                                                                responsive={{
                                                                    small: {
                                                                        display: 'bubble',
                                                                    },
                                                                    medium: {
                                                                        touchUi: false,
                                                                    },
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
                                                        paddingTop: 40,
                                                    }}
                                                >
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
                                                            Restrict Access
                                                        </Text>
                                                    </View>
                                                    <View style={{}}>
                                                        <View
                                                            style={{
                                                                height: 40,
                                                                marginRight: 10,
                                                                flexDirection: 'row',
                                                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                            }}
                                                        >
                                                            <Switch
                                                                value={limitedShare}
                                                                onValueChange={() => {
                                                                    setLimitedShare(!limitedShare);
                                                                }}
                                                                style={{ height: 20 }}
                                                                trackColor={{
                                                                    false: '#fff',
                                                                    true: '#000',
                                                                }}
                                                                activeThumbColor="white"
                                                            />
                                                        </View>
                                                        {channelId !== '' && limitedShare ? (
                                                            <View
                                                                style={{
                                                                    flexDirection: 'column',
                                                                    overflow: 'scroll',
                                                                }}
                                                            >
                                                                <View
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: 5,
                                                                        height: 'auto',
                                                                        maxWidth: 350,
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
                                                                                    display: 'bubble',
                                                                                },
                                                                                medium: {
                                                                                    touchUi: false,
                                                                                },
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
                                                        paddingTop: 40,
                                                    }}
                                                >
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
                                                            {PreferredLanguageText('submissionRequired')}
                                                        </Text>
                                                    </View>
                                                    <View style={{}}>
                                                        <View
                                                            style={{
                                                                height: 40,
                                                                marginRight: 10,
                                                                flexDirection: 'row',
                                                                justifyContent: width < 768 ? 'flex-start' : 'flex-end',
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
                                                        <View
                                                            style={{
                                                                width: '100%',
                                                                marginBottom: 15,
                                                            }}
                                                        >
                                                            <View style={{}}>
                                                                {submission ? (
                                                                    <View
                                                                        style={{
                                                                            width: '100%',
                                                                            display: 'flex',
                                                                            flexDirection: 'row',

                                                                            alignItems: 'center',
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
                                                                                placeholder: 'Please Select...',
                                                                            }}
                                                                            onChange={(event: any) => {
                                                                                const date = new Date(event.value);
                                                                                const roundValue = roundSeconds(date);
                                                                                if (date < new Date()) {
                                                                                    Alert(
                                                                                        'Available date must be set in the future.'
                                                                                    );
                                                                                    return;
                                                                                }
                                                                                setInitiateAt(roundValue);
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
                                                                ) : null}
                                                            </View>
                                                        </View>

                                                        {/* Add it here */}

                                                        <View style={{ width: '100%' }}>
                                                            <View
                                                                style={{
                                                                    flexDirection: 'row',
                                                                }}
                                                            >
                                                                {submission ? (
                                                                    <View
                                                                        style={{
                                                                            width: '100%',
                                                                            display: 'flex',
                                                                            flexDirection: 'row',

                                                                            alignItems: 'center',
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
                                                                                placeholder: 'Please Select...',
                                                                            }}
                                                                            onChange={(event: any) => {
                                                                                const date = new Date(event.value);
                                                                                if (date < new Date()) {
                                                                                    Alert(
                                                                                        'Deadline must be set in the future.'
                                                                                    );
                                                                                    return;
                                                                                }
                                                                                const roundValue = roundSeconds(date);
                                                                                setDeadline(roundValue);
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
                                                        paddingTop: 40,
                                                    }}
                                                >
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
                                                            Grade Weight
                                                        </Text>
                                                    </View>
                                                    <View style={{}}>
                                                        <View style={{}}>
                                                            <View
                                                                style={{
                                                                    height: 40,
                                                                    marginRight: 10,
                                                                    flexDirection: 'row',
                                                                    justifyContent:
                                                                        width < 768 ? 'flex-start' : 'flex-end',
                                                                }}
                                                            >
                                                                <Switch
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
                                                        <View style={{}}>
                                                            {graded ? (
                                                                <View
                                                                    style={{
                                                                        flexDirection: 'row',
                                                                        justifyContent:
                                                                            width < 768 ? 'flex-start' : 'flex-end',

                                                                        alignItems: 'center',
                                                                    }}
                                                                >
                                                                    <TextInput
                                                                        value={gradeWeight}
                                                                        style={{
                                                                            width: '25%',
                                                                            borderColor: '#cccccc',
                                                                            borderRadius: 2,
                                                                            borderWidth: 1,
                                                                            fontSize: 15,
                                                                            padding: 15,
                                                                            paddingVertical: 12,
                                                                            marginTop: 0,
                                                                            backgroundColor: '#fff',
                                                                        }}
                                                                        placeholder={'0-100'}
                                                                        onChangeText={(val) => setGradeWeight(val)}
                                                                        placeholderTextColor={'#1F1F1F'}
                                                                        keyboardType={'numeric'}
                                                                    />
                                                                    <Text
                                                                        style={{
                                                                            fontSize: 15,
                                                                            color: '#1F1F1F',
                                                                            textAlign: 'left',
                                                                            paddingHorizontal: 10,
                                                                            fontFamily: 'Inter',
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
                                                        paddingTop: 40,
                                                    }}
                                                >
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
                                                        <View style={{}}>
                                                            <View
                                                                style={{
                                                                    height: 40,
                                                                    marginRight: 10,
                                                                    flexDirection: 'row',
                                                                    justifyContent:
                                                                        width < 768 ? 'flex-start' : 'flex-end',
                                                                }}
                                                            >
                                                                <Switch
                                                                    value={allowLateSubmission}
                                                                    onValueChange={() =>
                                                                        setAllowLateSubmission(!allowLateSubmission)
                                                                    }
                                                                    style={{ height: 20 }}
                                                                    trackColor={{
                                                                        false: '#fff',
                                                                        true: '#000',
                                                                    }}
                                                                    activeThumbColor="white"
                                                                />
                                                            </View>
                                                        </View>
                                                        <View style={{}}>
                                                            {allowLateSubmission ? (
                                                                <View
                                                                    style={{
                                                                        width: '100%',
                                                                        display: 'flex',
                                                                        flexDirection: 'row',

                                                                        alignItems: 'center',
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
                                                                            placeholder: 'Please Select...',
                                                                        }}
                                                                        onChange={(event: any) => {
                                                                            const date = new Date(event.value);
                                                                            if (date < deadline) {
                                                                                Alert(
                                                                                    'Late submission date must be set after deadline.'
                                                                                );
                                                                                return;
                                                                            }
                                                                            const roundValue = roundSeconds(date);
                                                                            setAvailableUntil(roundValue);
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
                                                            ) : null}
                                                        </View>
                                                    </View>
                                                </View>
                                            ) : null}

                                            {/* Total Score if it is an assignment */}
                                            {submission && !isQuiz ? (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        flexDirection: width < 768 ? 'column' : 'row',
                                                        paddingTop: 40,
                                                    }}
                                                >
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
                                                    <View style={{}}>
                                                        <TextInput
                                                            value={totalPoints}
                                                            style={{
                                                                width: 120,
                                                                borderColor: '#cccccc',
                                                                borderRadius: 2,
                                                                borderWidth: 1,
                                                                fontSize: 15,
                                                                padding: 15,
                                                                paddingVertical: 12,
                                                                marginTop: 0,
                                                                backgroundColor: '#fff',
                                                            }}
                                                            placeholder={''}
                                                            onChangeText={(val) => {
                                                                if (Number.isNaN(Number(val))) return;
                                                                setTotalPoints(val);
                                                            }}
                                                            keyboardType="numeric"
                                                            placeholderTextColor={'#1F1F1F'}
                                                        />
                                                    </View>
                                                </View>
                                            ) : null}

                                            {/* Allowed attempts */}

                                            {submission && isQuiz ? (
                                                <View
                                                    style={{
                                                        width: '100%',
                                                        flexDirection: width < 768 ? 'column' : 'row',
                                                        paddingTop: 40,
                                                    }}
                                                >
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
                                                            Unlimited Attempts
                                                        </Text>
                                                    </View>
                                                    <View style={{}}>
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
                                                                        setAttempts('');
                                                                    } else {
                                                                        setAttempts('1');
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

                                                                    justifyContent:
                                                                        width < 768 ? 'flex-start' : 'flex-end',
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <Text style={styles.text}>Allowed attempts</Text>
                                                                <TextInput
                                                                    value={attempts}
                                                                    style={{
                                                                        width: '25%',
                                                                        borderColor: '#cccccc',
                                                                        borderRadius: 2,
                                                                        borderWidth: 1,
                                                                        fontSize: 15,
                                                                        padding: 15,
                                                                        paddingVertical: 12,
                                                                        marginTop: 0,
                                                                        backgroundColor: '#fff',
                                                                    }}
                                                                    placeholder={''}
                                                                    onChangeText={(val) => {
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
                                            display: 'flex',
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: '100%',
                                                borderRightWidth: 0,
                                                borderColor: '#f2f2f2',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '100%',

                                                    flexDirection: width < 768 ? 'column' : 'row',
                                                    paddingTop: channels.length === 0 && width < 768 ? 0 : 40,
                                                }}
                                            >
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
                                                        {PreferredLanguageText('category')}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={{
                                                        flexDirection: 'row',

                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <View style={{ width: '85%' }}>
                                                        {addCustomCategory ? (
                                                            <View style={styles.colorBar}>
                                                                <TextInput
                                                                    value={customCategory}
                                                                    style={{
                                                                        borderColor: '#cccccc',
                                                                        borderRadius: 2,
                                                                        borderWidth: 1,
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
                                                                            display: 'bubble',
                                                                        },
                                                                        medium: {
                                                                            touchUi: false,
                                                                        },
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </View>
                                                    <View
                                                        style={{
                                                            width: '15%',

                                                            paddingLeft: 20,
                                                        }}
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
                                                                    name={
                                                                        addCustomCategory ? 'close' : 'create-outline'
                                                                    }
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
                                                paddingBottom: 15,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flex: 1,
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        color: '#000000',
                                                        fontFamily: 'Inter',
                                                        paddingBottom: 15,
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
                                                
                                            }}>
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    color: '#000000',
                                                    fontFamily: 'Inter'
                                                }}>
                                                Remind
                                            </Text>
                                        </View>
                                        <View
                                            style={{
                                                
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
                                                    false: '#fff',
                                                    true: '#000'
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
                                                    
                                                }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}>
                                                    Repeat Reminder
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        
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
                                                            false: '#fff',
                                                            true: '#000'
                                                        }}
                                                        activeThumbColor="white"
                                                    />
                                                </View>
                                                {!shuffle ? (
                                                    <View
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            
                                                            alignItems: 'center'
                                                        }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
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
                                                            
                                                        }}>
                                                        <View>
                                                            <Text
                                                                style={{
                                                                    fontSize: 13,
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
                                                    
                                                }}>
                                                <Text
                                                    style={{
                                                        fontSize: 15,
                                                        color: '#000000',
                                                        fontFamily: 'Inter'
                                                    }}>
                                                    Remind Indefinitely
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        
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
                                                            false: '#fff',
                                                            true: '#000'
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
                                                paddingTop: 40,
                                            }}
                                        >
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
                                                    Timed
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        height: 40,
                                                        marginRight: 10,
                                                        flexDirection: 'row',
                                                        justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                    }}
                                                >
                                                    <Switch
                                                        value={timer}
                                                        onValueChange={() => {
                                                            if (timer) {
                                                                setDuration({
                                                                    hours: 1,
                                                                    minutes: 0,
                                                                    seconds: 0,
                                                                });
                                                            }
                                                            setTimer(!timer);
                                                        }}
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#fff',
                                                            true: '#000',
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
                                                            flexDirection: 'row',
                                                        }}
                                                    >
                                                        <View style={{}}>
                                                            <Menu
                                                                onSelect={(hour: any) =>
                                                                    setDuration({
                                                                        ...duration,
                                                                        hours: hour,
                                                                    })
                                                                }
                                                            >
                                                                <MenuTrigger>
                                                                    <Text
                                                                        style={{
                                                                            // fontFamily: "inter",
                                                                            fontSize: 15,
                                                                            color: '#000000',
                                                                        }}
                                                                    >
                                                                        {duration.hours} H{' '}
                                                                        <Ionicons
                                                                            name="chevron-down-outline"
                                                                            size={15}
                                                                        />{' '}
                                                                        &nbsp; &nbsp;: &nbsp; &nbsp;
                                                                    </Text>
                                                                </MenuTrigger>
                                                                <MenuOptions
                                                                    optionsContainerStyle={{
                                                                        shadowOffset: {
                                                                            width: 2,
                                                                            height: 2,
                                                                        },
                                                                        shadowColor: '#000',
                                                                        // overflow: 'hidden',
                                                                        shadowOpacity: 0.07,
                                                                        shadowRadius: 7,
                                                                        padding: 7,
                                                                        borderWidth: 1,
                                                                        borderColor: '#CCC',
                                                                    }}
                                                                >
                                                                    {hours.map((hour: any, ind: number) => {
                                                                        return (
                                                                            <MenuOption
                                                                                key={ind.toString()}
                                                                                value={hour}
                                                                            >
                                                                                <Text>{hour}</Text>
                                                                            </MenuOption>
                                                                        );
                                                                    })}
                                                                </MenuOptions>
                                                            </Menu>
                                                        </View>
                                                        <View style={{}}>
                                                            <Menu
                                                                onSelect={(min: any) =>
                                                                    setDuration({
                                                                        ...duration,
                                                                        minutes: min,
                                                                    })
                                                                }
                                                            >
                                                                <MenuTrigger>
                                                                    <Text
                                                                        style={{
                                                                            // fontFamily: "inter",
                                                                            fontSize: 15,
                                                                            color: '#000000',
                                                                        }}
                                                                    >
                                                                        {duration.minutes} m{' '}
                                                                        <Ionicons
                                                                            name="chevron-down-outline"
                                                                            size={15}
                                                                        />
                                                                    </Text>
                                                                </MenuTrigger>
                                                                <MenuOptions
                                                                    optionsContainerStyle={{
                                                                        shadowOffset: {
                                                                            width: 2,
                                                                            height: 2,
                                                                        },
                                                                        shadowColor: '#000',
                                                                        // overflow: 'hidden',
                                                                        shadowOpacity: 0.07,
                                                                        shadowRadius: 7,
                                                                        padding: 7,
                                                                        borderWidth: 1,
                                                                        borderColor: '#CCC',
                                                                    }}
                                                                >
                                                                    {minutes.map((min: any, ind: number) => {
                                                                        return (
                                                                            <MenuOption
                                                                                key={ind.toString()}
                                                                                value={min}
                                                                            >
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
                                                paddingTop: 40,
                                            }}
                                        >
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
                                                    Random Order
                                                </Text>
                                            </View>
                                            <View style={{}}>
                                                <View
                                                    style={{
                                                        height: 40,
                                                        flexDirection: 'row',
                                                        justifyContent: width < 768 ? 'flex-start' : 'flex-end',
                                                        marginRight: 10,
                                                    }}
                                                >
                                                    <Switch
                                                        value={shuffleQuiz}
                                                        onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
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
                                </View>
                            ) : (
                                <>
                                    {(imported || isQuiz) & !showBooks ? (
                                        <View
                                            style={{
                                                flexDirection: width < 768 ? 'column' : 'row',
                                            }}
                                        >
                                            <View
                                                style={{
                                                    width: '100%',
                                                    borderRightWidth: 0,
                                                    // borderColor: '#f2f2f2',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',

                                                    marginBottom: 25,
                                                }}
                                            >
                                                <TextareaAutosize
                                                    value={title}
                                                    style={{
                                                        fontFamily: 'overpass',
                                                        width: '80%',
                                                        maxWidth: Dimensions.get('window').width < 768 ? '80%' : 400,
                                                        minWidth: Dimensions.get('window').width < 768 ? '80%' : 400,
                                                        border: '1px solid #cccccc',
                                                        borderRadius: 2,
                                                        fontSize: 15,
                                                        padding: 10,
                                                        marginTop: 12,

                                                        height: 35,
                                                    }}
                                                    minRows={1}
                                                    placeholder={PreferredLanguageText('title')}
                                                    onChange={(e: any) => setTitle(e.target.value)}
                                                />
                                                {!isQuiz ? (
                                                    <TouchableOpacity
                                                        style={{
                                                            marginLeft:
                                                                Dimensions.get('window').width < 768 ? 20 : 'auto',
                                                            paddingTop: 15,
                                                        }}
                                                        onPress={() => clearAll()}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 15,
                                                                lineHeight: 34,
                                                                fontFamily: 'inter',
                                                                color: '#000',
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
                                        }}
                                        key={imported.toString() + showBooks.toString() + props.createActiveTab}
                                    >
                                        {showBooks ? null : isQuiz ? (
                                            <View
                                                style={{
                                                    width: '100%',
                                                    flexDirection: 'column',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            width: '100%',
                                                            maxWidth: 600,
                                                            paddingTop: 15,
                                                        }}
                                                    >
                                                        <View
                                                            key={userId.toString()}
                                                            style={{
                                                                borderWidth: 1,
                                                                borderColor: '#cccccc',
                                                                borderRadius: 2,
                                                            }}
                                                        >
                                                            <FroalaEditor
                                                                ref={RichText}
                                                                model={quizInstructions}
                                                                onModelChange={(model: any) =>
                                                                    setQuizInstructions(model)
                                                                }
                                                                config={{
                                                                    key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                                                    attribution: false,
                                                                    placeholderText: 'Quiz Instructions',
                                                                    charCounterCount: false,
                                                                    zIndex: 2003,
                                                                    // immediateReactModelUpdate: true,
                                                                    heightMin: 120,
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
                                                                    id: 'XYZ',
                                                                }}
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                                <QuizCreate
                                                    key={reloadQuizKey}
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
                                                        file: { attributes: { controlsList: 'nodownload' } },
                                                    }}
                                                    width={'100%'}
                                                    height={'100%'}
                                                />
                                            ) : (
                                                <View
                                                    key={
                                                        url +
                                                        JSON.stringify(showOptions) +
                                                        showBooks.toString() +
                                                        props.createActiveTab
                                                    }
                                                    style={{ flex: 1, maxHeight: 800 }}
                                                >
                                                    <div
                                                        className="webviewer"
                                                        ref={RichText}
                                                        style={{
                                                            height: '70vh',
                                                            borderWidth: 1,
                                                            borderColor: '#f2f2f2',
                                                            borderRadius: 1,
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
                                                    props.setCreateActiveTab('Content');
                                                }}
                                            />
                                        ) : null}
                                        {isQuiz || imported || showBooks ? null : (
                                            <View
                                                key={userId.toString() + reloadEditorKey.toString()}
                                                style={{
                                                    borderWidth: 1,
                                                    borderColor: '#cccccc',
                                                    borderRadius: 2,
                                                }}
                                            >
                                                <FroalaEditor
                                                    ref={RichText}
                                                    model={cue}
                                                    onModelChange={(model: any) => setCue(model)}
                                                    config={{
                                                        key: 'kRB4zB3D2D2E1B2A1B1rXYb1VPUGRHYZNRJd1JVOOb1HAc1zG2B1A2A2D6B1C1C4E1G4==',
                                                        attribution: false,
                                                        placeholderText: 'Enter Title',
                                                        charCounterCount: true,
                                                        zIndex: 2003,
                                                        // immediateReactModelUpdate: true,
                                                        heightMin: Dimensions.get('window').height - 95 - 64 - 150,
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
                                                        toolbarButtons: FULL_FLEDGED_TOOLBAR_BUTTONS(
                                                            Dimensions.get('window').width
                                                        ),
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
                                                            'line',
                                                        ],
                                                        htmlAllowedTags: ['.*'],
                                                        htmlAllowedAttrs: ['.*'],
                                                        htmlRemoveTags: ['script'],
                                                        scrollableContainer: '#scroll_container',
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
                                                                if (images[0].size > 5 * 1024 * 1024) {
                                                                    alert('Image size must be less than 5mb.');
                                                                    return false;
                                                                }

                                                                return true;
                                                            },
                                                        },
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

                                            justifyContent: 'center',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            height: 50,
                                            // paddingTop: 10,
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
                                            disabled={isSubmitting || creatingQuiz || user.email === disableEmailId}
                                            style={
                                                {
                                                    // borderRadius: 15,
                                                }
                                            }
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
                                                {isSubmitting ? 'Creating...' : 'Create'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            {/* Collapsible ends here */}
                        </View>
                    </Animated.View>
                </View>
                {/* </ScrollView> */}
            </div>
        </View>
    );
};

export default Create;

const styles: any = StyleSheet.create({
    footer: {
        width: '100%',

        display: 'flex',
        flexDirection: 'row',
        marginTop: 80,
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
        marginTop: 0,
        marginBottom: 20,
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',

        lineHeight: 20,
    },
    text: {
        fontSize: 15,
        color: '#1F1F1F',
        textAlign: 'left',
        paddingHorizontal: 10,
        fontFamily: 'Inter',
    },
    all: {
        fontSize: 13,
        color: '#1F1F1F',
        height: 22,
        paddingHorizontal: 10,
    },
});
