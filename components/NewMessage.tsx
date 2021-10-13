import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Switch, TextInput, ScrollView } from 'react-native';
import Alert from '../components/Alert'
import { Text, View, TouchableOpacity } from './Themed';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../graphql/FetchAPI';
import { getThreadCategories, createMessage, sendDirectMessage } from '../graphql/QueriesAndMutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RichEditor } from 'react-native-pell-rich-editor';
// import FileViewer from 'react-file-viewer';
import FileUpload from './UploadFiles';
import { PreferredLanguageText } from '../helpers/LanguageContext';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';


const NewMessage: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [message, setMessage] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [anonymous, setAnonymous] = useState(false)
    const [customCategory, setCustomCategory] = useState('')
    const [categories, setCategories] = useState([])
    let RichText: any = useRef()
    const [addCustomCategory, setAddCustomCategory] = useState(false)
    const [channelId] = useState<any>(props.channelId)
    const [cueId] = useState<any>(props.cueId)          // Null if Channel Thread. Not null if Cue Thread.
    const [parentId] = useState<any>(props.parentId)    //  Null if new Thread. Not null if reply.
    const now = new Date()

    const [imported, setImported] = useState(false)
    const [url, setUrl] = useState('')
    const [type, setType] = useState('')
    const [title, setTitle] = useState('')

    const [showImportOptions, setShowImportOptions] = useState(false)
    const [sendingThread, setSendingThread] = useState(false)

    const unableToPostAlert = PreferredLanguageText('unableToPost');
    const somethingWentWrongAlert = PreferredLanguageText('somethingWentWrong');
    const checkConnectionAlert = PreferredLanguageText('checkConnection');


    useEffect(() => {
        if (message[0] === '{' && message[message.length - 1] === '}') {
            const obj = JSON.parse(message)
            setImported(true)
            setUrl(obj.url)
            setType(obj.type)
        } else {
            setImported(false)
            setUrl('')
            setType('')
            setTitle('')
        }
    }, [message])

    const loadCategories = useCallback(async () => {
        if (channelId === undefined || channelId === null || channelId === '') {
            return;
        }
        const server = fetchAPI('')
        server.query({
            query: getThreadCategories,
            variables: {
                channelId
            }
        })
            .then(res => {
                if (res.data.thread && res.data.thread.getChannelThreadCategories) {
                    setCategories(res.data.thread.getChannelThreadCategories)
                }
            })
            .catch(err => {
            })
    }, [channelId])

    const createDirectMessage = useCallback(async () => {
        setSendingThread(true)
        const u = await AsyncStorage.getItem('user')
        if (!message || message === '' || !u) {
            setSendingThread(false)
            return
        }
        if (message.replace(/\&nbsp;/g, '').replace(/\s/g, '') === '<div></div>') {
            setSendingThread(false)
            return
        }
        const user = JSON.parse(u)
        const users: any[] = props.addUserId ? (
            [user._id, ...props.users]
        ) : props.users
        let saveCue = ''
        if (imported) {
            const obj = {
                type,
                url,
                title
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = message
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: sendDirectMessage,
            variables: {
                users,
                message: saveCue,
                channelId: props.channelId,
                userId: user._id
            }
        }).then(res => {
            setSendingThread(false)
            if (res.data.message.create) {
                props.back()
            } else {
                Alert(unableToPostAlert, checkConnectionAlert)
            }
        }).catch(err => {
            setSendingThread(false)
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })
    }, [props.users, message, props.channelId, imported, type, title, url])

    const createThreadMessage = useCallback(async () => {
        setSendingThread(true)
        if (!message || message === '') {
            setSendingThread(false)
            return
        }
        if (message.replace(/\&nbsp;/g, '').replace(/\s/g, '') === '<div></div>') {
            setSendingThread(false)
            return
        }
        const uString: any = await AsyncStorage.getItem('user')
        const user = JSON.parse(uString)
        let saveCue = ''
        if (imported) {
            const obj = {
                type,
                url,
                title
            }
            saveCue = JSON.stringify(obj)
        } else {
            saveCue = message
        }
        const server = fetchAPI('')
        server.mutate({
            mutation: createMessage,
            variables: {
                message: saveCue,
                userId: user._id,
                channelId,
                isPrivate,
                anonymous,
                cueId: cueId === null ? 'NULL' : cueId,
                parentId: parentId === null ? 'INIT' : parentId,
                category: customCategory
            }
        }).then(res => {
            setSendingThread(false)
            if (res.data.thread.writeMessage) {
                props.back()
            } else {
                Alert(unableToPostAlert, checkConnectionAlert)
            }
        }).catch(err => {
            setSendingThread(false)
            Alert(somethingWentWrongAlert, checkConnectionAlert)
        })

    }, [message, customCategory, isPrivate, anonymous, cueId, channelId, parentId, props.back, imported, type, title, url])

    useEffect(() => {
        if (!props.users) {
            loadCategories()
        }
    }, [props.users]);

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
        }}>
            {
                parentId || props.users ? null :
                    <View style={{ width: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'row', paddingBottom: 15 }}>
                        <TouchableOpacity
                            key={Math.random()}
                            style={{
                                backgroundColor: 'white'
                            }}
                            onPress={() => props.back()}>
                            <Text style={{
                                width: '100%',
                                lineHeight: 23
                            }}>
                                <Ionicons name='arrow-back-outline' size={23} color={'#50566B'} />
                            </Text>
                        </TouchableOpacity>
                    </View>
            }
            <View style={styles.date} onTouchStart={() => Keyboard.dismiss()}>

                {
                    showImportOptions && !imported ? null :
                        <TouchableOpacity
                            onPress={() => {
                                if (imported) {
                                    setMessage('')
                                    setTitle('')
                                    setUrl('')
                                    setType('')
                                }
                                setShowImportOptions(!showImportOptions)
                            }}
                            style={{ alignSelf: 'flex-end', flex: 1 }}
                        >
                            <Text style={{
                                color: '#50566B',
                                fontSize: 11,
                                lineHeight: 35,
                                textAlign: 'right',
                                paddingRight: 10,
                            }}>
                                {
                                    imported ? 'CLEAR' : 'IMPORT'
                                }
                            </Text>
                        </TouchableOpacity>
                }
            </View>
            <View style={{ flexDirection: 'row', paddingVertical: 10 }}>
                {
                    showImportOptions && !imported ?
                        <FileUpload
                            action={'message_send'}
                            back={() => setShowImportOptions(false)}
                            onUpload={(u: any, t: any) => {
                                console.log(t)
                                const obj = { url: u, type: t, title }
                                setMessage(JSON.stringify(obj))
                                setShowImportOptions(false)
                            }}
                        /> : null
                }
            </View>
            {
                imported ?
                    <View style={{ backgroundColor: 'white', flex: 1 }}>
                        <View style={{ width: '40%', alignSelf: 'flex-start', marginLeft: '10%' }}>
                            <TextInput
                                value={title}
                                style={styles.input}
                                placeholder={'Title'}
                                onChangeText={val => setTitle(val)}
                                placeholderTextColor={'#50566B'}
                            />
                        </View>
                        <View>
                            <Text style={{ width: '100%', color: '#50566B', fontSize: 20, paddingVertical: 50, marginLeft: '10%', paddingHorizontal: 5, fontFamily: 'inter', flex: 1 }}>
                                <Ionicons name='document-outline' size={50} color='#50566B' />
                            </Text>
                        </View>
                    </View>
                    : <View style={{
                        width: '100%',
                        minHeight: 100,
                        maxWidth: 500,
                        backgroundColor: 'white',
                        paddingBottom: 5
                    }}>
                        <RichEditor
                            disabled={false}
                            containerStyle={{
                                backgroundColor: '#f7fafc',
                                borderRadius: 15,
                                padding: 3,
                                paddingTop: 5,
                                paddingBottom: 10,
                                minHeight: 100
                            }}
                            ref={RichText}
                            style={{
                                width: '100%',
                                backgroundColor: '#f7fafc',
                                borderRadius: 15,
                                minHeight: 100
                            }}
                            editorStyle={{
                                backgroundColor: '#f7fafc',
                                placeholderColor: '#50566B',
                                color: '#1A2036',
                                contentCSSText: 'font-size: 13px;'
                            }}
                            initialContentHTML={props.message}
                            onScroll={() => Keyboard.dismiss()}
                            placeholder={props.placeholder}
                            onChange={(text) => {
                                const modifedText = text.split('&amp;').join('&')
                                setMessage(modifedText)
                            }}
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
            }
            {
                props.users ? null :
                    <View>
                        {
                            !cueId && !parentId ?
                                <View style={{ width: '33.33%', backgroundColor: 'white' }}>
                                    <View style={{ width: '100%', paddingTop: 40, paddingBottom: 10, backgroundColor: 'white' }}>
                                        <Text style={{ fontSize: 11, color: '#1A2036', textTransform: 'uppercase' }}>
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
                                                            style={styles.allOutline}
                                                            placeholder={'Enter Category'}
                                                            onChangeText={val => {
                                                                setCustomCategory(val)
                                                            }}
                                                            placeholderTextColor={'#50566B'}
                                                        />
                                                    </View> :
                                                    <Menu
                                                        onSelect={(cat: any) => setCustomCategory(cat)}>
                                                        <MenuTrigger>
                                                            <Text style={{ fontFamily: 'inter', fontSize: 14, color: '#50566B' }}>
                                                                {customCategory === '' ? 'None' : customCategory}<Ionicons name='chevron-down-outline' size={15} />
                                                            </Text>
                                                        </MenuTrigger>
                                                        <MenuOptions customStyles={{
                                                            optionsContainer: {
                                                                padding: 10,
                                                                borderRadius: 15,
                                                                shadowOpacity: 0,
                                                                borderWidth: 1,
                                                                borderColor: '#E3E8EE',
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
                                                                categories.map((category: any) => {
                                                                    return <MenuOption
                                                                        value={category}>
                                                                        <Text>
                                                                            {category}
                                                                        </Text>
                                                                    </MenuOption>
                                                                })
                                                            }
                                                        </MenuOptions>
                                                    </Menu>}
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
                                                    <Ionicons name={addCustomCategory ? 'close' : 'add'} size={15} color={'#50566B'} />
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                                : null
                        }
                        <View style={{ flexDirection: 'row' }}>
                            {/* <View style={{ width: '33.33%', backgroundColor: 'white' }}>
                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 10, backgroundColor: 'white' }}>
                                    <Text style={{ fontSize: 11, color: '#50566B', textTransform: 'uppercase' }}>
                                        {PreferredLanguageText('anonymous')}
                                    </Text>
                                </View>
                                <Switch
                                    value={anonymous}
                                    onValueChange={() => setAnonymous(!anonymous)}
                                    trackColor={{
                                        false: '#f7fafc',
                                        true: '#50566B'
                                    }}
                                    activeThumbColor='white'
                                    style={{ height: 20 }}
                                />
                            </View> */}
                            {
                                parentId ? null :
                                    (
                                        parentId ? null :
                                            <View style={{ width: '33.33%', backgroundColor: 'white' }}>
                                                <View style={{ width: '100%', paddingTop: 40, paddingBottom: 10, backgroundColor: 'white' }}>
                                                    <Text style={{ fontSize: 11, color: '#1A2036', textTransform: 'uppercase' }}>
                                                        {PreferredLanguageText('private')}
                                                    </Text>
                                                </View>
                                                <Switch
                                                    value={isPrivate}
                                                    onValueChange={() => setIsPrivate(!isPrivate)}
                                                    trackColor={{
                                                        false: '#f7fafc',
                                                        true: '#50566B'
                                                    }}
                                                    activeThumbColor='white'
                                                    style={{ height: 20 }}
                                                />
                                            </View>
                                    )
                            }
                        </View>
                    </View>
            }
            <View style={styles.footer}>
                <View
                    style={{
                        flex: 1,
                        maxWidth: 500,
                        backgroundColor: 'white',
                        justifyContent: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        height: 50,
                        paddingTop: 10,
                    }}>
                    <TouchableOpacity
                        onPress={() => {
                            if (props.users) {
                                createDirectMessage()
                            } else {
                                createThreadMessage()
                            }
                        }}
                        disabled={sendingThread}
                        style={{
                            borderRadius: 15,
                            backgroundColor: 'white'
                        }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: 'white',
                            fontSize: 12,
                            backgroundColor: '#5469D4',
                            borderRadius: 15,
                            paddingHorizontal: 20,
                            overflow: 'hidden',
                            fontFamily: 'inter',
                            height: 35,
                            textTransform: 'uppercase'
                        }}>
                            {props.users ? PreferredLanguageText('send') : (parentId ? PreferredLanguageText('reply') : PreferredLanguageText('post'))} <Ionicons name='chatbubbles-outline' size={12} />
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View >
    );
}

export default NewMessage

const styles: any = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: 'white'
    },
    footer: {
        width: '100%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        marginTop: 80,
        lineHeight: 18,
        marginBottom: 25
    },
    date: {
        width: '100%',
        display: 'flex',
        maxWidth: 500,
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
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingRight: 7.5
    },
    col2: {
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingLeft: 7.5
    },
    text: {
        fontSize: 12,
        color: '#50566B',
        textAlign: 'left'
    },
    input: {
        width: '100%',
        borderBottomColor: '#f7fafc',
        borderBottomWidth: 1,
        fontSize: 12,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    },
    all: {
        fontSize: 12,
        color: '#50566B',
        height: 20,
        paddingHorizontal: 10,
        backgroundColor: 'white'
    },
    allOutline: {
        fontSize: 12,
        color: '#50566B',
        height: 22,
        paddingHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#50566B'
    },
    outline: {
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#50566B'
    }
})
