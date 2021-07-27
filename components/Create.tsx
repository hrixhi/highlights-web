import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, ScrollView, Animated, Dimensions } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { fetchAPI } from '../graphql/FetchAPI';
import { createCue, createQuiz, getChannelCategories, getChannels, getSharedWith } from '../graphql/QueriesAndMutations';
import Datetime from 'react-datetime';
import * as ImagePicker from 'expo-image-picker';
import { DatePicker } from 'rsuite';
import {
    actions,
    RichEditor,
    RichToolbar,
} from "react-native-pell-rich-editor";
import FileUpload from './UploadFiles';
import Alert from '../components/Alert'
// import Select from 'react-select';
import QuizCreate from './QuizCreate';
import DurationPicker from 'react-duration-picker'
import TeXToSVG from "tex-to-svg";
import EquationEditor from "equation-editor-react";
// import WebView from 'react-native-webview';
import { PreferredLanguageText } from "../helpers/LanguageContext";
import moment from 'moment';
import ReactPlayer from 'react-player'
import Webview from './Webview'
import Multiselect from 'multiselect-react-dropdown';

import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';


const Create: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const current = new Date()
    const [cue, setCue] = useState('')
    const [shuffle, setShuffle] = useState(false)
    const [starred, setStarred] = useState(false)
    const [notify, setNotify] = useState(false)
    const [color, setColor] = useState(0)
    const [frequency, setFrequency] = useState('0')
    const [customCategory, setCustomCategory] = useState('')
    const [localCustomCategories] = useState(props.customCategories)
    const [customCategories, setCustomCategories] = useState(props.customCategories)
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [channels, setChannels] = useState<any[]>([])
    const [channelId, setChannelId] = useState<any>('')
    const [endPlayAt, setEndPlayAt] = useState(new Date(current.getTime() + 1000 * 60 * 60))
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true)
    const colorChoices: any[] = ['#d91d56', '#ED7D22', '#F8D41F', '#B8D41F', '#53BE6D'].reverse()
    const [modalAnimation] = useState(new Animated.Value(0))
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random())
    let RichText: any = useRef()
    const [height, setHeight] = useState(100)
    const [init, setInit] = useState(false)
    const [submission, setSubmission] = useState(false)
    const [deadline, setDeadline] = useState(new Date(current.getTime() + 1000 * 60 * 60 * 24))
    const [initiateAt, setInitiateAt] = useState(new Date(current.getTime()))
    const [gradeWeight, setGradeWeight] = useState<any>(0)
    const [graded, setGraded] = useState(false)
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [showImportOptions, setShowImportOptions] = useState(false)
    const [selected, setSelected] = useState<any[]>([])
    const [subscribers, setSubscribers] = useState<any[]>([])
    const [expandMenu, setExpandMenu] = useState(false)
    // options to create Quiz
    const [isQuiz, setIsQuiz] = useState(false)
    const [problems, setProblems] = useState<any[]>([])
    const [headers, setHeaders] = useState<any>({});
    const [creatingQuiz, setCreatingQuiz] = useState(false)
    const [frequencyName, setFrequencyName] = useState('Day')

    const [timer, setTimer] = useState(false)
    const [duration, setDuration] = useState({
        hours: 1, minutes: 0, seconds: 0
    })
    const [equation, setEquation] = useState('y = x + 1')
    const [showEquationEditor, setShowEquationEditor] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shuffleQuiz, setShuffleQuiz] = useState(false);
    const [quizInstructions, setQuizInstructions] = useState('');

    const [channelName, setChannelName] = useState('')

    const window = Dimensions.get("window");
    const screen = Dimensions.get("screen");

    const [dimensions, setDimensions] = useState({ window, screen });
    // Alerts

    const enterOneProblemAlert = PreferredLanguageText('enterOneProblem')
    const invalidDurationAlert = PreferredLanguageText('invalidDuration')
    const fillMissingProblemsAlert = PreferredLanguageText('fillMissingProblems')
    const enterNumericPointsAlert = PreferredLanguageText('enterNumericPoints')
    // const mustHaveOneOptionAlert = PreferredLanguageText('mustHaveOneOption')
    const fillMissingOptionsAlert = PreferredLanguageText('fillMissingOptions')
    const eachOptionOneCorrectAlert = PreferredLanguageText('eachOptionOneCorrect')
    const noStudentSelectedAlert = PreferredLanguageText('noStudentSelected')
    const selectWhoToShareAlert = PreferredLanguageText('selectWhoToShare')
    const clearQuestionAlert = PreferredLanguageText('clearQuestion')
    const cannotUndoAlert = PreferredLanguageText('cannotUndo')
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');
    const enterContentAlert = PreferredLanguageText('enterContent');
    const enterTitleAlert = PreferredLanguageText('enterTitle');

    const onDimensionsChange = useCallback(({ window, screen }: any) => {
        setDimensions({ window, screen })
    }, []);
    useEffect(() => {
        Dimensions.addEventListener("change", onDimensionsChange);
        return () => {
            Dimensions.removeEventListener("change", onDimensionsChange);
        };
    }, [])

    const insertEquation = useCallback(() => {
        const SVGEquation = TeXToSVG(equation, { width: 100 }); // returns svg in html format
        RichText.current.insertHTML('<div><br/>' + SVGEquation + '<br/></div>');
        setShowEquationEditor(false)
        setEquation('')
        // setReloadEditorKey(Math.random())
    }, [equation, RichText, RichText.current, cue])

    useEffect(() => {
        if (cue[0] === '{' && cue[cue.length - 1] === '}') {
            const obj = JSON.parse(cue)
            setImported(true)
            setUrl(obj.url)
            setType(obj.type)
        } else {
            setImported(false)
            setUrl('')
            setType('')
            setTitle('')
        }
    }, [cue])

    const createNewQuiz = useCallback(() => {

        setIsSubmitting(true)
        setCreatingQuiz(true)
        let error = false
        if (problems.length === 0) {
            Alert(enterOneProblemAlert)
            return;
        }
        if (timer) {
            if (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0) {
                Alert(invalidDurationAlert)
                return;
            }
        }
        problems.map((problem) => {
            if (problem.question === '' || problem.question === 'formula:') {
                Alert(fillMissingProblemsAlert)
                error = true;
            }
            if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                Alert(enterNumericPointsAlert)
                error = true;
            }
            let optionFound = false
            // if (problem.options.length === 0) {
            //     Alert(mustHaveOneOptionAlert)
            //     error = true;
            // }

            // If MCQ then > 2 options
            if (!problem.questionType && problem.options.length < 2) {
                Alert("Problem must have at least 2 options")
                error = true;
            }

            
            // If MCQ, check if any options repeat:
            if (!problem.questionType || problem.questionType === "trueFalse") {
                const keys: any = {};

                problem.options.map((option: any) => {
                    if (option.option === '' || option.option === 'formula:') {
                        Alert(fillMissingOptionsAlert)
                        error = true;
                    }

                    if (option.option in keys) {
                        Alert("Option repeated in a question");
                        error = true
                    }

                    if (option.isCorrect) {
                        optionFound = true
                    }

                    keys[option.option] = 1
                })

                if (!optionFound) {
                    Alert(eachOptionOneCorrectAlert)
                    error = true;
                }
            }

        })
        if (error) {
            setIsSubmitting(false)
            setCreatingQuiz(false)
            return
        }

        const server = fetchAPI('')
        const durationMinutes = (duration.hours * 60) + (duration.minutes) + (duration.seconds / 60);
        server.mutate({
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
        }).then(res => {
            setCreatingQuiz(false)
            setIsSubmitting(false)
            if (res.data && res.data.quiz.createQuiz !== 'error') {
                setCreatingQuiz(false)
                storeDraft('quizDraft', '');
                handleCreate(res.data.quiz.createQuiz)
            }
        })
    }, [problems, cue, modalAnimation, customCategory, props.saveDataInCloud, isQuiz,
        gradeWeight, deadline, initiateAt, submission, imported, selected, subscribers,
        shuffle, frequency, starred, color, notify, title, type, url, timer, duration,
        props.closeModal, channelId, endPlayAt, playChannelCueIndef, shuffleQuiz, quizInstructions,
        headers])

    const loadChannelCategoriesAndSubscribers = useCallback(async () => {

        if (channelId === '') {
            setCustomCategories(localCustomCategories)
            return
        }
        const server = fetchAPI('')
        // get categories
        server.query({
            query: getChannelCategories,
            variables: {
                channelId
            }
        }).then(res => {
            if (res.data.channel && res.data.channel.getChannelCategories) {
                setCustomCategories(res.data.channel.getChannelCategories)
            }
        }).catch(err => {
        })
        // get subscribers
        server.query({
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
                            id: sub.value,
                            name: sub.label
                        }
                    })

                    setSubscribers(format)
                    // clear selected
                    setSelected(format)
                }
            })
            .catch((err: any) => console.log(err))

    }, [channelId, localCustomCategories])

    useEffect(() => {
        loadChannelCategoriesAndSubscribers()
    }, [channelId])

    const handleHeightChange = useCallback((h: any) => {
        setHeight(h)
    }, [])

    const cameraCallback = useCallback(async () => {
        const cameraSettings = await ImagePicker.getCameraPermissionsAsync()
        if (!cameraSettings.granted) {
            await ImagePicker.requestCameraPermissionsAsync();
            const updatedCameraSettings = await ImagePicker.getCameraPermissionsAsync()
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
            RichText.current.insertImage(result.uri, 'border-radius: 8px; max-width: 400px; width: 100%;')
        }
    }, [RichText, RichText.current])

    const galleryCallback = useCallback(async () => {

        const gallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
        if (!gallerySettings.granted) {
            await ImagePicker.requestMediaLibraryPermissionsAsync()
            const updatedGallerySettings = await ImagePicker.getMediaLibraryPermissionsAsync()
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
            RichText.current.insertImage(result.uri, 'border-radius: 8px; max-width: 400px; width: 100%;')
        }
    }, [RichText, RichText.current])

    const loadChannels = useCallback(async () => {
        const uString: any = await AsyncStorage.getItem('user')
        if (uString) {
            const user = JSON.parse(uString)
            const server = fetchAPI('')
            server.query({
                query: getChannels,
                variables: {
                    userId: user._id
                }
            })
                .then(res => {
                    if (res.data.channel.findByUserId) {
                        setChannels(res.data.channel.findByUserId)
                    }
                })
                .catch(err => {
                })
        }
        setInit(true)
    }, [])

    useEffect(() => {
        loadChannels()
    }, [])

    useEffect(() => {
        if (!init) {
            return
        }
        let saveCue = ''
        // Current limitation - not able to save quizzes...
        if (imported) {
            const obj = {
                type,
                url,
                title
            }
            saveCue = JSON.stringify(obj)
        } else if (isQuiz) {
            const quiz = {
                title,
                problems,
                timer,
                duration,
                headers,
                quizInstructions
            }

            const saveQuiz = JSON.stringify(quiz)

            storeDraft('quizDraft', saveQuiz)
        } else {
            saveCue = cue
        }
        if (saveCue && saveCue !== "") {
            storeDraft('cueDraft', saveCue)
        } else {
            storeDraft('cueDraft', '')
        }
    }, [cue, init, type, imported, url, title, isQuiz, problems, timer, duration, headers, quizInstructions])

    const storeDraft = useCallback(async (type, value) => {
        await AsyncStorage.setItem(type, value)
    }, [])

    const handleCreate = useCallback(async (quizId?: string) => {
        setIsSubmitting(true)

        if (isSubmitting) return;

        if (!quizId && (cue === null || cue.toString().trim() === '')) {
            Alert(enterContentAlert)
            setIsSubmitting(false)
            return
        }

        if ((imported || isQuiz) && title === '') {
            Alert(enterTitleAlert)
            setIsSubmitting(false)
            return
        }

        if (submission && deadline < new Date()) {
            Alert("Submission deadline must be in future")
            setIsSubmitting(false)
            return
        }


        let saveCue = ''
        if (quizId) {
            const obj: any = {
                quizId,
                title
            }
            if (timer) {
                obj.initiatedAt = null
            }
            saveCue = JSON.stringify(obj)
        } else if (imported) {
            const obj = {
                type,
                url,
                title
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = cue
        }

        // LOCAL CUE
        if (channelId === '') {
            let subCues: any = {}
            try {
                const value = await AsyncStorage.getItem('cues')
                if (value) {
                    subCues = JSON.parse(value)
                }
            } catch (e) {
            }
            let _id = subCues['local'].length;
            while (true) {
                const duplicateId = subCues['local'].findIndex((item: any) => {
                    return item._id === _id
                })
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
                customCategory,
                endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : ''
            })
            const stringifiedCues = JSON.stringify(subCues)
            await AsyncStorage.setItem('cues', stringifiedCues)
            storeDraft('cueDraft', '')
            // setIsSubmitting(false)
            props.closeModal()
        } else {
            // CHANNEL CUE
            const uString = await AsyncStorage.getItem('user')
            if (!uString) {
                return
            }

            if (selected.length === 0) {

                Alert(noStudentSelectedAlert, selectWhoToShareAlert)
                setIsSubmitting(false)
                return;
            }

            if ((submission || isQuiz) && deadline < initiateAt) {
                Alert("Available from time must be set before deadline", "")
                setIsSubmitting(false)
                return;
            }

            const user = JSON.parse(uString)
            const server = fetchAPI('')
            const userIds: any[] = []
            if (selected.length !== 0) {
                selected.map((item) => {
                    userIds.push(item.value)
                })
            }

            const variables = {
                cue: saveCue,
                starred,
                color: color.toString(),
                channelId,
                frequency,
                customCategory,
                shuffle,
                createdBy: user._id,
                gradeWeight: gradeWeight.toString(),
                submission: submission || isQuiz,
                deadline: submission || isQuiz ? deadline.toISOString() : '',
                initiateAt: submission || isQuiz ? initiateAt.toISOString() : '',
                endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
                shareWithUserIds: selected.length === subscribers.length ? null : userIds
            }

            server.mutate({
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
                            storeDraft('cueDraft', '')
                            setIsSubmitting(false)
                            props.closeModal()
                        })
                    }
                })
                .catch(err => {
                    setIsSubmitting(false)
                    Alert(somethingWentWrongAlert, checkConnectionAlert)
                })
        }
        setIsSubmitting(false)

    }, [cue, modalAnimation, customCategory, props.saveDataInCloud, isQuiz, timer, duration,
        gradeWeight, deadline, initiateAt, submission, imported, selected, subscribers,
        shuffle, frequency, starred, color, notify, title, type, url,
        props.closeModal, channelId, endPlayAt, playChannelCueIndef])

    useEffect(() => {
        const getData = async () => {
            try {
                const h = await AsyncStorage.getItem('cueDraft')
                if (h !== null) {
                    setCue(h)
                }
                const quizDraft = await AsyncStorage.getItem('quizDraft')
                if (quizDraft !== null) {
                    const { duration, timer, problems, title, headers, quizInstructions } = JSON.parse(quizDraft);

                    setDuration(duration);
                    setTimer(timer);
                    setProblems(problems);
                    setTitle(title);
                    setHeaders(headers)
                    setQuizInstructions(quizInstructions)
                }
            } catch (e) {
                console.log(e)
            }
        }
        getData()
    }, [])

    const clearAll = useCallback(() => {
        Alert(
            clearQuestionAlert,
            cannotUndoAlert,
            [
                {
                    text: "Cancel", style: "cancel"
                },
                {
                    text: "Clear", onPress: () => {
                        setCue('')
                        setImported(false)
                        setUrl('')
                        setType('')
                        setTitle('')
                        setProblems([])
                        setIsQuiz(false)
                        setTimer(false)
                        setShowEquationEditor(false)
                        setEquation('')
                        setReloadEditorKey(Math.random())
                    }
                }
            ]
        )
    }, [])

    useEffect(() => {
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

    const onChange = useCallback((value, { action, removedValue }) => {
        switch (action) {
            case 'remove-value':
            case 'pop-value':
                if (removedValue.isFixed) {
                    return;
                }
                break;
            case 'clear':
                value = subscribers.filter(v => v.isFixed);
                break;
        }
        setSelected(value)
    }, [subscribers])

    const onChangeDuration = useCallback((duration: any) => {
        const { hours, minutes, seconds } = duration;
        setDuration({ hours, minutes, seconds });
    }, [])

    const yesterday = moment().subtract(1, 'day');
    const disablePastDt = (current: any) => {
        return current.isAfter(yesterday);
    };

    const quizAlert = PreferredLanguageText('quizzesCanOnly')
    const width = dimensions.window.width;
    return (
        <View style={{
            width: '100%',
            height: dimensions.window.width < 1024 ? dimensions.window.height - 30 : dimensions.window.height,
            backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingHorizontal: 20,
            overflow: 'hidden'
        }}>
            <Animated.View style={{
                width: '100%',
                backgroundColor: 'white',
                opacity: modalAnimation,
                height: '100%',
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 20,
                                paddingBottom: 20,
                                fontFamily: 'inter',
                                // textTransform: "uppercase",
                                // paddingLeft: 10,
                                flex: 1,
                                lineHeight: 25
                            }}
                        >
                            {PreferredLanguageText('new')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setStarred(!starred)}
                        style={{
                            backgroundColor: 'white',
                        }}>
                        <Text style={{
                            textAlign: 'right',
                            lineHeight: 30,
                            marginTop: -31,
                            // paddingRight: 25,
                            width: '100%'
                        }}>
                            <Ionicons name='bookmark' size={34} color={starred ? '#d91d56' : '#a2a2ac'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: dimensions.window.width < 768 ? 'column-reverse' : 'row',
                    paddingBottom: 4,
                    marginTop: showImportOptions || imported || isQuiz ? 0 : 20,
                    backgroundColor: 'white',
                }} onTouchStart={() => Keyboard.dismiss()}>
                    <View style={{ flexDirection: dimensions.window.width < 768 ? 'column' : 'row', flex: 1 }}>
                        {
                            showImportOptions ? null :
                                <RichToolbar
                                    key={reloadEditorKey.toString()}
                                    style={{
                                        flexWrap: 'wrap',
                                        backgroundColor: 'white',
                                        height: 28,
                                        overflow: 'visible'
                                    }}
                                    iconSize={12}
                                    editor={RichText}
                                    disabled={false}
                                    iconTint={"#a2a2ac"}
                                    selectedIconTint={"#a2a2ac"}
                                    disabledIconTint={"#a2a2ac"}
                                    actions={
                                        imported || isQuiz ? [""] :
                                            [
                                                actions.setBold,
                                                actions.setItalic,
                                                actions.setUnderline,
                                                actions.insertBulletsList,
                                                actions.insertOrderedList,
                                                actions.checkboxList,
                                                actions.insertLink,
                                                actions.insertImage,
                                                // "insertCamera",
                                                actions.undo,
                                                actions.redo,
                                                "clear"
                                            ]}
                                    iconMap={{
                                        ["insertCamera"]: ({ tintColor }) => <Ionicons name='camera-outline' size={15} color={tintColor} />,
                                        ["clear"]: ({ tintColor }) => <Ionicons name='trash-outline' size={13} color={tintColor} onPress={() => clearAll()} />
                                    }}
                                    onPressAddImage={galleryCallback}
                                    insertCamera={cameraCallback}
                                />
                        }
                        {
                            imported || !showImportOptions ? null :
                                <FileUpload
                                    back={() => setShowImportOptions(false)}
                                    onUpload={(u: any, t: any) => {
                                        const obj = { url: u, type: t, title }
                                        setCue(JSON.stringify(obj))
                                        setShowImportOptions(false)
                                    }}
                                />
                        }
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        {
                            !isQuiz ?
                                <Text style={{
                                    color: '#a2a2ac',
                                    fontSize: 11,
                                    lineHeight: 30,
                                    textAlign: 'right',
                                    paddingRight: 20,
                                    textTransform: 'uppercase'
                                }}
                                    onPress={() => setShowEquationEditor(!showEquationEditor)}
                                >
                                    {
                                        showEquationEditor ? PreferredLanguageText('hide') : PreferredLanguageText('formula')
                                    }
                                </Text> : null
                        }
                        {
                            isQuiz ? null :
                                <Text style={{
                                    color: '#a2a2ac',
                                    fontSize: 11,
                                    lineHeight: 30,
                                    textAlign: 'right',
                                    paddingRight: 20,
                                    textTransform: 'uppercase'
                                }}
                                    onPress={() => setShowImportOptions(true)}
                                >
                                    {PreferredLanguageText('import')}
                                </Text>
                        }
                        <Text style={{
                            color: '#a2a2ac',
                            fontSize: 11,
                            lineHeight: 30,
                            textAlign: 'right',
                            paddingRight: 10,
                            textTransform: 'uppercase'
                        }}
                            onPress={() => {
                                if (channelId !== '') {
                                    setIsQuiz(true)
                                    setSubmission(true)
                                } else {
                                    Alert(quizAlert)
                                }
                            }}
                        >
                            {PreferredLanguageText('quiz')}
                        </Text>
                    </View>
                </View>
                {
                    showEquationEditor ?
                        <View style={{ width: '100%', flexDirection: width < 768 ? 'column' : 'row', paddingBottom: 20 }}>
                            <View style={{
                                borderColor: '#f4f4f6',
                                borderWidth: 1,
                                borderRadius: 15,
                                padding: 10,
                                minWidth: 200,
                                maxWidth: '50%'
                            }}>
                                <EquationEditor
                                    value={equation}
                                    onChange={setEquation}
                                    autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                    autoOperatorNames="sin cos tan arccos arcsin arctan"
                                />
                            </View>
                            <TouchableOpacity
                                style={{
                                    justifyContent: 'center',
                                    paddingHorizontal: 20,
                                    maxWidth: '10%'
                                }}
                                onPress={() => insertEquation()}
                            >
                                <Ionicons name='add-circle-outline' color='#a2a2ac' size={20} />
                            </TouchableOpacity>
                            <View style={{ minWidth: '40%', flex: 1, paddingVertical: 5, justifyContent: 'center', }}>
                                <Text style={{ flex: 1, fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                    ^ → Superscript, _ → Subscript, int → Integral, sum → Summation, prod → Product, sqrt → Square root, bar → Bar over letter, alpha, beta, ... omega → Small Greek letter, Alpha, Beta, ... Omega → Capital Greek letter
                                </Text>
                            </View>
                        </View> : null
                }
                <ScrollView
                    style={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    scrollEventThrottle={1}
                    keyboardDismissMode={'on-drag'}
                    overScrollMode={'always'}
                    nestedScrollEnabled={true}
                >
                    {
                        imported || isQuiz ?
                            <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row', overflow: 'visible' }}>
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6', paddingRight: 15, display: 'flex', flexDirection: 'row' }}>
                                    <TextInput
                                        value={title}
                                        style={styles.input}
                                        placeholder={PreferredLanguageText('title')}
                                        onChangeText={val => setTitle(val)}
                                        placeholderTextColor={'#a2a2ac'}
                                    />
                                    <TouchableOpacity
                                        style={{
                                            marginLeft: 15,
                                            paddingTop: 15
                                        }}
                                        onPress={() => clearAll()}
                                    >
                                        <Ionicons name="trash-outline" color="#a2a2ac" size={20} style={{ alignSelf: 'center' }} />
                                        <Text
                                            style={{
                                                fontSize: 9,
                                                color: "#a2a2ac",
                                                textAlign: "center"
                                            }}>
                                            Remove
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {
                                    isQuiz ?
                                        <View style={{ width: width < 768 ? '100%' : '31.67%', borderRightWidth: 0, borderColor: '#f4f4f6', paddingTop: 10 }}>
                                            <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 15, color: '#a2a2ac' }}>
                                                    <Ionicons name='timer-outline' size={20} color={'#a2a2ac'} />
                                                </Text>
                                            </View>
                                            <View style={{
                                                backgroundColor: 'white',
                                                width: '100%',
                                                height: 40,
                                                marginRight: 10
                                            }}>
                                                <Switch
                                                    value={timer}
                                                    onValueChange={() => {
                                                        if (timer) {
                                                            setDuration({
                                                                hours: 1,
                                                                minutes: 0,
                                                                seconds: 0
                                                            })
                                                        }
                                                        setTimer(!timer)
                                                    }}
                                                    style={{ height: 20 }}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#3B64F8'
                                                    }}
                                                    activeThumbColor='white'
                                                />
                                            </View>
                                        </View> : null
                                }
                                {
                                    isQuiz && timer ?
                                        <View style={{ width: width < 768 ? '100%' : '35%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                            <DurationPicker
                                                onChange={onChangeDuration}
                                                initialDuration={{ hours: 1, minutes: 0, seconds: 0 }}
                                                maxHours={6}
                                            />
                                        </View> : null
                                }
                            </View> : null
                    }
                    <View style={{
                        width: '100%',
                        minHeight: isQuiz ? 0 : 500,
                        backgroundColor: 'white'
                    }}>
                        {
                            isQuiz ?
                                (
                                    <View style={{
                                        width: '100%',
                                        flexDirection: 'column',
                                    }}>
                                        <CustomTextInput
                                            value={quizInstructions}
                                            placeholder="Instructions"
                                            onChangeText={val => setQuizInstructions(val)}
                                            placeholderTextColor={"#a2a2ac"}
                                            required={false}
                                            hasMultipleLines={true}
                                        />
                                        <QuizCreate
                                            problems={problems}
                                            headers={headers}
                                            setProblems={(p: any) => setProblems(p)}
                                            setHeaders={(h: any) =>
                                                setHeaders(h)}
                                        />
                                    </View>
                                )
                                : (imported ?
                                    (
                                        type === 'mp4' || type === 'mp3' || type === 'mov' || type === 'mpeg' || type === 'mp2' || type === 'wav' ?
                                            <ReactPlayer url={url} controls={true} onContextMenu={(e: any) => e.preventDefault()} config={{ file: { attributes: { controlsList: 'nodownload' } } }} />
                                            :
                                            <View
                                                key={url}
                                                style={{ flex: 1 }}
                                            >
                                                <Webview
                                                    key={url}
                                                    url={url}
                                                />
                                            </View>
                                    )
                                    :
                                    null)
                        }
                        <RichEditor
                            key={reloadEditorKey.toString()}
                            containerStyle={{
                                height,
                                backgroundColor: '#f4f4f6',
                                padding: 3,
                                paddingTop: 5,
                                paddingBottom: 10,
                                borderRadius: 15,
                                display: (isQuiz || imported) ? "none" : "flex"
                            }}
                            ref={RichText}
                            style={{
                                width: '100%',
                                backgroundColor: '#f4f4f6',
                                borderRadius: 15,
                                minHeight: 650,
                                display: (isQuiz || imported) ? "none" : "flex"
                            }}
                            editorStyle={{
                                backgroundColor: '#f4f4f6',
                                placeholderColor: '#a2a2ac',
                                color: '#2F2F3C',
                                contentCSSText: 'font-size: 14px;',

                            }}
                            initialContentHTML={cue}
                            onScroll={() => Keyboard.dismiss()}
                            placeholder={PreferredLanguageText('title')}
                            onChange={(text) => {
                                const modifedText = text.split('&amp;').join('&')
                                setCue(modifedText)
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

                    </View>
                    <View style={{ flex: 1, display: 'flex', flexDirection: 'column', marginHorizontal: 10 }}>
                        {channels.length !== 0 ?
                            <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row', overflow: 'visible' }}>
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                            {/* {PreferredLanguageText('channel')} */}
                                            Share with
                                            {/* <Ionicons
                                                name='school-outline' size={20} color={'#a2a2ac'} /> */}
                                        </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '85%', backgroundColor: 'white', display: 'flex' }}>
                                            <Menu
                                                onSelect={(channel: any) => {
                                                    if (channel === '') {
                                                        setChannelId('')
                                                        setCustomCategories(localCustomCategories)
                                                        setCustomCategory('')
                                                        setAddCustomCategory(false)
                                                        setSubmission(false)
                                                        setGradeWeight(0)
                                                        setGraded(false)
                                                        setSelected([])
                                                        setSubscribers([])
                                                        setProblems([])
                                                        setIsQuiz(false)
                                                        setChannelName('')
                                                        setTimer(false)
                                                    } else {
                                                        setChannelId(channel._id)
                                                        setChannelName(channel.name)
                                                        setAddCustomCategory(false)
                                                        setCustomCategory('')
                                                        setSubmission(isQuiz ? true : false)
                                                        setGradeWeight(0)
                                                        setGraded(false)
                                                    }
                                                }}>
                                                <MenuTrigger>
                                                    <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#2F2F3C' }}>
                                                        {channelName === '' ? 'My Cues' : channelName}<Ionicons name='caret-down' size={14} />
                                                    </Text>
                                                </MenuTrigger>
                                                <MenuOptions customStyles={{
                                                    optionsContainer: {
                                                        padding: 10,
                                                        borderRadius: 15,
                                                        shadowOpacity: 0,
                                                        borderWidth: 1,
                                                        borderColor: '#f4f4f6'
                                                    }
                                                }}>
                                                    <MenuOption
                                                        value={''}>
                                                        <Text>
                                                            {PreferredLanguageText('myCues')}
                                                        </Text>
                                                    </MenuOption>
                                                    {
                                                        channels.map((channel: any) => {
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
                                    </View>
                                </View>

                                {
                                    channelId !== '' ?
                                        <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                                    {PreferredLanguageText('submissionRequired')}
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row' }}>
                                                <View style={{
                                                    backgroundColor: 'white',
                                                    height: 40,
                                                    marginRight: 10
                                                }}>
                                                    <Switch
                                                        disabled={isQuiz}
                                                        value={submission}
                                                        onValueChange={() => {
                                                            setSubmission(!submission)
                                                        }}
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#f4f4f6',
                                                            true: '#a2a2ac'
                                                        }}
                                                        activeThumbColor='white'
                                                    />
                                                </View>
                                                {
                                                    submission ?
                                                        <View style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white',
                                                        }}>
                                                            <Text style={styles.text}>
                                                                Available
                                                            </Text>
                                                            <DatePicker
                                                                preventOverflow={true}
                                                                value={initiateAt}
                                                                onChange={(event: any) => {
                                                                    const date = new Date(event)

                                                                    if (date < new Date()) return;
                                                                    setInitiateAt(date)
                                                                }}
                                                                size={'sm'}
                                                            // isValidDate={disablePastDt}
                                                            />

                                                        </View>
                                                        : null
                                                }
                                            </View>

                                            {/* Add it here */}

                                            <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                                <View style={{ flexDirection: 'row' }}>
                                                    {
                                                        submission ?
                                                            <View style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                backgroundColor: 'white',
                                                                marginLeft: 50
                                                            }}>
                                                                <Text style={styles.text}>
                                                                    {PreferredLanguageText('deadline')}
                                                                </Text>
                                                                <DatePicker
                                                                    preventOverflow={true}
                                                                    value={deadline}
                                                                    onChange={(event: any) => {
                                                                        const date = new Date(event)

                                                                        if (date < new Date()) return;

                                                                        setDeadline(date)
                                                                    }}
                                                                    size={'sm'}
                                                                // isValidDate={disablePastDt}
                                                                />


                                                            </View>
                                                            : null
                                                    }
                                                </View>

                                                {/* Add it here */}
                                            </View>

                                        </View> : null
                                }
                                {
                                    submission ?
                                        <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                                    Grade Weight
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row' }}>
                                                <View style={{
                                                    backgroundColor: 'white',
                                                    height: 40,
                                                    marginRight: 10
                                                }}>
                                                    <Switch
                                                        value={graded}
                                                        onValueChange={() => setGraded(!graded)}
                                                        style={{ height: 20 }}
                                                        trackColor={{
                                                            false: '#f4f4f6',
                                                            true: '#a2a2ac'
                                                        }}
                                                        activeThumbColor='white'
                                                    />
                                                </View>
                                                {
                                                    graded ?
                                                        <View style={{
                                                            width: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'row',
                                                            backgroundColor: 'white'
                                                        }}>
                                                            <Text style={styles.text}>
                                                                {PreferredLanguageText('percentageOverall')}
                                                            </Text>
                                                            <TextInput
                                                                value={gradeWeight}
                                                                style={styles.picker}
                                                                placeholder={'0-100'}
                                                                onChangeText={val => setGradeWeight(val)}
                                                                placeholderTextColor={'#a2a2ac'}
                                                            />
                                                        </View>
                                                        : null
                                                }
                                            </View>
                                        </View> : null
                                }
                            </View>
                            : null}

                            <View style={{ width: width < 768 ? '100%' : '33.3%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                {
                                        channelId !== '' ?
                                            <View style={{ flexDirection: 'column', marginTop: 25, overflow: 'scroll' }}>
                                                <View style={{ width: '90%', padding: 5, height: 'auto' }}>
                                                    <Multiselect
                                                        placeholder='Share with...'
                                                        displayValue='name'
                                                        // key={userDropdownOptions.toString()}
                                                        // style={{ width: '100%', color: '#202025', 
                                                        //     optionContainer: { // To change css for option container 
                                                        //         zIndex: 9999
                                                        //     }
                                                        // }}
                                                        options={subscribers} // Options to display in the dropdown
                                                        selectedValues={selected} // Preselected value to persist in dropdown
                                                        onSelect={(e, f) => {
                                                            setSelected(e);
                                                            return true
                                                        }} // Function will trigger on select event
                                                        onRemove={(e, f) => {
                                                            setSelected(e);
                                                            return true
                                                        }}
                                                    />
                                                </View>

                                            </View> : null
                                    }
                            </View>
                        <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row' }}>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                <View style={{ width: '100%', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                            {PreferredLanguageText('category')}
                                        </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '85%', backgroundColor: 'white' }}>
                                            {
                                                addCustomCategory ?
                                                    <View style={styles.colorBar}>
                                                        <TextInput
                                                            value={customCategory}
                                                            style={styles.allGrayOutline}
                                                            placeholder={'Enter Category'}
                                                            onChangeText={val => {
                                                                setCustomCategory(val)
                                                            }}
                                                            placeholderTextColor={'#a2a2ac'}
                                                        />
                                                    </View> :
                                                    <Menu
                                                        onSelect={(cat: any) => setCustomCategory(cat)}>
                                                        <MenuTrigger>
                                                            <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#a2a2ac' }}>
                                                                {customCategory === '' ? 'None' : customCategory}<Ionicons name='caret-down' size={14} />
                                                            </Text>
                                                        </MenuTrigger>
                                                        <MenuOptions customStyles={{
                                                            optionsContainer: {
                                                                padding: 10,
                                                                borderRadius: 15,
                                                                shadowOpacity: 0,
                                                                borderWidth: 1,
                                                                borderColor: '#f4f4f6'
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
                                            }
                                        </View>
                                        <View style={{ width: '15%', backgroundColor: 'white' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    if (addCustomCategory) {
                                                        setCustomCategory('')
                                                        setAddCustomCategory(false)
                                                    } else {
                                                        setCustomCategory('')
                                                        setAddCustomCategory(true)
                                                    }
                                                }}
                                                style={{ backgroundColor: 'white' }}>
                                                <Text style={{ textAlign: 'center', lineHeight: 20, width: '100%' }}>
                                                    <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#a2a2ac'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f6' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                        {PreferredLanguageText('priority')}
                                    </Text>
                                </View>
                                <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', backgroundColor: 'white' }}>
                                        <ScrollView style={{ ...styles.colorBar, height: 20 }} horizontal={true} showsHorizontalScrollIndicator={false}>
                                            {
                                                colorChoices.map((c: string, i: number) => {
                                                    return <View style={color === i ? styles.colorContainerOutline : styles.colorContainer} key={Math.random()}>
                                                        <TouchableOpacity
                                                            style={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: 6,
                                                                backgroundColor: colorChoices[i]
                                                            }}
                                                            onPress={() => {
                                                                setColor(i)
                                                            }}
                                                        />
                                                    </View>
                                                })
                                            }
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={{ width: '100%', paddingTop: 15, flexDirection: width < 768 ? 'column' : 'row' }}>
                            <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                        Reminder
                                    </Text>
                                </View>
                                <View style={{
                                    backgroundColor: 'white',
                                    width: '100%',
                                    height: 40,
                                    marginRight: 10
                                }}>
                                    <Switch
                                        value={notify}
                                        onValueChange={() => {
                                            if (notify) {
                                                // setShuffle(false)
                                                setFrequency("0")
                                            } else {
                                                // setShuffle(true)
                                                setFrequency("1-D")
                                            }
                                            setPlayChannelCueIndef(true)
                                            setNotify(!notify)
                                        }}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#f4f4f6',
                                            true: '#3B64F8'
                                        }}
                                        activeThumbColor='white'
                                    />
                                </View>
                            </View>
                            {
                                notify ?
                                    <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                        <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                                Recurring
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', }}>
                                            <View style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10
                                            }}>
                                                <Switch
                                                    value={!shuffle}
                                                    onValueChange={() => setShuffle(!shuffle)}
                                                    style={{ height: 20 }}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#a2a2ac'
                                                    }}
                                                    activeThumbColor='white'
                                                />
                                            </View>
                                            {
                                                !shuffle ?
                                                    <View style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('remindEvery')}
                                                        </Text>
                                                        <Menu
                                                            onSelect={(cat: any) => {
                                                                setFrequency(cat.value)
                                                                setFrequencyName(cat.label)
                                                            }}>
                                                            <MenuTrigger>
                                                                <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#a2a2ac' }}>
                                                                    {frequencyName}<Ionicons name='caret-down' size={14} />
                                                                </Text>
                                                            </MenuTrigger>
                                                            <MenuOptions customStyles={{
                                                                optionsContainer: {
                                                                    padding: 10,
                                                                    borderRadius: 15,
                                                                    shadowOpacity: 0,
                                                                    borderWidth: 1,
                                                                    borderColor: '#f4f4f6'
                                                                }
                                                            }}>
                                                                {/* <MenuOption
                                                                    value={''}>
                                                                    <Text>
                                                                        None
                                                                    </Text>
                                                                </MenuOption> */}
                                                                {
                                                                    timedFrequencyOptions.map((item: any) => {
                                                                        return <MenuOption
                                                                            value={item}>
                                                                            <Text>
                                                                                {item.value === '0' && channelId !== '' ? 'Once' : item.label}
                                                                            </Text>
                                                                        </MenuOption>
                                                                    })
                                                                }
                                                            </MenuOptions>
                                                        </Menu>
                                                        {/* <Picker
                                                            style={styles.picker}
                                                            itemStyle={{
                                                                fontSize: 15
                                                            }}
                                                            selectedValue={frequency}
                                                            onValueChange={(itemValue: any) =>
                                                                setFrequency(itemValue)
                                                            }>
                                                            {
                                                                timedFrequencyOptions.map((item: any, index: number) => {
                                                                    return <Picker.Item
                                                                        color={frequency === item.value ? '#3B64F8' : "#2F2F3C"}
                                                                        label={item.value === '0' && channelId !== '' ? 'Once' : item.label}
                                                                        value={item.value}
                                                                        key={index}
                                                                    />
                                                                })
                                                            }
                                                        </Picker> */}
                                                    </View> :
                                                    <View style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('RemindOn')}
                                                        </Text>
                                                        <DatePicker
                                                            value={endPlayAt}
                                                            preventOverflow={true}
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                if (date < new Date()) return;

                                                                setEndPlayAt(date)
                                                            }}
                                                            // isValidDate={disablePastDt}
                                                            size={'sm'}
                                                        />
                                                    </View>
                                            }
                                        </View>
                                    </View> : null
                            }
                            {
                                notify && !shuffle ?
                                    <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                        <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
                                                Indefinite
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <View style={{
                                                backgroundColor: 'white',
                                                height: 40,
                                                marginRight: 10
                                            }}>
                                                <Switch
                                                    value={playChannelCueIndef}
                                                    onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                                    style={{ height: 20 }}
                                                    trackColor={{
                                                        false: '#f4f4f6',
                                                        true: '#a2a2ac'
                                                    }}
                                                    activeThumbColor='white'
                                                />
                                            </View>
                                            {
                                                playChannelCueIndef ? null :
                                                    <View style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            {PreferredLanguageText('remindTill')}
                                                        </Text>
                                                        <DatePicker
                                                            value={endPlayAt}
                                                            preventOverflow={true}
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                if (date < new Date()) return;
                                                                setEndPlayAt(date)
                                                            }}
                                                            // isValidDate={disablePastDt}\
                                                            size={'sm'}
                                                        />
                                                    </View>
                                            }
                                        </View>
                                    </View> : null
                            }
                        </View>
                        {/* if Quiz then ask Shuffle */}
                        {isQuiz ? <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                <Text style={{ fontSize: 11, color: '#a2a2ac', textTransform: 'uppercase' }}>
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
                                        onValueChange={() => setShuffleQuiz(!shuffleQuiz)}
                                        style={{ height: 20 }}
                                        trackColor={{
                                            false: '#f4f4f6',
                                            true: '#a2a2ac'
                                        }}
                                        activeThumbColor='white'
                                    />
                                </View>
                            </View>
                        </View> : null}
                    </View>
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
                            }}>
                            <TouchableOpacity
                                onPress={async () => {
                                    if (isQuiz) {
                                        createNewQuiz()
                                    } else {
                                        await handleCreate()
                                    }
                                }}
                                disabled={creatingQuiz}
                                style={{
                                    borderRadius: 15,
                                    backgroundColor: 'white'
                                }}>
                                {
                                    channelId === '' ?
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#3B64F8',
                                            borderRadius: 15,
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            {isSubmitting ? PreferredLanguageText('sharing') : PreferredLanguageText('save')}
                                        </Text> :
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#3B64F8',
                                            borderRadius: 15,
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35,
                                            textTransform: 'uppercase'
                                        }}>
                                            {isSubmitting ? PreferredLanguageText('sharing') : PreferredLanguageText('share')}
                                        </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/* Collapsible ends here */}
                </ScrollView>
            </Animated.View>
        </View >
    );
}

export default Create

const styles: any = StyleSheet.create({
    timePicker: {
        width: 125,
        fontSize: 15,
        height: 45,
        color: '#2F2F3C',
        borderRadius: 10,
        marginLeft: 10
    },
    backgroundVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
    cuesInput: {
        width: '100%',
        backgroundColor: '#f4f4f6',
        borderRadius: 15,
        fontSize: 20,
        padding: 20,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: '4%'
    },
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
        lineHeight: 22,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
    },
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f6',
        borderBottomWidth: 1,
        fontSize: 15,
        padding: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    },
    date: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 4,
        backgroundColor: 'white',
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
    },
    picker: {
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
        fontSize: 12,
        textAlign: 'center',
        borderWidth: 1,
        width: 100,
        height: 20,
        alignSelf: 'center',
        marginTop: -20,
        borderRadius: 3
    },
    text: {
        fontSize: 12,
        color: '#a2a2ac',
        textAlign: 'left',
        paddingHorizontal: 10
    },
    all: {
        fontSize: 12,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allBlack: {
        fontSize: 12,
        color: '#2F2F3C',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        marginBottom: 20
    },
    allOutline: {
        fontSize: 12,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#2F2F3C',
        marginBottom: 20
    },
    allGrayOutline: {
        fontSize: 12,
        color: '#a2a2ac',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
    },
    color1: {
        backgroundColor: '#D11C60'
    },
    color2: {
        backgroundColor: '#EF5B24',
    },
    color3: {
        backgroundColor: '#E0D41F',
    },
    color4: {
        backgroundColor: '#B8D41F',
    },
    color5: {
        backgroundColor: '#7FB1D3',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2ac'
    }
})