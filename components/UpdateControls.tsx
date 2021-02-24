import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, Dimensions, ScrollView, Animated, Alert } from 'react-native';
import { Text, View, TouchableOpacity } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { fetchAPI } from '../graphql/FetchAPI';
import { markAsRead } from '../graphql/QueriesAndMutations';
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

const UpdateControls: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [cue, setCue] = useState(props.cue.cue)
    const [shuffle, setShuffle] = useState(props.cue.shuffle)
    const [starred, setStarred] = useState(props.cue.starred)
    const [color, setColor] = useState(props.cue.color)
    const [notify, setNotify] = useState(props.cue.frequency !== "0" ? true : false)
    const [frequency, setFrequency] = useState(props.cue.frequency)
    const [customCategory, setCustomCategory] = useState(props.cue.customCategory)
    const [customCategories] = useState(props.customCategories)
    const [toolbarModalAnimation] = useState(new Animated.Value(0))
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [markedAsRead, setMarkedAsRead] = useState(false)
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random())
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
    const [keyboardVisible, setKeyboardVisible] = useState(false)
    const [keyboardOffset, setKeyboardOffset] = useState(0)
    const [height, setHeight] = useState(100)
    const [showOriginal, setShowOriginal] = useState(false)
    const colorChoices: any[] = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d'].reverse()


    const handleHeightChange = useCallback((h: any) => {
        setHeight(h)
    }, [])

    const uploadDocument = useCallback(() => {
        DocumentPicker.getDocumentAsync({
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        }).then((doc: any) => {
            if (doc.type && doc.type === "cancel") {
                return
            }
            FileSystem
                .readAsStringAsync(doc.uri, {
                    encoding: FileSystem.EncodingType.Base64
                })
                .then(fileAsBase64 => {
                    const server = fetchAPI('')
                    server.mutate({
                        mutation: convertToHtml,
                        variables: {
                            docx: fileAsBase64
                        }
                    }).then(r => {
                        if (r.data.cue && r.data.cue.convertDocxToHtml && r.data.cue.convertDocxToHtml !== "error") {
                            setCue(r.data.cue.convertDocxToHtml)
                            setReloadEditorKey(Math.random())
                        }
                    }).catch(e => {
                        Alert.alert("Conversion failed.")
                    })
                })
                .catch(err => {
                    Alert.alert("Something went wrong.", "Check connection.")
                })
        })
    }, [setCue, reloadEditorKey])

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
                    Alert.alert("Unable to load image.")
                });
            }).catch((err) => {
                Alert.alert("Something went wrong.")
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
                    Alert.alert("Unable to load image.")
                });
            }).catch((err) => {
                Alert.alert("Something went wrong.")
            })
        }
    }, [RichText, RichText.current])

    useEffect(() => {
        const height = Dimensions.get("window").height
        Keyboard.removeAllListeners("keyboardDidShow")
        Keyboard.removeAllListeners("keyboardWillHide")
        Keyboard.removeAllListeners("keyboardDidHide")
        Keyboard.addListener("keyboardDidShow", e => {
            setKeyboardVisible(true)
            setKeyboardOffset(e.endCoordinates.screenY - (height * 0.1) - 40)
            Animated.timing(toolbarModalAnimation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }).start();
        })
        Keyboard.addListener("keyboardWillHide", e => {
            setKeyboardVisible(false)
            toolbarModalAnimation.setValue(0)
        })
        Keyboard.addListener("keyboardDidHide", e => {
            setKeyboardVisible(false)
            toolbarModalAnimation.setValue(0)
        })
    }, [])

    const handleUpdate = useCallback(async () => {
        if (cue === null || cue.toString().trim() === '') {
            Alert.alert("Enter content.")
            return;
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
        subCues[props.cueKey][props.cueIndex] = {
            _id: props.cue._id,
            cue,
            date: props.cue.date,
            color,
            shuffle,
            frequency,
            starred,
            customCategory,
            // Channel controls
            channelId: props.cue.channelId,
            createdBy: props.cue.createdBy,
            endPlayAt: !playChannelCueIndef ? endPlayAt.toString() : '',
            channelName: props.cue.channelName,
            original: props.cue.original,
            status: 'read'
        }
        const stringifiedCues = JSON.stringify(subCues)
        await AsyncStorage.setItem('cues', stringifiedCues)
    }, [cue, customCategory, shuffle, frequency, starred, color, playChannelCueIndef,
        props.closeModal, props.cueIndex, props.cueKey, props.cue, endPlayAt])

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

    useEffect(() => {
        handleUpdate()
    }, [cue, shuffle, frequency, starred, color, props.cueIndex,
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
        Alert.alert(
            "Clear all?",
            "This action cannot be undone.",
            [
                {
                    text: "Cancel", style: "cancel"
                },
                {
                    text: "Clear", onPress: () => {
                        setCue('')
                        setReloadEditorKey(Math.random())
                    }
                }
            ]
        )
    }, [])

    useEffect(() => {
        updateStatusAsRead()
    }, [props.cue.status])

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            minHeight: '100%',
            paddingBottom: 100,
            paddingHorizontal: 20,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
        }}>
            {
                keyboardVisible && RichText.current !== null ?
                    <Animated.View style={{
                        height: 40,
                        width: '100%',
                        position: 'absolute',
                        zIndex: 5,
                        top: keyboardOffset + props.scrollOffset,
                        opacity: toolbarModalAnimation,
                        borderTopWidth: 1,
                        borderTopColor: '#eeeeee'
                    }}
                    >
                        <RichToolbar
                            style={{
                                justifyContent: 'flex-start',
                                backgroundColor: 'white',
                                height: 40
                            }}
                            editor={RichText}
                            iconTint={"gray"}
                            selectedIconTint={"#101010"}
                            disabledIconTint={"gray"}
                            actions={[
                                actions.undo,
                                actions.redo,
                                actions.setBold,
                                actions.setItalic,
                                actions.setUnderline,
                                actions.insertBulletsList,
                                actions.insertOrderedList,
                                actions.checkboxList,
                                actions.insertLink,
                                actions.insertImage,
                                "insertCamera",
                                "close"
                                // "insertVideo"
                            ]}
                            iconMap={{
                                // ["insertVideo"]: ({ tintColor }) => <Ionicons name='videocam-outline' size={25} color={tintColor} />,
                                ["insertCamera"]: ({ tintColor }) => <Ionicons name='camera-outline' size={25} color={tintColor} />,
                                ["close"]: ({ tintColor }) => <Ionicons name='close-outline' size={25} color={tintColor} />,
                            }}
                            onPressAddImage={galleryCallback}
                            // insertVideo={videoCallback}
                            insertCamera={cameraCallback}
                            close={clearAll}
                        />
                    </Animated.View> : null
            }
            <Animated.View style={{
                width: '100%',
                backgroundColor: 'white',
                opacity: 1,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={styles.date} onTouchStart={() => Keyboard.dismiss()}>
                    <Text style={{
                        width: '50%',
                        color: '#a6a2a2',
                        fontSize: 11,
                        lineHeight: 30
                    }}>
                        {
                            now.toString().split(' ')[1] +
                            ' ' +
                            now.toString().split(' ')[2] +
                            ', ' +
                            now.toString().split(' ')[3]
                        }
                    </Text>
                    <TouchableOpacity
                        onPress={() => setStarred(!starred)}
                        style={{
                            backgroundColor: 'white',
                            width: '50%'
                        }}>
                        <Text style={{
                            textAlign: 'right',
                            lineHeight: 30,
                            marginTop: -35,
                            paddingRight: 25,
                            width: '100%'
                        }}>
                            <Ionicons name='bookmark' size={25} color={starred ? '#f94144' : '#a6a2a2'} />
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={{
                    width: '100%',
                    minHeight: 500,
                    backgroundColor: 'white'
                }}>
                    <RichEditor
                        key={showOriginal.toString() + reloadEditorKey.toString()}
                        disabled={showOriginal}
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
                            contentCSSText: 'font-size: 12px;'
                        }}
                        initialContentHTML={showOriginal ? props.cue.original : cue}
                        onScroll={() => Keyboard.dismiss()}
                        placeholder="Note..."
                        onChange={(text) => setCue(text)}
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
                    <View style={{
                        backgroundColor: 'white',
                        flexDirection: 'row',
                        width: '100%',
                        paddingTop: 10
                    }}>
                        <TouchableOpacity
                            style={{
                                height: 20,
                                backgroundColor: 'white',
                                width: '50%'
                            }}
                            onPress={() => uploadDocument()}
                        >
                            <Text style={{ fontSize: 12, color: '#a6a2a2' }}>
                                Import (.docx)
                    </Text>
                        </TouchableOpacity>
                        {
                            (props.cue.channelId && props.cue.channelId !== '') ? <TouchableOpacity
                                style={{
                                    height: 20,
                                    backgroundColor: 'white',
                                    width: '50%'
                                }}
                                onPress={() => setShowOriginal(!showOriginal)}
                            >
                                {showOriginal ?
                                    <Text style={{ fontSize: 12, color: '#a6a2a2', textAlign: 'right' }}>
                                        View Modifed
                                        </Text>
                                    :
                                    <Text style={{ fontSize: 12, color: '#a6a2a2', textAlign: 'right' }}>
                                        View Original
                                        </Text>
                                }
                            </TouchableOpacity> : null
                        }
                    </View>
                </View>
                <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <View style={{ width: '40%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                        <View style={{ width: '100%', paddingTop: 25, paddingBottom: 15, backgroundColor: 'white' }}>
                            <Text style={{ fontSize: 16, color: '#101010' }}>
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
                    <View style={{ width: '40%', borderRightWidth: 0, borderColor: '#f4f4f4' }}></View>
                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                        <Text style={{ fontSize: 16, color: '#101010' }}>
                            {
                                props.cue.channelId ? 'Channel' : 'Category'
                            }
                        </Text>
                    </View>
                    {
                        props.cue.channelId ?
                            <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                <View style={{ width: '85%', backgroundColor: 'white' }}>
                                    <View style={styles.colorBar}>
                                        <TouchableOpacity
                                            style={styles.allOutlineBlue}
                                            onPress={() => { }}>
                                            <Text style={{ color: '#0079FE' }}>
                                                {props.cue.channelName}
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
                                                    style={styles.allOutline}
                                                    placeholder={'New Category'}
                                                    onChangeText={val => {
                                                        setCustomCategory(val)
                                                    }}
                                                    placeholderTextColor={'#a6a2a2'}
                                                />
                                            </View> :
                                            <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                <TouchableOpacity
                                                    style={customCategory === '' ? styles.allOutline : styles.all}
                                                    onPress={() => {
                                                        setCustomCategory('')
                                                    }}>
                                                    <Text style={{ color: '#a6a2a2' }}>
                                                        None
                                                </Text>
                                                </TouchableOpacity>
                                                {
                                                    customCategories.map((category: string) => {
                                                        return <TouchableOpacity
                                                            key={Math.random()}
                                                            style={customCategory === category ? styles.allOutline : styles.all}
                                                            onPress={() => {
                                                                setCustomCategory(category)
                                                            }}>
                                                            <Text style={{ color: '#a6a2a2' }}>
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
                                        <Text style={{ textAlign: 'right', lineHeight: 45, width: '100%' }}>
                                            <Ionicons name={addCustomCategory ? 'close' : 'add'} size={30} color={'#a6a2a2'} />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                    }
                </View>
                <View style={{ width: '100%', paddingTop: 15, flexDirection: 'row' }}>
                    <View style={{ width: '33.33%' }}>
                        <View style={{ width: '100%', paddingTop: 25, paddingBottom: 15, backgroundColor: 'white' }}>
                            <Text style={{ fontSize: 16, color: '#101010' }}>
                                <Ionicons
                                    name='notifications-outline' size={20} color={'#101010'} />
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: 'white',
                            width: '100%',
                            height: 40
                        }}>
                            <Switch
                                value={notify}
                                onValueChange={() => {
                                    if (notify) {
                                        setShuffle(false)
                                        setFrequency("0")
                                    } else {
                                        setShuffle(true)
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
                            <View style={{ width: '33.33%' }}>
                                <View style={{ width: '100%', paddingTop: 25, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 16, color: '#101010' }}>
                                        <Ionicons
                                            name='shuffle-outline' size={25} color={'#a6a2a2'} />
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', }}>
                                    <View style={{ width: '30%' }}>
                                        <View style={{
                                            backgroundColor: 'white',
                                            width: '100%',
                                            height: 40
                                        }}>
                                            <Switch
                                                value={shuffle}
                                                onValueChange={() => setShuffle(!shuffle)}
                                                style={{ height: 20 }}
                                                trackColor={{
                                                    false: '#f4f4f4',
                                                    true: '#a6a2a2'
                                                }}
                                                activeThumbColor='white'
                                            />
                                        </View>
                                    </View>
                                    <View style={{ width: '70%' }}>
                                        {
                                            !shuffle ?
                                                <View style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    backgroundColor: 'white'
                                                }}>
                                                    <View style={styles.col1} onTouchStart={() => Keyboard.dismiss()}>
                                                        <Text style={styles.text}>
                                                            Remind every
                                                        </Text>
                                                    </View>
                                                    <View style={styles.col2}>
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
                                                                        label={item.value === '0' && channelId !== '' ? 'Once' : item.label}
                                                                        value={item.value}
                                                                        key={index}
                                                                    />
                                                                })
                                                            }
                                                        </Picker>
                                                    </View>
                                                </View> : null
                                        }
                                    </View>
                                </View>
                            </View> : null
                    }
                    {
                        notify ?
                            <View style={{ width: '33.33%' }}>
                                <View style={{ width: '100%', paddingTop: 25, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 16, color: '#101010' }}>
                                        <Ionicons
                                            name='infinite-outline' size={25} color={'#a6a2a2'} />
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ width: '30%' }}>

                                        <View style={{
                                            backgroundColor: 'white',
                                            width: '100%',
                                            height: 40
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
                                    </View>
                                    <View style={{ width: '70%' }}>
                                        {
                                            playChannelCueIndef ? null :
                                                <View style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    backgroundColor: 'white'
                                                }}>
                                                    <View style={styles.col1} onTouchStart={() => Keyboard.dismiss()}>
                                                        <Text style={styles.text}>
                                                            Remind till
                                                            </Text>
                                                    </View>
                                                    <View style={styles.col2}>
                                                        <DateTimePicker
                                                            style={styles.timePicker}
                                                            value={endPlayAt}
                                                            mode={'date'}
                                                            textColor={'#101010'}
                                                            onChange={(event, selectedDate) => {
                                                                const currentDate: any = selectedDate;
                                                                setEndPlayAt(currentDate)
                                                            }}
                                                        />
                                                        <View style={{ height: 10, backgroundColor: 'white' }} />
                                                        <DateTimePicker
                                                            style={styles.timePicker}
                                                            value={endPlayAt}
                                                            mode={'time'}
                                                            textColor={'#101010'}
                                                            onChange={(event, selectedDate) => {
                                                                const currentDate: any = selectedDate;
                                                                setEndPlayAt(currentDate)
                                                            }}
                                                        />
                                                    </View>
                                                </View>
                                        }
                                    </View>
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
                        <TouchableOpacity
                            onPress={() => handleDelete()}
                            style={{ backgroundColor: 'white', borderRadius: 15, }}>
                            <Text style={{
                                textAlign: 'center',
                                lineHeight: 35,
                                color: 'white',
                                fontSize: 14,
                                fontWeight: 'bold',
                                backgroundColor: '#0079FE',
                                borderRadius: 15,
                                paddingHorizontal: 25,
                                fontFamily: 'inter',
                                overflow: 'hidden',
                                height: 35
                            }}>
                                DELETE
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    descriptionInput: {
        width: '100%',
        backgroundColor: '#f4f4f4',
        borderRadius: 15,
        fontSize: 16,
        padding: 20,
        paddingTop: 20,
        paddingBottom: 20,
        marginBottom: '8%',
        color: '#a6a2a2',
    },
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        paddingBottom: 20,
        marginBottom: 25,
        marginTop: 40,
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
        paddingTop: 25
    },
    col1: {
        width: '40%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '60%',
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
        border: 'none',
        width: 100
    },
    text: {
        fontSize: 12,
        color: '#a6a2a2',
        textAlign: 'left',
    },
    all: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 15,
        color: '#a6a2a2',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#a6a2a2'
    },
    allOutlineBlue: {
        fontSize: 15,
        color: '#0079fe',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#0079fe'
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
