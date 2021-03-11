import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, Dimensions, ScrollView, Animated } from 'react-native';
import Alert from '../components/Alert'
import { Text, View, TouchableOpacity } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Datetime from 'react-datetime';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { fetchAPI } from '../graphql/FetchAPI';
import { markAsRead, submit } from '../graphql/QueriesAndMutations';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import {
    actions,
    RichEditor,
    RichToolbar,
} from "react-native-pell-rich-editor";
import * as DocumentPicker from 'expo-document-picker';
import { convertToHtml } from "../graphql/QueriesAndMutations";
import FileViewer from 'react-file-viewer';
import FileUpload from './UploadFiles';

const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [cue, setCue] = useState(props.cue.cue)
    const [shuffle, setShuffle] = useState(props.cue.shuffle)
    const [starred, setStarred] = useState(props.cue.starred)
    const [color, setColor] = useState(props.cue.color)
    const [notify, setNotify] = useState(props.cue.frequency !== "0" ? true : false)
    const [frequency, setFrequency] = useState(props.cue.frequency)
    const [customCategory, setCustomCategory] = useState(props.cue.customCategory)
    const [customCategories] = useState(props.customCategories)
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [markedAsRead, setMarkedAsRead] = useState(false)
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random())
    const [isOwner, setIsOwner] = useState(false)
    const stopPlay = props.cue.endPlayAt && props.cue.endPlayAt !== ''
        ? (
            props.cue.endPlayAt === 'Invalid Date' ? new Date() : new Date(props.cue.endPlayAt)
        )
        : new Date()
    const [endPlayAt, setEndPlayAt] = useState<Date>(stopPlay)
    const [playChannelCueIndef, setPlayChannelCueIndef] = useState(
        props.cue.endPlayAt && props.cue.endPlayAt !== ''
            ? false
            : true
    )
    const now = new Date(props.cue.date)
    const RichText: any = useRef();
    const [height, setHeight] = useState(100)
    const [showOriginal, setShowOriginal] = useState(props.cue.channelId && props.cue.channelId !== '' ? true : false)
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d'].reverse()
    const [submission, setSubmission] = useState(props.cue.submission ? props.cue.submission : false)
    const dead = props.cue.deadline && props.cue.deadline !== ''
        ? (
            props.cue.deadline === 'Invalid Date' ? new Date() : new Date(props.cue.deadline)
        )
        : new Date()
    const [deadline, setDeadline] = useState<Date>(dead)
    const [gradeWeight, setGradeWeight] = useState<any>(props.cue.gradeWeight ? props.cue.gradeWeight : 0)
    const [score] = useState<any>(props.cue.score ? props.cue.score : 0)
    const [graded, setGraded] = useState(props.cue.gradeWeight && props.cue.gradeWeight !== 0 ? true : false)
    const currentDate = new Date()
    const [submitted, setSubmitted] = useState(false)
    const [userSetupComplete, setUserSetupComplete] = useState(false)
    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [submissionImported, setSubmissionImported] = useState(false)
    const [submissionUrl, setSubmissionUrl] = useState('')
    const [submissionType, setSubmissionType] = useState('')
    const [submissionTitle, setSubmissionTitle] = useState('')
    const [key, setKey] = useState(Math.random())

    useEffect(() => {
        if (props.cue.channelId && props.cue.channelId !== '') {
            const data1 = props.cue.original;
            const data2 = cue;
            if (data1 && data1[0] && data1[0] === '{' && data1[data1.length - 1] === '}') {
                const obj = JSON.parse(data1)
                setImported(true)
                setUrl(obj.url)
                setType(obj.type)
                setTitle(obj.title)
            } else {
                setImported(false)
                setUrl('')
                setType('')
                setTitle('')
            }
            if (data2 && data2[0] && data2[0] === '{' && data2[data2.length - 1] === '}') {
                const obj = JSON.parse(data2)
                setSubmissionImported(true)
                setSubmissionUrl(obj.url)
                setSubmissionType(obj.type)
                setSubmissionTitle(obj.title)
            } else {
                setSubmissionImported(false)
                setSubmissionUrl('')
                setSubmissionType('')
                setSubmissionTitle('')
            }
        } else {
            const data = cue
            if (data && data[0] && data[0] === '{' && data[data.length - 1] === '}') {
                const obj = JSON.parse(data)
                setSubmissionImported(true)
                setSubmissionUrl(obj.url)
                setSubmissionType(obj.type)
                setSubmissionTitle(obj.title)
            } else {
                setSubmissionImported(false)
                setSubmissionUrl('')
                setSubmissionType('')
                setSubmissionTitle('')
            }
        }
        setKey(Math.random())
    }, [props.cue, cue])

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

    const handleUpdate = useCallback(async () => {
        if (submissionImported && submissionTitle === '') {
            Alert("Enter title.")
            return
        }
        let subCues: any = {}
        try {
            const value = await AsyncStorage.getItem('cues')
            if (value) {
                subCues = JSON.parse(value)
            }
        } catch (e) {
        }
        if (subCues[props.cueKey].length === 0) {
            return
        }
        let saveCue = ''
        if (submissionImported) {
            const obj = {
                type: submissionType,
                url: submissionUrl,
                title: submissionTitle
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = cue
        }
        const submittedNow = new Date()
        subCues[props.cueKey][props.cueIndex] = {
            _id: props.cue._id,
            cue: saveCue,
            date: props.cue.date,
            color,
            shuffle,
            frequency,
            starred,
            customCategory,
            // Channel controls
            channelId: props.cue.channelId,
            createdBy: props.cue.createdBy,
            endPlayAt: notify && (shuffle || !playChannelCueIndef) ? endPlayAt.toISOString() : '',
            channelName: props.cue.channelName,
            original: props.cue.original,
            status: 'read',
            graded: props.cue.graded,
            gradeWeight,
            submission,
            score,
            submittedAt: submitted ? submittedNow.toISOString() : props.cue.submittedAt,
            deadline: submission ? deadline.toISOString() : '',
        }
        const stringifiedCues = JSON.stringify(subCues)
        await AsyncStorage.setItem('cues', stringifiedCues)
        props.reloadCueListAfterUpdate()
    }, [cue, customCategory, shuffle, frequency, starred, color, playChannelCueIndef, notify, submissionImported,
        submission, deadline, gradeWeight, submitted, submissionTitle, submissionType, submissionUrl,
        props.closeModal, props.cueIndex, props.cueKey, props.cue, endPlayAt, props])

    const handleDelete = useCallback(async () => {
        let subCues: any = {}
        try {
            const value = await AsyncStorage.getItem('cues')
            if (value) {
                subCues = JSON.parse(value)
            }
        } catch (e) {
        }
        if (subCues[props.cueKey].length === 0) {
            return
        }
        const updatedCues: any[] = []
        subCues[props.cueKey].map((i: any, j: any) => {
            if (j !== props.cueIndex) {
                updatedCues.push({ ...i })
            }
        })
        subCues[props.cueKey] = updatedCues
        const stringifiedCues = JSON.stringify(subCues)
        await AsyncStorage.setItem('cues', stringifiedCues)
        props.closeModal()
    }, [props.cueIndex, props.closeModal, props.cueKey])

    const handleSubmit = useCallback(async () => {
        const u: any = await AsyncStorage.getItem('user')
        if (u) {
            const parsedUser = JSON.parse(u)
            if (!parsedUser.email || parsedUser.email === '') {
                // cannot submit
                return
            }
            const server = fetchAPI('')
            server.mutate({
                mutation: submit,
                variables: {
                    cueId: props.cue._id,
                    userId: parsedUser._id
                }
            }).then(res => {
                if (res.data.cue.submitModification) {
                    setSubmitted(true)
                }
            }).catch(err => {

            })
        }
    }, [props.cue])

    useEffect(() => {
        (
            async () => {
                const u = await AsyncStorage.getItem('user')
                if (u && props.cue.createdBy) {
                    const parsedUser = JSON.parse(u)
                    if (parsedUser._id.toString().trim() === props.cue.createdBy.toString().trim()) {
                        setIsOwner(true)
                    }
                    if (parsedUser.email && parsedUser.email !== '') {
                        setUserSetupComplete(true)
                    }
                }
            }
        )()
    }, [props.cue])

    useEffect(() => {
        handleUpdate()
    }, [cue, shuffle, frequency, starred, color, props.cueIndex, submitted, markedAsRead,
        submissionTitle, submissionImported, submissionType,
        customCategory, props.cueKey, endPlayAt, playChannelCueIndef, notify])

    const updateStatusAsRead = useCallback(async () => {
        if (props.cue.status && props.cue.status !== 'read' && !markedAsRead) {
            const u = await AsyncStorage.getItem('user')
            if (u) {
                const user = JSON.parse(u)
                const server = fetchAPI('')
                server.mutate({
                    mutation: markAsRead,
                    variables: {
                        cueId: props.cue._id,
                        userId: user._id
                    }
                })
                    .then(res => {
                        if (res.data.status.markAsRead) {
                            setMarkedAsRead(true)
                        }
                    })
                    .catch(err => {
                    })
            }
        }
    }, [props.cue, markedAsRead])

    const clearAll = useCallback(() => {
        Alert(
            "Clear all?",
            "This action cannot be undone.",
            [
                {
                    text: "Cancel", style: "cancel"
                },
                {
                    text: "Clear", onPress: () => {
                        setSubmissionImported(false)
                        setCue('')
                        setSubmissionUrl('')
                        setSubmissionType('')
                        setSubmissionTitle('')
                        setReloadEditorKey(Math.random())
                    }
                }
            ]
        )
    }, [])

    useEffect(() => {
        updateStatusAsRead()
    }, [props.cue.status])

    const width = Dimensions.get('window').width;

    return (
        <View style={{
            width: '100%',
            height: Dimensions.get('window').height - 30,
            backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 20,
            overflow: 'hidden'
        }}>
            <Animated.View style={{
                width: '100%',
                backgroundColor: 'white',
                opacity: 1,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                height: '100%'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                {
                    (props.cue.channelId && props.cue.channelId !== '') ?
                        <View style={{
                            width: '100%', flexDirection: 'row', marginBottom: 25
                        }}>
                            <TouchableOpacity
                                style={{
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}
                                onPress={() => {
                                    setShowOriginal(true)
                                }}>
                                <Text style={showOriginal ? styles.allGrayOutline : styles.all}>
                                    Shared Notes
                                </Text>
                            </TouchableOpacity>
                            {
                                isOwner && submission ? null :
                                    <TouchableOpacity
                                        style={{
                                            justifyContent: 'center',
                                            flexDirection: 'column'
                                        }}
                                        onPress={() => {
                                            setShowOriginal(false)
                                        }}>
                                        <Text style={!showOriginal ? styles.allGrayOutline : styles.all}>
                                            {
                                                submission ? 'Your Submission' : 'Your Notes'
                                            }
                                        </Text>
                                    </TouchableOpacity>
                            }
                            {
                                props.cue.graded && (props.cue.score !== undefined && props.cue.score !== null) ?
                                    <Text style={{
                                        fontSize: 12,
                                        color: 'white',
                                        height: 22,
                                        paddingHorizontal: 10,
                                        marginLeft: 10,
                                        borderRadius: 10,
                                        backgroundColor: '#0079fe',
                                        lineHeight: 20,
                                        paddingTop: 1
                                    }}>
                                        {props.cue.score}%
                                    </Text> : null
                            }
                            <TouchableOpacity
                                onPress={() => setStarred(!starred)}
                                style={{
                                    backgroundColor: 'white',
                                    flex: 1
                                }}>
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 30,
                                    marginTop: -35,
                                    paddingRight: 25,
                                    width: '100%'
                                }}>
                                    <Ionicons name='bookmark' size={20} color={starred ? '#f94144' : '#a6a2a2'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                        : <View>
                            <TouchableOpacity
                                onPress={() => setStarred(!starred)}
                                style={{
                                    backgroundColor: 'white',
                                    flex: 1
                                }}>
                                <Text style={{
                                    textAlign: 'right',
                                    lineHeight: 30,
                                    marginTop: -36,
                                    paddingRight: 25,
                                    width: '100%'
                                }}>
                                    <Ionicons name='bookmark' size={20} color={starred ? '#f94144' : '#a6a2a2'} />
                                </Text>
                            </TouchableOpacity>
                        </View>
                }
                <View style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: Dimensions.get('window').width < 768 ? 'column-reverse' : 'row',
                    paddingBottom: 4,
                    backgroundColor: 'white'
                }} onTouchStart={() => Keyboard.dismiss()}>
                    <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row' }}>
                        {
                            (showOriginal)
                                ? <View style={{ height: 28 }} />
                                : <RichToolbar
                                    key={showOriginal.toString() + reloadEditorKey.toString()}
                                    style={{
                                        flexWrap: 'wrap',
                                        backgroundColor: 'white',
                                        // height: Dimensions.get('window').width < 768 ? 60 : 28,
                                        // width: Dimensions.get('window').width < 768 ? '50%' : '100%'
                                    }}
                                    iconSize={13}
                                    editor={RichText}
                                    disabled={false}
                                    iconTint={"#a6a2a2"}
                                    selectedIconTint={"#a6a2a2"}
                                    disabledIconTint={"#a6a2a2"}
                                    actions={
                                        submissionImported ? ["close"] :
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
                                                "close"
                                                // "insertVideo"
                                            ]}
                                    iconMap={{
                                        // ["insertVideo"]: ({ tintColor }) => <Ionicons name='videocam-outline' size={20} color={tintColor} />,
                                        ["insertCamera"]: ({ tintColor }) => <Ionicons name='camera-outline' size={18} color={tintColor} />,
                                        ["close"]: ({ tintColor }) => <Ionicons
                                            name='close-outline'
                                            size={18}
                                            onPress={clearAll}
                                            color={tintColor} />,
                                    }}
                                    onPressAddImage={galleryCallback}
                                    // insertVideo={videoCallback}
                                    insertCamera={cameraCallback}
                                    close={clearAll}
                                />
                        }
                        {
                            !showOriginal && props.cue.submission && !submissionImported ?
                                <FileUpload
                                    onUpload={(u: any, t: any) => {
                                        const obj = { url: u, type: t, title: submissionTitle }
                                        setCue(JSON.stringify(obj))
                                    }}
                                />
                                : null
                        }
                    </View>
                    <Text style={{
                        flex: 1,
                        color: '#a6a2a2',
                        fontSize: 11,
                        lineHeight: 30,
                        textAlign: 'right',
                        marginRight: 10
                    }}>
                        {
                            now.toString().split(' ')[1] +
                            ' ' +
                            now.toString().split(' ')[2] +
                            ', ' +
                            now.toString().split(' ')[3]
                        }
                    </Text>
                </View>
                <ScrollView
                    style={{ paddingBottom: 100, height: '100%' }}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={true}
                    scrollEventThrottle={1}
                    keyboardDismissMode={'on-drag'}
                    overScrollMode={'always'}
                    nestedScrollEnabled={true}
                >

                    {
                        showOriginal && imported ?
                            <View style={{ width: '50%', alignSelf: 'flex-start' }}>
                                <TextInput
                                    editable={!(props.channelId && props.channelId !== '')}
                                    value={title}
                                    style={styles.input}
                                    placeholder={'Title'}
                                    onChangeText={val => setTitle(val)}
                                    placeholderTextColor={'#a6a2a2'}
                                />
                            </View> : null
                    }
                    {
                        !showOriginal && submissionImported ?
                            <View style={{ width: '50%', alignSelf: 'flex-start' }}>
                                <TextInput
                                    value={submissionTitle}
                                    style={styles.input}
                                    placeholder={'Title'}
                                    onChangeText={val => setSubmissionTitle(val)}
                                    placeholderTextColor={'#a6a2a2'}
                                />
                            </View> : null
                    }
                    <View style={{
                        width: '100%',
                        minHeight: 500,
                        backgroundColor: 'white'
                    }}
                    >
                        {!showOriginal ? null
                            : (imported ?
                                (
                                    type === 'pptx' ?
                                        <iframe src={'https://view.officeapps.live.com/op/embed.aspx?src=' + url} width='100%' height='600px' frameBorder='0' />
                                        : <FileViewer
                                            style={{ fontFamily: 'overpass' }}
                                            fileType={type}
                                            filePath={url}
                                            key={Math.random()}
                                            errorComponent={<View>
                                                <Text>
                                                    ERROR!!
                                        </Text>
                                            </View>}
                                            onError={(e: any) => console.log(e)} />
                                )
                                :
                                <RichEditor
                                    key={showOriginal.toString() + reloadEditorKey.toString()}
                                    disabled={true}
                                    containerStyle={{
                                        height: height,
                                        backgroundColor: '#f4f4f4',
                                        padding: 3,
                                        paddingTop: 5,
                                        paddingBottom: 10,
                                        borderRadius: 10,
                                    }}
                                    ref={RichText}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#f4f4f4',
                                        minHeight: 450,
                                        borderRadius: 10
                                    }}
                                    editorStyle={{
                                        backgroundColor: '#f4f4f4',
                                        placeholderColor: '#a6a2a2',
                                        color: '#101010',
                                        contentCSSText: 'font-size: 13px;'
                                    }}
                                    initialContentHTML={props.cue.original}
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
                        {showOriginal ? null
                            : (submissionImported ?
                                (
                                    type === 'pptx' ?
                                        <iframe src={'https://view.officeapps.live.com/op/embed.aspx?src=' + submissionUrl} width='100%' height='600px' frameBorder='0' />
                                        : <FileViewer
                                            key={Math.random()}
                                            style={{ fontFamily: 'overpass' }}
                                            fileType={submissionType}
                                            filePath={submissionUrl}
                                            errorComponent={<View>
                                                <Text>
                                                    ERROR!!
                                        </Text>
                                            </View>}
                                            onError={(e: any) => console.log(e)} />
                                )
                                :
                                <RichEditor
                                    key={showOriginal.toString() + reloadEditorKey.toString()}
                                    containerStyle={{
                                        height: height,
                                        backgroundColor: '#f4f4f4',
                                        padding: 3,
                                        paddingTop: 5,
                                        paddingBottom: 10,
                                        borderRadius: 10,
                                    }}
                                    ref={RichText}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#f4f4f4',
                                        minHeight: 450,
                                        borderRadius: 10
                                    }}
                                    editorStyle={{
                                        backgroundColor: '#f4f4f4',
                                        placeholderColor: '#a6a2a2',
                                        color: '#101010',
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
                    <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {
                            props.cue.channelId ?
                                <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row' }}>
                                    <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                        <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                                <Ionicons
                                                    name='school-outline' size={20} color={'#a6a2a2'} />
                                            </Text>
                                        </View>
                                        <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                            <View style={{ width: '85%', backgroundColor: 'white' }}>
                                                <View style={styles.colorBar}>
                                                    <TouchableOpacity
                                                        style={styles.allOutline}
                                                        onPress={() => { }}>
                                                        <Text style={{ color: '#fff' }}>
                                                            {props.cue.channelName}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    {
                                        props.cue.channelId !== '' ?
                                            <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                                    <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                                        {
                                                            isOwner ? 'Accept Submission' : 'Submission'
                                                        }
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row' }}>
                                                    {
                                                        isOwner ?
                                                            <View style={{
                                                                backgroundColor: 'white',
                                                                height: 40,
                                                                marginRight: 10
                                                            }}>

                                                                <Switch
                                                                    value={submission}
                                                                    onValueChange={() => {
                                                                        setSubmission(!submission)
                                                                    }}
                                                                    style={{ height: 20 }}
                                                                    trackColor={{
                                                                        false: '#f4f4f4',
                                                                        true: '#a6a2a2'
                                                                    }}
                                                                    activeThumbColor='white'
                                                                />
                                                            </View> : null
                                                    }
                                                    {
                                                        submission ?
                                                            <View style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                backgroundColor: 'white'
                                                            }}>
                                                                <Text style={{
                                                                    fontSize: 12,
                                                                    color: '#a6a2a2',
                                                                    textAlign: 'left',
                                                                    paddingRight: 10
                                                                }}>
                                                                    Due
                                                        </Text>
                                                                {
                                                                    isOwner ? <Datetime
                                                                        value={deadline}
                                                                        onChange={(event: any) => {
                                                                            const date = new Date(event)
                                                                            setDeadline(date)
                                                                        }}
                                                                    /> : <Text style={{
                                                                        fontSize: 12,
                                                                        color: '#a6a2a2',
                                                                        textAlign: 'left'
                                                                    }}>
                                                                        {deadline.toLocaleString()}
                                                                    </Text>
                                                                }
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
                                                    <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                                        Graded
                                                </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row' }}>
                                                    {
                                                        isOwner ? <View style={{
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
                                                                    true: '#a6a2a2'
                                                                }}
                                                                activeThumbColor='white'
                                                            />
                                                        </View>
                                                            : null
                                                    }
                                                    {
                                                        graded ?
                                                            <View style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'row',
                                                                backgroundColor: 'white'
                                                            }}>
                                                                <Text style={{
                                                                    fontSize: 12,
                                                                    color: '#a6a2a2',
                                                                    textAlign: 'left',
                                                                    paddingRight: 10
                                                                }}>
                                                                    Grade Weight {'\n'}(% of overall grade)
                                                        </Text>
                                                                {
                                                                    isOwner ?
                                                                        <TextInput
                                                                            value={gradeWeight}
                                                                            style={styles.picker}
                                                                            placeholder={'0-100'}
                                                                            onChangeText={val => setGradeWeight(val)}
                                                                            placeholderTextColor={'#a6a2a2'}
                                                                        /> :
                                                                        <Text style={{
                                                                            color: '#a6a2a2',
                                                                            textAlign: 'left',
                                                                            fontSize: 12
                                                                        }}>
                                                                            {gradeWeight}
                                                                        </Text>
                                                                }
                                                            </View>
                                                            : null
                                                    }
                                                </View>
                                            </View> : null
                                    }
                                </View>
                                : null
                        }
                        <View style={{ display: 'flex', flexDirection: width < 768 ? 'column' : 'row' }}>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                        Category
                                    </Text>
                                </View>
                                {
                                    props.cue.channelId ?
                                        <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                            <View style={{ width: '85%', backgroundColor: 'white' }}>
                                                <View style={styles.colorBar}>
                                                    <TouchableOpacity
                                                        style={styles.allGrayOutline}
                                                        onPress={() => { }}>
                                                        <Text style={{ color: '#a6a2a2' }}>
                                                            {props.cue.customCategory}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                        : <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
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
                                                                placeholderTextColor={'#a6a2a2'}
                                                            />
                                                        </View> :
                                                        <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                            <TouchableOpacity
                                                                style={customCategory === '' ? styles.allGrayOutline : styles.all}
                                                                onPress={() => {
                                                                    setCustomCategory('')
                                                                }}>
                                                                <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
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
                                                                        <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
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
                                                    <Text style={{ textAlign: 'right', lineHeight: 20, width: '100%' }}>
                                                        <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#a6a2a2'} />
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                }
                            </View>
                            <View style={{ width: width < 768 ? '100%' : '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
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
                    </View>
                    <View style={{ width: '100%', paddingTop: 15, flexDirection: width < 768 ? 'column' : 'row' }}>
                        <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                            <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                    <Ionicons name='notifications-outline' size={20} color={'#a6a2a2'} />
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: 'white',
                                width: '100%',
                                height: 40,
                                marginHorizontal: 10
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
                                        true: '#0079FE'
                                    }}
                                    activeThumbColor='white'
                                />
                            </View>
                        </View>
                        {
                            notify ?
                                <View style={{ width: width < 768 ? '100%' : '33.33%' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                            <Ionicons
                                                name='repeat-outline' size={20} color={'#a6a2a2'} />
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', }}>
                                        <View style={{
                                            backgroundColor: 'white',
                                            height: 40,
                                            marginHorizontal: 10
                                        }}>
                                            <Switch
                                                value={!shuffle}
                                                onValueChange={() => setShuffle(!shuffle)}
                                                style={{ height: 20 }}
                                                trackColor={{
                                                    false: '#f4f4f4',
                                                    true: '#a6a2a2'
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
                                                            fontSize: 18
                                                        }}
                                                        selectedValue={frequency}
                                                        onValueChange={(itemValue: any) =>
                                                            setFrequency(itemValue)
                                                        }>
                                                        {
                                                            timedFrequencyOptions.map((item: any, index: number) => {
                                                                return <Picker.Item
                                                                    color={frequency === item.value ? '#0079FE' : "#101010"}
                                                                    label={item.value === '0' && cue.channelId !== '' ? 'Once' : item.label}
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
                                        <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                            <Ionicons
                                                name='infinite-outline' size={20} color={'#a6a2a2'} />
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{
                                            backgroundColor: 'white',
                                            height: 40,
                                            marginHorizontal: 10
                                        }}>
                                            <Switch
                                                value={playChannelCueIndef}
                                                onValueChange={() => setPlayChannelCueIndef(!playChannelCueIndef)}
                                                style={{ height: 20 }}
                                                trackColor={{
                                                    false: '#f4f4f4',
                                                    true: '#a6a2a2'
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
                                                        onChange={(event: any) => {
                                                            const date = new Date(event)
                                                            setEndPlayAt(date)
                                                        }}
                                                        value={endPlayAt}
                                                    />
                                                </View>
                                        }
                                    </View>
                                </View> : null
                        }
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
                            {
                                isOwner || (!props.cue.channelId || props.cue.channelId === '') ?
                                    <TouchableOpacity
                                        onPress={() => handleDelete()}
                                        style={{ backgroundColor: 'white', borderRadius: 15, }}>
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#0079FE',
                                            borderRadius: 15,
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35
                                        }}>
                                            {
                                                isOwner ? (
                                                    props.cue.channelId && props.cue.channelId !== '' ? 'DELETE FOR EVERYONE' : 'DELETE'
                                                ) : 'DELETE'
                                            }
                                        </Text>
                                    </TouchableOpacity> : null
                            }
                            {
                                !isOwner && (props.cue.channelId && props.cue.channelId !== '') && submission && (currentDate < deadline) ?
                                    <TouchableOpacity
                                        disabled={(props.cue.submittedAt && props.cue.submittedAt !== '') || !userSetupComplete}
                                        onPress={() => handleSubmit()}
                                        style={{ backgroundColor: 'white', borderRadius: 15, }}>
                                        <Text style={{
                                            textAlign: 'center',
                                            lineHeight: 35,
                                            color: 'white',
                                            fontSize: 12,
                                            backgroundColor: '#0079FE',
                                            borderRadius: 15,
                                            paddingHorizontal: 25,
                                            fontFamily: 'inter',
                                            overflow: 'hidden',
                                            height: 35
                                        }}>
                                            {
                                                (
                                                    props.cue.submittedAt && props.cue.submittedAt !== '') || submitted ? 'SUBMITTED' : (
                                                    userSetupComplete ? 'SUBMIT' : 'SIGN UP TO SUBMIT'
                                                )
                                            }
                                        </Text>
                                    </TouchableOpacity> : null
                            }
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>
        </View >
    );
}

export default UpdateControls

const styles: any = StyleSheet.create({
    timePicker: {
        width: 125,
        fontSize: 18,
        height: 45,
        color: '#101010',
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
        borderColor: '#a6a2a2'
    },
    input: {
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: 10,
        fontSize: 12,
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
        backgroundColor: 'white'
    },
    colorBar: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        lineHeight: 20
    },
    shuffleContainer: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'flex-end',
        backgroundColor: 'white',
        paddingTop: 40
    },
    col1: {
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingLeft: 7.5
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
        color: '#a6a2a2',
        textAlign: 'left',
        paddingHorizontal: 10
    },
    all: {
        fontSize: 12,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        lineHeight: 20
    },
    allOutline: {
        fontSize: 12,
        backgroundColor: '#101010',
        height: 22,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    allGrayOutline: {
        fontSize: 12,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a6a2a2',
        lineHeight: 20
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
        borderColor: '#a6a2a2'
    }
})
