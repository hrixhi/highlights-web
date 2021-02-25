import React, { useCallback, useEffect, useState, useRef, createRef } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, ScrollView, Animated, Dimensions, Alert } from 'react-native';
import { Text, View, TouchableOpacity } from '../components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timedFrequencyOptions } from '../helpers/FrequencyOptions';
import { fetchAPI } from '../graphql/FetchAPI';
import { createCue, getChannelCategories, getChannels } from '../graphql/QueriesAndMutations';
import Datetime from 'react-datetime';
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
    const [toolbarModalAnimation] = useState(new Animated.Value(0))
    const now = new Date()
    const [reloadEditorKey, setReloadEditorKey] = useState(Math.random())
    let RichText: any = useRef()
    const [keyboardVisible, setKeyboardVisible] = useState(false)
    const [scrollOffset, setScrollOffset] = useState(0)
    const [keyboardOffset, setKeyboardOffset] = useState(0)
    const [height, setHeight] = useState(100)
    const [init, setInit] = useState(false)

    const loadChannelCategories = useCallback(async () => {

        if (channelId === '') {
            setCustomCategories(localCustomCategories)
            return
        }

        const server = fetchAPI('')
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
    }, [channelId, localCustomCategories])

    useEffect(() => {
        loadChannelCategories()
    }, [channelId])

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
                        } else {
                            Alert.alert("Conversion failed.")
                        }
                    }).catch(e => {
                        Alert.alert("Something went wrong.", "Check connection.")
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
                    // setReloadEditorKey(Math.random())
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

    const loadChannels = useCallback(async () => {
        // const draft = await AsyncStorage.getItem('cueDraft')
        // if (draft) {
        //     setCue(draft)
        // }
        const uString: any = await AsyncStorage.getItem('user')
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

    const handleCreate = useCallback(async () => {

        if (cue === null || cue.toString().trim() === '') {
            Alert.alert("Enter content.")
            return
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
                cue,
                date: new Date(),
                color,
                shuffle,
                frequency,
                starred,
                customCategory,
                endPlayAt: !playChannelCueIndef ? endPlayAt.toString() : ''
            })
            const stringifiedCues = JSON.stringify(subCues)
            await AsyncStorage.setItem('cues', stringifiedCues)
            storeDraft('cueDraft', '')
            Animated.timing(modalAnimation, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            }).start(() => props.closeModal())
        } else {
            // CHANNEL CUE
            const uString = await AsyncStorage.getItem('user')
            if (!uString) {
                return
            }
            const user = JSON.parse(uString)
            const server = fetchAPI('')
            server.mutate({
                mutation: createCue,
                variables: {
                    cue,
                    starred,
                    color: color.toString(),
                    channelId,
                    frequency,
                    customCategory,
                    shuffle,
                    createdBy: user._id,
                    endPlayAt: !playChannelCueIndef ? endPlayAt.toISOString() : ''
                }
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
                    Alert.alert("Something went wrong.", "Check connection.")
                })
        }

    }, [cue, modalAnimation, customCategory, shuffle, frequency, starred, color,
        props.closeModal, channelId, endPlayAt, playChannelCueIndef])

    useEffect(() => {
        const getData = async () => {
            try {
                const h = await AsyncStorage.getItem('cueDraft')
                console.log(h)
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
        Animated.timing(modalAnimation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
        }).start();
    }, [])

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
                opacity: modalAnimation,
                height: '100%'
            }}>
                <Text style={{ width: '100%', textAlign: 'center', height: 15, paddingBottom: 30 }}>
                    {/* <Ionicons name='chevron-down' size={20} color={'#e0e0e0'} /> */}
                </Text>
                <View style={styles.date} onTouchStart={() => Keyboard.dismiss()}>
                    <Text style={{
                        // width: '10%',
                        paddingRight: 15,
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
                    <View>
                        <RichToolbar
                            style={{
                                flexWrap: 'wrap',
                                backgroundColor: 'white',
                                height: 28,
                                // width: 'auto',
                            }}
                            iconSize={15}
                            editor={RichText}
                            disabled={false}
                            iconTint={"gray"}
                            selectedIconTint={"#101010"}
                            disabledIconTint={"gray"}
                            actions={[
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
                                // ["insertVideo"]: ({ tintColor }) => <Ionicons name='videocam-outline' size={25} color={tintColor} />,
                                ["insertCamera"]: ({ tintColor }) => <Ionicons name='camera-outline' size={18} color={tintColor} />,
                                ["close"]: ({ tintColor }) => <Ionicons name='close-outline' size={18} color={tintColor} />,
                            }}
                            onPressAddImage={galleryCallback}
                            // insertVideo={videoCallback}
                            insertCamera={cameraCallback}
                            close={clearAll}
                        />
                    </View>
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
                            <Ionicons name='bookmark' size={25} color={starred ? '#f94144' : '#a6a2a2'} />
                        </Text>
                    </TouchableOpacity>
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
                    <View style={{
                        width: '100%',
                        minHeight: 500,
                        backgroundColor: 'white'
                    }}>
                        <RichEditor
                            key={reloadEditorKey.toString()}
                            containerStyle={{
                                height,
                                backgroundColor: '#f4f4f4',
                                padding: 3,
                                paddingTop: 5,
                                paddingBottom: 10,
                                borderRadius: 10
                            }}
                            ref={RichText}
                            style={{
                                width: '100%',
                                backgroundColor: '#f4f4f4',
                                borderRadius: 10,
                                minHeight: 450
                            }}
                            editorStyle={{
                                backgroundColor: '#f4f4f4',
                                placeholderColor: '#a6a2a2',
                                color: '#101010',
                                contentCSSText: 'font-size: 13px;'
                            }}
                            initialContentHTML={cue}
                            onScroll={() => Keyboard.dismiss()}
                            placeholder="Note..."
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
                        </View>
                    </View>
                    <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <View style={{ display: 'flex', flexDirection: 'row' }}>
                            <View style={{ width: '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 14, color: '#101010' }}>
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
                            {channels.length !== 0 ?
                                <View style={{ width: '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 14, color: '#101010' }}>
                                            Share
                                </Text>
                                    </View>
                                    <View style={{ width: '100%', display: 'flex', flexDirection: 'row', backgroundColor: 'white' }}>
                                        <View style={{ width: '85%', backgroundColor: 'white' }}>
                                            <ScrollView style={styles.colorBar} horizontal={true} showsHorizontalScrollIndicator={false}>
                                                <TouchableOpacity
                                                    style={channelId === '' ? styles.allOutlineBlue : styles.all}
                                                    onPress={() => {
                                                        setChannelId('')
                                                        setCustomCategories(localCustomCategories)
                                                        setCustomCategory('')
                                                        setAddCustomCategory(false)
                                                    }}>
                                                    <Text style={{ color: '#0079fe', lineHeight: 20 }}>
                                                        None
                                            </Text>
                                                </TouchableOpacity>
                                                {
                                                    channels.map((channel) => {
                                                        return <TouchableOpacity
                                                            key={Math.random()}
                                                            style={channelId === channel._id ? styles.allOutlineBlue : styles.all}
                                                            onPress={() => {
                                                                setChannelId(channel._id)
                                                                setAddCustomCategory(false)
                                                                setCustomCategory('')
                                                            }}>
                                                            <Text style={{ color: '#0079FE', lineHeight: 20 }}>
                                                                {channel.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    })
                                                }
                                            </ScrollView>
                                        </View>
                                    </View>
                                </View> : null}
                            <View style={{ width: '33.33%', borderRightWidth: 0, borderColor: '#f4f4f4' }}>
                                <View style={{ width: '100%', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 15, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 14, color: '#101010' }}>
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
                                                            <Text style={{ color: '#a6a2a2', lineHeight: 20 }}>
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
                                                <Text style={{ textAlign: 'center', lineHeight: 20, width: '100%' }}>
                                                    <Ionicons name={addCustomCategory ? 'close' : 'add'} size={20} color={'#a6a2a2'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={{ width: '100%', paddingTop: 15, flexDirection: 'row' }}>
                            <View style={{ width: '33.33%' }}>
                                <View style={{ width: '100%', paddingTop: 25, paddingBottom: 15, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 15, color: '#a6a2a2' }}>
                                        <Ionicons name='notifications-outline' size={20} color={'#101010'} />   <Ionicons name='logo-apple' size={15} color={'#a6a2a2'} />/<Ionicons name='logo-android' size={15} color={'#a6a2a2'} />
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
                                            <Text style={{ fontSize: 14, color: '#101010' }}>
                                                <Ionicons
                                                    name='shuffle-outline' size={25} color={'#a6a2a2'} />
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', }}>
                                            <View style={{
                                                backgroundColor: 'white',
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
                                                                        label={item.value === '0' && channelId !== '' ? 'Once' : item.label}
                                                                        value={item.value}
                                                                        key={index}
                                                                    />
                                                                })
                                                            }
                                                        </Picker>
                                                    </View> : null
                                            }
                                        </View>
                                    </View> : null
                            }
                            {
                                notify ?
                                    <View style={{ width: '33.33%' }}>
                                        <View style={{ width: '100%', paddingTop: 25, paddingBottom: 15, backgroundColor: 'white' }}>
                                            <Text style={{ fontSize: 14, color: '#101010' }}>
                                                <Ionicons
                                                    name='infinite-outline' size={25} color={'#a6a2a2'} />
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <View style={{
                                                backgroundColor: 'white',
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
                                onPress={() => handleCreate()}
                                style={{
                                    borderRadius: 15,
                                    backgroundColor: 'white'
                                }}>
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
                                    {channelId === '' ? 'CREATE' : 'SHARE'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>
        </View >
    );
}

export default Create

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
        width: 100,
        marginTop: -20
    },
    text: {
        fontSize: 12,
        color: '#a6a2a2',
        textAlign: 'left',
        paddingHorizontal: 10
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
