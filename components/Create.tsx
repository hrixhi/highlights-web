import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, ScrollView, Animated, Dimensions } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { fetchAPI } from '../graphql/FetchAPI';
import { createCue, createQuiz, getChannelCategories, getChannels, getSharedWith } from '../graphql/QueriesAndMutations';
import Datetime from 'react-datetime';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import {
    actions,
    RichEditor,
    RichToolbar,
} from "react-native-pell-rich-editor";
import FileUpload from './UploadFiles';
import FileViewer from 'react-file-viewer';
import Alert from '../components/Alert'
import Select from 'react-select';
import QuizCreate from './QuizCreate';
import DurationPicker from 'react-duration-picker'

const Create: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

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
    const [endPlayAt, setEndPlayAt] = useState(new Date())
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(true)
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d'].reverse()
    const [modalAnimation] = useState(new Animated.Value(0))
    const now = new Date()
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random())
    let RichText: any = useRef()
    const [height, setHeight] = useState(100)
    const [init, setInit] = useState(false)
    const [submission, setSubmission] = useState(false)
    const [deadline, setDeadline] = useState(new Date())
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
    const [timer, setTimer] = useState(false)
    const [duration, setDuration] = useState({
        hours: 1, minutes: 0, seconds: 0
    })

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
        let error = false
        if (problems.length === 0) {
            Alert("Enter at least one problem.")
            return;
        }
        if (timer) {
            if (duration.hours === 0 && duration.minutes === 0 && duration.seconds === 0) {
                Alert("Invalid duration.")
                return;
            }
        }
        problems.map((problem) => {
            if (problem.question === '') {
                Alert("Fill out missing problems.")
                error = true;
            }
            if (problem.points === '' || Number.isNaN(Number(problem.points))) {
                Alert("Enter numeric points for all questions.")
                error = true;
            }
            let optionFound = false
            if (problem.options.length === 0) {
                Alert("Each problem must have at least one option.")
                error = true;
            }
            problem.options.map((option: any) => {
                if (option.option === '') {
                    Alert("Fill out missing options.")
                    error = true;
                }
                if (option.isCorrect) {
                    optionFound = true
                }
            })
            if (!optionFound) {
                Alert("Each problem must have at least one correct answer.")
                error = true;
            }
        })
        if (error) {
            return
        }
        const server = fetchAPI('')
        const durationMinutes = (duration.hours * 60) + (duration.minutes) + (duration.seconds / 60);
        server.mutate({
            mutation: createQuiz,
            variables: {
                quiz: {
                    problems,
                    duration: timer ? durationMinutes.toString() : null
                }
            }
        }).then(res => {
            if (res.data && res.data.quiz.createQuiz !== 'error') {
                handleCreate(res.data.quiz.createQuiz)
            }
        })
    }, [problems, cue, modalAnimation, customCategory, props.saveDataInCloud, isQuiz,
        gradeWeight, deadline, submission, imported, selected, subscribers,
        shuffle, frequency, starred, color, notify, title, type, url, timer, duration,
        props.closeModal, channelId, endPlayAt, playChannelCueIndef])

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
                    setSubscribers(res.data.cue.getSharedWith)
                    // clear selected
                    setSelected(res.data.cue.getSharedWith)
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
            const dir = FileSystem.documentDirectory + 'images'
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
            const fileName = Math.round((Math.random() * 100)).toString();
            FileSystem.copyAsync({
                from: result.uri,
                to: dir + '/' + fileName + '.jpg'
            }).then(r => {
                ImageManipulator.manipulateAsync(
                    (dir + '/' + fileName + '.jpg'),
                    [],
                    { compress: 0.25, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                ).then(res => {
                    RichText.current.insertImage(
                        'data:image/jpeg;base64,' + res.base64, 'border-radius: 10px'
                    )
                    // setReloadEditorKey(Math.random())
                }).catch(err => {
                    Alert("Unable to load image.")
                });
            }).catch((err) => {
                Alert("Something went wrong.")
            })
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
            const dir = FileSystem.documentDirectory + 'images'
            const dirInfo = await FileSystem.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
            }
            const fileName = Math.round((Math.random() * 100)).toString();
            FileSystem.copyAsync({
                from: result.uri,
                to: dir + '/' + fileName + '.jpg'
            }).then((r) => {
                ImageManipulator.manipulateAsync(
                    (dir + '/' + fileName + '.jpg'),
                    [],
                    { compress: 0.25, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                ).then(res => {
                    RichText.current.insertImage(
                        'data:image/jpeg;base64,' + res.base64, 'border-radius: 10px'
                    )
                }).catch(err => {
                    Alert("Unable to load image.")
                });
            }).catch((err) => {
                Alert("Something went wrong.")
            })
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
        if (cue && cue !== "") {
            storeDraft('cueDraft', cue)
        } else {
            storeDraft('cueDraft', '')
        }
    }, [cue, init])

    const storeDraft = useCallback(async (type, value) => {
        await AsyncStorage.setItem(type, value)
    }, [])

    const handleCreate = useCallback(async (quizId?: string) => {

        if (!quizId && (cue === null || cue.toString().trim() === '')) {
            Alert("Enter content.")
            return
        }

        if ((imported || isQuiz) && title === '') {
            Alert("Enter title.")
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
            props.closeModal()
        } else {
            // CHANNEL CUE
            const uString = await AsyncStorage.getItem('user')
            if (!uString) {
                return
            }

            if (selected.length === 0) {
                Alert("No student selected!", "Select who to share with. Re-select channel to select all members.")
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
                            props.closeModal()
                        })
                    }
                })
                .catch(err => {
                    Alert("Something went wrong.", "Check connection.")
                })
        }

    }, [cue, modalAnimation, customCategory, props.saveDataInCloud, isQuiz, timer, duration,
        gradeWeight, deadline, submission, imported, selected, subscribers,
        shuffle, frequency, starred, color, notify, title, type, url,
        props.closeModal, channelId, endPlayAt, playChannelCueIndef])

    useEffect(() => {
        const getData = async () => {
            try {
                const h = await AsyncStorage.getItem('cueDraft')
                if (h !== null) {
                    setCue(h)
                }
            } catch (e) {
                console.log(e)
            }
        }
        getData()
    }, [])

    const clearAll = useCallback(() => {
        Alert(
            "Clear?",
            "This action cannot be undone.",
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
                        setReloadEditorKey(Math.random())
                        setTitle('')
                        setProblems([])
                        setIsQuiz(false)
                        setTimer(false)
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

    const width = Dimensions.get('window').width;
    return (
        <View style={{
            width: '100%',
            height: Dimensions.get('window').width < 1024 ? Dimensions.get('window').height - 30 : Dimensions.get('window').height,
            backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
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
                                fontSize: 12,
                                color: '#fff',
                                paddingHorizontal: 10,
                                borderRadius: 10,
                                backgroundColor: '#a2a2a2',
                                lineHeight: 20,
                                width: 50,
                                marginBottom: 20,
                                textAlign: 'center'
                            }}
                        >
                            New
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
                            marginTop: -36,
                            paddingRight: 25,
                            width: '100%'
                        }}>
                            <Ionicons name='bookmark' size={25} color={starred ? '#f94144' : '#a2a2a2'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: Dimensions.get('window').width < 768 ? 'column-reverse' : 'row',
                    paddingBottom: 4,
                    backgroundColor: 'white',
                }} onTouchStart={() => Keyboard.dismiss()}>
                    <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1 }}>
                        {
                            showImportOptions ? null :
                                <RichToolbar
                                    style={{
                                        flexWrap: 'wrap',
                                        backgroundColor: 'white',
                                        height: 28,
                                        overflow: 'visible'
                                    }}
                                    iconSize={12}
                                    editor={RichText}
                                    disabled={false}
                                    iconTint={"#a2a2a2"}
                                    selectedIconTint={"#a2a2a2"}
                                    disabledIconTint={"#a2a2a2"}
                                    actions={
                                        imported || isQuiz ? ["clear"] :
                                            [
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
                                        console.log(t)
                                        const obj = { url: u, type: t, title }
                                        setCue(JSON.stringify(obj))
                                        setShowImportOptions(false)
                                    }}
                                />
                        }
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        {
                            isQuiz ? null :
                                <Text style={{
                                    color: '#a2a2a2',
                                    fontSize: 11,
                                    lineHeight: 30,
                                    textAlign: 'right',
                                    paddingRight: 20
                                }}
                                    onPress={() => setShowImportOptions(true)}
                                >
                                    IMPORT
                                </Text>
                        }
                        <Text style={{
                            color: '#a2a2a2',
                            fontSize: 11,
                            lineHeight: 30,
                            textAlign: 'right',
                            paddingRight: 20
                        }}
                            onPress={() => {
                                if (channelId !== '') {
                                    setIsQuiz(true)
                                    setSubmission(true)
                                } else {
                                    Alert("Quizzes can only be shared with channels created by you.", "Select a channel from the options below to share the quiz with and then try again.")
                                }
                            }}
                        >
                            QUIZ
                        </Text>
                    </View>
                    <Text style={{
                        color: '#a2a2a2',
                        fontSize: 11,
                        lineHeight: 30,
                        textAlign: 'right',
                        paddingRight: 10,
                    }}>
                        {'|      ' +
                            now.toString().split(' ')[1] +
                            ' ' +
                            now.toString().split(' ')[2] +
                            ', ' +
                            now.toString().split(' ')[3]
                        }
                    </Text>
                </View>
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
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4', paddingRight: 15, paddingTop: 20 }}>
                                    <TextInput
                                        value={title}
                                        style={styles.input}
                                        placeholder={'Title'}
                                        onChangeText={val => setTitle(val)}
                                        placeholderTextColor={'#a2a2a2'}
                                    />
                                </View>
                                {
                                    isQuiz ?
                                        <View style={{ width: width < 768 ? '100%' : '31.67%', borderRightWidth: 0, borderColor: '#f4f4f4', paddingTop: 10 }}>
                                            <View style={{ width: '100%', paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 15, color: '#a2a2a2' }}>
                                                    <Ionicons name='timer-outline' size={20} color={'#a2a2a2'} />
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
                                                        false: '#f4f4f4',
                                                        true: '#3B64F8'
                                                    }}
                                                    activeThumbColor='white'
                                                />
                                            </View>
                                        </View> : null
                                }
                                {
                                    isQuiz && timer ?
                                        <View style={{ width: width < 768 ? '100%' : '35%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
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
                        minHeight: isQuiz ? 0 : 475,
                        backgroundColor: 'white'
                    }}>
                        {
                            isQuiz ?
                                <QuizCreate
                                    problems={problems}
                                    setProblems={(p: any) => setProblems(p)}
                                />
                                : (imported ?
                                    (
                                        type === 'pptx' ?
                                            <iframe src={'https://view.officeapps.live.com/op/embed.aspx?src=' + url} width='100%' height='600px' frameBorder='0' />
                                            : <FileViewer
                                                unsupportedComponent={() =>
                                                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                                                        <Text style={{ width: '100%', color: '#a2a2a2', fontSize: 25, paddingTop: 100, paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                                            <Ionicons name='document-outline' size={50} color='#a2a2a2' />
                                                        </Text>
                                                    </View>
                                                }
                                                style={{
                                                    fontFamily: 'overpass'
                                                }}
                                                fileType={type}
                                                key={url + type}
                                                filePath={url}
                                                errorComponent={<View>
                                                    <Text>
                                                        ERROR!!
                                                </Text>
                                                </View>}
                                                onError={(e: any) => console.log(e)} />
                                    )
                                    :
                                    <RichEditor
                                        key={reloadEditorKey.toString()}
                                        containerStyle={{
                                            height,
                                            backgroundColor: '#f4f4f4',
                                            padding: 3,
                                            paddingTop: 5,
                                            paddingBottom: 10,
                                            borderRadius: 0
                                        }}
                                        ref={RichText}
                                        style={{
                                            width: '100%',
                                            backgroundColor: '#f4f4f4',
                                            borderRadius: 0,
                                            minHeight: 475
                                        }}
                                        editorStyle={{
                                            backgroundColor: '#f4f4f4',
                                            placeholderColor: '#a2a2a2',
                                            color: '#202020',
                                            contentCSSText: 'font-size: 13px;'
                                        }}
                                        initialContentHTML={cue}
                                        onScroll={() => Keyboard.dismiss()}
                                        placeholder={"Title"}
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
                                    />)
                        }
                    </View>
                    <View style={{ flex: 1, display: 'flex', flexDirection: 'column', marginHorizontal: 10 }}>
                        {channels.length !== 0 ?
                            <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row', overflow: 'visible' }}>
                                <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 12, color: '#a2a2a2' }}>
                                            Channel
                                            {/* <Ionicons
                                                name='school-outline' size={20} color={'#a2a2a2'} /> */}
                                        </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '85%', backgroundColor: 'white', display: 'flex' }}>
                                            <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                <TouchableOpacity
                                                    style={channelId === '' ? styles.allOutline : styles.allBlack}
                                                    onPress={() => {
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
                                                        setTimer(false)
                                                    }}>
                                                    <Text style={{ lineHeight: 20, fontSize: 12, color: channelId === '' ? '#fff' : '#202020' }}>
                                                        {/* <Ionicons name='home-outline' size={15} /> */}
                                                        My Cues
                                                    </Text>
                                                </TouchableOpacity>
                                                {
                                                    channels.map((channel) => {
                                                        return <TouchableOpacity
                                                            key={Math.random()}
                                                            style={channelId === channel._id ? styles.allOutline : styles.allBlack}
                                                            onPress={() => {
                                                                setChannelId(channel._id)
                                                                setAddCustomCategory(false)
                                                                setCustomCategory('')
                                                                setSubmission(isQuiz ? true : false)
                                                                setGradeWeight(0)
                                                                setGraded(false)
                                                            }}>
                                                            <Text style={{ lineHeight: 20, fontSize: 12, color: channelId === channel._id ? '#fff' : '#202020' }}>
                                                                {channel.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    })
                                                }
                                            </ScrollView>
                                        </View>
                                    </View>
                                    {
                                        channelId !== '' ?
                                            <View style={{ maxHeight: 175, flexDirection: 'column', marginTop: 25, overflow: 'scroll' }}>
                                                <View style={{ width: '90%', padding: 5, height: expandMenu ? 175 : 'auto' }}>
                                                    <Select
                                                        placeholder='Share with'
                                                        styles={{
                                                            menu: (provided: any, state: any) => ({
                                                                ...provided,
                                                                zIndex: 9999,
                                                                overflow: 'scroll',
                                                                height: 125,
                                                                display: 'flex',
                                                                margin: 5,
                                                                width: '97%',
                                                                boxShadow: 'none'
                                                            }),
                                                            option: (provided: any, state: any) => ({
                                                                ...provided,
                                                                fontFamily: 'overpass',
                                                                color: '#a2a2a2',
                                                                fontSize: 10,
                                                                height: 25,
                                                                width: '97%'
                                                            }),
                                                            input: (styles: any) => ({
                                                                // ...styles,
                                                                width: '100%',
                                                                border: 'none',
                                                                borderWidth: 0,
                                                                fontSize: 12
                                                            }),
                                                            placeholder: (styles: any) => ({
                                                                ...styles,
                                                                fontFamily: 'overpass',
                                                                color: '#a2a2a2',
                                                                fontSize: 12
                                                            }),
                                                            multiValueLabel: (styles: any, { data }: any) => ({
                                                                ...styles,
                                                                color: '#202020',
                                                                fontFamily: 'overpass'
                                                            }),
                                                            multiValue: (styles: any, { data }: any) => ({
                                                                ...styles,
                                                                backgroundColor: '#f4f4f4',
                                                                fontFamily: 'overpass'
                                                            })
                                                        }}
                                                        value={selected}
                                                        isMulti={true}
                                                        onMenuOpen={() => setExpandMenu(true)}
                                                        onMenuClose={() => setExpandMenu(false)}
                                                        name="Share with"
                                                        className="basic-multi-select"
                                                        classNamePrefix="select"
                                                        onChange={onChange}
                                                        options={subscribers}
                                                    />
                                                </View>
                                            </View> : null
                                    }
                                </View>
                                {
                                    channelId !== '' ?
                                        <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 12, color: '#a2a2a2' }}>
                                                    Submission Required
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
                                                            false: '#f4f4f4',
                                                            true: '#a2a2a2'
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
                                                                Deadline
                                                        </Text>
                                                            <Datetime
                                                                value={deadline}
                                                                onChange={(event: any) => {
                                                                    const date = new Date(event)
                                                                    setDeadline(date)
                                                                }}
                                                            />
                                                        </View>
                                                        : null
                                                }
                                            </View>
                                        </View> : null
                                }
                                {
                                    submission ?
                                        <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                <Text style={{ fontSize: 12, color: '#a2a2a2' }}>
                                                    Graded
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
                                                            false: '#f4f4f4',
                                                            true: '#a2a2a2'
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
                                                                Grade Weight {'\n'}(% of overall grade)
                                                        </Text>
                                                            <TextInput
                                                                value={gradeWeight}
                                                                style={styles.picker}
                                                                placeholder={'0-100'}
                                                                onChangeText={val => setGradeWeight(val)}
                                                                placeholderTextColor={'#a2a2a2'}
                                                            />
                                                        </View>
                                                        : null
                                                }
                                            </View>
                                        </View> : null
                                }
                            </View>
                            : null}
                        <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row' }}>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                <View style={{ width: '100%', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 12, color: '#a2a2a2' }}>
                                            Category
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
                                                            placeholder={'New Category'}
                                                            onChangeText={val => {
                                                                setCustomCategory(val)
                                                            }}
                                                            placeholderTextColor={'#a2a2a2'}
                                                        />
                                                    </View> :
                                                    <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                        <TouchableOpacity
                                                            style={customCategory === '' ? styles.allGrayOutline : styles.all}
                                                            onPress={() => {
                                                                setCustomCategory('')
                                                            }}>
                                                            <Text style={{ color: '#a2a2a2', lineHeight: 20, fontSize: 12 }}>
                                                                None
                                                    </Text>
                                                        </TouchableOpacity>
                                                        {
                                                            customCategories.map((category: string) => {
                                                                return <TouchableOpacity
                                                                    key={Math.random()}
                                                                    style={customCategory === category ? styles.allGrayOutline : styles.all}
                                                                    onPress={() => {
                                                                        setCustomCategory(category)
                                                                    }}>
                                                                    <Text style={{ color: '#a2a2a2', lineHeight: 20, fontSize: 12 }}>
                                                                        {category}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            })
                                                        }
                                                    </ScrollView>
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
                                                    <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#a2a2a2'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 12, color: '#a2a2a2' }}>
                                        Priority
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
                                                                width: 9,
                                                                height: 9,
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
                                    <Text style={{ fontSize: 15, color: '#a2a2a2' }}>
                                        <Ionicons name='notifications-outline' size={20} color={'#a2a2a2'} />
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
                                            false: '#f4f4f4',
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
                                            <Text style={{ fontSize: 12, color: '#a2a2a2' }}>
                                                <Ionicons
                                                    name='repeat-outline' size={20} color={'#a2a2a2'} />
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
                                                        false: '#f4f4f4',
                                                        true: '#a2a2a2'
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
                                                            Remind every
                                                    </Text>
                                                        <Picker
                                                            style={styles.picker}
                                                            itemStyle={{
                                                                fontSize: 17
                                                            }}
                                                            selectedValue={frequency}
                                                            onValueChange={(itemValue: any) =>
                                                                setFrequency(itemValue)
                                                            }>
                                                            {
                                                                timedFrequencyOptions.map((item: any, index: number) => {
                                                                    return <Picker.Item
                                                                        color={frequency === item.value ? '#3B64F8' : "#202020"}
                                                                        label={item.value === '0' && channelId !== '' ? 'Once' : item.label}
                                                                        value={item.value}
                                                                        key={index}
                                                                    />
                                                                })
                                                            }
                                                        </Picker>
                                                    </View> :
                                                    <View style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        backgroundColor: 'white'
                                                    }}>
                                                        <Text style={styles.text}>
                                                            Remind on
                                                            </Text>
                                                        <Datetime
                                                            value={endPlayAt}
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                setEndPlayAt(date)
                                                            }}
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
                                            <Text style={{ fontSize: 12, color: '#a2a2a2' }}>
                                                <Ionicons
                                                    name='infinite-outline' size={20} color={'#a2a2a2'} />
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
                                                        false: '#f4f4f4',
                                                        true: '#a2a2a2'
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
                                                            Remind till
                                                            </Text>
                                                        <Datetime
                                                            value={endPlayAt}
                                                            onChange={(event: any) => {
                                                                const date = new Date(event)
                                                                setEndPlayAt(date)
                                                            }}
                                                        />
                                                    </View>
                                            }
                                        </View>
                                    </View> : null
                            }
                        </View>
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
                                onPress={() => {
                                    if (isQuiz) {
                                        createNewQuiz()
                                    } else {
                                        handleCreate()
                                    }
                                }}
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
                                            height: 35
                                        }}>
                                            SAVE
                                            {/* TO  <Ionicons name='home-outline' size={14} /> */}
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
                                            height: 35
                                        }}>
                                            SHARE
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
        fontSize: 17,
        height: 45,
        color: '#202020',
        borderRadius: 10,
        marginLeft: 10
    },
    cuesInput: {
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: 15,
        fontSize: 21,
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
        lineHeight: 20,
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: 7,
        paddingHorizontal: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2a2'
    },
    input: {
        width: '100%',
        borderBottomColor: '#f4f4f4',
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
        color: '#a2a2a2',
        textAlign: 'left',
        paddingHorizontal: 10
    },
    all: {
        fontSize: 12,
        color: '#a2a2a2',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allBlack: {
        fontSize: 12,
        color: '#202020',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 12,
        color: '#FFF',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#202020'
    },
    allGrayOutline: {
        fontSize: 12,
        color: '#a2a2a2',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2a2'
    },
    color1: {
        backgroundColor: '#f94144'
    },
    color2: {
        backgroundColor: '#f3722c',
    },
    color3: {
        backgroundColor: '#f8961e',
    },
    color4: {
        backgroundColor: '#f9c74f',
    },
    color5: {
        backgroundColor: '#90be6d',
    },
    outline: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a2a2a2'
    }
})